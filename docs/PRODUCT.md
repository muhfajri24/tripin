> Historical prototype snapshot. Current implementation: [MVP_IMPLEMENTATION.md](MVP_IMPLEMENTATION.md).

# TRPIN — Product Scope and Use Cases

_Last reviewed against `dev` at commit `138dffb` (24 November 2026). This is a target specification, not a claim that each feature is implemented._

## Problem and value proposition

Planning a multi-stop trip requires comparing destination relevance, opening windows, travel times, budget and changing circumstances. Generic chat suggestions may describe attractive stops without producing a feasible sequence. TRPIN's goal is **constraint-aware, editable and navigable itineraries**, with optional priority for local UMKM.

### Intended user journey

1. Traveler supplies destination, date/duration, number of people, budget, transport mode and natural-language activity preferences.
2. System extracts a structured plan; users review and correct uncertain fields.
3. Place provider returns candidates with coordinates, category, provenance and last-checked time. Unsupported cities produce a clear no-data state.
4. Feasibility filter excludes destinations that cannot fit hard constraints.
5. Optimizer creates candidate daily schedules under three preferences: budget, travel efficiency and exploration diversity.
6. Traveler reviews map, schedule, estimated costs, assumptions and reasons for each selection.
7. Traveler changes, locks or removes a stop; the system recalculates affected routes and windows.
8. Traveler opens the finalized day route in Google Maps. This is **handoff**, not turn-by-turn navigation inside TRPIN.

## Actors

- **Traveler** (MVP): create, compare, edit, export and store plans on one device.
- **Travel companion** (later): collaborative preferences and shared edits.
- **Administrator / data curator** (later): review local data accuracy, stale records and merchant classifications.

## Use cases and testable acceptance criteria

| ID | Use case | Acceptance criterion | Priority |
| --- | --- | --- | --- |
| UC-01 | Interpret trip brief | Extract destination, day count, desired activities, budget and mobility; uncertain fields remain editable | P0 |
| UC-02 | Search real candidates | Each result has a location, source indicator, and no fabricated live rating/hours | P0 |
| UC-03 | Generate feasible day | All scheduled stops fit declared time windows and duration; infeasible requests show explicit conflicts | P0 |
| UC-04 | Compare objectives | Budget, time and exploration variants differ when tradeoffs exist, with understandable reasons | P1 |
| UC-05 | Adjust trip | After removing/replacing/delaying a stop, recompute times and constraints without discarding locked stops | P0 |
| UC-06 | Inspect expenses | Show per-person vs total costs, assumptions, missing prices and budget violations | P0 |
| UC-07 | Open navigation | Google Maps opens valid sequential stops; gracefully split long journeys or open selected leg | P0 |
| UC-08 | Save plans | Refreshing preserves valid trip data in the same browser; errors and storage limits are handled | P1 |
| UC-09 | Local economy view | Count *estimated* selected local-business stops using an auditable definition; don't claim actual spend | P1 |

## Non-functional requirements

- Mobile-first layout; keyboard-accessible forms and controls.
- User-visible loading, error, stale-data and no-results states.
- No fabricated accuracy, freshness or live-price claims.
- Limited external-API volume, caching under provider terms, quotas and rate-limiting.
- Deterministic algorithm outputs for fixed input test fixtures.
- No secrets in browser bundles or committed files.

## Suggested explicit boundaries for the competition MVP

- Pilot: **Yogyakarta** with a manually checked, small candidate set before nationwide coverage.
- One transport mode fully validated before expanding to motorcycle, transit and multimodal routing.
- Multi-day planning may use a fixed initial lodging anchor, but hotel availability/booking is **out of scope**.
- Rain and closure are user-reported scenarios until verified live providers are integrated.
- Estimated price is not a confirmed quote.

## Seven-day team plan

| Day | Person A: data/API | Person B: UI | Person C: algorithm/QA | Demonstrable output |
| --- | --- | --- | --- | --- |
| 1 | Contract and source selection | Journey / wireframes | Fixtures and constraints | Agreed end-to-end example |
| 2 | Place normalization | Input and review | Scoring baseline | Candidate search |
| 3 | Route/time adapter | Results/map | Feasibility filter | Valid single-day plan |
| 4 | Data-quality flags | Variants UI | Three objective comparisons | Explainable alternatives |
| 5 | Google Maps URL contract | Editing/locking UX | Recompute on edits | Live reschedule demo |
| 6 | Error handling / key safety | Responsive polish | Tests and real-world checks | Deployed beta |
| 7 | Stabilize | Demo video & screenshots | Regression & evidence | Submission-ready MVP |

## Demo scenarios (minimum)

1. Jogja: morning culinary, afternoon attractions, evening hotel, capped budget.
2. Same trip with a two-hour delay: show the conflict, removed/replaced stop and why.
3. Change one destination: preserve others and recompute totals.
4. Unknown destination: never show Bali as a silent fallback.
5. Missing price or closed place: distinguish unavailable information from zero cost.

## Outcome metrics (measure, do not fabricate)

- % of suggested itineraries satisfying hard constraints.
- Number of unverified/unknown prices displayed clearly.
- Total estimated travel minutes before/after optimization on the *same* candidate set.
- Time to create a navigable itinerary in user tests.
- Number of itinerary edits that still satisfy constraints.
