/* Menu 11.3 · "นำเข้า / ส่งออกข้อมูล" — one place for every data file in and out (user 2026-09-30):
   one card per kind of data with every action visible (user: easier than modes) — own DriveGo look, not the reference's:
   white cards with a header strip, full-width action rows with a chevron, small ✓/✕ notes. The original functions do the work
   (impStockForm / impCustForm / impPick / exportData / #impFile → importData); the new CSV exports use csvDownload.
   The old import / export buttons on 02 customers, 07 parts and 10 settings are hidden (moved here, not removed).
   Rights: the original keys — doc.export to download, doc.import (+ stock.edit / doc.custEdit / doc.backup) to import. */
(()=>{
 if(!window.PKG_UISET)return;
 const day=()=>iso(new Date());
 const addrText=a=>a?[a.no,a.village,a.moo&&('หมู่ '+a.moo),a.soi&&('ซ.'+a.soi),a.road&&('ถ.'+a.road),a.sub,a.dist,a.zip].filter(Boolean).join(' '):'';
 /* ---------- downloads of the data in the system (same columns as the import forms where one exists) ---------- */
 function exportStock(){
  const rows=[['รหัสสินค้า(อู่)*','รหัส OEM','ชื่อสินค้า*','หมวด','หน่วย','จำนวนคงเหลือ','ต้นทุน/หน่วย','ราคาขาย A','ราคาขาย B','ราคาขาย C','จุดสั่งซื้อ Min','สต๊อกสูงสุด Max','แบรนด์สินค้า']];   /* แบรนด์สินค้า = 13th column, last so older files still line up (product-brand.js reads it on import) */
  (DB.stock||[]).forEach(s=>rows.push([s.code,s.oem,s.name,s.cat,s.unit,s.qty,s.cost,s.pa,s.pb,s.pc,s.min,s.max,s.brand].map(x=>x==null?'':x)));
  const EX=window.PKG_EXPIRY;if(EX&&EX.COLS){rows[0].push(...EX.COLS);(DB.stock||[]).forEach((s,i)=>rows[i+1].push(...EX.csvCells(s)));}   /* stock-expiry.js: columns 14–16 มีวันหมดอายุ · อายุสินค้า (เดือน) · เตือนล่วงหน้า (วัน) — read back on import, older files still import */
  csvDownload('ข้อมูลสินค้า-'+day()+'.csv',rows);logAudit('stock',{id:'',no:'CSV'},'print','ส่งออกข้อมูลสินค้า '+(rows.length-1)+' รายการ');save();toast('ส่งออกข้อมูลสินค้า '+(rows.length-1)+' รายการแล้ว');
 }
 function exportCust(){
  const rows=[window.PKG_CUST_IMPORT?PKG_CUST_IMPORT.HEAD.slice():['ชื่อลูกค้า*','ชื่อบริษัท (ถ้าเป็นนิติบุคคล)','เบอร์โทร','เบอร์สำรอง','เลขผู้เสียภาษี','ที่อยู่','จังหวัด','ทะเบียนรถ','จังหวัดทะเบียน','ยี่ห้อรถ','รุ่นรถ']];
  const car=rows[0].length>11?v=>[v.color,v.year,v.vin,v.engine,v.mile]:()=>[];
  (DB.cust||[]).forEach(c=>{const base=[c.name,c.company,c.tel,c.tel2,c.tax,addrText(c.addr),(c.addr||{}).prov];const vs=(c.vehicles||[]).length?c.vehicles:[{}];
   vs.forEach(v=>rows.push(base.concat([[v.plateL,v.plateN].filter(Boolean).join(' '),v.plateProv,v.brand,v.model],car(v)).map(x=>x==null?'':x)));});   /* one row per vehicle = the import form, so it imports back */
  csvDownload('ข้อมูลลูกค้า-'+day()+'.csv',rows);logAudit('cust',{id:'',no:'CSV'},'print','ส่งออกข้อมูลลูกค้า '+(DB.cust||[]).length+' ราย');save();toast('ส่งออกข้อมูลลูกค้า '+(DB.cust||[]).length+' รายแล้ว');
 }
 const VEN_HEAD=['ชื่อผู้ขาย*','ประเภท','เลขผู้เสียภาษี','ผู้ติดต่อ','เบอร์โทร','เบอร์สำรอง','ที่อยู่','จังหวัด','เครดิต (วัน)','ธนาคาร','เลขบัญชี','ชื่อบัญชี','ประเภทสินค้าที่ขาย'];
 function exportVen(){
  const rows=[VEN_HEAD.slice()];
  (DB.vendors||[]).forEach(v=>rows.push([v.name,v.type==='company'?'นิติบุคคล':'บุคคลธรรมดา',v.tax,v.contact,v.tel,v.tel2,addrText(v.addr),(v.addr||{}).prov,v.cash?'เงินสด':v.days,v.bankName,v.bankNo,v.bankAcc,(v.cats||[]).join(' / ')].map(x=>x==null?'':x)));
  csvDownload('ข้อมูลผู้ขาย-'+day()+'.csv',rows);logAudit('vendor',{id:'',no:'CSV'},'print','ส่งออกข้อมูลผู้ขาย '+(rows.length-1)+' ราย');save();toast('ส่งออกข้อมูลผู้ขาย '+(rows.length-1)+' รายแล้ว');
 }
 function exportEmp(){   /* no PIN, ID-card number or pay in this file */
  const rows=[['รหัสพนักงาน','ชื่อ - นามสกุล','ตำแหน่ง','วันเริ่มงาน','เบอร์โทร','สถานะ']];
  (DB.emp||[]).forEach(e=>rows.push([e.code,e.name,e.position,e.start?thDate(e.start):'',e.tel,empActive(e)?'ใช้งาน':'ปิดใช้งาน'].map(x=>x==null?'':x)));
  csvDownload('รายชื่อพนักงาน-'+day()+'.csv',rows);logAudit('emp',{id:'',no:'CSV'},'print','ส่งออกรายชื่อพนักงาน '+(rows.length-1)+' คน');save();toast('ส่งออกรายชื่อพนักงาน '+(rows.length-1)+' คนแล้ว');
 }
 /* the original JSON import replaces data at once — ask first */
 async function importBackup(){
  if(!(can('doc.import')&&can('doc.backup')))return toast('บัญชีนี้ไม่มีสิทธิ์นำเข้าไฟล์สำรองทั้งระบบ');
  if(!await askP({title:'นำเข้าไฟล์สำรองทั้งระบบ',text:'ข้อมูลในไฟล์จะแทนที่ข้อมูลเดิมทุกหมวดที่มีอยู่ในไฟล์ (ลูกค้า สินค้า เอกสาร พนักงาน ฯลฯ) และย้อนกลับไม่ได้ — แนะนำให้ “ส่งออกไฟล์สำรอง” เก็บไว้ก่อน',yes:'เลือกไฟล์และนำเข้า',no:'ยกเลิก'}))return;
  document.getElementById('impFile').click();
 }
 const canImpStock=()=>can('doc.import')&&can('stock.edit'),canImpCust=()=>can('doc.import')&&can('doc.custEdit'),canImpVen=()=>can('doc.import')&&can('doc.venEdit');
 /* ---------- vendor import (user 2026-09-30: why can't vendors be imported from a file?) — adds vendors that aren't in the system
    yet (same 13-digit tax ID or same name = already there), never edits one. Same columns as the vendor download, so that file
    imports back without duplicates. Bank and product types are matched to the vendor form's own lists. ---------- */
 const low=s=>String(s==null?'':s).replace(/\s+/g,'').toLowerCase();
 const BANK_ALIAS={kbank:'กสิกร',scb:'ไทยพาณิชย์',bbl:'กรุงเทพ',ktb:'กรุงไทย',bay:'กรุงศรี',krungsri:'กรุงศรี',ttb:'ทหารไทย',tmb:'ทหารไทย',ธนชาต:'ทหารไทย',gsb:'ออมสิน',
  baac:'เพื่อการเกษตร',ธกส:'เพื่อการเกษตร',ghb:'อาคารสงเคราะห์',ธอส:'อาคารสงเคราะห์',kkp:'เกียรตินาคิน',cimb:'ซีไอเอ็มบี',tisco:'ทิสโก้',uob:'ยูโอบี',lhb:'แลนด์'};
 const bankKey=s=>low(s).replace(/^(ธนาคาร|ธ\.)/,'').replace(/\(.*?\)/g,'').replace(/[.\-]/g,'');
 function bankOf(t){const k=bankKey(t);if(!k)return{name:'',lost:''};const a=BANK_ALIAS[k]||k;
  const hit=BANKS.filter(b=>bankKey(b)===a),part=hit.length?hit:a.length>=3?BANKS.filter(b=>bankKey(b).startsWith(a)):[];
  return part.length===1?{name:part[0],lost:''}:{name:'',lost:String(t).trim()};}
 function catsOf(t){let rest=low(t);const out=[];
  CATS.slice().sort((a,b)=>b.length-a.length).forEach(c=>{const k=low(c);if(k&&rest.includes(k)){out.push(c);rest=rest.replace(k,'');}});   /* names may hold a "/" themselves */
  return CATS.filter(c=>out.includes(c));}
 function venPlan(rows){
  const C=window.PKG_CUST_IMPORT||{},nk=C.nameKey||low,fix=C.telFix||(s=>s),prov=C.provOf||(s=>s);
  const tax13=s=>{const d=String(s||'').replace(/\D/g,'');return d.length===13?d:'';};
  const have=(DB.vendors||[]).map(v=>({t:tax13(v.tax),k:nk(v.name)})),seen=[],add=[],skip={},miss=k=>{skip[k]=(skip[k]||0)+1;};
  rows.forEach(r=>{const g=i=>String(r[i]==null?'':r[i]).trim(),name=g(0);if(!name)return miss('ไม่มีชื่อผู้ขาย');
   const id={t:tax13(g(2)),k:nk(name)},same=x=>(id.t&&x.t===id.t)||x.k===id.k;
   if(have.some(same))return miss('มีในระบบแล้ว');if(seen.some(same))return miss('ซ้ำกันในไฟล์');seen.push(id);
   const typ=g(1),cr=g(8),b=bankOf(g(9)),cash=/เงินสด/.test(cr),days=cash?0:cr?n(cr.replace(/[^\d.]/g,'')):30;   /* blank credit = the form's 30 days */
   add.push({id:uid(),type:/บุคคลธรรมดา/.test(typ)?'person':'company',name,tax:g(2),days,contact:g(3),tel:fix(g(4)),tel2:fix(g(5)),cash,
    bankName:b.name,bankNo:g(10),bankAcc:g(11),bank:[b.name||b.lost,g(10)].filter(Boolean).join(' '),note:b.lost?'ธนาคาร (จากไฟล์): '+b.lost:'',
    cats:catsOf(g(12)),addr:{no:g(6),village:'',moo:'',soi:'',road:'',sub:'',dist:'',prov:prov(g(7)),zip:''}});});
  return{add,skip,skipped:Object.values(skip).reduce((a,b)=>a+b,0),why:Object.entries(skip).map(([k,v])=>k+' '+v).join(' · ')};
 }
 async function venApply(rows){
  if(!canImpVen())return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขข้อมูลผู้ขาย');
  const p=venPlan(rows);
  if(!p.add.length)return toast('ไม่มีผู้ขายใหม่ให้เพิ่ม'+(p.skipped?' — ข้าม '+p.skipped+' แถว ('+p.why+')':''));
  if(!await askP({title:'นำเข้าผู้ขายจาก CSV',text:'พบผู้ขายใหม่ '+p.add.length+' ราย'+(p.skipped?'\nข้าม '+p.skipped+' แถว ('+p.why+')':'')+'\nข้อมูลผู้ขายเดิมจะไม่ถูกแก้ไข\n\nยืนยันนำเข้า?',yes:'นำเข้า',no:'ยกเลิก'}))return;
  p.add.forEach(v=>{stampRec(v,null);DB.vendors.push(v);});
  logAudit('vendor',{id:'',no:'CSV'},'save','นำเข้าผู้ขายจากไฟล์ '+p.add.length+' ราย'+(p.skipped?' · ข้าม '+p.skipped+' แถว':''));
  save();renderVen();render();saveFx('นำเข้าผู้ขายแล้ว',p.add.length+' ราย');toast('นำเข้าผู้ขาย '+p.add.length+' ราย'+(p.skipped?' · ข้าม '+p.skipped+' แถว':''));
 }
 window.impVenForm=function(){
  csvDownload('แบบฟอร์มนำเข้าผู้ขาย.csv',[VEN_HEAD,
   ['บริษัท อะไหล่ดี จำกัด','นิติบุคคล','0105551234567','คุณสมหญิง','021234567','','88 ถ.ลาดพร้าว','กรุงเทพมหานคร','30','กสิกรไทย','1234567890','บริษัท อะไหล่ดี จำกัด','ระบบเบรก / อะไหล่ช่วงล่าง'],
   ['ร้านน้ำมันเครื่องสมใจ','บุคคลธรรมดา','','คุณสมใจ','0812345678','','','นนทบุรี','เงินสด','','','','น้ำมัน / ของเหลว']]);
  toast('ดาวน์โหลดแบบฟอร์มแล้ว — ลบแถวตัวอย่างก่อนกรอก · เครดิตใส่จำนวนวัน หรือ "เงินสด"');
 };
 window.PKG_IMPORT_MODES=Object.assign(window.PKG_IMPORT_MODES||{},{ven:{head:'ชื่อผู้ขาย',apply:venApply}});
 /* ---------- Page: one card per kind of data, every action visible at once (user: easier than switching modes),
    in DriveGo's own look — white cards with a header strip, action rows with a chevron, ✓/✕ notes (not the reference's frames/tiles) */
 const ACT={
  'stock.exp':{ok:()=>can('doc.export'),run:exportStock},'cust.exp':{ok:()=>can('doc.export'),run:exportCust},
  'ven.exp':{ok:()=>can('doc.export'),run:exportVen},'ven.tpl':{ok:canImpVen,run:()=>impVenForm()},'ven.imp':{ok:canImpVen,run:()=>impPick('ven')},'emp.exp':{ok:()=>can('doc.export')&&can('doc.emp'),run:exportEmp},
  'stock.tpl':{ok:canImpStock,run:()=>impStockForm()},'stock.imp':{ok:canImpStock,run:()=>impPick('stock')},
  'cust.tpl':{ok:canImpCust,run:()=>impCustForm()},'cust.imp':{ok:canImpCust,run:()=>impPick('cust')},
  'db.exp':{ok:()=>can('doc.export'),run:()=>exportData()},'db.imp':{ok:()=>can('doc.import')&&can('doc.backup'),run:importBackup}};
 const COUNT={stock:()=>(DB.stock||[]).length+' รายการ',cust:()=>(DB.cust||[]).length+' ราย',ven:()=>(DB.vendors||[]).length+' ราย',emp:()=>(DB.emp||[]).length+' คน',db:()=>''};
 const ic={box:'<svg viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/></svg>',
  truck:'<svg viewBox="0 0 24 24"><path d="M2.5 6h11v10h-11zM13.5 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.6.3 4.2 2 4.6 4.9"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/></svg>',
  form:'<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 20V9M7.5 13.5 12 9l4.5 4.5M5 4h14"/></svg>'};
 const CARDS=[
  {k:'stock',t:'สินค้า / อะไหล่',from:'ทะเบียนอะไหล่ · เมนู 07',ic:'box',rows:[['exp','down','ดาวน์โหลดข้อมูลในระบบ','CSV ทุกรายการ · คอลัมน์เดียวกับแบบฟอร์ม'],['tpl','form','ดาวน์โหลดแบบฟอร์มนำเข้า','มีแถวตัวอย่าง — ลบก่อนกรอก'],['imp','up','นำเข้าสินค้าใหม่จากไฟล์ CSV','บันทึกไฟล์เป็น CSV UTF-8 ก่อนนำเข้า']],
   notes:[[1,'เพิ่มเฉพาะรหัสที่ยังไม่มีในระบบ'],[0,'รหัสซ้ำจะถูกข้าม ไม่แก้ของเดิม'],[1,'จำนวนคงเหลือ = ยอดยกมา']]},
  {k:'cust',t:'ลูกค้า',from:'ข้อมูลลูกค้า · เมนู 02',ic:'user',rows:[['exp','down','ดาวน์โหลดข้อมูลในระบบ','ลูกค้าและรถทุกคัน (1 แถวต่อรถ 1 คัน) · นำกลับเข้าได้'],['tpl','form','ดาวน์โหลดแบบฟอร์มนำเข้า','มีตัวอย่างบริษัทรถหลายคัน — ลบก่อนกรอก'],['imp','up','นำเข้าลูกค้า / รถจากไฟล์ CSV','ลูกค้าใหม่ หรือเพิ่มรถให้ลูกค้าเดิม']],
   notes:[[1,'1 แถว = รถ 1 คัน · หลายคันใส่ชื่อลูกค้าซ้ำ'],[1,'ลูกค้าเดิม → เพิ่มเฉพาะรถคันใหม่'],[0,'ไม่แก้ข้อมูลลูกค้าเดิม · รถซ้ำข้าม']]},
  {k:'ven',t:'ผู้ขาย / คู่ค้า',from:'ข้อมูลผู้ขาย · เมนู 05',ic:'truck',rows:[['exp','down','ดาวน์โหลดข้อมูลในระบบ','พร้อมเครดิต ธนาคาร และสินค้าที่ขาย · นำกลับเข้าได้'],['tpl','form','ดาวน์โหลดแบบฟอร์มนำเข้า','มีแถวตัวอย่าง — ลบก่อนกรอก'],['imp','up','นำเข้าผู้ขายใหม่จากไฟล์ CSV','เพิ่มเฉพาะรายที่ยังไม่มีในระบบ']],
   notes:[[1,'ชื่อหรือเลขผู้เสียภาษีซ้ำ = มีแล้ว ข้าม'],[0,'ไม่แก้ข้อมูลผู้ขายเดิม']]},
  {k:'emp',t:'พนักงาน',from:'ข้อมูลพนักงาน · เมนู 10',ic:'team',rows:[['exp','down','ดาวน์โหลดรายชื่อพนักงาน','ไม่มี PIN เลขบัตรประชาชน และเงินเดือน']],notes:[[0,'ยังนำเข้าพนักงานจากไฟล์ไม่ได้']]},
  {k:'db',t:'สำรอง / กู้คืนทั้งระบบ',from:'ไฟล์สำรอง JSON · ทุกหมวดในไฟล์เดียว',ic:'shield',wide:true,rows:[['exp','down','ส่งออกไฟล์สำรองทั้งระบบ','เก็บไว้นอกเครื่องเป็นระยะ'],['imp','up','กู้คืนจากไฟล์สำรอง','แทนที่ข้อมูลเดิมทุกหมวดในไฟล์ · ถามยืนยันก่อน']],
   notes:[[0,'กู้คืนแล้วย้อนกลับไม่ได้'],[1,'จุดสำรองอัตโนมัติ และล้างข้อมูล อยู่ที่เมนู 10']]}];
 const el=document.createElement('div');
 el.innerHTML=`<div class="panel pkg-io3"><header><h2>11.3 · นำเข้า / ส่งออกข้อมูล</h2></header><div class="body">
  <p class="hint pkg-io3-note">รวมการนำข้อมูลเข้าและออกจากระบบไว้ที่เดียว · ปุ่มที่เห็นขึ้นกับสิทธิ์ของบัญชีที่ใช้งาน</p>
  <div class="pkg-io3-grid">${CARDS.map(c=>`<article class="pkg-io3-card${c.wide?' wide':''}${c.k==='db'?' db':''}" data-card="${c.k}">
   <div class="hd"><span class="bdg">${ic[c.ic]}</span><div class="tt"><b>${c.t}</b><small>${c.from}</small></div><span class="ct" data-count="${c.k}"></span></div>
   <div class="acts">${c.rows.map(([a,i,t,sub])=>`<button type="button" class="pkg-io3-act a-${a}${c.k==='db'&&a==='imp'?' risky':''}" data-act="${c.k}.${a}" data-row="${c.k}.${a}"><span class="ai">${ic[i]}</span><span class="at"><b>${t}</b><small>${sub}</small></span><span class="chev" aria-hidden="true">›</span></button>`).join('')}</div>
   <ul class="nt">${c.notes.map(([ok,n])=>`<li class="${ok?'y':'n'}">${n}</li>`).join('')}</ul>
  </article>`).join('')}</div></div></div>`;
 function render(){
  el.querySelectorAll('[data-row]').forEach(r=>{r.hidden=!ACT[r.dataset.row].ok();});
  el.querySelectorAll('[data-card]').forEach(c=>{c.hidden=[...c.querySelectorAll('[data-row]')].every(r=>r.hidden);});
  el.querySelectorAll('[data-count]').forEach(c=>{const t=COUNT[c.dataset.count]();c.textContent=t?'ในระบบ '+t:'';c.hidden=!t;});
 }
 el.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=ACT[b.dataset.act];
  if(!a.ok())return toast('บัญชีนี้ไม่มีสิทธิ์ใช้เมนูนี้');
  a.run();
 });
 PKG_UISET.addSub({key:'io',label:'11.3 นำเข้า / ส่งออกข้อมูล',allowed:()=>Object.values(ACT).some(a=>a.ok()),el,show:render});
 /* counts follow imports made from this page */
 ['impCustApply','impStockApply'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;window[n]=async function(){const r=await o.apply(this,arguments);if(el.offsetParent||el.style.display==='')render();return r;};});
 /* The old buttons on 02 / 07 / 10 now live here: hide them (the functions stay). */
 const MOVED=["impCustForm()","impPick('cust')","impStockForm()","impPick('stock')","exportData()","document.getElementById('impFile').click()"];
 [...document.querySelectorAll('[onclick]')].filter(b=>MOVED.includes(b.getAttribute('onclick'))).forEach(b=>{
  b.classList.add('pkg-io-moved');
  const hint=b.parentElement&&[...b.parentElement.children].find(x=>x.matches('span.hint.pc-export')&&/CSV/.test(x.textContent));if(hint)hint.classList.add('pkg-io-moved');
 });
 window.PKG_DATA_IO={acts:ACT,cards:CARDS,render,exportStock,exportCust,exportVen,exportEmp,importBackup,venPlan,venApply,bankOf,catsOf};
})();
