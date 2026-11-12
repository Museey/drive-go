/* DriveGo new system (accountant B, rounds 2–3, item 8.2; the owner's decisions of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md;
   the posting rules J01–J36 of docs/LEDGER-POSTING.md): the journal of the data that is open (a shop, or one franchise
   branch), built from the documents every time it is asked for — nothing is stored. Each entry: its date, the document
   number, a description and lines {a: account code, dr, cr}; every entry balances. Accounts come from the shop's chart and
   mapping (08 → ผังบัญชี / การผูกบัญชี); the accounts added after round 3 have their own codes until the shop maps them.
   What it reads, row by row of the posting rules:
   · J01–J02 a sale (stock cut and its ledger record, the latest version of a revised sale; cancelled sales post nothing,
     J06–J07) on its day: receivable / parts and labour revenue split by the lines, the bill discount and adjustments
     spread in proportion / output VAT; its cost (FIFO) / stock. Receipts kept from before the sale flow: the same.
   · J03–J05 each payment received: cash (เงินสด) or bank (โอน บัตร เช็ค), withholding certificate, the card fee as other
     income with its VAT inside, on the day paid.
   · J08 J34 J35 credit and debit notes in their month; the money paid back on the day it took effect; a cancelled one posts
     only the money paid back (the customer owes it again).
   · J09–J11 goods received once approved (stock and input VAT / payables), payments to vendors with withholding.
   · J12–J13 expenses (paid at once, or owed then paid), J14–J17 payroll periods, salaries paid, social security and
     ภ.ง.ด.1 remitted, J33 ภ.ง.ด.3 / 53 remitted with a payment voucher.
   · J18–J20 J36 assets bought (cash or credit, then paid), depreciation per month, written off (loss 6140), sold
     (gain 4040 / loss 6140).
   · J21–J24 stock counts (shortage, surplus, shortage moved to cost of sales) and internal issues, on the day the stock
     moved; J30 a customer claim's replacement (cost of sales); J31 a vendor claim's credit or loss.
   · Stock that moved with no document at all (a quantity typed into the register, older data) is booked against the
     owner's capital both ways, like the stock that was there before; stock taken out by a repair quote's approval in
     the legacy app and never billed is not booked (the ledger page tells the difference from the stock register).
   · J27–J28 the capital menu (no document number; cash taken to the bank and back, 76-cash-bank.js); J29 each month that has ended (and one closed early in the tax
     report): output VAT less input VAT to VAT payable (2040), or input VAT left over carried as 1055; the shop's stock that was there before the documents ("ยอดยกมา") and
     stock from the franchise HQ / the chain's DC (to payables, J26 for now).
   PKG_LEDGER.entries() → the entries; .account(code, from, to) → opening balance, lines with running balance, totals;
   .balances(to) → every account's debit / credit up to a day; .check() → entries that do not balance (none expected). */
(function(){
 if(typeof DB==='undefined'||typeof receiptTotals!=='function'||typeof DEFAULT_MAP==='undefined')return;
 const r2=v=>Math.round((+v||0)*100)/100,EPS=0.005;
 /* a month as people say it: 2026-10 → ตุลาคม 2569 */
 const moTh=mo=>(typeof TH_M_FULL!=='undefined'?TH_M_FULL[+mo.slice(5,7)-1]:mo.slice(5,7))+' '+(+mo.slice(0,4)+543);
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT;
 /* accounts the system posts to that a shop's chart may not have (accountant round 3, owner 2026-11-11): 1055 for input
    VAT carried to the next month, 4040 / 6140 for an asset sold or written off (instead of 4030 / 6190). They are not
    added to the shop's chart (only the chart right may change it, and shops use these codes for their own accounts:
    the chart's own prompt suggests 6140): reports show them under these names when something is posted to them. A
    code the shop already uses for another account gives way to the next free code (6140 → 6141 …); the mapping
    (DB.map[key]) wins when a shop sets one. */
 const NEW={vatDue:['2040','ภาษีมูลค่าเพิ่มค้างชำระ','liab'],vatClaim:['1055','ลูกหนี้กรมสรรพากร','asset'],
  gainAsset:['4040','กำไรจากการจำหน่ายสินทรัพย์','revenue'],lossAsset:['6140','ขาดทุนจากการจำหน่ายสินทรัพย์','expense']};
 function sys(k){
  const m=DB.map&&DB.map[k];if(m)return m;const [c,nm]=NEW[k],coa=DB.coa||[];
  const other=code=>{const a=coa.find(x=>x.code===code);return !!a&&a.name!==nm;};
  if(!other(c))return c;
  for(let i=1;i<100;i++){const x=String(+c+i);if(!coa.some(a=>a.code===x)&&!Object.values(NEW).some(s=>s[0]===x))return x;}
  return c;}
 const sysOf=code=>Object.keys(NEW).find(k=>sys(k)===code);
 const A=k=>NEW[k]?sys(k):((DB.map&&DB.map[k])||DEFAULT_MAP[k]||'');
 const dflt=code=>DEFAULT_COA.find(x=>x.code===code);
 const nameOf=code=>{if(!code)return '';const n=accName(code);if(n)return n;const k=sysOf(code);if(k)return NEW[k][1];return (dflt(code)||{}).name||'';};
 const typeOf=code=>{const a=(DB.coa||[]).find(x=>x.code===code);if(a)return a.type;const k=sysOf(code);if(k)return NEW[k][2];return (dflt(code)||{}).type||'';};
 /* where money went in or out: cash, or the bank for a transfer, a card or a cheque; unknown → cash, as the trial balance */
 const MONEY={cash:'cash',trans:'bank',card:'bank',check:'bank',chk:'bank'};
 const accOfKey=k=>A(MONEY[k]||'cash');
 const accOfLabel=t=>A(/โอน|เช็ค|บัตร|trans|card|check/.test(String(t||''))?'bank':'cash');
 const custOf=id=>{const c=id&&typeof findCust==='function'?findCust(id):null;return c&&typeof custName==='function'?custName(c):'';};
 const venOf=id=>{const v=(DB.vendors||[]).find(x=>x.id===id);return v?v.name:'';};
 const monthEnd=mo=>{const [y,m]=mo.split('-').map(Number);return mo+'-'+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0');};
 const fifo=()=>DB.fifo||{lots:[],allocs:[]};
 const rem=a=>n(a.qty)-n(a.back);
 const allocCost=no=>{let v=0,d='';(fifo().allocs||[]).forEach(a=>{if(a&&a.refNo===no){v+=rem(a)*n(a.cost);if(!d||a.date<d)d=a.date;}});return {v:r2(v),date:d};};

 function entries(o){
  const out=[];
  const E=(date,no,desc,src)=>{const e={date:String(date||'').slice(0,10),no:no||'',desc:desc||'',src:src||'',lines:[]};
   e.dr=(a,v)=>{v=r2(v);if(a&&Math.abs(v)>=EPS)e.lines.push(v>0?{a,dr:v,cr:0}:{a,dr:0,cr:-v});return e;};
   e.cr=(a,v)=>{v=r2(v);if(a&&Math.abs(v)>=EPS)e.lines.push(v>0?{a,dr:0,cr:v}:{a,dr:-v,cr:0});return e;};
   out.push(e);return e;};
  const sales=new Set();

  /* ---------- J01–J02 sales; J03–J05 payments received ---------- */
  function sale(L,c){
   const t=receiptTotals(soldAs(L)),date=L.date||(c&&c.date),no=c?c.no:(L.no||''),who=custOf(L.custId);
   const lab=t.sub>EPS?r2(t.base*n(t.labor)/t.sub):0;
   E(date,no,'ขาย'+(who?' · '+who:''),'sale').dr(A('ar'),t.gross).cr(A('revLabor'),lab).cr(A('revParts'),r2(t.base)-lab).cr(A('vatOut'),t.vat);
   const cost=typeof cogsOf==='function'?r2(cogsOf(L)):0;
   if(cost>EPS)E(date,no,'ต้นทุนขาย'+(who?' · '+who:''),'cogs').dr(A('cogs'),cost).cr(A('inv'),cost);
  }
  function received(L,c){
   const who=custOf(L.custId),sno=c?c.no:(L.no||'');
   /* a receipt from before the sale flow: its withholding is a % of the receipt, with the payment that settled it */
   const live=(L.payments||[]).filter(p=>p&&!p.cancelled),oldWht=!L.pkgSale&&L.paid?r2(receiptTotals(L).whtAmt):0,last=live[live.length-1];
   live.forEach(p=>{
    let ms=p.methods&&p.methods.length?p.methods:[{k:p.method||'cash',amt:p.amt}];
    const sum=r2(ms.reduce((a,m)=>a+n(m.amt),0));
    if(sum>EPS&&Math.abs(sum-n(p.amt))>0.01){const f=n(p.amt)/sum;ms=ms.map(m=>Object.assign({},m,{amt:r2(n(m.amt)*f),fee:r2(n(m.fee)*f)}));}
    const wht=p.wht?r2(p.wht.amt):p===last?oldWht:0,e=E(p.date,p.reNo||sno,'รับชำระ '+sno+(who?' · '+who:''),'pay');
    let got=0;ms.forEach((m,i)=>{const v=i===ms.length-1?r2(n(p.amt)-got):r2(m.amt);got=r2(got+v);e.dr(accOfKey(m.k),v);});
    e.dr(A('whtIn'),wht).cr(A('ar'),r2(n(p.amt)+wht));
    const fee=r2(ms.filter(m=>m.k==='card').reduce((a,m)=>a+n(m.fee),0));
    if(fee>EPS){const rate=n(L.vat),vat=rate>0?r2(fee*rate/(100+rate)):0;
     E(p.date,p.reNo||sno,'ค่าธรรมเนียมบัตรที่เก็บจากลูกค้า '+sno,'fee').dr(A('bank'),fee).cr(A('revOther'),r2(fee-vat)).cr(A('vatOut'),vat);}
   });
  }
  if(S&&SC&&S.on&&S.on()){
   SC.list().forEach(c=>{if(!c||c.cancelled||c.superseded)return;const L=S.led(c);if(!L||sales.has(L.id))return;sales.add(L.id);sale(L,c);received(L,c);});
  }
  /* receipts from before the sale flow (and any ledger record whose sale was not listed above) */
  (DB.receipts||[]).forEach(r=>{if(!r||r.cancelled||sales.has(r.id))return;
   if(r.pkgSale){const c=S&&S.saleOf?S.saleOf(r):null;if(c&&(c.cancelled||c.superseded))return;sales.add(r.id);sale(r,c);received(r,c);return;}
   sale(r,null);
   if((r.payments||[]).length){received(r,null);return;}
   if(!r.paid)return;
   const t=receiptTotals(r),pay=r.pay||{},k=pay.cash?'cash':(pay.trans||pay.card||pay.chk)?'trans':'cash';
   const e=E(r.paidDate||r.date,r.no,'รับชำระ '+(r.no||''),'pay').dr(accOfKey(k),r2(t.net)).dr(A('whtIn'),r2(t.whtAmt)).cr(A('ar'),r2(t.net+t.whtAmt));
   if(n(t.fee)>EPS){const rate=n(r.vat),vat=rate>0?r2(t.fee*rate/(100+rate)):0;
    E(r.paidDate||r.date,r.no,'ค่าธรรมเนียมบัตรที่เก็บจากลูกค้า '+(r.no||''),'fee').dr(A('bank'),t.fee).cr(A('revOther'),r2(t.fee-vat)).cr(A('vatOut'),vat);}
   void e;
  });

  /* ---------- J08 J34 J35 credit and debit notes ---------- */
  const CN=window.PKG_CREDIT_NOTE;
  (DB.creditNotes||[]).forEach(x=>{if(!x)return;
   const deb=x.type==='debit',ok=CN?CN.done(x):(x.apv&&x.apv.status==='approved'&&!x.voided);
   const c=SC&&SC.list?SC.list().find(z=>z.id===x.saleId):null,L=c&&S?S.led(c):null,who=custOf(x.custId);
   const tt=L?receiptTotals(soldAs(L)):null,labShare=tt&&tt.sub>EPS?n(tt.labor)/tt.sub:0;
   const lab=deb||x.kind!=='ret'?r2(n(x.base)*labShare):0,parts=r2(n(x.base)-lab);
   const refund=x.money?r2(x.money.refund):0,rday=(x.apv&&x.apv.date)||x.date;
   if(ok){
    if(deb)E(x.date,x.no,'ใบเพิ่มหนี้ '+(x.saleNo||'')+(who?' · '+who:''),'dn').dr(A('ar'),x.gross).cr(A('revLabor'),lab).cr(A('revParts'),parts).cr(A('vatOut'),x.vat);
    else{
     E(x.date,x.no,'ใบลดหนี้ '+(x.saleNo||'')+(who?' · '+who:''),'cn').dr(A('revLabor'),lab).dr(A('revParts'),parts).dr(A('vatOut'),x.vat).cr(A('ar'),x.gross);
     const back=allocBack(x);if(back>EPS)E(x.date,x.no,'สินค้ารับคืนตามใบลดหนี้','cnstock').dr(A('inv'),back).cr(A('cogs'),back);
    }}
   /* money paid back: on the day it took effect; it stays paid when the note is cancelled (the customer owes it again) */
   if(!deb&&refund>EPS&&(ok||x.voided))E(rday,x.no,'คืนเงินลูกค้าตามใบลดหนี้'+(who?' · '+who:''),'refund').dr(A('ar'),refund).cr(A(x.money.method==='trans'?'bank':'cash'),refund);
  });
  /* the cost of goods that came back on a credit note: what its allocations gave back (09.js restore) under the sale's ref */
  function allocBack(x){let v=0;(x.lines||[]).forEach(l=>{if(l.stock==='waste')return;
    const c=SC&&SC.list?SC.list().find(z=>z.id===x.saleId):null,ref=c&&c.moveRef;
    const al=(fifo().allocs||[]).filter(a=>a&&a.refNo===ref&&a.stockId===l.stockId);
    const q=al.reduce((t,a)=>t+n(a.qty),0);if(q>EPS)v+=n(l.qty)*al.reduce((t,a)=>t+n(a.qty)*n(a.cost),0)/q;});
   return r2(v);}

  /* ---------- J09–J11 goods received and vendor payments ---------- */
  (DB.purchases||[]).forEach(p=>{if(!p||p.cancelled||!p.posted)return;
   const t=grTotals(p),who=venOf(p.vendorId);
   E(p.date,p.no,'รับสินค้า'+(who?' · '+who:'')+(p.inv?' · ใบกำกับ '+p.inv:''),'gr').dr(A('inv'),t.base).dr(A('vatIn'),t.vat).cr(A('ap'),r2(t.total));
   const pays=(p.payments||[]).filter(x=>x&&!x.cancelled);
   pays.forEach(x=>{const wht=x.wht?r2(x.wht.amt):0;const e=E(x.date,x.pvNo||p.no,'จ่ายเจ้าหนี้ '+p.no+(who?' · '+who:''),'vpay').dr(A('ap'),r2(n(x.amt)+wht));
    const ms=x.methods&&x.methods.length?x.methods:[{k:x.method||'cash',amt:x.amt}];let got=0;
    ms.forEach((m,i)=>{const v=i===ms.length-1?r2(n(x.amt)-got):r2(m.amt);got=r2(got+v);e.cr(accOfKey(m.k),v);});e.cr(A('whtOut'),wht);});
   if(!pays.length&&p.paid)E(p.payDate||p.date,p.pvNo||p.no,'จ่ายเจ้าหนี้ '+p.no+(who?' · '+who:''),'vpay').dr(A('ap'),r2(t.total)).cr(accOfLabel(p.payMethod),r2(t.total));
  });

  /* ---------- J12–J13 expenses; J14–J17 payroll ---------- */
  (DB.expenses||[]).forEach(x=>{if(!x||x.payroll)return;
   const t=expTotals(x),acc=expAcc(x.cat),who=x.payee||'',d=x.date,pd=x.paid?(x.payDate||x.date):'';
   const desc=(x.desc||x.cat||'ค่าใช้จ่าย')+(who?' · '+who:'');
   if(x.paid&&pd===d){E(d,x.pvNo||x.no,desc,'exp').dr(acc,t.base).dr(A('vatIn'),t.vat).cr(accOfLabel(x.method),r2(t.net)).cr(A('whtOut'),r2(t.wht));return;}
   E(d,x.no,desc,'exp').dr(acc,t.base).dr(A('vatIn'),t.vat).cr(A('accrued'),r2(t.gross));
   if(x.paid)E(pd,x.pvNo||x.no,'จ่าย '+desc,'exppay').dr(A('accrued'),r2(t.gross)).cr(accOfLabel(x.method),r2(t.net)).cr(A('whtOut'),r2(t.wht));
  });
  const PR=window.PKG_PAYROLL,exp=id=>(DB.expenses||[]).find(x=>x.id===id);
  (PR&&PR.periods?PR.periods():(DB.payroll||[])).forEach(p=>{if(!p||p.cancelled)return;
   const T=p.totals||{},tax=n(T.tax),lbl=p.label||p.month;
   E(p.date,p.payNo,'บันทึกเงินเดือน '+lbl,'payroll').dr(A('payroll'),T.gross).dr(A('ssoEr'),T.er).cr(A('sso'),r2(n(T.emp)+n(T.er))).cr(A('whtOut'),tax).cr(A('accrued'),T.net);
   const e1=exp(p.payId),e2=exp(p.ssoId);
   if(e1&&e1.paid)E(e1.payDate||p.date,e1.pvNo||p.payNo,'จ่ายเงินเดือน '+lbl,'salary').dr(A('accrued'),T.net).cr(accOfLabel(e1.method),T.net);
   if(e2&&e2.paid)E(e2.payDate||p.date,e2.pvNo||p.ssoNo,'นำส่งเงินสมทบประกันสังคม '+lbl,'sso').dr(A('sso'),r2(n(T.emp)+n(T.er))).cr(accOfLabel(e2.method),r2(n(T.emp)+n(T.er)));
   if(p.taxRemit&&p.taxRemit.date&&tax>EPS)E(p.taxRemit.date,p.taxRemit.pvNo||'','นำส่ง ภ.ง.ด.1 '+lbl,'pnd1').dr(A('whtOut'),tax).cr(accOfLabel(p.taxRemit.method),tax);
  });
  /* J33: withholding remitted to the Revenue Department with a payment voucher (69-pnd-remit.js), one entry per voucher */
  const WO=window.PKG_WHT_OUT;
  if(WO&&WO.all){const by=new Map();
   WO.all().forEach(v=>{const w=v&&v.x&&v.x.whtRemit;if(!w||!w.done||!w.pvNo)return;
    const g=by.get(w.pvNo)||{date:w.date,method:w.method,form:w.form||v.form,mo:w.mo,amt:0};g.amt=r2(g.amt+n(v.amt));by.set(w.pvNo,g);});
   by.forEach((g,no)=>E(g.date,no,'นำส่ง ภ.ง.ด.'+(g.form||'')+(g.mo?' เดือน '+g.mo:''),'pnd').dr(A('whtOut'),g.amt).cr(accOfLabel(g.method),g.amt));}

  /* ---------- J18–J20 J36 assets ---------- */
  const AS=window.PKG_ASSETS;
  if(AS&&AS.purchases)AS.purchases().forEach(P=>{if(P.cancelled)return;const h=P.h,who=venOf(h.vendorId)||h.vendor||'';
   const isNew=h.term==='cash'||h.term==='credit';
   const e=E(h.date,h.no,'ซื้อสินทรัพย์'+(who?' · '+who:''),'asset');
   P.lines.forEach(a=>e.dr(assetAcc(a.cat)[0],n(a.cost)));e.dr(A('vatIn'),P.vat);
   if(!isNew){e.cr(A('cash'),P.total);return;}
   e.cr(A('ap'),P.total);
   (h.payments||[]).filter(x=>x&&!x.cancelled).forEach(x=>{const wht=x.wht?r2(x.wht.amt):0;
    const pe=E(x.date,x.pvNo||h.no,'จ่ายค่าสินทรัพย์ '+(h.no||'')+(who?' · '+who:''),'apay').dr(A('ap'),r2(n(x.amt)+wht));
    const ms=x.methods&&x.methods.length?x.methods:[{k:x.method||'cash',amt:x.amt}];let got=0;
    ms.forEach((m,i)=>{const v=i===ms.length-1?r2(n(x.amt)-got):r2(m.amt);got=r2(got+v);pe.cr(accOfKey(m.k),v);});pe.cr(A('whtOut'),wht);});
  });
  /* depreciation month by month (the year rounded as the asset register rounds it), up to today */
  const today=iso(),ty=+today.slice(0,4),dep=new Map();
  (DB.assets||[]).forEach(a=>{if(!a||a.cancelled||!a.date||!AS||!AS.monthDep)return;const y0=+String(a.date).slice(0,4);
   for(let y=y0;y<=ty;y++){const yr=assetDep(a,y),want=r2(n(yr.accEnd)-n(yr.accBefore));if(!(want>EPS))continue;
    const ms=[];for(let m=1;m<=12;m++){const v=AS.monthDep(a,y,m);if(v>0)ms.push([m,r2(v)]);}
    if(!ms.length)continue;const got=r2(ms.reduce((t,x)=>t+x[1],0));ms[ms.length-1][1]=r2(ms[ms.length-1][1]+want-got);
    const acc=assetAcc(a.cat)[1];
    ms.forEach(([m,v])=>{const mo=y+'-'+String(m).padStart(2,'0'),k=mo,o=dep.get(k)||{};o[acc]=r2((o[acc]||0)+v);dep.set(k,o);});}});
  [...dep.keys()].sort().forEach(mo=>{const o=dep.get(mo),tot=r2(Object.values(o).reduce((t,v)=>t+v,0));if(!(tot>EPS))return;
   const end=monthEnd(mo),d=end>today?today:end,e=E(d,'','ค่าเสื่อมราคา '+moTh(mo),'dep').dr(A('dep'),tot);Object.entries(o).forEach(([acc,v])=>e.cr(acc,v));});
  (DB.assets||[]).forEach(a=>{if(!a||a.cancelled||a.status!=='sold'||!a.out)return;
   const y=+String(a.out).slice(0,4),d=assetDep(a,y),[ac,dc]=assetAcc(a.cat),left=r2(n(a.cost)-n(d.accEnd));
   if(a.sale){const s=a.sale,who=custOf(s.custId)||s.buyer||'',gain=r2(n(s.base)-left);
    E(s.date||a.out,s.taxNo||a.no,'ขายสินทรัพย์ '+(a.name||'')+(who?' · '+who:''),'asale').dr(accOfLabel(s.method),s.gross).dr(dc,d.accEnd)
     .dr(A('lossAsset'),gain<0?-gain:0).cr(ac,a.cost).cr(A('vatOut'),s.vat).cr(A('gainAsset'),gain>0?gain:0);}
   else E(a.out,a.no,'จำหน่ายสินทรัพย์ '+(a.name||''),'aout').dr(dc,d.accEnd).dr(A('lossAsset'),left).cr(ac,a.cost);
  });

  /* ---------- J21–J24 stock counts and issues; J30–J31 claims ---------- */
  (DB.stockCounts||[]).forEach(d=>{if(!d||!d.no||!d.applied||d.cancelled)return;
   const o=allocCost(d.no),lot=(fifo().lots||[]).filter(l=>l&&l.refNo===d.no&&l.src==='count');
   const gain=r2(lot.reduce((t,l)=>t+n(l.qty)*n(l.cost),0)),moved=movedOf(d),date=o.date||(lot[0]&&lot[0].date)||d.date;
   if(o.v>EPS)E(date,d.no,'สินค้าขาดจากการตรวจนับ','count').dr(expAcc('สินค้าขาดจากการตรวจนับ'),r2(o.v-moved)).dr(A('cogs'),moved).cr(A('inv'),o.v);
   if(gain>EPS)E(date,d.no,'สินค้าเกินจากการตรวจนับ','count').dr(A('inv'),gain).cr(A('revOther'),gain);
  });
  function movedOf(d){let v=0;(d.toCogs||[]).forEach(x=>{const al=(fifo().allocs||[]).filter(a=>a&&a.refNo===d.no&&a.stockId===x.stockId&&rem(a)>1e-6);
   const q=al.reduce((t,a)=>t+rem(a),0);if(q>1e-6)v+=n(x.qty)*al.reduce((t,a)=>t+rem(a)*n(a.cost),0)/q;});return r2(v);}
  (DB.issues||[]).forEach(d=>{if(!d||!d.no||!d.deducted||d.cancelled)return;const o=allocCost(d.no);
   if(o.v>EPS)E(o.date||d.date,d.no,'เบิกใช้ภายใน'+(d.expCat?' · '+d.expCat:''),'issue').dr(expAcc(d.expCat||'ค่าซ่อมแซมและบำรุงรักษา'),o.v).cr(A('inv'),o.v);});
  (DB.custClaims||[]).forEach(c=>{if(!c||c.cancelled||c.status!=='done'||!c.cut||c.cutUndone)return;const o=allocCost(c.no);
   if(o.v>EPS)E(o.date||c.doneAt||c.date,c.no,'เปลี่ยนสินค้าตามเคลมลูกค้า'+(custOf(c.custId)?' · '+custOf(c.custId):''),'cclaim').dr(A('cogs'),o.v).cr(A('inv'),o.v);});
  const vatRate=typeof vatDefault==='function'?n(vatDefault()):7;
  (DB.claims||[]).forEach(c=>{if(!c||c.cancelled||!c.deducted)return;const who=venOf(c.vendorId),day=c.restockDate||c.date;
   let credit=0,loss=0;(c.items||[]).forEach(it=>{const r=it&&it.result;if(!r)return;
    if(r.t==='credit')credit+=n(r.amt);else if(r.t==='loss')loss+=n(r.qty)*n(it.cost);});
   credit=r2(credit||n(c.creditAmt));loss=r2(loss);
   if(credit>EPS){const vat=r2(credit*vatRate/100);E(day,c.no,'ผู้ขายลดหนี้ตามเคลม'+(who?' · '+who:''),'vclaim').dr(A('ap'),r2(credit+vat)).cr(A('inv'),credit).cr(A('vatIn'),vat);}
   if(loss>EPS)E(day,c.no,'สินค้าเคลมตีเป็นของเสีย'+(who?' · '+who:''),'vclaim').dr(expAcc('ค่าใช้จ่ายเบ็ดเตล็ด'),loss).cr(A('inv'),loss);
  });

  /* ---------- J27–J28 capital menu ---------- */
  const CAP={invest:['เงินลงทุน','cash','capital'],draw:['ถอนทุน','draw','cash'],loan:['กู้ยืม','cash','loan'],repay:['คืนเงินกู้','loan','cash'],
   other_in:['รายรับอื่น','cash','revOther'],other_out:['รายจ่ายอื่น','other','cash'],
   /* cash taken to the bank and back (76-cash-bank.js, owner 2026-11-12) */
   deposit:['ฝากเงินสดเข้าธนาคาร','bank','cash'],withdraw:['ถอนเงินจากธนาคารเป็นเงินสด','cash','bank']};
  (DB.capital||[]).forEach(x=>{const k=x&&CAP[x.type];if(!k)return;const v=r2(x.amt),acc=r=>r==='other'?expAcc('ค่าใช้จ่ายเบ็ดเตล็ด'):A(r);
   /* J28 other income / expense (74-other-income.js): the account chosen, the VAT inside the amount */
   if(x.type==='other_in'||x.type==='other_out'){const vat=r2(x.vat),base=vat>EPS?r2(x.base):v,a=x.acc||acc(x.type==='other_in'?'revOther':'other');
    const e=E(x.date,x.taxNo||x.inv||'',k[0]+(x.note?' · '+x.note:'')+(x.buyer||x.payee?' · '+(x.buyer||x.payee):''),'cap');
    if(x.type==='other_in')e.dr(A('cash'),v).cr(a,base).cr(A('vatOut'),vat);else e.dr(a,base).dr(A('vatIn'),vat).cr(A('cash'),v);return;}
   E(x.date,'',k[0]+(x.note?' · '+x.note:''),'cap').dr(acc(k[1]),v).cr(acc(k[2]),v);});

  /* ---------- stock that was there before the documents, and stock from the franchise HQ / the chain's DC ---------- */
  const open=new Map();
  (fifo().lots||[]).forEach(l=>{if(!l)return;const v=r2(n(l.qty)*n(l.cost));if(!(v>EPS))return;
   if(l.src==='open'){const d=String(l.date||'')==='0000-00-00'?'':String(l.date||'');open.set(d,r2((open.get(d)||0)+v));return;}
   const ref=String(l.refNo||'');
   if(l.src==='in'&&(/^DC-/.test(ref)||((typeof FR!=='undefined'&&FR&&FR.reqs)||[]).some(q=>q&&q.no===ref)))E(l.date,ref,'รับสินค้าจาก'+(/^DC-/.test(ref)?'ศูนย์กระจายสินค้าของเครือ':'สำนักงานใหญ่'),'hq').dr(A('inv'),v).cr(A('ap'),v);});
  const fix=new Map();
  (fifo().allocs||[]).forEach(a=>{if(!a||a.refNo)return;const v=r2(rem(a)*n(a.cost));if(!(v>EPS))return;const d=String(a.date||'');fix.set(d,r2((fix.get(d)||0)+v));});
  fix.forEach((v,d)=>E(d,'','ปรับยอดสินค้าลด (ไม่มีเอกสารต้นทาง)','fix').dr(A('capital'),v).cr(A('inv'),v));
  const lotted=new Set((fifo().lots||[]).map(l=>l&&l.stockId)),cut=new Set((fifo().allocs||[]).map(a=>a&&a.stockId));
  (DB.stock||[]).forEach(s=>{if(!s||lotted.has(s.id)||cut.has(s.id))return;const v=r2(Math.max(0,n(s.qty))*n(s.cost));if(v>EPS)open.set('',r2((open.get('')||0)+v));});
  open.forEach((v,d)=>E(d,'','ยอดยกมา · สินค้าคงเหลือ','open').dr(A('inv'),v).cr(A('capital'),v));

  /* ---------- J32 the opening balances (73-opening.js): the books start on their day ---------- */
  /* what was before that day is the opening entry the shop typed (its trial balance on the day before): every entry
     dated earlier is left out, the VAT months before it are not closed and input VAT carried starts from its 1055 */
  const OP=!(o&&o.raw)&&DB.opening&&DB.opening.date?DB.opening:null;   /* raw: as if the shop had none (73-opening.js fills from it) */
  if(OP){for(let i=out.length-1;i>=0;i--)if(!(out[i].date>=OP.date))out.splice(i,1);
   const e=E(OP.date,'','ยอดยกมา','opening');(OP.lines||[]).forEach(l=>{if(!l||!l.a)return;e.dr(l.a,n(l.dr));e.cr(l.a,n(l.cr));});}

  /* ---------- J29 a closed VAT month: output VAT less input VAT ---------- */
  /* every month that has ended (a VAT return is filed for each), and a month closed early in the tax report */
  const TP=DB.taxPeriods||{},cur=today.slice(0,7),start=OP?OP.date.slice(0,7):'';
  const vm=new Set(Object.keys(TP).filter(mo=>TP[mo]&&TP[mo].closed&&mo>=start));
  out.forEach(e=>{const mo=e.date.slice(0,7);if(mo&&mo<cur&&e.lines.some(l=>l.a===A('vatOut')||l.a===A('vatIn')))vm.add(mo);});
  const closed=[...vm].sort();
  if(closed.length){let carry=0;
   if(OP)(OP.lines||[]).forEach(l=>{if(l&&l.a===A('vatClaim'))carry=r2(carry+n(l.dr)-n(l.cr));});
   closed.forEach(mo=>{let outV=0,inV=0;
    out.forEach(e=>{if(e.date.slice(0,7)!==mo||e.src==='vat')return;e.lines.forEach(l=>{if(l.a===A('vatOut'))outV+=l.cr-l.dr;else if(l.a===A('vatIn'))inV+=l.dr-l.cr;});});
    outV=r2(outV);inV=r2(inV);const due=r2(outV-inV-carry),end=monthEnd(mo);
    const e=E(end,'','ปิดงวดภาษีมูลค่าเพิ่ม (ภ.พ.30) '+moTh(mo),'vat').dr(A('vatOut'),outV).cr(A('vatIn'),inV);
    if(due>=0){e.cr(A('vatClaim'),carry).cr(A('vatDue'),due);carry=0;}else{const now=r2(-due);e.dr(A('vatClaim'),r2(now-carry));carry=now;}});}
  /* ---------- J29 ภ.พ.30 paid (72-vat-remit.js): DB.taxPeriods[mo].remit ---------- */
  Object.keys(TP).sort().forEach(mo=>{const r=TP[mo]&&TP[mo].remit,v=r2(r&&r.amt);if(!r||!r.done||!r.pvNo||!(v>EPS)||(OP&&!(String(r.date)>=OP.date)))return;
   E(r.date,r.pvNo,'นำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) '+moTh(mo),'vatpay').dr(A('vatDue'),v).cr(accOfLabel(r.method),v);});

  out.forEach(e=>{e.dr=undefined;e.cr=undefined;delete e.dr;delete e.cr;e.lines=e.lines.filter(l=>l.dr>=EPS||l.cr>=EPS);});
  /* by day; within a day in the order the documents were built (a sale before its payment, a document before its cost) */
  return out.filter(e=>e.lines.length).sort((a,b)=>a.date.localeCompare(b.date)||(a.src==='opening'?-1:b.src==='opening'?1:0));   /* the opening balances first on their day */
 }

 /* ---------- reading the journal ---------- */
 const isPL=code=>['revenue','cogs','expense'].includes(typeOf(code));
 const debitSide=code=>['asset','cogs','expense'].includes(typeOf(code));
 /* an account between two days: what was there before (a profit-and-loss account starts again each 1 January — its
    earlier years are in 3030 กำไร (ขาดทุน) สะสม), each line with the running balance, and the totals */
 function account(code,from,to,list){
  const es=list||entries(),y0=String(from||'').slice(0,4)+'-01-01',ret=A('retained');let open=0;const rows=[];
  es.forEach(e=>{if(to&&e.date>to)return;const before=from&&e.date<from;
   e.lines.forEach(l=>{if(l.a===code){const v=l.dr-l.cr;
     if(before){if(!isPL(code)||e.date>=y0)open+=v;}else rows.push({date:e.date,no:e.no,desc:e.desc,dr:l.dr,cr:l.cr});}
    /* earlier years' profit closes into retained earnings */
    else if(code===ret&&isPL(l.a)&&from&&e.date<y0)open+=l.dr-l.cr;});});
  let bal=r2(open);rows.forEach(r=>{bal=r2(bal+r.dr-r.cr);r.bal=bal;});
  return {code,name:nameOf(code),debitSide:debitSide(code),open:r2(open),rows,dr:r2(rows.reduce((t,r)=>t+r.dr,0)),cr:r2(rows.reduce((t,r)=>t+r.cr,0)),close:bal};
 }
 /* what the documents say before a day, without opening balances (73-opening.js): every account, the profit-and-loss
    accounts for that day's year only (earlier years in 3030) */
 function before(day){
  const y0=String(day).slice(0,4)+'-01-01',ret=A('retained'),m=new Map(),add=(a,v)=>m.set(a,r2((m.get(a)||0)+v));
  entries({raw:true}).forEach(e=>{if(!(e.date<day))return;e.lines.forEach(l=>{const v=l.dr-l.cr;if(isPL(l.a)&&e.date<y0)add(ret,v);else add(l.a,v);});});
  return m;}
 /* every account's balance on a day, the profit-and-loss accounts for its year only (earlier years in 3030) */
 function balances(to,list){
  const es=list||entries(),y0=String(to).slice(0,4)+'-01-01',ret=A('retained'),m=new Map();
  const add=(a,v)=>m.set(a,r2((m.get(a)||0)+v));
  es.forEach(e=>{if(e.date>to)return;e.lines.forEach(l=>{const v=l.dr-l.cr;if(isPL(l.a)&&e.date<y0)add(ret,v);else add(l.a,v);});});
  return [...m.entries()].filter(([,v])=>Math.abs(v)>=EPS).map(([code,v])=>({code,name:nameOf(code),type:typeOf(code),debit:v>0?v:0,credit:v<0?-v:0}))
   .sort((a,b)=>a.code.localeCompare(b.code));
 }
 const check=list=>(list||entries()).filter(e=>Math.abs(r2(e.lines.reduce((t,l)=>t+l.dr-l.cr,0)))>=0.01);
 const codes=list=>[...new Set((list||entries()).flatMap(e=>e.lines.map(l=>l.a)))].sort();
 /* a month's VAT return (J29): output and input VAT, input VAT carried from earlier months and used, what is owed, and
    what is carried to the next month (1055) — read from the month's close; null when the month has none */
 function vat(mo,list){const L=list||entries(),e=L.find(x=>x.src==='vat'&&x.date.slice(0,7)===mo);if(!e)return null;
  const s=(code,k)=>r2(e.lines.filter(l=>l.a===code).reduce((t,l)=>t+l[k],0)),c=A('vatClaim');
  let carried=0;L.forEach(x=>{if(x.date<=e.date)x.lines.forEach(l=>{if(l.a===c)carried+=l.dr-l.cr;});});
  return {date:e.date,out:s(A('vatOut'),'dr'),in:s(A('vatIn'),'cr'),used:s(c,'cr'),due:s(A('vatDue'),'cr'),carried:r2(carried)};}
 /* stock value in the stock register (FIFO lots less what left them) on a day: account 1040 should say the same */
 function fifoValue(to){let v=0;(fifo().lots||[]).forEach(l=>{if(l&&String(l.date||'')<=to)v+=n(l.qty)*n(l.cost);});
  (fifo().allocs||[]).forEach(a=>{if(a&&String(a.date||'')<=to)v-=rem(a)*n(a.cost);});return r2(v);}
 window.PKG_LEDGER={entries,account,balances,before,check,codes,nameOf,typeOf,fifoValue,sys,vat,NEW};

 /* ---------- 08 บัญชี - การเงิน → บัญชีแยกประเภท (proposal Q3 of round 3, owner 2026-11-11): an account, or every
    account that moved, between two days — the balance brought forward, each entry with the running balance, the
    totals; printed and saved as Excel. For the owner or whoever has "การเงิน" (doc.fin), who sees costs and pay. ---------- */
 const tabs=document.getElementById('acctTabs');
 if(!tabs||typeof acctGo!=='function')return;
 const $i=id=>document.getElementById(id);
 const btn=document.createElement('button');btn.type='button';btn.dataset.a='ledger';btn.textContent='บัญชีแยกประเภท';
 {const coa=tabs.querySelector('[data-a="coa"]');if(coa)coa.after(btn);else tabs.append(btn);}
 const pane=document.createElement('div');pane.className='apane pkg-ledger';pane.id='a-ledger';pane.style.display='none';
 {const last=[...document.querySelectorAll('.apane')].pop();if(last)last.after(pane);}
 const may=()=>!(typeof curEmp==='function'&&curEmp())||!!can('doc.fin');
 const tab=()=>{btn.style.display=may()?'':'none';};
 let ACC='',FROM='',TO='';
 const year=()=>typeof acctY==='function'?acctY():+iso().slice(0,4);
 function period(){const y=year();if(!FROM||FROM.slice(0,4)!==String(y)&&!pane.dataset.own){FROM=y+'-01-01';const e=y+'-12-31';TO=e<iso()?e:iso();}}
 const show=(r,v)=>money(r.debitSide?v:-v);
 function accTable(r,fv){
  return `<h3 class="pkg-lg-h" data-no-translate>${esc(r.code)} ${esc(r.name)}</h3>
   <div class="scroll"><table class="tbl pkg-lg-t"><thead><tr><th style="width:100px">วันที่</th><th style="width:150px">เลขที่เอกสาร</th><th>คำอธิบาย</th>
    <th class="num" style="width:120px">เดบิต</th><th class="num" style="width:120px">เครดิต</th><th class="num" style="width:130px">ยอดคงเหลือ</th></tr></thead><tbody>
    <tr class="pkg-lg-open"><td></td><td></td><td><b>ยอดยกมา</b></td><td></td><td></td><td class="num"><b>${show(r,r.open)}</b></td></tr>
    ${r.rows.map(x=>`<tr><td class="ctr">${x.date?thDate(x.date):''}</td><td class="mono" data-no-translate>${esc(x.no||'')}</td><td data-no-translate>${esc(x.desc)}</td>
     <td class="num">${x.dr?money(x.dr):''}</td><td class="num">${x.cr?money(x.cr):''}</td><td class="num">${show(r,x.bal)}</td></tr>`).join('')}
    <tr class="pkg-lg-tot"><td></td><td></td><td><b>รวม · ยอดคงเหลือยกไป</b></td><td class="num"><b>${money(r.dr)}</b></td><td class="num"><b>${money(r.cr)}</b></td><td class="num"><b>${show(r,r.close)}</b></td></tr>
   </tbody></table></div>${fv!=null&&Math.abs(fv-r.close)>=0.01?`<p class="hint pkg-lg-fifo">มูลค่าสินค้าตามทะเบียนสินค้า (FIFO) ณ วันที่ ${thDate(TO)}: ${money(fv)} บาท · ต่างจากบัญชี ${money(r2(r.close-fv))} บาท
    — การเคลื่อนไหวสต๊อกที่ไม่มีเอกสารบัญชี เช่น ใบเสนอราคาของระบบเดิมที่ตัดสต๊อกแล้วแต่ยังไม่ออกใบเสร็จ</p>`:''}`;
 }
 /* the accounts of the chart, and any other code the entries use, in code order */
 function choices(list){const set=new Set((DB.coa||[]).map(a=>a.code));codes(list).forEach(c=>set.add(c));return [...set].sort();}
 function reports(list){
  const want=ACC?[ACC]:codes(list);
  return want.map(c=>account(c,FROM,TO,list)).filter(r=>ACC||r.rows.length||Math.abs(r.open)>=EPS);
 }
 function render(){
  tab();if(!pane.isConnected)return;
  if(!may()){pane.innerHTML='<p class="hint">บัญชีนี้ไม่มีสิทธิ์ดูหน้านี้</p>';return;}
  period();const list=entries(),cs=choices(list);if(!ACC&&!pane.dataset.all)ACC=cs.includes(A('cash'))?A('cash'):cs[0]||'';
  const rs=reports(list);
  pane.innerHTML=`<div class="panel"><header><h2>บัญชีแยกประเภท</h2><span class="hint">${list.length} รายการบัญชี</span><div class="spacer"></div>
    <button type="button" class="btn gh" data-lg="print">พิมพ์</button><button type="button" class="btn gh" data-lg="excel">ส่งออก Excel</button></header><div class="body">
   <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px">
    <label class="f" style="min-width:260px"><span>บัญชี</span><select id="lgAcc" aria-label="บัญชี"><option value="">ทุกบัญชีที่มีรายการ</option>${cs.map(c=>`<option value="${esc(c)}"${c===ACC?' selected':''}>${esc(c)} ${esc(nameOf(c))}</option>`).join('')}</select></label>
    <label class="f"><span>ตั้งแต่วันที่</span><input type="date" id="lgFrom" aria-label="ตั้งแต่วันที่" value="${esc(FROM)}"></label>
    <label class="f"><span>ถึงวันที่</span><input type="date" id="lgTo" aria-label="ถึงวันที่" value="${esc(TO)}"></label></div>
   ${sysNote()}
   ${rs.length?rs.map(r=>accTable(r,r.code===A('inv')?fifoValue(TO):null)).join(''):'<p class="empty">ไม่มีรายการในช่วงวันที่นี้</p>'}</div></div>`;
 }
 pane.addEventListener('change',e=>{const t=e.target;
  if(t.id==='lgAcc'){ACC=t.value;pane.dataset.all=ACC?'':'1';}
  else if(t.id==='lgFrom'||t.id==='lgTo'){const f=$i('lgFrom').value,to=$i('lgTo').value;if(f&&to&&f<=to){FROM=f;TO=to;pane.dataset.own='1';}}
  else return;render();});
 function sub(){return 'ตั้งแต่วันที่ '+thDate(FROM)+' ถึงวันที่ '+thDate(TO);}
 /* the accounts the system posts to that the shop's chart does not have (not on the chart page: the legacy screens of
    the goldens show it) */
 function sysNote(){const miss=Object.keys(NEW).map(sys).filter(c=>!(DB.coa||[]).some(a=>a.code===c));
  return miss.length?`<p class="hint pkg-lg-sys" style="margin:0 0 8px">บัญชีที่ระบบลงรายการเอง (ไม่อยู่ในผังบัญชีของร้าน): ${miss.map(c=>esc(c+' '+nameOf(c))).join(' · ')}</p>`:'';}
 function print(){
  if(!may())return toast('บัญชีนี้ไม่มีสิทธิ์พิมพ์เอกสารนี้');
  const list=entries(),rs=reports(list);if(!rs.length)return toast('ไม่มีรายการในช่วงวันที่นี้');
  printDocs(repHead('บัญชีแยกประเภท',sub())+rs.map(r=>`<h3 style="margin:10px 0 4px">${esc(r.code)} ${esc(r.name)}</h3>
   <table><thead><tr><th style="width:80px">วันที่</th><th style="width:120px">เลขที่เอกสาร</th><th>คำอธิบาย</th><th style="width:95px">เดบิต</th><th style="width:95px">เครดิต</th><th style="width:105px">ยอดคงเหลือ</th></tr></thead><tbody>
    <tr><td></td><td></td><td>ยอดยกมา</td><td></td><td></td><td class="num">${show(r,r.open)}</td></tr>
    ${r.rows.map(x=>`<tr><td>${x.date?thDate(x.date):''}</td><td>${esc(x.no||'')}</td><td>${esc(x.desc)}</td><td class="num">${x.dr?money(x.dr):''}</td><td class="num">${x.cr?money(x.cr):''}</td><td class="num">${show(r,x.bal)}</td></tr>`).join('')}
    <tr><td colspan="3" style="text-align:right"><b>รวม · ยอดคงเหลือยกไป</b></td><td class="num"><b>${money(r.dr)}</b></td><td class="num"><b>${money(r.cr)}</b></td><td class="num"><b>${show(r,r.close)}</b></td></tr></tbody></table>`).join('')+'</div>');
 }
 function excel(){
  const X=window.PKG_REG_EXPORT;if(!X||!may()||!can('doc.export'))return toast('บัญชีนี้ไม่มีสิทธิส่งออกข้อมูล');
  const list=entries(),rs=reports(list);if(!rs.length)return toast('ไม่มีรายการในช่วงวันที่นี้');
  const rows=[];rs.forEach(r=>{rows.push([r.code,r.name,'','','ยอดยกมา','','',show(r,r.open)]);
   r.rows.forEach(x=>rows.push([r.code,r.name,x.date?thDate(x.date):'',x.no||'',x.desc,x.dr?money(x.dr):'',x.cr?money(x.cr):'',show(r,x.bal)]));
   rows.push([r.code,r.name,'','','รวม · ยอดคงเหลือยกไป',money(r.dr),money(r.cr),show(r,r.close)]);});
  const d={title:'บัญชีแยกประเภท',note:sub()+' · ส่งออกโดย '+meName()+' · '+thDate(iso()),
   cols:[{l:'รหัสบัญชี'},{l:'ชื่อบัญชี'},{l:'วันที่'},{l:'เลขที่เอกสาร'},{l:'คำอธิบาย'},{l:'เดบิต',num:1},{l:'เครดิต',num:1},{l:'ยอดคงเหลือ',num:1}],rows,foot:[],filters:[]};
  X.save('บัญชีแยกประเภท '+FROM+' ถึง '+TO+'.xlsx',X.xlsx(d));toast('ส่งออก Excel แล้ว');
 }
 pane.addEventListener('click',e=>{const b=e.target.closest('[data-lg]');if(!b)return;if(b.dataset.lg==='print')print();else if(b.dataset.lg==='excel')excel();});
 const go0=acctGo;acctGo=function(a){tab();const r=go0.apply(this,arguments);if(a==='ledger')render();return r;};
 if(typeof applyPerms==='function'){const ap0=window.applyPerms;window.applyPerms=function(){const r=ap0.apply(this,arguments);try{tab();}catch(e){}return r;};}
 const st=document.createElement('style');st.textContent='.pkg-ledger .pkg-lg-h{margin:14px 0 6px;font-size:15px}.pkg-ledger tr.pkg-lg-open td,.pkg-ledger tr.pkg-lg-tot td{background:var(--soft,#f5f6f8)}';
 document.head.append(st);
 tab();
})();
