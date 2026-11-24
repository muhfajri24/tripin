"""Read-only Supabase PostgREST adapter for a teammate-approved canonical view.

The view must expose one JSON/JSONB column called 'place' per row. The
contents of that column must match the existing Pydantic Place contract.
No database tables, schema, or RLS policies are created by this adapter.
"""

import json
import base64
from math import isfinite
from threading import Lock
from time import monotonic
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

from pydantic import ValidationError
from app.models import Place

_VIEW_NAME = re.compile(r"^[a-z_][a-z0-9_]*$")
_MAX_ROWS = 200


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


# Never forward an API key to another origin via HTTP redirects.
urlopen = build_opener(NoRedirect()).open


class PlaceSourceError(RuntimeError):
    """Configuration, connectivity or data-contract failure (never fail open)."""


class SupabasePlaceRepository:
    def __init__(
        self,
        *,
        url: str,
        api_key: str,
        view: str,
        dataset_version: str,
        timeout_seconds: float = 6.0,
    ):
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or not parsed.netloc
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or parsed.path.strip("/")
        ):
            raise ValueError("Supabase URL must be an https project origin")
        if not api_key or not api_key.strip():
            raise ValueError("Supabase public read key is required")
        view = view.removeprefix("public.")
        if not _VIEW_NAME.fullmatch(view):
            raise ValueError("Supabase view must be a simple lowercase SQL identifier")
        if not dataset_version or not dataset_version.strip():
            raise ValueError("Dataset version must be configured explicitly")
        if not isfinite(timeout_seconds) or not 0 < timeout_seconds <= 15:
            raise ValueError("Timeout must be positive")
        if api_key.startswith("sb_secret_"):
            raise ValueError(
                "Use a least-privilege public read key, never a secret key"
            )
        if api_key.count(".") == 2:
            try:
                payload = api_key.split(".")[1]
                role = json.loads(
                    base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
                ).get("role")
                if role != "anon":
                    raise ValueError("Legacy read key must use anon role")
            except (ValueError, TypeError, AttributeError) as exc:
                raise ValueError("Invalid public read key") from exc
        self._cache = None
        self._expires = 0
        self._lock = Lock()
        self.url = url.rstrip("/")
        self.api_key = api_key.strip()
        self.view = view
        self.version = dataset_version
        self.timeout_seconds = timeout_seconds

    def _load(self) -> list[Place]:
        with self._lock:
            if self._cache is None or monotonic() >= self._expires:
                self._cache = self._fetch()
                self._expires = monotonic() + 60
            return [p.model_copy(deep=True) for p in self._cache]

    def snapshot(self):
        # One validated immutable catalog per planning request, not one HTTP call per lookup.
        from .places import PlaceCatalog

        return PlaceCatalog(self._load(), self.version)

    def _fetch(self) -> list[Place]:
        # Only the team's approved view is queried, and only the 'place' field.
        # Never fetch tables containing user data or accept arbitrary SQL.
        endpoint = (
            f"{self.url}/rest/v1/{quote(self.view, safe='')}"
            f"?select=place&limit={_MAX_ROWS}"
        )
        headers = {
            "apikey": self.api_key,
            "Accept": "application/json",
            "Accept-Profile": "public",
        }
        # Legacy anon keys are JWTs; new publishable keys are not.
        if self.api_key.count(".") == 2:
            headers["Authorization"] = f"Bearer {self.api_key}"
        req = Request(endpoint, headers=headers)
        try:
            with urlopen(req, timeout=self.timeout_seconds) as response:
                raw = response.read(2_000_001)
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            raise PlaceSourceError("Supabase places source unavailable") from exc

        if len(raw) > 2_000_000:
            raise PlaceSourceError("Supabase response exceeded safety limit")
        try:
            rows = json.loads(raw)
            if not isinstance(rows, list):
                raise ValueError("Expected list")
            if len(rows) >= _MAX_ROWS:
                raise PlaceSourceError(
                    "Supabase result reached row limit; paging is required"
                )
            places = []
            ids = set()
            for row in rows:
                if not isinstance(row, dict) or not isinstance(row.get("place"), dict):
                    raise ValueError(
                        "Expected each row to contain canonical JSON 'place'"
                    )
                place = Place.model_validate(row["place"])
                if place.id in ids:
                    raise ValueError("Duplicate place ID")
                ids.add(place.id)
                places.append(place)
            return places
        except (ValueError, TypeError, ValidationError) as exc:
            raise PlaceSourceError(
                "Supabase places do not match the canonical contract"
            ) from exc

    def list_places(
        self, destination_id: str, query: str = "", kind: str | None = None
    ) -> list[Place]:
        results = []
        for p in self._load():
            if p.destinationId != destination_id or (kind and p.kind != kind):
                continue
            searchable = (
                f"{p.name} {p.address or ''} {' '.join(p.categories)}".casefold()
            )
            if query.casefold() in searchable:
                results.append(p)
        return results

    def get_place(self, place_id: str) -> Place | None:
        return next((p for p in self._load() if p.id == place_id), None)

    def list_lodging(self, destination_id: str) -> list[Place]:
        return self.list_places(destination_id, kind="lodging")

    def get_place_evidence(self, place_id: str) -> dict:
        place = self.get_place(place_id)
        return (
            {
                k: v
                for k, v in place.model_dump(mode="json").items()
                if k.endswith("Evidence")
            }
            if place
            else {}
        )
