/* Filter panel over the registers (user 2026-10-02/04, like the reference ERP): dropdowns (branch / recorder / …) and
   tick groups (statuses) to narrow a register down. Ticks inside one group are OR, groups and dropdowns are AND, nothing
   chosen = no narrowing. Works through sortRows (every register sorts its filtered rows there before paging), so paging,
   ลำดับ numbers and Excel / PDF all follow the filter. Document registers are always limited to branches the account
   may use; the branch dropdown defaults to the working branch (branch.js). Date basis (document date / created /
   approved) re-targets the register's own date-range filter. The registers' older dropdowns stay as they are. */
(()=>{
 if(typeof sortRows!=='function')return;
 const BR=()=>window.PKG_BRANCH,$i=id=>document.getElementById(id);
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const today=()=>iso();
 const rec=x=>x&&(x.obj||x.p||x.r||x.c||x);            /* the stored record behind a register row */
 const apvSt=d=>d.cancelled?'cancel':(apvOf(d).status||'draft');
 const APV={label:'สถานะเอกสาร',of:x=>apvSt(rec(x)),opts:[['draft','ร่าง'],['pending','รออนุมัติ'],['approved','อนุมัติแล้ว'],['rejected','ไม่อนุมัติ'],['cancel','ยกเลิก']]};
 const by=x=>byShort(rec(x))||'';
 const BYDD={key:'by',label:'ผู้บันทึก',opts:()=>[['เจ้าของกิจการ','เจ้าของกิจการ'],...DB.emp.map(e=>[e.name,e.name])],test:(x,v)=>by(x)===v};
 const VENDD={key:'ven',label:'ผู้ขาย',opts:()=>DB.vendors.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'th')).map(v=>[v.id,v.name]),test:(x,v)=>rec(x).vendorId===v};
 const billed=()=>typeof billedQuoteIds==='function'?billedQuoteIds():new Set();
 const CFG={
  qOvTbl:{doc:1,date:'qOvDate',dd:[BYDD,{key:'tech',label:'ช่างผู้ประเมิน',opts:()=>DB.emp.map(e=>[e.id,e.name]),test:(x,v)=>x.tech===v}],
   ck:[{...APV,opts:[...APV.opts,['superseded','แก้ไขเป็นฉบับใหม่']],of:x=>x.superseded?'superseded':apvSt(x)},
    {k:'cut',label:'ตัดสต็อก',opts:[['y','ตัดสต็อกแล้ว'],['n','ยังไม่ตัด']],of:x=>x.deducted?'y':'n'},
    {k:'bill',label:'ใบเสร็จ',opts:[['y','ออกแล้ว'],['n','ยังไม่ออก']],of:(x,m)=>(m.b||(m.b=billed())).has(x.id)?'y':'n'}]},   /* new sales flow: "ออกแล้ว" = the quote has a sale (its ledger record counts as billed) */
  docOvTbl:{doc:1,date:'docOvDate',dd:[BYDD,{key:'kind',label:'ประเภทเอกสาร',opts:()=>[['rec','ใบเสร็จรับเงิน'],['inv','ใบแจ้งหนี้']],test:(x,v)=>x.kind===v}],
   ck:[APV,{k:'pay',label:'การชำระเงิน',opts:[['paid','ชำระแล้ว'],['unpaid','ค้างชำระ'],['over','เกินกำหนด']],of:x=>docPayState(x,today())},
    {k:'tax',label:'ใบกำกับภาษี',opts:[['y','มีใบกำกับภาษี'],['n','ไม่มี']],of:x=>x.obj&&x.obj.taxNo&&!x.obj.taxCancelled?'y':'n'}]},
  bnTbl:{doc:1,date:'bnOvDate',dd:[BYDD],ck:[{k:'st',label:'สถานะ',opts:[['wait','รอรับชำระ'],['done','รับชำระแล้ว'],['cancel','ยกเลิก']],of:x=>x.cancelled?'cancel':x.settled?'done':'wait'}]},
  taxOvTbl:{doc:1,dd:[BYDD],ck:[{k:'st',label:'สถานะใบกำกับ',opts:[['on','ใช้งาน'],['off','ยกเลิก']],of:x=>x.d&&x.d.cancelled?'off':'on'},{k:'pay',label:'การชำระเงิน',opts:[['paid','ชำระแล้ว'],['unpaid','ค้างชำระ']],of:x=>x.r&&x.r.paid?'paid':'unpaid'}]},
  grTbl:{doc:1,date:'grOvDate',dd:[BYDD,VENDD],ck:[APV,
    {k:'pay',label:'การจ่ายเงิน',opts:[['paid','จ่ายแล้ว'],['wait','รอจ่ายเจ้าหนี้'],['over','เกินกำหนด']],of:x=>x.paid?'paid':(x.term==='credit'&&(x.due||x.date)<today()?'over':'wait')},
    {k:'term',label:'เงื่อนไข',opts:[['cash','เงินสด'],['credit','เครดิต']],of:x=>x.term==='credit'?'credit':'cash'}]},
  clTbl:{doc:1,date:'clmDate',dd:[BYDD,VENDD],ck:[APV,{k:'st',label:'สถานะเคลม',opts:()=>Object.entries(typeof CLAIM_ST==='object'?CLAIM_ST:{}).map(([k,v])=>[k,v[0]]),of:x=>x.status||'open'}]},
  ccTbl:{doc:1,date:'ccDate',dd:[BYDD],ck:[{k:'st',label:'สถานะเคลม',opts:[['open','รับเรื่องแล้ว'],['vendor','ส่งเคลมผู้ขายแล้ว'],['done','เปลี่ยนให้ลูกค้าแล้ว'],['reject','ปฏิเสธเคลม'],['cancel','ยกเลิก']],of:x=>x.cancelled?'cancel':(x.status||'open')}]},
  isTbl:{doc:1,date:'isuDate',dd:[BYDD,{key:'dept',label:'แผนก / ผู้เบิก',opts:()=>[...new Set((DB.issues||[]).map(d=>d.dept).filter(Boolean))].map(v=>[v,v]),test:(x,v)=>x.dept===v}],
   ck:[APV,{k:'cut',label:'ตัดสต๊อก',opts:[['y','ตัดสต๊อกแล้ว'],['n','ยังไม่ตัด']],of:x=>x.deducted?'y':'n'}]},
  scTbl:{doc:1,date:'scnDate',dd:[BYDD],ck:[APV]},
  /* ระบบขายแบบใหม่ (sale-docs.js): rows are {c: sale} / {p: payment} / {x: expense}; their own status select stays in the header */
  sinvTbl:{doc:1,date:'sinvDate',dd:[BYDD],ck:[]},srcpTbl:{doc:1,date:'srcpDate',dd:[BYDD],ck:[]},swhtTbl:{doc:1,date:'swhtDate',dd:[BYDD],ck:[]},swhtOutTbl:{doc:1,date:'swhtOutDate',dd:[BYDD],ck:[]},
  scutTbl:{doc:1,date:'scutDate',dd:[BYDD],ck:[
    {k:'paym',label:'วิธีชำระ',opts:[['cash','เงินสด'],['trans','เงินโอน'],['card','บัตร'],['chk','เช็ค'],['credit','เงินเชื่อ'],['none','รอรับชำระ']],multi:x=>x.pay?(x.pay.methods||[x.pay.method]):['none']}   /* 'none' = no payment recorded yet; shown as "รอรับชำระ" (owner 2026-10-12, was "ยังไม่ระบุ") */,
    {k:'bill',label:'ใบเสร็จ',opts:[['y','ออกแล้ว'],['n','ยังไม่ออก']],of:x=>window.PKG_SALE&&PKG_SALE.on()&&PKG_SALE.led(x)?((PKG_SALE.led(x).payments||[]).some(p=>!p.cancelled&&(p.reNo||p.src==='legacy'))?'y':'n'):window.PKG_STOCK_CUT&&PKG_STOCK_CUT.saleBills(x,false).length?'y':'n'}]},   /* new sales flow: a receipt = a payment received */
  stockTbl:{stock:1,dd:[{key:'zone',label:'โซนจัดเก็บ',opts:()=>(typeof ZONES!=='undefined'?ZONES:[]).map(z=>[z,'โซน '+z]),test:(x,v)=>String(x.zone||'').toUpperCase()===v}],
   ck:[{k:'flag',label:'สัญญาณเตือน',opts:[['min','ถึง / ต่ำกว่า Min'],['max','เกิน Max'],['zero','หมดสต๊อก'],['stale','ไม่เคลื่อนไหว']],multi:x=>{const f=flags(x),o=[];if(f.min)o.push('min');if(f.max)o.push('max');if(f.stale)o.push('stale');if(n(x.qty)<=0)o.push('zero');return o;}},
    {k:'img',label:'รูปอะไหล่',opts:[['y','มีรูป'],['n','ไม่มีรูป']],of:x=>x.img?'y':'n'}]},
  aArTbl:{doc:1,rec:x=>x.obj||DB.receipts.find(r=>r.id===x.id)||DB.invoices.find(v=>v.id===x.id)||x,ownDate:'aArDate',def:{arst:'out'},
   dd:[{key:'arst',label:'สถานะลูกหนี้',opts:()=>[['out','ค้างชำระ'],['part','ชำระบางส่วน'],['paid','ชำระครบแล้ว']],
    test:(x,v)=>v==='out'?!x.paid:v==='part'?!x.paid&&n(x.paidAmt)>0:v==='paid'?!!x.paid:true}],ck:[{k:'due',label:'กำหนดชำระ',opts:[['over','เกินกำหนด'],['in','ยังไม่ถึงกำหนด']],of:x=>!x.paid&&daysBetween(x.due||x.date,today())>0?'over':'in'}]},
  aApTbl:{doc:1,ownDate:'aApDate',dateOf:x=>x.p.date,def:{apst:'out'},
   dd:[{key:'apst',label:'สถานะเจ้าหนี้',opts:()=>[['out','ค้างชำระ'],['part','ชำระบางส่วน'],['paid','ชำระครบแล้ว']],
    test:(x,v)=>v==='out'?!x.p.paid:v==='part'?!x.p.paid&&n(x.paidAmt)>0:v==='paid'?!!x.p.paid:true},{...VENDD}],ck:[{k:'due',label:'กำหนดชำระ',opts:[['over','เกินกำหนด'],['in','ยังไม่ถึงกำหนด']],of:x=>!x.p.paid&&n(x.over)>0?'over':'in'},
    {k:'term',label:'เงื่อนไข',opts:[['cash','เงินสด'],['credit','เครดิต']],of:x=>x.p.term==='credit'?'credit':'cash'}]},
  expTbl:{doc:1,dd:[BYDD],ck:[{k:'tax',label:'ภาษี',opts:[['vat','มี VAT'],['wht','มีหัก ณ ที่จ่าย']],multi:x=>{const o=[];if(n(x.vat)>0)o.push('vat');if(n(x.wht)>0)o.push('wht');return o;}}]},
  crmTbl:{ownDate:'crmDate',q:{id:'crmSearch',of:k=>{const c=typeof findCust==='function'?findCust(k.custId):null,v=c&&(c.vehicles||[])[k.vehIdx];return [c&&c.name,c&&c.company,c&&c.tel,c&&c.tel2,c&&c.code,v&&(typeof plateOf==='function'?plateOf(v):v.plate),v&&v.brand,v&&v.model,k.note,k.refNo,k.owner].filter(Boolean).join(' ');}},dd:[BYDD],ck:[{k:'st',label:'การติดตาม',opts:[['late','เลยกำหนด'],['wait','ยังไม่ถึงกำหนด'],['done','ติดตามแล้ว']],of:x=>x.done?'done':String(x.date||'')<today()?'late':'wait'}]},
  custLTbl:{dd:[{key:'star',label:'เกรดดาว',opts:()=>[5,4,3,2,1].map(k=>[String(k),'★'.repeat(k)]),test:(x,v)=>String(n(x.c&&x.c.star))===v},
    {key:'tier',label:'ระดับราคา',opts:()=>[['A','ราคาขาย A'],['B','ราคาขาย B'],['C','ราคาขาย C']],test:(x,v)=>((x.c&&x.c.tier)||'B')===v}],
   ck:[{k:'type',label:'ประเภทลูกค้า',opts:[['company','นิติบุคคล'],['person','บุคคลธรรมดา']],of:x=>x.c&&x.c.type==='company'?'company':'person'}]},
  venTbl:{dd:[],ck:[{k:'type',label:'ประเภทผู้ขาย',opts:[['company','นิติบุคคล'],['person','บุคคลธรรมดา']],of:x=>x.type==='company'?'company':'person'}]},
  empTbl:{dd:[{key:'pos',label:'ตำแหน่ง',opts:()=>[...new Set(DB.emp.map(e=>e.position).filter(Boolean))].map(v=>[v,v]),test:(x,v)=>x.position===v}],
   ck:[{k:'act',label:'สถานะบัญชี',opts:[['on','ใช้งาน'],['off','ปิดบัญชี']],of:x=>(typeof empActive==='function'?empActive(x):x.active!==false)?'on':'off'}]}
 };
 APV.k='apv';Object.values(CFG).forEach(c=>c.ck.forEach(g=>{if(!g.k)g.k='apv';}));
 const BASIS=false;   /* user 2026-10-07: document dates are locked (doc-date-lock.js) = creation date → no สร้าง / เอกสาร / อนุมัติ choice */
 const DATE_TBL=Object.fromEntries(Object.entries(CFG).filter(([,c])=>c.date).map(([id,c])=>[c.date,id]));
 const S={};const fresh=id=>({dd:Object.assign({},(CFG[id]||{}).def||{}),ck:{},br:[],basis:'doc'});   /* def = the register's starting choice (08 ลูกหนี้: ค้างชำระ) */
 const st=id=>S[id]||(S[id]=fresh(id));
 const optsOf=g=>typeof g.opts==='function'?g.opts():g.opts;
 /* ---------- applying ---------- */
 function brOk(c,s,x){
  const B=BR();if(!B||!c.doc)return true;const d=c.rec?c.rec(x):rec(x),id=B.brOf(d),pick=s.br||[];
  if(!B.access(id))return false;                       /* never a branch the account may not use */
  return !pick.length||pick.includes(id);              /* nothing picked = every branch it may use (user 2026-10-04) */
 }
 function apply(id,rows){
  const c=CFG[id],s=st(id),memo={};
  if(c.ownDate&&typeof applyDateFilter==='function')   /* registers whose page has no date range of its own; dateOf = where the row keeps its date */
   rows=c.dateOf?applyDateFilter(rows.map(x=>({date:c.dateOf(x)||'',__x:x})),c.ownDate).map(t=>t.__x):applyDateFilter(rows,c.ownDate);
  const dds=c.dd.filter(d=>s.dd[d.key]),cks=c.ck.map(g=>[g,Object.keys(s.ck[g.k]||{}).filter(k=>s.ck[g.k][k])]).filter(([,on])=>on.length);
  /* registers whose page had no search box of its own (01): text typed in the box the config names */
  const qt=c.q?String(($i(c.q.id)||{}).value||'').trim().toLowerCase():'';
  return rows.filter(x=>{
   if(qt&&!String(c.q.of(x)||'').toLowerCase().includes(qt))return false;
   if(!brOk(c,s,x))return false;
   for(const d of dds)if(!d.test(x,s.dd[d.key]))return false;
   for(const [g,on] of cks){const v=g.multi?g.multi(x):[g.of(x,memo)];if(!on.some(k=>v.includes(k)))return false;}
   return true;});
 }
 const so=sortRows;
 sortRows=function(id,rows){if(CFG[id]&&Array.isArray(rows)){try{rows=apply(id,rows);}catch(e){console.error('reg-filter',id,e);}refresh(id);}return so.call(this,id,rows);};
 /* date basis: the register's own date-range filter looks at another date */
 const alt=(x,b)=>{const d=rec(x);if(b==='made')return d.createdAt?iso(new Date(d.createdAt)):(d.date||'');if(b==='apv')return apvOf(d).status==='approved'?String(apvOf(d).date||'').slice(0,10):'';return x.date;};
 if(typeof applyDateFilter==='function'){const ad=applyDateFilter;
  applyDateFilter=function(rows,prefix){const id=DATE_TBL[prefix],b=id&&st(id).basis;if(!b||b==='doc'||!Array.isArray(rows))return ad.apply(this,arguments);
   return ad.call(this,rows.map(x=>({date:alt(x,b),__x:x})),prefix).map(t=>t.__x);};}
 /* ---------- panel ---------- */
 const REGS=()=>(window.PKG_REG_EXPORT&&PKG_REG_EXPORT.registers)||{};
 function rerender(id){const r=REGS()[id]||{};if(r.p&&typeof LIM_PAGE==='object')LIM_PAGE[r.p]=1;const fn=r.render&&window[r.render];if(typeof fn==='function')fn();else if(id==='kit-register'&&LIM_RENDER.kit)LIM_RENDER.kit();}
 const sig={};
 function brOpts(c){const B=BR();if(!B)return null;
  if(c.stock)return [['','สาขาที่ทำงานอยู่ ('+B.cur().code+')'],['all','ทุกสาขา (ยอดรวม)'],...B.accessible().filter(b=>b.id!==B.ctx()).map(b=>[b.id,b.code+' · '+b.name+' (ดูยอด)'])];
  return null;}
 /* document registers: multi-select like the reference (search · select all · clear) */
 const msLabel=s=>{const B=BR(),p=(s.br||[]).filter(id=>B.access(id));return !p.length?'เลือกทั้งหมด':p.map(id=>(B.get(id)||{}).name||'').join(', ');};
 function msHtml(id,s){const B=BR();if(!B)return '';
  return `<div class="f pkg-ms-wrap"><span>คลังสินค้า / สาขา</span><details class="pkg-ms"><summary>${esc2(msLabel(s))}</summary><div class="pkg-ms-pop">
   <input type="text" class="pkg-ms-q" placeholder="ค้นหาสาขา" aria-label="ค้นหาสาขา"><div class="pkg-ms-all"><button type="button" data-ms="all">เลือกทั้งหมด</button><button type="button" data-ms="none">ยกเลิกทั้งหมด</button></div>
   <div class="pkg-ms-list">${B.accessible().map(b=>`<label><input type="checkbox" data-br="${esc2(b.id)}" ${(s.br||[]).includes(b.id)?'checked':''}> ${esc2(b.name)} <span class="hint">${esc2(b.code)}</span></label>`).join('')}</div></div></details></div>`;}
 function build(id){
  const c=CFG[id],s=st(id),box=document.querySelector(`.pkg-flt[data-for="${id}"]`);if(!box)return;
  const bo=brOpts(c),dds=[...(bo?[{key:'br',label:'คลังสินค้า / สาขา',list:bo,keep:1}]:[]),...c.dd.map(d=>({key:d.key,label:d.label,list:[['','เลือกทั้งหมด'],...d.opts()]}))];
  if(bo&&s.dd.br&&!bo.some(o=>o[0]===s.dd.br))s.dd.br='';
  const ms=c.doc?msHtml(id,s):'';
  if(!BASIS)s.basis='doc';
  const active=(s.br||[]).length||Object.entries(s.dd).some(([k,v])=>v!==((c.def||{})[k]||''))||Object.values(s.ck).some(g=>Object.values(g).some(Boolean))||s.basis!=='doc';
  const kept=[...box.children].filter(n=>n.dataset&&n.dataset.keep);kept.forEach(n=>n.remove());   /* reg-head.js parts survive the rebuild */
  box.innerHTML=(c.date&&BASIS?`<div class="pkg-flt-basis"><label><input type="radio" name="fb_${id}" value="made" ${s.basis==='made'?'checked':''}> วันที่สร้างข้อมูล</label><label><input type="radio" name="fb_${id}" value="doc" ${s.basis==='doc'?'checked':''}> วันที่เอกสาร</label><label><input type="radio" name="fb_${id}" value="apv" ${s.basis==='apv'?'checked':''}> วันที่อนุมัติ</label><span class="hint">ใช้กับ “เลือกช่วงวันที่”</span></div>`:'')
   +(dds.length||ms?`<div class="pkg-flt-dd">${ms}${dds.map(d=>`<label class="f"><span>${esc2(d.label)}</span><select data-dd="${d.key}">${d.list.map(([v,l])=>`<option value="${esc2(v)}"${(s.dd[d.key]||'')===String(v)?' selected':''}>${esc2(l)}</option>`).join('')}</select></label>`).join('')}</div>`:'')
   +`<div class="pkg-flt-ck">${c.ck.map(g=>`<div class="pkg-flt-g"><span>${esc2(g.label)}</span>${optsOf(g).map(([k,l])=>`<label><input type="checkbox" data-g="${g.k}" data-k="${esc2(k)}" ${s.ck[g.k]&&s.ck[g.k][k]?'checked':''}> ${esc2(l)}</label>`).join('')}</div>`).join('')}
    <button type="button" class="btn sm gh pkg-flt-clear" ${active?'':'hidden'}>ล้างตัวกรอง</button></div>`;
  kept.forEach(n=>box.append(n));if(window.PKG_REG_HEAD)try{PKG_REG_HEAD.arrange(id,box);}catch(e){console.error('reg-head',e);}
 }
 /* options follow the data (staff, vendors, branches, working branch) */
 function refresh(id){const B=BR(),k=[B?B.ctx():'',B?B.list().length:0,DB.emp.length,DB.vendors.length,(DB.issues||[]).length,curEmp()?curEmp().id:''].join('|');if(sig[id]!==k){sig[id]=k;build(id);}}
 function mount(id){
  const tbl=$i(id);if(!tbl||document.querySelector(`.pkg-flt[data-for="${id}"]`))return;
  const box=document.createElement('div');box.className='pkg-flt';box.dataset.for=id;
  const bar=document.querySelector(`.pkg-xbar[data-for="${id}"]`),scroll=tbl.closest('.scroll')||tbl;
  (bar||scroll).before(box);
  box.addEventListener('change',e=>{
   const s=st(id),t=e.target;
   if(t.dataset.br){const set=new Set(s.br||[]);t.checked?set.add(t.dataset.br):set.delete(t.dataset.br);s.br=[...set];box.querySelector('.pkg-ms summary').textContent=msLabel(s);
    box.querySelector('.pkg-flt-clear').hidden=false;return rerender(id);}   /* keep the list open while ticking */
   if(t.dataset.dd!=null)s.dd[t.dataset.dd]=t.value;
   else if(t.dataset.g){(s.ck[t.dataset.g]=s.ck[t.dataset.g]||{})[t.dataset.k]=t.checked;}
   else if(t.name==='fb_'+id)s.basis=t.value;
   else return;
   build(id);rerender(id);});
  box.addEventListener('click',e=>{
   const m=e.target.closest('[data-ms]');
   if(m){const s=st(id),all=m.dataset.ms==='all';s.br=all?BR().accessible().map(b=>b.id):[];box.querySelectorAll('.pkg-ms-list input').forEach(i=>i.checked=all);box.querySelector('.pkg-ms summary').textContent=msLabel(s);return rerender(id);}
   if(!e.target.closest('.pkg-flt-clear'))return;S[id]=fresh(id);build(id);rerender(id);});
  box.addEventListener('input',e=>{if(!e.target.classList.contains('pkg-ms-q'))return;const q=e.target.value.trim().toLowerCase();box.querySelectorAll('.pkg-ms-list label').forEach(l=>l.hidden=!!q&&!l.textContent.toLowerCase().includes(q));});
  document.addEventListener('click',e=>{const d=box.querySelector('.pkg-ms[open]');if(d&&!d.contains(e.target))d.open=false;});
  build(id);
 }
 const whenReady=fn=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,0));else setTimeout(fn,0);};
 whenReady(()=>Object.keys(CFG).forEach(mount));
 /* 07: looking at another branch's (or every branch's) quantities */
 if(typeof renderStock==='function'){const rs=renderStock;
  renderStock=function(){const out=rs.apply(this,arguments);try{const B=BR(),v=st('stockTbl').dd.br;if(B&&v){
    document.querySelectorAll('#stockTbl tbody tr[data-pkg-key]').forEach(tr=>{const s=DB.stock.find(x=>x.id===tr.dataset.pkgKey),td=tr.querySelector('td.sc-qty');if(!s||!td)return;const q=B.qtyAll(s);
     td.innerHTML=v==='all'?`<b>${qf(Object.values(q).reduce((a,b)=>a+b,0))}</b> <span class="hint">${esc2(s.unit||'')}</span><div class="pkg-br-split">${B.list().map(b=>esc2(b.code)+' '+qf(q[b.id])).join(' · ')}</div>`
      :`<b>${qf(q[v])}</b> <span class="hint">${esc2(s.unit||'')}</span><div class="pkg-br-split">${esc2((B.get(v)||{}).code||'')} (ดูยอด)</div>`;});}}catch(e){}return out;};}
 /* 01 ลูกค้าสัมพันธ์ (user 2026-10-11: "เพิ่มช่วงวันที่เข้าไปด้วยจะได้ง่ายตอนหาข้อมูล"): the same date-range controls as the
    other registers, on the appointment date (วันที่นัดหมาย). Starts on "เลือกทั้งหมด"; reg-head lays the three fields out. */
 (()=>{const f=$i('crmFilter'),head=f&&f.closest('header'),P='crmDate';if(!f||!head||$i(P+'Mode')||typeof renderCrm!=='function')return;
  const w=document.createElement('span');w.className='pkg-acct-date';w.style.display='contents';
  w.innerHTML=`<label class="f" style="margin:0"><span>ช่วงวันที่</span><select id="${P}Mode" style="width:150px"><option value="" selected>เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="one">วันที่ระบุ</option><option value="range">ช่วงวันที่</option><option value="month">เดือนปี</option></select></label>
   <input type="date" id="${P}D1" style="width:135px;display:none"><span id="${P}D2Wrap" style="display:none;white-space:nowrap"><span class="hint">ถึง</span> <input type="date" id="${P}D2" style="width:135px"></span>
   <span id="${P}MonthWrap" style="display:none;white-space:nowrap"><select id="${P}MonthM" style="width:125px"></select> <select id="${P}MonthY" style="width:95px"></select></span>`;
  f.before(w);
  /* and a search box like the other registers (customer / plate / phone / note) — reg-head adds the green search button */
  const q=document.createElement('input');q.type='text';q.id='crmSearch';q.placeholder='ค้นหา ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร + Enter';q.autocomplete='off';f.after(q);
  if(typeof fillYearSelect==='function')fillYearSelect(P+'MonthY');if(typeof fillMonthSelect==='function')fillMonthSelect(P+'MonthM');
  const go=()=>{if(typeof LIM_PAGE==='object')LIM_PAGE.crm=1;renderCrm();};
  q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});q.addEventListener('input',()=>{if(!q.value)go();});
  $i(P+'Mode').onchange=()=>{if(typeof toggleDateFilterUI==='function')toggleDateFilterUI(P);go();};
  [P+'D1',P+'D2',P+'MonthM',P+'MonthY'].forEach(id=>{const e=$i(id);if(e)e.onchange=go;});})();
 /* 08 ลูกหนี้ / เจ้าหนี้ (user 2026-10-08/09): a date range like the other registers, and the status (+ ชำระบางส่วน) as a
    dropdown beside คลังสินค้า / สาขา. The page's own status select stays (other code sets it) but is kept aside on
    "ทั้งหมด"; a value another screen puts there (e.g. the overdue alert → ค้างชำระ) is taken over by the dropdown. */
 [['aAr','aArTbl','renderAcctAR','arst'],['aAp','aApTbl','renderAcctAP','apst']].forEach(([pre,tid,fn,key])=>{
  const ns=$i(pre+'Status'),tools=ns&&ns.closest('.ptools');if(!ns||typeof window[fn]!=='function')return;
  const P=pre+'Date',draw=()=>window[fn]();
  /* The original gives the pager a redraw function for every register except these two (its list at "LIM_RENDER[p]=fn"
     has no aAr / aAp), so a click on page 2, 3 … only stored the page and nothing was drawn again — the page changed
     only when something else redrew the register (owner 2026-10-12: "ทำไมเปลี่ยนหน้าไม่ได้"). */
  if(typeof LIM_RENDER==='object'&&typeof LIM_PAGE==='object'){LIM_RENDER[pre]=draw;
   const lm=$i(pre+'Limit');if(lm)lm.onchange=()=>{LIM_PAGE[pre]=1;draw();};}
  if(tools&&!$i(P+'Mode')){const w=document.createElement('span');w.className='pkg-acct-date';w.style.display='contents';
   w.innerHTML=`<label class="f" style="margin:0"><span>ช่วงวันที่</span><select id="${P}Mode" style="width:150px"><option value="" selected>เลือกทั้งหมด</option><option value="today">วันปัจจุบัน</option><option value="one">วันที่ระบุ</option><option value="range">ช่วงวันที่</option><option value="month">เดือนปี</option></select></label>
    <input type="date" id="${P}D1" style="width:135px;display:none"><span id="${P}D2Wrap" style="display:none;white-space:nowrap"><span class="hint">ถึง</span> <input type="date" id="${P}D2" style="width:135px"></span>
    <span id="${P}MonthWrap" style="display:none;white-space:nowrap"><select id="${P}MonthM" style="width:125px"></select> <select id="${P}MonthY" style="width:95px"></select></span>`;
   (tools.querySelector('.spacer')||tools.firstChild).after(w);
   if(typeof fillYearSelect==='function')fillYearSelect(P+'MonthY');if(typeof fillMonthSelect==='function')fillMonthSelect(P+'MonthM');
   const go=()=>{if(typeof LIM_PAGE==='object')LIM_PAGE[pre]=1;draw();};
   $i(P+'Mode').onchange=()=>{if(typeof toggleDateFilterUI==='function')toggleDateFilterUI(P);go();};
   [P+'D1',P+'D2',P+'MonthM',P+'MonthY'].forEach(id=>{const e=$i(id);if(e)e.onchange=go;});}
  const aside=document.createElement('div');aside.hidden=true;aside.className='pkg-acct-aside';document.body.append(aside);aside.append(ns);
  const orig=window[fn];
  window[fn]=function(){
   if(ns.value!=='all'){const s=st(tid);s.dd[key]=ns.value==='paid'?'paid':ns.value==='out'?'out':'';ns.value='all';build(tid);}
   return orig.apply(this,arguments);};
  ns.value='all';
 });
 /* 05 ผู้ขาย rows, lighter (user 2026-10-09): the type is plain text (no badge) and the note / bank lines under the name are
    left out to save room — both stay in the vendor window and in search. Done after every draw, columns found by header. */
 (()=>{
  const t=$i('venTbl');if(!t||!t.tBodies[0])return;
  const col=lbl=>[...t.tHead.rows[0].cells].findIndex(h=>(h.dataset.lbl||h.textContent).replace(/[▴▾]/g,'').trim()===lbl);
  const tidy=()=>{const ty=col('ประเภท'),nm=col('ชื่อผู้ขาย'),n=t.tHead.rows[0].cells.length;
   [...t.tBodies[0].rows].forEach(tr=>{if(tr.cells.length!==n)return;
    const c=ty>=0&&tr.cells[ty],chip=c&&c.querySelector(':scope>.chip');if(chip){c.textContent=chip.textContent;c.classList.add('pkg-ven-type');}
    const nc=nm>=0&&tr.cells[nm];if(nc)nc.querySelectorAll(':scope>.hint:not(.pkg-code-line)').forEach(h=>h.remove());   /* the vendor code line (code-settings.js) stays */});};
  let tm=0;new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(tidy,0);}).observe(t.tBodies[0],{childList:true});tidy();
 })();
 window.PKG_REG_FILTER={config:CFG,state:st,apply,build,mount,clear:id=>{S[id]=fresh(id);build(id);}};
})();
