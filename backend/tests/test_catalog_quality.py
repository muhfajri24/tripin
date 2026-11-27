import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.repositories.places import LocalPlaceRepository, PlaceCatalog
from app.repositories.supabase_places import PlaceSourceError
from scripts.check_catalog_quality import quality_errors
from scripts.check_place_source import compare_catalogs


def raw_catalog():
    return json.loads(
        (
            Path(__file__).resolve().parents[1] / "app/data/yogyakarta-v0.4.0.json"
        ).read_text(encoding="utf8")
    )


def test_data_gate_rejects_duplicate_ids_and_untraceable_checked_evidence():
    raw = raw_catalog()
    raw["places"].append(raw["places"][0])
    with pytest.raises(ValidationError):
        quality_errors(raw)
    raw = raw_catalog()
    raw["places"][0]["identityEvidence"]["sourceRef"] = None
    with pytest.raises(ValidationError):
        quality_errors(raw)


def test_data_gate_rejects_out_of_scope_coordinates_and_bad_price_basis():
    raw = raw_catalog()
    raw["places"][0]["coordinates"]["lat"] = -6.2
    raw["places"][0]["prices"][0]["basis"] = "room_night"
    errors = quality_errors(raw)
    assert any("bounds" in error for error in errors)
    assert any("price basis" in error for error in errors)


def test_data_gate_rejects_fabricated_facts_and_preserves_unknown():
    raw = raw_catalog()
    assert not quality_errors(raw)
    raw["places"][0]["prices"][0]["amountIdr"] = 0
    raw["places"][0]["isLocalBusiness"] = True
    errors = quality_errors(raw)
    assert any("populated fact" in error for error in errors)
    assert any("business classification" in error for error in errors)


def test_parity_detects_same_version_content_drift_and_version_drift():
    local = LocalPlaceRepository()
    rows = local.list_places("yogyakarta")
    assert (
        compare_catalogs(PlaceCatalog(list(reversed(rows)), local.version), local)[
            "localLiveParity"
        ]
        == "passed"
    )
    rows[0].address = "Unexpected content drift"
    with pytest.raises(PlaceSourceError, match="differ"):
        compare_catalogs(PlaceCatalog(rows, local.version), local)
    with pytest.raises(PlaceSourceError, match="differ"):
        compare_catalogs(
            PlaceCatalog(local.list_places("yogyakarta"), "wrong-version"), local
        )
