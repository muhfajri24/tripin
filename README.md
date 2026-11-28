# TRIPIN — Guest adaptive travel planner

Guest-access planner for Indonesian cities and regions, 1–3 days, driving. Twelve areas
across the archipelago have offline OpenStreetMap snapshots; other Indonesian areas
are queried on demand. No account, booking, paid AI, Google Places or Google Routes key
is required. Estimates and unknown metadata are explicit.

## Run locally

Two terminals from repository root:

```powershell
# Frontend
cd frontend
npm ci
npm start
```

```powershell
# Backend (Python 3.11+)
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.txt
cd backend
.venv/Scripts/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```

Frontend: http://localhost:3000. API health: http://127.0.0.1:8011/api/v1/health.
API docs: http://127.0.0.1:8011/docs. CRA development proxy forwards `/api/v1` to port 8011.
If that port is occupied by an older backend, stop/restart your own backend or use another
port and set `REACT_APP_API_URL` in `frontend/.env.local`, plus explicit backend CORS origins.
Do not stop unrelated processes.

## Supported workflow

Brief -> deterministic Indonesian parser -> editable review -> backend candidate repository
-> bounded constraint-aware planning -> schedule/ledger/map -> edit or delay/closure replan
-> local save/delete -> Google Maps sequential route segments.

Navigation: Home, Plan a Trip, My Trips, Explore Indonesia. Legacy dashboard/settings/saved
URLs redirect to guest pages. Prototype data files are retained for reference but are not
imported by the active guest workflow. Existing fictional demo itineraries are not migrated.

## Tests

```powershell
cd frontend
npm test -- --runInBand
npm run build
```

```powershell
cd backend
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m scripts.export_schemas
```

## Repository

- `frontend/`: existing React identity/layout/Leaflet, guest pages and local persistence.
- `backend/`: FastAPI, canonical contracts, parser, repository, planner/replanner, tests.
- `contracts/`: exported schemas, API envelopes, canonical valid/invalid fixtures.
- `docs/`: product/audit history and current implementation notes.

## Important limits

The curated Yogyakarta catalog remains available. National snapshots cover Medan,
Bandung, Denpasar, Banjarmasin, Makassar, Jayapura, Jakarta, Padang, Labuan Bajo,
Bali, Surabaya, and a limited Raja Ampat area. Other areas need a reachable
Nominatim and Overpass service; errors are explicit and no fictional fallback is used.
OpenStreetMap names/coordinates are approximate and the national catalog has unknown
hours, entry prices and room rates. Hotel choice is a route anchor, not a visit stop.
Unknown hours/prices are not free or always-open. Permit unverified data explicitly to
receive a conditional plan; disable it to reject incomplete candidates. Route distance is
straight-line Haversine with a documented duration heuristic, not actual road routing/traffic.
Costs include selected food stops only, not every possible meal. User estimates are not quotes.
No global optimum or proof of infeasibility is claimed when bounded search fails.

A read-only Supabase adapter is implemented and mock-tested. Live integration remains blocked on the approved schema/mapping and access configuration for public.saved_places. Local remains explicitly selected.
See [integration boundary](docs/SUPABASE_INTEGRATION.md), [backend](backend/README.md),
[data provenance](backend/app/data/README.md), and [current MVP details](docs/MVP_IMPLEMENTATION.md).

## Collaboration

Only `dev` and `main`: develop/integrate/test on `dev`; promote reviewed, verified changes
to `main`. No force-push or automatic release merge. Database changes require teammate approval.

## Latest completion and one-origin demo

See [master completion report](docs/MASTER_COMPLETION.md) for current QA, task ownership, source readiness and blockers. Historical architecture/audit documents describe earlier checkpoints.

For a build-based demo without CRA proxy, run `npm run build` in frontend, then from backend set `$env:TRPIN_SERVE_FRONTEND='true'` and run `.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8015 --no-proxy-headers`. Open http://127.0.0.1:8015. This is local HTTP, not a claim of deployed HTTPS hosting. See backend README for limits and source preflight.
