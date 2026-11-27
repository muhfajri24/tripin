import json
from io import BytesIO
from urllib.parse import parse_qs, urlsplit

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_demo_catalog_requires_explicit_source():
    client = TestClient(
        create_app(Settings(_env_file=None, supabase_url="", supabase_anon_key=""))
    )
    response = client.get("/api/v1/demo/places")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "HTTP_ERROR"


def test_demo_catalog_filters_and_preserves_unknown(monkeypatch):
    row = {
        "id": "jbd-depok-situ-pengasinan",
        "demo_version": "jabodetabek-demo-v1",
        "metro_area": "Depok",
        "administrative_area": "Kota Depok",
        "kind": "attraction",
        "name": "Situ Pengasinan",
        "address": "Sawangan, Kota Depok",
        "source_url": "https://porprov.depok.go.id/city-guide?page=24",
        "checked_on": "2026-11-27",
        "coordinates": None,
        "opening_hours": None,
        "ticket_price_idr": None,
    }

    class Response(BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            self.close()

    def fake_open(request, timeout):
        assert timeout == 6
        url = urlsplit(request.full_url)
        assert url.hostname == "example.supabase.co"
        assert parse_qs(url.query)["metro_area"] == ["eq.Depok"]
        assert parse_qs(url.query)["administrative_area"] == ["eq.Kota Depok"]
        assert parse_qs(url.query)["kind"] == ["eq.attraction"]
        assert parse_qs(url.query)["or"] == ["(name.ilike.*Situ*,address.ilike.*Situ*)"]
        assert parse_qs(url.query)["order"] == ["id.asc"]
        assert parse_qs(url.query)["limit"] == ["2"]
        assert parse_qs(url.query)["offset"] == ["0"]
        assert request.get_header("Apikey") == "sb_publishable_test"
        return Response(json.dumps([row]).encode())

    monkeypatch.setattr("app.api.demo_places.urlopen", fake_open)
    client = TestClient(
        create_app(
            Settings(
                _env_file=None,
                supabase_url="https://example.supabase.co",
                supabase_anon_key="sb_publishable_test",
            )
        )
    )
    result = client.get(
        "/api/v1/demo/places?area=Depok&administrativeArea=Kota%20Depok"
        "&kind=attraction&q=Situ&limit=1"
    )
    assert result.status_code == 200
    assert result.json() == {
        "places": [row],
        "datasetVersion": "jabodetabek-demo-v1",
        "complete": False,
        "limit": 1,
        "offset": 0,
        "hasMore": False,
    }
    assert client.get("/api/v1/demo/places?kind=unknown").status_code == 422
    assert client.get("/api/v1/demo/places?limit=0").status_code == 422
    assert client.get("/api/v1/demo/places?limit=101").status_code == 422
    assert client.get("/api/v1/demo/places?offset=-1").status_code == 422
    assert client.get("/api/v1/demo/places?q=Situ%2A").status_code == 422


def test_demo_catalog_paginates_after_upstream_filter(monkeypatch):
    rows = [
        {
            "id": f"jbd-depok-place-{index}",
            "demo_version": "jabodetabek-demo-v1",
            "metro_area": "Depok",
            "administrative_area": "Kota Depok",
            "kind": "food",
            "name": f"Food {index}",
            "address": "Kota Depok",
            "source_url": "https://example.com/source",
            "checked_on": "2026-11-27",
            "coordinates": None,
            "opening_hours": None,
            "ticket_price_idr": None,
        }
        for index in range(3)
    ]

    class Response(BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            self.close()

    def fake_open(request, timeout):
        query = parse_qs(urlsplit(request.full_url).query)
        assert query["limit"] == ["3"]
        assert query["offset"] == ["1"]
        assert query["kind"] == ["eq.food"]
        return Response(json.dumps(rows).encode())

    monkeypatch.setattr("app.api.demo_places.urlopen", fake_open)
    client = TestClient(
        create_app(
            Settings(
                _env_file=None,
                supabase_url="https://example.supabase.co",
                supabase_anon_key="sb_publishable_test",
            )
        )
    )
    result = client.get("/api/v1/demo/places?kind=food&limit=2&offset=1")
    assert result.status_code == 200
    assert [p["id"] for p in result.json()["places"]] == [r["id"] for r in rows[:2]]
    assert result.json()["hasMore"] is True
