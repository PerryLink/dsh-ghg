<div align="center">

# dsh-ghg

[![npm](https://img.shields.io/npm/v/dsh-ghg)](https://www.npmjs.com/package/dsh-ghg)
[![CI](https://github.com/PerryLink/dsh-ghg/actions/workflows/ci.yml/badge.svg)](https://github.com/PerryLink/dsh-ghg/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-%E2%9C%93-green)](https://github.com/topics/dsh-plugin)
[![docs](https://img.shields.io/badge/docs-domain%20index-0b5fff)](https://perrylink.github.io/dsh-plugins/)

**बिजली गतिविधि अंतर्ग्रहण, स्थान-आधारित GHG गणना, वर्कपेपर और आंशिक ESRS पैक।**

> **स्थिति: alpha / सार्वजनिक-सिंथेटिक / आंशिक / गिना नहीं गया / GA नहीं।** ग्राहक साक्ष्य, ग्राहक डेटा या उत्पादन-तैयारी का दावा नहीं।

> 🧊 **फ़्रीज़ — 2026-10-31। कोई नई सुविधा नहीं।** इंस्टॉल योग्य; केवल वास्तविक खराबी ठीक होगी।

## रखरखाव स्थिति: 🧊 फ़्रीज़

2026-10-31 को फ़्रीज़; पैकेज इंस्टॉल योग्य रहेगा, लेकिन नई सुविधाएँ नहीं मिलेंगी।

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <profile> add dsh-ghg
```

</div>

![Workflow diagram for dsh-ghg: local input, plugin, local output.](docs/assets/dsh-ghg-flow.svg)

*वर्कफ़्लो: स्थानीय इनपुट → प्लगइन → स्थानीय आउटपुट। मॉडल कॉल आवश्यक नहीं।*

## इंस्टॉल

इंस्टॉल और सत्यापन:

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

अनइंस्टॉल:

```sh
dsh plugin --profile <profile> remove dsh-ghg
```

## यह क्या करता है

बिजली गतिविधि अंतर्ग्रहण, स्थान-आधारित GHG गणना, वर्कपेपर और आंशिक ESRS पैक। DeepSeek Harness पर स्थानीय रूप से चलता है। नीचे दी गई तालिका ही सटीक टूल सतह है; उदाहरण वास्तविक कमांड का उपयोग करते हैं।

इनपुट और आउटपुट स्थानीय रहते हैं; कुछ अपलोड नहीं होता।

## टूल्स

टूल नाम और विवरण runtime आउटपुट से मेल खाने के लिए अंग्रेज़ी में रखे गए हैं।

| टूल | उद्देश्य (अंग्रेज़ी) | जोखिम |
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

## त्वरित शुरुआत

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

## सीमाएँ

- केवल सार्वजनिक/सिंथेटिक; ग्राहक डेटा या साक्ष्य नहीं।
- alpha/आंशिक, गिना नहीं गया, GA या उत्पादन-तैयारी का दावा नहीं।
- जब तक टूल स्पष्ट न कहे, मॉडल या नेटवर्क कॉल नहीं।
- सटीक सीमाएँ तालिका और `ACCEPTANCE.csv` में हैं।

## सार्वजनिक नमूना

सार्वजनिक/सिंथेटिक fixtures `test/fixtures/` में हैं; `ACCEPTANCE.csv` सार्वजनिक जाँचों को `counted=false` के साथ दर्ज करता है।

## विकास

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## परिवार

<details>
<summary>DSH डोमेन प्लगइन परिवार (15 पैकेज + 2 suites)</summary>

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

## लाइसेंस

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
