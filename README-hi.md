<div align="center">

# dsh-ghg

> **आधिकारिक रिपॉज़िटरी।** इस पैकेज की एकमात्र आधिकारिक रिपॉज़िटरी, PerryLink द्वारा अनुरक्षित। अन्य खातों की समान-नाम वाली रिपॉज़िटरी संबद्ध नहीं हैं। Apache-2.0।

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

> ⭐ अगर यह मदद करे, तो एक स्टार अगले व्यक्ति को इसे खोजने में आसानी देता है। स्टार से कोई सुविधा अनलॉक नहीं होती।

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


### इंस्टॉल चैनल

npm अनुशंसित है; बाकी वर्ज़न पिन या ऑफ़लाइन के लिए हैं।

- **npm (अनुशंसित):** `dsh plugin --profile <profile> add dsh-ghg`
- **git चैनल:** `dsh plugin --profile <profile> add github:PerryLink/dsh-ghg`
- **tarball:** `pnpm pack` then `dsh plugin --profile <profile> add ./dsh-ghg-<version>.tgz`
- **1024 स्टोर:** `npm i -g dsh1024` then `dsh1024 plugin --profile <profile> add dsh-ghg`

## यह क्या करता है

बिजली गतिविधि अंतर्ग्रहण, स्थान-आधारित GHG गणना, वर्कपेपर और आंशिक ESRS पैक। DeepSeek Harness पर स्थानीय रूप से चलता है। नीचे दी गई तालिका ही सटीक टूल सतह है; उदाहरण वास्तविक कमांड का उपयोग करते हैं।

इनपुट और आउटपुट स्थानीय रहते हैं; कुछ अपलोड नहीं होता।

## टूल्स

टूल नाम स्थिर API हैं; विवरण स्थानीयकृत हैं।

| टूल | उद्देश्य | जोखिम |
|---|---|---|
| `ghg.facility_import` | फ़ैसिलिटी सीमा मेटाडेटा आयात करें | R1 local write |
| `ghg.ingest` | बिजली CSV (`date/month,kwh`) इनजेस्ट करें; MWh/इकाई बेमेल होने पर अस्वीकार करें | R1 local write |
| `ghg.ingest_pdf` | टेक्स्ट-आधारित PDF से date/kWh पंक्तियाँ निकालें; OCR या स्कैन की गई PDF नहीं | R1 local write |
| `ghg.match_factor` | बिजली लोकेशन फ़ैक्टर और उसका सार्वजनिक स्रोत लौटाएँ | R0 |
| `ghg.factor_import` | संस्करणित सार्वजनिक/सिंथेटिक फ़ैक्टर आयात करें | R1 local write |
| `ghg.scope_import` | आंशिक ESRS पैक के लिए सार्वजनिक/सिंथेटिक Scope 1/3 मान आयात करें | R1 local write |
| `ghg.calculate` | kWh को फ़ैक्टर (डिफ़ॉल्ट या आयातित) से गुणा करके tCO2e पंक्तियाँ बनाएँ | R0 |
| `ghg.verify_row` | सभी पंक्तियों की पुनर्गणना करें और बेमेल/अंतर लौटाएँ | R0 |
| `ghg.export_workpaper` | 3-शीट xlsx निर्यात करें: Facilities / Activities / Emissions | R1 local write |
| `ghg.export_esrs` | आंशिक ESRS E1 व्यू निर्यात करें; assurance-grade नहीं | R1 local write |
| `ghg.export_esrs_pack` | 4-शीट आंशिक ESRS E1 वर्कबुक निर्यात करें | R1 local write |

## त्वरित शुरुआत

```sh
dsh plugin --profile <profile> add dsh-ghg
dsh --profile <profile> --dump-config | grep dsh-ghg
```

## उदाहरण

### fixture-आधारित उदाहरण

इनपुट: [`fixtures/public/mit/energy_daily.csv`](fixtures/public/mit/energy_daily.csv)

कमांड: `pnpm test`

स्वीकृति पंक्ति:

| req_id | metric | threshold | actual | pass | source | counted |
|---|---|---|---|---|---|---|
| SKU-02-A01 | 电费活动行（30 行） | 30/30 | 30 | true | public/synthetic | false |

*यह fixture-आधारित स्वीकृति पंक्ति है, ग्राहक रन नहीं; कोई आउटपुट नहीं गढ़ा गया।*

## सीमाएँ

- केवल सार्वजनिक/सिंथेटिक; ग्राहक डेटा या साक्ष्य नहीं।
- alpha/आंशिक, गिना नहीं गया, GA या उत्पादन-तैयारी का दावा नहीं।
- जब तक टूल स्पष्ट न कहे, मॉडल या नेटवर्क कॉल नहीं।
- सटीक सीमाएँ तालिका और `ACCEPTANCE.csv` में हैं।

## सार्वजनिक नमूना

सार्वजनिक/सिंथेटिक fixtures `fixtures/` में हैं; `ACCEPTANCE.csv` सार्वजनिक जाँचों को `counted=false` के साथ दर्ज करता है।

## विकास

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | `dsh >=0.2.1-rc.3 <0.3.0` |
| Node | `>=24.9.0 <25` |
| Platforms | All; local files only |
| डेटा | No network, no model call, no upload |

## अनुमतियाँ और डेटा

- स्थानीय रूप से चलता है; नेटवर्क, मॉडल कॉल या अपलोड नहीं।
- केवल सार्वजनिक/सिंथेटिक fixtures; ग्राहक डेटा या साक्ष्य नहीं।
- alpha/आंशिक; गिना नहीं गया, GA या उत्पादन-तैयारी का दावा नहीं।
- फ़्रीज़ पैकेज इंस्टॉल योग्य रहते हैं; नई सुविधाएँ नहीं, केवल वास्तविक खराबी।

## संबंधित कार्य

सहोदर पैकेज और परिवार सूचकांक: [dsh-qms-capa](https://github.com/PerryLink/dsh-qms-capa) · [dsh-policy-ledger](https://github.com/PerryLink/dsh-policy-ledger)

- [डोमेन सूचकांक](https://perrylink.github.io/dsh-plugins/)
- [चेकर परिवार](https://perrylink.github.io/zh/checkers/)
- [मुख्य परिवार](https://github.com/PerryLink/dsh-kit)

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


<details>
<summary>मुख्य परिवार — 92 वर्तमान इंस्टॉल spec</summary>

| Package | npm |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | [npm](https://www.npmjs.com/package/dsh-aqua-input-check) |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | [npm](https://www.npmjs.com/package/dsh-archive-check) |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | [npm](https://www.npmjs.com/package/dsh-bid-ca-precheck) |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | [npm](https://www.npmjs.com/package/dsh-bid-qual-check) |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | [npm](https://www.npmjs.com/package/dsh-contract-stance) |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | [npm](https://www.npmjs.com/package/dsh-customs-doc-check) |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | [npm](https://www.npmjs.com/package/dsh-demurrage-ledger) |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | [npm](https://www.npmjs.com/package/dsh-drill-script-check) |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | [npm](https://www.npmjs.com/package/dsh-eia-guide-check) |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | [npm](https://www.npmjs.com/package/dsh-emergency-plan) |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | [npm](https://www.npmjs.com/package/dsh-essay-rubric-check) |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | [npm](https://www.npmjs.com/package/dsh-evidence-check) |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | [npm](https://www.npmjs.com/package/dsh-export-ctl-check) |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | [npm](https://www.npmjs.com/package/dsh-fmea-table-check) |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | [npm](https://www.npmjs.com/package/dsh-forecast-penalty) |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | [npm](https://www.npmjs.com/package/dsh-gongwen-flow-check) |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | [npm](https://www.npmjs.com/package/dsh-gongwen-word-check) |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | [npm](https://www.npmjs.com/package/dsh-guard-plan-qc) |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | [npm](https://www.npmjs.com/package/dsh-hazchem-check) |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | [npm](https://www.npmjs.com/package/dsh-hazplan-check) |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | [npm](https://www.npmjs.com/package/dsh-hidden-risk-map) |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | [npm](https://www.npmjs.com/package/dsh-hs-classify) |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | [npm](https://www.npmjs.com/package/dsh-icd-rule-check) |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | [npm](https://www.npmjs.com/package/dsh-lawcite-adapter) |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | [npm](https://www.npmjs.com/package/dsh-lc-doc-check) |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | [npm](https://www.npmjs.com/package/dsh-learning-gap-check) |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | [npm](https://www.npmjs.com/package/dsh-medrec-qc) |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | [npm](https://www.npmjs.com/package/dsh-nsfc-form-check) |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | [npm](https://www.npmjs.com/package/dsh-nurse-record-check) |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | [npm](https://www.npmjs.com/package/dsh-origin-rvc-check) |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | [npm](https://www.npmjs.com/package/dsh-ota-review-check) |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | [npm](https://www.npmjs.com/package/dsh-paper-doc-adapter) |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | [npm](https://www.npmjs.com/package/dsh-permit-report-check) |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | [npm](https://www.npmjs.com/package/dsh-pipeline-check) |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | [npm](https://www.npmjs.com/package/dsh-pleading-draft) |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | [npm](https://www.npmjs.com/package/dsh-policy-brief-draft) |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | [npm](https://www.npmjs.com/package/dsh-power-loss-split) |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | [npm](https://www.npmjs.com/package/dsh-power-ticket-check) |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | [npm](https://www.npmjs.com/package/dsh-ppap-check) |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | [npm](https://www.npmjs.com/package/dsh-protest-deadline) |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | [npm](https://www.npmjs.com/package/dsh-railway-window) |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | [npm](https://www.npmjs.com/package/dsh-repair-order-qc) |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | [npm](https://www.npmjs.com/package/dsh-review-reply-check) |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | [npm](https://www.npmjs.com/package/dsh-rulefile-check) |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | [npm](https://www.npmjs.com/package/dsh-safety-brief-check) |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | [npm](https://www.npmjs.com/package/dsh-site-log-check) |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | [npm](https://www.npmjs.com/package/dsh-soe-decision-check) |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | [npm](https://www.npmjs.com/package/dsh-soilwater-check) |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | [npm](https://www.npmjs.com/package/dsh-sop-sync-check) |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | [npm](https://www.npmjs.com/package/dsh-spc-gbt-adapter) |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | [npm](https://www.npmjs.com/package/dsh-tender-extract) |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | [npm](https://www.npmjs.com/package/dsh-tender-matrix) |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | [npm](https://www.npmjs.com/package/dsh-warranty-calc) |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | [npm](https://www.npmjs.com/package/dsh-auto-review) |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | [npm](https://www.npmjs.com/package/dsh-autotier) |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | [npm](https://www.npmjs.com/package/dsh-budget) |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | [npm](https://www.npmjs.com/package/dsh-cert-mcp) |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | [npm](https://www.npmjs.com/package/dsh-checkpoint-rewind) |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | [npm](https://www.npmjs.com/package/dsh-claude-move) |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | [npm](https://www.npmjs.com/package/dsh-click) |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | [npm](https://www.npmjs.com/package/dsh-composer-history) |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | [npm](https://www.npmjs.com/package/dsh-data-quality) |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | [npm](https://www.npmjs.com/package/dsh-defend) |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | [npm](https://www.npmjs.com/package/dsh-doublecheck) |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | [npm](https://www.npmjs.com/package/dsh-draw) |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | [npm](https://www.npmjs.com/package/dsh-fast) |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | [npm](https://www.npmjs.com/package/dsh-fund-research) |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | [npm](https://www.npmjs.com/package/dsh-industry-research) |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | [npm](https://www.npmjs.com/package/dsh-laya) |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | [npm](https://www.npmjs.com/package/dsh-library) |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | [npm](https://www.npmjs.com/package/dsh-local-ai) |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | [npm](https://www.npmjs.com/package/dsh-lsp-actions) |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | [npm](https://www.npmjs.com/package/dsh-mask) |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | [npm](https://www.npmjs.com/package/dsh-mcp-panel) |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | [npm](https://www.npmjs.com/package/dsh-memento) |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | [npm](https://www.npmjs.com/package/dsh-observe) |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | [npm](https://www.npmjs.com/package/dsh-output-styles) |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | [npm](https://www.npmjs.com/package/dsh-permission-rules) |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | [npm](https://www.npmjs.com/package/dsh-plugin-guide) |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | [npm](https://www.npmjs.com/package/dsh-plugin-upgrade) |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | [npm](https://www.npmjs.com/package/dsh-reach) |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | [npm](https://www.npmjs.com/package/dsh-research-report) |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | [npm](https://www.npmjs.com/package/dsh-score) |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | [npm](https://www.npmjs.com/package/dsh-session-sync) |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | [npm](https://www.npmjs.com/package/dsh-talk) |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | [npm](https://www.npmjs.com/package/dsh-test-drive) |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | [npm](https://www.npmjs.com/package/dsh-translate) |
| **[](https://github.com/PerryLink/)** | [npm](https://www.npmjs.com/package/) |
| **[](https://github.com/PerryLink/)** | [npm](https://www.npmjs.com/package/) |
| **[](https://github.com/PerryLink/)** | [npm](https://www.npmjs.com/package/) |
| **[](https://github.com/PerryLink/)** | [npm](https://www.npmjs.com/package/) |
| **[](https://github.com/PerryLink/)** | [npm](https://www.npmjs.com/package/) |

</details>

## लाइसेंस

Apache-2.0. See `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES`.
