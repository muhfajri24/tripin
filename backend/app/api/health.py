from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    phase: Literal["guest_mvp"] = "guest_mvp"
    version: str = "0.2.0"


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse()
