#!/usr/bin/env node
/**
 * dsh-ghg quickstart — runs the built plugin tools over the bundled synthetic
 * 2026 electricity export. The golden file `expected/result.json` is the stdout of
 * `node samples/quickstart/run.mjs --json`, so it is a real run, not hand-written.
 *
 *   node samples/quickstart/run.mjs            # human-readable summary
 *   node samples/quickstart/run.mjs --json     # the golden result on stdout
 *   node samples/quickstart/run.mjs --check    # recompute and diff against the golden file
 */
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTools } from '../../lib/plugin/tools.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const inputDir = path.join(here, 'input')
const expectedPath = path.join(here, 'expected', 'result.json')
const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--json') ? 'json' : 'summary'
const round9 = (value) => Math.round(value * 1e9) / 1e9

class Table {
  map = new Map()
  get(key) { return this.map.get(key) }
  entries() { return this.map.entries() }
  get size() { return this.map.size }
  async put(key, value) { this.map.set(key, value) }
}

function parseElectricityCsv(text) {
  const [header, ...lines] = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  const columns = header.split(',').map((value) => value.trim().toLowerCase())
  const dateIndex = columns.indexOf('date') >= 0 ? columns.indexOf('date') : columns.indexOf('month')
  const kwhIndex = columns.indexOf('kwh')
  return lines.filter((line) => line.trim() !== '').map((line) => {
    const cells = line.split(',').map((value) => value.trim())
    return { date: cells[dateIndex] ?? '', kwh: cells[kwhIndex] ?? '' }
  })
}

async function run() {
  const annualCsv = await readFile(path.join(inputDir, 'electricity-2026.csv'), 'utf8')
  const facilities = JSON.parse(await readFile(path.join(inputDir, 'facilities.json'), 'utf8'))
  const scope3Rows = JSON.parse(await readFile(path.join(inputDir, 'scope3.json'), 'utf8'))

  const byMonth = new Map()
  for (const row of parseElectricityCsv(annualCsv)) {
    const period = row.date.slice(0, 7)
    if (!byMonth.has(period)) byMonth.set(period, [])
    byMonth.get(period).push(row)
  }
  const months = [...byMonth.keys()].sort()
  const facilityId = facilities[0].facility_id

  const baseDir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-quickstart-'))
  try {
    const tools = Object.fromEntries(createTools({
      facilities: new Table(),
      activities: new Table(),
      lines: new Table(),
      factors: new Table(),
      scopes: new Table(),
      baseDir,
    }).map((tool) => [tool.name, tool]))
    const call = { callId: 'quickstart' }

    await tools['ghg.facility_import'].execute({ facilities }, call)

    let ingestedRows = 0
    let skipped = 0
    let lines = 0
    let totalTco2e = 0
    let checked = 0
    let recalcDiff = 0
    const mismatches = []
    for (const period of months) {
      const csvText = ['date,kwh', ...byMonth.get(period).map((row) => `${row.date},${row.kwh}`)].join('\n')
      const ingest = await tools['ghg.ingest'].execute({ facility_id: facilityId, period, csv_text: csvText }, call)
      ingestedRows += ingest.rows
      skipped += ingest.skipped
      const calculated = await tools['ghg.calculate'].execute({ facility_id: facilityId, period }, call)
      lines += calculated.lines
      totalTco2e += calculated.total_tco2e
      const verified = await tools['ghg.verify_row'].execute({ facility_id: facilityId, period }, call)
      checked += verified.checked
      recalcDiff += verified.recalc_diff
      mismatches.push(...verified.mismatches)
    }

    const lastMonth = months[months.length - 1]
    await tools['ghg.scope_import'].execute({ period: lastMonth, scope1_tco2e: 1.25, scope3_tco2e: 2.5, source: 'synthetic' }, call)
    const workpaper = await tools['ghg.export_workpaper'].execute({ facility_id: facilityId, period: lastMonth }, call)
    const pack = await tools['ghg.export_esrs_pack'].execute({ period: lastMonth }, call)
    const coverage = await tools['ghg.period_coverage'].execute({ year: '2026' }, call)
    const scope3 = await tools['ghg.scope3_summary'].execute({ rows: scope3Rows }, call)
    const factor = await tools['ghg.match_factor'].execute({}, call)

    return {
      sample: 'samples/quickstart/input/electricity-2026.csv',
      facility: { facility_id: facilityId, name: facilities[0].name },
      months: months.length,
      ingest: { rows: ingestedRows, skipped },
      factor: { factor_id: factor.factor_id, value_kg_per_kwh: factor.value, unit: factor.unit },
      emissions: { lines, total_tco2e: round9(totalTco2e) },
      verify: { checked, mismatches, recalc_diff: round9(recalcDiff) },
      exports: {
        workpaper: { sheets: workpaper.sheets, file: path.basename(workpaper.path) },
        esrs_pack: { sheets: pack.sheets, scope2_tco2e: pack.scope2_tco2e, file: path.basename(pack.path) },
      },
      coverage: {
        year: coverage.year,
        covered_months: coverage.covered_months.length,
        missing_months: coverage.missing_months,
        rows: coverage.rows,
        kwh: coverage.kwh,
        tco2e: coverage.tco2e,
        complete: coverage.complete,
      },
      scope3: {
        total_tco2e: scope3.total_tco2e,
        reported_categories: scope3.reported_categories,
        categories: scope3.categories,
        issues: scope3.issues,
      },
    }
  } finally {
    await rm(baseDir, { recursive: true, force: true })
  }
}

function summary(result) {
  console.log('dsh-ghg quickstart - 合成电费单（不是真实电表数据）')
  console.log(`工厂 ${result.facility.facility_id} ${result.facility.name}；导入 ${result.months} 个月、${result.ingest.rows} 行电费`)
  console.log(`全年 ${result.coverage.kwh} kWh -> ${result.emissions.total_tco2e} tCO2e（因子 ${result.factor.factor_id}）`)
  console.log(`逐行复算 ${result.verify.checked} 行，不符 ${result.verify.mismatches.length} 行，差异 ${result.verify.recalc_diff}`)
  console.log(`底稿 ${result.exports.workpaper.sheets} 个 sheet：${result.exports.workpaper.file}`)
  console.log(`ESRS E1 包 ${result.exports.esrs_pack.sheets} 个 sheet：${result.exports.esrs_pack.file}（Scope 2 ${result.exports.esrs_pack.scope2_tco2e} tCO2e）`)
  console.log(`2026 覆盖 ${result.coverage.covered_months}/12 个月，缺失 ${result.coverage.missing_months.length} 个，完整=${result.coverage.complete}`)
  console.log(`Scope 3 汇总 ${result.scope3.total_tco2e} tCO2e，覆盖 ${result.scope3.reported_categories} 类，${result.scope3.issues.length} 个问题`)
}

const result = await run()

if (mode === 'json') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} else if (mode === 'check') {
  const expected = JSON.parse(await readFile(expectedPath, 'utf8'))
  assert.deepEqual(result, expected)
  summary(result)
  console.log('golden samples/quickstart/expected/result.json matches')
  console.log('quickstart ok')
} else {
  summary(result)
  console.log('run with --check to compare against expected/result.json')
}
