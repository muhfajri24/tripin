> Historical prototype snapshot. Current implementation: [MVP_IMPLEMENTATION.md](MVP_IMPLEMENTATION.md).

# TRPIN — Engineering and Data Flow

_Observed in branch `dev` at `138dffb`. This document distinguishes existing implementation from proposed architecture._

## Current architecture (implemented)

```text
React 18 / react-router-dom
  ├─ pages and reusable components
  ├─ CreateItineraryPage → generateDynamicItinerary() in mockData.js
  ├─ ItineraryResultPage / ItineraryEditorPage
  │    ├─ optimizeActivities() / local recalculations
  │    ├─ localStorage persistence helpers
  │    ├─ Leaflet / OpenStreetMap
  │    └─ Google Maps directions URL
  ├─ placesService
  │    ├─ optional browser-side Google Places Text Search
  │    ├─ public Nominatim query
  │    └─ curated mock catalog
  └─ routingService → OSRM public demo server / Haversine fallback
```

There is **no application backend, database, authentication, LLM integration, booking engine or real-time validation pipeline** in the checked repository. The `REACT_APP_API_URL` suggested by the old README was aspirational; no server contract is implemented.

## Existing behavior that requires caution

- `CreateItineraryPage.handleGenerate` uses a 2.4-second timeout then `generateDynamicItinerary()`. The loading copy says AI, but no LLM is called.
- `generateDynamicItinerary()` uses selected curated stops and fixed daily time slots. On unknown destinations with no local catalog match it selects Bali records. This must become an explicit empty/error state.
- The creation page holds `naturalQuery`, but the generator call passes guided `planState` fields rather than parsing the request into full constraints.
- `routingService.computeRouteDistance` calls a public OSRM **driving** endpoint even when the supplied mode is not `car`; fallback is approximate Haversine distance with heuristic duration. Coordinates of zero also fail its current falsy guard.
- `ItineraryEditorPage` applies simplified scenario rules (for example shifting start time by two hours). It does not verify every opening hour, transit leg, booking or budget feasibility.
- `placesService` hardcodes fallback rating/review/hour/coordinates for certain live responses. Unknown metadata should instead remain `null` / `unknown`, never appear verified.
- `getTripImpactStats` computes **estimated** local spending; `getOverallImpactStats` contains demonstration floors and a static carbon figure. Avoid presenting these as measured economic or environmental outcomes.
- `getItineraryById` falls back to the first available itinerary when an ID is missing; a not-found state is safer.
- `saveItinerary` persists to browser `localStorage`; data does not follow a user to another device.

## Proposed architecture (not implemented)

```text
Browser
  → /api/trips/parse       (LLM with schema validation or deterministic form fallback)
  → /api/places/search     (provider adapter + cache + provenance)
  → /api/routes/matrix     (mode-specific travel times)
  → /api/itineraries/plan  (constraint filter + objective optimizer)
  → /api/itineraries/replan (immutable preferences + locked stops)
  → UI, storage, Google Maps URLs
```

For the seven-day contest, a minimal API is preferable to creating a complex microservice architecture. Consider an Express or FastAPI backend with environment-stored provider secrets and a curated Yogyakarta dataset first; persistent database can be phased in after end-to-end planning works.

## Candidate normalized data contracts

```ts
type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  estimatedCostIdr: number | null;
  openingWindows: Array<{ weekday: number; start: string; end: string }> | null;
  source: "curated" | "google_places" | "osm";
  checkedAt: string | null;
  isLocalBusiness: boolean | null;
};

type TravelRequest = {
  destination: string;
  dateStart: string;
  days: number;
  travelers: number;
  totalBudgetIdr: number | null;
  transportMode: "driving" | "walking";
  slots: Array<{ period: "morning" | "afternoon" | "evening"; category: string }>;
  mustVisitPlaceIds: string[];
};

type ScheduledStop = {
  placeId: string;
  arrival: string;
  departure: string;
  estimatedCostIdr: number | null;
  travelMinutesFromPrevious: number | null;
  locked: boolean;
};
```

These are *suggested* contracts and should not be mistaken for an existing API.

## Constraint and optimization rules

**Hard constraints**: valid coordinates, destination area, opening interval (when known), no overlapping activities, duration, transport compatibility, maximum daily window, must-visit stops and strict budget when a reliable price exists. Treat unknown hours/prices as uncertainty, not success.

**Soft objectives**: relevance, local-business coverage, total travel duration, cost and trip diversity. Generate candidate feasible schedules first, then score with explicit weights. Don't claim the current distance/order heuristic is globally optimal.

Recommended regression fixtures:
- user changes destination to an unsupported island;
- arrival late enough to miss a fixed-time attraction;
- route includes a location with latitude or longitude zero;
- some places have missing opening hours and cost;
- Google Maps URL contains more stops than supported by the target device;
- repeated create calls with the same destination must not silently overwrite saved trips.

## Privacy, API costs and terms

- A `REACT_APP_*` environment variable is exposed in the delivered JavaScript. Browser keys require strict domain/API restrictions; never put private LLM credentials in the browser.
- Public Nominatim and OSRM demonstration endpoints have usage restrictions. Review provider terms before deployment and do not depend on them for production-scale traffic.
- Google Places and routing services have usage-based pricing; set explicit quotas and monitor billing.
- Never imply hotels are bookable or prices are live without a verified booking integration.
- For location and saved preference data, obtain appropriate user permission and offer deletion options.
