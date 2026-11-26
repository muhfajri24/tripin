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
        assert parse_qs(url.query)["kind"] == ["eq.attraction"]
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
    result = client.get("/api/v1/demo/places?area=Depok&kind=attraction&q=Situ")
    assert result.status_code == 200
    assert result.json() == {
        "places": [row],
        "datasetVersion": "jabodetabek-demo-v1",
        "complete": False,
    }
    assert client.get("/api/v1/demo/places?kind=unknown").status_code == 422
