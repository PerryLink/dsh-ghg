# @perrylink/dsh-ghg

Electricity activity ingest, location-based GHG calculation, row verification and 3-sheet workpaper for DeepSeek Harness — **SKU-02 S1 public/synthetic demo**.

> **Status: partial / not GA.** Customer-evidence work (firms/report specialists) is **permanently out of scope** (see `PUBLIC-ONLY-BOUNDARY.md` in `04-build`). The factor is a **public reference**, not assurance-grade.

## Tools

| Tool | Purpose |
|---|---|
| `ghg.facility_import` | Import facility boundary metadata |
| `ghg.ingest_pdf` | text-based PDF date/kWh extraction | R1 |
| `ghg.ingest` | Ingest electricity CSV (`date/month,kwh`); reject MWh/unit mismatch |
| `ghg.match_factor` | Return the electricity location factor and source |
| `ghg.factor_import` | versioned public/synthetic factor | R1 |
| `ghg.calculate` | kWh × factor → tCO2e lines |
| `ghg.verify_row` | Recalculate all lines; return mismatches/diff |
| `ghg.export_workpaper` | 3-sheet xlsx: Facilities / Activities / Emissions |

No PDF/OCR, Scope 2 certificates, Scope 3, review/lock/restate, ESRS export or Client in S1.

## Config

`DSH_GHG_HOME` (default `$DSH_HOME/storages/dsh-ghg`) stores the local domain and exports.

## Factor

`electricity-location-cn-2022-v1` = **0.5703 kgCO2e/kWh**, public reference (China national grid average 2022); not assurance-grade.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku02
```

Apache-2.0.
