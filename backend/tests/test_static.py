from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app


def test_spa_fallback_never_hides_api_or_asset_errors(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text("<html>guest build</html>")
    monkeypatch.setattr("app.static.FRONTEND_BUILD", tmp_path)
    client = TestClient(create_app(Settings(_env_file=None, serve_frontend=True)))
    assert "guest build" in client.get("/itinerary/demo/edit").text
    assert client.get("/itinerary/demo/edit").headers["cache-control"] == "no-store"
    assert client.get("/").headers["cache-control"] == "no-store"
    assert client.get("/static/missing.js").status_code == 404
    assert client.get("/api/v1/missing").status_code == 404
    assert client.get("/api/v1/health").status_code == 200
