import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k) { return this.map.get(k) }; entries() { return this.map.entries() }; get size() { return this.map.size }; async put(k, v) { this.map.set(k, v) } }

const CSV = 'date,kwh\n2026-01-01,100\n2026-01-02,200'

test('re-ingesting the same file is idempotent and reports skipped rows', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-idem-'))
  try {
    const activities = new T()
    const tools = createTools({ facilities: new T(), activities, lines: new T(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'idem' }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic' }] }, exec)
    const first = await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: CSV }, exec)
    assert.equal(first.rows, 2)
    assert.equal(first.skipped, 0)
    assert.equal(activities.size, 2)
    const second = await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: CSV }, exec)
    assert.equal(second.rows, 0)
    assert.equal(second.skipped, 2)
    assert.equal(activities.size, 2)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('the same numbers from a different evidence file do not overwrite each other', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-idem-'))
  try {
    const activities = new T()
    const tools = createTools({ facilities: new T(), activities, lines: new T(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'idem' }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: 'F1', name: 'Synthetic' }] }, exec)
    await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: CSV }, exec)
    await by['ghg_ingest'].execute({ facility_id: 'F1', period: '2026-01', csv_text: CSV + '\n' }, exec)
    assert.equal(activities.size, 4)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
