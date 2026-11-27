"""Read-only, separately versioned Jabodetabek discovery sample."""

import json
from datetime import date
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request

from fastapi import APIRouter, HTTPException, Query, Request as ApiRequest
from pydantic import Field

from app.models.contracts import Contract
from app.repositories.supabase_places import urlopen

router = APIRouter()
Area = Literal["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"]
Kind = Literal["attraction", "food", "lodging"]


class DemoPlace(Contract):
    id: str
    demo_version: Literal["jabodetabek-demo-v1"]
    metro_area: Area
    kind: Kind
    name: str
    address: str
    source_url: str
    checked_on: date
    coordinates: dict | None
    opening_hours: dict | None
    ticket_price_idr: int | None = Field(default=None, ge=0)


class DemoPlacesResponse(Contract):
    places: list[DemoPlace]
    datasetVersion: Literal["jabodetabek-demo-v1"]
    complete: Literal[False] = False


@router.get("/demo/places", response_model=DemoPlacesResponse)
def list_demo_places(
    request: ApiRequest,
    area: Area | None = None,
    kind: Kind | None = None,
    q: str = Query("", max_length=100),
):
    settings = request.app.state.settings
    parsed = urlsplit(settings.supabase_url)
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or parsed.path.strip("/")
        or parsed.query
        or parsed.fragment
        or not settings.supabase_anon_key
        or settings.supabase_anon_key.startswith("sb_secret_")
    ):
        raise HTTPException(503, "Katalog demo Supabase belum dikonfigurasi")
    params = {"select": "*", "demo_version": "eq.jabodetabek-demo-v1", "limit": "100"}
    if area:
        params["metro_area"] = f"eq.{area}"
    if kind:
        params["kind"] = f"eq.{kind}"
    endpoint = f"{settings.supabase_url.rstrip('/')}/rest/v1/tripin_demo_places?{urlencode(params)}"
    headers = {"apikey": settings.supabase_anon_key, "Accept": "application/json"}
    if settings.supabase_anon_key.count(".") == 2:
        headers["Authorization"] = f"Bearer {settings.supabase_anon_key}"
    try:
        with urlopen(Request(endpoint, headers=headers), timeout=6) as response:
            raw = response.read(200_001)
        if len(raw) > 200_000:
            raise ValueError("response too large")
        rows = json.loads(raw)
        if not isinstance(rows, list) or len(rows) >= 100:
            raise ValueError("invalid or truncated catalog")
        places = [DemoPlace.model_validate(row) for row in rows]
    except (HTTPError, URLError, OSError, TimeoutError, ValueError) as exc:
        raise HTTPException(503, "Katalog demo Supabase tidak tersedia") from exc
    if q:
        term = q.casefold()
        places = [p for p in places if term in f"{p.name} {p.address}".casefold()]
    return DemoPlacesResponse(places=places, datasetVersion="jabodetabek-demo-v1")
