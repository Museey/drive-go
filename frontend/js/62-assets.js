/* DriveGo new system (task 3.13, decision R17, the owner's answers 13.1–13.11 of 2026-10-26 and the four asked in this
   task the same day, docs/NOTES.md): fixed assets — depreciation by the day, input VAT once per tax invoice, payables.
   · Depreciation (13.1–13.3, 13.9): straight line, (cost − salvage) ÷ life a year, by the days held in each year ÷ the days
     of that year (365 / 366), counting the acquisition date and not the disposal date; rounded to satang per asset per
     year (half up); the year the life ends takes what is left, so the years add up to cost − salvage. A disposed asset
     (status "sold") needs its disposal date and stops there. Every existing asset is worked out the same way.
     The year's figure stays the whole year's (health, statements); the monthly profit and loss spreads it by the days of
     each month. assetDep keeps its shape ({annual, thisYear, accBefore, accEnd, nbv}), so every screen that reads it
     follows; a cancelled asset is all zeros.
   · One purchase = the lines saved together (`grp`, the first line's id; older records are their own purchase). Its
     input VAT is worked out once on the purchase's total and rounded (R4), in the month of its date (13.7): one row per
     tax invoice in the input tax report, with the vendor's tax ID; the trial balance's 1050 has it (finance().vatBuyPur).
   · Payables (13.5, 13.6, 13.10): the form has the goods receipt's payment terms. "เงินสด / โอนทันที" is paid when saved
     (a payment on the purchase's first line with a voucher MA-PV…, dated on the asset's date); "เครดิต" is owed until paid
     in "ชำระเงินเจ้าหนี้" with the vendor's goods receipts (withholding and its 50 ทวิ / ภ.ง.ด.3 / 53 as for them,
     58-payment-voucher.js, 52.js). A vendor from the register is needed with VAT or on credit. Records saved before this
     task have no terms: paid in cash on their date, as before.
     Head fields: term 'cash' | 'credit', days, due, vendorId; payments [{id, amt, date, method, by, note, pvNo, atOnce, wht,
     cancelled …}], paid, payDate, pvNo (the voucher of a payment made when saved).
   · Deleting (13.4): only a purchase on credit with nothing paid; anything else is cancelled with a reason ("ยกเลิก"):
     the whole purchase, and a payment made when saved is cancelled with it; one paid in "ชำระเงินเจ้าหนี้" must be
     cancelled there first. A purchase with VAT in a closed tax month is neither (as a goods receipt, 56-tax-period.js).
   · Cash: the money paid (finance().cash, the health page, the cash flow) instead of cost × (1 + VAT %) on the asset's
     date; what is owed is in the payables (finance().ap, the trial balance's 2010, 08 เจ้าหนี้, the home page). */
(function(){
 if(typeof assetDep!=='function'||typeof saveAsset!=='function'||typeof renderAssets!=='function'||typeof finance!=='function')return;
 const r2=v=>round2(v),$i=id=>document.getElementById(id);
 const SRC='ทะเบียนสินทรัพย์';
 AUD_ACT.cancel=AUD_ACT.cancel||'ยกเลิกเอกสาร';

 /* ---------- purchases ---------- */
 const all=()=>DB.assets||[];
 const live=a=>!!a&&!a.cancelled;
 const gk=a=>a.grp||a.id;
 const isAsset=d=>!!d&&all().indexOf(d)>=0;
 const linesOf=a=>{const k=gk(a);return all().filter(x=>gk(x)===k);};
 const headOf=a=>linesOf(a)[0]||a;
 const ven=id=>id?(DB.vendors||[]).find(v=>v.id===id)||null:null;
 const venNamed=nm=>{const k=String(nm||'').trim();return k?(DB.vendors||[]).find(v=>String(v.name||'').trim()===k)||null:null;};
 const active=h=>(h.payments||[]).filter(p=>p&&!p.cancelled);
 const isNew=h=>!!h&&(h.term==='cash'||h.term==='credit');   /* saved since this task: it has payment terms */
 function purchase(a){
  const h=headOf(a),ls=linesOf(a).filter(live),base=r2(ls.reduce((s,x)=>s+n(x.cost),0)),vat=vatOf(base,h.vat);
  return {h,lines:ls,base,vat,total:r2(base+vat),cancelled:!ls.length};
 }
 const purchases=()=>{const seen=new Set(),out=[];all().forEach(a=>{const k=gk(a);if(seen.has(k))return;seen.add(k);out.push(purchase(a));});return out;};
 /* what settles it: money paid and tax withheld */
 const settled=h=>r2(active(h).reduce((s,p)=>s+n(p.amt)+(p.wht?n(p.wht.amt):0),0));
 const owedOf=p=>!p.cancelled&&isNew(p.h)&&!p.h.paid?Math.max(0,r2(p.total-settled(p.h))):0;
 /* cash out by the end of a day (all time when none): older records on their date, the others as paid */
 function cashOf(p,upto,from){
  if(p.cancelled)return 0;const ok=d=>(!upto||String(d||'')<=upto)&&(!from||String(d||'')>=from);
  if(!isNew(p.h))return ok(p.h.date)?p.total:0;
  return r2(active(p.h).filter(x=>ok(x.date)).reduce((s,x)=>s+n(x.amt),0));
 }
 /* a line's share of the purchase's VAT (by cost, the last line takes the rest) */
 function lineVat(a){
  if(!live(a))return vatOf(a.cost,a.vat);
  const P=purchase(a);if(P.lines.length<2||!P.base)return P.vat;
  let left=P.vat;const i=P.lines.indexOf(a);
  for(let k=0;k<P.lines.length;k++){const v=k===P.lines.length-1?left:r2(P.vat*n(P.lines[k].cost)/P.base);if(k===i)return v;left=r2(left-v);}
  return 0;
 }

 /* ---------- depreciation by the day ---------- */
 const DAY=864e5;
 const dn=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));return m?Date.UTC(+m[1],+m[2]-1,+m[3])/DAY:NaN;};
 const jan1=y=>Date.UTC(y,0,1)/DAY;
 const daysIn=y=>jan1(y+1)-jan1(y);
 const yearOf=d=>new Date(d*DAY).getUTCFullYear();
 const memo=new Map();
 function sched(a){
  const key=[a.date,a.cost,a.salvage,a.life,a.status,a.out].join('|');const hit=memo.get(key);if(hit)return hit;
  const s=dn(a.date);if(!isFinite(s))return null;
  const cost=n(a.cost),dep=Math.max(0,r2(cost-n(a.salvage))),life=Math.max(1,n(a.life)||5),annual=dep/life;
  const y0=yearOf(s),d0=new Date(s*DAY),L=Math.floor(life);
  let end=Date.UTC(y0+L,d0.getUTCMonth(),d0.getUTCDate())/DAY;if(life>L)end+=Math.round((life-L)*daysIn(y0+L));
  const out=a.status==='sold'&&a.out?dn(a.out):NaN,stop=isFinite(out)&&out<end?Math.max(s,out):end,natural=stop===end;
  const years={};let acc=0;const last=stop>s?yearOf(stop-1):y0-1;
  for(let y=y0;y<=last;y++){
   const from=Math.max(s,jan1(y)),to=Math.min(stop,jan1(y+1)),days=Math.max(0,to-from);
   let amt=natural&&y===last?r2(dep-acc):r2(annual*days/daysIn(y));
   amt=Math.max(0,Math.min(amt,r2(dep-acc)));years[y]={amt,from,to,days};acc=r2(acc+amt);
  }
  const o={annual,dep,y0,last,years};if(memo.size>2000)memo.clear();memo.set(key,o);return o;
 }
 window.assetDep=function(a,y){
  if(!a||a.cancelled)return {annual:0,thisYear:0,accBefore:0,accEnd:0,nbv:0};
  const cost=n(a.cost),sc=sched(a);
  if(!sc)return {annual:0,thisYear:0,accBefore:0,accEnd:0,nbv:cost};
  let accBefore=0;for(let k=sc.y0;k<y&&k<=sc.last;k++)accBefore=r2(accBefore+sc.years[k].amt);
  const thisYear=sc.years[y]?sc.years[y].amt:0,accEnd=r2(accBefore+thisYear);
  return {annual:sc.annual,thisYear,accBefore,accEnd,nbv:r2(cost-accEnd)};
 };
 /* the part of a year's depreciation in one month, by the days held in it */
 function monthDep(a,y,m){
  if(!live(a))return 0;const sc=sched(a),Y=sc&&sc.years[y];if(!Y||!Y.days)return 0;
  const f=Math.max(Y.from,Date.UTC(y,m-1,1)/DAY),t=Math.min(Y.to,Date.UTC(y,m,1)/DAY);
  return t>f?Y.amt*(t-f)/Y.days:0;
 }
 if(typeof monthlyPnL==='function'){const o=window.monthlyPnL;
  window.monthlyPnL=function(y){const out=o.apply(this,arguments);
   try{const old=all().reduce((s,x)=>s+assetDep(x,y).thisYear/12,0);
    (out||[]).forEach(r=>{const d=all().reduce((s,x)=>s+monthDep(x,y,r.m),0)-old;if(d){r.opex+=d;r.np-=d;}});}catch(e){console.error('assets',e);}
   return out;};}

 /* ---------- what the other modules ask of a purchase ---------- */
 const gt0=window.grTotals;window.grTotals=function(g){if(isAsset(g)){const P=purchase(g);return {sub:P.base,disc:0,base:P.base,vat:P.vat,total:P.total};}return gt0.apply(this,arguments);};
 const pa0=paidAmtOf;paidAmtOf=function(d){const v=pa0.apply(this,arguments);return isAsset(d)?v+active(d).reduce((s,p)=>s+(p.wht?n(p.wht.amt):0),0):v;};
 const la0=window.logAudit;window.logAudit=function(kind,doc){if(kind==='gr'&&isAsset(doc))arguments[0]='asset';return la0.apply(this,arguments);};
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||all().some(a=>a.pvNo===no||(a.payments||[]).some(p=>p&&p.pvNo===no));};
 const og0=window.openGRById;if(typeof og0==='function')window.openGRById=function(id){const a=all().find(x=>x.id===id);if(a)return openAsset(id);return og0.apply(this,arguments);};
 const ph0=window.phDoc;if(typeof ph0==='function')window.phDoc=function(){const d=ph0.apply(this,arguments);if(d||PH.mode!=='ap')return d;return all().find(x=>x.id===PH.docId)||d;};

 /* ---------- payables: 08 เจ้าหนี้ and the settle window ---------- */
 const bills=()=>purchases().filter(p=>!p.cancelled&&isNew(p.h)&&p.total>0);
 const po0=ppOutDocs;ppOutDocs=function(){const out=po0.apply(this,arguments);if(PP.mode!=='ap')return out;
  return out.concat(bills().filter(p=>owedOf(p)>.004).map(p=>({d:p.h,who:p.h.vendorId,no:p.h.no||'(ไม่มีเลขที่)',date:p.h.date,due:p.h.due||p.h.date,total:p.total})));};
 /* the register reads DB.purchases: the purchases' first lines join the goods receipts while it draws */
 const ap0=window.renderAcctAP;
 window.renderAcctAP=function(){const real=DB.purchases;DB.purchases=real.concat(bills().map(p=>p.h));try{return ap0.apply(this,arguments);}finally{DB.purchases=real;}};
 /* cancelling a payment of a purchase (its payment history), as for a goods receipt */
 const vp0=window.voidPayment;
 window.voidPayment=async function(mode,docId,payId){
  const d=mode==='ap'?all().find(x=>x.id===docId):null;if(!d)return vp0.apply(this,arguments);
  if(!can('doc.payGr'))return toast('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');
  const p=(d.payments||[]).find(x=>x.id===payId);if(!p||p.cancelled)return;
  const amt=n(p.amt),reason=await askPromptP({title:'ยกเลิกรายการชำระ '+money(amt)+' บาท',text:'ใบ '+(d.no||'')+' — ระบุเหตุผลที่ยกเลิก (เช่น ตัดยอดผิดใบ / ยอดผิด / บันทึกซ้ำ)',yes:'ยกเลิกรายการ',no:'ไม่ยกเลิก'});
  if(reason===null)return;
  const rs=String(reason).trim()||'ไม่ระบุเหตุผล';Object.assign(p,{cancelled:true,cancelDate:iso(),cancelBy:meName(),cancelReason:rs});
  const total=purchase(d).total;if(d.paid&&total-paidAmtOf(d)>0.005){d.paid=false;d.payDate='';}
  logAudit('asset',d,'payvoid','ยกเลิกรายการชำระ '+money(amt)+' บาท (ตัดยอดเมื่อ '+thDate(p.date)+') · เหตุผล: '+rs+' · ใบกลับเป็นค้างชำระ '+money(Math.max(0,total-paidAmtOf(d)))+' บาท');
  save();renderPayHist();renderHome();refresh();
  toast('ยกเลิกรายการชำระ '+money(amt)+' บาทแล้ว — ใบกลับเป็นค้างชำระ ตัดยอดใหม่ได้');
 };
 /* payment history: the voucher of each payment */
 const rh0=window.renderPayHist;
 window.renderPayHist=function(){const r=rh0.apply(this,arguments);
  try{const d=phDoc();if(!isAsset(d))return r;const rows=document.querySelectorAll('#phTbl tbody tr');
   (d.payments||[]).forEach((p,i)=>{if(!p||!p.pvNo||!rows[i]||!rows[i].cells[2])return;
    rows[i].cells[2].insertAdjacentHTML('beforeend',`<div class="hint">ใบสำคัญจ่าย <span data-no-translate>${esc(p.pvNo)}</span>${p.cancelled?'':` <button type="button" class="btn sm gh" data-pvprint="${esc(p.pvNo)}">พิมพ์ใบสำคัญจ่าย</button>`}</div>`);});}catch(e){}
  return r;};
 /* the printed voucher (58-payment-voucher.js asks): the purchase's lines */
 const pvText=h=>{const P=purchase(h);return 'ค่าสินทรัพย์ถาวร '+P.lines.map(x=>x.name).join(' / ')+(h.inv?' (ใบกำกับภาษี '+h.inv+')':'');};
 const pvRef=h=>purchase(h).lines.map(x=>x.no).join(', ');
 function paymentsOf(no){const out=[];all().forEach(a=>(a.payments||[]).forEach(p=>{if(p&&p.pvNo===no&&!p.cancelled)out.push({g:a,p});}));return out;}
 /* withholding from a vendor of an asset (52.js asks): rows of 4.4 · เราหักผู้ขาย and ภ.ง.ด.3 / 53 */
 function whtOut(){const out=[];
  all().forEach(h=>{if(h.cancelled)return;const v=ven(h.vendorId);(h.payments||[]).forEach(p=>{if(!p||p.cancelled||!p.wht||!(n(p.wht.amt)>0))return;
   out.push({id:'FA:'+h.id+':'+p.id,x:p,doc:h,kind:'asset',paid:true,br:p.br||h.br,createdByName:p.by||'',createdAt:'',date:p.date,no:p.pvNo||h.no||'',payee:(v&&v.name)||h.vendor||'',tax:(v&&v.tax)||'',addr:v&&v.addr,desc:'ค่าสินทรัพย์ถาวร '+(h.no||''),base:n(p.wht.baseAmt),rate:n(p.wht.rate),amt:n(p.wht.amt),form:p.whtForm||p.wht.form||'3',cert:p.whtCertNo||'',remit:!!(p.whtRemit&&p.whtRemit.done)});});});
  return out;}

 /* ---------- money in the reports ---------- */
 const upTo=y=>y+'-12-31';
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
  try{const upto=d=>+String(d||'').slice(0,4)<=y;
   const was=all().filter(a=>upto(a.date)).reduce((s,x)=>s+n(x.cost)*(1+n(x.vat)/100),0);   /* what the legacy count took off the cash */
   let cash=0,ap=0,vat=0;
   purchases().forEach(p=>{if(p.cancelled||!upto(p.h.date))return;cash+=cashOf(p,upTo(y));ap+=owedOf(p);if(inYear(p.h.date,y))vat+=p.vat;});
   const dc=r2(was-cash);
   f.vatBuyPur=r2(f.vatBuyPur+vat);f.cashAsset=r2(cash);f.apAsset=r2(ap);
   if(dc||ap){f.cash+=dc;f.ap+=ap;f.assetsTotal+=dc;f.liab+=ap;f.equity=f.assetsTotal-f.liab;
    f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;}
  }catch(e){console.error('assets',e);}
  return f;};
 if(typeof trialBalance==='function'){const o=window.trialBalance;
  window.trialBalance=function(y){const out=o.apply(this,arguments);
   try{const M=DB.map||{},row=code=>{let w=out.find(r=>r.code===code);if(!w){w={code,name:accName(code),type:((DB.coa||[]).find(z=>z.code===code)||{}).type||'',debit:0,credit:0};out.push(w);}return w;};
    /* a cancelled asset is not on the books */
    all().filter(a=>a.cancelled&&+String(a.date).slice(0,4)<=y).forEach(a=>{const w=out.find(r=>r.code===assetAcc(a.cat)[0]);if(w)w.debit=r2(w.debit-n(a.cost));});
    const ap=r2(purchases().filter(p=>+String(p.h.date).slice(0,4)<=y).reduce((s,p)=>s+owedOf(p),0));
    if(ap&&M.ap){const w=row(M.ap);w.credit=r2(w.credit+ap);}
   }catch(e){console.error('assets',e);}
   return out.filter(r=>Math.abs(r.debit)>=0.005||Math.abs(r.credit)>=0.005).sort((a,b)=>a.code.localeCompare(b.code));};}
 const cellAt=(tbl,t,exact)=>{const tb=$i(tbl)&&$i(tbl).tBodies[0];if(!tb)return null;return [...tb.rows].find(r=>r.cells[0]&&(exact?r.cells[0].textContent.trim()===t:r.cells[0].textContent.trim().startsWith(t)))||null;};
 if(typeof renderHealth==='function'){const o=window.renderHealth;
  window.renderHealth=function(){const out=o.apply(this,arguments);
   try{const r=cellAt('cashTbl','ซื้อสินทรัพย์ถาวร',1);if(r&&r.cells[1])r.cells[1].textContent='-'+money(purchases().reduce((s,p)=>s+cashOf(p),0));}catch(e){}
   return out;};}
 if(typeof renderFS==='function'){const o=window.renderFS;
  window.renderFS=function(){const out=o.apply(this,arguments);
   try{const y=acctY(),r=cellAt('cfTbl','เงินสดจ่ายซื้อสินทรัพย์ถาวร',1);if(r&&r.cells[1])r.cells[1].textContent=money(purchases().reduce((s,p)=>s+cashOf(p,upTo(y),y+'-01-01'),0));}catch(e){}
   return out;};}
 /* the register printed: cancelled assets are not in it */
 const liveOnly=fn=>function(){const real=DB.assets;DB.assets=real.filter(live);try{return fn.apply(this,arguments);}finally{DB.assets=real;}};
 if(typeof printAssetReg==='function')window.printAssetReg=liveOnly(window.printAssetReg);

 /* ---------- the input tax report: one row per tax invoice, with the vendor's tax ID ---------- */
 const rt0=window.renderTax;
 window.renderTax=function(){
  const real=DB.assets,P=purchases().filter(p=>!p.cancelled),by={};
  DB.assets=P.map(p=>{const h=p.h,v=ven(h.vendorId);by[h.no]=v;
   return {id:h.id,no:h.no,date:h.date,inv:h.inv,vendor:(v&&v.name)||h.vendor,vendorId:h.vendorId,name:p.lines[0].name,cost:p.base,vat:n(h.vat),br:h.br,payments:h.payments};});   /* payments: ภ.ง.ด.3 / 53 (whtOut) */
  let out;try{out=rt0.apply(this,arguments);}finally{DB.assets=real;}
  try{let ch=false;(TAXBUY_ROWS||[]).forEach(r=>{if(r.src===SRC&&by[r.ref]&&by[r.ref].tax){r.tax=by[r.ref].tax;ch=true;}});if(ch)renderTaxBuyRows();}catch(e){}
  return out;};

 /* ---------- home: the month's input VAT and the assets bought ---------- */
 const parse=t=>n(String(t||'').replace(/[^0-9.\-]/g,''));
 if(typeof renderHome==='function'){const o=window.renderHome;
  window.renderHome=function(){const out=o.apply(this,arguments);
   try{const mo=($i('finMonth')&&$i('finMonth').value)||iso().slice(0,7),ps=purchases().filter(p=>!p.cancelled&&String(p.h.date).slice(0,7)===mo);
    const base=r2(ps.reduce((s,p)=>s+p.base,0)),vat=r2(ps.reduce((s,p)=>s+p.vat,0));
    if(base||vat){const add=(t,v)=>{const r=cellAt('taxTbl',t,1);if(r&&r.cells[1]){r.cells[1].textContent=money(r2(parse(r.cells[1].textContent)+v));return r;}return null;};
     if(isVatReg()){add('ยอดซื้อก่อน VAT',base);add('ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)',vat);
      const s=cellAt('taxTbl','ภาษีขาย (VAT จากใบกำกับภาษีที่ออก)',1),b=cellAt('taxTbl','ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)',1),
       pay=cellAt('taxTbl','ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)',1)||cellAt('taxTbl','เครดิตภาษียกไปงวดถัดไป',1);
      if(s&&b&&pay){const d=r2(parse(s.cells[1].textContent)-parse(b.cells[1].textContent));
       pay.cells[0].innerHTML='<b>'+(d>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)':'เครดิตภาษียกไปงวดถัดไป')+'</b>';pay.cells[1].innerHTML='<b>'+money(Math.abs(d))+'</b>';}}
     else add('ยอดซื้อทั้งงวด',r2(base+vat));}
    const tb=$i('buyTbl')&&$i('buyTbl').tBodies[0],today=iso(),nw=ps.filter(p=>isNew(p.h));
    if(tb&&nw.length){tb.insertAdjacentHTML('beforeend',nw.map(p=>{const h=p.h,v=ven(h.vendorId),late=!h.paid&&daysBetween(h.due||h.date,today)>0;
      return `<tr class="click" onclick="openAsset('${h.id}')"><td class="mono" style="font-size:12px">${esc(h.no)}</td>
       <td>${esc((v&&v.name)||h.vendor||'-')}</td><td class="ctr">${h.term==='credit'?thDate(h.due):'ชำระทันที'}</td><td class="ctr">${late?'<span class="chip r">เกินกำหนด</span>':'—'}</td>
       <td class="num">${h.paid?money(p.total):'-'}</td><td class="num">${h.paid?'-':money(owedOf(p))}</td></tr>`;}).join(''));
     const e=$i('buyEmpty');if(e)e.style.display='none';}
   }catch(e){console.error('assets',e);}
   return out;};}

 /* ---------- the form ---------- */
 const box=$i('mAsset')&&$i('mAsset').querySelector('.permbox');
 if(box&&!$i('yTerm'))box.insertAdjacentHTML('beforeend',`<div class="grid g4" style="margin:10px 0 0" id="yPayRow">
   <label class="f" style="margin-bottom:0"><span>เงื่อนไขชำระ</span><select id="yTerm"><option value="cash">เงินสด / โอนทันที</option><option value="credit">เครดิต</option></select></label>
   <label class="f" style="margin-bottom:0"><span>จำนวนวันเครดิต</span><input type="number" id="yDays" value="30"></label>
   <label class="f" style="margin-bottom:0"><span>ครบกำหนดชำระ</span><input type="text" id="yDue" readonly></label>
   <label class="f" style="margin-bottom:0"><span>สถานะการชำระ</span><input type="text" id="yPaySt" readonly></label></div>`);
 const foot=$i('mAsset')&&$i('mAsset').querySelector('footer');let pvBtn=null;
 if(foot&&!$i('yPvPrint')){pvBtn=document.createElement('button');pvBtn.type='button';pvBtn.id='yPvPrint';pvBtn.className='btn gh';pvBtn.textContent='พิมพ์ใบสำคัญจ่าย';pvBtn.style.display='none';
  foot.insertBefore(pvBtn,foot.firstChild);pvBtn.addEventListener('click',()=>{const a=editAssetId&&all().find(x=>x.id===editAssetId),h=a&&headOf(a);
   const p=h&&active(h).filter(x=>x.pvNo).slice(-1)[0];if(p&&window.PKG_PV)PKG_PV.print(p.pvNo);});}
 let FORM=null;   /* the purchase being edited: its first line, and whether its terms may change */
 function dueText(){const t=$i('yTerm'),d=$i('yDue');if(!t||!d)return;const date=$i('yDate').value||iso();
  $i('yDays').disabled=t.disabled||t.value!=='credit';d.value=t.value==='credit'?thDate(addDays(date,n($i('yDays').value))):'ชำระทันที';}
 function payState(h){if(!h||!isNew(h))return h?'ชำระแล้ว':'';const P=purchase(h);return h.paid?'ชำระแล้ว':(settled(h)>0?'ชำระบางส่วน · คงค้าง '+money(owedOf(P)):'ยังไม่ชำระ');}
 if($i('yTerm')){$i('yTerm').onchange=dueText;$i('yDays').oninput=dueText;$i('yDate').addEventListener('change',dueText);
  $i('yVendor').addEventListener('change',()=>{const v=venNamed($i('yVendor').value);if(!v||$i('yTerm').disabled)return;
   if(v.cash||!n(v.days)){$i('yTerm').value='cash';$i('yDays').value=0;}else{$i('yTerm').value='credit';$i('yDays').value=v.days;}dueText();});}
 const oa0=window.openAsset;
 window.openAsset=function(id){const r=oa0.apply(this,arguments);
  try{const a=id?all().find(x=>x.id===id):null,h=a?headOf(a):null;FORM={h,locked:!!h&&(!isNew(h)||active(h).length>0)};
   const t=$i('yTerm');if(t){t.value=h&&h.term==='credit'?'credit':'cash';$i('yDays').value=h&&h.term==='credit'?n(h.days):30;t.disabled=FORM.locked;$i('yPaySt').value=payState(h);dueText();}
   const pv=h&&active(h).filter(x=>x.pvNo).slice(-1)[0];if(pvBtn)pvBtn.style.display=pv?'':'none';
   if(pv)$i('mAssetTitle').textContent+=' · ใบสำคัญจ่าย '+pv.pvNo;
   if(a&&a.cancelled)$i('mAssetTitle').textContent+=' · ยกเลิกแล้ว';
  }catch(e){console.error('assets',e);}
  return r;};
 /* the footer: VAT of the purchase rounded once */
 const ca0=window.calcAssetLines;
 window.calcAssetLines=function(){const r=ca0.apply(this,arguments);
  try{const c=ALINES.filter(aFilled).reduce((s,x)=>s+n(x.cost),0),f=$i('yItems').tFoot,cell=f&&f.rows[0]&&f.rows[0].cells[2];
   if(cell)cell.textContent='รวม VAT '+money(r2(c+vatOf(c,$i('yVat').value)));}catch(e){}
  return r;};

 function refresh(){['renderAssets','renderBuyPane','renderHome'].forEach(f=>{try{if(typeof window[f]==='function')window[f]();}catch(e){}});
  try{if(typeof acctPane!=='undefined'&&acctPane==='ap')renderAcctAP();}catch(e){}}
 const PAYF=['payments','paid','payDate','pvNo','payMethod'];
 function payNote(h,p){return 'จ่ายเงิน '+money(p.amt)+' บาท (เงินสด / โอนทันที) · ใบสำคัญจ่าย '+p.pvNo;}
 /* a purchase paid when saved: its payment follows the purchase's total and date */
 function settleAtOnce(h,date){
  const P=purchase(h);if(!isNew(h)||h.term!=='cash'||P.cancelled)return null;
  const act=active(h);
  if(!act.length){const p={id:uid(),amt:P.total,date,method:'cash',by:meName(),note:'',atOnce:true,pvNo:h.pvNo||(window.PKG_PV?PKG_PV.newNo():docNo('PV'))};
   h.payments=(h.payments||[]).concat(p);h.pvNo=p.pvNo;h.paid=true;h.payDate=date;h.payMethod='cash';return p;}
  const p=act.length===1&&act[0].atOnce?act[0]:null;
  if(p&&(n(p.amt)!==P.total||p.date!==date)){p.amt=P.total;p.date=date;h.payDate=date;}
  h.paid=P.total-settled(h)<=0.005;if(!h.paid)h.payDate='';
  return null;
 }
 const TAXF=['date','vendor','inv','vat'];
 window.saveAsset=function(){
  if(!can('doc.acctEdit'))return toast('บัญชีนี้ไม่มีสิทธิบันทึกสินทรัพย์');
  if(!isVatReg()&&n($('#yVat').value)>0){$('#yVat').value='0';calcAssetLines();
   toast('กิจการไม่ได้จดทะเบียน VAT — ระบบปรับ VAT เป็น 0 ให้แล้ว · ให้กรอกราคาที่รวมภาษีแล้วเป็นต้นทุนทรัพย์สิน');}
  const old=editAssetId?all().find(x=>x.id===editAssetId):null,H=old?headOf(old):null,legacy=!!H&&!isNew(H);
  if(old&&old.cancelled)return toast('สินทรัพย์นี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  const vname=$('#yVendor').value.trim(),v=venNamed(vname),date=$('#yDate').value||iso();
  const term=legacy?null:(FORM&&FORM.locked&&H?H.term:$i('yTerm').value==='credit'?'credit':'cash'),days=term==='credit'?Math.max(0,n($i('yDays').value)):0;
  const head={date,vendor:vname,vendorId:v?v.id:'',inv:$('#yInv').value.trim(),vat:n($('#yVat').value),method:$('#yMethod').value};
  if(term){head.term=term;head.days=days;head.due=term==='credit'?addDays(date,days):date;}
  const status=$('#yStatus').value,out=$('#yOut').value;
  const lines=ALINES.filter(aFilled);
  if(!lines.length)return toast('กรอกชื่อสินทรัพย์และราคาทุนอย่างน้อย 1 บรรทัด');
  if(lines.some(x=>n(x.cost)<=0))return toast('ราคาทุนของทุกรายการต้องมากกว่า 0');
  if(status==='sold'&&!out)return toast('สถานะจำหน่าย / ตัดออกแล้ว ต้องกรอกวันที่จำหน่าย — ค่าเสื่อมราคาหยุดที่วันนั้น');
  if(out&&out<date)return toast('วันที่จำหน่ายต้องไม่ก่อนวันที่ได้มา');
  /* a closed tax month (56-tax-period.js): nothing that changes the tax of a purchase with VAT dated in it */
  const T=window.PKG_TAX_PERIOD;
  if(T){const changed=!old||TAXF.some(k=>String(old[k]??'')!==String(head[k]??''))||n(old.cost)!==n(lines[0].cost);
   if(changed&&((old&&n(old.vat)>0&&T.locked(old.date))||(head.vat>0&&T.locked(date))))return;}
  const vendorAsIs=legacy&&old.vendor===vname&&n(old.vat)===head.vat;
  if((head.vat>0||term==='credit')&&!v&&!vendorAsIs)return toast('เลือกผู้ขายจากทะเบียนผู้ขาย — สินทรัพย์ที่มี VAT หรือซื้อเครดิตต้องมีผู้ขายในทะเบียน (05 ผู้ขาย)');
  if(!v)delete head.vendorId;
  let paid=null;
  if(old){
   const x=lines[0],rec=Object.assign({},old,head,{name:x.name.trim(),cat:x.cat,cost:n(x.cost),life:Math.max(1,n(x.life)),salvage:n(x.salvage),note:x.note.trim(),status,out});
   if(!rec.vendorId)delete rec.vendorId;
   stampRec(rec,old);
   const i=all().indexOf(old);DB.assets[i]=rec;
   linesOf(rec).forEach(s=>{if(s===rec)return;const j=all().indexOf(s),u=Object.assign({},s,head);if(!head.vendorId)delete u.vendorId;stampRec(u,s);DB.assets[j]=u;});
   logAudit('asset',rec,'save',rec.name+' · ราคาทุน '+money(rec.cost)+' บาท');
   const h=headOf(rec);if(isNew(h))paid=settleAtOnce(h,date);
  }else{
   let grp='';
   lines.forEach(x=>{const id=uid();if(!grp)grp=id;
    const rec=Object.assign({id,no:docNo('FA'),grp},head,{status,out,name:x.name.trim(),cat:x.cat,cost:n(x.cost),
     life:Math.max(1,n(x.life)),salvage:n(x.salvage),note:x.note.trim()});
    stampRec(rec);DB.assets.push(rec);logAudit('asset',rec,'save',rec.name+' · ราคาทุน '+money(rec.cost)+' บาท');});
   paid=settleAtOnce(all().find(a=>a.id===grp),date);
  }
  if(paid){const h=all().find(a=>a.payments&&a.payments.includes(paid));logAudit('asset',h,'pay',payNote(h,paid));}
  save();closeModal('mAsset');renderAssets();renderBuyPane();
  toast(old?'บันทึกการแก้ไขสินทรัพย์แล้ว':('บันทึกสินทรัพย์ '+lines.length+' รายการแล้ว · รวม '+money(lines.reduce((a,x)=>a+n(x.cost),0))+' บาท'));
 };

 /* ---------- delete or cancel (13.4) ---------- */
 const deletable=a=>{const h=headOf(a);return live(a)&&isNew(h)&&!active(h).length&&!h.pvNo;};
 const da0=window.delAsset;
 window.delAsset=function(id){const a=all().find(x=>x.id===id);
  if(a&&can('doc.acctEdit')&&!deletable(a))return toast('สินทรัพย์ที่จ่ายเงินแล้วหรือมีใบสำคัญจ่ายลบไม่ได้ — กด "ยกเลิก" พร้อมเหตุผลแทน');
  return da0.apply(this,arguments);};
 window.cancelAsset=async function(id){
  if(!can('doc.acctEdit'))return toast('บัญชีนี้ไม่มีสิทธิลบสินทรัพย์');
  const a=all().find(x=>x.id===id);if(!a||a.cancelled)return;
  const P=purchase(a),h=P.h;
  if(window.PKG_TAX_PERIOD&&n(h.vat)>0&&PKG_TAX_PERIOD.locked(h.date))return;
  if(active(h).some(p=>!p.atOnce))return toast('ใบนี้บันทึกจ่ายเงินเจ้าหนี้แล้ว ยกเลิกไม่ได้ — ต้องแก้รายการจ่ายที่หน้า 08 · เจ้าหนี้ ก่อน');
  const nos=P.lines.map(x=>x.no).join(', ');
  const why=await askPromptP({title:'ยกเลิกสินทรัพย์ '+nos,text:'เหตุผลที่ยกเลิก — ยกเลิกทั้งใบซื้อ ('+P.lines.length+' รายการ)'+(active(h).length?' และรายการจ่ายเงินพร้อมใบสำคัญจ่าย':''),yes:'ยกเลิกสินทรัพย์',no:'ไม่ยกเลิก',required:true});
  const reason=String(why||'').trim();if(!reason)return;
  const stamp={cancelDate:iso(),cancelBy:meName(),cancelReason:reason};
  active(h).forEach(p=>Object.assign(p,{cancelled:true},stamp));if(h.payments)h.paid=false;
  P.lines.forEach(x=>{Object.assign(x,{cancelled:true},stamp);logAudit('asset',x,'cancel','ยกเลิกสินทรัพย์ '+x.name+' · เหตุผล: '+reason);});
  save();refresh();toast('ยกเลิกสินทรัพย์ '+nos+' แล้ว');
 };

 /* ---------- the registers (03.js renderAssets / renderBuyAssets, with cancelled ones shown and left out of the sums) ---------- */
 const actBtns=a=>a.cancelled?'':`<div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
   <button class="btn sm gh" onclick="openAsset('${a.id}')">แก้ไข</button>
   ${deletable(a)?`<button class="btn sm dgr" onclick="delAsset('${a.id}')">ลบ</button>`:`<button class="btn sm dgr" onclick="cancelAsset('${a.id}')">ยกเลิก</button>`}</div>`;
 const tags=a=>(a.status==='sold'?'<span class="chip r">จำหน่ายแล้ว</span>':'')
  +(a.cancelled?`<span class="chip r">ยกเลิกแล้ว</span><div class="hint">${esc(a.cancelReason||'')}</div>`:'')
  +(!a.cancelled&&isNew(headOf(a))&&!headOf(a).paid?'<span class="chip a">ค้างจ่าย</span>':'');
 window.renderAssets=function(){
  const y=acctY();
  let rows=all().slice().sort((a,b)=>a.date.localeCompare(b.date));
  rows=sortRows('assetTbl',rows);
  $('#assetTbl tbody').innerHTML=rows.map(a=>{const d=assetDep(a,y);
   return `<tr><td class="mono" style="font-size:12px">${esc(a.no)}</td><td class="ctr">${thDate(a.date)}</td>
     <td>${esc(a.name)}${a.vendor?`<div class="hint">${esc(a.vendor)}${a.inv?' · '+esc(a.inv):''}</div>`:''}
       ${tags(a)}</td>
     <td class="mono"><b>${esc(assetAcc(a.cat)[0])}</b><div class="hint mono">${esc(assetAcc(a.cat)[1])}</div></td>
     <td>${esc(a.cat)}</td><td class="num">${money(a.cost)}</td><td class="ctr">${n(a.life)}</td>
     <td class="num">${money(d.annual)}</td><td class="num">${money(d.accEnd)}</td>
     <td class="num"><b>${money(a.status==='sold'?0:d.nbv)}</b></td>
     ${byCell(a)}
     <td class="ctr">${actBtns(a)}</td></tr>`}).join('');
  const L=rows.filter(live);
  const t=L.reduce((acc,a)=>{const d=assetDep(a,y);
   return {cost:acc.cost+n(a.cost),an:acc.an+d.annual,acc:acc.acc+d.accEnd,nbv:acc.nbv+(a.status==='sold'?0:d.nbv),cur:acc.cur+d.thisYear}},
   {cost:0,an:0,acc:0,nbv:0,cur:0});
  $('#assetTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${L.length} รายการ</td><td class="num">${money(t.cost)}</td><td></td>
   <td class="num">${money(t.an)}</td><td class="num">${money(t.acc)}</td><td class="num">${money(t.nbv)}</td><td colspan="2"></td></tr>`;
  $('#assetEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function')paintSort('assetTbl');
  $('#assetCount').textContent=rows.length+' รายการ';
  $('#depTag').textContent='ปีบัญชี '+(y+543)+' · ค่าเสื่อมปีนี้ '+money(t.cur)+' บาท';
  $('#depTbl tbody').innerHTML=L.map(a=>{const d=assetDep(a,y);
   return `<tr><td>${esc(a.name)}</td><td class="ctr">${thDate(a.date)}</td><td class="num">${money(a.cost)}</td>
     <td class="num">${money(d.thisYear)}</td><td class="num">${money(d.accBefore)}</td>
     <td class="num">${money(d.accEnd)}</td><td class="num">${money(d.nbv)}</td></tr>`}).join('')
   ||'<tr><td colspan="7" class="empty">ยังไม่มีสินทรัพย์ถาวรในทะเบียน</td></tr>';
  $('#depTbl tfoot').innerHTML=`<tr><td colspan="2">รวม</td><td class="num">${money(t.cost)}</td><td class="num">${money(t.cur)}</td>
   <td class="num">${money(L.reduce((a,x)=>a+assetDep(x,y).accBefore,0))}</td><td class="num">${money(t.acc)}</td>
   <td class="num">${money(t.nbv)}</td></tr>`;
 };
 window.renderBuyAssets=function(){
  const rows=all().slice().sort((a,b)=>b.date.localeCompare(a.date));
  $('#basTbl tbody').innerHTML=rows.map(a=>`<tr>
   <td class="mono" style="font-size:12px">${esc(a.no)}</td><td class="ctr">${thDate(a.date)}</td>
   <td>${esc(a.name)}${a.note?`<div class="hint">${esc(a.note)}</div>`:''}${tags(a)}</td>
   <td class="mono"><b>${esc(assetAcc(a.cat)[0])}</b></td><td>${esc(a.cat)}</td>
   <td>${esc(a.vendor||'-')}${a.inv?`<div class="hint mono">${esc(a.inv)}</div>`:''}</td>
   <td class="num">${money(a.cost)}</td><td class="num">${money(r2(n(a.cost)+lineVat(a)))}</td>
   <td class="ctr">${actBtns(a)}</td></tr>`).join('');
  const L=rows.filter(live),c=L.reduce((a,x)=>a+n(x.cost),0),g=L.reduce((a,x)=>a+n(x.cost)+lineVat(x),0);
  $('#basTbl tfoot').innerHTML=`<tr><td colspan="6">รวม ${L.length} รายการ</td>
   <td class="num"><b>${money(c)}</b></td><td class="num"><b>${money(g)}</b></td><td></td></tr>`;
  $('#basEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function')mkCards('basTbl');
  $('#basCount').textContent=rows.length+' รายการ';
 };

 window.PKG_ASSETS={purchase,purchases,headOf,isAsset,lineVat,owedOf,cashOf,monthDep,paymentsOf,pvText,pvRef,whtOut,deletable};
})();
