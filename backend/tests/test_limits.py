from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app


def test_body_limit_and_cors():
    client = TestClient(create_app(Settings(_env_file=None)))
    response = client.post(
        "/api/v1/requests/parse",
        content=b"x" * 262145,
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_rate_limit_has_canonical_response():
    client = TestClient(create_app(Settings(_env_file=None)))
    for _ in range(30):
        assert (
            client.post("/api/v1/requests/parse", json={"text": "Jogja"}).status_code
            == 200
        )
    response = client.post("/api/v1/requests/parse", json={"text": "Jogja"})
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert client.get("/api/v1/health").status_code == 200


def test_streamed_body_limit_without_content_length():
    import asyncio
    import json
    from app.limits import GuestLimits

    messages = iter(
        [
            {"type": "http.request", "body": b"12345", "more_body": True},
            {"type": "http.request", "body": b"67890", "more_body": False},
        ]
    )
    sent = []

    async def receive():
        return next(messages)

    async def send(message):
        sent.append(message)

    async def unreachable(*args):
        raise AssertionError("oversized body reached application")

    scope = {
        "type": "http",
        "method": "POST",
        "headers": [],
        "client": ("127.0.0.1", 1234),
    }
    asyncio.run(GuestLimits(unreachable, max_body_bytes=8)(scope, receive, send))
    assert sent[0]["status"] == 413
    data = json.loads(sent[1]["body"])
    assert data["error"]["code"] == "REQUEST_TOO_LARGE"
    assert data["requestId"]


def test_rate_window_expires_and_forwarded_header_cannot_bypass(monkeypatch):
    now = [100.0]
    monkeypatch.setattr("app.limits.monotonic", lambda: now[0])
    client = TestClient(create_app(Settings(_env_file=None)))
    for _ in range(30):
        assert (
            client.post("/api/v1/requests/parse", json={"text": "Jogja"}).status_code
            == 200
        )
    assert (
        client.post(
            "/api/v1/requests/parse",
            json={"text": "Jogja"},
            headers={"X-Forwarded-For": "203.0.113.5"},
        ).status_code
        == 429
    )
    now[0] += 61
    assert (
        client.post("/api/v1/requests/parse", json={"text": "Jogja"}).status_code == 200
    )
