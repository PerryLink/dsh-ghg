/**
 * xlsx-lite — clean-room minimal xlsx writer/reader (fflate only).
 *
 * This is not a general-purpose spreadsheet library. It implements the exact
 * subset this package needs for local workpaper exports and for the acceptance
 * checks that read those exports back:
 *   - write: inline strings + numbers, N sheets, caller-supplied header rows
 *   - read: files produced by writeWorkbook (inline strings and numbers)
 * Shared strings, formulas, dates, merged cells and styling are not supported.
 * No third-party spreadsheet code is included.
 */
import { Buffer } from 'node:buffer'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

export type Cell = string | number

export interface SheetInput {
  name: string
  rows: Cell[][]
}

export interface SheetData {
  name: string
  rows: Cell[][]
}

export interface WorkbookData {
  sheets: SheetData[]
}

interface SheetEntry {
  name: string
  path: string
  xml: string
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
const NS_CONTENT_TYPES = 'http://schemas.openxmlformats.org/package/2006/content-types'
const CT_SHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'
const CT_WORKBOOK = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'
const CT_STYLES = 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml'

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

function decodeXml(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (entity) => {
    switch (entity) {
      case '&amp;': return '&'
      case '&lt;': return '<'
      case '&gt;': return '>'
      case '&quot;': return '"'
      case '&apos;': return "'"
      default: {
        const code = entity.startsWith('&#x') ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity
      }
    }
  })
}

function columnName(index: number): string {
  let name = ''
  let value = index + 1
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function columnIndex(reference: string): number {
  const letters = /^([A-Z]+)/.exec(reference)?.[1]
  if (!letters) return -1
  let index = 0
  for (const letter of letters) index = index * 26 + (letter.charCodeAt(0) - 64)
  return index - 1
}

function validateSheetName(name: string): void {
  if (typeof name !== 'string' || name.length === 0) throw new Error('xlsx-lite: sheet name must be a non-empty string')
  if (name.length > 31) throw new Error(`xlsx-lite: sheet name too long: ${name}`)
  if (['[', ']', ':', '*', '?', '/', '\\'].some((char) => name.includes(char))) throw new Error(`xlsx-lite: invalid sheet name: ${name}`)
  if (name.startsWith("'") || name.endsWith("'")) throw new Error(`xlsx-lite: invalid sheet name: ${name}`)
}

function cellXml(cell: Cell, reference: string): string {
  if (typeof cell === 'number') {
    if (!Number.isFinite(cell)) throw new Error(`xlsx-lite: non-finite number at ${reference}`)
    return `<c r="${reference}"><v>${cell}</v></c>`
  }
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell))}</t></is></c>`
}

function sheetXml(rows: Cell[][]): string {
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((cell, cellIndex) => cellXml(cell, `${columnName(cellIndex)}${rowIndex + 1}`)).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')
  return `${XML_DECL}<worksheet xmlns="${NS_MAIN}"><sheetData>${body}</sheetData></worksheet>`
}

function contentTypesXml(sheets: SheetInput[]): string {
  const overrides = sheets.map((_sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="${CT_SHEET}"/>`).join('')
  return `${XML_DECL}<Types xmlns="${NS_CONTENT_TYPES}">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + `<Override PartName="/xl/workbook.xml" ContentType="${CT_WORKBOOK}"/>`
    + overrides
    + `<Override PartName="/xl/styles.xml" ContentType="${CT_STYLES}"/>`
    + '</Types>'
}

function packageRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${NS_PKG_REL}">`
    + `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/>`
    + '</Relationships>'
}

function workbookXml(sheets: SheetInput[]): string {
  const entries = sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')
  return `${XML_DECL}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><sheets>${entries}</sheets></workbook>`
}

function workbookRelsXml(sheets: SheetInput[]): string {
  const sheetRels = sheets.map((_sheet, index) => `<Relationship Id="rId${index + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')
  const stylesRel = `<Relationship Id="rId${sheets.length + 1}" Type="${NS_REL}/styles" Target="styles.xml"/>`
  return `${XML_DECL}<Relationships xmlns="${NS_PKG_REL}">${sheetRels}${stylesRel}</Relationships>`
}

function stylesXml(): string {
  return `${XML_DECL}<styleSheet xmlns="${NS_MAIN}">`
    + '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
    + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
    + '<borders count="1"><border/></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
    + '</styleSheet>'
}

/** Write a minimal, valid xlsx file containing the supplied sheets (in order). */
export function writeWorkbook(sheets: SheetInput[]): Buffer {
  if (!Array.isArray(sheets) || sheets.length === 0) throw new Error('xlsx-lite: at least one sheet is required')
  const names = new Set<string>()
  for (const sheet of sheets) {
    validateSheetName(sheet.name)
    if (names.has(sheet.name)) throw new Error(`xlsx-lite: duplicate sheet name: ${sheet.name}`)
    names.add(sheet.name)
  }
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(contentTypesXml(sheets)),
    '_rels/.rels': strToU8(packageRelsXml()),
    'xl/workbook.xml': strToU8(workbookXml(sheets)),
    'xl/_rels/workbook.xml.rels': strToU8(workbookRelsXml(sheets)),
    'xl/styles.xml': strToU8(stylesXml()),
  }
  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(sheetXml(sheet.rows))
  })
  return Buffer.from(zipSync(files))
}

function attribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`).exec(tag)
  return match ? decodeXml(match[1] ?? '') : undefined
}

function resolveTarget(target: string): string {
  const base = target.startsWith('/') ? target.slice(1) : `xl/${target}`
  const parts: string[] = []
  for (const part of base.split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '' && part !== '.') parts.push(part)
  }
  return parts.join('/')
}

function readSheetEntries(buffer: Uint8Array): SheetEntry[] {
  const zip = unzipSync(buffer)
  const workbook = zip['xl/workbook.xml']
  const rels = zip['xl/_rels/workbook.xml.rels']
  if (!workbook) throw new Error('xlsx-lite: missing xl/workbook.xml')
  if (!rels) throw new Error('xlsx-lite: missing xl/_rels/workbook.xml.rels')
  const pathById = new Map<string, string>()
  for (const match of strFromU8(rels).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attribute(match[0], 'Id')
    const target = attribute(match[0], 'Target')
    if (id && target) pathById.set(id, resolveTarget(target))
  }
  const entries: SheetEntry[] = []
  for (const match of strFromU8(workbook).matchAll(/<sheet\b[^>]*>/g)) {
    const name = attribute(match[0], 'name')
    const relationId = attribute(match[0], 'r:id')
    if (!name || !relationId) continue
    const path = pathById.get(relationId)
    if (!path) throw new Error(`xlsx-lite: missing relationship for sheet: ${name}`)
    const data = zip[path]
    if (!data) throw new Error(`xlsx-lite: missing worksheet part: ${path}`)
    entries.push({ name, path, xml: strFromU8(data) })
  }
  return entries
}

function numericText(value: string): boolean {
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)
}

function parseSheetRows(xml: string): Cell[][] {
  const rows: Cell[][] = []
  for (const rowMatch of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowAttributes = rowMatch[1] ?? ''
    const rowBody = rowMatch[2] ?? ''
    const rowReference = attribute(rowAttributes, 'r')
    const rowIndex = rowReference ? Number(rowReference) - 1 : rows.length
    if (!Number.isInteger(rowIndex) || rowIndex < 0) throw new Error(`xlsx-lite: bad row reference: ${rowReference}`)
    const cells: Cell[] = []
    let nextColumn = 0
    for (const cellMatch of rowBody.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cellAttributes = cellMatch[1] ?? ''
      const cellBody = cellMatch[2] ?? ''
      const reference = attribute(cellAttributes, 'r')
      const index = reference ? columnIndex(reference) : nextColumn
      if (index < 0) throw new Error(`xlsx-lite: bad cell reference: ${reference}`)
      nextColumn = index + 1
      const type = attribute(cellAttributes, 't')
      if (type === 's') throw new Error('xlsx-lite: shared strings are not supported')
      const inline = type === 'inlineStr' ? /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(cellBody) : undefined
      if (inline) {
        cells[index] = decodeXml(inline[1] ?? '')
        continue
      }
      const literal = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(cellBody)
      if (literal) {
        const raw = decodeXml(literal[1] ?? '')
        cells[index] = numericText(raw) ? Number(raw) : raw
      }
    }
    rows[rowIndex] = cells
  }
  const normalized: Cell[][] = []
  for (let index = 0; index < rows.length; index += 1) normalized.push(rows[index] ?? [])
  return normalized
}

function asBytes(buffer: Uint8Array | Buffer): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
}

/** Return the raw worksheet XML for a sheet (by name, or by 0-based position). */
export function readSheetText(buffer: Uint8Array | Buffer, sheet: string | number): string {
  const entries = readSheetEntries(asBytes(buffer))
  const found = typeof sheet === 'number' ? entries[sheet] : entries.find((entry) => entry.name === sheet)
  if (!found) throw new Error(`xlsx-lite: sheet not found: ${String(sheet)}`)
  return found.xml
}

/** Read back a workbook written by writeWorkbook (inline strings and numbers). */
export function readWorkbook(buffer: Uint8Array | Buffer): WorkbookData {
  return { sheets: readSheetEntries(asBytes(buffer)).map((entry) => ({ name: entry.name, rows: parseSheetRows(entry.xml) })) }
}
