/* Excel / PDF over the registers (user 2026-10-01, like the reference ERP: two buttons above the table) — 24 registers
   (not the star-grade summary). Both take every row the register's current filter / search finds (all pages, not just the
   one on screen), with the columns the register shows: ลำดับ as on screen, the saved time with the date, no columns hidden
   in 11.1 and no "จัดการ" buttons. Excel = a real .xlsx built here (no library). PDF = the house report sheet sent to
   print, where "Save as PDF" is picked. 02 customer list, 08 expenses and 08 asset register had their own report button:
   it is replaced by Excel / PDF, and PDF keeps printing that same report.
   Rights: both need that page's "ส่งออกข้อมูล" box in the permission table (its own column, off by default). */
(()=>{
 const REG={
  crmTbl:{row:'crm',kind:'crm',render:'renderCrm',p:'crm'},
  custLTbl:{row:'custList',kind:'cust',render:'renderCustList',p:'custL',pdf:'printCustList'},
  qOvTbl:{row:'quote',kind:'quote',render:'renderQuoteOverview',p:'qOv'},
  docOvTbl:{row:'rcptDoc',kind:'receipt',render:'renderDocOverview',p:'docOv'},
  bnTbl:{row:'rcptBilling',kind:'billing',render:'renderBillingList',p:'bnOv'},
  taxOvTbl:{row:'rcptTax',kind:'receipt',render:'renderTaxOverview',p:'taxOv'},
  scutTbl:{row:'rcptCut',kind:'stockcut',render:'pkgRenderCuts',p:'scut'},
  /* ระบบขายแบบใหม่ (sale-docs.js): 4.2 ใบแจ้งหนี้ · 4.3 ใบเสร็จรับเงิน · 4.4 ใบหัก ณ ที่จ่าย (two tabs) — export right of the 04.1 row */
  sinvTbl:{row:'rcptDoc',kind:'receipt',render:'pkgRenderInv',p:'sinv'},srcpTbl:{row:'rcptDoc',kind:'receipt',render:'pkgRenderRcp',p:'srcp'},
  swhtTbl:{row:'rcptDoc',kind:'receipt',render:'pkgRenderWht',p:'swht'},swhtOutTbl:{row:'rcptDoc',kind:'expense',render:'pkgRenderWhtOut',p:'swhtOut'},
  mvTbl:{row:'stkMove',kind:'transfer',render:'pkgRenderMoves',p:'mv'},
  ccTbl:{row:'stkCClaim',kind:'cclaim',render:'pkgRenderCClaims',p:'cc'},
  venTbl:{row:'vendor',kind:'vendor',render:'renderVen',p:'ven'},
  grTbl:{row:'buyGr',kind:'gr',render:'renderGRList',p:'gr'},
  utilTbl:{row:'buyUtil',kind:'expense'},basTbl:{row:'buyAsset',kind:'asset'},offTbl:{row:'buyOffice',kind:'expense'},othTbl:{row:'buyOther',kind:'expense'},
  stockTbl:{row:'stkStock',kind:'stock',render:'renderStock',p:'stk'},
  clTbl:{row:'stkClaim',kind:'claim',render:'renderClaimList',p:'clm'},
  isTbl:{row:'stkIssue',kind:'issue',render:'renderIssueList',p:'isu'},
  scTbl:{row:'stkCount',kind:'count',render:'renderCountList',p:'scn'},
  'kit-register':{row:'stkKits',kind:'stock',p:'kit'},
  aArTbl:{row:'acctAr',kind:'receipt',render:'renderAcctAR',p:'aAr'},
  aApTbl:{row:'acctAp',kind:'gr',render:'renderAcctAP',p:'aAp'},
  expTbl:{row:'acctExp',kind:'expense',render:'renderExp',p:'exp',pdf:'printExpReport'},
  assetTbl:{row:'acctAsset',kind:'asset',render:'renderAssets',pdf:'printAssetReg'},
  recTbl:{row:'hrRec',kind:'hr',render:'renderHrRec',p:'rec'},
  wnTbl:{row:'hrWarn',kind:'warn',render:'renderWarnList'},
  empTbl:{row:'setting',kind:'emp',render:'renderEmp'}};
 /* both buttons follow the page's own "ส่งออกข้อมูล" box in the permission table — separate from "พิมพ์เอกสาร", so printing a
    receipt never lets anyone take the register out (user 2026-10-01); nobody has it until the owner ticks it */
 const may=id=>!curEmp()||can('m.'+REG[id].row+'_export');
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const lbl=th=>String(th.dataset.lbl||th.textContent||'').replace(/[▴▾↑↓]/g,'').replace(/\s+/g,' ').trim();
 /* one cell as plain text: lines joined with " · ", the saved time right after the date, buttons / boxes left out */
 function cellText(td){
  const seq=td.querySelector('.pkg-seq-cell span');if(seq)return seq.textContent.trim();
  const c=td.cloneNode(true),time=c.querySelector('.pkg-time');if(time)time.remove();
  c.querySelectorAll('button,input,select,script,style,.sr-only').forEach(x=>x.remove());
  c.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));c.querySelectorAll('div,p,li').forEach(b=>b.append('\n'));
  const out=c.textContent.split('\n').map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean).join(' · ');
  return time?(out+' '+time.textContent.replace(/\s+/g,' ').trim()).trim():out;
 }
 const render=id=>{const r=REG[id];if(id==='kit-register'&&LIM_RENDER.kit)return LIM_RENDER.kit();if(r.render&&typeof window[r.render]==='function')window[r.render]();};
 /* every row of the current filter: a paged register is drawn once without paging, read, and put back as it was */
 function collect(id){
  const t=document.getElementById(id),r=REG[id],lim=r.p&&document.getElementById(r.p+'Limit');let opt=null,keepV,keepP;
  if(lim){keepV=lim.value;keepP=LIM_PAGE[r.p];opt=document.createElement('option');opt.value='9999999';lim.appendChild(opt);lim.value='9999999';LIM_PAGE[r.p]=1;render(id);}
  try{
   PKG_ROW_NUMBER.number(id);
   const head=[...t.tHead.rows[0].cells],hid=window.PKG_REG_LAYOUT?PKG_REG_LAYOUT.hidden(id):[];
   /* columns a right hides (sc-cost / sc-pa … from the staff's stock rights) stay out of the file too */
   const byRight=th=>[...th.classList].some(cl=>/^sc-/.test(cl)&&typeof can==='function'&&!can('stock.'+cl.slice(3)));
   const cols=head.map((th,i)=>({i,l:lbl(th),num:th.classList.contains('num')})).filter(c=>c.l&&!/^จัดการ/.test(c.l)&&!hid[c.i]&&!byRight(head[c.i]));
   const pick=tr=>cols.map(c=>tr.cells[c.i]?cellText(tr.cells[c.i]):'');
   const body=[...t.tBodies[0].rows].filter(tr=>tr.cells.length===head.length&&tr.style.display!=='none');
   cols.forEach(c=>{if(!c.num)c.num=body.length>0&&body.every(tr=>tr.cells[c.i]?.classList.contains('num'));});
   const foot=[...(t.tFoot?t.tFoot.rows:[])].filter(tr=>tr.cells.length===head.length).map(pick);
   const out={title:titleOf(t),filters:filtersOf(t,r),cols,rows:body.map(pick),foot};
   return typeof api.extend==='function'?api.extend(id,out,body):out;   /* a module may add columns that are not on screen (product-brand.js: แบรนด์ in the 07 register) */
  }finally{if(lim){opt.remove();lim.value=keepV;LIM_PAGE[r.p]=keepP;render(id);}}
 }
 function titleOf(t){const panel=t.closest('.panel'),lift=panel&&panel.previousElementSibling?.classList.contains('pkg-page-head')?panel.previousElementSibling:null;
  return((lift||panel)?.querySelector('h2')?.textContent||document.title).replace(/\s+/g,' ').trim();}
 /* what the register is filtered by, in words: the chosen options and the search text of its filter row */
 function filtersOf(t,r){
  const info=r.p&&document.getElementById(r.p+'Info'),box=info?info.parentElement:t.closest('.panel');const out=[];
  if(box)box.querySelectorAll('select,input[type="text"],input[type="search"],input[type="date"],input[type="month"]').forEach(el=>{
   if(el.id&&/Limit$/.test(el.id))return;if(el.offsetParent===null&&el.closest('[style*="display: none"],[style*="display:none"]'))return;
   if(el.tagName==='SELECT'){const o=el.options[el.selectedIndex];if(o&&o.value)out.push(o.text.trim());}
   else if(el.value.trim())out.push((el.type==='date'?thDate(el.value):el.value.trim()));});
  return out;
 }
 /* ---------- .xlsx: the smallest valid workbook (store-only zip, inline strings, bold header, money format) ---------- */
 const utf8=s=>{if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(s);const b=unescape(encodeURIComponent(s)),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
 const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
 const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};
 function zip(files){
  const parts=[],cd=[];let off=0;
  files.forEach(([name,text])=>{const nm=utf8(name),d=utf8(text),crc=crc32(d);
   const h=new DataView(new ArrayBuffer(30));[[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[8,0,2],[10,0,2],[12,0x21,2],[14,crc,4],[18,d.length,4],[22,d.length,4],[26,nm.length,2],[28,0,2]].forEach(([o,v,s])=>s===4?h.setUint32(o,v,true):h.setUint16(o,v,true));
   const c=new DataView(new ArrayBuffer(46));[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[10,0,2],[12,0,2],[14,0x21,2],[16,crc,4],[20,d.length,4],[24,d.length,4],[28,nm.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,off,4]].forEach(([o,v,s])=>s===4?c.setUint32(o,v,true):c.setUint16(o,v,true));
   parts.push(new Uint8Array(h.buffer),nm,d);cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+d.length;});
  const size=cd.reduce((s,p)=>s+p.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 const colName=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;};
 const xml=s=>esc2(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
 const numOf=v=>{const s=String(v).replace(/,/g,'').replace(/\s*(บาท|฿)$/,'').trim();return /^-?\d+(\.\d+)?$/.test(s)?+s:null;};
 function xlsx(d){
  const W=d.cols.map(c=>Math.max(6,String(c.l).length*1.3));
  const cell=(ci,ri,v,style,isNum)=>{const ref=colName(ci)+ri;if(isNum){const x=numOf(v);if(x!==null)return`<c r="${ref}" s="${style===1?4:2}"><v>${x}</v></c>`;}
   W[ci]=Math.min(60,Math.max(W[ci]||6,String(v).length*1.15));return v===''?'':`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;};
  let ri=0;const rows=[];const row=cells=>{ri++;rows.push(`<row r="${ri}">${cells.join('')}</row>`);};
  row([`<c r="A1" t="inlineStr" s="3"><is><t xml:space="preserve">${xml(d.title)}</t></is></c>`]);
  row([`<c r="A2" t="inlineStr" s="0"><is><t xml:space="preserve">${xml(d.note)}</t></is></c>`]);
  row(d.cols.map((c,i)=>cell(i,3,c.l,1,false)));
  d.rows.forEach(r=>{const at=ri+1;row(r.map((v,i)=>cell(i,at,v,0,d.cols[i].num)));});
  d.foot.forEach(r=>{const at=ri+1;row(r.map((v,i)=>cell(i,at,v,3,d.cols[i].num)));});
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${W.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w.toFixed(1)}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData></worksheet>`;
  const name=xml(d.title.replace(/[\[\]:*?\/\\]/g,' ').slice(0,31)||'Sheet1');
  return zip([
   ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
   ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'],
   ['docProps/core.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(d.title)}</dc:title><dc:creator>${xml(d.who||'')}</dc:creator><cp:lastModifiedBy>${xml(d.who||'')}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:modified></cp:coreProperties>`],
   ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
   ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
   ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="14"/><name val="Tahoma"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF1F5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
   ['xl/worksheets/sheet1.xml',sheet]]);
 }
 /* who took the data out goes into every file (user 2026-10-01): sheet line 2 + file properties, PDF header + every page,
    the file name, and the usage log */
 const who=()=>meName(),when=()=>thDate(iso())+' '+new Date().toTimeString().slice(0,5);
 const whoShort=()=>{const s=who(),i=s.indexOf(' · ');return(i>=0?s.slice(i+3):s).split('/')[0].trim();};
 const byLine=()=>'ส่งออกโดย '+who()+' · '+when();
 const stampText=d=>[byLine(),'พบ '+d.rows.length+' รายการ',...(d.filters.length?['ตัวกรอง: '+d.filters.join(' · ')]:[])].join('   ');
 const fileName=(d,ext)=>(d.title.replace(/\s+/g,' ').trim().slice(0,60)+' '+iso()+' ('+whoShort()+')').replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ')+'.'+ext;
 /* a stamp at the top of every printed sheet — also on the reports 02 / 08 already had */
 function stamped(fn){const o=window.printDocs,tag='<div class="sheetpage">',st='<div class="pkg-by-stamp">'+esc2(byLine())+'</div>';
  window.printDocs=function(h){window.printDocs=o;return o.call(this,String(h).split(tag).join(tag+st));};
  try{return fn();}finally{if(window.printDocs!==o)window.printDocs=o;}}
 function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 function excel(id){
  if(!may(id))return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');
  const d=collect(id);if(!d.rows.length)return toast('ไม่มีรายการให้ส่งออก');d.note=stampText(d);d.who=who();
  api.save(fileName(d,'xlsx'),xlsx(d));
  logAudit(REG[id].kind,{id:'',no:d.title},'print','ส่งออก Excel '+d.rows.length+' รายการ · โดย '+who()+(d.filters.length?' · '+d.filters.join(' · '):''));save();
  toast('ส่งออก Excel '+d.rows.length+' รายการแล้ว');
 }
 function pdf(id){
  const r=REG[id];if(!may(id))return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');
  if(r.pdf&&typeof window[r.pdf]==='function'){   /* the report this page already printed, now with the stamp */
   logAudit(r.kind,{id:'',no:titleOf(document.getElementById(id))},'print','พิมพ์ / PDF รายงานของหน้า · โดย '+who());save();
   return stamped(()=>window[r.pdf]());}
  const d=collect(id);if(!d.rows.length)return toast('ไม่มีรายการให้พิมพ์');
  const td=(v,c)=>`<td${c.num?' class="num"':c.l==='ลำดับ'?' style="text-align:center"':''}>${esc2(v)}</td>`;
  const html=sheetTop({title:d.title,en:'DATA EXPORT',copy:'รายงานภายใน',fields:[['วันที่ส่งออก',esc2(when())],['ผู้ส่งออก',esc2(who())],['จำนวน',d.rows.length+' รายการ']],
    note:d.filters.length?esc2('ตัวกรอง: '+d.filters.join(' · ')):''})
   +`<table class="pkg-rep"><thead><tr class="pkg-rep-by"><th colspan="${d.cols.length}">${esc2(byLine())}</th></tr><tr>${d.cols.map(c=>`<th${c.l==='ลำดับ'?' style="width:42px"':''}>${esc2(c.l)}</th>`).join('')}</tr></thead><tbody>`
   +d.rows.map(row=>`<tr>${row.map((v,i)=>td(v,d.cols[i])).join('')}</tr>`).join('')
   +d.foot.map(row=>`<tr>${row.map((v,i)=>`<td${d.cols[i].num?' class="num"':''}><b>${esc2(v)}</b></td>`).join('')}</tr>`).join('')
   +'</tbody></table></div>';
  logAudit(r.kind,{id:'',no:d.title},'print','พิมพ์ / PDF '+d.rows.length+' รายการ · โดย '+who()+(d.filters.length?' · '+d.filters.join(' · '):''));save();
  stamped(()=>api.print(html));
 }
 /* ---------- the buttons ---------- */
 const ICON={xl:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 12l4 5M13 12l-4 5"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><text x="7.2" y="17.2" font-size="5.6" font-weight="700" fill="currentColor" stroke="none">PDF</text></svg>'};
 function bar(id){
  const t=document.getElementById(id);if(!t)return null;const host=t.closest('.scroll')||t;
  let b=t.closest('.panel')?.querySelector(`:scope .pkg-xbar[data-for="${id}"]`);if(b)return b;
  b=document.createElement('div');b.className='pkg-xbar';b.dataset.for=id;
  b.innerHTML=`<div class="pkg-xgrp" role="group" aria-label="ส่งออกรายการ"><button type="button" class="pkg-x" data-x="xl" title="ดาวน์โหลดเป็นไฟล์ Excel ทุกรายการตามตัวกรอง">${ICON.xl}<span>Excel</span></button><button type="button" class="pkg-x" data-x="pdf" title="พิมพ์ / บันทึกเป็น PDF ทุกรายการตามตัวกรอง">${ICON.pdf}<span>PDF</span></button></div>`;
  /* a long register takes a moment to gather: the pressed button says so while it works */
  b.addEventListener('click',e=>{const btn=e.target.closest('[data-x]');if(!btn||btn.disabled)return;const x=btn.dataset.x,lbl=btn.querySelector('span'),txt=lbl.textContent;
   btn.disabled=true;lbl.textContent='กำลังเตรียม…';
   setTimeout(()=>{try{if(x==='xl')excel(id);else pdf(id);}finally{btn.disabled=false;lbl.textContent=txt;}},30);});
  const sel=host.previousElementSibling;(sel&&sel.classList.contains('pkg-sel-bar')?sel:host).before(b);return b;
 }
 function paint(){Object.keys(REG).forEach(id=>{const b=bar(id);if(b)b.hidden=!may(id);});}
 /* the old report buttons of 02 / 08 expenses / 08 asset register become this PDF (hidden, the functions stay) */
 ['printCustList()','printExpReport()','printAssetReg()'].forEach(on=>document.querySelectorAll('[onclick]').forEach(b=>{if(b.getAttribute('onclick')===on)b.classList.add('pkg-io-moved');}));
 const ap=window.applyPerms;if(typeof ap==='function')window.applyPerms=function(){const r=ap.apply(this,arguments);try{paint();}catch(e){}return r;};
 const api={registers:REG,collect,excel,pdf,xlsx,cellText,paint,may,save:download,print:html=>printDocs(html)};
 window.PKG_REG_EXPORT=api;
 paint();
})();
