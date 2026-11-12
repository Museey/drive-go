/* DriveGo new system (accountant round 3, J29; the owner's decision 4 of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): paying
   a month's ภ.พ.30, as ภ.ง.ด.3 / 53 are remitted (69-pnd-remit.js).
   · 08 บัญชี → รายงานภาษี, under the row "ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30) …" of a month the general ledger has closed
     (a month that has ended, or one closed early; 71-ledger.js J29): what its return owes after the input VAT carried
     from earlier months, and "บันทึกนำส่ง ภ.พ.30": the day paid and how, one payment voucher MA-PV… to กรมสรรพากร
     (58-payment-voucher.js prints it from here). The amount starts at what the ledger works out and is what the shop
     paid on the return it filed: input VAT the system carries from data older than the shop's books (assets bought
     years ago, before the opening balances of J32) may be wrong, so the line shows the month's own VAT, the input VAT
     carried in and out, and what is left to pay. Once paid: the voucher and "พิมพ์ใบสำคัญจ่าย"; the owner may cancel
     it, with a reason.
     The owner, or staff with "การเงิน" (doc.fin), as ภ.ง.ด.3 / 53.
     DB.taxPeriods[mo].remit = { done, date, method, pvNo, amt, at, by, byName } (the server lets doc.fin add it to a
     month that has none; only the owner changes it afterwards — server/lib/rules.ts).
   · Money: the payment leaves cash on its day. The trial balance, which shows the year's output and input VAT before
     their monthly closes (03.js), has the year's payments as a debit on 2040 ภาษีมูลค่าเพิ่มค้างชำระ; the general
     ledger posts the closes and the payments themselves. */
(function(){
 if(typeof renderTax!=='function'||typeof finance!=='function'||typeof trialBalance!=='function'||typeof acctM!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
 const METHODS=['เงินโอน','เงินสด','เช็ค'];
 const label=mo=>(typeof TH_M_FULL!=='undefined'?TH_M_FULL[+mo.slice(5,7)-1]:mo.slice(5,7))+' '+(+mo.slice(0,4)+543);
 const nextMonth=mo=>{const y=+mo.slice(0,4),m=+mo.slice(5,7);return m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0');};
 const yr=d=>+String(d||'').slice(0,4);
 const may=()=>!curEmp()||!!can('doc.fin');
 const L=()=>window.PKG_LEDGER||null;
 const per=mo=>(DB.taxPeriods||{})[mo]||null;
 const sent=mo=>{const p=per(mo),r=p&&p.remit;return r&&r.done&&r.pvNo?r:null;};
 const paid=()=>Object.keys(DB.taxPeriods||{}).sort().map(mo=>[mo,sent(mo)]).filter(([,r])=>r);
 const monthOf=no=>{const x=paid().find(([,r])=>r.pvNo===no);return x?x[0]:null;};
 /* the month's own output VAT less its input VAT */
 const own=v=>r2(v.out-v.in);

 /* ---------- the voucher (58-payment-voucher.js asks for a number it does not find) ---------- */
 function voucher(no){const mo=monthOf(no);if(!mo)return null;const r=sent(mo);
  return {date:r.date,payee:'กรมสรรพากร',tax:'',addr:null,method:r.method||'',by:r.byName||'',note:'',ded:[],kind:'taxperiod',
   doc:{id:mo,no:'ภ.พ.30 '+label(mo)},lines:[{text:'ภาษีมูลค่าเพิ่ม (ภ.พ.30) เดือน'+label(mo),ref:'',amt:r2(r.amt),wht:0,rate:0}]};}
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||!!monthOf(no);};

 /* ---------- paying and cancelling ---------- */
 function ask(o){return new Promise(res=>{
  const msg=o.html+'<div class="grid g3" style="margin-top:10px">'
   +`<label class="f"><span>จำนวนเงินที่ชำระ (ตามแบบที่ยื่น)</span><input type="number" step="0.01" min="0" id="vatRemitAmt" value="${o.amt>0?o.amt.toFixed(2):''}"></label>`
   +`<label class="f"><span>วันที่จ่าย</span><input type="date" id="vatRemitDate" value="${iso()}"></label>`
   +`<label class="f"><span>วิธีจ่าย</span><select id="vatRemitMethod">${METHODS.map(m=>`<option>${m}</option>`).join('')}</select></label></div>`;
  askConfirm({title:o.title,msg,yes:o.yes,no:'ยกเลิก',onNo:()=>res(null),onYes:()=>res({amt:r2(($i('vatRemitAmt')||{}).value),date:($i('vatRemitDate')||{}).value||iso(),method:($i('vatRemitMethod')||{}).value||METHODS[0]})});});}
 async function remit(mo){
  if(!may())return toast('บัญชีนี้ไม่มีสิทธิ์บันทึกการนำส่ง');
  const v=L()&&L().vat(mo);if(sent(mo)||!v||!(own(v)>0))return;
  const a=await ask({title:'นำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) เดือน'+label(mo),yes:'บันทึกการนำส่ง',amt:v.due,
   html:`<p>ชำระกรมสรรพากรภายในวันที่ 15 ${label(nextMonth(mo))} · ระบบคำนวณได้ <b>${money(v.due)}</b> บาท</p>`});
  if(!a||sent(mo))return;   /* another device may have paid it meanwhile */
  if(!(a.amt>0))return toast('กรอกจำนวนเงินที่ชำระให้มากกว่า 0');
  const pvNo=window.PKG_PV?PKG_PV.newNo():docNo('PV');
  DB.taxPeriods=DB.taxPeriods||{};const p=DB.taxPeriods[mo]=DB.taxPeriods[mo]||{};
  p.remit={done:true,date:a.date,method:a.method,pvNo,amt:a.amt,at:nowTs(),by:DB.curEmp||'',byName:meName()};
  logAudit('taxperiod',{id:mo,no:'ภ.พ.30 '+label(mo)},'pay','นำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) เดือน'+label(mo)+' '+money(a.amt)+' บาท ('+a.method+') · ใบสำคัญจ่าย '+pvNo);
  save();renderTax();toast('บันทึกนำส่ง ภ.พ.30 เดือน'+label(mo)+' แล้ว · ใบสำคัญจ่าย '+pvNo);
 }
 async function cancel(mo){
  if(curEmp())return toast('เจ้าของร้านเท่านั้นที่ยกเลิกการนำส่งได้');
  const r=sent(mo);if(!r)return;
  const why=await askPromptP({title:'ยกเลิกการนำส่ง '+r.pvNo,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\nเดือนนี้จะกลับเป็นยังไม่นำส่ง แล้วบันทึกนำส่งใหม่ได้',yes:'ยืนยันยกเลิกการนำส่ง',no:'ไม่ยกเลิก',required:true});
  if(why===null)return;if(!String(why).trim())return toast('ต้องระบุเหตุผลที่ยกเลิก');
  per(mo).remit={done:false,date:'',voided:{pvNo:r.pvNo,amt:r.amt,reason:String(why).trim(),at:nowTs(),by:DB.curEmp||'',byName:meName()}};
  logAudit('taxperiod',{id:mo,no:'ภ.พ.30 '+label(mo)},'payvoid','ยกเลิกการนำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) · ใบสำคัญจ่าย '+r.pvNo+' — '+String(why).trim());
  save();renderTax();toast('ยกเลิกการนำส่ง '+r.pvNo+' แล้ว');
 }

 /* ---------- the tax report: a line under the ภ.พ.30 row ---------- */
 function paint(){
  const tb=$i('taxSumTbl')&&$i('taxSumTbl').tBodies[0];if(!tb||!L())return;
  const row=[...tb.rows].find(r=>/^(ภาษีมูลค่าเพิ่มที่ต้องนำส่ง \(ภ\.พ\.30\)|ภาษีซื้อมากกว่าภาษีขาย)/.test((r.cells[0]&&r.cells[0].textContent||'').trim()));
  const mo=acctM(),v=row&&L().vat(mo),r=sent(mo);if(!row||(!v&&!r))return;
  let html='';
  if(r){html=`<span class="chip g">นำส่ง ภ.พ.30 แล้ว ${thDate(r.date)} (${esc(r.method||'-')}) ${money(r.amt)} บาท · ใบสำคัญจ่าย <span data-no-translate>${esc(r.pvNo)}</span></span>`
    +` <button type="button" class="btn sm gh" data-vpp="${esc(r.pvNo)}">พิมพ์ใบสำคัญจ่าย</button>`+(curEmp()?'':` <button type="button" class="btn sm dgr" data-vpx="${esc(mo)}">ยกเลิกการนำส่ง</button>`);}
  else{const c=L().sys('vatClaim'),parts=['ภ.พ.30 เดือน'+label(mo)+': ภาษีขาย − ภาษีซื้อ '+money(own(v))+' บาท'];
   if(v.used>0)parts.push('หักภาษีซื้อที่ยกมา '+money(v.used)+' บาท');
   parts.push('ต้องชำระ '+money(v.due)+' บาท');
   if(v.carried>0)parts.push('ภาษีซื้อเกินยกไปเดือนถัดไป '+money(v.carried)+' บาท ('+c+' '+L().nameOf(c)+')');
   html=`<span class="chip${own(v)>0?' a':''}">${esc(parts.join(' · '))}</span>`
    +(own(v)>0&&may()?` <button type="button" class="btn sm pri" data-vremit="${esc(mo)}">บันทึกนำส่ง ภ.พ.30</button>`:'');}
  if(html)row.insertAdjacentHTML('afterend',`<tr class="pkg-vat-remit"><td colspan="2"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${html}</div></td></tr>`);
 }
 const st=$i('taxSumTbl');
 if(st)st.addEventListener('click',e=>{const b=e.target.closest('[data-vremit],[data-vpp],[data-vpx]');if(!b)return;
  if(b.dataset.vremit)return remit(b.dataset.vremit);
  if(b.dataset.vpp)return window.PKG_PV&&PKG_PV.print(b.dataset.vpp);
  if(b.dataset.vpx)return cancel(b.dataset.vpx);});
 const rt0=renderTax;renderTax=function(){const out=rt0.apply(this,arguments);try{paint();}catch(e){console.error('vat remit',e);}return out;};

 /* ---------- money and the trial balance ---------- */
 const paidBy=y=>r2(paid().filter(([,r])=>yr(r.date)<=y).reduce((t,[,r])=>t+n(r.amt),0));
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;const c=paidBy(y);
  if(c){f.cash=r2(f.cash-c);f.assetsTotal=r2(f.cash+f.ar+f.inv+f.nbv);f.equity=r2(f.assetsTotal-f.liab);
   f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;}
  return f;};
 const tb0=window.trialBalance;
 window.trialBalance=function(y){const out=tb0.apply(this,arguments);
  const d=r2(paid().filter(([,r])=>yr(r.date)===+y).reduce((t,[,r])=>t+n(r.amt),0));if(!d||!L())return out;
  const code=L().sys('vatDue');let w=out.find(x=>x.code===code);
  if(!w){w={code,name:L().nameOf(code),type:L().typeOf(code),debit:0,credit:0};out.push(w);}
  w.debit=r2(w.debit+d);
  return out.sort((a,b)=>a.code.localeCompare(b.code));};

 window.PKG_VAT_REMIT={voucher,remit,cancel,sent};
})();
