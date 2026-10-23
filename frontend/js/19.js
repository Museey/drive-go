/* สาขา / คลังสินค้า (user 2026-10-03/04, WAREHOUSE-PLAN.md; idea from the reference ERP: warehouse = branch).
   · DB.branches [{id,code (2–3 chars, locked once saved),name,addr,keeper,tel,active,bill,main}] — the main branch is
     made from the existing data (code MA).  DB.curBranch = the branch this session works in ("working branch").
   · Every document belongs to the branch it was first saved in (doc.br; none = main). A new document always goes to the
     working branch; opening a document of another branch switches the working branch to it (if the account may).
   · Document numbers: <branch code>-<2-letter type><YY><MM><6-digit running number>, e.g. MA-SA2610000011 — running
     per branch × type × month (DB.seq[base]). Old numbers (QO.69-10-03-01 …) are converted once, everywhere they appear.
   · Stock quantity is per branch: the stock record carries the working branch's qty / min / max / zone / shelf / loc /
     lastMove inline (so every original function keeps working); the other branches' values wait in s.bq[branchId] and
     are swapped in when the working branch changes (DB.stockCtx = whose values are inline). Moves and FIFO lots are
     tagged with the branch (fifo-cost.js reads the working branch only).
   · Customers, vendors, staff, prices, kits are shared. Staff: emp.branches (ids they may work in; none = main only)
     and emp.branchHome. The owner sees every branch. A new branch is visible to nobody else until granted. */
(()=>{
 if(typeof docNoBase!=='function'||typeof stampRec!=='function')return;
 const MAIN='main';
 const TYPE={QO:'QT',RE:'RE',RT:'TX',IV:'IV',BN:'BL',GR:'RC',CL:'CL',IS:'WD',SC:'CT',SA:'SA',CS:'SA',EX:'EX',FA:'FA',WN:'WN',MV:'MV'};
 const $i=id=>document.getElementById(id);
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const list=()=>Array.isArray(DB.branches)?DB.branches:[];
 const ctx=()=>(DB&&DB.curBranch)||MAIN;
 const get=id=>list().find(b=>b.id===id)||null;
 const cur=()=>get(ctx())||list()[0]||{id:MAIN,code:'MA',name:'สาขาหลัก'};
 const label=id=>{const b=get(id||ctx());return b?b.code+' · '+b.name:'';};
 const brOf=d=>(d&&d.br)||MAIN;
 const here=d=>brOf(d)===ctx();
 const access=id=>{const e=curEmp();if(!e)return true;const a=Array.isArray(e.branches)&&e.branches.length?e.branches:[MAIN];return a.includes(id);};
 const accessible=()=>list().filter(b=>b.active!==false&&access(b.id));
 /* running number: 5 digits (user 2026-10-09: up to 99,999 of one kind a month per branch — room to spare, never to be changed again).
    It comes from the DB.seq counter, never from the length of older numbers, so documents already numbered with 6 digits
    keep their numbers and the count carries on; past 99,999 it simply grows to 6 digits (still unique). */
 const SEQ_DIGITS=5,pad6=i=>String(i).padStart(SEQ_DIGITS,'0');

 /* ---------- stock per branch ---------- */
 const SF=['qty','min','max','zone','shelf','loc','lastMove'];
 const zero=()=>({qty:0,min:0,max:0,zone:'',shelf:'',loc:'',lastMove:''});
 function swapStock(to){
  const from=DB.stockCtx||MAIN;if(from===to)return;
  (DB.stock||[]).forEach(s=>{const bq=s.bq||(s.bq={}),keep={};SF.forEach(k=>keep[k]=s[k]==null?(k==='qty'||k==='min'||k==='max'?0:''):s[k]);bq[from]=keep;
   const t=bq[to]||zero();SF.forEach(k=>s[k]=t[k]);delete bq[to];});
  DB.stockCtx=to;
 }
 /* quantity of one item in every branch: {branchId: qty} */
 const qtyAll=s=>Object.fromEntries(list().map(b=>[b.id,b.id===(DB.stockCtx||MAIN)?n(s.qty):n(s.bq&&s.bq[b.id]&&s.bq[b.id].qty)]));
 /* run fn with another branch's stock inline (transfers); no screen refresh */
 function within(id,fn){const prev=ctx();if(prev===id)return fn();swapStock(id);DB.curBranch=id;try{return fn();}finally{swapStock(prev);DB.curBranch=prev;}}

 /* ---------- numbers ---------- */
 /* DriveGo new system (task 3.2, decision R1-ข): in a franchise chain each branch's own data numbers with the chain's
    branch code (B001-SA2610…) and HQ's own data with HQ; the legacy app numbered every branch's data MA-…, so two
    branches issued the same numbers. Other internal branches of a data set keep their own code. */
 const numCode=()=>{const c=cur();if(c.id!==MAIN||typeof FR==='undefined'||!FR||!FR.enabled)return c.code;
  if(typeof HQKEY!=='undefined'&&KEY===HQKEY)return 'HQ';const b=(FR.branches||[]).find(x=>brKey(x)===KEY);return (b&&b.code)||c.code;};
 window.docNoBase=function(prefix){const d=new Date();return numCode()+'-'+(TYPE[prefix]||String(prefix).slice(0,2))+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0');};
 window.nextDocNo=function(prefix){ensure();const base=docNoBase(prefix);DB.seq=DB.seq||{};let i=(DB.seq[base]||0)+1;while(docNoTaken(base+pad6(i)))i++;return {base,i,no:base+pad6(i)};};
 const takenO=docNoTaken;docNoTaken=function(no){return takenO.apply(this,arguments)||(DB.transfers||[]).some(x=>x.no===no);};
 /* old numbers → new format, everywhere they are written (documents, references, moves, FIFO, audit, notes) */
 const OLD=/\b([A-Z]{2})\.(\d\d)-(\d\d)-(\d\d)-(\d+)\b/g;
 function walk(o,fn){
  if(Array.isArray(o)){for(let i=0;i<o.length;i++){const v=o[i];if(typeof v==='string'){const r=fn(v);if(r!==v)o[i]=r;}else if(v&&typeof v==='object')walk(v,fn);}return;}
  for(const k in o){const v=o[k];if(typeof v==='string'){const r=fn(v);if(r!==v)o[k]=r;}else if(v&&typeof v==='object')walk(v,fn);}
 }
 function convert(){
  const found=new Map();
  walk(DB,s=>{if(s.length<3000&&s.indexOf('.')>0)for(const m of s.matchAll(OLD))if(!found.has(m[0]))found.set(m[0],{old:m[0],t:TYPE[m[1]]||m[1],p:m[1],yy:(+m[2]+57)%100,mm:m[3],dd:m[4],q:+m[5]});return s;});
  if(!found.size)return 0;
  const code=(get(MAIN)||cur()).code,groups={},map=new Map();
  [...found.values()].forEach(x=>{const base=code+'-'+x.t+String(x.yy).padStart(2,'0')+x.mm;(groups[base]=groups[base]||[]).push(x);});
  DB.seq=DB.seq||{};
  Object.entries(groups).forEach(([base,arr])=>{arr.sort((a,b)=>a.dd.localeCompare(b.dd)||a.p.localeCompare(b.p)||a.q-b.q).forEach((x,i)=>map.set(x.old,base+pad6(i+1)));DB.seq[base]=Math.max(DB.seq[base]||0,arr.length);});
  walk(DB,s=>s.length<3000&&s.indexOf('.')>0?s.replace(OLD,m=>map.get(m)||m):s);
  return map.size;
 }

 /* ---------- start-up / data reload ---------- */
 let busy=false;
 function ensure(){
  if(busy||typeof DB!=='object'||!DB||!Array.isArray(DB.stock))return;
  if(DB.branchV===1&&DB.docNoV===2&&(DB.stockCtx||MAIN)===ctx())return;
  busy=true;
  try{
   if(!list().length)DB.branches=[{id:MAIN,code:'MA',name:'สาขาหลัก',addr:'',keeper:'',tel:'',active:true,bill:true,main:true}];
   if(!get(DB.curBranch))DB.curBranch=MAIN;
   if(!DB.stockCtx)DB.stockCtx=MAIN;
   if(DB.stockCtx!==DB.curBranch)swapStock(DB.curBranch);
   DB.branchV=1;
   if(DB.docNoV!==2){
    if(window.PKG_STOCK_CUT)try{PKG_STOCK_CUT.ensure();}catch(e){}   /* its records get old-style numbers first, then everything converts together */
    const k=convert();DB.docNoV=2;
    if(k&&typeof logAudit==='function')logAudit('emp',{no:'ระบบ'},'save','แปลงเลขที่เอกสารเป็นรูปแบบใหม่ '+k+' เลขที่ (รหัสสาขา-ประเภท-ปีเดือน-เลขรัน)');
    if(typeof save==='function')save();
   }
  }finally{busy=false;}
 }

 /* ---------- documents belong to a branch ---------- */
 const stampO=stampRec;
 /* first save = the working branch (a copy carries its source's branch until then); later saves keep it */
 stampRec=function(rec,old){const out=stampO.apply(this,arguments);if(rec&&typeof rec==='object')rec.br=old?(old.br||rec.br||MAIN):ctx();return out;};
 const mvO=logMove;
 logMove=function(){const k=(DB.moves||[]).length,out=mvO.apply(this,arguments);for(let i=k;i<(DB.moves||[]).length;i++)if(!DB.moves[i].br)DB.moves[i].br=ctx();return out;};

 function refresh(){paint();const v=document.querySelector('section.view.on');if(v&&typeof go==='function')try{go(v.id.slice(2));}catch(e){}}
 function switchTo(id,opt){
  ensure();opt=opt||{};
  if(id===ctx())return true;
  const b=get(id);if(!b)return false;
  if(!access(id)){toast('บัญชีนี้ไม่มีสิทธิ์เข้าสาขา '+b.code+' · '+b.name);return false;}
  if(b.active===false&&!opt.force){toast('สาขา '+b.code+' ปิดใช้งานอยู่');return false;}
  swapStock(id);DB.curBranch=id;save();refresh();
  if(!opt.quiet)toast('กำลังทำงานที่สาขา '+b.code+' · '+b.name);
  return true;
 }
 /* opening a document of another branch works in that branch */
 [['openQuoteById',id=>findQuote(id)],['openReceiptById',id=>DB.receipts.find(x=>x.id===id)],['openInvoiceById',id=>DB.invoices.find(x=>x.id===id)],
  ['openBillingById',id=>(DB.billings||[]).find(x=>x.id===id)],['openGRById',id=>DB.purchases.find(x=>x.id===id)],['openClaimById',id=>(DB.claims||[]).find(x=>x.id===id)],
  ['openIssueById',id=>(DB.issues||[]).find(x=>x.id===id)],['openCountById',id=>(DB.stockCounts||[]).find(x=>x.id===id)],['pkgOpenCut',id=>(DB.stockCuts||[]).find(x=>x.id===id)]
 ].forEach(([name,find])=>{const o=window[name];if(typeof o!=='function')return;
  window[name]=function(id){ensure();const d=find(id);if(d&&!here(d)){const b=get(brOf(d));if(!switchTo(brOf(d),{quiet:true,force:true}))return;toast('เอกสารนี้เป็นของสาขา '+(b?b.code+' · '+b.name:'')+' — สลับสาขาให้แล้ว');}return o.apply(this,arguments);};});
 /* a quote is billed / cut only in its own branch */
 if(typeof readyQuoteInline==='function'){const ro=readyQuoteInline;
  readyQuoteInline=async function(q){if(q&&q.no&&!here(q)){toast('ใบเสนอราคา '+q.no+' เป็นของสาขา '+label(brOf(q))+' — สลับไปสาขานั้นก่อน');return false;}return ro.apply(this,arguments);};}
 /* a branch that may not issue receipts */
 if(typeof saveReceipt==='function'){const so=saveReceipt;
  saveReceipt=async function(){let r=null;try{r=(0,eval)('R');}catch(e){}if(r&&!r.no&&cur().bill===false)return toast('สาขา '+label()+' ไม่ได้เปิดให้ออกใบเสร็จ / ใบกำกับภาษี (ตั้งค่าที่ สาขา / คลังสินค้า)');return so.apply(this,arguments);};}

 /* ---------- copy to another branch: 03 quotes and 06.1 goods received (user) ---------- */
 function askBranch(title){
  return new Promise(res=>{const bs=accessible();if(bs.length<2)return res(ctx());
   askConfirm({title,msg:'<label class="f" style="margin:0"><span>คัดลอกไปที่สาขา / คลัง</span><select id="pkgBrPick">'+bs.map(b=>`<option value="${esc2(b.id)}"${b.id===ctx()?' selected':''}>${esc2(b.code+' · '+b.name)}${b.id===ctx()?' (สาขานี้)':''}</option>`).join('')+'</select></label><p class="hint" style="margin:8px 0 0">ใบใหม่เป็นร่าง ใช้เลขที่ของสาขาที่เลือก · ไม่มีผลกับสต๊อกจนกว่าจะอนุมัติ / รับเข้าตามขั้นตอนปกติ</p>',
    yes:'ถัดไป',no:'ยกเลิก',onYes:()=>res(($i('pkgBrPick')||{}).value||ctx()),onNo:()=>res(null)});});
 }
 ['copyQuote','copyGR'].forEach(name=>{const o=window[name];if(typeof o!=='function')return;
  window[name]=function(...a){
   if(accessible().length<2)return o.apply(this,a);
   let src=null;try{src=name==='copyQuote'?(0,eval)('Q'):null;}catch(e){}
   if(name==='copyQuote'&&(!src||!src.no))return o.apply(this,a);
   askBranch(name==='copyQuote'?'คัดลอกใบเสนอราคา':'คัดลอกใบรับสินค้า').then(id=>{
    if(!id)return;const keep=name==='copyQuote'?JSON.parse(JSON.stringify(src)):null;
    if(id!==ctx()&&!switchTo(id,{quiet:true}))return;
    if(keep){Q=keep;}   /* the switch redraws the page; the copy still starts from the same quote */
    const out=o.apply(this,a);
    return out;});
  };});

 /* ---------- working-branch switcher (top bar) ---------- */
 const sw=document.createElement('label');sw.id='pkg-branch';sw.hidden=true;sw.title='สาขา / คลังที่กำลังทำงาน — เอกสารใหม่และยอดสต๊อกเป็นของสาขานี้';
 sw.innerHTML='<span>สาขา</span><select id="pkgBranchSel" aria-label="สาขาที่กำลังทำงาน"></select>';
 ($i('pkg-header-actions')||document.body).prepend(sw);
 function paint(){
  if(typeof DB!=='object'||!DB)return;const bs=accessible(),sel=$i('pkgBranchSel');
  sw.hidden=false;   /* shown with one branch too (user 2026-10-06) */
  sel.innerHTML=bs.map(b=>`<option value="${esc2(b.id)}">${esc2(b.code+' · '+b.name)}</option>`).join('');sel.value=ctx();sel.disabled=bs.length<2;
  document.documentElement.dataset.pkgBranches=String(list().length);
 }
 $i('pkgBranchSel').addEventListener('change',e=>{if(!switchTo(e.target.value))paint();});
 /* an account lands in a branch it may use */
 const apO=applyPerms;
 applyPerms=function(){const r=apO.apply(this,arguments);try{ensure();if(!access(ctx())||(cur().active===false)){const e=curEmp(),first=(e&&e.branchHome&&access(e.branchHome)&&get(e.branchHome))||accessible()[0];if(first&&first.id!==ctx()){swapStock(first.id);DB.curBranch=first.id;}}paint();}catch(x){}return r;};
 const goO=go;go=function(){ensure();return goO.apply(this,arguments);};

 /* ---------- settings: menu 11.4 ---------- */
 const may=()=>!curEmp()||can('doc.orgEdit');
 let edit='';
 /* the settings window is built by a later module: attach once the page is parsed */
 const whenReady=fn=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,0));else setTimeout(fn,0);};
 whenReady(()=>{
  /* its own page in menu 11 (user 2026-10-04: a sub-page of 11 for now; final place decided later) */
  if(!window.PKG_UISET)return;
  const page=document.createElement('div');
  page.innerHTML='<div class="panel"><header><h2>11.4 · สาขา / คลังสินค้า</h2></header><div class="body pkg-sset" id="pkgSsetBranch"></div></div>';
  const body=page.querySelector('#pkgSsetBranch');
  const docsOf=id=>['quotes','receipts','invoices','billings','purchases','claims','issues','stockCounts','stockCuts','transfers'].reduce((k,a)=>k+(DB[a]||[]).filter(d=>brOf(d)===id).length,0);
  const draw=()=>{
   ensure();const b=edit?get(edit):null,ok=may();
   body.innerHTML=`<p class="hint">สาขา = คลังสินค้า 1 แห่ง · รหัสสาขาใช้นำหน้าเลขที่เอกสารทั้งหมด (เช่น ${esc2(cur().code)}-SA2610000001) จึงควรสั้น 2–3 ตัวอักษร และ<b>บันทึกแล้วแก้ไขไม่ได้</b> · สาขาใหม่ยังไม่มีพนักงานคนใดเข้าได้ จนกว่าจะให้สิทธิ์ที่ 10 ข้อมูลพนักงาน (เจ้าของกิจการเข้าได้ทุกสาขา)</p>
   <div class="pkg-sset-form"><div class="pkg-sa-g4">
    <label class="f"><span>รหัสสาขา <b class="req">*</b></span><input type="text" id="brCode" maxlength="3" placeholder="เช่น B2" value="${esc2(b?b.code:'')}" ${b?'disabled':''} style="text-transform:uppercase"></label>
    <label class="f"><span>ชื่อสาขา / คลัง <b class="req">*</b></span><input type="text" id="brName" value="${esc2(b?b.name:'')}" placeholder="เช่น สาขาบางนา"></label>
    <label class="f"><span>ผู้ดูแล</span><input type="text" id="brKeeper" value="${esc2(b?b.keeper:'')}"></label>
    <label class="f"><span>โทรศัพท์</span><input type="text" id="brTel" value="${esc2(b?b.tel:'')}"></label></div>
    <div class="pkg-sa-g4" style="margin-top:8px"><label class="f" style="grid-column:span 2"><span>ที่อยู่</span><input type="text" id="brAddr" value="${esc2(b?b.addr:'')}"></label>
    <label class="f"><span>สถานะ</span><select id="brActive" ${b&&b.main?'disabled':''}><option value="1">ใช้งาน</option><option value="0"${b&&b.active===false?' selected':''}>ไม่ใช้งาน</option></select></label>
    <label class="f"><span>ออกใบเสร็จ / ใบกำกับภาษี</span><select id="brBill"><option value="1">ออกได้</option><option value="0"${b&&b.bill===false?' selected':''}>ไม่ให้ออก</option></select></label></div>
    <div class="pkg-sset-btns" style="margin-top:10px"><button type="button" class="btn pri pkg-btn-new" data-b="new">+ สร้างข้อมูลใหม่</button><span class="hint">${b?'กำลังแก้ไข “'+esc2(b.code+' · '+b.name)+'”':''}</span><button type="button" class="btn pri pkg-btn-save" data-b="save" ${ok?'':'disabled title="ต้องมีสิทธิ์แก้ไขข้อมูลกิจการ"'}>บันทึก</button></div></div>
   <table class="tbl pkg-sset-tbl" style="margin-top:12px"><thead><tr><th class="ctr" style="width:70px">ลำดับ</th><th class="ctr" style="width:90px">รหัสสาขา</th><th>ชื่อสาขา / คลัง</th><th style="width:150px">ผู้ดูแล</th><th style="width:130px">โทรศัพท์</th><th class="ctr" style="width:110px">เอกสาร</th><th class="ctr" style="width:130px">ออกใบเสร็จ</th><th class="ctr" style="width:110px">สถานะ</th></tr></thead><tbody>
   ${list().map((x,i)=>`<tr><td class="ctr">${i+1}</td><td class="ctr mono"><b>${esc2(x.code)}</b></td><td><a href="#" class="pkg-sset-edit" data-bedit="${esc2(x.id)}">${esc2(x.name)}</a>${x.main?' <span class="chip">สาขาหลัก</span>':''}${x.id===ctx()?' <span class="chip b">กำลังทำงาน</span>':''}${x.addr?'<div class="hint">'+esc2(x.addr)+'</div>':''}</td>
    <td>${esc2(x.keeper||'-')}</td><td>${esc2(x.tel||'-')}</td><td class="ctr">${docsOf(x.id)||'-'}</td><td class="ctr">${x.bill===false?'<span class="chip">ไม่ให้ออก</span>':'<span class="chip g">ออกได้</span>'}</td>
    <td class="ctr">${x.active===false?'<span class="chip r">ไม่ใช้งาน</span>':'<span class="chip g">ใช้งาน</span>'}</td></tr>`).join('')}</tbody></table>
   <div class="hint pkg-sset-foot">แสดงอยู่ 1 ถึง ${list().length} จาก ${list().length} รายการ</div>`;
  };
  PKG_UISET.addSub({key:'branch',label:'11.4 สาขา / คลังสินค้า',allowed:()=>may(),el:page,show:()=>{edit='';draw();}});
  body.addEventListener('click',e=>{
   const ed=e.target.closest('[data-bedit]');if(ed){e.preventDefault();edit=ed.dataset.bedit;return draw();}
   const a=e.target.closest('[data-b]')?.dataset.b;if(!a)return;
   if(a==='new'){edit='';return draw();}
   if(!may())return toast('บัญชีนี้ไม่มีสิทธิ์ตั้งค่าสาขา');
   const name=$i('brName').value.trim(),code=$i('brCode').value.trim().toUpperCase();
   if(!name)return toast('กรอกชื่อสาขา / คลังก่อนบันทึก');
   const f={name,keeper:$i('brKeeper').value.trim(),tel:$i('brTel').value.trim(),addr:$i('brAddr').value.trim(),active:$i('brActive').value!=='0',bill:$i('brBill').value!=='0'};
   if(edit){const b=get(edit);if(!b)return;if(b.main)f.active=true;
    if(!f.active&&b.id===ctx())return toast('ปิดสาขาที่กำลังทำงานอยู่ไม่ได้ — สลับไปสาขาอื่นก่อน');
    Object.assign(b,f);logAudit('emp',{no:b.code},'save','แก้ไขสาขา '+b.code+' · '+b.name);}
   else{
    if(!/^[A-Z0-9]{2,3}$/.test(code))return toast('รหัสสาขาต้องเป็นตัวอักษรอังกฤษ / ตัวเลข 2–3 ตัว');
    if(list().some(x=>x.code===code))return toast('มีรหัสสาขา '+code+' อยู่แล้ว');
    const b=Object.assign({id:uid(),code,main:false},f);DB.branches.push(b);logAudit('emp',{no:code},'save','เพิ่มสาขา '+code+' · '+name);
    toast('เพิ่มสาขา '+code+' แล้ว — ให้สิทธิ์พนักงานที่ 09 งานบุคคล › ข้อมูลพนักงาน');}
   edit='';save();draw();paint();
  });
 });

 /* ---------- staff: which branches ---------- */
 const anchor=$i('pkg-perm-special')||$i('pkg-perm-matrix');
 if(anchor&&typeof openEmp==='function'){
  const box=document.createElement('div');box.className='permbox';box.id='pkg-perm-branch';
  anchor.after(box);
  const fill=id=>{
   ensure();const e=id?DB.emp.find(x=>x.id===id):null,a=e&&Array.isArray(e.branches)&&e.branches.length?e.branches:[MAIN],home=(e&&e.branchHome)||a[0];
   box.hidden=false;
   box.innerHTML='<h4>สาขา / คลังที่เข้าถึงได้</h4><p class="hint" style="margin:0 0 8px">ติ๊กสาขาที่พนักงานคนนี้ทำงานได้ · เห็นเอกสารและยอดสต๊อกเฉพาะสาขาที่ติ๊ก · สาขาประจำ = คลังเริ่มต้น ทุกครั้งที่เข้าระบบและสร้างเอกสารใหม่ (เปลี่ยนคลังได้ในหน้าต่างเอกสาร)</p><div class="pkg-br-list">'
    +list().map(b=>`<label><input type="checkbox" data-br="${esc2(b.id)}" ${a.includes(b.id)?'checked':''}> ${esc2(b.code+' · '+b.name)}${b.active===false?' (ไม่ใช้งาน)':''}</label>`).join('')
    +'</div><label class="f" style="margin:10px 0 0;max-width:320px"><span>สาขาประจำ</span><select id="pkgBrHome">'+list().map(b=>`<option value="${esc2(b.id)}"${b.id===home?' selected':''}>${esc2(b.code+' · '+b.name)}</option>`).join('')+'</select></label>';
  };
  const oe=openEmp;openEmp=function(id){const r=oe.apply(this,arguments);fill(id);return r;};
  const se=saveEmp;
  saveEmp=function(){
   const id=(()=>{try{return (0,eval)('editEmpId');}catch(e){return null;}})(),before=new Set(DB.emp.map(e=>e.id));
   const picks=[...box.querySelectorAll('input[data-br]:checked')].map(i=>i.dataset.br),home=($i('pkgBrHome')||{}).value,old=id?DB.emp.find(e=>e.id===id):null,was=old?{b:old.branches,h:old.branchHome}:null;
   const out=se.apply(this,arguments);
   const rec=id?DB.emp.find(e=>e.id===id):DB.emp.find(e=>!before.has(e.id));
   if(rec&&rec!==old){   /* saved (the form builds a new record) */
    if(list().length<2&&was){rec.branches=was.b;rec.branchHome=was.h;}
    else{rec.branches=picks.length?picks:[MAIN];rec.branchHome=rec.branches.includes(home)?home:rec.branches[0];}
    save();applyPerms();}
   return out;
  };
 }
 Promise.resolve(window.PKG_FR_BOOT).then(()=>{try{ensure();paint();}catch(e){}});
 window.PKG_BRANCH={MAIN,TYPE,list,ctx,cur,get,label,brOf,here,access,accessible,ensure,switchTo,within,qtyAll,swapStock,convert,paint,askBranch};
})();
