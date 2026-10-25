/* DriveGo new system (task 3.6, decisions R9–R11 and F4, owner's answers 2026-10-25): stock and its FIFO cost.
   · Negative stock (R9-ข = จ): only the owner and staff holding at least one approval right ("ผู้มีสิทธิ์อนุมัติ",
     any PERM_APV key) may cut more than is in stock — selling (createDoc), a sale's revision, a customer-claim
     replacement and cancelling a transfer. Anyone else is refused with a message. The provisional cost of what is
     sold short and its correction when goods arrive (R9-ก) stay as the FIFO ledger does them (09.js settle).
   · Register cost (F4 = R10-ง ค): after every stock move the item's register cost (DB.stock[].cost) is the average
     cost of what is left in its FIFO lots (every branch); with nothing left it keeps its last value. Prices A/B/C
     do not follow it, as before. What depends on it: the provisional cost of negative stock, a count's surplus lot,
     goods from the central warehouse, the default cost of a goods-received line.
   · The accounts (R10, answer "คิดจากเอกสารสต๊อก"): nothing is written to the expense register. What a stock count
     or an internal issue moved is read from the FIFO ledger whenever a report is made, at the date the stock moved:
     a count's shortage = expense "สินค้าขาดจากการตรวจนับ" (its allocations), a count's surplus = other income
     (its lots, at the register cost), an issue = an expense of the category chosen on it (isExpCat, default
     "ค่าซ่อมแซมและบำรุงรักษา"). A cancelled document drops out; a provisional cost follows its correction. They
     reach the profit-and-loss (finance, monthlyPnL, renderFS), the expense ranking and the trial balance — never
     cash, payables or vouchers. The count and issue windows show what they booked.
   · A shortage sold to whoever is responsible (R10-ก): an approved count with a shortage has "เปิดใบขายให้ผู้รับผิดชอบ".
     It opens a new sale holding the missing items. When that sale is saved the count's own allocations come back
     first (logMove in, refNo = the count) and the sale cuts them as any sale does: the cost moves from the expense
     to the cost of sales and stock is not cut twice. Cancelling that sale makes them short again; a count that has
     such sales cannot be cancelled before them. d.sold = [{no, id, stockId, qty, cancelled?}], sale.fromCount.
   · Goods from the central warehouse (R11 = ก): ProX online (dcReceive) and Franchise (frReqReceive) receive into a
     FIFO lot with a stock move at the branch's register cost; an item new to a franchise branch asks its cost first.
   · Stock moves (finding 9): the stock card and the move report show what leaves as minus whatever sign the flow
     stored, and a unit cost read from the FIFO ledger (moveCost). The stored moves are unchanged. */
(function(){
 if(typeof pkgFifo==='undefined'||typeof finance!=='function'||typeof PERM_APV==='undefined')return;
 const r2=v=>round2(v),$i=id=>document.getElementById(id),EPS=1e-9;
 const F=()=>DB.fifo&&Array.isArray(DB.fifo.lots)?DB.fifo:{lots:[],allocs:[]};
 const rem=a=>n(a.qty)-n(a.back);
 const DEF_CAT='ค่าซ่อมแซมและบำรุงรักษา',LOSS='สินค้าขาดจากการตรวจนับ';
 const stockOf=id=>DB.stock.find(x=>x.id===id)||null;

 /* ---------- negative stock (R9-ข) ---------- */
 const negRight=()=>!curEmp()||PERM_APV.some(([k])=>can('apv.'+k));
 function negOk(short){if(!short||negRight())return true;
  toast('อะไหล่ '+short+' รายการมีไม่พอ — ตัดสต็อกติดลบได้เฉพาะเจ้าของหรือผู้มีสิทธิ์อนุมัติเอกสาร');return false;}

 /* ---------- register cost = average of what is left (F4) ---------- */
 function avgOf(id){let q=0,v=0;F().lots.forEach(l=>{if(l&&l.stockId===id&&n(l.left)>EPS){q+=n(l.left);v+=n(l.left)*n(l.cost);}});return q>EPS?r2(v/q):null;}
 const mv0=pkgFifo.move;
 pkgFifo.move=function(stockId){const out=mv0.apply(this,arguments);
  const s=stockOf(stockId),a=s?avgOf(stockId):null;if(a!=null&&Math.abs(a-n(s.cost))>0.004)s.cost=a;return out;};

 /* ---------- what stock documents book (R10) ---------- */
 function book(pred){
  const C=new Set(),I=new Map(),b={loss:0,gain:0,issue:0,cats:{}};
  (DB.stockCounts||[]).forEach(d=>{if(d&&d.no&&d.applied&&!d.cancelled)C.add(d.no);});
  (DB.issues||[]).forEach(d=>{if(d&&d.no&&d.deducted&&!d.cancelled)I.set(d.no,d.expCat||DEF_CAT);});
  if(!C.size&&!I.size)return b;
  F().allocs.forEach(a=>{if(!a||!(C.has(a.refNo)||I.has(a.refNo))||!pred(a.date))return;const v=rem(a)*n(a.cost);
   if(C.has(a.refNo))b.loss+=v;else{const k=I.get(a.refNo);b.issue+=v;b.cats[k]=(b.cats[k]||0)+v;}});
  F().lots.forEach(l=>{if(l&&l.src==='count'&&C.has(l.refNo)&&pred(l.date))b.gain+=n(l.qty)*n(l.cost);});
  b.loss=r2(b.loss);b.gain=r2(b.gain);b.issue=r2(b.issue);Object.keys(b.cats).forEach(k=>{b.cats[k]=r2(b.cats[k]);});
  return b;}
 const nz=b=>!!(b.loss||b.gain||b.issue);
 const docBook=no=>{let out=0,inn=0;F().allocs.forEach(a=>{if(a&&a.refNo===no)out+=rem(a)*n(a.cost);});
  F().lots.forEach(l=>{if(l&&l.refNo===no&&l.src==='count')inn+=n(l.qty)*n(l.cost);});return{out:r2(out),in:r2(inn)};};

 let last=null;   /* the book of the latest finance() call: what renderFS showed in its profit-and-loss */
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
  const b=book(d=>inYear(d,y));last={y,b};if(!nz(b))return f;
  f.issueExp=b.issue;f.stockLoss=b.loss;f.otherInc=b.gain;
  f.expBase+=b.issue;f.opex+=b.issue+b.loss;f.np=f.gp+b.gain-f.opex;
  f.npm=f.revenue?f.np/f.revenue*100:0;
  f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;
  return f;};
 if(typeof monthlyPnL==='function'){const o=monthlyPnL;
  window.monthlyPnL=function(){const out=o.apply(this,arguments);
   (out||[]).forEach(m=>{const b=book(d=>String(d||'').slice(0,7)===m.key);if(!nz(b))return;m.opex+=b.issue+b.loss;m.np=m.rev-m.cogs-m.opex+b.gain;});
   return out;};}
 if(typeof expenseRank==='function'){const o=expenseRank;
  window.expenseRank=function(y){const out=o.apply(this,arguments),b=book(d=>inYear(d,y));if(!nz(b))return out;
   const m=new Map((out||[]).map(x=>[x.label,x.value]));const add=(k,v)=>{if(v>0)m.set(k,(m.get(k)||0)+v);};
   add(LOSS,b.loss);Object.entries(b.cats).forEach(([k,v])=>add(k,v));
   return [...m].filter(([,v])=>v>0).map(([label,value])=>({label,value})).sort((a,c)=>c.value-a.value);};}
 if(typeof trialBalance==='function'){const o=trialBalance;
  window.trialBalance=function(y){const out=o.apply(this,arguments),b=book(d=>inYear(d,y));if(!nz(b))return out;
   const add=(code,dr,cr)=>{if(!code||(Math.abs(dr)<0.005&&Math.abs(cr)<0.005))return;let r=out.find(x=>x.code===code);
    if(!r){r={code,name:accName(code),type:((DB.coa||[]).find(a=>a.code===code)||{}).type||'',debit:0,credit:0};out.push(r);}r.debit+=dr;r.credit+=cr;};
   add(expAcc(LOSS),b.loss,0);Object.entries(b.cats).forEach(([k,v])=>add(expAcc(k),v,0));add((DB.map&&DB.map.revOther)||'4030',0,b.gain);
   return out.sort((a,c)=>a.code.localeCompare(c.code));};}
 /* 08 งบการเงิน: the profit-and-loss shows the shortage and the other income on their own rows */
 if(typeof renderFS==='function'){const o=renderFS;
  window.renderFS=function(){last=null;const out=o.apply(this,arguments);
   try{const b=last&&last.y===acctY()?last.b:null,tb=$i('plTbl')&&$i('plTbl').tBodies[0];if(!b||!tb||!(b.loss||b.gain))return out;
    const M=DB.map||{},rows=[...tb.rows],at=t=>rows.find(r=>r.cells[0]&&r.cells[0].textContent.trim()===t);
    const mk=(t,v)=>{const tr=document.createElement('tr');tr.className='pkg-fs-stock';tr.innerHTML=`<td style="width:62%">${esc(t)}</td><td class="num">${money(v)}</td>`;return tr;};
    const opex=at('รวมค่าใช้จ่ายดำเนินงาน'),np=at('กำไร (ขาดทุน) สุทธิก่อนภาษี');
    if(b.loss&&opex)opex.before(mk(expAcc(LOSS)+' '+LOSS,b.loss));
    if(b.gain&&np)np.before(mk((M.revOther||'4030')+' บวก รายได้อื่น (สินค้าเกินจากการตรวจนับ)',b.gain));
   }catch(e){}
   return out;};}

 /* ---------- the stock count window: what it booked, and its shortage sold ---------- */
 const countOf=no=>(DB.stockCounts||[]).find(d=>d&&d.no===no)||null;
 const live=d=>(d&&d.sold||[]).filter(x=>x&&!x.cancelled);
 /* what of a count's shortage is still an expense, per item: [{stockId, code, name, qty}] */
 function shortLeft(d){const out=[];if(!d||!d.applied||d.cancelled)return out;
  (d.items||[]).forEach(it=>{const s=n(it.sysQty)-n(it.countedQty);if(s<=EPS)return;
   const sold=live(d).filter(x=>x.stockId===it.stockId).reduce((t,x)=>t+n(x.qty),0);
   const back=F().allocs.filter(a=>a&&a.refNo===d.no&&a.stockId===it.stockId).reduce((t,a)=>t+rem(a),0);
   const q=Math.min(s-sold,back);if(q>EPS)out.push({stockId:it.stockId,code:it.code,name:it.name,qty:q});});
  return out;}
 function countBox(){
  const tbl=$i('scItems');if(!tbl||typeof SC==='undefined')return;const wrap=tbl.closest('.scroll')||tbl;let box=$i('pkgScBook');
  if(!box){box=document.createElement('div');box.id='pkgScBook';box.className='hint';box.style.margin='8px 0 0';wrap.after(box);}
  const d=SC&&SC.id?(DB.stockCounts||[]).find(x=>x.id===SC.id):null;
  if(!d||!d.applied||d.cancelled){box.style.display='none';box.innerHTML='';return;}
  const k=docBook(d.no),L=shortLeft(d),sold=live(d),nos=[...new Set(sold.map(x=>x.no))];
  box.style.display='';
  box.innerHTML='ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายสินค้าขาด <b>'+money(k.out)+'</b> บาท · รายได้อื่น (สินค้าเกิน) <b>'+money(k.in)+'</b> บาท'
   +(nos.length?'<div>ขายของที่ขาดให้ผู้รับผิดชอบแล้ว: '+nos.map(no=>esc(no)+' ('+sold.filter(x=>x.no===no).map(x=>{const s=stockOf(x.stockId);return esc(s?s.code:'')+' × '+qf(x.qty);}).join(', ')+')').join(' · ')+'</div>':'')
   +(L.length?'<div style="margin-top:6px"><button type="button" class="btn gh sm" id="pkgScSell">เปิดใบขายให้ผู้รับผิดชอบ</button></div>':'');
  const b=$i('pkgScSell');if(b)b.onclick=()=>sellShort(d.id);
 }
 if(typeof fillCountForm==='function'){const o=fillCountForm;window.fillCountForm=function(){const out=o.apply(this,arguments);try{countBox();}catch(e){}return out;};}
 function sellShort(id){
  const d=(DB.stockCounts||[]).find(x=>x.id===id),L=shortLeft(d);if(!L.length)return toast('ไม่มีของขาดที่ยังไม่ได้เปิดใบขาย');
  const X=window.PKG_STOCK_CUT,W=X&&X.state;if(!W||typeof X.openNew!=='function')return;
  const was=W.S;closeModal('mCountEdit');X.openNew();const S=W.S;if(!S||S===was)return;   /* refused: no right to sell */
  S.items=L.map(x=>{const s=stockOf(x.stockId)||{};return{type:'part',stockId:x.stockId,code:s.code||x.code,oem:s.oem||'',name:s.name||x.name,unit:s.unit||'',qty:x.qty,price:priceByTier(s,S.tier),warr:s.warr||''};});
  S.fromCount=d.no;S.ref=d.no;if(typeof X.paint==='function')X.paint();
  toast('ดึงของที่ขาดจากใบตรวจนับ '+d.no+' แล้ว — เลือกลูกค้า (ผู้รับผิดชอบ) แล้วบันทึกการขาย');
 }
 /* createDoc: what of the sale comes back from the count first (Map stockId → quantity) */
 function countBack(S){const d=S&&S.fromCount?countOf(S.fromCount):null;if(!d)return null;
  const m=new Map();shortLeft(d).forEach(x=>m.set(x.stockId,x.qty));return m;}
 function cutFromCount(c,S){
  const d=S&&S.fromCount?countOf(S.fromCount):null;if(!d)return;
  const want=new Map();(c.lines||[]).forEach(l=>want.set(l.stockId,(want.get(l.stockId)||0)+n(l.qty)));
  const got=[];
  shortLeft(d).forEach(x=>{const q=Math.min(n(want.get(x.stockId)),x.qty),s=stockOf(x.stockId);if(q<=EPS||!s)return;
   s.qty=n(s.qty)+q;s.lastMove=iso();
   logMove(s.id,'in',q,iso(),'ขายของที่ขาดให้ผู้รับผิดชอบ · ใบตัดสต็อก '+c.no,d.no);
   d.sold=(d.sold||[]).concat({no:c.no,id:c.id,stockId:s.id,qty:q});got.push(s.code+' × '+qf(q));});
  if(!got.length)return;
  c.fromCount=d.no;
  logAudit('count',d,'sale','ขายของที่ขาดให้ผู้รับผิดชอบ · ใบตัดสต็อก '+c.no+' · '+got.join(', '));
 }
 function uncutFromCount(c){
  const d=c&&c.fromCount?countOf(c.fromCount):null;if(!d)return;const got=[];
  live(d).filter(x=>x.id===c.id).forEach(x=>{const s=stockOf(x.stockId);x.cancelled=true;if(!s)return;
   s.qty=n(s.qty)-n(x.qty);s.lastMove=iso();
   logMove(s.id,'adj',-n(x.qty),iso(),'ยกเลิกใบตัดสต็อก '+c.no+' · กลับเป็นของขาด',d.no);got.push(s.code+' × '+qf(x.qty));});
  if(got.length)logAudit('count',d,'sale','ยกเลิกใบตัดสต็อก '+c.no+' · กลับเป็นของขาด '+got.join(', '));
 }
 if(typeof AUD_ACT==='object')AUD_ACT.sale='ขายของที่ขาดให้ผู้รับผิดชอบ';
 if(typeof cancelCount==='function'){const o=cancelCount;
  window.cancelCount=async function(id){const d=(DB.stockCounts||[]).find(x=>x.id===id),act=live(d);
   if(d&&act.length)return toast('ใบตรวจนับ '+d.no+' มีใบขายของที่ขาด '+[...new Set(act.map(x=>x.no))].join(', ')+' — ยกเลิกใบขายก่อน');
   return o.apply(this,arguments);};}

 /* ---------- the internal issue window: the expense category ---------- */
 (function(){const dept=$i('isDept'),lab=dept&&dept.closest('label');if(!lab||$i('isExpCat')||typeof EXP_CATS==='undefined')return;
  lab.style.gridColumn='';const L=document.createElement('label');L.className='f';
  L.innerHTML='<span>หมวดค่าใช้จ่าย</span><select id="isExpCat">'+EXP_CATS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')+'</select>';
  lab.after(L);
  const li=$i('isLineInfo');if(li){const box=document.createElement('span');box.id='pkgIsBook';box.className='hint';box.style.cssText='margin-left:12px;display:none';li.after(box);}   /* on the line of "กรอกแล้ว …": nothing below moves */
 })();
 if(typeof fillIssueForm==='function'){const o=fillIssueForm;
  window.fillIssueForm=function(){const out=o.apply(this,arguments);
   try{const el=$i('isExpCat'),box=$i('pkgIsBook');if(typeof IS==='undefined'||!IS)return out;
    if(el){el.value=IS.expCat||DEF_CAT;el.disabled=!!IS.cancelled;}
    const d=IS.id?(DB.issues||[]).find(x=>x.id===IS.id):null;
    if(box){if(d&&d.deducted&&!d.cancelled){box.style.display='';box.innerHTML='ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายหมวด '+esc(d.expCat||DEF_CAT)+' <b>'+money(docBook(d.no).out)+'</b> บาท';}
     else{box.style.display='none';box.innerHTML='';}}
   }catch(e){}
   return out;};}
 if(typeof collectIssue==='function'){const o=collectIssue;
  window.collectIssue=function(){const out=o.apply(this,arguments);const el=$i('isExpCat');if(el&&typeof IS!=='undefined'&&IS)IS.expCat=el.value||DEF_CAT;return out;};}

 /* ---------- an item new to a franchise branch: its cost before it is received (R11) ---------- */
 function newCosts(items){
  const list=(items||[]).filter(i=>n(i.apQty)>0&&!DB.stock.some(x=>String(x.code).toLowerCase()===String(i.code).toLowerCase()));
  if(!list.length)return Promise.resolve({});
  return new Promise(res=>{
   const msg='<p>สินค้า '+list.length+' รายการยังไม่มีในทะเบียนของสาขา — กรอกทุนต่อหน่วย (ใช้เป็นต้นทุน FIFO และทุนในทะเบียน)</p>'
    +'<table class="tbl"><thead><tr><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th class="num">จำนวน</th><th class="num">ทุนต่อหน่วย</th></tr></thead><tbody>'
    +list.map((i,k)=>`<tr><td class="mono">${esc(i.code)}</td><td>${esc(i.name||'')}</td><td class="num">${qf(i.apQty)} ${esc(i.unit||'')}</td>`
     +`<td class="num"><input type="number" min="0" step="0.01" class="pkg-newcost" data-k="${k}" aria-label="ทุนต่อหน่วย ${esc(i.code)}" style="width:110px;text-align:right"></td></tr>`).join('')+'</tbody></table>';
   askConfirm({title:'ทุนของสินค้าใหม่',msg,yes:'รับของเข้าสต๊อก',no:'ยังไม่รับ',
    onYes:()=>{const out={};let bad=0;
     document.querySelectorAll('#askMsg .pkg-newcost').forEach(el=>{const i=list[+el.dataset.k],v=parseFloat(el.value);if(!(v>0))bad++;else out[String(i.code).toLowerCase()]=r2(v);});
     if(bad){toast('กรอกทุนต่อหน่วยของสินค้าใหม่ให้ครบทุกรายการ');res(null);}else res(out);},
    onNo:()=>res(null)});
  });
 }

 /* ---------- a stock move's unit cost, read from the FIFO ledger (finding 9) ---------- */
 function moveCost(m){if(!m)return null;const no=m.refNo;
  const avg=list=>{const q=list.reduce((t,x)=>t+n(x.qty),0);return q>EPS?r2(list.reduce((t,x)=>t+n(x.qty)*n(x.cost),0)/q):null;};
  const lots=no?F().lots.filter(l=>l&&l.stockId===m.stockId&&l.refNo===no):[],al=no?F().allocs.filter(a=>a&&a.stockId===m.stockId&&a.refNo===no):[];
  const q=m.type==='out'?-1:m.type==='in'?1:Math.sign(n(m.qty));
  const v=q>0?(avg(lots)!=null?avg(lots):avg(al)):avg(al);
  return v!=null?v:(n(m.cost)>0?n(m.cost):null);}

 window.PKG_STOCK_FIFO={negOk,negRight,avgOf,book,docBook,shortLeft,sellShort,countBack,cutFromCount,uncutFromCount,newCosts,moveCost};
})();
