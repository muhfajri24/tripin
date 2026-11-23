"""Run from backend: python -m scripts.export_schemas. Reproducible output."""

import json
from pathlib import Path
from app import models

NAMES = (
    "TravelRequest",
    "Place",
    "Coordinates",
    "Evidence",
    "Price",
    "TravelLeg",
    "ScheduledStop",
    "Itinerary",
    "ReplanRequest",
    "ReplanResult",
    "Violation",
    "PilotDataset",
)


def schemas():
    return {
        name: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            **getattr(models, name).model_json_schema(),
        }
        for name in NAMES
    }


def main():
    output = Path(__file__).resolve().parents[2] / "contracts" / "schemas"
    output.mkdir(parents=True, exist_ok=True)
    for name, schema in schemas().items():
        (output / f"{name}.json").write_text(
            json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )


if __name__ == "__main__":
    main()
