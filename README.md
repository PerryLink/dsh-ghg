# @perrylink/dsh-ghg

Electricity activity ingest, location-based GHG calculation, row verification, workpaper and partial ESRS pack for DeepSeek Harness.

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim. All acceptance rows are `counted=false`.

## Install

```sh
dsh plugin --profile <profile> add @perrylink/dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

Requires DSH `>=0.2.1-rc.3 <0.3.0` and Node `>=24.9 <25`.

<details>
<summary>中文摘要</summary>

用电活动入库、基于位置的 GHG 计算、逐行复算、底稿与部分 ESRS 包导出。 安装：`dsh plugin --profile <profile> add @perrylink/dsh-ghg`。公开/合成、alpha、非 GA。

</details>

## Tools

| Tool | What it does | Risk |
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

## Input / output

**Input:** electricity activity CSV or text-based PDF, facility metadata, a public factor, and optional public/synthetic Scope 1/3 values. **Output:** calculated tCO2e lines, a 3-sheet workpaper, and a partial ESRS E1 workbook. The default factor is a public reference, not assurance-grade.

## Configuration

| Env | Default | Meaning |
|---|---|---|
| `DSH_GHG_HOME` | `$DSH_HOME/storages/dsh-ghg` | local domain and exports |

## Limits / non-claims

- PDF path is **text-based only**; no OCR, scanned PDF, or image extraction.
- ESRS export is **partial** (Scope 2 plus optional public/synthetic Scope 1/3); it is not assurance-grade and does not include review/lock/restate.
- No Scope 2 certificates, no tax/utility bill verification, no Client surface.
- The default factor `electricity-location-cn-2022-v1` = 0.5703 kgCO2e/kWh is a public reference, not a customer or assurance factor.
- All activity and Scope 1/3 values are public/synthetic; no customer data is included.
- No customer evidence, customer data, or production-readiness claim; all fixtures are public/synthetic.

## Public sample

31-row MIT daily kWh sample and a synthetic text PDF; `ACCEPTANCE.csv` lists 8 public checks.

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku02
```

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
