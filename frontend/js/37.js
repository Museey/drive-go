/* รายงานแยกสาขา (user 2026-10-06): the home page and the report pages show the branches picked in a multi-select
   "คลังสินค้า / สาขา" (default = every branch the account may use; one picker per page).
   · How: the page's own render runs inside scope(ids): document lists are narrowed to those branches for the
     duration of the (synchronous) render, stock quantities / FIFO values are those branches' (summed when several),
     payroll counts staff whose home branch is picked. save() is held during the render so a filtered list can never
     be written; a save asked for meanwhile runs afterwards on the full data.
   · Company-wide (user answer 3): capital, chart of accounts, assets register, payroll page, balance sheet and cash
     flow. On 08 สุขภาพการเงิน the cash figures / ROI / ROA stay company-wide; on 08 งบการเงิน the balance sheet,
     cash flow and closing note stay company-wide while the profit-and-loss follows the picked branches
     (payroll by staff home branch, depreciation by the branch the asset was recorded in).
   · Pages: 00 home · 01 appointments · 06.2 / 06.5 / 06.6 expenses · 07 category summary + printed stock report ·
     08 health / tax / statements (08 expenses follow the register's own branch filter) · 09 workload. */
(()=>{
 const B=()=>window.PKG_BRANCH;if(!B()||typeof renderHome!=='function')return;
 const $i=id=>document.getElementById(id);
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const MAIN=B().MAIN;
 const DOCS=['quotes','receipts','invoices','billings','purchases','claims','issues','stockCounts','stockCuts','transfers','custClaims','expenses','assets','hr','warns','moves','crm'];
 const empHome=e=>(e&&(e.branchHome||(Array.isArray(e.branches)&&e.branches[0])))||MAIN;
 /* branches a report may show: every branch the account may use, closed ones included (their history still counts) */
 const reportable=()=>B().list().filter(b=>B().access(b.id));
 const S={};                                   /* key → picked branch ids (empty = all reportable) */
 const picked=key=>{const ok=new Set(reportable().map(b=>b.id));return (S[key]||[]).filter(id=>ok.has(id));};
 function resolve(key){const p=key==='exp'?expPicked():picked(key);return p.length?p:reportable().map(b=>b.id);}
 const expPicked=()=>{const f=window.PKG_REG_FILTER;const p=f?(f.state('expTbl').br||[]):[];const ok=new Set(reportable().map(b=>b.id));return p.filter(id=>ok.has(id));};
 const isAll=ids=>{const all=B().list();return all.every(b=>ids.includes(b.id));};
 const partial=key=>!isAll(resolve(key));
 function label(ids){const L=B().list();if(isAll(ids))return 'ทุกสาขา';return ids.map(id=>{const b=B().get(id);return b?b.code+' · '+b.name:id;}).join(', ');}

 /* ---------- the scope ---------- */
 let ACTIVE=false;
 function scope(ids,fn){
  if(ACTIVE||typeof DB!=='object'||!DB||!Array.isArray(DB.stock))return fn();
  const Br=B();Br.ensure();
  const one=ids.length===1?ids[0]:null;
  if(one&&one!==Br.ctx()&&Br.get(one))return Br.within(one,()=>inner(ids,fn));
  return inner(ids,fn);
 }
 function inner(ids,fn){
  const Br=B(),all=isAll(ids),set=new Set(ids),keep={},undo=[];
  ACTIVE=true;
  /* 1 · hold saves */
  const sv=window.save;let want=null;window.save=function(){want=arguments;return Promise.resolve();};undo.push(()=>{window.save=sv;});
  try{
   /* 2 · stock of several branches: summed quantities, FIFO value per branch */
   const ctxId=DB.stockCtx||MAIN,multi=ids.length>1||(ids.length===1&&ids[0]!==Br.ctx());
   if(multi&&Br.list().length>1){
    const vm={},fifo=window.pkgFifo;
    if(fifo)ids.forEach(id=>{if(Br.get(id))Br.within(id,()=>DB.stock.forEach(s=>{vm[s.id]=(vm[s.id]||0)+fifo.value(s);}));});
    const real=DB.stock;
    DB.stock=real.map(s=>{const c=Object.assign({},s);let q=0,mn=0,mx=0,lm='';
     ids.forEach(id=>{const v=id===ctxId?s:((s.bq&&s.bq[id])||{});q+=n(v.qty);mn+=n(v.min);mx+=n(v.max);if(String(v.lastMove||'')>lm)lm=String(v.lastMove||'');});
     c.qty=q;c.min=mn;c.max=mx;c.lastMove=lm;return c;});
    undo.push(()=>{DB.stock=real;});
    if(fifo){const fv=window.pkgFifoValue;window.pkgFifoValue=s=>s&&vm[s.id]!=null?vm[s.id]:(s?n(s.qty)*n(s.cost):0);undo.push(()=>{window.pkgFifoValue=fv;});}
   }
   /* 3 · documents of the picked branches */
   if(!all){
    const rcBr={};(DB.receipts||[]).forEach(r=>{rcBr[r.id]=Br.brOf(r);});
    const of=(k,d)=>k==='crm'&&!d.br&&d.refId&&rcBr[d.refId]?rcBr[d.refId]:Br.brOf(d);
    DOCS.forEach(k=>{if(!Array.isArray(DB[k]))return;keep[k]=DB[k];DB[k]=DB[k].filter(d=>set.has(of(k,d)));});
    undo.push(()=>{Object.keys(keep).forEach(k=>{DB[k]=keep[k];});});
    /* payroll: staff by home branch */
    ['empActiveList','empListOfMonth'].forEach(name=>{const o=window[name];if(typeof o!=='function')return;
     window[name]=function(){const r=o.apply(this,arguments);return Array.isArray(r)?r.filter(e=>set.has(empHome(e))):r;};undo.push(()=>{window[name]=o;});});
   }
   return fn();
  }finally{
   for(let i=undo.length-1;i>=0;i--)try{undo[i]();}catch(e){console.error('branch-report',e);}
   ACTIVE=false;
   if(want)sv.apply(window,want);
  }
 }
 const run=(key,fn)=>scope(resolve(key),fn);
 const company=fn=>scope(B().list().map(b=>b.id),fn);

 /* printed headings carry the branch line */
 let PRINT=null;   /* {text, only:[titles] | null} */
 const wrapHead=name=>{const o=window[name];if(typeof o!=='function')return;
  window[name]=function(a,b){
   if(PRINT&&PRINT.text){
    if(name==='sheetTop'&&a&&typeof a==='object'&&(!PRINT.only||PRINT.only.includes(a.title)))a=Object.assign({},a,{fields:[...(a.fields||[]),['สาขา',esc2(PRINT.text)]]});
    if(name==='repHead'&&(!PRINT.only||PRINT.only.includes(a)))b=(b||'')+'<br>สาขา: '+esc2(PRINT.text);
   }
   return o.call(this,a,b);};};
 wrapHead('sheetTop');wrapHead('repHead');
 const printing=(key,only,fn)=>{const prev=PRINT;PRINT={text:label(resolve(key)),only};try{return fn();}finally{PRINT=prev;}};

 /* ---------- picker ---------- */
 const RERENDER={home:()=>renderHome(),crm:()=>renderCrm(),exp06:()=>renderBuyPane(),work:()=>renderWorkload(),acct:()=>renderAcct(),
  stock:()=>{renderCatSummary();if($i('mStockRep')&&$i('mStockRep').classList.contains('on'))refreshRep();}};
 const sumText=key=>{const p=picked(key);return !p.length?'เลือกทั้งหมด':p.map(id=>(B().get(id)||{}).name||id).join(', ');};
 function pickerHtml(key){
  const p=picked(key);
  return `<span class="hint">คลังสินค้า / สาขา</span><details class="pkg-ms"><summary>${esc2(sumText(key))}</summary><div class="pkg-ms-pop">
   <input type="text" class="pkg-ms-q" placeholder="ค้นหาสาขา" aria-label="ค้นหาสาขา"><div class="pkg-ms-all"><button type="button" data-ms="all">เลือกทั้งหมด</button><button type="button" data-ms="none">ยกเลิกทั้งหมด</button></div>
   <div class="pkg-ms-list">${reportable().map(b=>`<label><input type="checkbox" data-rbr="${esc2(b.id)}" ${p.includes(b.id)?'checked':''}> ${esc2(b.name)} <span class="hint">${esc2(b.code)}${b.active===false?' · ไม่ใช้งาน':''}</span></label>`).join('')}</div></div></details>`;
 }
 const sig={};
 function paint(key){
  const els=document.querySelectorAll(`.pkg-rbr[data-key="${key}"]`);if(!els.length)return;
  const k=[reportable().map(b=>b.id+(b.active===false?'x':'')+b.name).join(','),curEmp()?curEmp().id:''].join('|');
  els.forEach(el=>{
   el.hidden=el.dataset.off==='1';   /* always shown, one branch too (user 2026-10-06) */
   if(sig[key+'#'+el.dataset.n]!==k||!el.firstChild){sig[key+'#'+el.dataset.n]=k;const open=el.querySelector('.pkg-ms[open]');el.innerHTML=pickerHtml(key);if(open)el.querySelector('.pkg-ms').open=true;}
   else{el.querySelector('summary').textContent=sumText(key);el.querySelectorAll('input[data-rbr]').forEach(i=>{i.checked=picked(key).includes(i.dataset.rbr);});}
  });
 }
 let seq=0;
 function picker(key,cls){
  const el=document.createElement('div');el.className='pkg-rbr'+(cls?' '+cls:'');el.dataset.key=key;el.dataset.n=String(++seq);el.hidden=true;
  el.addEventListener('change',e=>{const t=e.target;if(!t.dataset.rbr)return;const s=new Set(picked(key));t.checked?s.add(t.dataset.rbr):s.delete(t.dataset.rbr);S[key]=[...s];paint(key);RERENDER[key]&&RERENDER[key]();});
  el.addEventListener('click',e=>{const m=e.target.closest('[data-ms]');if(!m)return;S[key]=m.dataset.ms==='all'?reportable().map(b=>b.id):[];paint(key);RERENDER[key]&&RERENDER[key]();});
  el.addEventListener('input',e=>{if(!e.target.classList.contains('pkg-ms-q'))return;const q=e.target.value.trim().toLowerCase();el.querySelectorAll('.pkg-ms-list label').forEach(l=>{l.hidden=!!q&&!l.textContent.toLowerCase().includes(q);});});
  document.addEventListener('click',e=>{const d=el.querySelector('.pkg-ms[open]');if(d&&!d.contains(e.target))d.open=false;});
  return el;
 }

 /* ---------- wrapping the pages ---------- */
 function wrap(name,key,opt){const o=window[name];if(typeof o!=='function')return;opt=opt||{};
  window[name]=function(){const a=arguments,self=this;paint(key);const go=()=>run(key,()=>o.apply(self,a));return opt.print?printing(key,opt.only||null,go):go();};}
 wrap('renderHome','home');
 wrap('renderCrm','crm');
 ['renderUtil','renderOffice','renderOther'].forEach(n=>wrap(n,'exp06'));
 wrap('renderCatSummary','stock');wrap('printCatSummary','stock',{print:1});
 wrap('openStockRep','stock');wrap('updateRpInfo','stock');wrap('printStockRep','stock',{print:1});
 function refreshRep(){const c=$i('rpCat');if(!c)return;const v=c.value;run('stock',()=>{c.innerHTML='<option value="">ทุกหมวด</option>'+CATS.map(x=>`<option value="${esc2(x)}">${esc2(x)} (${DB.stock.filter(s=>(s.cat||'อื่น ๆ')===x).length} รายการ)</option>`).join('');});c.value=v;updateRpInfo();}
 wrap('renderTax','acct');wrap('printTaxReports','acct',{print:1});
 wrap('renderWorkload','work');wrap('printWorkload','work',{print:1});
 wrap('renderExp','exp');
 /* 08 health: cash, ROI and ROA stay company-wide */
 const CASH=['cash','invest','loan','draw','repay','ownerCap','payrollPaid','loanOut','roi','roa'];
 function healthRun(fn){
  const key='acct';paint(key);if(!partial(key))return run(key,fn);
  const y=acctY(),full=company(()=>finance(y)),fo=window.finance;
  return run(key,()=>{window.finance=function(yy){const f=fo.apply(this,arguments);if(f&&yy===full.y)CASH.forEach(k=>{f[k]=full[k];});return f;};try{return fn();}finally{window.finance=fo;}});
 }
 if(typeof renderHealth==='function'){const o=renderHealth;
  window.renderHealth=function(){const a=arguments,self=this;
   if(!partial('acct')){paint('acct');const r=run('acct',()=>o.apply(self,a));mark(false);return r;}
   company(()=>o.apply(self,a));const cash=$i('cashTbl')&&$i('cashTbl').tBodies[0]?$i('cashTbl').tBodies[0].innerHTML:null;
   const r=healthRun(()=>o.apply(self,a));
   if(cash!=null)$i('cashTbl').tBodies[0].innerHTML=cash;
   mark(true);return r;};}
 if(typeof printHealth==='function'){const o=printHealth;window.printHealth=function(){const a=arguments,self=this;return printing('acct',null,()=>healthRun(()=>o.apply(self,a)));};}
 /* 08 statements: profit-and-loss per branch, the rest company-wide */
 if(typeof renderFS==='function'){const o=renderFS;
  window.renderFS=function(){const a=arguments,self=this;paint('acct');
   if(!partial('acct')){const r=run('acct',()=>o.apply(self,a));mark(false);return r;}
   company(()=>o.apply(self,a));
   const take=['bsTbl','cfTbl'].map(id=>[id,$i(id)&&$i(id).tBodies[0]?$i(id).tBodies[0].innerHTML:null]),note=$i('closingNote')?$i('closingNote').innerHTML:null;
   const r=run('acct',()=>o.apply(self,a));
   take.forEach(([id,h])=>{if(h!=null)$i(id).tBodies[0].innerHTML=h;});if(note!=null)$i('closingNote').innerHTML=note;
   mark(true);return r;};}
 if(typeof printFS==='function'){const o=printFS;window.printFS=function(){const a=arguments,self=this;return printing('acct',['งบกำไรขาดทุน'],()=>o.apply(self,a));};}
 /* chips saying which part follows the branches and which is the whole business */
 function mark(on){
  const L=label(resolve('acct'));
  [['plTbl','สาขา: '+L],['cashTbl','ทั้งกิจการ'],['bsTbl','ทั้งกิจการ'],['cfTbl','ทั้งกิจการ']].forEach(([id,t])=>{
   const h=$i(id)&&$i(id).closest('.panel')&&$i(id).closest('.panel').querySelector('header h2');if(!h)return;
   let c=h.parentElement.querySelector('.pkg-rbr-chip');
   if(!on){if(c)c.remove();return;}
   if(!c){c=document.createElement('span');c.className='tag pkg-rbr-chip';h.after(c);}c.textContent=t;});
 }

 /* ---------- placing the pickers ---------- */
 function mount(){
  const put=(key,where,how,cls)=>{if(!where)return null;const el=picker(key,cls);where[how](el);paint(key);return el;};
  /* 00 home: a bar above section 1 */
  const home=$i('v-home');
  if(home){const bar=document.createElement('div');bar.className='pkg-rbr-bar';const hq=$i('hqHome');(hq||home.firstChild)&&(hq?hq.after(bar):home.prepend(bar));put('home',bar,'append');}
  put('crm',$i('crmFilter'),'before');
  ['utilYear','offYear','othYear'].forEach(id=>put('exp06',$i(id),'before'));
  const tier=$i('sumTier');put('stock',tier&&tier.closest('label'),'before');
  const rep=$i('mStockRep')&&$i('mStockRep').querySelector('.body');put('stock',rep,'prepend','pkg-rbr-f');
  const ay=$i('acctYear');const acct=put('acct',ay&&ay.closest('label'),'before');
  put('work',$i('loadScope'),'before');
  /* 08: only the panes that follow it */
  if(acct&&typeof acctGo==='function'){const ag=acctGo;const vis=()=>{const p=typeof acctPane==='string'?acctPane:'health';acct.dataset.off=['health','tax','fs'].includes(p)?'0':'1';paint('acct');};
   window.acctGo=function(){const r=ag.apply(this,arguments);vis();return r;};vis();}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0));else setTimeout(mount,0);
 /* the working branch / staff change: lists follow */
 const ap=window.applyPerms;if(typeof ap==='function')window.applyPerms=function(){const r=ap.apply(this,arguments);try{Object.keys(RERENDER).forEach(paint);}catch(e){}return r;};

 window.PKG_BRANCH_REPORT={state:S,picked,resolve,label,scope,run,company,paint,partial,reportable,empHome};
})();
