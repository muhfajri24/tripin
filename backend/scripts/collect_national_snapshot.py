"""Collect small OSM city snapshots sequentially for a resilient national demo."""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from app.repositories.national_places import (
    NationalPlaceRepository,
    NationalCatalogError,
)
from app.repositories.places import LocalPlaceRepository

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "backend/app/data/national-osm-snapshot.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "areas", nargs="+", help="Explicit Indonesian city names to fetch"
    )
    args = parser.parse_args()
    previous = (
        json.loads(TARGET.read_text(encoding="utf-8"))
        if TARGET.exists()
        else {"destinations": []}
    )
    by_name = {item["name"].casefold(): item for item in previous["destinations"]}
    repo = NationalPlaceRepository(LocalPlaceRepository(), use_seed=False)
    failures = []
    for area in args.areas:
        try:
            found = repo.lookup(area)
            by_name[area.casefold()] = {
                "name": area,
                "destinationId": found["destinationId"],
                "center": found["center"],
                "places": [p.model_dump(mode="json") for p in found["places"]],
            }
            print(f"{area}: {len(found['places'])} places", flush=True)
        except NationalCatalogError as exc:
            failures.append(area)
            print(f"{area}: {exc}", flush=True)
    TARGET.write_text(
        json.dumps(
            {
                "source": "OpenStreetMap contributors (ODbL)",
                "collectedAt": datetime.now(timezone.utc).isoformat(),
                "destinations": list(by_name.values()),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
