/* DriveGo-styled dropdown list for every <select> (desktop pointer only; touch devices keep the native picker).
   The native <select> stays the source of truth: choosing sets .value and fires the usual input/change events,
   so every existing handler (onchange=..., addEventListener) keeps working without changes. */
(()=>{
 const coarse=()=>window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
 let box=null,cur=null,hi=-1,items=[];
 function close(focus){if(!box)return;box.remove();box=null;if(focus&&cur)cur.focus({preventScroll:true});cur=null;items=[];hi=-1;}
 function pick(i){
  const it=items[i];if(!it||it.opt.disabled||!cur)return;
  const sel=cur;if(sel.selectedIndex!==it.opt.index){sel.selectedIndex=it.opt.index;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));}
  close(true);
 }
 function mark(i){items.forEach((it,k)=>it.el.classList.toggle('hi',k===i));hi=i;items[i]?.el.scrollIntoView({block:'nearest'});}
 function move(d){if(!items.length)return;let i=hi;for(let n=0;n<items.length;n++){i=(i+d+items.length)%items.length;if(!items[i].opt.disabled)return mark(i);}}
 function open(sel){
  close();cur=sel;box=document.createElement('div');box.className='dg-select';box.setAttribute('role','listbox');
  const list=document.createElement('div');list.className='dg-select-list';box.append(list);
  [...sel.children].forEach(ch=>{
   const add=(opt,inGroup)=>{if(opt.hidden)return;const el=document.createElement('div');el.className='dg-opt'+(opt.disabled?' off':'')+(opt.selected?' on':'')+(inGroup?' ing':'');
    el.setAttribute('role','option');el.setAttribute('aria-selected',opt.selected?'true':'false');el.textContent=opt.textContent;
    const idx=items.length;items.push({opt,el});el.addEventListener('mousedown',e=>{e.preventDefault();pick(idx);});el.addEventListener('mousemove',()=>{if(!opt.disabled&&hi!==idx)mark(idx);});list.append(el);};
   if(ch.tagName==='OPTGROUP'){const g=document.createElement('div');g.className='dg-grp';g.textContent=ch.label;list.append(g);[...ch.children].forEach(o=>add(o,true));}
   else if(ch.tagName==='OPTION')add(ch,false);
  });
  document.body.append(box);
  const r=sel.getBoundingClientRect(),vh=window.innerHeight,below=vh-r.bottom-12,above=r.top-12;
  box.style.minWidth=Math.max(r.width,160)+'px';box.style.left=Math.max(8,Math.min(r.left,window.innerWidth-box.offsetWidth-8))+'px';
  const up=below<220&&above>below,room=Math.max(140,Math.min(360,up?above:below));list.style.maxHeight=room+'px';
  if(up)box.style.top=(r.top-4-box.offsetHeight)+'px';else box.style.top=(r.bottom+4)+'px';
  const sIdx=items.findIndex(it=>it.opt.selected);mark(sIdx>=0?sIdx:items.findIndex(it=>!it.opt.disabled));
 }
 const usable=sel=>sel&&sel.tagName==='SELECT'&&!sel.multiple&&!sel.disabled&&!(sel.size>1)&&!sel.closest('.dg-native');
 document.addEventListener('mousedown',e=>{
  if(box&&box.contains(e.target))return;
  const sel=e.target.closest&&e.target.closest('select');
  if(!usable(sel)||coarse()||e.button!==0){if(box)close();return;}
  e.preventDefault();sel.focus({preventScroll:true});if(cur===sel&&box)close();else open(sel);
 },true);
 document.addEventListener('keydown',e=>{
  if(box){
   if(e.key==='ArrowDown'){e.preventDefault();move(1);}
   else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
   else if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(hi);}
   else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();e.stopPropagation();close(true);}
   else if(e.key.length===1){const k=e.key.toLowerCase(),start=hi+1;for(let n=0;n<items.length;n++){const i=(start+n)%items.length;if(!items[i].opt.disabled&&items[i].opt.textContent.trim().toLowerCase().startsWith(k)){mark(i);break;}}}
   return;
  }
  const sel=e.target;
  if(usable(sel)&&!coarse()&&(e.key===' '||e.key==='Enter'||e.key==='F4'||(e.altKey&&e.key==='ArrowDown'))){e.preventDefault();open(sel);}
 },true);
 window.addEventListener('resize',()=>close());
 document.addEventListener('scroll',e=>{if(box&&!box.contains(e.target))close();},true);
 /* Closed selects show their whole text: a select the page gave a fixed px width grows to its longest option when the
    bigger interface font would cut it (e.g. 02 “ทุกสถานะการเข้ารับบริการ” in 190px); never narrower than written.
    Re-fitted when fonts are ready, on every page change, on focus and when the interface language changes. */
 const ctx=document.createElement('canvas').getContext('2d');
 function fit(sel){
  if(!sel||sel.tagName!=='SELECT'||sel.multiple||sel.size>1)return;
  const base=sel.dataset.dgW?+sel.dataset.dgW:(/^\d+(\.\d+)?px$/.test(sel.style.width)?parseFloat(sel.style.width):0);if(!base)return;
  sel.dataset.dgW=base;const cs=getComputedStyle(sel);
  ctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  let w=0;for(const o of sel.options)if(!o.hidden)w=Math.max(w,ctx.measureText(o.textContent.trim()).width);
  const need=Math.ceil(w+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth)+24);   /* + the arrow */
  const v=Math.max(base,need)+'px';if(sel.style.width!==v)sel.style.width=v;
 }
 const hasLayout=()=>document.documentElement.getBoundingClientRect().width>0;   /* no layout (tests) = nothing to fit */
 function fitAll(){if(hasLayout())document.querySelectorAll('select[style*="width"],select[data-dg-w]').forEach(fit);}
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitAll);
 document.addEventListener('focusin',e=>{if(e.target.tagName==='SELECT'&&hasLayout())fit(e.target);});
 new MutationObserver(()=>setTimeout(fitAll,0)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if(typeof window.go==='function'){const g=window.go;window.go=function(){const r=g.apply(this,arguments);setTimeout(fitAll,0);return r;};}
 window.DG_SELECT={open,close,fit,fitAll};
})();
