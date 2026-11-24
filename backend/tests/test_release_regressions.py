import pytest
from test_planner import Repo, request, payload
from app.domain.planner import generate, replan
from app.models import Itinerary


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
