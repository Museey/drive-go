/* วันที่เอกสารแก้ไม่ได้ (user 2026-10-07): "วันที่เอกสารทุกใบไม่ควรแก้ไขได้" — a document's date is the day it is
   recorded in the system. Dates that come from outside stay as their own editable fields (e.g. 06.1 วันที่ใบกำกับผู้ขาย,
   03 วันที่รับรถเข้า, 4.2 / 06.1 กำหนดชำระ).
   · The document-date inputs are read-only (not clickable, no typing); new documents show today; saved documents keep
     the date they were saved with.
   · On the first save the date is set to today again (a window opened before midnight and saved after gets the real day).
   · Some documents also carry an optional "วันที่ในเอกสาร" (DOCDATE below; user example: a billing note made on the
     28th that must show the 25th to the customer). Filled = the printout shows it; empty = the creation date.
   · The register date-basis radios (สร้างข้อมูล / เอกสาร / อนุมัติ) are gone with this (reg-filter.js BASIS=false):
     document date = creation date, so the choice no longer means anything. */
(()=>{
 const $i=id=>document.getElementById(id);
 const gv=name=>{try{return (0,eval)(name);}catch(e){return null;}};
 /* input id → [save function, "is this document unsaved?"] */
 const LOCK={
  qDate:['saveQuote',()=>{const d=gv('Q');return d&&!d.no&&!d.revOf;}],
  rDate:['saveReceipt',()=>{const d=gv('R');return d&&!d.no;}],
  bnDate:['saveBilling',()=>{const d=gv('BN');return d&&!d.no;}],
  grDate:['saveGR',()=>{const d=gv('G');return d&&!d.no;}],
  clDate:['saveClaim',()=>{const d=gv('C');return d&&!d.no;}],
  isDate:['saveIssue',()=>{const d=gv('IS');return d&&!d.no;}],
  scDate:['saveCount',()=>{const d=gv('SC');return d&&!d.no;}],
  xDate:['saveExp',()=>!gv('editExpId')]
 };
 const TIP='วันที่เอกสาร = วันที่บันทึกเข้าระบบ แก้ไขไม่ได้';
 function lock(){Object.keys(LOCK).forEach(id=>{const el=$i(id);if(!el||el.dataset.pkgLock)return;
  el.dataset.pkgLock='1';el.readOnly=true;el.tabIndex=-1;el.classList.add('pkg-date-lock');el.title=TIP;el.setAttribute('aria-readonly','true');});}   /* no lock icon on the label (user 2026-10-07) */
 /* nothing gets through: typing, the picker, wheel */
 document.addEventListener('keydown',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('pkg-date-lock')&&e.key!=='Tab'){e.preventDefault();}},true);
 ['mousedown','click','focus','input','change'].forEach(t=>document.addEventListener(t,e=>{const el=e.target;if(!el||!el.classList||!el.classList.contains('pkg-date-lock'))return;
  if(t==='focus'){el.blur();return;}if(t==='input'||t==='change'){e.stopImmediatePropagation();}e.preventDefault();},true));
 /* new documents: today at the moment of saving */
 Object.entries(LOCK).forEach(([id,[fn,unsaved]])=>{const o=window[fn];if(typeof o!=='function')return;
  window[fn]=function(){try{if(unsaved()){const el=$i(id);if(el)el.value=iso();}}catch(e){}lock();return o.apply(this,arguments);};});
 const om=window.openModal;window.openModal=function(){lock();return om.apply(this,arguments);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(lock,0));else setTimeout(lock,0);
 /* ---------- optional printed date ---------- */
 const DOCDATE={
  billing:{after:'bnDate',id:'bnDocDate',doc:()=>gv('BN'),collect:'collectBilling',fill:'fillBillingForm',sheet:'sheetBilling',created:'วันที่สร้างข้อมูล'}
 };
 Object.values(DOCDATE).forEach(c=>{
  const base=$i(c.after);if(!base)return;
  const lab=base.closest('label');const sp=lab&&lab.querySelector('span');if(sp&&c.created)sp.textContent=c.created;
  const f=document.createElement('label');f.className='f pkg-docdate';
  f.innerHTML=`<span>วันที่ในเอกสาร</span><input type="date" id="${c.id}" title="ไม่กรอก = ใช้วันที่สร้างข้อมูล"><small class="hint">ไม่กรอก = ใช้วันที่สร้างข้อมูล · เอกสารที่พิมพ์แสดงวันที่นี้</small>`;
  if(lab)lab.after(f);
  const inp=$i(c.id);
  inp.addEventListener('change',()=>{const d=c.doc();if(d){if(inp.value)d.docDate=inp.value;else delete d.docDate;}});   /* print before saving uses it too */
  const fo=window[c.fill];if(typeof fo==='function')window[c.fill]=function(){const r=fo.apply(this,arguments);const d=c.doc();inp.value=(d&&d.docDate)||'';return r;};
  const co=window[c.collect];if(typeof co==='function')window[c.collect]=function(){const r=co.apply(this,arguments);const d=c.doc();if(d){if(inp.value)d.docDate=inp.value;else delete d.docDate;}return r;};
  /* the printout: the document date shown = วันที่ในเอกสาร when filled */
  const so=window[c.sheet];if(typeof so==='function')window[c.sheet]=function(d,...rest){return so.call(this,d&&d.docDate?Object.assign({},d,{date:d.docDate}):d,...rest);};
 });
 /* ---------- expenses: the date printed on the supplier's receipt / tax invoice (user 2026-10-07) ----------
    One window (#mExp) serves 08 ค่าใช้จ่ายกิจการ and 06.2 / 06.5 / 06.6. Kept as information (x.billDate) — every report
    still counts the creation date (user chose option 1: lists and reports always agree). Shown in the four registers
    under the payee, next to the invoice number. */
 (()=>{
  const xd=$i('xDate'),inv=$i('xInv');if(!xd||!inv)return;
  const sp=xd.closest('label')&&xd.closest('label').querySelector('span');if(sp)sp.textContent='วันที่สร้างข้อมูล';
  const row=inv.closest('.grid');if(row&&row.classList.contains('g3')){row.classList.remove('g3');row.classList.add('g4');}
  const f=document.createElement('label');f.className='f';f.innerHTML='<span>วันที่ในใบเสร็จ / ใบกำกับผู้ขาย</span><input type="date" id="xBillDate">';
  inv.closest('label').after(f);
  const bd=$i('xBillDate');let pending=null;
  const oe=window.openExp;if(typeof oe==='function')window.openExp=function(id){const r=oe.apply(this,arguments);const x=id?DB.expenses.find(e=>e.id===id):null;bd.value=(x&&x.billDate)||'';return r;};
  /* saveExp builds a new record from the fields: hand it the bill date while it stamps the record */
  const se=window.saveExp;if(typeof se==='function')window.saveExp=function(){pending={v:bd.value};try{return se.apply(this,arguments);}finally{pending=null;}};
  const sr=window.stampRec;window.stampRec=function(rec){if(pending&&rec&&typeof rec==='object'&&'cat' in rec&&'base' in rec){if(pending.v)rec.billDate=pending.v;else delete rec.billDate;}return sr.apply(this,arguments);};
  /* registers: "ผู้รับเงิน · เลขที่ใบกำกับ · ลงวันที่ …" */
  const show=tbl=>{const t=$i(tbl);if(!t)return;t.querySelectorAll('tbody tr').forEach(tr=>{if(tr.querySelector('.pkg-billdate'))return;
   const b=[...tr.querySelectorAll('[onclick]')].find(e=>/^openExp\('/.test(e.getAttribute('onclick')||''));const id=b&&(b.getAttribute('onclick').match(/openExp\('([^']+)'/)||[])[1];const x=id&&DB.expenses.find(e=>e.id===id);if(!x||!x.billDate)return;
   const cell=[...tr.cells].find(td=>x.desc&&td.textContent.includes(x.desc))||[...tr.cells].find(td=>td.querySelector('.hint'));if(!cell)return;
   let h=cell.querySelector('.hint');if(!h){h=document.createElement('div');h.className='hint';cell.append(h);}
   h.insertAdjacentHTML('beforeend',`<span class="pkg-billdate">${h.textContent.trim()?' · ':''}ลงวันที่ ${thDate(x.billDate)}</span>`);});};
  [['renderExp','expTbl'],['renderUtil','utilTbl'],['renderOffice','offTbl'],['renderOther','othTbl']].forEach(([fn,tbl])=>{const o=window[fn];if(typeof o!=='function')return;
   window[fn]=function(){const r=o.apply(this,arguments);try{show(tbl);}catch(e){}return r;};});
 })();
 window.PKG_DATE_LOCK={ids:Object.keys(LOCK),lock,docdate:DOCDATE};
})();
