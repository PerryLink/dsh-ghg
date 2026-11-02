import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
try{execFileSync(process.execPath,['scripts/acceptance.mjs'],{stdio:'inherit'})}catch{process.exit(1)}
const rows=readFileSync('ACCEPTANCE.csv','utf8').trim().split('\n').slice(1).map(l=>l.split(','))
if(!rows.length){process.exit(2)}
for(const r of rows) if(r.length<7||r[6]!=='true'||!r[3]||!r[5]){console.error(`bad row ${r.join(',')}`);process.exit(1)}
console.log(`gate ok: ${rows.length} rows (SKU-02 public/synthetic + PS1-QS01)`)
