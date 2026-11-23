# Backend foundation

FastAPI app: `backend/app/main.py`; canonical Pydantic models: `backend/app/models/`.
No parser, planner, rescheduler, database, or frontend integration is implemented.

## Run locally (Python 3.11+; PowerShell, from repository root)

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.txt
cd backend
Copy-Item .env.example .env  # optional; edit explicit CORS origins if needed
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

GET http://127.0.0.1:8000/api/v1/health returns `status=ok`, `phase=foundation`.
Interactive API docs: http://127.0.0.1:8000/docs . Health is a process liveness check,
not a declaration that the future planner or dataset is planning-ready.
On Linux/macOS use `backend/.venv/bin/python` (or `.venv/bin/python` inside backend).
Production runtime dependencies: `requirements.txt`; test tools: `requirements-dev.txt`.
`requirements.lock.txt` records the complete tested Python 3.11 environment.
To reproduce that environment install `-r backend/requirements.lock.txt` in a fresh venv.

## Test and export (inside backend)

```powershell
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m scripts.export_schemas
```

Export is deterministic and writes `../contracts/schemas/*.json`. Tests detect schema drift.
JSON Schema validates field structure; Pydantic also enforces cross-field invariants.
Consumers must not treat plain JSON Schema validation as full business validation.

## Configuration and errors

`TRPIN_APP_NAME` and JSON-array `TRPIN_CORS_ORIGINS` are read from environment or
`backend/.env` when started from backend. Default origins: localhost:3000 and 127.0.0.1:3000.
No credentials, external API calls, or secrets are required. CORS credentials are disabled.
Errors use `{error:{code,message,fields,retryable},requestId}`. Request IDs are generated
server-side and exposed as `X-Request-ID`. Unexpected errors do not disclose exception text.
Tests temporarily register validation/error routes; these are not production endpoints.

## Contract semantics

- camelCase wire fields, extra fields forbidden; strict integer IDR, never bool/string/fraction.
- `budget.totalIdr` is always the normalized GROUP total; `originalBasis` records original input.
- Dates are real ISO calendar dates. Schedule timestamps require +07:00; timezone is Asia/Jakarta.
- Day index is zero-based; weekday Monday=0. Split overnight opening windows explicitly.
- 1–3 days, 1–6 adults, driving, Yogyakarta; 2–3 days require days-1 lodging nights.
- Single-day lodging is null. Check-in timestamp, when supplied, is on the first trip date.
- Unknown amounts/windows/classification remain null with unverified evidence. Empty windows
  mean no regular opening windows, not unknown. Zero price is distinct from null.
- Candidate coordinates may be null until sourced. These records are NOT routable yet.
  Arrival/departure/current-location coordinates are mandatory and valid zero is accepted.
- Added field-level identity/duration/local-business evidence prevents implied verification.
- `place_day` preserves place/day; `place_time` additionally requires matching arrival timestamp.
- Ledger item totals must equal quantity × unit amount; unknown unit implies unknown total.
- Itinerary totals must match ledger/legs. Travel minutes exclude scheduling buffers.
- Feasibility and searchOutcome are DECLARED domain results, not computed by this phase.
  Conflicting requirements such as mandatory/excluded IDs are rejected structurally; declared
  schedule conflicts are representable with violations. Full overlap/opening/budget/lock
  preservation evaluation belongs to Phase 2. Do not trust a client-declared satisfied flag.
- Snapshots with synthetic fixtures are not generated itineraries or demo evidence.

See [dataset provenance](app/data/README.md) and [fixtures](../contracts/README.md).

If port 8000 is occupied, use `--port 8011`; do not stop unrelated processes.
