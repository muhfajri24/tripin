# Canonical contracts v1

Source of truth: `backend/app/models/contracts.py`. Run schema exporter from backend.
`schemas/` contains Draft 2020-12 schemas for every canonical top-level model and dataset.
`fixtures/manifest.json` maps each fixture to its model and expected validity.

Fixtures use SYNTHETIC travel anchors, amounts, times, durations and a synthetic hotel ID.
They do not verify real-world prices or routes. `totalIdr` is normalized GROUP total even
when `originalBasis=person`. Valid conflict fixtures represent a declared violated itinerary;
they do not demonstrate a scheduler. Invalid fixtures cover basic and cross-field constraints.
Pydantic runtime validators enforce invariants not expressible in exported JSON Schema.
Schema consumers must use backend validation for those invariants.
