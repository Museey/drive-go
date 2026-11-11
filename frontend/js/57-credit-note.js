/* DriveGo new system (task 3.3, decisions F2, T6–T10): sales credit notes — "ใบลดหนี้".
   · From any sale with VAT in the new sales flow, short or full tax invoice alike (T7-ข), for four cases (T6): the
     customer returns goods, a price cut after the sale, an overcharge, or the whole sale (also after its month's VAT
     is closed). A reason every time.
   · Who (T10): the owner, whose credit note takes effect at once, and staff with the right "ออกใบลดหนี้"
     (doc.creditNote), whose credit note waits for approval by the owner or whoever may approve tax invoices
     (apv.tax) — it shows in the pending approvals like the other documents.
   · What it does when it takes effect: lowers what the customer still owes (an adjustment of the sale marked `cn`),
     and when that is less than the credit note, the rest is money paid back to the customer, cash or transfer (T8-ก:
     `money.refund`, taken off what the sale shows as received); returned goods go back into stock, line by line, at
     the cost of the lots they left (FIFO, under the sale's own reference), or are written off (T9-ก).
   · Tax: the credit note is a document of its own, dated the day it is made; it lowers the sales tax of ITS month in
     the sales tax report. The sale's own tax invoices and the report of the sale's month stay as they were (soldAs).
   DB.creditNotes = [{ id, no (MA-CN…), date, saleId, saleNo, ledId, custId, br, kind, reason, rate, base, vat, gross,
     lines: [{ i, stockId, code, name, unit, qty, price, stock: 'back' | 'waste' }], method, ref: { no, date, base },
     apv: { status, by, byName, date }, money: { reduce, refund, method }, created…,
     voidReq: { status: 'pending' | 'rejected', reason, by, byName, date, at }, voided: { reason, date, at, by, byName, req } }]
   · Cancelling one in effect (owner's decision of 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 2): the owner at once, staff with
     "ออกใบลดหนี้" ask and the owner or "อนุมัติใบกำกับภาษี" approves (pending approvals); a reason every time; only while
     the credit note's month is open. Everything comes back: the sale's amount (an adjustment up, `cn` = its number), the
     goods that came back leave stock again (not enough in stock: it cannot be cancelled), and money paid back stays paid —
     the customer owes it again. Its number stays, marked cancelled; it leaves the sales tax report and the accounts.
   · Debit notes — "ใบเพิ่มหนี้" (the same decision, 3; replaces T11-ก): kept with the credit notes (type 'debit', MA-DN…),
     the same right ("ออกใบลดหนี้ / ใบเพิ่มหนี้"), approval and cancelling; three cases of section 86/9 of the Revenue Code
     (goods or services beyond what was agreed, a price worked out too low, another reason); an amount before VAT and a
     reason; in effect it raises what the customer owes (an adjustment up, `cn` = its number) and adds to the sales tax and
     the revenue of ITS month; printed with the original tax invoice, the right value and the difference. */
(function(){
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,B=window.PKG_BRANCH;
 if(!S||!SC||typeof renderTax!=='function')return;
 const KIND={ret:'ลูกค้าคืนสินค้า',disc:'ลดราคาหลังขาย',over:'ยอดในใบกำกับภาษีเกินจริง (คิดเงินผิด)',all:'ยกเลิกการขายทั้งใบ'};
 const STOCK={back:'คืนเข้าสต๊อก',waste:'ของเสีย'};
 /* why the value goes down, as section 82/10 of the Revenue Code lists it (accountant B, rounds 2–3, Q4; owner 2026-11-11):
    picked on every credit note, then the details written; a return and an overcharge start on their own cause */
 const CAUSE={damaged:'สินค้าชำรุด',spec:'สินค้าหรือบริการผิดข้อกำหนดที่ตกลงกัน',short:'ขาดจำนวน',price:'คิดราคาผิด',back:'รับคืนสินค้า',end:'บอกเลิกบริการ'};
 const CAUSE_OF={ret:'back',over:'price'};
 const KIND_DN={over:'ส่งสินค้าหรือให้บริการเกินกว่าที่ตกลงกัน',calc:'คำนวณราคาผิดพลาดต่ำกว่าที่เป็นจริง',other:'เหตุอื่น'};
 const isDn=x=>!!x&&x.type==='debit';
 const NAME=x=>isDn(x)?'ใบเพิ่มหนี้':'ใบลดหนี้';
 const kindOf=x=>(isDn(x)?KIND_DN:KIND)[x.kind]||'';
 const causeOf=x=>!isDn(x)&&CAUSE[x.cause]||'';
 if(typeof AUD_ACT==='object'){AUD_ACT.debitnote=AUD_ACT.debitnote||'ใบเพิ่มหนี้';AUD_ACT.dnvoid='ยกเลิกใบเพิ่มหนี้';}
 const r2=v=>round2(v),EPS=0.005;
 const all=()=>DB.creditNotes||[];
 const live=x=>x&&x.apv&&x.apv.status!=='rejected'&&!x.voided;
 /* in effect (not cancelled); `paid` also counts a cancelled one: the money it paid back stays paid */
 const done=x=>x&&x.apv&&x.apv.status==='approved'&&!x.voided;
 const paid=x=>x&&x.apv&&x.apv.status==='approved';
 const ofSale=c=>all().filter(x=>x.saleId===c.id&&live(x));
 const anyOf=c=>all().filter(x=>x.saleId===c.id&&x.apv&&x.apv.status!=='rejected');
 const cutOf=id=>(DB.stockCuts||[]).find(x=>x.id===id);
 const owner=()=>!curEmp();
 const mayIssue=()=>owner()||can('doc.creditNote');
 const mayApprove=()=>owner()||can('apv.tax');
 const stamp=()=>({date:iso(),at:nowTs(),by:DB.curEmp||'',byName:meName()});
 const inBr=(c,fn)=>B&&B.within&&B.brOf?B.within(B.brOf(c),fn):fn();

 /* what is left of a sale to credit: its remaining total (after earlier credit notes, counting those still waiting),
    and per line the quantity not yet returned */
 function left(c){
  const L=S.led(c),t=receiptTotals(L),wait=ofSale(c).filter(x=>!done(x)&&!isDn(x)).reduce((a,x)=>a+x.gross,0);
  return {L,t,gross:r2(t.gross-wait),rate:n(c.vat)};
 }
 const returned=(c,i)=>ofSale(c).reduce((a,x)=>a+(x.lines||[]).filter(l=>l.i===i).reduce((s,l)=>s+n(l.qty),0),0);
 /* goods that can come back: the sale's lines of stock items */
 const rows=c=>(c.items||[]).map((it,i)=>({i,it})).filter(x=>x.it.stockId&&x.it.type!=='labor').map(x=>({i:x.i,it:x.it,max:n(x.it.qty)-returned(c,x.i)}));
 /* the share of a line's price that is in the sale's amount before VAT (a discount on the whole bill is spread) */
 function ratio(c){const o=S.origTotals(S.led(c));return o.sub>0?o.base/o.sub:1;}
 const canCredit=c=>!!c&&!c.cancelled&&!c.superseded&&n(c.vat)>0&&!!S.led(c)&&left(c).gross>EPS;
 const canDebit=c=>!!c&&!c.cancelled&&!c.superseded&&n(c.vat)>0&&!!S.led(c);

 /* ---------- taking effect ---------- */
 function apply(x){
  const c=cutOf(x.saleId),L=c&&S.led(c);if(!c||!L)return false;
  if(isDn(x)){x.money={increase:x.gross};
   c.adj=(c.adj||[]).concat([Object.assign({id:uid(),type:'up',amt:x.gross,reason:'ใบเพิ่มหนี้ '+x.no,note:x.reason,cn:x.no},stamp())]);
   S.sync(c);S.touch(c);logAudit('stockcut',c,'debitnote','ใบเพิ่มหนี้ '+x.no+' · '+kindOf(x)+' · '+money(x.gross)+' บาท — '+x.reason);return true;}
  const rem=S.stat(c).rem,reduce=r2(Math.min(x.gross,rem)),refund=r2(x.gross-reduce);
  x.money={reduce,refund,method:refund>EPS?x.method:''};
  c.adj=(c.adj||[]).concat([Object.assign({id:uid(),type:'down',amt:x.gross,reason:'ใบลดหนี้ '+x.no,note:x.reason,cn:x.no},stamp())]);
  const allocs=()=>(DB.fifo&&DB.fifo.allocs)||[],before=new Map(allocs().map(a=>[a.id,n(a.back)]));
  inBr(c,()=>(x.lines||[]).forEach(l=>{if(l.stock!=='back'||!(n(l.qty)>0))return;const s=DB.stock.find(z=>z.id===l.stockId);if(!s)return;
   s.qty=n(s.qty)+n(l.qty);s.lastMove=iso();logMove(s.id,'in',n(l.qty),iso(),'รับคืนตามใบลดหนี้ '+x.no+' · ใบตัดสต็อก '+c.no,c.moveRef);}));
  /* the FIFO allocations the goods went back to (no cost here: the reports read it, accountant review 1.10) */
  const backs=allocs().filter(a=>before.has(a.id)&&n(a.back)-before.get(a.id)>1e-9).map(a=>({id:a.id,qty:n(a.back)-before.get(a.id)}));
  if(backs.length)x.backs=backs;
  S.sync(c);S.touch(c);
  logAudit('stockcut',c,'creditnote','ใบลดหนี้ '+x.no+' · '+KIND[x.kind]+' · '+money(x.gross)+' บาท'
   +(refund>EPS?' · คืนเงินลูกค้า '+money(refund)+' บาท ('+(x.method==='trans'?'เงินโอน':'เงินสด')+')':'')+' — '+x.reason);
  return true;
 }
 /* money given back is not money received */
 const refunds=L=>all().filter(x=>paid(x)&&x.ledId===L.id).reduce((a,x)=>a+n(x.money&&x.money.refund),0);
 /* DriveGo new system (task 3.5): money paid back is cash going out — the year's cash (08 สุขภาพการเงิน, งบ) counts it on the day
    the credit note took effect (its approval) */
 const refundDay=x=>(x.apv&&x.apv.date)||x.date;
 if(typeof finance==='function'){const fin0=finance;finance=function(y){const o=fin0.apply(this,arguments);if(!o)return o;
  const r=r2(all().filter(x=>paid(x)&&x.money&&n(x.money.refund)>0&&+String(refundDay(x)).slice(0,4)<=y).reduce((a,x)=>a+n(x.money.refund),0));
  if(r>0){o.cash-=r;o.assetsTotal-=r;o.equity-=r;o.roi=o.ownerCap>0?o.np/o.ownerCap*100:(o.equity>0?o.np/o.equity*100:0);o.roa=o.assetsTotal>0?o.np/o.assetsTotal*100:0;}
  return o;};}
 /* The profit and loss takes a credit note in ITS month, as the sales tax report does (accountant review 1.10, the owner's
    decision of 2026-10-28 to follow accountant B): the sale's month keeps the sale as sold (soldAs) with the cost of goods
    it had before any came back, the credit note's month takes off its amount before VAT, its VAT and the cost of the goods
    that came back (x.backs × the allocation's cost). A credit note goes with its sale: only when the sale's ledger is in
    the data shown (a branch's report). Credit notes made before this (no backs) move no cost. */
 const ledOf=x=>(DB.receipts||[]).find(r=>r&&r.id===x.ledId&&!r.cancelled)||null;
 const allocCost=id=>{const a=((DB.fifo&&DB.fifo.allocs)||[]).find(z=>z&&z.id===id);return a?n(a.cost):0;};
 const costBack=x=>(x.backs||[]).reduce((t,b)=>t+n(b.qty)*allocCost(b.id),0);
 /* what a period (in: a date's test) gains back from its sales and loses to its credit notes */
 function cnShift(inP){
  const d={rev:0,vat:0,cogs:0,parts:0,labor:0},seen=new Set();
  all().filter(done).forEach(x=>{const L=ledOf(x);if(!L)return;const cb=costBack(x);
   if(inP(L.date)){d.cogs+=cb;
    if(!seen.has(L.id)){seen.add(L.id);const a=receiptTotals(soldAs(L)),b=receiptTotals(L);d.rev+=a.base-b.base;d.vat+=a.vat-b.vat;}}
   const sg=isDn(x)?-1:1;
   if(inP(x.date)){d.rev-=sg*n(x.base);d.vat-=sg*n(x.vat);d.cogs-=cb;
    /* the revenue accounts: goods brought back are parts, anything else as the sale was made up */
    const its=(L.items||[]).map(it=>({lab:it.type==='labor',v:n(it.qty)*n(it.price)})),tot=its.reduce((t,i)=>t+i.v,0);
    const lab=x.kind==='ret'||!(tot>0)?0:its.filter(i=>i.lab).reduce((t,i)=>t+i.v,0)/tot;
    d.labor+=sg*n(x.base)*lab;d.parts+=sg*n(x.base)*(1-lab);}
  });
  return d;
 }
 const moved=d=>Math.abs(d.rev)>=0.005||Math.abs(d.cogs)>=0.005||Math.abs(d.vat)>=0.005||Math.abs(d.parts)>=0.005||Math.abs(d.labor)>=0.005;
 if(typeof finance==='function'){const fin1=finance;finance=function(y){const o=fin1.apply(this,arguments);if(!o)return o;
  const d=cnShift(dt=>inYear(dt,y));if(!moved(d))return o;
  o.revenue+=d.rev;o.vatSale+=d.vat;o.cogs+=d.cogs;o.gp=o.revenue-o.cogs;o.np+=d.rev-d.cogs;
  o.gpm=o.revenue?o.gp/o.revenue*100:0;o.npm=o.revenue?o.np/o.revenue*100:0;
  o.roi=o.ownerCap>0?o.np/o.ownerCap*100:(o.equity>0?o.np/o.equity*100:0);o.roa=o.assetsTotal>0?o.np/o.assetsTotal*100:0;
  return o;};}
 if(typeof monthlyPnL==='function'){const mp0=monthlyPnL;
  window.monthlyPnL=function(){const out=mp0.apply(this,arguments);
   (out||[]).forEach(m=>{const d=cnShift(dt=>String(dt||'').slice(0,7)===m.key);if(!moved(d))return;
    m.rev+=d.rev;m.cogs+=d.cogs;m.gp=m.rev-m.cogs;m.np+=d.rev-d.cogs;});
   return out;};}
 /* the trial balance's revenue comes from the sales' lines, which credit notes never lowered: they come off in their year */
 if(typeof trialBalance==='function'){const tb0=trialBalance;
  window.trialBalance=function(y){const out=tb0.apply(this,arguments),d=cnShift(dt=>inYear(dt,y)),M=DB.map||{};if(!(Math.abs(d.parts)>=0.005||Math.abs(d.labor)>=0.005))return out;
   const take=(code,v)=>{if(!code||!(Math.abs(v)>=0.005))return;let r=out.find(z=>z.code===code);
    if(!r){r={code,name:accName(code),type:((DB.coa||[]).find(a=>a.code===code)||{}).type||'',debit:0,credit:0};out.push(r);}r.credit-=v;};
   take(M.revParts,d.parts);take(M.revLabor,d.labor);
   return out.sort((a,c)=>a.code.localeCompare(c.code));};}
 const pa0=paidAmtOf;paidAmtOf=function(d){const v=pa0.apply(this,arguments);return d&&d.pkgSale&&DB.creditNotes?v-refunds(d):v;};
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||all().some(x=>x.no===no);};

 /* a sale with credit notes is not cancelled or revised (that would take back what they did): the credit note is the way */
 const lockMsg=(c,x)=>toast('ใบตัดสต็อก '+c.no+' มีใบลดหนี้ '+x.no+' แล้ว — ยกเลิกหรือทำฉบับแก้ไขไม่ได้ ใช้ใบลดหนี้แทน');
 const cc0=S.canCancel;S.canCancel=function(c){const x=c&&anyOf(c)[0];if(x){lockMsg(c,x);return false;}return cc0.apply(this,arguments);};
 const rv0=S.revise;S.revise=function(x){const c=typeof x==='string'?cutOf(x):x,cn=c&&!c.pkgSale&&anyOf(c)[0];if(cn){lockMsg(c,cn);return false;}return rv0.apply(this,arguments);};
 const ad0=S.adjDel;S.adjDel=function(x,id){const c=typeof x==='string'?cutOf(x):x,a=c&&(c.adj||[]).find(z=>z.id===id);
  if(a&&a.cn){toast('รายการนี้มาจากใบลดหนี้ '+a.cn+' — ลบไม่ได้');return false;}return ad0.apply(this,arguments);};

 /* ---------- the window: a new credit note, or one that exists ---------- */
 const W=document.createElement('div');W.className='modal';W.id='mCredit';
 W.innerHTML=`<div class="sheet" style="max-width:860px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2 id="cnTitle">ออกใบลดหนี้</h2><div class="spacer"></div><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" data-cn="close">✕</button></header>
  <div class="body" id="cnBody"></div></div></div>`;
 document.body.append(W);
 const $c=s=>W.querySelector(s);
 let F=null;   /* the form: {c, kind, qty:{i:q}, stock:{i:'back'|'waste'}, amt, reason, method} or {view: credit note} */

 function figures(){
  const c=F.c,l=left(c),rate=l.rate;let base=0,vat=0,gross=0,lines=[];
  if(F.kind==='ret'||F.kind==='all'){
   rows(c).forEach(r=>{const q=F.kind==='all'?r.max:Math.min(r.max,Math.max(0,n(F.qty[r.i])));if(!(q>0))return;
    lines.push({i:r.i,stockId:r.it.stockId,code:r.it.code||'',name:r.it.name||'',unit:r.it.unit||'',qty:q,price:n(r.it.price),stock:F.stock[r.i]==='waste'?'waste':'back'});});
  }
  if(F.kind==='all'){gross=l.gross;base=r2(gross*100/(100+rate));vat=r2(gross-base);}
  else{base=F.kind==='ret'?r2(lines.reduce((a,x)=>a+x.qty*x.price,0)*ratio(c)):r2(n(F.amt));vat=vatOf(base,rate);gross=r2(base+vat);}
  const rem=S.stat(c).rem,reduce=r2(Math.min(gross,rem)),refund=r2(Math.max(0,gross-reduce));
  return {lines,base,vat,gross,rate,left:l.gross,reduce,refund};
 }
 function drawForm(){
  const c=F.c,f=figures(),cu=findCust(c.custId),st=S.stat(c);
  const lineRows=rows(c).map(r=>`<tr><td>${esc(r.it.code||'')}</td><td>${esc(r.it.name||'')}</td><td class="num">${qf(r.it.qty)}</td><td class="num">${qf(n(r.it.qty)-r.max)}</td>
   <td class="num">${F.kind==='all'?qf(r.max):`<input type="number" min="0" max="${r.max}" step="1" data-q="${r.i}" value="${n(F.qty[r.i])||''}" aria-label="จำนวนที่คืน ${esc(r.it.code||r.it.name||'')}" style="width:80px;text-align:right"${r.max>0?'':' disabled'}>`}</td>
   <td class="num">${money(r.it.price)}</td>
   <td><select data-s="${r.i}" aria-label="สินค้าที่คืน ${esc(r.it.code||r.it.name||'')}">${Object.entries(STOCK).map(([k,v])=>`<option value="${k}"${(F.stock[r.i]||'back')===k?' selected':''}>${v}</option>`).join('')}</select></td></tr>`).join('');
  $c('#cnTitle').textContent='ออกใบลดหนี้ · ใบตัดสต็อก '+c.no;
  $c('#cnBody').innerHTML=`<p class="hint" style="margin-top:0">${esc(custName(cu)||'-')} · ขายวันที่ ${thDate(c.date)} · ยอดขาย ${money(st.total)} บาท · คงค้าง ${money(st.rem)} บาท · ลดได้อีก ${money(f.left)} บาท</p>
   <label class="f"><span>กรณี</span><select id="cnKind">${Object.entries(KIND).map(([k,v])=>`<option value="${k}"${F.kind===k?' selected':''}>${v}</option>`).join('')}</select></label>
   <label class="f"><span>เหตุตามมาตรา 82/10</span><select id="cnCause"><option value="">— เลือกเหตุ —</option>${Object.entries(CAUSE).map(([k,v])=>`<option value="${k}"${F.cause===k?' selected':''}>${v}</option>`).join('')}</select></label>
   ${F.kind==='ret'||F.kind==='all'?`<table class="tbl" style="margin:10px 0"><thead><tr><th>รหัส</th><th>รายการ</th><th class="num">ขาย</th><th class="num">คืนแล้ว</th><th class="num">จำนวนที่คืน</th><th class="num">ราคา/หน่วย</th><th>สินค้าที่คืน</th></tr></thead>
    <tbody>${lineRows||'<tr><td colspan="7" class="empty">ไม่มีรายการสินค้าในสต๊อกที่คืนได้</td></tr>'}</tbody></table>`
   :`<label class="f"><span>มูลค่าที่ลด (ก่อน VAT)</span><input type="number" min="0" step="0.01" id="cnAmt" value="${F.amt||''}"></label>`}
   <label class="f"><span>เหตุผล (ต้องกรอก)</span><input id="cnReason" value="${esc(F.reason||'')}"></label>
   <table class="tbl" style="margin-top:10px;max-width:420px;margin-left:auto"><tbody>
    <tr><td>มูลค่าที่ลด (ก่อน VAT)</td><td class="num" id="cnBase">${money(f.base)}</td></tr>
    <tr><td>ภาษีมูลค่าเพิ่ม ${f.rate}%</td><td class="num" id="cnVat">${money(f.vat)}</td></tr>
    <tr><td><b>รวมใบลดหนี้</b></td><td class="num"><b id="cnGross">${money(f.gross)}</b></td></tr>
    <tr><td>ลดยอดค้างชำระ</td><td class="num" id="cnReduce">${money(f.reduce)}</td></tr>
    <tr><td>คืนเงินให้ลูกค้า</td><td class="num" id="cnRefund">${money(f.refund)}</td></tr></tbody></table>
   <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
    <label class="f" id="cnMethodBox"${f.refund>EPS?'':' style="display:none"'}><span>คืนเงินโดย</span><select id="cnMethod"><option value="cash"${F.method!=='trans'?' selected':''}>เงินสด</option><option value="trans"${F.method==='trans'?' selected':''}>เงินโอน</option></select></label>
    <button type="button" class="btn pri" data-cn="save">บันทึกใบลดหนี้</button></div>`;
 }
 /* ---------- a debit note: the case, an amount before VAT and a reason ---------- */
 function figuresDn(){const rate=n(F.c.vat),base=r2(n(F.amt)),vat=vatOf(base,rate);return {base,vat,gross:r2(base+vat),rate};}
 function drawDn(){
  const c=F.c,f=figuresDn(),cu=findCust(c.custId),st=S.stat(c);
  $c('#cnTitle').textContent='ออกใบเพิ่มหนี้ · ใบตัดสต็อก '+c.no;
  $c('#cnBody').innerHTML=`<p class="hint" style="margin-top:0">${esc(custName(cu)||'-')} · ขายวันที่ ${thDate(c.date)} · ยอดขาย ${money(st.total)} บาท · คงค้าง ${money(st.rem)} บาท</p>
   <label class="f"><span>กรณี</span><select id="cnKind">${Object.entries(KIND_DN).map(([k,v])=>`<option value="${k}"${F.kind===k?' selected':''}>${v}</option>`).join('')}</select></label>
   <label class="f"><span>มูลค่าที่เพิ่ม (ก่อน VAT)</span><input type="number" min="0" step="0.01" id="cnAmt" value="${F.amt||''}"></label>
   <label class="f"><span>เหตุผล (ต้องกรอก)</span><input id="cnReason" value="${esc(F.reason||'')}"></label>
   <table class="tbl" style="margin-top:10px;max-width:420px;margin-left:auto"><tbody>
    <tr><td>มูลค่าที่เพิ่ม (ก่อน VAT)</td><td class="num" id="cnBase">${money(f.base)}</td></tr>
    <tr><td>ภาษีมูลค่าเพิ่ม ${f.rate}%</td><td class="num" id="cnVat">${money(f.vat)}</td></tr>
    <tr><td><b>รวมใบเพิ่มหนี้</b></td><td class="num"><b id="cnGross">${money(f.gross)}</b></td></tr>
    <tr><td>ยอดค้างชำระเพิ่มขึ้น</td><td class="num" id="cnInc">${money(f.gross)}</td></tr></tbody></table>
   <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button type="button" class="btn pri" data-cn="save">บันทึกใบเพิ่มหนี้</button></div>`;
 }
 async function saveDn(){
  const c=F.c,f=figuresDn(),reason=String(F.reason||'').trim();
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบเพิ่มหนี้');
  if(!(f.gross>EPS))return toast('ใส่มูลค่าที่เพิ่มก่อน');
  if(!reason)return toast('ใส่เหตุผลของใบเพิ่มหนี้ก่อน');
  const tx=S.taxOf(S.led(c));
  const x={id:uid(),type:'debit',no:inBr(c,()=>docNo('DN')),date:iso(),saleId:c.id,saleNo:c.no,ledId:S.led(c).id,custId:c.custId,br:c.br||'',kind:F.kind,reason,
   rate:f.rate,base:f.base,vat:f.vat,gross:f.gross,lines:[],method:'',
   ref:{no:tx?tx.no:c.no,date:tx?tx.date:c.date,base:r2(receiptTotals(soldAs(S.led(c))).base)},
   apv:owner()?Object.assign({status:'approved'},stamp()):{status:'pending',by:DB.curEmp||'',byName:meName(),date:iso()},
   createdAt:nowTs(),createdBy:DB.curEmp||'',createdByName:meName()};
  DB.creditNotes=DB.creditNotes||[];DB.creditNotes.push(x);
  logAudit('stockcut',c,'debitnote','ออกใบเพิ่มหนี้ '+x.no+(done(x)?'':' (รออนุมัติ)')+' · '+kindOf(x)+' · '+money(x.gross)+' บาท — '+reason);
  if(done(x))apply(x);
  save();redraw();
  saveFx('บันทึกเอกสารแล้ว','ใบเพิ่มหนี้ '+x.no);
  toast(done(x)?'ออกใบเพิ่มหนี้ '+x.no+' แล้ว':'ส่งใบเพิ่มหนี้ '+x.no+' ขออนุมัติแล้ว');
  view(x.id);
 }
 function refresh(){
  if(F.dn){const f=figuresDn();[['#cnBase',f.base],['#cnVat',f.vat],['#cnGross',f.gross],['#cnInc',f.gross]].forEach(([q,v])=>{const e=$c(q);if(e)e.textContent=money(v);});return;}
  const f=figures();
  [['#cnBase',f.base],['#cnVat',f.vat],['#cnGross',f.gross],['#cnReduce',f.reduce],['#cnRefund',f.refund]].forEach(([s,v])=>{const e=$c(s);if(e)e.textContent=money(v);});
  const m=$c('#cnMethodBox');if(m)m.style.display=f.refund>EPS?'':'none';
 }
 /* "+ ออกใบลดหนี้" on 4.6: first the sale, found by its number, its tax invoice's number or the customer */
 function openPick(dn){
  if(!mayIssue())return toast(dn?'บัญชีนี้ไม่มีสิทธิ์ออกใบเพิ่มหนี้':'บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  F={pick:true,q:'',dn:!!dn};$c('#cnTitle').textContent=dn?'ออกใบเพิ่มหนี้':'ออกใบลดหนี้';
  $c('#cnBody').innerHTML=`<label class="f"><span>ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า</span><input id="cnFind"></label><div id="cnPickList" style="margin-top:10px"></div>`;
  drawPick();openModal('mCredit');
 }
 function drawPick(){
  const q=F.q.trim().toLowerCase();
  const list=(DB.stockCuts||[]).filter(F.dn?canDebit:canCredit).map(c=>{const L=S.led(c),tx=L&&S.taxOf(L);return {c,tx,cust:custName(findCust(c.custId))||''};})
   .filter(x=>!q||[x.c.no,x.tx&&x.tx.no,x.cust].some(v=>String(v||'').toLowerCase().includes(q)))
   .sort((a,b)=>String(b.c.date).localeCompare(String(a.c.date))||String(b.c.no).localeCompare(String(a.c.no))).slice(0,50);
  $c('#cnPickList').innerHTML=`<table class="tbl"><thead><tr><th>เลขที่ใบตัดสต็อก</th><th>ใบกำกับภาษี</th><th>วันที่</th><th>ลูกค้า</th><th class="num">ยอดขาย</th><th></th></tr></thead><tbody>
   ${list.map(x=>`<tr><td class="mono">${esc(x.c.no)}</td><td class="mono">${esc(x.tx?x.tx.no:'-')}</td><td class="ctr">${thDate(x.c.date)}</td><td>${esc(x.cust||'-')}</td>
    <td class="num">${money(S.stat(x.c).total)}</td><td><button type="button" class="btn sm pri" data-cnpick="${x.c.id}">เลือก</button></td></tr>`).join('')
    ||`<tr><td colspan="6" class="empty">${F.dn?'ไม่พบการขายที่มี VAT ที่ออกใบเพิ่มหนี้ได้':'ไม่พบการขายที่มี VAT ที่ออกใบลดหนี้ได้'}</td></tr>`}</tbody></table>`;
 }
 function openNew(id){
  const c=cutOf(id);if(!c)return;
  if(F&&F.dn){if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบเพิ่มหนี้');if(!canDebit(c))return toast('ใบตัดสต็อก '+c.no+' ออกใบเพิ่มหนี้ไม่ได้');
   F={c,dn:true,kind:'over',amt:'',reason:''};drawDn();return openModal('mCredit');}
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  if(!canCredit(c))return toast('ใบตัดสต็อก '+c.no+' ออกใบลดหนี้ไม่ได้');
  F={c,kind:'ret',cause:CAUSE_OF.ret,qty:{},stock:{},amt:'',reason:'',method:'cash'};drawForm();openModal('mCredit');
 }
 W.addEventListener('input',e=>{if(!F||F.view)return;const t=e.target;
  if(F.pick){if(t.id==='cnFind'){F.q=t.value;drawPick();}return;}
  if(t.dataset.q!==undefined)F.qty[+t.dataset.q]=n(t.value);else if(t.id==='cnAmt')F.amt=t.value;else if(t.id==='cnReason'){F.reason=t.value;return;}else return;refresh();});
 W.addEventListener('change',e=>{if(!F||F.view||F.pick)return;const t=e.target;
  if(t.id==='cnKind'){F.kind=t.value;if(!F.dn){if(!F.causePicked)F.cause=CAUSE_OF[F.kind]||'';drawForm();}}
  else if(t.id==='cnCause'){F.cause=t.value;F.causePicked=true;}else if(t.dataset.s!==undefined){F.stock[+t.dataset.s]=t.value;}else if(t.id==='cnMethod')F.method=t.value;});
 W.addEventListener('click',async e=>{const p=e.target.closest('[data-cnpick]');if(p)return openNew(p.dataset.cnpick);
  const b=e.target.closest('[data-cn]');if(!b)return;const a=b.dataset.cn;
  if(a==='close'){closeModal('mCredit');F=null;return;}
  if(a==='save')return F.dn?saveDn():saveNew();
  if(a==='print')return print(F.view);
  if(a==='approve')return decide(F.view,true);
  if(a==='reject')return decide(F.view,false);
  if(a==='void')return askVoid(F.view);
  if(a==='voidyes')return decideVoid(F.view,true);
  if(a==='voidno')return decideVoid(F.view,false);
 });

 async function saveNew(){
  const c=F.c,f=figures(),reason=String(F.reason||'').trim();
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  if(F.kind==='ret'&&!f.lines.length)return toast('ใส่จำนวนสินค้าที่คืนก่อน');
  if(!(f.gross>EPS))return toast('ใส่มูลค่าที่ลดก่อน');
  if(f.gross>f.left+EPS)return toast('ใบลดหนี้ลดได้ไม่เกิน '+money(f.left)+' บาท');
  if(!CAUSE[F.cause])return toast('เลือกเหตุของใบลดหนี้ตามมาตรา 82/10 ก่อน');
  if(!reason)return toast('ใส่เหตุผลของใบลดหนี้ก่อน');
  const tx=S.taxOf(S.led(c));
  const x={id:uid(),no:inBr(c,()=>docNo('CN')),date:iso(),saleId:c.id,saleNo:c.no,ledId:S.led(c).id,custId:c.custId,br:c.br||'',kind:F.kind,cause:F.cause,reason,
   rate:f.rate,base:f.base,vat:f.vat,gross:f.gross,lines:f.lines,method:f.refund>EPS?(F.method==='trans'?'trans':'cash'):'',
   ref:{no:tx?tx.no:c.no,date:tx?tx.date:c.date,base:r2(receiptTotals(soldAs(S.led(c))).base)},
   apv:owner()?Object.assign({status:'approved'},stamp()):{status:'pending',by:DB.curEmp||'',byName:meName(),date:iso()},
   createdAt:nowTs(),createdBy:DB.curEmp||'',createdByName:meName()};
  DB.creditNotes=DB.creditNotes||[];DB.creditNotes.push(x);
  logAudit('stockcut',c,'creditnote','ออกใบลดหนี้ '+x.no+(done(x)?'':' (รออนุมัติ)')+' · '+KIND[x.kind]+' · '+money(x.gross)+' บาท — '+reason);
  if(done(x))apply(x);
  save();redraw();
  saveFx('บันทึกเอกสารแล้ว','ใบลดหนี้ '+x.no);
  toast(done(x)?'ออกใบลดหนี้ '+x.no+' แล้ว':'ส่งใบลดหนี้ '+x.no+' ขออนุมัติแล้ว');
  view(x.id);
 }
 async function decide(x,ok){
  if(!x||x.apv.status!=='pending'||!mayApprove())return;
  if(ok){Object.assign(x.apv,{status:'approved'},stamp());apply(x);}
  else Object.assign(x.apv,{status:'rejected'},stamp());
  const c=cutOf(x.saleId);logAudit('stockcut',c||{id:x.saleId,no:x.saleNo},ok?'approve':'reject',(ok?'อนุมัติ':'ไม่อนุมัติ')+NAME(x)+' '+x.no);
  save();redraw();toast((ok?'อนุมัติ':'ไม่อนุมัติ')+NAME(x)+' '+x.no+' แล้ว');view(x.id);
 }
 /* ---------- cancelling a credit note in effect ---------- */
 const TP=()=>window.PKG_TAX_PERIOD;
 if(typeof AUD_ACT==='object')AUD_ACT.cnvoid='ยกเลิกใบลดหนี้';
 const shut=x=>{const P=TP();return !!(P&&P.closed&&P.closed(x.date));};
 /* goods that came back and must leave stock again: the first line short of stock, or null */
 function short(x){for(const l of (x.lines||[])){if(l.stock!=='back'||!(n(l.qty)>0))continue;const s=DB.stock.find(z=>z.id===l.stockId);
  if(!s||n(s.qty)+1e-9<n(l.qty))return l;}return null;}
 function canVoid(x){
  if(!done(x))return false;
  if(shut(x)){toast('เดือน '+(TP().label?TP().label(String(x.date).slice(0,7)):String(x.date).slice(0,7))+' ปิดงวดภาษีแล้ว — ยกเลิก'+NAME(x)+' '+x.no+' ไม่ได้');return false;}
  const l=short(x);if(l){toast('สินค้า '+(l.code||l.name)+' ในสต๊อกมีไม่พอ — ยกเลิกใบลดหนี้ '+x.no+' ไม่ได้');return false;}
  if(isDn(x)){const c=cutOf(x.saleId);if(c&&S.stat(c).rem<n(x.gross)-EPS){toast('ลูกค้าชำระยอดของใบเพิ่มหนี้ '+x.no+' แล้ว — ยกเลิกไม่ได้');return false;}}
  return true;
 }
 async function askVoid(x){
  if(!x||!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ยกเลิก'+NAME(x||{}));if(!canVoid(x))return;
  const what=isDn(x)?'ยอดค้างชำระของลูกค้าลดลงตามใบเพิ่มหนี้นี้':'ยอดขายกลับเป็นเหมือนก่อนออกใบลดหนี้ สินค้าที่รับคืนออกจากสต๊อก'
   +(x.money&&n(x.money.refund)>0?' และลูกค้ากลับมาค้างชำระ '+money(x.money.refund)+' บาทที่คืนเงินไปแล้ว':'');
  const why=await askPromptP({title:'ยกเลิก'+NAME(x)+' '+x.no,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\n'+what,yes:'ยืนยันยกเลิก'+NAME(x),no:'ไม่ยกเลิก',required:true});
  if(why===null)return;const reason=String(why).trim();if(!reason)return toast('ต้องระบุเหตุผลที่ยกเลิก');
  if(!done(x)||!canVoid(x))return;
  const c=cutOf(x.saleId)||{id:x.saleId,no:x.saleNo};
  if(owner()){doVoid(x,reason,null);save();redraw();toast('ยกเลิก'+NAME(x)+' '+x.no+' แล้ว');return view(x.id);}
  x.voidReq={status:'pending',reason,by:DB.curEmp||'',byName:meName(),date:iso(),at:nowTs()};
  logAudit('stockcut',c,'send','ขอยกเลิก'+NAME(x)+' '+x.no+' — '+reason);
  save();redraw();toast('ส่งคำขอยกเลิก'+NAME(x)+' '+x.no+' แล้ว รออนุมัติ');view(x.id);
 }
 function doVoid(x,reason,req){
  const c=cutOf(x.saleId),L=c&&S.led(c);if(!c||!L)return false;
  inBr(c,()=>(x.lines||[]).forEach(l=>{if(l.stock!=='back'||!(n(l.qty)>0))return;const s=DB.stock.find(z=>z.id===l.stockId);if(!s)return;
   s.qty=n(s.qty)-n(l.qty);s.lastMove=iso();logMove(s.id,'out',n(l.qty),iso(),'ยกเลิกใบลดหนี้ '+x.no+' · ใบตัดสต็อก '+c.no,c.moveRef);}));
  c.adj=(c.adj||[]).concat([Object.assign({id:uid(),type:isDn(x)?'down':'up',amt:x.gross,reason:'ยกเลิก'+NAME(x)+' '+x.no,note:reason,cn:x.no,voids:true},stamp())]);
  x.voided=Object.assign({reason},stamp(),req?{req}:{});
  S.sync(c);S.touch(c);
  logAudit('stockcut',c,isDn(x)?'dnvoid':'cnvoid','ยกเลิก'+NAME(x)+' '+x.no+' · '+money(x.gross)+' บาท'+(x.money&&n(x.money.refund)>0?' · ลูกค้ากลับมาค้างชำระ '+money(x.money.refund)+' บาทที่คืนเงินไปแล้ว':'')+' — '+reason);
  return true;
 }
 function decideVoid(x,ok){
  const r=x&&x.voidReq;if(!r||r.status!=='pending'||x.voided||!mayApprove())return;
  const c=cutOf(x.saleId)||{id:x.saleId,no:x.saleNo};
  if(ok){if(!canVoid(x))return;doVoid(x,r.reason,{by:r.by,byName:r.byName,date:r.date});delete x.voidReq;}
  else Object.assign(r,{status:'rejected'},{decidedBy:DB.curEmp||'',decidedByName:meName(),decidedAt:nowTs()});
  if(!ok)logAudit('stockcut',c,'reject','ไม่อนุมัติการยกเลิก'+NAME(x)+' '+x.no);
  save();redraw();toast(ok?'ยกเลิก'+NAME(x)+' '+x.no+' แล้ว':'ไม่อนุมัติการยกเลิก'+NAME(x)+' '+x.no+' แล้ว');view(x.id);
 }
 function view(id){
  const x=all().find(z=>z.id===id);if(!x)return;F={view:x};
  const cu=findCust(x.custId),st=x.apv.status,vr=x.voidReq&&x.voidReq.status==='pending'&&!x.voided?x.voidReq:null;
  $c('#cnTitle').textContent=NAME(x)+' '+x.no;
  $c('#cnBody').innerHTML=`<p style="margin-top:0">${x.voided?'<span class="chip r">ยกเลิกแล้ว</span>':`<span class="chip ${st==='approved'?'g':st==='pending'?'a':'r'}">${APV_LABEL[st]||st}</span>`}
    ${esc(custName(cu)||'-')} · วันที่ ${thDate(x.date)} · อ้างอิง ${esc(x.ref.no)} ลงวันที่ ${thDate(x.ref.date)} · ใบตัดสต็อก ${esc(x.saleNo)}</p>
   <p>กรณี: ${esc(kindOf(x))}${causeOf(x)?' · เหตุตามมาตรา 82/10: '+esc(causeOf(x)):''} · เหตุผล: ${esc(x.reason)}</p>
   ${x.voided?`<p class="hint">ยกเลิกเมื่อ ${thDate(x.voided.date)} โดย ${esc(x.voided.byName||'-')} — ${esc(x.voided.reason)}</p>`:''}
   ${vr?`<p class="hint"><span class="chip a">ขอยกเลิก · รออนุมัติ</span> โดย ${esc(vr.byName||'-')} ${thDate(vr.date)} — ${esc(vr.reason)}</p>`:''}
   ${(x.lines||[]).length?`<table class="tbl"><thead><tr><th>รหัส</th><th>รายการ</th><th class="num">จำนวนที่คืน</th><th class="num">ราคา/หน่วย</th><th>สินค้าที่คืน</th></tr></thead><tbody>
    ${x.lines.map(l=>`<tr><td>${esc(l.code)}</td><td>${esc(l.name)}</td><td class="num">${qf(l.qty)}</td><td class="num">${money(l.price)}</td><td>${STOCK[l.stock]}</td></tr>`).join('')}</tbody></table>`:''}
   <table class="tbl" style="margin-top:10px;max-width:420px;margin-left:auto"><tbody>
    <tr><td>${isDn(x)?'มูลค่าที่เพิ่ม':'มูลค่าที่ลด'} (ก่อน VAT)</td><td class="num">${money(x.base)}</td></tr><tr><td>ภาษีมูลค่าเพิ่ม ${x.rate}%</td><td class="num">${money(x.vat)}</td></tr>
    <tr><td><b>รวม${NAME(x)}</b></td><td class="num"><b>${money(x.gross)}</b></td></tr>
    ${isDn(x)?(x.money?`<tr><td>ยอดค้างชำระเพิ่มขึ้น</td><td class="num">${money(x.money.increase)}</td></tr>`:''):x.money?`<tr><td>ลดยอดค้างชำระ</td><td class="num">${money(x.money.reduce)}</td></tr><tr><td>คืนเงินให้ลูกค้า${x.money.refund>EPS?' ('+(x.money.method==='trans'?'เงินโอน':'เงินสด')+')':''}</td><td class="num">${money(x.money.refund)}</td></tr>`:''}</tbody></table>
   <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
    ${st==='pending'&&mayApprove()?'<button type="button" class="btn gh" data-cn="reject">ไม่อนุมัติ</button><button type="button" class="btn pri" data-cn="approve">อนุมัติ</button>':''}
    ${vr&&mayApprove()?'<button type="button" class="btn gh" data-cn="voidno">ไม่อนุมัติการยกเลิก</button><button type="button" class="btn dgr" data-cn="voidyes">อนุมัติการยกเลิก</button>':''}
    ${done(x)&&!vr&&mayIssue()?`<button type="button" class="btn dgr" data-cn="void">ยกเลิก${NAME(x)}</button>`:''}
    ${done(x)?`<button type="button" class="btn pri" data-cn="print">พิมพ์${NAME(x)} (ต้นฉบับ + สำเนา)</button>`:''}</div>`;
  openModal('mCredit');
 }

 /* ---------- the printed credit note (what the Revenue Code asks of one: the original invoice, the right value, the
    difference, its VAT and why) ---------- */
 function sheet(x,copy){
  const cu=findCust(x.custId);
  const dn=isDn(x);
  return sheetTop({title:NAME(x),en:dn?'DEBIT NOTE':'CREDIT NOTE',copy,fields:[['เลขที่',esc(x.no)],['วันที่',thDate(x.date)],['อ้างอิงใบกำกับภาษีเลขที่',esc(x.ref.no)],['ลงวันที่',thDate(x.ref.date)]]})+`
  <table><tr><td style="vertical-align:top"><span class="lbl">ชื่อผู้ซื้อ / ผู้รับบริการ</span><br><b>${esc(custName(cu)||'-')}</b><br>${esc(addrLine(cu&&cu.addr))}<br>
   เลขประจำตัวผู้เสียภาษี ${esc((cu&&cu.tax)||'-')}${cu&&cu.branch?' ('+esc(cu.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th style="width:100px">รหัส</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
   ${(x.lines||[]).length?x.lines.map((l,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(l.code||'-')}</td><td>${esc(l.name)}</td><td style="text-align:center">${qf(l.qty)}</td><td class="num">${money(l.price)}</td><td class="num">${money(l.qty*l.price)}</td></tr>`).join('')
    :`<tr><td style="text-align:center">1</td><td>-</td><td>${esc(kindOf(x))}</td><td></td><td></td><td class="num">${money(x.base)}</td></tr>`}
   <tr><td colspan="5" style="text-align:right">มูลค่าสินค้าหรือบริการตามใบกำกับภาษีเดิม</td><td class="num">${money(x.ref.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">มูลค่าที่ถูกต้อง</td><td class="num">${money(dn?x.ref.base+x.base:x.ref.base-x.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">ผลต่าง</td><td class="num">${money(x.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">ภาษีมูลค่าเพิ่ม ${x.rate}%</td><td class="num">${money(x.vat)}</td></tr>
   <tr><td colspan="5" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(x.gross)}</b></td></tr>
   <tr><td colspan="6" style="text-align:center">(${bahtText(x.gross)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">${dn?'เหตุผลที่เพิ่มหนี้':'เหตุผลที่ลดหนี้'}</span><br><span>${esc(causeOf(x)||kindOf(x))} — ${esc(x.reason)}</span></div>
  <div class="sign"><div><div class="line"></div>( ${esc(x.apv.byName||'.................................................')} )<br><span class="lbl">ผู้ออก${NAME(x)}</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับ${NAME(x)}</span></div></div></div>`;
 }
 function print(x){if(!x||!done(x))return;const c=cutOf(x.saleId);logAudit('stockcut',c||{id:x.saleId,no:x.saleNo},'print',NAME(x)+' '+x.no+' 2 แผ่น');save();
  printDocs(sheet(x,'ต้นฉบับ')+sheet(x,'สำเนา'));}

 /* ---------- the sale window: one button per credit note it has (a new one starts on 4.6, below: a button in the sale
    window would move everything under its toolbar) ---------- */
 const D=window.PKG_SALE_DOCS;
 if(D&&D.printBox){const pb0=D.printBox;D.printBox=function(d,show){const out=pb0.apply(this,arguments);try{paintSale(d,show);}catch(e){}return out;};}
 function paintSale(d,show){
  const M=document.getElementById('mSale'),tc=M&&M.querySelector('#saTools .pkg-sa-toolcol');if(!tc)return;
  let box=tc.querySelector('#cnTools');if(!box){box=document.createElement('span');box.id='cnTools';box.style.display='contents';tc.append(box);}
  const c=show&&d&&d.id?cutOf(d.id):null;
  box.innerHTML=!c?'':anyOf(c).map(x=>`<button type="button" class="btn pkg-sf-white" data-cnsale="${x.id}" data-no-translate>${NAME(x)} ${esc(x.no)}${x.voided?' · ยกเลิกแล้ว':done(x)?'':' · '+esc(APV_LABEL[x.apv.status])}</button>`).join('');
  box.onclick=e=>{const b=e.target.closest('[data-cnsale]');if(b)view(b.dataset.cnsale);};
 }
 function redraw(){try{if(typeof window.pkgSaleRender==='function'&&document.getElementById('mSale').classList.contains('on'))window.pkgSaleRender();}catch(e){}
  ['renderHome','renderTaxOverview','renderApvBars','renderApvAlert','syncApvBadges'].forEach(f=>{try{if(typeof window[f]==='function')window[f]();}catch(e){}});}

 /* ---------- 4.6: "+ ออกใบลดหนี้" next to "+ ออกใบกำกับภาษีใหม่" ---------- */
 const nb=document.createElement('button');nb.type='button';nb.className='btn pri';nb.textContent='+ ออกใบลดหนี้';nb.onclick=()=>openPick();
 nb.style.marginLeft='8px';
 /* kept right after it: the row is rebuilt after this file loads (its spacer comes later) */
 const db=document.createElement('button');db.type='button';db.className='btn pri';db.textContent='+ ออกใบเพิ่มหนี้';db.onclick=()=>openPick(true);db.style.marginLeft='8px';
 const showNb=()=>{const t=document.querySelector('#rOv-tax button[onclick="openTaxNew()"]');if(t&&t.nextElementSibling!==nb)t.after(nb);if(nb.nextElementSibling!==db)nb.after(db);
  nb.style.display=db.style.display=S.on()&&mayIssue()?'':'none';};showNb();
 if(typeof renderTaxOverview==='function'){const ro0=renderTaxOverview;renderTaxOverview=function(){const out=ro0.apply(this,arguments);showNb();return out;};}

 /* ---------- pending approvals: with the other documents, for the owner and whoever approves tax invoices ---------- */
 window.pkgOpenCreditNote=id=>view(id);
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='creditnote'))APV_SRC.push(['creditnote','ใบลดหนี้',()=>all().filter(x=>!isDn(x)),'pkgOpenCreditNote','receipt']);
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='debitnote'))APV_SRC.push(['debitnote','ใบเพิ่มหนี้',()=>all().filter(isDn),'pkgOpenCreditNote','receipt']);
 /* a request to cancel one: listed as its own kind, read from the credit notes */
 const VOIDREQ=x=>({id:x.id,no:x.no,custId:x.custId,gross:x.gross,apv:{status:'pending',date:x.voidReq.date,byName:x.voidReq.byName}});
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='debitnotevoid'))APV_SRC.push(['debitnotevoid','ขอยกเลิกใบเพิ่มหนี้',
  ()=>all().filter(x=>isDn(x)&&x.voidReq&&x.voidReq.status==='pending'&&!x.voided).map(VOIDREQ),'pkgOpenCreditNote','receipt']);
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='creditnotevoid'))APV_SRC.push(['creditnotevoid','ขอยกเลิกใบลดหนี้',
  ()=>all().filter(x=>!isDn(x)&&x.voidReq&&x.voidReq.status==='pending'&&!x.voided).map(x=>({id:x.id,no:x.no,custId:x.custId,gross:x.gross,apv:{status:'pending',date:x.voidReq.date,byName:x.voidReq.byName}})),'pkgOpenCreditNote','receipt']);
 const MINEK=['creditnote','creditnotevoid','debitnote','debitnotevoid'];
 const ak0=apvKeyOf;apvKeyOf=function(kind){return MINEK.includes(kind)?'tax':ak0.apply(this,arguments);};
 const am0=apvAmount;apvAmount=function(kind,d){return MINEK.includes(kind)?n(d.gross):am0.apply(this,arguments);};

 /* ---------- the sales tax report: a credit note lowers the sales tax of its own month ---------- */
 const rt0=renderTax;renderTax=function(){
  const mo=acctM(),extra=all().filter(x=>done(x)&&String(x.date).slice(0,7)===mo).map(x=>({id:'CN'+x.id,no:x.no,taxNo:x.no,date:x.date,custId:x.custId,br:x.br,
   items:[],disc:0,vat:x.rate,wht:0,whtBase:'labor',cancelled:false,paid:true,pay:{},payments:[],taxDocs:[{no:x.no,date:x.date,cancelled:false,base:isDn(x)?x.base:-x.base,vat:isDn(x)?x.vat:-x.vat,gross:isDn(x)?x.gross:-x.gross}]}));
  if(!extra.length)return rt0.apply(this,arguments);
  const real=DB.receipts;DB.receipts=real.concat(extra);try{return rt0.apply(this,arguments);}finally{DB.receipts=real;}
 };

 /* ---------- 4.6: the register of credit and debit notes (owner's decision of 2026-11-06): view, print again, Excel.
    Its title is no heading (role presentation): the scenarios find the credit note's window as the panel with such a heading ---------- */
 const RP=document.createElement('div');RP.className='panel';RP.id='cnRegPanel';RP.style.margin='12px';
 RP.innerHTML=`<header><h2 role="presentation">ทะเบียนใบลดหนี้ / ใบเพิ่มหนี้</h2><div class="spacer"></div><span class="tag" id="cnRegCount"></span>
  <button type="button" class="btn gh sm" id="cnRegXls">ส่งออก Excel</button></header>
  <div class="row" style="padding:9px 12px;gap:10px;align-items:flex-end;flex-wrap:wrap">
   <label class="f" style="margin:0"><span>เดือน</span><input type="month" id="cnRegMonth" style="width:160px"></label>
   <label class="f" style="margin:0"><span>ประเภท</span><select id="cnRegType"><option value="">ทั้งหมด</option><option value="credit">ใบลดหนี้</option><option value="debit">ใบเพิ่มหนี้</option></select></label>
   <label class="f" style="margin:0;flex:1;min-width:180px"><span>ค้นหา</span><input type="search" id="cnRegFind" placeholder="เลขที่ / ใบกำกับภาษี / ใบตัดสต็อก / ลูกค้า"></label></div>
  <div class="scroll"><table class="tbl" id="cnRegTbl"><thead><tr><th class="ctr" style="width:95px">วันที่</th><th>เลขที่</th><th>ประเภท</th><th>อ้างอิงใบกำกับภาษี</th>
   <th>ลูกค้า</th><th>กรณี</th><th class="num">มูลค่า</th><th class="num">ภาษีมูลค่าเพิ่ม</th><th class="num">รวม</th><th class="ctr">สถานะ</th><th class="ctr">จัดการ</th></tr></thead><tbody></tbody></table></div>`;
 const regWhere=()=>document.getElementById('rOv-tax');
 const stLabel=x=>x.voided?'ยกเลิกแล้ว':x.voidReq&&x.voidReq.status==='pending'?'ขอยกเลิก · รออนุมัติ':APV_LABEL[x.apv.status]||x.apv.status;
 const stCls=x=>x.voided||x.apv.status==='rejected'?'r':x.apv.status==='pending'||(x.voidReq&&x.voidReq.status==='pending')?'a':'g';
 function regRows(){
  const mo=(document.getElementById('cnRegMonth')||{}).value||'',ty=(document.getElementById('cnRegType')||{}).value||'',q=String((document.getElementById('cnRegFind')||{}).value||'').trim().toLowerCase();
  return all().filter(x=>(!mo||String(x.date).slice(0,7)===mo)&&(!ty||(ty==='debit')===isDn(x))
   &&(!q||[x.no,x.ref&&x.ref.no,x.saleNo,custName(findCust(x.custId))].some(v=>String(v||'').toLowerCase().includes(q))))
   .sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
 }
 window.pkgRenderCnReg=function(){
  const el=regWhere();if(!el)return;if(RP.parentElement!==el)el.append(RP);
  RP.style.display=S.on()?'':'none';if(!S.on())return;
  const mi=document.getElementById('cnRegMonth');if(mi&&!mi.dataset.set){mi.value=iso().slice(0,7);mi.dataset.set='1';}
  const rows=regRows(),ok=rows.filter(done),cr=ok.filter(x=>!isDn(x)),de=ok.filter(isDn);
  document.getElementById('cnRegCount').textContent=rows.length+' ใบ · ใบลดหนี้ '+money(cr.reduce((a,x)=>a+n(x.gross),0))+' บาท · ใบเพิ่มหนี้ '+money(de.reduce((a,x)=>a+n(x.gross),0))+' บาท';
  const tb=document.getElementById('cnRegTbl').tBodies[0];
  tb.innerHTML=rows.map(x=>`<tr data-cnreg="${x.id}"${x.voided?' class="cancelrow"':''}><td class="ctr">${thDate(x.date)}</td><td class="mono" data-no-translate>${esc(x.no)}</td><td>${NAME(x)}</td>
   <td class="mono" data-no-translate>${esc(x.ref?x.ref.no:'-')}<div class="hint">ใบตัดสต็อก ${esc(x.saleNo||'-')}</div></td><td>${esc(custName(findCust(x.custId))||'-')}</td><td>${esc(kindOf(x))}</td>
   <td class="num">${money(x.base)}</td><td class="num">${money(x.vat)}</td><td class="num"><b>${money(x.gross)}</b></td>
   <td class="ctr"><span class="chip ${stCls(x)}">${esc(stLabel(x))}</span></td><td class="ctr"><button type="button" class="btn sm gh" data-cnview="${x.id}">ดู</button>${done(x)?` <button type="button" class="btn sm gh" data-cnprint="${x.id}">พิมพ์</button>`:''}</td></tr>`).join('')
   ||'<tr><td colspan="11" class="empty">ยังไม่มีใบลดหนี้ / ใบเพิ่มหนี้</td></tr>';
  try{if(window.PKG_ROW_NUMBER)PKG_ROW_NUMBER.number('cnRegTbl');}catch(e){}
 };
 RP.addEventListener('input',e=>{if(['cnRegMonth','cnRegType','cnRegFind'].includes(e.target.id))window.pkgRenderCnReg();});
 RP.addEventListener('change',e=>{if(['cnRegMonth','cnRegType'].includes(e.target.id))window.pkgRenderCnReg();});
 RP.addEventListener('click',e=>{const v=e.target.closest('[data-cnview]');if(v)return view(v.dataset.cnview);
  const pr=e.target.closest('[data-cnprint]');if(pr){const x=all().find(z=>z.id===pr.dataset.cnprint);return print(x);}
  if(e.target.closest('#cnRegXls')&&window.PKG_REG_EXPORT)return PKG_REG_EXPORT.excel('cnRegTbl');});
 if(window.PKG_REG_EXPORT&&PKG_REG_EXPORT.registers)PKG_REG_EXPORT.registers.cnRegTbl={row:'rcptTax',kind:'receipt',render:'pkgRenderCnReg'};
 if(typeof renderTaxOverview==='function'){const ro1=renderTaxOverview;renderTaxOverview=function(){const out=ro1.apply(this,arguments);try{window.pkgRenderCnReg();}catch(e){}return out;};}
 window.PKG_CREDIT_NOTE={all,ofSale,canCredit,canDebit,openPick,openNew,view,apply,decide,KIND,KIND_DN,NAME,isDn,done,paid,askVoid,decideVoid,print};
})();
