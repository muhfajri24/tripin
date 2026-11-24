# Supabase integration boundary — PENDING

Database ownership remains with the teammate. No production tables, policies, migrations,
credentials, RLS or service-role configuration are created or modified by this implementation.
No finalized Supabase schema exists in the inspected repository.

`backend/app/repositories/places.py:PlaceRepository` is the integration contract:

| Operation | Required behavior |
|---|---|
| list_places(destination_id, query, kind) | Return canonical Place records; unsupported destination returns no records |
| get_place(place_id) | Stable ID lookup, None for absent ID |
| list_lodging(destination_id) | Lodging only |
| get_place_evidence(place_id) | Preserve field-specific provenance and unknown values |
| version | Stable dataset revision used by itinerary snapshots |

## Proposed mapping to discuss (not assumed database columns)

- Stable place key -> Place.id; no frontend-generated provider IDs.
- Geographic point -> Coordinates; null until known, zero is valid.
- Category/kind -> canonical enums/list, without blanket Heritage mapping.
- Opening intervals -> weekday Monday=0, local Asia/Jakarta times; null is unknown,
  empty list is no regular windows. Exceptions remain date-specific.
- Applicable adult domestic price -> amount + person/group/room-night basis + evidence.
- Identity, coordinates, operating hours, duration, local-business classification ->
  separate Evidence. Do not infer UMKM status from being a restaurant or a partnership.

Before an adapter can be implemented, obtain teammate-approved table/view names, keys,
relations, category mapping, pricing applicability, refresh/version semantics, read policy,
and credentials delivery method. Queries must be bounded and validated with Pydantic.

Run the repository contract tests against the new adapter with fixture data, test read-only
failure/timeout behavior, and compare canonical outputs to the local adapter. Do not run
integration tests against production writes. Switch sources explicitly with configuration;
never silently merge local and live catalogs. `TRPIN_PLACE_SOURCE=supabase` deliberately
fails startup until an approved adapter exists. Current active source: local v0.2.0 only.

Private itineraries remain device-local, never in public Supabase tables. Never expose a
service-role key in React. No Supabase credentials are needed to run this MVP.
