from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import Settings
from .api.health import router
from .errors import install_error_handlers
from .api.planner import router as planner_router
from .repositories.places import LocalPlaceRepository


def create_app(settings: Settings | None = None):
    settings = settings or Settings()
    application = FastAPI(title=settings.app_name, version="0.2.0")
    install_error_handlers(application)
    application.include_router(router, prefix="/api/v1")
    if settings.place_source != "local":
        raise ValueError(
            "Supabase integration pending finalized schema; use TRPIN_PLACE_SOURCE=local"
        )
    application.state.places = LocalPlaceRepository()
    application.include_router(planner_router, prefix="/api/v1")
    # Outer middleware ensures CORS headers also appear on unhandled 500 responses.
    return CORSMiddleware(
        application,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        expose_headers=["X-Request-ID"],
    )


app = create_app()
