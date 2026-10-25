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
     apv: { status, by, byName, date }, money: { reduce, refund, method }, created… }] */
(function(){
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,B=window.PKG_BRANCH;
 if(!S||!SC||typeof renderTax!=='function')return;
 const KIND={ret:'ลูกค้าคืนสินค้า',disc:'ลดราคาหลังขาย',over:'ยอดในใบกำกับภาษีเกินจริง (คิดเงินผิด)',all:'ยกเลิกการขายทั้งใบ'};
 const STOCK={back:'คืนเข้าสต๊อก',waste:'ของเสีย'};
 const r2=v=>round2(v),EPS=0.005;
 const all=()=>DB.creditNotes||[];
 const live=x=>x&&x.apv&&x.apv.status!=='rejected';
 const done=x=>x&&x.apv&&x.apv.status==='approved';
 const ofSale=c=>all().filter(x=>x.saleId===c.id&&live(x));
 const cutOf=id=>(DB.stockCuts||[]).find(x=>x.id===id);
 const owner=()=>!curEmp();
 const mayIssue=()=>owner()||can('doc.creditNote');
 const mayApprove=()=>owner()||can('apv.tax');
 const stamp=()=>({date:iso(),at:nowTs(),by:DB.curEmp||'',byName:meName()});
 const inBr=(c,fn)=>B&&B.within&&B.brOf?B.within(B.brOf(c),fn):fn();

 /* what is left of a sale to credit: its remaining total (after earlier credit notes, counting those still waiting),
    and per line the quantity not yet returned */
 function left(c){
  const L=S.led(c),t=receiptTotals(L),wait=ofSale(c).filter(x=>!done(x)).reduce((a,x)=>a+x.gross,0);
  return {L,t,gross:r2(t.gross-wait),rate:n(c.vat)};
 }
 const returned=(c,i)=>ofSale(c).reduce((a,x)=>a+(x.lines||[]).filter(l=>l.i===i).reduce((s,l)=>s+n(l.qty),0),0);
 /* goods that can come back: the sale's lines of stock items */
 const rows=c=>(c.items||[]).map((it,i)=>({i,it})).filter(x=>x.it.stockId&&x.it.type!=='labor').map(x=>({i:x.i,it:x.it,max:n(x.it.qty)-returned(c,x.i)}));
 /* the share of a line's price that is in the sale's amount before VAT (a discount on the whole bill is spread) */
 function ratio(c){const o=S.origTotals(S.led(c));return o.sub>0?o.base/o.sub:1;}
 const canCredit=c=>!!c&&!c.cancelled&&!c.superseded&&n(c.vat)>0&&!!S.led(c)&&left(c).gross>EPS;

 /* ---------- taking effect ---------- */
 function apply(x){
  const c=cutOf(x.saleId),L=c&&S.led(c);if(!c||!L)return false;
  const rem=S.stat(c).rem,reduce=r2(Math.min(x.gross,rem)),refund=r2(x.gross-reduce);
  x.money={reduce,refund,method:refund>EPS?x.method:''};
  c.adj=(c.adj||[]).concat([Object.assign({id:uid(),type:'down',amt:x.gross,reason:'ใบลดหนี้ '+x.no,note:x.reason,cn:x.no},stamp())]);
  inBr(c,()=>(x.lines||[]).forEach(l=>{if(l.stock!=='back'||!(n(l.qty)>0))return;const s=DB.stock.find(z=>z.id===l.stockId);if(!s)return;
   s.qty=n(s.qty)+n(l.qty);s.lastMove=iso();logMove(s.id,'in',n(l.qty),iso(),'รับคืนตามใบลดหนี้ '+x.no+' · ใบตัดสต็อก '+c.no,c.moveRef);}));
  S.sync(c);S.touch(c);
  logAudit('stockcut',c,'creditnote','ใบลดหนี้ '+x.no+' · '+KIND[x.kind]+' · '+money(x.gross)+' บาท'
   +(refund>EPS?' · คืนเงินลูกค้า '+money(refund)+' บาท ('+(x.method==='trans'?'เงินโอน':'เงินสด')+')':'')+' — '+x.reason);
  return true;
 }
 /* money given back is not money received */
 const refunds=L=>all().filter(x=>done(x)&&x.ledId===L.id).reduce((a,x)=>a+n(x.money&&x.money.refund),0);
 /* DriveGo new system (task 3.5): money paid back is cash going out — the year's cash (08 สุขภาพการเงิน, งบ) counts it on the day
    the credit note took effect (its approval) */
 const refundDay=x=>(x.apv&&x.apv.date)||x.date;
 if(typeof finance==='function'){const fin0=finance;finance=function(y){const o=fin0.apply(this,arguments);if(!o)return o;
  const r=r2(all().filter(x=>done(x)&&x.money&&n(x.money.refund)>0&&+String(refundDay(x)).slice(0,4)<=y).reduce((a,x)=>a+n(x.money.refund),0));
  if(r>0){o.cash-=r;o.assetsTotal-=r;o.equity-=r;o.roi=o.ownerCap>0?o.np/o.ownerCap*100:(o.equity>0?o.np/o.equity*100:0);o.roa=o.assetsTotal>0?o.np/o.assetsTotal*100:0;}
  return o;};}
 const pa0=paidAmtOf;paidAmtOf=function(d){const v=pa0.apply(this,arguments);return d&&d.pkgSale&&DB.creditNotes?v-refunds(d):v;};
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||all().some(x=>x.no===no);};

 /* a sale with credit notes is not cancelled or revised (that would take back what they did): the credit note is the way */
 const lockMsg=(c,x)=>toast('ใบตัดสต็อก '+c.no+' มีใบลดหนี้ '+x.no+' แล้ว — ยกเลิกหรือทำฉบับแก้ไขไม่ได้ ใช้ใบลดหนี้แทน');
 const cc0=S.canCancel;S.canCancel=function(c){const x=c&&ofSale(c)[0];if(x){lockMsg(c,x);return false;}return cc0.apply(this,arguments);};
 const rv0=S.revise;S.revise=function(x){const c=typeof x==='string'?cutOf(x):x,cn=c&&!c.pkgSale&&ofSale(c)[0];if(cn){lockMsg(c,cn);return false;}return rv0.apply(this,arguments);};
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
 function refresh(){
  const f=figures();
  [['#cnBase',f.base],['#cnVat',f.vat],['#cnGross',f.gross],['#cnReduce',f.reduce],['#cnRefund',f.refund]].forEach(([s,v])=>{const e=$c(s);if(e)e.textContent=money(v);});
  const m=$c('#cnMethodBox');if(m)m.style.display=f.refund>EPS?'':'none';
 }
 /* "+ ออกใบลดหนี้" on 4.6: first the sale, found by its number, its tax invoice's number or the customer */
 function openPick(){
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  F={pick:true,q:''};$c('#cnTitle').textContent='ออกใบลดหนี้';
  $c('#cnBody').innerHTML=`<label class="f"><span>ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า</span><input id="cnFind"></label><div id="cnPickList" style="margin-top:10px"></div>`;
  drawPick();openModal('mCredit');
 }
 function drawPick(){
  const q=F.q.trim().toLowerCase();
  const list=(DB.stockCuts||[]).filter(canCredit).map(c=>{const L=S.led(c),tx=L&&S.taxOf(L);return {c,tx,cust:custName(findCust(c.custId))||''};})
   .filter(x=>!q||[x.c.no,x.tx&&x.tx.no,x.cust].some(v=>String(v||'').toLowerCase().includes(q)))
   .sort((a,b)=>String(b.c.date).localeCompare(String(a.c.date))||String(b.c.no).localeCompare(String(a.c.no))).slice(0,50);
  $c('#cnPickList').innerHTML=`<table class="tbl"><thead><tr><th>เลขที่ใบตัดสต็อก</th><th>ใบกำกับภาษี</th><th>วันที่</th><th>ลูกค้า</th><th class="num">ยอดขาย</th><th></th></tr></thead><tbody>
   ${list.map(x=>`<tr><td class="mono">${esc(x.c.no)}</td><td class="mono">${esc(x.tx?x.tx.no:'-')}</td><td class="ctr">${thDate(x.c.date)}</td><td>${esc(x.cust||'-')}</td>
    <td class="num">${money(S.stat(x.c).total)}</td><td><button type="button" class="btn sm pri" data-cnpick="${x.c.id}">เลือก</button></td></tr>`).join('')
    ||'<tr><td colspan="6" class="empty">ไม่พบการขายที่มี VAT ที่ออกใบลดหนี้ได้</td></tr>'}</tbody></table>`;
 }
 function openNew(id){
  const c=cutOf(id);if(!c)return;
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  if(!canCredit(c))return toast('ใบตัดสต็อก '+c.no+' ออกใบลดหนี้ไม่ได้');
  F={c,kind:'ret',qty:{},stock:{},amt:'',reason:'',method:'cash'};drawForm();openModal('mCredit');
 }
 W.addEventListener('input',e=>{if(!F||F.view)return;const t=e.target;
  if(F.pick){if(t.id==='cnFind'){F.q=t.value;drawPick();}return;}
  if(t.dataset.q!==undefined)F.qty[+t.dataset.q]=n(t.value);else if(t.id==='cnAmt')F.amt=t.value;else if(t.id==='cnReason'){F.reason=t.value;return;}else return;refresh();});
 W.addEventListener('change',e=>{if(!F||F.view||F.pick)return;const t=e.target;
  if(t.id==='cnKind'){F.kind=t.value;drawForm();}else if(t.dataset.s!==undefined){F.stock[+t.dataset.s]=t.value;}else if(t.id==='cnMethod')F.method=t.value;});
 W.addEventListener('click',async e=>{const p=e.target.closest('[data-cnpick]');if(p)return openNew(p.dataset.cnpick);
  const b=e.target.closest('[data-cn]');if(!b)return;const a=b.dataset.cn;
  if(a==='close'){closeModal('mCredit');F=null;return;}
  if(a==='save')return saveNew();
  if(a==='print')return print(F.view);
  if(a==='approve')return decide(F.view,true);
  if(a==='reject')return decide(F.view,false);
 });

 async function saveNew(){
  const c=F.c,f=figures(),reason=String(F.reason||'').trim();
  if(!mayIssue())return toast('บัญชีนี้ไม่มีสิทธิ์ออกใบลดหนี้');
  if(F.kind==='ret'&&!f.lines.length)return toast('ใส่จำนวนสินค้าที่คืนก่อน');
  if(!(f.gross>EPS))return toast('ใส่มูลค่าที่ลดก่อน');
  if(f.gross>f.left+EPS)return toast('ใบลดหนี้ลดได้ไม่เกิน '+money(f.left)+' บาท');
  if(!reason)return toast('ใส่เหตุผลของใบลดหนี้ก่อน');
  const tx=S.taxOf(S.led(c));
  const x={id:uid(),no:inBr(c,()=>docNo('CN')),date:iso(),saleId:c.id,saleNo:c.no,ledId:S.led(c).id,custId:c.custId,br:c.br||'',kind:F.kind,reason,
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
  const c=cutOf(x.saleId);logAudit('stockcut',c||{id:x.saleId,no:x.saleNo},ok?'approve':'reject',(ok?'อนุมัติใบลดหนี้ ':'ไม่อนุมัติใบลดหนี้ ')+x.no);
  save();redraw();toast((ok?'อนุมัติใบลดหนี้ ':'ไม่อนุมัติใบลดหนี้ ')+x.no+' แล้ว');view(x.id);
 }
 function view(id){
  const x=all().find(z=>z.id===id);if(!x)return;F={view:x};
  const cu=findCust(x.custId),st=x.apv.status;
  $c('#cnTitle').textContent='ใบลดหนี้ '+x.no;
  $c('#cnBody').innerHTML=`<p style="margin-top:0"><span class="chip ${st==='approved'?'g':st==='pending'?'a':'r'}">${APV_LABEL[st]||st}</span>
    ${esc(custName(cu)||'-')} · วันที่ ${thDate(x.date)} · อ้างอิง ${esc(x.ref.no)} ลงวันที่ ${thDate(x.ref.date)} · ใบตัดสต็อก ${esc(x.saleNo)}</p>
   <p>กรณี: ${esc(KIND[x.kind])} · เหตุผล: ${esc(x.reason)}</p>
   ${(x.lines||[]).length?`<table class="tbl"><thead><tr><th>รหัส</th><th>รายการ</th><th class="num">จำนวนที่คืน</th><th class="num">ราคา/หน่วย</th><th>สินค้าที่คืน</th></tr></thead><tbody>
    ${x.lines.map(l=>`<tr><td>${esc(l.code)}</td><td>${esc(l.name)}</td><td class="num">${qf(l.qty)}</td><td class="num">${money(l.price)}</td><td>${STOCK[l.stock]}</td></tr>`).join('')}</tbody></table>`:''}
   <table class="tbl" style="margin-top:10px;max-width:420px;margin-left:auto"><tbody>
    <tr><td>มูลค่าที่ลด (ก่อน VAT)</td><td class="num">${money(x.base)}</td></tr><tr><td>ภาษีมูลค่าเพิ่ม ${x.rate}%</td><td class="num">${money(x.vat)}</td></tr>
    <tr><td><b>รวมใบลดหนี้</b></td><td class="num"><b>${money(x.gross)}</b></td></tr>
    ${x.money?`<tr><td>ลดยอดค้างชำระ</td><td class="num">${money(x.money.reduce)}</td></tr><tr><td>คืนเงินให้ลูกค้า${x.money.refund>EPS?' ('+(x.money.method==='trans'?'เงินโอน':'เงินสด')+')':''}</td><td class="num">${money(x.money.refund)}</td></tr>`:''}</tbody></table>
   <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px">
    ${st==='pending'&&mayApprove()?'<button type="button" class="btn gh" data-cn="reject">ไม่อนุมัติ</button><button type="button" class="btn pri" data-cn="approve">อนุมัติ</button>':''}
    ${st==='approved'?'<button type="button" class="btn pri" data-cn="print">พิมพ์ใบลดหนี้ (ต้นฉบับ + สำเนา)</button>':''}</div>`;
  openModal('mCredit');
 }

 /* ---------- the printed credit note (what the Revenue Code asks of one: the original invoice, the right value, the
    difference, its VAT and why) ---------- */
 function sheet(x,copy){
  const cu=findCust(x.custId);
  return sheetTop({title:'ใบลดหนี้',en:'CREDIT NOTE',copy,fields:[['เลขที่',esc(x.no)],['วันที่',thDate(x.date)],['อ้างอิงใบกำกับภาษีเลขที่',esc(x.ref.no)],['ลงวันที่',thDate(x.ref.date)]]})+`
  <table><tr><td style="vertical-align:top"><span class="lbl">ชื่อผู้ซื้อ / ผู้รับบริการ</span><br><b>${esc(custName(cu)||'-')}</b><br>${esc(addrLine(cu&&cu.addr))}<br>
   เลขประจำตัวผู้เสียภาษี ${esc((cu&&cu.tax)||'-')}${cu&&cu.branch?' ('+esc(cu.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th style="width:100px">รหัส</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
   ${(x.lines||[]).length?x.lines.map((l,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(l.code||'-')}</td><td>${esc(l.name)}</td><td style="text-align:center">${qf(l.qty)}</td><td class="num">${money(l.price)}</td><td class="num">${money(l.qty*l.price)}</td></tr>`).join('')
    :`<tr><td style="text-align:center">1</td><td>-</td><td>${esc(KIND[x.kind])}</td><td></td><td></td><td class="num">${money(x.base)}</td></tr>`}
   <tr><td colspan="5" style="text-align:right">มูลค่าสินค้าหรือบริการตามใบกำกับภาษีเดิม</td><td class="num">${money(x.ref.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">มูลค่าที่ถูกต้อง</td><td class="num">${money(x.ref.base-x.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">ผลต่าง</td><td class="num">${money(x.base)}</td></tr>
   <tr><td colspan="5" style="text-align:right">ภาษีมูลค่าเพิ่ม ${x.rate}%</td><td class="num">${money(x.vat)}</td></tr>
   <tr><td colspan="5" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(x.gross)}</b></td></tr>
   <tr><td colspan="6" style="text-align:center">(${bahtText(x.gross)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">เหตุผลที่ลดหนี้</span><br><span>${esc(KIND[x.kind])} — ${esc(x.reason)}</span></div>
  <div class="sign"><div><div class="line"></div>( ${esc(x.apv.byName||'.................................................')} )<br><span class="lbl">ผู้ออกใบลดหนี้</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับใบลดหนี้</span></div></div></div>`;
 }
 function print(x){if(!x||!done(x))return;const c=cutOf(x.saleId);logAudit('stockcut',c||{id:x.saleId,no:x.saleNo},'print','ใบลดหนี้ '+x.no+' 2 แผ่น');save();
  printDocs(sheet(x,'ต้นฉบับ')+sheet(x,'สำเนา'));}

 /* ---------- the sale window: one button per credit note it has (a new one starts on 4.6, below: a button in the sale
    window would move everything under its toolbar) ---------- */
 const D=window.PKG_SALE_DOCS;
 if(D&&D.printBox){const pb0=D.printBox;D.printBox=function(d,show){const out=pb0.apply(this,arguments);try{paintSale(d,show);}catch(e){}return out;};}
 function paintSale(d,show){
  const M=document.getElementById('mSale'),tc=M&&M.querySelector('#saTools .pkg-sa-toolcol');if(!tc)return;
  let box=tc.querySelector('#cnTools');if(!box){box=document.createElement('span');box.id='cnTools';box.style.display='contents';tc.append(box);}
  const c=show&&d&&d.id?cutOf(d.id):null;
  box.innerHTML=!c?'':ofSale(c).map(x=>`<button type="button" class="btn pkg-sf-white" data-cnsale="${x.id}" data-no-translate>ใบลดหนี้ ${esc(x.no)}${done(x)?'':' · '+esc(APV_LABEL[x.apv.status])}</button>`).join('');
  box.onclick=e=>{const b=e.target.closest('[data-cnsale]');if(b)view(b.dataset.cnsale);};
 }
 function redraw(){try{if(typeof window.pkgSaleRender==='function'&&document.getElementById('mSale').classList.contains('on'))window.pkgSaleRender();}catch(e){}
  ['renderHome','renderTaxOverview','renderApvBars','renderApvAlert','syncApvBadges'].forEach(f=>{try{if(typeof window[f]==='function')window[f]();}catch(e){}});}

 /* ---------- 4.6: "+ ออกใบลดหนี้" next to "+ ออกใบกำกับภาษีใหม่" ---------- */
 const nb=document.createElement('button');nb.type='button';nb.className='btn pri';nb.textContent='+ ออกใบลดหนี้';nb.onclick=()=>openPick();
 nb.style.marginLeft='8px';
 /* kept right after it: the row is rebuilt after this file loads (its spacer comes later) */
 const showNb=()=>{const t=document.querySelector('#rOv-tax button[onclick="openTaxNew()"]');if(t&&t.nextElementSibling!==nb)t.after(nb);
  nb.style.display=S.on()&&mayIssue()?'':'none';};showNb();
 if(typeof renderTaxOverview==='function'){const ro0=renderTaxOverview;renderTaxOverview=function(){const out=ro0.apply(this,arguments);showNb();return out;};}

 /* ---------- pending approvals: with the other documents, for the owner and whoever approves tax invoices ---------- */
 window.pkgOpenCreditNote=id=>view(id);
 if(typeof APV_SRC!=='undefined'&&!APV_SRC.some(x=>x[0]==='creditnote'))APV_SRC.push(['creditnote','ใบลดหนี้',()=>DB.creditNotes||[],'pkgOpenCreditNote','receipt']);
 const ak0=apvKeyOf;apvKeyOf=function(kind){return kind==='creditnote'?'tax':ak0.apply(this,arguments);};
 const am0=apvAmount;apvAmount=function(kind,d){return kind==='creditnote'?n(d.gross):am0.apply(this,arguments);};

 /* ---------- the sales tax report: a credit note lowers the sales tax of its own month ---------- */
 const rt0=renderTax;renderTax=function(){
  const mo=acctM(),extra=all().filter(x=>done(x)&&String(x.date).slice(0,7)===mo).map(x=>({id:'CN'+x.id,no:x.no,taxNo:x.no,date:x.date,custId:x.custId,br:x.br,
   items:[],disc:0,vat:x.rate,wht:0,whtBase:'labor',cancelled:false,paid:true,pay:{},payments:[],taxDocs:[{no:x.no,date:x.date,cancelled:false,base:-x.base,vat:-x.vat,gross:-x.gross}]}));
  if(!extra.length)return rt0.apply(this,arguments);
  const real=DB.receipts;DB.receipts=real.concat(extra);try{return rt0.apply(this,arguments);}finally{DB.receipts=real;}
 };

 window.PKG_CREDIT_NOTE={all,ofSale,canCredit,openPick,openNew,view,apply,decide,KIND};
})();
