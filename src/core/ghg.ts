export const FACTOR_ID = 'electricity-location-cn-2022-v1'
export const FACTOR_VALUE_KG_PER_KWH = 0.5703
export const FACTOR_SOURCE = 'public reference: China national grid average (2022), not assurance-grade'
export const FACTOR_UNIT = 'kgCO2e/kWh'

export type Lifecycle = 'calculated' | 'verified' | 'exported'

export interface Facility {
  facility_id: string
  name: string
  site: string
  region: string
  created_at: string
}

export interface Activity {
  activity_id: string
  facility_id: string
  period: string
  date: string
  kwh: number
  unit: 'kWh'
  evidence_sha256: string
  created_at: string
}

export interface EmissionLine {
  line_id: string
  activity_id: string
  facility_id: string
  period: string
  kwh: number
  factor_id: string
  factor_value_kg_per_kwh: number
  emissions_tco2e: number
  state: Lifecycle
  updated_at: string
}

export type GhgErrorCode =
  | 'E_GHG_BOUNDARY_MISSING'
  | 'E_GHG_UNIT_MISMATCH'
  | 'E_GHG_BILL_INCOMPLETE'
  | 'E_GHG_FACILITY_NOT_FOUND'
  | 'E_GHG_FACTOR_UNRESOLVED'
  | 'E_GHG_RECALC_MISMATCH'
  | 'E_GHG_EXPORT_FAILED'
  | 'E_GHG_PATH_INVALID'
  | 'E_GHG_PATH_NOT_ALLOWED'

/** User-facing wording: one plain sentence, the code, then exactly one next action. */
const GHG_HUMAN: Record<GhgErrorCode, { text: string; next: string }> = {
  E_GHG_BOUNDARY_MISSING: { text: '还没有设好这家工厂的核算边界', next: '先用 ghg_facility_import 导入工厂编号、名称、站点和区域' },
  E_GHG_UNIT_MISMATCH: { text: '电量单位不是 kWh，或数值读不出来', next: '把这一列改成 kWh 数值（例如 1200），不要写 1.2 MWh' },
  E_GHG_BILL_INCOMPLETE: { text: '这张电费表缺行或缺列，读不完整', next: '确认表头有 date（或 month）和 kwh，每行列数一致，日期落在 reporting period 内' },
  E_GHG_FACILITY_NOT_FOUND: { text: '找不到这家工厂的编号', next: '先用 ghg_facility_import 导入，再用返回的 facility_id' },
  E_GHG_FACTOR_UNRESOLVED: { text: '这个排放因子找不到', next: '先用 ghg_factor_import 导入因子，或去掉 factor_id 改用默认电网因子' },
  E_GHG_RECALC_MISMATCH: { text: '逐行复算和存储的排放值对不上', next: '重新跑 ghg_calculate 生成排放行，再跑一次 ghg_verify_row' },
  E_GHG_EXPORT_FAILED: { text: '底稿或 ESRS 包导出失败', next: '确认 $DSH_HOME/storages/dsh-ghg 可写、磁盘还有空间，再重试' },
  E_GHG_PATH_INVALID: { text: '导出文件名不合法', next: '设施编号只用字母、数字、下划线和连字符' },
  E_GHG_PATH_NOT_ALLOWED: { text: '导出路径跑到允许目录之外了', next: '把设施编号里的斜杠和点点去掉，再导出' },
}

export class GhgError extends Error {
  readonly code: GhgErrorCode
  readonly retryable: boolean
  readonly needsReview: boolean
  /** Technical detail for logs — never shown to the user. */
  readonly detail: string
  constructor(code: GhgErrorCode, detail = '', options: { retryable?: boolean; needsReview?: boolean } = {}) {
    const human = GHG_HUMAN[code]
    super(`${human.text}（${code}）｜下一步：${human.next}`)
    this.name = 'GhgError'
    this.code = code
    this.detail = detail
    this.retryable = options.retryable ?? false
    this.needsReview = options.needsReview ?? false
  }
}

export function emissionTco2e(kwh: number, factorValue = FACTOR_VALUE_KG_PER_KWH): number {
  return Math.round((kwh * factorValue / 1000) * 1e6) / 1e6
}

/** Upper bound on imported activity rows; protects against memory/CPU abuse on huge CSVs. */
export const CSV_MAX_ROWS = 50_000

export function parseCsv(text: string): Array<{ date: string; kwh: number }> {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length < 2) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'CSV needs header + rows')
  const header = lines[0]!.split(',').map((value) => value.trim().toLowerCase())
  const dateIndex = header.indexOf('date') >= 0 ? header.indexOf('date') : header.indexOf('month')
  const kwhIndex = header.indexOf('kwh')
  if (dateIndex < 0 || kwhIndex < 0) throw new GhgError('E_GHG_UNIT_MISMATCH', 'CSV header must include date/month and kwh')
  const dataLines = lines.slice(1)
  if (dataLines.length > CSV_MAX_ROWS) throw new GhgError('E_GHG_BILL_INCOMPLETE', `CSV exceeds ${CSV_MAX_ROWS} rows`)
  const rows: Array<{ date: string; kwh: number }> = []
  for (const [index, line] of dataLines.entries()) {
    const cells = line.split(',').map((value) => value.trim())
    // Hand-written split(',') silently shifts columns when a cell is missing; require the exact width.
    if (cells.length !== header.length) throw new GhgError('E_GHG_BILL_INCOMPLETE', `row ${index + 2}: expected ${header.length} columns, got ${cells.length}`)
    const date = cells[dateIndex] ?? ''
    const raw = cells[kwhIndex] ?? ''
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(date)) throw new GhgError('E_GHG_BILL_INCOMPLETE', `bad date: ${date}`)
    if (raw === '') throw new GhgError('E_GHG_BILL_INCOMPLETE', `row ${index + 2}: empty kWh`)
    if (raw.includes('mwh') || raw.includes('MWh')) throw new GhgError('E_GHG_UNIT_MISMATCH', 'use kWh, not MWh')
    const kwh = Number(raw)
    if (!Number.isFinite(kwh) || kwh < 0) throw new GhgError('E_GHG_UNIT_MISMATCH', `bad kWh: ${raw}`)
    rows.push({ date, kwh })
  }
  if (rows.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'no activity rows')
  return rows
}


export function parseElectricityPdfText(text: string): Array<{ date: string; kwh: number }> {
  const rows: Array<{ date: string; kwh: number }> = []
  const re = /(\d{4}-\d{2}-\d{2})\s*[,\s]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kwh|千瓦时)?/gi
  for (const match of text.matchAll(re)) {
    const date = match[1]!
    const kwh = Number(match[2])
    if (!Number.isFinite(kwh) || kwh < 0) continue
    rows.push({ date, kwh })
  }
  if (rows.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'PDF text has no date/kWh rows')
  return rows
}

/** The 15 Scope 3 categories of the GHG Protocol Corporate Value Chain (Scope 3) Standard. */
export const SCOPE3_CATEGORIES = [
  'purchased goods and services',
  'capital goods',
  'fuel- and energy-related activities',
  'upstream transportation and distribution',
  'waste generated in operations',
  'business travel',
  'employee commuting',
  'upstream leased assets',
  'downstream transportation and distribution',
  'processing of sold products',
  'use of sold products',
  'end-of-life treatment of sold products',
  'downstream leased assets',
  'franchises',
  'investments',
] as const
export interface Scope3Row { category: number; tco2e: number; source?: string }
export interface Scope3Issue { code: string; detail: string }
export interface Scope3Summary {
  categories: Array<{ category: number; name: string; tco2e: number }>
  total_tco2e: number
  reported_categories: number
  issues: Scope3Issue[]
}
export function summarizeScope3(rows: Scope3Row[]): Scope3Summary {
  const buckets = new Map<number, number>()
  const issues: Scope3Issue[] = []
  for (const row of rows) {
    if (!Number.isInteger(row.category) || row.category < 1 || row.category > 15) {
      issues.push({ code: 'E_GHG_SCOPE3_CATEGORY', detail: `category ${row.category} is outside 1-15` })
      continue
    }
    if (!Number.isFinite(row.tco2e) || row.tco2e < 0) {
      issues.push({ code: 'E_GHG_SCOPE3_VALUE', detail: `category ${row.category} has a non-finite or negative value` })
      continue
    }
    buckets.set(row.category, (buckets.get(row.category) ?? 0) + row.tco2e)
  }
  const categories = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([category, value]) => ({ category, name: SCOPE3_CATEGORIES[category - 1]!, tco2e: Math.round(value * 1e9) / 1e9 }))
  const total = categories.reduce((sum, c) => sum + c.tco2e, 0)
  return { categories, total_tco2e: Math.round(total * 1e9) / 1e9, reported_categories: categories.length, issues }
}
