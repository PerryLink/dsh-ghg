# 故障排查 — dsh-ghg

每条按「症状 / 原因 / 动作」写。报错原文都是 `<一句人话>（E_XXX）｜下一步：<动作>`，
把 `E_XXX` 和这句话一起发到 issue 即可定位；不要把真实电费单贴进 issue。

## 1. 电费表缺行或缺列（E_GHG_BILL_INCOMPLETE）

- **症状**：`这张电费表缺行或缺列，读不完整（E_GHG_BILL_INCOMPLETE）｜下一步：确认表头有 date（或 month）和 kwh，每行列数一致，日期落在 reporting period 内`
- **原因**：表头被改成中文；某行少一个逗号；日期不在所选月份（例如把 7 月的单子写进了 2026-06）。
- **动作**：表头保留 `date,kwh`；每行两列；`period` 与行内日期同月；再跑 `ghg.ingest`。

## 2. 电量单位不是 kWh（E_GHG_UNIT_MISMATCH）

- **症状**：`电量单位不是 kWh，或数值读不出来（E_GHG_UNIT_MISMATCH）｜下一步：把这一列改成 kWh 数值（例如 1200），不要写 1.2 MWh`
- **原因**：电费单上写的是 MWh，或数字里带千分位逗号 / 单位文字。
- **动作**：先自己乘 1000 换成 kWh，只留数字（`1200`），再导入；本包不会静默帮你换算。

## 3. 找不到工厂编号或排放因子（E_GHG_FACILITY_NOT_FOUND / E_GHG_FACTOR_UNRESOLVED）

- **症状**：`找不到这家工厂的编号（E_GHG_FACILITY_NOT_FOUND）｜下一步：先用 ghg.facility_import 导入，再用返回的 facility_id`
- **原因**：`facility_id` 拼错，或在新的空库里直接跑 `ghg.ingest`。
- **动作**：先 `ghg.facility_import` 并记下返回的 `facility_ids`；自定义因子同理，先 `ghg.factor_import`。

## 4. 导出被拒（E_GHG_PATH_INVALID / E_GHG_PATH_NOT_ALLOWED）

- **症状**：`导出文件名不合法（E_GHG_PATH_INVALID）｜下一步：设施编号只用字母、数字、下划线和连字符`
- **原因**：设施编号里带 `/`、空格、中文或 `..`，拼出的文件名越界。
- **动作**：把 `facility_id` 改成 `CN-SUZ-01` 这类安全写法；导出只会落在 `exports/` 下。

## 还不行

```sh
node samples/quickstart/run.mjs --check   # 自带样例必须通过
node --test test/*.test.mjs               # 27 项测试
```

仍失败时请在 <https://github.com/PerryLink/dsh-ghg/issues> 附上：包版本、最小合成输入、完整报错那一行。
