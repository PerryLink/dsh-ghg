# dsh-ghg

> 🧊 **FROZEN — 2026-10-31. No new features.** This public/synthetic S1 demo is not GA; it stays installable and only genuine breakage is fixed.

## Maintenance status: 🧊 FROZEN

Frozen on 2026-10-31. This repository is a public/synthetic S1 demo, not a validated product. The npm package stays installable; no new features are planned.


Electricity activity ingest, location-based GHG calculation, row verification, workpaper and partial ESRS pack for DeepSeek Harness.

> **Status: alpha / public-synthetic / partial / not counted / not GA.** No customer evidence, customer data, or production-readiness claim. All acceptance rows are `counted=false`.

## Install

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

Requires DSH `>=0.2.1-rc.3 <0.3.0` and Node `>=24.9 <25`.

<details>
<summary>中文摘要</summary>

用电活动入库、基于位置的 GHG 计算、逐行复算、底稿与部分 ESRS 包导出。 安装：`dsh plugin --profile <profile> add dsh-ghg`。公开/合成、alpha、非 GA。

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

## 中文说明

用电活动入库、基于位置的 GHG 计算、逐行复算、三表底稿与**部分** ESRS 包。**公开/合成、alpha、非 GA**，不是 assurance-grade。

### 安装

```sh
dsh plugin --profile <profile> add dsh-ghg
```

### 工具

| 工具 | 作用 |
|---|---|
| `ghg.facility_import` | 导入设施边界元数据 |
| `ghg.ingest` | 用电 CSV（`date/month,kwh`），拒绝 MWh/单位不一致 |
| `ghg.ingest_pdf` | 从文本型 PDF 提取日期/kWh；无 OCR |
| `ghg.match_factor` | 返回电力 location factor 与公开来源 |
| `ghg.factor_import` | 导入版本化公开/合成因子 |
| `ghg.scope_import` | 为部分 ESRS 包导入公开/合成 Scope 1/3 |
| `ghg.calculate` | kWh × 因子 → tCO2e 行 |
| `ghg.verify_row` | 全量复算，返回差异 |
| `ghg.export_workpaper` | 3-sheet xlsx：Facilities / Activities / Emissions |
| `ghg.export_esrs` / `export_esrs_pack` | 部分 ESRS E1 视图 / 4-sheet 包 |

### 输入 / 输出

输入用电 CSV 或文本 PDF、设施元数据、公开因子、可选公开/合成 Scope 1/3；输出计算行、3 表底稿和部分 ESRS 工作簿。

### 边界

- PDF 只支持文本型；无 OCR/扫描件。
- ESRS 是部分包（Scope 2 + 可选公开/合成 Scope 1/3），不含 review/lock/restate，不是 assurance-grade。
- 默认因子 0.5703 kgCO2e/kWh 是公开参考，不是客户/鉴证因子。

## Development

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm gate:sku02
```

## License

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
