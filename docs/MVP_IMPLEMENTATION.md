# Current MVP implementation

This document supersedes original prototype architecture statements in PRODUCT/ARCHITECTURE/
AUDIT for current implemented behavior. Historical audit findings are retained for traceability.

## A — Guest cleanup and contracts

Primary routes: Home, Plan a Trip, My Trips, Explore Yogyakarta. Profile/settings/notifications
and fake dashboard history are absent from active routes. Saved Places is hidden/redirected.
Existing brand, Tailwind palette, layout shell and Leaflet remain. Legacy components and mock
catalog are retained as prototype references, not active imports. No framework migration.

Canonical additions: optional user costAssumptions; edit/remove/replace replan variants;
API Parse/Plan/Places envelopes. All schemas and fixtures updated. repaired means repaired
known constraints; uncertainty remains visible. No external LLM provider is used.

## B — Backend core

LocalPlaceRepository implements PlaceRepository. Only v0.2.0 is active; nine candidates,
seven with coordinates, with field evidence. Current data can demonstrate conditional plans,
not independently verified road-feasible trips. Strict unknown rejection is available.
Bounded insertion: mandatory -> relevant optional candidates -> per-day insertion attempts ->
ledger budget check -> independent timeline/opening/mandatory/day-end validation.
Unknown prices remain null. One room-night/vehicle-day pricing model avoids double counting.
No search failure is claimed to be a proof of impossible travel.

## C — Frontend integration

Create -> deterministic parse -> review/correction -> plan endpoint -> canonical TripView.
No artificial loading delay. Results, timeline, source status, map, ledger and warnings use
server responses. Backend failures keep input visible; no mock replacement. My Trips stores
only guest data under tripin_guest_itineraries_v1. Corrupt storage is not overwritten.
Save failure keeps current result in navigation state and displays unsaved status.

## D — Adaptive changes

Editor sends delay, closure or ordered edits with explicit locks. Removal/replacement endpoints
also exist and are tested. Completed/earlier stops preserved; protected conflicts require a user
decision. Original snapshot is shown beside revised metrics and available as an expandable
schedule. No frontend feasibility calculation. New candidates default to day one; order edits
preserve original day assignments. Six-stop manual/day bound. Hotel switching/multimodal out
of scope. Navigation segments include anchors, driving, maximum three intermediate waypoints,
and URL length checks; schedules are not transferred to Google Maps.

## E — Verification and release boundary

Backend unit/API/repository tests and frontend storage/Maps/request/UI tests are executable.
HTTP smoke scenario/result: backend/tests/http-smoke-result.json. Figures were calculated by
the implementation using the actual local catalog and user assumptions. They are not claims
about verified travel, actual spending or real traffic. Browser visual/Google Maps application
handoff has not been independently verified in this environment; URL ordering is unit-tested.

## Free operation and deployment

No paid provider, API key, card activation, Supabase account or database is necessary.
Python and CRA run locally. Browser map tiles and external navigation require internet;
tile failure is signaled. Hosting is not provisioned by this change. Any free hosting limits,
sleep behavior and quotas must be checked by the deploying teammate, not assumed unlimited.
Production frontend needs a SPA route fallback and either reverse proxy /api/v1 -> backend or
REACT_APP_API_URL at build time; configure exact backend CORS origin and HTTPS. Do not expose
service-role credentials. Public deployments should add operational rate/body limits and
monitoring before broad traffic; this local competition MVP has no production SLA.

## Database and collaboration

Supabase remains pending. No schema names, credentials, policies or migrations invented.
See SUPABASE_INTEGRATION.md for the proposed mapping and adapter acceptance contract.
Implementation occurs directly on dev under the two-branch policy; main is not promoted.
