"""HTTP regressions for the active Create/Explore/Editor wire payloads."""

import pytest
from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app
from test_planner import Repo, request


@pytest.fixture
def client():
    wrapped = create_app(Settings(_env_file=None, place_source="local"))
    wrapped.app.state.places = Repo()
    return TestClient(wrapped, raise_server_exceptions=False)


@pytest.mark.parametrize(
    "text,missing",
    [
        ("4 hari", "days"),
        ("0 hari", "days"),
        ("-1 hari", "days"),
        ("7 orang", "adults"),
        ("0 dewasa", "adults"),
        ("-2 wisatawan", "adults"),
        ("2026-02-30", "startDate"),
        ("0000-01-01", "startDate"),
        ("budget Rp0", "budgetAmountIdr"),
    ],
)
def test_invalid_brief_values_remain_missing_for_form_review(client, text, missing):
    response = client.post("/api/v1/requests/parse", json={"text": f"Jogja {text}"})
    assert response.status_code == 200
    result = response.json()
    assert missing not in result["draft"]
    assert missing in result["missingFields"]
    assert result["ambiguities"]


def test_destination_must_be_a_whole_word(client):
    result = client.post(
        "/api/v1/requests/parse", json={"text": "Majogja 2 hari"}
    ).json()
    assert result["draft"]["unsupportedDestination"]
    assert "destinationId" in result["missingFields"]


def test_supported_brief_preserves_review_fields(client):
    result = client.post(
        "/api/v1/requests/parse",
        json={
            "text": "Jogja 3 hari 6 orang 2028-02-29 budget Rp1,5 juta per orang mobil "
            "pagi kuliner, siang budaya museum"
        },
    ).json()
    draft = result["draft"]
    assert draft["days"] == 3 and draft["adults"] == 6
    assert draft["startDate"] == "2028-02-29"
    assert draft["budgetAmountIdr"] == 1500000
    assert draft["budgetBasis"] == "person"
    assert draft["interests"] == ["food", "culture"]
    assert draft["periodPreferences"] == [
        {"period": "morning", "categories": ["food"]},
        {"period": "afternoon", "categories": ["culture"]},
    ]
    assert result["missingFields"] == ["lodging"]


def editor_payload(trip, selection):
    return {
        "itinerary": trip,
        "expectedRevision": trip["revision"],
        "effectiveAt": trip["request"]["startDate"] + "T08:00:00+07:00",
        "currentLocation": trip["request"]["arrivalAnchor"],
        "disruption": {
            "type": "edit",
            "selectedPlaceIds": selection,
            "request": trip["request"],
            "locks": {},
        },
    }


@pytest.mark.parametrize("days", [1, 2, 3])
def test_create_catalog_plan_save_roundtrip_and_editor(client, days):
    catalog = client.get("/api/v1/places").json()
    assert catalog["places"] and catalog["datasetVersion"]
    planned = client.post(
        "/api/v1/itineraries/plan",
        json={"request": request(days).model_dump(mode="json")},
    )
    assert planned.status_code == 200
    trip = planned.json()["itinerary"]
    assert trip is not None
    selection = [s["placeId"] for day in trip["days"] for s in day["stops"]]
    response = client.post(
        "/api/v1/itineraries/replan", json=editor_payload(trip, selection)
    )
    assert response.status_code == 200
    revised = response.json()["revised"]
    assert revised["id"] == trip["id"]
    assert revised["revision"] == trip["revision"] + 1
    assert [s["placeId"] for d in revised["days"] for s in d["stops"]] == selection
    assert revised["totals"]["knownCostIdr"] == sum(
        item["totalIdr"] or 0 for item in revised["ledger"]
    )


def test_duplicate_editor_selection_returns_422_instead_of_500(client):
    trip = client.post(
        "/api/v1/itineraries/plan", json={"request": request().model_dump(mode="json")}
    ).json()["itinerary"]
    pid = trip["days"][0]["stops"][0]["placeId"]
    response = client.post(
        "/api/v1/itineraries/replan", json=editor_payload(trip, [pid, pid])
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert "duplicate selected" in str(response.json()["error"]["fields"])


def test_empty_editor_selection_returns_actionable_conflict(client):
    trip = client.post(
        "/api/v1/itineraries/plan", json={"request": request().model_dump(mode="json")}
    ).json()["itinerary"]
    response = client.post("/api/v1/itineraries/replan", json=editor_payload(trip, []))
    assert response.status_code == 200
    result = response.json()
    assert result["revised"] is None
    assert (
        "setidaknya satu aktivitas"
        in result["disruptedOriginalViolations"][0]["message"]
    )


def test_editor_lock_must_reference_selected_place(client):
    trip = client.post(
        "/api/v1/itineraries/plan", json={"request": request().model_dump(mode="json")}
    ).json()["itinerary"]
    selection = [s["placeId"] for d in trip["days"] for s in d["stops"]]
    body = editor_payload(trip, selection)
    body["disruption"]["locks"] = {"unknown": {"type": "place_day", "arrivalAt": None}}
    response = client.post("/api/v1/itineraries/replan", json=body)
    assert response.status_code == 422
    assert "locks must refer" in str(response.json()["error"]["fields"])
