/* ระบบขายแบบใหม่ · phase 1 — model, ledger, migration, switch (SALE-FLOW-TECH.md §2–§4, SALE-FLOW-PLAN.md; 2026-10-12).
   · The SA record in DB.stockCuts is the SALE (items, price, discount, VAT, expected withholding `wht`, adjustments
     `adj[]`, `credit`). Every sale has exactly ONE "ledger record" (LED) in DB.receipts: `pkgSale:1`, `saleId`, dated on
     the SALE day, rebuilt from the SA by sync(). Every report that reads DB.receipts therefore counts each sale once, on
     the day the goods left, without being edited.
   · Money lives in ONE place: LED.payments[] (the record shape settle.js writes + reNo / src / wht / time / created*).
     A receipt (ใบเสร็จรับเงิน) = one payment record with its own `reNo`. One settlement may share one receipt number over
     several sales: the records carry the same `payId` + `reNo` and `reShare:true` (PKG_SALE.receiptOf(no) lists the bills).
     `date` = the day the money came in (may be back-dated, never future); `createdAt / createdBy / createdByName` = who
     recorded it and when.
   · `paid / paidDate` on the LED and `st / paid / pay` on the SA are DERIVED by touch() — no function sets them by hand;
     the original writers (voidPayment, markPaid, settleInvoiceDoc, cancelInvoiceDoc, delInvoiceDoc, confirmSettleBilling,
     cancelBilling, settle.js doSave → afterPay) are followed by touch().
   · receiptTotals() is wrapped: adjustments are part of the totals; for a LED `whtAmt` = the withholding CONFIRMED in its
     payments (not rate × base), so the original `receiptTotals(r).net − paidAmtOf(r)` is the remainder everywhere.
   · Switch: DB.pkgSaleFlow.on — OFF by default. Off = nothing here changes any behaviour (the wrappers pass through:
     no record has pkgSale / adj). It is switched on only by apply() (page 11.5, sale-report.js) and off by revert().
   · Migration: classify() → operations · plan() = classify + a simulation on copies (never mutates) · apply(plan) executes,
     keeps what it changed in `migr` on each record, sets the flag, saves · revert() restores from `migr` (only while no
     new-flow write has happened: DB.pkgSaleFlow.used) · verify() lists broken invariants.
   Not here (later phases): the sale window buttons, the payment step (sale-pay.js), the registers / prints (sale-docs.js),
   revision of a sale (counter sales only — owner 12 Oct). */
(()=>{
 if(typeof receiptTotals!=='function'||typeof paidAmtOf!=='function'||typeof docNoTaken!=='function'||!window.PKG_STOCK_CUT)return;
 const SC=window.PKG_STOCK_CUT,EPS=0.005;
 const $i=id=>document.getElementById(id);
 const r2=v=>Math.round(n(v)*100)/100;
 const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
 const call=f=>{if(typeof window[f]==='function')try{window[f]();}catch(e){}};
 const FLAG=()=>(typeof DB==='object'&&DB&&DB.pkgSaleFlow)||null;
 const on=()=>{const f=FLAG();return !!(f&&f.on);};
 const used=()=>{const f=FLAG();if(f&&f.on)f.used=(f.used||0)+1;};
 const BR=()=>window.PKG_BRANCH;
 const inBr=(d,fn)=>{const b=BR();if(!b)return fn();const id=b.brOf(d);return b.get(id)&&id!==b.ctx()?b.within(id,fn):fn();};
 const cuts=()=>(DB&&Array.isArray(DB.stockCuts))?DB.stockCuts:[];
 const active=L=>(L&&L.payments||[]).filter(p=>p&&!p.cancelled);
 const isCo=c=>{const cu=c&&c.custId&&typeof findCust==='function'?findCust(c.custId):null;return !!(cu&&cu.type==='company');};
 const canon=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,key)=>{o[key]=x[key];return o;},{}):x);
 const filled=it=>it&&(String(it.code||'').trim()||String(it.name||'').trim()||n(it.price));
 const today=()=>iso();
 if(typeof AUD_ACT==='object')Object.assign(AUD_ACT,{saleadj:'ปรับเพิ่ม / ลดยอดใบตัดสต็อก',saleflow:'เปิด / ปิดระบบขายแบบใหม่'});
 if(typeof AUD_CLS==='object')Object.assign(AUD_CLS,{saleadj:'a',saleflow:'a'});

 /* ---------- lookups (cached on the array identity + length: branch-report swaps DB.receipts during scoped renders) ---------- */
 let VER=0,NV=0,IX=null,CX=null,NOS=null;
 const bump=()=>{VER++;NV++;};
 function index(){
  const arr=DB.receipts||[];if(IX&&IX.arr===arr&&IX.len===arr.length&&IX.v===VER)return IX;
  const byId=new Map(),bySale=new Map();
  for(const r of arr)if(r&&r.pkgSale){byId.set(r.id,r);if(r.saleId)bySale.set(r.saleId,r);}
  return IX={arr,len:arr.length,v:VER,byId,bySale};
 }
 function cutIx(){const arr=cuts();if(CX&&CX.arr===arr&&CX.len===arr.length)return CX.map;const map=new Map();for(const c of arr)if(c)map.set(c.id,c);CX={arr,len:arr.length,map};return map;}
 const led=c=>{if(!c)return null;const ix=index();return (c.ledId&&ix.byId.get(c.ledId))||ix.bySale.get(c.id)||null;};
 const ledById=id=>index().byId.get(id)||null;
 const saleOf=L=>L&&L.saleId?cutIx().get(L.saleId)||null:null;
 const pair=x=>{if(typeof x==='string')x=cutIx().get(x)||ledById(x);if(!x)return [null,null];return x.pkgSale?[saleOf(x),x]:[x,led(x)];};

 /* ---------- totals: adjustments + withholding confirmed in the payments ---------- */
 const totO=receiptTotals;
 receiptTotals=function(r){
  const t=totO.apply(this,arguments);
  if(!r||(!r.pkgSale&&!(r.adj&&r.adj.length)))return t;                 /* every legacy receipt: the original object, untouched */
  if(r.adj&&r.adj.length){
   let g=0;for(const a of r.adj){const v=n(a&&a.amt);if(v>0)g+=a.type==='down'?-v:v;}
   /* DriveGo new system (task 3.3, R4): the base and the VAT stay in satang */
   if(g){const k=n(r.vat)>0?g/(1+n(r.vat)/100):g;t.adjGross=g;t.adjBase=k;t.base=round2(t.base+k);t.gross=round2(t.gross+g);t.vat=round2(t.gross-t.base);}
  }
  if(r.pkgSale){
   const e=r.whtExp||{},b=e.base==='all'?t.base:Math.min(n(t.labor),t.base);
   t.whtExp=Math.min(Math.max(0,t.base),Math.max(0,b*n(e.rate)/100));
   let w=0,wb=0;for(const p of r.payments||[])if(p&&!p.cancelled&&p.wht){w+=n(p.wht.amt);wb+=n(p.wht.baseAmt);}
   t.whtAmt=w;t.whtBaseAmt=round2(wb);   /* DriveGo new system (task 3.4, X1): the base the customer withheld on */
  }else{t.whtBaseAmt=r.whtBase==='labor'?t.labor:t.base;t.whtAmt=t.whtBaseAmt*n(r.wht)/100;}
  t.net=t.gross-t.whtAmt;
  if(typeof cardFee==='function'&&typeof cardBaseAmt==='function'){t.fee=cardFee(r,t.net);t.cardBase=cardBaseAmt(r,t.net);t.cardChargeAmt=Math.round((t.cardBase+t.fee)*100)/100;}
  t.payAmt=Math.round((t.net+n(t.fee))*100)/100;
  return t;
 };
 /* ---------- numbers: a receipt number (payments[].reNo) and an invoice number (inv.no) are taken too ---------- */
 function numbers(){
  const arr=DB.receipts||[];if(NOS&&NOS.arr===arr&&NOS.len===arr.length&&NOS.v===NV)return NOS.set;
  const set=new Set();for(const r of arr){if(!r||!r.pkgSale)continue;if(r.inv&&r.inv.no)set.add(r.inv.no);for(const d of r.invVoid||[])if(d&&d.no)set.add(d.no);for(const p of r.payments||[])if(p&&p.reNo)set.add(p.reNo);}
  NOS={arr,len:arr.length,v:NV,set};return set;
 }
 const takenO=docNoTaken;docNoTaken=function(no){return takenO.apply(this,arguments)||numbers().has(no);};

 /* ---------- state ---------- */
 const tot=c=>SC.tot(c);
 function stat(c){
  const L=led(c);
  if(!L){const t=tot(c),paid=!!c.paid;   /* a sale outside the new flow (switch off / not migrated yet): today's meaning */
   return {k:c.cancelled?'cancel':c.superseded?'revised':paid?'paid':(c.pay&&c.pay.method==='credit')?'credit':'wait',got:paid?r2(t.gross):0,wht:0,rem:paid?0:r2(t.gross),n:0,last:'',total:t.gross,led:null};}
  return statOf(c,L);
 }
 function statOf(c,L){
  const t=receiptTotals(L),ap=active(L),got=paidAmtOf(L),wht=n(t.whtAmt),rem=t.gross-wht-got;
  const k=c.cancelled?'cancel':c.superseded?'revised':rem<=EPS?'paid':c.credit?'credit':(got+wht>EPS)?'part':'wait';
  return {k,got:r2(got),wht:r2(wht),rem:Math.max(0,r2(rem)),n:ap.length,last:ap.reduce((a,p)=>String(p.date||'')>a?String(p.date):a,''),total:t.gross,whtExp:n(t.whtExp),led:L};
 }
 const state=c=>stat(c).k;
 const STATE={wait:'รอชำระ',part:'ชำระบางส่วน',paid:'ชำระแล้ว',credit:'เงินเชื่อ',cancel:'ยกเลิกแล้ว',revised:'มีฉบับแก้ไข'};

 /* ---------- expected withholding (prints on the invoice only; juristic customers only) ---------- */
 const RATES=[0,1,2,3,5];
 function whtDefault(c){const lab=(c.items||[]).some(it=>it&&it.type==='labor'&&n(it.qty)*n(it.price)>0);return {rate:isCo(c)&&lab?3:0,base:'labor',auto:true};}
 function normWht(w,c){if(!w)return whtDefault(c);const rate=isCo(c)&&RATES.includes(n(w.rate))?n(w.rate):0;return {rate,base:w.base==='all'?'all':'labor',auto:!!w.auto};}

 /* ---------- payment records ---------- */
 const OLDK={cash:'cash',trans:'trans',card:'card',check:'chk',chk:'chk'},NEWK={cash:'cash',trans:'trans',card:'card',chk:'check',check:'check'};
 /* the one-method fields of the original (largest share), as settle.js fills them */
 function mainOf(methods,transLines){
  if(!methods.length)return {method:'',bank:'',ref:'',card4:'',chkDate:''};
  const m=methods.reduce((a,x)=>n(x.amt)>n(a.amt)+.004?x:a,methods[0]),big=(transLines||[]).reduce((a,x)=>!a||n(x.amt)>n(a.amt)+.004?x:a,null);
  return {method:m.k,bank:m.k==='trans'?(big?big.bank:''):(m.bank||''),ref:m.k==='trans'?(big?big.ref:''):(m.ref||''),card4:m.k==='card'?(m.card4||''):'',chkDate:m.k==='check'?(m.chkDate||''):''};
 }
 /* a payment record from the old shapes: a receipt's `pay` (cash / trans / card / chk flags + amounts), the pay object the
    old 4.4 panel wrote on the SA, or {method, amount, bank} */
 function legacyPay(pay,amt,o){
  pay=pay||{};o=o||{};amt=r2(amt);
  let ks=['cash','trans','card','chk'].filter(k=>pay[k]===true);
  if(!ks.length&&pay.method)ks=(Array.isArray(pay.methods)&&pay.methods.length?pay.methods:[pay.method]).filter(k=>k!=='credit'&&NEWK[k]);
  let parts=ks.map(k=>({k,amt:r2(pay[k+'Amt'])}));
  if(parts.length===1)parts[0].amt=amt;
  else if(parts.length>1){const sum=r2(parts.reduce((a,x)=>a+x.amt,0));
   if(Math.abs(sum-amt)>0.01){const big=parts.reduce((a,x)=>x.amt>a.amt?x:a,parts[0]),v=r2(big.amt+amt-sum);if(v>0)big.amt=v;else parts=[{k:big.k,amt}];}
   parts=parts.filter(x=>x.amt>0);}
  let tl=[];const tp=parts.find(x=>x.k==='trans');
  if(tp){const src=Array.isArray(pay.transLines)?pay.transLines.filter(l=>l&&n(l.amt)>0):[];
   tl=src.length&&Math.abs(r2(src.reduce((a,l)=>a+n(l.amt),0))-tp.amt)<=0.01?src.map((l,i)=>({no:i+1,bank:String(l.bank||''),amt:r2(l.amt),when:String(l.when||''),ref:String(l.ref||''),slip:false}))
    :[{no:1,bank:String(pay.bank||''),amt:tp.amt,when:String(pay.when||''),ref:'',slip:false}];}
  const methods=parts.map(x=>{
   if(x.k==='trans')return {k:'trans',amt:x.amt,lines:tl.length};
   if(x.k==='card')return {k:'card',amt:x.amt,bank:String(pay.cardBank||''),card4:String(pay.card4||''),ref:String(pay.cardRef||''),type:String(pay.cardType||''),pct:n(pay.cardPct),fee:r2(pay.cardFee)};
   if(x.k==='chk')return {k:'check',amt:x.amt,bank:String(pay.chkBank||''),ref:String(pay.chkNo||''),chkDate:String(pay.chkDate||'')};
   const m={k:'cash',amt:x.amt};if(pay.cashGiven!==undefined&&pay.cashGiven!==''){m.given=n(pay.cashGiven);m.change=Math.max(0,r2(n(pay.cashGiven)-x.amt));m.changeMode=pay.changeMode||'';}return m;});
  return Object.assign({id:o.id||uid(),date:o.date||today(),time:o.time||'',amt},mainOf(methods,tl),{by:o.by||String(pay.by||''),note:o.note||String(pay.note||''),
   methods,transLines:tl,payId:o.payId||'',payTotal:amt,payBills:1,slipCount:0,br:o.br||'',reNo:o.reNo||'',src:o.src||'legacy'});
 }
 const whtRec=(rate,base,baseAmt,amt,got)=>({rate:n(rate),base:base==='labor'?'labor':'all',baseAmt:r2(baseAmt),amt:r2(amt),got:got===undefined?null:got,gotDate:'',img:false});
 /* a shared receipt number: the payments of ONE settlement (same payId, reShare) carry the same reNo */
 function sharedNo(payId){for(const r of DB.receipts||[])if(r&&r.pkgSale)for(const q of r.payments||[])if(q&&q.payId===payId&&q.reShare&&q.reNo)return q.reNo;return '';}
 function stampPay(p,L,c){
  if(!p.src)p.src=p.billingId?'billing':p.invoiceId?'invoice':'settle';
  if(!p.createdAt){p.createdAt=nowTs();p.createdBy=DB.curEmp||'';p.createdByName=meName();}
  if(!p.time)p.time=new Date().toTimeString().slice(0,5);
  if(!p.br){const b=BR();if(b)p.br=b.brOf(c||L);}
  let no=p.reShare&&p.payId?sharedNo(p.payId):'';
  if(!no)no=inBr(p.reShare&&p.br?{br:p.br}:(c||L),()=>docNo('RE'));
  p.reNo=no;NV++;
 }
 /* every bill of one receipt number (a shared receipt lists several sales) */
 function receiptOf(no){
  const parts=[];if(!no)return null;
  for(const r of DB.receipts||[])if(r&&r.pkgSale)for(const p of r.payments||[])if(p&&p.reNo===no)parts.push({led:r,sale:saleOf(r),pay:p});
  if(!parts.length)return null;const f=parts[0].pay;
  return {reNo:no,payId:f.payId||'',shared:parts.length>1||!!f.reShare,date:f.date,by:f.by,createdAt:f.createdAt||'',createdByName:f.createdByName||'',
   parts,total:r2(parts.filter(x=>!x.pay.cancelled).reduce((a,x)=>a+n(x.pay.amt),0)),wht:r2(parts.filter(x=>!x.pay.cancelled).reduce((a,x)=>a+n(x.pay.wht&&x.pay.wht.amt),0))};
 }

 /* ---------- ledger record: derived fields ---------- */
 function syncPair(c,L){
  const set=(k,v)=>{if(canon(L[k])!==canon(v))L[k]=v;};
  set('pkgSale',1);set('saleId',c.id);set('chain',c.baseNo||c.no);
  if(!L.legacyNo)set('no',c.baseNo||c.no);
  set('date',c.date);set('quoteId',c.quoteId||'');set('custId',c.custId||'');set('vehIdx',c.vehIdx==null||c.vehIdx<0?0:c.vehIdx);
  if(canon(L.items)!==canon(c.items||[]))L.items=clone(c.items||[]);
  set('disc',n(c.disc));set('vat',n(c.vat));
  if((c.adj&&c.adj.length)||L.adj)set('adj',clone(c.adj||[]));
  set('wht',0);if(c.wht)set('whtBase',c.wht.base==='all'?'all':'labor');else if(!L.whtBase)L.whtBase='labor';
  if((c.wht&&n(c.wht.rate)>0)||L.whtExp)set('whtExp',{rate:c.wht?n(c.wht.rate):0,base:c.wht&&c.wht.base==='all'?'all':'labor'});
  set('pay',{credit:!!c.credit,days:c.credit?n(c.credit.days):0,due:c.credit?(c.credit.due||c.date):c.date,cash:false,trans:false,card:false,chk:false});
  if(c.tech1!==undefined)['tech1','tech1Name','tech2','tech2Name'].forEach(k=>set(k,c[k]||''));
  if(!L.legacyNo){set('ref',c.quoteNo||c.ref||'');set('by',c.sellerName||(typeof byShort==='function'?byShort(c):'')||'');set('note',c.remark||'');
   if(L.warr===undefined||L.warr===null)L.warr=(DB.shop&&DB.shop.warr)||'';}
  if(c.kitDetail!==undefined)set('kitDetail',c.kitDetail);
  {const ch=c.channel==='retail'?'retail':'';if((L.salesChannel||'')!==ch)L.salesChannel=ch;}set('deducted',true);
  if(!L.apv||L.apv.status!=='approved')L.apv={status:'approved',by:'',byName:'ระบบ (ใบตัดสต็อก)',date:c.date,note:''};
  if(c.br!==undefined)set('br',c.br);
  if(!!L.cancelled!==!!c.cancelled)L.cancelled=!!c.cancelled;
  if(c.cancelled){set('cancelReason',c.cancelReason||'');set('cancelDate',c.cancelDate||'');}
  return L;
 }
 function derivePay(c,L,st){
  const sums={},x={};
  active(L).forEach(p=>{const ms=p.methods&&p.methods.length?p.methods:(p.method?[{k:p.method,amt:p.amt}]:[]);
   ms.forEach(m=>{const k=OLDK[m.k];if(!k)return;sums[k]=(sums[k]||0)+n(m.amt);
    if(m.k==='cash'&&m.given!==undefined&&m.given!==''){x.received=n(m.given);x.change=n(m.change);x.cashGiven=String(m.given);}
    if(m.k==='card'&&n(m.fee)>0)x.cardFee=r2(n(x.cardFee)+n(m.fee));});});
  const keys=Object.keys(sums).sort((a,b)=>sums[b]-sums[a]);
  if(c.credit&&st.k!=='paid')return Object.assign({method:'credit',methods:['credit'].concat(keys),amount:st.got,credit:true,days:n(c.credit.days),due:c.credit.due||''},x);
  if(!keys.length)return st.n?{method:'',methods:[],amount:st.got}:null;
  if(x.received===undefined&&sums.cash){x.received=r2(sums.cash);x.change=0;}
  return Object.assign({method:keys[0],methods:keys,amount:st.got},x);
 }
 /* derived from the payments: receipt numbers for new payments, paid / paidDate, the SA cache, the invoice when one is due.
    live = a real write of the running program (numbers may be issued); migration calls it with live:false */
 function touchPair(c,L,o){
  o=o||{};let ch=false;const live=!!o.live&&on();
  /* phase 8 (owner 12 Oct): the program never makes a paper by itself — a receipt number comes from issueReceipt() or from
     the settlement window's own "ออกใบเสร็จ" choice (afterPay), an invoice from createInvoice(). A receiving an original
     writer pushed here without a source is only labelled, so a later settlement does not number it. */
  if(live)(L.payments||[]).forEach(p=>{if(p&&!p.src){p.src=p.billingId?'billing':p.invoiceId?'invoice':'other';ch=true;}});
  const t=receiptTotals(L),got=paidAmtOf(L),rem=t.gross-n(t.whtAmt)-got,paid=!L.cancelled&&rem<=EPS;
  if(L.paid!==paid){L.paid=paid;ch=true;if(live)BILL_Q.push(L.id);}
  if(paid){if(!L.paidDate){L.paidDate=active(L).reduce((a,p)=>String(p.date||'')>a?String(p.date):a,'')||L.date;ch=true;}}else if(L.paidDate){L.paidDate='';ch=true;}
  if(c){
   const s=statOf(c,L),st={k:s.k,got:s.got,wht:s.wht,rem:s.rem,n:s.n,last:s.last};
   if(canon(c.st)!==canon(st)){c.st=st;ch=true;}
   const pd=s.k==='paid';if(c.paid!==pd){c.paid=pd;ch=true;}
   const py=derivePay(c,L,s);if(canon(c.pay)!==canon(py)){c.pay=py;ch=true;}
   if(c.total===undefined||Math.abs(n(c.total)-t.gross)>EPS){c.total=t.gross;ch=true;}
   if(c.ledId!==L.id){c.ledId=L.id;ch=true;}
  }
  if(live&&BILL_Q.length){const ids=BILL_Q.splice(0);ids.forEach(id=>billSync(id));}   /* 4.5: a billing note's status follows the bills it holds */
  if(ch&&live)used();
  return ch;
 }
 /* ---------- phase 9a (owner 12 Oct): ใบวางบิล is a paper that shows what the customer owes — it never receives money.
    Money for its bills comes through the debtor settlement window only; the note is closed (and re-opened when a
    receiving is cancelled) from the state of its bills. A note closed by the old "รับชำระ" of the billing page keeps
    that record (pay.auto is not set) and is never re-opened here. ---------- */
 const BILL_LOCK='ใบวางบิลรับเงินไม่ได้ — ตัดชำระที่หน้าลูกหนี้',BILL_Q=[];
 const billItems=b=>(b.receiptIds||[]).map(id=>(DB.receipts||[]).find(r=>r&&r.id===id)).filter(Boolean);
 const billRem=b=>billItems(b).reduce((a,r)=>a+(r.paid?0:Math.max(0,receiptTotals(r).net-paidAmtOf(r))),0);
 function billSyncOne(b){
  if(!b||b.cancelled)return false;const its=billItems(b);if(!its.length)return false;
  const allPaid=billRem(b)<=EPS;
  if(allPaid&&!b.settled){const last=its.reduce((a,r)=>String(r.paidDate||'')>a?String(r.paidDate):a,'')||today();
   b.settled=true;b.settledDate=last;b.pay={method:'',label:'ตัดชำระที่หน้าลูกหนี้ครบทุกใบ',date:last,bank:'',ref:'',note:'',byName:meName(),auto:true};
   logAudit('billing',b,'pay','ปิดใบวางบิล — ทุกใบในใบวางบิลตัดชำระครบแล้ว (ไม่มีการรับเงินที่ใบวางบิล)');return true;}
  if(!allPaid&&b.settled&&b.pay&&b.pay.auto){b.settled=false;b.settledDate='';b.pay=null;
   logAudit('billing',b,'save','ใบวางบิลกลับเป็นค้างชำระ — มีการยกเลิกการรับชำระของใบในใบวางบิล');return true;}
  return false;
 }
 /* id = one ledger / receipt id (only the notes that hold it), or nothing = every note */
 function billSync(id){if(!on())return false;let ch=false;(DB.billings||[]).forEach(b=>{if((!id||(b.receiptIds||[]).includes(id))&&billSyncOne(b))ch=true;});return ch;}
 function issueInvPair(c,L){
  if(L.inv&&L.inv.no&&invDead(L.inv))L.invVoid=(L.invVoid||[]).concat([L.inv]);     /* a cancelled / rejected invoice keeps its number, in the list of the cut's old invoices */
  L.inv={no:inBr(c,()=>docNo('IV')),date:today(),at:nowTs(),by:DB.curEmp||'',byName:meName(),
   apv:{status:'pending',by:DB.curEmp||'',byName:meName(),date:today(),note:''}};NV++;return L.inv;}
 /* ---------- phase 9b (owner 12 Oct): an invoice is saved as "รออนุมัติ" and approved / sent back the way quotes are —
    apv = {status:'pending'|'approved'|'rejected', by, byName, date, note}. A paper stored before this layer has no apv and
    counts as approved. A rejected one is as dead as a cancelled one (number kept; the cut may get a new invoice).
    Right (phase 10g, owner 12 Oct): ONE right, in the place the owner looks — the "อนุมัติ" tick of the invoice row of the
    rights matrix (row rcptDoc → apv.invoice). The owner account always may. ---------- */
 const invApv=d=>(d&&d.apv&&d.apv.status)||'approved';
 const invDead=d=>!!(d&&(d.cancelled||invApv(d)==='rejected'));
 const mayInvApv=()=>!curEmp()||!!can('apv.invoice');
 const invPeek=x=>{const c=pair(x)[0];return c?inBr(c,()=>peekDocNo('IV')):'';};
 function approveInvoice(x,o){
  const [c,L]=pair(x);if(!on()||!c||!L)return false;const d=invOf(L);if(!d)return false;o=o||{};
  if(!mayInvApv())return say('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  if(invApv(d)==='approved')return say('ใบแจ้งหนี้ '+d.no+' อนุมัติแล้ว');
  d.apv={status:'approved',by:DB.curEmp||'',byName:meName(),date:today(),note:''};used();
  logAudit('stockcut',c,'approve','อนุมัติใบแจ้งหนี้ '+d.no+' โดย '+meName()+(o.bulk?' · อนุมัติพร้อมกัน '+o.bulk+' ใบจากทะเบียน':''));
  if(!o.hold){save();refresh();}
  return d;
 }
 async function rejectInvoice(x,note){
  const [c,L]=pair(x);if(!on()||!c||!L)return false;const d=invOf(L);if(!d)return false;
  if(!mayInvApv())return say('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  if(invApv(d)==='approved')return say('ใบแจ้งหนี้ '+d.no+' อนุมัติแล้ว ตีกลับ/คืนสถานะไม่ได้ — หากใบนี้มีปัญหาให้ใช้ “ยกเลิกเอกสาร”');
  if(note===undefined)note=await askPromptP({title:'ไม่อนุมัติ / ตีกลับเอกสาร '+d.no,text:'ระบุเหตุผลที่ไม่อนุมัติ / ตีกลับ',yes:'ตีกลับเอกสาร',no:'ยกเลิก'});
  if(note===null)return false;
  d.apv={status:'rejected',by:DB.curEmp||'',byName:meName(),date:today(),note:String(note||'').trim()};NV++;used();
  logAudit('stockcut',c,'reject','ไม่อนุมัติใบแจ้งหนี้ '+d.no+(d.apv.note?' — '+d.apv.note:''));
  save();refresh();return true;
 }
 /* ---------- ใบแจ้งหนี้ (phase 8): made by a press only · one active invoice per cut · own IV number · cancelled ones keep theirs ---------- */
 const invOf=x=>{const L=pair(x)[1],d=L&&L.inv;return d&&d.no&&!invDead(d)?d:null;};
 const invOk=x=>{const d=invOf(x);return d&&invApv(d)==='approved'?d:null;};   /* the invoice a customer may be shown: active AND approved */   /* x = a cut, its ledger record, or either id */
 const invAll=x=>{const L=pair(x)[1];return L?[].concat((L.invVoid||[]).filter(d=>d&&d.no),L.inv&&L.inv.no?[L.inv]:[]):[];};
 function invCan(x){
  const [c,L]=pair(x);if(!on()||!c||!L)return 'ใบตัดสต็อกนี้ยังไม่อยู่ในระบบขายแบบใหม่';
  if(c.cancelled)return 'ใบตัดสต็อก '+c.no+' ยกเลิกแล้ว';
  if(c.superseded)return 'ใบตัดสต็อก '+c.no+' ถูกแก้ไขเป็น '+(c.revisedTo||'ฉบับใหม่')+' แล้ว — สร้างใบแจ้งหนี้ที่ฉบับล่าสุด';
  const d=invOf(L);if(d)return 'ใบตัดสต็อก '+c.no+' มีใบแจ้งหนี้ '+d.no+(invApv(d)==='pending'?' (รออนุมัติ)':'')+' อยู่แล้ว (ใบตัดสต็อก 1 ใบ มีใบแจ้งหนี้ได้ 1 ใบ)';
  const s=statOf(c,L);if(!['wait','part','credit'].includes(s.k))return 'ใบตัดสต็อก '+c.no+' '+(STATE[s.k]||'')+' — ไม่ต้องออกใบแจ้งหนี้';
  return '';
 }
 function createInvoice(x){
  const [c,L]=pair(x),er=invCan(x);if(er)return say(er);
  if(!need('rcptDoc','add'))return false;
  const v=issueInvPair(c,L);used();
  logAudit('stockcut',c,'save','บันทึกใบแจ้งหนี้ '+v.no+' · ยอดค้างชำระ '+money(statOf(c,L).rem)+' บาท · รออนุมัติ');
  save();refresh();return v;
 }
 async function cancelInvoice(x,reason){
  const [c,L]=pair(x);if(!on()||!c||!L)return false;const d=invOf(L);if(!d)return false;
  if(d.legacy)return say('ใบแจ้งหนี้ '+d.no+' เป็นเอกสารเดิมของระบบเดิม — ยกเลิกที่หน้านี้ไม่ได้');
  if(!need('rcptDoc','cancel'))return false;
  if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk({date:d.date}))return false;
  if(reason===undefined)reason=await askPromptP({title:'ยกเลิกใบแจ้งหนี้ '+d.no,text:'ใบแจ้งหนี้ของใบตัดสต็อก '+c.no+' — ระบุเหตุผลที่ยกเลิก (จำเป็น) · เลขที่นี้จะไม่ถูกนำมาใช้อีก',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
  if(reason===null)return false;
  if(!String(reason).trim())return say('ต้องระบุเหตุผลที่ยกเลิก');
  Object.assign(d,{cancelled:true,cancelDate:today(),cancelAt:nowTs(),cancelBy:meName(),cancelReason:String(reason).trim()});NV++;used();
  logAudit('stockcut',c,'cancel','ยกเลิกใบแจ้งหนี้ '+d.no+' · เหตุผล: '+d.cancelReason);
  save();refresh();return true;
 }
 /* ---------- ใบเสร็จรับเงิน (phase 8): the number is taken when the person asks for the receipt of ONE receiving ---------- */
 function issueReceipt(x,payId){
  const [c,L]=pair(x);if(!on()||!L)return false;
  const p=(L.payments||[]).find(q=>q&&q.id===payId);if(!p||p.cancelled)return false;
  if(p.reNo)return p;
  if(p.src==='legacy')return say('รายการรับเงินของเอกสารเดิม — ใช้เลขที่ของเอกสารเดิม');
  if(!need('rcptDoc','add'))return false;
  stampPay(p,L,c);used();
  logAudit('stockcut',c||L,'save','สร้างใบเสร็จรับเงิน '+p.reNo+' · รับเงิน '+money(p.amt)+' บาท · วันที่รับเงิน '+thDate(p.date));
  save();refresh();return p;
 }
 const noReceipt=x=>{const L=pair(x)[1];return L?(L.payments||[]).filter(p=>p&&!p.cancelled&&!p.reNo&&p.src!=='legacy'):[];};
 const stateIs=(c,k)=>{const s=state(c);return k==='due'?(s==='wait'||s==='part'):s===k;};
 /* owner 12 Oct: manual only — "ออกใบกำกับภาษีอัตโนมัติไม่เอา ต้องเป็นการกดออกเองเท่านั้น". A tax invoice is issued by the person
    (done pop-up "ออกใบกำกับภาษี" → the 4.6 create window, or 4.6 itself), never with the save. The phase-6 code below is
    kept, but with AUTO_TAX false it cannot be reached whatever DB.pkgSaleFlow.tax holds, and page 11.5 no longer offers it. */
 const AUTO_TAX=false;
 const taxOn=()=>{const f=FLAG();return AUTO_TAX&&!!(f&&f.tax===true);};
 function issueTaxPair(c,L){
  if(!taxOn())return null;
  const b=BR(),br=b?b.get(b.brOf(c)):null;
  const cu=c.custId&&typeof findCust==='function'?findCust(c.custId):null;
  if(!(n(c.vat)>0)||!cu||!String(cu.tax||'').trim()||(typeof isVatReg==='function'&&!isVatReg())||(br&&br.bill===false)||c.cancelled)return null;   /* walk-in / no tax id: no automatic full tax invoice (4.6 by hand, as today) */
  const had=taxOf(L);if(had)return had.no;
  const no=inBr(c,()=>ensureDocNo(L,'taxDocs','taxNo','RT')),d=taxOf(L);if(d){d.date=c.date;d.saleNo=c.no;}L.issueTax=true;
  if(typeof syncTaxLegacy==='function')syncTaxLegacy(L);NV++;
  logAudit('receipt',L,'save','ออกใบกำกับภาษี '+no+' พร้อมใบตัดสต็อก '+c.no);
  return no;
 }
 /* the active tax document of a ledger record / sale (null when none) */
 function taxOf(x){const L=x&&x.pkgSale?x:led(x);const a=(L&&L.taxDocs)||[],cur=a.length?a[a.length-1]:null;return cur&&!cur.cancelled?cur:null;}
 const TAX_LOCK=AUTO_TAX?'ใบตัดสต็อกนี้ออกใบกำกับภาษีแล้ว — ปรับยอดไม่ได้ ให้ทำฉบับแก้ไข (ระบบออกใบกำกับภาษีใหม่ให้) หรือยกเลิกใบตัดสต็อกแล้วทำใหม่'
  :'ใบตัดสต็อกนี้ออกใบกำกับภาษีแล้ว — ปรับยอดไม่ได้ ให้ยกเลิกใบกำกับภาษีที่ 4.6 ก่อน (แล้วออกใหม่หลังปรับยอด) หรือยกเลิกใบตัดสต็อกแล้วทำใหม่';
 function setTax(v){
  if(!AUTO_TAX)return say('ใบกำกับภาษีออกได้จากการกดออกเองเท่านั้น — ปุ่ม “ออกใบกำกับภาษี” หลังบันทึก หรือเมนู 4.6');
  const f=FLAG();if(!f||!f.on)return say('ต้องเปิดใช้ระบบขายแบบใหม่ก่อน');
  if(curEmp()&&!(can('tabs.setting')&&can('doc.backup')))return say('การตั้งค่านี้ต้องทำโดยเจ้าของกิจการ');
  f.tax=!!v;logAudit('stockcut',{id:'',no:'ระบบขายแบบใหม่'},'saleflow',f.tax?'เปิด: ออกใบกำกับภาษีพร้อมใบตัดสต็อก (ตอนของออก)':'ปิด: ออกใบกำกับภาษีพร้อมใบตัดสต็อก');save();return true;
 }
 function sync(c){const L=led(c);if(!c||!L)return null;syncPair(c,L);return L;}
 function touch(x,o){const [c,L]=pair(x);if(!L)return false;return touchPair(c,L,Object.assign({live:true},o||{}));}
 /* after an original writer pushed payments onto receipts (settle.js doSave → here) */
 function afterPay(list){let ch=false;(list||[]).forEach(d=>{if(!d||!d.pkgSale)return;
   if(on()){const c=saleOf(d);(d.payments||[]).forEach(p=>{if(p&&!p.cancelled&&!p.reNo&&!p.src){stampPay(p,d,c);ch=true;}});}   /* settle.js: "ใบเสร็จใบเดียวรวมทุกบิล / แยกใบเสร็จตามบิล" */
   if(touch(d))ch=true;});
  try{if(on()&&window.PKG_SALE_DOCS&&PKG_SALE_DOCS.billRefresh)PKG_SALE_DOCS.billRefresh();}catch(e){}   /* 4.5 follows what was settled */
  return ch;}
 /* catch-all: every ledger record whose payments / paid flag are out of step */
 function sweep(){let ch=false;if(!on())return ch;for(const L of DB.receipts||[])if(L&&L.pkgSale&&!L.cancelled){
  const need=(L.payments||[]).some(p=>p&&!p.src)||(!!L.paid!==(receiptTotals(L).net-paidAmtOf(L)<=EPS));
  if(need&&touch(L))ch=true;}return ch;}
 function issueInv(x){return invOf(x)||createInvoice(x)||null;}
 function issueTax(x){const [c,L]=pair(x);if(!on()||!c||!L)return null;const v=issueTaxPair(c,L);if(v){used();save();}return v;}
 function newLed(c,id){
  const L=Object.assign(typeof blankReceipt==='function'?blankReceipt():{},{id:id||uid(),no:c.baseNo||c.no,taxNo:'',taxDocs:[],issueTax:false,pkgSale:1,payments:[]});
  ['createdBy','createdByName','createdAt','updatedBy','updatedByName','updatedAt'].forEach(k=>{if(c[k]!==undefined)L[k]=c[k];});
  return syncPair(c,L);
 }

 /* ---------- writes of the new flow ---------- */
 const say=m=>{toast(m);return false;};
 const need=(row,act)=>typeof pkgPermNeed==='function'?pkgPermNeed(row,act):true;
 const mayRecv=()=>{if(!need('rcptDoc','add'))return false;if(!can('doc.payRec'))return say('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');return true;};
 const moneyOf=d=>d&&Array.isArray(d.methods)&&d.methods.length?r2(d.methods.reduce((a,m)=>a+n(m.amt),0)):r2(d&&d.amt);
 /* the rules of one receiving against a remainder; returns the reason it is refused, or '' */
 function payError(rem,d,c){
  if(!d)return 'ยังไม่มีข้อมูลการรับชำระ';
  const w=r2(d.wht&&d.wht.amt),m=moneyOf(d);rem=r2(rem);
  if(String(d.date||today())>today())return 'วันที่รับเงินเป็นวันล่วงหน้าไม่ได้';
  if(w<0||m<0)return 'จำนวนเงินต้องไม่ติดลบ';
  if(w>0&&!isCo(c))return 'หัก ณ ที่จ่ายใช้ได้กับลูกค้านิติบุคคลเท่านั้น';
  if(w>rem+EPS)return 'ยอดหัก ณ ที่จ่ายมากกว่ายอดที่ค้างชำระ';
  if(m>r2(rem-w)+EPS)return 'รับเกินยอดที่ค้างชำระ (ค้าง '+money(r2(rem-w))+' บาท)';
  if(!(m>0)&&rem-w>EPS)return 'ยังไม่ได้ใส่จำนวนเงินที่รับ';
  const f=FLAG();if(f&&f.partial===false&&rem-w-m>EPS)return 'ร้านตั้งค่าไม่รับชำระบางส่วน — ต้องรับเต็มจำนวน '+money(r2(rem-w))+' บาท';
  return '';
 }
 function pushPay(c,L,d,src){
  const methods=clone(d.methods||[]).map(m=>Object.assign({},m,{k:NEWK[m.k]||m.k,amt:r2(m.amt)})).filter(m=>m.amt>0),tl=clone(d.transLines||[]).map((l,i)=>({no:i+1,bank:String(l.bank||''),amt:r2(l.amt),when:String(l.when||''),ref:String(l.ref||''),slip:!!l.slip}));
  const amt=moneyOf(d),payId=d.payId||('SP'+uid()),w=d.wht&&r2(d.wht.amt)>0?d.wht:null,t=receiptTotals(L);
  const p=Object.assign({id:uid(),date:d.date||today(),time:d.time||new Date().toTimeString().slice(0,5),amt},mainOf(methods,tl),{by:String(d.by||meName()),note:String(d.note||''),
   methods,transLines:tl,payId,payTotal:r2(d.payTotal||amt),payBills:n(d.payBills)||1,slipCount:(d.slips||[]).length,br:BR()?BR().brOf(c):'',reNo:'',src:src||'sale',
   createdAt:nowTs(),createdBy:DB.curEmp||'',createdByName:meName()});
  if(d.reShare)p.reShare=true;
  if(w)p.wht=Object.assign(whtRec(w.rate,w.base||(c.wht&&c.wht.base)||'labor',w.baseAmt!==undefined?w.baseAmt:((w.base||(c.wht&&c.wht.base))==='all'?t.base:t.labor),w.amt,w.got===undefined?false:w.got),{gotDate:w.gotDate||'',img:!!(d.whtDoc&&d.whtDoc.url)});
  if((d.slips||[]).length){DB.paySlips=DB.paySlips||{};DB.paySlips[payId]=clone(d.slips);}
  if(p.wht&&p.wht.img){DB.whtDocs=DB.whtDocs||{};DB.whtDocs[p.id]={url:d.whtDoc.url,name:d.whtDoc.name||''};}
  L.payments=L.payments||[];L.payments.push(p);return p;
 }
 const MONEY_ONLY=true;   /* phase 9a: money for a stock cut comes ONLY through its own window / 4.3 (cash) or the debtor settlement window (credit) */
 const CREDIT_LOCK=c=>'ใบตัดสต็อก '+c.no+' เป็นเงินเชื่อ — ตัดชำระที่หน้าลูกหนี้เท่านั้น';
 const mtxt=p=>(p.methods||[]).map(m=>(typeof PAY_METHOD_LABEL==='object'&&PAY_METHOD_LABEL[m.k])||m.k).join(' + ');
 /* receive money for a saved sale → one payment record = one receipt */
 function addPayment(x,d,o){
  const [c,L]=pair(x);o=o||{};
  if(!on()||!c||!L)return say('ใบตัดสต็อกนี้ยังไม่อยู่ในระบบขายแบบใหม่');
  if(!mayRecv())return false;
  const s=statOf(c,L);if(!['wait','part','credit'].includes(s.k))return say('ใบตัดสต็อก '+c.no+' '+(STATE[s.k]||'')+' — รับชำระเพิ่มไม่ได้');
  if(s.k==='credit'&&(o.src||'sale')==='sale')return say(CREDIT_LOCK(c));
  const er=payError(s.rem,d,c);if(er)return say(er);
  const p=pushPay(c,L,d,o.src||'sale');
  if(o.issue)stampPay(p,L,c);                                           /* "+ สร้างใบเสร็จรับเงิน" (4.3): receive and issue in one press */
  touchPair(c,L,{live:true});used();
  const s2=statOf(c,L);
  logAudit('stockcut',c,'pay','รับชำระ '+money(p.amt)+' บาท'+(mtxt(p)?' ('+mtxt(p)+')':'')+(p.wht?' · ลูกค้าหัก ณ ที่จ่าย '+money(p.wht.amt)+' บาท':'')+(p.reNo?' · ใบเสร็จ '+p.reNo:' · ยังไม่ออกใบเสร็จ')+(s2.k==='paid'?' · ชำระครบแล้ว':' · คงค้าง '+money(s2.rem)+' บาท'));
  if(!o.hold){save();refresh();}
  return p;
 }
 /* cancel one receiving (the receipt stays, struck through; the sale falls back to รอชำระ / ชำระบางส่วน) */
 async function cancelPayment(x,payId,reason){
  const [c,L]=pair(x);if(!on()||!c||!L)return false;
  const p=(L.payments||[]).find(q=>q&&q.id===payId);if(!p||p.cancelled)return false;
  if(!need('rcptDoc','cancel'))return false;
  if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk({date:p.date}))return false;
  if(reason===undefined)reason=await askPromptP({title:'ยกเลิกการรับชำระ '+money(p.amt)+' บาท',text:(p.reNo?'ใบเสร็จ '+p.reNo:'การรับชำระที่ยังไม่ออกใบเสร็จ')+' ของใบตัดสต็อก '+c.no+' — ระบุเหตุผลที่ยกเลิก (จำเป็น)',yes:'ยกเลิกการรับชำระ',no:'ไม่ยกเลิก'});
  if(reason===null)return false;
  if(!String(reason).trim())return say('ต้องระบุเหตุผลที่ยกเลิก');
  Object.assign(p,{cancelled:true,cancelDate:today(),cancelAt:nowTs(),cancelBy:meName(),cancelReason:String(reason).trim()});
  touchPair(c,L,{live:true});used();
  logAudit('stockcut',c,'payvoid','ยกเลิกการรับชำระ '+money(p.amt)+' บาท · '+(p.reNo?'ใบเสร็จ '+p.reNo:'ยังไม่ออกใบเสร็จ')+' · เหตุผล: '+p.cancelReason+' · คงค้าง '+money(statOf(c,L).rem)+' บาท');
  save();refresh();return true;
 }
 /* ปรับเพิ่ม / ลด + เหตุผล — until the sale is fully paid; VAT-inclusive, positive amount */
 const ADJ_REASONS=['ปัดเศษ','ลูกค้าโอนขาด','ค่าบริการเพิ่ม','ส่วนลดพิเศษ','อื่น ๆ'];
 function adjError(c,a,rem,gross){
  const amt=r2(a&&a.amt);
  if(!a||!['up','down'].includes(a.type))return 'เลือกว่าปรับเพิ่มหรือปรับลด';
  if(!(amt>0))return 'ใส่จำนวนเงินที่ปรับ (มากกว่า 0)';
  if(!String(a.reason||'').trim())return 'ต้องระบุเหตุผลของการปรับยอด';
  if(a.reason==='อื่น ๆ'&&!String(a.note||'').trim())return 'เหตุผล “อื่น ๆ” ต้องใส่หมายเหตุ';
  if(a.type==='down'){if(amt>rem+EPS)return 'ปรับลดได้ไม่เกินยอดที่ยังค้างชำระ ('+money(rem)+' บาท)';if(gross-amt<=EPS)return 'ปรับลดจนยอดขายเป็น 0 ไม่ได้';}
  return '';
 }
 const adjRec=a=>({id:uid(),type:a.type,amt:r2(a.amt),reason:String(a.reason).trim(),note:String(a.note||'').trim(),date:today(),at:nowTs(),by:DB.curEmp||'',byName:meName()});
 function adjust(x,a){
  const [c,L]=pair(x);if(!on()||!c||!L)return say('ใบตัดสต็อกนี้ยังไม่อยู่ในระบบขายแบบใหม่');
  if(window.PKG_TAX_PERIOD&&PKG_TAX_PERIOD.lockedDoc(c))return false;   /* DriveGo new system (task 3.3, T5): its VAT month is closed */
  if(!need('rcptCut','edit'))return false;
  const s=statOf(c,L);if(!['wait','part','credit'].includes(s.k))return say('ใบตัดสต็อก '+c.no+' '+(STATE[s.k]||'')+' — ปรับยอดไม่ได้');
  if(taxOf(L))return say(TAX_LOCK);
  const er=adjError(c,a,s.rem,s.total);if(er)return say(er);
  const rec=adjRec(a);c.adj=(c.adj||[]).concat([rec]);
  syncPair(c,L);touchPair(c,L,{live:true});used();
  logAudit('stockcut',c,'saleadj',(rec.type==='up'?'ปรับเพิ่ม ':'ปรับลด ')+money(rec.amt)+' บาท · '+rec.reason+(rec.note?' — '+rec.note:'')+' · ยอดขายใหม่ '+money(statOf(c,L).total)+' บาท');
  save();refresh();return rec;
 }
 function adjDel(x,id){
  const [c,L]=pair(x);if(!on()||!c||!L)return false;
  if(window.PKG_TAX_PERIOD&&PKG_TAX_PERIOD.lockedDoc(c))return false;   /* DriveGo new system (task 3.3, T5) */
  if(!need('rcptCut','edit'))return false;
  const rec=(c.adj||[]).find(a=>a.id===id);if(!rec)return false;
  const s=statOf(c,L);if(!['wait','part','credit'].includes(s.k))return say('ใบตัดสต็อก '+c.no+' '+(STATE[s.k]||'')+' — แก้รายการปรับยอดไม่ได้');
  if(taxOf(L))return say(TAX_LOCK);
  if(rec.type==='up'&&rec.amt>s.rem+EPS)return say('ลบรายการปรับเพิ่มนี้ไม่ได้ — ยอดที่รับชำระแล้วจะเกินยอดขาย (ยกเลิกการรับชำระก่อน)');
  c.adj=(c.adj||[]).filter(a=>a.id!==id);
  syncPair(c,L);touchPair(c,L,{live:true});used();
  logAudit('stockcut',c,'saleadj','ลบรายการ'+(rec.type==='up'?'ปรับเพิ่ม ':'ปรับลด ')+money(rec.amt)+' บาท ('+rec.reason+') · ยอดขายใหม่ '+money(statOf(c,L).total)+' บาท');
  save();refresh();return true;
 }
 /* called by stock-cut.js createDoc just before its save(): the sale gets its ledger record at the moment of the cut.
    opts.sale = {mode:'wait'|'pay'|'credit', pay, credit} from saveSale(); without it the old 4.4 panel's `pay` (still used
    until the payment step of phase 2 / 3 replaces it) becomes the first payment, or the credit terms. */
 function onCreate(c,S,opts){
  if(!on()||!c||led(c))return null;
  S=S||{};const sale=(opts&&opts.sale)||null,old=c.pay;
  c.wht=normWht(S.wht,c);
  if(Array.isArray(S.adj)&&S.adj.length)c.adj=S.adj.filter(a=>!adjError(c,a,Infinity,Infinity)).map(a=>a.id&&a.at?clone(a):adjRec(a));
  ['tech1','tech1Name','tech2','tech2Name'].forEach(k=>{if(S[k]!==undefined)c[k]=S[k];});
  if(sale){if(sale.mode==='credit')c.credit={days:n(sale.credit&&sale.credit.days),due:(sale.credit&&sale.credit.due)||c.date};}
  else if(old&&(old.method==='credit'||old.credit))c.credit={days:n(old.days),due:old.due||c.date};
  if(!c.credit)c.credit=null;
  const L=newLed(c);DB.receipts.push(L);bump();
  issueTaxPair(c,L);
  if(sale&&sale.mode==='pay'&&sale.pay)pushPay(c,L,sale.pay,'sale');
  else if(!sale&&old&&!c.credit){const p=legacyPay(old,receiptTotals(L).gross,{src:'sale',date:c.date,by:old.by||meName(),payId:'SP'+uid(),br:BR()?BR().brOf(c):''});
   Object.assign(p,{createdAt:nowTs(),createdBy:DB.curEmp||'',createdByName:meName()});L.payments.push(p);}
  touchPair(c,L,{live:true});used();
  return L;
 }
 /* บันทึกขาย · รอชำระ / ชำระเงิน / เงินเชื่อ — the payment is checked first: nothing is cut when it is wrong */
 async function saveSale(S,mode,payDraft,o){
  if(!on())return say('ยังไม่ได้เปิดใช้ระบบขายแบบใหม่');
  mode=mode||'wait';o=o||{};
  if(!S||!(S.items||[]).filter(filled).length)return say('ยังไม่มีรายการสินค้า');
  if(mode==='credit'&&!S.custId)return say('ขายเชื่อต้องเลือกลูกค้าก่อน');
  if(mode==='pay'){if(!mayRecv())return false;
   const t=receiptTotals({items:(S.items||[]).filter(filled),disc:n(S.disc),vat:n(S.vat),adj:S.adj||[],wht:0,whtBase:'labor',pay:{}});
   const er=payError(t.gross,payDraft,S);if(er)return say(er);}
  return SC.createDoc(S,null,Object.assign({},o,{sale:{mode,pay:mode==='pay'?payDraft:null,credit:mode==='credit'?(o.credit||{days:n(S.days)}):null}}));
 }
 /* cancelling a sale: refused while money is recorded on it or it sits in an active billing */
 function canCancel(c){
  if(c&&c.superseded)return say('ใบตัดสต็อก '+c.no+' ถูกแก้ไขเป็น '+(c.revisedTo||'ฉบับใหม่')+' แล้ว — ยกเลิกที่ฉบับล่าสุด');
  const L=led(c);if(!L)return true;
  if(active(L).length)return say('ใบตัดสต็อก '+c.no+' มีการรับชำระแล้ว — ต้องยกเลิกการรับชำระก่อน จึงจะยกเลิกใบตัดสต็อกได้');
  const b=(DB.billings||[]).find(x=>!x.cancelled&&(x.receiptIds||[]).includes(L.id));
  if(b)return say('ใบตัดสต็อก '+c.no+' อยู่ในใบวางบิล '+b.no+' — ยกเลิกใบวางบิลก่อน');
  return true;
 }
 function onCancel(c){
  const L=led(c);if(!L)return;
  const cur=(L.taxDocs||[]).length?L.taxDocs[L.taxDocs.length-1]:null;
  if(cur&&!cur.cancelled){cur.cancelled=true;cur.cancelReason='ยกเลิกตามใบตัดสต็อก '+c.no;cur.cancelDate=today();if(typeof syncTaxLegacy==='function')syncTaxLegacy(L);
   logAudit('receipt',L,'taxcancel','ยกเลิกใบกำกับภาษี '+cur.no+' ตามการยกเลิกใบตัดสต็อก '+c.no);}
  {const iv=invOf(L);if(iv&&!iv.legacy){Object.assign(iv,{cancelled:true,cancelDate:today(),cancelAt:nowTs(),cancelBy:meName(),cancelReason:'ยกเลิกตามใบตัดสต็อก '+c.no});NV++;
    logAudit('stockcut',c,'cancel','ยกเลิกใบแจ้งหนี้ '+iv.no+' ตามการยกเลิกใบตัดสต็อก '+c.no);}}
  syncPair(c,L);touchPair(c,L,{live:true});used();
 }
 /* ---------- ฉบับแก้ไข of a sale (phase 4) — counter sales only (owner 12 Oct: a sale from a quote is cancelled and redone from the quote).
    One active version per chain: <base>-R1, -R2 …; the old version is closed (superseded). Stock moves ONLY by the difference,
    under the chain's one moveRef (FIFO returns into the same lots); the sale DAY, the ledger record (id, invoice number,
    payment history) stay; refused while money is recorded or the sale sits in an active billing. ---------- */
 const stockLines=items=>(typeof pkgStockLines==='function'?pkgStockLines(items):[]).map(it=>({stockId:it.stockId,code:it.code||'',name:it.name||'',unit:it.unit||'',qty:n(it.qty),kit:it.kit||''}));
 const qtyMap=lines=>{const m=new Map();(lines||[]).forEach(it=>m.set(it.stockId,(m.get(it.stockId)||0)+n(it.qty)));return m;};
 function chainCost(c){const al=(DB.fifo&&Array.isArray(DB.fifo.allocs))?DB.fifo.allocs:[],by={};
  al.forEach(a=>{if(a.refNo!==c.moveRef)return;const q=n(a.qty)-n(a.back),b=by[a.stockId]||(by[a.stockId]={q:0,v:0});b.q+=q;b.v+=q*n(a.cost);});return by;}
 /* what a revision would do — pure */
 function revisePlan(x,E){
  const [c,L]=pair(x),o={ok:false,error:'',moves:[]};
  if(!on()||!c||!L){o.error='ใบตัดสต็อกนี้ยังไม่อยู่ในระบบขายแบบใหม่';return o;}
  if(c.cancelled){o.error='ใบตัดสต็อก '+c.no+' ถูกยกเลิกแล้ว';return o;}
  if(c.superseded){o.error='ใบตัดสต็อก '+c.no+' ถูกแก้ไขเป็น '+(c.revisedTo||'ฉบับใหม่')+' แล้ว — แก้ไขที่ฉบับล่าสุด';return o;}
  if(c.quoteId){o.error='งานจากใบเสนอราคา: ยกเลิกใบตัดสต็อกแล้วแก้ที่ใบเสนอราคา (ฉบับแก้ไข) จากนั้นตัดสต็อกใหม่';return o;}
  if(active(L).length){o.error='ใบตัดสต็อก '+c.no+' มีการรับชำระแล้ว — ต้องยกเลิกการรับชำระก่อน จึงจะทำฉบับแก้ไขได้';return o;}
  const bl=(DB.billings||[]).find(b=>!b.cancelled&&(b.receiptIds||[]).includes(L.id));if(bl){o.error='ใบตัดสต็อก '+c.no+' อยู่ในใบวางบิล '+bl.no+' — ยกเลิกใบวางบิลก่อน';return o;}
  if(!taxOn()&&taxOf(L)){o.error='ใบตัดสต็อก '+c.no+' ออกใบกำกับภาษี '+taxOf(L).no+' แล้ว — ยกเลิกใบกำกับภาษีที่ 4.6 ก่อน จึงจะทำฉบับแก้ไขได้ (แล้วออกใบกำกับภาษีใหม่เอง)';return o;}   /* manual only: an issued tax invoice never changes its amounts silently */
  const base=c.baseNo||c.no,k=n(c.revN)+1;o.no=base+'-R'+k;o.base=base;o.revN=k;o.from=c.no;
  if(!E)return Object.assign(o,{ok:true});
  const items=clone((E.items||[]).filter(filled)),lines=stockLines(items);
  if(!items.length){o.error='ยังไม่มีรายการสินค้า';return o;}
  if(!lines.length){o.error='ไม่มีรายการสินค้าในสต๊อก';return o;}
  const tOld=receiptTotals(L),tNew=receiptTotals({items,disc:n(E.disc),vat:n(E.vat),adj:c.adj,wht:0,whtBase:'labor',pay:{}});
  if(!(tNew.gross>EPS)){o.error='ยอดขายของฉบับแก้ไขต้องมากกว่า 0';return o;}
  const was=qtyMap(c.lines),now=qtyMap(lines),ids=new Set([...was.keys(),...now.keys()]),cost=chainCost(c);let cNew=0,cOld=0;
  Object.keys(cost).forEach(id=>{cOld+=cost[id].v;});cNew=cOld;
  ids.forEach(id=>{const d=r2x(n(now.get(id))-n(was.get(id)));if(Math.abs(d)<1e-9)return;const s=DB.stock.find(z=>z.id===id),ln=lines.find(z=>z.stockId===id)||(c.lines||[]).find(z=>z.stockId===id)||{};
   const unit=d<0&&cost[id]&&cost[id].q>0?cost[id].v/cost[id].q:n(s&&s.cost);cNew+=d*unit;
   o.moves.push({stockId:id,code:ln.code||(s&&s.code)||'',name:ln.name||(s&&s.name)||'',unit:ln.unit||(s&&s.unit)||'',d,left:s?n(s.qty):0,short:d>0&&s&&d>n(s.qty)});});
  o.same=!o.moves.length&&canon(items)===canon(c.items||[])&&n(E.disc)===n(c.disc)&&n(E.vat)===n(c.vat);
  return Object.assign(o,{ok:true,items,lines,disc:n(E.disc),vat:n(E.vat),oldTotal:tOld.gross,newTotal:tNew.gross,oldBase:tOld.base,newBase:tNew.base,oldCost:cOld,newCost:Math.max(0,cNew)});
 }
 const r2x=v=>Math.round(n(v)*1e6)/1e6;
 async function revise(x,E){
  const [c,L]=pair(x);if(!c)return false;
  if(window.PKG_TAX_PERIOD&&PKG_TAX_PERIOD.lockedDoc(c))return false;   /* DriveGo new system (task 3.3, T5) */
  if(!need('rcptCut','edit'))return false;
  if(!can('doc.editPrice'))return say('บัญชีนี้ไม่มีสิทธิ์แก้ราคา — ทำฉบับแก้ไขไม่ได้');
  const P=revisePlan(c,E||{});if(!P.ok)return say(P.error);
  if(P.same)return say('ยังไม่ได้แก้ไขอะไร — ฉบับแก้ไขต้องต่างจากฉบับเดิม');
  const more=P.moves.filter(m=>m.d>0),short=more.filter(m=>m.short).length;
  if(short&&!await askP({title:'สต๊อกไม่พอ',msg:'<p>ฉบับแก้ไขตัดสต็อกเพิ่ม '+more.length+' รายการ · มี '+short+' รายการที่ของไม่พอ — ตัดแล้วสต๊อกจะติดลบ</p><p style="margin:8px 0 0">ยืนยันหรือไม่?</p>',yes:'ตัดสต็อก (ยอมติดลบ)',no:'ยังไม่ตัด'}))return false;
  if(more.length&&window.PKG_EXPIRY&&typeof PKG_EXPIRY.guardSale==='function'&&!(await PKG_EXPIRY.guardSale(more.map(m=>({stockId:m.stockId,code:m.code,name:m.name,unit:m.unit,qty:m.d,kit:''})))))return false;
  const nw=Object.assign(clone(c),{id:uid(),no:P.no,baseNo:P.base,revN:P.revN,revOf:c.id,revRoot:c.revRoot||c.id,items:P.items,lines:P.lines,disc:P.disc,vat:P.vat,date:c.date,revDate:today(),
   revMoves:P.moves.map(m=>({stockId:m.stockId,code:m.code,name:m.name,unit:m.unit,d:m.d})),superseded:false,revisedTo:'',supersededAt:'',printed:false,note:E.note!==undefined?E.note:c.note,remark:E.remark!==undefined?E.remark:c.remark});
  if(E.wht)nw.wht=normWht(E.wht,nw);
  delete nw.migr;delete nw.st;['createdBy','createdByName','createdAt','updatedBy','updatedByName','updatedAt'].forEach(k=>delete nw[k]);stampRec(nw,null);
  inBr(c,()=>{P.moves.forEach(m=>{const s=DB.stock.find(z=>z.id===m.stockId);if(!s)return;
   if(m.d>0){s.qty=n(s.qty)-m.d;s.lastMove=today();logMove(s.id,'out',-m.d,today(),'ตัดสต็อกเพิ่ม · ฉบับแก้ไข '+P.no,c.moveRef);}
   else{s.qty=n(s.qty)-m.d;s.lastMove=today();logMove(s.id,'in',-m.d,today(),'คืนสต๊อก · ฉบับแก้ไข '+P.no,c.moveRef);}});});
  const cost=chainCost(c);nw.lines.forEach(it=>{const b=cost[it.stockId],s=DB.stock.find(z=>z.id===it.stockId);it.cost=b&&b.q>0?b.v/b.q:n(s&&s.cost);});nw.cost=nw.lines.reduce((t,it)=>t+n(it.qty)*n(it.cost),0);
  Object.assign(c,{superseded:true,revisedTo:nw.no,supersededAt:nowTs()});
  cuts().push(nw);CX=null;bump();
  syncPair(nw,L);reissueTax(nw,L);touchPair(nw,L,{live:true});c.ledId=L.id;used();
  logAudit('stockcut',c,'revise','ถูกแก้ไขเป็น '+nw.no);
  logAudit('stockcut',nw,'revise','ฉบับแก้ไขของ '+c.no+' · ยอดขาย '+money(P.oldTotal)+' → '+money(P.newTotal)+' บาท'+(P.moves.length?' · สต๊อก '+P.moves.map(m=>m.code+' '+(m.d>0?'ตัดเพิ่ม ':'คืน ')+Math.abs(m.d)).join(', '):' · ไม่มีการเคลื่อนไหวสต๊อก'));
  save();call('renderStock');refresh();
  return nw;
 }
 /* the tax document of a revised sale: cancelled and issued again — only once tax documents are issued at goods-out (phase 6) */
 function reissueTax(c,L){
  if(!taxOn())return null;
  const cur=(L.taxDocs||[]).length?L.taxDocs[L.taxDocs.length-1]:null;if(!cur||cur.cancelled)return issueTaxPair(c,L);
  cur.cancelled=true;cur.cancelReason='ออกใหม่ตามฉบับแก้ไข '+c.no;cur.cancelDate=today();
  logAudit('receipt',L,'taxcancel','ยกเลิกใบกำกับภาษี '+cur.no+' — ออกใหม่ตามฉบับแก้ไข '+c.no);
  const no=issueTaxPair(c,L);if(!no&&typeof syncTaxLegacy==='function')syncTaxLegacy(L);const nw=taxOf(L);if(nw)nw.replaces=cur.no;return no;
 }
 function refresh(){try{if(window.PKG_SALE_DOCS&&PKG_SALE_DOCS.menu)PKG_SALE_DOCS.menu();}catch(e){}['renderHome','renderDocOverview','renderTaxOverview'].forEach(call);try{if(typeof rOvPane!=='undefined'&&rOvPane==='retail')SC.render();}catch(e){}
  try{if(typeof acctPane!=='undefined'&&acctPane==='ar')renderAcctAR();}catch(e){}}

 /* ---------- the original writers: run them, then put the ledger records back in step ---------- */
 const after=(ids,more)=>{let ch=false;(ids||[]).forEach(id=>{const L=ledById(id);if(L&&touch(L))ch=true;});if(more||ch){save();refresh();}return ch;};
 const wrapG=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){return fn.call(this,o,a);};};
 wrapG('voidPayment',async function(o,a){
  const L=on()&&a[0]==='ar'?ledById(a[1]):null;if(!L)return o.apply(this,a);
  const p=(L.payments||[]).find(x=>x.id===a[2]);
  if(!need('rcptDoc','cancel'))return;
  if(p&&typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk({date:p.date}))return;
  const out=await o.apply(this,a);if(p&&p.cancelled&&!p.cancelAt)p.cancelAt=nowTs();after([L.id]);return out;});
 wrapG('markPaid',async function(o,a){
  const L=on()?ledById(a[0]):null;if(!L)return o.apply(this,a);
  if(MONEY_ONLY){const c=saleOf(L);return say(L.pay&&L.pay.credit?(c?CREDIT_LOCK(c):BILL_LOCK):'รับชำระที่ใบตัดสต็อก '+(c?c.no:L.no)+' (4.1) หรือกด “+ สร้างใบเสร็จรับเงิน” ที่ 4.3');}   /* phase 9a: the old shortcut has no entry while the flow is on */
  const was=!!L.paid,out=await o.apply(this,a);
  if(!was&&L.paid){const rem=r2(receiptTotals(L).net-paidAmtOf(L));   /* the original sets `paid` with no record: write the receiving */
   if(rem>EPS){L.payments=L.payments||[];L.payments.push({id:uid(),date:today(),amt:rem,method:'',bank:'',ref:'',card4:'',chkDate:'',by:meName(),note:'รับชำระเต็มจำนวน',methods:[],transLines:[],payId:'SP'+uid(),payTotal:rem,payBills:1,slipCount:0});}}
  after([L.id],true);return out;});
 wrapG('settleInvoiceDoc',async function(o,a){
  if(!on())return o.apply(this,a);
  const inv=(DB.invoices||[]).find(x=>x.id===a[0]),leds=inv&&inv.srcType==='tax'?(inv.refIds||[]).map(ledById).filter(Boolean):[],len=new Map(leds.map(L=>[L.id,(L.payments||[]).length]));
  if(MONEY_ONLY&&leds.length&&!inv.settled&&!inv.cancelled){   /* phase 9a: an old invoice document over stock cuts receives no money either — the debtor page does */
   say('ใบแจ้งหนี้ '+inv.no+' รับเงินที่นี่ไม่ได้ — ตัดชำระที่หน้าลูกหนี้');
   if(can('doc.payRec')&&window.PKG_SALE_DOCS&&PKG_SALE_DOCS.settleFor)PKG_SALE_DOCS.settleFor(inv.custId,leds.filter(L=>!L.paid&&!L.cancelled).map(L=>L.id));
   return;}
  const out=await o.apply(this,a);
  leds.forEach(L=>(L.payments||[]).slice(len.get(L.id)).forEach(p=>{p.invoiceId=inv.id;}));
  if(leds.length)after(leds.map(L=>L.id),true);return out;});
 ['cancelInvoiceDoc','delInvoiceDoc'].forEach(name=>wrapG(name,async function(o,a){
  if(!on())return o.apply(this,a);
  const inv=(DB.invoices||[]).find(x=>x.id===a[0]),was=!!(inv&&inv.settled&&inv.srcType==='tax'&&!inv.cancelled),ids=was?(inv.refIds||[]).slice():[];
  const out=await o.apply(this,a);
  const gone=inv&&(inv.cancelled||!(DB.invoices||[]).includes(inv));
  if(was&&gone){ids.map(ledById).filter(Boolean).forEach(L=>(L.payments||[]).forEach(p=>{   /* the money that came through this invoice is cancelled with it */
    if(p.cancelled||!(p.invoiceId===inv.id||p.note==='รับชำระผ่านใบแจ้งหนี้ '+inv.no))return;
    Object.assign(p,{cancelled:true,cancelDate:today(),cancelAt:nowTs(),cancelBy:meName(),cancelReason:'ยกเลิกใบแจ้งหนี้ '+inv.no});}));
   after(ids,true);}
  return out;}));
 wrapG('settleBilling',function(o,a){
  if(!on())return o.apply(this,a);
  const b=(DB.billings||[]).find(x=>x.id===a[0]);if(!b)return;
  if(billSyncOne(b)){save();refresh();call('renderBillingList');return;}   /* every bill already settled → the note closes, as "ปิดใบวางบิล" did */
  if(b.cancelled||b.settled)return o.apply(this,a);
  return say(BILL_LOCK);});
 wrapG('confirmSettleBilling',function(o,a){
  if(on()){try{closeModal('mBnPay');}catch(e){}return say(BILL_LOCK);}
  let b=null;try{b=on()?(DB.billings||[]).find(x=>x.id===(0,eval)('bnPayId')):null;}catch(e){}
  const ids=b?(b.receiptIds||[]).slice():[],out=o.apply(this,a);if(ids.length)after(ids);return out;});
 wrapG('cancelBilling',async function(o,a){
  const b=on()?(DB.billings||[]).find(x=>x.id===a[0]):null,ids=b?(b.receiptIds||[]).slice():[],out=await o.apply(this,a);
  if(ids.length){ids.map(ledById).filter(Boolean).forEach(L=>(L.payments||[]).forEach(p=>{if(p.cancelled&&!p.cancelAt)p.cancelAt=nowTs();}));after(ids);}return out;});
 /* a ledger record is cancelled with its SALE (4.4), never as a receipt — except the old counter bills (src:'sale'),
    whose own cancel path still returns the stock: their receipt is now the ledger record, so the stock comes back here */
 wrapG('cancelReceiptDoc',async function(o,a){
  const L=on()?ledById(a[0]):null;if(!L)return o.apply(this,a);
  const c=saleOf(L);
  if(c&&c.src!=='sale')return say('เอกสารนี้เป็นของใบตัดสต็อก '+c.no+' — ยกเลิกที่หน้าตัดสต็อกสินค้า (ยกเลิกการรับชำระก่อน ถ้ามี)');
  const was=!!L.cancelled,out=await o.apply(this,a);
  if(!was&&L.cancelled){
   active(L).forEach(p=>Object.assign(p,{cancelled:true,cancelDate:today(),cancelAt:nowTs(),cancelBy:meName(),cancelReason:'ยกเลิกพร้อมบิล '+(L.legacyNo||L.no)}));
   if(c&&!L.stockReturned){(c.lines||[]).forEach(it=>{const s=DB.stock.find(x=>x.id===it.stockId);if(!s)return;s.qty=n(s.qty)+n(it.qty);s.lastMove=today();
     logMove(s.id,'in',n(it.qty),today(),'คืนสต๊อกจากการยกเลิกบิล '+(L.legacyNo||L.no),c.moveRef);});L.stockReturned=true;}
   if(c){if(!c.cancelled)Object.assign(c,{cancelled:true,cancelReason:'ยกเลิกพร้อมบิล '+(L.legacyNo||L.no),cancelDate:today(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});touchPair(c,L,{live:true});}
   used();save();call('renderStock');refresh();}
  return out;});
 /* opening a ledger record opens its sale */
 const openSale=L=>{const c=saleOf(L);if(!c||typeof window.pkgOpenCut!=='function')return false;['mBill','mReceiptEdit'].forEach(id=>{if($i(id)&&$i(id).classList.contains('on'))closeModal(id);});window.pkgOpenCut(c.id);return true;};
 wrapG('openReceiptById',function(o,a){const L=on()?ledById(a[0]):null;if(L&&openSale(L))return;return o.apply(this,a);});
 wrapG('openBill',function(o,a){const L=on()&&a[0]==='receipt'?ledById(a[1]):null;if(L&&openSale(L))return;return o.apply(this,a);});
 wrapG('billFromQuote',async function(o,a){
  if(!on())return o.apply(this,a);
  const q=typeof findQuote==='function'?findQuote(a[0]):null;if(!q)return;
  const c=SC.activeCut(q);if(c)return window.pkgOpenCut(c.id);
  return SC.openNew(q.id);});
 wrapG('loadFromQuote',function(o,a){
  const out=o.apply(this,a);if(!on())return out;
  try{const r=(0,eval)('R');if(r&&n(r.wht)>0&&!isCo(r)){r.wht=0;if($i('rWht'))$i('rWht').value='0';if(typeof calcReceipt==='function')calcReceipt();}}catch(e){}
  return out;});
 wrapG('saveReceipt',async function(o,a){
  let r=null;try{r=(0,eval)('R');}catch(e){}
  if(on()&&r&&(r.pkgSale||ledById(r.id)))return say('เอกสารนี้สร้างจากใบตัดสต็อก — แก้ไขที่ใบตัดสต็อก (ตัดสต็อกสินค้า) เท่านั้น');
  return o.apply(this,a);});
 /* the receive step of a saved sale (sale-pay.js receive(saleId)) is where a waiting sale is paid: while it does not exist nothing is redirected */
 const payStep=()=>on()&&window.PKG_SALE_PAY&&typeof PKG_SALE_PAY.receive==='function';
 if(typeof ppOutDocs==='function'){const o=ppOutDocs;ppOutDocs=function(){
  const out=o.apply(this,arguments);let ar=false;try{ar=(0,eval)('PP').mode==='ar';}catch(e){}
  return ar&&payStep()?out.filter(x=>!x.d||!x.d.pkgSale||(x.d.pay&&x.d.pay.credit)||x.d.custId):out;};}   /* phase 8: unpaid cash cuts of a KNOWN customer are listed too (combined receipt); a walk-in cut is paid in its own window */
 wrapG('openPartPay',function(o,a){
  if(a[0]==='ar'&&a[2]&&payStep()){const L=ledById(a[2]);if(L&&!(L.pay&&L.pay.credit)&&L.saleId)return PKG_SALE_PAY.receive(L.saleId);}
  return o.apply(this,a);});

 /* ---------- invariants ---------- */
 function verify(){
  const bad=[],R=DB.receipts||[],C=cuts(),leds=R.filter(r=>r&&r.pkgSale),bySale=new Map();
  if(!on()&&!leds.length)return bad;
  leds.forEach(L=>{if(!L.cancelled)(bySale.get(L.saleId)||bySale.set(L.saleId,[]).get(L.saleId)).push(L);});
  const cm=cutIx(),oldId=new Set(),oldSale=new Set(),oldQuote=new Set();
  R.forEach(r=>{if(r&&!r.pkgSale&&!r.cancelled){oldId.add(r.id);if(r.saleId)oldSale.add(r.saleId);if(r.quoteId)oldQuote.add(r.quoteId);}});
  C.forEach(c=>{if(!c||c.cancelled||c.superseded)return;const ls=bySale.get(c.id)||[];
   if(!ls.length&&((c.receiptId&&oldId.has(c.receiptId))||oldSale.has(c.id)||(c.quoteId&&oldQuote.has(c.quoteId))))return;   /* held back for review (two old receipts): still an old-style sale */
   if(ls.length!==1)bad.push('ใบตัดสต็อก '+c.no+': มีรายการบัญชี '+ls.length+' รายการ (ต้องมี 1)');
   else if(c.ledId!==ls[0].id)bad.push('ใบตัดสต็อก '+c.no+': ledId ไม่ตรงกับรายการบัญชี');});
  const nos=new Map(),quotes=new Set();
  leds.forEach(L=>{
   const c=cm.get(L.saleId);
   if(!L.cancelled){
    if(!c)bad.push('รายการบัญชี '+L.no+': ไม่พบใบตัดสต็อก');else if(c.superseded||c.cancelled)bad.push('รายการบัญชี '+L.no+': ชี้ไปที่ใบตัดสต็อก '+c.no+' ซึ่ง'+(c.cancelled?'ถูกยกเลิกแล้ว':'ถูกแทนด้วยฉบับแก้ไข'));
    const paid=receiptTotals(L).net-paidAmtOf(L)<=EPS;if(!!L.paid!==paid)bad.push('รายการบัญชี '+L.no+': สถานะชำระไม่ตรงกับรายการรับเงิน');
    if(c&&!c.cancelled&&!!c.paid!==paid)bad.push('ใบตัดสต็อก '+c.no+': สถานะชำระไม่ตรงกับรายการรับเงิน');
    if(L.quoteId)quotes.add(L.quoteId);
   }
   (L.payments||[]).forEach(p=>{if(!p||p.cancelled)return;
    if(!p.reNo)return;                                                  /* phase 8: a receiving without a receipt is a normal state */
    if(p.src==='legacy'&&p.reNo===(L.legacyNo||L.no))return;
    (nos.get(p.reNo)||nos.set(p.reNo,[]).get(p.reNo)).push(p);});
   if(c&&!c.cancelled&&!c.migr&&!c.legacy&&!L.migr){   /* stock moved once: Σ moves under the chain's number = −(active quantities) */
    const want=new Map(),got=new Map();(c.lines||[]).forEach(it=>want.set(it.stockId,(want.get(it.stockId)||0)+n(it.qty)));
    (DB.moves||[]).forEach(m=>{if(m.refNo===c.moveRef)got.set(m.stockId,(got.get(m.stockId)||0)+n(m.qty));});
    for(const [id,q] of want)if(Math.abs(n(got.get(id))+q)>1e-6){bad.push('ใบตัดสต็อก '+c.no+': จำนวนที่ตัดสต๊อกไม่ตรงกับรายการในใบ');break;}}
  });
  nos.forEach((ps,no)=>{if(ps.length>1&&!(ps.every(p=>p.reShare)&&new Set(ps.map(p=>p.payId)).size===1&&ps[0].payId))bad.push('เลขที่ใบเสร็จ '+no+' ถูกใช้ซ้ำ '+ps.length+' รายการ');});
  R.forEach(r=>{if(r&&!r.pkgSale&&!r.cancelled&&r.quoteId&&quotes.has(r.quoteId))bad.push('ใบเสร็จเดิม '+r.no+': ใบเสนอราคาเดียวกันมีใบตัดสต็อกอยู่แล้ว (นับยอดซ้ำ)');});
  return bad;
 }

 /* ---------- migration ---------- */
 const custLabel=id=>{const cu=id&&typeof findCust==='function'?findCust(id):null;return cu?custName(cu):'ลูกค้าทั่วไป (เงินสด)';};
 /* what happens to each existing sale / receipt. Never mutates (stock-cut.js ensure() must have made the SA records). */
 function classify(){
  SC.ensure();
  const R=DB.receipts||[],C=cuts(),ops=[],cnt={A:0,B:0,C:0,D:0,E:0,F:0,G:0,H:0,I:0,done:0},review=[];
  const byId=new Map(),bySale=new Map(),byQuote=new Map(),claimed=new Map(),held=new Set(),cm=cutIx();
  const add=(m,k,r)=>{const a=m.get(k);if(a)a.push(r);else m.set(k,[r]);};
  R.forEach(r=>{if(!r)return;byId.set(r.id,r);if(r.pkgSale)return;if(r.saleId)add(bySale,r.saleId,r);if(r.quoteId)add(byQuote,r.quoteId,r);});
  const sold=new Set();
  C.forEach(c=>{
   if(!c||c.superseded)return;
   if(c.cancelled){cnt.F++;return;}
   if(led(c)){cnt.done++;if(c.quoteId)sold.add(c.quoteId);return;}
   const rs=[];const put=r=>{if(r&&!r.pkgSale&&!rs.includes(r))rs.push(r);};
   if(c.receiptId)put(byId.get(c.receiptId));(bySale.get(c.id)||[]).forEach(put);if(c.quoteId)(byQuote.get(c.quoteId)||[]).forEach(put);
   const act=rs.filter(r=>!r.cancelled);
   if(act.length>1){act.forEach(r=>held.add(r.id));cnt.H++;review.push({k:'H',no:c.no,text:'ใบตัดสต็อก '+c.no+' มีใบเสร็จที่ยังใช้งานอยู่ '+act.length+' ใบ ('+act.map(r=>r.no).join(', ')+') — ไม่ย้าย ให้ยกเลิกใบที่ซ้ำก่อน'});return;}
   if(act.length===1){const r=act[0],other=claimed.get(r.id);
    if(other){cnt.H++;review.push({k:'H',no:c.no,text:'ใบเสร็จ '+r.no+' ถูกอ้างจากใบตัดสต็อก 2 ใบ ('+other.no+', '+c.no+') — ไม่ย้ายใบหลัง'});return;}
    claimed.set(r.id,c);cnt.A++;ops.push({t:'link',k:'A',sa:c.id,rc:r.id});if(c.quoteId)sold.add(c.quoteId);return;}
   const k=rs.length?'B':(c.pay&&(c.pay.method==='credit'||c.pay.credit))?'D':c.pay?'C':'E';
   cnt[k]++;ops.push({t:'new',k,sa:c.id});if(c.quoteId)sold.add(c.quoteId);
  });
  R.forEach(r=>{if(!r||r.pkgSale||claimed.has(r.id)||held.has(r.id))return;
   if(r.saleId&&!cm.get(r.saleId)&&!r.cancelled){cnt.H++;review.push({k:'H',no:r.no,text:'ใบเสร็จ '+r.no+' อ้างถึงใบตัดสต็อกที่ไม่มีในระบบ — คงไว้เป็นเอกสารเดิม'});return;}
   if(!r.cancelled)cnt.G++;});
  (DB.invoices||[]).forEach(v=>{if(!v||v.cancelled||v.srcType!=='quote')return;const hit=(v.refIds||[]).filter(id=>sold.has(id));
   if(hit.length){cnt.I++;ops.push({t:'inv',k:'I',id:v.id});review.push({k:'I',no:v.no,text:'ใบแจ้งหนี้เดิม '+v.no+' อ้างใบเสนอราคาที่มีใบตัดสต็อกแล้ว — จะถูกยกเลิก (ยอดเดียวกันอยู่ที่ใบตัดสต็อก)'});}});
  return {ops,cnt,review};
 }
 /* undo data: what a record looked like before migration (only the fields that changed) */
 const shot=o=>{const s={};for(const k in o)if(o[k]!==undefined)s[k]=JSON.stringify(o[k]);return s;};
 function undoOf(o,s0){const old={},del=[];
  for(const k in o){if(k==='migr'||o[k]===undefined)continue;if(!(k in s0))del.push(k);else if(s0[k]!==JSON.stringify(o[k]))old[k]=JSON.parse(s0[k]);}
  for(const k in s0)if(!(k in o)||o[k]===undefined)old[k]=JSON.parse(s0[k]);
  return {o:old,del};}
 /* case A: the existing receipt BECOMES the ledger record of its sale (keeps its id and RE number). The receipt wins on
    price / customer; the sale day wins on the date. Works on real records (apply) and on copies (plan). */
 function link(r,c,o){
  o=o||{};const r0=o.undo?shot(r):null,c0=o.undo?shot(c):null;
  const t0=totO(r),net0=t0.net,wht0=n(t0.whtAmt),got0=paidAmtOf(r),act=active(r),ldate=r.date,info={moved:String(r.date).slice(0,7)!==String(c.date).slice(0,7),from:r.date,to:c.date,whtExp:0,sub:''};
  if(n(c.disc)!==n(r.disc))c.disc=n(r.disc);if(n(c.vat)!==n(r.vat))c.vat=n(r.vat);
  const ri=(r.items||[]).filter(filled);if(canon(ri)!==canon(c.items||[]))c.items=clone(ri);
  if((r.custId||'')!==(c.custId||'')){c.custId=r.custId||'';c.vehIdx=r.custId?n(r.vehIdx):-1;}
  else if(r.custId&&n(r.vehIdx)!==(c.vehIdx==null||c.vehIdx<0?0:n(c.vehIdx)))c.vehIdx=n(r.vehIdx);
  c.credit=r.pay&&r.pay.credit?{days:n(r.pay.days),due:r.pay.due||''}:null;
  r.pkgSale=1;r.legacyNo=r.no;r.legacyDate=ldate;
  if(!Array.isArray(r.payments))r.payments=[];
  r.payments.forEach(p=>{if(p&&!p.src)p.src='legacy';});
  const wrec=()=>whtRec(r.wht,r.whtBase,t0.whtBaseAmt,wht0,null);
  if(r.paid){
   if(!act.length){info.sub='a';const p=legacyPay(r.pay,net0,{id:'LG'+r.id,date:r.paidDate||ldate,by:r.by||'',reNo:r.no,br:r.br||''});if(wht0>EPS)p.wht=wrec();r.payments=(r.payments||[]).concat([p]);}
   else{info.sub='b';if(wht0>EPS)act[act.length-1].wht=wrec();
    const short=r2(net0-got0);if(short>EPS)r.payments.push(legacyPay({},short,{id:'LGB'+r.id,date:r.paidDate||ldate,by:r.by||'',note:'ยอดที่ระบบเดิมบันทึกว่ารับครบ (ไม่มีรายการรับเงิน)',br:r.br||''}));}
  }else{info.sub='c';
   if(n(r.wht)>0){c.wht={rate:n(r.wht),base:r.whtBase==='labor'?'labor':'all',auto:false};info.whtExp=wht0;}
   r.inv={no:r.no,date:ldate,legacy:true};}
  r.wht=0;
  syncPair(c,r);touchPair(c,r,{live:false});
  if(o.undo){r.migr=Object.assign({k:'A',sub:info.sub},undoOf(r,r0));c.migr=Object.assign({k:'A'},undoOf(c,c0));}
  return info;
 }
 /* cases B – E: a sale that has no receipt gets a new ledger record on its cut date */
 function make(c,k,o){
  o=o||{};const c0=o.undo?shot(c):null,old=c.pay;
  c.credit=k==='D'||(k==='B'&&old&&(old.method==='credit'||old.credit))?{days:n(old.days),due:old.due||c.date}:null;
  const L=newLed(c,'LD'+c.id);   /* ids made by migration are derived from the sale: the same plan always gives the same records */
  if(k==='C')L.payments.push(legacyPay(old,receiptTotals(L).gross,{id:'LG'+c.id,date:c.date,by:(typeof byShort==='function'&&byShort(c))||'',br:c.br||''}));
  if(!c.credit&&k!=='C')L.inv={no:'',date:c.date,legacy:true};       /* an old open sale: listed as waiting, no new number is issued for it */
  touchPair(c,L,{live:false});
  if(o.undo){L.migr={k,made:1};c.migr=Object.assign({k},undoOf(c,c0));}
  return L;
 }
 /* one pure summary of a receipt list: sales before VAT, cost, documents per month + what is still owed */
 function aggregate(list){
  const months={},tt={base:0,cogs:0,n:0};let ar=0,arN=0;
  for(const r of list||[]){if(!r||r.cancelled)continue;const t=receiptTotals(r),k=String(r.date||'').slice(0,7),m=months[k]||(months[k]={base:0,cogs:0,n:0}),cg=n(cogsOf(r));
   m.base+=t.base;m.cogs+=cg;m.n++;tt.base+=t.base;tt.cogs+=cg;tt.n++;
   if(!r.paid){const rem=Math.max(0,t.net-paidAmtOf(r));if(rem>EPS){ar+=rem;arN++;}}}
  return {months,total:tt,ar,arN};
 }
 /* the plan + a simulation on copies: what the reports will show afterwards. Does not change DB. */
 function plan(){
  const cl=classify(),R=DB.receipts||[],cm=cutIx(),rm=new Map(R.map(r=>[r.id,r])),sim=new Map(),made=[],newly=[],moved=[];let whtExp=0,newOpen=0;
  cl.ops.forEach(op=>{
   const c=cm.get(op.sa);
   if(op.t==='link'){const r=rm.get(op.rc);if(!r||!c)return;const r1=clone(r),info=link(r1,Object.assign({},c));sim.set(r.id,r1);whtExp+=info.whtExp;
    if(info.moved)moved.push({no:r.no,sale:c.no,from:info.from,to:info.to,base:receiptTotals(r1).base});}
   else if(op.t==='new'){if(!c)return;const L=make(Object.assign({},c),op.k),t=receiptTotals(L);made.push(L);
    const rem=L.paid?0:Math.max(0,t.net-paidAmtOf(L));newOpen+=rem;
    newly.push({k:op.k,no:c.no,date:c.date,cust:custLabel(c.custId),base:t.base,gross:t.gross,cogs:n(cogsOf(L)),state:L.paid?'paid':c.pay&&c.pay.method==='credit'?'credit':'wait'});}
  });
  const before=aggregate(R),afterAg=aggregate(R.map(r=>sim.get(r.id)||r).concat(made));
  const nb=newly.reduce((a,x)=>a+x.base,0),nc=newly.reduce((a,x)=>a+x.cogs,0);
  const check={before:before.total.base,newly:nb,after:afterAg.total.base,ok:Math.abs(before.total.base+nb-afterAg.total.base)<0.5&&Math.abs(before.total.cogs+nc-afterAg.total.cogs)<0.5};
  const keys=[...new Set(Object.keys(before.months).concat(Object.keys(afterAg.months)))].filter(Boolean).sort();
  const Z={base:0,cogs:0,n:0},months=keys.map(k=>({ym:k,b:before.months[k]||Z,a:afterAg.months[k]||Z}));
  const y=today().slice(0,4),sumY=(ag)=>Object.keys(ag.months).filter(k=>k.slice(0,4)===y).reduce((a,k)=>({base:a.base+ag.months[k].base,cogs:a.cogs+ag.months[k].cogs,n:a.n+ag.months[k].n}),{base:0,cogs:0,n:0});
  const summary={at:nowTs(),year:y,cnt:cl.cnt,moved:moved.length,newly:newly.length,yearBefore:sumY(before),yearAfter:sumY(afterAg),allBefore:before.total,allAfter:afterAg.total,
   ar:{before:before.ar,after:afterAg.ar,nBefore:before.arN,nAfter:afterAg.arN,whtExp,newOpen},ok:check.ok};
  return {v:1,ops:cl.ops,cnt:cl.cnt,review:cl.review,months,newly,moved,check,summary};
 }
 function exec(ops){
  let done=0;const cm=cutIx();
  (ops||[]).forEach(op=>{
   if(op.t==='inv'){const v=(DB.invoices||[]).find(x=>x.id===op.id);if(!v||v.cancelled||v.migr)return;
    const c=cuts().find(x=>!x.cancelled&&!x.superseded&&(v.refIds||[]).includes(x.quoteId));
    const v0=shot(v);Object.assign(v,{cancelled:true,cancelReason:'แทนด้วยใบแจ้งหนี้ของใบตัดสต็อก '+(c?c.no:''),cancelDate:today()});
    v.migr=Object.assign({k:'I'},undoOf(v,v0));done++;return;}
   const c=cm.get(op.sa);if(!c||c.cancelled||c.superseded||led(c))return;
   if(op.t==='link'){const r=(DB.receipts||[]).find(x=>x.id===op.rc);if(!r||r.pkgSale||r.cancelled)return;link(r,c,{undo:true});bump();done++;}
   else if(op.t==='new'){DB.receipts.push(make(c,op.k,{undo:true}));bump();done++;}
  });
  return done;
 }
 /* executes the plan, sets the switch, saves. Twice = once. */
 function apply(p){
  const first=p&&Array.isArray(p.ops)?p.ops:classify().ops;
  if(on()&&!classify().ops.length)return {ok:true,done:0};
  let done=exec(first);const rest=classify().ops;if(rest.length)done+=exec(rest);
  const f=FLAG()||{};
  DB.pkgSaleFlow=Object.assign({v:1},f,{on:true,since:f.on&&f.since?f.since:today(),at:nowTs(),by:meName(),used:f.on?n(f.used):0,report:(p&&p.summary)||f.report||null});
  delete DB.pkgSaleFlow.stale;
  bump();
  logAudit('stockcut',{id:'',no:'ระบบขายแบบใหม่'},'saleflow','เปิดใช้ระบบขายแบบใหม่ · ปรับเอกสารเดิม '+done+' รายการ');
  save();refresh();
  return {ok:true,done};
 }
 const canRevert=()=>{const f=FLAG();return !!(f&&f.on&&!f.used);};
 function revert(){
  const f=FLAG();if(!f||!f.on)return false;
  if(f.used)return say('มีเอกสารที่ทำในระบบขายแบบใหม่แล้ว — ย้อนกลับด้วยปุ่มนี้ไม่ได้ ให้กู้คืนจากไฟล์สำรองที่บันทึกไว้ก่อนเปิดใช้');
  const back=x=>{const m=x.migr;if(!m)return;Object.keys(m.o||{}).forEach(k=>{x[k]=m.o[k];});(m.del||[]).forEach(k=>{delete x[k];});delete x.migr;};
  let done=0;
  DB.receipts=(DB.receipts||[]).filter(r=>!(r&&r.migr&&r.migr.made));
  DB.receipts.forEach(r=>{if(r&&r.migr){back(r);done++;}});
  cuts().forEach(c=>{if(c&&c.migr){back(c);done++;}});
  (DB.invoices||[]).forEach(v=>{if(v&&v.migr){back(v);done++;}});
  DB.pkgSaleFlow={v:1,on:false,revertedAt:nowTs(),revertedBy:meName()};
  bump();IX=null;CX=null;NOS=null;
  logAudit('stockcut',{id:'',no:'ระบบขายแบบใหม่'},'saleflow','ย้อนกลับไปใช้ระบบขายแบบเดิม · คืนค่าเอกสาร '+done+' รายการ');
  save();refresh();return true;
 }
 /* a backup from before the switch restored over a switched-on database (the original merges with Object.assign, so the
    flag survives while the documents do not): the switch goes off and the page asks again */
 function stale(){return on()&&classify().ops.length>0;}
 if(typeof boot==='function'){const bootO=boot;boot=function(){const r=bootO.apply(this,arguments);try{IX=null;CX=null;NOS=null;if(stale()){DB.pkgSaleFlow.on=false;DB.pkgSaleFlow.stale=today();}}catch(e){}return r;};}

 /* menu numbers used in messages (the 04 sub-menus are re-ordered in phase 5: this is the one place to change them) */
 /* A brand-new empty database starts with the switch OFF as well (owner decides). One constant, read nowhere else:
    set it to true only together with the owner's decision — boot would then switch a database with no documents on. */
 const NEW_DB_DEFAULT=false;
 if(NEW_DB_DEFAULT&&typeof boot==='function'){const b1=boot;boot=function(){const r=b1.apply(this,arguments);try{if(!FLAG()&&!(DB.receipts||[]).length&&!cuts().length&&!(DB.quotes||[]).length)DB.pkgSaleFlow={v:1,on:true,since:today(),at:nowTs(),by:'ระบบ (ฐานข้อมูลใหม่)',used:0};}catch(e){}return r;};}
 /* ---------- phase 7: the pages that read receipts follow the money really received ----------
    Installed HERE (before branch-report.js loads) so its per-branch scope wraps these, not the other way round.
    finance(y): revenue / VAT / cost already count each sale once on the sale day (one ledger record per sale). Cash-in
    and receivables of the original ignore part payments (paid = whole net, unpaid = whole net): for ledger records they
    come from the payments. The object is returned untouched when nothing differs. */
 if(typeof finance==='function'){const fin0=finance;finance=function(y){
  const o=fin0.apply(this,arguments);if(!on()||!o)return o;
  const upto=d=>+String(d||'').slice(0,4)<=y;let dCash=0,dAr=0;
  for(const r of DB.receipts||[]){if(!r||!r.pkgSale||r.cancelled)continue;const t=receiptTotals(r);
   const was=r.paid&&upto(r.date)?t.net:0,now=(r.payments||[]).reduce((a,p)=>a+(p&&!p.cancelled&&upto(p.date)?n(p.amt):0),0);dCash+=now-was;
   if(!r.paid)dAr+=Math.max(0,t.net-paidAmtOf(r))-t.net;}
  if(Math.abs(dCash)<EPS&&Math.abs(dAr)<EPS)return o;
  o.cash+=dCash;o.ar+=dAr;o.assetsTotal+=dCash+dAr;o.equity+=dCash+dAr;
  o.roi=o.ownerCap>0?o.np/o.ownerCap*100:(o.equity>0?o.np/o.equity*100:0);o.roa=o.assetsTotal>0?o.np/o.assetsTotal*100:0;
  return o;};}
 /* 08 รายงานภาษี: "ภาษีถูกหัก ณ ที่จ่าย" of a month = the withholding CONFIRMED in payments received that month. The original
    reads receipts with r.wht > 0 by receipt date (a ledger record has wht 0), so for the duration of the render each
    confirmed withholding is shown to it as one extra record (no lines → no sales, wht only), then the list is put back. */
 if(typeof renderTax==='function'){const rt0=renderTax;renderTax=function(){
  if(!on())return rt0.apply(this,arguments);
  const real=DB.receipts,extra=[];
  (real||[]).forEach(r=>{if(!r||!r.pkgSale||r.cancelled)return;(r.payments||[]).forEach(p=>{if(p&&!p.cancelled&&p.wht&&n(p.wht.amt)>0)
   extra.push({id:'WHT'+p.id,pkgSale:1,no:p.reNo||r.no,date:p.date,custId:r.custId,br:r.br,items:[],disc:0,vat:0,wht:n(p.wht.rate)||1,whtBase:p.wht.base,cancelled:false,paid:true,pay:{},payments:[{amt:0,wht:{amt:n(p.wht.amt),baseAmt:n(p.wht.baseAmt)}}],taxDocs:[]});});});
  if(!extra.length)return rt0.apply(this,arguments);
  DB.receipts=real.concat(extra);try{return rt0.apply(this,arguments);}finally{DB.receipts=real;IX=null;NOS=null;}};}
 /* registers 4.2 / 4.3 / 4.4 (drawn by sale-docs.js, tables from saleflow-build.py): sort keys and phone-card columns, numbered
    BEFORE the ลำดับ column — declared here because row-number.js (loaded later) shifts them once, at its load. */
 if(document.getElementById('sinvTbl')&&typeof SORT_DEF==='object'&&typeof MC_CFG==='object'){
 SORT_DEF.sinvTbl={cols:{0:{lbl:'เลขที่ใบแจ้งหนี้',key:x=>x.no},1:{lbl:'วันที่',key:x=>String(x.date)},2:{lbl:'ใบตัดสต็อก',key:x=>x.c.no},3:{lbl:'ชื่อลูกค้า',key:x=>x.cust},4:{lbl:'ยอดขาย',key:x=>n(x.st.total)},5:{lbl:'รับแล้ว',key:x=>n(x.st.got+x.st.wht)},6:{lbl:'คงค้าง',key:x=>n(x.st.rem)},7:{lbl:'อายุ (วัน)',key:x=>x.open?x.age:-1}}};
 SORT_DEF.srcpTbl={cols:{0:{lbl:'เลขที่ใบเสร็จ',key:x=>x.no},1:{lbl:'วันที่รับเงิน',key:x=>String(x.date)},2:{lbl:'ใบตัดสต็อก',key:x=>x.c?x.c.no:''},3:{lbl:'ชื่อลูกค้า',key:x=>x.cust},4:{lbl:'วิธีชำระ',key:x=>String((x.p.methods||[]).map(m=>m.k).join('+')||x.p.method||'')},5:{lbl:'จำนวนเงิน',key:x=>n(x.p.amt)},6:{lbl:'ผู้รับเงิน',key:x=>String(x.p.by||'')}}};
 SORT_DEF.swhtTbl={cols:{0:{lbl:'วันที่รับเงิน',key:x=>String(x.date)},1:{lbl:'เลขที่ใบเสร็จ',key:x=>x.no},2:{lbl:'ใบตัดสต็อก',key:x=>x.c?x.c.no:''},3:{lbl:'ชื่อลูกค้า',key:x=>x.cust},4:{lbl:'ฐานที่หัก',key:x=>x.base},5:{lbl:'อัตรา',key:x=>x.rate},6:{lbl:'ยอดที่หัก',key:x=>x.amt},7:{lbl:'หนังสือรับรอง',key:x=>x.got?1:0}}};
 SORT_DEF.swhtOutTbl={cols:{0:{lbl:'วันที่',key:v=>String(v.date)},1:{lbl:'เลขที่เอกสาร',key:v=>v.no},2:{lbl:'ผู้รับเงิน',key:v=>v.payee},3:{lbl:'รายการ',key:v=>v.desc},4:{lbl:'ฐานที่หัก',key:v=>v.base},5:{lbl:'ยอดที่หัก',key:v=>v.amt},6:{lbl:'แบบ',key:v=>v.form},7:{lbl:'นำส่งแล้ว',key:v=>v.remit?1:0}}};
 MC_CFG.sinvTbl={pri:[0,3,6],act:8};MC_CFG.srcpTbl={pri:[0,3,5],act:8};MC_CFG.swhtTbl={pri:[1,3,6],act:8};MC_CFG.swhtOutTbl={pri:[2,5],act:8};
 }
 /* phase 10g (owner 12 Oct): the separate tick of phase 9b (doc.invApprove, under "อื่น ๆ" of the staff form) is gone — two
    places for one right. Whoever had it keeps approving: carried over ONCE, silently, into the matrix tick of the invoice
    row (perms.m.rcptDoc_apv) and its stored key apv.invoice; the old key is dropped (twice = once). apv.receipt is left as
    stored — the tick covers both keys, so it follows the next time that staff form is saved. Runs with the program's own
    rights migration (start-up, restore, import). */
 function permCarry(){
  let ch=false;
  (DB.emp||[]).forEach(e=>{const p=e&&e.perms,d=p&&p.doc;if(!d||!Object.prototype.hasOwnProperty.call(d,'invApprove'))return;
   if(d.invApprove){if(!p.apv)p.apv={};p.apv.invoice=true;if(p.m)p.m.rcptDoc_apv=true;}
   delete d.invApprove;ch=true;});
  return ch;
 }
 if(typeof window.migratePerms==='function'){const mp0=window.migratePerms;window.migratePerms=function(){const out=mp0.apply(this,arguments);try{if(permCarry())save();}catch(e){}return out;};
  try{migratePerms=window.migratePerms;}catch(e){}}
 setTimeout(()=>{try{if(permCarry())save();}catch(e){}},0);   /* a database that was started before this module loaded */
 /* menu numbers used in messages: today's four tabs, or the six of the new flow */
 const MENU={cut:'4.4',doc:'4.1',billing:'4.2',tax:'4.3'},MENU_ON={cut:'4.1',inv:'4.2',rcp:'4.3',doc:'4.3',wht:'4.4',billing:'4.5',tax:'4.6'};
 window.PKG_SALE={on,flag:FLAG,led,ledById,saleOf,state,stat,STATE,tot,sync,touch,afterPay,sweep,addPayment,cancelPayment,payError,adjust,adjDel,ADJ_REASONS,
  saveSale,onCreate,canCancel,onCancel,revise,revisePlan,taxOf,setTax,TAX_LOCK,AUTO_TAX,taxOn,issueInv,issueTax,invOf,invOk,invApv,invDead,invPeek,mayInvApv,permCarry,approveInvoice,rejectInvoice,invAll,invCan,createInvoice,cancelInvoice,issueReceipt,noReceipt,stateIs,CREDIT_LOCK,BILL_LOCK,billSync,billRem,billItems,receiptOf,legacyPay,whtDefault,normWht,verify,classify,plan,apply,revert,canRevert,stale,aggregate,
  menu:k=>(on()?MENU_ON:MENU)[k]||'',NEW_DB_DEFAULT,origTotals:totO,adjCheck:adjError,
  canRecv:()=>(!curEmp()||can('m.rcptDoc_add'))&&can('doc.payRec'),canAdjust:()=>!curEmp()||!!can('m.rcptCut_edit'),partialOk:()=>!(FLAG()&&FLAG().partial===false)};
})();
