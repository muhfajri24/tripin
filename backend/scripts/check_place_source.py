"""Read-only configured source preflight. Never prints credentials or writes rows."""

import json
import argparse
import hashlib
from pathlib import Path
from app.config import Settings
from app.repositories.places import LocalPlaceRepository
from app.repositories.supabase_places import SupabasePlaceRepository, PlaceSourceError


def canonical_digest(places):
    payload = [p.model_dump(mode="json") for p in sorted(places, key=lambda p: p.id)]
    return hashlib.sha256(
        json.dumps(
            payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode("utf8")
    ).hexdigest()


def compare_catalogs(repo, local):
    rows = repo.list_places("yogyakarta")
    local_rows = local.list_places("yogyakarta")
    local_hash, source_hash = canonical_digest(local_rows), canonical_digest(rows)
    if repo.version != local.version or local_hash != source_hash:
        raise PlaceSourceError(
            "Configured source and local canonical catalog differ in version or content"
        )
    return {"localLiveParity": "passed", "canonicalSha256": source_hash}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compare-local", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    cfg = Settings()
    try:
        repo = (
            LocalPlaceRepository()
            if cfg.place_source == "local"
            else SupabasePlaceRepository(
                url=cfg.supabase_url,
                api_key=cfg.supabase_anon_key,
                view=cfg.supabase_places_view,
                dataset_version=cfg.supabase_dataset_version,
            )
        )
        rows = repo.list_places("yogyakarta")
        report = {
            "source": cfg.place_source,
            "datasetVersion": repo.version,
            "rows": len(rows),
            "canonicalValidation": "passed",
            "liveRead": cfg.place_source == "supabase",
            "permissionWriteTest": "not performed; verify grants/RLS with owner",
        }
        if args.compare_local:
            report.update(compare_catalogs(repo, LocalPlaceRepository()))
        if args.output:
            args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
        print(json.dumps(report))
    except (ValueError, PlaceSourceError) as exc:
        report = {"source": cfg.place_source, "status": "BLOCKED", "reason": str(exc)}
        if args.output:
            args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
        print(json.dumps(report))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
