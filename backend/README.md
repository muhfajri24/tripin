# TRIPIN backend — guest MVP

FastAPI/Pydantic modular backend. Python 3.11+, no database or paid service required.

## Startup and test (PowerShell)

From repository root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.txt
cd backend
.venv/Scripts/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```

Inside backend: `.venv/Scripts/python -m pytest -q` and
`.venv/Scripts/python -m scripts.export_schemas`. Linux/macOS use `.venv/bin/python`.
Dependencies did not change from foundation. Full tested dependency snapshot is in
`requirements.lock.txt`; Starlette TestClient currently emits an httpx deprecation warning.

## API

- GET `/api/v1/health`: liveness, not verified data readiness.
- GET `/api/v1/places?destinationId=yogyakarta&q=...&kind=food&routable=true`:
  `{places,datasetVersion,warnings}`; query/kind/routable optional.
- GET `/api/v1/places/{id}`: canonical Place or 404.
- GET `/api/v1/destinations/lookup?q=Bandung`: resolves a user-entered Indonesian
  area and returns its destination ID, center and route candidates. Twelve area
  snapshots are bundled for offline use. Other areas use Nominatim and Overpass
  on demand; provider failure returns 503 rather than substituting another city.
- GET `/api/v1/demo/places?area=Depok&kind=attraction&q=Situ`: separate
  Jabodetabek discovery sample from `tripin_demo_places` in Supabase. Requires
  `TRPIN_SUPABASE_URL` and a publishable/anon read key even when the planner
  source is local. Returns `{places,datasetVersion,complete:false}`. This is
  not planner input; missing coordinates/hours/prices remain null. Without
  configuration or on upstream failure, returns 503.
- POST `/api/v1/requests/parse`: `{text,locale:"id-ID"}` -> draft/missingFields/ambiguities.
- POST `/api/v1/itineraries/plan`: `{request:TravelRequest}` ->
  `{itinerary:Itinerary|null,conflicts,searchOutcome}`.
- POST `/api/v1/itineraries/replan`: ReplanRequest -> ReplanResult.

See `/docs` for schemas and `contracts/schemas/` for reproducible exports. JSON Schema
expresses structure; Pydantic and domain validators also enforce cross-field constraints.
Errors: `{error:{code,message,fields,retryable},requestId}`; revision mismatch returns 409.
Valid but unsuccessful heuristic search returns 200 + no_plan_found, not a mathematical proof.

The parse draft feeds the frontend review form directly: unsupported day/adult counts,
zero budget and invalid calendar dates remain absent and appear in `missingFields`
with an explanation in `ambiguities`. Valid draft values are not silently clamped.
Editor selections must contain unique place IDs and locks must refer to selected
places (422 on invalid payloads). Removing every activity returns a replan conflict
without replacing the saved itinerary.

## Configuration

`TRPIN_APP_NAME`, JSON-array `TRPIN_CORS_ORIGINS`, `TRPIN_PLACE_SOURCE=local`.
Optional `.env` is read from the backend working directory. Default allowed origins are
localhost:3000 and 127.0.0.1:3000. Explicitly add another frontend origin if using another port.
Local mode requires no credentials. Supabase mode uses the configured public read key
and fails explicitly on source errors; it never silently substitutes the local catalog.

Verify the selected source and canonical parity from `backend`:

```powershell
.venv/Scripts/python -m scripts.check_place_source --compare-local
.venv/Scripts/python -m scripts.check_catalog_quality
```

For a built single-origin demo, run `npm ci` and `npm run build` in `frontend`, then
from `backend` run `.venv/Scripts/python -m scripts.serve_demo --source local --port 8015`.
Select `--source supabase` explicitly for live reads using the ignored local `.env`.
This is loopback HTTP; map tiles and Google Maps handoff still require internet.
Use `--check` to check build presence only. UI acceptance is tracked separately from startup.

## Domain rules

- IDs stable; integer IDR, strict coordinates (zero allowed), extra fields forbidden.
- Yogyakarta uses its pilot bounding rectangle. Other Indonesian destination IDs
  encode an area center; route candidates and anchors are limited to 30 km from it.
  Search is local to the chosen area and does not imply nationwide route coverage
  between cities.
- Dates consecutive, timezone Asia/Jakarta, 1–3 days, 1–6 adults, driving.
- Group budget normalized in totalIdr; originalBasis records original user input.
- 2–3 days require one chosen hotel with days-1 nights; no room availability/booking.
- Arrival/departure anchors each day; intermediate days start/end at lodging.
- First-day checkInAt is a user deadline to arrive at the hotel, not verified hotel policy.
- Four activities/day by automatic insertion; manually edited plans support up to six/day.
- Mandatory stops inserted first, optional candidates ranked/insertion-tested. Locks preserve
  place/day or place/time. Local search is bounded; no global optimum is claimed.
- Independent final validator checks overlap/travel/opening windows/day end/mandatory/budget.
- Price ledger uses first applicable catalog tariff (adult domestic pilot), quantities,
  room × nights once, and one all-in vehicle/day estimate. Food estimates apply to selected
  food visits only; no duplicate meal allowance. Unknown is null, zero is a genuine amount.
- User costAssumptions are estimates, not provider prices. Known total > available budget is
  rejected. Unknown costs prevent claiming full budget compliance.
- Haversine distance + 1.4 detour factor / 25 km/h + 5 minute buffer: explicitly heuristic.
  All real-catalog plans therefore show undetermined/conditional feasibility, even when
  all known constraints pass. They are not verified road-feasible itineraries.

## Replan

Delay/closure/remove/replace/edit use the same scheduler and final validator. Edit supplies
selectedPlaceIds (ordered within original day; new places default to day one), optional
updated request, and explicit locks. Date/duration changes require a new trip. Earlier and
completed activities are preserved, as are their ledger costs. Model does not track deposits
or cancellation fees; it never claims real refunds. Future mandatory/locked conflicts require
a user decision. Repaired means known constraints repaired, not uncertainty eliminated.

Client snapshots are structurally validated and canonical place data is loaded server-side.
Revision matching is snapshot consistency only; no server-side concurrency/persistence exists.
Guest itineraries are never stored server-side. Parser is free rule-based extraction and is
limited to explicit Indonesian patterns; no LLM, network fetching or unbounded scraping.

National discovery is triggered by explicit user search. Snapshot records come from
OpenStreetMap contributors under ODbL and are marked estimated/unverified as appropriate.
Live lookup uses a distinct User-Agent, serial calls and in-memory caching; the public
Nominatim service has a 1 request/second maximum and the public Overpass service may be
unavailable. Run one backend worker for this small demo. For sustained public traffic,
use a self-hosted or contracted data service and enforce a deployment-wide request quota.
`python -m scripts.smoke_national` verifies ten representative bundled areas, including overnight
hotel routing. `scripts.collect_national_snapshot` refreshes explicitly named areas
sequentially; refresh requires review of attribution, quality and service policy.

## Reproducible competition demo (one origin)

After `npm run build` in frontend, run from backend PowerShell:

```powershell
$env:TRPIN_PLACE_SOURCE='local'
$env:TRPIN_SERVE_FRONTEND='true'
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8015 --no-proxy-headers
```

Open http://127.0.0.1:8015. API and React build share an origin; SPA deep links fall back to index.html, unknown API/assets stay 404. No CRA server/proxy is required in this mode. Restart/rebuild after changes. This local HTTP target is not a public HTTPS deployment.

POST bodies are bounded to 256 KiB, including streamed bodies. A bounded, in-memory per-client-IP window permits 30 POST requests/minute and returns canonical 429/Retry-After. State is per process, resets at restart, is not a distributed DDoS control, and shared NAT/proxy clients share limits. Do not trust arbitrary forwarded IPs; configure trusted proxy behavior deliberately on deployment. The local command disables proxy header trust.

Source preflight: `.venv/Scripts/python -m scripts.check_place_source` (GET only, no key output). Live canonical source requires approved schema and least-privilege key; local success does not prove Supabase. HTTP evidence: `python -m scripts.smoke_http --base http://127.0.0.1:8015/api/v1 --output ../qa/release/http-smoke.json --snapshots ../qa/release/demo-snapshots.json`.

Python lint: `ruff check app tests scripts` and `ruff format --check app tests scripts` (sprint verified using Ruff 0.15.22 installed locally). Pytest remains the contract/behavior gate.
