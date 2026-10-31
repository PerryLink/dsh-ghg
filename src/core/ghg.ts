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

export function parseCsv(text: string): Array<{ date: string; kwh: number }> {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'CSV needs header + rows')
  const header = lines[0]!.split(',').map((value) => value.trim().toLowerCase())
  const dateIndex = header.indexOf('date') >= 0 ? header.indexOf('date') : header.indexOf('month')
  const kwhIndex = header.indexOf('kwh')
  if (dateIndex < 0 || kwhIndex < 0) throw new GhgError('E_GHG_UNIT_MISMATCH', 'CSV header must include date/month and kwh')
  const rows: Array<{ date: string; kwh: number }> = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((value) => value.trim())
    const date = cells[dateIndex] ?? ''
    const raw = cells[kwhIndex] ?? ''
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(date)) throw new GhgError('E_GHG_BILL_INCOMPLETE', `bad date: ${date}`)
    if (raw.includes('mwh') || raw.includes('MWh')) throw new GhgError('E_GHG_UNIT_MISMATCH', 'use kWh, not MWh')
    const kwh = Number(raw)
    if (!Number.isFinite(kwh) || kwh < 0) throw new GhgError('E_GHG_UNIT_MISMATCH', `bad kWh: ${raw}`)
    rows.push({ date, kwh })
  }
  if (rows.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'no activity rows')
  return rows
}
