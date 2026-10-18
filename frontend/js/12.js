/* Kits in 03 quotes / 04 receipts / 4.4 retail, price-edit permission, and the linear quote → receipt flow.
   A kit is one document line {type:'kit'} with a component snapshot; stock posting expands it (pkgStockLines). */
(()=>{
 const picker=window.PKG_PRODUCT_PICKER,editors={quote:{doc:()=>Q,render:'renderQItems',body:'qItems',stockCol:7},receipt:{doc:()=>R,render:'calcReceipt',body:'rItems',stockCol:-1}};
 const kits=()=>Array.isArray(DB.partsKits)?DB.partsKits:[];
 const stockOf=k=>DB.stock.find(s=>s.id===k.stockId);
 const makeable=line=>(line.kitItems||[]).reduce((m,k)=>{const s=stockOf(k);return Math.min(m,s&&n(k.qty)>0?Math.max(0,Math.floor(n(s.qty)/n(k.qty))):0);},(line.kitItems||[]).length?Infinity:0);
 const locked=key=>{const c=picker.configs[key],d=c.get();return !d||!!(d.deducted||d.cancelled)||!can(c.permission)||(c.locked&&c.locked());};
 /* Linear flow: a 4.1 receipt drawn from a quote cannot add/remove lines. */
 picker.configs.receipt.locked=()=>!!(R&&R.quoteId);
 function snapshot(kit){return kit.items.map(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return{stockId:it.stockId,code:s?.code||it.code||'',name:s?.name||it.name||'',unit:s?.unit||'',qty:n(it.qty)};});}
 function addKit(key,id){
  const kit=kits().find(k=>k.id===id),d=editors[key].doc();if(!kit||!d||locked(key))return false;
  if(kit.items.some(it=>!DB.stock.some(s=>s.id===it.stockId))){toast('ชุด '+kit.name+' มีอะไหล่ที่ถูกลบจากทะเบียน กรุณาแก้ไขชุดก่อน');return false;}
  const same=d.items.find(it=>it.type==='kit'&&it.kitId===kit.id);
  if(same)same.qty=n(same.qty)+1;
  else{const i=d.items.findIndex(it=>!qFilled(it)),line={type:'kit',kitId:kit.id,code:'',oem:'',name:kit.name,qty:1,price:n(kit.price),stockId:'',warr:'',kitItems:snapshot(kit)};
   if(i>=0)d.items.splice(i,0,line);else d.items.push(line);}
  window[editors[key].render]();return true;
 }
 function search(key,q){
  q=q.trim().toLocaleLowerCase();if(!q)return[];
  return kits().filter(k=>[k.name,k.note,...k.items.map(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return(s?.code||it.code||'')+' '+(s?.name||it.name||'');})].join(' ').toLocaleLowerCase().includes(q)).slice(0,8);
 }
 function mount(key){
  const root=document.getElementById('pkg-'+key+'-products');if(!root)return;
  const wrap=document.createElement('label');wrap.className='pkg-product-quick pkg-kit-quick';
  wrap.innerHTML=`<span>ค้นหาชุดอะไหล่ซ่อมบำรุง (แยกจากสินค้าปกติ)</span><input type="text" id="pkg-${key}-kit" placeholder="พิมพ์ชื่อชุด หรือรหัสอะไหล่ในชุด" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="pkg-${key}-kit-list"><div class="pkg-product-suggestions" id="pkg-${key}-kit-list" role="listbox" hidden></div>`;
  root.querySelector('.pkg-product-message')?.before(wrap);
  const input=wrap.querySelector('input'),list=wrap.querySelector('[role=listbox]');
  const pair=document.createElement('span');pair.className='pkg-product-code pkg-kit-pair';input.before(pair);pair.append(input);
  const find=document.createElement('button');find.type='button';find.className='btn pkg-mag-btn';find.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';find.title='เลือกจากตารางชุดอะไหล่ทั้งหมด';find.setAttribute('aria-label','เปิดตารางชุดอะไหล่');
  pair.append(find);find.onclick=e=>{e.preventDefault();openKitTable(key);};
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');};
  input.oninput=()=>{
   list.replaceChildren();const found=search(key,input.value);if(!input.value.trim()){close();return;}
   found.forEach(kit=>{const b=document.createElement('button');b.type='button';b.className='pkg-product-option';b.setAttribute('role','option');b.dataset.noTranslate='';
    const m=makeable({kitItems:snapshot(kit)});
    b.innerHTML=`<strong>${esc(kit.name)}</strong><span>${kit.items.length} รายการ · ${n(kit.price)>0?money(kit.price)+' บาท':'ยังไม่ตั้งราคา'} · ${m>0?'ทำได้ '+qf(m)+' ชุด':'สต๊อกไม่พอ'}</span>`;
    b.onclick=()=>{if(addKit(key,kit.id)){input.value='';close();root.querySelector('.pkg-product-message').textContent='เพิ่มชุด '+kit.name+' แล้ว';}};list.append(b);});
   if(!found.length){const e=document.createElement('div');e.className='hint';e.textContent='ไม่พบชุดอะไหล่';list.append(e);}
   list.hidden=false;input.setAttribute('aria-expanded','true');
  };
  input.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Enter'){e.preventDefault();list.querySelector('button')?.click();}};
  wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))setTimeout(close,120);});
  /* Per-document choice: print the kit's parts under its line or not. */
  const head=root.parentElement.querySelector('.pkg-product-selected-head'),opt=document.createElement('label');
  opt.className='pkg-kit-print';opt.hidden=true;opt.innerHTML=`<input type="checkbox" id="pkg-${key}-kit-detail"> พิมพ์รายการอะไหล่ในชุด`;head.append(opt);
  opt.querySelector('input').onchange=e=>{const d=editors[key].doc();if(d)d.kitDetail=e.target.checked;};
 }
 /* After each original render: kit rows become read-only name + components; price inputs follow editPrice. */
 function decorate(key){
  const d=editors[key].doc();if(!d)return;const rows=document.querySelectorAll('#'+editors[key].body+' tbody tr'),mayPrice=can('doc.editPrice');
  d.items.forEach((it,i)=>{
   const tr=rows[i];if(!tr||it.type!=='kit')return;
   tr.classList.add('pkg-kit-line');tr.children[1].innerHTML='<span class="chip a">ชุดอะไหล่</span>';
   const nameCell=key==='quote'?tr.children[3]:tr.children[2];
   nameCell.innerHTML=`<b>${esc(it.name)}</b><div class="hint">${(it.kitItems||[]).map(k=>esc(k.code)+' × '+qf(n(k.qty)*n(it.qty))).join(' · ')}</div>`;
   if(editors[key].stockCol>=0){const m=makeable(it),short=n(it.qty)>m;const c=tr.children[editors[key].stockCol];c.textContent=(m===Infinity?'-':'ทำได้ '+qf(m)+' ชุด')+(short?' ⚠':'');c.style.color=short?'var(--danger)':'';c.style.fontWeight=short?'600':'';}
  });
  const priceSel=key==='quote'?'.qprice':'.rprice';
  document.querySelectorAll('#'+editors[key].body+' '+priceSel).forEach(el=>{if(!mayPrice){el.disabled=true;el.title='บัญชีนี้ไม่มีสิทธิ์แก้ไขราคาขาย';}});
  const box=document.getElementById('pkg-'+key+'-kit-detail');
  if(box){box.checked=!!d.kitDetail;box.closest('label').hidden=!d.items.some(it=>it.type==='kit');}
  if(key==='receipt'&&R.quoteId&&!R.deducted){
   document.querySelectorAll('#rItems .rwarr').forEach(el=>el.oninput=e=>{R.items[+e.target.dataset.i].warr=e.target.value;renderRPrev();});
   const li=document.getElementById('rLineInfo');if(li)li.textContent='รายการดึงจากใบเสนอราคา '+(findQuote(R.quoteId)?.no||'')+' — แก้ไขรายการที่ใบเสนอราคาเท่านั้น (แก้ได้เฉพาะรับประกัน)';
  }
 }

 /* Kit table: every maintenance kit with its parts, price and stock readiness; stays open for several picks. */
 const dlg=document.createElement('dialog');dlg.className='pkg-product-dialog pkg-kit-dialog';dlg.id='pkg-kit-dialog';dlg.setAttribute('aria-labelledby','pkg-kit-dialog-title');
 dlg.innerHTML=`<header><h2 id="pkg-kit-dialog-title">เลือกชุดอะไหล่ซ่อมบำรุง</h2><button type="button" class="btn gh" data-k="close">ปิด</button></header>
  <div class="pkg-product-selection-notice" id="pkg-kit-notice">เลือกได้หลายชุด เมื่อครบแล้วกดปิด</div>
  <div class="pkg-product-filters"><label><span>ค้นหาในตาราง</span><input type="search" id="pkg-kit-q" placeholder="ชื่อชุด หรือรหัสอะไหล่ในชุด"></label></div>
  <div class="hint" id="pkg-kit-count"></div>
  <div class="scroll"><table class="tbl pkg-kit-table"><thead><tr><th>ชื่อชุดอะไหล่</th><th>อะไหล่ในชุด</th><th class="num">ราคาขาย / ชุด</th><th class="ctr">สต๊อกพร้อมทำ</th><th class="ctr">เลือก</th></tr></thead><tbody></tbody></table></div>`;
 document.getElementById('pkg-app').append(dlg);
 let dlgKey=null,dlgReturn=null;
 function drawKitTable(){
  const q=dlg.querySelector('#pkg-kit-q').value.trim(),rows=q?search(dlgKey,q):kits().slice(),d=editors[dlgKey].doc(),lock=locked(dlgKey);
  const body=dlg.querySelector('tbody');body.innerHTML='';
  dlg.querySelector('#pkg-kit-count').textContent=rows.length+' ชุด';
  rows.forEach(kit=>{const snap=snapshot(kit),m=makeable({kitItems:snap}),inDoc=d&&d.items.find(it=>it.type==='kit'&&it.kitId===kit.id),tr=document.createElement('tr');
   tr.innerHTML=`<td><b>${esc(kit.name)}</b>${kit.note?`<div class="hint">${esc(kit.note)}</div>`:''}</td><td class="hint">${snap.map(k=>esc(k.code)+' × '+qf(k.qty)).join(' · ')}</td>
    <td class="num">${n(kit.price)>0?money(kit.price):'<span class="stbtn st-orange">ยังไม่ตั้งราคา</span>'}</td>
    <td class="ctr">${m>0?`<span class="stbtn st-green">ทำได้ ${qf(m)} ชุด</span>`:'<span class="stbtn st-red">สต๊อกไม่พอ</span>'}</td>
    <td class="ctr"><button type="button" class="btn ${inDoc?'':'pri'} sm" data-add="${kit.id}" ${lock?'disabled':''}>${inDoc?'เพิ่มอีก 1 ชุด':'เลือก'}</button>${inDoc?`<div class="hint">ในเอกสาร ${qf(inDoc.qty)} ชุด</div>`:''}</td>`;
   body.append(tr);});
  if(!rows.length)body.innerHTML='<tr><td colspan="5" class="empty">ไม่พบชุดอะไหล่ · สร้างชุดได้ที่เมนู 07 ชุดอะไหล่ซ่อมบำรุง</td></tr>';
 }
 function openKitTable(key){if(locked(key))return;dlgKey=key;dlgReturn=document.activeElement;dlg.querySelector('#pkg-kit-q').value='';dlg.querySelector('#pkg-kit-notice').textContent='เลือกได้หลายชุด เมื่อครบแล้วกดปิด';drawKitTable();if(!dlg.open)dlg.showModal();dlg.querySelector('#pkg-kit-q').focus();}
 dlg.querySelector('#pkg-kit-q').oninput=drawKitTable;
 dlg.addEventListener('click',e=>{
  if(e.target.closest('[data-k="close"]'))return dlg.close();
  const id=e.target.closest('[data-add]')?.dataset.add;if(!id)return;
  if(addKit(dlgKey,id)){const kit=kits().find(k=>k.id===id);dlg.querySelector('#pkg-kit-notice').textContent='เพิ่ม '+kit.name+' แล้ว · เลือกต่อได้ หรือกดปิดเมื่อครบ';drawKitTable();}
 });
 dlg.addEventListener('close',()=>{if(dlgReturn?.isConnected)dlgReturn.focus();});
 for(const key of Object.keys(editors)){
  mount(key);const name=editors[key].render,old=window[name];
  window[name]=function(){const out=old.apply(this,arguments);decorate(key);return out;};
 }
 const loadOriginal=loadFromQuote;
 loadFromQuote=function(q){const out=loadOriginal.apply(this,arguments);R.kitDetail=!!q.kitDetail;calcReceipt();return out;};
 /* Linear flow: a 4.1 receipt must come from a quote; counter sales use 4.4. A new receipt from a quote always
    carries exactly the quote's lines (warranty entered on the receipt is kept). */
 const saveOriginal=saveReceipt;
 saveReceipt=async function(){
  if(R&&!R.cancelled&&R.salesChannel!=='retail'&&!DB.receipts.some(x=>x.id===R.id)){
   if(!R.quoteId&&!R.saleId)return toast('ใบเสร็จต้องดึงจากใบเสนอราคาที่อนุมัติแล้ว หรือออกจากใบตัดสต็อก (4.4) — ขายสินค้าหน้าร้านให้ใช้เมนู 4.4');
   const q=findQuote(R.quoteId);
   if(q){const filled=rItemsClean(R);R.items=qItemsClean(q).map((it,i)=>({...it,warr:(filled[i]&&filled[i].warr)||it.warr||''}));}
  }
  return saveOriginal.apply(this,arguments);
 };
 const newOriginal=newReceipt;
 newReceipt=function(){const out=newOriginal.apply(this,arguments);toast('เลือกใบเสนอราคาที่อนุมัติแล้วในช่อง “ดึงจากใบเสนอราคา” — ใบเสร็จ 4.1 ต้องอ้างใบเสนอราคา');return out;};
 /* another editor (4.4 ตัดสต็อกสินค้า, stock-cut.js) joins after load: same kit search, table and line display */
 function register(key,ed){editors[key]=ed;mount(key);const name=ed.render,old=window[name];window[name]=function(){const out=old.apply(this,arguments);decorate(key);return out;};}
 window.PKG_KIT_SALES={add:addKit,search,makeable,openTable:openKitTable,register};
})();
