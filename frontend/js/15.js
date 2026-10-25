/* 4.4 ตัดสต็อกสินค้า (user 2026-10-03, WAREHOUSE-PLAN.md) — 4.4 ขายหน้าร้าน and 4.5 ตัดสต็อก merged into one page, the
   window modelled on the reference ERP's "ตัดสต็อกขายสินค้า". Replaces quote-stock.js (cut when the receipt was saved).
   One document (SA, prefix "SA" until the numbering phase) per sale: either a counter sale (items picked here) or a
   repair job (the lines of an approved quote, pulled by its number; 1 SA per quote). "ชำระเงิน" records how the customer
   pays (cash / transfer / card / cheque / credit) and cuts the stock at once; a centred pop-up then offers the next step.
   The receipt / invoice is never made automatically (user): "ใบแจ้งหนี้ / ใบเสร็จรับเงิน" opens a 4.1 form filled from the
   SA (its lines locked, the payment carried over). A quote with parts can be billed at 4.1 only after its SA exists.
   Cancelling a receipt cancels the money only. Cancelling an SA (reason required, only when nothing active bills it)
   returns every line as stock movements that carry the SA number (FIFO puts them back into the same lots); the record
   stays (red). Old 4.4 counter receipts and the stock-cut records made earlier today become SA records once. */
(()=>{
 if(typeof logMove!=='function'||typeof pkgStockLines!=='function'||!document.getElementById('scutTbl'))return;
 const $i=id=>document.getElementById(id);
 const openQ=()=>{try{return (0,eval)('Q');}catch(e){return null;}};
 const openR=()=>{try{return (0,eval)('R');}catch(e){return null;}};
 const call=f=>{if(typeof window[f]==='function')try{window[f]();}catch(e){}};
 const L=()=>DB.stockCuts||(DB.stockCuts=[]);
 const PREFIX='SA';
 const owner=()=>!curEmp();
 const may=a=>owner()||can('m.rcptCut_'+a);
 const need=a=>typeof pkgPermNeed==='function'?pkgPermNeed('rcptCut',a):(may(a)||(toast('บัญชีนี้ไม่มีสิทธิ์ใน 04.4 · ตัดสต็อกสินค้า'),false));
 const WH='คลังหลัก';
 /* branch.js: the document's branch name (documents carry br; none = main) */
 const BR=()=>window.PKG_BRANCH,whNow=()=>BR()?BR().cur().name:WH,whOf=c=>BR()?((BR().get(BR().brOf(c))||{}).name||WH):(c.wh||WH),hereQ=q=>!BR()||BR().here(q);
 const CH={retail:'ขายหน้าร้าน',repair:'งานซ่อม'};
 const MN=k=>window.PKG_SALE&&PKG_SALE.menu?PKG_SALE.menu(k):({cut:'4.4',doc:'4.1'})[k];   /* menu number in messages: 4.4 today, 4.1 when the new flow re-orders menu 04 */
 const flowOn=()=>!!(window.PKG_SALE&&PKG_SALE.on()),SP=()=>flowOn()&&window.PKG_SALE_PAY?window.PKG_SALE_PAY:null;   /* ระบบขายแบบใหม่ (sale-flow.js / sale-pay.js) — everything they add here is behind this */
 const PAY={cash:'เงินสด',trans:'เงินโอน',card:'บัตรเครดิต',chk:'เช็ค',credit:'ขายเชื่อ (ค้างชำระ)'};
 if(typeof AUD_KIND==='object')AUD_KIND.stockcut='ใบตัดสต็อกสินค้า (4.4)';
 if(typeof AUD_ACT==='object')Object.assign(AUD_ACT,{cut:'ตัดสต็อก (4.4)',restock:'คืนสต๊อก',revise:'ทำฉบับแก้ไข'});
 if(typeof AUD_CLS==='object')Object.assign(AUD_CLS,{cut:'a',restock:'g',revise:'a'});
 const takenO=docNoTaken;docNoTaken=function(no){return takenO.apply(this,arguments)||L().some(x=>x.no===no);};

 /* ---------- helpers ---------- */
 const qLines=q=>pkgStockLines(qItemsClean(q));
 const filled=it=>it&&(String(it.code||'').trim()||String(it.name||'').trim()||n(it.price));
 const tot=d=>receiptTotals({items:(d.items||[]).filter(filled),disc:n(d.disc),vat:n(d.vat),adj:d.adj,wht:0,whtBase:'labor',pay:{}});
 const activeCut=q=>q?L().find(c=>!c.cancelled&&!c.superseded&&c.quoteId===q.id)||null:null;
 const lastCut=q=>q?L().filter(c=>c.quoteId===q.id).slice(-1)[0]||null:null;
 /* billing documents of a quote / of an SA */
 function bills(q,all){
  if(!q)return [];
  return [...DB.receipts.filter(r=>!r.pkgSale&&r.quoteId===q.id&&(all||!r.cancelled)).map(r=>({kind:'receipt',label:r.taxNo?'ใบเสร็จ / ใบกำกับภาษี':'ใบเสร็จรับเงิน',no:r.no+(r.taxNo&&r.taxNo!==r.no?' · '+r.taxNo:''),id:r.id,cancelled:!!r.cancelled})),
   ...DB.invoices.filter(v=>v.srcType==='quote'&&(v.refIds||[]).includes(q.id)&&(all||!v.cancelled)).map(v=>({kind:'invoice',label:'ใบแจ้งหนี้',no:v.no,id:v.id,cancelled:!!v.cancelled}))];
 }
 const activeBills=q=>bills(q,false);
 function saleBills(d,all){
  if(!d)return [];if(d.quoteId)return bills(findQuote(d.quoteId),all);
  return DB.receipts.filter(r=>!r.pkgSale&&(r.saleId===d.id||(d.receiptId&&r.id===d.receiptId))&&(all||!r.cancelled))
   .map(r=>({kind:'receipt',label:r.taxNo?'ใบเสร็จ / ใบกำกับภาษี':'ใบเสร็จรับเงิน',no:r.no+(r.taxNo&&r.taxNo!==r.no?' · '+r.taxNo:''),id:r.id,cancelled:!!r.cancelled}));
 }
 const waiting=()=>DB.quotes.filter(q=>hereQ(q)&&q.no&&!q.cancelled&&!q.superseded&&isApproved(q)&&!activeCut(q)&&(qLines(q).length||flowOn())&&!activeBills(q).length);
 function noFor(date){
  const d=String(date||iso()),base=PREFIX+'.'+String(+d.slice(0,4)+543).slice(2)+'-'+d.slice(5,7)+'-'+d.slice(8,10);
  let i=1;while(docNoTaken(base+'-'+String(i).padStart(2,'0')))i++;return base+'-'+String(i).padStart(2,'0');
 }
 function costs(c){
  const al=(DB.fifo&&Array.isArray(DB.fifo.allocs))?DB.fifo.allocs:[],by={};
  al.filter(a=>a.refNo===c.moveRef).forEach(a=>{const b=by[a.stockId]||(by[a.stockId]={q:0,v:0});b.q+=n(a.qty);b.v+=n(a.qty)*n(a.cost);});
  (c.lines||[]).forEach(it=>{const b=by[it.stockId],s=DB.stock.find(x=>x.id===it.stockId);it.cost=b&&b.q>0?b.v/b.q:n(s&&s.cost);});
  c.cost=(c.lines||[]).reduce((t,it)=>t+n(it.qty)*n(it.cost),0);return c;
 }
 const pick=lines=>lines.map(it=>({stockId:it.stockId,code:it.code||'',name:it.name||'',unit:it.unit||'',qty:n(it.qty),kit:it.kit||''}));
 const plainItems=items=>JSON.parse(JSON.stringify((items||[]).filter(filled)));
 function fromSrc(c,src){if(src&&src.createdAt){c.createdBy=src.createdBy||'';c.createdByName=src.createdByName||'';c.createdAt=src.createdAt;c.updatedBy=c.createdBy;c.updatedByName=c.createdByName;c.updatedAt=c.createdAt;}return c;}
 function payOfReceipt(r){
  if(!r||!r.pay)return null;const p=r.pay,m=p.credit?'credit':p.cash?'cash':p.trans?'trans':p.card?'card':p.chk?'chk':'';
  return m?{method:m,amount:receiptTotals(r).net,bank:p.bank||'',days:n(p.days),due:p.due||''}:null;
 }
 /* ---------- existing data → SA records (once) ---------- */
 function retitle(c,no){   /* a record made earlier under CS: same moves, renamed */
  const old=c.no;c.no=no;
  if(c.moveRef===old){
   (DB.moves||[]).forEach(m=>{if(m.refNo===old){m.refNo=no;m.ref=String(m.ref||'').split(old).join(no).replace('ตัดสต๊อก ','ตัดสต็อก ');}});
   if(DB.fifo){(DB.fifo.allocs||[]).forEach(a=>{if(a.refNo===old)a.refNo=no;});(DB.fifo.lots||[]).forEach(l=>{if(l.refNo===old)l.refNo=no;});}
   c.moveRef=no;
  }
 }
 function fill(c){   /* the sale fields an older record lacks */
  const q=c.quoteId?findQuote(c.quoteId):null,r=c.receiptId?DB.receipts.find(x=>x.id===c.receiptId):null,src=q||r;
  if(!c.items&&src){c.items=plainItems(src.items);c.disc=n(src.disc);c.vat=n(src.vat);}
  if(!c.channel)c.channel=c.quoteId?'repair':'retail';
  if(!c.wh)c.wh=WH;
  if(c.pay===undefined){const rr=r||(q&&DB.receipts.filter(x=>x.quoteId===q.id).slice(-1)[0]);c.pay=payOfReceipt(rr);c.paid=!!(rr&&rr.paid);}
  if(!c.tier)c.tier=(q&&q.tier)||'B';
  return c;
 }
 function ensure(){
  if(typeof DB!=='object'||!DB||DB.pkgCutsV===2)return;
  const list=L();
  if(DB.pkgCutsV===1){list.forEach(c=>{if(/^CS\./.test(c.no))retitle(c,noFor(c.date));fill(c);});}
  (DB.quotes||[]).forEach(q=>{
   if(!q.deducted||!q.no||list.some(c=>c.quoteId===q.id))return;
   const lines=qLines(q);if(!lines.length)return;
   const mv=(DB.moves||[]).find(m=>m.refNo===q.no&&n(m.qty)<0);
   const c=fromSrc({id:uid(),src:'quote',legacy:true,quoteId:q.id,quoteNo:q.no,custId:q.custId,vehIdx:q.vehIdx,date:(mv&&mv.date)||q.date,lines:pick(lines),moveRef:q.no,cancelled:false},q);
   c.no=noFor(c.date);fill(c);costs(c);
   if(q.cancelled){c.cancelled=true;c.cancelReason='ยกเลิกพร้อมใบเสนอราคา '+q.no;c.cancelDate=q.cancelDate||q.date;}
   else q.stockCutId=c.id;
   list.push(c);
  });
  (DB.receipts||[]).forEach(r=>{
   if(!r.deducted||r.quoteId||r.saleId||!r.no||list.some(c=>c.receiptId===r.id))return;
   const lines=pkgStockLines(rItemsClean(r));if(!lines.length)return;
   const c=fromSrc({id:uid(),src:'sale',legacy:true,receiptId:r.id,receiptNo:r.no,custId:r.custId,vehIdx:r.vehIdx,date:r.date,lines:pick(lines),moveRef:r.no,cancelled:false},r);
   c.no=noFor(c.date);fill(c);costs(c);
   if(r.cancelled){c.cancelled=true;c.cancelReason='ยกเลิกพร้อมใบเสร็จ '+r.no;c.cancelDate=r.cancelDate||r.date;}
   list.push(c);
  });
  /* staff: the old 4.4 counter-sale rights carry over to the merged page */
  (DB.emp||[]).forEach(e=>{const m=e.perms&&e.perms.m;if(!m||e.perms.pkgCutV===2)return;
   ['view','add','cancel','print','own'].forEach(a=>{if(m['rcptRetail_'+a])m['rcptCut_'+a]=true;});e.perms.pkgCutV=2;});
  DB.pkgCutsV=2;
 }
 function syncOpen(q){
  const w=openQ();if(!w||w.id!==q.id)return;
  if(w!==q){w.deducted=q.deducted;w.stockCutId=q.stockCutId||'';w.status=q.status;if(q.apv)w.apv=JSON.parse(JSON.stringify(q.apv));}
  if($i('mQuoteEdit')?.classList.contains('on'))call('fillQuoteForm');
 }
 function refresh(){['renderStock','renderQuoteOverview','refreshQuoteRefs','refreshReceiptRefs','renderApvBars','renderHome'].forEach(call);
  if(typeof rOvPane!=='undefined'&&rOvPane==='retail')pkgRenderCuts();}

 /* ---------- create (pay) / cancel ---------- */
 const lineTable=(lines,want)=>`<table class="tbl pkg-cut-lines"><thead><tr><th class="ctr" style="width:40px">#</th><th style="width:130px">รหัสสินค้า</th><th>รายการ</th>
  <th class="num" style="width:110px">จำนวน</th><th class="num" style="width:110px">คงเหลือตอนนี้</th></tr></thead><tbody>${lines.map((it,i)=>{
   const s=DB.stock.find(x=>x.id===it.stockId),short=s&&want.get(it.stockId)>n(s.qty);
   return `<tr${short?' class="pkg-cut-short"':''}><td class="ctr">${i+1}</td><td class="mono">${esc(it.code||'')}</td><td>${esc(it.name||'')}${it.kit?'<div class="hint">ชุด '+esc(it.kit)+'</div>':''}</td>
    <td class="num">${qf(it.qty)} ${esc(it.unit||'')}</td><td class="num">${s?qf(s.qty):'-'}${short?' ⚠':''}</td></tr>`;}).join('')}</tbody></table>`;
 /* the one place an SA is written: checks, stock-short question, number, stock out, quote flags */
 async function createDoc(S,pay,opts){
  opts=opts||{};ensure();
  const items=plainItems(S.items);
  if(!items.length){toast('ยังไม่มีรายการสินค้า');return null;}
  if(!need('add'))return null;
  let q=null;
  if(S.quoteId){
   q=findQuote(S.quoteId);
   if(!q||!q.no){toast('ไม่พบใบเสนอราคา');return null;}
   if(q.cancelled){toast('ใบเสนอราคา '+q.no+' ถูกยกเลิกแล้ว — ตัดสต็อกไม่ได้');return null;}
   if(q.superseded){toast('ใบเสนอราคา '+q.no+' ถูกแก้ไขเป็น '+(q.revisedTo||'ฉบับใหม่')+' แล้ว — ใช้ฉบับล่าสุด');return null;}
   if(!isApproved(q)){toast('ใบเสนอราคา '+q.no+' ยังไม่ได้อนุมัติ — ต้องอนุมัติก่อนจึงจะตัดสต็อกได้');return null;}
   const cur=activeCut(q);if(cur){toast('ใบเสนอราคา '+q.no+' ตัดสต็อกแล้ว — ใบตัดสต็อก '+cur.no);return null;}
  }
  const lines=pkgStockLines(items);
  if(!lines.length&&!q){toast('ไม่มีรายการสินค้าในสต๊อก');return null;}
  const want=new Map();lines.forEach(it=>want.set(it.stockId,(want.get(it.stockId)||0)+n(it.qty)));
  const back=window.PKG_STOCK_FIFO?PKG_STOCK_FIFO.countBack(S):null;   /* DriveGo new system (task 3.6, R10-ก): a stock count's shortage sold to whoever is responsible comes back first */
  const short=[...want].filter(([id,v])=>{const s=DB.stock.find(x=>x.id===id);return s&&v>n(s.qty)+(back?n(back.get(id)):0);}).length;
  if(lines.length&&short&&window.PKG_STOCK_FIFO&&!PKG_STOCK_FIFO.negOk(short))return null;   /* DriveGo new system (task 3.6, R9-ข): negative stock for the owner and approvers only */
  if(lines.length&&(short||opts.confirm)&&!await askP({title:opts.title||(short?'สต๊อกไม่พอ':'ยืนยันตัดสต็อก'),
   msg:lineTable(lines,want)+(short?'<p class="pkg-cut-warn">⚠ อะไหล่ '+short+' รายการมีไม่พอ — ตัดแล้วสต๊อกจะติดลบ (ตัวเลขติดลบคือสัญญาณว่าต้องไปตามของเข้าระบบ)</p>':'')
    +'<p style="margin:8px 0 0">บันทึกแล้วระบบจะตัดสต๊อกทันที — ยืนยันหรือไม่?</p>',
   yes:short?'ตัดสต็อก (ยอมติดลบ)':'ตัดสต็อก',no:'ยังไม่ตัด'}))return null;
  if(window.PKG_EXPIRY&&!(await PKG_EXPIRY.guardSale(lines)))return null;   /* stock-expiry.js — expired lots: block / skip the lot / right-holder confirms. KEEP this one line just before stock is cut */
  const c={id:uid(),no:docNo(PREFIX),date:iso(),src:q?'quote':'walkin',channel:q?'repair':(S.channel||'retail'),wh:whNow(),
   quoteId:q?q.id:'',quoteNo:q?q.no:'',custId:S.custId||'',vehIdx:S.vehIdx==null?-1:S.vehIdx,seller:S.seller||'',sellerName:S.seller?empName(S.seller,''):'',
   tier:S.tier||'B',items,disc:n(S.disc),vat:n(S.vat),note:S.note||'',remark:S.remark||'',ref:S.ref||'',lines:pick(lines),cancelled:false,printed:false};
  {const why=S.noVatReason||(q&&q.noVatReason);if(why&&!c.vat)c.noVatReason=why;}   /* DriveGo new system (task 3.3, R4-ข) */
  c.moveRef=c.no;stampRec(c,null);
  const t=tot(c);c.total=t.gross;
  c.pay=pay?Object.assign({amount:t.gross},pay):null;c.paid=!!(pay&&pay.method!=='credit');
  if(window.PKG_STOCK_FIFO)PKG_STOCK_FIFO.cutFromCount(c,S);   /* DriveGo new system (task 3.6, R10-ก) */
  c.lines.forEach(it=>{const s=DB.stock.find(x=>x.id===it.stockId);if(!s)return;s.qty=n(s.qty)-n(it.qty);s.lastMove=iso();
   logMove(s.id,'out',-n(it.qty),iso(),'ตัดสต็อก '+c.no+(q?' · ใบเสนอราคา '+q.no:' · '+CH[c.channel])+(it.kit?' · ชุด '+it.kit:''),c.no);});
  costs(c);L().push(c);
  if(q){q.deducted=true;q.stockCutId=c.id;q.status='ตัดสต็อกแล้ว';syncOpen(q);logAudit('quote',q,'deduct','ตัดสต็อก '+c.lines.length+' รายการ · ใบตัดสต็อก '+c.no);}
  logAudit('stockcut',c,'cut','ตัดสต็อก '+c.lines.length+' รายการ'+(q?' · ใบเสนอราคา '+q.no:' · '+CH[c.channel])+(c.pay?' · '+payLabel(c.pay):'')+(c.noVatReason?' · ไม่คิด VAT: '+c.noVatReason:''));
  if(window.PKG_SALE&&PKG_SALE.on())PKG_SALE.onCreate(c,S,opts);   /* sale-flow.js: ledger record + first payment / credit; paid and pay become derived */
  save();refresh();
  return c;
 }
 /* programmatic: an approved quote straight to an SA (used by tests and kept for other callers) */
 async function cutQuote(q,opts){
  opts=opts||{};if(!q)return null;
  if(!q.no){toast('บันทึกใบเสนอราคาก่อน จึงจะตัดสต็อกได้');return null;}
  const cur=activeCut(q);if(cur){toast('ใบนี้ตัดสต็อกแล้ว — ใบตัดสต็อก '+cur.no);return cur;}
  if(!q.cancelled&&!q.superseded&&!qLines(q).length&&!flowOn()){toast('ใบเสนอราคา '+q.no+' ไม่มีรายการอะไหล่ในสต๊อก ไม่ต้องตัดสต็อก — ออกใบเสร็จได้เลย');return null;}
  return createDoc({quoteId:q.id,custId:q.custId,vehIdx:q.vehIdx,items:qItemsClean(q),disc:q.disc,vat:q.vat,tier:q.tier,ref:q.no},opts.pay||null,{confirm:!opts.quiet});
 }
 async function cancelCut(id){
  ensure();const c=L().find(x=>x.id===id);if(!c)return false;
  if(c.cancelled){toast('ใบตัดสต็อก '+c.no+' ถูกยกเลิกแล้ว');return false;}
  if(window.PKG_TAX_PERIOD&&PKG_TAX_PERIOD.lockedDoc(c))return false;   /* DriveGo new system (task 3.3, T5): its VAT month is closed */
  if(c.src==='sale'){toast('ใบตัดสต็อกนี้มาจากบิลขายหน้าร้านเดิม '+(c.receiptNo||'')+' — ยกเลิกที่บิลนั้น ระบบจะคืนสต๊อกให้เอง');return false;}
  if(!need('cancel'))return false;
  if(typeof pkgOwnOk==='function'&&!pkgOwnOk('rcptCut',c)){toast('บัญชีนี้ยกเลิกได้เฉพาะใบตัดสต็อกที่ตนเองสร้าง');return false;}
  if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk(c))return false;
  const b=saleBills(c,false);
  if(b.length){toast('ใบตัดสต็อก '+c.no+' ออก '+b.map(x=>x.label+' '+x.no).join(', ')+' แล้ว — ต้องยกเลิกเอกสารเก็บเงินก่อน จึงจะยกเลิกใบตัดสต็อกได้');return false;}
  if(window.PKG_SALE&&PKG_SALE.on()&&!PKG_SALE.canCancel(c))return false;
  const reason=await askPromptP({title:'ยกเลิกใบตัดสต็อก '+c.no,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\nสินค้าทุกรายการในใบนี้จะคืนเข้าสต๊อก',yes:'ยกเลิกและคืนสต๊อก',no:'ไม่ยกเลิก'});
  if(reason===null)return false;
  if(!String(reason).trim()){toast('ต้องระบุเหตุผลที่ยกเลิก');return false;}
  const q=c.quoteId?findQuote(c.quoteId):null;costs(c);
  c.lines.forEach(it=>{const s=DB.stock.find(x=>x.id===it.stockId);if(!s)return;s.qty=n(s.qty)+n(it.qty);s.lastMove=iso();
   logMove(s.id,'in',n(it.qty),iso(),'คืนสต๊อก · ยกเลิกใบตัดสต็อก '+c.no+(q?' · ใบเสนอราคา '+q.no:''),c.moveRef);});
  if(window.PKG_STOCK_FIFO)PKG_STOCK_FIFO.uncutFromCount(c);   /* DriveGo new system (task 3.6, R10-ก): what was sold of a count's shortage is short again */
  Object.assign(c,{cancelled:true,cancelReason:String(reason).trim(),cancelDate:iso(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});
  if(q){q.deducted=false;q.stockCutId='';q.status='ยกเลิกตัดสต็อกแล้ว';syncOpen(q);logAudit('quote',q,'restock','คืนสต๊อก · ยกเลิกใบตัดสต็อก '+c.no+' — '+c.cancelReason);}
  logAudit('stockcut',c,'restock','ยกเลิกใบตัดสต็อก · คืนสต๊อก '+c.lines.length+' รายการ — '+c.cancelReason);
  if(window.PKG_SALE&&PKG_SALE.on())PKG_SALE.onCancel(c);
  save();refresh();if(W.cur&&W.cur.id===c.id)openSaved(c.id);
  toast('ยกเลิกใบตัดสต็อก '+c.no+' แล้ว · คืนสต๊อก '+c.lines.length+' รายการ');
  return true;
 }

 /* ---------- 4.1: receipts never made automatically; this opens the form filled from the SA ---------- */
 function applyPay(c){
  const r=openR();if(!r||!c.pay)return;const p=r.pay,q=c.pay,amt=n(receiptTotals(r).net)||n(q.amount);
  Object.assign(p,{cash:false,trans:false,card:false,chk:false,credit:false,cashAmt:0,transAmt:0,cardAmt:0,chkAmt:0});
  if(q.methods){   /* the 4.1-style payment (all fields, card surcharge included) */
   ['cash','trans','card','chk','credit','cashAmt','transAmt','cardAmt','chkAmt','bank','when','transLines','cardBank','card4','cardType','cardLines','cardPct','cardRef','chkBank','chkNo','chkDate','cashGiven','changeMode'].forEach(k=>{if(q[k]!==undefined)p[k]=JSON.parse(JSON.stringify(q[k]));});
   if(q.credit){p.days=n(q.days)||p.days;p.due=q.due||p.due;}
   if(q.by)r.by=q.by;if(q.note)r.note=q.note;return;
  }
  ({cash:()=>{p.cash=true;p.cashAmt=amt;},trans:()=>{p.trans=true;p.transAmt=amt;p.bank=q.bank||p.bank;},card:()=>{p.card=true;p.cardAmt=amt;},chk:()=>{p.chk=true;p.chkAmt=amt;},
    credit:()=>{p.credit=true;p.days=n(q.days)||p.days;p.due=q.due||p.due;}})[q.method]?.();
 }
 async function billFromSale(id){
  ensure();const c=L().find(x=>x.id===id);if(!c)return;
  if(c.cancelled)return toast('ใบตัดสต็อก '+c.no+' ถูกยกเลิกแล้ว');
  if(SP()&&PKG_SALE.led(c)){pkgOpenCut(c.id);return toast('รับชำระที่ใบตัดสต็อก '+c.no+' แล้วกด “สร้างใบเสร็จรับเงิน” (หรือที่ 4.3 ใบเสร็จรับเงิน)');}
  if(!can('doc.rIssue'))return toast('บัญชีนี้ไม่มีสิทธิออกใบเสร็จ / ใบแจ้งหนี้');
  const b=saleBills(c,false).filter(x=>x.kind==='receipt');
  if(b.length){toast('ใบตัดสต็อกนี้ออก '+b[0].label+' '+b[0].no+' แล้ว — เปิดใบนั้นให้');closeAll();return openReceiptById(b[0].id);}
  closeAll();
  if(c.quoteId){await billFromQuote(c.quoteId);const r=openR();if(!r||r.quoteId!==c.quoteId)return;r.saleId=c.id;applyPay(c);fillReceiptForm();return;}
  R=blankReceipt();Object.assign(R,{saleId:c.id,ref:c.no,custId:c.custId,vehIdx:c.vehIdx<0?0:c.vehIdx,items:plainItems(c.items).map(it=>Object.assign({warr:''},it)),disc:n(c.disc),vat:n(c.vat),deducted:true});
  applyPay(c);fillReceiptForm();go('receipt');openModal('mReceiptEdit');
  toast('เปิดใบเสร็จจากใบตัดสต็อก '+c.no+' — รายการล็อกตามใบตัดสต็อก ตรวจแล้วกดบันทึก');
 }

 /* ---------- the quote can be billed only after its SA ---------- */
 /* "not cut yet" — a proper centred card (user 2026-10-09: the plain question looked unfinished): which quote / customer /
    car, how many parts, the two steps (cut at 4.4 → then bill at 4.1) and one clear button that goes there. */
 function askCutFirst(q){
  return new Promise(res=>{
   const cu=findCust(q.custId),v=cu&&(cu.vehicles||[])[q.vehIdx],parts=qLines(q).length,tot=typeof quoteTotals==='function'?quoteTotals(q).total:0;
   const box=document.createElement('div');box.id='pkg-cutfirst';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','pkgCfT');
   box.innerHTML=`<div class="cf-card">
    <div class="cf-top"><span class="cf-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg></span>
     <div><h3 id="pkgCfT">ยังไม่ได้ตัดสต็อก</h3><p>ต้องตัดสต็อกอะไหล่ของใบนี้ก่อน จึงจะออกใบเสร็จ / ใบแจ้งหนี้ได้</p></div></div>
    <div class="cf-doc"><div class="cf-no">${esc(q.no)}</div><div class="cf-who">${esc(custName(cu)||'-')}${v?' · '+esc(plateOf(v)):''}</div>
     <div class="cf-fig"><span><b>${parts}</b> รายการอะไหล่</span><span>ยอด <b>${money(tot)}</b> บาท</span></div></div>
    <ol class="cf-steps"><li class="on"><b>1</b><span>ตัดสต็อก<small>${MN('cut')} ตัดสต็อกสินค้า</small></span></li><li class="arr" aria-hidden="true">›</li><li><b>2</b><span>ออกเอกสารเก็บเงิน<small>${MN('doc')} ใบเสร็จ / ใบแจ้งหนี้</small></span></li></ol>
    <p class="cf-note">กด “ไปหน้าตัดสต็อก” ระบบจะเปิดหน้าตัดสต็อกพร้อมรายการของใบนี้ให้ ตรวจแล้วกดบันทึก</p>
    <div class="cf-btns"><button type="button" class="btn gh" data-a="no">ไว้ทีหลัง</button><button type="button" class="btn grn cf-go" data-a="yes">ไปหน้าตัดสต็อก <span aria-hidden="true">→</span></button></div></div>`;
   const done=v=>{document.removeEventListener('keydown',key,true);box.remove();res(v);};
   const key=e=>{if(e.key==='Escape'){e.stopPropagation();done(false);}};
   box.addEventListener('click',e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(a)return done(a==='yes');if(e.target===box)done(false);});
   document.addEventListener('keydown',key,true);(document.getElementById('pkg-app')||document.body).append(box);box.querySelector('.cf-go').focus();
  });
 }
 readyQuoteInline=async function(q){
  ensure();
  if(!q)return false;
  if(q.cancelled){toast('ใบเสนอราคา '+q.no+' ถูกยกเลิกแล้ว ออกใบเสร็จไม่ได้ — คัดลอกเป็นใบใหม่ก่อน');return false;}
  if(!q.no){toast('ใบเสนอราคานี้ยังไม่ได้บันทึก จึงยังออกใบเสร็จ / ใบแจ้งหนี้ไม่ได้');return false;}
  if(q.superseded){toast('ใบเสนอราคา '+q.no+' ถูกแก้ไขเป็น '+(q.revisedTo||'ฉบับใหม่')+' แล้ว — ใช้ฉบับล่าสุด');return false;}
  if(!isApproved(q)){
   if(!can('apv.quote')){toast('ใบเสนอราคา '+q.no+' ยังไม่ผ่านการอนุมัติ และบัญชีนี้ไม่มีสิทธิอนุมัติ — ให้ผู้มีสิทธิอนุมัติก่อน');return false;}
   if(!await askP({title:'ใบเสนอราคายังไม่ได้อนุมัติ',text:'ใบเสนอราคา '+q.no+' ยังไม่ได้อนุมัติ\n\nอนุมัติให้เลยตอนนี้หรือไม่?',yes:'อนุมัติ',no:'ไม่ดึงใบนี้'}))return false;
   q.apv={status:'approved',by:DB.curEmp||'',byName:meName(),date:iso(),note:''};syncOpen(q);
   logAudit('quote',q,'approve','อนุมัติจากหน้าเอกสารเก็บเงิน โดย '+meName());save();
  }
  if((qLines(q).length||flowOn())&&!activeCut(q)){
   /* centred question that takes the user straight to this quote's 4.4 cut (user 2026-10-09: no going out and back in) */
   if(await askCutFirst(q)){
    ['mReceiptEdit','mInvoiceEdit','mQuoteEdit'].forEach(id=>{const m=$i(id);if(m&&m.classList.contains('on'))closeModal(id);});
    openNew(q.id);}
   return false;}
  return true;
 };
 const saveRO=saveReceipt;
 saveReceipt=async function(){
  ensure();
  const r=openR(),q=r&&r.quoteId&&!r.cancelled&&!r.no?findQuote(r.quoteId):null;
  if(q&&!await readyQuoteInline(q))return;
  if(r&&r.saleId&&!r.no){const c=L().find(x=>x.id===r.saleId);
   if(!c||c.cancelled)return toast('ใบตัดสต็อกที่อ้างถึงถูกยกเลิกแล้ว — ออกใบเสร็จจากใบนี้ไม่ได้');
   const dup=DB.receipts.find(x=>!x.cancelled&&x.saleId===c.id&&x.id!==r.id);if(dup)return toast('ใบตัดสต็อก '+c.no+' ออกใบเสร็จ '+dup.no+' ไปแล้ว');
   if(!c.quoteId){r.items=plainItems(c.items).map((it,i)=>Object.assign({warr:(r.items[i]&&r.items[i].warr)||''},it));r.deducted=true;}}
  const was=!!(r&&r.deducted),out=await saveRO.apply(this,arguments),now=r&&DB.receipts.find(x=>x.id===r.id);
  if(now&&!now.quoteId&&!now.saleId&&now.deducted&&!was&&!L().some(c=>c.receiptId===now.id))legacySale(now);
  if(now&&(now.quoteId||now.saleId))refresh();
  return out;
 };
 /* an older counter receipt saved through another path still lands in the register */
 function legacySale(r){
  const lines=pkgStockLines(rItemsClean(r));if(!lines.length)return;
  const c={id:uid(),no:docNo(PREFIX),date:r.date||iso(),src:'sale',channel:'retail',wh:whNow(),receiptId:r.id,receiptNo:r.no,custId:r.custId,vehIdx:r.vehIdx,lines:pick(lines),moveRef:r.no,cancelled:false};
  stampRec(c,null);fill(c);costs(c);L().push(c);logAudit('stockcut',c,'cut','ตัดสต็อก '+c.lines.length+' รายการ · บิล '+r.no);save();
 }
 const cancelRO=cancelReceiptDoc;
 cancelReceiptDoc=async function(id){
  const out=await cancelRO.apply(this,arguments),r=DB.receipts.find(x=>x.id===id);
  if(r&&r.cancelled){
   const c=L().find(x=>!x.cancelled&&x.src==='sale'&&x.receiptId===r.id);
   if(c){Object.assign(c,{cancelled:true,cancelReason:'ยกเลิกพร้อมบิล '+r.no+(r.cancelReason?' — '+r.cancelReason:''),cancelDate:iso(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});
    logAudit('stockcut',c,'restock','คืนสต๊อกพร้อมการยกเลิกบิล '+r.no);save();}
   refresh();
  }
  return out;
 };
 ['cancelInvoiceDoc','delInvoiceDoc'].forEach(name=>{const o=window[name];if(typeof o!=='function')return;window[name]=async function(){const out=await o.apply(this,arguments);refresh();return out;};});
 const eligO=eligibleInvoiceSrc;
 eligibleInvoiceSrc=function(custId,srcType){
  const out=eligO.apply(this,arguments);if(srcType!=='quote')return out;ensure();
  return out.filter(q=>!q.cancelled&&!q.superseded&&isApproved(q)&&(!qLines(q).length||activeCut(q)));
 };
 const saveIO=saveInvoiceDoc;
 saveInvoiceDoc=function(){
  if(typeof collectInvoice==='function')collectInvoice();
  let iv=null;try{iv=(0,eval)('IV');}catch(e){}
  if(iv&&iv.srcType==='quote'&&!iv.cancelled&&!iv.no){ensure();
   const bad=(iv.refIds||[]).map(findQuote).filter(Boolean).find(q=>q.cancelled||q.superseded||!isApproved(q)||(qLines(q).length&&!activeCut(q)));
   if(bad)return toast('ใบเสนอราคา '+bad.no+(bad.cancelled?' ถูกยกเลิกแล้ว':bad.superseded?' ถูกแก้ไขเป็นฉบับใหม่แล้ว':!isApproved(bad)?' ยังไม่ได้อนุมัติ':' ยังไม่ได้ตัดสต็อก ('+MN('cut')+')')+' — ออกใบแจ้งหนี้จากใบนี้ไม่ได้');}
  const out=saveIO.apply(this,arguments);refresh();return out;
 };
 const cancelQO=cancelQuoteDoc;
 cancelQuoteDoc=async function(){
  ensure();const w=openQ(),q=w&&findQuote(w.id);
  if(q&&q.superseded)return toast('ใบนี้ถูกแก้ไขเป็น '+(q.revisedTo||'ฉบับใหม่')+' แล้ว ไม่ต้องยกเลิก');
  const c=activeCut(q);if(c)return toast('ใบนี้ตัดสต็อกแล้ว (ใบตัดสต็อก '+c.no+') — ยกเลิกใบตัดสต็อกที่ '+MN('cut')+' ก่อน จึงจะยกเลิกใบเสนอราคาได้');
  const iv=q&&DB.invoices.find(v=>!v.cancelled&&v.srcType==='quote'&&(v.refIds||[]).includes(q.id));
  if(iv)return toast('ใบนี้อยู่ในใบแจ้งหนี้ '+iv.no+' — ต้องยกเลิกใบแจ้งหนี้ก่อน จึงจะยกเลิกใบเสนอราคาได้');
  return cancelQO.apply(this,arguments);
 };
 const cogsO=window.pkgFifoCogs;
 if(typeof cogsO==='function')window.pkgFifoCogs=function(r){
  const q=r&&r.quoteId?findQuote(r.quoteId):null,s=r&&r.saleId?L().find(x=>x.id===r.saleId):null,c=s||(q&&(activeCut(q)||lastCut(q)));
  if(c&&typeof pkgFifo==='object'){const got=pkgFifo.docCost(c.moveRef);if(got)return got.cost;}
  return cogsO.apply(this,arguments);
 };
 /* the quote window has no cut / receipt buttons (user): cut at 4.4, bill at 4.1 */
 window.approveQuote=async function(){const w=openQ();if(!w||!w.no)return toast('บันทึกใบเสนอราคาก่อน');return openNew(w.id);};
 document.querySelectorAll('[onclick*="approveQuote"]').forEach(b=>b.classList.add('pkg-io-moved'));
 /* the old counter-sale entry point opens the new window (the old receipt-based one stays reachable for old bills / tests) */
 const legacyRetail=window.newRetailReceipt;
 window.newRetailReceipt=function(){return openNew();};

 /* ---------- register 4.4 ---------- */
 const custOf=c=>findCust(c.custId),plate=c=>{const cu=custOf(c);return plateOf(cu&&(cu.vehicles||[])[c.vehIdx])||'';};
 const liveCost=c=>c.cancelled?n(c.cost):costs(c).cost;
 const custLabel=cu=>cu?((cu.code?'('+cu.code+') ':'')+custName(cu)):'ลูกค้าทั่วไป (เงินสด)';
 const totOf=c=>c.items?tot(c):{base:0,vat:0,gross:0};
 SORT_DEF.scutTbl={cols:{
  0:{lbl:'ช่องทางการขาย',key:c=>CH[c.channel]||''},1:{lbl:'วันที่สร้างข้อมูล',key:c=>String(c.createdAt||c.date||'')},
  2:{lbl:'เอกสารเลขที่',key:c=>String(c.no||'')},3:{lbl:'ชื่อลูกค้า',key:c=>custName(custOf(c))||''},
  4:{lbl:'ราคาก่อนภาษี',key:c=>totOf(c).base},5:{lbl:'ราคารวมทั้งสิ้น',key:c=>totOf(c).gross},
  6:{lbl:'พนักงานขาย',key:c=>c.sellerName||byShort(c)||''}}};   /* owner 12 Oct: the "#" (expand arrow) and "บันทึกภายในองค์กร / หมายเหตุ" columns are gone — 8 columns */
 MC_CFG.scutTbl={pri:[2,3,5],act:7};
 /* widths saved in 11.1 for the 10-column register (DB.regCols.scutTbl = {cols,w,hide}): drop the two columns, keep the rest in proportion */
 function layoutMig(){
  const rc=typeof DB==='object'&&DB&&DB.regCols&&DB.regCols.scutTbl;if(!rc||!Array.isArray(rc.cols))return;
  const gone=rc.cols.map((l,i)=>String(l).trim()==='#'||/^บันทึกภายในองค์กร/.test(String(l).trim())?i:-1).filter(i=>i>=0);if(!gone.length)return;
  const keep=a=>Array.isArray(a)?a.filter((x,i)=>!gone.includes(i)):a;
  rc.cols=keep(rc.cols);rc.hide=keep(rc.hide);
  if(Array.isArray(rc.w)){const w=keep(rc.w),t=w.reduce((a,b)=>a+n(b),0)||1,out=w.map(x=>Math.round(n(x)/t*1000)/10),d=Math.round((100-out.reduce((a,b)=>a+b,0))*10)/10;
   if(d&&out.length){const i=out.indexOf(Math.max(...out));out[i]=Math.round((out[i]+d)*10)/10;}rc.w=out;}
  if(Array.isArray(rc.order))delete rc.order;
 }
 if(typeof boot==='function'){const bootO=boot;boot=function(){const r=bootO.apply(this,arguments);try{layoutMig();}catch(e){}return r;};}
 try{layoutMig();}catch(e){}
 const open=new Set();
 let ACTTH=null;   /* the "จัดการ" header cell while it is out of the table (switch off) */
 window.pkgRenderCuts=function(){
  ensure();
  const today=iso(),mo=today.slice(0,7),all=L().filter(c=>typeof pkgOwnOk!=='function'||pkgOwnOk('rcptCut',c));
  if(typeof rOvPane!=='undefined'&&rOvPane==='retail'){
   if($i('rOvToday'))$i('rOvToday').textContent='วันนี้ '+all.filter(c=>c.date===today&&!c.cancelled).length+' ใบ';
   if($i('rOvMonth'))$i('rOvMonth').textContent='เดือนนี้ '+all.filter(c=>String(c.date).slice(0,7)===mo&&!c.cancelled).length+' ใบ';
  }
  const q=($i('scutSearch').value||'').toLowerCase().trim(),st=$i('scutState').value,ch=($i('scutChannel')||{}).value||'';
  let rows=all.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  if(st==='off')rows=rows.filter(c=>c.cancelled);
  else if(st==='on')rows=rows.filter(c=>!c.cancelled);
  else if(st==='unpaid')rows=rows.filter(c=>!c.cancelled&&!c.paid&&!saleBills(c,false).length);
  else if(st==='nobill')rows=rows.filter(c=>!c.cancelled&&!saleBills(c,false).length);
  else if(st&&flowOn())rows=rows.filter(c=>PKG_SALE.stateIs?PKG_SALE.stateIs(c,st):PKG_SALE.state(c)===st);
  if(ch)rows=rows.filter(c=>c.channel===ch);
  if(q)rows=rows.filter(c=>[c.no,c.quoteNo,c.receiptNo,custName(custOf(c)),plate(c),c.note,c.remark,...saleBills(c,true).map(b=>b.no),...(SP()?SP().nos(c):[])].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'scutDate');
  $i('scutCount').textContent=rows.length+' ใบ';
  $i('scutWait').textContent=waiting().length;
  document.querySelectorAll('.pkg-sa-new').forEach(b=>b.hidden=!may('add'));
  rows=sortRows('scutTbl',rows);rows=limitRows(rows,'scut');
  /* last column (owner 12 Oct): header "จัดการ", cell = "ปรับยอด" only (when the cut can be adjusted and the account may) —
     no "เปิด" (the document opens from its number), no "☐ พิมพ์" line (the printed state is in the document window).
     Without the new sale flow there is no "ปรับยอด", so the whole column is taken out of the table. */
  const ACT=!!(SP()&&SP().rowActs);
  {const hr=$i('scutTbl').tHead.rows[0],cur=hr.querySelector('th.pkg-sa-actth');if(cur)ACTTH=cur;
   if(ACTTH){if(ACT&&!ACTTH.isConnected)hr.append(ACTTH);if(!ACT&&ACTTH.isConnected)ACTTH.remove();}}
  $i('scutTbl').tBodies[0].innerHTML=rows.map(c=>{
   const cu=custOf(c),t=totOf(c),bl=saleBills(c,true),act=bl.filter(b=>!b.cancelled);
   const no=`<span class="docno" onclick="pkgOpenCut('${c.id}')">${c.cancelled?'<s>'+esc(c.no)+'</s>':esc(c.no)}</span>`
    +(c.quoteNo?`<div class="hint">ใบเสนอราคา ${esc(c.quoteNo)}</div>`:c.receiptNo?`<div class="hint">บิลเดิม ${esc(c.receiptNo)}</div>`:'')
    +act.map(b=>`<div class="hint">${esc(b.no)}</div>`).join('');
   const st2=SP()?SP().chip(c,1):c.cancelled?`<span class="stbtn st-red" title="${esc(c.cancelReason||'')}">ยกเลิกแล้ว</span>`
    :act.length?'<span class="stbtn st-green">ออกใบเสร็จแล้ว</span>':c.paid?'<span class="stbtn st-green">ชำระแล้ว</span>':'<span class="stbtn st-orange">ค้างชำระ</span>';
   return `<tr${c.cancelled?' class="cancelrow"':c.superseded?' class="pkg-sa-old"':''} data-cut="${c.id}">
    <td class="ctr">${esc(whOf(c))}<div class="pkg-sa-sub">${esc(CH[c.channel]||'')}</div></td>
    <td class="ctr">${thDate(c.date)}</td><td class="mono">${no}</td><td>${esc(custLabel(cu))}${plate(c)?'<div class="hint">'+esc(plate(c))+'</div>':''}</td>
    <td class="num">${money(t.base)}<div class="pkg-sa-sub">${money(t.vat)}</div></td><td class="num"><b>${money(t.gross)}</b><div>${st2}</div></td>
    <td>${esc(c.sellerName||'ไม่ระบุ')}<div class="pkg-sa-sub">${esc(byShort(c)||'')}</div></td>
    ${ACT?`<td class="ctr">${(a=>a?`<div class="pkg-sf-rowbtn">${a}</div>`:'')(SP().rowActs(c))}</td>`:''}</tr>`;   /* (the expand arrow and its detail row are gone with the "#" column; detailRow() is kept, unused) */
  }).join('');
  $i('scutEmpty').style.display=rows.length?'none':'block';
  paintSort('scutTbl');mkCards('scutTbl');
 };
 function detailRow(c){
  const its=(c.items||[]).length?c.items:c.lines||[];
  return `<tr class="pkg-sa-detail"><td colspan="10"><table class="tbl"><thead><tr><th class="ctr" style="width:40px">#</th><th style="width:140px">รหัสสินค้า</th><th>รายการ</th><th class="num" style="width:90px">จำนวน</th>
   <th class="num" style="width:110px">ราคา / หน่วย</th><th class="num" style="width:120px">จำนวนเงิน</th></tr></thead><tbody>${its.map((it,i)=>`<tr><td class="ctr">${i+1}</td><td class="mono">${esc(it.code||'')}</td>
   <td>${esc(it.name||'')}${it.type==='kit'?' <span class="hint">(ชุด)</span>':''}</td><td class="num">${qf(it.qty)}</td><td class="num">${it.price==null?'-':money(it.price)}</td><td class="num">${it.price==null?'-':money(n(it.qty)*n(it.price))}</td></tr>`).join('')}</tbody></table>
   <div class="pkg-sa-detail-foot"><span>การชำระเงิน: <b>${esc(payLabel(c.pay))}</b></span><span class="sc-cost">ต้นทุน (FIFO): <b>${money(liveCost(c))}</b></span></div></td></tr>`;
 }
 $i('scutTbl').addEventListener('click',e=>{const b=e.target.closest('[data-exp]');if(!b)return;e.stopPropagation();const id=b.dataset.exp;open.has(id)?open.delete(id):open.add(id);pkgRenderCuts();});
 $i('scutSearch').onkeydown=e=>{if(e.key==='Enter')pkgRenderCuts();};
 $i('scutState').onchange=()=>{LIM_PAGE.scut=1;pkgRenderCuts();};
 if($i('scutChannel'))$i('scutChannel').onchange=()=>{LIM_PAGE.scut=1;pkgRenderCuts();};
 bindSort('scutTbl',()=>pkgRenderCuts());
 /* two-part headers (top over a thin rule, like the cells): bindSort stores the run-together text, so give cards / exports /
    11.1 a readable "A / B" label — again after each draw, in case the header row was rebuilt (ลำดับ column, translations) */
 const headLbl=()=>{const t=$i('scutTbl');if(t&&t.tHead)[...t.tHead.rows[0].cells].forEach(th=>{const sub=th.querySelector(':scope>.pkg-sa-sub');
  if(sub)th.dataset.lbl=[...th.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('').trim()+' / '+sub.textContent.trim();});};
 headLbl();{const r=window.pkgRenderCuts;window.pkgRenderCuts=function(){const o=r.apply(this,arguments);headLbl();if(window.PKG_REG_LAYOUT)setTimeout(()=>PKG_REG_LAYOUT.measureCols('scutTbl'),0);return o;};}

 /* ---------- "เอกสารอ้างอิง": quotes waiting for a cut (magnifier in the window, user 2026-10-03 reference picture) ---------- */
 const pickM=document.createElement('div');pickM.className='modal';pickM.id='mCutPick';
 const yNow=new Date().getFullYear();
 pickM.innerHTML=`<div class="sheet" style="max-width:1560px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header class="pkg-ref-head"><h2>เอกสารอ้างอิง</h2><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" onclick="closeModal('mCutPick')">✕</button></header>
  <div class="body pkg-ref">
   <div class="pkg-sa-g3"><label class="f"><span>รูปแบบวันที่</span><select id="crMode"><option value="">เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="month">เดือน ปี</option></select></label>
    <label class="f"><span>เดือน</span><select id="crMonth">${TH_M_FULL.map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`).join('')}</select></label>
    <label class="f"><span>ปี</span><select id="crYear">${[0,1,2,3,4].map(k=>`<option value="${yNow-k}">${yNow-k+543}</option>`).join('')}</select></label></div>
   <hr class="pkg-ref-hr">
   <div class="pkg-sa-g3"><label class="f"><span>คลังสินค้า</span><select id="crWh" disabled><option>สาขาที่กำลังทำงาน</option></select></label>
    <label class="f"><span>ผู้บันทึก</span><select id="crBy"></select></label>
    <label class="f"><span>ชนิดเอกสาร</span><select id="crKind"><option value="quote">ใบเสนอราคา (อนุมัติแล้ว · ยังไม่ตัดสต็อก)</option></select></label></div>
   <div class="pkg-ref-tools"><label class="row">แสดง <select id="crLimit"><option>10</option><option>25</option><option selected>50</option><option>100</option></select> รายการ</label>
    <div class="pkg-ref-search"><button type="button" class="btn pri pkg-go" data-r="find"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button><label class="row">ค้นหาข้อมูล <input type="text" id="crQ" placeholder="ข้อมูล + เอ็นเทอร์"></label></div></div>
   <div class="pkg-ref-pg" data-pg="top"></div>
   <div class="scroll"><table class="tbl pkg-ref-tbl"><thead><tr><th class="ctr" style="width:70px">ลำดับ</th><th class="ctr" style="width:130px">วันที่เอกสาร</th><th style="width:200px">เอกสารเลขที่</th><th class="ctr" style="width:130px">คลังสินค้า</th>
    <th>ชื่อลูกค้า</th><th style="width:170px">หัวข้อ (ทะเบียนรถ)</th><th class="num" style="width:130px">ยอดรวม</th><th style="width:200px">หมายเหตุ</th></tr></thead><tbody></tbody></table></div>
   <div class="pkg-ref-foot"><span class="hint" id="crInfo"></span><div class="pkg-ref-pg" data-pg="bottom"></div></div>
  </div></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(pickM);
 const cr={page:1};
 function paintPick(){
  const mode=$i('crMode').value,mo=$i('crYear').value+'-'+$i('crMonth').value,by=$i('crBy').value,q=$i('crQ').value.toLowerCase().trim(),lim=n($i('crLimit').value)||50;
  let list=waiting().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  if(mode==='today')list=list.filter(x=>x.date===iso());if(mode==='month')list=list.filter(x=>String(x.date).slice(0,7)===mo);
  if(by)list=list.filter(x=>(x.createdBy||'')===by||(!x.createdBy&&by==='-'));
  if(q)list=list.filter(x=>{const cu=findCust(x.custId),v=cu&&(cu.vehicles||[])[x.vehIdx];return [x.no,custName(cu),plateOf(v),x.probs&&x.probs.join(' ')].some(t=>String(t||'').toLowerCase().includes(q));});
  const pages=Math.max(1,Math.ceil(list.length/lim));if(cr.page>pages)cr.page=pages;const from=(cr.page-1)*lim,shown=list.slice(from,from+lim);
  pickM.querySelector('tbody').innerHTML=shown.map((x,i)=>{const cu=findCust(x.custId),v=cu&&(cu.vehicles||[])[x.vehIdx];
   return `<tr><td class="ctr">${list.length-from-i}</td><td class="ctr">${thDate(x.date)}</td><td class="mono"><span class="docno" data-cut="${x.id}" title="เลือกใบนี้">${esc(x.no)}</span></td><td class="ctr">${esc(whNow())}</td>
    <td>${esc(custName(cu)||'-')}</td><td class="mono">${esc(plateOf(v)||'-')}</td><td class="num">${money(quoteTotals(x).total)}</td><td>${esc((x.probs||[]).filter(Boolean).join(' · '))}</td></tr>`;}).join('')
   ||'<tr><td colspan="8" class="empty">ไม่มีใบเสนอราคาที่รอตัดสต็อกตามเงื่อนไขนี้</td></tr>';
  $i('crInfo').textContent='แสดงอยู่ '+(list.length?from+1:0)+' ถึง '+(from+shown.length)+' จาก '+list.length+' รายการ';
  const pg=Array.from({length:pages},(_,k)=>`<button type="button" class="${k+1===cr.page?'on':''}" data-page="${k+1}">${k+1}</button>`).join('');
  pickM.querySelectorAll('.pkg-ref-pg').forEach(x=>x.innerHTML='<span class="pgbar">'+pg+'</span>');
 }
 pickM.addEventListener('click',e=>{
  const pgb=e.target.closest('[data-page]');if(pgb){cr.page=+pgb.dataset.page;return paintPick();}
  if(e.target.closest('[data-r="find"]')){cr.page=1;return paintPick();}
  const b=e.target.closest('[data-cut]');if(!b)return;closeModal('mCutPick');
  if(M.classList.contains('on')&&W.S&&!W.cur){loadQuote(b.dataset.cut);paint();}else openNew(b.dataset.cut);
 });
 pickM.addEventListener('change',e=>{if(e.target.matches('select')){cr.page=1;paintPick();}});
 $i('crQ').addEventListener('keydown',e=>{if(e.key==='Enter'){cr.page=1;paintPick();}});
 function openPick(){
  ensure();if(!need('add'))return;
  const bys=[...new Map(waiting().map(x=>[x.createdBy||'-',x.createdByName||'ไม่ระบุ'])).entries()];
  $i('crBy').innerHTML='<option value="">เลือกทั้งหมด</option>'+bys.map(([id,nm])=>`<option value="${esc(id)}">${esc(nm.replace(/^.*· /,''))}</option>`).join('');
  $i('crMonth').value=String(new Date().getMonth()+1).padStart(2,'0');$i('crYear').value=String(yNow);
  $i('crWh').innerHTML='<option>'+esc(whNow())+'</option>';
  cr.page=1;paintPick();(document.getElementById('pkg-app')||document.body).append(pickM);openModal('mCutPick');   /* last in the page = above the stock-cut window */
 }
 window.pkgCutPick=openPick;

 /* ---------- the window (reference: "สร้างข้อมูลใหม่ · ตัดสต็อกขายสินค้า") ---------- */
 const M=document.createElement('div');M.className='modal';M.id='mSale';
 M.innerHTML=`<div class="sheet pkg-sa-sheet" style="max-width:1560px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2 id="saTitle">สร้างข้อมูลใหม่</h2><span class="tag" id="saState"></span><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" data-a="close">✕</button></header>
  <div class="body">
   <div class="pkg-doc-tools" id="saTools" hidden>
    <fieldset class="pkg-fs"><legend>แถบเครื่องมือ</legend><div class="pkg-sa-toolcol">
     <button type="button" class="btn pkg-sa-purple" data-a="copy">คัดลอก</button>
     <button type="button" class="btn pkg-sa-red" data-a="cancel">ยกเลิกเอกสาร</button>
     <button type="button" class="btn pkg-sa-green pc-rIssue" data-a="bill" id="saBillBtn">ใบแจ้งหนี้ / ใบเสร็จรับเงิน</button></div></fieldset>
    <fieldset class="pkg-fs"><legend>พิมพ์ / เงื่อนไขการพิมพ์เอกสาร</legend><div class="pkg-sa-printcol">
     <button type="button" class="btn pkg-sa-teal" data-a="slip">เอกสารอย่างย่อ</button>
     <button type="button" class="btn pkg-sa-teal" data-a="print">ใบตัดสต็อกขายสินค้า (A4)</button>
     <span class="hint" id="saPrinted"></span></div></fieldset>
   </div>
   <fieldset class="pkg-fs pkg-sa-main"><legend>ตัดสต็อกขายสินค้า</legend>
    <div class="pkg-sa-sec"><span>รายละเอียดเอกสาร</span></div>
    <div class="pkg-sa-g4">
     <label class="f"><span>เลขที่ใบตัดสต็อกขายสินค้า</span><input type="text" id="saNo" readonly class="ctr"></label>
     <label class="f"><span>วันที่สร้างข้อมูล</span><input type="text" id="saDate" readonly class="ctr"></label>
     <label class="f"><span>พนักงานขาย</span><select id="saSeller"></select></label>
     <label class="f"><span>ช่องทางการขาย</span><select id="saChannel"><option value="retail">ขายหน้าร้าน</option><option value="repair">งานซ่อม</option></select></label>
    </div>
    <div class="pkg-sa-sec"><span>ลูกค้า</span></div>
    <div class="pkg-sa-g4">
     <label class="f pkg-sa-cust" style="position:relative"><span>ชื่อลูกค้า</span><input type="text" id="saCustSearch" autocomplete="off" placeholder="พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน"><div id="saCustSug" class="whoSug" style="display:none"></div><input type="hidden" id="saCust"></label>
     <label class="f"><span>ประเภทลูกค้า</span><input type="text" id="saCustType" readonly></label>
     <label class="f"><span>เลขประจำตัวผู้เสียภาษีอากร</span><input type="text" id="saCustTax" readonly></label>
     <label class="f"><span>โทรศัพท์</span><input type="text" id="saCustTel" readonly></label>
    </div>
    <div class="pkg-sa-g2">
     <label class="f"><span>ที่อยู่ลูกค้า</span><input type="text" id="saCustAddr" readonly></label>
     <label class="f"><span>รถของลูกค้า</span><select id="saVeh"></select></label>
    </div>
    <p class="hint pkg-sa-oldnote" id="saOldNote" hidden></p>
    <div class="pkg-sa-g2 pkg-sa-notes" hidden>
     <label class="f"><span>บันทึกภายในองค์กร</span><textarea id="saNote" rows="2"></textarea></label>
     <label class="f"><span class="pkg-sa-orange">หมายเหตุ</span><textarea id="saRemark" rows="2"></textarea></label>
    </div>
   </fieldset>
   <div class="pkg-sa-3">
    <fieldset class="pkg-fs"><legend>ข้อมูลการขาย</legend>
     <label class="f"><span>คลังสินค้า</span><select id="saWh"><option>${WH}</option></select></label>
     <label class="f"><span class="pkg-sa-orange">ประเภทราคา</span><select id="saTier"><option value="A">ราคาขาย A</option><option value="B">ราคาขาย B</option><option value="C">ราคาขาย C</option></select></label>
     <label class="f"><span>จำนวนรายการรวม</span><div class="pkg-unit"><input type="text" id="saLines" readonly><em>รายการ</em></div></label>
     <label class="f"><span>จำนวนสินค้าทั้งสิ้น</span><div class="pkg-unit"><input type="text" id="saQty" readonly><em>หน่วย</em></div></label>
    </fieldset>
    <fieldset class="pkg-fs pkg-sa-entry"><legend>การนำเข้าสินค้า</legend>
     <div id="saPickSlot"></div><p class="hint pkg-sa-locknote" id="saLockNote" hidden></p>
     <div class="pkg-line-title"><span>เอกสาร (ใบเสนอราคา)</span></div>
     <div class="pkg-sa-doc" style="position:relative"><input type="text" id="saDocSearch" autocomplete="off" placeholder="เลขที่ใบเสนอราคาที่อนุมัติแล้ว"><div id="saDocSug" class="whoSug" style="display:none"></div><input type="hidden" id="saDoc"><button type="button" class="btn pkg-sa-blue pkg-sa-mag pkg-mag-btn" data-a="waiting" title="ค้นหาใบเสนอราคาที่ยังไม่ได้ตัดสต็อก" aria-label="ค้นหาใบเสนอราคาที่ยังไม่ได้ตัดสต็อก"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button></div>
    </fieldset>
    <fieldset class="pkg-fs"><legend>ข้อมูลยอดเงินรวมทั้งหมด</legend>
     <div class="pkg-sa-big"><span>ยอดชำระทั้งสิ้น</span><b id="saBig">0.00</b></div>
     <div class="pkg-sa-big"><span>ราคารวมทั้งสิ้น</span><b id="saBig2">0.00</b></div>
    </fieldset>
   </div>
   <fieldset class="pkg-fs"><legend>ข้อมูลรายการสินค้า</legend>
    <div class="scroll"><table class="tbl" id="saItems"><thead><tr><th class="ctr" style="width:44px">#</th><th style="width:150px">รหัสสินค้า</th><th>รายการ</th>
     <th class="num" style="width:110px">จำนวน</th><th style="width:70px">หน่วย</th><th class="num" style="width:120px">ราคา / หน่วย</th><th class="num" style="width:130px">จำนวนเงิน</th>
     <th class="num" style="width:110px">คงเหลือ</th><th class="ctr" style="width:60px">ลบ</th></tr></thead><tbody></tbody></table></div>
    <span id="saPickInfo" hidden></span>
   </fieldset>
   <div class="pkg-sa-2">
    <fieldset class="pkg-fs"><legend>เอกสารอ้างอิง</legend><input type="text" id="saRef" placeholder="เอกสารอ้างอิง"></fieldset>
    <fieldset class="pkg-fs pkg-sa-sum"><legend>รายละเอียดยอดเงินรวมทั้งหมด</legend>
     <div><span>รวมเป็นเงิน</span><b id="saSub">0.00</b></div>
     <div><span>ส่วนลดท้ายบิล</span><input type="number" id="saDisc" min="0" step="0.01" value="0"></div>
     <div><span>ราคาหลังหักส่วนลด</span><b id="saBase">0.00</b></div>
     <div><span>ภาษีมูลค่าเพิ่ม <select id="saVat"><option value="0">ไม่มี</option><option value="7">7%</option></select></span><b id="saVatAmt">0.00</b></div>
     <div class="pkg-sa-net"><span>ยอดที่ต้องชำระทั้งสิ้น</span><b id="saNet">0.00</b></div>
    </fieldset>
   </div>
   <fieldset class="pkg-fs"><legend>จัดการการขาย</legend><div class="pkg-sa-acts" id="saActs"></div></fieldset>
   <fieldset class="pkg-fs" id="saPeople" hidden><legend>บุคคลที่เกี่ยวข้อง</legend><div class="pkg-sa-g4">
    <label class="f"><span>วันที่ / เวลา สร้างข้อมูล</span><input type="text" id="saPcAt" readonly></label><label class="f"><span>ผู้บันทึก (ผู้สร้างข้อมูล)</span><input type="text" id="saPcBy" readonly></label>
    <label class="f"><span>วันที่อัปเดตล่าสุด</span><input type="text" id="saPuAt" readonly></label><label class="f"><span>ผู้แก้ไขข้อมูลล่าสุด</span><input type="text" id="saPuBy" readonly></label></div></fieldset>
  </div></div></div>
  <div class="pkg-side-tools" role="toolbar" aria-label="เครื่องมือเอกสาร">
   <div class="pkg-side-group" id="saSidePay"><button type="button" class="pkg-side-btn s-pay" data-a="pay" title="ชำระเงิน" aria-label="ชำระเงิน"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/></svg></button></div>
   <div class="pkg-side-group">
    <button type="button" class="pkg-side-btn s-close" data-a="close" title="ปิดหน้าต่าง" aria-label="ปิดหน้าต่าง"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button type="button" class="pkg-side-btn s-new" data-a="new" title="เริ่มการขายใหม่" aria-label="เริ่มการขายใหม่"><svg viewBox="0 0 24 24"><path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg></button>
    <button type="button" class="pkg-side-btn s-up" data-a="up" title="เลื่อนขึ้นบนสุด" aria-label="เลื่อนขึ้นบนสุด"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>
    <button type="button" class="pkg-side-btn s-down" data-a="down" title="เลื่อนลงล่างสุด" aria-label="เลื่อนลงล่างสุด"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
    <button type="button" class="pkg-side-btn s-save" data-a="pay" id="saSideSave" title="ชำระเงิน / บันทึก" aria-label="ชำระเงิน / บันทึก"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
   </div></div>`;
 (document.getElementById('pkg-app')||document.body).append(M);
 const W={S:null,cur:null};   /* S = the working document (new) · cur = a saved one being viewed */
 const blank=()=>({id:'',no:'',date:iso(),channel:'retail',wh:whNow(),custId:'',vehIdx:-1,seller:DB.curEmp||'',tier:'B',items:[],disc:0,vat:vatDefault(),note:'',remark:'',ref:'',quoteId:''});
 const doc=()=>W.cur||W.S;
 const view=()=>!!W.cur;
 /* pickers */
 const custRows=()=>[{id:'',text:'ลูกค้าทั่วไป (เงินสด)',find:'เงินสด ขายสด'},...custPickerRows()];
 const docRows=()=>waiting().map(q=>({id:q.id,text:q.no,sub:custName(findCust(q.custId))||'',meta:money(quoteTotals(q).total),find:[q.no,custName(findCust(q.custId))].join(' ')}));
 const pCust=bindPicker('saCustSearch','saCustSug','saCust',custRows),pDoc=bindPicker('saDocSearch','saDocSug','saDoc',docRows,{clearAfterPick:true});
 $i('saCust').addEventListener('change',()=>{const S=W.S;if(!S||S.quoteId)return;S.custId=$i('saCust').value;S.vehIdx=-1;paint();});
 $i('saDoc').addEventListener('change',()=>{const id=$i('saDoc').value;if(id)loadQuote(id);});
 function addProduct(id){
  const S=W.S,s=DB.stock.find(x=>x.id===id);if(!S||!s||S.quoteId)return;
  const same=S.items.find(it=>it.type==='part'&&it.stockId===id);
  if(same)same.qty=n(same.qty)+1;else S.items.push({type:'part',stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,unit:s.unit||'',qty:1,price:priceByTier(s,S.tier),warr:s.warr||''});
  paint();
 }
 function loadQuote(id){
  const S=W.S,q=findQuote(id);if(!S||!q)return;
  if(S.items.length&&!S.quoteId){toast('เอกสารนี้มีรายการอยู่แล้ว — กด “+ สร้างข้อมูลใหม่” ก่อนดึงใบเสนอราคา');return;}
  if(!isApproved(q)||q.cancelled||q.superseded)return toast('ใบเสนอราคา '+q.no+' ยังดึงไม่ได้ (ต้องอนุมัติแล้ว ยังไม่ยกเลิก)');
  const c=activeCut(q);if(c)return toast('ใบเสนอราคา '+q.no+' ตัดสต็อกแล้ว — ใบตัดสต็อก '+c.no);
  Object.assign(S,{quoteId:q.id,quoteNo:q.no,channel:'repair',custId:q.custId,vehIdx:q.vehIdx,items:qItemsClean(q),disc:n(q.disc),vat:n(q.vat),noVatReason:q.noVatReason,tier:q.tier||'B',ref:q.no});
  paint();toast('ดึงรายการจากใบเสนอราคา '+q.no+' แล้ว — รายการล็อกตามใบเสนอราคา');
 }
 /* extra HTML inside the "รายการ" cell of a sale line, after the product name. Any module may set
    window.PKG_SALE_LINE_EXTRA = (it, i, {saved, locked}) => html string (it = the line, i = its index in doc.items,
    saved = a saved document is shown, locked = quantities / prices cannot be edited). sale-pay.js adds its own part. */
 const lineExtra=(it,i,o)=>{let h='';try{if(typeof window.PKG_SALE_LINE_EXTRA==='function')h+=window.PKG_SALE_LINE_EXTRA(it,i,o)||'';if(SP())h+=SP().lineExtra(it,i,o)||'';}catch(e){}return h;};
 function paint(){
  const d=doc();if(!d)return;const ro=view(),fromQ=!!d.quoteId,lock=ro||fromQ;
  const cu=findCust(d.custId);
  $i('saTitle').textContent=ro?'ใบตัดสต็อกขายสินค้า '+d.no:'สร้างข้อมูลใหม่';
  $i('saState').innerHTML=ro?(d.cancelled?'<span class="stbtn st-red">ยกเลิกแล้ว · คืนสต๊อก</span>':d.paid?'<span class="stbtn st-green">ชำระแล้ว</span>':'<span class="stbtn st-orange">ค้างชำระ</span>'):'';
  $i('saNo').value=ro?d.no:peekDocNo(PREFIX);
  $i('saDate').value=ro&&d.createdAt?thDateTime(d.createdAt):thDate(d.date)+' (ยังไม่บันทึก)';
  $i('saSeller').innerHTML='<option value="">ไม่ระบุ</option>'+DB.emp.filter(e=>e.active!==false||e.id===d.seller).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  $i('saSeller').value=d.seller||'';$i('saSeller').disabled=ro;
  $i('saChannel').value=d.channel||'retail';$i('saChannel').disabled=lock;
  $i('saCust').value=d.custId||'';pCust&&pCust.sync();$i('saCustSearch').disabled=lock;
  $i('saCustType').value=cu?(cu.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'):'ลูกค้าทั่วไป';$i('saCustTax').value=(cu&&cu.tax)||'';$i('saCustTel').value=(cu&&cu.tel)||'';$i('saCustAddr').value=cu?addrLine(cu.addr):'';
  const vs=(cu&&cu.vehicles)||[];$i('saVeh').innerHTML='<option value="-1">ไม่ระบุ</option>'+vs.map((v,i)=>`<option value="${i}">${esc(vehLabel(v))}</option>`).join('');$i('saVeh').value=String(d.vehIdx==null?-1:d.vehIdx);$i('saVeh').disabled=lock;
  $i('saNote').value=d.note||'';$i('saRemark').value=d.remark||'';$i('saNote').disabled=$i('saRemark').disabled=ro;
  {const on=$i('saOldNote'),tx=ro?[d.note?'บันทึกภายในองค์กร: '+d.note:'',d.remark?'หมายเหตุ: '+d.remark:''].filter(Boolean).join(' · '):'';if(on){on.hidden=!tx;on.textContent=tx;on.dataset.noTranslate='';}}   /* owner 12 Oct: the two boxes are no longer shown; text on an older document stays readable */
  $i('saWh').innerHTML='<option>'+esc(ro?whOf(d):whNow())+'</option>';$i('saWh').disabled=true;$i('saTier').value=d.tier||'B';$i('saTier').disabled=lock;
  $i('saDocSearch').disabled=ro||!!d.items.length;M.querySelector('[data-a="waiting"]').disabled=ro||!!d.items.length;
  $i('saLockNote').hidden=!lock;$i('saLockNote').textContent=ro?'เอกสารบันทึกแล้ว — แก้ไขรายการไม่ได้':fromQ?'รายการมาจากใบเสนอราคา '+(d.quoteNo||'')+' — แก้ไขที่ใบเสนอราคา (ทำฉบับแก้ไข)':'';
  $i('saRef').value=d.ref||'';$i('saRef').disabled=ro;
  const priceOk=!curEmp()||can('doc.editPrice'),discOk=!curEmp()||!(curEmp().perms&&curEmp().perms.doc&&curEmp().perms.doc.discount===false);
  const its=d.items||[];
  $i('saItems').tBodies[0].innerHTML=its.map((it,i)=>{const s=it.stockId?DB.stock.find(x=>x.id===it.stockId):null,left=s?n(s.qty):'',short=!ro&&s&&n(it.qty)>n(s.qty);
   return `<tr><td class="ctr">${i+1}</td><td class="mono">${esc(it.code||'')}${it.type==='labor'?'<span class="chip">ค่าแรง</span>':''}</td><td>${esc(it.name||'')}${it.type==='kit'?'<div class="hint">ชุด: '+(it.kitItems||[]).map(k=>esc(k.code)+' × '+qf(n(k.qty)*n(it.qty))).join(' · ')+'</div>':''}${lineExtra(it,i,{saved:ro,locked:lock})}</td>
    <td class="num">${lock?qf(it.qty):`<input type="number" class="saQty" data-i="${i}" value="${n(it.qty)}" min="0" step="1" style="text-align:right">`}</td><td>${esc(it.unit||(it.type==='kit'?'ชุด':''))}</td>
    <td class="num">${lock||!priceOk?money(it.price):`<input type="number" class="saPrice" data-i="${i}" value="${n(it.price)}" step="0.01" style="text-align:right">`}</td>
    <td class="num">${money(n(it.qty)*n(it.price))}</td><td class="num" style="${short?'color:var(--danger);font-weight:600':''}">${left===''?'-':qf(left)}${short?' ⚠':''}</td>
    <td class="ctr">${lock?'':`<button type="button" class="btn sm dgr" data-del="${i}">×</button>`}</td></tr>`;}).join('');
  const t=tot(d);
  $i('saLines').value=its.filter(filled).length;$i('saQty').value=qf(its.reduce((a,it)=>a+n(it.qty),0));
  $i('saSub').textContent=money(t.sub);$i('saDisc').value=n(d.disc);$i('saDisc').disabled=lock||!discOk;$i('saBase').textContent=money(t.base);
  $i('saVat').value=String(n(d.vat));$i('saVat').disabled=lock||!isVatReg();$i('saVatAmt').textContent=money(t.vat);
  $i('saNet').textContent=$i('saBig').textContent=$i('saBig2').textContent=money(t.gross);
  const bl=ro?saleBills(d,false):[];
  /* saved: toolbar on top (copy · cancel · receipt), print frame, people frame, side buttons (like 4.1) */
  $i('saTools').hidden=!ro;$i('saPeople').hidden=!ro;$i('saSidePay').hidden=ro;
  $i('saSideSave').disabled=ro;$i('saSideSave').title=ro?'บันทึกแล้ว':'ชำระเงิน / บันทึก';
  if(ro){
   const cb=M.querySelector('#saTools [data-a="cancel"]');cb.hidden=!!d.cancelled||d.src==='sale'||!may('cancel');cb.disabled=bl.length>0;cb.title=bl.length?'ยกเลิกเอกสารเก็บเงินก่อน':'ยกเลิกการขาย — สินค้าคืนเข้าสต๊อก';
   M.querySelector('#saTools [data-a="copy"]').hidden=!may('add');
   const bb=$i('saBillBtn');bb.hidden=!!d.cancelled;bb.textContent=bl.length?bl[0].label+' : '+bl[0].no:'ใบแจ้งหนี้ / ใบเสร็จรับเงิน';
   M.querySelectorAll('#saTools [data-a="slip"],#saTools [data-a="print"]').forEach(b=>b.hidden=!may('print'));
   $i('saPrinted').textContent=d.printed?'พิมพ์แล้ว':'ยังไม่ได้พิมพ์';
   $i('saPcAt').value=d.createdAt?thDateTime(d.createdAt):thDate(d.date);$i('saPcBy').value=byShort(d)||'-';
   $i('saPuAt').value=d.updatedAt?thDateTime(d.updatedAt):'-';$i('saPuBy').value=(d.cancelByName||((d.updatedByName||'').replace(/^.*· /,'')))||'-';
  }
  $i('saActs').innerHTML=ro
   ?`<button type="button" class="btn pri" data-a="new"${may('add')?'':' hidden'}>+ สร้างข้อมูลใหม่</button>
     ${d.cancelled?`<div class="pkg-cut-cancelled">ยกเลิกแล้ว · คืนสต๊อกครบทุกรายการ — ${esc(d.cancelReason||'')} · โดย ${esc(d.cancelByName||'-')} · ${d.cancelAt?thDateTime(d.cancelAt):thDate(d.cancelDate)}</div>`:''}
     <div class="pkg-sa-paid">การชำระเงิน: <b>${esc(payLabel(d.pay))}</b>${d.pay&&d.pay.method==='credit'&&d.pay.due?' · ครบกำหนด '+thDate(d.pay.due):''} <span class="sc-cost">· ต้นทุน (FIFO) <b>${money(liveCost(d))}</b></span></div>`
   :`<button type="button" class="btn pri" data-a="new">+ สร้างข้อมูลใหม่</button><button type="button" class="btn pkg-sa-green" data-a="pay">ชำระเงิน</button>`;
  if(window.PKG_SALE_PAY)PKG_SALE_PAY.mount(d,{saved:ro,locked:lock});   /* new flow: state chip, two buttons, WHT, จัดการ, payments (and hides its parts again when the switch is off) */
  if(window.PKG_PRODUCT_PICKER&&$i('pkg-sale-products'))try{PKG_PRODUCT_PICKER.sync('sale');}catch(e){}   /* show / hide the search block with the lock */
  if($i('pkg-sale-products'))$i('pkg-sale-products').hidden=lock;   /* the picker skips a saved (read-only) document */
  const pe=M.querySelector('.pkg-product-selected > .empty');if(pe)pe.hidden=its.length>0;
 }
 M.addEventListener('input',e=>{
  const S=W.S;if(!S||view())return;const i=e.target.dataset.i;
  if(e.target.classList.contains('saQty')){S.items[+i].qty=n(e.target.value);recalc();}
  if(e.target.classList.contains('saPrice')){S.items[+i].price=n(e.target.value);recalc();}
  if(e.target.id==='saDisc'){S.disc=n(e.target.value);recalc();}
  if(e.target.id==='saNote')S.note=e.target.value;if(e.target.id==='saRemark')S.remark=e.target.value;if(e.target.id==='saRef')S.ref=e.target.value;
 });
 function recalc(){const d=doc(),t=tot(d);$i('saSub').textContent=money(t.sub);$i('saBase').textContent=money(t.base);$i('saVatAmt').textContent=money(t.vat);
  $i('saNet').textContent=$i('saBig').textContent=$i('saBig2').textContent=money(t.gross);
  [...$i('saItems').tBodies[0].rows].forEach((tr,i)=>{const it=d.items[i];if(it)tr.cells[6].textContent=money(n(it.qty)*n(it.price));});
  $i('saLines').value=d.items.filter(filled).length;$i('saQty').value=qf(d.items.reduce((a,it)=>a+n(it.qty),0));}
 M.addEventListener('change',e=>{
  const S=W.S;if(!S||view())return;
  if(e.target.id==='saSeller')S.seller=e.target.value;
  if(e.target.id==='saChannel')S.channel=e.target.value;
  if(e.target.id==='saVeh')S.vehIdx=+e.target.value;
  if(e.target.id==='saWh')S.wh=e.target.value;
  if(e.target.id==='saVat')vatPick(e.target,S,v=>{S.vat=v;recalc();});   /* DriveGo new system (task 3.3, R4-ข) */
  if(e.target.id==='saTier'){S.tier=e.target.value;S.items.forEach(it=>{if(it.type==='part'&&it.stockId){const s=DB.stock.find(x=>x.id===it.stockId);if(s)it.price=priceByTier(s,S.tier);}});paint();}
  if(e.target.classList.contains('saQty')||e.target.classList.contains('saPrice'))paint();
 });
 M.addEventListener('click',async e=>{
  const del=e.target.closest('[data-del]');if(del&&W.S){W.S.items.splice(+del.dataset.del,1);paint();return;}
  const a=e.target.closest('[data-a]')?.dataset.a;if(!a)return;
  if(a==='close')return closeModal('mSale');
  if(a==='up'||a==='down'){const sc=M;sc.scrollTo?sc.scrollTo({top:a==='up'?0:sc.scrollHeight,behavior:'smooth'}):(sc.scrollTop=a==='up'?0:sc.scrollHeight);return;}
  if(a==='copy'&&W.cur){const c=W.cur;
   if(c.quoteId)return toast('ใบนี้มาจากใบเสนอราคา '+(c.quoteNo||'')+' — คัดลอกไม่ได้ (1 ใบเสนอราคา : 1 ใบตัดสต็อก) · แก้ไขที่ใบเสนอราคาด้วย “ฉบับแก้ไข”');
   openNew();if(!W.S)return;Object.assign(W.S,{custId:c.custId,vehIdx:c.vehIdx,channel:c.channel||'retail',tier:c.tier||'B',items:plainItems(c.items),disc:n(c.disc),vat:n(c.vat),noVatReason:c.noVatReason,note:'',remark:'',ref:c.no});
   paint();return toast('คัดลอกจาก '+c.no+' แล้ว — ตรวจรายการแล้วกดชำระเงิน');}
  if(a==='waiting')return openPick();
  if(a==='new')return openNew();
  if(a==='pay')return SP()?SP().open():openPay();
  const c=W.cur;if(!c)return;
  if(a==='bill')return billFromSale(c.id);
  if(a==='cancel'){await cancelCut(c.id);return;}
  if(a==='slip'){if(!need('print'))return;printSlip(c);return;}
  if(a==='print'){if(!need('print'))return;printDoc(c);return;}
 });
 function openNew(quoteId){
  ensure();if(!need('add'))return;
  W.cur=null;W.S=blank();if($i('mCutPick').classList.contains('on'))closeModal('mCutPick');
  if(quoteId)loadQuote(quoteId);
  paint();go('receipt');if(typeof rOvGo==='function'&&rOvPane!=='retail')rOvGo('retail');openModal('mSale');
 }
 function openSaved(id){
  ensure();const c=L().find(x=>x.id===id);if(!c)return;
  if(!may('view'))return toast('บัญชีนี้ไม่มีสิทธิ์เปิดใบตัดสต็อก ('+MN('cut')+')');
  if(typeof pkgOwnOk==='function'&&!pkgOwnOk('rcptCut',c))return toast('บัญชีนี้เปิดได้เฉพาะเอกสารที่ตนเองสร้าง');
  fill(c);W.S=null;W.cur=c;paint();if(!M.classList.contains('on')){logAudit('stockcut',c,'open');openModal('mSale');}
 }
 window.pkgOpenCut=openSaved;window.pkgSaleNew=()=>openNew();
 /* product + kit search: the same block as 4.1 (product-picker.js + kit-sales.js), the quote search stays below it */
 window.pkgSaleRender=()=>paint();
 if(window.PKG_PRODUCT_PICKER&&PKG_PRODUCT_PICKER.register){
  PKG_PRODUCT_PICKER.register('sale',{table:'saItems',info:'saPickInfo',get:()=>W.cur?null:W.S,render:'pkgSaleRender',permission:'sub.rcptRetail',title:'เลือกสินค้าเข้าใบตัดสต็อก',
   locked:()=>!W.S||!!W.S.quoteId,add:s=>addProduct(s.id),
   line:s=>({type:'part',stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,unit:s.unit||'',qty:1,price:priceByTier(s,W.S?W.S.tier:'B'),warr:s.warr||''})});
  const root=$i('pkg-sale-products');
  if(root){
   if(window.PKG_KIT_SALES&&PKG_KIT_SALES.register)PKG_KIT_SALES.register('sale',{doc:()=>W.cur?null:W.S,render:'pkgSaleRender',body:'saItems',stockCol:-1});   /* while the block still sits by the table */
   $i('saPickSlot').replaceWith(root);root.classList.add('pkg-sa-pick');
   const line=t=>{const x=document.createElement('div');x.className='pkg-line-title';x.innerHTML='<span>'+t+'</span>';return x;};
   root.querySelector('.pkg-product-quick:not(.pkg-kit-quick)')?.before(line('สินค้า'));root.querySelector('.pkg-kit-quick')?.before(line('ชุดอะไหล่ซ่อมบำรุง'));}
 }
 const closeAll=()=>{['mSaleDone','mSalePay','mSale','mCutPick'].forEach(id=>{if($i(id)?.classList.contains('on'))closeModal(id);});};

 /* ---------- payment: the 4.1 panel (doc-toolbar.js) rebuilt for the SA — up to 3 methods, transfer / card lines,
    card surcharge %, cheque details, cash given + change, credit days (user 2026-10-03: the card surcharge was missing) ---------- */
 const PM=[['cash','เงินสด'],['trans','เงินโอน'],['card','บัตรเครดิต / เดบิต'],['chk','เช็ค'],['credit','เงินเชื่อ']];
 const PML=Object.fromEntries(PM);
 const CARD_BANKS=['ธนาคารกสิกรไทย','ธนาคารไทยพาณิชย์','ธนาคารกรุงเทพ','ธนาคารกรุงไทย','ธนาคารกรุงศรีอยุธยา (KRUNGSRI)','ธนาคารทหารไทยธนชาต (ttb)','เคทีซี (KTC)','เซ็นทรัล เดอะวัน','อิออน (AEON)','VISA / Mastercard อื่น ๆ'];
 const r2=v=>Math.round(v*100)/100;
 const nowText=()=>{const d=new Date();return thDate(iso(d))+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
 const PY={order:[],lines:{},x:{}};   /* amounts start at 0 (user 2026-10-11): only what was typed, the full-amount buttons or "ยอดที่เหลือ" fill them */
 const P=document.createElement('aside');P.className='pkg-pay';P.id='mSalePay';P.hidden=true;P.setAttribute('role','dialog');P.setAttribute('aria-label','ชำระเงิน');
 (document.getElementById('pkg-app')||document.body).append(P);
 const PX={c:null},pdoc=()=>(PX.c&&PX.c.doc)||W.S;   /* PX.c: a caller's context — sale-pay.js opens this panel for a draft (cut + first payment, part allowed) or a saved sale (receive) */
 const pnet=()=>PX.c?PX.c.total():tot(W.S).gross;
 const paidNow=()=>PY.order.filter(k=>k!=='credit');
 const sumOf=k=>(PY.lines[k]||[]).reduce((a,l)=>a+n(l.amt),0);
 const blankLine=k=>k==='trans'?{amt:'',bank:'',when:nowText()}:k==='card'?{amt:'',type:'credit',bank:'',last4:''}:{amt:''};
 const feeNow=()=>r2(sumOf('card')*n(PY.x.cardPct)/100);
 function openPay(ctx){
  PX.c=ctx&&typeof ctx.total==='function'?ctx:null;
  const S=W.S;if(!(PX.c&&PX.c.doc)){if(!S)return;if(!plainItems(S.items).length)return toast('ยังไม่มีรายการสินค้า');if(!need('add'))return;
  if(!S.quoteId&&!pkgStockLines(plainItems(S.items)).length)return toast('ไม่มีรายการสินค้าในสต๊อก');}
  if(!(PX.c&&PX.c.keep&&PY.x&&PY.x.by!==undefined)){PY.order=[];PY.lines={};
  PY.x={cardPct:0,cardRef:'',chkBank:'',chkNo:'',chkDate:'',days:30,given:'',mode:'cash',by:meName(),note:''};}
  P.hidden=false;M.classList.add('pkg-pay-on');drawPay();
 }
 const closePay=()=>{P.hidden=true;M.classList.remove('pkg-pay-on');};
 const req='<b class="pkg-req">*</b>';
 function lineBox(k,l,i){
  const rm=PY.lines[k].length>1?`<button type="button" class="pkg-line-x" data-pdel="${k}:${i}" aria-label="ลบรายการ">−</button>`:'';
  const amtF=`<label class="f"><span>จำนวนเงิน ${req}</span><div class="pkg-amt"><input class="pkg-amtbig" data-pl="${k}:${i}:amt" inputmode="decimal" value="${esc(l.amt)}" placeholder="0.00"><em>บาท</em><button type="button" class="btn pkg-rest" data-prest="${k}:${i}">ยอดที่เหลือ</button></div></label>`;
  if(k==='trans'){const banks=(DB.shop.banks||[]).map(b=>typeof bankLabel==='function'?bankLabel(b):(b.bank||''));
   return `<div class="pkg-line">${rm}${amtF}<label class="f"><span>ธนาคาร / บัญชีที่รับโอน ${req}</span><select data-pl="trans:${i}:bank"><option value="">กรุณาเลือก</option>${banks.map(b=>`<option ${b===l.bank?'selected':''}>${esc(b)}</option>`).join('')}</select></label>
    <label class="f"><span>วันที่ / เวลา ${req}</span><div class="pkg-amt"><input data-pl="trans:${i}:when" value="${esc(l.when)}"><button type="button" class="btn" data-pnow="${i}">ตอนนี้</button></div></label>${PX.c&&PX.c.lineExtra?PX.c.lineExtra(k,l,i):''}</div>`;}
  if(k==='card')return `<div class="pkg-line">${rm}${amtF}<div class="f"><span>ประเภทบัตร ${req}</span><div class="pkg-radio"><label><input type="radio" name="sact${i}" data-pl="card:${i}:type" value="credit" ${l.type!=='debit'?'checked':''}> บัตรเครดิต</label><label><input type="radio" name="sact${i}" data-pl="card:${i}:type" value="debit" ${l.type==='debit'?'checked':''}> บัตรเดบิต</label></div></div>
   <label class="f"><span>ธนาคาร / ผู้ให้บริการบัตร ${req}</span><select data-pl="card:${i}:bank"><option value="">กรุณาเลือก</option>${CARD_BANKS.map(b=>`<option ${b===l.bank?'selected':''}>${b}</option>`).join('')}</select></label>
   <label class="f"><span>รหัสบัตร 4 ตัวท้าย ${req}</span><input data-pl="card:${i}:last4" value="${esc(l.last4)}" maxlength="4" inputmode="numeric"></label></div>`;
  if(k==='cash')return `<div class="pkg-line pkg-line-flat"><label class="f"><span>ยอดที่ชำระด้วยเงินสด ${req}</span><div class="pkg-amt"><input class="pkg-amtbig" data-pl="cash:0:amt" inputmode="decimal" value="${esc(l.amt)}" placeholder="0.00"><em>บาท</em><button type="button" class="btn pkg-rest" data-prest="cash:0">ยอดที่เหลือ</button></div></label>
   <label class="f"><span>รับเงิน</span><div class="pkg-amt"><input data-px="given" inputmode="decimal" value="${esc(PY.x.given)}" placeholder="เงินที่ลูกค้าให้มา"><em>บาท</em></div></label>
   <label class="f"><span>เงินทอน</span><div class="pkg-amt"><input id="spChange" readonly><em>บาท</em></div></label>
   <div class="f"><span>รูปแบบเงินทอน</span><div class="pkg-radio"><label><input type="radio" name="sachg" data-px="mode" value="cash" ${PY.x.mode!=='transfer'?'checked':''}> เงินสด</label><label><input type="radio" name="sachg" data-px="mode" value="transfer" ${PY.x.mode==='transfer'?'checked':''}> โอนคืน</label></div></div></div>`;
  return `<div class="pkg-line pkg-line-flat">${amtF}</div>`;
 }
 const fx=(label,key,extra='')=>`<label class="f"><span>${label}</span><input data-px="${key}" value="${esc(PY.x[key]??'')}" ${extra}></label>`;
 /* R2 layout (user's pick, mockups/payment-options-6.html) — the same front end as the 4.1 panel in doc-toolbar.js */
 const TILE={cash:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>','เงินสด','#16865c'],trans:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5 12 4l8.5 5.5M5 9.5h14M6.5 9.5V17M10.5 9.5V17M13.5 9.5V17M17.5 9.5V17M4 20h16M5 17h14"/></svg>','โอน','#2457c5'],card:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h4"/></svg>','บัตร','#7c3aed'],chk:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 6 19z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>','เช็ค','#b25e00'],credit:['<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5H18a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 18 20.5H6.5A2 2 0 0 1 4.5 18.5V5.5A2 2 0 0 1 6.5 3.5z"/><path d="M8.5 3.5v17M12 8.5h4M12 12h4"/></svg>','เงินเชื่อ','#475467']};
 const MAXM=3;
 function tilesHtml(){
  const credit=PY.order.includes('credit'),full=!credit&&paidNow().length>=MAXM;
  return PM.filter(([k])=>!(k==='credit'&&PX.c&&PX.c.noCredit)).map(([k])=>{const on=PY.order.includes(k),[ic,t,c]=TILE[k],off=!on&&k!=='credit'&&full;
   return `<button type="button" class="pkg-tile${on?' on':''}" style="--mc:${c}" data-ptile="${k}" aria-pressed="${on}" ${off?'disabled':''}><i aria-hidden="true">${ic}</i><b>${t}</b><small data-ptile-amt="${k}">${off?'ครบ 3 วิธี':'แตะเพื่อเพิ่ม'}</small></button>`;}).join('');
 }
 /* tap a tile = add / remove that method; same rules as the old slots (max 3, credit alone and needs a customer) */
 function toggleTile(k){
  if(!pdoc()||!PML[k])return;
  if(k==='credit'&&PX.c&&PX.c.noCredit)return;
  if(PY.order.includes(k)){
   PY.order=PY.order.filter(x=>x!==k);delete PY.lines[k];
  }else if(k==='credit'){
   if(!pdoc().custId)return toast('เลือกลูกค้าก่อนขายเชื่อ');
   if(PY.order.length)toast('เงินเชื่อต้องเป็นวิธีเดียว — นำวิธีอื่นออกให้แล้ว');
   PY.order=['credit'];PY.lines={};
  }else{
   if(PY.order.includes('credit')){PY.order=[];PY.lines={};toast('นำ “เงินเชื่อ” ออกแล้ว — เงินเชื่อใช้ร่วมกับวิธีอื่นไม่ได้');}
   if(paidNow().length>=MAXM)return toast('แบ่งจ่ายได้สูงสุด 3 วิธี');
   PY.order.push(k);PY.lines[k]=[blankLine(k)];
   drawPay();P.querySelector(`[data-pl="${k}:0:amt"]`)?.focus();return;
  }
  drawPay();
 }
 function drawPay(){
  if(P.hidden)return;
  const o=PY.order;
  const section=k=>{
   if(k==='credit'){const due=new Date();due.setDate(due.getDate()+n(PY.x.days));
    return `<div class="pkg-pay-2">${fx('จำนวนวันเครดิต','days','inputmode="numeric"')}<label class="f"><span>ครบกำหนดชำระ</span><input value="${thDate(iso(due))}" readonly id="spDue"></label></div><p class="hint">ยอดที่ยังไม่ได้รับจะเป็นลูกหนี้ — ออกใบแจ้งหนี้ / ใบเสร็จได้ที่ขั้นถัดไป · เงินเชื่อใช้ได้วิธีเดียว</p>`;}
   let h=PY.lines[k].map((l,i)=>lineBox(k,l,i)).join('');
   if(k==='trans'||k==='card')h+=`<div class="pkg-add-row"><button type="button" class="btn pkg-add" data-padd="${k}">+ เพิ่ม</button></div>`;
   if(k==='card')h+=`<div class="pkg-pay-2">${fx('ชาร์จเพิ่ม (%)','cardPct','inputmode="decimal"')}${fx('เลขที่อนุมัติ / สลิป','cardRef')}</div><p class="hint" id="spFee"></p>`;
   if(k==='chk')h+=`${fx('ธนาคารตามหน้าเช็ค','chkBank')}<div class="pkg-pay-2">${fx('เลขที่เช็ค','chkNo')}${fx('วันที่สั่งจ่าย','chkDate','type="date"')}</div>`;
   return h;};
  P.innerHTML=`<div class="pkg-pay-head"><b>${PX.c&&PX.c.title?esc(PX.c.title):'ชำระเงิน'}</b><span class="hint">${PX.c&&PX.c.sub?esc(PX.c.sub):esc(peekDocNo(PREFIX))+' · ใบตัดสต็อก'}</span><button type="button" class="pkg-pay-rv" data-pp="close">กลับไปตรวจรายการ</button><button type="button" class="pkg-pay-x" data-pp="close" aria-label="ปิดหน้าชำระเงิน">✕</button></div>
  <div class="pkg-pay-body pkg-r2">
   <div class="pkg-r2sum"><div class="pkg-r2tot"><span>ยอดที่ต้องชำระ</span><b>${money(pnet())}</b></div>
    <div class="pkg-r2row"><div><span>รับแล้ว</span><b id="spGot"></b></div><div class="pkg-r2due" id="spDueBox"><span id="spDueLbl"></span><b id="spDueAmt"></b></div></div>
    <p class="hint" id="spCard"></p></div>
   <div class="pkg-quick"><button type="button" class="btn grn" data-pp="fullcash">ชำระเงินสดเต็มจำนวน</button><button type="button" class="btn grn" data-pp="fulltrans">โอนชำระเต็มจำนวน</button></div>
   <div class="pkg-r2hint">แตะวิธีที่ลูกค้าจ่าย — แตะหลายอันได้ (แบ่งจ่าย)</div>
   <div class="pkg-tiles" role="group" aria-label="วิธีการชำระเงิน">${tilesHtml()}</div>
   <p class="hint" id="spTip"></p>${PX.c&&PX.c.extra?PX.c.extra():''}
   ${o.map((k,i)=>`<section class="pkg-r2card" style="--mc:${TILE[k][2]}"><div class="pkg-r2card-hd"><span class="no">${i+1}</span><b>${TILE[k][0]} ${PML[k]}</b><button type="button" class="pkg-r2-rm" data-ptile="${k}">เอาออก</button></div>
    ${section(k)}</section>`).join('')}
   <details class="pkg-r2who"><summary><i class="pkg-ic pkg-ic-user" aria-hidden="true"></i>ผู้รับเงิน: <span id="spBy"></span></summary>${fx('ผู้รับเงิน','by')}${fx('หมายเหตุ','note')}</details>
  </div>
  <div class="pkg-pay-foot"><button type="button" class="btn grn" data-pp="finish" id="spOk">${PX.c&&PX.c.ok?esc(PX.c.ok):'ปิดการขาย'}</button></div>`;
  payUpdate();
 }
 function payUpdate(){
  if(P.hidden||!$i('spDueAmt'))return;
  const pn=paidNow(),got=pn.reduce((a,k)=>a+sumOf(k),0),due=r2(pnet()-got),credit=PY.order.includes('credit'),ok=Math.abs(due)<0.005;
  $i('spGot').textContent=money(got);
  const part=!!(PX.c&&PX.c.partial)&&due>0&&got>0;   /* new flow: less than the total = a part payment, not a mistake */
  $i('spDueBox').className='pkg-r2due '+(credit||ok?'st-ok':part?'st-part':due>0?'st-due':'st-over');
  $i('spDueLbl').textContent=credit?'เงินเชื่อทั้งหมด':ok?'✓ ครบแล้ว':part?'คงค้างหลังรับครั้งนี้':due>0?'ยังขาด':'เกินมา';
  $i('spDueAmt').textContent=money(Math.abs(due));
  const ca=sumOf('card'),fe=feeNow();
  $i('spCard').textContent=ca&&fe>0?`รูดบัตร ${money(ca)} + ค่าธรรมเนียม ${money(fe)} = ${money(ca+fe)} บาท (ค่าธรรมเนียมไม่นับเป็นรายได้)`:'';
  if($i('spFee'))$i('spFee').textContent=`ค่าธรรมเนียม ${money(fe)} บาท · ยอดที่ต้องรูดรวม ${money(ca+fe)} บาท`;
  $i('spTip').textContent=pn.length&&!ok?'พิมพ์ยอดของแต่ละวิธีเอง · กด “ยอดที่เหลือ” เพื่อเติมส่วนที่ยังขาด':'';
  P.querySelectorAll('[data-ptile-amt]').forEach(x=>{const k=x.dataset.ptileAmt;if(!PY.order.includes(k))return;const zero=k!=='credit'&&!(sumOf(k)>0);
   x.textContent=k==='credit'?(n(PY.x.days)>0?n(PY.x.days)+' วัน':'ยังไม่ระบุวัน'):zero?'ยังไม่ใส่ยอด':money(sumOf(k));x.style.color=zero?'#667085':'';x.style.fontWeight=zero?'400':'';});
  const ch=$i('spChange');if(ch){const g=PY.x.given===''?null:n(PY.x.given),c=sumOf('cash');ch.value=g===null?'':money(Math.max(0,g-c));ch.classList.toggle('neg',g!==null&&g<c);}
  P.querySelectorAll('input[data-pl]').forEach(i=>{if(i.type==='radio')return;const [k,idx,f]=i.dataset.pl.split(':'),l=PY.lines[k]&&PY.lines[k][+idx];if(!l)return;
   if(i!==document.activeElement)i.value=l[f]??'';});
  const dd=$i('spDue');if(dd){const due2=new Date();due2.setDate(due2.getDate()+n(PY.x.days));dd.value=thDate(iso(due2));}
  const by=$i('spBy');if(by)by.textContent=(PY.x.by||'-')+(PY.x.note?' · มีหมายเหตุ':'');
 }
 function setSlot(i,next){
  const prev=PY.order[i];
  if(next==='credit'&&!W.S.custId){toast('เลือกลูกค้าก่อนขายเชื่อ');return drawPay();}
  if(next==='credit'&&PY.order.some(k=>k!=='credit')){toast('เงินเชื่อต้องเป็นวิธีเดียว — นำวิธีอื่นออกให้แล้ว');PY.order=['credit'];PY.lines={};return drawPay();}
  if(prev)delete PY.lines[prev];
  if(next){PY.order[i]=next;if(next!=='credit')PY.lines[next]=[blankLine(next)];}else PY.order.splice(i,1);
  PY.order=PY.order.filter(Boolean);
  drawPay();
 }
 P.addEventListener('input',e=>{
  const pl=e.target.dataset.pl;if(pl){const [k,idx,f]=pl.split(':'),l=PY.lines[k]&&PY.lines[k][+idx];if(l)l[f]=e.target.value;payUpdate();return;}
  const px=e.target.dataset.px;if(px&&px!=='mode'){PY.x[px]=e.target.value;payUpdate();}
 });
 P.addEventListener('change',e=>{
  const sl=e.target.dataset.pslot;if(sl!=null)return setSlot(+sl,e.target.value);
  const pl=e.target.dataset.pl;if(pl){const [k,idx,f]=pl.split(':'),l=PY.lines[k]&&PY.lines[k][+idx];if(l)l[f]=e.target.value;payUpdate();return;}
  if(e.target.dataset.px==='mode')PY.x.mode=e.target.value;
 });
 P.addEventListener('click',async e=>{
  const tile=e.target.closest('[data-ptile]')?.dataset.ptile;if(tile)return toggleTile(tile);
  const rest=e.target.closest('[data-prest]')?.dataset.prest;
  if(rest){const [k,idx]=rest.split(':'),ls=PY.lines[k];const others=paidNow().reduce((a,x)=>a+sumOf(x),0)-n(ls[+idx].amt);ls[+idx].amt=String(Math.max(0,r2(pnet()-others)));const inp=P.querySelector(`[data-pl="${k}:${idx}:amt"]`);if(inp)inp.value=ls[+idx].amt;payUpdate();return;}
  const add=e.target.closest('[data-padd]')?.dataset.padd;if(add){PY.lines[add].push(blankLine(add));drawPay();P.querySelector(`[data-pl="${add}:${PY.lines[add].length-1}:amt"]`)?.focus();return;}
  const del=e.target.closest('[data-pdel]')?.dataset.pdel;if(del){const [k,idx]=del.split(':');PY.lines[k].splice(+idx,1);return drawPay();}
  const now=e.target.closest('[data-pnow]')?.dataset.pnow;if(now!==undefined){PY.lines.trans[+now].when=nowText();return payUpdate();}
  const p=e.target.closest('[data-pp]')?.dataset.pp;if(!p)return;
  if(p==='close')return closePay();
  if(p==='fullcash'||p==='fulltrans'){const k=p==='fullcash'?'cash':'trans';PY.order=[k];PY.lines={[k]:[blankLine(k)]};PY.lines[k][0].amt=String(pnet());
   if(k==='trans'){const b=(DB.shop.banks||[])[0];if(b)PY.lines.trans[0].bank=typeof bankLabel==='function'?bankLabel(b):b.bank||'';}return drawPay();}
  if(p==='finish')return finishPay();
 });
 async function finishPay(){
  const S=pdoc();if(!S)return;const o=PY.order,credit=o.includes('credit'),total=pnet();
  if(!o.length&&!(PX.c&&PX.c.zeroOk&&PX.c.zeroOk()))return toast('เลือกวิธีการชำระเงินก่อน');
  if(credit&&!S.custId)return toast('ขายเชื่อต้องเลือกลูกค้าก่อน');
  {const empty=paidNow().find(k=>!(sumOf(k)>0));if(empty)return toast(TILE[empty][1]+': ยังไม่ได้ใส่จำนวนเงิน');}
  if(!credit&&PX.c){const got=paidNow().reduce((a,k)=>a+sumOf(k),0);if(got>total+0.005)return toast('รับเกินยอดที่ต้องชำระ — ยอดที่ต้องชำระ '+money(total)+' บาท');
   if(!PX.c.partial&&r2(total-got)>=0.005)return toast('ร้านตั้งค่าไม่รับชำระบางส่วน — ต้องรับเต็มจำนวน '+money(total)+' บาท');}
  else if(!credit){const got=paidNow().reduce((a,k)=>a+sumOf(k),0);if(Math.abs(r2(total-got))>=0.005)return toast('ยอดที่รับ '+money(got)+' บาท ไม่เท่ากับยอดที่ต้องชำระ '+money(total)+' บาท');}
  for(const l of PY.lines.trans||[])if(!l.bank||!l.when)return toast('เงินโอน: เลือกบัญชีที่รับโอนและวันที่ / เวลา');
  for(const l of PY.lines.card||[])if(!l.bank||!/^\d{4}$/.test(String(l.last4||'')))return toast('บัตร: เลือกธนาคาร / ผู้ให้บริการ และใส่เลข 4 ตัวท้าย');
  if(o.includes('cash')&&PY.x.given!==''&&n(PY.x.given)+0.001<sumOf('cash'))return toast('รับเงินสดมาน้อยกว่ายอดที่ชำระด้วยเงินสด');
  const due=new Date();due.setDate(due.getDate()+n(PY.x.days));
  const t=PY.lines.trans&&PY.lines.trans[0],c=PY.lines.card&&PY.lines.card[0];
  /* stored in the receipt's own shape so "ใบแจ้งหนี้ / ใบเสร็จรับเงิน" carries it over unchanged */
  const pay={method:o[0],methods:o.slice(),amount:total,
   cash:o.includes('cash'),trans:o.includes('trans'),card:o.includes('card'),chk:o.includes('chk'),credit,
   cashAmt:sumOf('cash'),transAmt:sumOf('trans'),cardAmt:sumOf('card'),chkAmt:sumOf('chk'),
   bank:t?t.bank:'',when:t?t.when:'',transLines:JSON.parse(JSON.stringify(PY.lines.trans||[])),
   cardBank:c?c.bank:'',card4:c?c.last4:'',cardType:c?c.type:'',cardLines:JSON.parse(JSON.stringify(PY.lines.card||[])),cardPct:n(PY.x.cardPct),cardRef:PY.x.cardRef||'',cardFee:feeNow(),
   chkBank:PY.x.chkBank||'',chkNo:PY.x.chkNo||'',chkDate:PY.x.chkDate||'',
   days:credit?n(PY.x.days):0,due:credit?iso(due):'',cashGiven:PY.x.given,changeMode:PY.x.mode,
   received:PY.x.given===''?sumOf('cash'):n(PY.x.given),change:PY.x.given===''?0:Math.max(0,n(PY.x.given)-sumOf('cash')),by:PY.x.by||'',note:PY.x.note||''};
  if(PX.c)return PX.c.finish(pay,r2(paidNow().reduce((a,k)=>a+sumOf(k),0)),closePay);   /* sale-pay.js: cut + first payment / receive on a saved sale */
  closePay();
  const doc=await createDoc(S,pay,{});if(!doc)return;
  W.S=null;W.cur=doc;paint();done(doc);
 }
 const payLabel=p=>p?(p.methods||[p.method]).map(k=>PML[k]||PAY[k]||k).join(' + ')+(p.cardFee>0?' (ชาร์จบัตร '+money(p.cardFee)+')':''):'ยังไม่ระบุ';
 window.pkgSalePay={open:openPay,close:closePay,state:PY,slot:setSlot,tile:toggleTile,finish:finishPay,draw:drawPay,update:payUpdate,ctx:()=>PX.c};

 /* ---------- after payment: centred pop-up (reference picture 3) ---------- */
 const D=document.createElement('div');D.className='modal';D.id='mSaleDone';
 D.innerHTML=`<div class="sheet" style="max-width:660px"><div class="panel pkg-sa-done" style="margin-bottom:0;border:0">
  <div class="pkg-sa-tick" aria-hidden="true">✓</div><h2>บันทึกข้อมูลสำเร็จ</h2><p class="hint" id="sdNo"></p><p class="hint">กดปุ่มเพื่อดำเนินการ</p>
  <div class="pkg-sa-done-btns">
   <button type="button" class="btn pkg-sa-teal" data-d="slip">พิมพ์เอกสารอย่างย่อ</button>
   <button type="button" class="btn pri" data-d="new">+ สร้างข้อมูลใหม่</button>
   <button type="button" class="btn pkg-sa-purple pc-rIssue" data-d="bill">ใบแจ้งหนี้ / ใบเสร็จรับเงิน</button>
   <button type="button" class="btn pkg-sa-orange-b" data-d="stay">คงหน้าตัดสต็อกขายเดิม</button>
   <button type="button" class="btn pkg-sa-grey" data-d="list">กลับไปยังหน้าค้นหาเอกสาร</button>
  </div></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(D);
 function done(c){$i('sdNo').textContent='ใบตัดสต็อก '+c.no+' · '+payLabel(c.pay)+' · '+money(c.total);D.dataset.id=c.id;if(window.PKG_SALE_PAY)PKG_SALE_PAY.done(c,D);openModal('mSaleDone');}
 D.addEventListener('click',e=>{
  const a=e.target.closest('[data-d]')?.dataset.d;if(!a)return;const c=L().find(x=>x.id===D.dataset.id);
  if(a==='stay'){closeModal('mSaleDone');return;}
  if(a==='list'){closeAll();go('receipt');rOvGo('retail');return;}
  if(a==='new'){closeModal('mSaleDone');return openNew();}
  if(a==='slip'&&c){if(!need('print'))return;return printSlip(c);}
  if(a==='bill'&&c)return billFromSale(c.id);
 });

 /* ---------- print ---------- */
 const markPrinted=c=>{c.printed=true;logAudit('stockcut',c,'print');save();refresh();};
 function printSlip(c){
  if(typeof soldAs==='function')c=soldAs(c);   /* DriveGo new system (task 3.3): the short tax invoice stays as sold after a credit note */
  const cu=findCust(c.custId),t=tot(c),s=DB.shop||{};
  printDocs(`<div class="sheetpage" style="max-width:80mm;margin:0 auto;font-size:12px"><div style="text-align:center"><b style="font-size:14px">${esc(orgName())}</b><br>${esc(s.addr?addrLine(s.addr):'')}${s.tax?'<br>เลขประจำตัวผู้เสียภาษี '+esc(s.tax):''}
   <br><b>${t.vat>0?'ใบกำกับภาษีอย่างย่อ / ':''}ใบตัดสต็อกขายสินค้า</b></div><hr>
   เลขที่ ${esc(c.no)}<br>วันที่ ${c.createdAt?thDateTime(c.createdAt):thDate(c.date)}<br>ลูกค้า ${esc(custName(cu)||'ลูกค้าทั่วไป')}${c.sellerName?'<br>พนักงานขาย '+esc(c.sellerName):''}<hr>
   <table style="width:100%;border:0">${(c.items||[]).map(it=>`<tr><td style="border:0">${esc(it.name)}<br>${qf(it.qty)} × ${money(it.price)}</td><td style="border:0;text-align:right;vertical-align:bottom">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')}</table><hr>
   <table style="width:100%;border:0">${n(c.disc)?`<tr><td style="border:0">ส่วนลด</td><td style="border:0;text-align:right">-${money(c.disc)}</td></tr>`:''}${SP()?SP().printExtra(c,'slipadj'):''}${t.vat>0?`<tr><td style="border:0">ภาษีมูลค่าเพิ่ม ${n(c.vat)}%</td><td style="border:0;text-align:right">${money(t.vat)}</td></tr>`:''}
   <tr><td style="border:0"><b>รวมทั้งสิ้น</b></td><td style="border:0;text-align:right"><b>${money(t.gross)}</b></td></tr>
   ${SP()&&PKG_SALE.led(c)?SP().printExtra(c,'slippay'):c.pay?`<tr><td style="border:0">${esc(payLabel(c.pay))}</td><td style="border:0;text-align:right">${c.pay.method==='cash'?money(c.pay.received):''}</td></tr>${c.pay.method==='cash'?`<tr><td style="border:0">เงินทอน</td><td style="border:0;text-align:right">${money(c.pay.change)}</td></tr>`:''}`:''}</table>
   ${c.cancelled?'<p style="text-align:center"><b>— ยกเลิกแล้ว —</b></p>':''}<p style="text-align:center">ขอบคุณที่ใช้บริการ</p></div>`);
  markPrinted(c);
 }
 function printDoc(c){
  if(typeof soldAs==='function')c=soldAs(c);
  const cu=findCust(c.custId),v=cu&&(cu.vehicles||[])[c.vehIdx],t=tot(c);
  printDocs(sheetTop({title:'ใบตัดสต็อกขายสินค้า',en:'STOCK ISSUE / SALE',copy:'ต้นฉบับ',stamp:c.cancelled?'ยกเลิกแล้ว':'',
   fields:[['เลขที่',esc(c.no)],['วันที่',thDate(c.date)],['ช่องทางการขาย',esc(CH[c.channel]||'')],['อ้างอิง',esc(c.quoteNo?'ใบเสนอราคา '+c.quoteNo:(c.ref||'-'))]]})
   +`<table><tr><td><span class="lbl">ลูกค้า</span><br><b>${esc(custName(cu)||'ลูกค้าทั่วไป')}</b>${cu?'<br>'+esc(addrLine(cu.addr))+(cu.tax?'<br>เลขประจำตัวผู้เสียภาษี '+esc(cu.tax):''):''}</td>
    <td><span class="lbl">รถ</span><br>${esc(plateOf(v)||'-')}${v?' · '+esc([v.brand,v.model].filter(Boolean).join(' ')):''}</td></tr></table>
   <table style="margin-top:8px"><thead><tr><th style="width:34px">#</th><th style="width:120px">รหัสสินค้า</th><th>รายการ</th><th style="width:70px">จำนวน</th><th style="width:90px">ราคา/หน่วย</th><th style="width:100px">จำนวนเงิน</th></tr></thead><tbody>
   ${(c.items||[]).map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'')}</td><td>${esc(it.name||'')}${it.type==='kit'?' (ชุด)':''}</td><td style="text-align:right">${qf(it.qty)}</td><td style="text-align:right">${money(it.price)}</td><td style="text-align:right">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')}</tbody>
   <tfoot><tr><td colspan="5" style="text-align:right">รวมเป็นเงิน</td><td style="text-align:right">${money(t.sub)}</td></tr>${n(c.disc)?`<tr><td colspan="5" style="text-align:right">ส่วนลดท้ายบิล</td><td style="text-align:right">${money(c.disc)}</td></tr>`:''}
   ${SP()?SP().printExtra(c,'docadj'):''}${t.vat>0?`<tr><td colspan="5" style="text-align:right">ภาษีมูลค่าเพิ่ม ${n(c.vat)}%</td><td style="text-align:right">${money(t.vat)}</td></tr>`:''}<tr><td colspan="5" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td style="text-align:right"><b>${money(t.gross)}</b></td></tr></tfoot></table>
   <div class="box" style="padding:4px 6px;margin-top:6px"><span class="lbl">การชำระเงิน</span> ${SP()&&PKG_SALE.led(c)?SP().printExtra(c,'docpay'):esc(payLabel(c.pay))}${c.cancelled?' · <b>ยกเลิกแล้ว</b> '+esc(c.cancelReason||''):''}</div>
   <table style="margin-top:28px"><tr><td style="width:50%;text-align:center;border:0">.................................................<br>ผู้ตัดสต็อก (${esc(byShort(c)||'')})</td>
   <td style="text-align:center;border:0">.................................................<br>ผู้รับสินค้า</td></tr></table></div>`);
  markPrinted(c);
 }
 /* 03 register (user 2026-10-08): the "ใบเสร็จ" column also shows the stock-cut state on a second line under a thin rule,
    like the amount / VAT cells of 4.4 — header "ใบเสร็จ" over "ตัดสต็อก". Cell found by its header, row by its quote link. */
 (()=>{
  if(!document.getElementById('qOvTbl')||typeof renderQuoteOverview!=='function')return;
  const LBL='ใบเสร็จ / ตัดสต็อก';
  /* header looked up on every draw: other modules rebuild the header row (the ลำดับ column), which replaces the cells */
  const head=tbl=>{const hd=tbl&&tbl.tHead?[...tbl.tHead.rows[0].cells]:[];let th=hd.find(h=>h.classList.contains('pkg-q2-h'));
   if(!th){th=hd.find(h=>h.textContent.replace(/[▴▾]/g,'').trim()==='ใบเสร็จ');if(!th)return null;th.classList.add('pkg-q2-h');
    const arr=th.querySelector('.sarr');th.innerHTML='ใบเสร็จ<div class="pkg-sa-sub">ตัดสต็อก</div>';if(arr)th.appendChild(arr);}
   th.dataset.lbl=LBL;return {hd,th};};
  head(document.getElementById('qOvTbl'));
  const orig=renderQuoteOverview;
  renderQuoteOverview=function(){
   const out=orig.apply(this,arguments),tbl=document.getElementById('qOvTbl'),h=head(tbl);if(!h)return out;   /* bindSort stores the header text once — head() keeps the readable label for cards / exports */
   const fromEnd=h.hd.length-1-h.hd.indexOf(h.th);
   /* counted from the right: the ลำดับ column (row-number.js) is in the header already but added to the rows only after this */
   [...tbl.tBodies[0].rows].forEach(tr=>{const td=tr.cells[tr.cells.length-1-fromEnd],a=tr.querySelector('[onclick*="openQuoteById"]');if(!td||!a)return;
    const id=(a.getAttribute('onclick').match(/openQuoteById\('([^']+)'/)||[])[1],q=id&&DB.quotes.find(x=>x.id===id);if(!q)return;
    const bill=q.cancelled?'-':SP()&&activeCut(q)?SP().chip(activeCut(q),2):qOvBilled.has(q.id)?'<span class="pkg-q2-y">✓ ออกแล้ว</span>':'<span class="pkg-q2-n" title="ยังไม่ออกใบเสร็จ">-</span>';
    const cut=q.cancelled?'-':(q.deducted||activeCut(q))?'<span class="pkg-q2-y">✓ ตัดสต็อกแล้ว</span>':'<span class="pkg-q2-n" title="ยังไม่ตัดสต็อก">-</span>';
    td.innerHTML=bill+'<div class="pkg-sa-sub">'+cut+'</div>';if(td.hasAttribute('data-l'))td.setAttribute('data-l',LBL);});
   return out;};
  try{renderQuoteOverview();}catch(e){}
 })();
 window.PKG_STOCK_CUT={done,layoutMig,list:L,ensure,activeCut,activeBills,bills,saleBills,waiting,cutQuote,createDoc,cancelCut,open:openSaved,openNew,billFromSale,
  render:()=>pkgRenderCuts(),qLines,tot,state:W,paint,printSlip,printDoc,legacyRetail:()=>legacyRetail&&legacyRetail()};
})();
