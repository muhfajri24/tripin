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
    for payload in ([{"wrong": {}}], [{"place": {"id": "not-complete"}}], {"place": []}):
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
