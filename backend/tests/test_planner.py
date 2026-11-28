import json
from copy import deepcopy
from pathlib import Path
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app.models import Place, TravelRequest, ReplanRequest
from app.models.contracts import StopLock
from app.domain.parser import parse_brief
from app.domain.planner import generate, replan, validate_schedule
from app.repositories.places import LocalPlaceRepository
from app.main import create_app
from app.config import Settings

ROOT = Path(__file__).resolve().parents[2]


def request(days=1):
    p = json.loads(
        (ROOT / f"contracts/fixtures/valid/trip-{days}-day.json").read_text()
    )
    if days > 1:
        p["lodging"]["placeId"] = "hotel"
    p["costAssumptions"] = {
        "vehicleDayIdr": 10000,
        "foodPersonIdr": 20000,
        "lodgingRoomNightIdr": 100000,
    }
    return TravelRequest.model_validate(p)


class Repo:
    version = "test-v1"

    def __init__(self):
        raw = json.loads(
            (ROOT / "contracts/fixtures/valid/unknown-place.json").read_text()
        )
        raw.update(
            coordinates={"lat": -7.8, "lng": 110.36},
            openingWindows=[
                {"weekday": i, "opens": "08:00", "closes": "16:00"} for i in range(7)
            ],
        )
        raw["prices"][0]["amountIdr"] = 10000
        self.items = []
        for i in range(8):
            p = deepcopy(raw)
            p.update(
                id=f"place-{i}",
                name=f"Place {i}",
                kind="food" if i == 0 else "attraction",
                categories=["food"] if i == 0 else ["culture"],
            )
            p["coordinates"]["lng"] += i * 0.001
            self.items.append(Place.model_validate(p))
        p = deepcopy(raw)
        p.update(id="hotel", kind="lodging", name="Synthetic lodging")
        p["prices"][0].update(amountIdr=100000, basis="room_night")
        self.items.append(Place.model_validate(p))

    def list_places(self, *args, **kwargs):
        return deepcopy(self.items)

    def get_place(self, id):
        return next((p.model_copy(deep=True) for p in self.items if p.id == id), None)


def test_parser():
    r = parse_brief(
        "Saya ingin liburan 2 hari di Yogyakarta, 2 orang, pagi kulineran, siang wisata budaya, budget Rp500.000 per orang, mobil"
    )
    assert r["draft"]["budgetAmountIdr"] == 500000
    assert r["draft"]["budgetBasis"] == "person"
    assert r["draft"]["days"] == 2
    assert r["draft"]["adults"] == 2
    assert "lodging" in r["missingFields"]


@pytest.mark.parametrize(
    "amount,result", [("1,5 juta", 1500000), ("500rb", 500000), ("500.000", 500000)]
)
def test_budget_parsing(amount, result):
    assert (
        parse_brief("budget Rp" + amount + " total")["draft"]["budgetAmountIdr"]
        == result
    )


def test_unsupported():
    parsed = parse_brief("2 hari Bali")
    assert parsed["draft"]["destinationName"] == "Bali"
    assert not parsed["draft"]["unsupportedDestination"]


def test_dashboard_brief_only_requests_missing_trip_fields():
    parsed = parse_brief("Saya mau ke Banyuwangi 3 hari")
    assert parsed["draft"]["destinationName"] == "Banyuwangi"
    assert parsed["draft"]["days"] == 3
    assert parsed["draft"]["interests"] == []
    assert {"interests", "companionId", "budgetAmountIdr"}.issubset(
        parsed["missingFields"]
    )


@pytest.mark.parametrize("city", ["Purwakarta", "Surabaya", "Purwokerto"])
def test_dashboard_brief_with_comma_keeps_city_and_days(city):
    parsed = parse_brief(f"saya mau ke {city}, 2 hari")
    assert parsed["draft"]["destinationName"] == city
    assert parsed["draft"]["days"] == 2
    assert {"interests", "companionId", "budgetAmountIdr"}.issubset(parsed["missingFields"])


def test_dashboard_brief_keeps_all_supplied_preferences():
    parsed = parse_brief(
        "Ke Semarang 2 hari bersama pasangan, kuliner dan budaya, "
        "budget Rp2 juta total, pilih yang terdekat"
    )
    draft = parsed["draft"]
    assert draft["destinationName"] == "Semarang"
    assert draft["days"] == 2 and draft["adults"] == 2
    assert draft["companionId"] == "couple"
    assert draft["interests"] == ["food", "culture"]
    assert draft["budgetAmountIdr"] == 2_000_000
    assert draft["budgetBasis"] == "group"
    assert draft["objective"] == "travel_time"


def test_alternative_plan_respects_recent_exclusions_and_requested_category():
    repo = Repo()
    req = request().model_copy(update={"interests": ["culture"]})
    first, errors = generate(req, repo)
    assert first and not errors
    previous_ids = [stop.placeId for day in first.days for stop in day.stops]
    alternative, errors = generate(
        req.model_copy(update={"excludedPlaceIds": previous_ids}), repo
    )
    assert alternative and not errors
    alternative_ids = [stop.placeId for day in alternative.days for stop in day.stops]
    assert not set(previous_ids) & set(alternative_ids)
    assert all("culture" in repo.get_place(pid).categories for pid in alternative_ids)


def test_budget_mode_can_schedule_more_affordable_stops_than_nearest_mode():
    repo = Repo()
    nearby = request().model_copy(update={"interests": ["culture"], "objective": "travel_time"})
    affordable = nearby.model_copy(update={"objective": "budget"})
    near_trip, near_errors = generate(nearby, repo)
    budget_trip, budget_errors = generate(affordable, repo)
    assert near_trip and not near_errors
    assert budget_trip and not budget_errors
    assert len(near_trip.days[0].stops) <= 4
    assert len(budget_trip.days[0].stops) > len(near_trip.days[0].stops)
    assert budget_trip.totals.knownCostIdr <= affordable.budget.totalIdr


@pytest.mark.parametrize("days", [1, 2, 3])
def test_planning(days):
    repo = Repo()
    p, errors = generate(request(days), repo)
    assert p and not errors
    assert not validate_schedule(p, repo)
    ids = [s.placeId for d in p.days for s in d.stops]
    assert len(ids) == len(set(ids))
    assert p.totals.knownCostIdr == sum(x.totalIdr for x in p.ledger)
    assert generate(request(days), repo)[0].id != p.id
    if days > 1:
        assert next(x for x in p.ledger if x.id == "lodging").totalIdr == 100000 * (
            days - 1
        )


def test_budget_selection():
    req = request()
    req.budget.totalIdr = 30000
    req.budget.reserveIdr = 0
    p, _ = generate(req, Repo())
    assert p and p.totals.knownCostIdr <= 30000
    assert sum(len(d.stops) for d in p.days) == 1


def test_unknown_price_not_free():
    repo = Repo()
    repo.items[0].prices[0].amountIdr = None
    req = request()
    req.costAssumptions.foodPersonIdr = None
    req.mustVisitPlaceIds = ["place-0"]
    p, _ = generate(req, repo)
    assert p.totals.unknownCostItems == 1 and p.feasibility == "undetermined"
    req.allowUnverifiedData = False
    assert generate(req, repo)[0] is None


def test_opening_and_mandatory():
    repo = Repo()
    repo.items[0].openingWindows = []
    req = request()
    req.mustVisitPlaceIds = ["place-0"]
    assert generate(req, repo)[0] is None


def test_scope_and_missing_place():
    req = request()
    req.arrivalAnchor.lat = 0
    assert generate(req, Repo())[0] is None
    req = request()
    req.mustVisitPlaceIds = ["missing"]
    assert generate(req, Repo())[0] is None


def payload(p, change):
    return ReplanRequest(
        itinerary=p,
        expectedRevision=p.revision,
        effectiveAt=p.days[0].stops[0].arrivalAt - timedelta(minutes=30),
        currentLocation=p.request.arrivalAnchor,
        disruption=change,
    )


def test_delay_and_closure():
    repo = Repo()
    p, _ = generate(request(), repo)
    r = replan(payload(p, {"type": "delay", "minutes": 120}), repo)
    assert r.revised and r.revised.revision == 2
    assert not validate_schedule(r.revised, repo)
    r = replan(
        payload(
            p,
            {
                "type": "closure",
                "placeId": p.days[0].stops[0].placeId,
                "date": p.days[0].date,
            },
        ),
        repo,
    )
    assert r.revised
    assert p.days[0].stops[0].placeId not in [
        s.placeId for d in r.revised.days for s in d.stops
    ]


def test_lock_and_completed():
    repo = Repo()
    p, _ = generate(request(), repo)
    first = p.days[0].stops[0]
    first.lock = StopLock(type="place_time", arrivalAt=first.arrivalAt)
    r = replan(
        payload(
            p, {"type": "closure", "placeId": first.placeId, "date": p.days[0].date}
        ),
        repo,
    )
    assert r.status == "needs_user_decision" and r.revised is None
    first.lock = StopLock(type="none", arrivalAt=None)
    first.status = "completed"
    b = payload(p, {"type": "delay", "minutes": 120})
    b.effectiveAt = first.departureAt
    b.currentLocation = repo.get_place(first.placeId).coordinates
    r = replan(b, repo)
    assert r.revised
    assert r.revised.days[0].stops[0] == first


def test_remove_and_replace():
    repo = Repo()
    p, _ = generate(request(), repo)
    stop = p.days[0].stops[0]
    r = replan(payload(p, {"type": "remove", "stopId": stop.id}), repo)
    assert r.revised and stop.placeId not in [
        s.placeId for d in r.revised.days for s in d.stops
    ]
    r = replan(
        payload(p, {"type": "replace", "stopId": stop.id, "placeId": "place-7"}), repo
    )
    assert r.revised and "place-7" in [
        s.placeId for d in r.revised.days for s in d.stops
    ]


def test_api_local_repository():
    wrapped = create_app(Settings(_env_file=None))
    client = TestClient(wrapped)
    places = client.get("/api/v1/places").json()
    assert len(places["places"]) == 9
    assert client.get("/api/v1/places?destinationId=bali").status_code == 422
    assert client.get("/api/v1/places/missing").status_code == 404
    assert (
        client.post(
            "/api/v1/requests/parse", json={"text": "Yogyakarta 1 hari"}
        ).status_code
        == 200
    )
    response = client.post(
        "/api/v1/itineraries/plan", json={"request": request().model_dump(mode="json")}
    )
    assert response.status_code == 200, response.text
    p = response.json()["itinerary"]
    assert p and p["totals"]["unknownCostItems"] > 0
    assert (
        client.post(
            "/api/v1/itineraries/plan", json={"request": {"destinationId": "bali"}}
        ).status_code
        == 422
    )


def test_repository_filters_and_evidence():
    repo = LocalPlaceRepository()
    assert repo.list_lodging("yogyakarta")
    assert not repo.list_places("bali")
    assert (
        repo.get_place_evidence("yog-sonobudoyo")["openingEvidence"]["status"]
        == "checked"
    )
    p = repo.get_place("yog-sonobudoyo")
    p.name = "mutation"
    assert repo.get_place(p.id).name != "mutation"


def test_unknown_hours_strict_mode():
    repo = Repo()
    repo.items[0].openingWindows = None
    req = request()
    req.mustVisitPlaceIds = ["place-0"]
    req.allowUnverifiedData = False
    assert generate(req, repo)[0] is None


def test_no_plan_for_tiny_window_or_fixed_lodging_budget():
    req = request()
    req.dayWindows[0].end = "08:15"
    assert generate(req, Repo())[0] is None
    req = request(2)
    req.budget.totalIdr = 50000
    req.budget.reserveIdr = 0
    assert generate(req, Repo())[0] is None


def test_delay_respects_fixed_lock():
    repo = Repo()
    p, _ = generate(request(), repo)
    first = p.days[0].stops[0]
    first.lock = StopLock(type="place_time", arrivalAt=first.arrivalAt)
    r = replan(payload(p, {"type": "delay", "minutes": 120}), repo)
    assert r.revised is None and r.status == "needs_user_decision"


def test_lodging_closure_requires_user_decision():
    repo = Repo()
    p, _ = generate(request(2), repo)
    r = replan(
        payload(
            p, {"type": "closure", "placeId": "hotel", "date": p.request.startDate}
        ),
        repo,
    )
    assert r.status == "needs_user_decision" and r.revised is None


def test_edit_add_order_and_budget():
    repo = Repo()
    p, _ = generate(request(), repo)
    selected = [s.placeId for d in p.days for s in d.stops]
    selected = selected[:2][::-1] + ["place-7"]
    r = replan(
        payload(p, {"type": "edit", "selectedPlaceIds": selected, "locks": {}}), repo
    )
    assert r.revised
    assert [s.placeId for s in r.revised.days[0].stops] == selected
    assert not validate_schedule(r.revised, repo)


def test_independent_validator_detects_overlap():
    repo = Repo()
    p, _ = generate(request(), repo)
    p.days[0].stops[1].arrivalAt = p.days[0].stops[0].arrivalAt
    assert "OVERLAP_OR_TRAVEL" in validate_schedule(p, repo)


def test_revision_conflict_http():
    wrapped = create_app(Settings(_env_file=None))
    wrapped.app.state.places = Repo()
    client = TestClient(wrapped)
    p, _ = generate(request(), Repo())
    body = payload(p, {"type": "delay", "minutes": 120}).model_dump(mode="json")
    body["expectedRevision"] = 99
    r = client.post("/api/v1/itineraries/replan", json=body)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "REVISION_CONFLICT"


def test_supabase_requires_explicit_configuration():
    with pytest.raises(ValueError, match="Supabase URL"):
        create_app(Settings(place_source="supabase", _env_file=None))


@pytest.mark.parametrize(
    "text", ["budget Rp... juta", "budget Rp1,2,3 juta", "budget Rp" + "9" * 200]
)
def test_malformed_money_needs_review_not_server_error(text):
    result = parse_brief(text)
    assert "budgetAmountIdr" not in result["draft"]


def test_periods_do_not_leak_into_each_other():
    result = parse_brief("pagi kuliner siang budaya sore santai")
    assert result["draft"]["periodPreferences"][0]["categories"] == ["food"]
