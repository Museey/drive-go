/* Named maintenance kits are recipes, not independently stocked inventory. */
(()=>{
 let draft=null,baseline='',draftDB=null,saving=false,returnFocus=null;
 const pane=document.createElement('div');pane.id='s-kits';pane.className='spane';pane.style.display='none';
 document.getElementById('s-stock').parentElement.append(pane);
 /* Register mirrors the 07 issue register: create/count row, filter/search row, sortable table, shared pager and mobile cards. */
 pane.innerHTML=`<div class="panel" id="kit-list"><header><h2 class="mht">ทะเบียนชุดอะไหล่ซ่อมบำรุง</h2></header>
 <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);background:#fbfcfc"><button class="btn pri" id="kit-new">+ สร้างชุดอะไหล่</button><div class="spacer"></div><span class="tag" id="kitCount">0 ชุด</span></div>
 <div class="row" style="padding:9px 12px;border-bottom:1px solid var(--line2);align-items:flex-end">
 <label class="f" style="margin:0"><span>สถานะ</span><select id="kitState" style="width:170px"><option value="">ทั้งหมด</option><option value="ready">พร้อมใช้ (สต๊อกพอ)</option><option value="short">สต๊อกไม่พอ</option><option value="noprice">ยังไม่ตั้งราคาขาย</option><option value="loss">ราคาขายต่ำกว่าทุน</option></select></label>
 <label class="f" style="margin:0"><span>แสดง</span><select id="kitLimit" style="width:120px"><option value="20">20 รายการ</option><option value="50" selected>50 รายการ</option><option value="100">100 รายการ</option><option value="500">500 รายการ</option></select></label>
 <span class="hint" id="kitInfo"></span><div class="spacer"></div>
 <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto"><button class="btn pri pkg-go" id="kit-find" type="button"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button><input type="text" id="kit-search" placeholder="ค้นหา ชื่อชุด / รหัส / ชื่ออะไหล่ + Enter" style="width:250px" autocomplete="off"></div></div>
 <div class="scroll"><table class="tbl rt" id="kit-register"><thead><tr><th>ชื่อชุดอะไหล่</th><th class="num" style="width:72px">รายการ</th><th class="num" style="width:120px">ต้นทุน / ชุด</th><th class="num" style="width:120px">ราคาขาย / ชุด</th><th class="num" style="width:130px">กำไร / ชุด</th><th class="ctr" style="width:130px">สต๊อกพร้อมทำ</th><th class="ctr" style="width:92px">ปรับปรุงล่าสุด</th><th class="ctr" style="width:122px">จัดการ</th></tr></thead><tbody></tbody></table></div>
 <div class="empty" id="kitEmpty" style="display:none"></div></div>
 <div class="panel" id="kit-editor" hidden><header><h2 id="kit-title">สร้างชุดอะไหล่ใหม่</h2><div class="spacer"></div><button class="btn gh" id="kit-close-top" type="button">ปิด</button></header><div class="pkg-kit-content">
 <div class="grid g2"><label class="f"><span>ชื่อชุดอะไหล่</span><input type="text" id="kit-name" placeholder="เช่น ชุดเปลี่ยนถ่ายน้ำมันเครื่อง" maxlength="160"></label><label class="f"><span>ราคาขายต่อชุด (บาท)</span><input type="number" id="kit-price" min="0" step="0.01" value="0"></label></div>
 <label class="f"><span>หมายเหตุ</span><input type="text" id="kit-note" placeholder="รายละเอียดหรือรุ่นรถที่เหมาะกับชุดนี้" maxlength="500"></label>
 <div class="scroll"><table class="tbl" id="kit-items"><thead><tr><th>รหัส / ชื่อสินค้า</th><th class="num">คงเหลือ</th><th class="num">จำนวนต่อชุด</th><th class="num">ต้นทุนต่อหน่วย</th><th class="num">ต้นทุนรวม</th><th>จัดการ</th></tr></thead><tbody></tbody></table></div>
 <div class="pkg-kit-summary" id="kit-summary" aria-live="polite"></div><p class="hint">ต้นทุนคำนวณจากต้นทุนปัจจุบันในทะเบียนอะไหล่ × จำนวนที่ใช้ต่อชุด</p>
 <p id="kit-message" role="status"></p><div class="row"><button class="btn pri" id="kit-save">บันทึกชุดอะไหล่</button><button class="btn gh" id="kit-close">ปิด</button></div></div></div>`;
 const $k=id=>document.getElementById(id), allowed=()=>can('tabs.stock')&&can('sub.stkKits'),editable=()=>allowed()&&(typeof PERM_M!=='undefined'?(can('m.stkKits_add')||can('m.stkKits_edit')):can('stock.edit'));
 const modal=document.createElement('div');modal.id='mPartsKit';modal.className='modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','kit-title');
 $k('kit-editor').classList.add('sheet');pane.append(modal);modal.append($k('kit-editor'));
 async function closeEditor(){if(saving)return;if(await discard()){draft=null;$k('kit-editor').hidden=true;modal.classList.remove('on');returnFocus?.focus();}}
 const originalClose=closeModal;closeModal=function(id){if(id==='mPartsKit')return closeEditor();return originalClose.apply(this,arguments);};
 modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('mAsk').classList.contains('on')){e.preventDefault();closeEditor();}});
 const all=()=>Array.isArray(DB.partsKits)?DB.partsKits:[];
 const cost=kit=>kit.items.reduce((sum,it)=>sum+n(DB.stock.find(s=>s.id===it.stockId)?.cost)*n(it.qty),0);
 const cash=v=>can('stock.cost')?money(v):'—';
 /* Kits whole-set capacity: the scarcest component decides; a removed part makes the kit unusable. */
 const makeable=kit=>kit.items.reduce((min,it)=>{const s=DB.stock.find(x=>x.id===it.stockId);return Math.min(min,s&&n(it.qty)>0?Math.max(0,Math.floor(n(s.qty)/n(it.qty))):0);},kit.items.length?Infinity:0);
 const missing=kit=>kit.items.some(it=>!DB.stock.some(s=>s.id===it.stockId));
 const kitState=kit=>{const c=cost(kit),p=n(kit.price);return{ready:makeable(kit)>0,noprice:p<=0,loss:p>0&&p<c};};
 SORT_DEF['kit-register']={cols:{0:{lbl:'ชื่อชุดอะไหล่',key:k=>k.name},1:{lbl:'รายการ',key:k=>k.items.length},2:{lbl:'ต้นทุน / ชุด',key:k=>cost(k)},3:{lbl:'ราคาขาย / ชุด',key:k=>n(k.price)},4:{lbl:'กำไร / ชุด',key:k=>n(k.price)-cost(k)},5:{lbl:'สต๊อกพร้อมทำ',key:k=>makeable(k)},6:{lbl:'ปรับปรุงล่าสุด',key:k=>String(k.updatedAt||'')}}};
 MC_CFG['kit-register']={pri:[0,3,5],act:7};
 function list(){
  $k('kit-new').hidden=!editable();const q=$k('kit-search').value.trim().toLocaleLowerCase(),state=$k('kitState').value,showCost=can('stock.cost');
  const text=kit=>[kit.name,kit.note,...kit.items.flatMap(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return[s?.code||it.code,s?.name||it.name];})].map(v=>String(v||'').toLocaleLowerCase());
  let rows=all().slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||a.name.localeCompare(b.name,'th'));
  if(q)rows=rows.filter(k=>text(k).some(v=>v.includes(q)));
  if(state)rows=rows.filter(k=>{const s=kitState(k);return state==='short'?!s.ready:s[state];});
  rows=limitRows(sortRows('kit-register',rows),'kit');
  const body=$k('kit-register').tBodies[0];body.replaceChildren();
  rows.forEach(kit=>{
   const c=cost(kit),p=n(kit.price),profit=p-c,m=makeable(kit),row=document.createElement('tr');row.className='click';
   const margin=showCost&&p>0?`<div class="hint">${(profit/p*100).toFixed(1)}% ของราคาขาย</div>`:'';
   const priceCell=p>0?money(p):'<span class="stbtn st-orange">ยังไม่ตั้งราคา</span>';
   const profitCell=!showCost?'—':p<=0?'—':`<b style="color:${profit<0?'#b42318':'inherit'}">${money(profit)}</b>${margin}`;
   const stockCell=missing(kit)?'<span class="stbtn st-red">มีอะไหล่ถูกลบ</span>':m>0?`<span class="stbtn st-green">ทำได้ ${qf(m)} ชุด</span>`:`<span class="stbtn st-red" title="${esc('ไม่พอ: '+kit.items.filter(it=>n(DB.stock.find(s=>s.id===it.stockId)?.qty)<n(it.qty)).map(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return (s?.code||it.code)+' มี '+qf(s?.qty||0)+' ใช้ '+qf(it.qty);}).join(', '))}">สต๊อกไม่พอ</span>`;
   row.innerHTML=`<td><b>${esc(kit.name)}</b>${kit.note?'<div class="hint">'+esc(kit.note)+'</div>':''}</td><td class="num">${kit.items.length}</td><td class="num">${cash(c)}</td><td class="num">${priceCell}</td><td class="num">${profitCell}</td><td class="ctr">${stockCell}</td><td class="ctr">${kit.updatedAt?thDate(String(kit.updatedAt).slice(0,10)):'—'}</td><td class="ctr"><div class="pkg-kit-actions"></div></td>`;
   const b=document.createElement('button');b.className='btn sm gh';b.type='button';b.textContent=editable()?'เปิด / แก้ไข':'ดูรายละเอียด';
   b.onclick=e=>{e.stopPropagation();open(kit.id);};row.onclick=()=>open(kit.id);row.querySelector('.pkg-kit-actions').append(b);body.append(row);
  });
  const total=all().length;$k('kitCount').textContent=total+' ชุด';
  $k('kitEmpty').textContent=total?'ไม่พบชุดอะไหล่ที่ตรงกับคำค้นหรือสถานะที่เลือก':'ยังไม่มีชุดอะไหล่ · กด “+ สร้างชุดอะไหล่” เพื่อเริ่ม';
  $k('kitEmpty').style.display=rows.length?'none':'block';
  paintSort('kit-register');mkCards('kit-register');
 }
 LIM_RENDER.kit=list;bindSort('kit-register',list);
 $k('kitLimit').onchange=$k('kitState').onchange=()=>{LIM_PAGE.kit=1;list();};
 async function discard(){if(draft&&JSON.stringify(draft)!==baseline)return await askP({title:'ยังไม่ได้บันทึกชุดอะไหล่',text:'ต้องการปิดและทิ้งการแก้ไขชุดนี้หรือไม่?',yes:'ปิดโดยไม่บันทึก',no:'กลับไปแก้ไข'});return true;}
 async function open(id){
  if(saving||!allowed()||(!id&&!editable())||!await discard())return;
  returnFocus=document.activeElement;
  const stored=id?all().find(k=>k.id===id):null;if(id&&!stored)return;
  draftDB=DB;draft=stored?JSON.parse(JSON.stringify(stored)):{id:uid(),name:'',note:'',price:0,items:[]};baseline=JSON.stringify(draft);
  $k('kit-name').value=draft.name;$k('kit-price').value=draft.price;$k('kit-note').value=draft.note||'';
  $k('kit-title').textContent=stored?'รายละเอียดชุดอะไหล่':'สร้างชุดอะไหล่ใหม่';
  $k('kit-editor').hidden=false;$k('kit-message').textContent='';
  ['kit-name','kit-price','kit-note','kit-save'].forEach(id=>$k(id).disabled=!editable());
  window.pkgRenderKitItems();openModal('mPartsKit');modal.scrollTop=0;$k('kit-name').focus();
 }
 function totals(){if(!draft)return;const total=cost(draft);$k('kit-summary').innerHTML=`<span>ต้นทุนรวมต่อชุด <b>${cash(total)} บาท</b></span><span>ราคาขายต่อชุด <b>${money(draft.price)} บาท</b></span><span>ส่วนต่างราคาขาย − ต้นทุน <b>${cash(n(draft.price)-total)} บาท</b></span>`;}
 function rows(){
  const body=$k('kit-items').tBodies[0];body.replaceChildren();
  draft.items.forEach((item,index)=>{
   const stock=DB.stock.find(s=>s.id===item.stockId),tr=document.createElement('tr');
   tr.innerHTML=`<td>${esc(stock?.code||item.code||'')}<br><b>${esc(stock?.name||item.name||'ไม่พบสินค้าในทะเบียน')}</b>${!stock?'<div class="hint">สินค้านี้ถูกนำออกจากทะเบียน กรุณาเลือกใหม่</div>':''}</td><td class="num">${stock?qf(stock.qty):'—'}</td><td></td><td class="num">${stock?cash(stock.cost):'—'}</td><td class="num" data-kit-line-cost>${stock?cash(n(stock.cost)*n(item.qty)):'—'}</td><td></td>`;
   const input=document.createElement('input');input.type='number';input.min='0.01';input.step='any';input.value=item.qty;input.disabled=!editable();input.setAttribute('aria-label','จำนวนต่อชุด '+(stock?.name||item.name));input.className='pkg-kit-qty';
   input.oninput=()=>{item.qty=input.value===''?'':Number(input.value);tr.querySelector('[data-kit-line-cost]').textContent=stock?cash(n(stock.cost)*n(item.qty)):'—';totals();};tr.children[2].append(input);
   const b=document.createElement('button');b.className='btn sm dgr';b.textContent='นำออก';b.disabled=!editable();b.onclick=()=>{draft.items.splice(index,1);window.pkgRenderKitItems();};tr.children[5].append(b);body.append(tr);
  });totals();
 }
 function add(id){
  if(!draft||!editable())return;const stock=DB.stock.find(s=>s.id===id);if(!stock)return;
  const item=draft.items.find(it=>it.stockId===id);if(item)item.qty=n(item.qty)+1;else draft.items.push({stockId:id,code:stock.code,name:stock.name,qty:1});
  rows();$k('kit-message').textContent='เพิ่ม '+stock.name+' ในชุดแล้ว';
 }
 async function persist(){
  if(saving||!draft||!editable())return false;
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('stkKits',all().some(k=>k.id===draft.id)?'edit':'add'))return false;
  const error=msg=>{$k('kit-message').textContent=msg;return false;};
  if(!draft.name.trim())return error('กรุณาตั้งชื่อชุดอะไหล่');
  if(all().some(k=>k.id!==draft.id&&k.name.trim().toLocaleLowerCase()===draft.name.trim().toLocaleLowerCase()))return error('ชื่อชุดนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');
  if(!draft.items.length)return error('เลือกอะไหล่อย่างน้อย 1 รายการ');
  if(draft.items.some(it=>!DB.stock.some(s=>s.id===it.stockId)||!Number.isFinite(it.qty)||it.qty<=0))return error('ตรวจสอบสินค้าและจำนวนที่ใช้ ต้องมากกว่า 0 ทุกรายการ');
  if(draft.price===''||!Number.isFinite(draft.price)||draft.price<0)return error('กรุณาระบุราคาขายตั้งแต่ 0 บาทขึ้นไป');
  draft.name=draft.name.trim();draft.updatedAt=new Date().toISOString();
  if(!Array.isArray(DB.partsKits))DB.partsKits=[];
  const record=JSON.parse(JSON.stringify(draft)),index=DB.partsKits.findIndex(k=>k.id===record.id);
  const previous=index<0?null:DB.partsKits[index];
  if(index<0)DB.partsKits.push(record);else DB.partsKits[index]=record;
  saving=true;$k('kit-save').disabled=true;
  try{
    await save();baseline=JSON.stringify(draft);list();$k('kit-message').textContent='บันทึกชุดอะไหล่แล้ว';
    askConfirm({title:'บันทึกสำเร็จ',ok:'บันทึกชุดอะไหล่แล้ว',text:record.name,yes:'ตกลง',noHide:true,onYes:()=>{$k('kit-save').focus();}});
    return true;
  }catch(e){
    if(index<0)DB.partsKits=DB.partsKits.filter(k=>k!==record);else DB.partsKits[index]=previous;
    return error('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
  }finally{saving=false;$k('kit-save').disabled=!editable();}

 }
 $k('kit-new').onclick=()=>open();
 const search=()=>{LIM_PAGE.kit=1;list();};$k('kit-search').oninput=search;$k('kit-find').onclick=search;$k('kit-search').onkeydown=e=>{if(e.key==='Enter')search();};
 $k('kit-name').oninput=e=>{draft.name=e.target.value;};$k('kit-note').oninput=e=>{draft.note=e.target.value;};
 $k('kit-price').oninput=e=>{draft.price=e.target.value===''?'':Number(e.target.value);totals();};
 $k('kit-save').onclick=persist;$k('kit-close').onclick=$k('kit-close-top').onclick=closeEditor;
 window.pkgRenderKits=()=>{if(!allowed())return;list();if(draftDB!==DB){draft=null;$k('kit-editor').hidden=true;modal.classList.remove('on');}else if(draft){rows();['kit-name','kit-price','kit-note','kit-save'].forEach(id=>$k(id).disabled=!editable());}document.getElementById('stkHint').textContent='จัดชุดอะไหล่ กำหนดจำนวนต่อชุดและราคาขาย · การสร้างหรือแก้ไขชุดไม่ตัดสต๊อก';};
 window.pkgRenderKitItems=rows;
 window.PKG_PRODUCT_PICKER.register('kit',{table:'kit-items',get:()=>draft,render:'pkgRenderKitItems',permission:'stock.edit',locked:()=>!editable(),title:'เลือกอะไหล่เข้าชุด',add:s=>add(s.id)});
 window.PKG_PARTS_KITS={open,add,save:persist,cost};
})();
