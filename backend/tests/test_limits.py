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
