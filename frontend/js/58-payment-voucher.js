/* DriveGo new system (task 3.4, decision R7-ข, owner's answers 2026-10-25): payment vouchers — "ใบสำคัญจ่าย".
   · Every payment out has a voucher number MA-PV… (docNo('PV'), a counter of its own): a business expense saved as
     "จ่ายแล้ว" or paid later from "ค้างจ่าย" (x.pvNo, x.payDate), and each settlement in "ชำระเงินเจ้าหนี้" — one voucher
     for every goods receipt paid in it (payments[].pvNo, put there by settle.js, 47.js doSave). Paying writes the audit log.
     A voucher number stays with its expense: set back to ค้างจ่าย and paid again, it is paid under the same number.
   · Vendor payments may withhold tax, bill by bill (R7-ข-ก, for vendors of services / transport): "หัก ณ ที่จ่าย" in the
     settle window opens a table of the ticked goods receipts — the rate and the base before VAT. What is withheld is not
     money paid but settles the bill like it: it counts in what is paid of a goods receipt (paidAmtOf).
     payments[].wht = { rate, baseAmt, amt, form: '3' | '53' } (form: ภ.ง.ด.53 for a juristic vendor, else ภ.ง.ด.3).
   · The expense form keeps what the legacy app dropped when an expense was saved again: the payment date, the voucher
     number and what 4.4 recorded for the certificate (whtCertNo, whtForm, whtRemit).
   · The printed voucher: the payee, what is paid, the withholding, what was paid and how, and signatures. Printed from
     the expense window, the payment history of a goods receipt and the settle window once it is saved. */
(function(){
 if(typeof saveExp!=='function'||typeof payExp!=='function'||typeof expTotals!=='function'||typeof grTotals!=='function')return;
 const r2=v=>round2(v),$i=id=>document.getElementById(id);
 const RATES=[[0,'ไม่หัก'],[1,'1% (ค่าขนส่ง)'],[2,'2% (ค่าโฆษณา)'],[3,'3% (ค่าบริการ / ค่าจ้างทำของ)'],[5,'5% (ค่าเช่า)']];
 const ven=id=>(DB.vendors||[]).find(v=>v.id===id)||null;
 const venNamed=nm=>{const k=String(nm||'').trim();return k?(DB.vendors||[]).find(v=>String(v.name||'').trim()===k)||null:null;};
 const isPurchase=d=>!!d&&Array.isArray(DB.purchases)&&DB.purchases.indexOf(d)>=0;
 const active=d=>(d&&d.payments||[]).filter(p=>p&&!p.cancelled);
 /* ภ.ง.ด.53 for a juristic payee (the vendor's type, or the name / a tax id starting with 0 as 4.4 reads it), else ภ.ง.ด.3 */
 const formFor=(v,name,tax)=>v?(v.type==='company'?'53':'3'):((/บริษัท|จำกัด|ห้างหุ้นส่วน|หจก|บจก|มหาชน/.test(String(name||''))||/^0/.test(String(tax||'').replace(/\D/g,'')))?'53':'3');

 /* ---------- numbers ---------- */
 const newNo=()=>docNo('PV');
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||(DB.expenses||[]).some(x=>x&&x.pvNo===no)
  ||(DB.purchases||[]).some(g=>(g.payments||[]).some(p=>p&&p.pvNo===no));};

 /* ---------- what a vendor's withholding settles ---------- */
 const pa0=paidAmtOf;paidAmtOf=function(d){const v=pa0.apply(this,arguments);
  return isPurchase(d)?v+active(d).reduce((a,p)=>a+(p.wht?n(p.wht.amt):0),0):v;};

 /* ---------- business expenses ---------- */
 const KEEP=['payDate','pvNo','whtCertNo','whtForm','whtRemit'];
 const isExp=r=>r&&typeof r==='object'&&'cat' in r&&'base' in r&&'wht' in r&&'paid' in r;
 /* "เครดิต (ยังไม่จ่าย)" says nothing of how it was paid at last */
 const methodOf=x=>/^เครดิต/.test(String(x.method||''))?'':String(x.method||'');
 function paidNote(x){const t=expTotals(x);
  return 'จ่ายเงิน '+money(t.net)+' บาท'+(methodOf(x)?' ('+methodOf(x)+')':'')+(t.wht>0?' · หัก ณ ที่จ่าย '+money(t.wht)+' บาท':'')+' · ใบสำคัญจ่าย '+x.pvNo;}
 /* the expense form builds a new record from its fields: carry over what is not in the form, and a payment the save makes */
 let saving=null;
 const sr=window.stampRec;window.stampRec=function(rec,old){
  if(saving&&isExp(rec)){const o=old||null;
   if(o)KEEP.forEach(k=>{if(o[k]!==undefined)rec[k]=o[k];});
   if(rec.paid&&!(o&&o.paid)){rec.payDate=o?iso():rec.date;if(!rec.pvNo)rec.pvNo=newNo();saving.paid=rec;}   /* saved as จ่ายแล้ว: paid on its date; an edit: today */
   else if(!rec.paid)delete rec.payDate;
   else if(!rec.payDate)rec.payDate=rec.date;}
  return sr.apply(this,arguments);};
 const se=window.saveExp;window.saveExp=function(){saving={paid:null};
  try{const out=se.apply(this,arguments);const x=saving.paid;if(x&&DB.expenses.includes(x)){logAudit('expense',x,'pay',paidNote(x));save();}return out;}
  finally{saving=null;}};
 /* "ค้างจ่าย" → paid now (the legacy payExp, with the voucher and the audit log) */
 window.payExp=function(id){const x=DB.expenses.find(e=>e.id===id);if(!x)return;x.paid=true;x.payDate=iso();if(!x.pvNo)x.pvNo=newNo();
  logAudit('expense',x,'pay',paidNote(x));
  save();renderExp();renderBuyPane();renderHome();toast('บันทึกการจ่ายเงินแล้ว');};

 /* the expense window: its voucher, printed from there */
 const mExp=$i('mExp'),foot=mExp&&mExp.querySelector('footer');let pvBtn=null;
 if(foot){pvBtn=document.createElement('button');pvBtn.type='button';pvBtn.className='btn gh';pvBtn.textContent='พิมพ์ใบสำคัญจ่าย';pvBtn.style.display='none';
  foot.insertBefore(pvBtn,foot.firstChild);pvBtn.addEventListener('click',()=>{const x=editExpId&&DB.expenses.find(e=>e.id===editExpId);if(x&&x.pvNo)print(x.pvNo);});}
 const oe=window.openExp;if(typeof oe==='function')window.openExp=function(id){const r=oe.apply(this,arguments);
  const x=id?DB.expenses.find(e=>e.id===id):null;if(pvBtn)pvBtn.style.display=x&&x.paid&&x.pvNo?'':'none';
  const t=$i('mExpTitle');if(t&&x&&x.paid&&x.pvNo)t.textContent+=' · ใบสำคัญจ่าย '+x.pvNo;return r;};
 /* the expense registers: the voucher number under the document number */
 const mark=tbl=>{const t=$i(tbl);if(!t)return;t.querySelectorAll('tbody tr').forEach(tr=>{if(tr.querySelector('.pkg-pvno'))return;
  const b=[...tr.querySelectorAll('[onclick]')].find(e=>/openExp\('/.test(e.getAttribute('onclick')||''));const id=b&&(b.getAttribute('onclick').match(/openExp\('([^']+)'/)||[])[1];
  const x=id&&DB.expenses.find(e=>e.id===id);if(!x||!x.paid||!x.pvNo)return;
  const cell=[...tr.cells].find(td=>td.textContent.trim()===x.no);if(!cell)return;
  cell.insertAdjacentHTML('beforeend',`<div class="hint pkg-pvno" title="ใบสำคัญจ่าย">${esc(x.pvNo)}</div>`);});};
 [['renderExp','expTbl'],['renderUtil','utilTbl'],['renderOffice','offTbl'],['renderOther','othTbl']].forEach(([fn,tbl])=>{const o=window[fn];if(typeof o!=='function')return;
  window[fn]=function(){const r=o.apply(this,arguments);try{mark(tbl);}catch(e){}return r;};});

 /* ---------- vendor payments: the settle window (47.js asks for these while it is in ชำระเงินเจ้าหนี้) ---------- */
 const X=()=>window.PKG_SETTLE;
 function whtButton(St){return `<button type="button" class="btn sm gh${St.pvOpen?' on':''}" data-pvwht="1" aria-pressed="${!!St.pvOpen}">หัก ณ ที่จ่าย</button>`;}
 const baseOf=x=>r2(grTotals(x.d).base);
 function prune(St,sel){St.wht=St.wht||{};const ids=new Set((sel||[]).map(x=>x.id));let ch=false;
  Object.keys(St.wht).forEach(id=>{if(!ids.has(id)){delete St.wht[id];ch=true;}});return ch;}
 function settleExtra(St,sel){
  if(prune(St,sel))setTimeout(()=>{const x=X();if(x&&x.state()===St){x.reload();x.render();}},0);
  if(!St.pvOpen)return '';
  const rows=(sel||[]).map(x=>{const w=St.wht[x.id]||{},rate=n(w.rate),base=w.baseAmt!=null?w.baseAmt:baseOf(x);
   return `<tr><td class="mono" data-no-translate>${esc(x.no)}</td><td class="r"><input type="number" min="0" step="0.01" inputmode="decimal" data-pvbase="${esc(x.id)}" value="${esc(base)}" aria-label="ฐานก่อน VAT ของ ${esc(x.no)}"></td>
    <td><select data-pvrate="${esc(x.id)}" aria-label="อัตราหัก ณ ที่จ่ายของ ${esc(x.no)}">${RATES.map(([v,t])=>`<option value="${v}"${v===rate?' selected':''}>${t}</option>`).join('')}</select></td>
    <td class="r"><b>${money(n(w.amt))}</b></td></tr>`;}).join('');
  const sum=r2(Object.values(St.wht).reduce((a,w)=>a+n(w.amt),0)),pay=r2((sel||[]).reduce((a,x)=>a+n(x.out),0));
  return `<div class="pkg-sf-stwht" id="pvStWht"><div class="pkg-st-sec">หัก ณ ที่จ่ายผู้ขาย</div>
   <table class="pkg-st-tbl"><thead><tr><th>ใบรับสินค้า</th><th class="r">ฐานก่อน VAT</th><th>อัตรา</th><th class="r">ยอดหัก (บาท)</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="hint">ติ๊กใบรับสินค้าที่จะจ่ายก่อน</td></tr>'}</tbody></table>
   ${sum>0?`<p class="pkg-sf-line pkg-sf-whtsum">หัก ณ ที่จ่าย รวม <b>฿${money(sum)}</b> — ยอดที่ต้องจ่ายผู้ขาย <b>฿${money(pay)}</b></p>`:''}
   <p class="hint">ยอดที่หักไม่ใช่เงินที่จ่าย — ระบบลดยอดคงค้างของบิลนั้นให้ · ออกหนังสือรับรอง (50 ทวิ) ได้ที่ 4.4 ใบหัก ณ ที่จ่าย · เราหักผู้ขาย</p></div>`;
 }
 function setW(id,patch){const x=X();if(!x)return;const St=x.state(),b=x.selList().find(z=>z.id===id);if(!St||!b)return;St.wht=St.wht||{};
  const w=Object.assign({rate:0,baseAmt:baseOf(b)},St.wht[id]||{},patch);w.rate=n(w.rate);w.baseAmt=Math.max(0,r2(w.baseAmt));
  if(!(w.rate>0)){delete St.wht[id];x.reload();return x.render();}
  w.amt=r2(w.baseAmt*w.rate/100);
  if(w.amt>b.raw-0.01){toast('ยอดหัก ณ ที่จ่ายต้องน้อยกว่ายอดคงค้างของบิล');return x.render();}
  St.wht[id]=w;x.reload();x.render();}
 const root=$i('pkgSt');
 if(root){
  root.addEventListener('change',e=>{const t=e.target;if(!X()||!X().state()||X().state().mode!=='ap')return;
   if(t.dataset.pvrate)return setW(t.dataset.pvrate,{rate:n(t.value)});
   if(t.dataset.pvbase)return setW(t.dataset.pvbase,{baseAmt:n(t.value)});
   if(t.dataset.tick||t.dataset.st==='all'||t.dataset.st==='all2')setTimeout(again,0);});
  root.addEventListener('click',e=>{const x=X(),St=x&&x.state();if(!St)return;
   const p=e.target.closest('[data-pvprint]');if(p)return print(p.dataset.pvprint);
   if(St.mode!=='ap')return;
   if(e.target.closest('[data-pvwht]')){St.pvOpen=!St.pvOpen;if(!St.pvOpen)St.wht={};x.reload();return x.render();}
   if(e.target.closest('tr[data-id]')||e.target.closest('[data-act="clear"]'))setTimeout(again,0);});}
 /* the ticks changed (the settle window only refreshes its figures): draw the table again */
 function again(){const x=X(),St=x&&x.state();if(!St||St.mode!=='ap'||!St.pvOpen)return;const el=$i('pvStWht');if(el)el.outerHTML=settleExtra(St,x.selList());}
 /* what settle.js adds to the payment it pushes onto a goods receipt */
 function settleFields(St,x,pvNo){const o={};if(pvNo)o.pvNo=pvNo;const w=St.wht&&St.wht[x.id];
  if(w&&n(w.amt)>0){const v=ven(x.d.vendorId);o.wht={rate:n(w.rate),baseAmt:r2(w.baseAmt),amt:r2(w.amt),form:formFor(v,v&&v.name,v&&v.tax)};}
  return o;}
 function confirmLine(St,list){const s=r2((list||[]).reduce((a,x)=>a+n(St.wht&&St.wht[x.id]&&St.wht[x.id].amt),0));
  return s>0?`<div class="ex">หัก ณ ที่จ่าย ฿${money(s)} — ไม่ใช่เงินที่จ่าย ระบบลดยอดคงค้างของบิลให้</div>`:'';}
 const resultLine=no=>`<div class="d">ใบสำคัญจ่าย <b data-no-translate>${esc(no)}</b> <button type="button" class="btn sm gh" data-pvprint="${esc(no)}">พิมพ์ใบสำคัญจ่าย</button></div>`;
 /* payment history of a goods receipt: the voucher of each payment */
 const h0=window.renderPayHist;if(typeof h0==='function')renderPayHist=window.renderPayHist=function(){const r=h0.apply(this,arguments);
  try{const d=typeof phDoc==='function'?phDoc():null;if(!d||!isPurchase(d))return r;const rows=document.querySelectorAll('#phTbl tbody tr');
   (d.payments||[]).forEach((p,i)=>{if(!p||!p.pvNo||!rows[i]||!rows[i].cells[2])return;
    rows[i].cells[2].insertAdjacentHTML('beforeend',`<div class="hint">ใบสำคัญจ่าย <span data-no-translate>${esc(p.pvNo)}</span>${p.cancelled?'':` <button type="button" class="btn sm gh" data-pvprint="${esc(p.pvNo)}">พิมพ์ใบสำคัญจ่าย</button>`}</div>`);});}catch(e){}
  return r;};
 const PH=$i('mPayHist');if(PH)PH.addEventListener('click',e=>{const p=e.target.closest('[data-pvprint]');if(p)print(p.dataset.pvprint);});

 /* ---------- the printed voucher ---------- */
 function itemsOf(no){
  const exp=(DB.expenses||[]).filter(x=>x&&x.pvNo===no&&x.paid);
  if(exp.length){const x=exp[0],t=expTotals(x),v=venNamed(x.payee),P=window.PKG_PAYROLL?PKG_PAYROLL.voucher(x):null;   /* a payroll period's (task 3.7, 60-payroll.js) */
   if(P)return {date:x.payDate||x.date,payee:P.payee,tax:'',addr:null,method:methodOf(x),by:x.updatedByName||x.createdByName||'',note:x.note||'',lines:P.lines,ded:P.ded,doc:x,kind:'expense'};
   return {date:x.payDate||x.date,payee:x.payee||'-',tax:x.tax||(v&&v.tax)||'',addr:v&&v.addr,method:methodOf(x),by:x.updatedByName||x.createdByName||'',note:x.note||'',
    lines:[{text:x.desc+(x.cat?' ('+x.cat+')':''),ref:[x.no,x.inv].filter(Boolean).join(' · '),amt:t.gross,wht:t.wht,rate:n(x.wht)}],doc:x,kind:'expense'};}
  const ps=[];(DB.purchases||[]).forEach(g=>(g.payments||[]).forEach(p=>{if(p&&p.pvNo===no&&!p.cancelled)ps.push({g,p});}));
  const A=window.PKG_ASSETS;if(A)ps.push(...A.paymentsOf(no));   /* fixed assets bought (task 3.13, 62-assets.js) */
  if(!ps.length)return window.PKG_PAYROLL&&PKG_PAYROLL.remitVoucher?PKG_PAYROLL.remitVoucher(no):null;   /* a payroll period's ภ.ง.ด.1 (task 3.8) */
  const g0=ps[0].g,p0=ps[0].p,v=ven(g0.vendorId);
  return {date:p0.date,payee:(v&&v.name)||'-',tax:(v&&v.tax)||'',addr:v&&v.addr,method:payMethodDetail(p0),by:p0.by||'',note:p0.note||'',
   lines:ps.map(({g,p})=>({text:A&&A.isAsset(g)?A.pvText(g):'ค่าสินค้าตามใบรับสินค้า'+(g.inv?' (ใบกำกับ / ใบส่งของ '+g.inv+')':''),ref:A&&A.isAsset(g)?A.pvRef(g):g.no||'',amt:r2(n(p.amt)+(p.wht?n(p.wht.amt):0)),wht:p.wht?n(p.wht.amt):0,rate:p.wht?n(p.wht.rate):0})),doc:g0,kind:'gr'};
 }
 function sheet(no,I){
  const gross=r2(I.lines.reduce((a,l)=>a+l.amt,0)),wht=r2(I.lines.reduce((a,l)=>a+l.wht,0)),ded=I.ded||[],net=r2(gross-wht-ded.reduce((a,d)=>a+n(d.amt),0)),rates=[...new Set(I.lines.filter(l=>l.wht>0).map(l=>l.rate+'%'))];
  return sheetTop({title:'ใบสำคัญจ่าย',en:'PAYMENT VOUCHER',fields:[['เลขที่',esc(no)],['วันที่จ่าย',thDate(I.date)]]})+`
  <table><tr><td style="vertical-align:top"><span class="lbl">จ่ายให้</span><br><b>${esc(I.payee)}</b>${I.addr?'<br>'+esc(addrLine(I.addr)):''}<br>เลขประจำตัวผู้เสียภาษี ${esc(I.tax||'-')}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th>รายการ</th><th style="width:170px">เลขที่เอกสาร</th><th style="width:100px">จำนวนเงิน</th></tr></thead><tbody>
   ${I.lines.map((l,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(l.text)}</td><td>${esc(l.ref)}</td><td class="num">${money(l.amt)}</td></tr>`).join('')}
   <tr><td colspan="3" style="text-align:right">รวม</td><td class="num">${money(gross)}</td></tr>
   ${wht>0?`<tr><td colspan="3" style="text-align:right">หัก ภาษี ณ ที่จ่าย ${esc(rates.join(', '))}</td><td class="num">${money(wht)}</td></tr>`:''}
   ${ded.map(d=>`<tr><td colspan="3" style="text-align:right">${esc(d.text)}</td><td class="num">${money(d.amt)}</td></tr>`).join('')}
   <tr><td colspan="3" style="text-align:right"><b>จ่ายจริง</b></td><td class="num"><b>${money(net)}</b></td></tr>
   <tr><td colspan="4" style="text-align:center">(${bahtText(net)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">วิธีจ่าย</span><br><span>${esc(I.method||'-')}</span>${I.note?'<br><span class="lbl">หมายเหตุ</span> '+esc(I.note):''}</div>
  <div class="sign"><div><div class="line"></div>( ${esc(I.by||'.................................................')} )<br><span class="lbl">ผู้จ่ายเงิน</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติ</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับเงิน</span></div></div></div>`;
 }
 function print(no){const I=itemsOf(no);if(!I)return;
  logAudit(I.kind,I.doc,'print','ใบสำคัญจ่าย '+no);save();printDocs(sheet(no,I));}

 window.PKG_PV={newNo,whtButton,settleExtra,settleFields,confirmLine,resultLine,print,itemsOf,formFor};
})();
