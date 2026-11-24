# Verification report — current guest MVP

Executed locally against the implementation on `dev`:

| Check | Actual result |
|---|---|
| Backend pytest | 82 passed; one Starlette/httpx deprecation warning |
| Frontend Jest | 10 passed in 2 suites |
| Frontend production build | Compiled successfully |
| Ruff | All checks passed |
| Python dependency check | No broken requirements |
| JSON Schema export | Exported canonical models and API envelopes; drift tests passed |
| HTTP smoke | health -> parse -> two-day plan -> closure -> replan, HTTP 200 |
| Supabase | Pending schema; no live connection or schema changes |
| Visual browser/Maps app | Not verified; URL serialization/order unit-tested |

HTTP smoke command, from backend with the local server running:

```powershell
.venv/Scripts/python -m scripts.smoke_http --base http://127.0.0.1:8011/api/v1
```

Saved measured example: tests/http-smoke-result.json. Parsed budget Rp500,000 per person,
two adults -> group total Rp1,000,000. User-provided planning allowances: food 25,000 per
person per selected food stop; room 200,000 per night; vehicle 100,000 per day. Not quotes.
Known/estimated cost 470,000, three unknown components. A reported closure caused a real
conflict; repair moved optional stops across days. Travel minutes stayed 27; no savings claim.
Cost delta is null because full cost is unknown. No invented improvement percentages.

Covered cases: parsing and malformed amounts, normalized budgets, 1–3 days/lodging nights,
coordinates including zero, out-of-scope locations, opening windows, mandatory places, budget
selection, unknown metadata, delay, closure, completed/locked stops, removal/replacement,
ordered edits, revision mismatch, unique IDs, repository isolation/filtering, storage quota/
corruption, navigation segmentation/order and basic guest UI/review behavior.

Remaining: manually inspect responsive layout in real browser; click Maps on target devices;
complete missing source metadata and establish actual road estimates if required. No public
deployment was created. Historical audits describe the pre-implementation snapshot only.
