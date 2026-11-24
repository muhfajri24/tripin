"""Read-only configured source preflight. Never prints credentials or writes rows."""

import json
from app.config import Settings
from app.repositories.places import LocalPlaceRepository
from app.repositories.supabase_places import SupabasePlaceRepository, PlaceSourceError


def main():
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
        print(
            json.dumps(
                {
                    "source": cfg.place_source,
                    "datasetVersion": repo.version,
                    "rows": len(rows),
                    "canonicalValidation": "passed",
                    "liveRead": cfg.place_source == "supabase",
                    "permissionWriteTest": "not performed; verify grants/RLS with owner",
                }
            )
        )
    except (ValueError, PlaceSourceError) as exc:
        print(
            json.dumps(
                {"source": cfg.place_source, "status": "BLOCKED", "reason": str(exc)}
            )
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
