import json
from pathlib import Path
import pytest
from pydantic import ValidationError
from jsonschema import Draft202012Validator
from app import models
from scripts.export_schemas import schemas

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads(
    (ROOT / "contracts/fixtures/manifest.json").read_text(encoding="utf-8")
)


@pytest.mark.parametrize("case", MANIFEST, ids=lambda c: c["path"])
def test_fixtures(case):
    payload = (ROOT / "contracts/fixtures" / case["path"]).read_text(encoding="utf-8")
    model = getattr(models, case["model"])
    if case["valid"]:
        parsed = model.model_validate_json(payload)
        assert model.model_validate_json(parsed.model_dump_json()) == parsed
        Draft202012Validator(model.model_json_schema()).validate(json.loads(payload))
    else:
        with pytest.raises(ValidationError):
            model.model_validate_json(payload)


def test_dataset_unknowns():
    data = models.PilotDataset.model_validate_json(
        (ROOT / "backend/app/data/yogyakarta-v0.1.0.json").read_text(encoding="utf-8")
    )
    assert {p.kind for p in data.places} >= {"food", "attraction", "lodging"}
    for p in data.places:
        assert p.prices[0].amountIdr is None
        assert p.openingWindows is None
        assert p.isLocalBusiness is None
    assert data.places[0].coordinates.lat == -7.805456
    assert data.places[1].coordinates is None


@pytest.mark.parametrize("lat,lng", [(0, 110), (-7, 0), (0, 0)])
def test_zero_coordinates(lat, lng):
    assert models.Coordinates(lat=lat, lng=lng).lat == lat


@pytest.mark.parametrize("lat", [True, "-7.8", float("nan"), float("inf"), -91])
def test_invalid_coordinates(lat):
    with pytest.raises(ValidationError):
        models.Coordinates(lat=lat, lng=110)


@pytest.mark.parametrize("value", [True, "1000", -1, 1.5])
def test_money_rejected(value):
    with pytest.raises(ValidationError):
        models.Price(
            amountIdr=value,
            basis="person",
            evidence={
                "sourceType": "user",
                "sourceRef": None,
                "checkedAt": None,
                "status": "estimated",
            },
        )


def test_unknown_not_checked():
    with pytest.raises(ValidationError):
        models.Price(
            amountIdr=None,
            basis="person",
            evidence={
                "sourceType": "curated",
                "sourceRef": "source",
                "checkedAt": "2026-11-24T00:00:00Z",
                "status": "checked",
            },
        )


def test_exported_schemas_current():
    for name, schema in schemas().items():
        Draft202012Validator.check_schema(schema)
        assert (
            json.loads(
                (ROOT / f"contracts/schemas/{name}.json").read_text(encoding="utf-8")
            )
            == schema
        )


def test_extra_fields_rejected():
    with pytest.raises(ValidationError):
        models.Coordinates(lat=0, lng=0, rating=5)


@pytest.mark.parametrize(
    "timestamp",
    ["2026-12-01T09:00:00", "2026-12-01T09:00:00Z", "2026-12-01T10:00:00+07:00"],
)
def test_fixed_lock_and_timezone(timestamp):
    p = json.loads((ROOT / "contracts/fixtures/valid/scheduled-stop.json").read_text())
    p["lock"]["arrivalAt"] = timestamp
    with pytest.raises(ValidationError):
        models.ScheduledStop.model_validate(p)


@pytest.mark.parametrize(
    "change",
    [
        {"schemaVersion": True},
        {"schemaVersion": "1"},
        {"id": "contains space"},
        {"revision": 0},
    ],
)
def test_invalid_itinerary_identity(change):
    p = json.loads(
        (ROOT / "contracts/fixtures/valid/itinerary-snapshot.json").read_text()
    )
    p.update(change)
    with pytest.raises(ValidationError):
        models.Itinerary.model_validate(p)


def test_trip_requires_consecutive_dates_and_lodging_nights():
    p = json.loads((ROOT / "contracts/fixtures/valid/trip-3-day.json").read_text())
    p["lodging"]["nights"] = 1
    with pytest.raises(ValidationError):
        models.TravelRequest.model_validate(p)
    p["lodging"]["nights"] = 2
    p["dayWindows"][2]["date"] = "2026-12-05"
    with pytest.raises(ValidationError):
        models.TravelRequest.model_validate(p)


def test_unknown_selected_metadata_cannot_be_satisfied():
    p = json.loads(
        (ROOT / "contracts/fixtures/valid/itinerary-snapshot.json").read_text()
    )
    p.update(feasibility="satisfied", uncertainties=[])
    with pytest.raises(ValidationError):
        models.Itinerary.model_validate(p)


def test_ledger_arithmetic_and_unknown_total():
    from app.models.contracts import LedgerItem

    p = dict(
        id="ledger-1",
        category="food",
        placeId=None,
        quantity=2,
        unitAmountIdr=100,
        totalIdr=200,
        evidence={
            "sourceType": "user",
            "sourceRef": None,
            "checkedAt": None,
            "status": "unverified",
        },
    )
    assert LedgerItem.model_validate(p).totalIdr == 200
    p["totalIdr"] = 100
    with pytest.raises(ValidationError):
        LedgerItem.model_validate(p)
    p.update(unitAmountIdr=None, totalIdr=None)
    assert LedgerItem.model_validate(p).totalIdr is None


def test_replan_revision_and_repaired_result():
    p = json.loads((ROOT / "contracts/fixtures/valid/replan-request.json").read_text())
    p["expectedRevision"] = 2
    with pytest.raises(ValidationError):
        models.ReplanRequest.model_validate(p)
    p = json.loads(
        (ROOT / "contracts/fixtures/valid/replan-needs-decision.json").read_text()
    )
    p["status"] = "repaired"
    with pytest.raises(ValidationError):
        models.ReplanResult.model_validate(p)
