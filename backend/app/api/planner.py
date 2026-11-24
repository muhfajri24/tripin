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
    days: int | None = None
    adults: int | None = None
    budgetBasis: Literal["person", "group"] | None = None
    budgetAmountIdr: int | None = None
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


@router.get("/places", response_model=PlacesResponse)
def places(
    request: Request,
    destinationId: Literal["yogyakarta"] = "yogyakarta",
    q: str = Query("", max_length=100),
    kind: Literal["attraction", "food", "local_business", "lodging"] | None = None,
    routable: bool = False,
):
    repo = request.app.state.places
    data = repo.list_places(destinationId, q, kind)
    if routable:
        data = [p for p in data if scope(p.coordinates)]
    return PlacesResponse(
        places=data,
        datasetVersion=repo.version,
        warnings=[
            "Pilot Yogyakarta. Metadata belum lengkap tetap unknown; sumber bukan jaminan kondisi saat ini."
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
    itinerary, errors = generate(body.request, request.app.state.places)
    return PlanResponse(
        itinerary=itinerary,
        conflicts=errors,
        searchOutcome="plan_found" if itinerary else "no_plan_found",
    )


@router.post("/itineraries/replan", response_model=ReplanResult)
def repair(body: ReplanRequest, request: Request):
    return replan(body, request.app.state.places)
