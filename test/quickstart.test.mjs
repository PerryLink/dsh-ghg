import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const inputDir = path.join(root, 'samples', 'quickstart', 'input')

test('the shipped quickstart reproduces its golden output', () => {
  const stdout = execFileSync(process.execPath, ['samples/quickstart/run.mjs', '--check'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.match(stdout, /quickstart ok/)

  const bytes = readdirSync(inputDir).reduce((sum, name) => sum + statSync(path.join(inputDir, name)).size, 0)
  assert.ok(bytes > 0 && bytes <= 500 * 1024, `samples/quickstart/input must be 1..500 KB, got ${bytes} bytes`)
})
