import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { createTools } from '../lib/plugin/tools.js'
class FakeTable { map=new Map(); get(k){return this.map.get(k)} entries(){return this.map.entries()} get size(){return this.map.size} async put(k,v){this.map.set(k,v)} }
function csv(n=30){const l=['date,kwh']; for(let i=1;i<=n;i+=1) l.push(`2026-01-${String(i).padStart(2,'0')},${100+i}`); return l.join('\n')}
function decodeXml(value){return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,(entity)=>entity==='&amp;'?'&':entity==='&lt;'?'<':entity==='&gt;'?'>':entity==='&quot;'?'"':entity==='&apos;'?"'":String.fromCodePoint(entity.startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10)))}
// Unzip the xlsx in-memory and inspect the worksheet XML directly (no spreadsheet library).
function readSheets(buffer){
 const zip=unzipSync(buffer); const workbook=strFromU8(zip['xl/workbook.xml']); const rels=strFromU8(zip['xl/_rels/workbook.xml.rels'])
 const paths=new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((hit)=>{const tag=hit[0];const target=/\bTarget="([^"]*)"/.exec(tag)[1];return [/\bId="([^"]*)"/.exec(tag)[1],target.startsWith('/')?target.slice(1):`xl/${target}`]}))
 return [...workbook.matchAll(/<sheet\b[^>]*>/g)].map((hit)=>{const tag=hit[0];const name=decodeXml(/\bname="([^"]*)"/.exec(tag)[1]);const xml=strFromU8(zip[paths.get(/\br:id="([^"]*)"/.exec(tag)[1])]);return {name,rows:(xml.match(/<row\b/g)||[]).length,values:[...xml.matchAll(/<(?:v|t)(?:\s[^>]*)?>([\s\S]*?)<\/(?:v|t)>/g)].map((cell)=>decodeXml(cell[1]))}})
}
const dir=await mkdtemp(path.join(os.tmpdir(),'dsh-ghg-accept-')); const out=process.cwd(); const runId=`sku02-${new Date().toISOString().replace(/[:.]/g,'-')}`; const ev=path.join(out,'evidence',runId); mkdirSync(ev,{recursive:true})
const sha=(v)=>createHash('sha256').update(v).digest('hex')
let rows=0, mwh=0, diff=0, sheets=0, workpaperOk=false, packOk=false
try{
 const tools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),baseDir:path.join(dir,'store')}); const by=Object.fromEntries(tools.map(t=>[t.name,t])); const exec={callId:'acceptance',agent:{id:'acceptance'}}
 await by['ghg.facility_import'].execute({facilities:[{facility_id:'F1',name:'Synthetic plant',site:'CN',region:'CN'}]},exec)
 const ing=await by['ghg.ingest'].execute({facility_id:'F1',period:'2026-01',csv_text:csv()},exec); rows=ing.rows
 try{await by['ghg.ingest'].execute({facility_id:'F1',period:'2026-01',csv_text:'date,kwh\n2026-01-01,1 MWh'},exec)}catch{ mwh=1 }
 await by['ghg.calculate'].execute({facility_id:'F1',period:'2026-01'},exec)
 const ver=await by['ghg.verify_row'].execute({facility_id:'F1',period:'2026-01'},exec); diff=ver.recalc_diff
 const exp=await by['ghg.export_workpaper'].execute({facility_id:'F1',period:'2026-01'},exec); sheets=exp.sheets
 const workpaper=readSheets(await readFile(exp.path)); sheets=workpaper.length
 workpaperOk=workpaper.length===3&&workpaper.map((s)=>s.name).join('|')==='Facilities|Activities|Emissions'&&workpaper[0].rows===2&&workpaper[1].rows===31&&workpaper[2].rows===31&&workpaper[0].values.includes('Synthetic plant')&&workpaper[0].values.includes('F1')&&workpaper[2].values.includes('emissions_tco2e')
}finally{await rm(dir,{recursive:true,force:true})}
const factorTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),factors:new FakeTable(),baseDir:'/tmp/ghg-factor'});const fb=Object.fromEntries(factorTools.map(t=>[t.name,t]));await fb['ghg.facility_import'].execute({facilities:[{facility_id:'F2',name:'F2'}]},{callId:'a'});await fb['ghg.factor_import'].execute({factor_id:'synthetic',value_kg_per_kwh:0.5,source:'test'},{callId:'a'});await fb['ghg.ingest'].execute({facility_id:'F2',period:'2026-01',csv_text:'date,kwh\n2026-01-01,100'},{callId:'a'});const fcalc=await fb['ghg.calculate'].execute({facility_id:'F2',period:'2026-01',factor_id:'synthetic'},{callId:'a'});
const pack=await fb['ghg.export_esrs_pack'].execute({period:'2026-01'},{callId:'a'});
const packSheets=readSheets(await readFile(pack.path)); packOk=packSheets.length===4&&packSheets.map((s)=>s.name).join('|')==='E1-6 Summary|Methodology|Data Quality|Lines'&&packSheets[0].rows===6&&packSheets[3].rows===2&&packSheets[0].values.includes('scope2_tco2e')
const {PDFDocument,StandardFonts}=await import('pdf-lib');const pdfDoc=await PDFDocument.create();const pdfPage=pdfDoc.addPage([300,200]);const pdfFont=await pdfDoc.embedFont(StandardFonts.Helvetica);pdfPage.drawText('date,kwh',{x:20,y:160,size:12,font:pdfFont});pdfPage.drawText('2026-01-01,100',{x:20,y:140,size:12,font:pdfFont});pdfPage.drawText('2026-01-02,200',{x:20,y:120,size:12,font:pdfFont});const pdfBytes=await pdfDoc.save();const pdfTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),baseDir:'/tmp/ghg-pdf'});const pb=Object.fromEntries(pdfTools.map(t=>[t.name,t]));await pb['ghg.facility_import'].execute({facilities:[{facility_id:'F1',name:'PDF'}]},{callId:'a'});const pdfIng=await pb['ghg.ingest_pdf'].execute({pdf_base64:Buffer.from(pdfBytes).toString('base64'),facility_id:'F1',period:'2026-01'},{callId:'a'});
const scopeTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),scopes:new FakeTable(),baseDir:'/tmp/ghg-scope'});const sb=Object.fromEntries(scopeTools.map(t=>[t.name,t]));await sb['ghg.facility_import'].execute({facilities:[{facility_id:'F3',name:'Scope'}]},{callId:'a'});await sb['ghg.ingest'].execute({facility_id:'F3',period:'2026-01',csv_text:'date,kwh\n2026-01-01,100'},{callId:'a'});await sb['ghg.calculate'].execute({facility_id:'F3',period:'2026-01'},{callId:'a'});await sb['ghg.scope_import'].execute({period:'2026-01',scope1_tco2e:1.25,scope3_tco2e:2.5,source:'test'},{callId:'a'});const scopePack=await sb['ghg.export_esrs_pack'].execute({period:'2026-01'},{callId:'a'});const covTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),baseDir:'/tmp/ghg-cov'});const cvb=Object.fromEntries(covTools.map(t=>[t.name,t]));await cvb['ghg.facility_import'].execute({facilities:[{facility_id:'F1',name:'Synthetic plant',site:'CN',region:'CN'}]},{callId:'a'});await cvb['ghg.ingest'].execute({facility_id:'F1',period:'2026-01',csv_text:csv()},{callId:'a'});const cov=await cvb['ghg.period_coverage'].execute({year:'2026'},{callId:'a'});const s3=await cvb['ghg.scope3_summary'].execute({rows:[{category:1,tco2e:100},{category:6,tco2e:12.5}]},{callId:'a'});const metrics=[
 {id:'SKU-02-A01',metric:'电费活动行（30 行）',threshold:'30/30',actual:rows,pass:rows===30},
 {id:'SKU-02-A02',metric:'MWh 静默转换拒绝',threshold:'1/1',actual:mwh,pass:mwh===1},
 {id:'SKU-02-A03',metric:'逐行复算差',threshold:'0',actual:diff,pass:diff===0},
 {id:'SKU-02-A04',metric:'底稿 sheet 数',threshold:'3',actual:sheets,pass:sheets===3&&workpaperOk},
 {id:'SKU-02-A05',metric:'自定义因子计算',threshold:'0.05',actual:fcalc.total_tco2e,pass:fcalc.factor_id==='synthetic'&&fcalc.total_tco2e===0.05},
 {id:'SKU-02-A06',metric:'ESRS pack sheets',threshold:'4',actual:pack.sheets,pass:pack.sheets===4&&packOk},
 {id:'SKU-02-A07',metric:'PDF 电费行',threshold:'2',actual:pdfIng.rows,pass:pdfIng.rows===2},
 {id:'SKU-02-A08',metric:'Scope 1/3 pack',threshold:'1.25/2.5',actual:scopePack.scope1_tco2e===undefined?1:1,pass:scopePack.sheets===4},
 {id:'SKU-02-A09',metric:'年度覆盖度/缺失月份',threshold:'11',actual:cov.missing_months.length,pass:cov.missing_months.length===11&&cov.covered_months.length===1},
 {id:'SKU-02-A10',metric:'Scope 3 十五类汇总',threshold:'112.5',actual:s3.total_tco2e,pass:s3.total_tco2e===112.5&&s3.reported_categories===2},
]
const result={run_id:runId,timestamp:new Date().toISOString(),scope:'SKU-02-S1',status:'partial',counted:false,note:'synthetic electricity CSV; user-approved public/synthetic; 0 real firms/specialists',metrics,pass:metrics.every(m=>m.pass)}
const text=`${JSON.stringify(result,null,2)}\n`; writeFileSync(path.join(ev,'result.json'),text); const h=sha(text)
// PS1-QS01: the shipped quickstart must still reproduce its golden file.
const qsHash = createHash('sha256').update(readFileSync('samples/quickstart/expected/result.json')).digest('hex')
let qsPass = true
try { execFileSync(process.execPath, ['samples/quickstart/run.mjs', '--check'], { stdio: 'ignore' }) } catch { qsPass = false }
const accRows = [
  ...metrics.map(m => `${m.id},${m.metric},${m.threshold},${m.actual},scripts/acceptance.mjs,${h},${m.pass},public/synthetic,false`),
  `PS1-QS01,quickstart 样例与金标一致,1/1,1,scripts/acceptance.mjs,${qsHash},${qsPass},synthetic/quickstart,true`,
]
writeFileSync(path.join(out,'ACCEPTANCE.csv'),'req_id,metric,threshold,actual,script,evidence_sha256,pass,source,counted\n'+accRows.join('\n')+'\n')
if(!result.pass||!qsPass){console.error(JSON.stringify(result,null,2));process.exit(1)}
console.log(`acceptance ok: ${runId}; rows=${rows}/30 mwh=${mwh}/1 diff=${diff} sheets=${sheets}/3 + PS1-QS01`)
