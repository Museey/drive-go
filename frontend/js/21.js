/* 07 · เคลมสินค้าลูกค้า (user 2026-10-07: "ทำเพิ่มขึ้นมาเลย โดยอ้างอิงจากหมวดย่อยเคลมสินค้าเดิม และใส่ไว้ในหมวด 07").
   A customer brings back a part bought from us (ใบรับเคลมสินค้า, number CC). Built like the vendor-claim page, with the
   safe rules from CLAIM-FOLLOWUP.md:
   · Receiving the claim moves no stock. The defective part the customer hands over is NOT put back into sellable stock.
   · Each line gets an action: เปลี่ยนชิ้นใหม่ (replace) · ซ่อม / ปรับแต่ง (repair) · ไม่อยู่ในเงื่อนไข (reject).
   · "เปลี่ยนสินค้าให้ลูกค้า" takes the replacement parts out of stock (FIFO cost kept on the line = cost the shop
     carries; no automatic expense entry) and closes the claim. Cancelling puts them back.
   · "ส่งเคลมผู้ขาย" opens a vendor claim (07 เคลมสินค้า) filled from this one, with stock cutting OFF (the defective
     part was never in stock); when that claim is saved its number is linked here.
   · Lines can come from the sold receipt (4.1 — warranty shown from the sale date and the item's warranty months) or
     from the product search. Branch, numbering, rights (row stkCClaim), register filter / layout / export as the
     other 07 pages. */
(()=>{
 const host=document.getElementById('s-stock');if(!host||typeof sheetTop!=='function')return;
 const $i=id=>document.getElementById(id);
 const BR=()=>window.PKG_BRANCH;
 const L=()=>DB.custClaims||(DB.custClaims=[]);
 const owner=()=>!curEmp(),may=a=>owner()||can('m.stkCClaim_'+a);
 const need=a=>typeof pkgPermNeed==='function'?pkgPermNeed('stkCClaim',a):(may(a)||(toast('บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้'),false));
 if(typeof AUD_KIND==='object')AUD_KIND.cclaim='ใบรับเคลมสินค้าจากลูกค้า';
 if(typeof AUD_ACT==='object'){AUD_ACT.replace='เปลี่ยนสินค้าให้ลูกค้า';AUD_ACT.vendor='ส่งต่อเคลมผู้ขาย';AUD_ACT.reject='ปฏิเสธเคลม';}
 const ST={open:['รับเรื่องแล้ว','st-orange'],vendor:['ส่งเคลมผู้ขายแล้ว','st-blue'],done:['เปลี่ยนให้ลูกค้าแล้ว','st-green'],reject:['ปฏิเสธเคลม','st-red']};
 const ACT={replace:'เปลี่ยนชิ้นใหม่',repair:'ซ่อม / ปรับแต่ง',reject:'ไม่อยู่ในเงื่อนไข'};
 const stOf=c=>c.cancelled?'cancel':(c.status||'open');
 const filled=l=>l&&(l.stockId||String(l.code||'').trim()||String(l.name||'').trim());
 const lines=c=>(c.lines||[]).filter(filled);
 const pieces=c=>lines(c).reduce((a,l)=>a+n(l.qty),0);
 const cost=c=>lines(c).reduce((a,l)=>a+(l.cut?n(l.qty)*n(l.cost):0),0);
 const rcpt=id=>id?DB.receipts.find(r=>r.id===id)||(DB.invoices||[]).find(r=>r.id===id):null;
 const cust=c=>findCust(c.custId);
 /* warranty of a sold line: sale date + the item's warranty months (shop default otherwise) */
 function warranty(l,r){
  if(!r||!r.date)return null;const it=(r.items||[]).find(i=>(l.stockId&&i.stockId===l.stockId)||(l.code&&i.code===l.code));
  const mos=n(it&&it.warr)||n(DB.shop&&DB.shop.warrM)||0;if(!mos)return {sold:r.date,mos:0};
  const d=new Date(r.date+'T00:00:00');d.setMonth(d.getMonth()+mos);const end=iso(d),left=Math.round((new Date(end+'T00:00:00')-new Date(iso()+'T00:00:00'))/864e5);
  return {sold:r.date,mos,end,left};
 }
 const wText=w=>!w?'<span class="hint">—</span>':!w.mos?`<span class="hint">ขาย ${thDate(w.sold)}</span>`
  :`<span class="hint">ขาย ${thDate(w.sold)} · ประกัน ${w.mos} เดือน</span><br>${w.left>=0?`<span class="chip g">ในประกัน เหลือ ${w.left} วัน</span>`:`<span class="chip r">หมดประกัน ${-w.left} วัน</span>`}`;

 /* ---------- register ---------- */
 const pane=document.createElement('div');pane.id='s-cclaim';pane.className='spane';pane.style.display='none';host.parentElement.append(pane);
 pane.innerHTML=`<div class="panel"><header><h2 class="mht">ทะเบียนเคลมสินค้าลูกค้า</h2></header>
  <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);background:#fbfcfc"><button class="btn pri" id="ccNew">+ รับเคลมสินค้าจากลูกค้า</button><div class="spacer"></div><span class="tag" id="ccCount">0 ใบ</span></div>
  <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);align-items:flex-end">
   <label class="f" style="margin:0"><span>เลือกช่วงวันที่</span><select id="ccDateMode" style="width:150px"><option value="" selected>เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="one">วันที่ระบุ</option><option value="range">ช่วงวันที่</option><option value="month">เดือนปี</option></select></label>
   <input type="date" id="ccDateD1" style="width:135px;display:none"><span id="ccDateD2Wrap" style="display:none;white-space:nowrap"><span class="hint">ถึง</span> <input type="date" id="ccDateD2" style="width:135px"></span>
   <span id="ccDateMonthWrap" style="display:none;white-space:nowrap"><select id="ccDateMonthM" style="width:125px"></select> <select id="ccDateMonthY" style="width:95px"></select></span>
   <label class="f" style="margin:0"><span>แสดง</span><select id="ccLimit" style="width:120px"><option value="50">50 รายการ</option><option value="100">100 รายการ</option><option value="500">500 รายการ</option></select></label>
   <span class="hint" id="ccInfo"></span>
   <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto"><button class="btn pri sm" id="ccFind" type="button"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button><input type="text" id="ccSearch" placeholder="ค้นหา เลขที่ / ลูกค้า / ทะเบียนรถ / สินค้า + Enter" style="width:280px"></div></div>
  <div class="scroll"><table class="tbl" id="ccTbl"><thead><tr><th style="width:170px">เลขที่</th><th class="ctr" style="width:95px">วันที่</th><th>ลูกค้า</th><th style="width:160px">อ้างอิงใบเสร็จ</th>
   <th class="num" style="width:80px">รายการ</th><th class="num" style="width:95px">จำนวนรวม</th><th class="num sc-cost" style="width:130px">ต้นทุนที่เปลี่ยนให้</th><th class="ctr" style="width:150px">สถานะ</th><th style="width:110px">ผู้บันทึก</th></tr></thead><tbody></tbody></table></div>
  <div class="empty" id="ccEmpty" style="display:none">ยังไม่มีใบรับเคลมสินค้าจากลูกค้า</div></div>`;
 SORT_DEF.ccTbl={cols:{0:{lbl:'เลขที่',key:c=>String(c.no||'')},1:{lbl:'วันที่',key:c=>String(c.date||'')},2:{lbl:'ลูกค้า',key:c=>custName(cust(c))||''},3:{lbl:'อ้างอิงใบเสร็จ',key:c=>c.receiptNo||''},
  4:{lbl:'รายการ',key:c=>lines(c).length},5:{lbl:'จำนวนรวม',key:pieces},6:{lbl:'ต้นทุนที่เปลี่ยนให้',key:cost},7:{lbl:'สถานะ',key:stOf},8:{lbl:'ผู้บันทึก',key:c=>byShort(c)||''}}};
 MC_CFG.ccTbl={pri:[0,2,7]};
 function render(){
  if(BR())BR().ensure();const q=($i('ccSearch').value||'').toLowerCase().trim();
  let rows=L().slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  if(q)rows=rows.filter(c=>[c.no,custName(cust(c)),c.plate,c.receiptNo,c.vendorClaimNo,c.note,...lines(c).map(l=>l.code+' '+l.name+' '+(l.symptom||''))].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'ccDate');
  $i('ccCount').textContent=rows.length+' ใบ';$i('ccNew').hidden=!may('add');
  rows=sortRows('ccTbl',rows);rows=limitRows(rows,'cc');
  $i('ccTbl').tBodies[0].innerHTML=rows.map(c=>{const s=stOf(c),st=ST[s]||['ยกเลิกแล้ว','st-red'],cu=cust(c);
   return `<tr${c.cancelled?' class="cancelrow"':''}><td class="mono"><span class="docno" onclick="pkgOpenCClaim('${c.id}')">${c.cancelled?'<s>'+esc(c.no)+'</s>':esc(c.no)}</span></td><td class="ctr">${thDate(c.date)}</td>
    <td>${esc(custName(cu)||'-')}${c.plate?`<div class="hint mono">${esc(c.plate)}</div>`:''}</td><td class="mono">${esc(c.receiptNo||'-')}</td>
    <td class="num">${lines(c).length}</td><td class="num">${qf(pieces(c))}</td><td class="num sc-cost">${cost(c)?money(cost(c)):'<span class="hint">-</span>'}</td>
    <td class="ctr"><span class="stbtn ${st[1]}"${c.cancelled?` title="${esc(c.cancelReason||'')}"`:''}>${c.cancelled?'ยกเลิกแล้ว':st[0]}</span>${c.vendorClaimNo?`<div class="hint mono">เคลมผู้ขาย ${esc(c.vendorClaimNo)}</div>`:''}</td>${byCell(c)}</tr>`;}).join('');
  $i('ccEmpty').style.display=rows.length?'none':'block';
  paintSort('ccTbl');mkCards('ccTbl');
 }
 window.pkgRenderCClaims=render;
 fillYearSelect('ccDateMonthY');fillMonthSelect('ccDateMonthM');
 $i('ccDateMode').onchange=()=>{toggleDateFilterUI('ccDate');LIM_PAGE.cc=1;render();};
 ['ccDateD1','ccDateD2','ccDateMonthM','ccDateMonthY'].forEach(id=>$i(id).onchange=()=>{LIM_PAGE.cc=1;render();});
 LIM_RENDER.cc=render;$i('ccLimit').onchange=()=>{LIM_PAGE.cc=1;render();};
 $i('ccFind').onclick=render;$i('ccSearch').onkeydown=e=>{if(e.key==='Enter')render();};
 bindSort('ccTbl',render);

 /* ---------- window ---------- */
 const M=document.createElement('div');M.className='modal';M.id='mCClaim';
 M.innerHTML=`<div class="sheet" style="max-width:1400px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2 id="ccTitle">ใบรับเคลมสินค้าจากลูกค้า</h2><span class="tag" id="ccState"></span><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" data-c="close">✕</button></header>
  <div class="body" style="padding:14px 18px;display:grid;gap:12px">
   <div class="pkg-sa-g4"><label class="f"><span>เลขที่</span><input type="text" id="ccNo" readonly></label><label class="f"><span>วันที่สร้างข้อมูล</span><input type="text" id="ccDate" readonly class="pkg-date-lock"></label>
    <label class="f"><span>อ้างอิงใบเสร็จ / ใบแจ้งหนี้ที่ขาย</span><select id="ccRcpt"></select></label><label class="f"><span>ลูกค้า <b class="req">*</b></span><select id="ccCust"></select></label></div>
   <div class="pkg-sa-g4"><label class="f"><span>ทะเบียนรถ</span><input type="text" id="ccPlate"></label><label class="f"><span>รับเรื่องโดย</span><select id="ccBy"></select></label>
    <label class="f" style="grid-column:span 2"><span>หมายเหตุ</span><input type="text" id="ccNote" placeholder="เช่น ลูกค้าแจ้งเสียงดังหลังเปลี่ยน 2 สัปดาห์"></label></div>
   <fieldset class="pkg-fs" id="ccPullBox" hidden><legend>รายการอะไหล่ในใบเสร็จที่อ้างอิง — กดเพื่อเพิ่มเข้าใบเคลม</legend><div id="ccPull" class="pkg-cc-pull"></div></fieldset>
   <fieldset class="pkg-fs"><legend>รายการสินค้าที่ลูกค้านำมาเคลม</legend>
    <div class="scroll"><table class="tbl" id="ccItems"><thead><tr><th class="ctr" style="width:44px">#</th><th style="width:140px">รหัสสินค้า</th><th>รายการ</th><th style="width:210px">วันที่ขาย / ประกัน</th><th class="num" style="width:90px">จำนวน</th>
     <th style="width:230px">อาการ / สาเหตุ</th><th style="width:170px">การดำเนินการ</th><th class="num sc-cost" style="width:120px">ต้นทุนที่เปลี่ยนให้</th><th class="ctr" style="width:56px">ลบ</th></tr></thead><tbody></tbody></table></div>
    <span id="ccPickInfo" hidden></span></fieldset>
   <div class="pkg-cut-cancelled" id="ccCancelBox" hidden></div>
  </div>
  <footer id="ccFoot" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"></footer></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(M);
 const W={S:null};   /* the document in the window (a working copy) */
 const saved=()=>W.S&&W.S.no?L().find(x=>x.id===W.S.id):null;
 const locked=()=>{const s=saved();return !!(s&&(s.cancelled||s.cut||s.status==='reject'));};
 const blank=()=>({id:uid(),no:'',date:iso(),custId:'',vehIdx:0,plate:'',receiptId:'',receiptNo:'',by:DB.curEmp||'',note:'',status:'open',lines:[]});
 function fillSelects(){
  const S=W.S,ro=locked();
  const here=r=>!BR()||BR().here(r)||r.id===S.receiptId;
  const rs=DB.receipts.filter(r=>!r.cancelled&&here(r)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  $i('ccRcpt').innerHTML='<option value="">— ไม่อ้างอิง —</option>'+rs.map(r=>`<option value="${esc(r.id)}">${esc(r.no)} · ${thDate(r.date)} · ${esc(custName(findCust(r.custId))||'-')}</option>`).join('');
  $i('ccRcpt').value=S.receiptId||'';$i('ccRcpt').disabled=ro||!!(S.no&&lines(S).length&&S.receiptId);
  $i('ccCust').innerHTML='<option value="">— เลือกลูกค้า —</option>'+DB.cust.slice().sort((a,b)=>String(custName(a)).localeCompare(String(custName(b)),'th')).map(c=>`<option value="${esc(c.id)}">${esc(custName(c))}${c.tel?' · '+esc(c.tel):''}</option>`).join('');
  $i('ccCust').value=S.custId||'';$i('ccCust').disabled=ro||!!S.receiptId;
  const emps=typeof empActiveList==='function'?empActiveList():DB.emp;
  $i('ccBy').innerHTML='<option value="">— ไม่ระบุ —</option>'+emps.map(e=>`<option value="${esc(e.id)}">${esc(e.code)} · ${esc(e.name)}</option>`).join('');$i('ccBy').value=S.by||'';$i('ccBy').disabled=ro;
  $i('ccPlate').value=S.plate||'';$i('ccPlate').disabled=ro;$i('ccNote').value=S.note||'';$i('ccNote').disabled=ro;
 }
 function paintPull(){
  const S=W.S,r=rcpt(S.receiptId),box=$i('ccPullBox');
  const parts=r?(r.items||[]).filter(i=>i&&i.type!=='labor'&&String(i.code||i.name||'').trim()):[];
  box.hidden=locked()||!parts.length;
  $i('ccPull').innerHTML=parts.map((it,i)=>{const got=S.lines.some(l=>(it.stockId&&l.stockId===it.stockId)||(it.code&&l.code===it.code));
   return `<button type="button" class="btn sm ${got?'gh':''}" data-pull="${i}" ${got?'disabled':''}>${got?'✓ ':'+ '}${esc(it.code||'')} ${esc(it.name||'')} <span class="hint">× ${qf(it.qty)}</span></button>`;}).join('');
 }
 function paint(){
  const S=W.S;if(!S)return;const sv=saved(),ro=locked(),s=sv?stOf(sv):'new';
  $i('ccTitle').textContent=sv?'ใบรับเคลมสินค้า '+sv.no:'รับเคลมสินค้าจากลูกค้า';
  $i('ccState').innerHTML=sv?`<span class="stbtn ${(ST[s]||['','st-red'])[1]}">${sv.cancelled?'ยกเลิกแล้ว':ST[s][0]}</span>`:'';
  $i('ccNo').value=S.no||peekDocNo('CC');$i('ccDate').value=sv&&sv.createdAt?thDateTime(sv.createdAt):thDate(S.date);
  fillSelects();paintPull();
  const r=rcpt(S.receiptId);
  $i('ccItems').tBodies[0].innerHTML=S.lines.map((l,i)=>`<tr><td class="ctr">${i+1}</td><td class="mono">${esc(l.code||'')}</td><td>${esc(l.name||'')}</td><td>${wText(warranty(l,r))}</td>
   <td class="num">${ro?qf(l.qty):`<input type="number" class="ccQty" data-i="${i}" value="${n(l.qty)}" min="0" step="1" style="text-align:right">`}</td>
   <td>${ro?esc(l.symptom||'-'):`<input type="text" class="ccSym" data-i="${i}" value="${esc(l.symptom||'')}" placeholder="เช่น มีเสียง / รั่ว / ไม่ทำงาน">`}</td>
   <td>${ro?esc(ACT[l.action]||'-'):`<select class="ccAct" data-i="${i}">${Object.entries(ACT).map(([k,v])=>`<option value="${k}"${(l.action||'replace')===k?' selected':''}>${v}</option>`).join('')}</select>`}</td>
   <td class="num sc-cost">${l.cut?money(n(l.qty)*n(l.cost)):'<span class="hint">-</span>'}</td><td class="ctr">${ro?'':`<button type="button" class="btn sm dgr" data-del="${i}">×</button>`}</td></tr>`).join('')
   ||'<tr><td colspan="9" class="empty">ยังไม่มีรายการ — เลือกใบเสร็จที่อ้างอิงแล้วกดเพิ่มรายการ หรือค้นหาสินค้าด้านบน</td></tr>';
  const cb=$i('ccCancelBox');cb.hidden=!(sv&&sv.cancelled);if(sv&&sv.cancelled)cb.innerHTML='<b>ยกเลิกแล้ว'+(sv.cutUndone?' · คืนสินค้าที่เปลี่ยนให้เข้าสต๊อกแล้ว':'')+'</b><br>เหตุผล: '+esc(sv.cancelReason||'-')+'<br>โดย '+esc(sv.cancelByName||'-')+' · '+(sv.cancelAt?thDateTime(sv.cancelAt):'');
  const B=(c,t,cls)=>`<button type="button" class="btn ${cls||'gh'}" data-c="${c}">${t}</button>`;
  let foot='';
  if(!sv)foot='<span class="hint">บันทึกแล้วยังไม่กระทบสต๊อก · ของเสียที่รับจากลูกค้าไม่เข้าสต๊อกขาย</span><div class="spacer"></div>'+B('close','ปิด')+B('save','บันทึก','pri');
  else if(sv.cancelled||s==='reject'||sv.cut)foot=(!sv.cancelled&&may('cancel')?B('cancel',sv.cut?'ยกเลิกใบเคลม (คืนสินค้าเข้าสต๊อก)':'ยกเลิกใบเคลม','dgr'):'')+'<div class="spacer"></div>'+(may('print')?B('print','พิมพ์ใบรับเคลม'):'')+B('close','ปิด','pri');
  else foot=(may('cancel')?B('cancel','ยกเลิกใบเคลม','dgr'):'')+B('reject','ปฏิเสธเคลม','dgr')
   +(sv.vendorClaimId?B('openVendor','เปิดใบเคลมผู้ขาย '+esc(sv.vendorClaimNo||'')):B('vendor','ส่งเคลมผู้ขาย'))
   +B('replace','เปลี่ยนสินค้าให้ลูกค้า (ตัดสต๊อก)','grn')+'<div class="spacer"></div>'+(may('print')?B('print','พิมพ์ใบรับเคลม'):'')+B('close','ปิด')+B('save','บันทึก','pri');
  $i('ccFoot').innerHTML=foot;
  if(window.PKG_PRODUCT_PICKER&&$i('pkg-cclaim-products')){try{PKG_PRODUCT_PICKER.sync('cclaim');}catch(e){}$i('pkg-cclaim-products').hidden=ro;}
 }
 window.pkgCClaimRender=paint;
 function addLine(o){const S=W.S;if(!S||locked())return;const same=S.lines.find(l=>(o.stockId&&l.stockId===o.stockId)||(!o.stockId&&o.code&&l.code===o.code));
  if(same){toast((o.code||o.name)+' อยู่ในใบเคลมแล้ว — แก้จำนวนในตารางได้');return;}
  S.lines.push(Object.assign({stockId:'',code:'',name:'',unit:'',qty:1,symptom:'',action:'replace'},o));paint();}
 if(window.PKG_PRODUCT_PICKER&&PKG_PRODUCT_PICKER.register){
  PKG_PRODUCT_PICKER.register('cclaim',{table:'ccItems',info:'ccPickInfo',get:()=>W.S&&!locked()?{items:W.S.lines}:null,render:'pkgCClaimRender',permission:'sub.stkCClaim',title:'เลือกสินค้าที่ลูกค้านำมาเคลม',
   add:s=>addLine({stockId:s.id,code:s.code,name:s.name,unit:s.unit||'',qty:1})});
 }
 M.addEventListener('input',e=>{const S=W.S;if(!S||locked())return;const t=e.target,i=+t.dataset.i;
  if(t.classList.contains('ccQty'))S.lines[i].qty=n(t.value);if(t.classList.contains('ccSym'))S.lines[i].symptom=t.value;
  if(t.id==='ccPlate')S.plate=t.value;if(t.id==='ccNote')S.note=t.value;});
 M.addEventListener('change',e=>{const S=W.S;if(!S||locked())return;const t=e.target;
  if(t.classList.contains('ccAct')){S.lines[+t.dataset.i].action=t.value;return;}
  if(t.id==='ccBy'){S.by=t.value;return;}
  if(t.id==='ccCust'){S.custId=t.value;return;}
  if(t.id==='ccRcpt'){const r=rcpt(t.value);S.receiptId=r?r.id:'';S.receiptNo=r?r.no:'';
   if(r){S.custId=r.custId;S.vehIdx=r.vehIdx||0;const c=findCust(r.custId),v=c&&(c.vehicles||[])[r.vehIdx||0];S.plate=plateOf(v)||S.plate;}paint();}
 });
 M.addEventListener('click',async e=>{
  const S=W.S;const del=e.target.closest('[data-del]');if(del&&S&&!locked()){S.lines.splice(+del.dataset.del,1);return paint();}
  const pull=e.target.closest('[data-pull]');if(pull&&S){const r=rcpt(S.receiptId),it=r&&(r.items||[]).filter(i=>i&&i.type!=='labor'&&String(i.code||i.name||'').trim())[+pull.dataset.pull];
   if(it)addLine({stockId:it.stockId||'',code:it.code||'',name:it.name||'',unit:it.unit||'',qty:n(it.qty)||1});return;}
  const a=e.target.closest('[data-c]')?.dataset.c;if(!a)return;
  if(a==='close')return closeModal('mCClaim');
  if(a==='save')return saveDoc();
  const sv=saved();if(!sv)return;
  if(a==='print'){if(!need('print'))return;logAudit('cclaim',sv,'print','ต้นฉบับ + สำเนา');save();return printDocs(sheet(sv,'ต้นฉบับ (ลูกค้า)')+sheet(sv,'สำเนา (อู่)'));}
  if(a==='cancel')return cancelDoc(sv.id);
  if(a==='reject')return rejectDoc(sv.id);
  if(a==='replace')return replaceDoc(sv.id);
  if(a==='vendor')return toVendor(sv.id);
  if(a==='openVendor'&&sv.vendorClaimId&&typeof openClaimById==='function'){closeModal('mCClaim');return openClaimById(sv.vendorClaimId);}
 });
 function openNew(){if(BR())BR().ensure();if(!need('add'))return;W.S=blank();paint();openModal('mCClaim');}
 function openDoc(id){
  const c=L().find(x=>x.id===id);if(!c)return;if(!may('view'))return toast('บัญชีนี้ไม่มีสิทธิ์เปิดใบเคลมสินค้าลูกค้า');
  const B=BR();if(B&&!B.here(c)){if(!B.switchTo(B.brOf(c),{quiet:true,force:true}))return;toast('เอกสารนี้เป็นของสาขา '+B.label(B.brOf(c))+' — สลับสาขาให้แล้ว');}
  W.S=JSON.parse(JSON.stringify(c));logAudit('cclaim',c,'open');paint();openModal('mCClaim');
 }
 window.pkgOpenCClaim=openDoc;$i('ccNew').onclick=openNew;
 const keep=()=>{const sv=saved();if(sv)Object.assign(W.S,JSON.parse(JSON.stringify(sv)));};
 /* ---------- save / actions ---------- */
 function saveDoc(){
  const S=W.S;if(!S)return;if(!need(S.no?'add':'add'))return;if(locked())return toast('ใบนี้แก้ไขไม่ได้แล้ว');
  S.lines=S.lines.filter(filled);
  if(!S.custId)return toast('เลือกลูกค้าก่อนบันทึก (หรือเลือกใบเสร็จที่อ้างอิง)');
  if(!S.lines.length)return toast('เพิ่มรายการสินค้าที่ลูกค้านำมาเคลมอย่างน้อย 1 รายการ');
  if(S.lines.some(l=>n(l.qty)<=0))return toast('ระบุจำนวนของทุกรายการให้มากกว่า 0');
  const i=L().findIndex(x=>x.id===S.id),old=i>=0?L()[i]:null;
  if(!S.no){S.no=docNo('CC');S.date=iso();}
  stampRec(S,old);
  const rec=JSON.parse(JSON.stringify(S));if(i>=0)L()[i]=rec;else L().push(rec);
  logAudit('cclaim',rec,'save',lines(rec).length+' รายการ · '+qf(pieces(rec))+' ชิ้น · '+(custName(cust(rec))||''));save();
  paint();render();if(typeof saveFx==='function')saveFx('บันทึกเอกสารแล้ว',rec.no);toast('บันทึกใบรับเคลม '+rec.no+' แล้ว');
 }
 async function replaceDoc(id){
  const c=L().find(x=>x.id===id);if(!c||c.cancelled||c.cut)return;if(!need('add'))return;
  if(W.S&&W.S.id===id){const dirty=JSON.stringify(W.S.lines)!==JSON.stringify(c.lines)||W.S.note!==c.note;if(dirty)return toast('มีการแก้ไขที่ยังไม่บันทึก — กดบันทึกก่อน');}
  const rep=lines(c).filter(l=>(l.action||'replace')==='replace');
  const nostock=rep.filter(l=>!DB.stock.some(s=>s.id===l.stockId));
  const ok=rep.filter(l=>DB.stock.some(s=>s.id===l.stockId));
  const short=ok.filter(l=>{const s=DB.stock.find(x=>x.id===l.stockId);return n(l.qty)>n(s.qty);});
  const msg='เปลี่ยนสินค้าใหม่ให้ลูกค้า '+ok.length+' รายการ (ตัดออกจากสต๊อก)'
   +(nostock.length?'\n· '+nostock.length+' รายการไม่มีในทะเบียนอะไหล่ — ไม่ตัดสต๊อก':'')
   +(short.length?'\n⚠ '+short.length+' รายการมีไม่พอ สต๊อกจะติดลบ ('+short.slice(0,3).map(l=>l.code).join(', ')+')':'')
   +'\n\nใบเคลมจะปิดเป็น "เปลี่ยนให้ลูกค้าแล้ว" และแก้รายการไม่ได้อีก ยืนยันหรือไม่?';
  if(short.length&&window.PKG_STOCK_FIFO&&!PKG_STOCK_FIFO.negOk(short.length))return;   /* DriveGo new system (task 3.6, R9-ข) */
  if(!await askP({title:'เปลี่ยนสินค้าให้ลูกค้า · '+c.no,text:msg,yes:'เปลี่ยนสินค้า',no:'ยังไม่เปลี่ยน'}))return;
  if(window.PKG_EXPIRY&&!(await PKG_EXPIRY.guard(ok,{kind:'claim'})))return;   /* stock-expiry.js — expired lots: skip the lot / right-holder confirms / blocked. KEEP this one line just before stock is cut */
  ok.forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);s.qty=n(s.qty)-n(l.qty);s.lastMove=iso();
   logMove(s.id,'out',-n(l.qty),iso(),'เปลี่ยนสินค้าให้ลูกค้าตามใบเคลม '+c.no+(l.symptom?' — '+l.symptom:''),c.no);l.cut=true;});
  const al=(DB.fifo&&DB.fifo.allocs)||[];
  ok.forEach(l=>{const mine=al.filter(a=>a.refNo===c.no&&a.stockId===l.stockId),q=mine.reduce((x,a)=>x+n(a.qty),0),s=DB.stock.find(x=>x.id===l.stockId);l.cost=q>0?mine.reduce((x,a)=>x+n(a.qty)*n(a.cost),0)/q:n(s&&s.cost);});
  Object.assign(c,{cut:true,status:'done',doneAt:nowTs(),doneBy:DB.curEmp||'',doneByName:meName()});
  /* DriveGo new system (task 3.9): whoever may not see costs has none to write — the server works the cost out */
  const ck=!window.PKG_RIGHTS||PKG_RIGHTS.costOk();
  logAudit('cclaim',c,'replace','เปลี่ยนให้ลูกค้า '+ok.length+' รายการ'+(ck?' · ต้นทุน '+money(cost(c))+' บาท':''));save();
  keep();paint();render();if(typeof renderStock==='function')try{renderStock();}catch(e){}
  toast('เปลี่ยนสินค้าให้ลูกค้าแล้ว'+(ck?' · ต้นทุนที่ร้านรับ '+money(cost(c))+' บาท':''));
 }
 async function rejectDoc(id){
  const c=L().find(x=>x.id===id);if(!c||c.cancelled||c.cut)return;if(!need('add'))return;
  const reason=await askPromptP({title:'ปฏิเสธเคลม '+c.no,text:'ระบุเหตุผลที่ไม่รับเคลม (จำเป็น) เช่น หมดประกัน / ใช้งานผิดวิธี',yes:'ปฏิเสธเคลม',no:'ยกเลิก'});
  if(reason===null)return;if(!String(reason).trim())return toast('ต้องระบุเหตุผล');
  Object.assign(c,{status:'reject',rejectReason:String(reason).trim(),rejectAt:nowTs(),rejectByName:meName()});
  logAudit('cclaim',c,'reject',c.rejectReason);save();keep();paint();render();toast('บันทึกปฏิเสธเคลม '+c.no+' แล้ว');
 }
 async function cancelDoc(id){
  const c=L().find(x=>x.id===id);if(!c||c.cancelled)return false;if(!need('cancel'))return false;
  if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk(c))return false;   /* per-employee cancel period (perm-matrix.js), owner always may — user 11 ต.ค. 2569 */
  const reason=await askPromptP({title:'ยกเลิกใบเคลม '+c.no,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)'+(c.cut?'\nสินค้าที่เปลี่ยนให้ลูกค้าจะถูกคืนเข้าสต๊อก':''),yes:'ยกเลิกใบเคลม',no:'ไม่ยกเลิก'});
  if(reason===null)return false;if(!String(reason).trim()){toast('ต้องระบุเหตุผลที่ยกเลิก');return false;}
  if(c.cut){lines(c).filter(l=>l.cut).forEach(l=>{const s=DB.stock.find(x=>x.id===l.stockId);if(!s)return;s.qty=n(s.qty)+n(l.qty);s.lastMove=iso();
   logMove(s.id,'in',n(l.qty),iso(),'ยกเลิกใบเคลม '+c.no+' · คืนสินค้าที่เปลี่ยนให้ลูกค้า',c.no,'',l.cost);});c.cutUndone=true;}
  Object.assign(c,{cancelled:true,cancelReason:String(reason).trim(),cancelDate:iso(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});
  logAudit('cclaim',c,'del','ยกเลิกใบเคลม — '+c.cancelReason);save();keep();paint();render();if(typeof renderStock==='function')try{renderStock();}catch(e){}
  toast('ยกเลิกใบเคลม '+c.no+' แล้ว'+(c.cutUndone?' · คืนสินค้าเข้าสต๊อกแล้ว':''));return true;
 }
 /* hand the claim on to the supplier: a vendor claim filled from it, stock cutting off */
 function toVendor(id){
  const c=L().find(x=>x.id===id);if(!c||c.cancelled)return;
  if(typeof newClaim!=='function'||typeof fillClaimForm!=='function')return toast('ไม่พบหน้าเคลมสินค้า (ผู้ขาย)');
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('stkClaim','add'))return;
  closeModal('mCClaim');go('stock');stkGo('claim');newClaim(true);
  C.items=lines(c).map(l=>({stockId:l.stockId||'',code:l.code||'',name:l.name||'',qty:n(l.qty)||1,reason:(l.symptom?l.symptom+' · ':'')+'เคลมจากลูกค้า '+c.no}));
  C.deduct=false;C.receiptId=c.receiptId||'';C.plate=c.plate||'';C.ccId=c.id;C.ref=c.no;
  C.note='ส่งต่อจากใบรับเคลมสินค้าลูกค้า '+c.no+' · '+(custName(cust(c))||'')+' · ของเสียที่รับจากลูกค้า (ไม่ได้อยู่ในสต๊อก)';
  if(typeof padCLines==='function')padCLines();fillClaimForm();openModal('mClaimEdit');
  toast('เปิดใบเคลมผู้ขายจาก '+c.no+' แล้ว — เลือกผู้ขายแล้วกดบันทึก');
 }
 /* the vendor claim saved: link it back */
 if(typeof saveClaim==='function'){const sc=saveClaim;window.saveClaim=function(){const r=sc.apply(this,arguments);
  try{const cl=typeof C!=='undefined'&&C;if(cl&&cl.ccId&&cl.no){const c=L().find(x=>x.id===cl.ccId);if(c&&c.vendorClaimId!==cl.id){c.vendorClaimId=cl.id;c.vendorClaimNo=cl.no;if(c.status==='open')c.status='vendor';
   logAudit('cclaim',c,'vendor','ส่งต่อเคลมผู้ขาย '+cl.no);save();render();}}}catch(e){console.error('cust-claim',e);}return r;};}
 /* ---------- printout ---------- */
 function sheet(c,copy){
  const cu=cust(c),r=rcpt(c.receiptId),its=lines(c),s=stOf(c);
  return sheetTop({title:'ใบรับเคลมสินค้า',en:'CUSTOMER WARRANTY CLAIM',copy,stamp:c.cancelled?'ยกเลิกแล้ว':'',
   fields:[['เลขที่',esc(c.no)],['วันที่',thDate(c.date)],['อ้างอิงใบเสร็จ',esc(c.receiptNo||'-')],['ทะเบียนรถ',esc(c.plate||'-')],['สถานะ',esc(c.cancelled?'ยกเลิกแล้ว':(ST[s]||[''])[0])],['เคลมผู้ขาย',esc(c.vendorClaimNo||'-')]]})
   +`<table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ลูกค้า</span><br><b>${esc(custName(cu)||'-')}</b>${cu&&cu.tel?'<br>โทร. '+esc(cu.tel):''}</td>
    <td style="vertical-align:top"><span class="lbl">สรุป</span><br>จำนวนรายการ <b>${its.length}</b> รายการ · รวม <b>${qf(pieces(c))}</b> ชิ้น</td></tr></table>
   <table style="margin-top:6px"><thead><tr><th style="width:34px">#</th><th style="width:110px">รหัสสินค้า</th><th>รายการ</th><th style="width:120px">วันที่ขาย / ประกัน</th><th style="width:50px">จำนวน</th><th style="width:170px">อาการ / สาเหตุ</th><th style="width:110px">การดำเนินการ</th></tr></thead><tbody>
   ${its.map((l,i)=>{const w=warranty(l,r);return `<tr><td style="text-align:center">${i+1}</td><td>${esc(l.code||'-')}</td><td>${esc(l.name||'')}</td><td>${w?thDate(w.sold)+(w.mos?'<br>ประกัน '+w.mos+' เดือน'+(w.left>=0?' (ในประกัน)':' (หมดประกัน)'):''):'-'}</td>
    <td style="text-align:center">${qf(l.qty)}</td><td>${esc(l.symptom||'-')}</td><td>${esc(ACT[l.action||'replace'])}</td></tr>`;}).join('')}</tbody></table>
   ${c.note?`<div class="box"><span class="lbl">หมายเหตุ</span> ${esc(c.note)}</div>`:''}${c.rejectReason?`<div class="box"><span class="lbl">เหตุผลที่ไม่รับเคลม</span> ${esc(c.rejectReason)}</div>`:''}
   <div class="note">อู่ได้รับสินค้าตามรายการข้างต้นไว้เพื่อตรวจสอบตามเงื่อนไขการรับประกัน และจะแจ้งผลให้ลูกค้าทราบ</div>
   <div class="sign"><div><div class="line"></div>( ${esc(custName(cu)||'.'.repeat(26))} )<br><span class="lbl">ลูกค้า</span></div>
    <div><div class="line"></div>( ${esc((DB.emp.find(e=>e.id===c.by)||{}).name||'.'.repeat(26))} )<br><span class="lbl">ผู้รับเรื่อง</span></div>
    <div><div class="line"></div>( ${'.'.repeat(26)} )<br><span class="lbl">ผู้อนุมัติ</span></div></div></div>`;
 }
 window.PKG_CUST_CLAIM={list:L,render,openNew,open:openDoc,save:saveDoc,replace:replaceDoc,reject:rejectDoc,cancel:cancelDoc,toVendor,state:W,sheet,warranty};
})();
