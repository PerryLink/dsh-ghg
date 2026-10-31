import { randomBytes } from 'node:crypto'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Context } from '@deepseek-ai/cordis'
import { z } from 'zod'

const facilitySchema = z.object({ facility_id: z.string(), name: z.string(), site: z.string(), region: z.string(), created_at: z.string() })
const activitySchema = z.object({ activity_id: z.string(), facility_id: z.string(), period: z.string(), date: z.string(), kwh: z.number(), unit: z.literal('kWh'), evidence_sha256: z.string(), created_at: z.string() })
const factorSchema = z.object({ factor_id: z.string(), value_kg_per_kwh: z.number(), unit: z.string(), source: z.string(), created_at: z.string() })
const lineSchema = z.object({ line_id: z.string(), activity_id: z.string(), facility_id: z.string(), period: z.string(), kwh: z.number(), factor_id: z.string(), factor_value_kg_per_kwh: z.number(), emissions_tco2e: z.number(), state: z.enum(['calculated', 'verified', 'exported']), updated_at: z.string() })

export type FacilityRecord = z.infer<typeof facilitySchema>
export type ActivityRecord = z.infer<typeof activitySchema>
export type FactorRecord = z.infer<typeof factorSchema>
export type LineRecord = z.infer<typeof lineSchema>
export type Table<T> = { get(key: string): T | undefined; entries(): IterableIterator<[string, T]>; readonly size: number; put(key: string, value: T): Promise<void> }

export const ghgSpec = defineDomain({ name: 'ghg', version: 1, tables: { facilities: domainTable<string, FacilityRecord>(facilitySchema), activities: domainTable<string, ActivityRecord>(activitySchema), lines: domainTable<string, LineRecord>(lineSchema), factors: domainTable<string, FactorRecord>(factorSchema) } })
export async function openGhgTables(ctx: Context): Promise<{ facilities: Table<FacilityRecord>; activities: Table<ActivityRecord>; lines: Table<LineRecord>; factors: Table<FactorRecord> }> {
  const domain = await ctx.storageDomain.open(ghgSpec)
  ctx.effect(() => () => domain.close(), 'dsh-ghg.domainClose')
  return { facilities: domain.table('facilities') as Table<FacilityRecord>, activities: domain.table('activities') as Table<ActivityRecord>, lines: domain.table('lines') as Table<LineRecord>, factors: domain.table('factors') as Table<FactorRecord> }
}
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export function newId(prefix: string): string {
  let time = Date.now(); let head = ''
  for (let i = 0; i < 10; i += 1) { head = CROCKFORD[time % 32] + head; time = Math.floor(time / 32) }
  let tail = ''; for (const byte of randomBytes(8)) tail += CROCKFORD[byte % 32]
  return `${prefix}_${head}${tail}`
}
