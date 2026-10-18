/* Product BRAND + the three product filters in every product search (user 2026-10-11; mockups/claim-search.html).
   · DB.stock[].brand (string, '' = ไม่ระบุแบรนด์) and DB.partBrands (the shop's brand names; DB.brands is CAR makes — not
     reused). Reading never writes: a brand a product carries that is not in the list yet still shows everywhere (names()),
     and joins the list at the next product save / import / list edit (adopt()).
   · Product form (mStock): "แบรนด์สินค้า" select + "+ เพิ่มแบรนด์" under หมวด. The text box of the earlier build step
     (#pkg-stock-brand, read by saveStock) stays as the value carrier, hidden.
   · PKG_PFILTER — ONE filter row for every product search: หมวดสินค้า · แบรนด์สินค้า · จำนวนคงเหลือ (ทั้งหมด / มากกว่า 0 /
     เท่ากับ 0). mount(host,{onChange,rows,also,ids,before}) → {el,state,test,refresh,reset,set,active};
     test(stockRec,state) and match(stockRec,text) (code / OEM / name / brand, every word) are the shared logic.
     Mounted in: mClPull (here), mGrFind (here), the package product dialog (product-picker.js).
   · mClPull "หยิบรายการเข้าใบเคลม" rebuilt from the mockup; adding still goes through the original clPullAdd(i).
   · 07 register: brand = a small grey line under the product name (the register's columns are index-based: widths, order,
     sort — a new column would shift every stored layout); Excel / PDF get a real "แบรนด์" column (PKG_REG_EXPORT.extend).
   Rights: the list is edited with stock.edit; the filters are open to whoever can open the search. */
(()=>{
 if(typeof DB==='undefined'||typeof renderStock!=='function'||typeof can!=='function')return;
 const $i=id=>document.getElementById(id);
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const NONE='__none',COL='แบรนด์สินค้า';
 const key=v=>String(v==null?'':v).replace(/\s+/g,' ').trim().toLowerCase();
 const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
 const brandOf=s=>clean(s&&s.brand);
 const catOf=s=>(s&&s.cat)||'อื่น ๆ';
 const may=()=>can('stock.edit');
 const IC_S='<i class="pkg-ic-s" aria-hidden="true"></i>';

 /* ---------- brand list ---------- */
 const stored=()=>Array.isArray(DB.partBrands)?DB.partBrands:[];
 const own=()=>{if(!Array.isArray(DB.partBrands))DB.partBrands=[];return DB.partBrands;};
 /* every brand name there is: the list, then what products carry (first spelling wins) — never writes */
 function names(){const seen=new Set(),out=[];const put=b=>{b=clean(b);const k=key(b);if(b&&!seen.has(k)){seen.add(k);out.push(b);}};
  stored().forEach(put);(DB.stock||[]).forEach(s=>put(s.brand));return out.sort((a,b)=>a.localeCompare(b,'th'));}
 const find=v=>names().find(b=>key(b)===key(v))||'';
 const use=b=>(DB.stock||[]).filter(s=>key(s.brand)===key(b)).length;
 /* the list takes in every brand the products carry; products take the list's spelling. true = something changed */
 function adopt(){const L=own();let ch=false;
  (DB.stock||[]).forEach(s=>{const b=brandOf(s);if(!b){if(s.brand!==undefined&&s.brand!==''){s.brand='';ch=true;}return;}
   const hit=L.find(x=>key(x)===key(b));if(!hit){L.push(b);if(s.brand!==b)s.brand=b;ch=true;}else if(s.brand!==hit){s.brand=hit;ch=true;}});
  return ch;}
 function add(v){v=clean(v);if(!v)return{err:'พิมพ์ชื่อแบรนด์ที่ต้องการเพิ่ม'};
  const hit=find(v);if(hit){if(!own().some(x=>key(x)===key(hit)))own().push(hit);return{name:hit,dup:true};}
  own().push(v);return{name:v};}
 function rename(o,v){v=clean(v);if(!v)return 'พิมพ์ชื่อแบรนด์';const other=names().find(b=>key(b)===key(v)&&key(b)!==key(o));if(other)return 'มีแบรนด์ “'+other+'” อยู่แล้ว';
  const L=own(),i=L.findIndex(b=>key(b)===key(o));if(i>=0)L[i]=v;else L.push(v);
  (DB.stock||[]).forEach(s=>{if(key(s.brand)===key(o))s.brand=v;});}
 function del(v){if(use(v))return 'แบรนด์นี้ยังมีสินค้าใช้อยู่';DB.partBrands=own().filter(b=>key(b)!==key(v));}
 /* the "แบรนด์สินค้า" section of the 07 settings window (stock-settings.js reads this object) */
 const sec={label:'ชื่อแบรนด์สินค้า',ph:'เช่น Denso, Bosch',noun:'รายการ',kind:'stock',
  items:()=>names().map(v=>({v,std:false})),use,norm:clean,
  add:v=>{const r=add(v);if(r.err)return r.err;if(r.dup)return 'มีแบรนด์ “'+r.name+'” อยู่แล้ว';changed();},
  rename:(o,v)=>{const e=rename(o,v);if(e)return e;changed();},
  del:v=>{const e=del(v);if(e)return e;changed();}};

 /* ---------- shared filter row ---------- */
 const QTY=[['all','ทั้งหมด'],['gt','มากกว่า 0'],['eq','เท่ากับ 0']];
 /* one product against the three filters; skip = leave that filter out (for the counts beside each option).
    "เท่ากับ 0" = nothing left: 0 or below, so the two choices together always cover every product */
 function pass(s,st,skip,qtyOf){
  if(!s||!st)return !!s;
  if(skip!=='cat'&&st.cat&&catOf(s)!==st.cat)return false;
  if(skip!=='brand'&&st.brand){const b=key(brandOf(s));if(st.brand===NONE?!!b:b!==key(st.brand))return false;}
  if(skip!=='qty'&&st.qty&&st.qty!=='all'){const q=qtyOf?qtyOf(s):n(s.qty);if(st.qty==='gt'?!(q>0):q>0)return false;}
  return true;}
 const test=(s,st,o)=>pass(s,st||{},'',o&&o.qty);
 /* free text: every typed word must be somewhere in code / OEM / name / brand */
 function match(s,text){const t=String(text||'').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);if(!t.length)return true;
  const hay=[s.code,s.oem,s.name,s.brand].map(v=>String(v==null?'':v)).join(' ').toLocaleLowerCase();return t.every(w=>hay.includes(w));}
 let seq=0;const mounted=new Set();
 function mount(host,opt){
  opt=opt||{};const id=++seq,ids=opt.ids||{},state={cat:'',brand:'',qty:'all'};
  const el=document.createElement('div');el.className='pkg-pf';el.setAttribute('role','group');el.setAttribute('aria-label','ตัวกรองสินค้า');
  el.innerHTML=`<label class="pkg-pf-f"><span>หมวดสินค้า</span><select data-pf="cat"${ids.cat?` id="${ids.cat}"`:''}></select></label>
   <label class="pkg-pf-f"><span>${COL}</span><select data-pf="brand"${ids.brand?` id="${ids.brand}"`:''}></select></label>
   <div class="pkg-pf-f pkg-pf-q"><span id="pkgPfQ${id}">จำนวนคงเหลือ</span><div class="pkg-pf-opts" role="radiogroup" aria-labelledby="pkgPfQ${id}">${QTY.map(([v,t])=>`<label><input type="radio" name="pkgPfQty${id}" value="${v}"${v==='all'?' checked':''}><span>${t}</span></label>`).join('')}</div></div>`;
  const selC=el.querySelector('[data-pf="cat"]'),selB=el.querySelector('[data-pf="brand"]'),radios=[...el.querySelectorAll('input[type="radio"]')];
  const rows=()=>opt.rows?opt.rows():(DB.stock||[]);
  const fillSel=(sel,list,val)=>{sel.replaceChildren(...list.map(([v,t],i)=>{const o=document.createElement('option');o.value=v;o.textContent=t;if(i)o.dataset.noTranslate='';return o;}));
   sel.value=list.some(([v])=>v===val)?val:'';sel.classList.toggle('on',!!sel.value);return sel.value;};
  /* the number beside each option = products left under the OTHER conditions (and the place's own text search) */
  function fill(){
   const cc={},bc={};let none=0;
   rows().forEach(s=>{if(!s||(opt.also&&!opt.also(s)))return;
    if(pass(s,state,'cat',opt.qty)){const c=catOf(s);cc[c]=(cc[c]||0)+1;}
    if(pass(s,state,'brand',opt.qty)){const b=key(brandOf(s));if(b)bc[b]=(bc[b]||0)+1;else none++;}});
   const cats=[...new Set([...(typeof CATS!=='undefined'?CATS:[]),...(DB.stock||[]).map(catOf)])];
   state.cat=fillSel(selC,[['','เลือกทั้งหมด'],...cats.map(c=>[c,c+' ('+(cc[c]||0)+')'])],state.cat);
   const list=[['','เลือกทั้งหมด'],...names().map(b=>[b,b+' ('+(bc[key(b)]||0)+')']),[NONE,'ไม่ระบุแบรนด์ ('+none+')']];
   if(state.brand&&state.brand!==NONE){const hit=list.find(([v])=>key(v)===key(state.brand));state.brand=hit?hit[0]:'';}
   state.brand=fillSel(selB,list,state.brand);
   radios.forEach(r=>{r.checked=r.value===state.qty;});
  }
  const fire=()=>{fill();if(opt.onChange)opt.onChange(state);};
  selC.addEventListener('change',()=>{state.cat=selC.value;fire();});
  selB.addEventListener('change',()=>{state.brand=selB.value;fire();});
  radios.forEach(r=>r.addEventListener('change',()=>{if(r.checked){state.qty=r.value;fire();}}));
  if(opt.before&&opt.before.parentElement===host)host.insertBefore(el,opt.before);else host.append(el);
  const api={el,state,refresh:fill,test:s=>pass(s,state,'',opt.qty),active:()=>!!(state.cat||state.brand||state.qty!=='all'),
   reset(){state.cat='';state.brand='';state.qty='all';fill();},set(o){Object.assign(state,o||{});fill();}};
  mounted.add(api);fill();return api;
 }
 /* the brand list changed: every place that offers it follows */
 function changed(){
  mounted.forEach(m=>{if(m.el.isConnected)try{m.refresh();}catch(e){}});
  if(window.PKG_REG_FILTER&&PKG_REG_FILTER.build)try{PKG_REG_FILTER.build('stockTbl');}catch(e){}
  try{fillForm();}catch(e){}
 }
 const chip=s=>brandOf(s)?`<span class="pkg-pb-chip" data-no-translate>${esc2(brandOf(s))}</span>`:'<span class="pkg-pb-chip none">ไม่ระบุ</span>';

 /* ---------- product form (mStock): แบรนด์สินค้า under หมวด ---------- */
 const carrier=$i('pkg-stock-brand'),fCat=$i('fCat');let fSel=null,fNew=null,fAdd=null;
 function fillForm(v){if(!fSel)return;if(v===undefined)v=fSel.value;const list=names(),cur=clean(v),hit=list.find(b=>key(b)===key(cur));
  fSel.replaceChildren(...[['','ไม่ระบุแบรนด์'],...list.map(b=>[b,b]),...(cur&&!hit?[[cur,cur]]:[])].map(([val,t],i)=>{const o=document.createElement('option');o.value=val;o.textContent=t;if(i)o.dataset.noTranslate='';return o;}));
  fSel.value=hit||cur||'';}
 if(carrier&&fCat&&typeof openStock==='function'){
  const catRow=fCat.closest('.row'),box=catRow.closest('.permbox'),h4=box&&box.querySelector('h4');
  carrier.closest('label').classList.add('pkg-pb-old');carrier.closest('label').hidden=true;   /* the old free-text box: still what saveStock reads */
  if(h4&&/หมวดอะไหล่\s*$/.test(h4.textContent))h4.textContent=h4.textContent.replace(/หมวดอะไหล่\s*$/,'หมวดอะไหล่และแบรนด์สินค้า');
  const cap=t=>{const d=document.createElement('div');d.className='pkg-pb-cap';d.textContent=t;return d;};
  const row=document.createElement('div');row.className='row pkg-pb-form';row.style.gap='8px';
  row.innerHTML=`<select id="pkgPbSel" style="flex:1.2" aria-label="${COL}"></select><input type="text" id="pkgPbNew" placeholder="เพิ่มแบรนด์ใหม่ เช่น Denso" style="flex:1.5" autocomplete="off" aria-label="ชื่อแบรนด์ใหม่"><button type="button" class="btn sm gh" id="pkgPbAdd">+ เพิ่มแบรนด์</button>`;
  catRow.before(cap('หมวดอะไหล่'));catRow.after(cap(COL),row);
  fSel=$i('pkgPbSel');fNew=$i('pkgPbNew');fAdd=$i('pkgPbAdd');
  fSel.addEventListener('change',()=>{carrier.value=fSel.value;});
  const quick=()=>{if(!may())return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม / แก้ไขสินค้า');const r=add(fNew.value);if(r.err)return toast(r.err);
   if(!r.dup&&typeof logAudit==='function')logAudit('stock',{no:r.name},'save','เพิ่มแบรนด์สินค้า “'+r.name+'”');
   save();changed();fillForm(r.name);carrier.value=r.name;fNew.value='';toast(r.dup?'มีแบรนด์ “'+r.name+'” อยู่แล้ว — เลือกให้แล้ว':'เพิ่มแบรนด์ “'+r.name+'” แล้ว');};
  fAdd.addEventListener('click',quick);fNew.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();quick();}});
  const oOpen=window.openStock;window.openStock=function(){const r=oOpen.apply(this,arguments);try{fillForm(carrier.value);fNew.value='';fAdd.disabled=!may();}catch(e){}return r;};
  /* a brand that reached a product another way (old text box, import) joins the list when the product is saved */
  const oSave=window.saveStock;window.saveStock=function(){const r=oSave.apply(this,arguments);try{if(adopt()){save();renderStock();}changed();}catch(e){}return r;};
 }
 if(typeof upsertStockFromImport==='function'){const o=window.upsertStockFromImport;window.upsertStockFromImport=function(){const r=o.apply(this,arguments);try{adopt();}catch(e){}return r;};}

 /* ---------- CSV import (11.3): optional 13th column "แบรนด์สินค้า"; a file without it imports as before ---------- */
 if(typeof impStockForm==='function'){const o=window.impStockForm;
  window.impStockForm=function(){const cd=window.csvDownload;
   window.csvDownload=function(name,rows){window.csvDownload=cd;if(Array.isArray(rows)&&Array.isArray(rows[0])&&!rows[0].includes(COL)){rows[0].push(COL);rows.slice(1).forEach(r=>r.push('Denso'));}return cd.call(this,name,rows);};
   try{return o.apply(this,arguments);}finally{window.csvDownload=cd;}};}
 if(typeof impStockApply==='function'){const o=window.impStockApply;
  window.impStockApply=async function(rows){
   const had=new Set((DB.stock||[]).map(s=>s.id)),by={};
   (Array.isArray(rows)?rows:[]).forEach(r=>{if(!Array.isArray(r))return;const code=key(r[0]),name=clean(r[2]),b=clean(r[12]);if(code&&name&&b&&!(code in by))by[code]=b;});
   const out=await o.apply(this,arguments);
   let ch=false;(DB.stock||[]).forEach(s=>{if(had.has(s.id))return;const b=by[key(s.code)];if(b&&!brandOf(s)){s.brand=b;ch=true;}});
   if(adopt())ch=true;
   if(ch){save();changed();try{renderStock();}catch(e){}}
   return out;};}

 /* ---------- 07 register: grey line under the name, search text, filter dropdown, Excel / PDF column ---------- */
 const rowStock=tr=>{const id=tr.dataset.pkgKey;let s=id&&(DB.stock||[]).find(x=>x.id===id);
  if(!s){const c=tr.querySelector('.codechip');const code=c&&c.textContent.trim();s=code&&(DB.stock||[]).find(x=>x.code===code);}return s||null;};
 function paintReg(){document.querySelectorAll('#stockTbl tbody tr').forEach(tr=>{const td=tr.querySelector('td.sc-name');if(!td||td.querySelector('.pkg-pb-line'))return;
  const s=rowStock(tr),b=s&&brandOf(s);if(!b)return;const d=document.createElement('div');d.className='hint pkg-pb-line';
  d.innerHTML='<span class="pkg-pb-k">แบรนด์</span> <span data-no-translate>'+esc2(b)+'</span>';td.append(d);});}
 /* the filter panel's brand dropdown follows the list however it changed (data loaded at login, restore, another module) */
 let regSig='';const syncRegDd=()=>{const k=names().join('\u0001');if(k===regSig)return;regSig=k;if(window.PKG_REG_FILTER&&PKG_REG_FILTER.build)PKG_REG_FILTER.build('stockTbl');};
 const oRS=window.renderStock;window.renderStock=function(){const out=oRS.apply(this,arguments);try{paintReg();syncRegDd();}catch(e){}return out;};
 const sb=$i('stockSearchBottom');if(sb&&!/แบรนด์/.test(sb.placeholder))sb.placeholder='ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์';
 if(window.PKG_REG_FILTER&&PKG_REG_FILTER.config&&PKG_REG_FILTER.config.stockTbl){const dd=PKG_REG_FILTER.config.stockTbl.dd;
  if(!dd.some(d=>d.key==='pbrand')){dd.unshift({key:'pbrand',label:COL,opts:()=>[...names().map(b=>[b,b]),[NONE,'ไม่ระบุแบรนด์']],test:(x,v)=>v===NONE?!brandOf(x):key(brandOf(x))===key(v)});
   try{PKG_REG_FILTER.build('stockTbl');}catch(e){}}}
 if(window.PKG_REG_EXPORT)PKG_REG_EXPORT.extend=function(id,d,body){
  if(id!=='stockTbl'||!d||!Array.isArray(d.cols))return d;
  const tr0=body&&body[0],ni=tr0?[...tr0.cells].findIndex(td=>td.classList.contains('sc-name')):-1,pos=d.cols.findIndex(c=>c.i===ni),at=pos<0?d.cols.length:pos+1;
  d.cols.splice(at,0,{i:-1,l:'แบรนด์',num:false});
  d.rows.forEach((r,k)=>{const tr=body[k],s=tr&&rowStock(tr);
   if(pos>=0&&tr&&tr.cells[ni]&&tr.cells[ni].querySelector('.pkg-pb-line')){const c=tr.cells[ni].cloneNode(true);c.querySelectorAll('.pkg-pb-line').forEach(x=>x.remove());r[pos]=PKG_REG_EXPORT.cellText(c);}
   r.splice(at,0,s?brandOf(s):'');});
  (d.foot||[]).forEach(r=>r.splice(at,0,''));
  return d;};

 /* ---------- product card (บัตรสินค้า) ---------- */
 if(typeof openCard==='function'){const o=window.openCard;
  window.openCard=function(id){const r=o.apply(this,arguments);try{const s=(DB.stock||[]).find(x=>x.id===id),g=document.querySelector('#mCardBody .grid');
   if(s&&g&&!g.querySelector('.pkg-pb-card')){const d=document.createElement('div');d.className='pkg-pb-card';
    d.innerHTML=`<span class="hint">${COL}</span><div${brandOf(s)?' data-no-translate':''}>${brandOf(s)?esc2(brandOf(s)):'ไม่ระบุแบรนด์'}</div>`;
    (g.children[0]||g).after(d);g.classList.add('pkg-pb-g6');}}catch(e){}return r;};}

 /* ---------- type-ahead boxes (ใบรับสินค้า · ใบตรวจนับ · the shared code list): brand is matched and shown ---------- */
 if(typeof grKwMatches==='function')window.grKwMatches=function(q){q=String(q||'').trim();return q?(DB.stock||[]).filter(s=>match(s,q)).slice(0,12):[];};
 [['grKw','grKwList','grKwRender',()=>GRKW],['scKw','scKwList','scKwRender',()=>SCKW]].forEach(([inp,box,fn,st])=>{
  const el=$i(inp),o=window[fn];if(!el||typeof o!=='function')return;
  window[fn]=function(){const r=o.apply(this,arguments);
   try{const L=st().list||[];document.querySelectorAll('#'+box+' .grpick-it').forEach(it=>{const s=L[+it.dataset.gi],b=s&&brandOf(s),nm=it.querySelector('.nm');
    if(b&&nm&&!nm.querySelector('.pkg-pb-tag')){const sp=document.createElement('span');sp.className='pkg-pb-tag';sp.dataset.noTranslate='';sp.textContent=b;nm.append(' ',sp);}});}catch(e){}
   return r;};
  el.oninput=window[fn];if(!/แบรนด์/.test(el.placeholder))el.placeholder='ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก';});
 if(typeof refreshStockList==='function')window.refreshStockList=function(q){
  const el=$i('stockList');if(!el)return;const k=String(q||'').trim(),hit=k?(DB.stock||[]).filter(s=>match(s,k)):(DB.stock||[]);
  el.innerHTML=hit.slice(0,typeof STOCK_SUGGEST_MAX==='number'?STOCK_SUGGEST_MAX:5).map(s=>
   `<option value="${esc2(s.code)}">${esc2(s.name)}${brandOf(s)?' · '+esc2(brandOf(s)):''} · OEM ${esc2(s.oem||'-')} · คงเหลือ ${qf(s.qty)}</option>`).join('');};

 /* ---------- mGrFind "ค้นหาสินค้าละเอียด" (ใบรับสินค้า · ใบตรวจนับ) ---------- */
 (()=>{
  const M=$i('mGrFind'),oldCat=$i('gfCat'),kw=$i('gfKw'),tb=$i('gfBody');if(!M||!oldCat||!kw||!tb||typeof gfOpen!=='function')return;
  const row=oldCat.closest('.row'),oldLbl=oldCat.closest('label'),kwLbl=kw.closest('label');
  oldLbl.hidden=true;oldLbl.classList.add('pkg-pb-old');   /* "1 · เลือกหมวด": gfOpen still fills it; the shared row replaces it on screen */
  const cap=kwLbl&&kwLbl.querySelector('span');if(cap)cap.textContent='ค้นหา รหัส / OEM / ชื่อ / แบรนด์';kw.placeholder='พิมพ์เพื่อค้นหาสินค้า';
  row.classList.add('pkg-gf-q');
  const pf=mount(row.parentElement,{before:row,also:s=>match(s,kw.value),onChange:()=>draw()});
  const hr=M.querySelector('thead tr');
  if(hr&&hr.cells.length===6){const th=document.createElement('th');th.style.width='150px';th.textContent='แบรนด์';hr.cells[2].style.width='190px';hr.cells[2].after(th);hr.cells[5].classList.add('sc-cost');hr.cells[4].style.width='100px';hr.cells[5].style.width='110px';hr.cells[6].style.width='100px';}
  function draw(){
   const list=(DB.stock||[]).filter(s=>pf.test(s)&&match(s,kw.value));
   $i('gfCount').textContent=list.length+' รายการ';
   tb.innerHTML=list.slice(0,80).map(s=>`<tr><td class="mono" style="font-size:12px" data-no-translate>${esc2(s.code)}</td><td data-no-translate>${esc2(s.name)}</td>
     <td data-no-translate>${esc2(catOf(s))}</td><td>${chip(s)}</td><td class="num">${qf(s.qty)}</td><td class="num sc-cost">${money(s.cost)}</td>
     <td class="ctr"><button type="button" class="btn pri sm" onclick="gfPick('${esc2(s.id)}')">+ เพิ่ม</button></td></tr>`).join('')
    +(list.length>80?`<tr><td colspan="7" class="hint ctr">แสดง 80 รายการแรกจาก ${list.length} รายการ — เลือกตัวกรองหรือพิมพ์คำค้นเพิ่มเพื่อให้แคบลง</td></tr>`:'')
    ||'<tr><td colspan="7" class="empty">ไม่พบสินค้าตามเงื่อนไข</td></tr>';
   pf.refresh();
  }
  window.gfRender=draw;
  const oOpen=window.gfOpen;window.gfOpen=function(){pf.reset();const r=oOpen.apply(this,arguments);setTimeout(()=>{try{kw.focus();}catch(e){}},80);return r;};
 })();

 /* ---------- mClPull "หยิบรายการเข้าใบเคลม" — from mockups/claim-search.html ---------- */
 const CP=(()=>{
  const M=$i('mClPull');if(!M||typeof clPullAdd!=='function'||typeof blankCLine!=='function'||typeof clFilled!=='function')return null;
  const sheet=M.querySelector('.sheet'),body=sheet.querySelector('.body');
  const P={src:'all',ref:null,per:10,page:1,q:'',sortK:'',sortD:1,rows:[],busy:false};
  body.classList.add('pkg-cp');body.removeAttribute('style');
  body.innerHTML=`<div class="pkg-cp-src"><label for="cpSrc">ดึงรายการจาก</label><select id="cpSrc"></select></div>
   <div class="pkg-cp-flt"></div>
   <div class="pkg-cp-act"><button type="button" class="btn pri" id="cpAddPage">+ เพิ่มทั้งหน้าเข้าใบเคลม</button><button type="button" class="btn gh" id="cpClear">ล้างเงื่อนไข</button><span class="pkg-cp-cnt" id="cpCnt" role="status"></span></div>
   <div class="pkg-cp-bar"><label class="pkg-cp-per">แสดง <select id="cpPer"><option>10</option><option>25</option><option>50</option></select> รายการ</label>
    <div class="pkg-cp-q">${IC_S}<input type="text" id="cpQ" placeholder="ค้นหา รหัส / OEM / ชื่อ / แบรนด์" autocomplete="off" aria-label="ค้นหาสินค้า"></div>
    <div class="pkg-cp-pg" id="cpPager"></div></div>
   <div class="scroll pkg-cp-box"><table class="tbl pkg-cp-tbl"><thead><tr id="cpHead"></tr></thead><tbody id="cpBody"></tbody></table></div>`;
  const strip=document.createElement('div');strip.className='pkg-cp-strip';strip.id='cpStrip';sheet.append(strip);
  const srcEl=$i('cpSrc'),qEl=$i('cpQ'),perEl=$i('cpPer'),head=$i('cpHead'),tb=$i('cpBody');
  const pf=mount(body.querySelector('.pkg-cp-flt'),{rows:()=>P.rows.map(x=>x.rec),also:s=>match(s,P.q),onChange:()=>{P.page=1;paint();}});
  const doc=()=>(typeof C!=='undefined'&&C)||null;
  const locked=()=>{const c=doc();return !c||!!(c.cancelled||c.deducted);};
  /* the same rule the original add path uses to refuse a duplicate */
  const inClaim=it=>{const c=doc();return !!c&&(c.items||[]).some(x=>clFilled(x)&&((it.stockId&&x.stockId===it.stockId)||(x.code&&String(x.code).toLowerCase()===String(it.code||'').toLowerCase())));};
  const filled=()=>{const c=doc();return c?(c.items||[]).map((x,i)=>({x,i})).filter(o=>clFilled(o.x)):[];};
  /* the reference document of the claim, read exactly as the original did (ใบซื้อ first, else ใบเสร็จขาย without labour) */
  function refOf(src){
   const g=(DB.purchases||[]).find(x=>x.id===($i('clGrRef')||{}).value),r=(DB.receipts||[]).find(x=>x.id===($i('clReceiptRef')||{}).value);
   const d=src==='gr'?g:src==='rcpt'?r:(g||r);if(!d)return null;
   const shape=it=>({stockId:it.stockId||'',code:it.code||'',name:it.name||'',qty:n(it.qty)});
   const items=d===g?grItemsClean(g).map(shape):(d.items||[]).filter(it=>it&&it.type!=='labor'&&String(it.code||it.name||'').trim()).map(shape);
   return{no:d.no,items};}
  /* CLPULL.items = everything the chosen source offers, in the original's line shape — clPullAdd(i) adds by that index */
  function load(){
   const ref=P.src==='ref'&&P.ref,st=DB.stock||[];
   const items=ref?P.ref.items:st.map(s=>({stockId:s.id,code:s.code,name:s.name,qty:1}));
   CLPULL={items,no:ref?P.ref.no:''};
   P.rows=items.map((it,i)=>{const s=ref?((it.stockId&&st.find(x=>x.id===it.stockId))||(it.code&&st.find(x=>key(x.code)===key(it.code)))||null):st[i];
    return{i,it,s,rec:s||{code:it.code,name:it.name,oem:'',cat:'',brand:'',qty:0,unit:''}};});
  }
  function fillSrc(){const st=(DB.stock||[]).length;
   srcEl.innerHTML=(P.ref?`<option value="ref">รายการในใบอ้างอิง ${esc2(P.ref.no)} (${P.ref.items.length} รายการ)</option>`:'')+`<option value="all">สินค้าทั้งคลัง (${st} รายการ)</option>`;
   srcEl.value=P.src;}
  function found(){
   let r=P.rows.filter(x=>pf.test(x.rec)&&match(x.rec,P.q));
   if(P.sortK){const k=P.sortK,d=P.sortD,val=x=>k==='cost'?n(x.rec.cost):k==='qty'?n(x.rec.qty):k==='ref'?n(x.it.qty):k==='cat'?(x.s?catOf(x.s):''):k==='brand'?brandOf(x.rec):String(x.rec[k]||'');
    r=r.slice().sort((a,b)=>{const x=val(a),y=val(b);return(typeof x==='number'?x-y:String(x).localeCompare(String(y),'th'))*d;});}
   return r;}
  const cols=()=>[['','ลำดับ','ctr','width:64px'],['code','รหัสสินค้า','','width:150px'],['cat','หมวด','','width:170px'],['name','ชื่อสินค้า','',''],['brand','แบรนด์','','width:140px'],['','รูป','ctr','width:72px'],
   ...(can('stock.cost')?[['cost','ราคาทุน','num sc-cost','width:120px']]:[]),['qty','คงเหลือ','num','width:120px'],...(P.src==='ref'?[['ref','จำนวนในใบ','num','width:110px']]:[]),['','','ctr','width:190px']];
  let shown=[];
  function paint(){
   const c=doc();if(!c||P.busy)return;
   pf.refresh();
   const K=cols(),all=found(),pages=Math.max(1,Math.ceil(all.length/P.per));P.page=Math.min(Math.max(1,P.page),pages);
   const from=(P.page-1)*P.per,lock=locked(),cost=can('stock.cost'),isRef=P.src==='ref',br=window.PKG_BRANCH?PKG_BRANCH.cur().name:'';
   shown=all.slice(from,from+P.per);
   $i('cpTag').textContent=(c.no||'ใบเคลมใหม่')+(P.ref?' · อ้างอิง '+P.ref.no:' · ไม่มีใบอ้างอิง');
   head.innerHTML=K.map(([k,t,cls,st])=>`<th${k?` data-k="${k}" tabindex="0" title="กดเพื่อเรียงลำดับ"`:''} class="${cls}${k&&P.sortK===k?' sorted':''}" style="${st}">${t}${k?`<span class="pkg-cp-ar" aria-hidden="true">${P.sortK===k?(P.sortD>0?'▲':'▼'):'↕'}</span>`:''}${k==='qty'&&br?`<div class="pkg-cp-sub" data-no-translate>${esc2(br)}</div>`:''}</th>`).join('');
   tb.innerHTML=shown.length?shown.map((x,k)=>{const s=x.s,r=x.rec,inn=inClaim(x.it),q=n(r.qty);
    return `<tr class="${inn?'in':''}"><td class="ctr">${from+k+1}</td>
     <td data-no-translate><div class="pkg-cp-code">${esc2(r.code||'-')}</div>${r.oem&&r.oem!=='-'?`<div class="pkg-cp-oem">OEM ${esc2(r.oem)}</div>`:''}</td>
     <td>${s?`<span data-no-translate>${esc2(catOf(s))}</span>`:'<span class="hint">-</span>'}</td>
     <td class="pkg-cp-nm"><span data-no-translate>${esc2(r.name||'-')}</span>${s&&n(s.warr)?`<span class="pkg-cp-wr">รับประกัน ${n(s.warr)} เดือน</span>`:''}${s?'':'<div class="hint">ไม่อยู่ในทะเบียนอะไหล่</div>'}</td>
     <td>${chip(r)}</td>
     <td class="ctr">${s&&s.img?`<img class="pkg-cp-thumb" src="${esc2(s.img)}" alt="" loading="lazy">`:'<span class="pkg-cp-noimg">ไม่มี<br>รูป</span>'}</td>
     ${cost?`<td class="num sc-cost">${s?money(s.cost):'-'}</td>`:''}
     <td class="num">${s?`<span class="pkg-cp-qty${q>0?'':' z'}">${qf(q)}</span> <span class="hint" data-no-translate>${esc2(s.unit||'')}</span>`:'<span class="hint">-</span>'}</td>
     ${isRef?`<td class="num"><b>${qf(x.it.qty)}</b> <span class="hint" data-no-translate>${esc2(r.unit||'')}</span></td>`:''}
     <td class="ctr">${inn?'<button type="button" class="btn sm gh pkg-cp-in" disabled><i class="pkg-cp-ok" aria-hidden="true"></i>อยู่ในใบเคลมแล้ว</button>':`<button type="button" class="btn sm pri" data-add="${x.i}"${lock?' disabled':''}>+ เคลมชิ้นนี้</button>`}</td></tr>`;}).join('')
    :`<tr><td class="empty" colspan="${K.length}">ไม่พบสินค้าตามเงื่อนไข — ลองกด “ล้างเงื่อนไข”${isRef?' หรือเปลี่ยน “ดึงรายการจาก” เป็นสินค้าทั้งคลัง':''}</td></tr>`;
   $i('cpCnt').innerHTML=`พบ <b>${all.length}</b> จาก ${P.rows.length} รายการ`+(all.length?` · แสดง ${from+1}–${from+shown.length}`:'');
   const left=lock?0:shown.filter(x=>!inClaim(x.it)).length,ap=$i('cpAddPage');
   ap.disabled=!left;ap.textContent='+ เพิ่มทั้งหน้าเข้าใบเคลม'+(left?' ('+left+')':'');
   $i('cpClear').disabled=!(pf.active()||P.q||P.sortK);
   const nums=[];for(let i=1;i<=pages;i++){if(i===1||i===pages||Math.abs(i-P.page)<=1)nums.push(i);else if(nums[nums.length-1]!=='…')nums.push('…');}
   $i('cpPager').innerHTML=`<span class="pgbar"><button type="button" data-page="${P.page-1}"${P.page<=1?' disabled':''} aria-label="หน้าก่อนหน้า">‹</button>`
    +nums.map(v=>v==='…'?'<span class="gap">…</span>':`<button type="button" data-page="${v}" class="${v===P.page?'on':''}">${v}</button>`).join('')
    +`<button type="button" data-page="${P.page+1}"${P.page>=pages?' disabled':''} aria-label="หน้าถัดไป">›</button></span>`;
   paintStrip();
  }
  function paintStrip(){
   const f=filled(),lock=locked();
   strip.innerHTML=`<span class="pkg-cp-t">เลือกเข้าใบเคลมแล้ว <b>${f.length}</b> รายการ</span>`
    +(f.length?`<div class="pkg-cp-chips">${f.map(o=>{const t=esc2(o.x.code||o.x.name);return `<span class="pkg-cp-chip"><span data-no-translate>${t}</span>${lock?'':`<button type="button" data-rm="${o.i}" title="เอาออกจากใบเคลม" aria-label="เอา ${t} ออกจากใบเคลม"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`}</span>`;}).join('')}</div>`
     :'<span class="hint pkg-cp-hint">กด “+ เคลมชิ้นนี้” ที่แถวสินค้า หรือ “เพิ่มทั้งหน้า”</span>')
    +'<button type="button" class="btn grn" id="cpDone">เสร็จ — กลับไปที่ใบเคลม</button>';
  }
  /* several adds in one go: the original path for each, one message at the end */
  function addMany(list){
   const before=filled().length,t=window.toast;P.busy=true;window.toast=function(){};
   try{list.forEach(x=>clPullAdd(x.i));}finally{window.toast=t;P.busy=false;}
   const k=filled().length-before;paint();return k;}
  M.addEventListener('click',e=>{
   const a=e.target.closest('[data-add]');if(a){clPullAdd(+a.dataset.add);return paint();}
   const rm=e.target.closest('[data-rm]');if(rm){const c=doc(),x=c&&c.items[+rm.dataset.rm];if(!x||typeof delCLine!=='function')return;const nm=x.code||x.name;delCLine(+rm.dataset.rm);paint();return toast('เอา '+nm+' ออกจากใบเคลมแล้ว');}
   const pg=e.target.closest('[data-page]');if(pg){if(pg.disabled)return;P.page=+pg.dataset.page;paint();const bx=tb.closest('.pkg-cp-box');if(bx&&bx.scrollIntoView)bx.scrollIntoView({block:'nearest'});return;}
   const th=e.target.closest('th[data-k]');if(th)return sortBy(th.dataset.k);
   if(e.target.closest('#cpAddPage')){if(locked())return toast('ใบนี้แก้ไขรายการไม่ได้แล้ว');const k=addMany(shown.filter(x=>!inClaim(x.it)));return toast(k?'เพิ่ม '+k+' รายการจากหน้านี้เข้าใบเคลมแล้ว':'ทุกรายการในหน้านี้อยู่ในใบเคลมแล้ว');}
   if(e.target.closest('#cpClear')){pf.reset();P.q='';qEl.value='';P.sortK='';P.sortD=1;P.page=1;paint();return toast('ล้างเงื่อนไขแล้ว');}
   if(e.target.closest('#cpDone')){closeModal('mClPull');const k=filled().length;if(k)toast('ใบเคลมมี '+k+' รายการ — แก้จำนวน / สาเหตุในตารางได้');}
  });
  function sortBy(k){if(P.sortK===k){if(P.sortD>0)P.sortD=-1;else{P.sortK='';P.sortD=1;}}else{P.sortK=k;P.sortD=1;}P.page=1;paint();}
  head.addEventListener('keydown',e=>{const th=e.target.closest&&e.target.closest('th[data-k]');if(th&&(e.key==='Enter'||e.key===' ')){e.preventDefault();sortBy(th.dataset.k);}});
  srcEl.addEventListener('change',()=>{P.src=srcEl.value==='ref'&&P.ref?'ref':'all';if(P.sortK==='ref')P.sortK='';P.page=1;load();paint();});
  perEl.addEventListener('change',()=>{P.per=n(perEl.value)||10;P.page=1;paint();});
  qEl.addEventListener('input',()=>{P.q=qEl.value.trim();P.page=1;paint();});
  qEl.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const f=found();if(f.length===1&&!inClaim(f[0].it)&&!locked()){clPullAdd(f[0].i);paint();}});
  /* open: with a reference document → its lines first; without one (or src 'all') → the whole stock */
  function open(src){
   const c=doc();if(!c)return;
   if(c.cancelled)return toast('ใบเคลมนี้ถูกยกเลิกแล้ว');
   if(c.deducted)return toast('ใบนี้ตัดสต๊อกส่งเคลมแล้ว แก้ไขรายการไม่ได้');
   const named=src==='gr'||src==='rcpt';let ref=refOf(named?src:'');
   if(named&&!ref)return;
   if(ref&&!ref.items.length){toast('ใบ '+ref.no+' ไม่มีรายการอะไหล่ให้หยิบ');if(named)return;ref=null;}
   P.ref=ref;P.src=ref&&src!=='all'?'ref':'all';P.page=1;P.q='';P.sortK='';P.sortD=1;qEl.value='';perEl.value=String(P.per);
   fillSrc();load();pf.reset();paint();openModal('mClPull');
  }
  window.clPullOpen=open;
  /* the claim table changed while the window is open (a line removed there, another add path): chips and buttons follow */
  if(typeof renderClaimItems==='function'){const o=window.renderClaimItems;window.renderClaimItems=function(){const r=o.apply(this,arguments);if(M.classList.contains('on')&&!P.busy)try{paint();}catch(e){}return r;};}
  /* the claim window: beside "ดึงรายการจากใบที่อ้างอิง", a way in that needs no reference document */
  const b0=document.querySelector('button[onclick="clPullOpen()"]');
  if(b0&&!$i('pkgCpAll')){const b=document.createElement('button');b.type='button';b.className=b0.className;b.id='pkgCpAll';b.innerHTML=IC_S+'ค้นหาสินค้าทั้งคลัง';b.setAttribute('onclick',"clPullOpen('all')");b0.after(b);}
  return{open,state:P,paint,filter:pf,found};
 })();

 window.PKG_PFILTER={mount,test,match,pass,NONE,QTY};
 window.PKG_PBRAND={names,stored,use,add,rename,del,adopt,changed,sec,brandOf,find,claim:CP};
})();
