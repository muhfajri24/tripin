"""Disposable PostgreSQL verification only. Never accepts a remote DB connection."""

import json
import subprocess
from pathlib import Path
from time import sleep
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]


def main():
    name = "tripin-catalog-test-" + uuid4().hex[:10]
    checks = []
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-d",
            "--name",
            name,
            "--network",
            "none",
            "--tmpfs",
            "/var/lib/postgresql/data",
            "-e",
            "POSTGRES_HOST_AUTH_METHOD=trust",
            "postgres:16-alpine",
        ],
        check=True,
        capture_output=True,
    )
    try:
        for _ in range(20):
            if (
                subprocess.run(
                    ["docker", "exec", name, "pg_isready", "-U", "postgres"],
                    capture_output=True,
                ).returncode
                == 0
            ):
                break
            sleep(0.5)

        def sql(text, expect=True):
            result = subprocess.run(
                [
                    "docker",
                    "exec",
                    "-i",
                    name,
                    "psql",
                    "-X",
                    "-U",
                    "postgres",
                    "-v",
                    "ON_ERROR_STOP=1",
                    "-At",
                ],
                input=text.encode("utf8"),
                capture_output=True,
            )
            if expect and result.returncode:
                raise RuntimeError(result.stderr.decode("utf8"))
            if not expect:
                assert result.returncode != 0, "Expected permission/conflict rejection"
            return result.stdout.decode("utf8").strip()

        sql(
            "create role anon; create role authenticated; create table public.saved_places(id int); insert into public.saved_places values (7);"
        )
        sql(
            (ROOT / "supabase/migrations/202611240001_catalog.sql").read_text(
                encoding="utf-8-sig"
            )
        )
        seed = (ROOT / "supabase/seed.sql").read_text(encoding="utf8")
        sql(seed)
        sql(seed)
        assert sql("select count(*) from public.tripin_places_api;") == "9"
        checks.append("migration and seed run; identical seed rerun remains 9 rows")
        for role in ["anon", "authenticated"]:
            assert sql(
                f"set role {role}; select count(*) from public.tripin_places_api;"
            ).endswith("9")
            for query in [
                "insert into public.tripin_place_catalog select * from public.tripin_place_catalog limit 0;",
                "update public.tripin_place_catalog set place=place;",
                "delete from public.tripin_place_catalog;",
                "insert into public.tripin_places_api select place from public.tripin_places_api limit 0;",
            ]:
                sql(f"set role {role}; " + query, expect=False)
        checks.append(
            "anon/authenticated can select; INSERT UPDATE DELETE and view writes rejected"
        )
        assert (
            sql(
                "select relrowsecurity from pg_class where oid='public.tripin_place_catalog'::regclass;"
            )
            == "t"
        )
        assert "security_invoker=true" in sql(
            "select reloptions from pg_class where oid='public.tripin_places_api'::regclass;"
        )
        checks.append("RLS enabled and view security_invoker=true")
        assert sql("select id from public.saved_places;") == "7"
        checks.append("existing public.saved_places unchanged")
        sql(
            "update public.tripin_place_catalog set place=jsonb_set(place,'{name}','\"changed\"'::jsonb) where place_id='yog-malioboro';"
        )
        sql(seed, expect=False)
        checks.append(
            "conflicting existing seed record rejected without upsert overwrite"
        )
        result = {
            "engine": "local disposable postgres:16-alpine",
            "checks": checks,
            "status": "passed",
            "liveSupabase": False,
            "network": "none; no published ports",
            "containerRemoved": True,
        }
    finally:
        subprocess.run(["docker", "stop", name], check=True, capture_output=True)
    (ROOT / "qa/release/postgres-catalog.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf8"
    )
    print(json.dumps(result))


if __name__ == "__main__":
    main()
