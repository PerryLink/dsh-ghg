import { readFileSync } from 'node:fs'
const files=JSON.parse(readFileSync('pack.json','utf8'))[0]?.files?.map(f=>f.path)??[]
for(const f of ['package.json','cordis.patch.yml','README.md','LICENSE','NOTICE','lib/plugin/index.js']) if(!files.includes(f)) throw new Error(`missing ${f}`)
for(const f of files) for(const p of [/^src\//,/^test\//,/^scripts\//,/^fixtures\//,/^evidence\//,/\.env/,/\.pem$/,/node_modules\//,/\.tgz$/]) if(p.test(f)) throw new Error(`forbidden ${f}`)
console.log(`pack ok: ${files.length} files`)
