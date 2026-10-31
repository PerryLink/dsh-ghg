<div align="center">

# dsh-ghg

> **Repositorio oficial.** El único repositorio oficial de este paquete, mantenido por PerryLink. Los repositorios con el mismo nombre en otras cuentas no están afiliados. Apache-2.0.

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

**Ingesta de actividad eléctrica, cálculo GEI por ubicación, hoja de trabajo y paquete ESRS parcial.**

> **Estado: alpha / synthetic público / parcial / no contabilizado / no GA.** Sin evidencia de clientes, datos de clientes ni promesa de producción.

> 🧊 **CONGELADO — 2026-10-31. Sin nuevas funciones.** Instalable; solo se corrigen fallos reales.

## Estado de mantenimiento: 🧊 CONGELADO

Congelado el 2026-10-31; el paquete sigue instalable, pero no recibe nuevas funciones.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-ghg
```

</div>

> ⭐ Si te resulta útil, una estrella ayuda a que la siguiente persona lo encuentre. Nada está bloqueado tras ella.

![Workflow diagram for dsh-ghg: local input, plugin, local output.](docs/assets/dsh-ghg-flow.svg)

*Flujo: entrada local → plugin → salida local. No requiere llamada a un modelo.*

## Instalación

Instalar y verificar:

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

Desinstalar:

```sh
dsh plugin --profile <profile> remove dsh-ghg
```

## Qué hace

Ingesta de actividad eléctrica, cálculo GEI por ubicación, hoja de trabajo y paquete ESRS parcial. Se ejecuta localmente en DeepSeek Harness. La tabla siguiente es la superficie exacta de herramientas; los ejemplos usan la interfaz real.

La entrada y la salida permanecen locales; no se sube nada.

## Herramientas

Los nombres y descripciones de herramientas se mantienen en inglés para coincidir con la salida runtime.

| Herramienta | Propósito (en inglés) | Riesgo |
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

## Inicio rápido

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

## Límites

- Solo público/sintético; sin datos ni evidencia de clientes.
- Alpha/parcial, no contabilizado, sin GA ni promesa de producción.
- Sin modelo ni red salvo que una herramienta lo indique.
- Los límites exactos están en la tabla y en `ACCEPTANCE.csv`.

## Muestra pública

Las fixtures públicas/sintéticas están en `test/fixtures/`; `ACCEPTANCE.csv` registra las comprobaciones con `counted=false`.

## Desarrollo

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | `dsh >=0.2.1-rc.3 <0.3.0` |
| Node | `>=24.9.0 <25` |
| Platforms | All; local files only |
| Datos | No network, no model call, no upload |

## Permisos y datos

- Se ejecuta localmente; sin red, sin modelo, sin subida.
- Solo fixtures públicas/sintéticas; sin datos ni evidencia de clientes.
- Alpha/parcial; no contabilizado, sin GA ni promesa de producción.
- Los paquetes congelados siguen instalables; sin nuevas funciones, solo fallos reales.

## Trabajo relacionado

Paquetes hermanos e índices de familia: [dsh-qms-capa](https://github.com/PerryLink/dsh-qms-capa) · [dsh-policy-ledger](https://github.com/PerryLink/dsh-policy-ledger)

- [Índice de dominio](https://perrylink.github.io/dsh-plugins/)
- [Familia de checkers](https://perrylink.github.io/zh/checkers/)
- [Familia principal](https://github.com/PerryLink/dsh-kit)

## Familia

<details>
<summary>Familia de plugins DSH (15 paquetes + 2 suites)</summary>

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

## Licencia

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
