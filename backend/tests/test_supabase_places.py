import json
from io import BytesIO

import pytest
from app.repositories.supabase_places import SupabasePlaceRepository, PlaceSourceError
from app.repositories.places import LocalPlaceRepository


class FakeResponse:
    def __init__(self, data):
        self.data = BytesIO(json.dumps(data).encode())

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, n):
        return self.data.read(n)


def adapter(**changes):
    kwargs = {
        "url": "https://example.supabase.co",
        "api_key": "sb_publishable_test",
        "view": "approved_places_view",
        "dataset_version": "v1",
    }
    kwargs.update(changes)
    return SupabasePlaceRepository(**kwargs)


def test_requires_safe_configuration():
    with pytest.raises(ValueError):
        adapter(url="http://example.supabase.co")
    with pytest.raises(ValueError):
        adapter(view="places;drop table users")
    with pytest.raises(ValueError):
        adapter(api_key="")


def test_read_only_and_canonical(monkeypatch):
    place = LocalPlaceRepository().list_places("yogyakarta")[0]
    observed = {}

    def fake_open(req, timeout):
        observed["url"] = req.full_url
        observed["headers"] = dict(req.header_items())
        observed["method"] = req.get_method()
        return FakeResponse([{"place": place.model_dump(mode="json")}])

    monkeypatch.setattr("app.repositories.supabase_places.urlopen", fake_open)
    repo = adapter()
    places = repo.list_places("yogyakarta")
    assert len(places) == 1 and places[0].id == place.id
    assert repo.get_place(place.id).id == place.id
    assert repo.get_place("missing") is None
    assert observed["method"] == "GET"
    assert "select=place" in observed["url"]
    assert observed["headers"]["Apikey"] == "sb_publishable_test"
    assert repo.version == "v1"


def test_missing_and_bad_rows_fail_closed(monkeypatch):
    for payload in (
        [{"wrong": {}}],
        [{"place": {"id": "not-complete"}}],
        {"place": []},
    ):
        monkeypatch.setattr(
            "app.repositories.supabase_places.urlopen",
            lambda req, timeout: FakeResponse(payload),
        )
        with pytest.raises(PlaceSourceError):
            adapter().list_places("yogyakarta")


def test_truncation_detected(monkeypatch):
    monkeypatch.setattr(
        "app.repositories.supabase_places.urlopen",
        lambda req, timeout: FakeResponse([{"place": {}}] * 200),
    )
    with pytest.raises(PlaceSourceError, match="row limit"):
        adapter().list_places("yogyakarta")


def test_cache_returns_copies_and_snapshot_is_stable(monkeypatch):
    place = LocalPlaceRepository().list_places("yogyakarta")[0]
    calls = []

    def read(req, timeout):
        calls.append(req.get_method())
        return FakeResponse([{"place": place.model_dump(mode="json")}])

    monkeypatch.setattr("app.repositories.supabase_places.urlopen", read)
    repo = adapter()
    snapshot = repo.snapshot()
    snapshot.get_place(place.id).name = "changed"
    assert repo.get_place(place.id).name == place.name
    assert calls == ["GET"]


def test_source_error_is_http_503_without_local_substitution(monkeypatch):
    from urllib.error import URLError
    from fastapi.testclient import TestClient
    from app.config import Settings
    from app.main import create_app

    def unavailable(*args, **kwargs):
        raise URLError("test outage")

    monkeypatch.setattr("app.repositories.supabase_places.urlopen", unavailable)
    client = TestClient(
        create_app(
            Settings(
                _env_file=None,
                place_source="supabase",
                supabase_url="https://example.supabase.co",
                supabase_anon_key="sb_publishable_test",
                supabase_places_view="approved_places_view",
                supabase_dataset_version="test-v1",
            )
        )
    )
    response = client.get("/api/v1/places")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "PLACE_SOURCE_UNAVAILABLE"
    assert "places" not in response.json()


def test_secret_keys_and_duplicate_rows_are_rejected(monkeypatch):
    with pytest.raises(ValueError, match="secret key"):
        adapter(api_key="sb_secret_not_allowed")
    place = LocalPlaceRepository().list_places("yogyakarta")[0].model_dump(mode="json")
    monkeypatch.setattr(
        "app.repositories.supabase_places.urlopen",
        lambda *a, **k: FakeResponse([{"place": place}, {"place": place}]),
    )
    with pytest.raises(PlaceSourceError):
        adapter().list_places("yogyakarta")


@pytest.mark.parametrize("status", [401, 403, 500])
def test_http_failures_are_closed(monkeypatch, status):
    from urllib.error import HTTPError

    def fail(req, timeout):
        raise HTTPError(req.full_url, status, "test failure", {}, None)

    monkeypatch.setattr("app.repositories.supabase_places.urlopen", fail)
    with pytest.raises(PlaceSourceError):
        adapter().list_places("yogyakarta")


def test_expired_cache_does_not_hide_outage(monkeypatch):
    place = LocalPlaceRepository().list_places("yogyakarta")[0]
    monkeypatch.setattr(
        "app.repositories.supabase_places.urlopen",
        lambda *a, **k: FakeResponse([{"place": place.model_dump(mode="json")}]),
    )
    repo = adapter(view="public.saved_places")
    assert repo.list_places("yogyakarta")
    repo._expires = 0

    def fail(*args, **kwargs):
        raise TimeoutError("test timeout")

    monkeypatch.setattr("app.repositories.supabase_places.urlopen", fail)
    with pytest.raises(PlaceSourceError):
        repo.list_places("yogyakarta")


def test_empty_catalog_is_unavailable_without_local_substitution(monkeypatch):
    from fastapi.testclient import TestClient
    from app.config import Settings
    from app.main import create_app

    monkeypatch.setattr(
        "app.repositories.supabase_places.urlopen", lambda *a, **k: FakeResponse([])
    )
    client = TestClient(
        create_app(
            Settings(
                _env_file=None,
                place_source="supabase",
                supabase_url="https://example.supabase.co",
                supabase_anon_key="sb_publishable_test",
                supabase_places_view="approved_places_view",
                supabase_dataset_version="test-v1",
            )
        )
    )
    response = client.get("/api/v1/places")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "PLACE_SOURCE_UNAVAILABLE"
    assert "places" not in response.json()
