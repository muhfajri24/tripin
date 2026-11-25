# Integration recheck - 25 November 2026

Guest story: landing -> brief -> editable review -> FastAPI catalog/planner -> canonical schedule, ledger and map -> device save/reload -> edit, delay/closure and revision save.

## Changes and verification

Active Create, Result, My Trips and Explore now use the existing canonical API, storage, PreferenceForm and TripView. The current sidebar, logos, color palette, rounded surfaces, landing gallery and result hero remain. Dashboard/settings/saved prototype routes redirect to guest pages. Fake notifications, planning, user history and impact calculations are removed from active routes. Unsupported landing destinations require an explicit Yogyakarta choice. Review is required before generation, including after editing inputs. Catalog retry preserves the form; API failure never creates a fake itinerary. Result loading chooses the latest stored revision and never substitutes another ID. Trip badges refresh after save/delete and across tabs. Replan rejects saved place snapshots whose content changed under the same dataset version; four regressions cover changed prices, hours, evidence and removed places.

| Gate | Result | Evidence |
|---|---|---|
| Backend regression | 131 passed; one existing Starlette/httpx deprecation warning | `pytest -q` |
| Backend quality | ruff lint/format, pip check, catalog quality passed | `.github/workflows/quality.yml` commands |
| Contract/seed export | no drift | export scripts + git diff |
| Frontend regression | 18 passed (14 existing + 4 recovery/identity regressions) | `npm test -- --runInBand` |
| Production build | passed with CI=true | `npm run build` |
| Desktop browser, local/live | 12 steps passed per source; no page or unexpected HTTP errors | `qa/release/integration-{local,live}/browser-desktop.json` |
| Mobile emulation, local/live | 10 steps passed per source; no page errors/document overflow | `qa/release/integration-{local,live}/browser-mobile.json` |
| Browser recovery, local/live | 4 scenarios passed per source | `qa/release/integration-{local,live}/browser-recovery.json` |
| Real API local/live | list/filter/detail, parse, plan 1/2/3 days, closure replan passed | `qa/release/integration-{local,live}-http.json` |
| Real upstream outage | places and plan return 503, no local fallback | `qa/release/integration-upstream-outage.json` |
| Live permissions | catalog RLS, security_invoker view; anon/authenticated SELECT only; security advisors empty | read-only hosted inspection |

Recovery scenarios deliberately inject API 503, quota failure, corrupt device storage and catalog network failure. They verify preserved form/result/draft and no false save success. Real outage uses a separate process explicitly configured with an unreachable Supabase endpoint; it does not interrupt the real database or alter data. Browser contexts are isolated and disposable. Screenshots disable animations for inspection. Mobile is emulation, not a physical-device claim. Maps links and popups pass; full external map rendering remains unverified.

## Data release gate remains blocked

Live `yogyakarta-v0_3_0` still has nine structurally valid records, but content differs from the same version committed locally. Local/live checksum parity **fails**. Changes include Museum Kereta price Rp19,000, Vredeburg price Rp28,000 and Vredeburg hours 08:00-16:00. A representative HTTP scenario totals Rp470,000 locally versus Rp564,000 live, with 3 versus 1 unknown cost components. This is a real source difference, not a frontend arithmetic defect. The author of hosted changes is not inferred from timestamps. `saved_places` currently has zero rows; this session made no DB writes. Public catalog and private user experience data are separate concerns.

Evidence: `qa/release/integration-catalog-diff.json` and `integration-live-source.json`. The previous 24 November parity/saved_places reports are historical and do not describe this run.

Operator sources checked this session:

- [Vredeburg operator hours](https://vredeburg.id/ticket-information/page/waktu-kunjungan): Tuesday-Thursday 08:00-20:00, Friday-Sunday 08:00-21:00, Monday closed.
- [Vredeburg operator tickets](https://vredeburg.id/id/page/tiket): domestic adult Rp15,000 Tue-Thu, Rp20,000 Fri-Sun through 16:00 and Rp25,000 afterward. The single-price contract cannot represent this applicability; do not replace unknown with an unconditional amount.
- [DIY cultural office Wahanarata listing](https://wkmdisbuddiy.jogjaprov.go.id/museum/index?id=48): Tue-Sun 09:00-15:00, adult Rp20,000. Current operation/renovation status for the actual demo date still requires confirmation. This does not substantiate the live Rp19,000 value.

Data owner handoff: review live fields against operator evidence, publish a new immutable dataset version with matching local JSON, seed, view/policy and environment, then rerun parity and acceptance. No existing version or hosted rows were overwritten in this session. Do not call either catalog operationally current solely because schema tests pass.

## Google refresh and user experience storage

The user asked about current Google/Maps data and storing user experience in Supabase. Places API exposes current opening hours, but requires a billing-enabled project and API credentials; it is not a guarantee of live venue operation or exact ticket prices. [Usage/billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing), [fields](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places), [storage/attribution policies](https://developers.google.com/maps/documentation/places/web-service/policies). No paid service or scraper was enabled. Search is used to locate operator evidence, with checked timestamps and uncertainty retained. Automatic Google refresh is not implemented by this change.

Guest trip storage currently remains on the device. Supabase-backed user experiences require an agreed identity/session and per-user ownership/RLS design, separately from the public read-only place catalog. No guest itinerary is written to a public shared table and no cloud-sync success is claimed.

## Backlog handoff

- #6, #15, #16, #25: backend evidence ready for human review; no self-approval.
- #26: local checks pass; actual remote CI must pass on the pushed SHA before Review.
- #28, #29, #31: local package/desktop/recovery evidence ready for Review. Release data freeze remains separate.
- #14: frontend-to-live flow works, but data parity/source verification keeps final acceptance Blocked.
- #30: emulation passes; physical device and external Maps rendering still required.
- #27: no public HTTPS target deployed.
- #34, #36, #37, #38: final data, release freeze, acceptance, human rehearsals and release review still required.
- #39 remains Parked. #42 implementation is ready for Shakira review; primary ownership stays unchanged.

Push to shared `dev` is a tested integration handoff, not approval to promote `main`, deploy, activate a data proposal or mark release gates Done. Final SHA and remote CI evidence are recorded in the GitHub issue updates.
