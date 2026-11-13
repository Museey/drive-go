/* DriveGo new system (the owner's decisions of 2026-11-12: "งบทดลองและงบการเงินอ่านจากบัญชีแยกประเภท", then the
   proposal of docs/NOTES.md "ข้อเสนอ: งบการเงินจากบัญชีแยกประเภท", "เอาตามที่เสนอทุกข้อ"): 08 → งบการเงิน is the
   general ledger's (71-ledger.js). The page is drawn as before (the year, the branch chips of 37.js, the closing note),
   then its three tables are written again from the journal:
   · งบกำไรขาดทุน — the year's profit-and-loss accounts, in the rows the page had: sales revenue (parts / labour), cost of
     sales, the expenses, payroll (6010 / 6011), depreciation, a stock-count shortage, then the card fees, a count
     surplus, an asset sold or written off and the capital menu's other income / expenses (J28) before the net profit.
     A shop's report of some branches (37.js) has those branches' journal.
   · งบแสดงฐานะการเงิน — every account's balance on 31 December, the whole business: cash and bank, receivables,
     stock, the tax to claim or get back (1050 1055 1060), property and equipment net, any other asset account; payables,
     the tax and social security to remit (2030 2040 2050 2060), the loan, any other liability; the owner's capital
     less drawings, the profit brought forward, the year's profit. Assets equal liabilities and equity.
   · งบกระแสเงินสด (อย่างย่อ) — the money in and out of cash (1010) and the bank (1020) in the year, by what moved it, from
     the cash and bank at the start of the year (with the opening balances, 73-opening.js) to the end: the same as the
     trial balance's 1010 + 1020.
   The home page, 08 สุขภาพการเงิน and the capital page keep the old figures (finance) for now (proposal item 5). */
(function(){
 const L=window.PKG_LEDGER;
 if(!L||typeof renderFS!=='function'||typeof DEFAULT_MAP==='undefined')return;
 const $i=id=>document.getElementById(id);
 const R=()=>window.PKG_BRANCH_REPORT;
 const r2=v=>Math.round((+v||0)*100)/100,EPS=0.005,nz=v=>Math.abs(v)>=EPS;
 const A=k=>(DB.map&&DB.map[k])||DEFAULT_MAP[k]||'';
 const KIND={'1':'asset','2':'liab','3':'equity','4':'revenue','5':'cogs'};
 const kind=code=>L.typeOf(code)||KIND[String(code||'').charAt(0)]||'expense';
 const isPL=t=>t==='revenue'||t==='cogs'||t==='expense';
 const LOSS='สินค้าขาดจากการตรวจนับ';
 const row=(t,v,b)=>`<tr><td style="width:62%">${b?'<b>'+esc(t)+'</b>':esc(t)}</td><td class="num">${b?'<b>'+money(v)+'</b>':money(v)}</td></tr>`;
 const head=t=>`<tr><td colspan="2"><b>${esc(t)}</b></td></tr>`;
 const sum=m=>[...m.values()].reduce((t,v)=>t+v,0);

 /* ---------- the year's profit and loss ---------- */
 function pl(es,y){
  const y0=y+'-01-01',y1=y+'-12-31',rp=A('revParts'),rl=A('revLabor'),pa=A('payroll'),se=A('ssoEr');
  const o={rev:0,cogs:0,opex:0,pay:0,dep:0,loss:new Map(),fee:0,gain:0,asset:0,oth:new Map(),net:0};
  const oth=(code,k,v)=>{const x=o.oth.get(code)||{in:0,out:0};x[k]+=v;o.oth.set(code,x);};
  es.forEach(e=>{if(!(e.date>=y0&&e.date<=y1))return;
   e.lines.forEach(l=>{const t=kind(l.a);if(!isPL(t))return;const v=l.dr-l.cr;o.net-=v;
    if(t==='revenue'){
     if(e.src==='cap')oth(l.a,'in',-v);else if(l.a===rp||l.a===rl)o.rev-=v;else if(e.src==='fee')o.fee-=v;
     else if(e.src==='count')o.gain-=v;else if(e.src==='asale'||e.src==='aout')o.asset-=v;else oth(l.a,'in',-v);}
    else if(t==='cogs')o.cogs+=v;
    else if(e.src==='cap')oth(l.a,'out',v);
    else if(e.src==='asale'||e.src==='aout')o.asset-=v;
    else if(e.src==='dep')o.dep+=v;
    else if(e.src==='count')o.loss.set(l.a,(o.loss.get(l.a)||0)+v);
    else if(l.a===pa||l.a===se)o.pay+=v;
    else o.opex+=v;});});
  return o;
 }
 function plRows(o){
  const M=DB.map||{},rev=r2(o.rev),cogs=r2(o.cogs),gp=r2(rev-cogs),loss=[...o.loss].filter(([,v])=>nz(v)).sort((a,b)=>a[0].localeCompare(b[0]));
  const opex=r2(o.opex+o.pay+o.dep+sum(o.loss)),np=r2(o.net),oc=A('revOther')||'4030';
  let h=row((M.revParts?M.revParts+' / '+M.revLabor+' ':'')+'รายได้จากการขายและบริการ',rev)+
   row((M.cogs?M.cogs+' ':'')+'หัก ต้นทุนอะไหล่และวัสดุที่ขาย',cogs)+
   row('กำไรขั้นต้น',gp,1)+
   row('6000 ค่าใช้จ่ายในการขายและบริหาร',r2(o.opex))+
   row((M.payroll?M.payroll+' ':'')+'เงินเดือนและเงินสมทบนายจ้าง',r2(o.pay))+
   row((M.dep?M.dep+' ':'')+'ค่าเสื่อมราคา',r2(o.dep))+
   loss.map(([code,v])=>row(code+' '+LOSS,r2(v))).join('')+
   row('รวมค่าใช้จ่ายดำเนินงาน',opex,1);
  if(nz(o.fee))h+=row(oc+' บวก รายได้อื่น (ค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า)',r2(o.fee));
  if(nz(o.gain))h+=row(oc+' บวก รายได้อื่น (สินค้าเกินจากการตรวจนับ)',r2(o.gain));
  if(nz(o.asset))h+=row(o.asset>0?'บวก กำไรจากการจำหน่ายสินทรัพย์':'หัก ขาดทุนจากการจำหน่ายสินทรัพย์',r2(Math.abs(o.asset)));
  [...o.oth].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([code,v])=>{
   if(nz(v.in))h+=row(code+' บวก '+L.nameOf(code)+' (รายรับอื่น ๆ)',r2(v.in));
   if(nz(v.out))h+=row(code+' หัก '+L.nameOf(code)+' (รายจ่ายอื่น ๆ)',r2(v.out));});
  const pct=v=>(rev?v/rev*100:0).toFixed(1);
  return h+row('กำไร (ขาดทุน) สุทธิก่อนภาษี',np,1)+
   `<tr><td class="hint" colspan="2">อัตรากำไรขั้นต้น ${pct(gp)}% · อัตรากำไรสุทธิ ${pct(np)}%</td></tr>`;
 }

 /* ---------- the balance sheet on 31 December ---------- */
 function bsRows(es,y){
  const bal=new Map(L.balances(y+'-12-31',es).map(b=>[b.code,b.debit-b.credit]));
  const G={cash:[A('cash'),A('bank')],ar:[A('ar')],inv:[A('inv')],taxA:[A('vatIn'),L.sys('vatClaim'),A('whtIn')],
   ap:[A('ap'),A('accrued')],taxL:[A('vatOut'),L.sys('vatDue'),A('whtOut'),A('sso')],loan:[A('loan')],ret:[A('retained')]};
  const ppe=new Set();[DEFAULT_MAP.asset,(DB.map&&DB.map.asset)||{}].forEach(m=>Object.values(m||{}).forEach(p=>(p||[]).forEach(c=>c&&ppe.add(c))));
  const g={cash:0,ar:0,inv:0,taxA:0,ppe:0,othA:0,ap:0,taxL:0,loan:0,othL:0,cap:0,ret:0,np:0},seen=new Set();
  Object.entries(G).forEach(([k,codes])=>codes.forEach(c=>{if(!c||seen.has(c))return;seen.add(c);if(bal.has(c))g[k]+=bal.get(c);}));
  bal.forEach((v,c)=>{if(seen.has(c))return;const t=kind(c);
   if(ppe.has(c))g.ppe+=v;else if(t==='asset')g.othA+=v;else if(t==='liab')g.othL+=v;else if(t==='equity')g.cap+=v;else g.np+=v;});
  /* debit balances for assets; credit for liabilities and equity */
  const a=k=>r2(g[k]),c=k=>r2(-g[k]);
  const tA=r2(g.cash+g.ar+g.inv+g.taxA+g.ppe+g.othA),tL=r2(-(g.ap+g.taxL+g.loan+g.othL)),eq=r2(-(g.cap+g.ret+g.np));
  return head('สินทรัพย์')+
   row('เงินสดและเงินฝากธนาคาร',a('cash'))+row('ลูกหนี้การค้า',a('ar'))+row('สินค้าคงเหลือ (ราคาทุน)',a('inv'))+
   row('ภาษีรอใช้สิทธิ์ / ขอคืน (ภาษีซื้อ ภาษีถูกหัก ณ ที่จ่าย ลูกหนี้กรมสรรพากร)',a('taxA'))+
   row('ที่ดิน อาคาร และอุปกรณ์ — สุทธิ',a('ppe'))+(nz(g.othA)?row('สินทรัพย์อื่น',a('othA')):'')+
   row('รวมสินทรัพย์',tA,1)+
   head('หนี้สินและส่วนของเจ้าของ')+
   row('เจ้าหนี้การค้าและค่าใช้จ่ายค้างจ่าย',c('ap'))+
   row('ภาษีและเงินสมทบค้างนำส่ง (ภาษีขาย ภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย ประกันสังคม)',c('taxL'))+
   row('เงินกู้ยืมคงเหลือ',c('loan'))+(nz(g.othL)?row('หนี้สินอื่น',c('othL')):'')+
   row('รวมหนี้สิน',tL,1)+
   row('ทุน (หักถอนทุน)',c('cap'))+row('กำไร (ขาดทุน) สะสมต้นปี',c('ret'))+row('กำไร (ขาดทุน) สุทธิปีนี้',c('np'))+
   row('ส่วนของเจ้าของ (ทุน + กำไรสะสม)',eq,1)+
   row('รวมหนี้สินและส่วนของเจ้าของ',r2(tL+eq),1);
 }

 /* ---------- the cash flow of the year: cash (1010) and bank (1020) ---------- */
 const SRC={pay:'cust',fee:'cust',refund:'cust',vpay:'vend',gr:'vend',hq:'vend',vclaim:'vend',exp:'exp',exppay:'exp',
  salary:'pay',sso:'pay',payroll:'pay',vatpay:'tax',pnd:'tax',asset:'buy',apay:'buy',asale:'sell'};
 function cfRows(es,y){
  const y0=y+'-01-01',y1=y+'-12-31',money2=new Set([A('cash'),A('bank')]),cap=A('capital'),draw=A('draw'),loan=A('loan');
  const f={start:0,cust:0,vend:0,exp:0,pay:0,tax:0,oth:0,buy:0,sell:0,invest:0,loan:0,out:0};let end=0;
  es.forEach(e=>{if(e.date>y1)return;let m=0;e.lines.forEach(l=>{if(money2.has(l.a))m+=l.dr-l.cr;});if(!nz(m))return;end+=m;
   if(e.date<y0||e.src==='opening'){f.start+=m;return;}
   let k=SRC[e.src];
   if(e.src==='cap'){const other=e.lines.filter(l=>!money2.has(l.a)).map(l=>l.a);
    k=other.includes(cap)?'invest':other.includes(draw)?'out':other.includes(loan)?(m>0?'loan':'out'):'oth';}
   k=k||'oth';
   if(k==='cust'||k==='sell'||k==='invest'||k==='loan'||k==='oth')f[k]+=m;else f[k]-=m;});
  const v=k=>r2(f[k]);
  return row('เงินสดและเงินฝากธนาคารต้นงวด',v('start'))+
   head('กระแสเงินสดจากกิจกรรมดำเนินงาน')+
   row('เงินสดรับจากลูกค้า',v('cust'))+row('เงินสดจ่ายค่าอะไหล่และผู้ขาย',v('vend'))+
   row('เงินสดจ่ายค่าใช้จ่ายดำเนินงาน',v('exp'))+row('เงินสดจ่ายเงินเดือนและประกันสังคม',v('pay'))+
   row('เงินสดจ่ายภาษี (ภ.พ.30 ภ.ง.ด.1 ภ.ง.ด.3 ภ.ง.ด.53)',v('tax'))+row('รายรับ / รายจ่ายอื่น ๆ (สุทธิ)',v('oth'))+
   head('กระแสเงินสดจากกิจกรรมลงทุน')+
   row('เงินสดจ่ายซื้อสินทรัพย์ถาวร',v('buy'))+row('เงินสดรับจากการขายสินทรัพย์',v('sell'))+
   head('กระแสเงินสดจากกิจกรรมจัดหาเงิน')+
   row('เงินลงทุนเพิ่มจากเจ้าของ',v('invest'))+row('เงินกู้ยืมรับ',v('loan'))+row('ถอนทุนและชำระคืนเงินกู้',v('out'))+
   row('เงินสดคงเหลือปลายงวด',r2(end),1);
 }

 /* ---------- the page: drawn as before, then the tables from the ledger ---------- */
 const fs0=window.renderFS;
 window.renderFS=function(){const out=fs0.apply(this,arguments);
  try{const y=acctY(),rep=R(),part=!!(rep&&rep.partial&&rep.partial('acct'));
   const all=rep&&rep.company?rep.company(()=>L.entries()):L.entries();
   const mine=part?rep.run('acct',()=>L.entries()):all;
   const put=(id,h)=>{const t=$i(id);if(t&&t.tBodies[0])t.tBodies[0].innerHTML=h;};
   put('plTbl',plRows(pl(mine,y)));put('bsTbl',bsRows(all,y));put('cfTbl',cfRows(all,y));
  }catch(e){console.error('statements from the ledger',e);}
  return out;};
 /* the print: the note under the balance sheet says where the figures come from (the old one said some were estimated;
    approved 2026-11-13) */
 const OLD='ตัวเลขบางรายการเป็นการประมาณการจากข้อมูลที่บันทึกในระบบ ควรให้ผู้ทำบัญชีตรวจสอบและปรับปรุงรายการก่อนนำส่งกรมสรรพากร',
  NEW='จัดทำจากบัญชีแยกประเภทที่สร้างจากเอกสารในระบบ ผู้ทำบัญชีควรตรวจสอบและปรับปรุงรายการก่อนนำส่งกรมสรรพากร';
 if(typeof printFS==='function'){const pf0=window.printFS;
  window.printFS=function(){const pd=window.printDocs;
   window.printDocs=function(h){return pd.call(this,String(h).replace(OLD,NEW));};
   try{return pf0.apply(this,arguments);}finally{window.printDocs=pd;}};}
 window.PKG_FS_LEDGER={pl,plRows,bsRows,cfRows};
})();
