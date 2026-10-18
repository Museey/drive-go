/* FIFO cost ledger. Stock quantities stay owned by the original flows; every logMove call is mirrored here as
   lot receipts (in) or lot consumption (out), so document cost is captured at the moment stock leaves.
   Invariant per stock item: Σ lot.left − Σ pending (unfilled negative stock) === stock.qty
   Expiry (stock-expiry.js, 2026-10-12): lots also carry exp / mfg / expSrc / lotNo. A product with s.expTrack leaves
   first-expired-first-out (plan()); the order never changes HOW MUCH is taken, so the invariant is untouched. */
(()=>{
 const EPS=1e-9,GR_REF='รับเข้าจากใบรับสินค้า';
 const F=()=>{if(!DB.fifo||!Array.isArray(DB.fifo.lots))DB.fifo={v:1,lots:[],allocs:[]};return DB.fifo;};
 const rem=a=>n(a.qty)-n(a.back);
 /* per branch (branch.js): lots and allocations carry br; only the working branch's ledger is read (none = main) */
 const ctxBr=()=>window.PKG_BRANCH?PKG_BRANCH.ctx():'main',inBr=x=>(x.br||'main')===ctxBr();
 const lotsOf=id=>F().lots.filter(l=>l.stockId===id&&inBr(l)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||n(a.seq)-n(b.seq));
 const allocsOf=id=>F().allocs.filter(a=>a.stockId===id&&inBr(a));
 const balance=id=>lotsOf(id).reduce((t,l)=>t+n(l.left),0)-allocsOf(id).filter(a=>a.pending).reduce((t,a)=>t+rem(a),0);
 let seq=0;const nextSeq=()=>Date.now()*1000+(seq++%1000);
 function newLot(s,qty,cost,date,ref,refNo,vendorId,src,x){
  const lot={id:uid(),seq:nextSeq(),br:ctxBr(),stockId:s.id,date:date||iso(),ref:ref||'',refNo:refNo||'',vendorId:vendorId||'',src,cost:n(cost),qty:n(qty),left:n(qty)};
  /* stock-expiry.js: the dates that arrive with the goods (x from onMove, else looked up from the goods-received line) */
  const X=window.PKG_EXPIRY,d=x||(X&&X.lotDates?X.lotDates(s,lot):null)||{};
  lot.exp=d.exp||'';lot.mfg=d.mfg||'';lot.expSrc=d.expSrc||'';lot.lotNo=d.lotNo||'';
  F().lots.push(lot);settle(s,lot);return lot;
 }
 /* A new lot first fills stock that was sold while negative; those documents get the lot's real cost. */
 function settle(s,lot){
  allocsOf(s.id).filter(a=>a.pending&&rem(a)>EPS).sort((a,b)=>n(a.seq)-n(b.seq)).forEach(a=>{
   if(lot.left<=EPS)return;const fill=Math.min(lot.left,rem(a));lot.left-=fill;
   if(fill>=rem(a)-EPS){a.qty=rem(a);a.back=0;a.lotId=lot.id;a.cost=lot.cost;a.pending=false;a.settledAt=iso();}
   else{a.qty=n(a.back)+rem(a)-fill;F().allocs.push({...a,id:uid(),seq:nextSeq(),qty:fill,back:0,lotId:lot.id,cost:lot.cost,pending:false,settledAt:iso()});}
  });
 }
 /* Which lots a quantity leaves from, without changing anything: [{lot,take}] + the shortfall.
    Order: o.lotId (a lot chosen on the document line) → the document's own lots (prefer = refNo) → the rest.
    The rest is FIFO (date, seq); for a product that tracks expiry (s.expTrack) it is first-expired-first-out:
    earliest expiry first, lots without a date last, ties in FIFO order. o.skipExpired leaves expired lots in stock
    (the document's own lots are never skipped — a cancelled goods-received note must take its own lot back). */
 function plan(s,qty,prefer,o){
  o=o||{};let need=n(qty);const takes=[],day=iso(),fe=!!s.expTrack;
  const av=l=>n(l.left)-(o.used?n(o.used.get(l.id)):0);   /* o.used (Map lot id → quantity): what earlier lines of the same document will take — planning only */
  let lots=lotsOf(s.id).filter(l=>av(l)>EPS);
  if(fe)lots=lots.map((l,i)=>[l,i]).sort((a,b)=>String(a[0].exp||'9999-99-99').localeCompare(String(b[0].exp||'9999-99-99'))||a[1]-b[1]).map(p=>p[0]);
  if(fe&&o.skipExpired)lots=lots.filter(l=>!(l.exp&&l.exp<day)||(prefer&&l.refNo===prefer));
  const chosen=o.lotId?lots.find(l=>l.id===o.lotId):null,first=lots.filter(l=>prefer&&l.refNo===prefer&&l!==chosen);
  [...(chosen?[chosen]:[]),...first,...lots.filter(l=>l!==chosen&&!first.includes(l))].forEach(l=>{
   if(need<=EPS)return;const take=Math.min(av(l),need);need-=take;takes.push({lot:l,take});});
  return{takes,short:need>EPS?need:0};
 }
 function consume(s,qty,date,ref,refNo,prefer,o){
  const p=plan(s,qty,prefer,o),X=window.PKG_EXPIRY;
  p.takes.forEach(({lot:l,take})=>{l.left-=take;
   F().allocs.push({id:uid(),seq:nextSeq(),br:ctxBr(),stockId:s.id,lotId:l.id,qty:take,back:0,cost:l.cost,date:date||iso(),ref:ref||'',refNo:refNo||'',pending:false});
   if(X&&X.onOut)try{X.onOut(s,l,take,ref,refNo);}catch(e){}   /* audit line when a confirmed sale takes an expired lot */
  });
  /* Negative stock is allowed: cost is provisional at the latest known cost until the next lot arrives. */
  if(p.short>EPS)F().allocs.push({id:uid(),seq:nextSeq(),br:ctxBr(),stockId:s.id,lotId:null,qty:p.short,back:0,cost:n(s.cost),date:date||iso(),ref:ref||'',refNo:refNo||'',pending:true});
 }
 /* Cancellation returns exactly what that document consumed, back into the same lots, newest allocation first. */
 function restore(s,qty,refNo){
  let left=n(qty);
  allocsOf(s.id).filter(a=>refNo&&a.refNo===refNo&&rem(a)>EPS).sort((a,b)=>n(b.seq)-n(a.seq)).forEach(a=>{
   if(left<=EPS)return;const r=Math.min(rem(a),left);a.back=n(a.back)+r;left-=r;
   if(!a.pending){const lot=F().lots.find(l=>l.id===a.lotId);if(lot)lot.left+=r;}
  });
  return left;
 }
 /* First contact with an item that has no ledger yet: rebuild lots from the newest goods-received moves back
    until the current quantity is covered; anything older becomes an opening-balance lot at the current cost. */
 let grIndex=null;
 function migrate(s,qty){
  if(!grIndex){grIndex={};(DB.moves||[]).forEach(m=>{if(m.type==='in'&&String(m.ref||'').startsWith(GR_REF)&&n(m.qty)>0)(grIndex[m.stockId]=grIndex[m.stockId]||[]).push(m);});}
  let need=n(qty);const picked=[];
  (grIndex[s.id]||[]).filter(inBr).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(m=>{if(need<=EPS)return;const q=Math.min(n(m.qty),need);need-=q;picked.unshift({m,q});});
  if(need>EPS)newLot(s,need,s.cost,'0000-00-00','ยอดยกมา (ก่อนเริ่มระบบ FIFO)','',s.vendorId,'open');
  picked.forEach(({m,q})=>newLot(s,q,n(m.cost)||n(s.cost),m.date,m.ref,m.refNo,m.vendorId,'gr'));
  if(n(qty)<-EPS)consume(s,-n(qty),iso(),'ยอดติดลบก่อนเริ่มระบบ FIFO','',null);
 }
 function ensure(s,qtyBefore){
  const fresh=!lotsOf(s.id).length&&!allocsOf(s.id).length;
  if(fresh)return migrate(s,qtyBefore);
  const diff=n(qtyBefore)-balance(s.id);
  if(diff>EPS)newLot(s,diff,s.cost,iso(),'ปรับยอดยกมา (ไม่มีเอกสารต้นทาง)','',s.vendorId,'open');
  else if(diff<-EPS)consume(s,-diff,iso(),'ปรับยอดลด (ไม่มีเอกสารต้นทาง)','',null);
 }
 function onMove(stockId,type,qty,date,ref,refNo,vendorId,cost){
  const s=DB.stock.find(x=>x.id===stockId);if(!s)return;
  const delta=type==='out'?-Math.abs(n(qty)):type==='in'?Math.abs(n(qty)):n(qty);if(Math.abs(delta)<=EPS)return;
  ensure(s,n(s.qty)-delta);
  const X=window.PKG_EXPIRY;
  if(delta<0)return consume(s,-delta,date,ref,refNo,refNo,X&&X.consumeOpt?X.consumeOpt(s,-delta,refNo):null);   /* stock-expiry.js: chosen lot / skip expired lots, decided just before the cut */
  const extra=restore(s,delta,refNo);
  if(extra>EPS){const src=String(ref||'').startsWith(GR_REF)?'gr':String(ref||'').includes('ตรวจนับ')?'count':'in',c=n(cost)||n(s.cost);
   /* stock-expiry.js: goods that arrive from another branch keep their dates — one lot per source date (same total quantity and value) */
   const parts=X&&X.incoming?X.incoming(s,extra,{ref,refNo,src,cost:c}):null;
   if(parts&&parts.length&&Math.abs(parts.reduce((t,p)=>t+n(p.qty),0)-extra)<=1e-6)parts.forEach(p=>newLot(s,p.qty,p.cost==null?c:p.cost,date,ref,refNo,vendorId,src,p));
   else newLot(s,extra,c,date,ref,refNo,vendorId,src);}
 }
 /* Includes fully returned allocations so a cancelled document reports zero cost rather than "no ledger". */
 const docAllocs=refNo=>refNo?F().allocs.filter(a=>a.refNo===refNo):[];
 window.pkgFifo={
  move:onMove,
  lots:id=>{const s=DB.stock.find(x=>x.id===id);if(s)ensure(s,s.qty);return lotsOf(id);},
  value(s){if(!s)return 0;ensure(s,s.qty);return lotsOf(s.id).reduce((t,l)=>t+n(l.left)*n(l.cost),0)-allocsOf(s.id).filter(a=>a.pending).reduce((t,a)=>t+rem(a)*n(a.cost),0);},
  /* Cost of goods for a document number; null when the document predates the ledger. */
  docCost(refNo){const list=docAllocs(refNo);return list.length?{cost:list.reduce((t,a)=>t+rem(a)*n(a.cost),0),pending:list.some(a=>a.pending&&rem(a)>EPS)}:null;},
  balance:id=>balance(id),
  /* stock-expiry.js: what a quantity would leave from right now (nothing is changed) — o: {prefer, lotId, skipExpired} */
  plan(id,qty,o){const s=DB.stock.find(x=>x.id===id);if(!s)return{takes:[],short:n(qty)};ensure(s,s.qty);return plan(s,qty,o&&o.prefer,o);},
  grUsed(no){return F().lots.some(l=>l.refNo===no&&l.src==='gr'&&n(l.left)<n(l.qty)-EPS);},
  touched(id){return F().allocs.some(a=>a.stockId===id)||F().lots.some(l=>l.stockId===id&&l.src!=='open');},
  reindex(){grIndex=null;}
 };
 window.pkgFifoValue=s=>pkgFifo.value(s);
 /* Receipt COGS: a repair receipt's stock left on its quote's approval; retail/direct receipts deduct under their own number. */
 window.pkgFifoCogs=r=>{
  const q=r.quoteId&&typeof findQuote==='function'?findQuote(r.quoteId):null,got=pkgFifo.docCost(q?q.no:r.no);
  if(got)return got.cost;
  return (r.items||[]).filter(i=>i.type!=='labor').reduce((a,i)=>{const st=DB.stock.find(x=>x.id===i.stockId)||DB.stock.find(x=>x.code===i.code);return a+(st?n(i.qty)*n(st.cost):0);},0);
 };
 /* Anti-fraud: after goods move through FIFO, quantity changes go through stock counts and cost comes from goods received. */
 const originalOpen=openStock;
 openStock=function(id){
  originalOpen.apply(this,arguments);
  const it=id?DB.stock.find(x=>x.id===id):null,lockQty=!!it,lockCost=!!it&&pkgFifo.touched(it.id);
  document.getElementById('fQty').disabled=lockQty||document.getElementById('fQty').disabled;
  document.getElementById('fCost').disabled=lockCost||document.getElementById('fCost').disabled;
  let note=document.getElementById('pkg-fifo-note');
  if(!note){note=document.createElement('small');note.id='pkg-fifo-note';note.className='hint';note.style.display='block';note.style.marginTop='4px';document.getElementById('fQty').after(note);}
  note.textContent=it?'จำนวนคงเหลือแก้ได้ผ่าน “ตรวจนับสินค้า” เท่านั้น'+(lockCost?' · ต้นทุนมาจากใบรับสินค้า (FIFO)':''):'';
  renderLots(it);
 };
 function renderLots(it){
  let box=document.getElementById('pkg-fifo-lots');
  if(!box){box=document.createElement('div');box.id='pkg-fifo-lots';box.className='permbox';document.querySelector('#mStock .body').append(box);}
  if(!it||!can('stock.cost')){box.hidden=true;return;}
  const lots=pkgFifo.lots(it.id).filter(l=>n(l.left)>EPS),pend=allocsOf(it.id).filter(a=>a.pending&&rem(a)>EPS);
  box.hidden=false;
  box.innerHTML=`<h4>ล็อตต้นทุนคงเหลือ (FIFO) — ตัดล็อตที่รับเข้าก่อนออกก่อน</h4><div class="scroll"><table class="tbl"><thead><tr><th>วันที่รับ</th><th>ที่มา</th><th class="num">คงเหลือ</th><th class="num">ทุน / หน่วย</th><th class="num">มูลค่า</th></tr></thead><tbody>${
   lots.map(l=>`<tr><td>${l.date==='0000-00-00'?'ยอดยกมา':thDate(l.date)}</td><td>${esc(l.refNo||l.ref)}</td><td class="num">${qf(l.left)}</td><td class="num">${money(l.cost)}</td><td class="num">${money(n(l.left)*n(l.cost))}</td></tr>`).join('')||'<tr><td colspan="5" class="hint">ไม่มีล็อตคงเหลือ</td></tr>'}</tbody></table></div>${
   pend.length?`<p class="hint">ตัดเกินสต๊อก ${qf(pend.reduce((t,a)=>t+rem(a),0))} ${esc(it.unit||'ชิ้น')} · ใช้ทุนชั่วคราว รอปรับเมื่อรับสินค้าล็อตถัดไป</p>`:''}<p class="hint">มูลค่าคงเหลือ ${money(pkgFifo.value(it))} บาท</p>`;
 }
})();
