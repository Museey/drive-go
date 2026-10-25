/* 4.3 ใบกำกับภาษี — a create window like 4.2 ใบวางบิล (user 2026-10-09, mockups/tax-invoice-window.html, mode 1:
   ONE source document per tax invoice, as before). Tax invoices come from two places:
   · งานซ่อม  — receipts / invoices of 4.1 (from a quote or written directly)
   · ขายอะไหล่ — 4.4 ใบตัดสต็อก sales; one already billed gets its tax invoice on that receipt, one not billed yet opens
                its receipt (billFromSale) with the tax invoice switched on, to check and save there.
   A tax invoice is still the receipt's taxDocs entry (same numbering RT, same register, print and cancel), so nothing
   else changes. The buyer's tax ID / branch typed here are kept on the customer record. The receipt window no longer
   offers "ออกใบกำกับภาษีด้วย" (user: tax invoices are issued from 4.3 now) — the box is only hidden, its value still
   travels with the receipt so saving a receipt never drops an issued tax invoice. */
(()=>{
 if(typeof openTaxNew!=='function'||typeof receiptTotals!=='function'||typeof ensureDocNo!=='function')return;
 const $i=id=>document.getElementById(id),B=()=>window.PKG_BRANCH,SC=()=>window.PKG_STOCK_CUT;
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const lastTax=r=>{const a=r.taxDocs||[];return a.length?a[a.length-1]:null;};
 const hasTax=r=>{const t=lastTax(r);return !!(t&&!t.cancelled);};
 const here=d=>!B()||B().here(d);
 const cuts=()=>SC()?SC().list():[];
 const cutOf=r=>r.saleId?cuts().find(c=>c.id===r.saleId):null;
 const isParts=r=>r.saleId?!(cutOf(r)||{}).quoteId:(!r.quoteId&&r.salesChannel==='retail');
 const T={cust:'',src:'repair',pick:'',done:null,lock:false};
 /* ระบบขายแบบใหม่ (phase 11, owner 12 Oct: "กดแล้วอ้างอิงจากใบตัดสต็อกเลย … ตอนนี้มันต้องกรอกชื่อ มันดูช้า"): while the switch is on a tax
    invoice starts FROM the stock cut. The two source tiles then mean  parts = ใบตัดสต็อกสินค้า (4.1) — every cut of the flow,
    counter sale or repair job, listed as its ledger record —  and  repair = เอกสารเดิม (receipts / invoices of the old
    system), shown only while the chosen customer still has such a document without a tax invoice. Opened from a cut or the
    4.6 pick list the customer is filled and locked (T.lock). Off = the window of 9 Oct, unchanged. */
 const SF=()=>!!(window.PKG_SALE&&PKG_SALE.on());
 const IC={wrench:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.6 17.4a1.5 1.5 0 0 0 2.1 2.1l5.9-5.9a4 4 0 0 0 5.2-5.2l-2.5 2.5-2.1-.5-.5-2.1z"/></svg>',
  box:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>',
  doc:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>'};

 /* hide the receipt window's own tax switch */
 const box=$i('rIssueTax')&&$i('rIssueTax').closest('.row');if(box)box.classList.add('pkg-tax-moved');

 /* ---------- window ---------- */
 const M=document.createElement('div');M.className='modal pkg-docwin';M.id='mTaxDoc';
 M.innerHTML=`<div class="sheet"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2>ใบกำกับภาษี</h2><span class="tag" id="txState">เอกสารใหม่</span><div class="spacer"></div>
   <button class="btn pri pc-rIssue" id="txSaveTop" type="button">บันทึก</button><button class="btn gh pkg-x-close" id="txCloseTop" type="button" title="ปิด" aria-label="ปิด">✕</button></header>
  <div class="body">
   <fieldset class="pkg-fs pkg-print-box" id="txPrintBox" hidden><legend>พิมพ์เอกสาร</legend><div class="pkg-print-row"><button type="button" class="btn pri pkg-print-main" id="txPrint">พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)</button><span class="hint">บันทึกแล้ว — พิมพ์ได้เลย</span></div></fieldset>
   <fieldset class="pkg-fs"><legend>ข้อมูลเอกสาร</legend>
    <div class="grid g4">
     <label class="f"><span>วันที่ออกเอกสาร</span><input type="text" id="txDate" readonly></label>
     <label class="f" style="grid-column:span 2;position:relative"><span>ลูกค้า *</span>
      <span class="pickclear-wrap"><input type="text" id="txCustSearch" autocomplete="off" placeholder="พิมพ์ชื่อ / บริษัท / เบอร์โทร / ทะเบียนรถ"><button type="button" class="pickclear" id="txCustClear" title="ล้างลูกค้า">✕</button></span>
      <div id="txCustSug" class="whoSug" style="display:none"></div><select id="txCust" style="display:none"></select></label>
     <label class="f"><span>เลขที่ใบกำกับภาษี</span><input type="text" id="txNo" readonly></label></div>
    <div class="f" style="margin-top:14px"><span>ออกใบกำกับภาษีจาก</span>
     <div class="pkg-tx-src">
      <label data-s="repair"><input type="radio" name="txSrc" value="repair" checked><span class="ic" aria-hidden="true">${IC.wrench}</span><span><b>งานซ่อม</b><small>ใบเสร็จรับเงิน / ใบแจ้งหนี้ (4.1)</small></span><span class="cnt" id="txCntRepair"></span></label>
      <label data-s="parts"><input type="radio" name="txSrc" value="parts"><span class="ic" aria-hidden="true">${IC.box}</span><span><b>ขายอะไหล่</b><small>ใบตัดสต็อกสินค้า (4.4)</small></span><span class="cnt" id="txCntParts"></span></label></div></div>
   </fieldset>
   <fieldset class="pkg-fs"><legend>เอกสารที่ยังไม่มีใบกำกับภาษี</legend>
    <div class="hint" id="txPickHint" style="margin-bottom:8px"></div>
    <div class="scroll"><table class="tbl pkg-tx-docs"><thead><tr><th class="ctr" style="width:60px">เลือก</th><th style="width:190px">เลขที่เอกสาร</th><th class="ctr" style="width:110px">วันที่</th><th>รายการ</th>
     <th class="num" style="width:120px">ก่อน VAT</th><th class="num" style="width:100px">VAT</th><th class="num" style="width:120px">ยอดรวม</th><th class="ctr" style="width:120px">สถานะ</th></tr></thead><tbody id="txDocs"></tbody></table></div>
   </fieldset>
   <fieldset class="pkg-fs"><legend>ข้อมูลผู้ซื้อ (พิมพ์บนใบกำกับภาษี)</legend>
    <div class="grid g3"><label class="f"><span>ชื่อผู้ซื้อ</span><input type="text" id="txBuyer" readonly></label>
     <label class="f"><span>เลขประจำตัวผู้เสียภาษี *</span><input type="text" id="txTaxId" inputmode="numeric" maxlength="13" placeholder="13 หลัก"></label>
     <label class="f"><span>สำนักงานใหญ่ / สาขาที่</span><input type="text" id="txBranch" placeholder="เช่น สำนักงานใหญ่ หรือ สาขาที่ 00001"></label>
     <label class="f" style="grid-column:span 3"><span>ที่อยู่</span><input type="text" id="txAddr" readonly></label></div>
    <div class="pkg-tx-warn" id="txWarn" hidden>ลูกค้ารายนี้ยังไม่มีเลขประจำตัวผู้เสียภาษี — ใส่ก่อนบันทึก (ระบบจะเก็บไว้ที่ข้อมูลลูกค้าด้วย)</div>
    <div class="hint" style="margin-top:8px">ชื่อและที่อยู่ดึงจากข้อมูลลูกค้า — แก้ได้ที่หมวด 01 · เลขผู้เสียภาษี / สาขา แก้ที่นี่แล้วเก็บกลับไปที่ลูกค้า</div>
   </fieldset>
   <fieldset class="pkg-fs"><legend>รายการบนใบกำกับภาษี</legend>
    <div class="pkg-tx-sum"><div class="scroll"><table class="tbl"><thead><tr><th class="ctr" style="width:50px">#</th><th>รายการ</th><th class="num" style="width:90px">จำนวน</th><th class="num" style="width:130px">จำนวนเงิน</th></tr></thead><tbody id="txLines"></tbody></table></div>
     <div class="pkg-tx-tot" id="txTot"></div></div>
   </fieldset>
   <div class="pkg-foot-save"><button class="btn pri pc-rIssue" id="txSaveBottom" type="button">บันทึก</button></div>
  </div></div></div>
  <div class="pkg-side-tools" role="toolbar" aria-label="เครื่องมือเอกสาร"><div class="pkg-side-group">
   <button type="button" class="pkg-side-btn s-close" data-x="close" title="ปิดหน้าต่าง" aria-label="ปิดหน้าต่าง"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
   <button type="button" class="pkg-side-btn s-new" data-x="new" title="สร้างเอกสารใหม่" aria-label="สร้างเอกสารใหม่"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg></button>
   <button type="button" class="pkg-side-btn s-save pc-rIssue" data-x="save" title="บันทึก" aria-label="บันทึก"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(M);
 if(window.PKG_RAIL)PKG_RAIL.attach('mTaxDoc');

 /* ---------- data ---------- */
 const custRows=()=>DB.cust.map(c=>({id:c.id,text:custName(c)||'-',sub:c.tel||'',meta:c.tax?'มีเลขผู้เสียภาษี':'',
  find:[custName(c),c.name,c.company,c.tel,c.tel2,c.tax,...(c.vehicles||[]).map(v=>v&&(v.plate||''))].filter(Boolean).join(' ')}));
 const itemsText=items=>(items||[]).filter(it=>it&&it.name).map(it=>it.name).join(', ');
 function docs(src){
  if(!T.cust)return [];
  const out=[];
  if(SF()){
   DB.receipts.forEach(r=>{if(r.cancelled||r.custId!==T.cust||!here(r)||hasTax(r)||!(n(r.vat)>0))return;if(!!r.pkgSale!==(src==='parts'))return;
    const c=r.pkgSale?PKG_SALE.saleOf(r):null;if(r.pkgSale&&(!c||c.cancelled||c.superseded))return;
    const t=receiptTotals(r);out.push({kind:'receipt',id:r.id,no:c?c.no:r.no,date:r.date,items:r.items,base:t.base,vat:t.vat,gross:t.gross,paid:!!r.paid,cut:c?c.no:'',
     note:c?(r.no!==c.no?'เอกสารเดิม '+r.no:''):(r.saleId?'ใบตัดสต็อก '+((cutOf(r)||{}).no||''):'')});});
   if(src!=='parts'&&SC())cuts().forEach(c=>{if(c.cancelled||c.quoteId||c.custId!==T.cust||!here(c)||!(n(c.vat)>0)||c.superseded||PKG_SALE.led(c))return;   /* a cut that never entered the flow */
    if(SC().saleBills(c,false).some(b=>b.kind==='receipt'))return;
    const t=SC().tot(c);out.push({kind:'cut',id:c.id,no:c.no,date:c.date,items:c.items,base:t.base,vat:t.vat,gross:t.gross,paid:!!c.paid,note:'ยังไม่มีใบเสร็จ'});});
   return out.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  }
  DB.receipts.forEach(r=>{if(r.cancelled||r.custId!==T.cust||!here(r)||hasTax(r)||!(n(r.vat)>0))return;if(isParts(r)!==(src==='parts'))return;
   const t=receiptTotals(r);out.push({kind:'receipt',id:r.id,no:r.no,date:r.date,items:r.items,base:t.base,vat:t.vat,gross:t.gross,paid:!!r.paid,note:r.saleId?'ใบตัดสต็อก '+((cutOf(r)||{}).no||''):''});});
  if(src==='parts'&&SC())cuts().forEach(c=>{if(c.cancelled||c.quoteId||c.custId!==T.cust||!here(c)||!(n(c.vat)>0))return;
   if(c.superseded||(window.PKG_SALE&&PKG_SALE.on()&&PKG_SALE.led(c)))return;   /* ระบบขายแบบใหม่: the sale's ledger record is already listed as a receipt above */
   if(SC().saleBills(c,false).some(b=>b.kind==='receipt'))return;   /* billed: its receipt is listed above */
   const t=SC().tot(c);out.push({kind:'cut',id:c.id,no:c.no,date:c.date,items:c.items,base:t.base,vat:t.vat,gross:t.gross,paid:!!c.paid,note:'ยังไม่มีใบเสร็จ'});});
  return out.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
 }
 const picked=()=>docs(T.src).find(d=>d.id===T.pick)||null;

 /* ---------- paint ---------- */
 function paint(){
  const c=findCust(T.cust),ro=!!T.done,sf=SF();
  {/* source tiles: names of the present menu; with the flow on the stock cut comes first and the old-document side is offered only when it has something */
   const box=M.querySelector('.pkg-tx-src'),tile=(k,b,s,ic)=>{const l=box.querySelector('label[data-s="'+k+'"]'),B=l.querySelector('b'),S2=l.querySelector('small'),I=l.querySelector('.ic');
    if(B.textContent!==b)B.textContent=b;if(S2.textContent!==s)S2.textContent=s;if(I.dataset.ic!==ic){I.innerHTML=IC[ic];I.dataset.ic=ic;}return l;};
   const tR=sf?tile('repair','เอกสารเดิม','ใบเสร็จรับเงิน / ใบแจ้งหนี้','doc'):tile('repair','งานซ่อม','ใบเสร็จรับเงิน / ใบแจ้งหนี้ (4.1)','wrench');
   sf?tile('parts','ใบตัดสต็อกสินค้า (4.1)','ใบที่มี VAT และยังไม่มีใบกำกับภาษี','box'):tile('parts','ขายอะไหล่','ใบตัดสต็อกสินค้า (4.4)','box');
   const old=sf&&(ro?T.src==='repair':!T.lock&&!!T.cust&&docs('repair').length>0);
   if(sf&&!ro&&!old&&T.src==='repair'){T.src='parts';T.pick='';}
   tR.hidden=sf&&!old;box.classList.toggle('sf',sf);box.classList.toggle('one',sf&&!old);}
  $i('txDate').value=thDate((T.done&&T.done.date)||iso());
  $i('txNo').value=T.done?T.done.no:'ออกเลขอัตโนมัติเมื่อบันทึก';
  $i('txState').textContent=T.done?'ใบกำกับภาษี '+T.done.no:'เอกสารใหม่';
  $i('txCntRepair').textContent=T.cust?docs('repair').length+' ใบ':'';$i('txCntParts').textContent=T.cust?docs('parts').length+' ใบ':'';
  M.querySelectorAll('input[name="txSrc"]').forEach(x=>{x.checked=x.value===T.src;x.disabled=ro;});
  $i('txCustSearch').disabled=ro||T.lock;$i('txCustClear').hidden=!!T.lock;   /* opened from a cut / the pick list: the customer is given */
  const list=ro?[]:docs(T.src);
  $i('txPickHint').textContent=ro?'บันทึกแล้ว — พิมพ์ได้จากปุ่มพิมพ์ หรือกด “ใบใหม่” เพื่อออกใบถัดไป':!T.cust?'เลือกลูกค้าก่อน — ระบบจะแสดงเอกสารของลูกค้ารายนั้นที่ยังไม่ได้ออกใบกำกับภาษี':'เลือก 1 ใบ (ใบกำกับภาษี 1 ใบ ต่อเอกสาร 1 ใบ)';
  $i('txDocs').innerHTML=ro?`<tr><td colspan="8" class="ctr">${esc2(T.done.src)}</td></tr>`
   :list.map(d=>`<tr data-tx="${esc2(d.id)}" class="${d.id===T.pick?'pkg-tx-on':''}"><td class="ctr"><input type="radio" name="txPick" ${d.id===T.pick?'checked':''} aria-label="เลือก ${esc2(d.no)}"></td>
    <td class="mono">${esc2(d.no)}${d.note?`<div class="hint">${esc2(d.note)}</div>`:''}</td><td class="ctr">${thDate(d.date)}</td><td>${esc2(itemsText(d.items))}</td>
    <td class="num">${money(d.base)}</td><td class="num">${money(d.vat)}</td><td class="num"><b>${money(d.gross)}</b></td>
    <td class="ctr">${d.paid?'<span class="chip g">ชำระแล้ว</span>':'<span class="chip a">ค้างชำระ</span>'}</td></tr>`).join('')
   ||`<tr><td colspan="8" class="ctr hint">${!T.cust?'—':sf?(T.src==='repair'?'ลูกค้ารายนี้ไม่มีเอกสารเดิมที่รอออกใบกำกับภาษี (ต้องเป็นเอกสารที่มี VAT)':'ลูกค้ารายนี้ไม่มีใบตัดสต็อกที่รอออกใบกำกับภาษี (ต้องเป็นใบที่มี VAT)'):'ลูกค้ารายนี้ไม่มีเอกสาร'+(T.src==='repair'?'งานซ่อม':'ขายอะไหล่')+'ที่รอออกใบกำกับภาษี (ต้องเป็นเอกสารที่มี VAT)'}</td></tr>`;
  $i('txBuyer').value=c?custName(c):'';$i('txAddr').value=c&&typeof addrLine==='function'?addrLine(c.addr):'';
  if(!ro&&document.activeElement!==$i('txTaxId'))$i('txTaxId').value=c?(c.tax||''):'';
  if(!ro&&document.activeElement!==$i('txBranch'))$i('txBranch').value=c?(c.branch||''):'';
  $i('txTaxId').readOnly=$i('txBranch').readOnly=ro||!c;
  $i('txWarn').hidden=ro||!c||!!String($i('txTaxId').value).trim();
  const d=ro?T.done.doc:picked(),its=d?(d.items||[]).filter(it=>it&&it.name):[];
  $i('txLines').innerHTML=its.map((it,i)=>`<tr><td class="ctr">${i+1}</td><td>${esc2(it.name)}</td><td class="num">${qf?qf(it.qty):n(it.qty)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')
   ||'<tr><td colspan="4" class="ctr hint">เลือกเอกสารด้านบน แล้วรายการจะขึ้นที่นี่</td></tr>';
  $i('txTot').innerHTML=`<div><span>รวมเป็นเงิน (ก่อน VAT)</span><span>${money(d?d.base:0)}</span></div><div><span>ภาษีมูลค่าเพิ่ม</span><span>${money(d?d.vat:0)}</span></div>
   <div class="big"><span>รวมทั้งสิ้น</span><span>${money(d?d.gross:0)}</span></div><div><span class="hint">อ้างอิง</span><span class="hint">${esc2(d?d.no:'-')}</span></div>`;
  [$i('txSaveTop'),$i('txSaveBottom'),M.querySelector('[data-x="save"]')].forEach(b=>{b.hidden=ro;});
  $i('txPrintBox').hidden=!ro;   /* print in the page after saving, like 04 (not on the side buttons) */
 }
 const qf=typeof window.qf==='function'?window.qf:null;
 const picker=typeof bindPicker==='function'?bindPicker('txCustSearch','txCustSug','txCust',custRows):null;
 const fillCust=()=>{$i('txCust').innerHTML='<option value=""></option>'+DB.cust.map(c=>`<option value="${esc2(c.id)}">${esc2(custName(c))}</option>`).join('');$i('txCust').value=T.cust;if(picker)picker.sync();};
 $i('txCust').addEventListener('change',()=>{T.cust=$i('txCust').value;T.pick='';if(picker)picker.sync();paint();});
 $i('txCustClear').addEventListener('click',()=>{T.cust='';T.pick='';$i('txCust').value='';if(picker)picker.sync();paint();});
 M.addEventListener('change',e=>{if(e.target.name==='txSrc'){T.src=e.target.value;T.pick='';paint();}});
 M.addEventListener('input',e=>{if(e.target.id==='txTaxId'||e.target.id==='txBranch')$i('txWarn').hidden=!T.cust||!!String($i('txTaxId').value).trim();});
 $i('txDocs').addEventListener('click',e=>{const tr=e.target.closest('tr[data-tx]');if(!tr||T.done)return;T.pick=tr.dataset.tx;paint();});

 /* ---------- actions ---------- */
 function fresh(){T.cust='';T.src=SF()?'parts':'repair';T.pick='';T.done=null;T.lock=false;fillCust();paint();}
 /* opened with a document already chosen (the stock cut's button, the 4.6 pick list): customer, source and document are set
    and the customer is locked — the user only checks and presses บันทึก. Nothing is issued here. */
 function openFor(o){
  o=o||{};
  if(!isVatReg()){toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');return false;}
  if(!can('doc.rIssue')){toast('บัญชีนี้ไม่มีสิทธิออกใบกำกับภาษี');return false;}
  T.cust=o.cust||'';T.src=o.src||(SF()?'parts':'repair');T.done=null;T.lock=!!o.lock&&!!T.cust;T.pick='';
  T.pick=o.pick&&docs(T.src).some(d=>d.id===o.pick)?o.pick:'';
  fillCust();{const cu=findCust(T.cust);$i('txTaxId').value=cu?(cu.tax||''):'';$i('txBranch').value=cu?(cu.branch||''):'';}
  paint();openModal('mTaxDoc');return !!T.pick;
 }
 /* a tax invoice that exists: the same window in its saved state (read-only, print box) */
 function show(rid,no){
  const r=DB.receipts.find(x=>x.id===rid),t=r&&((r.taxDocs||[]).find(x=>x.no===no)||lastTax(r));if(!r||!t)return false;
  const c=r.pkgSale&&window.PKG_SALE?PKG_SALE.saleOf(r):null,tt=receiptTotals(r);
  T.cust=r.custId||'';T.src=SF()?(r.pkgSale?'parts':'repair'):(isParts(r)?'parts':'repair');T.pick='';T.lock=true;
  T.done={rid:r.id,no:t.no,date:t.date||r.date,doc:{no:c?c.no:r.no,items:r.items,base:tt.base,vat:tt.vat,gross:tt.gross},
   src:(c?'ออกจากใบตัดสต็อก · '+c.no:'ออกจาก'+(T.src==='repair'?(SF()?'เอกสารเดิม':'งานซ่อม'):'ขายอะไหล่')+' · '+r.no)+(t.cancelled?' · ยกเลิกแล้ว':'')};
  fillCust();{const cu=findCust(T.cust);$i('txTaxId').value=cu?(cu.tax||''):'';$i('txBranch').value=cu?(cu.branch||''):'';}
  paint();$i('txPrintBox').hidden=!!t.cancelled;openModal('mTaxDoc');return true;
 }
 function open(){
  if(!isVatReg())return toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');
  if(!can('doc.rIssue'))return toast('บัญชีนี้ไม่มีสิทธิออกใบกำกับภาษี');
  fresh();openModal('mTaxDoc');
 }
 function close(){closeModal('mTaxDoc');if(typeof renderTaxOverview==='function')renderTaxOverview();}
 async function saveDoc(){
  if(T.done)return;
  if(!isVatReg())return toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');
  if(!can('doc.rIssue'))return toast('บัญชีนี้ไม่มีสิทธิออกใบกำกับภาษี');
  if(B()&&B().cur&&B().cur().bill===false)return toast('สาขา '+B().label()+' ไม่ได้เปิดให้ออกใบเสร็จ / ใบกำกับภาษี');
  const c=findCust(T.cust);if(!c)return toast('เลือกลูกค้าก่อน');
  const d=picked();if(!d)return toast('เลือกเอกสารที่จะออกใบกำกับภาษี');
  const tax=String($i('txTaxId').value).replace(/\s|-/g,''),br=String($i('txBranch').value).trim();
  if(!tax)return toast('ใส่เลขประจำตัวผู้เสียภาษีของผู้ซื้อก่อน');
  if(!/^\d{13}$/.test(tax)&&!await askP({title:'เลขประจำตัวผู้เสียภาษี',text:'เลขที่ใส่ไม่ใช่ตัวเลข 13 หลัก ('+tax+') — ยืนยันใช้เลขนี้?'}))return;
  if(c.tax!==tax||(c.branch||'')!==br){c.tax=tax;c.branch=br;logAudit('cust',{no:custName(c)},'save','เลขผู้เสียภาษี / สาขา จากหน้าออกใบกำกับภาษี');}
  if(d.kind==='cut'){
   if(!await askP({title:'ออกใบเสร็จก่อน',text:'ใบตัดสต็อก '+d.no+' ยังไม่มีใบเสร็จ — ระบบจะเปิดใบเสร็จจากใบตัดสต็อกนี้ พร้อมออกใบกำกับภาษีให้ด้วย ตรวจแล้วกดบันทึกในหน้าต่างใบเสร็จ'}))return;
   save();closeModal('mTaxDoc');await SC().billFromSale(d.id);
   const cb=$i('rIssueTax');if(cb&&typeof R!=='undefined'&&R&&R.saleId===d.id){cb.checked=true;if(typeof calcReceipt==='function')calcReceipt();}
   return;
  }
  const r=DB.receipts.find(x=>x.id===d.id);if(!r||r.cancelled||hasTax(r))return toast('เอกสารนี้ออกใบกำกับภาษีไม่ได้แล้ว — เลือกใหม่');
  const TP=window.PKG_TAX_PERIOD;if(TP&&!await TP.lateOk(r))return;   /* DriveGo new system (task 3.3, T2): the sale's VAT month is closed */
  r.issueTax=true;ensureDocNo(r,'taxDocs','taxNo','RT');stampTaxDoc(r);if(TP)TP.markLate(r);if(typeof syncTaxLegacy==='function')syncTaxLegacy(r);
  const sf=SF(),cutNo=sf&&r.pkgSale?d.no:'';
  logAudit('receipt',r,'save','ออกใบกำกับภาษี '+r.taxNo+(cutNo?' ของใบตัดสต็อก '+cutNo:'')+' (หน้า '+(sf?'4.6':'4.3')+')');save();
  T.done={rid:r.id,no:r.taxNo,doc:d,src:cutNo?'ออกจากใบตัดสต็อก · '+cutNo:'ออกจาก'+(T.src==='repair'?(sf?'เอกสารเดิม':'งานซ่อม'):'ขายอะไหล่')+' · '+r.no};
  if(typeof renderTaxOverview==='function')renderTaxOverview();if(typeof refreshReceiptRefs==='function')refreshReceiptRefs();
  if(typeof saveFx==='function')saveFx('บันทึกเอกสารแล้ว','ใบกำกับภาษี '+r.taxNo);
  toast(cutNo?'ออกใบกำกับภาษี '+r.taxNo+' แล้ว — ของใบตัดสต็อก '+cutNo:'ออกใบกำกับภาษี '+r.taxNo+' แล้ว — คู่กับใบเสร็จ '+r.no);paint();
  if(sf){try{if(window.PKG_SALE_DOCS&&PKG_SALE_DOCS.redraw)PKG_SALE_DOCS.redraw();}catch(e){}}   /* the open stock cut's toolbar now reads "ใบกำกับภาษี <no>" */
 }
 function print(){if(!T.done)return toast('บันทึกก่อน จึงจะพิมพ์ได้');printTaxDoc(T.done.rid,T.done.no);}
 $i('txSaveTop').onclick=$i('txSaveBottom').onclick=saveDoc;$i('txPrint').onclick=print;$i('txCloseTop').onclick=close;
 M.querySelector('.pkg-side-tools').addEventListener('click',e=>{const a=e.target.closest('[data-x]')?.dataset.x;
  if(a==='close')close();else if(a==='new')fresh();else if(a==='print')print();else if(a==='save')saveDoc();});

 window.pkgOldTaxNew=openTaxNew;   /* the small one-receipt dialog stays reachable */
 openTaxNew=open;window.openTaxNew=open;
 window.PKG_TAX_WINDOW={open,openFor,show,docs,state:T,save:saveDoc,fresh,paint};
})();
