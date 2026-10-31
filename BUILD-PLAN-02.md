# BUILD-PLAN-02 — SKU-02 GHG S1 (public/synthetic)

## Gate
2 accounting firms + 3 report specialists required; current **0/0**. User approved public/synthetic demo 2026-10-31; acceptance `not counted`, `partial`.

## S1 scope
Six tools: facility_import, ingest (CSV only), match_factor, calculate (location electricity), verify_row, export_workpaper (3 sheets). PDF/OCR, ESRS, review/lock/restate and Client deferred.

## Data
`ghg` domain version 1: facilities, activities, lines; JSON KV. Factor 0.5703 kgCO2e/kWh public reference; no Scope 3.

## Acceptance
30 electricity rows → 30 lines; MWh rejected 1/1; recalc diff 0; 3 sheets.

## Name audit
`dsh-ghg` and bare `dsh-ghg` both 404; no bin. Similar ESG packages exist but this scoped name is free.

## Risks
Synthetic CSV only; no firm/specialist validation; fixed factor may be superseded; no PDF.
