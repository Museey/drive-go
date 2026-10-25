/* DriveGo new system (task 3.3, decisions F2, T2–T5): closing a month's VAT — "ปิดงวดภาษี".
   · 08 → รายงานภาษี: the owner, or staff with the right "ปิดงวดภาษี" (doc.taxClose, 14.js), closes a month that has
     ended; only the owner opens it again, with a reason. Both are written to the audit log.
   · A closed month locks every document that carries VAT and is dated in it, sales and purchases alike: cancelling,
     revising or adjusting a sale, cancelling a tax invoice, and recording, changing, cancelling or deleting a goods
     receipt, an expense or an asset with VAT (the checks sit where each action starts: here, and in 15.js / 16.js).
     Money received and paid is still recorded as usual.
   · A full tax invoice can still be issued for a sale of a closed month (T2-ก): after a warning, dated on the sale;
     the closed month's sales tax report keeps the number it was filed under and notes the late invoice (`late`).
   DB.taxPeriods = { 'YYYY-MM': { closed, date, at, by, byName, hist: [{ act: 'close' | 'open', date, at, by, byName, reason }] } }
   (created at the first close: shops that never close a month have no such key) */
(function(){
 if(typeof renderTax!=='function')return;
 const ym=d=>String(d||'').slice(0,7);
 const label=mo=>TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
 const per=mo=>(DB.taxPeriods||{})[mo]||null;
 const closed=d=>{const p=per(ym(d));return !!(p&&p.closed);};
 const hasVat=(...xs)=>xs.some(x=>x&&n(x.vat)>0);
 const say=d=>{toast('เดือน '+label(ym(d))+' ปิดงวดภาษีแล้ว ใช้ใบลดหนี้แทน');return true;};
 /* true, after the message, when one of the dates is in a closed month */
 function locked(...ds){const d=ds.find(x=>x&&closed(x));return d?say(d):false;}
 /* a document carrying VAT that is dated in a closed month */
 const lockedDoc=x=>!!x&&hasVat(x)&&locked(x.date);
 const owner=()=>!curEmp();
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const pick=(o,ks)=>ks.map(k=>o?o[k]:undefined);

 AUD_KIND.taxperiod='งวดภาษี';AUD_ACT.close='ปิดงวดภาษี';AUD_ACT.reopen='เปิดงวดภาษีกลับ';
 const stamp=()=>({date:iso(),at:new Date().toISOString(),by:DB.curEmp||'',byName:meName()});
 async function closeMonth(mo){
  if(!owner()&&!can('doc.taxClose'))return;
  if(closed(mo)||mo>=iso().slice(0,7))return;
  if(!await askP({title:'ปิดงวดภาษีเดือน '+label(mo)+'?',text:'หลังปิดงวด เอกสารที่มี VAT ของเดือนนี้แก้ได้ด้วยใบลดหนี้เท่านั้น',yes:'ปิดงวดภาษี',no:'ยังไม่ปิด'}))return;
  DB.taxPeriods=DB.taxPeriods||{};const p=DB.taxPeriods[mo]=DB.taxPeriods[mo]||{hist:[]},s=stamp();
  Object.assign(p,{closed:true},s);p.hist.push(Object.assign({act:'close'},s));
  logAudit('taxperiod',{id:mo,no:mo},'close','ปิดงวดภาษีเดือน '+label(mo));
  save();renderTax();toast('ปิดงวดภาษีเดือน '+label(mo)+' แล้ว');
 }
 async function openMonth(mo){
  if(!owner()||!closed(mo))return;
  const why=await askPromptP({title:'เปิดงวดภาษีเดือน '+label(mo)+' กลับ',text:'เหตุผลที่เปิดงวดกลับ',yes:'เปิดงวดกลับ',no:'ยกเลิก',required:true});
  const reason=String(why||'').trim();if(!reason)return;
  const p=DB.taxPeriods[mo];p.closed=false;p.hist.push(Object.assign({act:'open',reason},stamp()));
  logAudit('taxperiod',{id:mo,no:mo},'reopen','เปิดงวดภาษีเดือน '+label(mo)+' กลับ · เหตุผล: '+reason);
  save();renderTax();toast('เปิดงวดภาษีเดือน '+label(mo)+' กลับแล้ว');
 }

 /* the report's header: the month's state and its button */
 const box=document.createElement('span');box.id='taxPeriodBox';box.style.cssText='display:inline-flex;gap:8px;align-items:center;margin-left:10px';
 const head=document.querySelector('#a-tax > .panel > header');if(head)head.insertBefore(box,head.querySelector('.spacer'));
 function paint(){
  const mo=acctM(),p=per(mo);
  box.innerHTML=p&&p.closed
   ?'<span class="chip g">ปิดงวดภาษีแล้ว</span><span class="hint">'+thDate(p.date)+' · '+esc(p.byName||'')+'</span>'
     +(owner()?'<button class="btn gh sm" data-tp="open">เปิดงวดกลับ</button>':'')
   :(mo<iso().slice(0,7)&&(owner()||can('doc.taxClose'))?'<button class="btn pri sm" data-tp="close">ปิดงวดภาษี</button>':'');
 }
 box.addEventListener('click',e=>{const a=e.target.closest('[data-tp]');if(!a)return;(a.dataset.tp==='close'?closeMonth:openMonth)(acctM());});
 const rt0=renderTax;renderTax=function(){const out=rt0.apply(this,arguments);paint();return out;};

 /* ---------- the locks ---------- */
 /* nothing is checked until the shop has closed a month */
 const anyClosed=()=>Object.values(DB.taxPeriods||{}).some(p=>p&&p.closed);
 const wrap=(name,check)=>{const f=window[name];if(typeof f!=='function')return;
  window[name]=function(){if(anyClosed()&&check.apply(this,arguments))return;return f.apply(this,arguments);};};
 /* sales: a receipt (legacy) or a sale's record, its cancellation and its tax invoices */
 wrap('cancelReceiptDoc',id=>lockedDoc(DB.receipts.find(x=>x.id===id)));
 wrap('toggleTaxCancel',id=>{const r=DB.receipts.find(x=>x.id===id),d=r&&(r.taxDocs||[]).slice(-1)[0];
  return !!r&&!r.cancelled&&!!d&&!d.cancelled&&locked(r.date,d.date);});
 wrap('handleIssueTaxToggle',()=>typeof R!=='undefined'&&!!R&&!!R.no&&lockedDoc(DB.receipts.find(x=>x.id===R.id)));
 const RCPT=['date','disc','vat','items','cancelled'];
 wrap('saveReceipt',()=>{
  if(typeof R==='undefined'||!R)return false;
  const old=DB.receipts.find(x=>x.id===R.id),
   now={date:$('#rDate').value||iso(),disc:n($('#rDisc').value),vat:n($('#rVat').value),items:rItemsClean(R),cancelled:R.cancelled};
  if(old&&same(pick(old,RCPT),pick(now,RCPT)))return false;   /* money only */
  return (hasVat(old)&&!!old&&locked(old.date))||(hasVat(now)&&locked(now.date));
 });
 /* purchases: goods receipts, expenses and assets with VAT (input tax) */
 const GR=['date','vendorId','inv','disc','vat','items'];
 wrap('saveGR',()=>{
  if(typeof G==='undefined'||!G)return false;
  const old=DB.purchases.find(x=>x.id===G.id),
   now={date:$('#grDate').value||iso(),vendorId:$('#grVendor').value,inv:$('#grInv').value,disc:n($('#grDisc').value),vat:n($('#grVat').value),items:grItemsClean(G)};
  if(old&&same(pick(old,GR),pick(now,GR)))return false;   /* paid / note only */
  return (hasVat(old)&&!!old&&locked(old.date))||(hasVat(now)&&locked(now.date));
 });
 wrap('cancelGR',id=>lockedDoc(DB.purchases.find(x=>x.id===id)));
 const EXP=['date','payee','tax','inv','base','vat'];
 wrap('saveExp',()=>{
  const old=editExpId?DB.expenses.find(x=>x.id===editExpId):null;
  const now={date:$('#xDate').value||iso(),payee:$('#xPayee').value.trim(),tax:$('#xTax').value.trim(),inv:$('#xInv').value.trim(),
   base:n($('#xBase').value),vat:n($('#xVat').value)};
  if(old&&same(pick(old,EXP),pick(now,EXP)))return false;   /* paid / method / note only */
  return (hasVat(old)&&!!old&&locked(old.date))||(hasVat(now)&&locked(now.date));
 });
 wrap('delExp',id=>lockedDoc(DB.expenses.find(x=>x.id===id)));
 wrap('saveAsset',()=>{
  const old=editAssetId?DB.assets.find(x=>x.id===editAssetId):null,line=(ALINES||[])[0]||{};
  const now={date:$('#yDate').value||iso(),vat:n($('#yVat').value),cost:n(line.cost),inv:$('#yInv').value.trim(),vendor:$('#yVendor').value.trim()};
  if(old&&same(pick(old,['date','vat','inv','vendor']).concat(n(old.cost)),pick(now,['date','vat','inv','vendor']).concat(now.cost)))return false;
  return (hasVat(old)&&!!old&&locked(old.date))||(hasVat(now)&&locked(now.date));
 });
 wrap('delAsset',id=>lockedDoc(DB.assets.find(x=>x.id===id)));

 /* T2-ก: a full tax invoice for a sale of a closed month */
 async function lateOk(r){
  if(!r||!closed(r.date))return true;
  return await askP({title:'เดือน '+label(ym(r.date))+' ปิดงวดภาษีแล้ว',
   text:'ใบกำกับภาษีเต็มรูปลงวันที่ขาย '+thDate(r.date)+' รายงานภาษีขายของเดือนนั้นยังแสดงเลขเดิม '+r.no+' และยอดภาษีไม่เปลี่ยน',
   yes:'ออกใบกำกับภาษี',no:'ไม่ออก'});
 }
 function markLate(r){const d=(r.taxDocs||[]).slice(-1)[0];if(d&&!d.cancelled&&closed(r.date))d.late=true;}

 window.PKG_TAX_PERIOD={closed,locked,lockedDoc,label,lateOk,markLate,closeMonth,openMonth};
})();
