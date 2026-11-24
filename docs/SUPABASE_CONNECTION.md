# Supabase ↔ FastAPI ↔ React integration

**Status:** Read-only Supabase adapter implemented; **not connected to a live database** because the teammate's table/view contract and credentials were not provided. Current default remains the working local catalog.

## Existing frontend/backend connection

The React frontend already uses `frontend/src/services/plannerApi.js` to call the FastAPI `/api/v1` endpoints. The backend owns parsing, itinerary creation, budget and replanning. This change connects the **place repository boundary**, not personal guest trips. Guest itineraries remain in localStorage.

## Zero-cost, read-only database contract

Coordinate with the Supabase teammate to create or expose a **read-only PostgREST view** containing **one column named `place` of type JSONB**. Each row's `place` is a full canonical `Place` object, exactly matching the Pydantic model in `backend/app/models/contracts.py` and the exported schema `contracts/schemas/Place.json`.

The name of this view is configured using `TRPIN_SUPABASE_PLACES_VIEW`; **no view/table name is assumed**. Example conceptual query from backend (not a schema migration):

```http
GET /rest/v1/<approved_view>?select=place&limit=200
apikey: <public-read-key>
```

The database teammate is responsible for adapting their actual table structure to this output, for read access and appropriate **RLS / security-invoker** behavior. A view can bypass underlying row security depending on how it is created: explicitly verify privileges with the public-read key. No service-role key, user data, write access, or production migration is needed for this adapter.

Return `null` for unknown coordinates/hours/prices and preserve per-field `Evidence`. The backend validates every returned item with Pydantic and rejects duplicate IDs. The view must have **fewer than 200 rows** for this MVP adapter; reaching the cap fails explicitly rather than silently truncating the candidate set. Larger catalogs require pagination and server-side filtering as later work.

## Backend configuration

Keep `TRPIN_PLACE_SOURCE=local` until the teammate supplies the view and grants read-only access. Once ready, configure **server-side**, in `backend/.env` (never commit that file):

```dotenv
TRPIN_PLACE_SOURCE=supabase
TRPIN_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
TRPIN_SUPABASE_ANON_KEY=YOUR_PUBLIC_READ_KEY
TRPIN_SUPABASE_PLACES_VIEW=YOUR_APPROVED_VIEW
TRPIN_SUPABASE_DATASET_VERSION=yogyakarta-db-v1
```

Run FastAPI as described in `backend/README.md`. When `supabase` is selected but settings are incomplete the backend **fails startup**. When the live source is inaccessible or incompatible, requests fail rather than silently substituting local places (otherwise itinerary provenance is misleading).

For local/offline demonstration, switch explicitly back to `TRPIN_PLACE_SOURCE=local`. All FE endpoints remain unchanged.

## Integration acceptance checklist

- [ ] Teammate signs off on the exact view name and canonical JSON mapping.
- [ ] Public-read key can read only intended place data; no ability to write or read guest itineraries.
- [ ] All rows validate against `Place` JSON Schema, including `Evidence`, unknown prices and times.
- [ ] No duplicate IDs; geographical coordinates belong to the pilot region.
- [ ] Version value is updated when source dataset changes.
- [ ] API: `GET /api/v1/places` and `GET /api/v1/places/{id}` use Supabase when configured.
- [ ] Planner and rescheduler use the same repository and retain provenance.
- [ ] Simulated 401/403, timeout, malformed response, and partial results are handled clearly.
- [ ] FE → BE → Supabase → plan → replan tested in a browser.
- [ ] No paid Supabase or Google services enabled; free tier limits monitored.

## Security and operational caution

- Public access to the planning app **does not** mean giving unrestricted database privileges.
- Supabase URL and public-read key are server configuration. Never use a service-role secret in React.
- This adapter currently fetches bounded candidate records on each repository operation; it is suitable for a tiny MVP but not performance-optimized. Consider time-bounded caching and pagination only after source mapping is finalized.
- Database access uses public internet and may be unavailable; zero-cost service limits and sleep behavior still apply.
