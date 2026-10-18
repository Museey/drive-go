/* Permission matrix UI and enforcement (copy only). Definitions live in perm-core.js (injected into the program).
   Every guard here re-checks at the function itself, so hiding a button is never the only protection. */
(()=>{
 const ACT=Object.fromEntries(PERM_ACTS),ROW=Object.fromEntries(PERM_M.map(r=>[r.k,r]));
 const owner=()=>!curEmp();
 const allowed=(row,act)=>owner()||can('m.'+row+'_'+act);
 window.pkgPermNeed=(row,act)=>{if(allowed(row,act))return true;toast('บัญชีนี้ไม่มีสิทธิ์ “'+ACT[act]+'” ใน '+(ROW[row]?.l||row));return false;};
 window.pkgOwnOk=(row,d)=>owner()||!can('m.'+row+'_own')||!!(d&&d.createdBy&&d.createdBy===DB.curEmp);
 const rcptRow=r=>r&&r.salesChannel==='retail'?'rcptRetail':'rcptDoc';
 const wrap=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){return fn.call(this,o,a);};};

 /* ---------- ระยะเวลาที่พนักงานยกเลิกเอกสารได้ — ตั้งแยกรายคนในสิทธิ์ของพนักงาน (ผู้ใช้ 11 ต.ค. 2569) ----------
    emp.cancelWindow = 'any' | 'day' | 'month'. An employee without the field uses the value the shop had before
    (DB.shop.cancelWindow, default 'any') — that shop value is now only this fallback. The owner can always cancel. */
 const WINDOWS={any:'ยกเลิกได้ตลอดเวลา',day:'ยกเลิกได้เฉพาะวันเดียวกับวันที่เอกสาร',month:'ยกเลิกได้ไม่เกินสิ้นเดือนของเดือนที่เอกสาร'};
 const WIN_SHORT={any:'ตลอดเวลา',day:'วันเดียวกัน',month:'ถึงสิ้นเดือน'};
 const WIN_SCOPE='ใช้กับใบเสนอราคา ใบเสร็จ/ใบแจ้งหนี้ ใบวางบิล ใบตัดสต็อก ใบรับสินค้า ใบเคลม ใบเบิก ใบตรวจนับ ใบโอนสินค้าระหว่างสาขา และใบรับเคลมสินค้าจากลูกค้า ที่พนักงานคนนี้มีสิทธิ์ยกเลิก';
 const windowMode=()=>WINDOWS[DB.shop&&DB.shop.cancelWindow]?DB.shop.cancelWindow:'any';
 const empWindow=e=>e&&WINDOWS[e.cancelWindow]?e.cancelWindow:windowMode();
 const hasCancel=m=>!!m&&PERM_M.some(r=>Array.isArray(r.cancel)&&m[r.k+'_cancel']);
 function inWindow(d){
  const me=curEmp();if(!me||!d)return true;const mode=empWindow(me),date=String(d.date||'');
  if(mode==='day'&&date!==iso()){toast('เกินระยะเวลายกเลิกที่กำหนดในสิทธิ์ของคุณ ('+WINDOWS.day+') — ติดต่อเจ้าของร้าน');return false;}
  if(mode==='month'&&date.slice(0,7)!==iso().slice(0,7)){toast('เกินระยะเวลายกเลิกที่กำหนดในสิทธิ์ของคุณ ('+WINDOWS.month+') — ติดต่อเจ้าของร้าน');return false;}
  return true;
 }
 window.pkgCancelWindowOk=inWindow;window.pkgCancelWindowOf=empWindow;

 /* ---------- เพิ่ม / แก้ไข: ตรวจที่ฟังก์ชันบันทึก ---------- */
 const saves=[
  ['saveQuote',()=>['quote',DB.quotes.find(x=>x.id===Q.id),()=>JSON.stringify(cleanQuote(Q))]],
  ['saveReceipt',()=>[rcptRow(R),DB.receipts.find(x=>x.id===R.id)]],
  ['saveInvoiceDoc',()=>['rcptDoc',DB.invoices.find(x=>x.id===IV.id)]],
  ['saveBilling',()=>['rcptBilling',DB.billings.find(x=>x.id===BN.id)]],
  ['saveClaim',()=>['stkClaim',DB.claims.find(x=>x.id===C.id)]],
  ['saveIssue',()=>['stkIssue',DB.issues.find(x=>x.id===IS.id)]],
  ['saveCount',()=>['stkCount',DB.stockCounts.find(x=>x.id===SC.id)]],
  ['saveStock',()=>['stkStock',editStockId]],
  ['saveCust',()=>['custList',editCustId]],
  ['saveVen',()=>['vendor',editVenId]],
  ['saveCrm',()=>['crm',editCrmId]]
 ];
 saves.forEach(([name,info])=>wrap(name,function(orig,args){
  let row,existing,snap;try{[row,existing,snap]=info();}catch(e){return orig.apply(this,args);}
  const act=existing?'edit':'add';
  if(!allowed(row,act)){
   /* Viewers may still trigger an unchanged save (e.g. print saves first): nothing to write, so no error. */
   if(existing&&snap&&typeof existing==='object'&&snap()===JSON.stringify(existing))return;
   return pkgPermNeed(row,act);
  }
  return orig.apply(this,args);
 }));

 /* ---------- ยกเลิก / ลบ + ระยะเวลายกเลิก ---------- */
 const cancels=[
  ['cancelQuoteDoc',()=>['quote',typeof Q!=='undefined'&&Q?DB.quotes.find(x=>x.id===Q.id):null]],
  ['cancelReceiptDoc',id=>{const r=DB.receipts.find(x=>x.id===id);return[rcptRow(r),r];}],
  ['cancelInvoiceDoc',id=>['rcptDoc',DB.invoices.find(x=>x.id===id)]],
  ['delInvoiceDoc',id=>['rcptDoc',DB.invoices.find(x=>x.id===id)]],
  ['cancelBilling',id=>['rcptBilling',DB.billings.find(x=>x.id===id)]],
  ['cancelGR',id=>['buyGr',DB.purchases.find(x=>x.id===id)]],
  ['cancelClaim',id=>['stkClaim',DB.claims.find(x=>x.id===id)]],
  ['cancelIssue',id=>['stkIssue',DB.issues.find(x=>x.id===id)]],
  ['cancelCount',id=>['stkCount',DB.stockCounts.find(x=>x.id===id)]],
  ['delStock',()=>['stkStock',null]],['delCust',()=>['custList',null]],['delVen',()=>['vendor',null]]
 ];
 cancels.forEach(([name,info])=>wrap(name,function(orig,args){
  const [row,doc]=info(...args);
  if(!pkgPermNeed(row,'cancel'))return;
  if(ROW[row]?.doc&&doc&&!doc.cancelled&&!inWindow(doc))return;
  return orig.apply(this,args);
 }));

 /* ---------- พิมพ์ / ส่งออก ---------- */
 const DL={quote:'quote',receipt:'rcptDoc',billing:'rcptBilling',tax:'rcptTax',gr:'buyGr',claim:'stkClaim',issue:'stkIssue',count:'stkCount'};
 [['printQuote',()=>'quote'],['printReceipt',()=>rcptRow(R)],['printReceiptTax',()=>rcptRow(R)],['printTaxDoc',()=>'rcptTax'],
  ['printInvoiceDoc',()=>'rcptDoc'],['printBilling',()=>'rcptBilling'],['printGR',()=>'buyGr'],['printClaim',()=>'stkClaim'],
  ['printIssue',()=>'stkIssue'],['printCount',()=>'stkCount'],['printCustList',()=>'custList'],['printStockRep',()=>'stkStock'],
  ['printCatSummary',()=>'stkStock'],['printDocList',()=>DL[DOCL&&DOCL.kind]]
 ].forEach(([name,row])=>wrap(name,function(orig,args){const r=row();if(r&&!pkgPermNeed(r,'print'))return;return orig.apply(this,args);}));

 /* ---------- เฉพาะเอกสารของตนเอง ---------- */
 wrap('dlRows',function(orig,args){
  const rows=orig.apply(this,args),kind=args[0];
  if(kind==='quote')return rows.filter(x=>pkgOwnOk('quote',x.d));
  if(kind==='receipt')return rows.filter(x=>pkgOwnOk(rcptRow(x.d),x.d));
  return rows;
 });
 wrap('docRowsAll',function(orig,args){return orig.apply(this,args).filter(x=>pkgOwnOk(x.kind==='inv'?'rcptDoc':rcptRow(x.obj),x.obj));});
 [['openQuoteById',id=>['quote',DB.quotes.find(x=>x.id===id)]],['openReceiptById',id=>{const r=DB.receipts.find(x=>x.id===id);return[rcptRow(r),r];}],
  ['openInvoiceById',id=>['rcptDoc',DB.invoices.find(x=>x.id===id)]]
 ].forEach(([name,info])=>wrap(name,function(orig,args){const [row,d]=info(...args);if(d&&!pkgOwnOk(row,d))return toast('บัญชีนี้เปิดได้เฉพาะเอกสารที่ตนเองสร้าง');return orig.apply(this,args);}));

 /* ---------- ซ่อนปุ่มสร้าง และยอดเงินหน้าแรก ---------- */
 /* Buttons are matched by the start of their onclick text (function calls that create a new record). */
 const CREATE={quote:['newQuote(','copyQuote('],rcptDoc:['newReceipt(','newInvoiceDoc(','billFromQuote('],rcptRetail:['newRetailReceipt('],rcptBilling:['newBilling('],
  buyGr:['newGR(','copyGR('],stkClaim:['newClaim('],stkIssue:['newIssue('],stkCount:['newCount('],stkStock:['openStock()'],custList:['openCust()'],vendor:['openVen()'],crm:['openCrm()']};
 const creates=row=>[...document.querySelectorAll('[onclick]')].filter(b=>{const on=b.getAttribute('onclick').replace(/^mSheet\('[^']*'\);|^closeModal\('[^']*'\);/,'');return CREATE[row].some(c=>on.startsWith(c));});
 function homeMoney(){
  const show=owner()||can('doc.homeMoney'),home=document.getElementById('v-home');if(!home)return;
  const hide=[document.getElementById('overdueAlert'),document.getElementById('hPendAmt'),document.getElementById('chartCat')?.closest('.panel'),document.getElementById('revLineChart')?.closest('.panel')];
  let on=false;[...home.children].forEach(el=>{if(el.classList.contains('secthead'))on=/ส่วนที่ [23]/.test(el.textContent);if(on)hide.push(el);});
  hide.filter(Boolean).forEach(el=>el.classList.toggle('pkg-perm-hidden',!show));
 }
 function applyUi(){
  Object.keys(CREATE).forEach(row=>creates(row).forEach(b=>b.classList.toggle('pkg-perm-hidden',!allowed(row,'add'))));
  homeMoney();
  const sel=document.getElementById('pkg-cancel-window');if(sel){sel.value=windowMode();sel.disabled=!owner();}
 }
 wrap('applyPerms',function(orig,args){const out=orig.apply(this,args);applyUi();return out;});
 wrap('pkgRetailOverview',function(orig,args){const out=orig.apply(this,args);applyUi();return out;});

 /* ---------- ตารางสิทธิ์ในฟอร์มพนักงาน ---------- */
 const owned=pkgPermOwned();
 const box=document.createElement('div');box.className='permbox pkg-perm-matrix';box.id='pkg-perm-matrix';
 document.getElementById('permTabs').closest('.permbox').before(box);
 function matrix(){
  const e=editEmpId?DB.emp.find(x=>x.id===editEmpId):null,p=(e&&e.perms)||blankPerms(false),m=p.m||pkgPermFromLegacy(p);
  box.innerHTML=`<h4>ตารางสิทธิ์รายหน้า — ติ๊กว่าแต่ละหน้าให้ทำอะไรได้บ้าง (ไม่ติ๊ก “เข้าดู” = ไม่เห็นหน้านั้น)</h4>
  <div class="scroll"><table class="tbl pkg-perm-table"><thead><tr><th>หน้า / เมนู</th>${PERM_ACTS.map(([a,l])=>`<th class="ctr"><button type="button" class="pkg-perm-col" data-a="${a}" title="ติ๊ก/เอาออกทั้งคอลัมน์">${l}</button></th>`).join('')}</tr></thead><tbody>${
   PERM_M.map(r=>`<tr data-row="${r.k}"><th><button type="button" class="pkg-perm-rowbtn" title="ติ๊ก/เอาออกทั้งแถว">${esc(r.l)}</button></th>${PERM_ACTS.map(([a])=>a==='view'||Array.isArray(r[a])
    ?`<td class="ctr"><input type="checkbox" class="pk" data-g="m" data-k="${r.k}_${a}" aria-label="${esc(r.l)} · ${ACT[a]}" ${m[r.k+'_'+a]?'checked':''}></td>`:'<td class="ctr hint">—</td>').join('')}</tr>`).join('')}</tbody></table></div>
  <div class="pkg-cancel-win" id="pkg-emp-cancel"><label class="f"><span>ระยะเวลาที่ยกเลิกเอกสารได้</span><select id="pkg-emp-cancel-window">${Object.entries(WINDOWS).map(([k,l])=>`<option value="${k}"${k===empWindow(e)?' selected':''}>${l}</option>`).join('')}</select></label><span class="hint" id="pkg-emp-cancel-note"></span></div>
  <p class="hint">“เฉพาะของตนเอง” = เห็น/เปิดได้เฉพาะเอกสารที่พนักงานคนนั้นสร้าง · “ยกเลิก” ของพนักงานคนนี้อยู่ภายใต้ “ระยะเวลาที่ยกเลิกเอกสารได้” ที่ตั้งไว้ตรงนี้ (ตั้งแยกรายคน) · เจ้าของร้านยกเลิกได้เสมอ</p>`;
  sync();
 }
 function sync(){
  box.querySelectorAll('tbody tr').forEach(tr=>{const v=tr.querySelector('[data-k$="_view"]');tr.querySelectorAll('.pk:not([data-k$="_view"])').forEach(c=>{c.disabled=!v.checked;if(!v.checked)c.checked=false;});});
  /* the cancel period only means something while at least one “ยกเลิก” right is ticked; only an account that may edit staff rights changes it */
  const sel=box.querySelector('#pkg-emp-cancel-window'),note=box.querySelector('#pkg-emp-cancel-note');if(!sel)return;
  const on=[...box.querySelectorAll('.pk[data-k$="_cancel"]')].some(c=>c.checked);
  sel.disabled=!on||!(owner()||can('doc.emp'));sel.closest('.pkg-cancel-win').classList.toggle('off',!on);
  if(note)note.textContent=on?WIN_SCOPE:'ยังไม่ได้ให้สิทธิ์ยกเลิก';
 }
 box.addEventListener('change',e=>{if(e.target.classList.contains('pk'))sync();});
 box.addEventListener('click',e=>{
  const rb=e.target.closest('.pkg-perm-rowbtn'),cb=e.target.closest('.pkg-perm-col');
  if(rb){const tr=rb.closest('tr'),boxes=[...tr.querySelectorAll('.pk')].filter(c=>!c.dataset.k.endsWith('_own')),on=!boxes.every(c=>c.checked);boxes.forEach(c=>c.checked=on);sync();}
  if(cb){const a=cb.dataset.a,boxes=[...box.querySelectorAll(`.pk[data-k$="_${a}"]`)],on=!boxes.filter(c=>!c.disabled||a==='view').every(c=>c.checked);boxes.forEach(c=>{if(a==='view'||!c.disabled)c.checked=on;});sync();}
 });
 wrap('permBoxes',function(orig,args){
  const out=orig.apply(this,args);matrix();
  /* Old boxes keep only what the matrix does not cover (sensitive rights, stock fields). */
  document.querySelectorAll('#permTabs,#permSub,#permApv').forEach(el=>el.closest('.permbox').classList.add('pkg-perm-hidden'));
  document.querySelectorAll('#permDoc .pk,#permStock .pk').forEach(c=>c.closest('label').classList.toggle('pkg-perm-hidden',owned.has(c.dataset.g+'.'+c.dataset.k)));
  const h=document.querySelector('#permDoc')?.closest('.permbox')?.querySelector('h4');if(h)h.textContent='สิทธิ์พิเศษ / ข้อมูลอ่อนไหว — รับ-จ่ายเงิน แก้ราคา ดูยอดเงิน ส่งออก นำเข้า ล้างข้อมูล และตั้งค่า';
  return out;
 });
 wrap('permPreset',function(orig,args){const out=orig.apply(this,args);sync();return out;});
 /* The form builds a new employee record on every save, so the cancel period is put back on the saved record here
    (same gate as the rest of the form: saveEmp refuses without the right to edit staff). A greyed control (no “ยกเลิก”
    right) keeps whatever the person had. A change is written to the audit trail as before → after. */
 wrap('saveEmp',function(orig,args){
  const sel=document.getElementById('pkg-emp-cancel-window'),id=editEmpId,old=id?DB.emp.find(x=>x.id===id):null,ids=new Set(DB.emp.map(x=>x.id));
  const pick=sel&&!sel.disabled&&WINDOWS[sel.value]?sel.value:null,was=old?empWindow(old):windowMode(),kept=old&&WINDOWS[old.cancelWindow]?old.cancelWindow:null;
  const out=orig.apply(this,args);
  const rec=id?DB.emp.find(x=>x.id===id):DB.emp.find(x=>!ids.has(x.id));
  if(rec&&rec!==old){
   const v=pick||kept;
   if(v){rec.cancelWindow=v;
    if(v!==was)logAudit('emp',{id:rec.id,no:rec.code},'save','ระยะเวลาที่ยกเลิกเอกสารได้ของ '+rec.name+' · '+WINDOWS[was]+' → '+WINDOWS[v]);
    save();}
  }
  return out;
 });

 /* ---------- ตั้งค่าระยะเวลายกเลิก (เจ้าของเท่านั้น) + สรุปสิทธิ์ทุกคน ---------- */
 const panel=document.createElement('div');panel.className='panel';panel.id='pkg-cancel-panel';
 panel.innerHTML=`<header><h2>กติกาการยกเลิกเอกสารของพนักงาน</h2></header><div class="body" style="padding:12px">
  <label class="f" style="max-width:420px"><span>พนักงานที่มีสิทธิ์ “ยกเลิก” ยกเลิกเอกสารได้</span><select id="pkg-cancel-window">${Object.entries(WINDOWS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
  <p class="hint">ใช้กับใบเสนอราคา ใบเสร็จ/ใบแจ้งหนี้ ใบวางบิล ขายหน้าร้าน ใบรับสินค้า ใบเคลม ใบเบิก และใบตรวจนับ · เจ้าของร้านยกเลิกได้เสมอ (ระบบบันทึกผู้ยกเลิกและเหตุผล) · เปลี่ยนได้เฉพาะเจ้าของร้าน</p></div>`;
 document.getElementById('empBlock').before(panel);
 /* 11 ต.ค. 2569: the period moved into each employee's rights (mEmp, under the matrix). The shop-wide panel is kept
    in the page but hidden; DB.shop.cancelWindow stays only as the fallback for employees not edited since. */
 panel.classList.add('pkg-perm-hidden');panel.hidden=true;
 document.getElementById('pkg-cancel-window').onchange=e=>{
  if(!owner()){e.target.value=windowMode();return toast('เฉพาะเจ้าของร้านเท่านั้นที่เปลี่ยนกติกานี้ได้');}
  const before=windowMode();DB.shop.cancelWindow=e.target.value;logAudit('emp',{id:'cancelWindow',no:'กติกายกเลิกเอกสาร'},'save',WINDOWS[before]+' → '+WINDOWS[e.target.value]);save();toast('บันทึกกติกาการยกเลิกเอกสารแล้ว');
 };
 const sum=document.createElement('button');sum.type='button';sum.className='btn gh';sum.textContent='สรุปสิทธิ์ทุกคน';
 document.querySelector('#empBlock .panel header .spacer')?.after(sum);
 const dlg=document.createElement('div');dlg.className='modal';dlg.id='mPermSummary';
 dlg.innerHTML='<div class="sheet wide"><header><h2>สรุปสิทธิ์การใช้งานทุกคน</h2><div class="spacer"></div><button class="btn gh" type="button" onclick="closeModal(\'mPermSummary\')">ปิด</button></header><div class="body" id="pkg-perm-summary" style="padding:12px"></div></div>';
 document.getElementById('pkg-app').append(dlg);
 sum.onclick=()=>{
  const emps=DB.emp.filter(e=>e.active!==false),short={view:'ด',add:'พ',edit:'ก',apv:'อ',cancel:'ย',print:'ส',export:'อก',own:'ต'};
  document.getElementById('pkg-perm-summary').innerHTML=`<p class="hint">ด = เข้าดู · พ = เพิ่ม · ก = แก้ไข · อ = อนุมัติ · ย = ยกเลิก/ลบ · ส = พิมพ์/ส่งออก · ต = เฉพาะของตนเอง · เจ้าของร้านมีสิทธิ์ทั้งหมด · แถวแรก = ระยะเวลาที่แต่ละคนยกเลิกเอกสารได้ (— = ยังไม่ได้ให้สิทธิ์ยกเลิก)</p>
  <div class="scroll"><table class="tbl pkg-perm-table"><thead><tr><th>หน้า / เมนู</th>${emps.map(e=>`<th class="ctr">${esc(e.code)}<br><span class="hint">${esc(e.name)}</span></th>`).join('')}</tr></thead><tbody>
   <tr class="pkg-sum-cancel"><th>ระยะเวลาที่ยกเลิกเอกสารได้</th>${emps.map(e=>`<td class="ctr">${hasCancel(e.perms&&e.perms.m)?WIN_SHORT[empWindow(e)]:'<span class="hint">—</span>'}</td>`).join('')}</tr>${
   PERM_M.map(r=>`<tr><th>${esc(r.l)}</th>${emps.map(e=>{const m=(e.perms&&e.perms.m)||{};const got=PERM_ACTS.filter(([a])=>m[r.k+'_'+a]).map(([a])=>short[a]).join(' ');return `<td class="ctr">${got||'<span class="hint">—</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
  openModal('mPermSummary');
 };
 try{applyUi();}catch(e){}
})();
