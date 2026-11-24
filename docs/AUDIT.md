# TRPIN — Repository Audit and Prioritized Backlog

**Source snapshot:** GitHub `muhfajri24/trpin`, default branch `dev`, commit `138dffbcbba5d9147eb12002b0ee52d78d276482` (checked 24 November 2026). This is a static code review, **not** a successful runtime/build test.

## Documentation drift corrected

The previous README listed non-existent `RescheduleModal.js`, `SmartReschedulerPage.js`, `BudgetOverviewPage.js` and `ExplorePage.js`. Current routing uses `/discovery`, the main editor for rescheduling, and result-page budget tabs. The previous document also suggested a backend API contract that does not yet exist.

## Findings

| Severity | Finding | Evidence in code | Proposed fix |
| --- | --- | --- | --- |
| P0 | AI generation is simulated | `CreateItineraryPage.handleGenerate` calls `generateDynamicItinerary` after `setTimeout` | Parse natural language to validated JSON; use transparent fallback form |
| P0 | Unknown city can return Bali itinerary | `mockData.generateDynamicItinerary` default branch | Return unavailable candidates / request correction; never substitute a distant region |
| P0 | Infeasible reschedules | `ItineraryEditorPage.handleApplyReschedule` uses simplistic delay/reorder | Recompute arrival/departure and hard constraints; list skipped/replaced stops |
| P0 | Inaccurate place metadata | `placesService` assigns placeholder rating, reviews, open hours, lat/lng | Use null/unknown, label source, never fabricate provider facts |
| P1 | Routing mode not honored | `routingService` always requests OSRM driving profile | Mode-aware adapter, unit tests, unavailable-mode response |
| P1 | Misleading impact stats | `getOverallImpactStats` uses minimum floors and fixed carbon number | Label mock data; show derived estimated metrics only |
| P1 | Lack of cross-device persistence | localStorage in `mockData.js` | Maintain demo mode, add backend later if time permits |
| P1 | Unstable ID and invalid ID fallback | generated fixed ID suffix; `getItineraryById` returns first item if unknown | Generate unique IDs; explicit not-found view |
| P1 | No automated tests or CI scripts | package.json has start/build only | Add basic model/route/URL tests and build CI |
| P2 | Branding mismatch | repo `trpin`, README/UI `TRIPIN`, npm name `tripin` | Choose brand spelling then update consistently |
| P2 | No license | repository tree | Decide team ownership and license explicitly |

## Suggested order of work

**Must-have competition path:** first demonstrate an honest single-city input → validated candidates → feasible route → editable reschedule → Google Maps handoff. Then add multiple objective variants and a clearly labeled SDG 8 impact estimate.

**Avoid scope expansion** into booking, collaboration, live traffic, automatic rain detection, or nationwide verification until this flow is reliable.

## Review checklist for the team

- [ ] All user-visible claims distinguish simulated and verified data.
- [ ] Unknown destination never silently maps to Bali.
- [ ] Natural-language text actually influences the generated plan.
- [ ] Each itinerary respects realistic duration and available hours (or explains unknowns).
- [ ] Changes preserve user-locked activities and revalidate budget.
- [ ] Google Maps navigation works for a short itinerary and handles large waypoint counts.
- [ ] API keys are restricted, no secret committed, provider quota monitored.
- [ ] `npm run build` succeeds and smoke tests run in a real environment.
- [ ] Mobile UX, keyboard navigation and missing-data states are tested.
- [ ] README and code references are kept in sync with each PR.

## Verification limits

This audit read repository content via the connected GitHub service. It did **not** run `npm ci`, `npm start`, `npm run build`, external API calls, or an interactive browser smoke test. Those steps are necessary before declaring the application ready for competition submission.
