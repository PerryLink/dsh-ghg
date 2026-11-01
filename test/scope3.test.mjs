import test from 'node:test'
import assert from 'node:assert/strict'
import { SCOPE3_CATEGORIES, summarizeScope3 } from '../lib/core/ghg.js'
import { createTools } from '../lib/plugin/tools.js'

class FakeTable { map = new Map(); get(k){return this.map.get(k)}; entries(){return this.map.entries()}; get size(){return this.map.size}; async put(k,v){this.map.set(k,v)} }
const tools = Object.fromEntries(createTools({ facilities: new FakeTable(), activities: new FakeTable(), lines: new FakeTable(), baseDir: '/tmp/ghg-scope3' }).map((t) => [t.name, t]))
const exec = { callId: 's3' }

test('the standard has exactly fifteen categories', () => {
  assert.equal(SCOPE3_CATEGORIES.length, 15)
  assert.equal(SCOPE3_CATEGORIES[0], 'purchased goods and services')
  assert.equal(SCOPE3_CATEGORIES[14], 'investments')
})

test('rows are summed per category and ordered by number', async () => {
  const r = await tools['ghg.scope3_summary'].execute({ rows: [
    { category: 6, tco2e: 12.5 },
    { category: 1, tco2e: 100 },
    { category: 6, tco2e: 2.5 },
  ] }, exec)
  assert.equal(r.reported_categories, 2)
  assert.equal(r.total_tco2e, 115)
  assert.deepEqual(r.categories.map((c) => c.category), [1, 6])
  assert.equal(r.categories[1].name, 'business travel')
  assert.equal(r.categories[1].tco2e, 15)
  assert.equal(r.issues.length, 0)
})

test('out-of-range categories and negative values are reported, not silently dropped', async () => {
  const r = await tools['ghg.scope3_summary'].execute({ rows: [
    { category: 16, tco2e: 1 },
    { category: 0, tco2e: 1 },
    { category: 3, tco2e: -5 },
    { category: 4, tco2e: 7 },
  ] }, exec)
  assert.ok(r.issues.some((i) => i.code === 'E_GHG_SCOPE3_CATEGORY'))
  assert.ok(r.issues.some((i) => i.code === 'E_GHG_SCOPE3_VALUE'))
  assert.equal(r.total_tco2e, 7)
  assert.equal(r.reported_categories, 1)
})

test('summarizeScope3 is the same code path as the tool', () => {
  const direct = summarizeScope3([{ category: 15, tco2e: 3 }])
  assert.equal(direct.categories[0].name, 'investments')
  assert.equal(direct.total_tco2e, 3)
})
