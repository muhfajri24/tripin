"""Bounded insertion planner. Estimates are explicit; no global-optimum claims."""

from datetime import datetime, timedelta, timezone
from math import radians, sin, cos, sqrt, atan2, ceil
import re
from uuid import uuid4
from app.models.contracts import (
    Itinerary,
    ScheduledStop,
    StopLock,
    TravelLeg,
    Evidence,
    LedgerItem,
    Violation,
    ReplanResult,
    StopChange,
    BeforeAfter,
    ReplanState,
    DayProgress,
    ReportedClosure,
)

TZ = timezone(timedelta(hours=7))
EST = Evidence(
    sourceType="curated",
    sourceRef="Haversine straight-line distance; 1.4 detour factor, 25 km/h and 5 minute buffer; not road routing or traffic",
    checkedAt=None,
    status="estimated",
)
USER = Evidence(
    sourceType="user",
    sourceRef="User planning estimate, not a quoted price",
    checkedAt=None,
    status="estimated",
)
UNKNOWN = Evidence(
    sourceType="curated", sourceRef=None, checkedAt=None, status="unverified"
)


class Conflict(Exception):
    pass


def at(day, clock):
    return datetime.fromisoformat(day + "T" + clock + ":00+07:00")


def scope(c, destination_id="yogyakarta"):
    if c is None:
        return False
    if destination_id == "yogyakarta":
        return -8.3 <= c.lat <= -7.3 and 110.0 <= c.lng <= 110.9
    match = re.fullmatch(r"osm-(-?\d+)_(-?\d+)", destination_id)
    if not match:
        return False
    center_lat, center_lng = int(match[1]) / 100000, int(match[2]) / 100000
    if not (-11.5 <= center_lat <= 6.5 and 94 <= center_lng <= 142):
        return False
    delta_lat = radians(center_lat - c.lat)
    delta_lng = radians(center_lng - c.lng)
    haversine = (
        sin(delta_lat / 2) ** 2
        + cos(radians(c.lat)) * cos(radians(center_lat)) * sin(delta_lng / 2) ** 2
    )
    distance = 6371000 * 2 * atan2(sqrt(haversine), sqrt(max(0, 1 - haversine)))
    return distance <= 30000


def travel(a, b, from_id, to_id):
    la1, la2 = radians(a.lat), radians(b.lat)
    dl = radians(b.lat - a.lat)
    dn = radians(b.lng - a.lng)
    h = sin(dl / 2) ** 2 + cos(la1) * cos(la2) * sin(dn / 2) ** 2
    meters = round(6371000 * 2 * atan2(sqrt(h), sqrt(max(0, 1 - h))))
    return TravelLeg(
        fromId=from_id,
        toId=to_id,
        mode="driving",
        distanceMeters=meters,
        estimatedDurationMin=ceil(meters * 1.4 / 25000 * 60),
        schedulingBufferMin=5 if meters else 0,
        source="haversine",
        evidence=EST,
    )


def visit_price(p, req):
    price = p.prices[0]
    if price.basis not in {"person", "group"}:
        raise Conflict("Basis harga kunjungan tidak didukung: " + p.id)
    amount = price.amountIdr
    ev = price.evidence
    if (
        amount is None
        and p.kind == "food"
        and req.costAssumptions.foodPersonIdr is not None
    ):
        return req.costAssumptions.foodPersonIdr, req.travelers.adults, USER
    return amount, req.travelers.adults if price.basis == "person" else 1, ev


def ledger_for(req, stops, places, lodging):
    ledger = []
    for stop in stops:
        p = places[stop.placeId]
        amount, quantity, ev = visit_price(p, req)
        ledger.append(
            LedgerItem(
                id="visit-" + stop.id,
                category="food" if p.kind == "food" else "ticket",
                placeId=p.id,
                quantity=quantity,
                unitAmountIdr=amount,
                totalIdr=None if amount is None else amount * quantity,
                evidence=ev,
            )
        )
    if lodging:
        price = lodging.prices[0]
        if price.basis != "room_night":
            raise Conflict("Harga hotel harus per kamar per malam")
        amount = (
            price.amountIdr
            if price.amountIdr is not None
            else req.costAssumptions.lodgingRoomNightIdr
        )
        quantity = req.lodging.rooms * req.lodging.nights
        ledger.append(
            LedgerItem(
                id="lodging",
                category="lodging",
                placeId=lodging.id,
                quantity=quantity,
                unitAmountIdr=amount,
                totalIdr=None if amount is None else amount * quantity,
                evidence=price.evidence
                if price.amountIdr is not None
                else USER
                if amount is not None
                else UNKNOWN,
            )
        )
    amount = req.costAssumptions.vehicleDayIdr
    ledger.append(
        LedgerItem(
            id="vehicle",
            category="transport",
            placeId=None,
            quantity=req.days,
            unitAmountIdr=amount,
            totalIdr=None if amount is None else amount * req.days,
            evidence=USER if amount is not None else UNKNOWN,
        )
    )
    return ledger


def schedule(
    req, repo, orders, frozen=None, previous=None, disruption=None, locks=None
):
    frozen = frozen or {}
    locks = locks or {}
    state = previous.replanState.model_copy(deep=True) if previous else ReplanState()
    if disruption:
        key = disruption.effectiveAt.date().isoformat()
        prior_progress = next((p for p in state.progress if p.date == key), None)
        if prior_progress and disruption.effectiveAt < prior_progress.notBefore:
            raise Conflict(
                "Waktu efektif lebih awal dari progress/delay yang sudah diterapkan"
            )
        earliest = disruption.effectiveAt
        if disruption.disruption.type == "delay":
            earliest += timedelta(minutes=disruption.disruption.minutes)
        if earliest.date().isoformat() != key:
            raise Conflict(
                "Delay melewati tanggal efektif; ubah rencana hari berikutnya secara eksplisit"
            )
        state.progress = [p for p in state.progress if p.date != key] + [
            DayProgress(
                date=key, notBefore=earliest, location=disruption.currentLocation
            )
        ]
        if disruption.disruption.type == "closure":
            closure = ReportedClosure(
                placeId=disruption.disruption.placeId, date=disruption.disruption.date
            )
            if closure not in state.closures:
                state.closures.append(closure)
    places = {p.id: p for p in repo.list_places(req.destinationId)}
    lodging = places.get(req.lodging.placeId) if req.lodging else None
    if req.lodging and (
        not lodging
        or lodging.kind != "lodging"
        or not scope(lodging.coordinates, req.destinationId)
    ):
        raise Conflict("Hotel belum memiliki koordinat valid dalam wilayah tujuan")
    if not scope(req.arrivalAnchor, req.destinationId) or not scope(
        req.departureAnchor, req.destinationId
    ):
        raise Conflict("Titik awal atau akhir di luar wilayah tujuan")
    old = {s.placeId: s for d in previous.days for s in d.stops} if previous else {}
    days = []
    uncertainties = []
    all_stops = []
    for i, w in enumerate(req.dayWindows):
        start = req.arrivalAnchor if i == 0 else lodging.coordinates
        end = req.departureAnchor if i == req.days - 1 else lodging.coordinates
        now = at(w.date, w.start)
        deadline = at(w.date, w.end)
        if i == 0 and req.lodging and req.lodging.checkInAt:
            deadline = min(deadline, req.lodging.checkInAt)
        stops = list(frozen.get(i, []))
        pos = start
        last = "start-" + str(i)
        if stops:
            now = stops[-1].departureAt
            pos = places[stops[-1].placeId].coordinates
            last = stops[-1].placeId
        progress = next((p for p in state.progress if p.date == w.date), None)
        if progress and progress.notBefore >= now:
            now = progress.notBefore
            pos = progress.location
            last = "current-location"
        if len(orders[i]) + len(stops) > 6:
            raise Conflict("Maksimal enam aktivitas per hari")
        for pid in orders[i]:
            p = places.get(pid)
            if (
                not p
                or p.kind == "lodging"
                or not scope(p.coordinates, req.destinationId)
            ):
                raise Conflict("Kandidat tidak dapat dijadwalkan: " + pid)
            if any(e.date == w.date and e.closed for e in p.dateExceptions):
                raise Conflict("Tempat tutup pada tanggal ini: " + p.name)
            if any(c.placeId == pid and c.date == w.date for c in state.closures):
                raise Conflict("Penutupan dilaporkan: " + p.name)
            leg = travel(pos, p.coordinates, last, p.id)
            arrival = now + timedelta(
                minutes=leg.estimatedDurationMin + leg.schedulingBufferMin
            )
            prior = old.get(pid)
            lock = locks.get(
                pid, prior.lock if prior else StopLock(type="none", arrivalAt=None)
            )
            if lock.type == "place_day" and prior and prior.dayIndex != i:
                raise Conflict("Hari aktivitas dikunci: " + p.name)
            if lock.type == "place_time":
                if (
                    lock.arrivalAt.date().isoformat() != w.date
                    or arrival > lock.arrivalAt
                ):
                    raise Conflict(
                        "Waktu aktivitas terkunci tidak terjangkau: " + p.name
                    )
                arrival = lock.arrivalAt
            if p.openingWindows is None:
                if not req.allowUnverifiedData:
                    raise Conflict("Jam buka belum diketahui: " + p.name)
                uncertainties.append("Jam buka belum terverifikasi: " + p.name)
            else:
                windows = [
                    x for x in p.openingWindows if x.weekday == arrival.weekday()
                ]
                match = None
                for window in sorted(windows, key=lambda x: x.opens):
                    candidate = max(arrival, at(w.date, window.opens))
                    if lock.type == "place_time" and candidate != arrival:
                        continue
                    if candidate + timedelta(minutes=p.visitDurationMin) <= at(
                        w.date, window.closes
                    ):
                        match = candidate
                        break
                if match is None:
                    raise Conflict("Tidak muat dalam jam buka: " + p.name)
                arrival = match
            amount, _, _ = visit_price(p, req)
            if amount is None and not req.allowUnverifiedData:
                raise Conflict("Harga belum diketahui: " + p.name)
            if p.durationEvidence.status != "checked":
                uncertainties.append("Durasi kunjungan merupakan estimasi: " + p.name)
            stop = ScheduledStop(
                id=prior.id if prior else "stop-" + p.id,
                placeId=p.id,
                dayIndex=i,
                arrivalAt=arrival,
                departureAt=arrival + timedelta(minutes=p.visitDurationMin),
                visitDurationMin=p.visitDurationMin,
                incomingLeg=leg,
                status=prior.status if prior else "planned",
                lock=lock,
                selectionReasons=[
                    "MANDATORY"
                    if pid in req.mustVisitPlaceIds
                    else "PREFERENCE_AND_FEASIBLE_INSERTION"
                ],
            )
            stops.append(stop)
            now = stop.departureAt
            pos = p.coordinates
            last = pid
        final = travel(pos, end, last, "end-" + str(i))
        if (
            now
            + timedelta(minutes=final.estimatedDurationMin + final.schedulingBufferMin)
            > deadline
        ):
            raise Conflict(
                "Perjalanan pulang/check-in melewati batas hari " + str(i + 1)
            )
        days.append(
            dict(
                date=w.date,
                startAnchor=start,
                endAnchor=end,
                stops=stops,
                finalLeg=final,
            )
        )
        all_stops += stops
    if len({s.placeId for s in all_stops}) != len(all_stops):
        raise Conflict("Kunjungan duplikat")
    ledger = ledger_for(req, all_stops, places, lodging)
    # Preserve the planning allocation for elapsed/completed visits, not actual spending.
    if previous:
        frozen_ledger_ids = {
            "visit-" + s.id for group in frozen.values() for s in group
        }
        prior_ledger = {x.id: x for x in previous.ledger}
        ledger = [
            prior_ledger[x.id].model_copy(deep=True)
            if x.id in frozen_ledger_ids and x.id in prior_ledger
            else x
            for x in ledger
        ]
    known = sum(x.totalIdr or 0 for x in ledger)
    unknown = sum(x.totalIdr is None for x in ledger)
    if known > req.budget.totalIdr - req.budget.reserveIdr:
        raise Conflict("Biaya diketahui melebihi budget setelah cadangan")
    if unknown and not req.allowUnverifiedData:
        raise Conflict(
            "Biaya belum lengkap; lengkapi estimasi atau izinkan data belum terverifikasi"
        )
    if unknown:
        uncertainties.append(
            f"{unknown} komponen biaya belum diketahui; total bukan biaya lengkap"
        )
    uncertainties.append(
        "Jarak garis lurus dan waktu driving heuristic, bukan rute jalan atau lalu lintas aktual"
    )
    if lodging:
        uncertainties.append(
            "Ketersediaan kamar dan ketentuan check-in hotel harus dikonfirmasi; tanpa booking"
        )
    used = {s.placeId for s in all_stops} | ({lodging.id} if lodging else set())
    legs = [s.incomingLeg for s in all_stops] + [d["finalLeg"] for d in days]
    return dict(
        schemaVersion=1,
        id=previous.id if previous else str(uuid4()),
        revision=previous.revision + 1 if previous else 1,
        request=req,
        datasetVersion=repo.version_for(req.destinationId)
        if hasattr(repo, "version_for")
        else repo.version,
        plannerVersion="insertion-v1",
        replanState=state,
        places=[places[x] for x in sorted(used)],
        days=days,
        ledger=ledger,
        totals=dict(
            knownCostIdr=known,
            unknownCostItems=unknown,
            travelMin=sum(leg.estimatedDurationMin for leg in legs),
            distanceMeters=sum(leg.distanceMeters for leg in legs),
        ),
        feasibility="undetermined",
        searchOutcome="plan_found",
        violations=[],
        uncertainties=list(dict.fromkeys(uncertainties)),
    )


def validate_schedule(itinerary, repo):
    """Independent known-constraint pass; never trusts a client feasibility flag."""
    errors = []
    seen = set()
    req = itinerary.request
    lodging = repo.get_place(req.lodging.placeId) if req.lodging else None
    if req.lodging and (
        not lodging
        or lodging.kind != "lodging"
        or not scope(lodging.coordinates, req.destinationId)
    ):
        return ["LODGING_ANCHOR"]
    if not scope(req.arrivalAnchor, req.destinationId) or not scope(
        req.departureAnchor, req.destinationId
    ):
        errors.append("ANCHOR_SCOPE")
    for i, day in enumerate(itinerary.days):
        expected_start = req.arrivalAnchor if i == 0 else lodging.coordinates
        expected_end = req.departureAnchor if i == req.days - 1 else lodging.coordinates
        if day.startAnchor != expected_start or day.endAnchor != expected_end:
            errors.append("ANCHOR_MISMATCH")
        cursor = at(day.date, req.dayWindows[i].start)
        pos = expected_start
        last = "start-" + str(i)
        progress = next(
            (p for p in itinerary.replanState.progress if p.date == day.date), None
        )
        progress_used = False
        for stop in day.stops:
            p = repo.get_place(stop.placeId)
            if (
                progress
                and not progress_used
                and stop.status != "completed"
                and stop.arrivalAt >= progress.notBefore
                and cursor <= progress.notBefore
            ):
                cursor = progress.notBefore
                pos = progress.location
                last = "current-location"
                progress_used = True
            if not p or not scope(p.coordinates, req.destinationId):
                errors.append("PLACE_UNAVAILABLE")
                continue
            expected_leg = travel(pos, p.coordinates, last, p.id)
            if stop.incomingLeg != expected_leg:
                errors.append("TRAVEL_LEG")
            if stop.placeId in req.excludedPlaceIds:
                errors.append("EXCLUDED_PLACE")
            if any(e.date == day.date and e.closed for e in p.dateExceptions) or any(
                c.placeId == p.id and c.date == day.date
                for c in itinerary.replanState.closures
            ):
                errors.append("CLOSURE")
            if stop.lock.type == "place_time" and stop.arrivalAt != stop.lock.arrivalAt:
                errors.append("LOCK_TIME")
            if stop.placeId in seen:
                errors.append("DUPLICATE")
            seen.add(stop.placeId)
            if stop.arrivalAt < cursor + timedelta(
                minutes=stop.incomingLeg.estimatedDurationMin
                + stop.incomingLeg.schedulingBufferMin
            ):
                errors.append("OVERLAP_OR_TRAVEL")
            if (
                p
                and p.openingWindows is not None
                and not any(
                    w.weekday == stop.arrivalAt.weekday()
                    and at(day.date, w.opens) <= stop.arrivalAt
                    and stop.departureAt <= at(day.date, w.closes)
                    for w in p.openingWindows
                )
            ):
                errors.append("OPENING_WINDOW")
            if stop.visitDurationMin != p.visitDurationMin:
                errors.append("VISIT_DURATION")
            cursor = stop.departureAt
            pos = p.coordinates
            last = p.id
        if progress and not progress_used and cursor <= progress.notBefore:
            cursor = progress.notBefore
            pos = progress.location
            last = "current-location"
        if day.finalLeg != travel(pos, expected_end, last, "end-" + str(i)):
            errors.append("FINAL_LEG")
        end = (
            cursor
            + timedelta(
                minutes=day.finalLeg.estimatedDurationMin
                + day.finalLeg.schedulingBufferMin
            )
            if day.finalLeg
            else cursor
        )
        deadline = at(day.date, req.dayWindows[i].end)
        if i == 0 and req.lodging and req.lodging.checkInAt:
            deadline = min(deadline, req.lodging.checkInAt)
        if end > deadline:
            errors.append("DAY_END")
    if not set(req.mustVisitPlaceIds) <= seen:
        errors.append("MISSING_MANDATORY")
    if itinerary.totals.knownCostIdr > req.budget.totalIdr - req.budget.reserveIdr:
        errors.append("BUDGET")
    stops = [s for day in itinerary.days for s in day.stops]
    places = {p.id: p for p in repo.list_places(req.destinationId)}
    try:
        expected = {x.id: x for x in ledger_for(req, stops, places, lodging)}
        actual = {x.id: x for x in itinerary.ledger}
        if set(expected) != set(actual) or len(actual) != len(itinerary.ledger):
            errors.append("LEDGER_ENTRIES")
        frozen = {
            "visit-" + s.id
            for s in stops
            if s.status == "completed"
            or any(
                p.date == itinerary.days[s.dayIndex].date and s.arrivalAt < p.notBefore
                for p in itinerary.replanState.progress
            )
        }
        for key in expected.keys() & actual.keys():
            item, wanted = actual[key], expected[key]
            if key not in frozen:
                if item != wanted:
                    errors.append("LEDGER_PRICE")
            else:
                # Historical user estimates are allocations, not receipts. Known catalog
                # tariffs and ledger identity must still not be forged to bypass budget.
                place = places[wanted.placeId]
                price = place.prices[0]
                if (
                    item.placeId != wanted.placeId
                    or item.category != wanted.category
                    or (
                        price.amountIdr is not None
                        and item.unitAmountIdr != price.amountIdr
                    )
                    or (price.basis == "group" and item.quantity != 1)
                    or (price.basis == "person" and not 1 <= item.quantity <= 6)
                ):
                    errors.append("LEDGER_PRICE")
    except (Conflict, KeyError):
        errors.append("LEDGER_BASIS")
    if itinerary.totals.knownCostIdr != sum(
        x.totalIdr or 0 for x in itinerary.ledger
    ) or itinerary.totals.unknownCostItems != sum(
        x.totalIdr is None for x in itinerary.ledger
    ):
        errors.append("LEDGER_TOTALS")
    return errors


def generate(req, repo, previous=None, disruption=None, selection=None, locks=None):
    frozen = {}
    orders = [[] for _ in range(req.days)]
    locks = locks or {}
    old = [s for d in previous.days for s in d.stops] if previous else []
    if disruption:
        for s in old:
            if s.status == "completed" or s.arrivalAt < disruption.effectiveAt:
                frozen.setdefault(s.dayIndex, []).append(s)
    frozen_ids = {s.placeId for group in frozen.values() for s in group}
    required = list(
        dict.fromkeys(
            req.mustVisitPlaceIds
            + [s.placeId for s in old if locks.get(s.placeId, s.lock).type != "none"]
        )
    )
    try:
        result = schedule(req, repo, orders, frozen, previous, disruption, locks)
    except Conflict as exc:
        return None, [str(exc)]
    if disruption and disruption.disruption.type == "edit":
        if not selection:
            return None, ["Pilih setidaknya satu aktivitas untuk itinerary."]
        mapping = {s.placeId: s.dayIndex for s in old}
        for pid in selection or []:
            if pid not in frozen_ids:
                orders[mapping.get(pid, 0)].append(pid)
        try:
            result = schedule(req, repo, orders, frozen, previous, disruption, locks)
            itinerary = Itinerary.model_validate(result)
            errors = validate_schedule(itinerary, repo)
            return (None, errors) if errors else (itinerary, [])
        except Conflict as exc:
            return None, [str(exc)]
    candidates = repo.list_places(req.destinationId)
    candidates = [
        p
        for p in candidates
        if p.kind != "lodging"
        and scope(p.coordinates, req.destinationId)
        and p.id not in req.excludedPlaceIds
    ]

    def score(p):
        relevance = 10 * len(set(p.categories) & set(req.interests))
        price, _, _ = visit_price(p, req)
        if req.objective == "budget":
            # Unknown is uncertainty, not a free ticket.
            return (
                price is None,
                -(
                    relevance
                    + (2 if p.isLocalBusiness is True else 0)
                    - (price or 0) / 10000
                ),
                p.id,
            )
        if req.objective == "travel_time":
            direct = travel(req.arrivalAnchor, p.coordinates, "start", p.id)
            return (direct.estimatedDurationMin, -relevance, p.id)
        return (-relevance, p.id)

    invalid_prices = []
    valid_candidates = []
    for p in candidates:
        try:
            visit_price(p, req)
            valid_candidates.append(p)
        except Conflict as exc:
            if p.id in required:
                return None, [str(exc)]
            invalid_prices.append(str(exc))
    candidates = sorted(valid_candidates, key=score)
    pending = [repo.get_place(x) for x in required if x not in frozen_ids]
    if any(x is None for x in pending):
        return None, ["Mandatory place tidak ditemukan"]
    pending += (
        [
            p
            for p in candidates
            if p.id not in required
            and p.id not in frozen_ids
            and (selection is None or p.id in selection)
        ]
        if selection is None
        else [
            repo.get_place(pid)
            for pid in selection
            if pid not in required and pid not in frozen_ids
        ]
    )
    used = set(frozen_ids)
    failures = invalid_prices
    for p in pending:
        if not p:
            continue
        if p.id in used:
            continue
        best = None
        reason = "Tidak ada penyisipan feasible"
        for i in range(req.days):
            if len(orders[i]) + len(frozen.get(i, [])) >= 4:
                continue
            for position in range(len(orders[i]) + 1):
                trial = [list(x) for x in orders]
                trial[i].insert(position, p.id)
                try:
                    value = schedule(
                        req, repo, trial, frozen, previous, disruption, locks
                    )
                    # Fit period preference, then balance day density; distance is a soft objective.
                    stop = next(
                        s
                        for d in value["days"]
                        for s in d["stops"]
                        if s.placeId == p.id
                    )
                    period = (
                        "morning"
                        if stop.arrivalAt.hour < 12
                        else "afternoon"
                        if stop.arrivalAt.hour < 17
                        else "evening"
                    )
                    fit = sum(
                        bool(set(pref.categories) & set(p.categories))
                        for pref in req.periodPreferences
                        if pref.period == period
                    )
                    metric = (
                        -fit,
                        len(orders[i]),
                        value["totals"]["travelMin"],
                        i,
                        position,
                    )
                    if best is None or metric < best[0]:
                        best = (metric, trial, value)
                except Conflict as exc:
                    reason = str(exc)
        if best:
            _, orders, result = best
            used.add(p.id)
        elif p.id in required:
            return None, [reason]
        else:
            failures.append(p.name + ": " + reason)
    if not any(d["stops"] for d in result["days"]):
        return None, [
            "Tidak ada kandidat sesuai data dan constraint. " + "; ".join(failures[:3])
        ]
    result["uncertainties"] += failures[:6]
    itinerary = Itinerary.model_validate(result)
    errors = validate_schedule(itinerary, repo)
    if errors:
        return None, errors
    return itinerary, []


def replan(payload, repo):
    original = payload.itinerary
    change = payload.disruption
    req = original.request.model_copy(deep=True)
    old = [s for d in original.days for s in d.stops]
    selection = [s.placeId for s in old]
    locks = {}
    protected = {
        s.id
        for s in old
        if s.status == "completed"
        or s.arrivalAt < payload.effectiveAt
        or s.lock.type != "none"
        or s.placeId in req.mustVisitPlaceIds
    }
    reason = None
    current_version = (
        repo.version_for(original.request.destinationId)
        if hasattr(repo, "version_for")
        else repo.version
    )
    if original.datasetVersion != current_version:
        reason = (
            "Versi katalog berubah; buat rencana baru agar sumber data tidak tercampur"
        )
    elif any(repo.get_place(place.id) != place for place in original.places):
        reason = (
            "Isi katalog berubah sejak itinerary disimpan meskipun label versinya sama; "
            "buat rencana baru dan periksa kembali harga, jam, dan sumber data"
        )
    elif validate_schedule(original, repo):
        reason = "Snapshot itinerary tidak lolos validasi constraint independen"
    if change.type in {"remove", "replace"}:
        target = next((s for s in old if s.id == change.stopId), None)
        if not target:
            reason = "Stop tidak ditemukan"
        elif target.id in protected:
            reason = "Aktivitas completed, mandatory, atau terkunci tidak dapat dihapus/diganti"
        else:
            selection.remove(target.placeId)
            if change.type == "replace":
                selection.insert(0, change.placeId)
    elif change.type == "edit":
        selection = change.selectedPlaceIds
        locks = change.locks
        if change.request:
            req = change.request
            if (
                req.startDate != original.request.startDate
                or req.days != original.request.days
            ):
                reason = "Edit durasi/tanggal trip memerlukan rencana baru"
        for s in old:
            if s.id in protected and s.placeId not in selection:
                reason = "Aktivitas yang dilindungi harus tetap dipertahankan"
    elif change.type == "closure":
        if req.lodging and change.placeId == req.lodging.placeId:
            reason = "Lodging anchor ditutup; pilih penginapan lain secara eksplisit"
        if any(
            s.placeId == change.placeId
            and s.id in protected
            and original.days[s.dayIndex].date == change.date
            for s in old
        ):
            reason = "Tempat mandatory/terkunci ditutup; perlu keputusan pengguna"
    revised = None
    errors = []
    if not reason:
        revised, errors = generate(req, repo, original, payload, selection, locks)
    if reason:
        errors = [reason]
    violations = [
        Violation(code="DISRUPTION_CONFLICT", dayIndex=None, stopIds=[], message=x)
        for x in errors
    ]
    # Demonstrate conflicts in unchanged sequence under the disruption as well.
    if not violations and change.type in {"delay", "closure"}:
        try:
            schedule(
                req,
                repo,
                [
                    [
                        s.placeId
                        for s in d.stops
                        if s.arrivalAt >= payload.effectiveAt
                        and s.status != "completed"
                    ]
                    for d in original.days
                ],
                {
                    i: [
                        s
                        for s in d.stops
                        if s.arrivalAt < payload.effectiveAt or s.status == "completed"
                    ]
                    for i, d in enumerate(original.days)
                },
                original,
                payload,
            )
        except Conflict as exc:
            violations = [
                Violation(
                    code="DISRUPTION_CONFLICT",
                    dayIndex=None,
                    stopIds=[],
                    message=str(exc),
                )
            ]
    changes = []
    if revised:
        new = {s.id: s for d in revised.days for s in d.stops}
        for s in old:
            other = new.get(s.id)
            action = (
                "removed"
                if other is None
                else "moved"
                if other.arrivalAt != s.arrivalAt or other.dayIndex != s.dayIndex
                else "retained"
            )
            changes.append(
                StopChange(
                    stopId=s.id,
                    action=action,
                    reasonCode="REPLAN_" + action.upper(),
                    explanation={
                        "removed": "Tidak muat atau tidak tersedia setelah perubahan; optional stop dilepas.",
                        "moved": "Waktu dihitung ulang dengan perjalanan dan jam buka.",
                        "retained": "Aktivitas tetap dipertahankan.",
                    }[action],
                )
            )
        for sid in new.keys() - {s.id for s in old}:
            changes.append(
                StopChange(
                    stopId=sid,
                    action="replaced",
                    reasonCode="USER_SELECTION",
                    explanation="Kandidat baru dipilih pengguna dan divalidasi backend.",
                )
            )
    return ReplanResult(
        status="repaired"
        if revised
        else "needs_user_decision"
        if reason or any(s.lock.type != "none" for s in old)
        else "no_plan_found",
        revised=revised,
        disruptedOriginalViolations=violations,
        changes=changes,
        beforeAfter=BeforeAfter(
            costDeltaIdr=None
            if not revised
            or original.totals.unknownCostItems
            or revised.totals.unknownCostItems
            else revised.totals.knownCostIdr - original.totals.knownCostIdr,
            travelDeltaMin=0
            if not revised
            else revised.totals.travelMin - original.totals.travelMin,
            removedOptionalStops=sum(c.action == "removed" for c in changes),
        ),
    )
