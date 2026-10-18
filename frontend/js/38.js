/* คลังเริ่มต้น + เลือกคลังในหน้าต่างเอกสาร (user 2026-10-06, answer 3):
   "every time I do something it starts at warehouse A (my main one); to use another warehouse I pick it myself.
    Someone who only sees warehouse B works in B, and B is their starting warehouse."
   · Starting warehouse = the account's home branch (สาขาประจำ, staff form) when it may use it, else the main branch,
     else the first branch it may use. The owner starts at the main branch.
   · On sign-in (and whenever another account takes over) the working branch goes back to the starting warehouse.
   · Every "new document" button (03, 4.1, 4.2, 4.4, 06.1, 06.2/06.5/06.6, 07 claim / issue / count / transfer,
     08 expenses, 01 appointment, 06.3 asset) starts the new document in the starting warehouse.
   · The document window shows "คลัง / สาขา": a dropdown while the document is unsaved (changing it moves the work
     there: numbers, stock and the 4.2 / 4.4 pick lists follow), read-only once saved. Documents made from another
     document (4.1 / 4.4 from a quote, copies to another branch) keep that document's branch. */
(()=>{
 const B=()=>window.PKG_BRANCH;if(!B())return;
 const $i=id=>document.getElementById(id);
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const gv=name=>{try{return (0,eval)(name);}catch(e){return null;}};
 function start(){
  const Br=B(),acc=Br.accessible();if(!acc.length)return Br.ctx();
  const ok=id=>acc.some(b=>b.id===id),e=curEmp();
  if(e&&e.branchHome&&ok(e.branchHome))return e.branchHome;
  if(ok(Br.MAIN))return Br.MAIN;
  return acc[0].id;
 }
 function fresh(){const d=start();if(d!==B().ctx())B().switchTo(d,{quiet:true});}

 /* ---------- sign-in: back to the starting warehouse ---------- */
 let lastKey=null,lastDB=null;
 const ap=window.applyPerms;
 if(typeof ap==='function')window.applyPerms=function(){
  const r=ap.apply(this,arguments);
  try{const e=curEmp(),k=e?e.id:'owner';
   if(typeof DB==='object'&&DB&&Array.isArray(DB.stock)&&(k!==lastKey||DB!==lastDB)){lastKey=k;lastDB=DB;const Br=B();Br.ensure();const d=start();
    if(d!==Br.ctx()){Br.swapStock(d);DB.curBranch=d;Br.paint();}}}catch(x){}
  return r;};

 /* ---------- new-document buttons ---------- */
 const NEW_RE=/^\s*(?:mSheet\([^)]*\);\s*)?(?:(?:newQuote|newGR|newClaim|newIssue|newCount|newBilling|newInvoiceDoc|newReceipt|pkgSaleNew|newRetailReceipt)\(\s*\)|(?:openExp|openCrm|openAsset)\(\s*(?:null\b[^)]*)?\))/;
 const DIRECT='#mvNew,#ccNew,#mSale [data-a="new"],#mSaleDone [data-d="new"]';
 const VIA='.pkg-tool[data-t="new"],.pkg-side-btn[data-s="new"]';
 let armed=0;
 document.addEventListener('click',e=>{
  const t=e.target;if(!t||!t.closest)return;
  if(t.closest(DIRECT)){fresh();return;}
  const b=t.closest('[onclick]');
  if((b&&NEW_RE.test(b.getAttribute('onclick')||''))||t.closest(VIA))armed=Date.now();
 },true);
 /* the "new" functions use it once (a confirm dialog in between — unsaved changes — may delay the call) */
 const use=()=>{if(armed&&Date.now()-armed<30000){armed=0;fresh();}};
 [['newQuote',0],['newGR',1],['newClaim',1],['newIssue',1],['newCount',1],['newBilling',0],['newInvoiceDoc',0],['newReceipt',0],
  ['newRetailReceipt',0],['pkgSaleNew',0],['openExp',2],['openCrm',2],['openAsset',2]].forEach(([name,kind])=>{
  const o=window[name];if(typeof o!=='function')return;
  window[name]=function(a){if(kind===0||(kind===1&&!a)||(kind===2&&!a))use();return o.apply(this,arguments);};});

 /* ---------- the window control ---------- */
 const byId=(list,id)=>id?(DB[list]||[]).find(x=>x.id===id)||null:null;
 const cut=()=>window.PKG_STOCK_CUT&&PKG_STOCK_CUT.state,mv=()=>window.PKG_BRANCH_TRANSFER&&PKG_BRANCH_TRANSFER.state;
 /* saved: the stored record (read-only) · lock: an unsaved document tied to a document of a fixed branch */
 const WINS={
  mQuoteEdit:{saved:()=>{const d=gv('Q');return d&&d.no?d:null;},lock:()=>{const d=gv('Q');return d&&d.revOf?findQuote(d.revOf):null;},   /* a revision stays with its original */
   refill:()=>{const d=gv('Q');if(d&&!d.no&&!d.revOf)d.previewNo=peekDocNo('QO');fillQuoteForm();if(typeof renderQPrev==='function')renderQPrev();}},
  mGREdit:{saved:()=>{const d=gv('G');return d&&d.no?d:null;},refill:()=>fillGRForm()},
  mClaimEdit:{saved:()=>{const d=gv('C');return d&&d.no?d:null;},refill:()=>fillClaimForm()},
  mIssueEdit:{saved:()=>{const d=gv('IS');return d&&d.no?d:null;},refill:()=>fillIssueForm()},
  mCountEdit:{saved:()=>{const d=gv('SC');return d&&d.no?d:null;},refill:()=>fillCountForm()},
  mReceiptEdit:{saved:()=>{const d=gv('R');return d&&d.no?d:null;},lock:()=>{const d=gv('R');return d&&d.quoteId?findQuote(d.quoteId):null;},refill:()=>fillReceiptForm()},
  mBillingEdit:{saved:()=>{const d=gv('BN');return d&&d.no?d:null;},refill:()=>{newBilling();},reset:1},
  mInvoiceEdit:{saved:()=>{const d=gv('IV');return d&&d.no?d:null;},refill:()=>{newInvoiceDoc();},reset:1},
  mExp:{saved:()=>byId('expenses',gv('editExpId'))},
  mCrm:{saved:()=>byId('crm',gv('editCrmId'))},
  mAsset:{saved:()=>byId('assets',gv('editAssetId'))},
  mSale:{saved:()=>{const w=cut();return w&&w.cur?w.cur:null;},lock:()=>{const w=cut();return w&&w.S&&w.S.quoteId?findQuote(w.S.quoteId):null;},
   refill:()=>{const w=cut();if(w&&w.S)w.S.wh=B().cur().name;if(typeof pkgSaleRender==='function')pkgSaleRender();}},
  mCClaim:{saved:()=>{const w=window.PKG_CUST_CLAIM&&PKG_CUST_CLAIM.state;return w&&w.S&&w.S.no?w.S:null;},lock:()=>{const w=window.PKG_CUST_CLAIM&&PKG_CUST_CLAIM.state;return w&&w.S&&w.S.receiptId?DB.receipts.find(r=>r.id===w.S.receiptId):null;},refill:()=>{if(typeof pkgCClaimRender==='function')pkgCClaimRender();}},
  mMove:{saved:()=>{const w=mv();return w&&w.cur?w.cur:null;},refill:()=>{if(typeof pkgMovePaint==='function')pkgMovePaint();}}
 };
 function ctl(id){
  const m=$i(id);if(!m)return null;let c=m.querySelector('.pkg-wbr');if(c)return c;
  const h=m.querySelector('header');if(!h)return null;
  c=document.createElement('label');c.className='pkg-wbr';c.hidden=true;c.innerHTML='<span>คลัง / สาขา</span><select aria-label="คลัง / สาขาของเอกสารนี้"></select>';
  const h2=h.querySelector('h2'),tag=h2&&h2.nextElementSibling&&h2.nextElementSibling.classList.contains('tag')?h2.nextElementSibling:null;
  (tag||h2)?(tag||h2).after(c):h.prepend(c);
  c.querySelector('select').addEventListener('change',e=>change(id,e.target));
  return c;
 }
 function paintWin(id){
  const w=WINS[id],m=$i(id);if(!w||!m)return;const c=ctl(id);if(!c)return;
  const Br=B(),sel=c.querySelector('select'),saved=w.saved(),lock=!saved&&w.lock?w.lock():null,fixed=saved||lock;
  const acc=Br.accessible(),val=fixed?Br.brOf(fixed):Br.ctx();
  c.hidden=false;   /* one branch too (user 2026-10-06) */
  const opts=fixed?[Br.get(val)].filter(Boolean):acc;
  sel.innerHTML=opts.map(b=>`<option value="${esc2(b.id)}">${esc2(b.code+' · '+b.name)}</option>`).join('')||`<option>${esc2(Br.label(val))}</option>`;
  sel.value=val;sel.disabled=!!fixed||acc.length<2;
  c.title=saved?'เอกสารที่บันทึกแล้วอยู่ที่สาขานี้ — เปลี่ยนไม่ได้':lock?'ทำจากเอกสารของสาขานี้ — ใช้สาขาเดียวกัน':'เลือกคลัง / สาขาที่จะบันทึกเอกสารนี้';
 }
 function change(id,sel){
  const w=WINS[id],to=sel.value,Br=B();if(!w||to===Br.ctx())return;
  if(w.saved()||(w.lock&&w.lock())){paintWin(id);return;}
  if(!Br.switchTo(to,{quiet:true})){paintWin(id);return;}
  try{w.refill&&w.refill();}catch(e){console.error('branch-window',e);}
  paintWin(id);
  toast('เอกสารนี้จะบันทึกที่สาขา '+Br.label(to)+(w.reset?' — เริ่มเอกสารใหม่ของสาขานี้':''));
 }
 const paintOpen=()=>Object.keys(WINS).forEach(id=>{const m=$i(id);if(m&&m.classList.contains('on'))paintWin(id);});
 const om=window.openModal;
 window.openModal=function(id){const r=om.apply(this,arguments);if(WINS[id])try{paintWin(id);}catch(e){}return r;};
 /* a save gives the document its number (now read-only); a branch switch elsewhere repaints */
 const sr=window.stampRec;window.stampRec=function(){const r=sr.apply(this,arguments);setTimeout(paintOpen,0);return r;};
 const go0=window.go;window.go=function(){const r=go0.apply(this,arguments);try{paintOpen();}catch(e){}return r;};
 window.PKG_BRANCH_WINDOW={start,fresh,paint:paintWin,paintOpen,wins:WINS};
})();
