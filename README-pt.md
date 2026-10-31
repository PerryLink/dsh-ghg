<div align="center">

# dsh-ghg

[![npm](https://img.shields.io/npm/v/dsh-ghg)](https://www.npmjs.com/package/dsh-ghg)
[![CI](https://github.com/PerryLink/dsh-ghg/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-ghg/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)

**Ingestão de atividade elétrica, cálculo de GEE por localização, planilha e pacote ESRS parcial.**

> **Status: alpha / sintético público / parcial / não contabilizado / não GA.** Sem evidência de clientes, dados de clientes ou promessa de produção.

> 🧊 **CONGELADO — 2026-10-31. Sem novos recursos.** Instalável; apenas falhas reais são corrigidas.

## Status de manutenção: 🧊 CONGELADO

Congelado em 2026-10-31; o pacote continua instalável, mas não recebe novos recursos.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-ghg
```

</div>

![Workflow diagram for dsh-ghg: local input, plugin, local output.](docs/assets/dsh-ghg-flow.svg)

*Fluxo: entrada local → plugin → saída local. Não exige chamada a modelo.*

## Instalação

Instalar e verificar:

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

Desinstalar:

```sh
dsh plugin --profile <profile> remove dsh-ghg
```

## O que faz

Ingestão de atividade elétrica, cálculo de GEE por localização, planilha e pacote ESRS parcial. Executa localmente no DeepSeek Harness. A tabela abaixo é a superfície exata de ferramentas; os exemplos usam a interface real.

Entrada e saída permanecem locais; nada é enviado.

## Ferramentas

Nomes e descrições de ferramentas ficam em inglês para corresponder à saída runtime.

| Ferramenta | Finalidade (em inglês) | Risco |
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

## Início rápido

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

## Limites

- Apenas público/sintético; sem dados ou evidência de clientes.
- Alpha/parcial, não contabilizado, sem GA ou promessa de produção.
- Sem modelo ou rede, a menos que uma ferramenta indique.
- Os limites exatos estão na tabela e em `ACCEPTANCE.csv`.

## Amostra pública

As fixtures públicas/sintéticas ficam em `test/fixtures/`; `ACCEPTANCE.csv` registra as verificações com `counted=false`.

## Desenvolvimento

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## Família

<details>
<summary>Família de plugins DSH (15 pacotes + 2 suites)</summary>

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

## Licença

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
