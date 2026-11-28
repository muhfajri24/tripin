import json
from pathlib import Path

from app.domain.planner import generate
from app.models import TravelRequest
from app.repositories.places import LocalPlaceRepository


ROOT = Path(__file__).resolve().parents[2]


def test_food_is_scheduled_as_a_meal_and_sightseeing_leaves_lunch_gap():
    payload = json.loads(
        (ROOT / "contracts/fixtures/valid/trip-1-day.json").read_text()
    )
    payload["interests"] = ["food"]
    trip, errors = generate(
        TravelRequest.model_validate(payload), LocalPlaceRepository()
    )
    assert not errors
    assert trip is not None
    places = {place.id: place for place in trip.places}
    food = [
        stop
        for day in trip.days
        for stop in day.stops
        if places[stop.placeId].kind == "food"
    ]
    assert food
    assert all(stop.arrivalAt.hour >= 11 for stop in food)
    assert all(
        not (stop.arrivalAt.hour < 13 and stop.departureAt.hour >= 12)
        for day in trip.days
        for stop in day.stops
        if places[stop.placeId].kind != "food"
    )
