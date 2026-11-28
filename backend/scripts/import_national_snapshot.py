"""Import a bounded Overpass response that was collected for a named city.

Usage: python -m scripts.import_national_snapshot CITY LAT LNG RAW_JSON
The raw response must come from OpenStreetMap Overpass.
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from app.domain.planner import scope
from app.repositories.national_places import _convert, _destination_center

TARGET = Path(__file__).resolve().parents[1] / "app/data/national-osm-snapshot.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("city")
    parser.add_argument("lat", type=float)
    parser.add_argument("lng", type=float)
    parser.add_argument("raw_json", type=Path)
    args = parser.parse_args()
    destination_id = f"osm-{round(args.lat * 100000)}_{round(args.lng * 100000)}"
    _destination_center(destination_id)
    raw = json.loads(args.raw_json.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or not isinstance(raw.get("elements"), list):
        raise ValueError("Expected an Overpass JSON response with elements")
    by_id = {}
    for element in raw["elements"]:
        place = _convert(element, destination_id)
        if place and scope(place.coordinates, destination_id):
            by_id[place.id] = place
    if not any(p.kind == "lodging" for p in by_id.values()):
        raise ValueError("Snapshot needs at least one hotel")
    if not any(p.kind == "attraction" for p in by_id.values()):
        raise ValueError("Snapshot needs at least one attraction")
    snapshot = json.loads(TARGET.read_text(encoding="utf-8"))
    snapshot["destinations"] = [
        item for item in snapshot["destinations"]
        if item["name"].casefold() != args.city.casefold()
    ]
    snapshot["destinations"].append({
        "name": args.city,
        "destinationId": destination_id,
        "center": {"lat": args.lat, "lng": args.lng},
        "places": [p.model_dump(mode="json") for p in by_id.values()],
    })
    snapshot["collectedAt"] = datetime.now(timezone.utc).isoformat()
    TARGET.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{args.city}: {len(by_id)} places, "
          f"{sum(p.kind == 'lodging' for p in by_id.values())} hotels")


if __name__ == "__main__":
    main()
