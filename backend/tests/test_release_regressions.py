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
