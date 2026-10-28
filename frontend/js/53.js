/* ระบบขายแบบใหม่ · reports. Phase 1 = the page "11.5 ระบบขายแบบใหม่" only (SALE-FLOW-TECH.md §3.2 calls it 11.3 — that
   number was already "นำเข้า / ส่งออกข้อมูล"; 11.4 = สาขา): the switch DB.pkgSaleFlow.on (OFF until the owner presses the
   button) and a SHORT before / after summary (owner 12 Oct: the data in the system is test data — keep this page small):
   how many sales are re-linked, the totals of the current year before → after, one line per month, what is owed.
   The numbers come from PKG_SALE.plan() (a simulation on copies — nothing is changed by looking).
   "เปิดใช้" asks twice, takes a backup first (a restore point in the program's own store + a JSON file download), then
   PKG_SALE.apply(plan). "ย้อนกลับ" = PKG_SALE.revert(), offered only while nothing has been done in the new flow.
   Later phases add here: the daily report (08), the home "รอชำระ" card, finance() cash-in from payments. */
(()=>{
 if(!window.PKG_UISET||!window.PKG_SALE)return;
 const S=window.PKG_SALE,r2=v=>Math.round(n(v)*100)/100;
 const owner=()=>!curEmp();
 const maySee=()=>owner()||(can('tabs.setting')&&can('doc.fin'));
 const mayApply=()=>owner()||(can('tabs.setting')&&can('doc.backup'));
 const MON=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 const beY=y=>String(+y+543),mLabel=k=>MON[+k.slice(5,7)-1]+' '+beY(k.slice(0,4));
 const fm=v=>money(r2(v)),diff=v=>{v=r2(v);return Math.abs(v)<0.005?'<span class="z">ไม่เปลี่ยน</span>':'<span class="'+(v>0?'up':'dn')+'">'+(v>0?'+':'−')+money(Math.abs(v))+'</span>';};
 const dn=v=>{v=Math.round(v);return v===0?'<span class="z">ไม่เปลี่ยน</span>':'<span class="'+(v>0?'up':'dn')+'">'+(v>0?'+':'−')+Math.abs(v)+'</span>';};
 let P=null,PK='',YEAR='';
 const key=()=>[(DB.receipts||[]).length,(DB.stockCuts||[]).length,S.on()?1:0,(S.flag()||{}).at||''].join('|');
 const getPlan=()=>{const k=key();if(!P||PK!==k){P=S.plan();PK=k;}return P;};
 const el=document.createElement('div');
 el.innerHTML=`<div class="panel pkg-sf"><header><h2>11.5 · ระบบขายแบบใหม่</h2></header><div class="body" id="pkgSfBody"></div></div>`;
 const body=()=>el.querySelector('#pkgSfBody');
 const yearsOf=p=>[...new Set(p.months.map(m=>m.ym.slice(0,4)))].sort();
 function sumYear(p,y){const z={b:{base:0,cogs:0,n:0},a:{base:0,cogs:0,n:0}};p.months.filter(m=>m.ym.slice(0,4)===y).forEach(m=>{['b','a'].forEach(s=>{z[s].base+=m[s].base;z[s].cogs+=m[s].cogs;z[s].n+=m[s].n;});});return z;}
 const HOW=`<div class="pkg-sf-how"><b>ระบบขายแบบใหม่ต่างจากเดิมอย่างไร</b><ul>
   <li>ยอดขายและกำไรนับจากใบตัดสต็อกสินค้า ในวันที่ของออกจากร้าน ไม่ต้องรอออกใบเสร็จ</li>
   <li>ใบเสร็จรับเงินคือการรับเงินแต่ละครั้ง — ใบตัดสต็อกหนึ่งใบรับเงินได้หลายครั้ง (มัดจำ / แบ่งจ่าย)</li>
   <li>เอกสารเดิมไม่หายและไม่เปลี่ยนเลขที่ — ระบบเพียงผูกใบเสร็จเดิมเข้ากับใบตัดสต็อกของมัน</li></ul></div>`;
 function statusHtml(){
  const f=S.flag()||{};
  if(S.on())return `<div class="pkg-sf-status on"><span class="dot"></span><div><b>เปิดใช้ระบบขายแบบใหม่แล้ว</b><small>ตั้งแต่ ${thDate(f.since)} · โดย <span data-no-translate>${esc(f.by||'-')}</span></small></div></div>`;
  return `<div class="pkg-sf-status"><span class="dot"></span><div><b>ยังไม่เปิดใช้ — โปรแกรมทำงานแบบเดิมทุกอย่าง</b><small>${f.stale?'ข้อมูลที่นำเข้าล่าสุดยังเป็นแบบเดิม กดเปิดใช้อีกครั้งเพื่อปรับเอกสาร':f.revertedAt?'ย้อนกลับมาใช้แบบเดิมเมื่อ '+thDateTime(f.revertedAt):'อ่านสรุปด้านล่างก่อน แล้วจึงกดเปิดใช้'}</small></div></div>`;
 }
 function tiles(c,p){
  const fresh=c.B+c.C+c.D+c.E,T=(v,t,s,cls)=>`<div class="pkg-sf-tile${cls?' '+cls:''}"><b>${v}</b><span>${t}</span><small>${s}</small></div>`;
  return `<div class="pkg-sf-tiles">
   ${T(c.A,'ใบตัดสต็อกที่ผูกกับใบเสร็จเดิม','ใบเสร็จเดิมกลายเป็นรายการรับเงินของใบตัดสต็อก เลขที่เดิม')}
   ${T(p.moved,'ใบที่ย้ายเดือน','วันที่ขายกับวันที่ออกใบเสร็จอยู่คนละเดือน ยอดจะไปอยู่เดือนที่ขาย',p.moved?'amb':'')}
   ${T(fresh,'ใบตัดสต็อกเดิมที่ยังไม่มีใบเสร็จ','จะเริ่มนับเป็นยอดขายในวันที่ตัดสต็อก',fresh?'amb':'')}
   ${T(c.G,'ใบเสร็จเดิมที่ไม่มีใบตัดสต็อก','เช่น งานค่าแรงล้วน — คงไว้เหมือนเดิม')}
   ${c.H+c.I?T(c.H+c.I,'รายการที่ต้องตรวจ','ดูรายละเอียดด้านล่าง','red'):''}</div>`;
 }
 function yearTable(p,y){
  const z=sumYear(p,y),gb=z.b.base-z.b.cogs,ga=z.a.base-z.a.cogs,row=(t,b,a,num)=>`<tr><td>${t}</td><td class="num">${num?b:fm(b)}</td><td class="num"><b>${num?a:fm(a)}</b></td><td class="num">${num?dn(a-b):diff(a-b)}</td></tr>`;
  return `<table class="tbl pkg-sf-tbl" id="pkgSfYear"><thead><tr><th>ยอดรวมปี ${beY(y)}</th><th class="num">ก่อนเปิดใช้</th><th class="num">หลังเปิดใช้</th><th class="num">ต่างกัน</th></tr></thead><tbody>
   ${row('ยอดขายก่อน VAT',z.b.base,z.a.base)}${row('ต้นทุนขาย',z.b.cogs,z.a.cogs)}${row('กำไรขั้นต้น',gb,ga)}${row('จำนวนเอกสารที่นับยอด',z.b.n,z.a.n,1)}</tbody></table>`;
 }
 function monthTable(p,y){
  const ms=p.months.filter(m=>m.ym.slice(0,4)===y);
  return `<table class="tbl pkg-sf-tbl" id="pkgSfMonths"><thead><tr><th>เดือน</th><th class="num">ยอดขายก่อน VAT · ก่อน</th><th class="num">หลังเปิดใช้</th><th class="num">กำไรขั้นต้น · ก่อน</th><th class="num">หลังเปิดใช้</th><th class="num">เอกสาร ก่อน → หลัง</th></tr></thead><tbody>
   ${ms.map(m=>{const ch=Math.abs(m.a.base-m.b.base)>0.005||m.a.n!==m.b.n;return `<tr${ch?' class="ch"':''}><td>${mLabel(m.ym)}</td><td class="num">${fm(m.b.base)}</td><td class="num"><b>${fm(m.a.base)}</b></td><td class="num">${fm(m.b.base-m.b.cogs)}</td><td class="num"><b>${fm(m.a.base-m.a.cogs)}</b></td><td class="num">${m.b.n} → ${m.a.n}</td></tr>`;}).join('')||'<tr><td colspan="6" class="ctr">ไม่มีเอกสารในปีนี้</td></tr>'}</tbody></table>`;
 }
 function arHtml(s){
  const a=s.ar;return `<div class="pkg-sf-ar"><div><span>ลูกหนี้ค้างรับ · ก่อนเปิดใช้</span><b>${fm(a.before)}</b><small>${a.nBefore} ใบ</small></div><div class="arr" aria-hidden="true">→</div>
   <div><span>หลังเปิดใช้</span><b>${fm(a.after)}</b><small>${a.nAfter} ใบ</small></div>
   <p>${Math.abs(a.after-a.before)<0.005?'ยอดค้างรับไม่เปลี่ยน':'ส่วนที่เพิ่ม: ภาษีหัก ณ ที่จ่ายที่ลูกค้ายังไม่ได้หักจริง '+fm(a.whtExp)+' บาท (ระบบใหม่จะหักเมื่อรับเงินและยืนยันยอดแล้วเท่านั้น)'+(a.newOpen>0.005?' · ใบตัดสต็อกเดิมที่ยังไม่ได้รับเงิน '+fm(a.newOpen)+' บาท':'')}</p></div>`;
 }
 function listsHtml(p){
  const ST={paid:'ชำระแล้ว',credit:'เงินเชื่อ',wait:'รอชำระ'};let h='';
  if(p.newly.length)h+=`<h3>ใบตัดสต็อกเดิมที่จะเริ่มนับเป็นยอดขาย (${p.newly.length} ใบ)</h3><table class="tbl pkg-sf-tbl" id="pkgSfNew"><thead><tr><th>เลขที่ใบตัดสต็อก</th><th>วันที่ขาย</th><th>ลูกค้า</th><th class="num">ยอดก่อน VAT</th><th class="num">ต้นทุน</th><th>สถานะหลังเปิดใช้</th></tr></thead><tbody>
   ${p.newly.slice(0,50).map(x=>`<tr><td class="mono" data-no-translate>${esc(x.no)}</td><td>${thDate(x.date)}</td><td data-no-translate>${esc(x.cust)}</td><td class="num">${fm(x.base)}</td><td class="num">${fm(x.cogs)}</td><td>${ST[x.state]||''}</td></tr>`).join('')}</tbody></table>${p.newly.length>50?'<p class="hint">แสดง 50 ใบแรก — รายการครบอยู่ในไฟล์ Excel</p>':''}`;
  if(p.review.length)h+=`<h3>รายการที่ต้องตรวจ (${p.review.length})</h3><ul class="pkg-sf-rev">${p.review.slice(0,30).map(x=>`<li data-no-translate>${esc(x.text)}</li>`).join('')}</ul>`;
  return h;
 }
 function render(){
  const b=body();if(!b)return;
  if(!maySee()){b.innerHTML='<p class="hint">บัญชีนี้ไม่มีสิทธิ์ดูหน้านี้</p>';return;}
  const f=S.flag()||{};let h=statusHtml()+HOW;
  if(S.on()){
   const s=f.report,bad=S.verify();
   h+=`<h3>ตรวจความถูกต้องของข้อมูล</h3>`+(bad.length?`<ul class="pkg-sf-rev bad">${bad.slice(0,20).map(x=>`<li data-no-translate>${esc(x)}</li>`).join('')}</ul>`:'<p class="pkg-sf-ok">ผ่าน — ใบตัดสต็อกทุกใบมีรายการบัญชี 1 รายการ และสถานะชำระตรงกับเงินที่รับ</p>');
   if(s&&s.cnt)h+=`<h3>สรุปตอนเปิดใช้</h3><p class="pkg-sf-line">ผูกใบเสร็จเดิมเข้ากับใบตัดสต็อก <b>${s.cnt.A}</b> ใบ · ใบตัดสต็อกเดิมที่เริ่มนับยอด <b>${s.newly}</b> ใบ · ย้ายเดือน <b>${s.moved}</b> ใบ · ยอดขายก่อน VAT ปี ${beY(s.year)} <b>${fm(s.yearBefore.base)}</b> → <b>${fm(s.yearAfter.base)}</b> บาท</p>`;
   /* owner 12 Oct: the tax invoice is manual only — this block is not offered (PKG_SALE.AUTO_TAX is false; the code stays) */
   if(S.AUTO_TAX)h+=`<h3>ใบกำกับภาษี</h3><label class="pkg-sf-tax"><input type="checkbox" id="pkgSfTax"${f.tax===true?' checked':''}${mayApply()?'':' disabled'}> <span><b>ออกใบกำกับภาษีพร้อมใบตัดสต็อก (ตอนของออก)</b><small>เมื่อเปิด: บันทึกใบตัดสต็อกที่มี VAT ให้ลูกค้าที่มีเลขผู้เสียภาษี ระบบออกใบกำกับภาษีให้ทันทีในวันที่ขาย · ทำฉบับแก้ไข = ยกเลิกใบเดิมแล้วออกใบใหม่ · ยกเลิกใบตัดสต็อก = ยกเลิกใบกำกับภาษีด้วย · ลูกค้าทั่วไป / ไม่มีเลขผู้เสียภาษี ยังออกเองที่ 4.6 เหมือนเดิม — ควรถามผู้ทำบัญชีก่อนเปิด</small></span></label>`;
   h+=`<div class="pkg-sf-acts">${S.canRevert()?'<button type="button" class="btn gh" data-sf="revert">ย้อนกลับไปใช้ระบบเดิม</button><span class="hint">ย้อนกลับได้จนกว่าจะมีเอกสารใหม่ในระบบขายแบบใหม่</span>':'<span class="hint">มีเอกสารในระบบขายแบบใหม่แล้ว — ถ้าต้องการกลับไปแบบเดิม ให้กู้คืนจากไฟล์สำรองที่บันทึกไว้ก่อนเปิดใช้ (เมนู 11.3)</span>'}</div>`;
   b.innerHTML=h;return;}
  const p=getPlan(),ys=yearsOf(p);if(!YEAR||!ys.includes(YEAR))YEAR=ys.includes(p.summary.year)?p.summary.year:(ys[ys.length-1]||p.summary.year);
  const total=p.ops.length;
  h+=`<h3>ถ้าเปิดใช้ จะเกิดอะไรกับเอกสารเดิม</h3>${tiles(p.cnt,p.summary)}
   <div class="pkg-sf-yr"><label class="f"><span>ดูตัวเลขของปี</span><select id="pkgSfYearSel">${ys.map(y=>`<option value="${y}"${y===YEAR?' selected':''}>${beY(y)}</option>`).join('')}</select></label>
    <span class="pkg-sf-chk ${p.check.ok?'ok':'bad'}">${p.check.ok?'ตรวจยอดรวมทุกปีแล้ว: ยอดเดิม + ใบตัดสต็อกที่เริ่มนับ = ยอดใหม่ ตรงกัน':'ยอดรวมก่อนและหลังไม่ลงตัว — อย่าเพิ่งเปิดใช้ แจ้งผู้ดูแลระบบ'}</span></div>
   ${yearTable(p,YEAR)}<p class="hint pkg-sf-note">ยอดต่างกันได้จาก 2 เรื่องเท่านั้น: ใบที่วันที่ขายกับวันที่ออกใบเสร็จอยู่คนละเดือน และใบตัดสต็อกเดิมที่ยังไม่เคยออกใบเสร็จ · ราคาและต้นทุนของแต่ละใบไม่ถูกแก้</p>
   <h3>รายเดือน ปี ${beY(YEAR)}</h3>${monthTable(p,YEAR)}
   <h3>ลูกหนี้ค้างรับ</h3>${arHtml(p.summary)}${listsHtml(p)}
   <div class="pkg-sf-acts"><button type="button" class="btn gh" data-sf="print">พิมพ์สรุป</button><button type="button" class="btn gh" data-sf="excel">ส่งออก Excel</button>
    <span class="sp"></span>${mayApply()?`<button type="button" class="btn grn" data-sf="apply"${p.check.ok?'':' disabled'}>เปิดใช้ระบบขายแบบใหม่</button>`:'<span class="hint">การเปิดใช้ต้องทำโดยเจ้าของกิจการ</span>'}</div>
   <p class="hint">กดเปิดใช้แล้วระบบจะสำรองข้อมูลให้ก่อน จากนั้นปรับเอกสารเดิม ${total} รายการ และย้อนกลับได้ตราบที่ยังไม่มีเอกสารใหม่</p>`;
  b.innerHTML=h;
 }
 /* ---------- print / Excel (the existing export helpers) ---------- */
 function tableData(p){
  const cols=[{l:'เดือน'},{l:'ยอดขายก่อน VAT (ก่อน)',num:1},{l:'ยอดขายก่อน VAT (หลัง)',num:1},{l:'ต้นทุนขาย (ก่อน)',num:1},{l:'ต้นทุนขาย (หลัง)',num:1},{l:'กำไรขั้นต้น (ก่อน)',num:1},{l:'กำไรขั้นต้น (หลัง)',num:1},{l:'เอกสาร (ก่อน)',num:1},{l:'เอกสาร (หลัง)',num:1}];
  const line=(t,b,a)=>[t,fm(b.base),fm(a.base),fm(b.cogs),fm(a.cogs),fm(b.base-b.cogs),fm(a.base-a.cogs),String(b.n),String(a.n)];
  const rows=p.months.map(m=>line(mLabel(m.ym),m.b,m.a));
  p.newly.forEach(x=>rows.push(['ใบตัดสต็อกที่เริ่มนับยอด '+x.no+' · '+thDate(x.date)+' · '+x.cust,'',fm(x.base),'',fm(x.cogs),'',fm(x.base-x.cogs),'','1']));
  return {title:'สรุปก่อน - หลัง เปิดใช้ระบบขายแบบใหม่',cols,rows,foot:[line('รวมทุกเดือน',p.summary.allBefore,p.summary.allAfter)],filters:[]};
 }
 function excel(){
  const X=window.PKG_REG_EXPORT;if(!X||!can('doc.export'))return toast('บัญชีนี้ไม่มีสิทธิส่งออกข้อมูล');
  const p=getPlan(),d=tableData(p);d.note='ส่งออกโดย '+meName()+' · '+thDate(iso())+' · ผูกใบเสร็จเดิม '+p.cnt.A+' ใบ · ใบตัดสต็อกที่เริ่มนับยอด '+p.newly.length+' ใบ · ย้ายเดือน '+p.moved.length+' ใบ';d.who=meName();
  X.save(d.title+' '+iso()+'.xlsx',X.xlsx(d));toast('ส่งออก Excel แล้ว');
 }
 function print(){
  const p=getPlan(),s=p.summary,z=sumYear(p,YEAR),c=p.cnt;
  const html=sheetTop({title:'สรุปก่อน / หลัง เปิดใช้ระบบขายแบบใหม่',en:'SALES FLOW CHANGE',copy:'รายงานภายใน',fields:[['วันที่พิมพ์',esc(thDate(iso()))],['ผู้พิมพ์',esc(meName())]]})
   +`<p style="margin:6px 0">ผูกใบเสร็จเดิมเข้ากับใบตัดสต็อก <b>${c.A}</b> ใบ · ใบตัดสต็อกเดิมที่ยังไม่มีใบเสร็จ (จะเริ่มนับยอด) <b>${c.B+c.C+c.D+c.E}</b> ใบ · ย้ายเดือน <b>${s.moved}</b> ใบ · ใบเสร็จเดิมที่คงไว้ <b>${c.G}</b> ใบ</p>
    <p style="margin:6px 0">ปี ${beY(YEAR)}: ยอดขายก่อน VAT ${fm(z.b.base)} → <b>${fm(z.a.base)}</b> บาท · กำไรขั้นต้น ${fm(z.b.base-z.b.cogs)} → <b>${fm(z.a.base-z.a.cogs)}</b> บาท · ลูกหนี้ค้างรับ ${fm(s.ar.before)} → <b>${fm(s.ar.after)}</b> บาท</p>
    <table class="pkg-rep"><thead><tr><th>เดือน</th><th>ยอดขายก่อน VAT · ก่อน</th><th>หลังเปิดใช้</th><th>กำไรขั้นต้น · ก่อน</th><th>หลังเปิดใช้</th><th>เอกสาร ก่อน → หลัง</th></tr></thead><tbody>
    ${p.months.filter(m=>m.ym.slice(0,4)===YEAR).map(m=>`<tr><td>${mLabel(m.ym)}</td><td class="num">${fm(m.b.base)}</td><td class="num">${fm(m.a.base)}</td><td class="num">${fm(m.b.base-m.b.cogs)}</td><td class="num">${fm(m.a.base-m.a.cogs)}</td><td class="num">${m.b.n} → ${m.a.n}</td></tr>`).join('')}</tbody></table></div>`;
  printDocs(html);
 }
 /* ---------- the switch ---------- */
 async function backup(){
  let ok=false;const json=JSON.stringify(DB);
  try{if(typeof STORE==='object'&&typeof KEY==='string'&&['host','idb'].includes(STORAGE_MODE)){await STORE.set(KEY+'.bak.before-saleflow',json);ok=true;}}catch(e){}
  try{const X=window.PKG_REG_EXPORT;if(X){X.save('drivego-backup-before-saleflow-'+iso()+'.json',new Blob([json],{type:'application/json'}));ok=true;}}catch(e){}
  return ok;
 }
 async function turnOn(){
  if(!mayApply())return toast('การเปิดใช้ระบบขายแบบใหม่ต้องทำโดยเจ้าของกิจการ');
  if(S.on())return;
  const p=getPlan();if(!p.check.ok)return toast('ยอดรวมก่อนและหลังไม่ลงตัว — ยังเปิดใช้ไม่ได้');
  if(!await askP({title:'เปิดใช้ระบบขายแบบใหม่',text:'ระบบจะปรับเอกสารเดิม '+p.ops.length+' รายการให้เข้ากับระบบขายแบบใหม่\nเลขที่เอกสาร ราคา และต้นทุนของแต่ละใบไม่เปลี่ยน\n\nอ่านสรุปก่อน / หลังในหน้านี้แล้วใช่หรือไม่?',yes:'อ่านแล้ว ดำเนินการต่อ',no:'ยังไม่เปิดใช้'}))return;
  if(!await askP({title:'ยืนยันเปิดใช้อีกครั้ง',text:'ระบบจะสำรองข้อมูลทั้งหมดก่อน (จุดสำรองในเครื่อง + ไฟล์สำรองดาวน์โหลดลงเครื่อง) แล้วจึงเปิดใช้\nเก็บไฟล์สำรองนั้นไว้ — ใช้กู้คืนได้ที่เมนู 11.3',yes:'สำรองข้อมูลและเปิดใช้',no:'ยกเลิก'}))return;
  if(!await backup()&&!await askP({title:'สำรองข้อมูลไม่สำเร็จ',text:'ระบบสำรองข้อมูลอัตโนมัติไม่ได้ในเครื่องนี้\nแนะนำให้ส่งออกไฟล์สำรองที่เมนู 11.3 ก่อน\n\nจะเปิดใช้ต่อโดยไม่มีไฟล์สำรองหรือไม่?',yes:'เปิดใช้ต่อ',no:'ยกเลิก'}))return;
  const res=S.apply(p);P=null;render();
  if(typeof saveFx==='function')saveFx('เปิดใช้ระบบขายแบบใหม่แล้ว',res.done+' รายการ');toast('เปิดใช้ระบบขายแบบใหม่แล้ว · ปรับเอกสารเดิม '+res.done+' รายการ');
 }
 async function turnOff(){
  if(!mayApply())return toast('การย้อนกลับต้องทำโดยเจ้าของกิจการ');
  if(!await askP({title:'ย้อนกลับไปใช้ระบบเดิม',text:'เอกสารทุกใบจะกลับเป็นเหมือนก่อนเปิดใช้ (วันที่ใบเสร็จ สถานะชำระ การหัก ณ ที่จ่าย)\nยืนยันหรือไม่?',yes:'ย้อนกลับ',no:'ไม่ย้อนกลับ'}))return;
  if(S.revert()){P=null;render();toast('กลับไปใช้ระบบขายแบบเดิมแล้ว');}
 }
 el.addEventListener('click',e=>{const a=e.target.closest('[data-sf]')?.dataset.sf;if(!a)return;
  if(a==='apply')return turnOn();if(a==='revert')return turnOff();if(a==='excel')return excel();if(a==='print')return print();});
 el.addEventListener('change',e=>{if(e.target.id==='pkgSfYearSel'){YEAR=e.target.value;render();}
  if(e.target.id==='pkgSfTax'){const ok=S.setTax(e.target.checked);if(ok)toast(e.target.checked?'เปิดแล้ว — ใบตัดสต็อกใหม่ที่มี VAT จะออกใบกำกับภาษีให้ทันที':'ปิดแล้ว — ใบกำกับภาษีออกเองที่ 4.6 เหมือนเดิม');render();}});
 PKG_UISET.addSub({key:'saleflow',label:'11.5 ระบบขายแบบใหม่',allowed:maySee,el,show:render});
 /* 11.4 (branch.js) adds its tab later than this file loads: keep 11.5 last in the list */
 {const tabs=document.getElementById('uisetTabs'),mine=tabs&&tabs.querySelector('[data-u="saleflow"]');
  if(mine)new MutationObserver(()=>{if(tabs.lastElementChild!==mine)tabs.append(mine);}).observe(tabs,{childList:true});}
 window.PKG_SALE_REPORT={render,plan:getPlan,turnOn,turnOff,backup,excel,print,tableData,el};
})();

/* ระบบขายแบบใหม่ · phase 7 — the daily report (08 → "รายงานประจำวัน", only while the switch is on) and the home card.
   Daily report of one day D, two parts that are deliberately separate:
   (1) ยอดขายของวัน — sales whose SALE day is D (total, cost, gross profit; cost / profit only with the cost right).
       A sale cancelled on a later day is no longer in its sale day; it is named in "ยกเลิกย้อนหลัง" on the day it was
       cancelled, so the change of the earlier day can be explained. Revisions of earlier days made on D are named too.
   (2) เงินที่รับของวัน — money whose RECEIVE day is D, by method, including money for sales of earlier days;
       withholding shown separately (it is not money); receivings of earlier days cancelled on D as minus lines.
   Home: "รอชำระ N ใบ · ฿x" (sales waiting / part-paid, not credit) → 4.2 with the ค้างชำระ filter; warning colour when
   any of them is older than today. */
(()=>{
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,tabs=document.getElementById('acctTabs');
 if(!S||!SC||!tabs||typeof acctGo!=='function')return;
 const $i=id=>document.getElementById(id),on=()=>S.on(),r2=v=>Math.round(n(v)*100)/100;
 const here=d=>!window.PKG_BRANCH||PKG_BRANCH.here(d);
 const custOf=id=>{const cu=id?findCust(id):null;return cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)';};
 const mayCost=()=>!curEmp()||!!can('stock.cost'),mayView=()=>!curEmp()||!!can('m.rcptDoc_view')||!!can('doc.fin');
 const PMT={cash:'เงินสด',trans:'เงินโอน',card:'บัตร',check:'เช็ค'};
 const costOf=c=>{const g=typeof pkgFifo==='object'&&pkgFifo.docCost?pkgFifo.docCost(c.moveRef):null;return g?n(g.cost):n(c.cost);};
 let DAY=iso();
 /* ---------- the numbers (pure) ---------- */
 /* DriveGo new system (task 3.5, R8-ข): a settlement recorded before 3.5 holds the whole settlement's methods on every bill it paid —
    count only the bill's share (the same mix of methods); payments recorded since hold their own share already (47.js) */
 function ownMethods(p){const ms=p.methods&&p.methods.length?p.methods:[{k:p.method||'other',amt:p.amt}],t=r2(ms.reduce((a,m)=>a+n(m.amt),0));
  if(n(p.payBills)>1&&t>0&&Math.abs(t-n(p.amt))>0.01){const f=n(p.amt)/t;return ms.map(m=>Object.assign({},m,{amt:r2(n(m.amt)*f),fee:r2(n(m.fee)*f)}));}
  return ms;}
 function daily(day){
  const sales=[],voids=[],revs=[],pays=[],payVoids=[],refunds=[],by={cash:0,trans:0,card:0,check:0,other:0};let fee=0,feeVat=0;
  SC.list().forEach(c=>{if(!c||!here(c))return;const L=S.led(c);if(!L)return;
   if(c.cancelled){if(String(c.cancelDate||'')===day&&c.date<day){const t=receiptTotals(L);voids.push({no:c.no,date:c.date,cust:custOf(c.custId),gross:t.gross,reason:c.cancelReason||''});}return;}
   if(c.superseded)return;
   if(c.revDate===day&&c.date<day)revs.push({no:c.no,date:c.date,gross:receiptTotals(L).gross});
   if(c.date===day){const t=receiptTotals(L),cost=costOf(c);sales.push({id:c.id,no:c.no,cust:custOf(c.custId),base:t.base,vat:t.vat,gross:t.gross,cost,profit:t.base-cost,state:S.state(c)});}});
  (DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale||!here(L))return;const c=S.saleOf(L);(L.payments||[]).forEach(p=>{if(!p)return;
   if(!p.cancelled&&p.date===day){const ms=ownMethods(p);let pf=0;ms.forEach(m=>{const k=by[m.k]!==undefined?m.k:'other';by[k]+=n(m.amt);if(m.k==='card'){fee+=n(m.fee);pf+=n(m.fee);}});feeVat+=feeVatOf(pf,L);
    pays.push({id:c?c.id:'',pay:p.id,reNo:p.reNo||'',sale:c?c.no:L.no,saleDate:L.date,earlier:L.date<day,cust:custOf(L.custId),method:(p.methods||[]).map(m=>PMT[m.k]||m.k).join(' + ')||PMT[p.method]||'ไม่ระบุวิธี',amt:n(p.amt),wht:n(p.wht&&p.wht.amt),by:String(p.by||'').replace(/^.*· /,'')});}
   else if(p.cancelled&&String(p.cancelDate||'')===day&&p.date<day&&n(p.amt)>0)payVoids.push({reNo:p.reNo||'',sale:c?c.no:L.no,date:p.date,amt:n(p.amt),reason:p.cancelReason||''});});});
  /* DriveGo new system (task 3.5): money paid back to customers by credit notes (57-credit-note.js) on the day it took effect */
  (DB.creditNotes||[]).forEach(x=>{if(!x||!here(x)||!x.money||!(n(x.money.refund)>0)||!(x.apv&&x.apv.status==='approved'))return;
   if(((x.apv&&x.apv.date)||x.date)===day)refunds.push({no:x.no,sale:x.saleNo,amt:n(x.money.refund),method:PMT[x.money.method]||x.money.method||''});});
  const sum=(a,k)=>r2(a.reduce((t,x)=>t+n(x[k]),0));
  return {day,sales,voids,revs,pays,payVoids,refunds,fee:r2(fee),feeVat:r2(feeVat),by:Object.fromEntries(Object.entries(by).map(([k,v])=>[k,r2(v)])),
   tot:{gross:sum(sales,'gross'),base:sum(sales,'base'),vat:sum(sales,'vat'),cost:sum(sales,'cost'),profit:sum(sales,'profit'),n:sales.length,money:sum(pays,'amt'),wht:sum(pays,'wht'),earlier:r2(pays.filter(x=>x.earlier).reduce((t,x)=>t+x.amt,0)),voidMoney:sum(payVoids,'amt')}};
 }
 /* ---------- the card fee charged to customers (accountant review 3.2, the owner's decision of 2026-10-28 to follow
    accountant B and the owner's answers of the same day): money the shop receives for its sale, so income with VAT in it —
    the fee includes the VAT (the customer swipes what the receipt says), at the rate of the sale (7/107 at 7%); before VAT
    it is other income (4030), the VAT is output VAT, all of it cash, on the day it was paid. Which document is its tax
    invoice waits for the accountant: the tax report adds it to the month's figures, not to the list of tax invoices. ---------- */
 const feeVatOf=(fee,L)=>{const rate=n(L&&L.vat);return fee>0&&rate>0?r2(fee*rate/(100+rate)):0;};
 function cardFees(inP){const o={gross:0,base:0,vat:0};
  (DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale||L.cancelled)return;
   (L.payments||[]).forEach(p=>{if(!p||p.cancelled||!inP(p.date))return;
    const fee=ownMethods(p).filter(m=>m.k==='card').reduce((t,m)=>t+n(m.fee),0);if(!(fee>0))return;
    const vat=feeVatOf(fee,L);o.gross+=fee;o.vat+=vat;o.base+=r2(fee-vat);});});
  o.gross=r2(o.gross);o.vat=r2(o.vat);o.base=r2(o.base);return o;}
 let lastFee=null;   /* the fee of the latest finance() call (a branch's report filters the data only while it runs) */
 if(typeof finance==='function'){const fin0=finance;window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
  const a=cardFees(d=>inYear(d,y)),c=cardFees(d=>+String(d||'').slice(0,4)<=y);lastFee={y,base:a.base};
  if(!a.gross&&!c.gross)return f;
  f.cardFee=a.base;f.vatSale+=a.vat;f.np+=a.base;f.npm=f.revenue?f.np/f.revenue*100:0;
  f.cash+=c.gross;f.assetsTotal+=c.gross;f.equity+=c.gross;
  f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;
  return f;};}
 if(typeof monthlyPnL==='function'){const mp0=monthlyPnL;
  window.monthlyPnL=function(){const out=mp0.apply(this,arguments);
   (out||[]).forEach(m=>{const a=cardFees(d=>String(d||'').slice(0,7)===m.key);if(a.base)m.np+=a.base;});return out;};}
 if(typeof trialBalance==='function'){const tb0=trialBalance;
  window.trialBalance=function(y){const out=tb0.apply(this,arguments),a=cardFees(d=>inYear(d,y)),code=(DB.map&&DB.map.revOther)||'4030';if(!a.base)return out;
   let r=out.find(z=>z.code===code);if(!r){r={code,name:accName(code),type:((DB.coa||[]).find(z=>z.code===code)||{}).type||'',debit:0,credit:0};out.push(r);}
   r.credit+=a.base;return out.sort((x,z)=>x.code.localeCompare(z.code));};}
 /* 08 งบการเงิน: a row of its own before the net profit */
 if(typeof renderFS==='function'){const fs0=renderFS;
  window.renderFS=function(){lastFee=null;const out=fs0.apply(this,arguments);
   try{const v=lastFee&&lastFee.y===acctY()?lastFee.base:0,tb=$i('plTbl')&&$i('plTbl').tBodies[0];
    const np=v&&tb&&[...tb.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim()==='กำไร (ขาดทุน) สุทธิก่อนภาษี');
    if(np){const tr=document.createElement('tr');tr.className='pkg-fs-fee';tr.innerHTML=`<td style="width:62%">${esc(((DB.map&&DB.map.revOther)||'4030')+' บวก รายได้อื่น (ค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า)')}</td><td class="num">${money(v)}</td>`;np.before(tr);}
    /* the cash flow (the whole business, as the balance sheet's cash): the fees are money received from customers */
    const cf=$i('cfTbl')&&$i('cfTbl').tBodies[0],g=cardFees(d=>inYear(d,acctY())).gross,
     inn=g&&cf&&[...cf.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim()==='เงินสดรับจากลูกค้า');
    if(inn&&inn.cells[1])inn.cells[1].textContent=money(n(String(inn.cells[1].textContent).replace(/,/g,''))+g);
   }catch(e){}
   return out;};}
 /* 08 รายงานภาษี: the month's taxable sales, output VAT and VAT to pay take the fees in, and a line says how much
    (renderTaxSaleRows runs inside renderTax, within a branch report's data; once per drawing of the summary) */
 if(typeof renderTaxSaleRows==='function'){const ts0=renderTaxSaleRows;
  window.renderTaxSaleRows=function(){const out=ts0.apply(this,arguments);
   try{const st=$i('taxSumTbl')&&$i('taxSumTbl').tBodies[0];if(!st||st.querySelector('.pkg-tax-fee'))return out;
    const mo=acctM(),a=cardFees(d=>String(d||'').slice(0,7)===mo);if(!a.vat)return out;
    const rows=[...st.rows],at=t=>rows.find(r=>r.cells[0]&&r.cells[0].textContent.trim()===t),num=c=>n(String(c.textContent).replace(/,/g,''));
    const sb=at('ยอดขายที่ต้องเสียภาษี (ก่อน VAT)'),sv=at('ภาษีขาย'),bv=at('ภาษีซื้อ');if(!sb||!sv||!bv)return out;
    sb.cells[1].textContent=money(num(sb.cells[1])+a.base);sv.cells[1].textContent=money(num(sv.cells[1])+a.vat);
    const pay=r2(num(sv.cells[1])-num(bv.cells[1])),row=rows[rows.indexOf(bv)+1];
    if(row){row.cells[0].innerHTML='<b>'+(pay>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30) ภายในวันที่ 15 ของเดือนถัดไป':'ภาษีซื้อมากกว่าภาษีขาย — ขอคืน / เครดิตยกไป')+'</b>';
     row.cells[1].innerHTML='<b>'+money(Math.abs(pay))+'</b>';}
    sv.insertAdjacentHTML('afterend',`<tr class="pkg-tax-fee"><td class="hint">รวมค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า ${money(a.gross)} บาท: ก่อน VAT ${money(a.base)} ภาษีขาย ${money(a.vat)} (เอกสารที่เป็นใบกำกับภาษีรอผู้ทำบัญชี)</td><td></td></tr>`);
   }catch(e){}
   return out;};}
 /* 00 หน้าแรก "สรุปภาษีประจำงวด" (a VAT-registered shop): the month's fees the same way, within the home's branches */
 if(typeof renderHome==='function'){const hm0=window.renderHome;
  window.renderHome=function(){const out=hm0.apply(this,arguments);
   try{const st=$i('taxTbl')&&$i('taxTbl').tBodies[0];if(!st||!isVatReg())return out;
    const mo=($i('finMonth')&&$i('finMonth').value)||iso().slice(0,7),R=window.PKG_BRANCH_REPORT,f=()=>cardFees(d=>String(d||'').slice(0,7)===mo);
    const a=R?R.run('home',f):f();if(!a.base&&!a.vat)return out;
    const rows=[...st.rows],at=t=>rows.find(r=>r.cells[0]&&r.cells[0].textContent.trim()===t),num=c=>n(String(c.textContent).replace(/[^0-9.\-]/g,''));
    const sb=at('ยอดขาย / รายได้ก่อน VAT'),sv=at('ภาษีขาย (VAT จากใบกำกับภาษีที่ออก)'),bv=at('ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)'),
     pay=at('ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)')||at('เครดิตภาษียกไปงวดถัดไป');if(!sb||!sv||!bv||!pay)return out;
    sb.cells[1].textContent=money(r2(num(sb.cells[1])+a.base));sv.cells[1].textContent=money(r2(num(sv.cells[1])+a.vat));
    const d=r2(num(sv.cells[1])-num(bv.cells[1]));
    pay.cells[0].innerHTML='<b>'+(d>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)':'เครดิตภาษียกไปงวดถัดไป')+'</b>';pay.cells[1].innerHTML='<b>'+money(Math.abs(d))+'</b>';
   }catch(e){}
   return out;};}
 /* sales still waiting for money (not credit): the home card = the 4.1 register with the status "รอชำระ / ชำระบางส่วน" (same N, same ฿) */
 function waiting(){
  const rows=SC.list().filter(c=>c&&!c.cancelled&&!c.superseded&&here(c)&&S.led(c)&&(typeof pkgOwnOk!=='function'||pkgOwnOk('rcptCut',c))).map(c=>({c,st:S.stat(c)})).filter(x=>x.st.k==='wait'||x.st.k==='part');
  const age=d=>Math.max(0,Math.round((new Date(iso()+'T00:00:00')-new Date(String(d)+'T00:00:00'))/864e5));
  return {n:rows.length,sum:r2(rows.reduce((a,x)=>a+x.st.rem,0)),old:rows.filter(x=>x.c.date<iso()).length,oldest:rows.reduce((a,x)=>Math.max(a,age(x.c.date)),0)};
 }
 /* ---------- 08 tab + pane ---------- */
 const btn=document.createElement('button');btn.type='button';btn.dataset.a='daily';btn.textContent='รายงานประจำวัน';
 const pane=document.createElement('div');pane.className='apane pkg-sf-daily';pane.id='a-daily';pane.style.display='none';
 {const last=[...document.querySelectorAll('.apane')].pop();if(last)last.after(pane);}
 function tab(){const want=on();if(want&&!btn.isConnected)tabs.prepend(btn);if(!want&&btn.isConnected){btn.remove();if(typeof acctPane!=='undefined'&&acctPane==='daily')acctGo('health');}}
 const fig=(k,v,cls)=>`<div${cls?' class="'+cls+'"':''}><span>${k}</span><b>${v}</b></div>`;
 function html(R){
  const cost=mayCost(),T=R.tot;
  const sales=R.sales.length?`<div class="scroll"><table class="tbl" id="sdSales"><thead><tr><th>ใบตัดสต็อก</th><th>ลูกค้า</th><th class="num">ยอดขายรวม</th><th class="num">ก่อน VAT</th>${cost?'<th class="num">ต้นทุน</th><th class="num">กำไรขั้นต้น</th>':''}<th class="ctr">สถานะ</th></tr></thead><tbody>
    ${R.sales.map(x=>`<tr data-id="${esc(x.id)}"><td class="mono"><span class="docno" data-dr="sale" data-no-translate>${esc(x.no)}</span></td><td data-no-translate>${esc(x.cust)}</td><td class="num">${money(x.gross)}</td><td class="num">${money(x.base)}</td>${cost?`<td class="num">${money(x.cost)}</td><td class="num">${money(x.profit)}</td>`:''}<td class="ctr">${(S.STATE[x.state]||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">ไม่มีใบตัดสต็อกในวันนี้</div>';
  const notes=(R.voids.length?`<div class="pkg-sf-dnote"><b>ยกเลิกย้อนหลัง</b> — ใบตัดสต็อกของวันก่อนที่ถูกยกเลิกในวันนี้ (ถอนออกจากยอดขายของวันที่ขายแล้ว)<ul>${R.voids.map(v=>`<li data-no-translate>${esc(v.no)} · ขายวันที่ ${thDate(v.date)} · ${esc(v.cust)} · ${money(v.gross)} บาท${v.reason?' — '+esc(v.reason):''}</li>`).join('')}</ul></div>`:'')
   +(R.revs.length?`<div class="pkg-sf-dnote"><b>ฉบับแก้ไข</b> — ใบตัดสต็อกของวันก่อนที่แก้ไขในวันนี้ (ยอดของวันที่ขายเปลี่ยนตาม)<ul>${R.revs.map(v=>`<li data-no-translate>${esc(v.no)} · ขายวันที่ ${thDate(v.date)} · ยอดใหม่ ${money(v.gross)} บาท</li>`).join('')}</ul></div>`:'');
  const pays=R.pays.length?`<div class="scroll"><table class="tbl" id="sdPays"><thead><tr><th>เลขที่ใบเสร็จ</th><th>ใบตัดสต็อก</th><th>ลูกค้า</th><th>วิธีชำระ</th><th class="num">จำนวนเงิน</th><th class="num">หัก ณ ที่จ่าย</th><th>ผู้รับเงิน</th></tr></thead><tbody>
    ${R.pays.map(x=>`<tr data-id="${esc(x.id)}" data-pay="${esc(x.pay)}"><td class="mono">${x.reNo?`<span class="docno" data-dr="rcpt" data-no-translate>${esc(x.reNo)}</span>`:'<span class="hint">ยังไม่ออกใบเสร็จ</span>'}</td><td class="mono" data-no-translate>${esc(x.sale)}${x.earlier?'<div class="hint">ขายวันที่ '+thDate(x.saleDate)+'</div>':''}</td><td data-no-translate>${esc(x.cust)}</td><td>${esc(x.method)}</td><td class="num">${money(x.amt)}</td><td class="num">${x.wht>0?money(x.wht):'-'}</td><td data-no-translate>${esc(x.by)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">ไม่มีการรับเงินในวันนี้</div>';
  const pv=R.payVoids.length?`<div class="pkg-sf-dnote"><b>ยกเลิกการรับชำระของวันก่อน</b> — หักออกจากเงินของวันนี้<ul>${R.payVoids.map(v=>`<li data-no-translate>${esc(v.reNo||'ยังไม่ออกใบเสร็จ')} · ${esc(v.sale)} · รับวันที่ ${thDate(v.date)} · −${money(v.amt)} บาท${v.reason?' — '+esc(v.reason):''}</li>`).join('')}</ul></div>`:'';
  return `<h3>1 · ยอดขายของวัน <small>นับตามวันที่ขาย (วันที่ของออก)</small></h3>
   <div class="pkg-sf-sum" id="sdSum1">${fig('ใบตัดสต็อก',T.n+' ใบ')}${fig('ยอดขายรวม',money(T.gross))}${fig('ก่อน VAT',money(T.base))}${cost?fig('ต้นทุนขาย',money(T.cost))+fig('กำไรขั้นต้น',money(T.profit),T.profit<0?'warn':''):''}</div>${sales}${notes}
   <h3>2 · เงินที่รับของวัน <small>นับตามวันที่รับเงิน — รวมเงินของใบตัดสต็อกวันก่อน</small></h3>
   <div class="pkg-sf-sum" id="sdSum2">${fig('รับเงินรวม',money(T.money))}${Object.keys(PMT).map(k=>fig(PMT[k],money(R.by[k]))).join('')}${R.by.other?fig('ไม่ระบุวิธี',money(R.by.other)):''}${fig('ของใบตัดสต็อกวันก่อน',money(T.earlier))}${T.voidMoney?fig('ยกเลิกของวันก่อน','−'+money(T.voidMoney),'warn'):''}${fig('เงินสุทธิของวัน',money(r2(T.money-T.voidMoney)))}</div>
   <p class="hint">ลูกค้าหัก ณ ที่จ่ายวันนี้ <b>${money(T.wht)}</b> บาท — ไม่ใช่เงินที่รับ จึงแสดงแยก</p>${R.fee>0?`<p class="hint">ค่าธรรมเนียมบัตรที่ลูกค้าจ่ายเพิ่มวันนี้ <b>${money(R.fee)}</b> บาท — รายได้อื่น รวมภาษีขาย <b>${money(R.feeVat)}</b> บาท (ไม่รวมในยอดบัตรข้างบน)</p>`:''}${pays}${pv}
   ${R.refunds.length?`<div class="pkg-sf-dnote"><b>คืนเงินลูกค้าตามใบลดหนี้</b> — จ่ายออกจากเงินของวันนี้<ul>${R.refunds.map(v=>`<li data-no-translate>${esc(v.no)} · ${esc(v.sale)} · −${money(v.amt)}${v.method?' ('+esc(v.method)+')':''}</li>`).join('')}</ul></div>`:''}`;
 }
 function render(){
  if(!on()){pane.innerHTML='';return;}
  if(!mayView()){pane.innerHTML='<p class="hint">บัญชีนี้ไม่มีสิทธิ์ดูหน้านี้</p>';return;}
  const R=daily(DAY);
  pane.innerHTML=`<div class="panel"><header><h2>รายงานประจำวัน</h2><div class="spacer"></div></header><div class="body">
   <div class="pkg-sf-bar"><label class="f"><span>วันที่</span><input type="date" id="sdDay" value="${esc(DAY)}" max="${iso()}"></label><button type="button" class="btn gh" data-dr="prev">วันก่อนหน้า</button><button type="button" class="btn gh" data-dr="today">วันนี้</button><span class="sp"></span><button type="button" class="btn pkg-sa-teal" data-dr="print">พิมพ์รายงาน</button></div>
   ${html(R)}</div></div>`;
 }
 function print(){
  const R=daily(DAY);if(typeof pkgPermNeed==='function'&&curEmp()&&!can('m.rcptDoc_print')&&!can('doc.fin'))return toast('บัญชีนี้ไม่มีสิทธิ์พิมพ์เอกสารนี้');
  logAudit('receipt',{id:'',no:'รายงานประจำวัน '+thDate(DAY)},'print','พิมพ์รายงานประจำวัน');save();
  printDocs(sheetTop({title:'รายงานประจำวัน',en:'DAILY REPORT',copy:'รายงานภายใน',fields:[['ประจำวันที่',thDate(DAY)],['วันที่พิมพ์',thDate(iso())],['ผู้พิมพ์',esc(meName())]]})+'<div class="pkg-sf-dprint">'+html(R)+'</div></div>');
 }
 pane.addEventListener('change',e=>{if(e.target.id==='sdDay'){DAY=e.target.value&&e.target.value<=iso()?e.target.value:iso();render();}});
 pane.addEventListener('click',e=>{const b=e.target.closest('[data-dr]');if(!b)return;const a=b.dataset.dr,tr=b.closest('tr');
  if(a==='today'){DAY=iso();return render();}
  if(a==='prev'){const d=new Date(DAY+'T00:00:00');d.setDate(d.getDate()-1);DAY=iso(d);return render();}
  if(a==='print')return print();
  if(a==='sale'&&tr)return window.pkgOpenCut(tr.dataset.id);
  if(a==='rcpt'&&tr&&window.PKG_SALE_DOCS)return PKG_SALE_DOCS.openReceipt(tr.dataset.id,tr.dataset.pay);});
 const go0=acctGo;acctGo=function(a){tab();if(a==='daily'&&!on())a='health';const r=go0.apply(this,arguments.length?[a]:arguments);if(a==='daily')render();return r;};
 /* The original card "ลูกหนี้เกินกำหนดชำระ" counts every unpaid receipt record past its date — while the flow is on that
    would show the cash cuts that wait for money a second time (they are the "รอชำระ (ใบตัดสต็อก)" card). So while on it
    counts CREDIT bills past their due date only (and old-system receipts, as before). Same markup, same button. */
 function overdueCard(){
  const box=$i('overdueAlert');if(!box||!on()||!box.innerHTML.trim()||typeof renderArTable!=='function')return;   /* (empty = the account may not see it) */
  const cash=r=>!!(r&&r.pkgSale&&!(r.pay&&r.pay.credit)),over=renderArTable().filter(x=>x.over>0&&!cash(x.r));
  box.innerHTML=over.length?`<div class="card red"><div class="k">⚠ ลูกหนี้เกินกำหนดชำระ</div>
     <div class="v" style="color:var(--danger)">${over.length}<span style="font-size:13px;font-weight:500"> ราย</span></div>
     <div class="s">รวมค้าง <b>${money(over.reduce((a,x)=>a+x.amt,0))}</b> บาท · นานสุด ${Math.max(...over.map(x=>x.over))} วัน</div>
     <button class="btn sm dgr cbtn" onclick="openArReport()">ดูรายงานลูกหนี้</button></div>`
   :`<div class="card green"><div class="k">⚠ ลูกหนี้เกินกำหนดชำระ</div><div class="v">0</div><div class="s">✓ ไม่มีลูกหนี้เกินกำหนด</div></div>`;
  const bh=$i('bdgHome');if(bh){bh.style.display=over.length?'inline':'none';bh.textContent=over.length;}
  const ho=$i('hArOver');if(ho&&typeof money0==='function')ho.textContent=money0(over.reduce((a,x)=>a+x.amt,0));
 }
 /* ---------- home card ---------- */
 function homeCard(){
  const host=$i('overdueAlert');if(!host)return;let el=$i('pkgSfHome');
  if(!on()){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.id='pkgSfHome';host.after(el);}
  const w=waiting(),seeAmt=!curEmp()||can('doc.homeMoney');   /* DriveGo new system (task 3.9, finding 42): the amount needs "ดูยอดเงินและมูลค่าในหน้าแรก" */
  el.innerHTML=w.n?`<div class="card ${w.old?'red':'green'}"><div class="k">รอชำระ (ใบตัดสต็อก)</div><div class="v"${w.old?' style="color:var(--danger)"':''}>${w.n}<span style="font-size:13px;font-weight:500"> ใบ</span></div>
    <div class="s">${seeAmt?'รวม <b>฿'+money(w.sum)+'</b> · ':''}${w.old?'ค้างข้ามวัน '+w.old+' ใบ · นานสุด '+w.oldest+' วัน':'ของวันนี้ทั้งหมด'}</div><button type="button" class="btn sm gh cbtn" data-sfhome="1">ดูใบตัดสต็อกที่รอชำระ</button></div>`
   :`<div class="card green"><div class="k">รอชำระ (ใบตัดสต็อก)</div><div class="v">0</div><div class="s">ไม่มีใบตัดสต็อกที่รอชำระ</div></div>`;
 }
 document.addEventListener('click',e=>{if(!e.target.closest||!e.target.closest('[data-sfhome]'))return;return showCuts('due');});
 /* the 4.1 register showing exactly what the card counted: status "รอชำระ / ชำระบางส่วน", every other filter cleared, the working branch */
 function showCuts(st){
  const e=$i('scutState'),q=$i('scutSearch'),m=$i('scutDateMode'),ch=$i('scutChannel'),F=window.PKG_REG_FILTER,B=window.PKG_BRANCH;
  go('receipt');rOvGo('retail');                                    /* (draws once: the status list of the new flow is put in by that draw) */
  if(q)q.value='';if(ch)ch.value='';if(m&&m.value){m.value='';m.dispatchEvent(new Event('change',{bubbles:true}));}
  if(F){try{F.clear('scutTbl');if(B&&B.accessible().length>1){F.state('scutTbl').br=[B.ctx()];F.build('scutTbl');}}catch(err){}}
  if(e)e.value=st||'';if(typeof LIM_PAGE==='object')LIM_PAGE.scut=1;
  if(typeof window.pkgRenderCuts==='function')window.pkgRenderCuts();
 }
 if(typeof renderHome==='function'){const h0=renderHome;renderHome=function(){const r=h0.apply(this,arguments);try{tab();homeCard();overdueCard();}catch(e){}return r;};}
 tab();
 Object.assign(window.PKG_SALE_REPORT||(window.PKG_SALE_REPORT={}),{daily,waiting,renderDaily:render,printDaily:print,homeCard,overdueCard,showCuts,dailyTab:tab,setDay:d=>{DAY=d;render();}});
})();
