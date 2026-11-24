# Yogyakarta pilot v0.1.0 — dataset foundation

Reviewed 24 November 2026 from the sources below. Four seed candidates only, NOT a
planning-ready catalog. No ratings, operating hours, prices, provider IDs, or UMKM status
are claimed. Existence/name/address checks do not establish current opening/availability.

| ID | Source checked | Confirmed scope | Missing |
|---|---|---|---|
| yog-museum-kereta | https://jogjacagar.jogjaprov.go.id/detail/1322/museum-kereta-kraton-yogyakarta | Name, address, published coordinates -7.805456, 110.362751; museum/cultural attraction | Current operational status, hours, tariff |
| yog-kedhaton | https://tourism.kratonjogja.id/id-ID/destination/3-kagungan-dalem-kedhaton/ | Identity/address, cultural museum | Coordinates, hours, tariff |
| yog-gudeg-yu-djum-pusat | https://gudegyudjumpusat.com/ | Identity/address of Mbarek outlet; food | Coordinates, hours, meal estimates, local-business classification |
| yog-phoenix | https://all.accor.com/hotel/5451/index.en.shtml | Identity/address; lodging | Coordinates, room rates, capacity, check-in constraints |

All visit durations (60 minutes) are explicit EDITORIAL planning estimates, not checked
provider facts. Evidence timestamps record review date; no freshness guarantee is implied.
Coordinates absent from checked sources remain null. Future retrieval must exclude these
from routable candidates until verified, not substitute city-center coordinates.
Museum Kereta must have current operating/closure status checked before scheduling.
The hotel is not asserted to be budget-compatible or available. No booking integration.

Before Phase 2: source missing coordinates, actual applicable tariffs and opening windows;
add lodging capacity/check-in information, transport estimates and curated travel matrix.
Keep unknown data conditional. Expand only after the initial records are complete.
# Added in v0.2.0

The active catalog is `yogyakarta-v0.2.0.json`, loaded only through LocalPlaceRepository.
v0.1.0 remains an archival fixture source; it is not merged into the live catalog.
Nine records, seven with sourced coordinates; all business classifications remain null.

| Added/enriched ID | Source | Scope of evidence |
|---|---|---|
| yog-vredeburg | https://jogjacagar.jogjaprov.go.id/detail/4327/benteng-vredeburg | Published identity and coordinates; current hours/price unknown |
| yog-ibis-styles | https://all.accor.com/hotel/7460/index.en.shtml | Identity and published GPS; no booking/rate/availability assertion |
| yog-phoenix | https://all.accor.com/hotel/5451/index.en.shtml | Enriched with official published GPS |
| yog-sonobudoyo | https://repositori.kemendikdasmen.go.id/26873/1/Katalog%20museum%20NAsional%20Jilid%202.pdf | Published Unit I coordinates, converted from DMS; historical catalog |
| yog-sonobudoyo | https://www.indonesia.travel/id/id/destination/java/yogyakarta/museum-sonobudoyo | Published domestic adult tariff 10,000 IDR; Tue–Sun 08:00–21:00; verify before visit |
| yog-bebek-cak-koting, yog-malioboro | https://repo.unwim.ac.id/1096/1/715-Article%20Text-3276-1-10-20240527.pdf | Published primary research table of tourism points, 2024; not live provider data |

Review date: 24 November 2026. Source checks verify what was published, not current field
conditions. Academic point precision, business existence/operational status, museum closures
and tariff applicability need field confirmation. No Google Maps database was scraped.
Coordinates from hotel pages were read as published text, not fetched from map APIs.
No ratings/photos/text descriptions were copied. All 60-minute visit durations remain
editorial estimates, and unknown price/hour fields stay null. UMKM eligibility is not inferred.

Haversine travel requires no external routing requests. Leaflet uses standard OpenStreetMap
tiles with attribution: https://www.openstreetmap.org/copyright . Respect tile usage policy;
no prefetch/offline bulk downloads. Static curated data is a small sourced factual compilation;
source content and photos are not redistributed. Runtime does not scrape these sites.
