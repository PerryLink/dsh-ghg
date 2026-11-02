import test from 'node:test'
import assert from 'node:assert/strict'
import { CSV_MAX_ROWS, parseCsv } from '../lib/core/ghg.js'

test('an empty numeric cell is an error, not zero', () => {
  assert.throws(() => parseCsv('date,kwh\n2026-01-01,'), /E_GHG_BILL_INCOMPLETE/)
  assert.throws(() => parseCsv('date,kwh,note\n2026-01-01,,memo'), /E_GHG_BILL_INCOMPLETE/)
})

test('a missing column shifts nothing: the row width must match the header', () => {
  assert.throws(() => parseCsv('date,kwh\n2026-01-01'), /E_GHG_BILL_INCOMPLETE/)
  assert.throws(() => parseCsv('date,kwh\n2026-01-01,100,extra'), /E_GHG_BILL_INCOMPLETE/)
})

test('non-finite kWh values are rejected', () => {
  assert.throws(() => parseCsv('date,kwh\n2026-01-01,Infinity'), /E_GHG_UNIT_MISMATCH/)
  assert.throws(() => parseCsv('date,kwh\n2026-01-01,NaN'), /E_GHG_UNIT_MISMATCH/)
  assert.throws(() => parseCsv('date,kwh\n2026-01-01,1e999'), /E_GHG_UNIT_MISMATCH/)
})

test('a huge CSV is rejected before it is materialised', () => {
  const rows = Array.from({ length: CSV_MAX_ROWS + 1 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')},1`)
  assert.throws(() => parseCsv(['date,kwh', ...rows].join('\n')), /E_GHG_BILL_INCOMPLETE/)
})
