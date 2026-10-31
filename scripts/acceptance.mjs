import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { createTools } from '../lib/plugin/tools.js'
class FakeTable { map=new Map(); get(k){return this.map.get(k)} entries(){return this.map.entries()} get size(){return this.map.size} async put(k,v){this.map.set(k,v)} }
function csv(n=30){const l=['date,kwh']; for(let i=1;i<=n;i+=1) l.push(`2026-01-${String(i).padStart(2,'0')},${100+i}`); return l.join('\n')}
const dir=await mkdtemp(path.join(os.tmpdir(),'dsh-ghg-accept-')); const out=process.cwd(); const runId=`sku02-${new Date().toISOString().replace(/[:.]/g,'-')}`; const ev=path.join(out,'evidence',runId); mkdirSync(ev,{recursive:true})
const sha=(v)=>createHash('sha256').update(v).digest('hex')
let rows=0, mwh=0, diff=0, sheets=0
try{
 const tools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),baseDir:path.join(dir,'store')}); const by=Object.fromEntries(tools.map(t=>[t.name,t])); const exec={callId:'acceptance',agent:{id:'acceptance'}}
 await by['ghg.facility_import'].execute({facilities:[{facility_id:'F1',name:'Synthetic plant',site:'CN',region:'CN'}]},exec)
 const ing=await by['ghg.ingest'].execute({facility_id:'F1',period:'2026-01',csv_text:csv()},exec); rows=ing.rows
 try{await by['ghg.ingest'].execute({facility_id:'F1',period:'2026-01',csv_text:'date,kwh\n2026-01-01,1 MWh'},exec)}catch{ mwh=1 }
 await by['ghg.calculate'].execute({facility_id:'F1',period:'2026-01'},exec)
 const ver=await by['ghg.verify_row'].execute({facility_id:'F1',period:'2026-01'},exec); diff=ver.recalc_diff
 const exp=await by['ghg.export_workpaper'].execute({facility_id:'F1',period:'2026-01'},exec); sheets=exp.sheets
 const wb=XLSX.read(await readFile(exp.path),{type:'buffer'}); if(wb.SheetNames.length!==3) sheets=0
}finally{await rm(dir,{recursive:true,force:true})}
const factorTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),factors:new FakeTable(),baseDir:'/tmp/ghg-factor'});const fb=Object.fromEntries(factorTools.map(t=>[t.name,t]));await fb['ghg.facility_import'].execute({facilities:[{facility_id:'F2',name:'F2'}]},{callId:'a'});await fb['ghg.factor_import'].execute({factor_id:'synthetic',value_kg_per_kwh:0.5,source:'test'},{callId:'a'});await fb['ghg.ingest'].execute({facility_id:'F2',period:'2026-01',csv_text:'date,kwh\n2026-01-01,100'},{callId:'a'});const fcalc=await fb['ghg.calculate'].execute({facility_id:'F2',period:'2026-01',factor_id:'synthetic'},{callId:'a'});
const pack=await fb['ghg.export_esrs_pack'].execute({period:'2026-01'},{callId:'a'});
const {PDFDocument,StandardFonts}=await import('pdf-lib');const pdfDoc=await PDFDocument.create();const pdfPage=pdfDoc.addPage([300,200]);const pdfFont=await pdfDoc.embedFont(StandardFonts.Helvetica);pdfPage.drawText('date,kwh',{x:20,y:160,size:12,font:pdfFont});pdfPage.drawText('2026-01-01,100',{x:20,y:140,size:12,font:pdfFont});pdfPage.drawText('2026-01-02,200',{x:20,y:120,size:12,font:pdfFont});const pdfBytes=await pdfDoc.save();const pdfTools=createTools({facilities:new FakeTable(),activities:new FakeTable(),lines:new FakeTable(),baseDir:'/tmp/ghg-pdf'});const pb=Object.fromEntries(pdfTools.map(t=>[t.name,t]));await pb['ghg.facility_import'].execute({facilities:[{facility_id:'F1',name:'PDF'}]},{callId:'a'});const pdfIng=await pb['ghg.ingest_pdf'].execute({pdf_base64:Buffer.from(pdfBytes).toString('base64'),facility_id:'F1',period:'2026-01'},{callId:'a'});
const metrics=[
 {id:'SKU-02-A01',metric:'电费活动行（30 行）',threshold:'30/30',actual:rows,pass:rows===30},
 {id:'SKU-02-A02',metric:'MWh 静默转换拒绝',threshold:'1/1',actual:mwh,pass:mwh===1},
 {id:'SKU-02-A03',metric:'逐行复算差',threshold:'0',actual:diff,pass:diff===0},
 {id:'SKU-02-A04',metric:'底稿 sheet 数',threshold:'3',actual:sheets,pass:sheets===3},
 {id:'SKU-02-A05',metric:'自定义因子计算',threshold:'0.05',actual:fcalc.total_tco2e,pass:fcalc.factor_id==='synthetic'&&fcalc.total_tco2e===0.05},
 {id:'SKU-02-A06',metric:'ESRS pack sheets',threshold:'4',actual:pack.sheets,pass:pack.sheets===4},
 {id:'SKU-02-A07',metric:'PDF 电费行',threshold:'2',actual:pdfIng.rows,pass:pdfIng.rows===2},
]
const result={run_id:runId,timestamp:new Date().toISOString(),scope:'SKU-02-S1',status:'partial',counted:false,note:'synthetic electricity CSV; user-approved public/synthetic; 0 real firms/specialists',metrics,pass:metrics.every(m=>m.pass)}
const text=`${JSON.stringify(result,null,2)}\n`; writeFileSync(path.join(ev,'result.json'),text); const h=sha(text)
writeFileSync(path.join(out,'ACCEPTANCE.csv'),'req_id,metric,threshold,actual,script,evidence_sha256,pass\n'+metrics.map(m=>`${m.id},${m.metric},${m.threshold},${m.actual},scripts/acceptance.mjs,${h},${m.pass}`).join('\n')+'\n')
if(!result.pass){console.error(JSON.stringify(result,null,2));process.exit(1)}
console.log(`acceptance ok: ${runId}; rows=${rows}/30 mwh=${mwh}/1 diff=${diff} sheets=${sheets}/3`)
