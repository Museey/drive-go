/* 07 · โอนสินค้าระหว่างสาขา (MV) — branch.js. A transfer is made in the sending branch (the working branch) and posts
   at once: stock leaves the sender (FIFO, oldest lots first) and arrives in the receiver as lots at the same cost, both
   as movements under the transfer number. Cancelling (sender only, reason required) sends it back: the receiver gives
   the goods up (its transfer lot first) and the sender's original lots are restored. The register lists transfers sent
   from and received by the working branch. Rights: row stkMove (view / add / cancel / print / export). */
(()=>{
 const BR=window.PKG_BRANCH,host=document.getElementById('s-stock');if(!BR||!host)return;
 const $i=id=>document.getElementById(id);
 const L=()=>DB.transfers||(DB.transfers=[]);
 const owner=()=>!curEmp(),may=a=>owner()||can('m.stkMove_'+a);
 const need=a=>typeof pkgPermNeed==='function'?pkgPermNeed('stkMove',a):may(a);
 if(typeof AUD_KIND==='object')AUD_KIND.transfer='ใบโอนสินค้าระหว่างสาขา';
 if(typeof AUD_ACT==='object')AUD_ACT.transfer='โอนสินค้าระหว่างสาขา';
 const name=id=>{const b=BR.get(id);return b?b.code+' · '+b.name:'-';};
 const sumQty=t=>(t.lines||[]).reduce((a,l)=>a+n(l.qty),0),sumCost=t=>(t.lines||[]).reduce((a,l)=>a+n(l.qty)*n(l.cost),0);

 /* ---------- register ---------- */
 const pane=document.createElement('div');pane.id='s-move';pane.className='spane';pane.style.display='none';host.parentElement.append(pane);
 pane.innerHTML=`<div class="panel"><header><h2 class="mht">ทะเบียนโอนสินค้าระหว่างสาขา</h2></header>
  <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);background:#fbfcfc"><button class="btn pri" id="mvNew">+ สร้างใบโอนสินค้า</button><div class="spacer"></div><span class="tag" id="mvCount">0 ใบ</span></div>
  <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);align-items:flex-end">
   <label class="f" style="margin:0"><span>เลือกช่วงวันที่</span><select id="mvDateMode" style="width:150px"><option value="" selected>เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="one">วันที่ระบุ</option><option value="range">ช่วงวันที่</option><option value="month">เดือนปี</option></select></label>
   <input type="date" id="mvDateD1" style="width:135px;display:none"><span id="mvDateD2Wrap" style="display:none;white-space:nowrap"><span class="hint">ถึง</span> <input type="date" id="mvDateD2" style="width:135px"></span>
   <span id="mvDateMonthWrap" style="display:none;white-space:nowrap"><select id="mvDateMonthM" style="width:125px"></select> <select id="mvDateMonthY" style="width:95px"></select></span>
   <label class="f" style="margin:0"><span>ทิศทาง</span><select id="mvDir" style="width:150px"><option value="">ทั้งหมด</option><option value="out">โอนออกจากสาขานี้</option><option value="in">รับโอนเข้าสาขานี้</option></select></label>
   <label class="f" style="margin:0"><span>แสดง</span><select id="mvLimit" style="width:120px"><option value="50">50 รายการ</option><option value="100">100 รายการ</option><option value="500">500 รายการ</option></select></label>
   <span class="hint" id="mvInfo"></span>
   <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto"><button class="btn pri pkg-go" id="mvFind" type="button"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button><input type="text" id="mvSearch" placeholder="ค้นหา เลขที่ / สาขา / สินค้า + Enter" style="width:260px"></div></div>
  <div class="scroll"><table class="tbl" id="mvTbl"><thead><tr><th style="width:170px">เลขที่</th><th class="ctr" style="width:90px">วันที่</th><th>สาขาต้นทาง</th><th>สาขาปลายทาง</th>
   <th class="num" style="width:80px">รายการ</th><th class="num" style="width:100px">จำนวนรวม</th><th class="num sc-cost" style="width:120px">มูลค่าต้นทุน</th><th class="ctr" style="width:120px">สถานะ</th><th style="width:110px">ผู้บันทึก</th></tr></thead><tbody></tbody></table></div>
  <div class="empty" id="mvEmpty" style="display:none">ยังไม่มีใบโอนสินค้าของสาขานี้</div></div>`;
 SORT_DEF.mvTbl={cols:{0:{lbl:'เลขที่',key:t=>String(t.no||'')},1:{lbl:'วันที่',key:t=>String(t.date||'')},2:{lbl:'สาขาต้นทาง',key:t=>name(BR.brOf(t))},3:{lbl:'สาขาปลายทาง',key:t=>name(t.to)},
  4:{lbl:'รายการ',key:t=>(t.lines||[]).length},5:{lbl:'จำนวนรวม',key:sumQty},6:{lbl:'มูลค่าต้นทุน',key:sumCost},7:{lbl:'สถานะ',key:t=>t.cancelled?1:0},8:{lbl:'ผู้บันทึก',key:t=>byShort(t)||''}}};
 MC_CFG.mvTbl={pri:[0,2,3]};
 function render(){
  BR.ensure();const c=BR.ctx(),q=($i('mvSearch').value||'').toLowerCase().trim(),dir=$i('mvDir').value;
  let rows=L().filter(t=>BR.brOf(t)===c||t.to===c).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  if(dir)rows=rows.filter(t=>dir==='out'?BR.brOf(t)===c:t.to===c);
  if(q)rows=rows.filter(t=>[t.no,name(BR.brOf(t)),name(t.to),t.note,...(t.lines||[]).map(l=>l.code+' '+l.name)].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'mvDate');
  $i('mvCount').textContent=rows.length+' ใบ';$i('mvNew').hidden=!may('add');   /* shown with one branch too (user 2026-10-08) — the click explains */
  rows=sortRows('mvTbl',rows);rows=limitRows(rows,'mv');
  $i('mvTbl').tBodies[0].innerHTML=rows.map(t=>`<tr${t.cancelled?' class="cancelrow"':''}><td class="mono"><span class="docno" onclick="pkgOpenMove('${t.id}')">${t.cancelled?'<s>'+esc(t.no)+'</s>':esc(t.no)}</span></td><td class="ctr">${thDate(t.date)}</td>
   <td>${esc(name(BR.brOf(t)))}${BR.brOf(t)===c?' <span class="chip">โอนออก</span>':''}</td><td>${esc(name(t.to))}${t.to===c?' <span class="chip b">รับเข้า</span>':''}</td>
   <td class="num">${(t.lines||[]).length}</td><td class="num">${qf(sumQty(t))}</td><td class="num sc-cost">${money(sumCost(t))}</td>
   <td class="ctr">${t.cancelled?`<span class="stbtn st-red" title="${esc(t.cancelReason||'')}">ยกเลิกแล้ว</span>`:'<span class="stbtn st-green">โอนแล้ว</span>'}</td>${byCell(t)}</tr>`).join('');
  $i('mvEmpty').style.display=rows.length?'none':'block';
  $i('mvEmpty').textContent=BR.list().length<2?'ยังมีสาขาเดียว — เพิ่มสาขาได้ที่เมนู 11.4 สาขา / คลังสินค้า':'ยังไม่มีใบโอนสินค้าของสาขานี้';
  paintSort('mvTbl');mkCards('mvTbl');
 }
 window.pkgRenderMoves=render;
 fillYearSelect('mvDateMonthY');fillMonthSelect('mvDateMonthM');
 $i('mvDateMode').onchange=()=>{toggleDateFilterUI('mvDate');render();};
 ['mvDateD1','mvDateD2','mvDateMonthM','mvDateMonthY','mvDir'].forEach(id=>$i(id).onchange=()=>{LIM_PAGE.mv=1;render();});
 LIM_RENDER.mv=render;$i('mvLimit').onchange=()=>{LIM_PAGE.mv=1;render();};
 $i('mvFind').onclick=render;$i('mvSearch').onkeydown=e=>{if(e.key==='Enter')render();};
 bindSort('mvTbl',render);

 /* ---------- window ---------- */
 const M=document.createElement('div');M.className='modal';M.id='mMove';
 M.innerHTML=`<div class="sheet" style="max-width:1200px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2 id="mvTitle">ใบโอนสินค้าระหว่างสาขา</h2><span class="tag" id="mvState"></span><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" data-m="close">✕</button></header>
  <div class="body" style="padding:14px 18px;display:grid;gap:12px">
   <div class="pkg-sa-g4"><label class="f"><span>เลขที่ใบโอน</span><input type="text" id="mvNo" readonly></label><label class="f"><span>วันที่</span><input type="text" id="mvDate" readonly></label>
    <label class="f"><span>สาขาต้นทาง</span><input type="text" id="mvFrom" readonly></label><label class="f"><span>สาขาปลายทาง <b class="req">*</b></span><select id="mvTo"></select></label></div>
   <label class="f" style="margin:0"><span>หมายเหตุ</span><input type="text" id="mvNote" placeholder="เช่น เติมสต๊อกสาขา / ลูกค้ารอของ"></label>
   <fieldset class="pkg-fs"><legend>รายการสินค้าที่โอน</legend>
    <div class="scroll"><table class="tbl" id="mvItems"><thead><tr><th class="ctr" style="width:44px">#</th><th style="width:150px">รหัสสินค้า</th><th>รายการ</th><th class="num" style="width:120px">จำนวนที่โอน</th><th style="width:70px">หน่วย</th>
     <th class="num" style="width:130px">คงเหลือต้นทาง</th><th class="num" style="width:130px">คงเหลือปลายทาง</th><th class="num sc-cost" style="width:120px">ต้นทุน / หน่วย</th><th class="ctr" style="width:60px">ลบ</th></tr></thead><tbody></tbody></table></div>
    <span id="mvPickInfo" hidden></span></fieldset>
   <div class="pkg-cut-cancelled" id="mvCancelBox" hidden></div>
  </div>
  <footer id="mvFoot" style="display:flex;gap:8px;align-items:center"></footer></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(M);
 const W={S:null,cur:null};
 const doc=()=>W.cur||W.S;
 function paint(){
  const d=doc();if(!d)return;const ro=!!W.cur,from=ro?BR.brOf(d):BR.ctx();
  $i('mvTitle').textContent=ro?'ใบโอนสินค้า '+d.no:'สร้างใบโอนสินค้าระหว่างสาขา';
  $i('mvState').innerHTML=ro?(d.cancelled?'<span class="stbtn st-red">ยกเลิกแล้ว</span>':'<span class="stbtn st-green">โอนแล้ว</span>'):'';
  $i('mvNo').value=ro?d.no:peekDocNo('MV');$i('mvDate').value=ro&&d.createdAt?thDateTime(d.createdAt):thDate(d.date);$i('mvFrom').value=name(from);
  const dests=BR.list().filter(b=>b.id!==from&&(b.active!==false||b.id===d.to));
  $i('mvTo').innerHTML='<option value="">— เลือกสาขาปลายทาง —</option>'+dests.map(b=>`<option value="${esc(b.id)}">${esc(b.code+' · '+b.name)}</option>`).join('');$i('mvTo').value=d.to||'';$i('mvTo').disabled=ro;
  $i('mvNote').value=d.note||'';$i('mvNote').disabled=ro;
  $i('mvItems').tBodies[0].innerHTML=(d.lines||[]).map((l,i)=>{const s=DB.stock.find(x=>x.id===l.stockId),all=s?BR.qtyAll(s):{},short=!ro&&s&&n(l.qty)>n(all[from]);
   return `<tr><td class="ctr">${i+1}</td><td class="mono">${esc(l.code||'')}</td><td>${esc(l.name||'')}</td>
    <td class="num">${ro?qf(l.qty):`<input type="number" class="mvQty" data-i="${i}" value="${n(l.qty)}" min="0" step="1" style="text-align:right">`}</td><td>${esc(l.unit||'')}</td>
    <td class="num" style="${short?'color:var(--danger);font-weight:600':''}">${s?qf(all[from]):'-'}${short?' ⚠':''}</td><td class="num">${s&&d.to?qf(all[d.to]):'-'}</td>
    <td class="num sc-cost">${ro?money(l.cost):'<span class="hint">FIFO ตอนโอน</span>'}</td><td class="ctr">${ro?'':`<button type="button" class="btn sm dgr" data-del="${i}">×</button>`}</td></tr>`;}).join('')
   ||'<tr><td colspan="9" class="empty">ยังไม่มีรายการ — ค้นหาสินค้าด้านบน</td></tr>';
  const cb=$i('mvCancelBox');cb.hidden=!(ro&&d.cancelled);if(ro&&d.cancelled)cb.innerHTML='<b>ยกเลิกแล้ว · สินค้ากลับสาขาต้นทาง</b><br>เหตุผล: '+esc(d.cancelReason||'-')+'<br>โดย '+esc(d.cancelByName||'-')+' · '+(d.cancelAt?thDateTime(d.cancelAt):'');
  $i('mvFoot').innerHTML=ro
   ?(!d.cancelled&&BR.here(d)&&may('cancel')?'<button type="button" class="btn dgr" data-m="cancel">ยกเลิกใบโอน (ส่งสินค้ากลับ)</button>':'')+'<div class="spacer"></div>'+(may('print')?'<button type="button" class="btn gh" data-m="print">พิมพ์ใบโอนสินค้า</button>':'')+'<button type="button" class="btn pri" data-m="close">ปิด</button>'
   :'<span class="hint">บันทึกแล้วสินค้าจะออกจากสาขาต้นทางและเข้าสาขาปลายทางทันที</span><div class="spacer"></div><button type="button" class="btn gh" data-m="close">ปิด</button><button type="button" class="btn pri" data-m="save">บันทึกและโอนสินค้า</button>';
  if(window.PKG_PRODUCT_PICKER&&$i('pkg-move-products')){try{PKG_PRODUCT_PICKER.sync('move');}catch(e){}$i('pkg-move-products').hidden=ro;}
 }
 window.pkgMoveRender=paint;
 function add(s){const S=W.S;if(!S)return;const same=S.lines.find(l=>l.stockId===s.id);if(same)same.qty=n(same.qty)+1;else S.lines.push({stockId:s.id,code:s.code,name:s.name,unit:s.unit||'',qty:1});paint();}
 if(window.PKG_PRODUCT_PICKER&&PKG_PRODUCT_PICKER.register){
  PKG_PRODUCT_PICKER.register('move',{table:'mvItems',info:'mvPickInfo',get:()=>W.cur?null:(W.S?{items:W.S.lines}:null),render:'pkgMoveRender',permission:'sub.stkMove',title:'เลือกสินค้าที่จะโอน',add});
 }
 M.addEventListener('input',e=>{const S=W.S;if(!S)return;if(e.target.classList.contains('mvQty'))S.lines[+e.target.dataset.i].qty=n(e.target.value);if(e.target.id==='mvNote')S.note=e.target.value;});
 M.addEventListener('change',e=>{const S=W.S;if(!S)return;if(e.target.id==='mvTo'){S.to=e.target.value;paint();}if(e.target.classList.contains('mvQty'))paint();});
 M.addEventListener('click',async e=>{
  const del=e.target.closest('[data-del]');if(del&&W.S){W.S.lines.splice(+del.dataset.del,1);return paint();}
  const a=e.target.closest('[data-m]')?.dataset.m;if(!a)return;
  if(a==='close')return closeModal('mMove');
  if(a==='save')return saveMove();
  if(a==='cancel'&&W.cur)return cancelMove(W.cur.id);
  if(a==='print'&&W.cur){if(!need('print'))return;logAudit('transfer',W.cur,'print');save();printDocs(sheet(W.cur));}
 });
 function openNew(){BR.ensure();if(!need('add'))return;if(BR.list().filter(b=>b.active!==false).length<2)return toast('ตอนนี้มีสาขาเดียว — ต้องมีอย่างน้อย 2 สาขาจึงจะโอนสินค้าได้ · เพิ่มสาขาได้ที่ 11.4 สาขา / คลังสินค้า');W.cur=null;W.S={date:iso(),to:'',note:'',lines:[]};paint();openModal('mMove');}
 function openMove(id){const t=L().find(x=>x.id===id);if(!t)return;if(!may('view'))return toast('บัญชีนี้ไม่มีสิทธิ์เปิดใบโอนสินค้า');W.S=null;W.cur=t;paint();openModal('mMove');}
 window.pkgOpenMove=openMove;$i('mvNew').onclick=openNew;
 /* ---------- post / cancel ---------- */
 async function saveMove(){
  const S=W.S;if(!S||!need('add'))return;const from=BR.ctx(),to=BR.get(S.to);
  const lines=S.lines.filter(l=>n(l.qty)>0&&DB.stock.some(s=>s.id===l.stockId));
  if(!to||to.id===from)return toast('เลือกสาขาปลายทาง');
  if(!lines.length)return toast('เพิ่มรายการสินค้าและจำนวนที่จะโอนก่อน');
  const short=lines.filter(l=>{const s=DB.stock.find(x=>x.id===l.stockId);return n(l.qty)>n(s.qty);});
  if(short.length)return toast('สินค้า '+short.length+' รายการมีไม่พอในสาขาต้นทาง ('+short.slice(0,3).map(l=>l.code).join(', ')+') — โอนเกินยอดคงเหลือไม่ได้');
  if(!await askP({title:'ยืนยันโอนสินค้า',text:'โอนสินค้า '+lines.length+' รายการ จาก '+name(from)+' ไป '+name(to.id)+'\n\nสต๊อกทั้งสองสาขาจะเปลี่ยนทันที ยืนยันหรือไม่?',yes:'โอนสินค้า',no:'ยังไม่โอน'}))return;
  const t={id:uid(),no:docNo('MV'),date:iso(),to:to.id,note:(S.note||'').trim(),lines:lines.map(l=>({stockId:l.stockId,code:l.code,name:l.name,unit:l.unit,qty:n(l.qty),cost:0})),cancelled:false};
  stampRec(t,null);
  t.lines.forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);s.qty=n(s.qty)-l.qty;s.lastMove=iso();logMove(s.id,'out',-l.qty,iso(),'โอนออกไปสาขา '+to.code+' · ใบโอน '+t.no,t.no);});
  const al=(DB.fifo&&DB.fifo.allocs)||[];
  t.lines.forEach(l=>{const mine=al.filter(a=>a.refNo===t.no&&a.stockId===l.stockId),q=mine.reduce((x,a)=>x+n(a.qty),0),s=DB.stock.find(x=>x.id===l.stockId);l.cost=q>0?mine.reduce((x,a)=>x+n(a.qty)*n(a.cost),0)/q:n(s.cost);});
  const fromCode=BR.cur().code;
  BR.within(to.id,()=>t.lines.forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);s.qty=n(s.qty)+l.qty;s.lastMove=iso();logMove(s.id,'in',l.qty,iso(),'รับโอนจากสาขา '+fromCode+' · ใบโอน '+t.no,t.no,'',l.cost);}));
  L().push(t);logAudit('transfer',t,'transfer','โอน '+t.lines.length+' รายการ ไป '+name(to.id));save();
  W.S=null;W.cur=t;paint();render();if(typeof renderStock==='function')try{renderStock();}catch(e){}
  toast('โอนสินค้าแล้ว · ใบโอน '+t.no);
 }
 async function cancelMove(id){
  const t=L().find(x=>x.id===id);if(!t||t.cancelled)return false;
  if(!BR.here(t)){toast('ยกเลิกใบโอนได้จากสาขาต้นทาง ('+name(BR.brOf(t))+') เท่านั้น');return false;}
  if(!need('cancel'))return false;
  if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk(t))return false;   /* per-employee cancel period (perm-matrix.js), owner always may — user 11 ต.ค. 2569 */
  const reason=await askPromptP({title:'ยกเลิกใบโอน '+t.no,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\nสินค้าทุกรายการจะถูกส่งกลับสาขาต้นทาง',yes:'ยกเลิกและส่งกลับ',no:'ไม่ยกเลิก'});
  if(reason===null)return false;if(!String(reason).trim()){toast('ต้องระบุเหตุผลที่ยกเลิก');return false;}
  const to=BR.get(t.to),lack=BR.within(t.to,()=>t.lines.filter(l=>{const s=DB.stock.find(x=>x.id===l.stockId);return s&&n(s.qty)<n(l.qty);}).length);
  if(lack&&window.PKG_STOCK_FIFO&&!PKG_STOCK_FIFO.negOk(lack))return false;   /* DriveGo new system (task 3.6, R9-ข) */
  if(lack&&!await askP({title:'สาขาปลายทางมีของไม่พอ',text:'สินค้า '+lack+' รายการในสาขาปลายทางถูกใช้ไปแล้วบางส่วน\nยกเลิกต่อไปสต๊อกสาขาปลายทางจะติดลบ ยืนยันหรือไม่?',yes:'ยืนยันยกเลิก',no:'ไม่ยกเลิก'}))return false;
  BR.within(t.to,()=>t.lines.forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);if(!s)return;s.qty=n(s.qty)-l.qty;s.lastMove=iso();logMove(s.id,'out',-l.qty,iso(),'ยกเลิกใบโอน '+t.no+' · ส่งคืนสาขาต้นทาง',t.no);}));
  t.lines.forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);if(!s)return;s.qty=n(s.qty)+l.qty;s.lastMove=iso();logMove(s.id,'in',l.qty,iso(),'ยกเลิกใบโอน '+t.no+' · รับคืนจากสาขา '+(to?to.code:''),t.no,'',l.cost);});
  Object.assign(t,{cancelled:true,cancelReason:String(reason).trim(),cancelDate:iso(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});
  logAudit('transfer',t,'del','ยกเลิกใบโอน — '+t.cancelReason);save();paint();render();if(typeof renderStock==='function')try{renderStock();}catch(e){}
  toast('ยกเลิกใบโอน '+t.no+' แล้ว · สินค้ากลับสาขาต้นทาง');return true;
 }
 function sheet(t){
  return sheetTop({title:'ใบโอนสินค้าระหว่างสาขา',en:'STOCK TRANSFER',copy:'ต้นฉบับ',stamp:t.cancelled?'ยกเลิกแล้ว':'',fields:[['เลขที่',esc(t.no)],['วันที่',thDate(t.date)],['สาขาต้นทาง',esc(name(BR.brOf(t)))],['สาขาปลายทาง',esc(name(t.to))]]})
   +`<table style="margin-top:8px"><thead><tr><th style="width:34px">#</th><th style="width:130px">รหัสสินค้า</th><th>รายการ</th><th style="width:90px">จำนวน</th><th style="width:70px">หน่วย</th></tr></thead><tbody>
   ${t.lines.map((l,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(l.code)}</td><td>${esc(l.name)}</td><td style="text-align:right">${qf(l.qty)}</td><td>${esc(l.unit||'')}</td></tr>`).join('')}</tbody></table>
   ${t.note?'<div class="box" style="padding:4px 6px;margin-top:6px"><span class="lbl">หมายเหตุ</span> '+esc(t.note)+'</div>':''}
   <table style="margin-top:28px"><tr><td style="width:33%;text-align:center;border:0">.................................<br>ผู้โอน (${esc(byShort(t)||'')})</td><td style="width:33%;text-align:center;border:0">.................................<br>ผู้ขนส่ง</td><td style="text-align:center;border:0">.................................<br>ผู้รับ (สาขาปลายทาง)</td></tr></table></div>`;
 }
 window.pkgMovePaint=paint;   /* branch-window.js repaints after the sending branch changes */
 window.PKG_BRANCH_TRANSFER={list:L,render,openNew,open:openMove,save:saveMove,cancel:cancelMove,state:W,sheet};
})();
