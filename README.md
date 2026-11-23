# TRPIN — Adaptive Travel Itinerary Planner

> **Status: frontend prototype / simulated itinerary engine.** TRPIN currently demonstrates trip planning, curated Indonesian destinations, itinerary editing, budget visualization, and Google Maps handoff. It is **not yet** a production AI planner or a verified booking/navigation service.

TRPIN helps travelers turn preferences into a structured travel itinerary, compare optimization priorities, discover Indonesian destinations and local businesses, and adjust plans when circumstances change. The product aims to make travel planning more practical **while increasing visibility of local UMKM** (relevant to SDG 8).

![TRPIN logo](public/logo-full.png)

## What works today

| Capability | Current implementation |
| --- | --- |
| Landing, dashboard, discovery, saved places, settings | React UI with demonstration/local data |
| Trip creation | Guided fields and free-text input; generator uses curated/static data, **not a live LLM** |
| Daily itinerary and budget | Generated activity schedules and cost estimates; values are illustrative |
| Modes: budget / time / explore | Local ordering and scoring helpers; **not a proven global route optimum** |
| Edit and reschedule | Move/add/remove/replace activities and scenario-based local adjustments |
| Map | Leaflet + OpenStreetMap |
| Google Maps handoff | Opens a Maps directions URL containing selected day's stops; waypoint behavior depends on client limits |
| Discovery | Google Places Text Search when configured, Nominatim fallback and curated catalog |
| Persistence | Browser `localStorage`; no account synchronization |

**Important caveats:** some example ratings, opening hours, prices, labels and economic-impact values are placeholders or estimates. The application can fall back to unrelated curated destinations for unknown cities. **Do not treat the current itinerary as verified travel advice.**

## Quick start

Prerequisites: Node.js and npm (a current Node LTS release is recommended).

```bash
git clone https://github.com/muhfajri24/trpin.git
cd trpin
git switch dev
npm ci
npm start
```

Open http://localhost:3000.

Production build:

```bash
npm run build
```

There is currently no `npm test` script in `package.json`; automated testing and CI are pending.

### Optional environment configuration

Create `.env.local` **only if needed**:

```dotenv
REACT_APP_GOOGLE_PLACES_KEY=your_restricted_browser_key
```

The current Places integration calls Google Places directly from the browser. A `REACT_APP_*` variable is embedded into the client bundle and **must not be treated as a secret**. Restrict a browser key by website referrer, API, and quota/budget alerts. Do **not** put an unrestricted key or an LLM secret in frontend variables. Future server integrations should use server-side secret storage.

Without a Google Places key, search may use the public Nominatim endpoint or local example data. The public services are subject to usage policies and are unsuitable as an unrestricted production backend. OSRM public routing is also a best-effort demo dependency.

## App routes

| Route | Page |
| --- | --- |
| `/` | Landing |
| `/dashboard` | Dashboard |
| `/discovery` | Local discovery |
| `/create` | Create itinerary |
| `/my-itineraries` | Saved/generated itineraries |
| `/itinerary/:id` | Itinerary result, map and budget tab |
| `/itinerary/:id/edit` | Editor and scenario-based rescheduler |
| `/saved` | Saved places |
| `/settings` | Settings |

Legacy URLs `/explore`, `/itinerary/:id/reschedule`, and `/itinerary/:id/budget` redirect to current pages.

## Source layout

```text
public/                 Static assets and page shell
src/
  App.js                Client routes
  assets/               Brand assets
  components/           Reusable UI (map, timeline, budget, etc.)
  data/mockData.js      Curated demo records, generator, persistence, calculations
  layouts/AppLayout.js  Application shell
  pages/                Landing, planner, results, editor, discovery, etc.
  services/
    placesService.js    Google Places / Nominatim / curated fallbacks
    regionService.js    Indonesian regions and destination resolution
    routingService.js   Public OSRM and approximate fallback
  index.css             Global styles
tailwind.config.js      Theme tokens
```

## Product and engineering documents

- [Product scope, actors, scenarios and acceptance criteria](docs/PRODUCT.md)
- [Engineering notes, data flow, limitations and safety](docs/ARCHITECTURE.md)
- [Repository audit and prioritized backlog](docs/AUDIT.md)

### MVP focus for a three-person / seven-day build

1. **Reliable structured input:** parse user intent or provide a fallback form; preserve destination, activities, budget, dates, transportation and party size.
2. **Grounded candidates:** retrieve and normalize places, show source/freshness, and never silently substitute another city.
3. **Feasible itinerary:** enforce hard constraints (time windows, duration, budget and travel mode) before ranking alternatives.
4. **Explainable adjustments:** make one-change rescheduling recalculate and explain affected stops.
5. **Navigable output:** export a valid, bounded sequence of stops to Google Maps and provide a safe fallback if waypoints exceed limits.

## Collaboration

The repository's default branch is `dev`. Make changes on short-lived feature/docs branches and open pull requests to `dev`. Document assumptions, avoid committing API keys and distinguish mock values from live information.

**Naming note:** the GitHub repository is `trpin`; the current UI and package still use `TRIPIN` / `tripin`. A final brand spelling should be agreed before renaming public-facing assets or package identifiers.

## License

No license file has been added yet. Do not assume redistribution rights. The team should choose a license explicitly if it wants to open-source this work.
