/* DriveGo new system (task 3.12, decisions R18 = ข, F8 = ก and the owner's answers 12.1–12.8 of 2026-10-26): ProX online
   mode (menu P1 "คิวจองจาก BOOK" and 07 "★ คลังกลาง ProX" connected to the chain server).
   · Money of a chain booking is the sale's (ใบตัดสต็อก) of the quotation opened from that booking (12.1): "🧾 ออกใบเสร็จ"
     sends the sale's outstanding amount to the chain (nothing typed; legacy: an amount typed by hand, whole baht only).
   · "💵 รับชำระ → Coins เครือ" takes the money at the counter with the shop's normal payment step (12.2): the payment is the
     sale's own receipt MA-RE… issued at once (task 3.5), src 'chain', with the chain's receipt number as its reference
     (`chainRc`, shown as "เลขอ้างอิงของเครือ DriveGo" on the receipt — not MA-RC, which is a goods receipt). A sale already
     paid in the shop gets the chain's number on its latest receipt (12.3). The shop's receipt is saved first, then the chain
     is told; when it cannot be reached: "ยังไม่ได้แจ้งเครือ ลองใหม่", and the same button tells it again (12.7).
     A sale paid through the chain gets no second Coins from the shop's own scan (12.4: DB.px.coined).
   · Rights (12.5): billing and paying through the chain need "บันทึกรับชำระจากลูกหนี้" (doc.payRec), taking a booking needs
     the right to create a quotation; the chain catalogue's costs are not shown to someone who may not see costs (F7).
   · Cancelling a receipt paid through the chain asks for the reason and warns that the chain's paid status and Coins
     stay (12.6).
   · The 7-second reload of the chain's tables keeps what is being typed and where the cursor is (12.8, finding 65); asking
     the central warehouse for stock writes an audit line (12.8).
   The booked car (finding 62) and the chain catalogue's category of a new item (12.8) are fixed where they are made (03.js). */
(function(){
 if(typeof pxNetApi!=='function'||typeof renderPxBookNet!=='function'||!window.PKG_SALE||!window.PKG_STOCK_CUT)return;
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT;
 const $i=id=>document.getElementById(id);
 const r2=v=>Math.round(n(v)*100)/100;
 const REF='เครือ DriveGo · ใบจอง #';
 const NOT_TOLD='ยังไม่ได้แจ้งเครือ ลองใหม่';
 const busy={};

 /* the shop's side of a chain booking: its quotation, the sale cut from it, the payment that carries the chain's number */
 function job(id){
  const q=(DB.quotes||[]).find(x=>x&&x.bookRef===REF+id&&!x.cancelled)||null;
  const c=q?SC.activeCut(q):null,L=c?S.led(c):null,rc=(PXNET.q.find(x=>x.id===id)||{}).rc_no||'';
  const p=L&&rc?(L.payments||[]).find(x=>x&&!x.cancelled&&x.chainRc===rc)||null:null;
  return {q,c,L,p,rc};
 }
 const mayMoney=()=>{if(!can('doc.payRec')){toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');return false;}return true;};
 function noSale(id,j){
  return toast(j.q?'ยังไม่มีใบตัดสต็อกของใบจอง #'+id+' — ตัดสต็อกจากใบเสนอราคา '+j.q.no+' ก่อน':'ไม่พบใบเสนอราคาของใบจอง #'+id+' ในร้าน');
 }
 function refresh(){['renderHome','renderDocOverview','renderTaxOverview'].forEach(f=>{if(typeof window[f]==='function')try{window[f]();}catch(e){}});}
 /* a chain call; null when the chain cannot be reached */
 async function chain(path,opt){try{return await pxNetApi(path,opt);}catch(e){return null;}}

 /* ---------- the bookings table ---------- */
 renderPxBookNet=function(){
  const rows=PXNET.q;
  $('#pxBookCount').textContent='🌐 '+rows.filter(x=>x.status==='wait').length+' งานรอรับ (ออนไลน์จริง)';
  const S0={wait:['#fff3cd;color:#7a5600','รอรับ'],accepted:['#e6f4ea;color:#1f7a4d','รับแล้ว'],billed:['#fdebd0;color:#9a5b00','รอชำระ'],paid:['#e6f4ea;color:#1f7a4d','✓ จบงาน']};
  $('#pxBookTbl tbody').innerHTML=rows.map(b=>{
   const s=S0[b.status]||S0.wait,j=b.status==='wait'?null:job(b.id);let act='';
   if(b.status==='wait')act='<button class="btn pri sm" onclick="pxNetAccept('+b.id+')">รับเข้าระบบ → เปิดใบเสนอราคา</button>';
   if(b.status==='accepted')act=(j.c?'<span class="mono">'+esc(j.c.no)+' · '+money(due(j))+'</span>':'<span class="hint">ยังไม่ตัดสต็อก</span>')
    +' <button class="btn sm" onclick="pxNetBill('+b.id+')">🧾 ออกใบเสร็จ</button>';
   if(b.status==='billed')act='<span class="mono">'+b.rc_no+' · '+money(b.amount)+'</span>'+(j.p?'<br><span class="hint">ใบเสร็จ '+esc(j.p.reNo)+' · ยังไม่ได้แจ้งเครือ</span>':'')
    +' <button class="btn pri sm" onclick="pxNetPay('+b.id+')">💵 รับชำระ → Coins เครือ</button>';
   if(b.status==='paid')act='<span class="mono" style="color:#1f7a4d">'+b.rc_no+' · +'+Math.floor(b.amount/100)+' Coins</span>'+(j.p?'<br><span class="hint">ใบเสร็จ '+esc(j.p.reNo)+'</span>':'');
   return '<tr><td>#'+b.id+'<br><span class="hint">'+String(b.created_at||'').slice(5,16)+'</span></td>'
    +'<td class="mono">'+b.plate+'</td>'
    +'<td>'+(b.owner||'-')+'<br><span class="hint">'+(b.car||'')+'</span></td>'
    +'<td>'+b.service+'</td><td class="ctr">—</td>'
    +'<td class="ctr"><span class="tag" style="background:'+s[0]+'">'+s[1]+'</span></td>'
    +'<td class="ctr">'+act+'</td></tr>';
  }).join('');
  $('#pxBookEmpty').style.display=rows.length?'none':'';
  if(!rows.length)$('#pxBookEmpty').textContent='🌐 ออนไลน์แล้ว — รอคิวจองจากมือถือลูกค้าจริง (เปิด BOOK แล้วจองเข้าสาขานี้)';
 };
 /* what "ออกใบเสร็จ" sends: the sale's outstanding amount, or its whole amount when the shop has been paid already (12.3) */
 function due(j){const st=S.stat(j.c);return st.rem>0.005?st.rem:r2(st.total);}

 /* ---------- take a booking: the right to create a quotation (12.5) ---------- */
 const accept0=pxNetAccept;
 pxNetAccept=async function(id){
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('quote','add'))return;
  if(busy['a'+id])return;busy['a'+id]=1;
  try{return await accept0.apply(this,arguments);}finally{delete busy['a'+id];}
 };

 /* ---------- ออกใบเสร็จ: the sale's amount to the chain ---------- */
 pxNetBill=async function(id){
  if(!mayMoney()||busy['b'+id])return;
  const j=job(id);if(!j.c)return noSale(id,j);
  const st=S.stat(j.c);if(st.k==='cancel'||st.k==='revised')return noSale(id,j);
  const amt=due(j);if(!(amt>0))return toast('ใบตัดสต็อก '+j.c.no+' ไม่มียอดเงิน — ออกใบเสร็จผ่านเครือไม่ได้');
  busy['b'+id]=1;
  try{
   const r=await chain('/api/bill/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:amt})});
   if(!r)return toast(NOT_TOLD);
   if(r.error)return toast('✗ '+r.error);
   logAudit('stockcut',j.c,'save','ออกใบเสร็จผ่านเครือ DriveGo · '+r.booking.rc_no+' · ใบจอง #'+id+' · ยอด '+money(amt)+' บาท');save();
   toast('🧾 ออกใบเสร็จ '+r.booking.rc_no+' — ลูกค้าเห็นยอดรอชำระบนมือถือ');
  }finally{delete busy['b'+id];}
  pxNetPull();
 };

 /* ---------- รับชำระ: the shop's own payment step, then the chain ---------- */
 let PENDING=null;   /* {sale, booking, rc} while the payment step opened from P1 is on screen */
 pxNetPay=async function(id){
  if(!mayMoney()||busy['p'+id])return;
  const j=job(id);if(!j.c)return noSale(id,j);
  if(j.p)return tell(id,j.c,j.p);   /* the shop has its receipt; the chain was not told yet */
  const st=S.stat(j.c);
  if(st.k==='paid'){   /* paid in the shop already: the chain's number goes on its latest receipt (12.3) */
   const p=(j.L.payments||[]).filter(x=>x&&!x.cancelled&&x.reNo).slice(-1)[0];if(!p)return noSale(id,j);
   mark(j.c,j.L,p,id,j.rc);
   logAudit('stockcut',j.c,'pay','ผูกใบเสร็จ '+p.reNo+' กับใบเสร็จของเครือ DriveGo '+j.rc+' · ใบจอง #'+id);save();refresh();
   return tell(id,j.c,p);
  }
  if(st.k==='credit')return toast(S.CREDIT_LOCK(j.c));
  if(st.k!=='wait'&&st.k!=='part')return noSale(id,j);
  PENDING={sale:j.c.id,booking:id,rc:j.rc};
  window.PKG_SALE_PAY.receive(j.c.id);
 };
 function mark(c,L,p,id,rc){
  p.chainRc=rc;p.chainBooking=id;
  ensurePX();DB.px.coined=DB.px.coined||{};DB.px.coined[L.id]=true;   /* 12.4: the chain gives this sale's Coins */
 }
 /* the payment step's result for the sale opened from P1 */
 const add0=S.addPayment;
 S.addPayment=function(x,d,o){
  const P=PENDING,c=x&&typeof x==='object'?x:SC.list().find(s=>s.id===x);
  if(!P||!c||c.id!==P.sale)return add0.apply(this,arguments);
  const p=add0.call(this,x,d,Object.assign({},o,{src:'chain',hold:true}));
  if(!p)return p;
  PENDING=null;
  mark(c,S.led(c),p,P.booking,P.rc);
  logAudit('stockcut',c,'pay','รับชำระผ่านเครือ DriveGo · '+P.rc+' · ใบจอง #'+P.booking+' · ใบเสร็จ '+p.reNo);
  save();refresh();
  setTimeout(()=>tell(P.booking,c,p),0);   /* after the receipt window has opened */
  return p;
 };
 const pay=window.pkgSalePay;
 if(pay&&typeof pay.close==='function'){const close0=pay.close;pay.close=function(){PENDING=null;return close0.apply(this,arguments);};}   /* left without paying */
 /* tell the chain the booking is paid; its Coins go on the payment */
 async function tell(id,c,p){
  if(busy['p'+id])return;busy['p'+id]=1;
  let r;try{r=await chain('/api/pay/'+id,{method:'POST'});}finally{delete busy['p'+id];}
  if(!r){toast(NOT_TOLD);renderPxBook();return;}
  if(r.error){toast('✗ '+r.error);return;}
  p.chainCoins=n(r.earn);
  logAudit('stockcut',c,'pay','แจ้งเครือ DriveGo แล้ว · '+p.chainRc+' · ใบเสร็จ '+p.reNo+' · +'+n(r.earn)+' Coins');save();
  toast('💰 รับชำระแล้ว → +'+r.earn+' DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ '+r.total+') — เด้งบนมือถือลูกค้าทันที');
  pxNetPull();
 }

 /* ---------- cancelling a receipt paid through the chain (12.6) ---------- */
 const cancel0=S.cancelPayment;
 S.cancelPayment=async function(x,payId,reason){
  const c=x&&typeof x==='object'?x:SC.list().find(s=>s.id===x),L=c&&S.led(c),p=L&&(L.payments||[]).find(q=>q&&q.id===payId);
  if(!p||!p.chainRc||p.cancelled)return cancel0.apply(this,arguments);
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('rcptDoc','cancel'))return false;
  if(reason===undefined){
   reason=await askPromptP({title:'ยกเลิกการรับชำระ '+money(p.amt)+' บาท',text:'ใบเสร็จ '+p.reNo+' ของใบตัดสต็อก '+c.no+' รับผ่านเครือ DriveGo ('+p.chainRc+') — สถานะจ่ายแล้วและ Coins ฝั่งเครือไม่ถูกยกเลิกตาม · ระบุเหตุผลที่ยกเลิก (จำเป็น)',yes:'ยกเลิกการรับชำระ',no:'ไม่ยกเลิก'});
   if(reason===null)return false;
  }
  return cancel0.call(this,x,payId,reason);
 };

 /* ---------- the central warehouse ---------- */
 const costOk=()=>!window.PKG_RIGHTS||PKG_RIGHTS.costOk();
 const cat0=renderPxCatNet;
 renderPxCatNet=function(){
  keepTyped('#pxCatTbl input',()=>cat0.apply(this,arguments));
  if(costOk())return;   /* F7: no cost of the chain's catalogue or of the requests */
  [...$i('pxCatTbl').tBodies[0].rows].forEach(r=>{if(r.cells[4])r.cells[4].textContent='-';});
  const rq=$i('pxReqTbl');if(rq)[...rq.tBodies[0].rows].forEach(r=>{if(r.cells[3])r.cells[3].textContent='-';});
 };
 dcRequest=async function(pid){
  const el=$i('dcq'+pid),q=parseInt((el||{}).value,10);
  if(!q||q<=0){toast('ใส่จำนวนที่ต้องการก่อน');return}
  if(busy['d'+pid])return;busy['d'+pid]=1;
  let r;try{r=await pxNetApi('/api/dc/request',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({items:[{product_id:pid,qty:q}],note:'ขอเติมจากหน้าสต๊อก ProX'})});}finally{delete busy['d'+pid];}
  if(r.error){toast('✗ '+r.error);return}
  const p=DCPROD.find(x=>x.id===pid)||{},s=DB.stock.find(x=>String(x.code||'').toLowerCase()===String(p.code||'').toLowerCase());
  logAudit('stock',s?{id:s.id,no:s.code}:{id:'',no:p.code||''},'save','ขอเติมสต๊อกจากคลังกลาง ProX · คำขอ #'+r.request.id+' · '+(p.code||'')+' × '+q+' '+(p.unit||''));save();
  const now=$i('dcq'+pid);if(now)now.value='';
  toast('🚚 ส่งคำขอเติมสต๊อกถึงศูนย์กระจายสินค้า HQ แล้ว (#'+r.request.id+') — รออนุมัติ/จัดส่ง');
  dcPull();
 };

 /* ---------- what is being typed survives the 7-second reload (finding 65) ---------- */
 function keepTyped(sel,draw){
  const vals={},a=document.activeElement,foc=a&&a.id&&a.matches&&a.matches(sel)?a.id:'';
  let at=null;if(foc)try{at=[a.selectionStart,a.selectionEnd];}catch(e){}
  document.querySelectorAll(sel).forEach(i=>{if(i.id&&i.value!=='')vals[i.id]=i.value;});
  draw();
  Object.keys(vals).forEach(id=>{const i=$i(id);if(i)i.value=vals[id];});
  if(foc){const i=$i(foc);if(i){i.focus({preventScroll:true});if(at&&at[0]!=null)try{i.setSelectionRange(at[0],at[1]);}catch(e){}}}
 }
})();
