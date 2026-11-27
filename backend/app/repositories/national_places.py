"""User-triggered, bounded OpenStreetMap catalog for Indonesian trip planning.

OSM supplies identity and approximate coordinates. Opening hours, admission and
hotel rates remain unknown unless the user supplies cost estimates.
"""

import json
import re
import time
from pathlib import Path
from threading import Lock
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.models import Place
from app.domain.planner import scope

USER_AGENT = "TripinTravelPlanner/1.0 (https://github.com/muhfajri24/tripin)"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
DESTINATION = re.compile(r"^osm-(-?\d+)_(-?\d+)$")


class NationalCatalogError(RuntimeError):
    pass


class DestinationNotFound(NationalCatalogError):
    pass


def _json_request(url, data=None, timeout=12):
    request = Request(
        url, data=data, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read(2_000_001)
    except Exception as exc:
        raise NationalCatalogError(
            "Sumber OpenStreetMap sedang tidak tersedia. Coba lagi nanti."
        ) from exc
    if len(raw) > 2_000_000:
        raise NationalCatalogError("Respons katalog terlalu besar.")
    try:
        return json.loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise NationalCatalogError("Respons katalog tidak valid.") from exc


def _destination_center(destination_id):
    match = DESTINATION.fullmatch(destination_id)
    if not match:
        raise NationalCatalogError("ID daerah tidak valid.")
    lat, lng = int(match[1]) / 100000, int(match[2]) / 100000
    if not (-11.5 <= lat <= 6.5 and 94 <= lng <= 142):
        raise NationalCatalogError("Daerah di luar Indonesia.")
    return lat, lng


def _unknown(source="provider"):
    return {
        "sourceType": source,
        "sourceRef": None,
        "checkedAt": None,
        "status": "unverified",
    }


def _estimated(ref):
    return {
        "sourceType": "provider",
        "sourceRef": ref,
        "checkedAt": None,
        "status": "estimated",
    }


def _convert(element, destination_id):
    tags = element.get("tags") or {}
    name = tags.get("name")
    center = element.get("center") or element
    if (
        not isinstance(name, str)
        or not name.strip()
        or "lat" not in center
        or "lon" not in center
    ):
        return None
    tourism = tags.get("tourism", "")
    amenity = tags.get("amenity", "")
    if tourism in {"hotel", "guest_house", "hostel", "motel"}:
        kind, categories, duration, basis = "lodging", ["lodging"], 1, "room_night"
    elif amenity in {"restaurant", "cafe", "fast_food"}:
        kind, categories, duration, basis = "food", ["food"], 60, "person"
    elif tourism in {"attraction", "museum", "viewpoint", "zoo", "theme_park"}:
        kind = "attraction"
        categories = (
            ["culture", "attraction"]
            if tourism == "museum"
            else ["nature", "attraction"]
            if tourism == "viewpoint"
            else ["attraction"]
        )
        duration, basis = 90, "person"
    else:
        return None
    osm_type = element.get("type")
    osm_id = element.get("id")
    if osm_type not in {"node", "way", "relation"} or not isinstance(osm_id, int):
        return None
    ref = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"
    address = (
        tags.get("addr:full")
        or ", ".join(filter(None, [tags.get("addr:street"), tags.get("addr:city")]))
        or None
    )
    try:
        return Place.model_validate(
            {
                "id": f"osm-{osm_type}-{osm_id}",
                "name": name.strip()[:1000],
                "destinationId": destination_id,
                "coordinates": {
                    "lat": float(center["lat"]),
                    "lng": float(center["lon"]),
                },
                "address": address[:1000] if address else None,
                "categories": categories,
                "kind": kind,
                "visitDurationMin": duration,
                "durationEvidence": _estimated(
                    "Planning estimate; not an OSM visit duration"
                ),
                "openingWindows": None,
                "dateExceptions": [],
                "prices": [{"amountIdr": None, "basis": basis, "evidence": _unknown()}],
                "openingEvidence": _unknown(),
                "locationEvidence": _estimated(ref),
                "identityEvidence": _estimated(ref),
                "isLocalBusiness": None,
                "localBusinessEvidence": _unknown(),
                "googlePlaceId": None,
            }
        )
    except (ValueError, TypeError):
        return None


class NationalPlaceRepository:
    """Wraps the canonical catalog; never substitutes OSM for a failed canonical source."""

    def __init__(self, base, use_seed=True):
        self.base = base
        self.version = base.version
        self._cache = {}
        self._lock = Lock()
        self._geocode_cache = {}
        self._last_geocode = 0.0
        self._live_calls = []
        self._seed_names = {}
        self._seed_ids = set()
        seed_path = (
            Path(__file__).resolve().parents[1] / "data" / "national-osm-snapshot.json"
        )
        if use_seed and seed_path.exists():
            snapshot = json.loads(seed_path.read_text(encoding="utf-8"))
            for entry in snapshot.get("destinations", []):
                destination_id = entry["destinationId"]
                places = [Place.model_validate(p) for p in entry["places"]]
                self._cache[destination_id] = (float("inf"), places)
                self._seed_ids.add(destination_id)
                self._seed_names[entry["name"].casefold()] = {
                    "destinationId": destination_id,
                    "name": entry["name"],
                    "center": entry["center"],
                    "places": [p.model_copy(deep=True) for p in places],
                }

    def version_for(self, destination_id):
        return (
            self.base.version
            if destination_id == "yogyakarta"
            else "osm_snapshot_20261127"
            if destination_id in self._seed_ids
            else "osm_user_query_v1"
        )

    def _check_live_budget(self):
        now = time.monotonic()
        self._live_calls = [stamp for stamp in self._live_calls if now - stamp < 3600]
        if len(self._live_calls) >= 80:
            raise NationalCatalogError(
                "Batas pencarian daerah sementara tercapai. Coba lagi nanti."
            )
        self._live_calls.append(now)

    def lookup(self, name):
        name = name.strip()
        if not 2 <= len(name) <= 100:
            raise NationalCatalogError("Isi nama kota atau daerah di Indonesia.")
        if name.casefold() in {"yogyakarta", "jogja", "yogya"}:
            return {
                "destinationId": "yogyakarta",
                "name": "Yogyakarta",
                "center": {"lat": -7.7956, "lng": 110.3695},
                "places": self.list_places("yogyakarta"),
            }
        key = name.casefold()
        if key in self._seed_names:
            return self._seed_names[key]
        with self._lock:
            if key in self._geocode_cache:
                result = self._geocode_cache[key]
            else:
                remaining = 1.0 - (time.monotonic() - self._last_geocode)
                if remaining > 0:
                    time.sleep(remaining)
                self._last_geocode = time.monotonic()
                self._check_live_budget()
                query = urlencode(
                    {
                        "q": name,
                        "countrycodes": "id",
                        "format": "jsonv2",
                        "addressdetails": 1,
                        "limit": 1,
                    }
                )
                data = _json_request(f"{NOMINATIM}?{query}")
                result = data[0] if isinstance(data, list) and data else None
                self._geocode_cache[key] = result
        if not result or result.get("address", {}).get("country_code") != "id":
            raise DestinationNotFound("Daerah tidak ditemukan di Indonesia.")
        lat, lng = float(result["lat"]), float(result["lon"])
        destination_id = f"osm-{round(lat * 100000)}_{round(lng * 100000)}"
        places = self.list_places(destination_id)
        return {
            "destinationId": destination_id,
            "name": result.get("name") or name,
            "center": {"lat": lat, "lng": lng},
            "places": places,
        }

    def list_places(self, destination_id, query="", kind=None):
        if destination_id == "yogyakarta":
            return self.base.list_places(destination_id, query, kind)
        lat, lng = _destination_center(destination_id)
        with self._lock:
            cached = self._cache.get(destination_id)
            if cached and cached[0] > time.monotonic():
                places = cached[1]
            else:
                around = f"(around:5000,{lat:.5f},{lng:.5f})"
                osm_query = (
                    "[out:json][timeout:18];"
                    f'nwr{around}[name][tourism~"^(attraction|museum|viewpoint|zoo|theme_park)$"];out center 70;'
                    f'nwr{around}[name][amenity~"^(restaurant|cafe|fast_food)$"];out center 50;'
                    f'nwr{around}[name][tourism~"^(hotel|guest_house|hostel|motel)$"];out center 40;'
                )
                last_error = None
                for endpoint in OVERPASS:
                    try:
                        self._check_live_budget()
                        data = _json_request(
                            endpoint,
                            urlencode({"data": osm_query}).encode(),
                            timeout=23,
                        )
                        break
                    except NationalCatalogError as exc:
                        last_error = exc
                else:
                    raise last_error
                if not isinstance(data, dict) or not isinstance(
                    data.get("elements"), list
                ):
                    raise NationalCatalogError("Katalog daerah tidak valid.")
                by_id = {}
                for element in data["elements"]:
                    place = _convert(element, destination_id)
                    if place and scope(place.coordinates, destination_id):
                        by_id[place.id] = place
                places = list(by_id.values())
                if not any(p.kind != "lodging" for p in places):
                    raise DestinationNotFound(
                        "Belum ada tempat wisata yang cukup untuk daerah ini."
                    )
                self._cache[destination_id] = (time.monotonic() + 3600, places)
        words = query.casefold()
        return [
            p.model_copy(deep=True)
            for p in places
            if (not kind or p.kind == kind)
            and words
            in (
                p.name + " " + (p.address or "") + " " + " ".join(p.categories)
            ).casefold()
        ]

    def get_place(self, place_id):
        if not place_id.startswith("osm-"):
            return self.base.get_place(place_id)
        for _, places in self._cache.values():
            for place in places:
                if place.id == place_id:
                    return place.model_copy(deep=True)
        return None

    def list_lodging(self, destination_id):
        return self.list_places(destination_id, kind="lodging")

    def get_place_evidence(self, place_id):
        place = self.get_place(place_id)
        return (
            {}
            if place is None
            else {
                k: v
                for k, v in place.model_dump(mode="json").items()
                if k.endswith("Evidence")
            }
        )
