"""Reproducible HTTP flow. Records the configured source through catalog parity."""

import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8011/api/v1")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--snapshots", type=Path)
    args = parser.parse_args()

    def call(path, payload=None):
        req = Request(
            args.base + path,
            data=None if payload is None else json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urlopen(req, timeout=20) as response:
            assert response.status == 200
            return json.load(response)

    assert call("/health")["status"] == "ok"
    catalog = call("/places?destinationId=yogyakarta")
    assert catalog["places"], "Configured catalog is empty"
    food = call("/places?destinationId=yogyakarta&kind=food&routable=true")
    assert all(p["kind"] == "food" and p["coordinates"] for p in food["places"])
    museum = call("/places?q=Sonobudoyo")
    assert museum["places"] and all(
        "sonobudoyo" in p["name"].lower() for p in museum["places"]
    )
    detail = call("/places/" + catalog["places"][0]["id"])
    assert detail == catalog["places"][0]
    draft = call(
        "/requests/parse",
        {
            "text": "Yogyakarta 2 hari, 2 orang, budget Rp500.000 per orang, mobil, pagi kuliner siang budaya"
        },
    )["draft"]
    root = Path(__file__).resolve().parents[2]
    req = json.loads((root / "contracts/fixtures/valid/trip-2-day.json").read_text())
    req["budget"] = {
        "totalIdr": draft["budgetAmountIdr"] * draft["adults"],
        "originalBasis": draft["budgetBasis"],
        "reserveIdr": 0,
    }
    req["lodging"]["placeId"] = "yog-ibis-styles"
    req["costAssumptions"] = {
        "foodPersonIdr": 25000,
        "lodgingRoomNightIdr": 200000,
        "vehicleDayIdr": 100000,
    }
    response = call("/itineraries/plan", {"request": req})
    original = response["itinerary"]
    assert original, response
    assert original["datasetVersion"] == catalog["datasetVersion"]
    day_checks = {"2": "passed"}
    for days in (1, 3):
        case = json.loads(
            (root / f"contracts/fixtures/valid/trip-{days}-day.json").read_text()
        )
        case["costAssumptions"] = req["costAssumptions"]
        if days > 1:
            case["lodging"]["placeId"] = "yog-ibis-styles"
        planned = call("/itineraries/plan", {"request": case})
        assert planned["itinerary"], planned
        assert len(planned["itinerary"]["days"]) == days
        assert planned["itinerary"]["datasetVersion"] == catalog["datasetVersion"]
        day_checks[str(days)] = "passed"
    stop = original["days"][0]["stops"][0]
    result = call(
        "/itineraries/replan",
        {
            "itinerary": original,
            "expectedRevision": original["revision"],
            "effectiveAt": req["startDate"] + "T08:00:00+07:00",
            "currentLocation": req["arrivalAnchor"],
            "disruption": {
                "type": "closure",
                "placeId": stop["placeId"],
                "date": req["startDate"],
            },
        },
    )
    assert result["revised"] and result["disruptedOriginalViolations"], result
    assert result["revised"]["revision"] == original["revision"] + 1
    report = {
        "scenario": "Actual API catalog, two days, parsed per-person budget, user cost assumptions, reported closure",
        "datasetVersion": catalog["datasetVersion"],
        "catalogRows": len(catalog["places"]),
        "listFilterDetail": "passed",
        "planDays": day_checks,
        "normalizedBudgetIdr": req["budget"]["totalIdr"],
        "before": original["totals"],
        "after": result["revised"]["totals"],
        "conflicts": [v["message"] for v in result["disruptedOriginalViolations"]],
        "changes": result["changes"],
        "delta": result["beforeAfter"],
        "note": "Actual HTTP smoke; source provenance requires check_place_source evidence. Not provider freshness or browser navigation verification.",
    }
    if args.output:
        args.output.write_text(
            json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    if args.snapshots:
        args.snapshots.write_text(
            json.dumps(
                {"request": req, "original": original, "replanResult": result},
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf8",
        )
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
