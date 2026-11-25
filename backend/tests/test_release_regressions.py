import pytest
from test_planner import Repo, request, payload
from app.domain.planner import generate, replan
from app.models import Itinerary


@pytest.mark.parametrize("field", ["price", "hours", "evidence", "missing"])
def test_same_version_catalog_change_requires_new_plan(field):
    repo = Repo()
    generated, _ = generate(request(), repo)
    original = Itinerary.model_validate_json(generated.model_dump_json())
    saved = original.model_dump_json()
    target = next(p for p in repo.items if p.id == original.days[0].stops[0].placeId)
    if field == "price":
        target.prices[0].amountIdr += 1000
    elif field == "hours":
        target.openingWindows[0].closes = "15:00"
    elif field == "evidence":
        target.openingEvidence.sourceRef = "https://example.com/revised-source"
    else:
        repo.items = [p for p in repo.items if p.id != target.id]
    result = replan(payload(original, {"type": "delay", "minutes": 30}), repo)
    assert result.status == "needs_user_decision"
    assert result.revised is None
    assert any(
        "Isi katalog berubah" in v.message for v in result.disruptedOriginalViolations
    )
    assert original.model_dump_json() == saved


def test_acknowledged_delay_survives_next_edit():
    repo = Repo()
    original, _ = generate(request(), repo)
    delayed = replan(payload(original, {"type": "delay", "minutes": 120}), repo).revised
    edited = replan(
        payload(
            delayed,
            {
                "type": "edit",
                "selectedPlaceIds": [s.placeId for d in delayed.days for s in d.stops],
                "locks": {},
            },
        ),
        repo,
    )
    assert (
        edited.revised is None
        or edited.revised.days[0].stops[0].arrivalAt
        >= delayed.days[0].stops[0].arrivalAt
    )


def test_reported_closure_survives_next_edit():
    repo = Repo()
    original, _ = generate(request(), repo)
    closed = original.days[0].stops[0].placeId
    repaired = replan(
        payload(
            original,
            {"type": "closure", "placeId": closed, "date": original.request.startDate},
        ),
        repo,
    ).revised
    result = replan(
        payload(
            repaired,
            {
                "type": "edit",
                "selectedPlaceIds": [s.placeId for d in repaired.days for s in d.stops]
                + [closed],
                "locks": {},
            },
        ),
        repo,
    )
    assert result.revised is None or all(
        s.placeId != closed for s in result.revised.days[0].stops
    )


def test_delay_roundtrip_allows_edit_at_acknowledged_time():
    repo = Repo()
    original, _ = generate(request(), repo)
    delayed = replan(payload(original, {"type": "delay", "minutes": 120}), repo).revised
    delayed = Itinerary.model_validate_json(delayed.model_dump_json())
    edit = payload(
        delayed,
        {
            "type": "edit",
            "selectedPlaceIds": [s.placeId for d in delayed.days for s in d.stops],
            "locks": {},
        },
    )
    edit.effectiveAt = delayed.replanState.progress[0].notBefore
    result = replan(edit, repo)
    assert result.revised
    assert (
        result.revised.days[0].stops[0].arrivalAt
        >= delayed.replanState.progress[0].notBefore
    )


def test_closure_roundtrip_rejects_readding_at_valid_effective_time():
    repo = Repo()
    original, _ = generate(request(), repo)
    closed = original.days[0].stops[0].placeId
    repaired = replan(
        payload(
            original,
            {"type": "closure", "placeId": closed, "date": original.request.startDate},
        ),
        repo,
    ).revised
    repaired = Itinerary.model_validate_json(repaired.model_dump_json())
    edit = payload(
        repaired,
        {
            "type": "edit",
            "selectedPlaceIds": [s.placeId for d in repaired.days for s in d.stops]
            + [closed],
            "locks": {},
        },
    )
    edit.effectiveAt = repaired.replanState.progress[0].notBefore
    result = replan(edit, repo)
    assert result.revised is None
    assert any(
        "Penutupan dilaporkan" in v.message for v in result.disruptedOriginalViolations
    )


def test_completed_stop_cost_is_not_repriced_by_new_party_size():
    repo = Repo()
    original, _ = generate(request(), repo)
    first = original.days[0].stops[0]
    first.status = "completed"
    prior = next(x for x in original.ledger if x.id == "visit-" + first.id)
    changed = original.request.model_copy(deep=True)
    changed.travelers.adults += 1
    edit = payload(
        original,
        {
            "type": "edit",
            "selectedPlaceIds": [s.placeId for d in original.days for s in d.stops],
            "request": changed.model_dump(mode="json"),
            "locks": {},
        },
    )
    edit.effectiveAt = first.departureAt
    edit.currentLocation = repo.get_place(first.placeId).coordinates
    result = replan(edit, repo)
    assert result.revised
    assert next(x for x in result.revised.ledger if x.id == prior.id) == prior


def test_independent_validator_rejects_forged_travel_leg():
    from datetime import timedelta
    from app.domain.planner import validate_schedule

    repo = Repo()
    original, _ = generate(request(), repo)
    stop = original.days[0].stops[0]
    stop.incomingLeg.estimatedDurationMin = 0
    stop.incomingLeg.schedulingBufferMin = 0
    stop.arrivalAt = stop.arrivalAt.replace(hour=8, minute=0)
    stop.departureAt = stop.arrivalAt + timedelta(minutes=stop.visitDurationMin)
    assert "TRAVEL_LEG" in validate_schedule(original, repo)


@pytest.mark.parametrize("minutes", [30, 60, 120])
def test_delay_variants_pass_independent_validation(minutes):
    from app.domain.planner import validate_schedule

    repo = Repo()
    original, _ = generate(request(), repo)
    result = replan(payload(original, {"type": "delay", "minutes": minutes}), repo)
    assert result.revised
    assert not validate_schedule(result.revised, repo)


def test_catalog_change_requires_explicit_new_plan():
    repo = Repo()
    original, _ = generate(request(), repo)
    repo.version = "changed-v2"
    result = replan(payload(original, {"type": "delay", "minutes": 30}), repo)
    assert result.revised is None
    assert "katalog" in result.disruptedOriginalViolations[0].message


def test_validator_detects_missing_visit_ledger_entry():
    from app.domain.planner import validate_schedule

    trip, _ = generate(request(), Repo())
    trip.ledger = [
        x for x in trip.ledger if x.id != "visit-" + trip.days[0].stops[0].id
    ]
    trip.totals.knownCostIdr = sum(x.totalIdr or 0 for x in trip.ledger)
    assert "LEDGER_ENTRIES" in validate_schedule(trip, Repo())


def test_validator_rejects_underpriced_known_ticket():
    from app.domain.planner import validate_schedule

    trip, _ = generate(request(), Repo())
    item = next(x for x in trip.ledger if x.category == "ticket")
    item.unitAmountIdr = 0
    item.totalIdr = 0
    trip.totals.knownCostIdr = sum(x.totalIdr or 0 for x in trip.ledger)
    assert "LEDGER_PRICE" in validate_schedule(trip, Repo())


def test_validator_rejects_changed_final_anchor():
    from app.domain.planner import validate_schedule, travel

    trip, _ = generate(request(), Repo())
    day = trip.days[0]
    last = day.stops[-1]
    origin = Repo().get_place(last.placeId).coordinates
    day.endAnchor = origin.model_copy(update={"lng": origin.lng + 0.002})
    day.finalLeg = travel(origin, day.endAnchor, last.placeId, "end-0")
    assert "ANCHOR_MISMATCH" in validate_schedule(trip, Repo())


def test_bad_optional_price_basis_does_not_crash_plan():
    repo = Repo()
    repo.items[-2].prices[0].basis = "room_night"
    trip, errors = generate(request(), repo)
    assert trip and not errors
    assert repo.items[-2].id not in [s.placeId for d in trip.days for s in d.stops]
    assert any("Basis harga" in u for u in trip.uncertainties)


def test_bad_mandatory_price_basis_returns_conflict_not_exception():
    repo = Repo()
    repo.items[0].prices[0].basis = "room_night"
    req = request()
    req.mustVisitPlaceIds = [repo.items[0].id]
    trip, errors = generate(req, repo)
    assert trip is None and any("Basis harga" in error for error in errors)
