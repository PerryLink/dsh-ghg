import path from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { createTools } from './tools.js'
import { openGhgTables } from './storage.js'
export const name = 'dsh-ghg'
export const inject = ['tools', 'storageDomain']
export async function apply(ctx: Context): Promise<void> {
  const baseDir = process.env.DSH_GHG_HOME ?? path.join(process.env.DSH_HOME ?? process.cwd(), 'storages', 'dsh-ghg')
  const { facilities, activities, lines } = await openGhgTables(ctx)
  for (const tool of createTools({ facilities, activities, lines, baseDir })) ctx.tools.register(tool)
}
