/* DriveGo new system (task 3.10, decision Q8, the owner's answers 10.1–10.7): the screens' side of seeing other
   devices' saves at once. window.storage hears them and keeps the rows it fetched pending (server/client/live.ts);
   here the screens say when those rows may go into the app's data, show what happened to an open document, and
   redraw what is behind.
   · Busy (the rows wait): a pop-up, a side panel or a confirmation card is open, or the menu page is a form of its
     own (menu 10, a warning, payroll, the account map …), so nothing the user is typing or looking at changes under
     them. Once it is closed (or the user leaves the form page) the rows go in and the page behind is drawn again
     where it was: the same sub-tab, filters and scroll position (answer "อื่น ๆ").
   · A saved document open in a window that someone else saved: a bar under the window's heading, "เอกสารนี้ถูกแก้ไข
     โดย <ชื่อ> เมื่อ <เวลา> — กดเพื่อโหลดข้อมูลล่าสุด" (10.1, 10.2; cancelling it counts as an edit). What the user typed
     stays until they press it; pressing it opens the document again from the latest data (the app's own open call
     refills an open window without asking). Saving without pressing it gets the usual message that someone saved
     first (P1/Q5) and a reload: nothing is written over quietly.
   · Deleted: "เอกสารนี้ถูกลบโดย <ชื่อ> เมื่อ <เวลา> — กดเพื่อปิด" (10.3); pressing it closes the window without the
     "unsaved changes" question.
   · A change of an account's rights: menus and buttons follow at once (applyPerms, 10.6).
   The name and time are as the history shows them (meName, thDateTime). Which window edits which record was mapped
   in the running app (NOTES.md, task 3.10): the record is read when a change arrives, because several windows can
   switch to another document from inside. Opening a document adds an audit row; that is never "the document". */
(()=>{
 const L=window.storage&&window.storage.live;
 if(!L)return;
 const visible=el=>!!(el&&(el.offsetWidth||el.offsetHeight||el.getClientRects().length));
 const val=f=>{try{return f();}catch(e){return undefined;}};
 /* the windows the tests count as open (tests/support/legacy-app.mjs signature) */
 function openWindows(){
  return [...new Set([...document.querySelectorAll('[id^="m"].on, aside[id^="m"], [role="dialog"], #frDet')])]
   .filter(m=>(m.getAttribute('role')==='dialog'||/^m[A-Z]/.test(m.id)||m.id==='frDet')&&visible(m));
 }
 /* the menu page and its sub-tab */
 const curPage=()=>{const b=document.querySelector('#tabs .navparent.on')||document.querySelector('#tabs button.on');return b?b.dataset.v:'';};
 const PANE={cust:()=>custPane,receipt:()=>rOvPane,buy:()=>buyPane,stock:()=>stkPane,acct:()=>acctPane,hr:()=>hrPane,prox:()=>pxPane,
  techroom:()=>trPane,hq:()=>frHqPane,uiset:()=>{const b=document.querySelector('#uisetTabs button.on');return b?b.dataset.u:'';}};
 const paneOf=v=>PANE[v]?val(PANE[v]):undefined;
 /* pages and sub-tabs that are forms themselves: a redraw would wipe what is being typed */
 const FORMS={setting:true,hr:['warn'],buy:['pay'],acct:['coa'],uiset:['cols','probs','branch'],prox:['shop'],hq:['br','stock'],stock:['hqreq','px']};
 const onForm=()=>{const v=curPage(),f=FORMS[v];return f===true||(Array.isArray(f)&&f.includes(paneOf(v)));};
 const signedIn=()=>document.documentElement.classList.contains('pkg-open');
 const busy=()=>signedIn()&&(openWindows().length>0||onForm());
 L.setBusy(busy);

 /* ---------- who and when (as the history shows them) ---------- */
 function nameOf(by){
  if(by&&by.kind==='emp'){const e=(DB.emp||[]).find(x=>String(x.id)===String(by.ref));if(e)return e.code+' · '+e.name;}
  return 'เจ้าของกิจการ / ผู้ดูแลระบบ';
 }
 const when=at=>typeof thDateTime==='function'?thDateTime(at):String(at||'');

 /* ---------- the windows that edit one saved record: [unit, its key now] … (new: no key) ---------- */
 const byNo=(list,no,f='no')=>no?((list||[]).find(x=>x&&x[f]===no)||{}).id||'':'';
 const title=id=>((document.getElementById(id)||{}).textContent||'');
 const DOCS={
  mQuoteEdit:{keys:()=>[['DB.quotes',Q&&Q.no?Q.id:'']],reopen:k=>openQuoteById(k)},
  mSale:{keys:()=>{const c=PKG_STOCK_CUT.state.cur,l=c&&PKG_SALE.led(c);return [['DB.stockCuts',c?c.id:''],['DB.receipts',l?l.id:'']];},reopen:k=>pkgOpenCut(k)},
  mGREdit:{keys:()=>[['DB.purchases',G&&G.no?G.id:'']],reopen:k=>openGRById(k)},
  mBillingEdit:{keys:()=>[['DB.billings',BN&&BN.no?BN.id:'']],reopen:k=>openBillingById(k)},
  mClaimEdit:{keys:()=>[['DB.claims',C&&C.no?C.id:'']],reopen:k=>openClaimById(k)},
  mIssueEdit:{keys:()=>[['DB.issues',IS&&IS.no?IS.id:'']],reopen:k=>openIssueById(k)},
  mCountEdit:{keys:()=>[['DB.stockCounts',SC&&SC.no?SC.id:'']],reopen:k=>openCountById(k)},
  mCClaim:{keys:()=>{const s=PKG_CUST_CLAIM.state.S;return [['DB.custClaims',s&&s.no?s.id:'']];},reopen:k=>pkgOpenCClaim(k)},
  mMove:{keys:()=>{const c=PKG_BRANCH_TRANSFER.state.cur;return [['DB.transfers',c?c.id:'']];},reopen:k=>pkgOpenMove(k)},
  mReceiptEdit:{keys:()=>[['DB.receipts',R&&R.no?R.id:'']],reopen:k=>openReceiptById(k)},
  mInvoiceEdit:{keys:()=>[['DB.invoices',IV&&IV.no?IV.id:'']],reopen:k=>openInvoiceById(k)},
  mSaleInv:{keys:()=>{const no=(title('sivTitle').match(/\S+-IV\S+/)||[])[0];
   return [['DB.receipts',no?((DB.receipts||[]).find(L=>L.pkgSale&&[L.inv].concat(L.invVoid||[]).some(d=>d&&d.no===no))||{}).id||'':'']];}},
  mSaleRcpt:{keys:()=>{const no=(title('srTitle').match(/\S+-RE\S+/)||[])[0];
   return no?(DB.receipts||[]).filter(L=>(L.payments||[]).some(p=>p.reNo===no)).map(L=>['DB.receipts',L.id]):[];}},
  mSaleAdj:{keys:()=>[['DB.stockCuts',byNo(DB.stockCuts,(title('sjTitle').split(' · ')[1]||'').trim())]],reopen:k=>PKG_SALE_PAY.openAdj(k)},
  mTaxDoc:{keys:()=>{const d=PKG_TAX_WINDOW.state.done;return [['DB.receipts',d?d.rid:'']];},reopen:k=>PKG_TAX_WINDOW.show(k,PKG_TAX_WINDOW.state.done.no)},
  mCredit:{keys:()=>{const m=title('cnTitle').match(/^ใบลดหนี้ (\S+)$/);return [['DB.creditNotes',m?byNo(DB.creditNotes,m[1]):'']];},reopen:k=>pkgOpenCreditNote(k)},
  mPartPay:{keys:()=>{const s=PKG_SETTLE.state(),u=s&&s.mode==='ap'?'DB.purchases':'DB.receipts';
   return s?Object.keys(s.ticks||{}).filter(k=>s.ticks[k]).map(k=>[u,k]):[];},reopen:()=>{PKG_SETTLE.reload();PKG_SETTLE.render();}},
  mBnPay:{keys:()=>[['DB.billings',bnPayId]],reopen:k=>settleBilling(k)},
  mCust:{keys:()=>[['DB.cust',editCustId]],reopen:k=>openCust(k)},
  mVen:{keys:()=>[['DB.vendors',editVenId]],reopen:k=>openVen(k)},
  mStock:{keys:()=>[['DB.stock',editStockId]],reopen:k=>openStock(k)},
  mImg:{keys:()=>[['DB.stock',imgStockId]],reopen:k=>openImgModal(k)},
  mEmp:{keys:()=>[['DB.emp',editEmpId]],reopen:k=>openEmp(k)},
  mExp:{keys:()=>[['DB.expenses',editExpId]],reopen:k=>openExp(k)},
  mAsset:{keys:()=>[['DB.assets',editAssetId]],reopen:k=>openAsset(k)},
  mCap:{keys:()=>[['DB.capital',editCapId]],reopen:k=>openCap(k)},
  mHr:{keys:()=>[['DB.hr',editHrId]],reopen:k=>openHr(k)},
  mCrm:{keys:()=>[['DB.crm',editCrmId]],reopen:k=>openCrm(k)},
  mCrmDone:{keys:()=>[['DB.crm',PKG_CRM_TOOLS.doneState.id]],reopen:k=>PKG_CRM_TOOLS.openDone(k,PKG_CRM_TOOLS.doneState.edit)},
  mPartsKit:{keys:()=>[['DB.partsKits','']],whole:true},
  frDet:{keys:()=>{const m=title('frDetTitle').match(/^ใบขอเบิก (\S+)/);return [['FR.reqs',m?byNo(FR.reqs,m[1]):'']];},close:()=>frDetClose()},
 };
 const HEADER={mPartPay:'#mPartPay > .sheet > header',mPartsKit:'#kit-editor > header',frDet:'#frDet > div > div:first-child'};
 const headerOf=m=>m.querySelector(HEADER[m.id]?HEADER[m.id].replace('#'+m.id+' > ',':scope > '):':scope > .sheet > .panel > header, :scope > .sheet > header');
 function close(m,doc){
  if(doc.close)return doc.close();
  m.classList.remove('on');
 }

 /* ---------- the bar ---------- */
 const BAR='drivegoLiveBar';
 function bar(m,text,onClick){
  let b=m.querySelector('.'+BAR);
  if(!b){
   b=document.createElement('button');b.type='button';b.className=BAR;
   b.style.cssText='display:block;width:calc(100% - 24px);margin:8px 12px;padding:8px 12px;border:1px solid #f59e0b;border-radius:8px;'
    +'background:#fef3c7;color:#78350f;font:inherit;font-weight:600;text-align:left;cursor:pointer';
   const h=headerOf(m);
   if(h&&h.parentNode)h.parentNode.insertBefore(b,h.nextSibling);else m.prepend(b);
  }
  b.textContent=text;b.onclick=onClick;
 }
 const clearBars=m=>m.querySelectorAll('.'+BAR).forEach(b=>b.remove());
 window.addEventListener('drivego:heard',ev=>{
  const d=ev.detail;
  if(!d.by)return;   /* read again whole (rights, too much missed): nobody to name */
  for(const m of openWindows()){
   const doc=DOCS[m.id];if(!doc)continue;
   const keys=(val(doc.keys)||[]).filter(([,k])=>k!=null&&(k!==''||doc.whole)).map(([u,k])=>u+'|'+k);
   if(!keys.length)continue;
   const gone=keys.some(k=>d.removed.includes(k)),edited=keys.some(k=>d.rows.includes(k));
   if(!gone&&!edited)continue;
   const first=keys[0].slice(keys[0].indexOf('|')+1);
   if(gone)
    bar(m,'เอกสารนี้ถูกลบโดย '+nameOf(d.by)+' เมื่อ '+when(d.at)+' — กดเพื่อปิด',async()=>{clearBars(m);close(m,doc);await L.apply();});
   else
    bar(m,'เอกสารนี้ถูกแก้ไขโดย '+nameOf(d.by)+' เมื่อ '+when(d.at)+' — กดเพื่อโหลดข้อมูลล่าสุด',async()=>{
     clearBars(m);await L.apply();
     if(doc.reopen)val(()=>doc.reopen(first));else close(m,doc);
    });
  }
 });

 /* ---------- once nothing is open: the rows go in, the page behind is drawn again where it was ---------- */
 const STOCK={stock:()=>renderStock(),claim:()=>renderClaimList(),issue:()=>renderIssueList(),count:()=>renderCountList(),
  kits:()=>pkgRenderKits(),move:()=>pkgRenderMoves(),cclaim:()=>pkgRenderCClaims()};
 const REDRAW={home:()=>renderHome(),crm:()=>renderCrm(),cust:()=>custGo(custPane),quote:()=>{refreshQuoteRefs();renderQuoteOverview();},
  receipt:()=>rOvGo(rOvPane),vendor:()=>renderVen(),buy:()=>renderBuyPane(),stock:()=>{const f=STOCK[stkPane];if(f)f();},
  acct:()=>renderAcct(),hr:()=>hrPane==='emp'?renderEmp():renderHr(),prox:()=>pxGo(pxPane),techroom:()=>trGo(trPane),hq:()=>frHqGo(frHqPane)};
 let behind=false;   /* rows went in while a window was open (its bar): the page behind is drawn once it closes */
 function redraw(){
  const f=REDRAW[curPage()];if(!f)return;
  const y=window.scrollY;
  val(f);
  if(window.scrollY!==y)window.scrollTo(0,y);
 }
 window.addEventListener('drivego:applied',ev=>{
  const d=ev.detail||{};
  if(d.whole||(d.units||[]).includes('DB.emp'))val(()=>applyPerms());
  if(signedIn()&&!busy())redraw();else behind=true;
 });
 window.addEventListener('drivego:rights',()=>val(()=>applyPerms()));
 setInterval(()=>{
  for(const b of document.querySelectorAll('.'+BAR))if(!visible(b))b.remove();
  if(busy())return;
  if(L.waiting)L.apply();
  else if(behind&&signedIn()){behind=false;redraw();}
 },400);
})();
