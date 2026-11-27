import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.repositories import national_places
from app.repositories.places import LocalPlaceRepository


ROOT = Path(__file__).resolve().parents[2]


def test_indonesian_lookup_catalog_and_plan(monkeypatch):
    calls = []

    def source(url, data=None, timeout=12):
        calls.append(url)
        if "nominatim" in url:
            return [
                {
                    "lat": "-6.91750",
                    "lon": "107.61910",
                    "name": "Bandung",
                    "address": {"country_code": "id"},
                }
            ]
        return {
            "elements": [
                {
                    "type": "node",
                    "id": i,
                    "lat": -6.9175 + i * 0.001,
                    "lon": 107.6191 + i * 0.001,
                    "tags": {"name": f"Museum {i}", "tourism": "museum"},
                }
                for i in range(1, 6)
            ]
            + [
                {
                    "type": "node",
                    "id": 90,
                    "lat": -6.9170,
                    "lon": 107.6195,
                    "tags": {"name": "Hotel Bandung", "tourism": "hotel"},
                }
            ]
        }

    monkeypatch.setattr(national_places, "_json_request", source)
    wrapped = create_app(Settings(_env_file=None))
    wrapped.app.state.places = national_places.NationalPlaceRepository(
        LocalPlaceRepository(), use_seed=False
    )
    client = TestClient(wrapped)
    lookup = client.get("/api/v1/destinations/lookup", params={"q": "Bandung"})
    assert lookup.status_code == 200, lookup.text
    found = lookup.json()
    assert found["destinationId"] == "osm--691750_10761910"
    assert len(found["places"]) == 6
    assert all(p["prices"][0]["amountIdr"] is None for p in found["places"])
    assert all(p["openingWindows"] is None for p in found["places"])
    assert (
        client.get(
            "/api/v1/places", params={"destinationId": found["destinationId"]}
        ).status_code
        == 200
    )
    assert len(calls) == 2  # Geocoder and Overpass are cached for this request.

    request = json.loads(
        (ROOT / "contracts/fixtures/valid/trip-2-day.json").read_text()
    )
    request["destinationId"] = found["destinationId"]
    request["arrivalAnchor"] = found["center"]
    request["departureAnchor"] = found["center"]
    request["lodging"]["placeId"] = "osm-node-90"
    request["costAssumptions"] = {
        "foodPersonIdr": 30000,
        "lodgingRoomNightIdr": 200000,
        "vehicleDayIdr": 50000,
    }
    request["interests"] = ["culture"]
    response = client.post("/api/v1/itineraries/plan", json={"request": request})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["searchOutcome"] == "plan_found", body
    trip = body["itinerary"]
    assert trip["request"]["destinationId"] == found["destinationId"]
    assert all(
        stop["placeId"] != "osm-node-90"
        for day in trip["days"]
        for stop in day["stops"]
    )
    assert any(
        item["category"] == "lodging" and item["totalIdr"] == 200000
        for item in trip["ledger"]
    )


def test_lookup_rejects_non_indonesian_result(monkeypatch):
    monkeypatch.setattr(
        national_places,
        "_json_request",
        lambda *args, **kwargs: [
            {"lat": "1", "lon": "103", "address": {"country_code": "sg"}}
        ],
    )
    wrapped = create_app(Settings(_env_file=None))
    wrapped.app.state.places = national_places.NationalPlaceRepository(
        LocalPlaceRepository(), use_seed=False
    )
    client = TestClient(wrapped)
    response = client.get("/api/v1/destinations/lookup", params={"q": "Singapore"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "DESTINATION_NOT_FOUND"
