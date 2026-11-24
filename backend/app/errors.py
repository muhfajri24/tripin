import logging
from uuid import uuid4
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from fastapi.responses import JSONResponse
from app.repositories.supabase_places import PlaceSourceError

logger = logging.getLogger(__name__)


def install_error_handlers(app):
    @app.middleware("http")
    async def request_id(request, call_next):
        request.state.request_id = str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    def error(request, status, code, message, fields=None, headers=None):
        rid = getattr(request.state, "request_id", str(uuid4()))
        return JSONResponse(
            status_code=status,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "fields": fields or {},
                    "retryable": status >= 500,
                },
                "requestId": rid,
            },
            headers={**(headers or {}), "X-Request-ID": rid},
        )

    @app.exception_handler(RequestValidationError)
    async def validation(request, exc):
        if any("expectedRevision differs" in e["msg"] for e in exc.errors()):
            return error(
                request,
                409,
                "REVISION_CONFLICT",
                "Revisi request tidak sama dengan snapshot itinerary",
            )
        return error(
            request,
            422,
            "INVALID_REQUEST",
            "Request validation failed",
            {".".join(map(str, e["loc"])): e["msg"] for e in exc.errors()},
        )

    @app.exception_handler(HTTPException)
    async def http(request, exc):
        return error(
            request, exc.status_code, "HTTP_ERROR", str(exc.detail), headers=exc.headers
        )

    @app.exception_handler(PlaceSourceError)
    async def place_source_unavailable(request, exc):
        logger.warning("Place repository unavailable: %s", exc)
        return error(request, 503, "PLACE_SOURCE_UNAVAILABLE", "Sumber data tempat tidak tersedia. Periksa koneksi atau pengaturan database.")

    @app.exception_handler(Exception)
    async def unexpected(request, exc):
        logger.error("Unhandled request error", exc_info=exc)
        return error(request, 500, "INTERNAL_ERROR", "Unexpected server error")
