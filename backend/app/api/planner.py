from typing import Literal
from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import Field
from app.models.contracts import (
    Contract,
    TravelRequest,
    Itinerary,
    ReplanRequest,
    ReplanResult,
    Place,
    PeriodPreference,
    Coordinates,
    Id,
    Text,
)
from app.domain.parser import parse_brief
from app.domain.planner import generate, replan, scope

router = APIRouter()


class ParseBody(Contract):
    text: str = Field(min_length=1, max_length=4000)
    locale: Literal["id-ID"] = "id-ID"


class ParseDraft(Contract):
    destinationId: Literal["yogyakarta"] | None = None
    unsupportedDestination: bool = False
    days: int | None = Field(default=None, ge=1, le=3)
    adults: int | None = Field(default=None, ge=1, le=6)
    budgetBasis: Literal["person", "group"] | None = None
    budgetAmountIdr: int | None = Field(default=None, gt=0)
    transportMode: Literal["driving"] | None = None
    startDate: str | None = None
    interests: list[str]
    periodPreferences: list[PeriodPreference]


class ParseResponse(Contract):
    draft: ParseDraft
    missingFields: list[str]
    ambiguities: list[str]
    parserSource: Literal["deterministic-id-v1"]


class PlanBody(Contract):
    request: TravelRequest


class PlanResponse(Contract):
    itinerary: Itinerary | None
    conflicts: list[str]
    searchOutcome: Literal["plan_found", "no_plan_found"]


class PlacesResponse(Contract):
    places: list[Place]
    datasetVersion: str
    warnings: list[str]


class DestinationLookupResponse(Contract):
    destinationId: Id
    name: Text
    center: Coordinates
    places: list[Place]
    datasetVersion: str


@router.get("/destinations/lookup", response_model=DestinationLookupResponse)
def lookup_destination(request: Request, q: str = Query(min_length=2, max_length=100)):
    repo = request.app.state.places
    result = repo.lookup(q)
    return {**result, "datasetVersion": repo.version_for(result["destinationId"])}


@router.get("/places", response_model=PlacesResponse)
def places(
    request: Request,
    destinationId: str = Query(
        "yogyakarta", max_length=100, pattern=r"^(?:yogyakarta|osm--?\d+_-?\d+)$"
    ),
    q: str = Query("", max_length=100),
    kind: Literal["attraction", "food", "local_business", "lodging"] | None = None,
    routable: bool = False,
):
    repo = request.app.state.places
    data = repo.list_places(destinationId, q, kind)
    if routable:
        data = [p for p in data if scope(p.coordinates, destinationId)]
    return PlacesResponse(
        places=data,
        datasetVersion=repo.version_for(destinationId)
        if hasattr(repo, "version_for")
        else repo.version,
        warnings=[
            "Data OpenStreetMap berdasarkan pencarian pengguna; harga dan jam buka yang tidak diketahui tetap unknown."
            if destinationId != "yogyakarta"
            else "Pilot Yogyakarta. Metadata belum lengkap tetap unknown; sumber bukan jaminan kondisi saat ini."
        ],
    )


@router.get("/places/{place_id}", response_model=Place)
def place(place_id: str, request: Request):
    p = request.app.state.places.get_place(place_id)
    if p is None:
        raise HTTPException(404, "Tempat tidak ditemukan")
    return p


@router.post(
    "/requests/parse", response_model=ParseResponse, response_model_exclude_none=True
)
def parse(body: ParseBody):
    return parse_brief(body.text)


@router.post("/itineraries/plan", response_model=PlanResponse)
def plan(body: PlanBody, request: Request):
    repo = request.app.state.places
    repo = repo.snapshot() if hasattr(repo, "snapshot") else repo
    itinerary, errors = generate(body.request, repo)
    return PlanResponse(
        itinerary=itinerary,
        conflicts=errors,
        searchOutcome="plan_found" if itinerary else "no_plan_found",
    )


@router.post("/itineraries/replan", response_model=ReplanResult)
def repair(body: ReplanRequest, request: Request):
    repo = request.app.state.places
    repo = repo.snapshot() if hasattr(repo, "snapshot") else repo
    return replan(body, repo)
