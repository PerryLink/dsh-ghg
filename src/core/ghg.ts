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

export class GhgError extends Error {
  readonly code: GhgErrorCode
  readonly retryable: boolean
  readonly needsReview: boolean
  constructor(code: GhgErrorCode, message: string, options: { retryable?: boolean; needsReview?: boolean } = {}) {
    super(`${code}: ${message}`)
    this.name = 'GhgError'
    this.code = code
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
