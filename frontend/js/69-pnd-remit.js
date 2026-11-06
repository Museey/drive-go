/* DriveGo new system (owner's decision of 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 1): remitting ภ.ง.ด.3 / ภ.ง.ด.53, as
   ภ.ง.ด.1 is remitted (60-payroll.js), and the tax withheld from vendors in the trial balance.
   · 08 บัญชี → รายงานภาษี, under each form's total of the month (#whtOutTbl): "บันทึกนำส่ง ภ.ง.ด.3" asks the day paid and
     how, and records the remittance on every row of that form and month not remitted yet — one payment voucher MA-PV…
     to กรมสรรพากร (58-payment-voucher.js prints it from here); rows remitted show it, with "พิมพ์ใบสำคัญจ่าย".
     The owner, or staff with "การเงิน" (doc.fin) as for the 4.4 tick. The owner may cancel a remittance, with a reason.
     A row's whtRemit = { done, date, method, pvNo, mo, form, at, by, byName } (the field the 4.4 tick writes; a tick has no
     pvNo: it marks the row only, nothing is paid here) — on an expense, a goods receipt's payment or an asset's payment.
   · Money: what is withheld stays in cash until it is remitted (an expense is paid net already; a goods receipt paid in
     full was counted at its whole total, so its withholding comes back), and the remittance leaves on its day.
   · Trial balance 2050 ภาษีหัก ณ ที่จ่ายค้างนำส่ง: besides the year's expenses (03.js) and the salaries' tax not remitted
     (60-payroll.js), what was withheld in the year from goods receipts paid in full and from assets, less what was
     withheld in the year and remitted with a voucher by its end (LEDGER-POSTING J11, J12, J17). */
(function(){
 const WO=window.PKG_WHT_OUT;
 if(!WO||typeof renderTax!=='function'||typeof finance!=='function'||typeof trialBalance!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
 const METHODS=['เงินโอน','เงินสด','เช็ค'];
 const MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 const label=mo=>MONTHS[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
 const nextMonth=mo=>{const y=+mo.slice(0,4),m=+mo.slice(5,7);return m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0');};
 const yr=d=>+String(d||'').slice(0,4);
 const may=()=>!curEmp()||!!can('doc.fin');
 /* remitted with a voucher (a 4.4 tick alone has no pvNo) */
 const sent=v=>{const r=v&&v.x&&v.x.whtRemit;return r&&r.done&&r.pvNo?r:null;};
 const ticked=v=>!!(v&&v.x&&v.x.whtRemit&&v.x.whtRemit.done);
 const rowsOf=no=>WO.all().filter(v=>{const r=sent(v);return r&&r.pvNo===no;});

 /* ---------- the voucher (58-payment-voucher.js asks for a number it does not find) ---------- */
 function voucher(no){
  const rows=rowsOf(no);if(!rows.length)return null;const r=sent(rows[0]),mo=r.mo||String(rows[0].date).slice(0,7);
  const forms=['3','53'].filter(f=>rows.some(v=>v.form===f));
  return {date:r.date,payee:'กรมสรรพากร',tax:'',addr:null,method:r.method||'',by:r.byName||'',note:'',ded:[],kind:'taxperiod',doc:{id:mo,no:'ภ.ง.ด.'+forms.join(' / ')+' '+label(mo)},
   lines:forms.map(f=>{const rs=rows.filter(v=>v.form===f);
    return {text:'ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.'+f+') เดือน'+label(mo)+' ('+rs.length+' ราย)',ref:rs.map(v=>v.no).filter(Boolean).join(', '),amt:r2(rs.reduce((a,v)=>a+v.amt,0)),wht:0,rate:0};})};
 }
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||WO.all().some(v=>{const r=sent(v);return r&&r.pvNo===no;});};

 /* ---------- recording and cancelling a remittance ---------- */
 function ask(o){return new Promise(res=>{
  const msg=o.html+'<div class="grid g3" style="margin-top:10px">'
   +`<label class="f"><span>วันที่จ่าย</span><input type="date" id="pndRemitDate" value="${iso()}"></label>`
   +`<label class="f"><span>วิธีจ่าย</span><select id="pndRemitMethod">${METHODS.map(m=>`<option>${m}</option>`).join('')}</select></label></div>`;
  askConfirm({title:o.title,msg,yes:o.yes,no:'ยกเลิก',onNo:()=>res(null),onYes:()=>res({date:($i('pndRemitDate')||{}).value||iso(),method:($i('pndRemitMethod')||{}).value||METHODS[0]})});});}
 async function remit(form){
  if(!may())return toast('บัญชีนี้ไม่มีสิทธิ์บันทึกการนำส่ง');
  const mo=acctM(),rows=WO.month(mo).filter(v=>v.form===form&&!ticked(v));if(!rows.length)return;
  const T=r2(rows.reduce((a,v)=>a+v.amt,0));
  const a=await ask({title:'นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.'+form+') เดือน'+label(mo),yes:'บันทึกการนำส่ง',
   html:`<p>นำส่งกรมสรรพากร <b>${money(T)}</b> บาท (${rows.length} ราย) ภายในวันที่ 7 ${label(nextMonth(mo))}</p>`});
  if(!a)return;
  const now=WO.month(mo).filter(v=>v.form===form&&!ticked(v));if(!now.length)return;   /* another device may have remitted meanwhile */
  const pvNo=window.PKG_PV?PKG_PV.newNo():docNo('PV'),st={done:true,date:a.date,method:a.method,pvNo,mo,form,at:nowTs(),by:DB.curEmp||'',byName:meName()};
  const head='นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.'+form+') เดือน'+label(mo);
  now.forEach(v=>{v.x.whtRemit=Object.assign({},st);logAudit(v.kind,v.doc,'pay',head+' '+money(v.amt)+' บาท ('+a.method+') · ใบสำคัญจ่าย '+pvNo);});
  save();renderTax();toast('บันทึกนำส่ง ภ.ง.ด.'+form+' เดือน'+label(mo)+' แล้ว · ใบสำคัญจ่าย '+pvNo);
 }
 async function cancel(no){
  if(curEmp())return toast('เจ้าของร้านเท่านั้นที่ยกเลิกการนำส่งได้');
  const rows=rowsOf(no);if(!rows.length)return;
  const why=await askPromptP({title:'ยกเลิกการนำส่ง '+no,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\nรายการของใบสำคัญจ่ายนี้จะกลับเป็นยังไม่นำส่ง แล้วบันทึกนำส่งใหม่ได้',yes:'ยืนยันยกเลิกการนำส่ง',no:'ไม่ยกเลิก',required:true});
  if(why===null)return;if(!String(why).trim())return toast('ต้องระบุเหตุผลที่ยกเลิก');
  rows.forEach(v=>{v.x.whtRemit={done:false,date:''};logAudit(v.kind,v.doc,'payvoid','ยกเลิกการนำส่งภาษีหัก ณ ที่จ่าย · ใบสำคัญจ่าย '+no+' — '+String(why).trim());});
  save();renderTax();toast('ยกเลิกการนำส่ง '+no+' แล้ว');
 }

 /* ---------- the tax report: a line under each form's total ---------- */
 function paint(){
  const tf=$i('whtOutTbl')&&$i('whtOutTbl').tFoot;if(!tf)return;const mo=acctM(),rows=WO.month(mo);
  [...tf.rows].forEach(tr=>{const m=/^ภ\.ง\.ด\.(3|53) ·/.exec((tr.cells[0]&&tr.cells[0].textContent||'').trim());if(!m)return;
   const f=m[1],rs=rows.filter(v=>v.form===f),open=rs.filter(v=>!ticked(v)),T=r2(open.reduce((a,v)=>a+v.amt,0));
   const pvs=[...new Set(rs.map(v=>sent(v)).filter(Boolean).map(r=>r.pvNo))];
   const done=pvs.map(no=>{const r=sent(rowsOf(no)[0]);
    return `<span class="chip g">นำส่ง ภ.ง.ด.${f} แล้ว ${thDate(r.date)} (${esc(r.method||'-')}) · ใบสำคัญจ่าย <span data-no-translate>${esc(no)}</span></span>`
     +` <button type="button" class="btn sm gh" data-pvp="${esc(no)}">พิมพ์ใบสำคัญจ่าย</button>`+(curEmp()?'':` <button type="button" class="btn sm dgr" data-pvx="${esc(no)}">ยกเลิกการนำส่ง</button>`);});
   const todo=open.length?`<span class="chip a">ภ.ง.ด.${f} ค้างนำส่ง ${money(T)} บาท</span>`+(may()?` <button type="button" class="btn sm pri" data-remit="${f}">บันทึกนำส่ง ภ.ง.ด.${f}</button>`:''):'';
   tr.insertAdjacentHTML('afterend',`<tr class="pnd-remit"><td colspan="5"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${done.join(' ')}${todo}</div></td></tr>`);});
 }
 const tbl=$i('whtOutTbl');
 if(tbl)tbl.addEventListener('click',e=>{const b=e.target.closest('[data-remit],[data-pvp],[data-pvx]');if(!b)return;
  if(b.dataset.remit)return remit(b.dataset.remit);
  if(b.dataset.pvp)return window.PKG_PV&&PKG_PV.print(b.dataset.pvp);
  if(b.dataset.pvx)return cancel(b.dataset.pvx);});
 const rt0=renderTax;renderTax=function(){const out=rt0.apply(this,arguments);paint();return out;};

 /* ---------- money and the trial balance ---------- */
 const grFull=v=>v.kind==='gr'&&v.doc&&v.doc.paid&&!v.doc.cancelled;
 function cashAdj(y){let c=0;WO.all().forEach(v=>{if(!v.paid)return;
   if(grFull(v)&&yr(v.doc.date)<=y)c+=v.amt;   /* counted in its whole total when the goods receipt was paid (03.js finance) */
   const r=sent(v);if(r&&yr(r.date)<=y)c-=v.amt;});return r2(c);}
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;const c=cashAdj(y);
  if(c){f.cash=r2(f.cash+c);f.assetsTotal=r2(f.cash+f.ar+f.inv+f.nbv);f.equity=r2(f.assetsTotal-f.liab);
   f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;}
  return f;};
 const tb0=window.trialBalance;
 window.trialBalance=function(y){const out=tb0.apply(this,arguments),code=(DB.map||{}).whtOut;if(!code)return out;
  let d=0;WO.all().forEach(v=>{if(!v.paid||yr(v.date)!==+y)return;
   if(v.kind==='asset'||grFull(v))d+=v.amt;
   const r=sent(v);if(r&&String(r.date)<=y+'-12-31')d-=v.amt;});
  d=r2(d);if(!d)return out;
  let w=out.find(r=>r.code===code);if(!w){w={code,name:accName(code),type:((DB.coa||[]).find(z=>z.code===code)||{}).type||'',debit:0,credit:0};out.push(w);}
  w.credit=r2(w.credit+d);if(w.credit<0){w.debit=r2(w.debit-w.credit);w.credit=0;}
  return out.filter(r=>Math.abs(r.debit)>=0.005||Math.abs(r.credit)>=0.005).sort((a,b)=>a.code.localeCompare(b.code));};

 window.PKG_PND_REMIT={voucher,remit,cancel,sent};
})();
