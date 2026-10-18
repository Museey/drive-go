/* Copy-only stock selection UI. Uses existing line shapes and calculation functions. */
(()=>{
 const configs={
  quote:{table:'qItems',info:'qLineInfo',get:()=>Q,render:'renderQItems',permission:'doc.docQuote',price:s=>priceByTier(s,Q.tier),line:s=>({...blankQLine('part'),stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,price:priceByTier(s,Q.tier),warr:s.warr||''})},
  receipt:{table:'rItems',info:'rLineInfo',get:()=>R,render:'calcReceipt',permission:'doc.rIssue',price:s=>priceByTier(s,rTier()),line:s=>({...blankRLine('part'),stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,price:priceByTier(s,rTier()),warr:s.warr||''})},
  claim:{table:'clItems',info:'clLineInfo',get:()=>C,render:'renderClaimItems',permission:'doc.docStock',line:s=>({...blankCLine(),stockId:s.id,code:s.code,name:s.name})},
  issue:{table:'isItems',info:'isLineInfo',get:()=>IS,render:'renderIssueItems',permission:'doc.docStock',line:s=>({...blankISLine(),stockId:s.id,code:s.code,name:s.name})}
 };
 const states={};let active=null,page=1,focusReturn=null;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const locked=c=>{const d=c.get();return !d||!!(d.deducted||d.cancelled)||!can(c.permission)||(c.locked&&c.locked());};
 const matches=(s,q)=>{const tokens=q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);const hay=[s.code,s.name,s.oem,s.brand].join(' ').toLocaleLowerCase();return tokens.every(t=>hay.includes(t));};
 const brand=s=>String(s.brand||'').trim();
 function closeQuick(st){st.list.hidden=true;st.quick.setAttribute('aria-expanded','false');st.quick.removeAttribute('aria-activedescendant');st.hi=-1;}
 function choose(key,id){
  const c=configs[key],st=states[key],s=DB.stock.find(x=>x.id===id);if(!s||locked(c))return false;
  if(c.add)c.add(s);else c.get().items.push(c.line(s));window[c.render]();st.quick.value='';st.exact.value='';closeQuick(st);
  st.message.textContent='เพิ่มรายการแล้ว';return true;
 }
 function quickRender(key){
  const st=states[key];st.message.textContent='';const q=st.quick.value.trim();
  st.list.replaceChildren();if(!q||locked(configs[key])){closeQuick(st);return;}
  st.found=DB.stock.filter(s=>matches(s,q)).sort((a,b)=>Number(String(b.code).toLowerCase()===q.toLowerCase())-Number(String(a.code).toLowerCase()===q.toLowerCase())).slice(0,5);st.hi=-1;
  st.found.forEach((s,i)=>{const b=el('button','pkg-product-option');b.type='button';b.id=`pkg-${key}-suggest-${i}`;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.dataset.noTranslate='';
   b.append(el('strong','',s.code+' · '+s.name),el('span','',[brand(s),`คงเหลือ ${qf(s.qty)} ${s.unit||''}`].filter(Boolean).join(' · ')));b.onclick=()=>{choose(key,s.id);st.quick.focus();};st.list.append(b);
  });
  if(!st.found.length)st.list.append(el('div','hint','ไม่พบสินค้า'));
  st.list.hidden=false;st.quick.setAttribute('aria-expanded','true');
 }
 function sync(key){
  const c=configs[key],st=states[key],d=c.get();if(!d)return;
  if(st.doc!==d){st.doc=d;st.quick.value='';st.exact.value='';st.message.textContent='';closeQuick(st);}
  st.root.hidden=locked(c);st.empty.hidden=d.items.length>0;st.selectedCount.textContent=d.items.length+' รายการ';
  const info=document.getElementById(c.info);if(info)info.textContent=`${d.items.length} รายการ`;
 }
 function register(key,c){
  configs[key]=c;
  const table=document.getElementById(c.table),root=el('div','pkg-product-tools');root.id='pkg-'+key+'-products';
  const quickLabel=el('label','pkg-product-quick'),quick=el('input'),list=el('div','pkg-product-suggestions');
  quickLabel.append(el('span','','ค้นหาสินค้าเร็ว'));quick.type='text';quick.placeholder='พิมพ์รหัส ชื่อสินค้า OEM หรือแบรนด์';quick.autocomplete='off';quick.id='pkg-'+key+'-quick';quick.setAttribute('role','combobox');quick.setAttribute('aria-autocomplete','list');quick.setAttribute('aria-expanded','false');
  list.id='pkg-'+key+'-suggestions';list.setAttribute('role','listbox');list.setAttribute('aria-label','สินค้าที่พบ');list.hidden=true;quick.setAttribute('aria-controls',list.id);quickLabel.append(quick,list);
  const exactLabel=el('label','pkg-product-exact'),pair=el('span','pkg-product-code'),exact=el('input'),open=el('button','btn gh');
  exactLabel.append(el('span','','รหัสสินค้าเต็ม / ค้นหาละเอียด'));exact.type='text';exact.autocomplete='off';exact.placeholder='พิมพ์รหัสเต็มแล้วกด Enter';exact.id='pkg-'+key+'-exact';open.type='button';open.className='btn pkg-mag-btn';open.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';   /* one magnifier everywhere (user 2026-10-09) */
  open.setAttribute('aria-label','ค้นหาสินค้าละเอียด');open.title='ค้นหาสินค้าละเอียด';pair.append(exact,open);exactLabel.append(pair);
  const message=el('div','hint pkg-product-message'),empty=el('div','empty');message.setAttribute('role','status');empty.textContent='ยังไม่มีรายการ — ค้นหาและเลือกสินค้าด้านบน';
  const scroll=table.parentElement,headingRow=scroll.previousElementSibling;
  if(headingRow)headingRow.querySelectorAll('.hint').forEach(h=>{if(h.textContent.includes('10'))h.textContent='ค้นหาและเลือกสินค้าเพื่อเพิ่มรายการ';});
  const section=el('section','pkg-product-section'),intro=el('div','pkg-product-intro'),searchTitle=el('h3','',c.title||(key==='quote'?'เลือกสินค้าเพื่อเสนอราคา':'เลือกสินค้าเข้าเอกสาร'));
  intro.append(searchTitle,el('p','','ค้นหาสินค้าด้านล่าง แล้วกดเลือก · รายการที่เลือกจะแสดงในกรอบถัดไป'));
  root.append(intro,quickLabel,exactLabel,message);
  const selected=el('div','pkg-product-selected'),selectedHead=el('div','pkg-product-selected-head'),selectedCount=el('span','pkg-product-selected-count','0 รายการ');
  selectedHead.append(el('h3','','รายการที่เลือกแล้ว'),selectedCount);
  scroll.before(section);section.append(root,selected);selected.append(selectedHead,scroll,empty);
  empty.textContent='ยังไม่มีรายการสินค้า — เริ่มค้นหาและเลือกจากช่องด้านบน';
  const st=states[key]={root,quick,exact,list,message,empty,selectedCount,hi:-1,found:[],doc:null};
  quick.oninput=()=>quickRender(key);quick.onfocus=()=>{if(quick.value)quickRender(key);};
  quick.onkeydown=e=>{if(e.key==='Escape'){closeQuick(st);return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)quickRender(key);if(!st.found.length)return;st.hi=(st.hi+(e.key==='ArrowDown'?1:-1)+st.found.length)%st.found.length;[...list.querySelectorAll('button')].forEach((b,i)=>{b.classList.toggle('on',i===st.hi);b.setAttribute('aria-selected',String(i===st.hi));});quick.setAttribute('aria-activedescendant',list.children[st.hi].id);}else if(e.key==='Enter'){e.preventDefault();if(!list.hidden&&st.hi>=0)choose(key,st.found[st.hi].id);}};
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))closeQuick(st);});
  exact.onkeydown=e=>{if(e.key!=='Enter')return;e.preventDefault();if(locked(c))return;const code=exact.value.trim().toLowerCase();const found=code?DB.stock.filter(s=>String(s.code||'').trim().toLowerCase()===code):[];if(found.length===1)choose(key,found[0].id);else message.textContent=found.length?'พบรหัสซ้ำ กรุณาเลือกจากค้นหาละเอียด':'ไม่พบรหัสสินค้าตรงกัน กรุณาพิมพ์รหัสเต็ม';};
  open.onclick=()=>openDetail(key);
  const old=window[c.render];window[c.render]=function(){const result=old.apply(this,arguments);sync(key);return result;};

 }
 for(const [key,c] of Object.entries(configs))register(key,c);
 document.addEventListener('pointerdown',e=>Object.values(states).forEach(st=>{if(!st.root.contains(e.target))closeQuick(st);}));
 // Keep explicit service lines; stock buttons open the detailed chooser.
 for(const [name,key] of [['addQLine','quote'],['addRLine','receipt'],['addClaimLine','claim'],['addIssueLine','issue']]){
  const old=window[name];window[name]=function(type){if(locked(configs[key]))return;if(type==='labor')return old.apply(this,arguments);openDetail(key);};
  document.querySelectorAll(`button[onclick^="${name}"]`).forEach(b=>{if(!b.getAttribute('onclick').includes("'labor'")){b.hidden=true;b.classList.add('pkg-product-obsolete');}});
 }
 // Native dialog sits above the existing document modal and supports Escape/focus return.
 const dialog=el('dialog','pkg-product-dialog');dialog.id='pkg-product-dialog';dialog.setAttribute('aria-labelledby','pkg-product-title');
 const head=el('header'),title=el('h2','','ค้นหาสินค้าละเอียด'),close=el('button','btn gh','ปิด');title.id='pkg-product-title';close.type='button';head.append(title,close);
 const selectionNotice=el('div','pkg-product-selection-notice','เลือกได้หลายรายการ เมื่อครบแล้วกดปิด');selectionNotice.setAttribute('role','status');
 const filters=el('div','pkg-product-filters');
 function filter(label,id,tag){const l=el('label'),input=el(tag);input.id=id;l.append(el('span','',label),input);filters.append(l);return input;}
 const query=filter('ค้นหาในรายการ','pkg-product-query','input');query.type='search';query.placeholder='รหัส ชื่อสินค้า OEM หรือแบรนด์';
 /* หมวดสินค้า · แบรนด์สินค้า · จำนวนคงเหลือ = the shared filter row of product-brand.js (PKG_PFILTER, user 2026-10-11). That module
    loads after this one, so the row is mounted the first time the dialog opens; the two selects keep their old ids. */
 let pf=null;const pfilter=()=>pf||(pf=window.PKG_PFILTER?PKG_PFILTER.mount(filters,{before:query.parentElement,ids:{cat:'pkg-product-category',brand:'pkg-product-brand'},also:s=>matches(s,query.value),onChange:()=>{page=1;renderDetail();}}):null);
 const count=el('div','hint'),results=el('div','pkg-product-results'),pager=el('div','pkg-product-pager');count.setAttribute('role','status');
 const prev=el('button','btn gh','ก่อนหน้า'),pageText=el('span'),next=el('button','btn gh','ถัดไป');prev.type=next.type='button';pager.append(prev,pageText,next);dialog.append(head,selectionNotice,filters,count,results,pager);document.getElementById('pkg-app').append(dialog);
 function openDetail(key){if(locked(configs[key]))return;active=key;selectionNotice.textContent='เลือกได้หลายรายการ เมื่อครบแล้วกดปิด';focusReturn=document.activeElement;page=1;query.value='';const f=pfilter();if(f)f.reset();renderDetail();if(!dialog.open)dialog.showModal();(f?f.el.querySelector('select'):query).focus();}
 function renderDetail(){
  if(!active)return;const c=configs[active],f=pfilter();let found=DB.stock.filter(s=>(!f||f.test(s))&&matches(s,query.value));if(f)f.refresh();
  const pages=Math.max(1,Math.ceil(found.length/20));page=Math.min(page,pages);count.textContent=found.length+' รายการ';pageText.textContent=page+' / '+pages;prev.disabled=page<=1;next.disabled=page>=pages;results.replaceChildren();
  found.slice((page-1)*20,page*20).forEach(s=>{const row=el('div','pkg-product-result'),data=el('div'),name=el('strong','',s.code+' · '+s.name),detail=el('span','',[(s.cat||'อื่น ๆ'),brand(s),s.oem?'OEM '+s.oem:'',`คงเหลือ ${qf(s.qty)} ${s.unit||''}`,c.price?'ราคา '+money(c.price(s))+' บาท':''].filter(Boolean).join(' · '));data.dataset.noTranslate='';data.append(name,detail);const add=el('button','btn pri','เลือก');add.type='button';add.disabled=locked(c);add.setAttribute('aria-label','เลือก '+s.code);const showSelected=()=>{const selected=configs[active].get().items.filter(it=>it.stockId===s.id).length;row.classList.toggle('pkg-product-picked',selected>0);add.textContent=selected?'เพิ่มอีก':'เลือก';};showSelected();
   add.onclick=()=>{if(choose(active,s.id)){showSelected();selectionNotice.textContent='เพิ่ม '+s.code+' แล้ว · ในเอกสารมี '+configs[active].get().items.length+' รายการ · เลือกต่อได้ หรือกดปิดเมื่อครบ';}};row.append(data,add);results.append(row);});
  if(!found.length)results.append(el('div','empty','ไม่พบสินค้า'));
 }
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(focusReturn?.isConnected)focusReturn.focus();});
 query.oninput=()=>{page=1;renderDetail();};prev.onclick=()=>{page--;renderDetail();};next.onclick=()=>{page++;renderDetail();};
 window.PKG_PRODUCT_PICKER={open:openDetail,choose,sync,configs,register};
})();
