/* DriveGo new system (accountant round 3, J28; the owner's decisions of 2026-11-11 and 2026-11-12,
   docs/ACCOUNTANT-ANSWERS.md): other income and other expenses of 08 → เงินลงทุน / เงินสด ("รายรับอื่น ๆ",
   "รายจ่ายอื่น ๆ") are in the profit and loss; the legacy app moved only cash.
   · The form asks the account (other income: the chart's revenue accounts, 4030 รายได้อื่น first; other expenses: its
     expense accounts, 6190 ค่าใช้จ่ายเบ็ดเตล็ด first) and, for a shop registered for VAT, "มี VAT (รวมอยู่ในจำนวนเงิน)":
     - other income with VAT: the buyer from the customer register, and a full tax invoice / receipt MA-TX… issued on
       saving (as an asset sold, 70-asset-sale.js); its VAT is in the sales tax report of its month. Once issued the
       entry cannot be changed or removed.
     - other expenses with VAT: the vendor's tax invoice number (needed), its name and tax ID; the VAT is in the purchase
       tax report of its month, as an expense of 06.
     An entry with VAT in a closed tax month is locked (56-tax-period.js; the server checks it, rules.ts TAX_FIELDS).
     x.acc, x.rate, x.base, x.vat (the VAT, inside x.amt), x.taxNo, x.custId, x.buyer, x.buyerTax, x.inv, x.payee, x.payeeTax
   · The books: the amount less its VAT on the account (an entry from before has 4030 / 6190); the profit and loss and the
     statements (a row of their own before the net profit), the monthly profit, the trial balance (and its VAT in 2030 /
     1050), and the general ledger (71-ledger.js). Cash is as before: the whole amount. */
(function(){
 if(typeof saveCap!=='function'||typeof openCap!=='function'||typeof finance!=='function'||typeof trialBalance!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
 const OTHER=['other_in','other_out'],isOther=x=>!!x&&OTHER.includes(x.type);
 const L=()=>window.PKG_LEDGER||null;
 const accIn=()=>(DB.map&&DB.map.revOther)||'4030',accOut=()=>expAcc('ค่าใช้จ่ายเบ็ดเตล็ด');
 const accOf=x=>x.acc||(x.type==='other_in'?accIn():accOut());
 const baseOf=x=>n(x.vat)>0?r2(x.base):r2(x.amt);
 const nameOf=code=>(L()?L().nameOf(code):accName(code))||'';
 const T=()=>window.PKG_TAX_PERIOD;

 /* ---------- the form ---------- */
 const body=$i('mCap')&&$i('mCap').querySelector('.body');
 if(body&&!$i('zOther')){body.insertAdjacentHTML('beforeend',`<div id="zOther" style="display:none;margin-top:10px">
  <label class="f"><span>บัญชี</span><select id="zAcc" aria-label="บัญชี"></select></label>
  <label class="row" id="zVatRow" style="gap:6px;margin:2px 0 8px"><input type="checkbox" id="zVat"><span>มี VAT (รวมอยู่ในจำนวนเงิน)</span></label>
  <div id="zVatIn" style="display:none"><label class="f"><span>ผู้ซื้อ (ลูกค้าในทะเบียน)</span><input id="zBuyer" list="zBuyerList"><datalist id="zBuyerList"></datalist></label>
   <p class="hint" style="margin:0">ออกใบกำกับภาษีเต็มรูป / ใบเสร็จรับเงินเมื่อบันทึก แล้วแก้ไขหรือลบรายการไม่ได้</p></div>
  <div id="zVatOut" style="display:none"><label class="f"><span>เลขที่ใบกำกับภาษีของผู้ขาย *</span><input id="zInv"></label>
   <div class="grid g2"><label class="f"><span>ผู้ขาย</span><input id="zPayee"></label>
   <label class="f"><span>เลขประจำตัวผู้เสียภาษีของผู้ขาย</span><input id="zPayeeTax"></label></div></div>
  <p class="hint" id="zTaxNo" style="display:none;margin:4px 0 0"></p></div>`);}
 function accOptions(type,cur){const want=type==='other_in'?'revenue':'expense';
  const list=(DB.coa||[]).filter(a=>a.type===want).sort((a,b)=>a.code.localeCompare(b.code));
  const first=type==='other_in'?accIn():accOut();
  const ordered=list.filter(a=>a.code===first).concat(list.filter(a=>a.code!==first));
  if(cur&&!ordered.some(a=>a.code===cur))ordered.unshift({code:cur,name:nameOf(cur)});
  return ordered.map(a=>`<option value="${esc(a.code)}"${a.code===(cur||first)?' selected':''}>${esc(a.code+' '+a.name)}</option>`).join('');}
 function show(){const box=$i('zOther');if(!box)return;const type=($i('zType')||{}).value,on=OTHER.includes(type);
  box.style.display=on?'':'none';if(!on)return;
  if($i('zAcc').dataset.type!==type){$i('zAcc').innerHTML=accOptions(type,'');$i('zAcc').dataset.type=type;}
  $i('zVatRow').style.display=isVatReg()?'':'none';
  const vat=isVatReg()&&$i('zVat').checked;
  $i('zVatIn').style.display=vat&&type==='other_in'?'':'none';$i('zVatOut').style.display=vat&&type==='other_out'?'':'none';}
 if($i('zType'))$i('zType').addEventListener('change',show);
 if($i('zVat'))$i('zVat').addEventListener('change',show);
 const oc0=window.openCap;window.openCap=function(id){const r=oc0.apply(this,arguments);
  try{const x=id?(DB.capital||[]).find(c=>c.id===id):null,type=($i('zType')||{}).value;
   $i('zBuyerList').innerHTML=(DB.cust||[]).map(c=>`<option value="${esc(custName(c)||'')}"></option>`).join('');
   $i('zAcc').innerHTML=accOptions(OTHER.includes(type)?type:'other_in',x&&x.acc);$i('zAcc').dataset.type=OTHER.includes(type)?type:'other_in';
   $i('zVat').checked=!!(x&&n(x.vat)>0);$i('zBuyer').value=(x&&x.buyer)||'';
   $i('zInv').value=(x&&x.inv)||'';$i('zPayee').value=(x&&x.payee)||'';$i('zPayeeTax').value=(x&&x.payeeTax)||'';
   const tn=$i('zTaxNo');tn.style.display=x&&x.taxNo?'':'none';tn.innerHTML=x&&x.taxNo?`ออกใบกำกับภาษี <a href="#" data-otinv="${esc(x.id)}" data-no-translate>${esc(x.taxNo)}</a> แล้ว — แก้ไขหรือลบรายการไม่ได้`:'';
   show();}catch(e){console.error('other income',e);}
  return r;};

 /* the VAT inside an amount: a base whose VAT makes the amount */
 function split(amt,rate){let base=r2(amt*100/(100+rate));for(const d of [0,0.01,-0.01])if(r2(base+d+vatOf(base+d,rate))===r2(amt))return {base:r2(base+d),vat:vatOf(r2(base+d),rate)};
  return {base,vat:r2(amt-base)};}
 const sv0=window.saveCap;window.saveCap=function(){
  const id=typeof editCapId!=='undefined'?editCapId:null,old=id?(DB.capital||[]).find(c=>c.id===id):null;
  if(!can('doc.acctEdit'))return sv0.apply(this,arguments);
  if(old&&old.taxNo)return toast('รายการนี้ออกใบกำกับภาษี '+old.taxNo+' แล้ว — แก้ไขหรือลบไม่ได้');
  const type=$i('zType').value,date=$i('zDate').value||iso(),amt=r2($i('zAmt').value),other=OTHER.includes(type);
  const vatOn=other&&isVatReg()&&$i('zVat').checked,rate=vatOn?vatRateOn(date):0;
  let extra={};
  if(other){extra.acc=$i('zAcc').value||(type==='other_in'?accIn():accOut());
   if(vatOn&&rate>0&&amt>0){const s=split(amt,rate);extra=Object.assign(extra,{rate,base:s.base,vat:s.vat});
    if(type==='other_in'){const nm=String($i('zBuyer').value||'').trim(),c=(DB.cust||[]).find(x=>String(custName(x)||'').trim()===nm)||null;
     if(!c)return toast('เลือกผู้ซื้อจากทะเบียนลูกค้า — รายรับที่มี VAT ต้องออกใบกำกับภาษีที่มีชื่อ ที่อยู่ และเลขประจำตัวผู้เสียภาษีของผู้ซื้อ');
     Object.assign(extra,{custId:c.id,buyer:custName(c),buyerTax:c.tax||''});}
    else{const inv=String($i('zInv').value||'').trim();if(!inv)return toast('ใส่เลขที่ใบกำกับภาษีของผู้ขายก่อน');
     Object.assign(extra,{inv,payee:String($i('zPayee').value||'').trim(),payeeTax:String($i('zPayeeTax').value||'').trim()});}}}
  const P=T();if(P&&P.locked&&((extra.vat>0&&P.locked(date))||(old&&n(old.vat)>0&&P.locked(old.date))))return;
  const before=new Set((DB.capital||[]).map(c=>c.id));
  const r=sv0.apply(this,arguments);
  const rec=(DB.capital||[]).find(c=>id?c.id===id:!before.has(c.id));if(!rec)return r;
  ['acc','rate','base','vat','custId','buyer','buyerTax','inv','payee','payeeTax'].forEach(k=>{delete rec[k];});
  Object.assign(rec,extra);
  let issued='';if(rec.type==='other_in'&&n(rec.vat)>0&&!rec.taxNo){rec.taxNo=issued=docNo('TX');
   logAudit('capital',{id:rec.id,no:rec.taxNo},'save','ออกใบกำกับภาษี '+rec.taxNo+' · รายรับอื่น ๆ '+money(rec.amt)+' บาท ให้ '+rec.buyer);}
  save();renderCap();if(issued)printInv(rec);
  return r;};
 const dc0=window.delCap;window.delCap=async function(id){const x=(DB.capital||[]).find(c=>c.id===id);
  if(x&&x.taxNo)return toast('รายการนี้ออกใบกำกับภาษี '+x.taxNo+' แล้ว — แก้ไขหรือลบไม่ได้');
  const P=T();if(x&&n(x.vat)>0&&P&&P.locked&&P.locked(x.date))return;
  return dc0.apply(this,arguments);};

 /* ---------- the tax invoice / receipt (other income with VAT) ---------- */
 function sheet(x,copy){const c=(DB.cust||[]).find(k=>k.id===x.custId);
  return sheetTop({title:'ใบกำกับภาษี / ใบเสร็จรับเงิน',en:'TAX INVOICE / RECEIPT',copy,fields:[['เลขที่',esc(x.taxNo)],['วันที่',thDate(x.date)]]})+`
  <table><tr><td style="vertical-align:top"><span class="lbl">ชื่อผู้ซื้อ / ผู้รับบริการ</span><br><b>${esc(x.buyer)}</b><br>${esc(addrLine(c&&c.addr))}<br>
   เลขประจำตัวผู้เสียภาษี ${esc(x.buyerTax||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:110px">จำนวนเงิน</th></tr></thead><tbody>
   <tr><td style="text-align:center">1</td><td>${esc(x.note||nameOf(accOf(x)))}</td><td style="text-align:center">1</td><td class="num">${money(x.base)}</td></tr>
   <tr><td colspan="3" style="text-align:right">มูลค่าสินค้า / บริการ</td><td class="num">${money(x.base)}</td></tr>
   <tr><td colspan="3" style="text-align:right">ภาษีมูลค่าเพิ่ม ${x.rate}%</td><td class="num">${money(x.vat)}</td></tr>
   <tr><td colspan="3" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(x.amt)}</b></td></tr>
   <tr><td colspan="4" style="text-align:center">(${bahtText(x.amt)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">รับชำระโดย</span><br><span>เงินสด วันที่ ${thDate(x.date)}</span></div>
  <div class="sign"><div><div class="line"></div>( ${esc(x.createdByName||x.updatedByName||'.................................................')} )<br><span class="lbl">ผู้รับเงิน</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ซื้อ</span></div></div></div>`;}
 function printInv(x){if(!x||!x.taxNo)return;logAudit('capital',{id:x.id,no:x.taxNo},'print','ใบกำกับภาษี '+x.taxNo+' 2 แผ่น');save();printDocs(sheet(x,'ต้นฉบับ')+sheet(x,'สำเนา'));}
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||(DB.capital||[]).some(x=>x&&x.taxNo===no);};
 document.addEventListener('click',e=>{const p=e.target.closest('[data-otinv]');if(!p)return;e.preventDefault();printInv((DB.capital||[]).find(x=>x.id===p.dataset.otinv));});

 /* ---------- the register: the account and the VAT under the entry's details ---------- */
 const rc0=window.renderCap;window.renderCap=function(){const r=rc0.apply(this,arguments);
  try{const tb=$i('capTbl')&&$i('capTbl').tBodies[0];if(tb)[...tb.rows].forEach(tr=>{const b=tr.querySelector('button[onclick^="openCap("]');if(!b)return;
   const id=(/openCap\('([^']+)'\)/.exec(b.getAttribute('onclick'))||[])[1],x=(DB.capital||[]).find(c=>c.id===id);
   if(!x||!isOther(x)||!(x.acc||n(x.vat)>0)||!tr.cells[2]||tr.cells[2].querySelector('.pkg-oth'))return;
   const a=accOf(x),bits=[esc(a+' '+nameOf(a))];
   if(n(x.vat)>0)bits.push('VAT '+x.rate+'% '+money(x.vat)+' บาท');
   if(x.taxNo)bits.push(`ใบกำกับภาษี <a href="#" data-otinv="${esc(x.id)}" data-no-translate>${esc(x.taxNo)}</a> · ${esc(x.buyer||'')}`);
   if(x.inv)bits.push('ใบกำกับภาษีผู้ขาย '+esc(x.inv)+(x.payee?' · '+esc(x.payee):''));
   tr.cells[2].insertAdjacentHTML('beforeend',`<div class="hint pkg-oth">${bits.join(' · ')}</div>`);});}catch(e){console.error('other income',e);}
  return r;};

 /* ---------- the tax reports of the month ---------- */
 const rt0=renderTax;renderTax=function(){
  const mo=acctM(),rows=(DB.capital||[]).filter(x=>isOther(x)&&n(x.vat)>0&&String(x.date).slice(0,7)===mo);
  if(!rows.length)return rt0.apply(this,arguments);
  const sales=rows.filter(x=>x.type==='other_in'&&x.taxNo).map(x=>({id:'CP'+x.id,no:x.taxNo,taxNo:x.taxNo,date:x.date,custId:x.custId,br:'',items:[],disc:0,vat:x.rate,
   wht:0,whtBase:'labor',cancelled:false,paid:true,pay:{},payments:[],taxDocs:[{no:x.taxNo,date:x.date,cancelled:false,base:x.base,vat:x.vat,gross:x.amt}]}));
  const buys=rows.filter(x=>x.type==='other_out').map(x=>({id:'CP'+x.id,no:'',date:x.date,inv:x.inv||'',payee:x.payee||x.note||'',tax:x.payeeTax||'',
   desc:x.note||'',cat:'',base:x.base,vat:x.rate,wht:0,paid:true,payDate:x.date}));
  const rr=DB.receipts,ee=DB.expenses;DB.receipts=rr.concat(sales);DB.expenses=ee.concat(buys);
  try{return rt0.apply(this,arguments);}finally{DB.receipts=rr;DB.expenses=ee;}};

 /* ---------- the books ---------- */
 function sums(pred){const o={in:0,out:0,vin:0,vout:0,acc:new Map()};
  (DB.capital||[]).forEach(x=>{if(!isOther(x)||!pred(x.date))return;const b=baseOf(x),a=accOf(x),k=x.type==='other_in'?'in':'out';
   o[k]+=b;if(x.type==='other_in')o.vin+=n(x.vat);else o.vout+=n(x.vat);
   const m=o.acc.get(a)||{in:0,out:0};m[k]+=b;o.acc.set(a,m);});
  o.in=r2(o.in);o.out=r2(o.out);o.vin=r2(o.vin);o.vout=r2(o.vout);return o;}
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;const o=sums(d=>inYear(d,y));
  if(!o.in&&!o.out&&!o.vin&&!o.vout)return f;
  f.capOtherIn=o.in;f.capOtherOut=o.out;f.np+=o.in-o.out;f.vatSale+=o.vin;f.vatBuyExp+=o.vout;
  f.npm=f.revenue?f.np/f.revenue*100:0;
  f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;
  return f;};
 if(typeof monthlyPnL==='function'){const mp0=window.monthlyPnL;
  window.monthlyPnL=function(){const out=mp0.apply(this,arguments);
   (out||[]).forEach(m=>{const o=sums(d=>String(d||'').slice(0,7)===m.key);if(o.in||o.out)m.np+=o.in-o.out;});return out;};}
 const tb0=window.trialBalance;
 window.trialBalance=function(y){const out=tb0.apply(this,arguments),o=sums(d=>inYear(d,y));if(!o.acc.size)return out;
  o.acc.forEach((v,code)=>{let w=out.find(r=>r.code===code);
   if(!w){w={code,name:nameOf(code),type:L()?L().typeOf(code):(((DB.coa||[]).find(z=>z.code===code)||{}).type||''),debit:0,credit:0};out.push(w);}
   w.credit=r2(w.credit+v.in);w.debit=r2(w.debit+v.out);});
  return out.filter(r=>Math.abs(r.debit)>=0.005||Math.abs(r.credit)>=0.005).sort((a,b)=>a.code.localeCompare(b.code));};
 /* 08 งบการเงิน: a row per account before the net profit */
 if(typeof renderFS==='function'){const fs0=window.renderFS;
  window.renderFS=function(){const out=fs0.apply(this,arguments);
   try{const tb=$i('plTbl')&&$i('plTbl').tBodies[0];if(!tb||tb.querySelector('.pkg-fs-oth'))return out;const o=sums(d=>inYear(d,acctY()));if(!o.acc.size)return out;
    const np=[...tb.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim()==='กำไร (ขาดทุน) สุทธิก่อนภาษี');if(!np)return out;
    [...o.acc].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([code,v])=>{
     const add=(t,val)=>{const tr=document.createElement('tr');tr.className='pkg-fs-oth';tr.innerHTML=`<td style="width:62%">${esc(t)}</td><td class="num">${money(val)}</td>`;np.before(tr);};
     if(v.in)add(code+' บวก '+nameOf(code)+' (รายรับอื่น ๆ)',v.in);if(v.out)add(code+' หัก '+nameOf(code)+' (รายจ่ายอื่น ๆ)',v.out);});
   }catch(e){console.error('other income',e);}
   return out;};}

 window.PKG_OTHER_INCOME={printInv,sums,split};
})();
