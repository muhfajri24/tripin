import json
from pathlib import Path
from urllib.parse import parse_qs

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


def test_named_hotel_search_extends_catalog_for_planner(monkeypatch):
    def source(url, data=None, timeout=12):
        if "nominatim" in url:
            return [
                {
                    "lat": "-6.9175",
                    "lon": "107.6191",
                    "name": "Bandung",
                    "address": {"country_code": "id"},
                }
            ]
        if data and (
            "around:30000" in parse_qs(data.decode())["data"][0]
            or "node(99)" in parse_qs(data.decode())["data"][0]
        ):
            return {
                "elements": [
                    {
                        "type": "node",
                        "id": 99,
                        "lat": -6.91,
                        "lon": 107.62,
                        "tags": {"name": "Hotel Baru", "tourism": "hotel"},
                    }
                ]
            }
        return {
            "elements": [
                {
                    "type": "node",
                    "id": 1,
                    "lat": -6.917,
                    "lon": 107.62,
                    "tags": {"name": "Museum Bandung", "tourism": "museum"},
                }
            ]
        }

    monkeypatch.setattr(national_places, "_json_request", source)
    wrapped = create_app(Settings(_env_file=None))
    wrapped.app.state.places = national_places.NationalPlaceRepository(
        LocalPlaceRepository(), use_seed=False
    )
    client = TestClient(wrapped)
    destination = client.get(
        "/api/v1/destinations/lookup", params={"q": "Bandung"}
    ).json()
    destination_id = destination["destinationId"]
    assert not any(p["kind"] == "lodging" for p in destination["places"])
    response = client.get(
        f"/api/v1/destinations/{destination_id}/lodgings", params={"q": "Hotel Baru"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["places"][0]["name"] == "Hotel Baru"
    catalog = client.get("/api/v1/places", params={"destinationId": destination_id})
    assert any(p["id"] == "osm-node-99" for p in catalog.json()["places"])

    another_worker = national_places.NationalPlaceRepository(
        LocalPlaceRepository(), use_seed=False
    )
    another_worker.ensure_lodging(destination_id, "osm-node-99")
    assert any(
        p.id == "osm-node-99" for p in another_worker.list_lodging(destination_id)
    )


def test_national_nature_and_history_tags_become_attractions():
    destination_id = "osm--840950_11518890"
    for tags, category in [
        ({"name": "Pantai Contoh", "natural": "beach"}, "beach"),
        ({"name": "Benteng Contoh", "historic": "fort"}, "culture"),
        ({"name": "Taman Contoh", "leisure": "park"}, "nature"),
    ]:
        place = national_places._convert(
            {"type": "node", "id": 199, "lat": -8.4095, "lon": 115.1889, "tags": tags},
            destination_id,
        )
        assert place.kind == "attraction"
        assert category in place.categories
