"""Small, sequential live check of Indonesian destination coverage."""

import json
from pathlib import Path

from app.domain.planner import generate
from app.models import TravelRequest
from app.repositories.national_places import (
    NationalPlaceRepository,
    NationalCatalogError,
)
from app.repositories.places import LocalPlaceRepository


ROOT = Path(__file__).resolve().parents[2]
AREAS = [
    "Medan",
    "Bandung",
    "Denpasar",
    "Banjarmasin",
    "Makassar",
    "Jayapura",
    "Jakarta",
    "Padang",
    "Labuan Bajo",
    "Bali",
    "Surabaya",
]


def main():
    repo = NationalPlaceRepository(LocalPlaceRepository())
    fixture = json.loads(
        (ROOT / "contracts/fixtures/valid/trip-1-day.json").read_text()
    )
    overnight_fixture = json.loads(
        (ROOT / "contracts/fixtures/valid/trip-2-day.json").read_text()
    )
    report = []
    for area in AREAS:
        try:
            found = repo.lookup(area)
            request = dict(fixture)
            request["destinationId"] = found["destinationId"]
            request["arrivalAnchor"] = found["center"]
            request["departureAnchor"] = found["center"]
            request["interests"] = ["culture", "food", "nature", "attraction"]
            trip, conflicts = generate(TravelRequest.model_validate(request), repo)
            hotel = next((p for p in found["places"] if p.kind == "lodging"), None)
            overnight = None
            overnight_conflicts = []
            if hotel:
                overnight_request = dict(overnight_fixture)
                overnight_request["destinationId"] = found["destinationId"]
                overnight_request["arrivalAnchor"] = hotel.coordinates.model_dump()
                overnight_request["departureAnchor"] = hotel.coordinates.model_dump()
                overnight_request["lodging"] = {
                    **overnight_request["lodging"],
                    "placeId": hotel.id,
                }
                overnight_request["interests"] = request["interests"]
                overnight_request["costAssumptions"] = {
                    "foodPersonIdr": 30000,
                    "lodgingRoomNightIdr": 200000,
                    "vehicleDayIdr": 50000,
                }
                overnight, overnight_conflicts = generate(
                    TravelRequest.model_validate(overnight_request), repo
                )
            item = {
                "area": area,
                "destinationId": found["destinationId"],
                "places": sum(p.kind != "lodging" for p in found["places"]),
                "hotels": sum(p.kind == "lodging" for p in found["places"]),
                "planFound": trip is not None,
                "conflicts": conflicts[:2],
                "overnightPlanFound": overnight is not None,
                "overnightConflicts": overnight_conflicts[:2],
            }
        except (NationalCatalogError, ValueError) as exc:
            item = {"area": area, "planFound": False, "error": str(exc)}
        report.append(item)
        print(json.dumps(item, ensure_ascii=False), flush=True)
    (ROOT / "qa/release/national-smoke.json").write_text(
        json.dumps(
            {"source": "OpenStreetMap user-triggered lookup", "results": report},
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return (
        0
        if all(item["planFound"] and item["overnightPlanFound"] for item in report)
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())
