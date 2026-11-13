import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { safeExportPath } from '../lib/core/safe-path.js'
import { createTools } from '../lib/plugin/tools.js'

class T { map = new Map(); get(k) { return this.map.get(k) }; entries() { return this.map.entries() }; get size() { return this.map.size }; async put(k, v) { this.map.set(k, v) } }

const temp = () => mkdtemp(path.join(os.tmpdir(), 'dsh-ghg-path-'))

test('a normal export filename resolves inside the base directory and is writable', async () => {
  const dir = await temp()
  try {
    const file = await safeExportPath(dir, 'ghg-2026-01.xlsx')
    assert.equal(file, path.join(await realpath(dir), 'ghg-2026-01.xlsx'))
    await writeFile(file, 'ok')
    assert.equal(await readFile(file, 'utf8'), 'ok')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('parent traversal is rejected with E_GHG_PATH_INVALID', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, '../evil.xlsx'), /E_GHG_PATH_INVALID/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a separator in the filename is rejected with E_GHG_PATH_INVALID', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, 'a/b.xlsx'), /E_GHG_PATH_INVALID/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a dot-only filename is rejected by the resolved-prefix check', async () => {
  const dir = await temp()
  try {
    await assert.rejects(() => safeExportPath(dir, '..'), /E_GHG_PATH_NOT_ALLOWED/)
    await assert.rejects(() => safeExportPath(dir, '.'), /E_GHG_PATH_NOT_ALLOWED/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a symlinked export directory is re-anchored on its realpath', async () => {
  const dir = await temp()
  try {
    const real = path.join(dir, 'real')
    const link = path.join(dir, 'link')
    await mkdir(real)
    await symlink(real, link, 'dir')
    const file = await safeExportPath(link, 'ok.xlsx')
    assert.ok(file.startsWith((await realpath(real)) + path.sep), file)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('the workpaper tool refuses a traversal facility id', async () => {
  const dir = await temp()
  try {
    const tools = createTools({ facilities: new T(), activities: new T(), lines: new T(), baseDir: path.join(dir, 'store') })
    const by = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
    const exec = { callId: 'path' }
    await by['ghg_facility_import'].execute({ facilities: [{ facility_id: '../evil', name: 'x' }] }, exec)
    await assert.rejects(() => by['ghg_export_workpaper'].execute({ facility_id: '../evil', period: '2026-01' }, exec), /E_GHG_PATH_INVALID/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
