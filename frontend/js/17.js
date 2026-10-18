/* Document toolbar (pilot: 04 receipt / 4.4). Before the first save only window-level buttons show; after saving,
   a tools box and a print-options box appear at the top of the form. Print options change the printed sheet only. */
(()=>{
 const modal=document.getElementById('mReceiptEdit');if(!modal)return;
 const body=modal.querySelector('.body'),head=modal.querySelector('header .hdr-actions');
 const saved=()=>typeof R!=='undefined'&&R&&R.no&&DB.receipts.some(x=>x.id===R.id);
 const bar=document.createElement('div');bar.className='pkg-doc-tools';bar.id='pkg-rcpt-tools';
 bar.innerHTML=`<fieldset class="pkg-fs"><legend>แถบเครื่องมือ</legend><div class="pkg-tool-grid">
   <button type="button" class="btn pri pkg-tool" data-t="new">+ สร้างใบเสร็จรับเงินใหม่</button>
   <button type="button" class="btn pkg-tool" data-t="audit">ตรวจสอบเอกสาร (ประวัติการแก้ไข)</button>
   <button type="button" class="btn pkg-tool pkg-tool-dgr pc-delDoc" data-t="cancel">ยกเลิกเอกสาร</button></div>
   <p class="hint pkg-tool-note">คัดลอกลิงก์แชร์ และส่งอีเมล ต้องใช้ระบบคลาวด์ — ยังไม่มีในเวอร์ชันนี้</p></fieldset>
  <fieldset class="pkg-fs"><legend>พิมพ์ / เงื่อนไขการพิมพ์เอกสาร</legend>
   <div class="grid g2"><label class="f"><span>รหัสสินค้าบนเอกสาร</span><select id="pkg-print-code"><option value="code">ตามข้อมูล (รหัสสินค้าของอู่)</option><option value="oem">รหัสอ้างอิง OEM</option><option value="none">ไม่แสดงรหัสสินค้า</option></select></label>
   <label class="f"><span>ข้อมูลสำหรับการชำระเงิน</span><select id="pkg-print-bank"></select></label></div>
   <div class="pkg-print-row"><button type="button" class="btn pri pkg-print-main" data-t="print">พิมพ์เอกสาร ▾</button>
    <div class="pkg-print-menu" hidden><button type="button" data-t="printR">ใบเสร็จรับเงิน / ใบแจ้งหนี้</button><button type="button" data-t="printT" id="pkg-print-tax">ใบกำกับภาษี</button></div></div>
   <div class="pkg-print-checks"><label><input type="checkbox" id="pkg-print-nohead"> ไม่แสดงหัวเอกสาร (ใช้กระดาษหัวจดหมายของร้าน)</label>
    <label><input type="checkbox" id="pkg-print-kit"> แสดงรายการอะไหล่ในชุด</label></div>
  </fieldset>`;
 body.prepend(bar);
 const $b=id=>document.getElementById(id);
 const opt=()=>{if(!R.printOpt)R.printOpt={code:'code',bank:'',noHead:false};return R.printOpt;};
 function sync(){
  if(typeof document==='undefined'||!document||typeof R==='undefined'||!R)return;
  const on=!!saved();modal.classList.toggle('pkg-unsaved',!on);bar.hidden=!on;
  if(!on)return;
  const o=opt(),banks=DB.shop.banks||[];
  $b('pkg-print-bank').innerHTML='<option value="">ไม่แสดง</option>'+banks.map((b,i)=>`<option value="${i}">${esc(bankLabel(b))}</option>`).join('');
  $b('pkg-print-code').value=o.code;$b('pkg-print-bank').value=o.bank;$b('pkg-print-nohead').checked=!!o.noHead;$b('pkg-print-kit').checked=!!R.kitDetail;
  $b('pkg-print-kit').closest('label').hidden=!(R.items||[]).some(it=>it.type==='kit');
  $b('pkg-print-tax').hidden=!R.taxNo;
  bar.querySelector('[data-t="cancel"]').hidden=!!R.cancelled;
 }
 bar.addEventListener('change',e=>{
  if(!R)return;const o=opt();
  if(e.target.id==='pkg-print-code')o.code=e.target.value;
  if(e.target.id==='pkg-print-bank')o.bank=e.target.value;
  if(e.target.id==='pkg-print-nohead')o.noHead=e.target.checked;
  if(e.target.id==='pkg-print-kit'){R.kitDetail=e.target.checked;const k=$b('pkg-receipt-kit-detail');if(k)k.checked=R.kitDetail;}
  if(typeof renderRPrev==='function')renderRPrev();
 });
 const menu=bar.querySelector('.pkg-print-menu');
 bar.addEventListener('click',e=>{
  const t=e.target.closest('[data-t]')?.dataset.t;if(!t)return;
  if(t==='print'){menu.hidden=!menu.hidden;return;}
  menu.hidden=true;
  ({new:()=>R.salesChannel==='retail'?newRetailReceipt():newReceipt(),audit:()=>openAudit('receipt',R.id),cancel:()=>cancelCurrentReceipt(),
    printR:()=>printReceipt(),printT:()=>printReceiptTax()})[t]?.();
 });
 document.addEventListener('click',e=>{if(!e.target.closest('.pkg-print-row'))menu.hidden=true;});
 /* Header keeps only window-level actions; document actions live in the toolbar once saved. */
 head.querySelectorAll('[onclick^="newReceipt"],[onclick^="printReceipt"],#rPrintTax,#rCancelBtn').forEach(b=>b.classList.add('pkg-moved-to-toolbar'));
 ['fillReceiptForm','calcReceipt'].forEach(name=>{const o=window[name];window[name]=function(){const r=o.apply(this,arguments);sync();return r;};});
 const saveO=saveReceipt;saveReceipt=async function(){const r=await saveO.apply(this,arguments);sync();return r;};
 /* Print options applied to the printed sheet. */
 const sheetO=sheetReceipt;
 sheetReceipt=function(r,kind,copy){
  const html=sheetO.apply(this,arguments),o=r&&r.printOpt;if(!o)return html;
  const t=document.createElement('template');t.innerHTML=html;
  if(o.noHead)t.content.querySelectorAll('.dochd .brand').forEach(b=>b.style.visibility='hidden');
  const table=[...t.content.querySelectorAll('table')].find(tb=>tb.querySelector('thead th:nth-child(2)')?.textContent.trim()==='รหัส');
  if(table&&o.code!=='code'){
   const its=rItemsClean(r);
   if(o.code==='none')table.querySelectorAll('tr').forEach(tr=>{const c=tr.children[1];if(c&&!c.hasAttribute('colspan'))c.remove();else if(c&&c.hasAttribute('colspan'))c.colSpan=Math.max(1,c.colSpan-1);});
   else{table.querySelector('thead th:nth-child(2)').textContent='รหัส OEM';[...table.tBodies[0].rows].forEach((tr,i)=>{const it=its[i];if(!it||!tr.children[1]||tr.children.length<4)return;const s=DB.stock.find(x=>x.id===it.stockId)||DB.stock.find(x=>x.code===it.code);tr.children[1].textContent=(s&&s.oem)||it.oem||'-';});}
  }
  const bank=o.bank!==''&&(DB.shop.banks||[])[+o.bank];
  if(bank&&table){const box=document.createElement('div');box.className='box';box.style.cssText='padding:4px 6px;margin-top:6px';box.innerHTML='<span class="lbl">ข้อมูลสำหรับการชำระเงิน</span> โอนเข้าบัญชี <b>'+esc(bankLabel(bank))+'</b>';table.after(box);}
  return t.innerHTML;
 };
 /* Floating side toolbar (desktop): window-level actions only — close, new document, save; receipts add payment. */
 const icon={pay:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  add:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg>',
  save:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'};
 const side=document.createElement('div');side.className='pkg-side-tools';side.setAttribute('role','toolbar');side.setAttribute('aria-label','เครื่องมือเอกสาร');
 side.innerHTML=`<div class="pkg-side-group" id="pkg-side-pay"><button type="button" class="pkg-side-btn s-pay" data-s="pay" title="ชำระเงิน" aria-label="ชำระเงิน">${icon.pay}</button></div>
  <div class="pkg-side-group"><button type="button" class="pkg-side-btn s-close" data-s="close" title="ปิดหน้าต่าง" aria-label="ปิดหน้าต่าง">${icon.close}</button>
  <button type="button" class="pkg-side-btn s-new" data-s="new" title="สร้างเอกสารใหม่" aria-label="สร้างเอกสารใหม่">${icon.add}</button>
  <button type="button" class="pkg-side-btn s-save pc-rIssue" data-s="save" title="บันทึก" aria-label="บันทึก">${icon.save}</button></div>`;
 modal.append(side);
 side.addEventListener('click',e=>{
  const s=e.target.closest('[data-s]')?.dataset.s;if(!s)return;
  if(s==='close')return closeReceiptForm();
  if(s==='new')return R&&R.salesChannel==='retail'?newRetailReceipt():newReceipt();
  if(s==='save')return saveReceipt();
  if(s==='pay')openPay();
 });

 /* ---------- Payment panel: a step-by-step front end for the existing payment fields ----------
    Each method holds one or more lines (transfer / card can have several). Sums per method go into the original
    fields (#pCashAmt ...), the first line's details into #pBank/#pWhen/#pCardBank/#pCard4, and every line is kept
    on R.pay (transLines / cardLines / cashGiven / changeMode / cardType) so nothing the cashier typed is lost.
    Amounts start at 0 (user 2026-10-11): a method's amount is only what the cashier typed; the only fills are the two
    full-amount buttons and each method's "ยอดที่เหลือ" button. A lone method is ticked in the original form only when its
    amount equals the net (the original form gives a lone ticked method the whole amount by itself). */
 const METHODS=[['cash','เงินสด','pCash','pCashAmt'],['trans','โอน','pTrans','pTransAmt'],['card','บัตรเครดิต / บัตรเดบิต','pCard','pCardAmt'],['chk','เช็ค','pChk','pChkAmt'],['credit','เงินเชื่อ','pCredit','']];
 const M=Object.fromEntries(METHODS.map(m=>[m[0],m]));
 const $o=id=>document.getElementById(id);
 const setO=(id,v)=>{const el=$o(id);if(!el)return;if(el.type==='checkbox'){el.checked=!!v;el.dispatchEvent(new Event('change',{bubbles:true}));}else{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const r2=v=>Math.round(v*100)/100;
 const CARD_BANKS=['ธนาคารกสิกรไทย','ธนาคารไทยพาณิชย์','ธนาคารกรุงเทพ','ธนาคารกรุงไทย','ธนาคารกรุงศรีอยุธยา (KRUNGSRI)','ธนาคารทหารไทยธนชาต (ttb)','เคทีซี (KTC)','เซ็นทรัล เดอะวัน','อิออน (AEON)','VISA / Mastercard อื่น ๆ'];
 const nowText=()=>{const d=new Date();return thDate(iso(d))+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
 let order=[],lines={},cashX={given:'',mode:'cash'},kept=null;
 const pay=document.createElement('aside');pay.className='pkg-pay';pay.hidden=true;pay.setAttribute('role','dialog');pay.setAttribute('aria-label','ชำระเงิน');
 (document.getElementById('pkg-app')||document.body).append(pay);   /* outside the modal's stacking layer so it covers the fixed app header */
 const payOpenBtn=document.createElement('button');payOpenBtn.type='button';payOpenBtn.className='btn pri pkg-pay-open';payOpenBtn.textContent='เปิดหน้าชำระเงิน';
 document.getElementById('payMethods').before(payOpenBtn);payOpenBtn.onclick=()=>openPay();
 const retail=()=>R&&R.salesChannel==='retail';
 const net=()=>receiptTotals(R).net;
 const paidNow=()=>order.filter(k=>k!=='credit');
 const sumOf=k=>(lines[k]||[]).reduce((a,l)=>a+n(l.amt),0);
 const blankLine=k=>k==='trans'?{amt:'',bank:'',when:nowText()}:k==='card'?{amt:'',type:'credit',bank:'',last4:''}:{amt:''};
 function active(){return METHODS.filter(m=>$o(m[2]).checked).map(m=>m[0]);}
 const sig=()=>active().join(',')+'|'+METHODS.filter(m=>m[3]).map(m=>$o(m[3]).value).join(',')+'|'+net();
 function openPay(){
  if(!R)return;
  /* amounts typed but not yet valid for the form (e.g. one method, part of the total) come back when the panel is reopened */
  if(kept&&kept.R===R&&kept.sig===sig()){order=kept.order;lines=kept.lines;cashX=kept.cashX;kept=null;pay.hidden=false;modal.classList.add('pkg-pay-on');drawPay();pay.querySelector('button')?.focus();return;}
  kept=null;order=active();lines={};
  const pn=paidNow(),p=R.pay||{};
  pn.forEach(k=>{
   const saved=k==='trans'?p.transLines:k==='card'?p.cardLines:null;
   if(Array.isArray(saved)&&saved.length)lines[k]=JSON.parse(JSON.stringify(saved));
   else{const l=blankLine(k);l.amt=pn.length===1?String(net()):$o(M[k][3]).value;
    if(k==='trans'){l.bank=$o('pBank').value;l.when=$o('pWhen').value||nowText();}
    if(k==='card'){l.bank=$o('pCardBank').value;l.last4=$o('pCard4').value;l.type=p.cardType||'credit';}
    lines[k]=[l];}
  });
  cashX={given:p.cashGiven||'',mode:p.changeMode||'cash'};
  pay.hidden=false;modal.classList.add('pkg-pay-on');drawPay();pay.querySelector('button')?.focus();
 }
 function closePay(){if(!pay.hidden&&typeof R!=='undefined'&&R)kept={R,sig:sig(),order,lines,cashX};pay.hidden=true;modal.classList.remove('pkg-pay-on');}
 function pushOriginal(){
  const pn=paidNow(),p=R.pay||(R.pay={});
  /* which original boxes are ticked: credit alone · 2+ methods as chosen (their amounts go to the split fields) ·
     one method only once its amount equals the net — never the old silent "one method = whole amount" */
  const lone=pn.length===1&&Math.abs(r2(net()-sumOf(pn[0])))<0.005;
  const want=k=>order.includes('credit')?k==='credit':pn.length>=2?pn.includes(k):lone&&pn[0]===k;
  METHODS.forEach(m=>{if($o(m[2]).checked&&!want(m[0]))setO(m[2],false);});
  METHODS.forEach(m=>{if(!$o(m[2]).checked&&want(m[0]))setO(m[2],true);});
  if(pn.length>=2)pn.forEach(k=>{const el=$o(M[k][3]);el.value=sumOf(k)||'';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const t=lines.trans&&lines.trans[0],c=lines.card&&lines.card[0];
  if(t){$o('pBank').value=t.bank||'';$o('pWhen').value=t.when||'';}
  if(c){$o('pCardBank').value=c.bank||'';$o('pCard4').value=c.last4||'';}
  p.transLines=lines.trans?JSON.parse(JSON.stringify(lines.trans)):[];p.cardLines=lines.card?JSON.parse(JSON.stringify(lines.card)):[];
  p.cardType=c?c.type:'';p.cashGiven=order.includes('cash')?cashX.given:'';p.changeMode=cashX.mode;
  if(typeof autoPaidSync==='function')autoPaidSync();
 }
 function sums(){const got=paidNow().reduce((a,k)=>a+sumOf(k),0);return{got,due:r2(net()-got)};}
 function fee(){return r2(sumOf('card')*n($o('pCardPct').value)/100);}
 const req='<b class="pkg-req">*</b>';
 function lineBox(k,l,i,locked){
  const many=lines[k].length>1,rm=many&&!locked?`<button type="button" class="pkg-line-x" data-del="${k}:${i}" aria-label="ลบรายการ">−</button>`:'';
  const amtF=`<label class="f"><span>จำนวนเงิน ${req}</span><div class="pkg-amt"><input class="pkg-amtbig" data-line="${k}:${i}:amt" inputmode="decimal" value="${esc(l.amt)}" placeholder="0.00" ${locked?'disabled':''}><em>บาท</em><button type="button" class="btn pkg-rest" data-rest="${k}:${i}" ${locked?'disabled':''}>ยอดที่เหลือ</button></div></label>`;
  if(k==='trans'){const banks=(DB.shop.banks||[]).map(b=>bankLabel(b));
   return `<div class="pkg-line">${rm}${amtF}<label class="f"><span>ธนาคาร / บัญชีที่รับโอน ${req}</span><select data-line="trans:${i}:bank" ${locked?'disabled':''}><option value="">กรุณาเลือก</option>${banks.map(b=>`<option ${b===l.bank?'selected':''}>${esc(b)}</option>`).join('')}${l.bank&&!banks.includes(l.bank)?`<option selected>${esc(l.bank)}</option>`:''}</select></label>
    <label class="f"><span>วันที่ / เวลา ${req}</span><div class="pkg-amt"><input data-line="trans:${i}:when" value="${esc(l.when)}" placeholder="29/09/2569 14:30" ${locked?'disabled':''}><button type="button" class="btn" data-now="${i}" ${locked?'disabled':''}>ตอนนี้</button></div></label></div>`;}
  if(k==='card')return `<div class="pkg-line">${rm}${amtF}<div class="f"><span>ประเภทบัตร ${req}</span><div class="pkg-radio"><label><input type="radio" name="pkgct${i}" data-line="card:${i}:type" value="credit" ${l.type!=='debit'?'checked':''} ${locked?'disabled':''}> บัตรเครดิต</label><label><input type="radio" name="pkgct${i}" data-line="card:${i}:type" value="debit" ${l.type==='debit'?'checked':''} ${locked?'disabled':''}> บัตรเดบิต</label></div></div>
    <label class="f"><span>ธนาคาร / ผู้ให้บริการบัตร ${req}</span><select data-line="card:${i}:bank" ${locked?'disabled':''}><option value="">กรุณาเลือก</option>${CARD_BANKS.map(b=>`<option ${b===l.bank?'selected':''}>${b}</option>`).join('')}${l.bank&&!CARD_BANKS.includes(l.bank)?`<option selected>${esc(l.bank)}</option>`:''}</select></label>
    <label class="f"><span>รหัสบัตร 4 ตัวท้าย ${req}</span><input data-line="card:${i}:last4" value="${esc(l.last4)}" maxlength="4" inputmode="numeric" ${locked?'disabled':''}></label></div>`;
  if(k==='cash')return `<div class="pkg-line pkg-line-flat"><label class="f"><span>ยอดที่ชำระด้วยเงินสด ${req}</span><div class="pkg-amt"><input class="pkg-amtbig" data-line="cash:0:amt" inputmode="decimal" value="${esc(l.amt)}" placeholder="0.00" ${locked?'disabled':''}><em>บาท</em><button type="button" class="btn pkg-rest" data-rest="cash:0" ${locked?'disabled':''}>ยอดที่เหลือ</button></div></label>
    <label class="f"><span>รับเงิน</span><div class="pkg-amt"><input data-cash="given" inputmode="decimal" value="${esc(cashX.given)}" placeholder="เงินที่ลูกค้าให้มา" ${locked?'disabled':''}><em>บาท</em></div></label>
    <label class="f"><span>เงินทอน</span><div class="pkg-amt"><input id="pkgPayChange" readonly><em>บาท</em></div></label>
    <div class="f"><span>รูปแบบเงินทอน</span><div class="pkg-radio"><label><input type="radio" name="pkgchg" data-cash="mode" value="cash" ${cashX.mode!=='transfer'?'checked':''} ${locked?'disabled':''}> เงินสด</label><label><input type="radio" name="pkgchg" data-cash="mode" value="transfer" ${cashX.mode==='transfer'?'checked':''} ${locked?'disabled':''}> โอนเงิน</label></div></div></div>`;
  return `<div class="pkg-line pkg-line-flat">${amtF.replace(`data-line="${k}:${i}:amt"`,`data-line="${k}:${i}:amt"`)}</div>`;
 }
 /* R2 layout (user's pick, mockups/payment-options-6.html): big total → got / due boxes → quick buttons → five method
    tiles (tap = add, tap again = remove; several = split) → one card per chosen method in tap order. */
 const TILE={cash:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>','เงินสด','#16865c'],trans:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5 12 4l8.5 5.5M5 9.5h14M6.5 9.5V17M10.5 9.5V17M13.5 9.5V17M17.5 9.5V17M4 20h16M5 17h14"/></svg>','โอน','#2457c5'],card:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h4"/></svg>','บัตร','#7c3aed'],chk:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 6 19z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>','เช็ค','#b25e00'],credit:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5H18a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 18 20.5H6.5A2 2 0 0 1 4.5 18.5V5.5A2 2 0 0 1 6.5 3.5z"/><path d="M8.5 3.5v17M12 8.5h4M12 12h4"/></svg>','เงินเชื่อ','#475467']};
 const MAXM=3;
 function tilesHtml(locked){
  const credit=order.includes('credit'),full=!credit&&paidNow().length>=MAXM;
  return METHODS.map(([k])=>{const on=order.includes(k),[ic,t,c]=TILE[k],off=locked||(!on&&k!=='credit'&&full);
   return `<button type="button" class="pkg-tile${on?' on':''}" style="--mc:${c}" data-tile="${k}" aria-pressed="${on}" ${off?'disabled':''}><i aria-hidden="true">${ic}</i><b>${t}</b><small data-tile-amt="${k}">${!on&&off&&!locked?'ครบ 3 วิธี':'แตะเพื่อเพิ่ม'}</small></button>`;}).join('');
 }
 /* tap a tile: the same rules as the old 1–3 method drop-downs (max 3, credit alone — choosing it clears the others,
    choosing another clears credit); a newly added method starts empty with the cursor in its amount field */
 function toggleTile(k){
  if(!R||R.cancelled||!M[k])return;
  if(order.includes(k)){
   order=order.filter(x=>x!==k);delete lines[k];
  }else if(k==='credit'){
   if(retail()&&!R.custId)return toast('เลือกลูกค้าก่อนขายเชื่อ');
   if(order.length)toast('เงินเชื่อต้องเป็นวิธีเดียว — นำวิธีอื่นออกให้แล้ว');
   order=['credit'];lines={};
  }else{
   if(order.includes('credit')){order=[];lines={};toast('นำ “เงินเชื่อ” ออกแล้ว — เงินเชื่อใช้ร่วมกับวิธีอื่นไม่ได้');}
   if(paidNow().length>=MAXM)return toast('แบ่งจ่ายได้สูงสุด 3 วิธี');
   order.push(k);lines[k]=[blankLine(k)];
   pushOriginal();drawPay();pay.querySelector(`[data-line="${k}:0:amt"]`)?.focus();return;
  }
  pushOriginal();drawPay();
 }
 function drawPay(){
  if(pay.hidden)return;
  const t=receiptTotals(R),locked=!!R.cancelled,isRetail=retail();
  const credit=order.includes('credit');
  const f=(label,id,extra='')=>`<label class="f"><span>${label}</span><input data-o="${id}" value="${esc($o(id).value)}" ${extra} ${locked?'disabled':''}></label>`;
  const section=k=>{
   const add=(k==='trans'||k==='card')&&!locked?`<button type="button" class="btn pkg-add" data-add="${k}">+ เพิ่ม</button>`:'';
   if(k==='credit')return `<div class="pkg-pay-2">${f('จำนวนวันเครดิต','pDays','inputmode="numeric"')}<label class="f"><span>ครบกำหนดชำระ</span><input value="${esc($o('pDue').value)}" readonly></label></div><p class="hint">ยอดที่ยังไม่ได้รับจะเป็นลูกหนี้ (ใบแจ้งหนี้) · เงินเชื่อใช้ได้วิธีเดียว</p>`;
   let h=lines[k].map((l,i)=>lineBox(k,l,i,locked)).join('')+`<div class="pkg-add-row">${add}</div>`;
   if(k==='card')h+=`<div class="pkg-pay-2">${f('ชาร์จเพิ่ม (%)','pCardPct','inputmode="decimal"')}${f('เลขที่อนุมัติ / สลิป','pCardRef')}</div><p class="hint" id="pkgPayFee"></p>`;
   if(k==='chk')h+=`${f('ธนาคารตามหน้าเช็ค','pChkBank')}<div class="pkg-pay-2">${f('เลขที่เช็ค','pChkNo')}${f('วันที่สั่งจ่าย','pChkDate','type="date"')}</div>`;
   return h;};
  pay.innerHTML=`<div class="pkg-pay-head"><b>ชำระเงิน</b><span class="hint">${esc(R.no||'เอกสารใหม่')}</span><button type="button" class="pkg-pay-rv" data-p="review">ตรวจสอบรายการ</button><button type="button" class="pkg-pay-x" data-p="close" aria-label="ปิดหน้าชำระเงิน">✕</button></div>
  <div class="pkg-pay-body pkg-r2">
   <div class="pkg-r2sum"><div class="pkg-r2tot"><span>ยอดที่ต้องชำระ</span><b>${money(t.net)}</b></div>
    <div class="pkg-r2row"><div><span>รับแล้ว</span><b id="pkgPayGot"></b></div><div class="pkg-r2due" id="pkgPayDueBox"><span id="pkgPayDueLbl"></span><b id="pkgPayDue"></b></div></div>
    <p class="hint" id="pkgPayCard"></p></div>
   <div class="pkg-quick"><button type="button" class="btn grn" data-p="fullcash" ${locked?'disabled':''}>ชำระเงินสดเต็มจำนวน</button><button type="button" class="btn grn" data-p="fulltrans" ${locked?'disabled':''}>โอนชำระเต็มจำนวน</button></div>
   <div class="pkg-r2hint">แตะวิธีที่ลูกค้าจ่าย — แตะหลายอันได้ (แบ่งจ่าย)</div>
   <div class="pkg-tiles" role="group" aria-label="วิธีการชำระเงิน">${tilesHtml(locked)}</div>
   <p class="hint" id="pkgPayTip"></p>
   ${order.map((k,i)=>`<section class="pkg-r2card" style="--mc:${TILE[k][2]}"><div class="pkg-r2card-hd"><span class="no">${i+1}</span><b>${TILE[k][0]} ${M[k][1]}</b><button type="button" class="pkg-r2-rm" data-tile="${k}" ${locked?'disabled':''}>เอาออก</button></div>
    ${section(k)}</section>`).join('')}
   <details class="pkg-r2who"><summary><i class="pkg-ic pkg-ic-user" aria-hidden="true"></i>ผู้รับเงิน: <span id="pkgPayBy"></span></summary>${f('ผู้รับเงิน','rBy')}${f('หมายเหตุ','rNote')}</details>
  </div>
  <div class="pkg-pay-foot"><button type="button" class="btn grn pc-rIssue" data-p="finish" ${locked?'disabled':''}>${isRetail?'ปิดการขาย':'บันทึกการรับชำระ'}</button></div>`;
  update();
 }
 /* Live numbers, patched in place on every keystroke (no rebuild, focus stays where the user is typing). */
 function update(){
  if(pay.hidden||!R||!$o('pkgPayDue'))return;
  const {got,due}=sums(),credit=order.includes('credit'),ok=Math.abs(due)<0.005,pn=paidNow();
  $o('pkgPayGot').textContent=money(got);
  $o('pkgPayDueBox').className='pkg-r2due '+(credit||ok?'st-ok':due>0?'st-due':'st-over');
  $o('pkgPayDueLbl').textContent=credit?'เงินเชื่อทั้งหมด':ok?'✓ ครบแล้ว':due>0?'ยังขาด':'เกินมา';
  $o('pkgPayDue').textContent=money(Math.abs(due));
  const ca=sumOf('card'),fe=fee();
  $o('pkgPayCard').textContent=ca&&fe>0?`รูดบัตร ${money(ca)} + ค่าธรรมเนียม ${money(fe)} = ${money(ca+fe)} บาท (ค่าธรรมเนียมไม่นับเป็นรายได้)`:'';
  if($o('pkgPayFee'))$o('pkgPayFee').textContent=`ค่าธรรมเนียม ${money(fe)} บาท · ยอดที่ต้องรูดรวม ${money(ca+fe)} บาท`;
  $o('pkgPayTip').textContent=pn.length&&!ok?'พิมพ์ยอดของแต่ละวิธีเอง · กด “ยอดที่เหลือ” เพื่อเติมส่วนที่ยังขาด':'';
  pay.querySelectorAll('[data-tile-amt]').forEach(x=>{const k=x.dataset.tileAmt;if(!order.includes(k))return;const zero=k!=='credit'&&!(sumOf(k)>0);
   x.textContent=k==='credit'?(n($o('pDays').value)>0?n($o('pDays').value)+' วัน':'ยังไม่ระบุวัน'):zero?'ยังไม่ใส่ยอด':money(sumOf(k));x.style.color=zero?'#667085':'';x.style.fontWeight=zero?'400':'';});
  const ch=$o('pkgPayChange');if(ch){const g=cashX.given===''?null:n(cashX.given),c=sumOf('cash');ch.value=g===null?'':money(Math.max(0,g-c));ch.classList.toggle('neg',g!==null&&g<c);}
  pay.querySelectorAll('input[data-line]').forEach(i=>{if(i.type==='radio')return;const [k,idx,f]=i.dataset.line.split(':');const l=lines[k]&&lines[k][+idx];if(!l)return;
   if(i!==document.activeElement)i.value=l[f]??'';});
  pay.querySelectorAll('[data-o]').forEach(i=>{if(i!==document.activeElement)i.value=$o(i.dataset.o).value;});
  const by=$o('pkgPayBy');if(by)by.textContent=($o('rBy').value||'-')+($o('rNote').value?' · มีหมายเหตุ':'');
 }
 function setLine(el){const [k,idx,f]=el.dataset.line.split(':'),l=lines[k]&&lines[k][+idx];if(!l)return null;l[f]=el.value;return {k,f};}
 pay.addEventListener('input',e=>{
  if(e.target.dataset.line){setLine(e.target);pushOriginal();update();return;}
  if(e.target.dataset.cash==='given'){cashX.given=e.target.value;pushOriginal();update();}
 });
 pay.addEventListener('change',e=>{
  if(e.target.dataset.line){setLine(e.target);pushOriginal();update();return;}
  if(e.target.dataset.cash==='mode'){cashX.mode=e.target.value;pushOriginal();return;}
  const o=e.target.dataset.o;if(o){setO(o,e.target.value);update();}
 });
 pay.addEventListener('click',async e=>{
  const tile=e.target.closest('[data-tile]')?.dataset.tile;if(tile)return toggleTile(tile);
  const rest=e.target.closest('[data-rest]')?.dataset.rest;
  if(rest){const [k,idx]=rest.split(':'),ls=lines[k];const others=paidNow().reduce((a,x)=>a+sumOf(x),0)-n(ls[+idx].amt);ls[+idx].amt=String(Math.max(0,r2(net()-others)));
   const inp=pay.querySelector(`[data-line="${k}:${idx}:amt"]`);if(inp)inp.value=ls[+idx].amt;pushOriginal();update();return;}
  const add=e.target.closest('[data-add]')?.dataset.add;if(add){lines[add].push(blankLine(add));pushOriginal();drawPay();pay.querySelector(`[data-line="${add}:${lines[add].length-1}:amt"]`)?.focus();return;}
  const del=e.target.closest('[data-del]')?.dataset.del;if(del){const [k,idx]=del.split(':');lines[k].splice(+idx,1);pushOriginal();drawPay();return;}
  const now=e.target.closest('[data-now]')?.dataset.now;if(now!==undefined){lines.trans[+now].when=nowText();pushOriginal();update();return;}
  const p=e.target.closest('[data-p]')?.dataset.p;if(!p)return;
  if(p==='close')return closePay();
  if(p==='review'){closePay();document.getElementById('rItems')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  if(p==='fullcash'||p==='fulltrans'){METHODS.forEach(m=>setO(m[2],false));const k=p==='fullcash'?'cash':'trans';setO(M[k][2],true);order=[k];lines={[k]:[{...blankLine(k),amt:String(net())}]};pushOriginal();return drawPay();}
  if(p==='finish'){
   const {due}=sums();
   if(!order.length)return toast('เลือกวิธีการชำระเงินก่อน');
   const empty=paidNow().find(k=>!(sumOf(k)>0));if(empty)return toast(TILE[empty][1]+': ยังไม่ได้ใส่จำนวนเงิน');
   if(!order.includes('credit')&&Math.abs(due)>=0.005)return toast(due>0?'ยอดรับยังขาดอีก '+money(due)+' บาท — ใส่ยอดให้ครบ หรือเลือก “เงินเชื่อ” สำหรับยอดค้าง':'ยอดรับเกินยอดสุทธิ '+money(-due)+' บาท — แก้ยอดให้ตรงก่อนบันทึก');
   for(const l of lines.trans||[])if(!l.bank||!(n(l.amt)>0)||!l.when)return toast('กรอกข้อมูลเงินโอนให้ครบ: ธนาคาร จำนวนเงิน และวันที่ / เวลา');
   for(const l of lines.card||[])if(!l.bank||!/^\d{4}$/.test(String(l.last4))||!(n(l.amt)>0))return toast('กรอกข้อมูลบัตรให้ครบ: ธนาคาร รหัสบัตร 4 ตัวท้าย และจำนวนเงิน');
   if(order.includes('cash')&&cashX.given!==''&&n(cashX.given)<sumOf('cash'))return toast('รับเงินสดมาไม่พอ — ขาดอีก '+money(sumOf('cash')-n(cashX.given))+' บาท');
   pushOriginal();await saveReceipt();if(saved())closePay();return;}
 });
 pay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closePay();}});
 const calcO=window.calcReceipt;window.calcReceipt=function(){const r=calcO.apply(this,arguments);if(!pay.hidden)update();return r;};
 const fillO=window.fillReceiptForm;window.fillReceiptForm=function(){closePay();kept=null;return fillO.apply(this,arguments);};
 const closeO=window.closeReceiptForm;if(closeO)window.closeReceiptForm=function(){closePay();return closeO.apply(this,arguments);};

 /* Same rule on the form's own checkboxes: credit alone, or paid-now methods without credit. */
 const PAYBOX=['pCash','pTrans','pCard','pChk'];
 document.getElementById('payMethods').addEventListener('change',e=>{
  const id=e.target.id;if(!e.target.checked)return;
  if(id==='pCredit'&&PAYBOX.some(x=>$o(x).checked)){PAYBOX.forEach(x=>setO(x,false));toast('เงินเชื่อต้องเป็นวิธีเดียว — นำวิธีอื่นออกให้แล้ว');}
  else if(PAYBOX.includes(id)&&$o('pCredit').checked){setO('pCredit',false);toast('นำ “เงินเชื่อ” ออกแล้ว — เงินเชื่อใช้ร่วมกับวิธีอื่นไม่ได้');}
 },true);
 /* ---------- Section frames: group the existing form parts under titled borders (order unchanged) ---------- */
 const byId=id=>document.getElementById(id),grid=id=>byId(id)?.closest('.grid');
 const payTitle=[...body.children].find(el=>el.tagName==='DIV'&&el.textContent.trim()==='การชำระเงิน');
 const prodSec=body.querySelector(':scope > .pkg-product-section');
 const itemTitle=prodSec?.previousElementSibling,itemBtns=prodSec?.nextElementSibling;
 const SECTIONS=[
  ['ข้อมูลเอกสาร',[byId('rHeadGrid'),byId('rIssueTax')?.closest('.row')]],
  ['ภาษีและส่วนลด',[grid('rVat')]],
  ['การชำระเงิน',[payTitle,payOpenBtn,byId('payMethods'),byId('pSplitBox'),grid('pBank'),byId('cardBox'),byId('chkBox')]],
  ['ผู้ปฏิบัติงาน',[grid('rTech1')]],
  ['รายการสินค้าและการรับประกัน',[itemTitle,prodSec,itemBtns]],
  ['เงื่อนไขการรับประกัน',[byId('rWarr')?.closest('label')]],
  ['สรุปยอดเงิน',[grid('rSub')||byId('rSub')?.closest('.grid,.g2')]]
 ];
 const secs=SECTIONS.map(([title,nodes])=>{
  nodes=nodes.filter(nd=>nd&&nd.parentElement===body);if(!nodes.length)return null;
  const fs=document.createElement('fieldset');fs.className='pkg-fs pkg-sec';fs.innerHTML=`<legend>${title}</legend>`;
  nodes[0].before(fs);nodes.forEach(nd=>fs.append(nd));return fs;
 }).filter(Boolean);
 if(payTitle)payTitle.classList.add('pkg-sec-oldtitle');
 if(itemTitle&&itemTitle.querySelector('b'))itemTitle.querySelector('b').classList.add('pkg-sec-oldtitle');
 /* A frame whose contents are all hidden (e.g. technicians on counter sales) disappears too. */
 function secVisibility(){secs.forEach(fs=>{const kids=[...fs.children].filter(c=>c.tagName!=='LEGEND');fs.hidden=kids.every(c=>c.hidden||c.style.display==='none');   /* cheap check: hidden attribute / inline display only */});}
 const fillS=window.fillReceiptForm;window.fillReceiptForm=function(){const r=fillS.apply(this,arguments);secVisibility();return r;};
 /* ---------- Product entry in three columns (sale info · product entry · totals), like the reference ERP ----------
    The picker's own root stays the middle column (it still hides itself when the document is locked). */
 const pRoot=document.getElementById('pkg-receipt-products');
 if(pRoot&&prodSec){
  const grid3=document.createElement('div');grid3.className='pkg-entry3';pRoot.before(grid3);
  const info=document.createElement('fieldset');info.className='pkg-fs pkg-entry-col';
  info.innerHTML=`<legend>ข้อมูลการขาย</legend><label class="f"><span>ระดับราคาขาย</span><input id="pkgEntryTier" readonly></label>
   <label class="f"><span>จำนวนรายการรวม</span><div class="pkg-unit"><input id="pkgEntryLines" readonly><em>รายการ</em></div></label>
   <label class="f"><span>จำนวนสินค้าทั้งสิ้น</span><div class="pkg-unit"><input id="pkgEntryQty" readonly><em>หน่วย</em></div></label>`;
  const tot=document.createElement('fieldset');tot.className='pkg-fs pkg-entry-col';
  tot.innerHTML=`<legend>ข้อมูลยอดเงินรวมทั้งหมด</legend><div class="pkg-entry-tot"><span>ยอดชำระทั้งสิ้น</span><b id="pkgEntryNet">0.00</b></div><div class="pkg-entry-tot"><span>ราคารวมทั้งสิ้น</span><b id="pkgEntrySub">0.00</b></div>`;
  pRoot.classList.add('pkg-fs','pkg-entry-col','pkg-entry-mid');
  const lg=document.createElement('legend');lg.textContent='การนำเข้าสินค้า';pRoot.prepend(lg);
  const line=t=>{const d=document.createElement('div');d.className='pkg-line-title';d.innerHTML=`<span>${t}</span>`;return d;};
  const quick=pRoot.querySelector('.pkg-product-quick:not(.pkg-kit-quick)'),exact=pRoot.querySelector('.pkg-product-exact'),kit=pRoot.querySelector('.pkg-kit-quick');
  if(quick)quick.before(line('สินค้า'));if(kit)kit.before(line('ชุดอะไหล่ซ่อมบำรุง'));
  grid3.append(info,pRoot,tot);
  const entry=()=>{
   if(!R)return;const t=receiptTotals(R),its=rItemsClean(R);
   const tier=R.salesChannel==='retail'?'B':(typeof rTier==='function'?rTier():'B');
   byId('pkgEntryTier').value='ราคาขาย '+tier+(R.salesChannel==='retail'?' (ขายหน้าร้าน)':' (ตามระดับลูกค้า)');
   byId('pkgEntryLines').value=its.length;byId('pkgEntryQty').value=qf(its.reduce((a,it)=>a+n(it.qty),0));
   byId('pkgEntryNet').textContent=money(t.net);byId('pkgEntrySub').textContent=money(t.sub);
  };
  const calcE=window.calcReceipt;window.calcReceipt=function(){const r=calcE.apply(this,arguments);entry();return r;};
 }
 window.PKG_DOC_TOOLBAR={sync,openPay,closePay,tile:toggleTile};
})();

/* ---------- 03 quote window: same layout as the 04 / 4.1 window ----------
   Toolbar + print options once saved, floating side toolbar (close / new / save), titled frames on desktop
   (the mobile accordion sections are reused as frames, so phones keep their fold-out cards) and the three-column
   product entry. Every original button and handler stays; only where it is shown changes. */
(()=>{
 const modal=document.getElementById('mQuoteEdit');if(!modal)return;
 const body=modal.querySelector('.body'),head=modal.querySelector('header .hdr-actions'),$b=id=>document.getElementById(id);
 const saved=()=>typeof Q!=='undefined'&&Q&&Q.no&&DB.quotes.some(x=>x.id===Q.id);
 const bar=document.createElement('div');bar.className='pkg-doc-tools';bar.id='pkg-quote-tools';
 bar.innerHTML=`<fieldset class="pkg-fs"><legend>แถบเครื่องมือ</legend><div class="pkg-tool-grid">
   <button type="button" class="btn pri pkg-tool" data-t="new" hidden>+ สร้างใบเสนอราคาใหม่</button>   <!-- hidden (user 2026-10-11: "เอาปุ่มนี้ออก") — a new quote starts from the side rail "ใบใหม่" or the register -->
   <button type="button" class="btn grn pkg-tool" data-t="cut">ตัดสต็อกสินค้า</button>   <!-- user 2026-10-11: goes to 4.4 with this quote pulled in (or opens its stock-cut document when it has one) -->
   <button type="button" class="btn pkg-tool" data-t="copy">คัดลอกใบนี้</button>
   <button type="button" class="btn pkg-tool" data-t="audit">ตรวจสอบเอกสาร (ประวัติการแก้ไข)</button>
   <button type="button" class="btn pkg-tool pkg-tool-dgr pc-delDoc" data-t="cancel">ยกเลิกเอกสาร</button></div>
   <p class="hint pkg-tool-note">คัดลอกลิงก์แชร์ และส่งอีเมล ต้องใช้ระบบคลาวด์ — ยังไม่มีในเวอร์ชันนี้</p></fieldset>
  <fieldset class="pkg-fs"><legend>พิมพ์ / เงื่อนไขการพิมพ์เอกสาร</legend>
   <div class="grid g2"><label class="f"><span>รหัสสินค้าบนเอกสาร</span><select id="pkg-qprint-code"><option value="code">รหัสสินค้าของอู่ + OEM (ตามเดิม)</option><option value="oem">เฉพาะรหัสอ้างอิง OEM</option><option value="none">ไม่แสดงรหัสสินค้า</option></select></label>
   <label class="f"><span>ข้อมูลสำหรับการชำระเงิน</span><select id="pkg-qprint-bank"></select></label></div>
   <div class="pkg-print-row"><button type="button" class="btn pri pkg-print-main" data-t="print">พิมพ์ใบเสนอราคา (ต้นฉบับ + สำเนา)</button></div>
   <div class="pkg-print-checks"><label><input type="checkbox" id="pkg-qprint-nohead"> ไม่แสดงหัวเอกสาร (ใช้กระดาษหัวจดหมายของร้าน)</label>
    <label><input type="checkbox" id="pkg-qprint-kit"> แสดงรายการอะไหล่ในชุด</label></div>
  </fieldset>`;
 body.prepend(bar);
 /* Header: a plain save button (the quote had none — saving happened through print / approve / send). */
 const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.className='btn pri pkg-q-save';saveBtn.textContent='บันทึก';saveBtn.onclick=()=>saveQuote();
 head.querySelector('[onclick^="closeModal"]')?.before(saveBtn);
 const hdrCopy=head.querySelector('.pkg-quote-copy');
 head.querySelectorAll('[onclick^="newQuote"],[onclick^="copyQuote"],[onclick^="cancelQuoteDoc"],[onclick^="printQuote"]').forEach(b=>b.classList.add('pkg-moved-to-toolbar'));
 const opt=()=>{if(!Q.printOpt)Q.printOpt={code:'code',bank:'',noHead:false};return Q.printOpt;};
 function sync(){
  if(typeof document==='undefined'||!document||typeof Q==='undefined'||!Q)return;   /* a timer after the test window closed */
  const on=!!saved();modal.classList.toggle('pkg-unsaved',!on);bar.hidden=!on;
  if(!on)return;
  const o=opt(),banks=DB.shop.banks||[];
  $b('pkg-qprint-bank').innerHTML='<option value="">ไม่แสดง</option>'+banks.map((b,i)=>`<option value="${i}">${esc(bankLabel(b))}</option>`).join('');
  $b('pkg-qprint-code').value=o.code;$b('pkg-qprint-bank').value=o.bank;$b('pkg-qprint-nohead').checked=!!o.noHead;$b('pkg-qprint-kit').checked=!!Q.kitDetail;
  $b('pkg-qprint-kit').closest('label').hidden=!(Q.items||[]).some(it=>it.type==='kit');
  bar.querySelector('[data-t="copy"]').hidden=!hdrCopy||hdrCopy.hidden;
  bar.querySelector('[data-t="cancel"]').hidden=!!Q.cancelled;
  /* ตัดสต็อกสินค้า: for a quote that has parts and can still be cut, or already has its stock-cut document */
  const cb=bar.querySelector('[data-t="cut"]'),SC=window.PKG_STOCK_CUT;
  if(cb){let show=false,c=null;try{c=SC&&SC.activeCut(Q);show=!!SC&&(!!c||(!Q.cancelled&&!Q.superseded&&SC.qLines(Q).length>0));}catch(e){}
   const may=typeof curEmp!=='function'||!curEmp()||can('m.rcptCut_'+(c?'view':'add'));
   cb.hidden=!show||!may;cb.textContent=c?'เปิดใบตัดสต็อก '+c.no:'ตัดสต็อกสินค้า';}
 }
 /* toolbar "ตัดสต็อกสินค้า": the cut itself still happens in 4.4 (payment / save there) — this only carries the quote over */
 function toCut(){
  const SC=window.PKG_STOCK_CUT;if(!SC||!Q)return;
  const c=SC.activeCut(Q);if(c){closeModal('mQuoteEdit');return SC.open(c.id);}
  if(typeof pkgQuoteDirty==='function'&&pkgQuoteDirty())return toast('บันทึกใบเสนอราคาก่อน แล้วจึงตัดสต็อก');
  if(Q.cancelled)return toast('ใบเสนอราคานี้ถูกยกเลิกแล้ว ตัดสต็อกไม่ได้');
  if(Q.superseded)return toast('ใบนี้ถูกแก้ไขเป็น '+(Q.revisedTo||'ฉบับใหม่')+' แล้ว — ใช้ฉบับล่าสุด');
  if(typeof isApproved==='function'&&!isApproved(Q))return toast('ต้องอนุมัติใบเสนอราคาก่อน จึงจะตัดสต็อกได้');
  const id=Q.id;closeModal('mQuoteEdit');SC.openNew(id);
 }
 bar.addEventListener('change',e=>{
  if(!Q)return;const o=opt();
  if(e.target.id==='pkg-qprint-code')o.code=e.target.value;
  if(e.target.id==='pkg-qprint-bank')o.bank=e.target.value;
  if(e.target.id==='pkg-qprint-nohead')o.noHead=e.target.checked;
  if(e.target.id==='pkg-qprint-kit'){Q.kitDetail=e.target.checked;const k=$b('pkg-quote-kit-detail');if(k)k.checked=Q.kitDetail;}
  if(typeof renderQPrev==='function')renderQPrev();
 });
 bar.addEventListener('click',e=>{
  const t=e.target.closest('[data-t]')?.dataset.t;if(!t)return;
  ({new:()=>newQuote(),cut:()=>toCut(),copy:()=>copyQuote(),audit:()=>openAudit('quote',Q.id),cancel:()=>cancelQuoteDoc(),print:()=>printQuote()})[t]?.();
 });
 ['fillQuoteForm','calcQuote','saveQuote','approveQuote','cancelQuoteDoc'].forEach(name=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(){const r=o.apply(this,arguments);if(r&&typeof r.then==='function')r.then(sync);else sync();return r;};});
 /* Print options applied to the quote sheet (code columns, letterhead, bank box). */
 const sheetO=sheetQuote;
 sheetQuote=function(q){
  const html=sheetO.apply(this,arguments),o=q&&q.printOpt;if(!o)return html;
  const t=document.createElement('template');t.innerHTML=html;
  if(o.noHead)t.content.querySelectorAll('.dochd .brand').forEach(b=>b.style.visibility='hidden');
  const table=[...t.content.querySelectorAll('table')].find(tb=>tb.querySelector('thead th:nth-child(2)')?.textContent.trim()==='รหัสสินค้า');
  if(table&&o.code!=='code'){
   const drop=o.code==='none'?[2,1]:[1],full=table.querySelector('thead tr').children.length;
   table.querySelectorAll('tr').forEach(tr=>{
    if(tr.children.length===full)drop.forEach(i=>tr.children[i].remove());
    else{const c=tr.children[0];if(c&&c.colSpan>1)c.colSpan=Math.max(1,c.colSpan-drop.length);}
   });
  }
  const bank=o.bank!==''&&(DB.shop.banks||[])[+o.bank];
  if(bank&&table){const box=document.createElement('div');box.className='box';box.style.cssText='padding:4px 6px;margin-top:6px';box.innerHTML='<span class="lbl">ข้อมูลสำหรับการชำระเงิน</span> โอนเข้าบัญชี <b>'+esc(bankLabel(bank))+'</b>';table.after(box);}
  return t.innerHTML;
 };
 /* Floating side toolbar — the same three buttons as the 04 window. */
 const icon={close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  add:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg>',
  save:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'};
 const side=document.createElement('div');side.className='pkg-side-tools';side.setAttribute('role','toolbar');side.setAttribute('aria-label','เครื่องมือเอกสาร');
 side.innerHTML=`<div class="pkg-side-group"><button type="button" class="pkg-side-btn s-close" data-s="close" title="ปิดหน้าต่าง" aria-label="ปิดหน้าต่าง">${icon.close}</button>
  <button type="button" class="pkg-side-btn s-new" data-s="new" title="สร้างเอกสารใหม่" aria-label="สร้างเอกสารใหม่">${icon.add}</button>
  <button type="button" class="pkg-side-btn s-save" data-s="save" title="บันทึก" aria-label="บันทึก">${icon.save}</button></div>`;
 modal.append(side);
 side.addEventListener('click',e=>{
  const s=e.target.closest('[data-s]')?.dataset.s;if(!s)return;
  if(s==='close'){closeModal('mQuoteEdit');if(typeof renderQuoteOverview==='function')renderQuoteOverview();return;}
  if(s==='new')return newQuote();
  if(s==='save')return saveQuote();
 });
 /* Frames: the accordion titles double as frame titles on desktop; titles repeated inside a frame are hidden. */
 const secs=[...body.querySelectorAll(':scope > .msec')];secs.forEach(s=>s.classList.add('pkg-qsec'));
 const probTitle=secs[1]?.querySelector('.msec-b > div[style*="font-weight:600"]');if(probTitle)probTitle.classList.add('pkg-sec-oldtitle');
 /* Product entry in three columns: sale info (the original price-tier select moves here) · entry · totals. */
 const pRoot=$b('pkg-quote-products'),prodSec=pRoot?.closest('.pkg-product-section'),tier=$b('qTier');
 if(pRoot&&prodSec){
  const grid3=document.createElement('div');grid3.className='pkg-entry3';pRoot.before(grid3);
  const info=document.createElement('fieldset');info.className='pkg-fs pkg-entry-col';
  info.innerHTML=`<legend>ข้อมูลการขาย</legend><label class="f pkg-tier-slot"><span>ระดับราคาขาย</span></label>
   <label class="f"><span>จำนวนรายการรวม</span><div class="pkg-unit"><input id="pkgQEntryLines" readonly><em>รายการ</em></div></label>
   <label class="f"><span>จำนวนสินค้าทั้งสิ้น</span><div class="pkg-unit"><input id="pkgQEntryQty" readonly><em>หน่วย</em></div></label>`;
  if(tier){const row=tier.closest('.row');info.querySelector('.pkg-tier-slot').append(tier);row?.classList.add('pkg-q-itemrow');row?.querySelector('b')?.classList.add('pkg-sec-oldtitle');}
  const tot=document.createElement('fieldset');tot.className='pkg-fs pkg-entry-col';
  tot.innerHTML=`<legend>ข้อมูลยอดเงินรวมทั้งหมด</legend><div class="pkg-entry-tot"><span>รวมเป็นเงิน (ก่อนส่วนลด / ภาษี)</span><b id="pkgQEntrySub">0.00</b></div><div class="pkg-entry-tot"><span>ยอดรวมสุทธิ (รวม VAT)</span><b id="pkgQEntryNet">0.00</b></div>`;
  pRoot.classList.add('pkg-fs','pkg-entry-col','pkg-entry-mid');
  const lg=document.createElement('legend');lg.textContent='การนำเข้าสินค้า';pRoot.prepend(lg);
  const line=t=>{const d=document.createElement('div');d.className='pkg-line-title';d.innerHTML=`<span>${t}</span>`;return d;};
  const quick=pRoot.querySelector('.pkg-product-quick:not(.pkg-kit-quick)'),kit=pRoot.querySelector('.pkg-kit-quick');
  if(quick)quick.before(line('สินค้า'));if(kit)kit.before(line('ชุดอะไหล่ซ่อมบำรุง'));
  grid3.append(info,pRoot,tot);
  const entry=()=>{
   if(typeof Q==='undefined'||!Q)return;const t=quoteTotals(Q),its=qItemsClean(Q);
   $b('pkgQEntryLines').value=its.length;$b('pkgQEntryQty').value=qf(its.reduce((a,it)=>a+n(it.qty),0));
   $b('pkgQEntryNet').textContent=money(t.total);$b('pkgQEntrySub').textContent=money(t.sub);
  };
  const calcE=window.calcQuote;window.calcQuote=function(){const r=calcE.apply(this,arguments);entry();return r;};
 }
 /* Customer address (from the customer record, read-only here — edit it in the customer menu). */
 const vehInfo=$b('qVehInfo');
 if(vehInfo){
  const adr=document.createElement('div');adr.className='grid pkg-q-addr';
  adr.innerHTML=`<label class="f"><span>ที่อยู่ลูกค้า</span><input type="text" id="pkgQAddr" readonly placeholder="— เลือกลูกค้าเพื่อแสดงที่อยู่ —"></label>
   <label class="f"><span>เบอร์โทรลูกค้า</span><input type="text" id="pkgQTel" readonly></label>
   <label class="f"><span>เลขประจำตัวผู้เสียภาษี (สาขา)</span><input type="text" id="pkgQTax" readonly></label>`;
  vehInfo.before(adr);
  const addr=()=>{
   const c=typeof Q!=='undefined'&&Q&&findCust(Q.custId||$b('qCust').value),a=$b('pkgQAddr'),t=$b('pkgQTax');
   const line=c&&c.addr?addrLine(c.addr):'';
   a.value=c?(line&&line!=='-'?line:'ยังไม่มีที่อยู่ในข้อมูลลูกค้า'):'';a.title=a.value;
   t.value=c?((c.tax||'-')+(c.branch?' ('+c.branch+')':'')):'';
   $b('pkgQTel').value=c?(c.tel||c.phone||'-'):'';
  };
  const fvO=window.fillVehSelect;if(typeof fvO==='function')window.fillVehSelect=function(){const r=fvO.apply(this,arguments);addr();return r;};
 }
 window.PKG_QUOTE_TOOLBAR={sync};
})();

/* 03 / 04 document windows (user 2026-10-09): the header "ปิด" becomes ✕ (same handler), and a second save button sits at
   the bottom right of the form — it presses the header save button, so every check, the receipt's "บันทึกแล้ว" state and
   the rights (pc-rIssue) stay exactly those of the header button, which it mirrors. */
[['mQuoteEdit','.pkg-q-save'],['mReceiptEdit','#rSaveBtn']].forEach(([mid,sel])=>{
 const m=document.getElementById(mid),hd=m&&m.querySelector('header .hdr-actions'),body=m&&m.querySelector('.body');if(!hd||!body)return;
 const close=[...hd.querySelectorAll('button')].find(b=>b.textContent.trim()==='ปิด');
 if(close){close.textContent='✕';close.title='ปิด';close.setAttribute('aria-label','ปิด');close.classList.add('pkg-x-close');}
 const top=hd.querySelector(sel);if(!top)return;
 const foot=document.createElement('div');foot.className='pkg-foot-save';
 const b=document.createElement('button');b.type='button';b.onclick=()=>top.click();foot.append(b);body.append(foot);
 const mirror=()=>{b.className=top.className.replace(/\bpkg-q-save\b/,'').trim()+' pkg-foot-btn';b.textContent=top.textContent;b.title=top.title||'';b.disabled=top.disabled;b.hidden=top.hidden;};
 new MutationObserver(mirror).observe(top,{attributes:true,childList:true,characterData:true,subtree:true});mirror();
});

/* Side buttons, design B (user 2026-10-09, mockups/doc-tools-options.html): the floating icon column becomes a row of tabs
   fixed to the window's right edge — icon with its name underneath, บันทึก first. Same buttons, same handlers, same
   hidden / disabled rules; only the look and the place change. Used by 03, 04 and 4.4. */
(()=>{
 const LBL={'s-save':'บันทึก','s-pay':'ชำระเงิน','s-new':'ใบใหม่','s-print':'พิมพ์','s-up':'ขึ้นบนสุด','s-down':'ลงล่างสุด','s-close':'ปิด'};
 function attach(mid){
  const m=document.getElementById(mid),side=m&&m.querySelector('.pkg-side-tools');if(!side)return;side.classList.add('pkg-rail');
  side.querySelectorAll('.pkg-side-btn').forEach(b=>{const k=Object.keys(LBL).find(c=>b.classList.contains(c));
   if(k&&!b.querySelector('.pkg-rail-lbl'))b.insertAdjacentHTML('beforeend','<span class="pkg-rail-lbl">'+LBL[k]+'</span>');});
  /* left: on the window's right edge · top: centred on the part of the window that is on screen (a short window — e.g.
     นัดหมายลูกค้า — keeps its buttons beside it instead of hanging below; a long one keeps them mid-screen as before) */
  const place=()=>{if(!m.classList.contains('on'))return;const sh=m.querySelector(':scope>.sheet');if(!sh)return;
   const r=sh.getBoundingClientRect();if(!r.width)return;side.style.left=Math.round(r.right-1)+'px';
   const h=side.offsetHeight,vt=Math.max(r.top,8),vb=Math.min(r.bottom,innerHeight-8);
   let top=(vt+vb)/2-h/2;top=Math.min(Math.max(top,vt+8),vb-h-8);top=Math.max(8,Math.min(top,innerHeight-h-8));
   side.style.top=Math.round(top)+'px';side.style.transform='none';};
  m.addEventListener('scroll',place,{passive:true});
  new MutationObserver(()=>{setTimeout(place,0);setTimeout(place,350);}).observe(m,{attributes:true,attributeFilter:['class']});   /* timers, not rAF (paused in hidden tabs); again after the opening animation */
  window.addEventListener('resize',place);place();
 }
 ['mQuoteEdit','mReceiptEdit','mSale'].forEach(attach);
 window.PKG_RAIL={attach,LBL};
})();

/* Every other window gets the 04 width and side buttons of its own (user 2026-10-09: "ให้มีความกว้างและเครื่องมือเหมือนใน
   หมวด 4.1" · "สร้างปุ่มเครื่องมือในหมวดอื่นๆ ตามหน้านั้นๆ … พวกปุ่มพิมพ์ไม่ต้องทำ"). The rail holds only window-level
   actions — ปิด · ใบใหม่ · บันทึก — and each one presses the window's own button, so every category keeps its own rules
   and rights; a rail button shows only while the window offers that button. Printing is NOT on the rail: like 04, a
   "พิมพ์เอกสาร" box appears in the page once the document is saved (the original print button, moved there).
   Older document windows: ปิด becomes ✕, ใบใหม่ leaves the header, a second save sits at the bottom right like 4.1.
   07 โอนสินค้า / เคลมลูกค้า: their action row already shows print after saving. Forms / reports: footer buttons. */
(()=>{
 if(!window.PKG_RAIL)return;
 const IC={close:'<path d="M6 6l12 12M18 6L6 18"/>',new:'<path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/>',save:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};
 const own=(m,b)=>b&&!b.closest('.pkg-side-tools,.pkg-foot-save,.pkg-print-box');
 const hb=(m,re)=>[...m.querySelectorAll('header button')].find(b=>re.test(b.getAttribute('onclick')||''));
 const HEAD=()=>({save:m=>hb(m,/^save/),new:m=>hb(m,/^new/),print:m=>hb(m,/^print/),close:m=>[...m.querySelectorAll('header button')].find(b=>b.textContent.trim()==='ปิด'||b.classList.contains('pkg-x-close'))});
 const ROW=(attr,newBtn)=>({save:m=>m.querySelector(`[data-${attr}="save"]`),close:m=>m.querySelector(`.body [data-${attr}="close"],footer [data-${attr}="close"]`)||m.querySelector(`[data-${attr}="close"]:not(.pkg-mx)`)||m.querySelector(`[data-${attr}="close"]`),new:()=>document.getElementById(newBtn)});
 /* forms and report windows: buttons found by what they say / do */
 const FORM=id=>({
  save:m=>[...m.querySelectorAll('button')].find(b=>own(m,b)&&/^(✓\s*)?บันทึก/.test(b.textContent.trim())&&!/พิมพ์/.test(b.textContent)),
  new:m=>[...m.querySelectorAll('button')].find(b=>own(m,b)&&(/^new/.test(b.getAttribute('onclick')||'')||/^(\+\s*)?สร้าง(ใบ|ข้อมูล)ใหม่$/.test(b.textContent.trim()))),
  close:m=>[...m.querySelectorAll('button')].find(b=>own(m,b)&&(/^(ปิด|ปิดหน้าต่าง|ยกเลิก|✕)$/.test(b.textContent.trim()))&&new RegExp("closeModal\\('"+id+"'\\)|^$").test(b.getAttribute('onclick')||''))
   ||[...m.querySelectorAll('button')].find(b=>own(m,b)&&new RegExp("closeModal\\('"+id+"'\\)").test(b.getAttribute('onclick')||''))});
 const WIN={mGREdit:HEAD(),mClaimEdit:HEAD(),mBillingEdit:HEAD(),mInvoiceEdit:HEAD(),mIssueEdit:HEAD(),mCountEdit:HEAD(),mMove:ROW('m','mvNew'),mCClaim:ROW('c','ccNew')};
 const FORMS=['mCutPick','mGRHist','mMoveRep','mCard','mBill','mEmp','mDocs','mAudit','mAsset','mPermSummary','mApvList','mVen','mCust','mCrm','mHr','mExp','mStockSet','mStock','mPartPay','mPayHist','mPartsKit'];
 FORMS.forEach(id=>{WIN[id]=FORM(id);});
 const savedOf=mid=>{const w=window.PKG_BRANCH_WINDOW&&PKG_BRANCH_WINDOW.wins[mid];try{return !!(w&&w.saved&&w.saved());}catch(e){return false;}};
 const run=()=>Object.entries(WIN).forEach(([mid,find])=>{
  const m=document.getElementById(mid);if(!m||m.querySelector('.pkg-side-tools'))return;
  m.classList.add('pkg-docwin');
  /* header tidy (older document windows) */
  const hc=find.close(m);if(hc&&hc.closest('header')&&hc.textContent.trim()==='ปิด'){hc.textContent='✕';hc.title='ปิด';hc.setAttribute('aria-label','ปิด');hc.classList.add('pkg-x-close');}
  const hn=find.new(m);if(hn&&hn.closest('header'))hn.classList.add('pkg-moved-to-toolbar');
  /* print: out of the header, into the page once saved (like 04) */
  const hp=find.print&&find.print(m),body=m.querySelector('.body');let pbox=null;
  if(hp&&body){hp.classList.add('pkg-moved-to-toolbar');
   pbox=document.createElement('fieldset');pbox.className='pkg-fs pkg-print-box';pbox.hidden=true;
   pbox.innerHTML='<legend>พิมพ์เอกสาร</legend><div class="pkg-print-row"><button type="button" class="btn pri pkg-print-main"></button><span class="hint">พิมพ์ได้หลังบันทึกเอกสารแล้ว</span></div>';
   const pb=pbox.querySelector('button');pb.textContent='พิมพ์'+(m.querySelector('header h2')?.textContent.trim().replace(/\s*\/.*$/,'')||'เอกสาร');pb.onclick=()=>hp.click();
   [...hp.classList].filter(c=>/^pc-/.test(c)).forEach(c=>pb.classList.add(c));body.prepend(pbox);}
  const keys=['close','new','save'].filter(k=>find[k]);
  const side=document.createElement('div');side.className='pkg-side-tools';side.setAttribute('role','toolbar');side.setAttribute('aria-label','เครื่องมือ');
  side.innerHTML='<div class="pkg-side-group">'+keys.map(k=>`<button type="button" class="pkg-side-btn s-${k}" data-r="${k}" title="${PKG_RAIL.LBL['s-'+k]}" aria-label="${PKG_RAIL.LBL['s-'+k]}"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg></button>`).join('')+'</div>';
  m.append(side);
  side.addEventListener('click',e=>{const k=e.target.closest('[data-r]')?.dataset.r;if(!k)return;const t=find[k](m);
   if(t&&!t.disabled)t.click();else if(k==='close'&&!t)closeModal(mid);   /* a window with no close button of its own */
   if(k==='save')setTimeout(sync,300);});
  /* show a rail button only while its window button is there (rights classes copied, hidden / disabled mirrored) */
  const sync=()=>{side.querySelectorAll('[data-r]').forEach(r=>{const k=r.dataset.r,t=find[k](m);
    const h=k==='close'?false:(!t||t.hidden||(k!=='new'&&!t.closest('header')&&!t.offsetParent&&m.classList.contains('on'))),d=!!(t&&t.disabled);   /* ใบใหม่ = the register's + button, behind the window */
    if(r.hidden!==h)r.hidden=h;if(r.disabled!==d)r.disabled=d;
    if(t)[...t.classList].filter(c=>/^pc-/.test(c)&&!r.classList.contains(c)).forEach(c=>r.classList.add(c));});
   if(pbox){const h=!savedOf(mid)||hp.hidden;if(pbox.hidden!==h)pbox.hidden=h;}};
  new MutationObserver(recs=>{if(recs.every(r=>side.contains(r.target)||(pbox&&pbox.contains(r.target))))return;setTimeout(sync,0);}).observe(m,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','class','value']});   /* its own changes ignored (no loop) */
  /* a second save at the bottom right, like 4.1 (older document windows: the header save) */
  const hs=find.save(m);
  if(hs&&hs.closest('header')&&body&&!body.querySelector('.pkg-foot-save')){
   const foot=document.createElement('div');foot.className='pkg-foot-save';const b=document.createElement('button');b.type='button';b.onclick=()=>{hs.click();setTimeout(sync,300);};foot.append(b);body.append(foot);
   const mirror=()=>{b.className=hs.className.trim()+' pkg-foot-btn';b.textContent=hs.textContent;b.title=hs.title||'';b.disabled=hs.disabled;b.hidden=hs.hidden;};
   new MutationObserver(mirror).observe(hs,{attributes:true,childList:true,characterData:true,subtree:true});mirror();}
  if(hs&&hs.closest('header'))hs.addEventListener('click',()=>setTimeout(sync,300));
  PKG_RAIL.attach(mid);sync();
 });
 /* after every script has run: 07 โอนสินค้า / เคลมลูกค้า windows are built by later modules; 4.4 only takes the width */
 const all=()=>{run();document.getElementById('mSale')?.classList.add('pkg-docwin');};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(all,0));else setTimeout(all,0);
})();

/* 06 ใบรับสินค้า (owner 12 Oct): the register loses its "จัดการ" column — "คัดลอก" and "ยกเลิก" move INTO the document's
   own window as a "แถบเครื่องมือ" box like the quote window's (คัดลอกใบนี้ · ยกเลิกเอกสาร). They call the original
   copyGR(id) / cancelGR(id) unchanged: same rights, same cancel-period rule, same questions. The original row code is
   untouched — its action cell is taken out of the drawn row (and the header cell out of the table, here, before
   row-number.js / reg-layout.js look at the columns). A row is opened by its document number, as before (also on a phone card). */
(()=>{
 const tbl=document.getElementById('grTbl'),M=document.getElementById('mGREdit');
 if(!tbl||!M||typeof renderGRList!=='function'||typeof copyGR!=='function'||typeof cancelGR!=='function')return;
 const th=[...tbl.querySelectorAll('thead th')].find(h=>/^จัดการ/.test(h.textContent.trim()));if(th)th.remove();
 const strip=()=>{tbl.querySelectorAll('tbody td').forEach(td=>{if(td.querySelector('[onclick^="copyGR("]'))td.remove();});};
 /* "ใบกำกับผู้ขาย" has no column of its own any more (owner 12 Oct, the register has to fit 1165px at 1440): the number is a
    small grey second line under "เลขที่" ("ใบกำกับ IV-693907"; nothing when empty) — the look of the certificate number in
    4.4. The search box reads the record, so it still finds it; Excel / PDF keep it as its own column (extend below); on a
    phone card the line is drawn as a field of its own. Header cell and sort key go here, before the quantity column and
    before row-number.js / reg-layout.js read the columns. */
 const IVL='ใบกำกับผู้ขาย',ivTh=[...tbl.querySelectorAll('thead th')].find(h=>h.textContent.trim()===IVL),ivAt=ivTh?ivTh.cellIndex:-1;
 if(ivTh){ivTh.remove();
  if(typeof SORT_DEF==='object'&&SORT_DEF.grTbl&&SORT_DEF.grTbl.cols&&!SORT_DEF.grTbl.pkgInv){const c={};Object.keys(SORT_DEF.grTbl.cols).forEach(k=>{if(+k===ivAt)return;c[+k>ivAt?+k-1:+k]=SORT_DEF.grTbl.cols[k];});
   SORT_DEF.grTbl.cols=c;SORT_DEF.grTbl.pkgInv=1;}}
 /* the column "จำนวนรายการ / จำนวนสินค้า" (owner 12 Oct): lines / total quantity of the document, e.g. "1 / 2", right after
    "ผู้ขาย". No register had this combined column yet — the header uses the two-part look of the 4.1 register (top text
    over a thin rule), Excel / PDF get the two numbers as two columns (like "รายการ" + "จำนวนรวม" of 07 โอนสินค้า). The
    header cell, its sort key and the phone-card numbers are put in here, before row-number.js / reg-layout.js read them. */
 const QL='จำนวนรายการ / จำนวนสินค้า',heads=()=>[...tbl.tHead.rows[0].cells];
 const venTh=heads().find(h=>h.textContent.trim()==='ผู้ขาย'),at=venTh?heads().indexOf(venTh)+1:-1;
 const linesOf=p=>typeof grItemsClean==='function'?grItemsClean(p):((p&&p.items)||[]),qtyOf=p=>linesOf(p).reduce((a,it)=>a+n(it.qty),0);
 if(at>0){
  const q=document.createElement('th');q.className='ctr pkg-gr-qty';q.style.width='112px';q.innerHTML='จำนวนรายการ<div class="pkg-sa-sub">จำนวนสินค้า</div>';q.dataset.lbl=QL;venTh.after(q);
  if(typeof SORT_DEF==='object'&&SORT_DEF.grTbl&&SORT_DEF.grTbl.cols&&!SORT_DEF.grTbl.pkgQty){const c={};Object.keys(SORT_DEF.grTbl.cols).forEach(k=>{c[+k>=at?+k+1:+k]=SORT_DEF.grTbl.cols[k];});
   c[at]={lbl:QL,key:x=>linesOf(x).length*1e7+qtyOf(x)};SORT_DEF.grTbl.cols=c;SORT_DEF.grTbl.pkgQty=1;}
  if(typeof MC_CFG==='object'&&MC_CFG.grTbl)MC_CFG.grTbl=Object.assign({},MC_CFG.grTbl,{act:99});   /* no action cell any more (99 = none; row-number.js adds 1) */
 }
 const recOf=tr=>{const m=/openGRById\('([^']+)'\)/.exec((tr.querySelector('.docno')||{getAttribute(){return '';}}).getAttribute('onclick')||'');return m&&(DB.purchases||[]).find(x=>x.id===m[1]);};
 function foldInv(){
  if(ivAt<0)return;
  [...tbl.tBodies[0].rows].forEach(tr=>{if(tr.dataset.pkgInv)return;const dn=tr.querySelector('.docno'),first=dn&&dn.closest('td'),p=recOf(tr);if(!first||!p)return;
   const td=tr.cells[first.cellIndex+ivAt];if(!td||td.classList.contains('pkg-gr-qty'))return;   /* the drawn cell of the old column: ivAt cells after "เลขที่" */
   td.remove();tr.dataset.pkgInv='1';first.dataset.xv2=p.inv||'';
   if(p.inv)first.insertAdjacentHTML('beforeend','<div class="hint pkg-gr-inv" title="'+IVL+'"><span class="pkg-gr-invl">ใบกำกับ</span><span class="pkg-gr-invf">'+IVL+'</span> <span class="pkg-gr-invn" data-no-translate>'+esc(p.inv)+'</span></div>');});
 }
 function addQty(){
  if(at<=0)return;const qh=tbl.tHead.querySelector('th.pkg-gr-qty');if(qh)qh.dataset.lbl=QL;const pos=qh?[...tbl.tHead.rows[0].cells].indexOf(qh):-1;if(pos<0)return;
  [...tbl.tBodies[0].rows].forEach(tr=>{if(tr.querySelector('td.pkg-gr-qty'))return;const p=recOf(tr),prev=tr.cells[pos-1];if(!p||!prev)return;
   const td=document.createElement('td');td.className='ctr pkg-gr-qty';const k=linesOf(p).length,qy=qtyOf(p);td.dataset.xv=String(k);td.dataset.xv2=String(Math.round(qy*100)/100);td.textContent=k+' / '+qf(qy);prev.after(td);});
 }
 /* widths saved in 11.1 for the old columns (with "จัดการ") would land on the wrong columns: this register goes back to automatic widths once */
 const layoutMig=()=>{try{const rc=DB.regCols&&DB.regCols.grTbl;if(rc&&Array.isArray(rc.cols)&&rc.cols.some(l=>/^จัดการ/.test(String(l).trim())||String(l).trim()===IVL))delete DB.regCols.grTbl;}catch(e){}};
 const r0=renderGRList;renderGRList=window.renderGRList=function(){layoutMig();const out=r0.apply(this,arguments);try{strip();foldInv();addQty();if(typeof mkCards==='function')mkCards('grTbl');}catch(e){}return out;};
 /* Excel / PDF: two columns, two numbers; and "ใบกำกับผู้ขาย" as its own column at its old place (before "ครบกำหนด") */
 setTimeout(()=>{const X=window.PKG_REG_EXPORT;if(!X)return;const prev=X.extend;X.extend=function(id,d,body){
  d=typeof prev==='function'?prev.apply(this,arguments):d;if(id!=='grTbl'||!d||!Array.isArray(d.cols))return d;
  const k=d.cols.findIndex(c=>c.i>=0&&body[0]&&body[0].cells[c.i]&&body[0].cells[c.i].classList.contains('pkg-gr-qty'));
  if(k>=0){const ci=d.cols[k].i;
   d.cols.splice(k,1,{i:ci,l:'จำนวนรายการ',num:true},{i:-4,l:'จำนวนสินค้า',num:true});
   d.rows.forEach((r,j)=>{const td=body[j]&&body[j].cells[ci];r.splice(k,1,td?td.dataset.xv||'':'',td?td.dataset.xv2||'':'');});(d.foot||[]).forEach(r=>r.splice(k,1,'',''));}
  if(ivAt>=0&&!d.cols.some(c=>c.l===IVL)){
   const firstOf=tr=>{const dn=tr&&tr.querySelector('.docno');return dn?dn.closest('td'):null;};
   const nk=d.cols.findIndex(c=>c.i>=0&&body[0]&&body[0].cells[c.i]===firstOf(body[0]));
   if(nk>=0)d.rows.forEach((r,j)=>{const td=firstOf(body[j]);if(!td)return;const c=td.cloneNode(true);c.querySelectorAll('.pkg-gr-inv').forEach(x=>x.remove());r[nk]=X.cellText(c);});   /* the number cell without its second line */
   let at2=d.cols.findIndex(c=>c.l==='ครบกำหนด');if(at2<0)at2=d.cols.length;
   d.cols.splice(at2,0,{i:-5,l:IVL,num:false});
   d.rows.forEach((r,j)=>{const td=firstOf(body[j]);r.splice(at2,0,(td&&td.dataset.xv2)||'');});(d.foot||[]).forEach(r=>r.splice(at2,0,''));}
  return d;};},0);
 /* the toolbar box of the window */
 const body=M.querySelector('.body')||M.querySelector('.panel');
 const bar=document.createElement('div');bar.className='pkg-doc-tools';bar.id='pkg-gr-tools';   /* no class "pkg-gr-tools": that name is the 06 register's filter row (fixed grid rows in biz-design.css) and broke this box's layout */
 bar.hidden=true;
 bar.innerHTML=`<fieldset class="pkg-fs"><legend>แถบเครื่องมือ</legend><div class="pkg-tool-grid">
   <button type="button" class="btn pkg-tool" data-t="copy" title="คัดลอกรายการทั้งใบไปสร้างใบใหม่">คัดลอกใบนี้</button>
   <button type="button" class="btn pkg-tool pkg-tool-dgr pc-delDoc" data-t="cancel">ยกเลิกเอกสาร</button></div></fieldset>`;
 const cur=()=>{try{return (0,eval)('G');}catch(e){return null;}};
 const saved=g=>!!(g&&g.no&&(DB.purchases||[]).some(x=>x.id===g.id));
 function sync(){
  const g=cur(),ok=saved(g);if(body&&bar.parentElement!==body)body.prepend(bar);else if(body&&body.firstElementChild!==bar)body.prepend(bar);
  const pb=body&&body.querySelector(':scope>.pkg-print-box');if(pb)bar.append(pb);            /* the window's print box sits beside it, like 03 / 04 */
  bar.classList.toggle('one',!bar.querySelector('.pkg-print-box'));
  bar.hidden=!ok;if(!ok)return;
  bar.querySelector('[data-t="cancel"]').hidden=!!g.cancelled||!(can('doc.cancelDoc')&&can('doc.delDoc'));
 }
 bar.addEventListener('click',async e=>{const t=e.target.closest('[data-t]')?.dataset.t,g=cur();if(!t||!saved(g))return;
  if(t==='copy')return copyGR(g.id);                         /* the window then shows the new unsaved copy, as today */
  if(t==='cancel'){await cancelGR(g.id);const now=cur();if(now&&now.id===g.id&&now.cancelled&&typeof fillGRForm==='function')fillGRForm();sync();}});
 ['fillGRForm','renderApvBars'].forEach(fn=>{const o=window[fn];if(typeof o!=='function')return;window[fn]=function(){const out=o.apply(this,arguments);try{sync();}catch(e){}return out;};});
 try{fillGRForm=window.fillGRForm;renderApvBars=window.renderApvBars;}catch(e){}
 if(body)body.prepend(bar);
 window.PKG_GR_TOOLS={sync,strip,foldInv,addQty,layoutMig};
})();
