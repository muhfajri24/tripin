import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import create_app
from app.config import Settings
from app.models import TravelRequest


@pytest.fixture
def client():
    wrapped = create_app(Settings(_env_file=None))
    app = wrapped.app

    @app.post("/test-validation")
    def validate(payload: TravelRequest):
        return payload

    @app.get("/test-error")
    def error():
        raise RuntimeError("private secret")

    return TestClient(wrapped, raise_server_exceptions=False)


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "phase": "guest_mvp", "version": "0.2.0"}
    assert r.headers["x-request-id"]


def test_invalid_request(client):
    r = client.post("/test-validation", json={})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "INVALID_REQUEST"
    assert r.json()["error"]["fields"]


def test_not_found(client):
    r = client.get("/missing")
    assert r.status_code == 404
    assert r.json()["requestId"] == r.headers["x-request-id"]


def test_safe_error(client):
    r = client.get("/test-error", headers={"Origin": "http://localhost:3000"})
    assert r.status_code == 500
    assert "private secret" not in r.text
    assert r.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors(client):
    for origin, allowed in [
        ("http://localhost:3000", True),
        ("https://untrusted.invalid", False),
    ]:
        r = client.options(
            "/api/v1/health",
            headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
        )
        assert ("access-control-allow-origin" in r.headers) == allowed


def test_settings(monkeypatch):
    monkeypatch.setenv("TRPIN_CORS_ORIGINS", '["http://localhost:4000"]')
    assert Settings(_env_file=None).cors_origins == ["http://localhost:4000"]
    with pytest.raises(ValidationError):
        Settings(cors_origins=["*"], _env_file=None)
