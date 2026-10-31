import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as XLSX from 'xlsx'
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
async function setup(dir) {
  const tools = createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), baseDir: path.join(dir, 'store') })
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  const exec = { callId: 'ghg-call', agent: { id: 'tester' } }
  await byName['ghg.facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic plant', site: 'CN', region: 'CN' }] }, exec)
  return { byName, exec }
}

test('30 electricity rows -> calculate -> verify -> 3-sheet xlsx', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-test-'))
  try {
    const { byName, exec } = await setup(dir)
    const factor = await byName['ghg.match_factor'].execute({}, exec)
    assert.equal(factor.value, 0.5703)
    const ingested = await byName['ghg.ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    assert.equal(ingested.rows, 30)
    const calculated = await byName['ghg.calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(calculated.lines, 30)
    const verified = await byName['ghg.verify_row'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(verified.checked, 30)
    assert.equal(verified.mismatches.length, 0)
    assert.equal(verified.recalc_diff, 0)
    const exported = await byName['ghg.export_workpaper'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    assert.equal(exported.sheets, 3)
    const wb = XLSX.read(await readFile(exported.path), { type: 'buffer' })
    assert.deepEqual(wb.SheetNames, ['Facilities', 'Activities', 'Emissions'])
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('MWh is rejected rather than silently converted', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-test-'))
  try {
    const { byName, exec } = await setup(dir)
    await assert.rejects(() => byName['ghg.ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: 'date,kwh\n2026-01-01,1 MWh' }, exec), /E_GHG_UNIT_MISMATCH/)
    await assert.rejects(() => byName['ghg.ingest'].execute({ facility_id: 'NO', period: '2026-01', csv_text: csv(1) }, exec), /E_GHG_FACILITY_NOT_FOUND/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('partial ESRS E1 summary from calculated Scope 2', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-esrs-'))
  try {
    const { byName, exec } = await setup(dir)
    await byName['ghg.ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: csv() }, exec)
    await byName['ghg.calculate'].execute({ facility_id: 'F1', period: '2026-01' }, exec)
    const esrs = await byName['ghg.export_esrs'].execute({ period: '2026-01' }, exec)
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
    const ingested = await byName['ghg.ingest'].execute({ facility_id: 'F1', period: '2026-07', csv_text: csvText }, exec)
    assert.ok(ingested.rows >= 20)
    const calculated = await byName['ghg.calculate'].execute({ facility_id: 'F1', period: '2026-07' }, exec)
    assert.equal(calculated.lines, ingested.rows)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
