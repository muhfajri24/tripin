from pathlib import Path
from scripts.export_catalog_seed import seed_sql


def test_reviewed_seed_matches_validated_canonical_dataset():
    root = Path(__file__).resolve().parents[2]
    assert (root / "supabase/seed.sql").read_text(encoding="utf8") == seed_sql()
