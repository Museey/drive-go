/* Copy-only presentation layer. No record, permission or financial values are changed. */
(()=>{
 // Explicitly enabled for the user's animation experiment; no OS preference is changed.
 document.documentElement.dataset.pkgMotion='on';
 const purchaseInput=document.getElementById('grSearch');
 const purchaseTools=purchaseInput.parentElement.parentElement;
 purchaseTools.classList.add('pkg-gr-tools');
 const purchaseAction=document.createElement('div');purchaseAction.className='pkg-gr-search-action';
 purchaseAction.append(purchaseInput.parentElement.querySelector('button'),purchaseInput);
 purchaseTools.appendChild(purchaseAction);
 // Keep the original controls and handlers, arranging them like the quotation toolbar.
 const custHeader=document.querySelector('#c-list > .panel > header');
 const custTitle=document.createElement('div');custTitle.className='pkg-cust-title';
 custTitle.append(custHeader.querySelector('h2'),document.getElementById('custLCount'));
 custHeader.prepend(custTitle);
 const custFilter=document.createElement('label');custFilter.className='pkg-cust-filter';
 const custFilterCaption=document.createElement('span');custFilterCaption.className='hint';custFilterCaption.textContent='สถานะ';
 custFilter.append(custFilterCaption,document.getElementById('clFilter'));custHeader.append(custFilter);
 const custSearch=document.getElementById('clSearch');
 const custSearchButton=document.createElement('button');custSearchButton.className='btn pri';custSearchButton.type='button';custSearchButton.textContent='ค้นหาข้อมูล';
 custSearchButton.addEventListener('click',()=>{custSearch.dispatchEvent(new Event('input',{bubbles:true}));custSearch.focus();});
 custSearch.parentElement.prepend(custSearchButton);
 // Page buttons go inside the list frame, under the big title (user 2026-09-30): add customer · blank intake form · print list,
 // with the ordering hint on the same row. The toolbar above the frame keeps only what is hidden there.
 const custTools=document.getElementById('custTools'),custActions=document.createElement('div');custActions.className='pkg-cust-actions';
 [...custTools.querySelectorAll('button')].filter(b=>!b.classList.contains('pkg-io-moved')&&/openCust|openForms|printForm|ฟอร์มเปล่า|เพิ่มลูกค้า/.test((b.getAttribute('onclick')||'')+b.textContent)).forEach(b=>custActions.append(b));
 const printList=[...custHeader.querySelectorAll(':scope > button')].find(b=>/printCustList/.test(b.getAttribute('onclick')||''));if(printList)custActions.append(printList);
 const custHint=document.getElementById('custHint');if(custHint){custActions.append(custHint);custHint.classList.add('pkg-cust-hint');}
 /* the original's blinking ✚ on "เพิ่มลูกค้า" → the plain "+ " every other create button uses (user 2026-10-02) */
 custActions.querySelectorAll('button .blink').forEach(sp=>sp.replaceWith('+'));custActions.querySelectorAll('button').forEach(b=>{if(/^\+\s*เพิ่มลูกค้า/.test(b.textContent.trim()))b.textContent='+ เพิ่มลูกค้า';});
 custTitle.after(custActions);custTools.classList.add('pkg-cust-tools-moved');
 // Mobile account tools live in the existing hamburger drawer, using the same nodes.
 const mobileTools=document.createElement('div');mobileTools.id='pkg-mobile-tools';
 document.getElementById('tabs').prepend(mobileTools);
 const mobileTopActions=document.getElementById('pkg-header-actions');
 const mobileActionsAnchor=document.createComment('desktop header actions');mobileTopActions.before(mobileActionsAnchor);
 const mobileToolNodes=['topBrand','pkg-copy-status'].map(id=>{
  const node=document.getElementById(id),anchor=document.createComment('desktop '+id);
  node.before(anchor);return {node,anchor};
 });
 const mobileHeaderQuery=window.matchMedia('(max-width:810px)');
 function placeMobileTools(){
  if(mobileHeaderQuery.matches)document.getElementById('pkg-app').appendChild(mobileTopActions);
  else mobileActionsAnchor.after(mobileTopActions);
  for(const {node,anchor} of mobileToolNodes){
   if(mobileHeaderQuery.matches)mobileTools.appendChild(node);
   else anchor.after(node);
  }
 }
 if(mobileHeaderQuery.addEventListener)mobileHeaderQuery.addEventListener('change',placeMobileTools);
 else mobileHeaderQuery.addListener(placeMobileTools);
 placeMobileTools();
 const dictionary=window.PKG_TRANSLATIONS||{};
 const normalize=s=>String(s).replace(/\s+/g,' ').trim();
 const catalog=new Map(Object.entries(dictionary).map(([k,v])=>[normalize(k),v]));
 const thai=/[ก-๙]/;
 const textState=new WeakMap(),attrState=new WeakMap();
 let language='th',scheduled=false;
 try{language=localStorage.getItem('drivego-package-copy-v1:'+(window.PKG_PLAN||'selection')+':interface-language')==='en'?'en':'th';}catch{}
 const selector=document.createElement('select');selector.id='pkg-language';selector.setAttribute('aria-label','ภาษา / Language');selector.dataset.noTranslate='';
 selector.innerHTML='<option value="th">🇹🇭 ไทย</option><option value="en">🇺🇸 English</option>';selector.value=language;
 document.getElementById('pkg-header-actions').prepend(selector);
 selector.hidden=true;
 const languageMenu=document.createElement('div');languageMenu.id='pkg-language-menu';languageMenu.dataset.noTranslate='';
 const languageToggle=document.createElement('button');languageToggle.type='button';languageToggle.id='pkg-language-toggle';languageToggle.setAttribute('aria-label','Language');languageToggle.setAttribute('aria-expanded','false');languageToggle.setAttribute('aria-controls','pkg-language-options');
 const languageOptions=document.createElement('div');languageOptions.id='pkg-language-options';languageOptions.hidden=true;
 function closeLanguages(){languageOptions.hidden=true;languageToggle.setAttribute('aria-expanded','false');}
 function updateLanguageFlag(){languageToggle.textContent=selector.value==='en'?'🇺🇸':'🇹🇭';}
 for(const [value,label] of [['th','🇹🇭 Thai'],['en','🇺🇸 English']]){
  const option=document.createElement('button');option.type='button';option.textContent=label;
  option.addEventListener('click',()=>{selector.value=value;selector.dispatchEvent(new Event('change'));closeLanguages();languageToggle.focus();});languageOptions.append(option);
 }
 languageToggle.addEventListener('click',()=>{const open=languageOptions.hidden;languageOptions.hidden=!open;languageToggle.setAttribute('aria-expanded',String(open));});
 languageMenu.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLanguages();languageToggle.focus();}if(e.key==='ArrowDown'&&e.target===languageToggle){e.preventDefault();languageOptions.hidden=false;languageToggle.setAttribute('aria-expanded','true');languageOptions.querySelector('button').focus();}});
 document.addEventListener('click',e=>{if(!languageMenu.contains(e.target))closeLanguages();});
 selector.addEventListener('change',updateLanguageFlag);updateLanguageFlag();
 languageMenu.append(languageToggle,languageOptions);(document.getElementById('pkg-branch')||selector).after(languageMenu);   /* สาขา first, then the flag (user 2026-10-09) */

 let protectedValues=new Set();
 function layoutAppointmentPlates(){
  const provinces=new Set(PROVINCES);
  for(const c of DB.cust||[])for(const v of c.vehicles||[])if(v.plateProv)provinces.add(v.plateProv);
  const suffixes=[...provinces].sort((a,b)=>b.length-a.length);
  document.querySelectorAll('#crmHomeTbl tbody tr').forEach(row=>{
   const cell=row.cells[1];if(!cell||cell.querySelector('.pkg-plate-number'))return;
   const full=cell.textContent;
   const province=suffixes.find(p=>full.endsWith(' '+p)||full===p);
   if(!province)return;
   const number=full.slice(0,full.length-province.length).trimEnd();
   const plate=document.createElement('span');plate.className='pkg-plate-number';plate.textContent=number;
   const region=document.createElement('span');region.className='pkg-plate-province';region.textContent=province;
   cell.dataset.noTranslate='';cell.replaceChildren(plate,region);
  });
 }
 function collectData(){
  protectedValues=new Set();const seen=new WeakSet();
  function walk(o,key='',depth=0){
   if(depth>15||o==null)return;
   if(typeof o==='string'){
    if(/name|note|desc|address|addr|email|title|owner|code|plate|brand|model|symptom|remark|reason|detail|user|subject|find|text|content|cat|unit|company|contact|position|color|warr/i.test(key)&&thai.test(o))protectedValues.add(normalize(o));
    return;
   }
   if(typeof o!=='object'||seen.has(o))return;seen.add(o);
   Object.entries(o).forEach(([k,v])=>walk(v,Array.isArray(o)?key:k,depth+1));
  }
  for(const read of [()=>DB,()=>DGB,()=>FR,()=>({cats:CATS})]){try{walk(read());}catch{}}
 }
 function translate(source,depth=0){
  const s=normalize(source);if(!thai.test(s))return source;
  if(catalog.has(s))return String(source).match(/^\s*/)[0]+catalog.get(s)+String(source).match(/\s*$/)[0];
  if(depth>4)return source;
  // Translate complete label fragments only, never guess unknown prose.
  const decorated=s.match(/^([^ก-๙A-Za-z]*)(.*?)(\s*[*:：…]+)?$/u);
  if(decorated&&(decorated[1]||decorated[3])){
   const middle=translate(decorated[2],depth+1);
   if(!thai.test(middle))return decorated[1]+middle+(decorated[3]||'');
  }
  const numbered=s.match(/^(\d+(?:\.\d+)?\s*[·.]?\s*)(.+)$/);
  if(numbered){const rest=translate(numbered[2],depth+1);if(!thai.test(rest))return numbered[1]+rest;}
  const count=s.match(/^(.+?)\s+(\d[\d,.]*)(.*)$/);
  if(count){const a=translate(count[1],depth+1),b=translate(count[3],depth+1);if(!thai.test(a+b))return a+' '+count[2]+b;}
  const parts=s.split(/(\s+[\/·—&→]\s+|\s*\|\s*)/);
  if(parts.length>1){const result=parts.map((p,i)=>i%2?p:translate(p,depth+1)).join('');if(!thai.test(result))return result;}
  return source;
 }
 function excluded(el){return !el||el.closest('script,style,textarea,[contenteditable],#pkg-account-name,#appBrandName,#shopName,[data-no-translate],#pkg-language,#dgbChip,#frBadge,#vCats,#chartCat .lb,#chartBrand .lb,#chartCat2 .lb,#chartBrand2 .lb');}
 // Only fixed system templates may interpolate an opaque business-data suffix.
 const months={'ม.ค.':'Jan','ก.พ.':'Feb','มี.ค.':'Mar','เม.ย.':'Apr','พ.ค.':'May','มิ.ย.':'Jun','ก.ค.':'Jul','ส.ค.':'Aug','ก.ย.':'Sep','ต.ค.':'Oct','พ.ย.':'Nov','ธ.ค.':'Dec'};
 function periodText(source){
  // Only call for system-generated date/chart labels, never record fields or inputs.
  return source.replace(/[ก-๙]+\.[ก-๙]*\./g,m=>months[m]||m)
   .replace(/ปีที่แล้ว/g,'Last year').replace(/ปีนี้/g,'This year').replace(/ปี (?=\d{4})/g,'Year ').replace(/งวด /g,'Period ')
   .replace(/เทียบ/g,'vs').replace(/จากปีก่อน/g,'vs previous year')
   .replace(/\(เส้นประ\)/g,'(dashed)').replace(/บาท/g,'THB')
   .replace(/หน้า (?=\d+\/\d+)/g,'Page ');
 }
 function contextual(source,el){
  if(!source.trim())return source;
  return source.match(/^\s*/)[0]+contextualCore(source,el).trim()+source.match(/\s*$/)[0];
 }
 function contextualCore(source,el){
  const s=String(source).trim();let m;
  if(el.closest('#today,#dayTag,#taxTag,#buyMonth,#catRangeTag,#brRangeTag,#revCmpTag,#revLineTag,#revLegend,#revLineChart,#revBars')){
   const dated=periodText(s);
   const paged=dated.replace(/(\d+) ยี่ห้อ/g,'$1 brands');
   if(!thai.test(paged))return source.replace(s,paged);
  }
  if(el.closest('#mCustTitle')&&(m=s.match(/^แก้ไขลูกค้า · (.+)$/)))return 'Edit customer · '+m[1];
  if(el.closest('#mVenTitle')&&(m=s.match(/^แก้ไขข้อมูลผู้ขาย · (.+)$/)))return 'Edit vendor · '+m[1];
  if(el.closest('#kInfo')&&(m=s.match(/^ใบเสร็จล่าสุด (.+?) วันที่ (\d{2}\/\d{2}\/\d{4}) · เงื่อนไขรับประกัน: (.*)$/)))return 'Latest receipt '+m[1]+' Date '+m[2]+' · Warranty terms: '+m[3];
  if(el.closest('#apvAlert .s')&&(m=s.match(/^เก่าสุด: (.+)$/)))return 'Oldest: '+translate(m[1]);
  if(el.closest('#apvBell')&&(m=s.match(/^มีเอกสารรอการอนุมัติ (\d+) ใบ — กดเพื่อดูรายงาน$/)))return m[1]+' documents awaiting approval — View report';
  if(el.closest('#tabs')&&(m=s.match(/^มีเอกสารรออนุมัติ (\d+) ใบในหมวดนี้ — กดเข้าไปดูเมนูย่อยที่มีตัวเลขกำกับ$/)))return m[1]+' documents awaiting approval in this section — Open the numbered submenu';
  if(el.closest('#licBox')&&(m=s.match(/^หมดอายุการใช้งานแล้ว (\d+) วัน$/)))return 'Expired '+m[1]+' days ago';
  if(el.closest('.stbtn,.chip,#crmHomeTbl td.ctr .hint')&&(m=s.match(/^(เกินกำหนด|เลยกำหนด|เกิน|อีก) (\d+) วัน$/)))return m[1]==='อีก'?'In '+m[2]+' days':'Overdue '+m[2]+' days';
  if(el.closest('#brRangeTag,#catRangeTag,#arCount,#mmCount,.tag')&&(m=s.match(/^(.*?)(\d+) (ยี่ห้อ|บิล|รายการ) · หน้า (\d+\/\d+)$/))){
   const prefix=translate(m[1]);if(!thai.test(prefix))return prefix+m[2]+' '+({ยี่ห้อ:'brands',บิล:'bills',รายการ:'items'}[m[3]])+' · Page '+m[4];
  }
  return translate(source);
 }
 function userText(node,text){
  return protectedValues.has(normalize(text));
 }
 function renderText(node){
  const parent=node.parentElement;if(excluded(parent))return;
  let record=textState.get(node);
  if(!record||node.nodeValue!==record.output)record={source:node.nodeValue,output:node.nodeValue};
  if(!thai.test(record.source)&&!textState.has(node))return;
  const output=language==='en'&&!userText(node,record.source)?contextual(record.source,parent):record.source;
  if(node.nodeValue!==output){
   if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.value=parent.textContent;
   node.nodeValue=output;
  }
  record.output=output;textState.set(node,record);
 }
 function renderAttrs(el){
  if(excluded(el))return;
  let records=attrState.get(el)||{};
  for(const attr of ['placeholder','title','aria-label','data-label']){
   if(!el.hasAttribute(attr))continue;
   const value=el.getAttribute(attr);let r=records[attr];
   if(!r||value!==r.output)r={source:value,output:value};
   const output=language==='en'&&!protectedValues.has(normalize(r.source))?contextual(r.source,el):r.source;
   if(output!==value)el.setAttribute(attr,output);r.output=output;records[attr]=r;
  }
  attrState.set(el,records);
 }
 const dirty=new Set();
 const observer=new MutationObserver(records=>{
  for(const r of records){
   if(r.type==='childList')r.addedNodes.forEach(n=>dirty.add(n));
   else dirty.add(r.target);
  }
  queue();
 });
 function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','data-label']});}
 function render(){
  scheduled=false;observer.disconnect();collectData();layoutAppointmentPlates();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode())renderText(walker.currentNode);
  document.querySelectorAll('[placeholder],[title],[aria-label],[data-label]').forEach(renderAttrs);
  document.documentElement.lang=language;observe();
 }
 function queue(){if(!scheduled){scheduled=true;setTimeout(()=>{
  scheduled=false;
  observer.disconnect();layoutAppointmentPlates();
  if(language!=='en'){dirty.clear();observe();return;}
  collectData();
  for(const root of dirty){
   if(!root.isConnected)continue;
   if(root.nodeType===3){renderText(root);continue;}
   if(root.nodeType!==1||excluded(root))continue;
   renderAttrs(root);
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())renderText(walker.currentNode);
   root.querySelectorAll('[placeholder],[title],[aria-label],[data-label]').forEach(renderAttrs);
  }
  dirty.clear();observe();
 },20);}}
 selector.addEventListener('change',()=>{language=selector.value;try{localStorage.setItem('drivego-package-copy-v1:'+(window.PKG_PLAN||'selection')+':interface-language',language);}catch{}render();});
 // Printed DOM is translated before the browser opens its print dialog.
 window.addEventListener('beforeprint',render);
 window.PKG_I18N={translate,setLanguage(v){selector.value=v==='en'?'en':'th';selector.dispatchEvent(new Event('change'));},get language(){return language;},refresh:render};
 render();
 // Grid height animation keeps original navigation handlers and permissions intact.
 document.querySelectorAll('#tabs .navchildren').forEach(children=>{
  const inner=document.createElement('div');inner.className='pkg-nav-clip';
  while(children.firstChild)inner.appendChild(children.firstChild);children.appendChild(inner);
  inner.querySelectorAll('button').forEach((b,i)=>b.style.setProperty('--pkg-stagger',Math.min(i,8)*22+'ms'));
  children.inert=!children.closest('.navitem').classList.contains('expanded');
 });
 const navObserver=new MutationObserver(records=>records.forEach(({target})=>{
  if(!target.classList.contains('navitem'))return;
  const children=target.querySelector('.navchildren');if(children)children.inert=!target.classList.contains('expanded');
 }));
 navObserver.observe(document.getElementById('tabs'),{subtree:true,attributes:true,attributeFilter:['class']});
})();
