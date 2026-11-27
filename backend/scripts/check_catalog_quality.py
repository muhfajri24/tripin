"""Validate catalog evidence and seed parity without network access or database writes."""

import argparse
import json
from pathlib import Path

from app.domain.planner import scope
from app.models import PilotDataset
from scripts.export_catalog_seed import seed_sql

ROOT = Path(__file__).resolve().parents[2]


def quality_errors(raw):
    dataset = PilotDataset.model_validate(raw)
    errors = []
    for p in dataset.places:
        if p.coordinates is not None and not scope(p.coordinates):
            errors.append(f"{p.id}: coordinates outside pilot bounds")
        allowed_basis = {"room_night"} if p.kind == "lodging" else {"person", "group"}
        if any(price.basis not in allowed_basis for price in p.prices):
            errors.append(f"{p.id}: unsupported price basis for kind")
        facts = [
            (p.name, p.identityEvidence),
            (p.visitDurationMin, p.durationEvidence),
            (p.coordinates, p.locationEvidence),
            (p.openingWindows, p.openingEvidence),
            (p.isLocalBusiness, p.localBusinessEvidence),
            *((price.amountIdr, price.evidence) for price in p.prices),
        ]
        for value, evidence in facts:
            if value is not None and evidence.status == "unverified":
                errors.append(
                    f"{p.id}: populated fact without checked/estimated evidence"
                )
        if (
            p.isLocalBusiness is not None
            and p.localBusinessEvidence.status != "checked"
        ):
            errors.append(f"{p.id}: business classification needs checked evidence")
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--dataset", type=Path, help="Validate a proposed catalog without activating it"
    )
    args = parser.parse_args(argv)
    active = ROOT / "backend/app/data/yogyakarta-v0.4.0.json"
    path = args.dataset or active
    raw = json.loads(path.read_text(encoding="utf8"))
    errors = quality_errors(raw)
    if (
        path.resolve() == active.resolve()
        and (ROOT / "supabase/seed.sql").read_text(encoding="utf8") != seed_sql()
    ):
        errors.append("supabase/seed.sql differs from canonical export")
    report = {
        "datasetVersion": raw["datasetVersion"],
        "rows": len(raw["places"]),
        "status": "failed" if errors else "passed",
        "errors": errors,
        "seedParity": "checked"
        if path.resolve() == active.resolve()
        else "not applicable: proposal is not active",
        "note": "Checks structure/evidence consistency, not current provider operations or metadata completeness.",
    }
    if args.output:
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
