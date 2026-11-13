import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readWorkbook } from '../lib/core/xlsx-lite.js'
import { createTools } from '../lib/plugin/tools.js'

class FakeTable {
  map = new Map()
  get(key) { return this.map.get(key) }
  entries() { return this.map.entries() }
  get size() { return this.map.size }
  async put(key, value) { this.map.set(key, value) }
}
function csv(rows = 30) {
  const lines = ['date,kwh']
  for (let i = 1; i <= rows; i += 1) lines.push(`2026-01-${String(i).padStart(2, '0')},${100 + i}`)
  return lines.join('\n')
}
function sheetRecords(workbook, name) {
  const sheet = workbook.sheets.find((entry) => entry.name === name)
  assert.ok(sheet, `missing sheet ${name}`)
  const [header = [], ...rows] = sheet.rows
  return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index]])))
}
async function setup(dir) {
  const tools = createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), baseDir: path.join(dir, 'store') })
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  const exec = { callId: 'ghg-call', agent: { id: 'tester' } }
  await byName['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic plant', site: 'CN', region: 'CN' }] }, exec)
  return { byName, exec }
}

test('30 electricity rows -> calculate -> verify -> 3-sheet xlsx', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-test-'))
  try {
    const { byName, exec } = await setup(dir)
    const factor = await byName['ghg_match_factor'].execute({}, exec)
    assert.equal(factor.value, 0.5703)
    const ingested = await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    assert.equal(ingested.rows, 30)
    const calculated = await byName['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(calculated.lines, 30)
    const verified = await byName['ghg_verify_row'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(verified.checked, 30)
    assert.equal(verified.mismatches.length, 0)
    assert.equal(verified.recalc_diff, 0)
    const exported = await byName['ghg_export_workpaper'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(exported.sheets, 3)
    const wb = readWorkbook(await readFile(exported.path))
    assert.deepEqual(wb.sheets.map((sheet) => sheet.name), ['Facilities', 'Activities', 'Emissions'])
    assert.deepEqual(wb.sheets.map((sheet) => sheet.rows.length), [2, 31, 31])
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('MWh is rejected rather than silently converted', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-test-'))
  try {
    const { byName, exec } = await setup(dir)
    await assert.rejects(() => byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: 'date,kwh\n2026-01-01,1 MWh' }, exec), /E_GHG_UNIT_MISMATCH/)
    await assert.rejects(() => byName['ghg_ingest'].execute({ facility_id: 'NO', period: '2026-01', csv_text: csv(1) }, exec), /E_GHG_FACILITY_NOT_FOUND/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('year coverage reports covered and missing months with totals', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-coverage-'))
  try {
    const { byName, exec } = await setup(dir)
    await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-02', csv_text: 'date,kwh\n2026-02-01,100\n2026-02-02,200' }, exec)
    const coverage = await byName['ghg_period_coverage'].execute({ year: '2026' }, exec)
    assert.deepEqual(coverage.covered_months, ['2026-01', '2026-02'])
    assert.equal(coverage.missing_months.length, 10)
    assert.equal(coverage.missing_months[0], '2026-03')
    assert.equal(coverage.rows, 32)
    assert.equal(coverage.kwh, 3765)
    assert.ok(coverage.tco2e > 0)
    assert.equal(coverage.complete, false)
    await assert.rejects(() => byName['ghg_period_coverage'].execute({ year: '26' }, exec), /E_GHG_BILL_INCOMPLETE/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('partial ESRS E1 summary from calculated Scope 2', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-esrs-'))
  try {
    const { byName, exec } = await setup(dir)
    await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    await byName['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    const esrs = await byName['ghg_export_esrs'].execute({ period: '2026-01' }, exec)
    assert.ok(esrs.scope2_tco2e > 0)
    const text = await readFile(esrs.path, 'utf8')
    assert.match(text, /scope1_tco2e,0/)
    assert.match(text, /boundary,partial/)
    assert.match(text, /scope2_tco2e,/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('public MIT daily kWh sample through ingest/calculate', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-public-'))
  try {
    const { byName, exec } = await setup(dir)
    const csvText = await readFile('fixtures/public/mit/energy_daily.csv', 'utf8')
    const ingested = await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-07', csv_text: csvText }, exec)
    assert.ok(ingested.rows >= 20)
    const calculated = await byName['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-07' }, exec)
    assert.equal(calculated.lines, ingested.rows)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('custom factor import drives calculation', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-factor-'))
  try {
    const tools = createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), factors: new FakeTable(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'factor', agent: { id: 'tester' } }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic', site: 'CN', region: 'CN' }] }, exec)
    await by['ghg_factor_import'].execute({ factor_id: 'synthetic-factor', value_kg_per_kwh: 0.5, source: 'public/synthetic test' }, exec)
    await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: 'date,kwh\n2026-01-01,100' }, exec)
    const calculated = await by['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01', factor_id: 'synthetic-factor' }, exec)
    assert.equal(calculated.factor_id, 'synthetic-factor')
    assert.equal(calculated.total_tco2e, 0.05)
    await assert.rejects(() => by['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01', factor_id: 'missing' }, exec), /E_GHG_FACTOR_UNRESOLVED/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('partial ESRS E1 xlsx pack', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-pack-'))
  try {
    const { byName, exec } = await setup(dir)
    await byName['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    await byName['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    const pack = await byName['ghg_export_esrs_pack'].execute({ period: '2026-01' }, exec)
    assert.ok(pack.scope2_tco2e > 0)
    assert.equal(pack.sheets, 4)
    const wb = readWorkbook(await readFile(pack.path))
    assert.deepEqual(wb.sheets.map((sheet) => sheet.name), ['E1-6 Summary', 'Methodology', 'Data Quality', 'Lines'])
    assert.deepEqual(wb.sheets.map((sheet) => sheet.rows.length), [6, 5, 4, 31])
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('synthetic PDF electricity ingest', async () => {
  const { PDFDocument, StandardFonts } = await import('pdf-lib')
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-pdf-'))
  try {
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([300, 200])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    page.drawText('date,kwh', { x: 20, y: 160, size: 12, font })
    page.drawText('2026-01-01,100', { x: 20, y: 140, size: 12, font })
    page.drawText('2026-01-02,200', { x: 20, y: 120, size: 12, font })
    const bytes = await pdf.save()
    const tools = createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'pdf', agent: { id: 'tester' } }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic' }] }, exec)
    const result = await by['ghg_ingest_pdf'].execute({ pdf_base64: Buffer.from(bytes).toString('base64'), facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(result.rows, 2)
    const calculated = await by['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(calculated.lines, 2)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('public/synthetic Scope 1/3 values appear in ESRS pack', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-scope-'))
  try {
    const tools = createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), scopes: new FakeTable(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'scope', agent: { id: 'tester' } }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic' }] }, exec)
    await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    await by['ghg_calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    await by['ghg_scope_import'].execute({ period: '2026-01', scope1_tco2e: 1.25, scope3_tco2e: 2.5, source: 'synthetic test' }, exec)
    const pack = await by['ghg_export_esrs_pack'].execute({ period: '2026-01' }, exec)
    const rows = sheetRecords(readWorkbook(await readFile(pack.path)), 'E1-6 Summary')
    assert.ok(rows.some((row) => row.field === 'scope1_tco2e' && row.value === 1.25))
    assert.ok(rows.some((row) => row.field === 'scope3_tco2e' && row.value === 2.5))
  } finally { await rm(dir, { recursive: true, force: true }) }
})
