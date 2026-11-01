import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { FACTOR_ID, FACTOR_SOURCE, FACTOR_UNIT, FACTOR_VALUE_KG_PER_KWH, GhgError, emissionTco2e, parseCsv, parseElectricityPdfText } from '../core/ghg.js'
import { newId, type ActivityRecord, type FacilityRecord, type FactorRecord, type LineRecord, type ScopeRecord, type Table } from './storage.js'

export interface ToolDeps { facilities: Table<FacilityRecord>; activities: Table<ActivityRecord>; lines: Table<LineRecord>; baseDir: string; factors?: Table<FactorRecord>; scopes?: Table<ScopeRecord> }
const text = (value: string) => [{ type: 'text' as const, text: value }]
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const now = () => new Date().toISOString()
function requirePeriod(period: string) { if (!/^\d{4}-\d{2}$/.test(period)) throw new GhgError('E_GHG_BILL_INCOMPLETE', `bad period: ${period}`) }

export function createTools(deps: ToolDeps) {
  const facilityImport = defineTool({
    name: 'ghg.facility_import',
    description: 'Import a small facility boundary (id/name/site/region) into the local GHG pool. Local R1 write; no external system.',
    parameters: { facilities: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: { facility_id: { type: 'string', required: true }, name: { type: 'string', required: true }, site: { type: 'string' }, region: { type: 'string' } } } } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { imported: { type: 'number', required: true }, facility_ids: { type: 'array', items: { type: 'string' }, required: true } } }, render: (_a, v) => text(`imported ${v.imported} facilities`) },
    async execute(args) {
      const ids: string[] = []
      for (const facility of args.facilities) {
        const record: FacilityRecord = { facility_id: facility.facility_id, name: facility.name, site: facility.site ?? '', region: facility.region ?? '', created_at: now() }
        await deps.facilities.put(record.facility_id, record); ids.push(record.facility_id)
      }
      return { imported: ids.length, facility_ids: ids }
    },
  })

  const ingest = defineTool({
    name: 'ghg.ingest',
    description: 'Ingest an electricity CSV (date/month,kwh) for one facility/period; validates units and stores activity rows with an evidence hash. No PDF/OCR in S1.',
    parameters: { facility_id: { type: 'string', required: true }, period: { type: 'string', required: true }, csv_text: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { activity_ids: { type: 'array', items: { type: 'string' }, required: true }, rows: { type: 'number', required: true }, evidence_sha256: { type: 'string', required: true } } }, render: (_a, v) => text(`ingested ${v.rows} electricity rows`) },
    async execute(args) {
      if (!deps.facilities.get(args.facility_id)) throw new GhgError('E_GHG_FACILITY_NOT_FOUND', `unknown facility: ${args.facility_id}`)
      requirePeriod(args.period)
      const rows = parseCsv(args.csv_text)
      const evidence = sha256(args.csv_text)
      const ids: string[] = []
      for (const row of rows) {
        if (!row.date.startsWith(args.period)) throw new GhgError('E_GHG_BILL_INCOMPLETE', `row ${row.date} is outside ${args.period}`)
        const record: ActivityRecord = { activity_id: newId('act'), facility_id: args.facility_id, period: args.period, date: row.date, kwh: row.kwh, unit: 'kWh', evidence_sha256: evidence, created_at: now() }
        await deps.activities.put(record.activity_id, record); ids.push(record.activity_id)
      }
      return { activity_ids: ids, rows: ids.length, evidence_sha256: evidence }
    },
  })



  const scopeImport = defineTool({
    name: 'ghg.scope_import',
    description: 'Import public/synthetic Scope 1/3 figures for an ESRS pack. Local R1 write; not assurance-grade, not customer evidence.',
    parameters: { period: { type: 'string', required: true }, scope1_tco2e: { type: 'number', required: true }, scope3_tco2e: { type: 'number', required: true }, source: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { period: { type: 'string', required: true }, scope1_tco2e: { type: 'number', required: true }, scope3_tco2e: { type: 'number', required: true } } }, render: (_a, v) => text(`scope ${v.period}`) },
    async execute(args) { if (!deps.scopes) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'scope table unavailable'); requirePeriod(args.period); if (args.scope1_tco2e < 0 || args.scope3_tco2e < 0 || !args.source.trim()) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'invalid scope values'); const r: ScopeRecord = { period: args.period, scope1_tco2e: args.scope1_tco2e, scope3_tco2e: args.scope3_tco2e, source: args.source, created_at: now() }; await deps.scopes.put(args.period, r); return { period: r.period, scope1_tco2e: r.scope1_tco2e, scope3_tco2e: r.scope3_tco2e } },
  })

  const factorImport = defineTool({
    name: 'ghg.factor_import',
    description: 'Import a versioned public/synthetic electricity factor. Local R1 write; not assurance-grade.',
    parameters: { factor_id: { type: 'string', required: true }, value_kg_per_kwh: { type: 'number', required: true }, source: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { factor_id: { type: 'string', required: true }, value_kg_per_kwh: { type: 'number', required: true } } }, render: (_a, v) => text(`factor ${v.factor_id}`) },
    async execute(args) { if (!deps.factors) throw new GhgError('E_GHG_FACTOR_UNRESOLVED', 'factor table unavailable'); if (!args.factor_id.trim() || !args.source.trim() || !(args.value_kg_per_kwh > 0)) throw new GhgError('E_GHG_FACTOR_UNRESOLVED', 'invalid factor'); const record: FactorRecord = { factor_id: args.factor_id, value_kg_per_kwh: args.value_kg_per_kwh, unit: FACTOR_UNIT, source: args.source, created_at: now() }; await deps.factors.put(record.factor_id, record); return { factor_id: record.factor_id, value_kg_per_kwh: record.value_kg_per_kwh } },
  })


  const ingestPdf = defineTool({
    name: 'ghg.ingest_pdf',
    description: 'Extract date/kWh rows from a text-based PDF using pdfjs-dist; public/synthetic input only. Local R1 write; no OCR.',
    parameters: { pdf_base64: { type: 'string', required: true }, facility_id: { type: 'string', required: true }, period: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { rows: { type: 'number', required: true }, evidence_sha256: { type: 'string', required: true } } }, render: (_a, v) => text(`PDF rows=${v.rows}`) },
    async execute(args) {
      if (!deps.facilities.get(args.facility_id)) throw new GhgError('E_GHG_FACILITY_NOT_FOUND', `unknown facility: ${args.facility_id}`)
      requirePeriod(args.period)
      const buffer = Buffer.from(args.pdf_base64, 'base64'); if (buffer.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'empty PDF')
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const task = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, isEvalSupported: false, disableFontFace: true })
      const pdf = await task.promise
      let text = ''
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const page = await pdf.getPage(pageNo); const content = await page.getTextContent(); text += content.items.map((item: any) => item.str ?? '').join('\n') + '\n'
      }
      const rows = parseElectricityPdfText(text)
      const evidence = sha256(buffer); let inserted = 0
      for (const row of rows) {
        const activity: ActivityRecord = { activity_id: newId('act'), facility_id: args.facility_id, period: args.period, date: row.date, kwh: row.kwh, unit: 'kWh', evidence_sha256: evidence, created_at: now() }
        await deps.activities.put(activity.activity_id, activity); inserted += 1
      }
      return { rows: inserted, evidence_sha256: evidence }
    },
  })

  const matchFactor = defineTool({
    name: 'ghg.match_factor',
    description: 'Return the active electricity location factor (public reference) and its source/unit.',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { factor_id: { type: 'string', required: true }, value: { type: 'number', required: true }, unit: { type: 'string', required: true }, source: { type: 'string', required: true } } }, render: (_a, v) => text(`factor ${v.factor_id} = ${v.value} ${v.unit}`) },
    async execute() { return { factor_id: FACTOR_ID, value: FACTOR_VALUE_KG_PER_KWH, unit: FACTOR_UNIT, source: FACTOR_SOURCE } },
  })

  const calculate = defineTool({
    name: 'ghg.calculate',
    description: 'Calculate location-based electricity emissions for a facility/period: kWh × public grid factor / 1000 = tCO2e. Local R1 write; no Scope 3.',
    parameters: { facility_id: { type: 'string', required: true }, period: { type: 'string', required: true }, factor_id: { type: 'string' } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { lines: { type: 'number', required: true }, total_tco2e: { type: 'number', required: true }, factor_id: { type: 'string', required: true } } }, render: (_a, v) => text(`calculated ${v.lines} lines = ${v.total_tco2e} tCO2e`) },
    async execute(args) {
      if (!deps.facilities.get(args.facility_id)) throw new GhgError('E_GHG_FACILITY_NOT_FOUND', `unknown facility: ${args.facility_id}`)
      requirePeriod(args.period)
      const activities = [...deps.activities.entries()].map(([, value]) => value).filter((a) => a.facility_id === args.facility_id && a.period === args.period)
      if (activities.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', 'no electricity activity for this facility/period')
      const custom = args.factor_id ? deps.factors?.get(args.factor_id) : undefined
      if (args.factor_id && !custom) throw new GhgError('E_GHG_FACTOR_UNRESOLVED', `unknown factor: ${args.factor_id}`)
      const factorId = custom?.factor_id ?? FACTOR_ID
      const factorValue = custom?.value_kg_per_kwh ?? FACTOR_VALUE_KG_PER_KWH
      let total = 0
      for (const activity of activities) {
        const value = emissionTco2e(activity.kwh, factorValue)
        total += value
        const line: LineRecord = { line_id: `line_${activity.activity_id}`, activity_id: activity.activity_id, facility_id: activity.facility_id, period: activity.period, kwh: activity.kwh, factor_id: factorId, factor_value_kg_per_kwh: factorValue, emissions_tco2e: value, state: 'calculated', updated_at: now() }
        await deps.lines.put(line.line_id, line)
      }
      return { lines: activities.length, total_tco2e: Math.round(total * 1e6) / 1e6, factor_id: factorId }
    },
  })

  const verifyRow = defineTool({
    name: 'ghg.verify_row',
    description: 'Recalculate every stored line and compare with the stored value; returns rows and mismatches. Read-only after marking verified when zero-diff.',
    parameters: { facility_id: { type: 'string', required: true }, period: { type: 'string', required: true }, factor_id: { type: 'string' } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { checked: { type: 'number', required: true }, mismatches: { type: 'array', items: { type: 'string' }, required: true }, recalc_diff: { type: 'number', required: true } } }, render: (_a, v) => text(`verified ${v.checked} lines; mismatches=${v.mismatches.length}`) },
    async execute(args) {
      requirePeriod(args.period)
      const lines = [...deps.lines.entries()].map(([, value]) => value).filter((line) => line.facility_id === args.facility_id && line.period === args.period)
      const mismatches: string[] = []
      let diff = 0
      for (const line of lines) {
        const recalculated = emissionTco2e(line.kwh, line.factor_value_kg_per_kwh)
        const delta = Math.abs(recalculated - line.emissions_tco2e)
        if (delta > 1e-9) { mismatches.push(line.line_id); diff += delta } else { await deps.lines.put(line.line_id, { ...line, state: 'verified', updated_at: now() }) }
      }
      return { checked: lines.length, mismatches, recalc_diff: Math.round(diff * 1e9) / 1e9 }
    },
  })

  const exportWorkpaper = defineTool({
    name: 'ghg.export_workpaper',
    description: 'Export a 3-sheet xlsx workpaper (Facilities, Activities, Emissions) with source hashes. Local R1 write; no external send.',
    parameters: { facility_id: { type: 'string', required: true }, period: { type: 'string', required: true }, factor_id: { type: 'string' } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true }, sha256: { type: 'string', required: true }, sheets: { type: 'number', required: true } } }, render: (_a, v) => text(`exported ${v.sheets} sheets`) },
    async execute(args) {
      requirePeriod(args.period)
      const facilities = [...deps.facilities.entries()].map(([, value]) => value)
      const activities = [...deps.activities.entries()].map(([, value]) => value).filter((a) => a.facility_id === args.facility_id && a.period === args.period)
      const lines = [...deps.lines.entries()].map(([, value]) => value).filter((l) => l.facility_id === args.facility_id && l.period === args.period)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(facilities.map((f) => ({ facility_id: f.facility_id, name: f.name, site: f.site, region: f.region }))), 'Facilities')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(activities.map((a) => ({ activity_id: a.activity_id, date: a.date, kwh: a.kwh, evidence_sha256: a.evidence_sha256 }))), 'Activities')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lines.map((l) => ({ line_id: l.line_id, activity_id: l.activity_id, kwh: l.kwh, factor_id: l.factor_id, factor_value_kg_per_kwh: l.factor_value_kg_per_kwh, emissions_tco2e: l.emissions_tco2e, state: l.state }))), 'Emissions')
      const dir = path.join(deps.baseDir, 'exports'); await mkdir(dir, { recursive: true })
      const filePath = path.join(dir, `${args.facility_id}-${args.period}.xlsx`)
      const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
      await writeFile(filePath, buffer)
      return { path: filePath, sha256: sha256(buffer), sheets: workbook.SheetNames.length }
    },
  })


  const exportEsrs = defineTool({
    name: 'ghg.export_esrs',
    description: 'Export a partial ESRS E1 CSV summary (Scope 2 only; Scope 1/3 not in boundary) for a period. Local R1 write; not assurance-grade.',
    parameters: { period: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true }, sha256: { type: 'string', required: true }, scope2_tco2e: { type: 'number', required: true }, rows: { type: 'number', required: true } } }, render: (_a, v) => text(`ESRS E1 Scope2=${v.scope2_tco2e}`) },
    async execute(args) {
      requirePeriod(args.period)
      const lines = [...deps.lines.entries()].map(([, v]) => v).filter((line) => line.period === args.period)
      if (lines.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', `no emission lines for ${args.period}`)
      const scope2 = Math.round(lines.reduce((sum, line) => sum + line.emissions_tco2e, 0) * 1e6) / 1e6
      const csv = ['esrs_e1_field,value', `period,${args.period}`, `scope1_tco2e,0`, `scope2_tco2e,${scope2}`, `scope3_tco2e,0`, `boundary,partial`, `data_quality,partial`, `factor_id,${FACTOR_ID}`, `rows,${lines.length}`].join('\n') + '\n'
      const dir = path.join(deps.baseDir, 'exports'); await mkdir(dir, { recursive: true })
      const file = path.join(dir, `esrs-e1-${args.period}.csv`); await writeFile(file, csv)
      return { path: file, sha256: sha256(csv), scope2_tco2e: scope2, rows: lines.length }
    },
  })


  const exportEsrsPack = defineTool({
    name: 'ghg.export_esrs_pack',
    description: 'Export a partial ESRS E1 xlsx pack (summary, methodology, data quality, lines). Scope 2 only; Scope 1/3 are explicitly not in boundary. Local R1 write; not assurance-grade.',
    parameters: { period: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true }, sha256: { type: 'string', required: true }, sheets: { type: 'number', required: true }, scope2_tco2e: { type: 'number', required: true } } }, render: (_a, v) => text(`ESRS pack Scope2=${v.scope2_tco2e}`) },
    async execute(args) {
      requirePeriod(args.period)
      const lines = [...deps.lines.entries()].map(([, v]) => v).filter((line) => line.period === args.period)
      if (lines.length === 0) throw new GhgError('E_GHG_BILL_INCOMPLETE', `no emission lines for ${args.period}`)
      const scope2 = Math.round(lines.reduce((sum, line) => sum + line.emissions_tco2e, 0) * 1e6) / 1e6
      const scope = deps.scopes?.get(args.period)
      const factors = [...new Set(lines.map((line) => line.factor_id))].join(',')
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { field: 'period', value: args.period, note: 'public/synthetic' },
        { field: 'scope1_tco2e', value: scope?.scope1_tco2e ?? 0, note: scope ? `public/synthetic: ${scope.source}` : 'not in boundary' },
        { field: 'scope2_tco2e', value: scope2, note: 'location-based electricity' },
        { field: 'scope3_tco2e', value: scope?.scope3_tco2e ?? 0, note: scope ? `public/synthetic: ${scope.source}` : 'not in boundary' },
        { field: 'boundary', value: 'partial', note: 'Scope 2 only' },
      ]), 'E1-6 Summary')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { item: 'factor_ids', value: factors },
        { item: 'factor_unit', value: FACTOR_UNIT },
        { item: 'method', value: 'kWh × factor / 1000' },
        { item: 'source', value: 'public reference / synthetic test factors' },
      ]), 'Methodology')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { item: 'completeness', value: 'partial' },
        { item: 'assurance', value: 'not assurance-grade' },
        { item: 'exclusions', value: 'Scope 1, Scope 3, non-electricity' },
      ]), 'Data Quality')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lines.map((line) => ({ line_id: line.line_id, facility_id: line.facility_id, period: line.period, kwh: line.kwh, factor_id: line.factor_id, factor_value_kg_per_kwh: line.factor_value_kg_per_kwh, emissions_tco2e: line.emissions_tco2e }))), 'Lines')
      const dir = path.join(deps.baseDir, 'exports'); await mkdir(dir, { recursive: true })
      const file = path.join(dir, `esrs-e1-pack-${args.period}.xlsx`); const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })); await writeFile(file, buffer)
      return { path: file, sha256: sha256(buffer), sheets: wb.SheetNames.length, scope2_tco2e: scope2 }
    },
  })


  const coverage = defineTool({
    name: 'ghg.period_coverage',
    description: 'Report month coverage for one reporting year from stored electricity activity: covered/missing months, rows, kWh and calculated tCO2e. Read-only completeness check; local only, no external system.',
    parameters: { year: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { year: { type: 'string', required: true }, covered_months: { type: 'array', items: { type: 'string' }, required: true }, missing_months: { type: 'array', items: { type: 'string' }, required: true }, rows: { type: 'number', required: true }, kwh: { type: 'number', required: true }, tco2e: { type: 'number', required: true }, complete: { type: 'boolean', required: true } } }, render: (_a, v) => text(`coverage ${v.year}: ${v.covered_months.length}/12 months, missing ${v.missing_months.length}`) },
    async execute(args) {
      if (!/^\d{4}$/.test(args.year)) throw new GhgError('E_GHG_BILL_INCOMPLETE', `bad year: ${args.year}`)
      const byMonth = new Map<string, { rows: number; kwh: number }>()
      for (const [, activity] of deps.activities.entries()) {
        if (!String(activity.period).startsWith(args.year)) continue
        const cell = byMonth.get(activity.period) ?? { rows: 0, kwh: 0 }
        cell.rows += 1
        cell.kwh += activity.kwh
        byMonth.set(activity.period, cell)
      }
      const covered = [...byMonth.keys()].sort()
      const missing: string[] = []
      for (let month = 1; month <= 12; month += 1) {
        const key = `${args.year}-${String(month).padStart(2, '0')}`
        if (!byMonth.has(key)) missing.push(key)
      }
      const rows = covered.reduce((sum, key) => sum + (byMonth.get(key)?.rows ?? 0), 0)
      const kwh = covered.reduce((sum, key) => sum + (byMonth.get(key)?.kwh ?? 0), 0)
      return { year: args.year, covered_months: covered, missing_months: missing, rows, kwh: Math.round(kwh * 1e6) / 1e6, tco2e: Math.round(emissionTco2e(kwh) * 1e9) / 1e9, complete: missing.length === 0 }
    },
  })

  return [facilityImport, ingest, ingestPdf, scopeImport, factorImport, matchFactor, calculate, verifyRow, exportWorkpaper, exportEsrs, exportEsrsPack, coverage]
}
