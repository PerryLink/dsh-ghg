import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
const root=process.cwd(),f=[]
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'))
if(pkg.name!=='dsh-ghg')f.push('name')
if(pkg.version !== '0.1.0-alpha.13')f.push('version')
if(!pkg.dsh?.bundle?.patch)f.push('bundle')
if(!pkg.engines?.dsh)f.push('engines')
if(pkg.dsh?.client)f.push('client')
if(!readFileSync(path.join(root,'cordis.patch.yml'),'utf8').includes('dsh-ghg'))f.push('patch')
for(const dir of ['src/core']){const base=path.join(root,dir);for(const e of readdirSync(base,{recursive:true,withFileTypes:true}))if(e.isFile()&&e.name.endsWith('.ts')){const t=readFileSync(path.join(e.parentPath??base,e.name),'utf8');if(/\bctx\./.test(t)||/@deepseek-ai\//.test(t))f.push(`${e.name}: core import`)}}
if(f.length){console.error(f.join('\n'));process.exit(1)}
console.log('lint ok')
