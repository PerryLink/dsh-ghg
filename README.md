<div align="center">

# dsh-ghg

> **Official repository.** The only official repository of this package, maintained by PerryLink. Same-name repositories under other accounts are not affiliated. Apache-2.0.

[![npm](https://img.shields.io/npm/v/dsh-ghg)](https://www.npmjs.com/package/dsh-ghg)
[![CI](https://github.com/PerryLink/dsh-ghg/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-ghg/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)
[![Gitee](https://img.shields.io/badge/Gitee-aggregate-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-plugins)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-ghg?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-ghg?ref=badge)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-24.9%2B-brightgreen)](#)
[![npm downloads](https://img.shields.io/npm/dm/dsh-ghg)](https://www.npmjs.com/package/dsh-ghg)

**Electricity activity ingest, location-based GHG calculation, row verification, workpaper and partial ESRS pack.**

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim.

> 🧊 **FROZEN — 2026-10-31. No new features.** Installable; only genuine breakage is fixed.

## Maintenance status: 🧊 FROZEN

Frozen on 2026-10-31; the package stays installable, but feature work stops.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-ghg
```

</div>

> ⭐ If this helps, a star makes it easier for the next person to find it. Nothing is gated behind it.

![Workflow diagram for dsh-ghg: local input, plugin, local output.](docs/assets/dsh-ghg-flow.svg)

*Workflow: local input → plugin → local output. No model call is required.*

## Install

Install and verify:

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

Uninstall:

```sh
dsh plugin --profile <profile> remove dsh-ghg
```

## What it does

Electricity activity ingest, location-based GHG calculation, row verification, workpaper and partial ESRS pack. Runs locally on DeepSeek Harness. The table below is the exact tool surface; the examples use the real command surface.

Input and output stay local; nothing is uploaded.

## Tools

Tool names and descriptions are kept in English to match the runtime output.

| Tool | Purpose | Risk |
|---|---|---|
| `ghg.facility_import` | Import facility boundary metadata | R1 local write |
| `ghg.ingest` | Ingest electricity CSV (`date/month,kwh`); reject MWh/unit mismatch | R1 local write |
| `ghg.ingest_pdf` | Extract date/kWh rows from a text-based PDF; no OCR or scanned PDF | R1 local write |
| `ghg.match_factor` | Return the electricity location factor and its public source | R0 |
| `ghg.factor_import` | Import a versioned public/synthetic factor | R1 local write |
| `ghg.scope_import` | Import public/synthetic Scope 1/3 values for the partial ESRS pack | R1 local write |
| `ghg.calculate` | Multiply kWh by a factor (default or imported) into tCO2e lines | R0 |
| `ghg.verify_row` | Recalculate all lines and return mismatches/diffs | R0 |
| `ghg.export_workpaper` | Export a 3-sheet xlsx: Facilities / Activities / Emissions | R1 local write |
| `ghg.export_esrs` | Export a partial ESRS E1 view; not assurance-grade | R1 local write |
| `ghg.export_esrs_pack` | Export a 4-sheet partial ESRS E1 workbook | R1 local write |

## Quick start

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

## Limits

- Public/synthetic only; no customer data or customer evidence.
- Alpha/partial, not counted, no GA or production-readiness claim.
- No model or network call unless a tool explicitly says so.
- The exact per-tool boundaries are in the table and `ACCEPTANCE.csv`.

## Public sample

Public/synthetic fixtures live in `test/fixtures/`; `ACCEPTANCE.csv` records the public checks with `counted=false`.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## Compatibility

| Surface | Status |
|---|---|
| Harness | `dsh >=0.2.1-rc.3 <0.3.0` |
| Node | `>=24.9.0 <25` |
| Platforms | All; local files only |
| Data | No network, no model call, no upload |

## Permissions & data

- Runs locally; no network, no model call, no upload.
- Public/synthetic fixtures only; no customer data, no customer evidence.
- Alpha/partial; not counted, no GA or production-readiness claim.
- Frozen packages stay installable; no new features, only genuine breakage fixes.

## Related work

Sibling packages and family indexes: [dsh-qms-capa](https://github.com/PerryLink/dsh-qms-capa) · [dsh-policy-ledger](https://github.com/PerryLink/dsh-policy-ledger)

- [Domain index](https://perrylink.github.io/dsh-plugins/)
- [Checker family](https://perrylink.github.io/zh/checkers/)
- [Mainline family](https://github.com/PerryLink/dsh-kit)

## Family

<details>
<summary>DSH domain plugin family (15 packages + 2 suites)</summary>

| Package | npm |
|---|---|
| **[dsh-einvoice](https://github.com/PerryLink/dsh-einvoice)** | [npm](https://www.npmjs.com/package/dsh-einvoice) |
| **[dsh-docx-redline](https://github.com/PerryLink/dsh-docx-redline)** | [npm](https://www.npmjs.com/package/dsh-docx-redline) |
| **[dsh-policy-ledger](https://github.com/PerryLink/dsh-policy-ledger)** | [npm](https://www.npmjs.com/package/dsh-policy-ledger) |
| **[dsh-ghg](https://github.com/PerryLink/dsh-ghg)** | [npm](https://www.npmjs.com/package/dsh-ghg) |
| **[dsh-bankrec](https://github.com/PerryLink/dsh-bankrec)** | [npm](https://www.npmjs.com/package/dsh-bankrec) |
| **[dsh-ap-three-way](https://github.com/PerryLink/dsh-ap-three-way)** | [npm](https://www.npmjs.com/package/dsh-ap-three-way) |
| **[dsh-ifc-qto](https://github.com/PerryLink/dsh-ifc-qto)** | [npm](https://www.npmjs.com/package/dsh-ifc-qto) |
| **[dsh-qms-capa](https://github.com/PerryLink/dsh-qms-capa)** | [npm](https://www.npmjs.com/package/dsh-qms-capa) |
| **[dsh-legal-intake](https://github.com/PerryLink/dsh-legal-intake)** | [npm](https://www.npmjs.com/package/dsh-legal-intake) |
| **[dsh-legal-clause](https://github.com/PerryLink/dsh-legal-clause)** | [npm](https://www.npmjs.com/package/dsh-legal-clause) |
| **[dsh-freight-audit](https://github.com/PerryLink/dsh-freight-audit)** | [npm](https://www.npmjs.com/package/dsh-freight-audit) |
| **[dsh-hs-candidate](https://github.com/PerryLink/dsh-hs-candidate)** | [npm](https://www.npmjs.com/package/dsh-hs-candidate) |
| **[dsh-travel-recon](https://github.com/PerryLink/dsh-travel-recon)** | [npm](https://www.npmjs.com/package/dsh-travel-recon) |
| **[dsh-pim-lint](https://github.com/PerryLink/dsh-pim-lint)** | [npm](https://www.npmjs.com/package/dsh-pim-lint) |
| **[dsh-eval-pack](https://github.com/PerryLink/dsh-eval-pack)** | [npm](https://www.npmjs.com/package/dsh-eval-pack) |
| **[dsh-finops-suite](https://github.com/PerryLink/dsh-finops-suite)** | [npm](https://www.npmjs.com/package/dsh-finops-suite) |
| **[dsh-contract-suite](https://github.com/PerryLink/dsh-contract-suite)** | [npm](https://www.npmjs.com/package/dsh-contract-suite) |

</details>

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
