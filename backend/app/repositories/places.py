"""Only the repository knows the catalog source. No Supabase schema assumptions."""

from pathlib import Path
from typing import Protocol
from app.models import Place, PilotDataset


class PlaceRepository(Protocol):
    version: str

    def list_places(
        self, destination_id: str, query: str = "", kind: str | None = None
    ) -> list[Place]: ...
    def get_place(self, place_id: str) -> Place | None: ...
    def list_lodging(self, destination_id: str) -> list[Place]: ...
    def get_place_evidence(self, place_id: str) -> dict: ...


class LocalPlaceRepository:
    def __init__(self, path: Path | None = None):
        path = (
            path
            or Path(__file__).resolve().parents[1] / "data" / "yogyakarta-v0.2.0.json"
        )
        self.dataset = PilotDataset.model_validate_json(
            path.read_text(encoding="utf-8")
        )
        self.version = self.dataset.datasetVersion

    def list_places(self, destination_id, query="", kind=None):
        return [
            p.model_copy(deep=True)
            for p in self.dataset.places
            if p.destinationId == destination_id
            and (not kind or p.kind == kind)
            and query.casefold()
            in (
                p.name + " " + (p.address or "") + " " + " ".join(p.categories)
            ).casefold()
        ]

    def get_place(self, place_id):
        return next(
            (p.model_copy(deep=True) for p in self.dataset.places if p.id == place_id),
            None,
        )

    def list_lodging(self, destination_id):
        return self.list_places(destination_id, kind="lodging")

    def get_place_evidence(self, place_id):
        p = self.get_place(place_id)
        return (
            {}
            if p is None
            else {
                k: v
                for k, v in p.model_dump(mode="json").items()
                if k.endswith("Evidence")
            }
        )
