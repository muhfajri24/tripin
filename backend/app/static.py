"""Optional same-origin local competition build, with explicit SPA fallback."""

from pathlib import Path
from starlette.staticfiles import StaticFiles
from starlette.exceptions import HTTPException

FRONTEND_BUILD = Path(__file__).resolve().parents[2] / "frontend" / "build"


class SPAFiles(StaticFiles):
    async def get_response(self, path, scope):
        path = path.replace("\\", "/")
        if path == "api" or path.startswith("api/"):
            raise HTTPException(404, "API endpoint tidak ditemukan")
        try:
            response = await super().get_response(path, scope)
            if path in {"", ".", "index.html"}:
                response.headers["Cache-Control"] = "no-store"
            return response
        except HTTPException as exc:
            if exc.status_code != 404 or "." in path.rsplit("/", 1)[-1]:
                raise
            response = await super().get_response("index.html", scope)
            response.headers["Cache-Control"] = "no-store"
            return response


def install_frontend(app):
    if not (FRONTEND_BUILD / "index.html").is_file():
        raise ValueError("Frontend build missing; run npm run build in frontend first")
    app.mount("/", SPAFiles(directory=FRONTEND_BUILD, html=True), name="guest-frontend")
