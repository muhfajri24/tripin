from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="TRPIN_", env_file=".env", extra="ignore"
    )
    app_name: str = "TRIPIN Guest Planner"
    place_source: str = "local"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_places_view: str = ""
    supabase_dataset_version: str = ""

    @field_validator("place_source")
    @classmethod
    def known_place_source(cls, value):
        if value not in {"local", "supabase"}:
            raise ValueError("place_source must be local or supabase")
        return value
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    @field_validator("cors_origins")
    @classmethod
    def explicit_origins(cls, values):
        from urllib.parse import urlsplit

        for v in values:
            u = urlsplit(v)
            if (
                u.scheme not in {"http", "https"}
                or not u.netloc
                or u.path
                or u.query
                or u.fragment
                or u.username
                or "*" in v
            ):
                raise ValueError("CORS requires explicit http(s) origins without paths")
        return values
