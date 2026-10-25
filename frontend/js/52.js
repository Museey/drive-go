/* ระบบขายแบบใหม่ · phase 3 — the receipt (SALE-FLOW-TECH.md §4.1 sale-docs.js, phase 3 part only).
   · A receipt = ONE payment record of a sale's ledger record (LED.payments[], `reNo`). sheetSaleReceipt(sale, payment)
     builds the A4 sheet (A4 only — owner 12 Oct) on the program's own print pipeline (sheetTop → printDocs): references,
     customer, the sale's lines and totals (adjustments included), a payment box with one line per method, the money of
     THIS receipt, the withholding line, earlier receivings / cumulative / remaining for an instalment, amount in words =
     the money of this receipt, stamp ชำระแล้ว / ชำระบางส่วน / ยกเลิกแล้ว. One receipt number shared by a settlement over
     several sales (reShare) lists each bill instead of the lines.
   · #mSaleRcpt — the receipt window: what was received, how, by whom, when; พิมพ์ (A4) · ยกเลิกการรับชำระ (right 04.1
     cancel + the account's cancel period + reason, in PKG_SALE.cancelPayment).
   · The old receipt window (#mReceiptEdit) is READ-ONLY for a ledger record while the switch is on (class pkg-rcpt-ro):
     no payment form, no save, fields locked, a note. Legacy receipts open and print as before.
   · "+ สร้างใบเสร็จรับเงินใหม่" on 4.1 goes to a new sale while the switch is on (the function newReceipt stays).
   Later phases add here: menu 04 order, the 4.2 / 4.3 / 4.4 registers, the invoice sheets. */
(()=>{
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT;if(!S||!SC||typeof sheetTop!=='function')return;
 const $i=id=>document.getElementById(id),on=()=>S.on(),r2=v=>Math.round(n(v)*100)/100;
 const PMT={cash:'เงินสด',trans:'เงินโอน',card:'บัตร',check:'เช็ค'};
 const saleById=id=>SC.list().find(x=>x.id===id)||null;
 const find=(saleId,payId)=>{const c=saleById(saleId),L=c&&S.led(c),p=L&&(L.payments||[]).find(x=>x.id===payId);return p?{c,L,p}:null;};
 /* every active receiving of the sale up to and including this one */
 function upTo(L,p){const list=(L.payments||[]).filter(x=>!x.cancelled||x===p),ix=list.indexOf(p),before=list.slice(0,Math.max(0,ix)).filter(x=>!x.cancelled);
  const prev=r2(before.reduce((a,x)=>a+n(x.amt),0)),wprev=r2(before.reduce((a,x)=>a+n(x.wht&&x.wht.amt),0));return {prev,wprev,n:before.length};}
 function info(c,p){
  const L=S.led(c),t=receiptTotals(L),ro=p.reNo?S.receiptOf(p.reNo):null,parts=ro?ro.parts.filter(x=>!!x.pay.cancelled===!!p.cancelled):[{led:L,sale:c,pay:p}];
  const shared=parts.length>1,money1=shared?r2(parts.reduce((a,x)=>a+n(x.pay.amt),0)):r2(p.amt),wht=shared?r2(parts.reduce((a,x)=>a+n(x.pay.wht&&x.pay.wht.amt),0)):r2(p.wht&&p.wht.amt);
  const u=upTo(L,p),cum=r2(u.prev+n(p.amt)),rem=Math.max(0,r2(t.gross-u.wprev-n(p.wht&&p.wht.amt)-cum));
  const allPaid=parts.every(x=>x.sale&&S.stat(x.sale).k==='paid');
  return {L,t,parts,shared,money:money1,wht,prev:u.prev,cum,rem,instal:u.n>0||rem>0.005,stamp:p.cancelled?'ยกเลิกแล้ว':(shared?allPaid:rem<=0.005)?'ชำระแล้ว':'ชำระบางส่วน'};
 }
 const methodLines=p=>{const ms=p.methods&&p.methods.length?p.methods:(p.method?[{k:p.method,amt:p.amt,bank:p.bank,ref:p.ref,card4:p.card4,chkDate:p.chkDate}]:[]),out=[];
  ms.forEach(m=>{
   if(m.k==='cash')out.push(['เงินสด',n(m.given)>0?'รับมา '+money(m.given)+' บาท · ทอน '+money(m.change)+' บาท':'',m.amt]);
   else if(m.k==='trans'){const tl=(p.transLines||[]).filter(l=>n(l.amt)>0);
    if(tl.length)tl.forEach(l=>out.push(['เงินโอน',[l.bank,l.when,l.ref?'อ้างอิง '+l.ref:''].filter(Boolean).join(' · '),l.amt]));else out.push(['เงินโอน',[p.bank,p.ref].filter(Boolean).join(' · '),m.amt]);}
   else if(m.k==='card')out.push(['บัตร'+(m.type==='debit'?'เดบิต':'เครดิต'),[m.bank,m.card4?'เลขท้าย '+m.card4:'',m.ref?'เลขอนุมัติ '+m.ref:''].filter(Boolean).join(' · '),r2(n(m.amt)+n(m.fee))]);   /* DriveGo (task 3.5, F3): what was swiped */
   else if(m.k==='check')out.push(['เช็ค',[m.bank,m.ref?'เลขที่ '+m.ref:'',m.chkDate?'ลงวันที่ '+thDate(m.chkDate):''].filter(Boolean).join(' · '),m.amt]);
   else out.push([PMT[m.k]||'ไม่ระบุวิธี','',m.amt]);});
  if(!out.length&&n(p.amt)>0)out.push(['ไม่ระบุวิธี',p.note||'',p.amt]);
  return out;};
 /* DriveGo new system (task 3.5, R8-ข): each bill's payment holds only its own share of a settlement's methods (47.js) — a receipt
    shared by several bills shows the methods of all of them, added up (transfer lines by their number, cards by card) */
 function paidBy(I,p){
  if(!I.shared)return p;const ms=[],ls=[],sum=q=>r2((q.methods||[]).reduce((a,m)=>a+n(m.amt),0));
  if(I.parts.every(x=>Math.abs(sum(x.pay)-n(x.pay.payTotal))<0.01&&Math.abs(n(x.pay.amt)-n(x.pay.payTotal))>0.01))return p;   /* recorded before: every bill holds the whole settlement */
  I.parts.forEach(x=>{const q=x.pay;(q.methods&&q.methods.length?q.methods:[{k:q.method,amt:q.amt,bank:q.bank,ref:q.ref,card4:q.card4,chkDate:q.chkDate}]).forEach(m=>{
    const key=[m.k,m.bank,m.card4,m.ref,m.chkDate].join('|'),o=ms.find(z=>z.key===key);
    if(o){o.amt=r2(o.amt+n(m.amt));if(n(m.fee))o.fee=r2(n(o.fee)+n(m.fee));}else ms.push(Object.assign({},m,{key,amt:r2(m.amt)}));});
   (q.transLines||[]).forEach(l=>{const o=ls.find(z=>z.no===l.no&&z.bank===l.bank&&z.ref===l.ref);if(o)o.amt=r2(o.amt+n(l.amt));else ls.push(Object.assign({},l,{amt:r2(l.amt)}));});});
  return Object.assign({},p,{methods:ms,transLines:ls});
 }
 /* a card surcharge (F3 = ก): not income — shown as its own line; the receipt's total is what the customer paid */
 const feeOf=q=>r2((q.methods||[]).reduce((a,m)=>a+(m.k==='card'?n(m.fee):0),0));
 const feeLbl=q=>{const cs=(q.methods||[]).filter(m=>m.k==='card'&&n(m.fee)>0);return 'ค่าธรรมเนียมบัตร'+(cs.every(m=>m.type==='debit')?'เดบิต':'เครดิต')+' '+[...new Set(cs.map(m=>n(m.pct)+'%'))].join(', ');};
 const STAMP={'ชำระแล้ว':'#16865c','ชำระบางส่วน':'#b54708','ยกเลิกแล้ว':'#b42318'};
 /* ---------- the A4 sheet ---------- */
 function sheetSaleReceipt(c,p,copy){
  const I=info(c,p),L=I.L,t=I.t,cu=findCust(c.custId),v=cu&&(cu.vehicles||[])[c.vehIdx],its=(L.items||[]).filter(it=>it&&(it.code||it.name||n(it.price)));
  const cur=(L.taxDocs||[]).length?L.taxDocs[L.taxDocs.length-1]:null,tax=cur&&!cur.cancelled?cur.no:'',col=STAMP[I.stamp];
  const right=(lbl,val,b)=>`<tr><td colspan="5" style="text-align:right">${b?'<b>'+lbl+'</b>':lbl}</td><td class="num">${b?'<b>'+val+'</b>':val}</td></tr>`;
  const adj=n(t.adjGross);
  const body=I.shared
   ?`<table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th>ใบตัดสต็อกเลขที่</th><th style="width:90px">วันที่ขาย</th><th style="width:100px">ยอดขายรวม</th><th style="width:100px">หัก ณ ที่จ่าย</th><th style="width:110px">รับชำระครั้งนี้</th></tr></thead><tbody>
     ${I.parts.map((x,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(x.sale?x.sale.no:x.led.no)}${S.invOk(x.led)?' · ใบแจ้งหนี้ '+esc(S.invOk(x.led).no):''}</td><td style="text-align:center">${thDate(x.led.date)}</td><td class="num">${money(receiptTotals(x.led).gross)}</td><td class="num">${n(x.pay.wht&&x.pay.wht.amt)>0?money(x.pay.wht.amt):'-'}</td><td class="num">${money(x.pay.amt)}</td></tr>`).join('')}
     ${right('<b>ยอดรับครั้งนี้ ('+I.parts.length+' บิล)</b>','<b>'+money(I.money)+'</b>')}</tbody></table>`
   :`<table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th style="width:100px">รหัส</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
     ${its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td><td>${esc(it.name||'')}${n(it.warr)>0?' <span style="color:#555">(ประกัน '+n(it.warr)+' เดือน)</span>':''}</td><td style="text-align:center">${qf(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:#777">— ไม่มีรายการ —</td></tr>'}
     ${right('รวมเป็นเงิน',money(t.sub))}${n(t.disc)>0?right('หักส่วนลด',money(t.disc)):''}${adj?right('ปรับเพิ่ม / ลด (รวม VAT)',(adj>0?'+':'−')+money(Math.abs(adj))):''}
     ${right('มูลค่าก่อนภาษี',money(t.base))}${right('ภาษีมูลค่าเพิ่ม '+n(L.vat)+'%',money(t.vat))}${right('ยอดขายรวม',money(t.gross),1)}</tbody></table>`;
  const pb=paidBy(I,p),ml=methodLines(pb),fee=feeOf(pb),w=p.wht&&n(p.wht.amt)>0?p.wht:null;
  return sheetTop({title:'ใบเสร็จรับเงิน',en:'RECEIPT',copy:copy||'ต้นฉบับ',
    fields:[['เลขที่',esc(p.reNo||'-')],['วันที่รับเงิน',thDate(p.date)+(p.time?' '+esc(p.time):'')],I.shared?['รับชำระรวม',I.parts.length+' บิล']:['อ้างอิงใบตัดสต็อก',esc(c.no)],
     !I.shared&&S.invOk(L)?['ใบแจ้งหนี้เลขที่',esc(S.invOk(L).no)]:null,!I.shared&&tax?['ใบกำกับภาษีเลขที่',esc(tax)]:null,!I.shared&&v?['ทะเบียนรถ',esc(plateOf(v))]:null].filter(Boolean)})+`
  ${I.stamp==='ชำระแล้ว'?'':`<div style="position:absolute;right:18mm;top:52mm;transform:rotate(-12deg);border:3px solid ${col};color:${col};border-radius:8px;padding:4px 18px;font-size:22px;font-weight:700;opacity:.8;-webkit-print-color-adjust:exact;print-color-adjust:exact" class="pkg-sf-stamp">${I.stamp}</div>`}
  <table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ได้รับเงินจาก</span><br><b>${esc(cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)')}</b>${cu&&cu.type==='company'&&cu.name?'<br>ผู้ติดต่อ: '+esc(cu.name):''}<br>
    ${cu?esc(addrLine(cu.addr))+'<br>เลขประจำตัวผู้เสียภาษี '+esc(cu.tax||'-')+(cu.branch?' ('+esc(cu.branch)+')':'')+'<br>โทร. '+esc(cu.tel||'-'):''}</td>
   <td style="vertical-align:top">${v&&!I.shared?`<span class="lbl">รถที่รับบริการ</span><br>${esc(v.brand||'-')} ${esc(v.model||'')}<br>ทะเบียน <b>${esc(plateOf(v))}</b>`:`<span class="lbl">ผู้รับเงิน</span><br>${esc(String(p.by||'-').replace(/^.*· /,''))}`}</td></tr></table>
  ${body}
  <div class="box"><span class="lbl">ชำระโดย</span>
   <table style="margin-top:4px">${ml.map(([k,d,a])=>`<tr><td style="border:0;width:110px"><b>${k}</b></td><td style="border:0">${esc(d)}</td><td style="border:0;text-align:right;width:120px">${money(a)}</td></tr>`).join('')}
    ${fee>0?`<tr><td colspan="2" style="border:0;border-top:1px solid #999">ยอดตามใบตัดสต็อก</td><td style="border:0;border-top:1px solid #999;text-align:right">${money(I.money)}</td></tr><tr><td colspan="2" style="border:0">${feeLbl(pb)}</td><td style="border:0;text-align:right">${money(fee)}</td></tr>`:''}
    <tr><td colspan="2" style="border:0;border-top:1px solid #999"><b>ยอดรับครั้งนี้</b></td><td style="border:0;border-top:1px solid #999;text-align:right"><b>${money(r2(I.money+fee))}</b></td></tr>
    ${I.wht>0?`<tr><td colspan="2" style="border:0">ลูกค้าหักภาษี ณ ที่จ่าย${w?' '+n(w.rate)+'% ('+(w.base==='labor'?'ค่าบริการ':'ทั้งใบ')+' '+money(w.baseAmt)+')':''} — ${w&&w.got?'ได้รับหนังสือรับรองแล้ว':'รอหนังสือรับรองจากลูกค้า'}</td><td style="border:0;text-align:right">${money(I.wht)}</td></tr>`:''}
    ${!I.shared&&I.instal?`<tr><td colspan="2" style="border:0">รับไว้แล้วก่อนหน้า</td><td style="border:0;text-align:right">${money(I.prev)}</td></tr><tr><td colspan="2" style="border:0">รับสะสมถึงใบนี้</td><td style="border:0;text-align:right">${money(I.cum)}</td></tr><tr><td colspan="2" style="border:0"><b>คงค้าง</b></td><td style="border:0;text-align:right"><b>${money(I.rem)}</b></td></tr>`:''}</table>
   <div style="text-align:center;margin-top:4px">(${bahtText(r2(I.money+fee))})</div>
   ${p.cancelled?`<div style="color:#b42318;margin-top:4px"><b>ยกเลิกแล้ว</b> — ${esc(p.cancelReason||'')} · ${thDate(p.cancelDate)} · ${esc(p.cancelBy||'')}</div>`:''}${p.note?`<div style="margin-top:4px">หมายเหตุ: ${esc(p.note)}</div>`:''}</div>
  <table style="margin-top:28px"><tr><td style="width:50%;text-align:center;border:0">.................................................<br>ผู้รับเงิน (${esc(String(p.by||'').replace(/^.*· /,''))})</td>
   <td style="text-align:center;border:0">.................................................<br>ผู้จ่ายเงิน</td></tr></table></div>`;
 }
 function printReceipt(saleId,payId){
  const f=find(saleId,payId);if(!f)return;
  if(!f.p.reNo&&f.p.src!=='legacy')return toast('การรับชำระนี้ยังไม่ออกใบเสร็จ — กด “สร้างใบเสร็จรับเงิน” ก่อน');
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('rcptDoc','print'))return;
  logAudit('stockcut',f.c,'print','ใบเสร็จรับเงิน '+(f.p.reNo||'')+' (A4 ต้นฉบับ + สำเนา)');save();
  printDocs(sheetSaleReceipt(f.c,f.p,'ต้นฉบับ')+sheetSaleReceipt(f.c,f.p,'สำเนา'));
 }
 /* ---------- the receipt window ---------- */
 const V=document.createElement('div');V.className='modal';V.id='mSaleRcpt';
 V.innerHTML=`<div class="sheet" style="max-width:720px"><div class="panel" style="margin-bottom:0"><header><h2 id="srTitle">ใบเสร็จรับเงิน</h2><span class="tag" id="srState"></span></header><div class="body" id="srBody"></div>
  <footer class="pkg-sr-foot"><button type="button" class="btn gh" onclick="closeModal('mSaleRcpt')">ปิด</button><button type="button" class="btn gh" data-sr="sale">เปิดใบตัดสต็อก</button><button type="button" class="btn dgr" data-sr="cancel">ยกเลิกการรับชำระ</button><button type="button" class="btn grn" data-sr="print">พิมพ์ใบเสร็จ (A4)</button></footer></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(V);
 let cur=null;
 function paintRcpt(){
  const f=cur&&find(cur.sale,cur.pay);if(!f)return;const {c,p}=f,I=info(c,p),cu=findCust(c.custId),pb=paidBy(I,p),ml=methodLines(pb),fee=feeOf(pb),cls={'ชำระแล้ว':'st-green','ชำระบางส่วน':'st-blue','ยกเลิกแล้ว':'st-red'}[I.stamp];
  $i('srTitle').textContent='ใบเสร็จรับเงิน '+(p.reNo||'');$i('srState').innerHTML='<span class="stbtn '+cls+'">'+I.stamp+'</span>';
  const row=(k,v)=>`<div><span>${k}</span><b data-no-translate>${v}</b></div>`;
  $i('srBody').innerHTML=`<div class="pkg-sr-grid">${row('วันที่รับเงิน',thDate(p.date)+(p.time?' '+esc(p.time):''))}${row('ผู้รับเงิน',esc(String(p.by||'-').replace(/^.*· /,'')))}
    ${row('ลูกค้า',esc(cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)'))}${I.shared?row('ใบตัดสต็อก',I.parts.map(x=>esc(x.sale?x.sale.no:'')).join(', ')):row('ใบตัดสต็อก',esc(c.no))}
    ${S.invOk(I.L)&&!I.shared?row('ใบแจ้งหนี้',esc(S.invOk(I.L).no)):''}${row('บันทึกเมื่อ',(p.createdAt?thDateTime(p.createdAt):'-')+(p.createdByName?' · '+esc(String(p.createdByName).replace(/^.*· /,'')):''))}</div>
   <table class="tbl pkg-sr-tbl"><thead><tr><th>วิธีชำระ</th><th>รายละเอียด</th><th class="num">จำนวนเงิน</th></tr></thead><tbody>${ml.map(([k,d,a])=>`<tr><td>${k}</td><td data-no-translate>${esc(d)}</td><td class="num">${money(a)}</td></tr>`).join('')}
    ${fee>0?`<tr><td colspan="2">ยอดตามใบตัดสต็อก</td><td class="num">${money(I.money)}</td></tr><tr><td colspan="2">${feeLbl(pb)}</td><td class="num">${money(fee)}</td></tr>`:''}
    <tr class="tot"><td colspan="2"><b>ยอดรับครั้งนี้</b>${I.shared?' · รวม '+I.parts.length+' บิล':''}</td><td class="num"><b>${money(r2(I.money+fee))}</b></td></tr>
    ${I.wht>0?`<tr><td colspan="2">ลูกค้าหัก ณ ที่จ่าย — ${p.wht&&p.wht.got?'ได้รับหนังสือรับรองแล้ว'+(p.wht.gotDate?' ('+thDate(p.wht.gotDate)+')':''):'รอหนังสือรับรองจากลูกค้า'}${p.wht&&p.wht.img?' <button type="button" class="btn sm gh" data-sr="whtimg">ดูรูป</button>':''}</td><td class="num">${money(I.wht)}</td></tr>`:''}
    ${!I.shared&&I.instal?`<tr><td colspan="2">รับไว้แล้วก่อนหน้า</td><td class="num">${money(I.prev)}</td></tr><tr><td colspan="2">คงค้างหลังใบนี้</td><td class="num">${money(I.rem)}</td></tr>`:''}</tbody></table>
   ${window.PKG_SETTLE&&PKG_SETTLE.thumbs?PKG_SETTLE.thumbs(p):''}
   ${p.note?`<p class="hint" data-no-translate>หมายเหตุ: ${esc(p.note)}</p>`:''}${p.cancelled?`<p class="pkg-sr-void" data-no-translate>ยกเลิกแล้ว — ${esc(p.cancelReason||'')} · ${thDate(p.cancelDate)} · ${esc(p.cancelBy||'')}</p>`:''}
   <p class="hint">ใบเสร็จเกิดจากการรับชำระ — แก้วิธีชำระต้องยกเลิกการรับชำระแล้วรับใหม่ (ต้องมีสิทธิ์)</p>`;
  V.querySelector('[data-sr="cancel"]').hidden=!!p.cancelled||!!c.cancelled||!(!curEmp()||can('m.rcptDoc_cancel'));
  V.querySelector('[data-sr="print"]').hidden=!p.reNo||!(!curEmp()||can('m.rcptDoc_print'));
 }
 function openReceipt(saleId,payId){if(!find(saleId,payId))return false;cur={sale:saleId,pay:payId};paintRcpt();openModal('mSaleRcpt');return true;}
 V.addEventListener('click',async e=>{const th=e.target.closest('[data-st-slip]'),f0=cur&&find(cur.sale,cur.pay);
  if(th&&f0&&window.PKG_SETTLE&&PKG_SETTLE.openSlip){PKG_SETTLE.openSlip(f0.p,+th.dataset.stSlip);return;}   /* slip thumbnails (same as the payment history) */
  const a=e.target.closest('[data-sr]')?.dataset.sr,f=cur&&find(cur.sale,cur.pay);if(!a||!f)return;
  if(a==='print')return printReceipt(cur.sale,cur.pay);
  if(a==='sale'){closeModal('mSaleRcpt');return window.pkgOpenCut(f.c.id);}
  if(a==='cancel'){if(await S.cancelPayment(f.c,f.p.id)){paintRcpt();if(typeof window.pkgSaleRender==='function'&&SC.state.cur)window.pkgSaleRender();}return;}
  const X=window.PKG_SETTLE;
  if(a==='slips'&&X&&X.viewer){const sl=(DB.paySlips||{})[f.p.payId]||[];if(sl.length)X.viewer.open(sl.map(x=>({url:x.url,name:x.name,label:x.line?'โอน '+x.line:'สลิป'})),0);return;}
  if(a==='whtimg'&&X&&X.viewer){const d=(DB.whtDocs||{})[f.p.id];if(d)X.viewer.open([{url:d.url,name:d.name,label:'หนังสือรับรองหัก ณ ที่จ่าย'}],0);}
 });
 /* ---------- the old receipt window: read-only for a ledger record ---------- */
 const RM=$i('mReceiptEdit');
 if(RM&&typeof fillReceiptForm==='function'){
  const note=document.createElement('p');note.className='hint pkg-rcpt-ro-note';note.hidden=true;note.textContent='ใบเสร็จเกิดจากการรับชำระ — แก้วิธีชำระต้องยกเลิกการรับชำระแล้วรับใหม่ (ต้องมีสิทธิ์)';
  (RM.querySelector('.body')||RM).prepend(note);
  const o=fillReceiptForm;
  fillReceiptForm=function(){
   const out=o.apply(this,arguments);let r=null;try{r=(0,eval)('R');}catch(e){}
   const ro=!!(on()&&r&&(r.pkgSale||S.ledById(r.id)));
   RM.classList.toggle('pkg-rcpt-ro',ro);note.hidden=!ro;
   RM.querySelectorAll('input,select,textarea').forEach(el=>{if(ro){if(!el.disabled){el.disabled=true;el.dataset.sfRo='1';}}else if(el.dataset.sfRo){el.disabled=false;delete el.dataset.sfRo;}});
   return out;};
 }
 /* the tax-invoice sheet of a sale with adjustments: one row so the lines add up to the totals (which already include them) */
 if(typeof sheetReceipt==='function'){const o=sheetReceipt;sheetReceipt=function(r,kind,copy){
  const h=o.apply(this,arguments);if(!r||!r.pkgSale||!(r.adj&&r.adj.length))return h;
  const t=receiptTotals(r),g=n(t.adjBase);if(!g)return h;
  return String(h).replace(/<tr><td colspan="(\d+)" style="text-align:right">มูลค่าก่อนภาษี/,(m,cs)=>'<tr><td colspan="'+cs+'" style="text-align:right">ปรับเพิ่ม / ลด (ก่อนภาษี)</td><td class="num">'+(g>0?'+':'−')+money(Math.abs(g))+'</td></tr>'+m);};}
 /* "+ สร้างใบเสร็จรับเงินใหม่" (4.1) → a new sale, while the switch is on */
 document.addEventListener('click',e=>{
  if(!on())return;const b=e.target.closest&&e.target.closest('[onclick="newReceipt()"]');if(!b||b.closest('#mReceiptEdit'))return;
  e.preventDefault();e.stopPropagation();toast('ระบบขายแบบใหม่: เริ่มจากใบตัดสต็อก (4.1 ตัดสต็อกสินค้า) แล้วรับชำระ — สร้างใบเสร็จรับเงินได้ที่ 4.3');SC.openNew();
 },true);
 window.PKG_SALE_DOCS={sheetSaleReceipt,printReceipt,openReceipt,info,methodLines,paint:paintRcpt};
})();

/* ระบบขายแบบใหม่ · phase 5 — menu 04 in the order of the flow and the three new sections (only while the switch is on;
   off = today's four tabs, untouched):
     4.1 ตัดสต็อกสินค้า · 4.2 ใบแจ้งหนี้ · 4.3 ใบเสร็จรับเงิน · 4.4 ใบหัก ณ ที่จ่าย · 4.5 ใบวางบิล · 4.6 ใบกำกับภาษี
   The tabs are re-ordered / re-labelled at run time (buttons, ROV_TITLE, dataset.lbl); rOvGo is wrapped for the new
   panes #rOv-inv / #rOv-rcp / #rOv-wht, which this file builds and draws itself (search, month, state, summary, Excel).
   · 4.2 = active sales that have an invoice (own IV numbers); A4 sheet and 80 mm slip.
   · 4.3 = one row per receiving (cancelled ones struck through); the old 4.1 register stays reachable ("เอกสารเดิม").
   · 4.4 = two tabs: ลูกค้าหักเรา (withholding confirmed in payments; "ได้รับแล้ว" = certificate arrived) and
     เราหักผู้ขาย (DB.expenses with withholding: ภ.ง.ด.3 / 53, certificate number on first print, นำส่งแล้ว).
   Also: the print buttons of a sale (ใบแจ้งหนี้ A4 / 80 มม. · ใบเสร็จรับเงิน A4). */
(()=>{
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,D=window.PKG_SALE_DOCS,tabs=document.getElementById('rOvTabs'),cutPane=document.getElementById('rOv-cut');
 if(!S||!SC||!D||!tabs||!cutPane||typeof rOvGo!=='function')return;
 const $i=id=>document.getElementById(id),on=()=>S.on(),r2=v=>Math.round(n(v)*100)/100;
 const here=d=>!window.PKG_BRANCH||PKG_BRANCH.here(d);
 const custOf=id=>{const cu=id?findCust(id):null;return cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)';};
 const days=d=>Math.max(0,Math.round((new Date(iso()+'T00:00:00')-new Date(String(d||iso())+'T00:00:00'))/864e5));
 const mayView=()=>!curEmp()||!!can('m.rcptDoc_view'),mayPrint=()=>!curEmp()||!!can('m.rcptDoc_print'),mayExport=()=>!curEmp()||!!can('m.rcptDoc_export'),mayRecv=()=>S.canRecv(),mayFin=()=>!curEmp()||!!can('doc.fin');
 const PMT={cash:'เงินสด',trans:'เงินโอน',card:'บัตร',check:'เช็ค'};
 const methodsOf=p=>(p.methods||[]).map(m=>PMT[m.k]||m.k).join(' + ')||PMT[p.method]||'ไม่ระบุวิธี';
 /* ---------- menu 04 ---------- */
 const ON_ORDER=['retail','inv','rcp','wht','billing','tax'],ON_LBL={retail:'4.1 ตัดสต็อกสินค้า',inv:'4.2 ใบแจ้งหนี้',rcp:'4.3 ใบเสร็จรับเงิน',wht:'4.4 ใบหัก ณ ที่จ่าย',billing:'4.5 ใบวางบิล',tax:'4.6 ใบกำกับภาษี'},MINE=['inv','rcp','wht'];
 const textOf=b=>{const t=[...b.childNodes].find(x=>x.nodeType===3&&x.nodeValue.trim());return t?t.nodeValue.trim():'';};
 const setLbl=(b,t)=>{const tn=[...b.childNodes].find(x=>x.nodeType===3&&x.nodeValue.trim());if(tn)tn.nodeValue=t;else b.prepend(document.createTextNode(t));};
 const ORIG=[...tabs.querySelectorAll('button')].map(b=>({t:b.dataset.t,b,lbl:textOf(b)})),TITLE0=Object.assign({},ROV_TITLE);
 const NEW={},btn=k=>NEW[k]||tabs.querySelector('button[data-t="'+k+'"]');
 MINE.forEach(k=>{const b=document.createElement('button');b.type='button';b.dataset.t=k;b.textContent=ON_LBL[k];NEW[k]=b;});   /* the tab buttons are in the page only while the switch is on; the panes / tables come from saleflow-build.py */
 if(!MINE.every(k=>$i('rOv-'+k))||!['sinvTbl','srcpTbl','swhtTbl','swhtOutTbl'].every(id=>$i(id)))return;
 let OLD=false;
 function menu(){
  const want=on()?'1':'0';if(tabs.dataset.sf===want)return;tabs.dataset.sf=want;
  document.querySelectorAll('#pkgRegwSel option').forEach(o=>{if(['sinvTbl','srcpTbl','swhtTbl','swhtOutTbl'].includes(o.value)){o.hidden=!on();o.disabled=!on();}});   /* 11.1 lists the new registers only while the switch is on */
  {const ROW={rcptCut:['04.4 · ตัดสต็อกสินค้า','04.1 · ตัดสต็อกสินค้า'],rcptDoc:['04.1 · ใบแจ้งหนี้ / ใบเสร็จรับเงิน','04.2–04.4 · ใบแจ้งหนี้ / ใบเสร็จรับเงิน / ใบหัก ณ ที่จ่าย'],rcptBilling:['04.2 · ใบวางบิล','04.5 · ใบวางบิล'],rcptTax:['04.3 · ใบกำกับภาษี','04.6 · ใบกำกับภาษี']};
   if(typeof PERM_M!=='undefined')PERM_M.forEach(r=>{if(ROW[r.k])r.l=ROW[r.k][on()?1:0];});
   if(typeof AUD_KIND==='object')AUD_KIND.stockcut=on()?'ใบตัดสต็อกสินค้า (4.1)':'ใบตัดสต็อกสินค้า (4.4)';if(typeof AUD_ACT==='object')AUD_ACT.cut=on()?'ตัดสต็อก (4.1)':'ตัดสต็อก (4.4)';}
  if(on()){ON_ORDER.forEach(k=>{const b=btn(k);setLbl(b,ON_LBL[k]);b.dataset.lbl=ON_LBL[k];b.classList.remove('pkg-sf-hide');tabs.append(b);ROV_TITLE[k]=ON_LBL[k];});btn('doc').classList.add('pkg-sf-hide');ROV_TITLE.doc='เอกสารเดิม · ใบแจ้งหนี้ / ใบเสร็จรับเงิน (ระบบเดิม)';}
  else{ORIG.forEach(o=>{setLbl(o.b,o.lbl);delete o.b.dataset.lbl;o.b.classList.remove('pkg-sf-hide');tabs.append(o.b);ROV_TITLE[o.t]=TITLE0[o.t];});MINE.forEach(k=>{NEW[k].remove();delete ROV_TITLE[k];});
   if(typeof rOvPane!=='undefined'&&MINE.includes(rOvPane)){MINE.forEach(k=>{$i('rOv-'+k).style.display='none';});try{go0.call(window,'doc');}catch(e){}}}
 }
 const go0=rOvGo;
 rOvGo=function(v){
  menu();
  if(!on()&&MINE.includes(v))v='doc';
  if(on()&&v==='doc'&&!OLD)v='retail';                       /* the old 4.1 register opens only from "เอกสารเดิม" */
  OLD=false;
  MINE.forEach(k=>{$i('rOv-'+k).style.display='none';});
  if(!MINE.includes(v))return go0.call(this,v);
  rOvPane=v;[...tabs.querySelectorAll('button')].forEach(x=>x.classList.toggle('on',x.dataset.t===v));
  ['rOv-doc','rOv-tax','rOv-billing','rOv-cut'].forEach(id=>{if($i(id))$i(id).style.display='none';});
  $i('rOv-'+v).style.display='';if($i('rOvTitle'))$i('rOvTitle').textContent=ON_LBL[v];
  if(typeof mSetPageTitle==='function')try{mSetPageTitle('receipt');}catch(e){}
  draw(v);
 };
 const openOld=()=>{OLD=true;rOvGo('doc');};
 /* ---------- the registers (phase 5b) — same pipeline as every other register:
    rows → applyDateFilter(<p>Date) → sortRows (filter panel of reg-filter.js, ลำดับ of row-number.js) → limitRows (rows per
    page + pager) → tbody → paintSort / mkCards (phone cards). Header, summary strip, Excel / PDF, 11.1 widths come from
    reg-head.js / reg-export.js / reg-layout.js through the entries those files hold for these four tables. ---------- */
 const qOf=p=>String(($i(p+'Search')||{}).value||'').toLowerCase().trim(),stOf=p=>($i(p+'State')||{}).value||'';
 const hit=(q,arr)=>!q||arr.some(x=>String(x||'').toLowerCase().includes(q));
 const byDate=(a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no||'').localeCompare(String(a.no||''));
 function std(p,tbl,rows,unit,rowHtml){
  if(!mayView()){$i(tbl).tBodies[0].innerHTML='';$i(p+'Empty').style.display='block';return [];}
  rows=applyDateFilter(rows,p+'Date');if($i(p+'Count'))$i(p+'Count').textContent=rows.length+' '+unit;
  rows=sortRows(tbl,rows);const shown=limitRows(rows,p);
  $i(tbl).tBodies[0].innerHTML=shown.map(rowHtml).join('');$i(p+'Empty').style.display=shown.length?'none':'block';
  paintSort(tbl);mkCards(tbl);return rows;
 }
 /* 4.2 ใบแจ้งหนี้ */
 /* phase 8: the list holds only REAL invoices — the active one of a cut and its cancelled ones (a number is never used
    again). A cut that never had an invoice paper of its own is not listed (old open cuts used to appear under their SA number). */
 const ZERO={total:0,got:0,wht:0,rem:0},mayAdd=()=>!curEmp()||!!can('m.rcptDoc_add');
 function invRows(){
  const q=qOf('sinv'),st=stOf('sinv'),out=[];
  (DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale)return;const c=S.saleOf(L);if(!c)return;const docs=S.invAll(L);if(!docs.length)return;const t=S.stat(c),age=days(c.date);
   docs.forEach(d=>{const apv=S.invApv(d),rej=apv==='rejected',void_=!!d.cancelled||!!c.cancelled,off=void_||rej,open=!off&&t.rem>0.005;
    out.push({c,L,d,k:t.k,apv,rej,void_,off,st:off?ZERO:t,no:d.no,date:d.date||c.date,cust:custOf(c.custId),age,open,over:open&&age>7});});});
  return out.filter(x=>(st==='open'?x.open:st==='wait'?x.open&&(x.k==='wait'||x.k==='part'):st==='credit'?x.open&&x.k==='credit':st==='over'?x.over:st==='paid'?!x.off&&!x.open
    :st==='pend'?!x.off&&x.apv==='pending':st==='apv'?!x.off&&x.apv==='approved':st==='rej'?x.rej:st==='cancel'?x.void_&&!x.rej:true)&&hit(q,[x.no,x.c.no,x.cust])).sort(byDate);
 }
 window.pkgRenderInv=function(){
  const nb=$i('rOv-inv').querySelector('[data-ro="invpick"]');if(nb)nb.hidden=!mayAdd();
  return std('sinv','sinvTbl',invRows(),'ใบ',x=>`<tr${x.off?' class="cancelrow"':''} data-id="${esc(x.c.id)}" data-inv="${esc(x.no)}"><td class="mono"><span class="docno" data-ro="inv" data-no-translate title="เปิดใบแจ้งหนี้">${x.d.cancelled||x.rej?'<s>'+esc(x.no)+'</s>':esc(x.no)}</span>${x.d.legacy?'<div class="hint">เอกสารเดิม</div>':''}${!x.off&&x.apv==='pending'?'<div><span class="chip a">รออนุมัติ</span></div>':''}</td><td class="ctr">${thDate(x.date)}</td><td class="mono"><span class="docno" data-ro="sale" data-no-translate>${esc(x.c.no)}</span></td><td data-no-translate>${esc(x.cust)}</td>
    <td class="num">${x.off?'-':money(x.st.total)}</td><td class="num">${x.off?'-':money(x.st.got+x.st.wht)}</td><td class="num"><b>${x.off?'-':money(x.st.rem)}</b></td><td class="ctr">${x.rej?`<span class="stbtn st-red" title="${esc((x.d.apv&&x.d.apv.note)||'')}">ไม่อนุมัติ</span>`:x.off?`<span class="stbtn st-red" title="${esc(x.d.cancelReason||x.c.cancelReason||'')}">ยกเลิกแล้ว</span>`:x.open?x.age+(x.over?' <span class="stbtn st-red">เกินกำหนด</span>':''):'<span class="stbtn st-green">ชำระแล้ว</span>'}</td>
    <td class="ctr"><div class="pkg-sf-rowbtn"><button type="button" class="btn sm gh" data-ro="inv">เปิด</button>${mayPrint()&&!x.off&&x.apv==='approved'?'<button type="button" class="btn sm gh" data-ro="inva4" title="พิมพ์ใบแจ้งหนี้ (A4)">พิมพ์</button>':''}</div></td></tr>`);
 };
 /* 4.3 ใบเสร็จรับเงิน */
 function rcpRows(){
  const q=qOf('srcp'),st=stOf('srcp'),out=[];
  (DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale)return;const c=S.saleOf(L);(L.payments||[]).forEach(p=>{if(!p||!(p.reNo||(p.src==='legacy'&&n(p.amt)>0)))return;out.push({id:L.id+'|'+p.id,L,c,p,date:p.date,no:p.reNo||'',cust:custOf(L.custId)});});});   /* id: the row's own key for the tick boxes (a combined receipt is several rows with one number) */
  return out.filter(x=>(st==='on'?!x.p.cancelled:st==='off'?!!x.p.cancelled:true)&&hit(q,[x.p.reNo,x.c&&x.c.no,x.L.no,x.cust,x.p.by])).sort(byDate);
 }
 window.pkgRenderRcp=function(){
  {const nb=$i('rOv-rcp').querySelector('[data-ro="rcppick"]');if(nb)nb.hidden=!mayAdd();}
  return std('srcp','srcpTbl',rcpRows(),'ใบ',x=>`<tr${x.p.cancelled?' class="cancelrow"':''} data-id="${esc(x.c?x.c.id:'')}" data-pay="${esc(x.p.id)}"><td class="mono"><span class="docno" data-ro="rcpt" data-no-translate>${x.p.cancelled?'<s>'+esc(x.p.reNo||'-')+'</s>':esc(x.p.reNo||'(เอกสารเดิม)')}</span></td><td class="ctr">${thDate(x.p.date)}</td><td class="mono"><span class="docno" data-ro="sale" data-no-translate>${esc(x.c?x.c.no:x.L.no)}</span></td><td data-no-translate>${esc(x.cust)}</td>
    <td>${esc(methodsOf(x.p))}</td><td class="num" data-xv="${money(x.p.amt)}" data-xv2="${n(x.p.wht&&x.p.wht.amt)>0?money(x.p.wht.amt):''}">${money(x.p.amt)}${n(x.p.wht&&x.p.wht.amt)>0?`<div class="hint pkg-sf-sub"><span>หัก ณ ที่จ่าย</span> ${money(x.p.wht.amt)}</div>`:''}</td><td data-no-translate>${esc(String(x.p.by||'').replace(/^.*· /,''))}</td>
    <td class="ctr">${x.p.cancelled?`<span class="stbtn st-red" title="${esc(x.p.cancelReason||'')}">ยกเลิกแล้ว</span>`:'<span class="stbtn st-green">ใช้งาน</span>'}</td><td class="ctr"><div class="pkg-sf-rowbtn"><button type="button" class="btn sm gh" data-ro="rcpt">เปิด</button>${mayPrint()&&x.p.reNo?'<button type="button" class="btn sm gh" data-ro="rcptprint">พิมพ์</button>':''}</div></td></tr>`);
 };
 /* 4.4 ใบหัก ณ ที่จ่าย · ลูกค้าหักเรา */
 function whtAll(){
  const out=[];
  (DB.receipts||[]).forEach(r=>{if(!r||r.cancelled)return;const cu=r.custId?findCust(r.custId):null;
   if(r.pkgSale){const c=S.saleOf(r);(r.payments||[]).forEach(p=>{if(p&&!p.cancelled&&p.wht&&n(p.wht.amt)>0)out.push({id:r.id+'|'+p.id,r,c,p,date:p.date,no:p.reNo||(p.src==='legacy'?r.no:''),cust:custOf(r.custId),tax:(cu&&cu.tax)||'',base:n(p.wht.baseAmt),rate:n(p.wht.rate),amt:n(p.wht.amt),got:p.wht.got===true,gotDate:p.wht.gotDate||'',img:!!p.wht.img,legacy:p.src==='legacy'});});}
   else if(n(r.wht)>0){const t=S.origTotals(r),g=r.whtGot||{};out.push({id:r.id,r,date:r.paidDate||r.date,no:r.no,cust:custOf(r.custId),tax:(cu&&cu.tax)||'',base:n(t.whtBaseAmt),rate:n(r.wht),amt:n(t.whtAmt),got:!!g.got,gotDate:g.date||'',img:!!g.img,legacy:true});}});
  return out;
 }
 function whtCust(){const q=qOf('swht'),st=stOf('swht');return whtAll().filter(x=>(st==='wait'?!x.got:st==='got'?x.got:true)&&hit(q,[x.no,x.c&&x.c.no,x.cust,x.tax])).sort(byDate);}
 window.pkgRenderWht=function(){
  const wait=whtAll().filter(x=>!x.got&&!x.legacy&&here(x.p||x.r));
  if($i('swhtWait'))$i('swhtWait').textContent='ยังไม่ได้รับหนังสือรับรอง '+wait.length+' รายการ · ฿'+money(wait.reduce((a,x)=>a+x.amt,0));
  return std('swht','swhtTbl',whtCust(),'รายการ',x=>`<tr data-r="${esc(x.r.id)}" data-pay="${esc(x.p?x.p.id:'')}" data-id="${esc(x.c?x.c.id:'')}"><td class="ctr">${thDate(x.date)}</td><td class="mono"${x.no?' data-no-translate':''}>${x.no?esc(x.no):'<span class="hint">ยังไม่ออกใบเสร็จ</span>'}${x.legacy?'<div class="hint">เอกสารเดิม</div>':''}</td><td class="mono" data-no-translate>${x.c?`<span class="docno" data-ro="sale">${esc(x.c.no)}</span>`:'-'}</td><td data-no-translate>${esc(x.cust)}${x.tax?'<div class="hint">'+esc(x.tax)+'</div>':''}</td>
     <td class="num">${money(x.base)}</td><td class="ctr">${x.rate}%</td><td class="num"><b>${money(x.amt)}</b></td><td>${x.got?`<span class="stbtn st-green">ได้รับแล้ว</span>${x.gotDate?' <span class="hint">'+thDate(x.gotDate)+'</span>':''}${x.img?' <button type="button" class="btn sm gh" data-ro="whtimg">ดูรูป</button>':''}`:'<span class="stbtn st-orange">ยังไม่ได้รับ</span>'}</td>
     <td class="ctr">${!x.got&&mayRecv()?'<button type="button" class="btn sm grn" data-ro="whtgot">ได้รับแล้ว</button>':''}</td></tr>`);
 };
 /* 4.4 · เราหักผู้ขาย */
 const formOf=x=>x.whtForm||((/บริษัท|จำกัด|ห้างหุ้นส่วน|หจก|บจก|มหาชน/.test(String(x.payee||''))||/^0/.test(String(x.tax||'').replace(/\D/g,'')))?'53':'3');
 /* DriveGo new system (task 3.4, R7-ก, answers of 2026-10-25): what we withheld — from expenses and from vendor payments
    (58-payment-voucher.js) — dated on the day it was paid (ภ.ง.ด.3 / 53 count by payment date). One row per payment: an
    expense (key: its id) or a vendor payment (key: GR:<goods receipt id>:<payment id>; its certificate fields sit on the payment). */
 const venOf=id=>(DB.vendors||[]).find(v=>v.id===id)||null;
 function whtOutAll(){
  const out=(DB.expenses||[]).filter(x=>x&&n(x.wht)>0).map(x=>({id:x.id,x,doc:x,kind:'expense',paid:!!x.paid,br:x.br,createdByName:x.createdByName,createdAt:x.createdAt,date:x.paid?(x.payDate||x.date):x.date,no:x.no||'',payee:x.payee||'',tax:x.tax||'',addr:null,desc:x.desc||x.cat||'',base:n(expTotals(x).base),rate:n(x.wht),amt:n(expTotals(x).wht),form:formOf(x),cert:x.whtCertNo||'',remit:!!(x.whtRemit&&x.whtRemit.done)}));
  (DB.purchases||[]).forEach(g=>{if(!g||g.cancelled)return;const v=venOf(g.vendorId);(g.payments||[]).forEach(p=>{if(!p||p.cancelled||!p.wht||!(n(p.wht.amt)>0))return;
   out.push({id:'GR:'+g.id+':'+p.id,x:p,doc:g,kind:'gr',paid:true,br:p.br||g.br,createdByName:p.by||'',createdAt:'',date:p.date,no:p.pvNo||g.no||'',payee:(v&&v.name)||'',tax:(v&&v.tax)||'',addr:v&&v.addr,desc:'ค่าสินค้าตามใบรับสินค้า '+(g.no||''),base:n(p.wht.baseAmt),rate:n(p.wht.rate),amt:n(p.wht.amt),form:p.whtForm||p.wht.form||'3',cert:p.whtCertNo||'',remit:!!(p.whtRemit&&p.whtRemit.done)});});});
  return out;
 }
 /* a month's ภ.ง.ด.3 / 53 (paid only), in the order of its attachment — payment date, then document number; seq = ลำดับที่ */
 function whtOutMonth(mo){const rows=whtOutAll().filter(v=>v.paid&&String(v.date).slice(0,7)===mo)
  .sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.no).localeCompare(String(b.no)));
  const k={};rows.forEach(v=>{k[v.form]=(k[v.form]||0)+1;v.seq=k[v.form];});return rows;}
 const seqOf=v=>{const r=whtOutMonth(String(v.date).slice(0,7)).find(z=>z.id===v.id);return r?r.seq:0;};
 window.PKG_WHT_OUT={all:whtOutAll,month:whtOutMonth};
 function whtVen(){
  const q=qOf('swhtOut'),st=stOf('swhtOut');
  return whtOutAll().filter(v=>(st==='wait'?!v.remit:st==='got'?v.remit:true)&&hit(q,[v.no,v.payee,v.tax,v.cert,v.desc])).sort(byDate);
 }
 window.pkgRenderWhtOut=function(){
  const mo=iso().slice(0,7),due=whtOutAll().filter(v=>v.paid&&here(v.doc)&&String(v.date).slice(0,7)===mo&&!v.remit);
  if($i('swhtOutDue'))$i('swhtOutDue').textContent='ต้องนำส่งของเดือนนี้ ฿'+money(due.reduce((a,v)=>a+v.amt,0))+' · '+due.length+' รายการที่ยังไม่นำส่ง';
  return std('swhtOut','swhtOutTbl',whtVen(),'รายการ',v=>`<tr data-x="${esc(v.id)}"><td class="ctr">${thDate(v.date)}</td><td class="mono" data-no-translate data-xv="${esc(v.no)}" data-xv2="${esc(v.cert)}">${esc(v.no)}${v.cert?`<div class="hint pkg-sf-sub" title="เลขที่หนังสือรับรอง (50 ทวิ)">50 ทวิ ${esc(v.cert)}</div>`:''}</td><td data-no-translate>${esc(v.payee||'-')}${v.tax?'<div class="hint">'+esc(v.tax)+'</div>':''}</td><td data-no-translate>${esc(v.desc)}</td><td class="num" data-xv="${money(v.base)}" data-xv2="${v.rate}%">${money(v.base)}<div class="hint pkg-sf-sub"><span>อัตรา</span> ${v.rate}%</div></td><td class="num"><b>${money(v.amt)}</b></td>
     <td class="ctr" data-xv="ภ.ง.ด.${v.form}"><select data-rv="form" aria-label="แบบ ภ.ง.ด."${mayFin()?'':' disabled'}><option value="3"${v.form==='3'?' selected':''}>ภ.ง.ด.3</option><option value="53"${v.form==='53'?' selected':''}>ภ.ง.ด.53</option></select></td>
     <td class="ctr" data-xv="${v.remit?'นำส่งแล้ว'+(v.x.whtRemit.date?' '+thDate(v.x.whtRemit.date):''):'ยังไม่นำส่ง'}"><input type="checkbox" data-rv="remit" aria-label="นำส่งแล้ว"${v.remit?' checked':''}${mayFin()?'':' disabled'}><div class="hint pkg-sf-sub">${v.remit?(v.x.whtRemit.date?thDate(v.x.whtRemit.date):'นำส่งแล้ว'):'ยังไม่นำส่ง'}</div></td><td class="ctr">${mayPrint()?'<button type="button" class="btn sm gh" data-rv="print">พิมพ์ 50 ทวิ</button>':''}</td></tr>`);
 };
 /* Excel / PDF: what the screen shows as a second line of a cell (4.3 หัก ณ ที่จ่าย · 4.4 อัตรา, เลขที่หนังสือรับรอง) keeps its own
    column in the file; data-xv = the cell's own value, data-xv2 = the value of the column added right after it */
 const XADD={srcpTbl:{'จำนวนเงิน':['หัก ณ ที่จ่าย',1]},swhtOutTbl:{'เลขที่เอกสาร':['เลขที่หนังสือรับรอง',0],'ฐานที่หัก':['อัตรา',0]}};
 if(window.PKG_REG_EXPORT){const prevX=PKG_REG_EXPORT.extend;
  PKG_REG_EXPORT.extend=function(id,d,body){
   d=typeof prevX==='function'?prevX.apply(this,arguments):d;const X=XADD[id];
   if(!X||!d||!Array.isArray(d.cols))return d;
   for(let k=d.cols.length-1;k>=0;k--){const c=d.cols[k];if(c.i<0)continue;const add=X[c.l],cell=j=>body[j]&&body[j].cells[c.i];
    d.rows.forEach((r,j)=>{const td=cell(j);if(td&&td.dataset.xv!==undefined)r[k]=td.dataset.xv;});
    if(add){d.cols.splice(k+1,0,{i:-3,l:add[0],num:!!add[1]});d.rows.forEach((r,j)=>{const td=cell(j);r.splice(k+1,0,(td&&td.dataset.xv2)||'');});(d.foot||[]).forEach(r=>r.splice(k+1,0,''));}}
   return d;};}
 let WTAB='cust';
 function whtTab(k){WTAB=k==='ven'?'ven':'cust';$i('swhtCust').style.display=WTAB==='cust'?'':'none';$i('swhtVen').style.display=WTAB==='ven'?'':'none';
  $i('rOv-wht').querySelectorAll('[data-rtab]').forEach(b=>{const o=b.dataset.rtab===WTAB;b.classList.toggle('on',o);b.setAttribute('aria-selected',String(o));});
  return WTAB==='ven'?pkgRenderWhtOut():pkgRenderWht();}
 const RENDER={inv:()=>pkgRenderInv(),rcp:()=>pkgRenderRcp(),wht:()=>whtTab(WTAB)};
 function draw(v){
  const rows=(RENDER[v]||(()=>[]))()||[];
  if($i('rOvToday'))$i('rOvToday').textContent='พบ '+rows.length+' รายการ';if($i('rOvMonth'))$i('rOvMonth').textContent='';
  return rows;
 }
 /* sort keys (SORT_DEF) and phone cards (MC_CFG) of the four tables are declared in sale-flow.js: they must exist before
    row-number.js loads, which shifts every register's column numbers for its ลำดับ column. */
 [['sinv','sinvTbl',()=>pkgRenderInv()],['srcp','srcpTbl',()=>pkgRenderRcp()],['swht','swhtTbl',()=>pkgRenderWht()],['swhtOut','swhtOutTbl',()=>pkgRenderWhtOut()]].forEach(([p,tbl,fn])=>{
  bindSort(tbl,fn);const sr=$i(p+'Search'),stS=$i(p+'State');
  if(sr)sr.onkeydown=e=>{if(e.key==='Enter'){LIM_PAGE[p]=1;fn();}};if(stS)stS.onchange=()=>{LIM_PAGE[p]=1;fn();};});
 /* ---------- certificate arrived later ---------- */
 const G=document.createElement('div');G.className='modal';G.id='mWhtGot';
 G.innerHTML=`<div class="sheet" style="max-width:460px"><div class="panel" style="margin-bottom:0"><header><h2>ได้รับหนังสือรับรอง (50 ทวิ) แล้ว</h2></header><div class="body">
  <p class="pkg-sf-line" id="wgInfo" data-no-translate></p><label class="f"><span>วันที่ได้รับ</span><input type="date" id="wgDate"></label>
  <div class="f"><span>รูปหนังสือรับรอง (ไม่บังคับ)</span><div class="pkg-sf-slip" id="wgPic"></div></div><input type="file" id="wgFile" accept="image/*" hidden></div>
  <footer class="pkg-sr-foot"><button type="button" class="btn gh" onclick="closeModal('mWhtGot')">ปิด</button><button type="button" class="btn pri" data-wg="save">บันทึก</button></footer></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(G);
 let WG=null;
 const paintWG=()=>{$i('wgPic').innerHTML=WG&&WG.img?`<button type="button" class="pkg-sf-thumb" data-wg="view"><img src="${WG.img.url}" alt="รูปหนังสือรับรอง"></button><button type="button" class="btn sm gh" data-wg="del">เอารูปออก</button>`:'<button type="button" class="btn sm gh" data-wg="add">แนบรูป</button>';};
 function whtGot(rid,payId,o){   /* writes "certificate received" on a payment of a ledger record, or on a legacy receipt */
  const r=(DB.receipts||[]).find(x=>x.id===rid);if(!r)return false;if(!mayRecv()){toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');return false;}
  o=o||{};const date=o.date&&o.date<=iso()?o.date:iso();
  if(payId){const p=(r.payments||[]).find(x=>x.id===payId);if(!p||!p.wht)return false;Object.assign(p.wht,{got:true,gotDate:date,img:!!o.img||!!p.wht.img});if(o.img){DB.whtDocs=DB.whtDocs||{};DB.whtDocs[p.id]={url:o.img.url,name:o.img.name||''};}
   const c=S.saleOf(r);logAudit(c?'stockcut':'receipt',c||r,'save','ได้รับหนังสือรับรองหัก ณ ที่จ่าย '+money(p.wht.amt)+' บาท · '+(p.reNo?'ใบเสร็จ '+p.reNo:'การรับชำระวันที่ '+thDate(p.date)));}
  else{r.whtGot={got:true,date,img:!!o.img};if(o.img){DB.whtDocs=DB.whtDocs||{};DB.whtDocs['R'+r.id]={url:o.img.url,name:o.img.name||''};}logAudit('receipt',r,'save','ได้รับหนังสือรับรองหัก ณ ที่จ่าย');}
  save();return true;
 }
 function askGot(rid,payId,info){WG={rid,payId,img:null};$i('wgInfo').textContent=info||'';$i('wgDate').value=iso();$i('wgDate').max=iso();paintWG();openModal('mWhtGot');}
 G.addEventListener('click',e=>{const a=e.target.closest('[data-wg]')?.dataset.wg;if(!a||!WG)return;
  if(a==='add')return $i('wgFile').click();if(a==='del'){WG.img=null;return paintWG();}
  if(a==='view'){const X=window.PKG_SETTLE;if(X&&X.viewer&&WG.img)X.viewer.open([{url:WG.img.url,name:WG.img.name,label:'หนังสือรับรองหัก ณ ที่จ่าย'}],0);return;}
  if(a==='save'){if(whtGot(WG.rid,WG.payId,{date:$i('wgDate').value,img:WG.img})){closeModal('mWhtGot');toast('บันทึกแล้ว — ได้รับหนังสือรับรอง');if(typeof rOvPane!=='undefined'&&MINE.includes(rOvPane))draw(rOvPane);}}});
 $i('wgFile').addEventListener('change',()=>{const f=$i('wgFile').files[0],X=window.PKG_SETTLE;$i('wgFile').value='';if(!f||!X||!X.shrink||!WG)return;X.shrink(f).then(p=>{WG.img={url:p.url,name:p.name};paintWG();}).catch(()=>toast('เลือกไฟล์รูปภาพเท่านั้น (jpg / png)'));});
 /* ---------- sheets: invoice A4 / 80 mm, 50 ทวิ ---------- */
 function invInfo(c,d){const L=S.led(c),st=S.stat(c),t=receiptTotals(L),exp=st.wht>0.005?0:r2(t.whtExp);d=d||S.invOf(L)||{};return {L,st,t,exp,d,no:d.no||'',date:d.date||c.date,payBy:c.credit?(c.credit.due||c.date):(d.date||c.date),due:Math.max(0,r2(st.rem-exp))};}
 const banksHtml=()=>(DB.shop&&DB.shop.banks||[]).map(b=>esc(typeof bankLabel==='function'?bankLabel(b):(b.name||''))).join('<br>');
 function sheetSaleInvoice(c,copy){
  const I=invInfo(c),L=I.L,t=I.t,cu=findCust(c.custId),v=cu&&(cu.vehicles||[])[c.vehIdx],its=(L.items||[]).filter(it=>it&&(it.code||it.name||n(it.price))),adj=n(t.adjGross),e=L.whtExp||{};
  const right=(l,x,b)=>`<tr><td colspan="5" style="text-align:right">${b?'<b>'+l+'</b>':l}</td><td class="num">${b?'<b>'+x+'</b>':x}</td></tr>`;
  return sheetTop({title:'ใบแจ้งหนี้',en:'INVOICE',copy:copy||'ต้นฉบับ',fields:[['เลขที่',esc(I.no)],['วันที่',thDate(I.date)],['อ้างอิงใบตัดสต็อก',esc(c.no)],c.credit?['ครบกำหนดชำระ',thDate(c.credit.due||c.date)]:null,v?['ทะเบียนรถ',esc(plateOf(v))]:null].filter(Boolean)})+`
  <table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ลูกค้า</span><br><b>${esc(cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)')}</b><br>${cu?esc(addrLine(cu.addr))+'<br>เลขประจำตัวผู้เสียภาษี '+esc(cu.tax||'-')+'<br>โทร. '+esc(cu.tel||'-'):''}</td>
   <td style="vertical-align:top">${v?`<span class="lbl">รถที่รับบริการ</span><br>${esc(v.brand||'-')} ${esc(v.model||'')}<br>ทะเบียน <b>${esc(plateOf(v))}</b>`:''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th style="width:100px">รหัส</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
   ${its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td><td>${esc(it.name||'')}</td><td style="text-align:center">${qf(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')}
   ${right('รวมเป็นเงิน',money(t.sub))}${n(t.disc)>0?right('หักส่วนลด',money(t.disc)):''}${adj?right('ปรับเพิ่ม / ลด (รวม VAT)',(adj>0?'+':'−')+money(Math.abs(adj))):''}${right('มูลค่าก่อนภาษี',money(t.base))}${right('ภาษีมูลค่าเพิ่ม '+n(L.vat)+'%',money(t.vat))}${right('ยอดขายรวม',money(t.gross),1)}
   ${I.st.got+I.st.wht>0.005?right('รับชำระแล้ว'+(I.st.wht>0?' (รวมหัก ณ ที่จ่าย '+money(I.st.wht)+')':''),money(I.st.got+I.st.wht)):''}${I.exp>0?right('คาดว่าลูกค้าหัก ณ ที่จ่าย '+n(e.rate)+'% ('+(e.base==='all'?'ทั้งใบ':'ค่าบริการ')+')',money(I.exp)):''}
   ${right('ยอดที่ต้องชำระ',money(I.due),1)}<tr><td colspan="6" style="text-align:center">(${bahtText(I.due)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">ชำระโดยโอนเข้าบัญชี</span><br>${banksHtml()||'-'}</div>
  <table style="margin-top:28px"><tr><td style="width:50%;text-align:center;border:0">.................................................<br>ผู้ออกเอกสาร</td><td style="text-align:center;border:0">.................................................<br>ผู้รับเอกสาร</td></tr></table></div>`;
 }
 function slipSaleInvoice(c){
  const I=invInfo(c),s=DB.shop||{},t=I.t,L=I.L,adj=n(t.adjGross),row=(a,b,bold)=>`<tr><td style="border:0">${bold?'<b>'+a+'</b>':a}</td><td style="border:0;text-align:right">${bold?'<b>'+b+'</b>':b}</td></tr>`;
  return `<div class="sheetpage" style="max-width:80mm;margin:0 auto;font-size:12px"><div style="text-align:center"><b style="font-size:14px">${esc(typeof orgName==='function'?orgName():(s.name||''))}</b><br>${esc(s.addr?addrLine(s.addr):'')}<br><b>ใบแจ้งยอด / ใบแจ้งหนี้</b></div><hr>
   เลขที่ ${esc(I.no)}<br>วันที่ ${thDate(I.date)}<br>ใบตัดสต็อก ${esc(c.no)}<br>ลูกค้า ${esc(custOf(c.custId))}<hr>
   <table style="width:100%;border:0">${(L.items||[]).map(it=>`<tr><td style="border:0">${esc(it.name)}<br>${qf(it.qty)} × ${money(it.price)}</td><td style="border:0;text-align:right;vertical-align:bottom">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')}</table><hr>
   <table style="width:100%;border:0">${n(t.disc)?row('ส่วนลด','-'+money(t.disc)):''}${adj?row('ปรับเพิ่ม / ลด',(adj>0?'+':'−')+money(Math.abs(adj))):''}${t.vat>0?row('ภาษีมูลค่าเพิ่ม '+n(L.vat)+'%',money(t.vat)):''}${row('ยอดขายรวม',money(t.gross),1)}
    ${I.st.got+I.st.wht>0.005?row('รับชำระแล้ว',money(I.st.got+I.st.wht)):''}${I.exp>0?row('คาดว่าหัก ณ ที่จ่าย',money(I.exp)):''}${row('ยอดที่ต้องชำระ',money(I.due),1)}</table>
   <p style="margin:6px 0 0">${banksHtml()}</p><p style="text-align:center">ขอบคุณที่ใช้บริการ</p></div>`;
 }
 function printInvoice(saleId,size){
  const c=SC.list().find(x=>x.id===saleId);if(!c||!S.led(c))return;if(!mayPrint())return toast('บัญชีนี้ไม่มีสิทธิ์พิมพ์เอกสารนี้');
  if(!S.invOf(c))return toast('ใบตัดสต็อก '+c.no+' ยังไม่มีใบแจ้งหนี้ — กด “สร้างใบแจ้งหนี้” ก่อน');
  if(!S.invOk(c))return toast('ใบแจ้งหนี้ '+S.invOf(c).no+' รออนุมัติ — พิมพ์ได้หลังอนุมัติ');
  logAudit('stockcut',c,'print','ใบแจ้งหนี้ '+invInfo(c).no+(size==='80'?' (80 มม.)':' (A4)'));save();
  printDocs(size==='80'?slipSaleInvoice(c):sheetSaleInvoice(c,'ต้นฉบับ')+sheetSaleInvoice(c,'สำเนา'));
 }
 function printSaleReceipts(saleId){
  const c=SC.list().find(x=>x.id===saleId),L=c&&S.led(c);if(!L)return;const ps=(L.payments||[]).filter(p=>!p.cancelled&&p.reNo);if(!ps.length)return toast('ใบตัดสต็อกนี้ยังไม่มีใบเสร็จรับเงิน');
  if(!mayPrint())return toast('บัญชีนี้ไม่มีสิทธิ์พิมพ์เอกสารนี้');
  logAudit('stockcut',c,'print','ใบเสร็จรับเงิน '+ps.map(p=>p.reNo).join(', ')+' (A4)');save();
  printDocs(ps.map(p=>D.sheetSaleReceipt(c,p,'ต้นฉบับ')+D.sheetSaleReceipt(c,p,'สำเนา')).join(''));
 }
 /* our own certificate for a vendor: the number is issued on the first print */
 const takenO=docNoTaken;docNoTaken=function(no){return takenO.apply(this,arguments)||(DB.expenses||[]).some(x=>x&&x.whtCertNo===no)
  ||(DB.purchases||[]).some(g=>(g.payments||[]).some(p=>p&&p.whtCertNo===no));};
 /* DriveGo new system (task 3.4, R7-ก, answers of 2026-10-25): the certificate on the Revenue Department's form — หนังสือรับรอง
    การหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ: copy 1 and copy 2; both parties with their tax id and address (the payee's from the
    vendor's record, an expense's when its payee is a vendor); ลำดับที่ in the month's ภ.ง.ด.3 / 53 (whtOutMonth) and which
    form is ticked; the income type — 5, payments under the Revenue Department's orders under section 3 เตรส: transport 1%,
    advertising 2%, services / contract work 3%, rent 5%; the date paid, the amount paid and the tax withheld (also in
    words); "(1) หัก ณ ที่จ่าย" ticked; dated on the day paid. To be checked by the shop's accountant. */
 const INCOME={1:'ค่าขนส่ง',2:'ค่าโฆษณา',3:'ค่าบริการ / ค่าจ้างทำของ',5:'ค่าเช่า'};
 const COPY={1:'ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)',2:'ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)'};
 const FORMS=[['1','ภ.ง.ด.1ก'],['2','ภ.ง.ด.1ก พิเศษ'],['3','ภ.ง.ด.2'],['4','ภ.ง.ด.3'],['5','ภ.ง.ด.2ก'],['6','ภ.ง.ด.3ก'],['7','ภ.ง.ด.53']];
 const tickBox=on=>`<span style="display:inline-block;width:11px;height:11px;border:1px solid #000;text-align:center;line-height:10px;font-size:10px;vertical-align:middle;margin-right:2px">${on?'✓':''}</span>`;
 const DOTS='.................................................';
 function sheetWhtCert(v,copy){
  const s=DB.shop||{},vn=v.addr?null:(DB.vendors||[]).find(z=>String(z.name||'').trim()===String(v.payee||'').trim()),addr=v.addr||(vn&&vn.addr),tax=v.tax||(vn&&vn.tax)||'',seq=seqOf(v);
  const tick=k=>(k==='4'&&v.form==='3')||(k==='7'&&v.form==='53'),blank=t=>`<tr><td>${t}</td><td></td><td></td><td></td></tr>`;
  return `<div class="sheetpage"><div style="text-align:right;font-size:11px">${COPY[copy]}</div>
  <div style="text-align:center;margin:2px 0 4px"><b style="font-size:16px">หนังสือรับรองการหักภาษี ณ ที่จ่าย</b><br>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</div>
  <div style="text-align:right">เล่มที่ ........ เลขที่ <b>${esc(v.x.whtCertNo||'')}</b></div>
  <table><tr><td><span class="lbl">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</span> ชื่อ <b>${esc(typeof orgName==='function'?orgName():(s.name||''))}</b><br>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) <b>${esc(s.tax||'-')}</b><br>ที่อยู่ ${esc(s.addr?(typeof s.addr==='string'?s.addr:addrLine(s.addr)):'-')}</td></tr>
   <tr><td><span class="lbl">ผู้ถูกหักภาษี ณ ที่จ่าย</span> ชื่อ <b>${esc(v.payee||'-')}</b><br>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) <b>${esc(tax||'-')}</b><br>ที่อยู่ ${addr?esc(addrLine(addr)):DOTS+DOTS}</td></tr>
   <tr><td>ลำดับที่ <b>${seq||'........'}</b> ในแบบ &nbsp;${FORMS.map(([k,t])=>tickBox(tick(k))+'('+k+') '+t).join(' &nbsp;')}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th>ประเภทเงินได้พึงประเมินที่จ่าย</th><th style="width:105px">วัน เดือน หรือปีภาษี ที่จ่าย</th><th style="width:110px">จำนวนเงินที่จ่าย</th><th style="width:110px">ภาษีที่หัก และนำส่งไว้</th></tr></thead><tbody>
   ${blank('1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)')}${blank('2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)')}${blank('3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)')}
   ${blank('4. (ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)')}${blank('&nbsp;&nbsp;&nbsp;&nbsp;(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข)')}
   <tr><td>5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส เช่น รางวัล ส่วนลดหรือประโยชน์ใด ๆ เนื่องจากการส่งเสริมการขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าแสดงของนักแสดงสาธารณะ ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ค่าเบี้ยประกันวินาศภัย ฯลฯ
    <br><b>${esc(INCOME[v.rate]||v.desc)} ${v.rate}%</b></td><td style="text-align:center">${thDate(v.date)}</td><td class="num">${money(v.base)}</td><td class="num">${money(v.amt)}</td></tr>
   ${blank('6. อื่น ๆ (ระบุ) ................................')}
   <tr><td colspan="2" style="text-align:right"><b>รวมเงินที่จ่ายและภาษีที่หักนำส่ง</b></td><td class="num"><b>${money(v.base)}</b></td><td class="num"><b>${money(v.amt)}</b></td></tr>
   <tr><td colspan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) <b>(${bahtText(v.amt)})</b></td></tr></tbody></table>
  <div class="box">เงินที่จ่ายเข้า กบข. / กสจ. / กองทุนสงเคราะห์ครูโรงเรียนเอกชน ........ บาท &nbsp; กองทุนประกันสังคม ........ บาท &nbsp; กองทุนสำรองเลี้ยงชีพ ........ บาท</div>
  <div class="box">ผู้จ่ายเงิน &nbsp;${tickBox(true)}(1) หัก ณ ที่จ่าย &nbsp; ${tickBox(false)}(2) ออกให้ตลอดไป &nbsp; ${tickBox(false)}(3) ออกให้ครั้งเดียว &nbsp; ${tickBox(false)}(4) อื่น ๆ (ระบุ) ..........</div>
  <table style="margin-top:6px"><tr><td style="width:45%;vertical-align:top;font-size:11px"><b>คำเตือน</b> ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35 แห่งประมวลรัษฎากร</td>
   <td style="text-align:center">ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ<br><br>ลงชื่อ ${DOTS} ผู้จ่ายเงิน<br>${thDate(v.date)}<br><span class="lbl">(วัน เดือน ปี ที่ออกหนังสือรับรองฯ)</span></td></tr></table></div>`;
 }
 function printWhtCert(id){
  const v=whtOutAll().find(z=>z.id===id);if(!v||!(v.amt>0))return;if(!mayPrint())return toast('บัญชีนี้ไม่มีสิทธิ์พิมพ์เอกสารนี้');
  if(!v.paid)return toast('ยังไม่ได้จ่ายเงิน — ออก 50 ทวิ ได้หลังจ่าย');   /* tax is withheld when it is paid */
  const x=v.x;if(!x.whtCertNo){x.whtCertNo=docNo('WH');x.whtForm=v.form;v.cert=x.whtCertNo;}
  logAudit(v.kind,v.doc,'print','หนังสือรับรองการหักภาษี ณ ที่จ่าย '+x.whtCertNo);save();printDocs(sheetWhtCert(v,1)+sheetWhtCert(v,2));if(typeof rOvPane!=='undefined'&&rOvPane==='wht')draw('wht');
 }
 /* ---------- events of the three panes ---------- */
 MINE.forEach(k=>{const P=$i('rOv-'+k);
  P.addEventListener('change',e=>{const t=e.target,tr=t.closest('tr[data-x]'),v=tr&&whtOutAll().find(z=>z.id===tr.dataset.x),x=v&&v.x;if(!x||!t.dataset.rv)return;
   if(!mayFin()){toast('บัญชีนี้ไม่มีสิทธิ์แก้ไขรายการนี้');return pkgRenderWhtOut();}
   if(t.dataset.rv==='form')x.whtForm=t.value;if(t.dataset.rv==='remit')x.whtRemit=t.checked?{done:true,date:iso(),by:meName()}:{done:false,date:''};
   logAudit(v.kind,v.doc,'save',t.dataset.rv==='form'?'แบบนำส่ง ภ.ง.ด.'+x.whtForm:(t.checked?'นำส่งภาษีหัก ณ ที่จ่ายแล้ว':'ยกเลิกสถานะนำส่ง'));save();pkgRenderWhtOut();});
  P.addEventListener('click',e=>{const t=e.target;
   const tb=t.closest('[data-rtab]');if(tb)return whtTab(tb.dataset.rtab);
   const rv=t.closest('button[data-rv]');if(rv&&rv.dataset.rv==='print')return printWhtCert(rv.closest('tr').dataset.x);
   const b=t.closest('[data-ro]');if(!b)return;const a=b.dataset.ro,tr=b.closest('tr'),id=tr&&tr.dataset.id,pay=tr&&tr.dataset.pay;
   if(a==='old')return openOld();
   if(a==='sale'&&id)return window.pkgOpenCut(id);
   if(a==='inv'&&id)return openInvoice(id,tr.dataset.inv);if(a==='invpick')return openPick('inv');if(a==='rcppick')return openPick('rcp');
   if(a==='inva4')return printInvoice(id,'a4');if(a==='inv80')return printInvoice(id,'80');
   if(a==='rcpt'&&id&&pay)return D.openReceipt(id,pay);if(a==='rcptprint'&&id&&pay)return D.printReceipt(id,pay);
   if(a==='whtgot'){const x=whtAll().find(z=>z.r.id===tr.dataset.r&&(z.p?z.p.id:'')===(pay||''));return askGot(tr.dataset.r,pay,x?(x.no||'ยังไม่ออกใบเสร็จ')+' · '+x.cust+' · '+money(x.amt)+' บาท':'');}
   if(a==='whtimg'){const X=window.PKG_SETTLE,dd=(DB.whtDocs||{})[pay||('R'+tr.dataset.r)];if(X&&X.viewer&&dd)X.viewer.open([{url:dd.url,name:dd.name,label:'หนังสือรับรองหัก ณ ที่จ่าย'}],0);}});});
 /* ---------- print buttons of a sale (the sale window's print box) ---------- */
 const M=$i('mSale');
 function printBox(d,show){
  const col=M&&M.querySelector('#saTools .pkg-sa-printcol');if(!col)return;
  if(!col.querySelector('[data-sd]')){const mk=(k,t)=>{const b=document.createElement('button');b.type='button';b.className='btn pkg-sa-teal';b.dataset.sd=k;b.textContent=t;return b;};
   const hint=col.querySelector('#saPrinted');[mk('inva4','ใบแจ้งหนี้ (A4)'),mk('inv80','ใบแจ้งหนี้ (80 มม.)'),mk('rcpt','ใบเสร็จรับเงิน (A4)')].forEach(b=>hint?hint.before(b):col.append(b));}
  const L=show&&d?S.led(d):null,iv=L&&!d.cancelled&&!d.superseded?S.invOf(L):null,inv=!!(iv&&S.invApv(iv)==='approved'),rc=!!(L&&(L.payments||[]).some(p=>!p.cancelled&&p.reNo));
  col.querySelectorAll('[data-sd]').forEach(b=>{b.hidden=!mayPrint()||(b.dataset.sd==='rcpt'?!rc:!inv);});
  /* toolbar of a saved cut: "สร้างใบแจ้งหนี้" while it may have one, "ใบแจ้งหนี้ <no>" (opens the invoice window) once it has */
  const tc=M.querySelector('#saTools .pkg-sa-toolcol');if(!tc)return;
  let nw=tc.querySelector('[data-sd="invnew"]'),op=tc.querySelector('[data-sd="invopen"]');
  if(!nw){nw=document.createElement('button');nw.type='button';nw.className='btn pri';nw.dataset.sd='invnew';nw.textContent='สร้างใบแจ้งหนี้';
   op=document.createElement('button');op.type='button';op.className='btn pkg-sf-white';op.dataset.sd='invopen';op.setAttribute('data-no-translate','');tc.append(nw,op);}
  nw.hidden=!(L&&mayAdd()&&!S.invCan(d));op.hidden=!iv;if(iv)op.textContent='ใบแจ้งหนี้ '+iv.no+(S.invApv(iv)==='pending'?' · รออนุมัติ':'');
  /* phase 11: the tax invoice starts from the cut — "ออกใบกำกับภาษี" (VAT, a named customer, no active tax invoice) opens the
     4.6 window with this cut chosen; "ใบกำกับภาษี <no>" opens the one it has */
  let tn=tc.querySelector('[data-sd="taxnew"]'),to=tc.querySelector('[data-sd="taxopen"]');
  if(!tn){tn=document.createElement('button');tn.type='button';tn.className='btn pri';tn.dataset.sd='taxnew';tn.textContent='ออกใบกำกับภาษี';
   to=document.createElement('button');to.type='button';to.className='btn pkg-sf-white';to.dataset.sd='taxopen';to.setAttribute('data-no-translate','');tc.append(tn,to);}
  const tx=L&&!d.cancelled&&!d.superseded?S.taxOf(L):null;
  tn.hidden=!(show&&d&&taxCan(d));to.hidden=!tx;if(tx)to.textContent='ใบกำกับภาษี '+tx.no;
 }
 if(M)M.addEventListener('click',e=>{const b=e.target.closest('[data-sd]'),c=SC.state.cur;if(!b||!c)return;const a=b.dataset.sd;
  if(a==='invnew')return makeInvoice(c.id);if(a==='invopen')return openInvoice(c.id);
  if(a==='taxnew')return openTaxFor(c.id);if(a==='taxopen'){const L=S.led(c),tx=L&&S.taxOf(L);return tx&&window.PKG_TAX_WINDOW&&PKG_TAX_WINDOW.show?PKG_TAX_WINDOW.show(L.id,tx.no):false;}
  if(a==='inva4')return printInvoice(c.id,'a4');if(a==='inv80')return printInvoice(c.id,'80');if(a==='rcpt')return printSaleReceipts(c.id);});
 const redraw=()=>{try{if(typeof rOvPane!=='undefined'&&MINE.includes(rOvPane))draw(rOvPane);}catch(e){}
  try{if(M&&M.classList.contains('on')&&SC.state.cur&&typeof window.pkgSaleRender==='function')window.pkgSaleRender();}catch(e){}};

 /* ---------- ใบแจ้งหนี้: its own window (phase 8) — not the cut window ---------- */
 const IW=document.createElement('div');IW.className='modal pkg-docwin';IW.id='mSaleInv';
 IW.innerHTML=`<div class="sheet"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2 id="sivTitle">ใบแจ้งหนี้</h2><span class="tag" id="sivState"></span><div class="spacer"></div><button class="btn gh pkg-x-close" type="button" data-iv="close" title="ปิด" aria-label="ปิด">✕</button></header>
  <div class="apvbar" id="sivApvBar"></div>
  <div class="body">
   <p class="pkg-sf-oldver" id="sivDraftNote" hidden>เอกสารใหม่ — ยังไม่ได้บันทึก · ตรวจรายการแล้วกด “บันทึก” ระบบจะออกเลขที่และส่งรออนุมัติ · ปิดหน้าต่าง = ไม่สร้างเอกสาร</p>
   <div class="pkg-doc-tools" id="sivTools">
    <fieldset class="pkg-fs"><legend>แถบเครื่องมือ</legend><div class="pkg-sa-toolcol"><button type="button" class="btn pkg-sa-red" data-iv="cancel">ยกเลิกเอกสาร</button><p class="hint" id="sivNote"></p></div></fieldset>
    <fieldset class="pkg-fs"><legend>พิมพ์ / เงื่อนไขการพิมพ์เอกสาร</legend><div class="pkg-sa-printcol"><button type="button" class="btn pkg-sa-teal" data-iv="a4">ใบแจ้งหนี้ (A4)</button><button type="button" class="btn pkg-sa-teal" data-iv="80">ใบแจ้งหนี้ (80 มม.)</button><p class="hint" id="sivPrintNote" hidden style="grid-column:1/-1;margin:0">รออนุมัติ — พิมพ์ใบแจ้งหนี้ได้หลังอนุมัติ</p></div></fieldset>
   </div>
   <fieldset class="pkg-fs"><legend>ข้อมูลเอกสาร</legend><div class="pkg-sa-g4">
    <label class="f"><span>เลขที่ใบแจ้งหนี้</span><input type="text" id="sivNo" readonly class="ctr"></label>
    <label class="f"><span>วันที่ใบแจ้งหนี้</span><input type="text" id="sivDate" readonly class="ctr"></label>
    <label class="f"><span>ครบกำหนดชำระ</span><input type="text" id="sivDue" readonly class="ctr"></label>
    <div class="f"><span>อ้างอิงใบตัดสต็อก</span><div class="pkg-sf-ref"><span class="docno" data-iv="cut" id="sivCut" data-no-translate title="เปิดใบตัดสต็อก"></span><span id="sivCutSt"></span></div></div></div></fieldset>
   <fieldset class="pkg-fs"><legend>ลูกค้า</legend><div class="pkg-sa-g4">
    <label class="f"><span>ชื่อลูกค้า</span><input type="text" id="sivCust" readonly></label>
    <label class="f"><span>ประเภทลูกค้า</span><input type="text" id="sivCustType" readonly></label>
    <label class="f"><span>เลขประจำตัวผู้เสียภาษีอากร</span><input type="text" id="sivCustTax" readonly></label>
    <label class="f"><span>โทรศัพท์</span><input type="text" id="sivCustTel" readonly></label>
    <label class="f" style="grid-column:1/-1"><span>ที่อยู่</span><input type="text" id="sivCustAddr" readonly></label></div></fieldset>
   <fieldset class="pkg-fs"><legend>รายการตามใบตัดสต็อก</legend>
    <div class="pkg-tx-sum"><div class="scroll"><table class="tbl" id="sivLines"><thead><tr><th class="ctr" style="width:56px">ลำดับ</th><th style="width:150px">รหัสสินค้า</th><th>รายการ</th><th class="num" style="width:90px">จำนวน</th><th class="num" style="width:120px">ราคา / หน่วย</th><th class="num" style="width:130px">จำนวนเงิน</th></tr></thead><tbody></tbody></table></div>
     <div class="pkg-tx-tot" id="sivTot"></div></div></fieldset>
   <fieldset class="pkg-fs"><legend>บุคคลที่เกี่ยวข้อง</legend><div class="pkg-sa-g4">
    <label class="f"><span>วันที่ / เวลา สร้างข้อมูล</span><input type="text" id="sivAt" readonly></label><label class="f"><span>ผู้บันทึก (ผู้สร้างข้อมูล)</span><input type="text" id="sivBy" readonly></label></div></fieldset>
   <div class="pkg-foot-save" id="sivFoot" hidden><button type="button" class="btn pri" data-iv="save">บันทึก</button></div>
  </div></div></div>
  <div class="pkg-side-tools" role="toolbar" aria-label="เครื่องมือเอกสาร"><div class="pkg-side-group">
   <button type="button" class="pkg-side-btn s-close" data-iv="close" title="ปิดหน้าต่าง" aria-label="ปิดหน้าต่าง"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
   <button type="button" class="pkg-side-btn s-save" data-iv="save" id="sivRailSave" title="บันทึก" aria-label="บันทึก"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(IW);
 if(window.PKG_RAIL)PKG_RAIL.attach('mSaleInv');
 let IV=null;   /* {sale, no} = a stored invoice · {sale, draft:true} = a new one being checked (nothing stored yet) */
 const ivFind=()=>{const c=IV&&SC.list().find(x=>x.id===IV.sale),L=c&&S.led(c);if(!L)return null;
  if(IV.draft)return {c,L,d:{no:'',date:iso(),draft:true}};
  const d=S.invAll(L).find(x=>x.no===IV.no);return d?{c,L,d}:null;};
 const APVL={pending:['รออนุมัติ','a'],approved:['อนุมัติแล้ว','g'],rejected:['ไม่อนุมัติ','r']};
 function apvBar(f){
  const d=f.d,bar=$i('sivApvBar'),may=S.mayInvApv();
  if(d.draft){bar.innerHTML=`<b style="font-size:12.5px">สถานะการอนุมัติ</b> <span class="chip">ร่าง</span><span class="who">ยังไม่ได้บันทึก — บันทึกแล้วเอกสารจะรออนุมัติ</span><div class="spacer"></div><div class="apv-actions">${may?'<button type="button" class="btn sm grn" data-iv="approve" title="บันทึกและอนุมัติในครั้งเดียว">อนุมัติ</button>':''}</div>`;return;}
  const st=S.invApv(d),a=d.apv||null,[lbl,cls]=APVL[st],dead=!!d.cancelled||!!f.c.cancelled;
  const who=!a?'เอกสารที่สร้างก่อนมีขั้นตอนอนุมัติ — นับเป็นอนุมัติแล้ว':st==='approved'?'อนุมัติโดย '+a.byName+' เมื่อ '+thDate(a.date):st==='rejected'?'ตีกลับโดย '+a.byName+' เมื่อ '+thDate(a.date)+(a.note?' · เหตุผล: '+a.note:''):'บันทึกเมื่อ '+thDate(a.date)+' โดย '+(a.byName||'-')+' — รอผู้มีสิทธิอนุมัติ';
  bar.innerHTML=`<b style="font-size:12.5px">สถานะการอนุมัติ</b> <span class="chip ${cls}">${lbl}</span><span class="who" data-no-translate>${esc(who)}</span><div class="spacer"></div><div class="apv-actions">
    ${may&&!dead&&st!=='rejected'?`<button type="button" class="btn sm grn" data-iv="approve"${st==='approved'?' disabled title="เอกสารนี้อนุมัติแล้ว"':''}>${st==='approved'?'อนุมัติแล้ว':'อนุมัติ'}</button>`:''}
    ${may&&!dead&&st==='pending'?'<button type="button" class="btn sm dgr" data-iv="reject">ไม่อนุมัติ / ตีกลับ</button>':''}</div>`;
 }
 function paintInv(){
  const f=ivFind();if(!f)return;const {c,L,d}=f,draft=!!d.draft,I=invInfo(c,draft?{no:'',date:iso()}:d),st=I.st,t=I.t,cu=c.custId?findCust(c.custId):null,apv=draft?'':S.invApv(d),rej=apv==='rejected',off=!!d.cancelled||!!c.cancelled||rej,adj=n(t.adjGross),e=L.whtExp||{};
  const no=draft?S.invPeek(c):d.no;
  $i('sivTitle').textContent=draft?'ใบแจ้งหนี้ — เอกสารใหม่':'ใบแจ้งหนี้ '+d.no;
  $i('sivState').innerHTML=draft?'<span class="stbtn st-grey">เอกสารใหม่</span>':(rej?'<span class="stbtn st-red">ไม่อนุมัติ</span>':off?'<span class="stbtn st-red">ยกเลิกแล้ว</span>':apv==='pending'?'<span class="stbtn st-orange">รออนุมัติ</span>':st.rem<=0.005?'<span class="stbtn st-green">ชำระครบแล้ว</span>':st.k==='credit'?'<span class="stbtn st-blue">เงินเชื่อ · ค้างชำระ</span>':st.k==='part'?'<span class="stbtn st-blue">ชำระบางส่วน</span>':'<span class="stbtn st-orange">รอชำระ</span>')+(d.legacy?' <span class="stbtn st-grey">เอกสารเดิม</span>':'');
  apvBar(f);
  $i('sivNo').value=draft?no+' (เลขที่ถัดไป — ออกเมื่อบันทึก)':no;$i('sivDate').value=thDate(I.date);$i('sivDue').value=thDate(I.payBy)+(c.credit&&n(c.credit.days)?' (เครดิต '+n(c.credit.days)+' วัน)':'');
  $i('sivCut').textContent=c.no;$i('sivCutSt').innerHTML=window.PKG_SALE_PAY?PKG_SALE_PAY.chip(c,0):'';
  $i('sivCust').value=cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)';$i('sivCustType').value=cu?(cu.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'):'-';$i('sivCustTax').value=(cu&&cu.tax)||'-';$i('sivCustTel').value=(cu&&cu.tel)||'-';$i('sivCustAddr').value=cu&&typeof addrLine==='function'?addrLine(cu.addr):'';
  const its=(L.items||[]).filter(it=>it&&(it.code||it.name||n(it.price)));
  $i('sivLines').tBodies[0].innerHTML=its.map((it,i)=>`<tr><td class="ctr">${i+1}</td><td class="mono" data-no-translate>${esc(it.code||'-')}</td><td data-no-translate>${esc(it.name||'')}</td><td class="num">${qf(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')||'<tr><td colspan="6" class="ctr hint">ไม่มีรายการ</td></tr>';
  const row=(k,v,big)=>`<div${big?' class="big"':''}><span>${k}</span><span>${v}</span></div>`;
  $i('sivTot').innerHTML=row('รวมเป็นเงิน',money(t.sub))+(n(t.disc)>0?row('หักส่วนลด',money(t.disc)):'')+(adj?row('ปรับเพิ่ม / ลด (รวม VAT)',(adj>0?'+':'−')+money(Math.abs(adj))):'')+row('มูลค่าก่อนภาษี',money(t.base))+row('ภาษีมูลค่าเพิ่ม '+n(L.vat)+'%',money(t.vat))+row('ยอดรวมทั้งสิ้น',money(t.gross),1)
   +row('รับชำระแล้ว'+(st.wht>0?' (รวมหัก ณ ที่จ่าย '+money(st.wht)+')':''),money(st.got+st.wht))+(I.exp>0?row('คาดว่าลูกค้าหัก ณ ที่จ่าย '+n(e.rate)+'%',money(I.exp)):'')+row('คงค้าง',money(st.rem),1)+(I.exp>0&&st.rem>0.005?row('ยอดที่ลูกค้าควรโอน (หลังหัก ณ ที่จ่าย)',money(I.due),1):'');
  $i('sivAt').value=draft?'-':d.at?thDateTime(d.at):thDate(d.date);$i('sivBy').value=draft?'-':d.byName?String(d.byName).replace(/^.*· /,''):(d.legacy?'เอกสารเดิม':'-');
  const mayVoid=!curEmp()||!!can('m.rcptDoc_cancel');
  $i('sivDraftNote').hidden=!draft;$i('sivTools').hidden=draft;$i('sivFoot').hidden=!draft;$i('sivRailSave').hidden=!draft;
  IW.querySelector('[data-iv="cancel"]').hidden=draft||off||!!d.legacy||!mayVoid;
  $i('sivNote').textContent=draft?'':d.cancelled?'ยกเลิกแล้ว — '+(d.cancelReason||'')+' · '+thDate(d.cancelDate)+' · '+(d.cancelBy||''):rej?'ไม่อนุมัติ — เลขที่นี้จะไม่ถูกนำมาใช้อีก · ใบตัดสต็อกออกใบแจ้งหนี้ใหม่ได้ (เลขที่ใหม่)':c.cancelled?'ใบตัดสต็อก '+c.no+' ถูกยกเลิกแล้ว':d.legacy?'เอกสารเดิมของระบบเดิม — ยกเลิกที่หน้านี้ไม่ได้':'ยกเลิกแล้วเลขที่นี้จะไม่ถูกนำมาใช้อีก · ใบตัดสต็อกออกใบแจ้งหนี้ใหม่ได้ (เลขที่ใหม่)';
  const canPrint=!draft&&!off&&d===S.invOk(L)&&mayPrint();
  IW.querySelectorAll('[data-iv="a4"],[data-iv="80"]').forEach(b=>{b.hidden=!canPrint;});$i('sivPrintNote').hidden=draft||off||apv!=='pending';
 }
 function openInvoice(saleId,no){
  const c=SC.list().find(x=>x.id===saleId),L=c&&S.led(c);if(!L)return false;const all=S.invAll(L);if(!all.length)return false;
  if(!mayView()){toast('บัญชีนี้ไม่มีสิทธิ์ดูเอกสารนี้');return false;}
  IV={sale:saleId,no:no&&all.some(x=>x.no===no)?no:(S.invOf(L)||all[all.length-1]).no};paintInv();openModal('mSaleInv');IW.scrollTop=0;return true;
 }
 /* "สร้างใบแจ้งหนี้" (every entry point): the window opens as a DRAFT to be checked — nothing is stored until "บันทึก" */
 function makeInvoice(saleId){
  if(!on())return false;const er=S.invCan(saleId);if(er){toast(er);return false;}
  if(!mayAdd()){toast('บัญชีนี้ไม่มีสิทธิ์สร้างเอกสารนี้');return false;}
  IV={sale:saleId,draft:true};paintInv();openModal('mSaleInv');IW.scrollTop=0;return true;
 }
 /* "บันทึก" of the draft: the number is taken now, the paper waits for approval */
 function saveInvoice(){
  if(!IV||!IV.draft)return false;const v=S.createInvoice(IV.sale);if(!v)return false;
  IV={sale:IV.sale,no:v.no};paintInv();redraw();toast('บันทึกใบแจ้งหนี้ '+v.no+' แล้ว — รออนุมัติ');return v;
 }
 IW.addEventListener('click',async e=>{const a=e.target.closest('[data-iv]')?.dataset.iv,f=ivFind();if(!a)return;
  if(a==='close')return closeModal('mSaleInv');if(!f)return;
  if(a==='save')return saveInvoice();
  if(a==='cut'){closeModal('mSaleInv');return window.pkgOpenCut(f.c.id);}
  if(a==='approve'){if(IV.draft&&!saveInvoice())return;               /* like quotes: a holder of the right may save and approve in one press */
   const d=S.approveInvoice(IV.sale);if(d){toast('อนุมัติเอกสาร '+d.no+' แล้ว โดย '+meName());if(typeof saveFx==='function')saveFx('อนุมัติเอกสารแล้ว',d.no);paintInv();redraw();if(typeof renderApvAlert==='function')renderApvAlert();}return;}
  if(a==='reject'){const no=f.d.no;if(await S.rejectInvoice(IV.sale)){toast('ตีกลับเอกสาร '+no+' แล้ว');paintInv();redraw();if(typeof renderApvAlert==='function')renderApvAlert();}return;}
  if(a==='a4')return printInvoice(f.c.id,'a4');if(a==='80')return printInvoice(f.c.id,'80');
  if(a==='cancel'){if(await S.cancelInvoice(f.c)){toast('ยกเลิกใบแจ้งหนี้ '+f.d.no+' แล้ว');paintInv();redraw();if(typeof renderApvAlert==='function')renderApvAlert();}}});
 /* ---------- phase 9b: approval in the registers and on the home page ----------
    · ticked rows of 4.2 → "อนุมัติใบที่เลือก" (same record as the button in the window; the rest stay ticked)
    · home "เอกสารรอคุณอนุมัติ" (pendingApvList) also counts invoices waiting, for accounts that hold the matrix's approval tick of the invoice row (apv.invoice) */
 async function approveMany(id,keys){
  if(!S.mayInvApv())return toast('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  const rows=[];(DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale)return;const d=S.invOf(L),c=S.saleOf(L);if(d&&c&&keys.includes(d.no))rows.push({c,d});});
  const ok=rows.filter(x=>S.invApv(x.d)==='pending'&&!x.c.cancelled&&here(x.c)),skipped=keys.length-ok.length;
  if(!ok.length)return toast('ไม่มีใบที่อนุมัติได้ในรายการที่เลือก');
  const nos=ok.slice(0,6).map(x=>esc(x.d.no)).join(', ')+(ok.length>6?' และอีก '+(ok.length-6)+' ใบ':'');
  if(!await askP({title:'อนุมัติเอกสารที่เลือก',msg:`<div class="pkg-imp-l"><b>อนุมัติ ${ok.length} ใบ</b><div class="hint">${nos}</div></div>`+(skipped?`<div class="pkg-imp-l skip"><b>ไม่อนุมัติ ${skipped} ใบ</b><div class="hint">อนุมัติแล้ว / ไม่อนุมัติ / ยกเลิกแล้ว / สาขาอื่น</div></div>`:'')+`<div class="pkg-imp-q">อนุมัติโดย ${esc(meName())} · ยืนยันหรือไม่?</div>`,yes:'อนุมัติ '+ok.length+' ใบ',no:'ยกเลิก'}))return;
  const RN=window.PKG_ROW_NUMBER,sel=RN&&RN.selected(id);let done=0;
  ok.forEach(x=>{if(S.approveInvoice(x.c,{hold:true,bulk:ok.length})){done++;if(sel)sel.delete(x.d.no);}});
  save();redraw();if(typeof renderApvAlert==='function')renderApvAlert();if(RN)RN.number(id);
  if(typeof saveFx==='function')saveFx('อนุมัติเอกสารแล้ว',done+' ใบ');
  toast('อนุมัติแล้ว '+done+' ใบ'+(skipped?' · ไม่อนุมัติ '+skipped+' ใบ — ยังติ๊กค้างไว้':''));
 }
 /* owner 12 Oct: the ticks of 4.1–4.4 only export the ticked rows — "อนุมัติใบที่เลือก" is no longer offered in the bar of 4.2
    (an invoice is approved in its window); approveMany stays as a function. The four registers (and 4.1) are read line
    by line for that file. */
 ['scutTbl','sinvTbl','srcpTbl','swhtTbl','swhtOutTbl'].forEach(id=>{const t=$i(id);if(t)t.dataset.pkgSnap='lines';});
 window.pkgOpenSaleInv=key=>{const [sid,no]=String(key).split('|');try{go('receipt');rOvGo('inv');const e=$i('sinvState');if(e){e.value='pend';pkgRenderInv();}}catch(err){}return openInvoice(sid,no);};
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='saleinv'))APV_SRC.push(['saleinv','ใบแจ้งหนี้ (4.2)',()=>[],'pkgOpenSaleInv','receipt']);
 const pendInv=()=>{const out=[];if(!on()||!curEmp&&false)return out;if(!S.mayInvApv())return out;
  (DB.receipts||[]).forEach(L=>{if(!L||!L.pkgSale||L.cancelled)return;const d=S.invOf(L),c=S.saleOf(L);if(!d||!c||c.cancelled||S.invApv(d)!=='pending')return;
   out.push({kind:'saleinv',label:'ใบแจ้งหนี้ (4.2)',opener:'pkgOpenSaleInv',tab:'receipt',id:c.id+'|'+d.no,no:d.no,date:d.apv.date,by:d.apv.byName||'-',d:{id:c.id+'|'+d.no,no:d.no,apv:d.apv,custId:c.custId,br:c.br}});});
  return out;};
 if(typeof pendingApvList==='function'){const o=pendingApvList;pendingApvList=function(){const out=o.apply(this,arguments),mine=pendInv();
  return mine.length?out.concat(mine).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))):out;};}
 /* phase 10g: the right to approve an invoice is the "อนุมัติ" tick of the invoice row of the rights matrix. While the flow is
    on that cell says so (tooltip + screen-reader label) and one line under the table names the tick. */
 {const APV_TIP='อนุมัติใบแจ้งหนี้ (4.2) — ติ๊กช่องนี้เพื่อให้พนักงานอนุมัติ / ไม่อนุมัติใบแจ้งหนี้ได้';
  const apvTip=()=>{try{const box=$i('pkg-perm-matrix'),cb=box&&box.querySelector('.pk[data-k="rcptDoc_apv"]');if(!cb)return;const td=cb.closest('td'),row=cb.closest('tr').querySelector('.pkg-perm-rowbtn');
    let note=box.querySelector('.pkg-sf-apvnote');
    if(on()){td.title=APV_TIP;cb.title=APV_TIP;cb.setAttribute('aria-label','อนุมัติใบแจ้งหนี้ (4.2)');td.classList.add('pkg-sf-apvcell');
     if(!note){note=document.createElement('p');note.className='hint pkg-sf-apvnote';const tb=box.querySelector('.scroll');if(tb)tb.after(note);}
     note.innerHTML='<span>สิทธิอนุมัติใบแจ้งหนี้ (4.2) = ช่อง “อนุมัติ” ของแถว</span> <b></b>';note.querySelector('b').textContent=row?row.textContent.trim():'';}
    else{td.removeAttribute('title');cb.removeAttribute('title');td.classList.remove('pkg-sf-apvcell');if(note)note.remove();}}catch(e){}};
  ['permBoxes','permPreset'].forEach(fn=>{const o=window[fn];if(typeof o==='function')window[fn]=function(){const out=o.apply(this,arguments);apvTip();return out;};});
  window.PKG_SALE_APVTIP=apvTip;}
 /* ---------- pick lists of "+ สร้างใบแจ้งหนี้" (4.2) and "+ สร้างใบเสร็จรับเงิน" (4.3) ---------- */
 const PK=document.createElement('div');PK.className='modal';PK.id='mSalePick';
 PK.innerHTML=`<div class="sheet" style="max-width:1040px"><div class="panel" style="margin-bottom:0"><header><h2 id="pkTitle"></h2></header><div class="body">
   <p class="hint" id="pkHint"></p>
   <div class="pkg-sf-pickbar">
    <div class="pkg-sf-pickdate"><label class="f"><span>ช่วงวันที่</span><select id="pkDateMode"><option value="" selected>เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="one">วันที่ระบุ</option><option value="range">ช่วงวันที่</option><option value="month">เดือนปี</option></select></label>
     <input type="date" id="pkDateD1" style="display:none" aria-label="วันที่"><span id="pkDateD2Wrap" style="display:none;white-space:nowrap"><span class="hint">ถึง</span> <input type="date" id="pkDateD2" aria-label="ถึงวันที่"></span>
     <span id="pkDateMonthWrap" style="display:none;white-space:nowrap"><select id="pkDateMonthM" aria-label="เดือน"></select> <select id="pkDateMonthY" aria-label="ปี"></select></span></div>
    <label class="f pkg-sf-pickq"><span>ค้นหา</span><input type="text" id="pkQ" autocomplete="off" placeholder="เลขที่ใบตัดสต็อก / ชื่อลูกค้า + Enter"></label>
    <div class="pkg-sf-pickbtns"><button type="button" class="btn pkg-sf-go" data-pk="find"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button><button type="button" class="btn gh" data-pk="clear">ล้างตัวกรอง</button></div></div>
   <div class="pkg-sf-pickpg" id="pkPgTop"><label class="f"><span>แสดง</span><select id="pkLimit" aria-label="จำนวนรายการต่อหน้า"><option value="50" selected>50 รายการ</option><option value="100">100 รายการ</option><option value="500">500 รายการ</option></select></label><span class="hint" id="pkInfo"></span><span class="pkg-sf-pgslot"></span></div>
   <div class="scroll"><table class="tbl rt" id="pkTbl"><thead><tr><th class="ctr" style="width:56px" id="pkTh0">เลือก</th><th style="width:170px">เลขที่ใบตัดสต็อก</th><th class="ctr" style="width:110px">วันที่</th><th>ชื่อลูกค้า</th><th class="num" style="width:120px">ยอดรวม</th><th class="num" style="width:120px">คงค้าง</th><th style="width:170px">สถานะ</th><th class="ctr" style="width:150px" id="pkTh7">จัดการ</th></tr></thead><tbody></tbody></table></div>
   <div class="pkg-sf-pickpg bot" id="pkPgBot"><span class="hint" id="pkInfo2"></span><span class="pkg-sf-pgslot"></span></div>
   <div class="empty" id="pkEmpty" style="display:none"></div><p class="hint" id="pkMore" hidden></p>
  </div><footer class="pkg-sr-foot"><span class="hint" id="pkSel"></span><button type="button" class="btn gh" onclick="closeModal('mSalePick')">ปิด</button><button type="button" class="btn pri" data-pk="go" id="pkGo">สร้างใบเสร็จรับเงิน</button></footer></div></div>`;
 /* phase 11 — third use of the window: "+ ออกใบกำกับภาษีใหม่" (4.6). Cuts with VAT, a named customer and no active tax invoice,
    every customer, newest first. ONE cut is chosen (the tax window carries one document per tax invoice), then the tax
    window opens with it — customer, buyer block, lines and totals filled; nothing is issued until its own บันทึก. */
 const taxRow=c=>{const L=S.led(c);return !!(L&&c.custId&&n(c.vat)>0&&!S.taxOf(L));};
 (document.getElementById('pkg-app')||document.body).append(PK);
 let PM={mode:'inv',ticks:{}};
 const ownOk=c=>typeof pkgOwnOk!=='function'||pkgOwnOk('rcptCut',c);
 function pickRows(){
  /* (owner 12 Oct) the filter row works like a register's: date range first (the registers' own control), the search box, a
     search button — the list changes on the button / Enter, not on every keystroke; ticks stay while filtering */
  const q=String($i('pkQ').value||'').toLowerCase().trim(),inDate=rows=>applyDateFilter(rows.map(x=>({date:x.c.date,x})),'pkDate').map(y=>y.x);
  return inDate(SC.list().filter(c=>c&&!c.cancelled&&!c.superseded&&here(c)&&ownOk(c)&&S.led(c)).map(c=>{const st=S.stat(c),nr=S.noReceipt(c).length;return {c,st,nr,cust:custOf(c.custId)};})
   .filter(x=>PM.mode==='tax'?taxRow(x.c):PM.mode==='inv'?!S.invCan(x.c):(x.st.rem>0.005&&['wait','part','credit'].includes(x.st.k))||x.nr>0)
   .filter(x=>hit(q,[x.c.no,x.cust]))).sort((a,b)=>String(b.c.date).localeCompare(String(a.c.date))||String(b.c.no).localeCompare(String(a.c.no)));
 }
 function paintPick(){
  /* rows per page + pager like a register (owner 12 Oct: "ต้องมีตัวกรองจำนวนที่แสดงต่อหน้าด้วย"): the registers' own texts, page
     buttons (limGo → LIM_RENDER.pk = this function) and page memory (LIM_PAGE.pk); ticks are kept by cut id, so they
     survive paging and the footer counts all of them */
  const inv=PM.mode==='inv',tax=PM.mode==='tax',rows=pickRows(),lim=n($i('pkLimit').value)||50,total=rows.length,pages=Math.max(1,Math.ceil(total/lim));
  const cur=Math.min(pages,Math.max(1,n(LIM_PAGE.pk)||1));LIM_PAGE.pk=cur;
  const shown=rows.slice((cur-1)*lim,cur*lim),pgTxt=pages<=1?'พบ '+total+' รายการ · ครบทุกรายการ':'พบ '+total+' รายการ · แสดง '+((cur-1)*lim+1)+'–'+Math.min(total,cur*lim)+' · หน้า '+cur+'/'+pages;
  const pgBar=pages<=1?'<span class="pgbar pkg-pg-one"><button type="button" disabled title="หน้าก่อนหน้า">‹</button><button type="button" class="on">1</button><button type="button" disabled title="หน้าถัดไป">›</button></span>'
   :'<span class="pgbar">'+`<button type="button" onclick="limGo('pk',${cur-1})" ${cur<=1?'disabled':''} title="หน้าก่อนหน้า">‹</button>`
    +(typeof pageNums==='function'?pageNums(cur,pages):Array.from({length:pages},(_,i)=>i+1)).map(x=>x==='...'?'<span class="gap">…</span>':`<button type="button" class="${x===cur?'on':''}" onclick="limGo('pk',${x})">${x}</button>`).join('')
    +`<button type="button" onclick="limGo('pk',${cur+1})" ${cur>=pages?'disabled':''} title="หน้าถัดไป">›</button>`+'</span>';
  $i('pkInfo').textContent=pgTxt;$i('pkInfo2').textContent=pgTxt;PK.querySelectorAll('.pkg-sf-pgslot').forEach(x=>{x.innerHTML=pgBar;});$i('pkPgBot').hidden=!total;
  $i('pkTitle').textContent=tax?'ออกใบกำกับภาษี — เลือกใบตัดสต็อก':inv?'สร้างใบแจ้งหนี้ — เลือกใบตัดสต็อก':'สร้างใบเสร็จรับเงิน — เลือกใบตัดสต็อก';
  $i('pkGo').textContent=tax?'ออกใบกำกับภาษี':'สร้างใบเสร็จรับเงิน';
  $i('pkHint').textContent=tax?'ใบตัดสต็อกที่มี VAT ระบุลูกค้า และยังไม่มีใบกำกับภาษี · ใบกำกับภาษี 1 ใบ ต่อใบตัดสต็อก 1 ใบ — เลือก 1 ใบ แล้วกด “ออกใบกำกับภาษี” (ข้อมูลลูกค้าและรายการถูกกรอกให้ ตรวจแล้วกดบันทึกในหน้าต่างถัดไป)':inv?'ใบตัดสต็อกที่ยังรับเงินไม่ครบ หรือเป็นเงินเชื่อ และยังไม่มีใบแจ้งหนี้ · ใบตัดสต็อก 1 ใบ มีใบแจ้งหนี้ได้ 1 ใบ (หลายใบรวมกัน = 4.5 ใบวางบิล)':'เลือกหลายใบของลูกค้ารายเดียวกันเพื่อออกใบเสร็จรวม · เลือกใบเดียว = ใบเสร็จของใบนั้น · ใบเงินเชื่อรับชำระที่หน้าตัดชำระลูกหนี้';
  $i('pkTh0').hidden=inv;$i('pkTh7').hidden=!inv;$i('pkGo').hidden=inv;
  $i('pkTbl').tBodies[0].innerHTML=shown.map(x=>{const c=x.c,st=x.st;
   return `<tr data-id="${esc(c.id)}">${inv?'':`<td class="ctr" data-l="เลือก"><input type="${tax?'radio" name="pkOne':'checkbox'}" data-pk="tick" aria-label="เลือก ${esc(c.no)}"${PM.ticks[c.id]?' checked':''}></td>`}<td class="mono" data-l="เลขที่ใบตัดสต็อก" data-no-translate>${esc(c.no)}</td><td class="ctr" data-l="วันที่">${thDate(c.date)}</td><td data-l="ชื่อลูกค้า"><span data-no-translate>${esc(x.cust)}</span>${tax&&!String((findCust(c.custId)||{}).tax||'').trim()?'<div class="hint">ยังไม่มีเลขผู้เสียภาษี — ใส่ในหน้าต่างถัดไป</div>':''}</td><td class="num" data-l="ยอดรวม">${money(st.total)}</td><td class="num" data-l="คงค้าง"><b>${money(st.rem)}</b></td>
    <td data-l="สถานะ">${window.PKG_SALE_PAY?PKG_SALE_PAY.chip(c,0):''}${!inv&&x.nr?`<div class="hint">รับเงินแล้ว ยังไม่ออกใบเสร็จ ${x.nr} รายการ</div>`:''}</td>${inv?`<td class="ctr rt-x"><button type="button" class="btn sm pri" data-pk="inv">สร้างใบแจ้งหนี้</button></td>`:''}</tr>`;}).join('');
  $i('pkEmpty').style.display=rows.length?'none':'block';$i('pkEmpty').textContent=tax?'ไม่มีใบตัดสต็อกที่รอออกใบกำกับภาษี (ต้องมี VAT และระบุลูกค้า)':inv?'ไม่มีใบตัดสต็อกที่รอออกใบแจ้งหนี้':'ไม่มีใบตัดสต็อกที่รอรับชำระ หรือรอออกใบเสร็จ';
  $i('pkMore').hidden=true;   /* the "first 100" note is replaced by the pager */
  const nT=Object.keys(PM.ticks).filter(k=>PM.ticks[k]).length;$i('pkSel').textContent=inv?'':(nT?'เลือกแล้ว '+nT+' ใบ':'ยังไม่ได้เลือก');
 }
 function openPick(mode){
  if(!on())return;
  if(mode==='tax'){if(typeof isVatReg==='function'&&!isVatReg())return toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');if(!can('doc.rIssue'))return toast('บัญชีนี้ไม่มีสิทธิออกใบกำกับภาษี');}
  else{if(!mayAdd())return toast('บัญชีนี้ไม่มีสิทธิ์สร้างเอกสารนี้');
   if(mode==='rcp'&&!mayRecv())return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');}
  PM={mode:mode==='rcp'?'rcp':mode==='tax'?'tax':'inv',ticks:{}};pickReset();LIM_PAGE.pk=1;paintPick();openModal('mSalePick');
 }
 /* "+ สร้างใบเสร็จรับเงิน": one cut → its receipt (receivings without one get theirs; otherwise the receive step, which issues it);
    a credit cut, or several cuts of ONE customer → the settlement window (the debtor page) with those bills ticked and
    "ใบเสร็จใบเดียวรวมทุกบิล" chosen */
 function pickGo(){
  const cs=Object.keys(PM.ticks).filter(k=>PM.ticks[k]).map(id=>SC.list().find(x=>x.id===id)).filter(Boolean);
  if(!cs.length)return toast('เลือกใบตัดสต็อกก่อน');
  if(PM.mode==='tax'){if(cs.length>1)return toast('ใบกำกับภาษี 1 ใบ ต่อใบตัดสต็อก 1 ใบ — เลือกใบเดียว');closeModal('mSalePick');return openTaxFor(cs[0].id);}
  const settle=(cust,list)=>{closeModal('mSalePick');return settleFor(cust,list.map(c=>S.led(c).id),{share:true});};
  if(cs.length===1){const c=cs[0],st=S.stat(c),nr=S.noReceipt(c);
   if(nr.length){let last=null;nr.forEach(p=>{const r=S.issueReceipt(c,p.id);if(r)last=r;});if(!last)return;
    toast('สร้างใบเสร็จรับเงิน '+nr.map(p=>p.reNo).filter(Boolean).join(', ')+' แล้ว'+(st.rem>0.005?' · ยังค้างชำระ '+money(st.rem)+' บาท':''));closeModal('mSalePick');redraw();return D.openReceipt(c.id,last.id);}
   if(st.k==='credit'){if(!c.custId)return toast('ใบเงินเชื่อต้องมีลูกค้า');return settle(c.custId,[c]);}
   closeModal('mSalePick');return window.PKG_SALE_PAY&&PKG_SALE_PAY.receive(c.id,{issue:true});}
  if(cs.some(c=>!c.custId))return toast('ใบตัดสต็อกของลูกค้าทั่วไป (ไม่ระบุลูกค้า) ออกใบเสร็จได้ทีละใบ — เลือกใบเดียว');
  if(new Set(cs.map(c=>c.custId)).size>1)return toast('ออกใบเสร็จรวมได้เฉพาะใบตัดสต็อกของลูกค้ารายเดียวกัน — เลือกใหม่ให้เป็นลูกค้ารายเดียว');
  const done=cs.find(c=>!(S.stat(c).rem>0.005));if(done)return toast('ใบตัดสต็อก '+done.no+' รับชำระครบแล้ว (รอออกใบเสร็จ) — ออกใบเสร็จของใบนี้แยกทีละใบ');
  return settle(cs[0].custId,cs);
 }
 const pickReset=()=>{$i('pkQ').value='';$i('pkDateMode').value='';['pkDateD1','pkDateD2'].forEach(id=>{$i(id).value='';});if(typeof toggleDateFilterUI==='function')toggleDateFilterUI('pkDate');};
 if(typeof fillYearSelect==='function')fillYearSelect('pkDateMonthY');if(typeof fillMonthSelect==='function')fillMonthSelect('pkDateMonthM');
 $i('pkDateMode').onchange=()=>{if(typeof toggleDateFilterUI==='function')toggleDateFilterUI('pkDate');};       /* shows the date / month fields; the list waits for the button */
 PK.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pkQ'){e.preventDefault();LIM_PAGE.pk=1;paintPick();}});
 if(typeof LIM_RENDER==='object')LIM_RENDER.pk=()=>paintPick();   /* the page buttons call limGo('pk',n): it redraws through this entry */
 $i('pkLimit').onchange=()=>{LIM_PAGE.pk=1;paintPick();};          /* another page size = back to page 1 */
 PK.addEventListener('change',e=>{const t=e.target;if(t.dataset.pk==='tick'){if(PM.mode==='tax')PM.ticks={};PM.ticks[t.closest('tr').dataset.id]=t.checked;const nT=Object.keys(PM.ticks).filter(k=>PM.ticks[k]).length;$i('pkSel').textContent=nT?'เลือกแล้ว '+nT+' ใบ':'ยังไม่ได้เลือก';}});
 PK.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(!b)return;const a=b.dataset.pk;
  if(a==='find'){LIM_PAGE.pk=1;return paintPick();}
  if(a==='clear'){pickReset();LIM_PAGE.pk=1;return paintPick();}
  if(a==='go')return pickGo();
  if(a==='inv'){const id=b.closest('tr').dataset.id;closeModal('mSalePick');return makeInvoice(id);}});
 /* the debtor settlement window for ONE customer with these bills ticked (ledger / receipt ids). The window is opened
    without a bill id: a single cash cut would otherwise be sent to its own receive step (sale-flow.js openPartPay). */
 function settleFor(cust,ids,o){
  if(!cust){toast('เอกสารนี้ไม่มีลูกค้า — ตัดชำระที่หน้าลูกหนี้ไม่ได้');return false;}
  openPartPay('ar',cust);
  const X=window.PKG_SETTLE,St=X&&X.state();if(!St||!$i('mPartPay')||!$i('mPartPay').classList.contains('on'))return false;
  if(St.party!==cust){toast('ไม่พบยอดค้างของลูกค้ารายนี้ในหน้าตัดชำระ');return false;}
  (ids||[]).forEach(id=>{if(St.docs.some(x=>x.id===id&&x.who===cust))St.ticks[id]=true;});if(o&&o.share)St.share=true;X.render();return true;
 }
 /* ---------- phase 9a: 4.5 ใบวางบิล shows what the customer owes — it never receives money. The register and the window get
    one white "ไปหน้าตัดชำระลูกหนี้" (the note's customer, its unpaid bills ticked); "ปิดใบวางบิล" is hidden: the note is
    closed from the state of its bills (sale-flow.js billSync). Off = the original page, untouched. ---------- */
 const mayPayRec=()=>!!can('doc.payRec');
 const billOpenIds=b=>S.billItems(b).filter(r=>!r.paid&&!r.cancelled&&receiptTotals(r).net-paidAmtOf(r)>0.005).map(r=>r.id);
 const goSettleBill=id=>{const b=(DB.billings||[]).find(x=>x.id===id);if(!b||!on())return false;if(!mayPayRec()){toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');return false;}return settleFor(b.custId,billOpenIds(b),{share:true});};
 if(typeof renderBillingList==='function'){const o=renderBillingList;renderBillingList=function(){
  if(on()){try{if(S.billSync())save();}catch(e){}}                     /* notes whose bills were all settled one by one: closed here, once (what "ปิดใบวางบิล" did) */
  const out=o.apply(this,arguments);if(!on())return out;
  try{[...$i('bnTbl').tBodies[0].rows].forEach(tr=>{
   const m=/openBillingById\('([^']+)'\)/.exec((tr.querySelector('.docno')||{getAttribute(){return '';}}).getAttribute('onclick')||''),b=m&&(DB.billings||[]).find(x=>x.id===m[1]);if(!b)return;
   const box=tr.cells[tr.cells.length-1].querySelector(':scope>div');if(!box)return;tr.dataset.bill=b.id;
   box.querySelectorAll('[onclick^="settleBilling"]').forEach(x=>x.classList.add('pkg-sf-hide'));
   if(!b.cancelled&&!b.settled&&S.billRem(b)>0.005&&mayPayRec()){const x=document.createElement('button');x.type='button';x.className='btn sm gh';x.dataset.sfbill=b.id;x.textContent='ไปหน้าตัดชำระลูกหนี้';box.prepend(x);}});}catch(e){}
  return out;};}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sfbill]');if(b&&on())goSettleBill(b.dataset.sfbill);});
 function paintBillLine(){
  let line=$i('bnSfSettle');
  try{const BNx=(0,eval)('BN'),b=on()&&BNx?(DB.billings||[]).find(x=>x.id===BNx.id):null,bar=$i('bnApvBar');
   if(!b){if(line)line.remove();return;}
   if(!line&&bar){line=document.createElement('div');line.id='bnSfSettle';line.className='pkg-sf-credit';bar.after(line);}
   if(line){const rem=b.cancelled?0:S.billRem(b);
    line.innerHTML=`<span>ใบวางบิลเป็นเอกสารแสดงยอดค้างของลูกค้า — รับเงินที่หน้าตัดชำระลูกหนี้เท่านั้น · ${b.cancelled?'ยกเลิกแล้ว':rem>0.005?'คงค้าง <b>'+money(rem)+'</b> บาท':'ชำระครบแล้ว'}</span>${!b.cancelled&&rem>0.005&&mayPayRec()?`<button type="button" class="btn gh" data-sfbill="${esc(b.id)}">ไปหน้าตัดชำระลูกหนี้</button>`:''}`;}}catch(e){}
 }
 if(typeof fillBillingForm==='function'){const o=fillBillingForm;fillBillingForm=function(){const out=o.apply(this,arguments);paintBillLine();return out;};}
 if(typeof saveBilling==='function'){const o=saveBilling;saveBilling=function(){const out=o.apply(this,arguments);Promise.resolve(out).then(paintBillLine,()=>{});return out;};}
 /* after money moved at the debtor page: the billing register / the open billing window follow */
 const billRefresh=()=>{try{if(typeof rOvPane!=='undefined'&&rOvPane==='billing'&&typeof renderBillingList==='function')renderBillingList();}catch(e){}paintBillLine();};
 /* "ออกใบกำกับภาษี" of a cut: the existing 4.6 create window, opened with this cut's record chosen (nothing is issued until its own บันทึก) */
 function openTaxFor(saleId){
  const c=SC.list().find(x=>x.id===saleId),L=c&&S.led(c);if(!L||typeof openTaxNew!=='function')return false;
  if(S.taxOf(L)){toast('ใบตัดสต็อก '+c.no+' มีใบกำกับภาษี '+S.taxOf(L).no+' แล้ว');return false;}
  if(!c.custId){toast('ใบกำกับภาษีต้องระบุลูกค้า — ใบตัดสต็อกนี้เป็นลูกค้าทั่วไป (ไม่ระบุลูกค้า)');return false;}
  if(window.PKG_TAX_WINDOW&&PKG_TAX_WINDOW.openFor){   /* customer, source (the stock cut) and the cut itself are set; the customer box is locked */
   const ok=PKG_TAX_WINDOW.openFor({cust:c.custId,src:'parts',pick:L.id,lock:true}),TM=$i('mTaxDoc');
   if(TM&&TM.classList.contains('on')&&!ok)toast('ไม่พบใบตัดสต็อก '+c.no+' ในรายการที่ออกใบกำกับภาษีได้ (ต้องเป็นเอกสารที่มี VAT)');
   return !!ok;}
  openTaxNew.pkgBlank=true;try{openTaxNew();}finally{openTaxNew.pkgBlank=false;}const TM=$i('mTaxDoc');if(!TM||!TM.classList.contains('on'))return false;
  const sel=$i('txCust');if(sel){sel.value=c.custId;sel.dispatchEvent(new Event('change',{bubbles:true}));}
  const src=c.quoteId?'repair':'parts',rd=TM.querySelector('input[name="txSrc"][value="'+src+'"]');if(rd&&!rd.checked){rd.checked=true;rd.dispatchEvent(new Event('change',{bubbles:true}));}
  const tr=TM.querySelector('tr[data-tx="'+L.id+'"]');if(tr)tr.click();else toast('ไม่พบใบตัดสต็อก '+c.no+' ในรายการที่ออกใบกำกับภาษีได้ (ต้องเป็นเอกสารที่มี VAT)');
  return !!tr;
 }
 /* 4.6 "+ ออกใบกำกับภาษีใหม่" while the flow is on: the pick list of stock cuts, not the blank window (the blank window stays
    reachable from the tax window's own "สร้างเอกสารใหม่" for the rare document of the old system) */
 if(typeof openTaxNew==='function'){const tn0=openTaxNew,tn1=function(){if(on()&&!tn1.pkgBlank)return openPick('tax');return tn0.apply(this,arguments);};
  openTaxNew=window.openTaxNew=tn1;}
 const taxCan=c=>{const L=c&&S.led(c);return !!(L&&c.custId&&!c.cancelled&&!c.superseded&&n(c.vat)>0&&!S.taxOf(L)&&(typeof isVatReg!=='function'||isVatReg())&&can('doc.rIssue'));};
 menu();
 if(typeof boot==='function'){const b0=boot;boot=function(){const r=b0.apply(this,arguments);try{delete tabs.dataset.sf;menu();}catch(e){}return r;};}
 Object.assign(D,{menu,draw,redraw,saveInvoice,approveMany,pendInv,settleFor,goSettleBill,billOpenIds,billRefresh,paintBillLine,openOld,openInvoice,makeInvoice,paintInv,openPick,pickRows,pickGo,pick:()=>PM,openTaxFor,taxCan,invInfo,invRows,rcpRows,whtCust,whtVen,whtAll,whtTab,whtGot,askGot,sheetSaleInvoice,slipSaleInvoice,printInvoice,printSaleReceipts,sheetWhtCert,printWhtCert,printBox,formOf,
  /* 4.2 with one state shown (the home card). o.here: the list must show exactly what the card counted — every other filter
     of the register is cleared and, with more than one branch, the working branch is chosen (the card counts that branch) */
  showInv:(st,o)=>{const e=$i('sinvState'),q=$i('sinvSearch'),m=$i('sinvDateMode');if(e)e.value=st||'';if(q)q.value='';if(m&&m.value){m.value='';m.dispatchEvent(new Event('change',{bubbles:true}));}
   const F=window.PKG_REG_FILTER,B=window.PKG_BRANCH;
   if(o&&o.here&&F){try{F.clear('sinvTbl');if(B&&B.accessible().length>1){F.state('sinvTbl').br=[B.ctx()];F.build('sinvTbl');}}catch(err){}}
   LIM_PAGE.sinv=1;go('receipt');rOvGo('inv');}});
})();
