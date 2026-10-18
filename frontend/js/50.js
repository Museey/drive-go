/* วันหมดอายุของสินค้า + ล็อตสินค้า (user 2026-10-12) — stock-expiry.js + stock-expiry.css.
   · Product: s.expTrack (สินค้านี้มีวันหมดอายุ) · s.expMonths (อายุสินค้า เดือน, optional) · s.expWarn (เตือนล่วงหน้า วัน, 90).
   · Goods received line: it.lotNo (optional) and, for tracked products, it.expSrc 'exp' | 'mfg' · it.exp · it.mfg
     (+ it.mfgBy 'date' | 'week', it.mfgWk / it.mfgYr as typed, it.expMonths / it.expSaveMonths when the product has no
     shelf life yet). Approval is refused while a tracked line has no date.
   · FIFO lot (fifo-cost.js): lot.exp · lot.mfg · lot.expSrc · lot.lotNo — stamped when the lot is made (lotDates),
     carried to another branch by a transfer (incoming: one lot per source date), kept by cancel / restore (same lots).
   · Tracked products leave first-expired-first-out (fifo-cost.js plan()); a lot chosen on a document line (it.lotId,
     it.lotNo) leaves first; expired lots are sold only by an account with doc.sellExpired, otherwise skipped / blocked.
   · One lot window "แสดงล็อต" (#mLots): cards per lot, opened from the quantity in the 07 register, the product form,
     the product card, the report — and in PICK mode from a quote / 4.4 line.
   Hooks kept by other modules: stock-cut.js createDoc → PKG_EXPIRY.guardSale(lines) (one line);
   fifo-cost.js → PKG_EXPIRY.lotDates / incoming / consumeOpt / onOut. */
(()=>{
 if(typeof DB==='undefined'||typeof pkgFifo!=='object'||typeof logMove!=='function'||typeof renderStock!=='function'||typeof can!=='function')return;
 const $i=id=>document.getElementById(id),EPS=1e-9;
 const BR=()=>window.PKG_BRANCH,ctxBr=()=>BR()?BR().ctx():'main',brOf=x=>(x&&x.br)||'main';
 const today=()=>iso(),owner=()=>!curEmp();
 const stockOf=id=>(DB.stock||[]).find(x=>x.id===id)||null;
 const F=()=>DB.fifo&&Array.isArray(DB.fifo.lots)?DB.fifo:{lots:[],allocs:[]};
 const host=()=>document.getElementById('pkg-app')||document.body;
 const SVG=d=>'<svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
 const IC={pen:SVG('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  box:SVG('<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>'),
  warn:SVG('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
  xl:SVG('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 12l4 5M13 12l-4 5"/>'),
  print:SVG('<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>'),
  send:SVG('<path d="M4 12h13M12 6l6 6-6 6"/>'),out:SVG('<path d="M5 7h14l-1.2 12.5H6.2z"/><path d="M9 7V4.5h6V7M10 11v5M14 11v5"/>')};
 const maySell=()=>owner()||can('doc.sellExpired');
 if(typeof AUD_ACT==='object')Object.assign(AUD_ACT,{lotedit:'แก้ไขล็อตสินค้า',expsell:'ขาย / เบิกสินค้าหมดอายุ'});
 if(typeof AUD_CLS==='object')Object.assign(AUD_CLS,{lotedit:'a',expsell:'r'});

 /* ---------- dates ---------- */
 const isIso=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&!isNaN(new Date(v+'T00:00:00'));
 const d2=v=>isIso(v)?thDate(v):'',d2s=v=>{const t=d2(v);return t?t.slice(0,6)+t.slice(8):'';};   /* dd/mm/yyyy (พ.ศ.) · dd/mm/yy */
 function addMonths(v,m){if(!isIso(v))return '';const d=new Date(v+'T00:00:00'),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+Math.round(n(m)));
  d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return iso(d);}
 /* year as typed: พ.ศ. (2569), ค.ศ. (2026) or two digits (DOT code "24" = 2024, "69" = 2569) → ค.ศ. */
 const ceYear=y=>{y=Math.round(n(y));if(y>=2400)return y-543;if(y>=1900)return y;if(y>=43&&y<=99)return 1957+y;if(y>=0&&y<43)return 2000+y;return 0;};
 /* Monday of ISO week w of that year ('' when the pair is not a real week) */
 function weekToIso(w,y){w=Math.round(n(w));y=ceYear(y);if(!(w>=1&&w<=53)||!(y>=1990&&y<=2100))return '';
  const j=new Date(y,0,4),mon=new Date(y,0,4-((j.getDay()+6)%7)+(w-1)*7);return isoWeek(iso(mon)).y===y?iso(mon):'';}
 function isoWeek(v){const d=new Date(v+'T00:00:00'),t=new Date(d.getFullYear(),d.getMonth(),d.getDate()+3-((d.getDay()+6)%7)),y=t.getFullYear(),j=new Date(y,0,4);
  return{w:1+Math.round(((t-j)/86400000-3+((j.getDay()+6)%7))/7),y};}

 /* ---------- product / lot state ---------- */
 const tracked=s=>!!(s&&s.expTrack);
 const warnOf=s=>s&&s.expWarn!==''&&s.expWarn!=null&&n(s.expWarn)>=0?n(s.expWarn):90;
 const unitOf=s=>(s&&s.unit)||'ชิ้น';
 function lotState(s,l){if(!tracked(s))return 'none';if(!isIso(l.exp))return 'undated';const d=daysBetween(today(),l.exp);return d<0?'expired':d<=warnOf(s)?'soon':'ok';}
 const ST={expired:['หมดอายุแล้ว','r'],soon:['ใกล้หมดอายุ','a'],ok:['ปกติ','g'],undated:['ยังไม่ระบุวันหมดอายุ',''],none:['—','']};
 const stChip=k=>k==='none'?'':`<span class="chip ${ST[k][1]} pkg-exp-st">${ST[k][0]}</span>`;
 const byDate=(a,b)=>String(a.date).localeCompare(String(b.date))||n(a.seq)-n(b.seq);
 /* the ledger of a product in a branch is made on first contact (fifo-cost.js ensure) */
 const seen=new Set();   /* another branch's ledger is made once per session (its stock has to be swapped in to do it) */
 function ensureLots(id,br){try{if(!br||br===ctxBr())pkgFifo.lots(id);else if(BR()&&BR().get(br)&&!seen.has(id+'|'+br)){seen.add(id+'|'+br);BR().within(br,()=>pkgFifo.lots(id));}}catch(e){}}
 /* lots of one product. br: none = the working branch · 'all' = every branch the account may use · an id = that branch.
    Order = the order they leave: first-expired-first-out for tracked products (undated last), first-in-first-out otherwise. */
 function lotsOf(id,br,zero){
  const s=stockOf(id);if(!s)return [];
  const brs=br==='all'?(BR()?BR().accessible().map(b=>b.id):['main']):[br||ctxBr()];brs.forEach(b=>ensureLots(id,b));
  let list=F().lots.filter(l=>l.stockId===id&&brs.includes(brOf(l))&&(zero||n(l.left)>EPS)).sort(byDate);
  if(tracked(s))list=list.map((l,i)=>[l,i]).sort((a,b)=>String(a[0].exp||'9999-99-99').localeCompare(String(b[0].exp||'9999-99-99'))||a[1]-b[1]).map(p=>p[0]);
  return list;
 }
 /* PKG_EXPIRY.status(stockId, branch?) → quantities by state from the remaining lots; nearest = earliest date, next = earliest not yet expired */
 function status(id,br){
  const s=stockOf(id),o={tracked:tracked(s),expiredQty:0,soonQty:0,okQty:0,undatedQty:0,nearest:'',next:'',lots:0};if(!o.tracked)return o;
  const day=today();
  lotsOf(id,br).forEach(l=>{o[lotState(s,l)+'Qty']+=n(l.left);o.lots++;
   if(isIso(l.exp)){if(!o.nearest||l.exp<o.nearest)o.nearest=l.exp;if(l.exp>=day&&(!o.next||l.exp<o.next))o.next=l.exp;}});
  return o;
 }
 /* every lot has a number: its own (lot.lotNo) or one built from its document — "<เลขที่เอกสาร>-<ลำดับ>", else "<รหัสสินค้า>-L001" */
 let noIdx=null,noLen=-1;
 function autoNo(l){
  const all=F().lots;if(!noIdx||noLen!==all.length){noIdx=new Map();noLen=all.length;const g={};
   all.slice().sort((a,b)=>n(a.seq)-n(b.seq)).forEach(x=>{const k=x.refNo?'d|'+brOf(x)+'|'+x.refNo:'s|'+brOf(x)+'|'+x.stockId;g[k]=(g[k]||0)+1;noIdx.set(x.id,g[k]);});}
  const i=noIdx.get(l.id)||1;if(l.refNo)return l.refNo+'-'+i;const s=stockOf(l.stockId);return ((s&&s.code)||'LOT')+'-L'+String(i).padStart(3,'0');
 }
 const lotNo=l=>l?(String(l.lotNo||'').trim()||autoNo(l)):'';
 const lotById=id=>id?F().lots.find(l=>l.id===id)||null:null;
 const typeOf=l=>l.src==='gr'?'รับสินค้าเข้าคลัง':l.src==='count'?'ตรวจนับ':l.src==='open'||/ยอดยกมา/.test(l.ref||'')?'ยอดยกมา':/^รับโอนจากสาขา/.test(l.ref||'')?'โอนเข้าจากสาขา':/เคลม/.test(l.ref||'')?'รับคืนจากเคลม':'รับเข้า';

 /* ---------- goods received line → lot ---------- */
 const lineStock=it=>(it&&(it.stockId?stockOf(it.stockId):(String(it.code||'').trim()?(DB.stock||[]).find(x=>String(x.code||'').toLowerCase()===String(it.code).trim().toLowerCase()):null)))||null;
 const lineMonths=(it,s)=>n(s&&s.expMonths)>0?n(s.expMonths):n(it.expMonths)>0?n(it.expMonths):0;
 /* the expiry date a line resolves to ('' = still unknown) */
 function lineExp(it,s){if(it.expSrc==='mfg'){const m=lineMonths(it,s);return isIso(it.mfg)&&m>0?addMonths(it.mfg,m):'';}return isIso(it.exp)?it.exp:'';}
 function finalize(g){(g&&g.items||[]).forEach(it=>{const s=lineStock(it);if(!tracked(s))return;if(it.expSrc!=='mfg')it.expSrc='exp';if(it.expSrc==='mfg')it.exp=lineExp(it,s);else it.mfg='';});}
 const filledGR=it=>typeof grFilled==='function'?grFilled(it):!!(it&&(it.code||it.name));
 function grMissing(g){const out=[];(g&&g.items||[]).forEach((it,i)=>{if(!filledGR(it))return;const s=lineStock(it);if(tracked(s)&&!lineExp(it,s))out.push({i,it,s});});return out;}
 let posting=null;
 if(typeof postGR==='function'){const o=window.postGR;window.postGR=function(g){posting=g;try{finalize(g);return o.apply(this,arguments);}finally{posting=null;}};}
 /* fifo-cost.js newLot: the dates / lot number of the goods-received line this lot comes from */
 function lotDates(s,lot){
  if(lot.src!=='gr'||!lot.refNo)return null;
  const g=posting&&posting.no===lot.refNo?posting:(DB.purchases||[]).find(p=>p.no===lot.refNo&&brOf(p)===brOf(lot))||(DB.purchases||[]).find(p=>p.no===lot.refNo);if(!g)return null;
  let c=(g.items||[]).filter(it=>it.stockId===s.id);if(!c.length)c=(g.items||[]).filter(it=>String(it.code||'').toLowerCase()===String(s.code||'').toLowerCase());if(!c.length)return null;
  const k=F().lots.filter(l=>l.refNo===lot.refNo&&l.stockId===s.id&&l.src==='gr'&&brOf(l)===brOf(lot)).length,it=c[k%c.length],no=String(it.lotNo||'').trim();
  if(!tracked(s))return{lotNo:no};
  const exp=lineExp(it,s);return{exp,mfg:it.expSrc==='mfg'&&isIso(it.mfg)?it.mfg:'',expSrc:exp?(it.expSrc==='mfg'?'mfg':'exp'):'',lotNo:no};
 }
 /* fifo-cost.js onMove: goods arriving from another branch — one new lot per source date, same total quantity and value */
 function incoming(s,qty,info){
  if(!tracked(s)||!info||!info.refNo||!/^รับโอนจากสาขา/.test(info.ref||''))return null;
  const here=ctxBr(),by={};let sum=0;
  F().allocs.forEach(a=>{if(a.refNo!==info.refNo||a.stockId!==s.id||brOf(a)===here||a.pending)return;const q=n(a.qty)-n(a.back);if(!(q>EPS))return;const l=lotById(a.lotId)||{};
   const k=[l.exp||'',l.mfg||'',l.expSrc||''].join('|'),g=by[k]||(by[k]={qty:0,val:0,exp:l.exp||'',mfg:l.mfg||'',expSrc:l.expSrc||'',nos:new Set()});g.qty+=q;g.val+=q*n(a.cost);g.nos.add(String(l.lotNo||'').trim());sum+=q;});
  const parts=Object.values(by).sort((a,b)=>String(a.exp||'9999').localeCompare(String(b.exp||'9999')));
  if(!parts.length||sum>n(qty)+1e-6)return null;
  const one=parts.length===1&&Math.abs(sum-n(qty))<=1e-6;
  const out=parts.map(p=>({qty:p.qty,cost:one?null:p.val/p.qty,exp:p.exp,mfg:p.mfg,expSrc:p.expSrc,lotNo:p.nos.size===1?[...p.nos][0]:''}));
  if(n(qty)-sum>1e-6)out.push({qty:n(qty)-sum,cost:n(info.cost)});
  return out;
 }

 /* ---------- right: ขาย / เบิกสินค้าที่หมดอายุแล้ว (owner always; staff off until ticked — shows under "อื่น ๆ" of perm-special.js) ---------- */
 if(typeof PERM_DOC!=='undefined'&&!PERM_DOC.some(([k])=>k==='sellExpired'))PERM_DOC.push(['sellExpired','ขาย / เบิกสินค้าที่หมดอายุแล้ว']);
 if(typeof presetPerms==='function'){const o=window.presetPerms;window.presetPerms=function(kind){const p=o.apply(this,arguments);if(p&&p.doc)p.doc.sellExpired=kind==='all';return p;};}

 /* ---------- cutting stock: chosen lot first, expired lots blocked / skipped / confirmed ---------- */
 let armed=null;
 /* who is cutting: 4.4 sale · 07 เบิก · replacement handed to a customer (cust-claim.js) */
 const KIND={sale:{v:'ขาย',opt:'ขายล็อตที่หมดอายุ',aud:'ขายสินค้าหมดอายุ '},issue:{v:'เบิก',opt:'เบิกล็อตที่หมดอายุ',aud:'เบิกสินค้าหมดอายุ '},claim:{v:'เปลี่ยน',opt:'เปลี่ยนให้ลูกค้าด้วยล็อตที่หมดอายุ',aud:'เปลี่ยนสินค้าหมดอายุให้ลูกค้า '}};
 const disarm=()=>{armed=null;};
 const live=()=>armed&&Date.now()<armed.until?armed:(armed=null);
 function arm(mode,rows,kind,ttl){const q=new Map();rows.forEach(r=>{const a=q.get(r.stockId)||[];a.push({qty:n(r.qty),lotId:r.lotId||''});q.set(r.stockId,a);});
  armed={mode,q,kind:kind||'sale',until:Date.now()+(ttl||20000)};return armed;}
 /* fifo-cost.js consume: options for this movement (decided by guard just before; else a quote line's chosen lot) */
 function consumeOpt(s,qty,refNo){
  const a=live();
  if(a){const q=a.q.get(s.id);if(!q||!q.length)return null;
   let i=q.findIndex(e=>Math.abs(e.qty-n(qty))<1e-6);if(i<0)i=0;const e=q.splice(i,1)[0];
   if(![...a.q.values()].some(v=>v.length))Promise.resolve().then(()=>{if(armed===a)armed=null;});   /* last line: done once this movement is written */
   return{lotId:e.lotId,skipExpired:a.mode==='skip'};}
  const qd=refNo&&(DB.quotes||[]).find(x=>x.no===refNo),its=qd?(qd.items||[]).filter(x=>x&&x.stockId===s.id&&x.lotId):[];
  const it=its.find(x=>Math.abs(n(x.qty)-n(qty))<1e-6)||its[0];return it?{lotId:it.lotId}:null;
 }
 /* fifo-cost.js consume: an expired lot left under a confirmed "sell expired" decision → audit line */
 function onOut(s,lot,take,ref,refNo){
  const a=armed;if(!a||a.mode!=='sell'||!tracked(s)||!isIso(lot.exp)||!(lot.exp<today()))return;
  logAudit('stock',{id:s.id,no:s.code},'expsell',(KIND[a.kind]||KIND.sale).aud+s.code+' '+s.name+' '+qf(take)+' '+unitOf(s)+' · ล็อต '+lotNo(lot)+' หมดอายุ '+d2(lot.exp)+(refNo?' · เอกสาร '+refNo:''));
 }
 const rowsOf=lines=>(lines||[]).map(it=>{const s=it&&(it.stockId?stockOf(it.stockId):lineStock(it));return s&&n(it.qty)>0?{it,s,stockId:s.id,qty:n(it.qty),lotId:it.lotId||''}:null;}).filter(Boolean);
 function simulate(rows,mode){const used=new Map();return rows.map(r=>{const p=pkgFifo.plan(r.stockId,r.qty,{lotId:r.lotId,skipExpired:mode==='skip',used});p.takes.forEach(t=>used.set(t.lot.id,n(used.get(t.lot.id))+t.take));return p;});}
 /* lines whose chosen lot cannot give the whole quantity: "ล็อต X เหลือไม่พอ — ตัดจากล็อต Y อีก N" */
 function lotNotes(rows,plans){const out=[];rows.forEach((r,i)=>{if(!r.lotId)return;const l=lotById(r.lotId),p=plans[i],got=p.takes.filter(t=>t.lot.id===r.lotId).reduce((a,t)=>a+t.take,0);
   if(got>=r.qty-1e-6)return;const rest=p.takes.filter(t=>t.lot.id!==r.lotId).map(t=>'ล็อต '+lotNo(t.lot)+' อีก '+qf(t.take)).join(' · ');
   const why=!l||brOf(l)!==ctxBr()?'ไม่อยู่ในสาขานี้':got<=EPS?(tracked(r.s)&&isIso(l.exp)&&l.exp<today()&&n(l.left)>EPS?'หมดอายุแล้ว (ข้าม)':'ไม่มีเหลือแล้ว'):'เหลือไม่พอ';
   out.push(r.s.code+' · ล็อต '+(l?lotNo(l):(r.it.lotNo||'-'))+' '+why+' — '+(rest?'ตัดจาก'+rest:'')+(p.short>EPS?(rest?' · ':'')+'ขาดอีก '+qf(p.short)+' (สต๊อกติดลบ)':''));});return out;}
 const noteHtml=list=>list.length?`<ul class="pkg-exp-notes">${list.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'';
 /* The one gate before stock is cut by a sale (4.4) or an internal issue (07 เบิก). true = go on. */
 async function guard(lines,opt){
  opt=opt||{};disarm();const kind=opt.kind||'sale',rows=rowsOf(lines);if(!rows.length)return true;
  const day=today(),A=simulate(rows,'sell'),K=simulate(rows,'skip'),exp=[];let clean=true;
  rows.forEach((r,i)=>{if(!tracked(r.s))return;const ex=A[i].takes.filter(t=>isIso(t.lot.exp)&&t.lot.exp<day),q=ex.reduce((a,t)=>a+t.take,0);
   if(q>EPS){exp.push({r,q,ex});if(K[i].short>A[i].short+1e-6)clean=false;}});
  const K0=KIND[kind]||KIND.sale,verb=K0.v;
  if(!exp.length){const nt=lotNotes(rows,A);
   if(nt.length&&!await askP({title:'ล็อตที่เลือกเหลือไม่พอ',msg:noteHtml(nt)+'<p style="margin:8px 0 0">ตัดสต็อกต่อตามนี้หรือไม่?</p>',yes:'ตัดสต็อกต่อ',no:'ยังไม่ตัด'}))return false;
   if(rows.some(r=>r.lotId))arm('auto',rows,kind,opt.ttl);return true;}
  const right=maySell(),list=exp.map(e=>`<tr><td class="mono">${esc(e.r.s.code)}</td><td>${esc(e.r.s.name)}</td><td>${e.ex.map(t=>esc(lotNo(t.lot))+' · หมดอายุ '+d2(t.lot.exp)).join('<br>')}</td><td class="num">${qf(e.q)} ${esc(unitOf(e.r.s))}</td></tr>`).join('');
  const tbl=`<table class="tbl pkg-exp-gtbl"><thead><tr><th>รหัสสินค้า</th><th>รายการ</th><th>ล็อตที่หมดอายุ</th><th class="num">จำนวน</th></tr></thead><tbody>${list}</tbody></table>`;
  if(!right&&!clean){
   const first=exp[0],msg=first.r.s.code+' '+first.r.s.name+' หมดอายุแล้ว '+qf(first.q)+' '+unitOf(first.r.s)+(exp.length>1?' และอีก '+(exp.length-1)+' รายการ':'')+' — ต้องให้ผู้มีสิทธิ์ยืนยัน';
   toast(msg);
   askConfirm({title:verb+'สินค้าที่หมดอายุแล้วไม่ได้',msg:tbl+'<p class="pkg-exp-warn">ล็อตที่ยังไม่หมดอายุมีไม่พอ — ต้องให้ผู้มีสิทธิ์ “ขาย / เบิกสินค้าที่หมดอายุแล้ว” ยืนยัน</p>',yes:'รับทราบ',noHide:true});
   return false;}
  const nK=lotNotes(rows,K),nA=lotNotes(rows,A),def=clean?'skip':'sell';
  const ok=await askP({title:'มีสินค้าที่หมดอายุแล้ว',msg:tbl+`<div class="pkg-exp-modes" role="radiogroup" aria-label="วิธีตัดล็อต">
    <label class="${clean?'':'off'}"><input type="radio" name="pkgExpMode" value="skip"${def==='skip'?' checked':''}${clean?'':' disabled'}><span><b>ข้ามล็อตที่หมดอายุ (ตัดจากล็อตถัดไป)</b><small>${clean?'ล็อตที่หมดอายุยังอยู่ในสต๊อก รอเบิกออกหรือส่งเคลม':'ล็อตที่ยังไม่หมดอายุมีไม่พอ'}</small>${clean?noteHtml(nK):''}</span></label>
    ${right?`<label><input type="radio" name="pkgExpMode" value="sell"${def==='sell'?' checked':''}><span><b>${K0.opt}</b><small>ระบบบันทึกชื่อผู้ยืนยันไว้ในประวัติ</small>${noteHtml(nA)}</span></label>`:''}</div>`,
   yes:'ยืนยันตัดสต็อก',no:'ยังไม่ตัด'});
  if(!ok)return false;
  const pick=document.querySelector('input[name="pkgExpMode"]:checked'),mode=pick?pick.value:def;
  if(mode==='sell'&&!right)return false;if(mode==='skip'&&!clean)return false;
  arm(mode,rows,kind,opt.ttl);return true;
 }
 const guardSale=(lines,o)=>guard(lines,Object.assign({kind:'sale'},o||{}));
 const issueLines=d=>(typeof isItemsClean==='function'?isItemsClean(d):(d.items||[])).map(it=>{const s=lineStock(it);return s?{stockId:s.id,qty:n(it.qty)}:null;}).filter(Boolean);
 /* approvals: a goods-received note needs its dates; an internal issue passes the expired-lot gate */
 if(typeof approveDoc==='function'){const o=window.approveDoc;
  window.approveDoc=async function(kind){
   const d=typeof curDoc==='function'?curDoc(kind):null;
   if(kind==='gr'&&d&&!d.posted&&!d.cancelled){
    finalize(d);const miss=grMissing(d);
    if(miss.length){const m=miss[0];try{renderGRItems();}catch(e){}
     return toast('บรรทัดที่ '+(m.i+1)+' ('+(m.it.code||m.s.code)+' '+(m.it.name||m.s.name)+') ยังไม่ได้ระบุวันหมดอายุหรือวันผลิต'+(miss.length>1?' และอีก '+(miss.length-1)+' บรรทัด':'')+' — ระบุก่อนอนุมัติรับเข้าสต๊อก');}
    (d.items||[]).forEach(it=>{const s=lineStock(it);if(tracked(s)&&it.expSaveMonths&&n(it.expMonths)>0&&!(n(s.expMonths)>0)){s.expMonths=Math.round(n(it.expMonths));
      logAudit('stock',{id:s.id,no:s.code},'save','ตั้งอายุสินค้า '+s.expMonths+' เดือน (จากใบรับสินค้า)');}});
   }
   if(kind==='issue'&&d&&!d.deducted&&!d.cancelled&&can('apv.issue')&&apvOf(d).status!=='approved'){
    if(!await guard(issueLines(d),{kind:'issue',ttl:600000}))return;
    try{return await o.apply(this,arguments);}finally{disarm();}
   }
   return o.apply(this,arguments);};}
 /* an issue posted another way (ticked rows in the register): no dialog can be shown there — the right decides */
 if(typeof postIssue==='function'){const o=window.postIssue;
  window.postIssue=function(d){
   if(d&&!d.deducted&&!live()){const rows=rowsOf(issueLines(d)),day=today(),A=simulate(rows,'sell');
    if(rows.some((r,i)=>tracked(r.s)&&A[i].takes.some(t=>isIso(t.lot.exp)&&t.lot.exp<day))){
     arm(maySell()?'sell':'skip',rows,'issue',5000);if(!maySell())toast('ข้ามล็อตที่หมดอายุ ตัดจากล็อตถัดไป — บัญชีนี้ไม่มีสิทธิ์เบิกสินค้าที่หมดอายุแล้ว');
     try{return o.apply(this,arguments);}finally{disarm();}}}
   return o.apply(this,arguments);};}

 /* ---------- product form (mStock): the "วันหมดอายุ" row ---------- */
 const warrBox=$i('fWarr')&&$i('fWarr').closest('.permbox');
 if(warrBox){
  const box=document.createElement('div');box.className='permbox pkg-exp-form';box.id='pkgExpForm';
  box.innerHTML=`<h4>วันหมดอายุ</h4>
   <label class="pkg-exp-tick"><input type="checkbox" id="fExpTrack"><span>สินค้านี้มีวันหมดอายุ</span></label>
   <div class="grid g3 pkg-exp-fields">
    <label class="f"><span>อายุสินค้า (เดือน)</span><input type="number" id="fExpMonths" min="0" step="1" placeholder="เช่น ยาง 60 · น้ำมันเครื่อง 36"></label>
    <label class="f"><span>เตือนล่วงหน้า (วัน)</span><input type="number" id="fExpWarn" min="0" step="1"></label>
    <div class="f pkg-exp-fsum"><span>ล็อตคงเหลือ</span><div id="pkgExpFormSum"></div></div>
   </div>
   <p class="hint">ติ๊กแล้ว ใบรับสินค้าจะถามวันหมดอายุหรือวันผลิตของสินค้านี้ และระบบจะตัดล็อตที่หมดอายุก่อนออกก่อน · อายุสินค้าใช้คำนวณวันหมดอายุเมื่อรู้แค่วันผลิต</p>`;
  warrBox.after(box);
  const sync=()=>{const on=$i('fExpTrack').checked,lock=$i('fExpTrack').disabled;['fExpMonths','fExpWarn'].forEach(id=>{$i(id).disabled=lock||!on;});box.classList.toggle('on',on);};
  $i('fExpTrack').addEventListener('change',sync);
  box.addEventListener('click',e=>{const b=e.target.closest('[data-lots]');if(b){e.preventDefault();openLots(b.dataset.lots);}});
  const oOpen=window.openStock;
  window.openStock=function(id){
   const r=oOpen.apply(this,arguments);
   try{const s=id?stockOf(id):null;$i('fExpTrack').checked=tracked(s);$i('fExpMonths').value=s&&n(s.expMonths)>0?n(s.expMonths):'';$i('fExpWarn').value=s?warnOf(s):90;
    $i('fExpTrack').disabled=!can('stock.edit');sync();
    $i('pkgExpFormSum').innerHTML=s?`${tracked(s)?sumHtml(s)||'<span class="hint">ไม่มีล็อตคงเหลือ</span>':''}<button type="button" class="btn sm gh" data-lots="${esc(s.id)}">${IC.box}ดูล็อต / วันหมดอายุ</button>`:'<span class="hint">บันทึกสินค้าก่อน จึงจะดูล็อตได้</span>';
    const h=document.querySelector('#pkg-fifo-lots h4');if(h&&tracked(s))h.textContent='ล็อตต้นทุนคงเหลือ — สินค้ามีวันหมดอายุ: ตัดล็อตที่หมดอายุก่อนออกก่อน';
   }catch(e){console.error('stock-expiry',e);}
   return r;};
  /* The original builds a FRESH record on every save, so anything it does not list is dropped: our three fields — and,
     found while testing (2026-10-12), the product picture (img) and the other branches' quantities (bq, branch.js).
     Ticking the expiry box means saving products, so whatever the old record had and the new one lacks is put back
     (never overwriting a value the form wrote). */
  const carry=(was,now)=>{if(was&&now&&was!==now)Object.keys(was).forEach(k=>{if(!(k in now))now[k]=was[k];});};
  const oSave=window.saveStock;
  window.saveStock=function(){
   const id=typeof editStockId!=='undefined'?editStockId:null,before=id?stockOf(id):null,code=String(($i('fCode')||{}).value||'').trim().toLowerCase();
   const want={expTrack:$i('fExpTrack').checked,expMonths:n($i('fExpMonths').value)>0?Math.round(n($i('fExpMonths').value)):'',expWarn:$i('fExpWarn').value===''?90:Math.max(0,Math.round(n($i('fExpWarn').value)))};
   const had=new Set((DB.stock||[]).map(x=>x.id));
   const r=oSave.apply(this,arguments);
   try{const now=id?stockOf(id):(DB.stock||[]).find(x=>!had.has(x.id)&&String(x.code||'').toLowerCase()===code);
    if(now&&now!==before){
     const was=before||{};carry(before,now);Object.assign(now,want);
     const ch=[];if(!!was.expTrack!==want.expTrack)ch.push(want.expTrack?'เปิดติดตามวันหมดอายุ':'ปิดติดตามวันหมดอายุ');
     if(want.expTrack&&String(was.expMonths||'')!==String(want.expMonths||''))ch.push('อายุสินค้า '+(was.expMonths||'-')+' → '+(want.expMonths||'-')+' เดือน');
     if(want.expTrack&&before&&warnOf(was)!==want.expWarn)ch.push('เตือนล่วงหน้า '+warnOf(was)+' → '+want.expWarn+' วัน');
     if(ch.length)logAudit('stock',{id:now.id,no:now.code},'save','วันหมดอายุ: '+ch.join(' · '));
     save();renderStock();
    }else if(before&&now===before){/* refused by the original: nothing changed */}
   }catch(e){console.error('stock-expiry',e);}
   return r;};
  /* the older Excel import also rebuilds the record: keep the fields; a file may carry them (row.expTrack …) */
  if(typeof upsertStockFromImport==='function'){const o=window.upsertStockFromImport;
   window.upsertStockFromImport=function(row){const code=String((row&&row.code)||'').trim().toLowerCase(),old=code?(DB.stock||[]).find(x=>String(x.code||'').toLowerCase()===code):null;
    const r=o.apply(this,arguments);
    try{const now=code?(DB.stock||[]).find(x=>String(x.code||'').toLowerCase()===code):null;if(now){carry(old,now);
      if(row.expTrack!==undefined&&row.expTrack!=='')now.expTrack=yes(row.expTrack);if(n(row.expMonths)>0)now.expMonths=Math.round(n(row.expMonths));if(row.expWarn!==undefined&&row.expWarn!=='')now.expWarn=Math.max(0,Math.round(n(row.expWarn)));}}catch(e){}
    return r;};}
 }
 const yes=v=>/^(1|y|yes|true|ใช่|มี|✓|x)$/i.test(String(v==null?'':v).trim());
 /* short summary of a tracked product's remaining lots (chips) */
 function sumHtml(s,br){
  if(!tracked(s))return '';const st=status(s.id,br),u=esc(unitOf(s)),o=[];
  if(st.expiredQty>EPS)o.push(`<span class="chip r">หมดอายุแล้ว ${qf(st.expiredQty)} ${u}</span>`);
  if(st.soonQty>EPS)o.push(`<span class="chip a">ใกล้หมดอายุ ${qf(st.soonQty)} ${u}</span>`);
  if(st.next)o.push(`<span class="chip">หมดอายุ ${d2s(st.next)}</span>`);
  if(st.undatedQty>EPS)o.push(`<span class="chip pkg-exp-und">ยังไม่ระบุวันหมดอายุ ${qf(st.undatedQty)} ${u}</span>`);
  return o.length?`<span class="pkg-exp-chips">${o.join('')}</span>`:'';
 }

 /* ---------- CSV (11.3): three optional columns after แบรนด์สินค้า; a file without them imports as before ---------- */
 const COLS=['มีวันหมดอายุ','อายุสินค้า (เดือน)','เตือนล่วงหน้า (วัน)'];
 const csvCells=s=>[tracked(s)?'ใช่':'',n(s.expMonths)>0?n(s.expMonths):'',tracked(s)?warnOf(s):''];
 if(typeof impStockForm==='function'){const o=window.impStockForm;
  window.impStockForm=function(){const cd=window.csvDownload;
   window.csvDownload=function(name,rows){window.csvDownload=cd;if(Array.isArray(rows)&&Array.isArray(rows[0])&&!rows[0].includes(COLS[0])){while(rows[0].length<13)rows[0].push('');rows[0].push(...COLS);rows.slice(1).forEach((r,i)=>{while(r.length<13)r.push('');r.push(i?'':'ใช่',i?'':'36',i?'':'90');});}return cd.call(this,name,rows);};
   try{return o.apply(this,arguments);}finally{if(window.csvDownload!==cd)window.csvDownload=cd;}};}
 if(typeof impStockApply==='function'){const o=window.impStockApply;
  window.impStockApply=async function(rows){
   const had=new Set((DB.stock||[]).map(s=>s.id)),by={};
   (Array.isArray(rows)?rows:[]).forEach(r=>{if(!Array.isArray(r))return;const code=String(r[0]==null?'':r[0]).trim().toLowerCase();if(code&&!(code in by)&&(r[13]||r[14]||r[15]))by[code]=[r[13],r[14],r[15]];});
   const out=await o.apply(this,arguments);
   let ch=false;(DB.stock||[]).forEach(s=>{if(had.has(s.id))return;const v=by[String(s.code||'').trim().toLowerCase()];if(!v)return;
    if(yes(v[0])){s.expTrack=true;ch=true;}if(n(v[1])>0){s.expMonths=Math.round(n(v[1]));ch=true;}if(String(v[2]==null?'':v[2]).trim()!==''&&s.expTrack){s.expWarn=Math.max(0,Math.round(n(v[2])));ch=true;}});
   if(ch){save();try{renderStock();}catch(e){}}
   return out;};}

 /* ---------- goods received (mGREdit): lot number + expiry / manufacture date under each line ---------- */
 function grCtl(it,i,lock,lot){
  const s=lineStock(it),tr=tracked(s),no=String(it.lotNo||'').trim();
  if(lock){const b=[],mfg=lot?lot.mfg:(it.expSrc==='mfg'?it.mfg:''),exp=lot?lot.exp:lineExp(it,s);
   if(lot)b.push('ล็อต <span data-no-translate>'+esc(lotNo(lot))+'</span>');else if(no)b.push('ล็อต <span data-no-translate>'+esc(no)+'</span>');
   if(tr){if(isIso(mfg))b.push('วันผลิต '+d2(mfg));b.push(isIso(exp)?'หมดอายุ '+d2(exp):'ยังไม่ระบุวันหมดอายุ');}
   return b.length?`<div class="pkg-exp-gr ro">${b.join(' · ')}</div>`:'';}
  if(!filledGR(it))return '';
  let h=`<label class="pkg-exp-f"><span>หมายเลขล็อต</span><input type="text" data-x="lotNo" value="${esc(no)}" placeholder="อัตโนมัติ" autocomplete="off"></label>`;
  let need=false;
  if(tr){
   const src=it.expSrc==='mfg'?'mfg':'exp',by=it.mfgBy==='week'?'week':'date',ex=lineExp(it,s);need=!ex;
   h+=`<span class="seg pkg-exp-seg" role="group" aria-label="ระบุวันหมดอายุด้วย"><button type="button" data-src="exp" class="${src==='exp'?'on':''}">วันหมดอายุ</button><button type="button" data-src="mfg" class="${src==='mfg'?'on':''}">วันผลิต</button></span>`;
   if(src==='exp')h+=`<input type="date" data-x="exp" value="${isIso(it.exp)?it.exp:''}" aria-label="วันหมดอายุ">`;
   else{
    const wk=isIso(it.mfg)?isoWeek(it.mfg):null,w=it.mfgWk!=null&&it.mfgWk!==''?it.mfgWk:wk?wk.w:'',y=it.mfgYr!=null&&it.mfgYr!==''?it.mfgYr:wk?wk.y+543:'';
    h+=`<span class="seg pkg-exp-seg" role="group" aria-label="รูปแบบวันผลิต"><button type="button" data-by="date" class="${by==='date'?'on':''}">วันที่</button><button type="button" data-by="week" class="${by==='week'?'on':''}">สัปดาห์ / ปี</button></span>`;
    h+=by==='date'?`<input type="date" data-x="mfg" value="${isIso(it.mfg)?it.mfg:''}" aria-label="วันผลิต">`
     :`<span class="pkg-exp-wk"><input type="number" data-x="wk" min="1" max="53" step="1" value="${esc(w)}" placeholder="สัปดาห์" aria-label="สัปดาห์ที่ผลิต"><i>/</i><input type="number" data-x="yr" step="1" value="${esc(y)}" placeholder="ปี พ.ศ." aria-label="ปีที่ผลิต"></span>`;
    if(!(n(s.expMonths)>0))h+=`<label class="pkg-exp-f"><span>อายุสินค้า (เดือน)</span><input type="number" data-x="months" min="1" step="1" value="${n(it.expMonths)>0?n(it.expMonths):''}" placeholder="เดือน"></label><label class="pkg-exp-ck"><input type="checkbox" data-x="saveMonths"${it.expSaveMonths?' checked':''}><span>บันทึกเป็นอายุของสินค้านี้</span></label>`;
   }
   h+=`<span class="pkg-exp-out" data-out>${outText(it,s)}</span>`;
  }
  return `<div class="pkg-exp-gr${need?' need':''}" data-i="${i}">${h}</div>`;
 }
 function outText(it,s){const ex=lineExp(it,s);
  if(it.expSrc==='mfg')return ex?(it.mfgBy==='week'?'ผลิต '+d2(it.mfg)+' → ':'')+'หมดอายุ '+d2(ex):!isIso(it.mfg)?(it.mfgBy==='week'?'ระบุสัปดาห์และปีที่ผลิต':'ระบุวันผลิต'):'ระบุอายุสินค้า (เดือน)';
  return ex?'หมดอายุ '+d2(ex)+(ex<today()?' · หมดอายุแล้ว':''):'ระบุวันหมดอายุ';}
 function paintGR(){
  const tb=document.querySelector('#grItems tbody');if(!tb||typeof G==='undefined'||!G)return;const lock=!!G.posted;
  const mine=lock&&G.no?F().lots.filter(l=>l.refNo===G.no&&l.src==='gr'&&brOf(l)===brOf(G)).sort((a,b)=>n(a.seq)-n(b.seq)):[],nth={};
  [...tb.rows].forEach((tr,i)=>{const it=(G.items||[])[i],td=tr.cells[4];if(!it||!td||td.querySelector('.pkg-exp-gr'))return;
   let lot=null;if(mine.length&&it.stockId){const k=nth[it.stockId]||0;nth[it.stockId]=k+1;lot=mine.filter(l=>l.stockId===it.stockId)[k]||null;}
   const h=grCtl(it,i,lock||!!G.cancelled,lot);if(h)td.insertAdjacentHTML('beforeend',h);});
 }
 if(typeof renderGRItems==='function'&&$i('grItems')){
  const o=window.renderGRItems;window.renderGRItems=function(){const r=o.apply(this,arguments);try{paintGR();}catch(e){console.error('stock-expiry',e);}return r;};
  const T=$i('grItems'),lineOf=e=>{const box=e.target.closest('.pkg-exp-gr[data-i]');return box&&typeof G!=='undefined'&&G&&!G.posted?{box,it:G.items[+box.dataset.i]}:null;};
  const upd=e=>{const c=lineOf(e),x=e.target.dataset.x;if(!c||!c.it||!x)return;const it=c.it,s=lineStock(it),v=e.target.value;
   if(x==='lotNo')it.lotNo=v.trim();else if(x==='exp')it.exp=v;else if(x==='mfg'){it.mfg=v;it.mfgWk=it.mfgYr='';}
   else if(x==='wk'||x==='yr'){it[x==='wk'?'mfgWk':'mfgYr']=v;const w=c.box.querySelector('[data-x="wk"]').value,y=c.box.querySelector('[data-x="yr"]').value;it.mfg=weekToIso(w,y);}
   else if(x==='months')it.expMonths=n(v)>0?Math.round(n(v)):'';else if(x==='saveMonths')it.expSaveMonths=e.target.checked;
   if(tracked(s)){if(it.expSrc==='mfg')it.exp=lineExp(it,s);const out=c.box.querySelector('[data-out]');if(out)out.textContent=outText(it,s);c.box.classList.toggle('need',!lineExp(it,s));}};
  T.addEventListener('input',upd);T.addEventListener('change',upd);
  T.addEventListener('focusout',e=>{if(e.target.dataset&&e.target.dataset.x==='yr'&&e.target.value){const y=ceYear(e.target.value);if(y){e.target.value=y+543;const c=lineOf(e);if(c&&c.it)c.it.mfgYr=y+543;}}});
  T.addEventListener('click',e=>{const b=e.target.closest('.pkg-exp-seg button');if(!b)return;const c=lineOf(e);if(!c||!c.it)return;e.preventDefault();
   if(b.dataset.src){c.it.expSrc=b.dataset.src;if(b.dataset.src==='exp'&&!isIso(c.it.exp))c.it.exp='';}else if(b.dataset.by)c.it.mfgBy=b.dataset.by;
   const s=lineStock(c.it);if(c.it.expSrc==='mfg')c.it.exp=lineExp(c.it,s);renderGRItems();});
 }

 /* ---------- the lot window "แสดงล็อต" (#mLots): view / pick ---------- */
 const M=document.createElement('div');M.className='modal pkg-mid';M.id='mLots';
 M.innerHTML=`<div class="sheet pkg-lot-sheet">
  <header><h2>แสดงล็อต</h2><span class="tag" id="lotProd" data-no-translate></span></header>
  <div class="body pkg-lot-body">
   <div class="pkg-lot-top">
    <label class="f"><span>คลังสินค้า / สาขา</span><select id="lotBr"></select></label>
    <label class="f pkg-lot-q"><span>ค้นหาข้อมูล</span><input type="text" id="lotQ" autocomplete="off" placeholder="หมายเลขล็อต / เลขที่เอกสาร"></label>
    <button type="button" class="btn pri pkg-go" id="lotFind"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button>
   </div>
   <p class="hint pkg-lot-note" id="lotNote"></p>
   <div class="pkg-lot-grid" id="lotGrid"></div>
   <div class="empty" id="lotEmpty" hidden></div>
  </div>
  <footer class="pkg-lot-foot"><span class="pkg-lot-sum" id="lotSum"></span><label class="pkg-lot-zero"><input type="checkbox" id="lotZero"><span>แสดงล็อตที่หมดแล้ว</span></label>
   <span class="spacer"></span><button type="button" class="btn gh" id="lotAuto" hidden>ใช้อัตโนมัติ</button><button type="button" class="btn gh" onclick="closeModal('mLots')">ปิด</button></footer></div>`;
 host().append(M);
 const LW={id:'',br:'',q:'',zero:false,pick:null};
 const locOf=(s,br)=>{const v=br===ctxBr()?s:Object.assign({},(s.bq&&s.bq[br])||{});return[typeof locCode==='function'?locCode(v):'',typeof locText==='function'?locText(v):''].filter(Boolean).join(' · ');};
 function docOpener(l){
  const no=l.refNo;if(!no)return null;const f=(list,fn)=>{const d=(DB[list]||[]).find(x=>x.no===no);return d&&typeof window[fn]==='function'?()=>window[fn](d.id):null;};
  const sa=(DB.stockCuts||[]).find(x=>x.no===no);
  return f('purchases','openGRById')||f('transfers','pkgOpenMove')||f('stockCounts','openCountById')||f('claims','openClaimById')||f('issues','openIssueById')||(sa&&window.PKG_STOCK_CUT?()=>PKG_STOCK_CUT.open(sa.id):null);
 }
 function lotCard(s,l,first){
  const st=lotState(s,l),left=n(l.left),cost=can('stock.cost'),pk=LW.pick,t=n(l.seq)>1e14?new Date(Math.floor(n(l.seq)/1000)):null;
  const when=l.date==='0000-00-00'?'ยอดยกมา':thDate(l.date)+(t&&iso(t)===l.date?' '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'):'');
  const row=(k,v,c)=>`<div${c?' class="'+c+'"':''}><dt>${k}</dt><dd>${v}</dd></div>`;
  const days=isIso(l.exp)?daysBetween(today(),l.exp):null;
  const expTxt=st==='none'?'—':isIso(l.exp)?`${d2(l.exp)} ${stChip(st)}<small>${days<0?'เลยมา '+(-days)+' วัน':'เหลืออีก '+days+' วัน'}</small>`:stChip('undated');
  let why='';if(pk){if(!(left>EPS))why='ไม่มีเหลือแล้ว';else if(brOf(l)!==ctxBr())why='เป็นล็อตของสาขาอื่น';else if(st==='expired'&&!maySell())why='หมดอายุแล้ว — ต้องมีสิทธิ์ขายสินค้าที่หมดอายุ';}
  return `<article class="pkg-lot-card${first?' first':''}${left>EPS?'':' zero'}${st==='expired'?' exp':st==='soon'?' soon':''}${pk&&pk.lotId===l.id?' picked':''}" data-lot="${esc(l.id)}">
   <header><b>หมายเลขล็อต : <span data-no-translate>${esc(lotNo(l))}</span></b>${!pk&&can('stock.edit')?`<button type="button" class="pkg-lot-edit" data-edit="${esc(l.id)}" title="แก้ไขล็อต" aria-label="แก้ไขล็อต ${esc(lotNo(l))}">${IC.pen}</button>`:''}</header>
   ${first?'<div class="pkg-lot-first"><span class="chip b">ล็อตที่จะถูกตัดก่อน</span></div>':''}
   <dl>${row('ประเภท',typeOf(l))}${row('วันที่ / เวลา',when)}
    ${row('เอกสารเลขที่',l.refNo?(!pk&&docOpener(l)?`<a href="#" class="pkg-lot-doc" data-doc="${esc(l.id)}" data-no-translate>${esc(l.refNo)}</a>`:`<span data-no-translate>${esc(l.refNo)}</span>`):'—')}
    ${isIso(l.mfg)?row('วันผลิต',d2(l.mfg)):''}${row('วันหมดอายุ',expTxt,'exp')}
    ${cost?row('ต้นทุน / หน่วย',money(l.cost)):''}${row('ชั้นวาง',esc(locOf(s,brOf(l)))||'—')}
    ${row('จำนวนคงเหลือ',`<b>${qf(left)}</b> ${esc(unitOf(s))}${n(l.qty)!==left?` <small>จากที่รับ ${qf(l.qty)}</small>`:''}`,'left')}</dl>
   ${pk?`<div class="pkg-lot-pickrow"><button type="button" class="btn grn" data-pick="${esc(l.id)}"${why?' disabled title="'+esc(why)+'"':''}>${pk.lotId===l.id?'ล็อตที่เลือกอยู่':'เลือกล็อตนี้'}</button>${why?`<small>${esc(why)}</small>`:''}</div>`:''}
  </article>`;
 }
 function renderLots(){
  const s=stockOf(LW.id);if(!s)return;const B=BR(),pk=LW.pick;
  $i('lotProd').textContent=s.code+' — '+s.name;
  const sel=$i('lotBr'),brs=B?B.accessible():[{id:'main',code:'',name:'คลังหลัก'}];
  sel.innerHTML=brs.map(b=>`<option value="${esc(b.id)}">${esc((b.code?b.code+' · ':'')+b.name)}${b.id===ctxBr()&&brs.length>1?' (สาขาที่ทำงานอยู่)':''}</option>`).join('');
  if(!brs.some(b=>b.id===LW.br))LW.br=ctxBr();sel.value=LW.br;sel.disabled=brs.length<2||!!pk;
  $i('lotQ').value=LW.q;$i('lotZero').checked=LW.zero;
  const all=lotsOf(s.id,LW.br,true),remain=all.filter(l=>n(l.left)>EPS),zero=all.filter(l=>!(n(l.left)>EPS)).sort((a,b)=>byDate(b,a));
  const q=LW.q.trim().toLowerCase(),hit=l=>!q||[lotNo(l),l.refNo,l.ref].some(v=>String(v||'').toLowerCase().includes(q));
  const ZMAX=30,firstId=remain.length?remain[0].id:'',zs=LW.zero?zero.filter(hit):[],list=[...remain.filter(hit),...zs.slice(0,ZMAX)];
  $i('lotGrid').innerHTML=list.map(l=>lotCard(s,l,l.id===firstId)).join('');
  const em=$i('lotEmpty');em.hidden=list.length>0;em.textContent=q?'ไม่พบล็อตตามคำค้น':all.length&&!LW.zero?'ไม่มีล็อตคงเหลือ — ติ๊ก “แสดงล็อตที่หมดแล้ว” เพื่อดูล็อตเดิม':'ไม่มีล็อตคงเหลือ';
  $i('lotSum').innerHTML=`รวมคงเหลือ <b>${qf(remain.reduce((a,l)=>a+n(l.left),0))}</b> ${esc(unitOf(s))} · <b>${remain.length}</b> ล็อต`+(zs.length>ZMAX?` <span class="hint">· ล็อตที่หมดแล้วแสดง ${ZMAX} ล็อตล่าสุด จาก ${zs.length} — ค้นหาด้วยหมายเลขล็อต / เลขที่เอกสารเพื่อดูล็อตอื่น</span>`:'');
  $i('lotNote').textContent=pk?(pk.kind==='quote'?'ใบเสนอราคายังไม่จองสินค้า — ล็อตที่เลือกจะถูกใช้ตอนตัดสต็อกถ้ายังเหลือ':'ล็อตที่เลือกจะถูกตัดก่อน ถ้าเหลือไม่พอระบบจะตัดจากล็อตถัดไปให้และแจ้งก่อนบันทึก')
   :tracked(s)?'สินค้านี้มีวันหมดอายุ — เรียงตามวันหมดอายุ ล็อตที่หมดอายุก่อนถูกตัดก่อน':'เรียงตามวันที่รับ ล็อตที่รับเข้าก่อนถูกตัดก่อน';
  $i('lotAuto').hidden=!pk;M.classList.toggle('pick',!!pk);
  M.querySelector('h2').textContent=pk?'เลือกล็อต':'แสดงล็อต';
 }
 /* open: openLots(stockId, {br, pick:{lotId, kind:'quote'|'sale', onPick(lot|null)}}) */
 function openLots(id,o){
  o=o||{};const s=stockOf(id);if(!s)return false;
  Object.assign(LW,{id,br:o.pick?ctxBr():(o.br&&o.br!=='all'?o.br:ctxBr()),q:'',zero:false,pick:o.pick||null});
  renderLots();openModal('mLots');return true;
 }
 M.addEventListener('change',e=>{if(e.target.id==='lotBr'){LW.br=e.target.value;renderLots();}else if(e.target.id==='lotZero'){LW.zero=e.target.checked;renderLots();}});
 $i('lotQ').addEventListener('keydown',e=>{if(e.key==='Enter'){LW.q=e.target.value;renderLots();}});
 M.addEventListener('click',e=>{
  if(e.target.closest('#lotFind')){LW.q=$i('lotQ').value;return renderLots();}
  const ed=e.target.closest('[data-edit]');if(ed)return openLotEdit(ed.dataset.edit);
  const dc=e.target.closest('[data-doc]');if(dc){e.preventDefault();const l=lotById(dc.dataset.doc),fn=l&&docOpener(l);if(fn){closeModal('mLots');['mStock','mCard','mExpRep'].forEach(m=>{if($i(m)&&$i(m).classList.contains('on'))closeModal(m);});fn();}return;}
  const pk=e.target.closest('[data-pick]');if(pk&&LW.pick&&!pk.disabled){const l=lotById(pk.dataset.pick),cb=LW.pick.onPick;closeModal('mLots');if(cb)cb(l);return;}
  if(e.target.closest('#lotAuto')&&LW.pick){const cb=LW.pick.onPick;closeModal('mLots');if(cb)cb(null);}
 });
 /* edit one lot: number (free text) and, for tracked products, the dates — needs stock.edit, audit-logged before → after */
 const EM=document.createElement('div');EM.className='modal pkg-mid';EM.id='mLotEdit';
 EM.innerHTML=`<div class="sheet pkg-lote-sheet"><header><h2>แก้ไขล็อต</h2><span class="tag" id="loteTag" data-no-translate></span></header>
  <div class="body"><label class="f"><span>หมายเลขล็อต</span><input type="text" id="loteNo" autocomplete="off" maxlength="60"></label>
   <div class="grid g2" id="loteDates"><label class="f"><span>วันผลิต</span><input type="date" id="loteMfg"></label><label class="f"><span>วันหมดอายุ</span><input type="date" id="loteExp"></label></div>
   <p class="hint" id="loteHint"></p></div>
  <footer><button type="button" class="btn gh" onclick="closeModal('mLotEdit')">ปิด</button><button type="button" class="btn pri" id="loteSave">บันทึก</button></footer></div>`;
 host().append(EM);
 let editId='';
 function openLotEdit(id){
  const l=lotById(id),s=l&&stockOf(l.stockId);if(!l||!s)return;
  if(!can('stock.edit'))return toast('บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลล็อตสินค้า');
  editId=id;$i('loteTag').textContent=s.code+' · '+lotNo(l);$i('loteNo').value=String(l.lotNo||'').trim();$i('loteNo').placeholder=autoNo(l)+' (อัตโนมัติ)';
  $i('loteDates').hidden=!tracked(s);$i('loteMfg').value=isIso(l.mfg)?l.mfg:'';$i('loteExp').value=isIso(l.exp)?l.exp:'';
  $i('loteHint').textContent=!tracked(s)?'สินค้านี้ไม่ได้ติดตามวันหมดอายุ — แก้ได้เฉพาะหมายเลขล็อต':n(s.expMonths)>0?'ใส่เฉพาะวันผลิตได้ — ระบบคำนวณวันหมดอายุจากอายุสินค้า '+n(s.expMonths)+' เดือน':'เว้นว่างได้ถ้ายังไม่ทราบวันที่';
  openModal('mLotEdit');
 }
 /* PKG_EXPIRY.setLot(lotId, {lotNo, mfg, exp}) — the same write the dialog does */
 function setLot(id,v){
  const l=lotById(id),s=l&&stockOf(l.stockId);if(!l||!s)return false;
  if(!can('stock.edit')){toast('บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลล็อตสินค้า');return false;}
  const was={no:String(l.lotNo||'').trim(),mfg:l.mfg||'',exp:l.exp||''},now={no:v.lotNo===undefined?was.no:String(v.lotNo||'').trim(),mfg:was.mfg,exp:was.exp};let src=l.expSrc||'';
  if(tracked(s)){now.mfg=v.mfg===undefined?was.mfg:(isIso(v.mfg)?v.mfg:'');now.exp=v.exp===undefined?was.exp:(isIso(v.exp)?v.exp:'');
   if(now.mfg&&!now.exp&&n(s.expMonths)>0){now.exp=addMonths(now.mfg,s.expMonths);src='mfg';}else if(now.exp!==was.exp)src=now.exp?'exp':'';
   if(now.mfg&&now.exp&&now.exp<now.mfg){toast('วันหมดอายุต้องไม่ก่อนวันผลิต');return false;}}
  const ch=[];if(now.no!==was.no)ch.push('หมายเลขล็อต '+(was.no||'อัตโนมัติ')+' → '+(now.no||'อัตโนมัติ'));
  if(now.mfg!==was.mfg)ch.push('วันผลิต '+(d2(was.mfg)||'-')+' → '+(d2(now.mfg)||'-'));if(now.exp!==was.exp)ch.push('วันหมดอายุ '+(d2(was.exp)||'-')+' → '+(d2(now.exp)||'-'));
  if(!ch.length)return true;
  const label=lotNo(l);l.lotNo=now.no;l.mfg=now.mfg;l.exp=now.exp;l.expSrc=src;
  logAudit('stock',{id:s.id,no:s.code},'lotedit','ล็อต '+label+' ('+s.code+' '+s.name+') · '+ch.join(' · '));
  save();refreshAll();return true;
 }
 $i('loteSave').addEventListener('click',()=>{if(setLot(editId,{lotNo:$i('loteNo').value,mfg:$i('loteMfg').value,exp:$i('loteExp').value})){closeModal('mLotEdit');toast('บันทึกข้อมูลล็อตแล้ว');}});
 function refreshAll(){
  try{if(M.classList.contains('on'))renderLots();}catch(e){}try{if($i('mExpRep')&&$i('mExpRep').classList.contains('on'))renderRep();}catch(e){}
  try{renderStock();}catch(e){}try{if($i('v-home')&&$i('v-home').classList.contains('on'))renderHome();else paintHome();}catch(e){}
 }

 /* ---------- 07 register: quantity opens the lot window (every product); chips, filter group, Excel / PDF column ---------- */
 const rowStock=tr=>{const id=tr.dataset.pkgKey;let s=id&&stockOf(id);if(!s){const c=tr.querySelector('.codechip'),code=c&&c.textContent.trim();s=code&&(DB.stock||[]).find(x=>x.code===code);}return s||null;};
 const regBr=()=>{try{return (window.PKG_REG_FILTER&&PKG_REG_FILTER.state('stockTbl').dd.br)||'';}catch(e){return '';}};
 function paintReg(){
  const br=regBr()||undefined;
  document.querySelectorAll('#stockTbl tbody tr').forEach(tr=>{const td=tr.querySelector('td.sc-qty'),s=rowStock(tr);if(!td||!s)return;
   if(!td.querySelector('.pkg-exp-qty')){const a=document.createElement('a');a.href='#';a.className='pkg-exp-qty';a.setAttribute('role','button');a.title='แสดงล็อต';a.dataset.lots=s.id;
    [...td.childNodes].filter(x=>!(x.nodeType===1&&(x.classList.contains('pkg-br-split')||x.classList.contains('pkg-exp-chips')))).forEach(x=>a.append(x));td.prepend(a);}
   if(tracked(s)&&!td.querySelector('.pkg-exp-chips'))td.insertAdjacentHTML('beforeend',sumHtml(s,br));});
 }
 const oRS=window.renderStock;window.renderStock=function(){const out=oRS.apply(this,arguments);try{paintReg();}catch(e){console.error('stock-expiry',e);}return out;};
 if($i('stockTbl'))$i('stockTbl').addEventListener('click',e=>{const a=e.target.closest('.pkg-exp-qty');if(!a)return;e.preventDefault();e.stopPropagation();openLots(a.dataset.lots,{br:regBr()});});
 if(window.PKG_REG_FILTER&&PKG_REG_FILTER.config&&PKG_REG_FILTER.config.stockTbl){const ck=PKG_REG_FILTER.config.stockTbl.ck;
  if(!ck.some(g=>g.k==='exp')){ck.push({k:'exp',label:'วันหมดอายุ',opts:[['expired','หมดอายุแล้ว'],['soon','ใกล้หมดอายุ'],['undated','ยังไม่ระบุ']],
    multi:x=>{if(!tracked(x))return [];const st=status(x.id,regBr()||undefined),o=[];if(st.expiredQty>EPS)o.push('expired');if(st.soonQty>EPS)o.push('soon');if(st.undatedQty>EPS)o.push('undated');return o;}});
   try{PKG_REG_FILTER.build('stockTbl');}catch(e){}}}
 if(window.PKG_REG_EXPORT){const prev=PKG_REG_EXPORT.extend;
  PKG_REG_EXPORT.extend=function(id,d,body){
   d=typeof prev==='function'?prev.apply(this,arguments):d;
   if(id!=='stockTbl'||!d||!Array.isArray(d.cols)||!(DB.stock||[]).some(tracked))return d;
   const tr0=body&&body[0],qi=tr0?[...tr0.cells].findIndex(td=>td.classList.contains('sc-qty')):-1,pos=d.cols.findIndex(c=>c.i===qi),at=pos<0?d.cols.length:pos+1,br=regBr()||undefined;
   d.cols.splice(at,0,{i:-2,l:'วันหมดอายุ',num:false});
   d.rows.forEach((r,k)=>{const tr=body[k],s=tr&&rowStock(tr);
    if(pos>=0&&tr&&tr.cells[qi]){const c=tr.cells[qi].cloneNode(true);c.querySelectorAll('.pkg-exp-chips').forEach(x=>x.remove());r[pos]=PKG_REG_EXPORT.cellText(c);}
    let t='';if(tracked(s)){const st=status(s.id,br),u=unitOf(s);t=[st.next&&'หมดอายุ '+d2(st.next),st.soonQty>EPS&&'ใกล้หมดอายุ '+qf(st.soonQty)+' '+u,st.expiredQty>EPS&&'หมดอายุแล้ว '+qf(st.expiredQty)+' '+u,st.undatedQty>EPS&&'ยังไม่ระบุ '+qf(st.undatedQty)+' '+u].filter(Boolean).join(' · ');}
    r.splice(at,0,t);});
   (d.foot||[]).forEach(r=>r.splice(at,0,''));return d;};}

 /* ---------- product card ---------- */
 if(typeof openCard==='function'){const o=window.openCard;
  window.openCard=function(id){const r=o.apply(this,arguments);
   try{const s=stockOf(id),b=$i('mCardBody');if(s&&b&&!b.querySelector('.pkg-exp-card')){const d=document.createElement('div');d.className='pkg-exp-card';
     d.innerHTML=`<span class="hint">ล็อตสินค้า${tracked(s)?' · วันหมดอายุ':''}</span><div>${sumHtml(s)}<button type="button" class="btn sm gh" data-lots="${esc(s.id)}">${IC.box}ดูล็อต / วันหมดอายุ</button></div>`;
     const g=b.querySelectorAll('.grid');(g[g.length-1]||b.firstElementChild||b).after(d);
     d.querySelector('[data-lots]').onclick=()=>openLots(s.id);}}catch(e){console.error('stock-expiry',e);}
   return r;};}

 /* ---------- risk rows (one per remaining lot of a tracked product) — home card + report ---------- */
 function riskRows(brs){
  brs=(brs&&brs.length?brs:[ctxBr()]);const tr=new Map((DB.stock||[]).filter(tracked).map(s=>[s.id,s]));if(!tr.size)return [];
  const day=today(),ens=()=>tr.forEach(s=>{try{pkgFifo.lots(s.id);}catch(e){}});
  brs.forEach(b=>{try{if(b===ctxBr())ens();else if(BR()&&BR().get(b)){const todo=[...tr.values()].filter(s=>!seen.has(s.id+'|'+b));if(todo.length){todo.forEach(s=>seen.add(s.id+'|'+b));BR().within(b,()=>todo.forEach(s=>{try{pkgFifo.lots(s.id);}catch(e){}}));}}}catch(e){}});
  return F().lots.filter(l=>tr.has(l.stockId)&&brs.includes(brOf(l))&&n(l.left)>EPS).map(l=>{const s=tr.get(l.stockId);return{s,l,st:lotState(s,l),days:isIso(l.exp)?daysBetween(day,l.exp):null};});
 }
 const homeBrs=()=>{try{if(window.PKG_BRANCH_REPORT)return PKG_BRANCH_REPORT.resolve('home').filter(id=>!BR()||BR().access(id));}catch(e){}return [ctxBr()];};
 function counts(brs){const rows=riskRows(brs),so=new Set(),ex=new Set();rows.forEach(r=>{if(r.st==='soon')so.add(r.s.id);if(r.st==='expired')ex.add(r.s.id);});return{soon:so.size,expired:ex.size};}
 function paintHome(){
  const home=$i('v-home'),hMin=$i('hMin'),cards=hMin&&hMin.closest('.cards');if(!home||!cards)return;
  let el=$i('pkgExpHome');
  if(!el){el=document.createElement('button');el.type='button';el.id='pkgExpHome';el.className='pkg-exp-home';cards.after(el);el.addEventListener('click',()=>openRep({st:'risk',brs:homeBrs()}));}
  const ok=can('tabs.stock'),c=ok?counts(homeBrs()):{soon:0,expired:0};
  el.hidden=!(c.soon+c.expired>0);el.classList.toggle('red',c.expired>0);
  if(!el.hidden)el.innerHTML=`<i>${IC.warn}</i><span class="t"><b>สินค้าใกล้หมดอายุ <em>${c.soon}</em> รายการ</b> · <b>หมดอายุแล้ว <em>${c.expired}</em> รายการ</b></span><span class="go">ดูรายงาน ›</span>`;
 }
 if(typeof renderHome==='function'){const o=window.renderHome;window.renderHome=function(){const r=o.apply(this,arguments);try{paintHome();}catch(e){console.error('stock-expiry',e);}return r;};}

 /* ---------- report "สินค้าใกล้หมดอายุ / หมดอายุ" (#mExpRep) ---------- */
 const RM=document.createElement('div');RM.className='modal pkg-mid pkg-wide';RM.id='mExpRep';
 RM.innerHTML=`<div class="sheet pkg-er-sheet">
  <header><h2>สินค้าใกล้หมดอายุ / หมดอายุ</h2><span class="tag" id="erTag"></span></header>
  <div class="body pkg-er-body">
   <div class="pkg-er-top">
    <label class="f"><span>สถานะ</span><select id="erSt"><option value="risk">หมดอายุแล้ว + ใกล้หมดอายุ</option><option value="expired">หมดอายุแล้ว</option><option value="30">ภายใน 30 วัน</option><option value="60">ภายใน 60 วัน</option><option value="90">ภายใน 90 วัน</option><option value="all">ทั้งหมดที่ติดตาม</option></select></label>
    <label class="f" id="erBrWrap"><span>คลังสินค้า / สาขา</span><select id="erBr"></select></label>
    <label class="f pkg-er-q"><span>ค้นหาข้อมูล</span><input type="text" id="erQ" autocomplete="off" placeholder="รหัส / ชื่อสินค้า / แบรนด์ / หมายเลขล็อต / เลขที่เอกสาร"></label>
    <button type="button" class="btn pri pkg-go" id="erFind"><i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล</button>
   </div>
   <div id="erPf"></div>
   <div class="pkg-er-bar"><span class="hint" id="erInfo"></span><span class="spacer"></span>
    <button type="button" class="btn gh" id="erXl">${IC.xl}Excel</button><button type="button" class="btn gh" id="erPrint">${IC.print}พิมพ์รายงาน</button></div>
   <div class="scroll pkg-er-scroll"><table class="tbl" id="expRepTbl">
    <thead><tr><th style="width:130px">รหัสสินค้า</th><th>ชื่อสินค้า</th><th style="width:120px">แบรนด์</th><th style="width:210px">ล็อต (วันที่รับ / อ้างอิง)</th><th class="num" style="width:110px">คงเหลือ</th>
     <th class="num sc-cost" style="width:110px">ทุน / หน่วย</th><th class="ctr" style="width:110px">วันหมดอายุ</th><th class="num" style="width:110px">เหลืออีก (วัน)</th><th class="ctr" style="width:150px">สถานะ</th><th class="ctr pkg-er-act" style="width:190px">จัดการ</th></tr></thead>
    <tbody></tbody><tfoot></tfoot></table></div>
   <div class="empty" id="erEmpty" hidden>ไม่มีล็อตตามตัวกรองนี้</div>
  </div>
  <footer><button type="button" class="btn gh" onclick="closeModal('mExpRep')">ปิด</button></footer></div>`;
 host().append(RM);
 const RS={st:'risk',br:'',q:'',pf:null,rows:[]};
 const mayExport=()=>!window.PKG_REG_EXPORT||PKG_REG_EXPORT.may('stockTbl');
 const brName=id=>{const b=BR()&&BR().get(id);return b?b.code:'';};
 function repRows(){
  const B=BR(),brs=RS.br==='all'?(B?B.accessible().map(b=>b.id):['main']):[RS.br||ctxBr()],q=RS.q.trim().toLowerCase();
  return riskRows(brs).filter(r=>{
   if(RS.st==='risk'&&!(r.st==='expired'||r.st==='soon'))return false;if(RS.st==='expired'&&r.st!=='expired')return false;
   if(/^\d+$/.test(RS.st)&&!(r.days!=null&&r.days>=0&&r.days<=+RS.st))return false;
   if(RS.pf&&!RS.pf.test(r.s))return false;
   if(q&&![r.s.code,r.s.name,r.s.oem,r.s.brand,lotNo(r.l),r.l.refNo].some(v=>String(v||'').toLowerCase().includes(q)))return false;
   return true;}).sort((a,b)=>String(a.l.exp||'9999-99-99').localeCompare(String(b.l.exp||'9999-99-99'))||String(a.s.code).localeCompare(String(b.s.code)));
 }
 function renderRep(){
  const B=BR(),cost=can('stock.cost'),multi=RS.br==='all';
  const sel=$i('erBr'),brs=B?B.accessible():[];$i('erBrWrap').hidden=brs.length<2;
  sel.innerHTML=brs.map(b=>`<option value="${esc(b.id)}">${esc(b.code+' · '+b.name)}</option>`).join('')+(brs.length>1?'<option value="all">ทุกสาขา</option>':'');
  if(RS.br!=='all'&&!brs.some(b=>b.id===RS.br))RS.br=ctxBr();sel.value=RS.br;$i('erSt').value=RS.st;$i('erQ').value=RS.q;
  if(!RS.pf&&window.PKG_PFILTER)RS.pf=PKG_PFILTER.mount($i('erPf'),{rows:()=>(DB.stock||[]).filter(tracked),onChange:()=>renderRep()});
  const rows=RS.rows=repRows(),canDoc=br=>br===ctxBr();
  const act=r=>(r.st==='expired'||r.st==='soon')&&canDoc(brOf(r.l))?`<button type="button" class="btn sm gh" data-claim="${esc(r.l.id)}" title="เปิดใบเคลมสินค้า (ผู้ขาย) พร้อมรายการนี้">${IC.send}ส่งเคลมผู้ขาย</button><button type="button" class="btn sm gh" data-waste="${esc(r.l.id)}" title="เปิดใบเบิกของภายใน พร้อมรายการนี้">${IC.out}เบิกออกเป็นของเสีย</button>`:'';
  RM.querySelector('tbody').innerHTML=rows.map(r=>`<tr class="${r.st==='expired'?'pkg-er-exp':''}"><td><a href="#" class="mono pkg-er-code" data-lots="${esc(r.s.id)}" data-br="${esc(brOf(r.l))}" data-no-translate>${esc(r.s.code)}</a></td><td data-no-translate>${esc(r.s.name)}</td><td data-no-translate>${esc(r.s.brand||'-')}</td>
   <td><span data-no-translate>${esc(lotNo(r.l))}</span><div class="hint">${r.l.date==='0000-00-00'?'ยอดยกมา':thDate(r.l.date)}${multi?' · '+esc(brName(brOf(r.l))):''}</div></td>
   <td class="num"><b>${qf(r.l.left)}</b> <span class="hint">${esc(unitOf(r.s))}</span></td><td class="num sc-cost">${cost?money(r.l.cost):''}</td>
   <td class="ctr">${isIso(r.l.exp)?d2(r.l.exp):'-'}</td><td class="num">${r.days==null?'-':r.days<0?'<span class="pkg-er-neg">เลยมา '+(-r.days)+'</span>':r.days}</td><td class="ctr">${stChip(r.st)}</td><td class="ctr pkg-er-act">${act(r)}</td></tr>`).join('');
  const tq=rows.reduce((a,r)=>a+n(r.l.left),0),tv=rows.reduce((a,r)=>a+n(r.l.left)*n(r.l.cost),0);
  RM.querySelector('tfoot').innerHTML=rows.length?`<tr><td colspan="4"><b>รวม ${rows.length} ล็อต · ${new Set(rows.map(r=>r.s.id)).size} รายการสินค้า</b></td><td class="num"><b>${qf(tq)}</b></td><td class="num sc-cost"></td><td colspan="3" class="num sc-cost"><b>${cost?(RS.st==='all'?'มูลค่าต้นทุนรวม ':'มูลค่าต้นทุนที่เสี่ยง ')+money(tv)+' บาท':''}</b></td><td class="pkg-er-act"></td></tr>`:'';
  RM.querySelectorAll('.sc-cost').forEach(x=>x.hidden=!cost);
  $i('erEmpty').hidden=rows.length>0;$i('erTag').textContent=rows.length+' ล็อต';
  $i('erInfo').textContent='จำนวนรวม '+qf(tq)+(cost?' · มูลค่าต้นทุน '+money(tv)+' บาท':'');
  $i('erXl').hidden=$i('erPrint').hidden=!mayExport();
  RS.total={qty:tq,val:tv};
 }
 function openRep(o){
  o=o||{};if(!can('tabs.stock'))return toast('บัญชีนี้ไม่มีสิทธิ์ดูข้อมูลสินค้าคงคลัง');
  RS.st=o.st||'risk';RS.q='';RS.br=o.brs&&o.brs.length>1?'all':(o.brs&&o.brs[0])||ctxBr();if(RS.pf)RS.pf.reset();
  renderRep();openModal('mExpRep');return true;
 }
 function repData(){
  const cost=can('stock.cost'),multi=RS.br==='all',rows=RS.rows||[];
  const cols=[{l:'รหัสสินค้า'},{l:'ชื่อสินค้า'},{l:'แบรนด์'},...(multi?[{l:'สาขา'}]:[]),{l:'หมายเลขล็อต'},{l:'วันที่รับ'},{l:'เอกสารอ้างอิง'},{l:'คงเหลือ',num:true},{l:'หน่วย'},...(cost?[{l:'ทุน / หน่วย',num:true},{l:'มูลค่าต้นทุน',num:true}]:[]),{l:'วันผลิต'},{l:'วันหมดอายุ'},{l:'เหลืออีก (วัน)',num:true},{l:'สถานะ'}];
  const body=rows.map(r=>[r.s.code,r.s.name,r.s.brand||'',...(multi?[brName(brOf(r.l))]:[]),lotNo(r.l),r.l.date==='0000-00-00'?'ยอดยกมา':thDate(r.l.date),r.l.refNo||'',qf(r.l.left),unitOf(r.s),...(cost?[money(r.l.cost),money(n(r.l.left)*n(r.l.cost))]:[]),d2(r.l.mfg),d2(r.l.exp),r.days==null?'':String(r.days),ST[r.st][0]]);
  const foot=cols.map(()=>'');foot[0]='รวม '+rows.length+' ล็อต';foot[cols.findIndex(c=>c.l==='คงเหลือ')]=qf(RS.total.qty);if(cost)foot[cols.findIndex(c=>c.l==='มูลค่าต้นทุน')]=money(RS.total.val);
  const st=$i('erSt'),filters=[st.options[st.selectedIndex].text,RS.br==='all'?'ทุกสาขา':brName(RS.br||ctxBr()),RS.q.trim()].filter(Boolean);
  return{title:'สินค้าใกล้หมดอายุ / หมดอายุ',cols,rows:body,foot:[foot],filters};
 }
 const stampLine=()=>'ส่งออกโดย '+meName()+' · '+thDate(iso())+' '+new Date().toTimeString().slice(0,5);
 function repExcel(){
  if(!mayExport())return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');const X=window.PKG_REG_EXPORT;if(!X)return;
  const d=repData();if(!d.rows.length)return toast('ไม่มีรายการให้ส่งออก');
  d.note=[stampLine(),'พบ '+d.rows.length+' รายการ','ตัวกรอง: '+d.filters.join(' · ')].join('   ');d.who=meName();
  X.save(d.title.replace(/[\\/:*?"<>|]/g,' ')+' '+iso()+'.xlsx',X.xlsx(d));
  logAudit('stock',{id:'',no:d.title},'print','ส่งออก Excel '+d.rows.length+' รายการ · โดย '+meName()+' · '+d.filters.join(' · '));save();toast('ส่งออก Excel '+d.rows.length+' รายการแล้ว');
 }
 function repPrint(){
  if(!mayExport())return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');
  const d=repData();if(!d.rows.length)return toast('ไม่มีรายการให้พิมพ์');
  const html=sheetTop({title:d.title,en:'EXPIRY REPORT',copy:'รายงานภายใน',fields:[['วันที่พิมพ์',esc(thDate(iso()))],['ผู้พิมพ์',esc(meName())],['จำนวน',d.rows.length+' ล็อต']],note:esc('ตัวกรอง: '+d.filters.join(' · '))})
   +`<table class="pkg-rep"><thead><tr class="pkg-rep-by"><th colspan="${d.cols.length}">${esc(stampLine())}</th></tr><tr>${d.cols.map(c=>`<th>${esc(c.l)}</th>`).join('')}</tr></thead><tbody>`
   +d.rows.map(r=>`<tr>${r.map((v,i)=>`<td${d.cols[i].num?' class="num"':''}>${esc(v)}</td>`).join('')}</tr>`).join('')
   +d.foot.map(r=>`<tr>${r.map((v,i)=>`<td${d.cols[i].num?' class="num"':''}><b>${esc(v)}</b></td>`).join('')}</tr>`).join('')+'</tbody></table></div>';
  logAudit('stock',{id:'',no:d.title},'print','พิมพ์รายงาน '+d.rows.length+' รายการ · โดย '+meName());save();
  (window.PKG_REG_EXPORT?PKG_REG_EXPORT.print:printDocs)(html);
 }
 /* shortcuts: the existing 07 เคลม / 07 เบิก forms, opened with the product on the first line (same way cust-claim.js hands a claim on) */
 function toDoc(kind,lotId){
  const l=lotById(lotId),s=l&&stockOf(l.stockId);if(!l||!s)return;
  if(brOf(l)!==ctxBr())return toast('เป็นล็อตของสาขาอื่น — สลับสาขาก่อน');
  const why='สินค้า'+(lotState(s,l)==='expired'?'หมดอายุ':'ใกล้หมดอายุ')+' · ล็อต '+lotNo(l)+(isIso(l.exp)?' · หมดอายุ '+d2(l.exp):'');
  if(kind==='claim'){
   if(typeof newClaim!=='function'||typeof fillClaimForm!=='function')return toast('ไม่พบหน้าเคลมสินค้า (ผู้ขาย)');
   if(typeof pkgPermNeed==='function'&&!pkgPermNeed('stkClaim','add'))return;
   closeModal('mExpRep');go('stock');stkGo('claim');newClaim(true);
   C.items=[{stockId:s.id,code:s.code,name:s.name,qty:n(l.left),reason:why}];if(l.vendorId)C.vendorId=l.vendorId;C.note=why;
   if(typeof padCLines==='function')padCLines();fillClaimForm();openModal('mClaimEdit');toast('เปิดใบเคลมผู้ขายพร้อมรายการ '+s.code+' แล้ว — ตรวจผู้ขายและจำนวนแล้วกดบันทึก');
  }else{
   if(typeof newIssue!=='function'||typeof fillIssueForm!=='function')return toast('ไม่พบหน้าเบิกของภายใน');
   if(typeof pkgPermNeed==='function'&&!pkgPermNeed('stkIssue','add'))return;
   closeModal('mExpRep');go('stock');stkGo('issue');newIssue(true);
   IS.items=[{stockId:s.id,code:s.code,name:s.name,qty:n(l.left),reason:'ของเสีย — '+why}];IS.note='เบิกออกเป็นของเสีย · '+why;
   if(typeof padISLines==='function')padISLines();fillIssueForm();openModal('mIssueEdit');toast('เปิดใบเบิกพร้อมรายการ '+s.code+' แล้ว — ตรวจจำนวนแล้วกดบันทึก');
  }
 }
 RM.addEventListener('change',e=>{if(e.target.id==='erSt'){RS.st=e.target.value;renderRep();}else if(e.target.id==='erBr'){RS.br=e.target.value;renderRep();}});
 $i('erQ').addEventListener('keydown',e=>{if(e.key==='Enter'){RS.q=e.target.value;renderRep();}});
 RM.addEventListener('click',e=>{
  if(e.target.closest('#erFind')){RS.q=$i('erQ').value;return renderRep();}
  if(e.target.closest('#erXl'))return repExcel();if(e.target.closest('#erPrint'))return repPrint();
  const a=e.target.closest('[data-lots]');if(a){e.preventDefault();return openLots(a.dataset.lots,{br:a.dataset.br});}
  const c=e.target.closest('[data-claim]');if(c)return toDoc('claim',c.dataset.claim);
  const w=e.target.closest('[data-waste]');if(w)return toDoc('issue',w.dataset.waste);
 });

 /* ---------- document lines (03 quote · 4.4 sale): the "ล็อต" chip-button + a chip when the next lot is expired / near expiry ---------- */
 function lineChips(it,o){
  const s=it&&it.type==='part'&&it.stockId?stockOf(it.stockId):null;if(!s)return '';
  if(o.done&&o.refNo){   /* already cut: the lots this document really took */
   const ls=[...new Set(F().allocs.filter(a=>a.refNo===o.refNo&&a.stockId===s.id&&!a.pending&&n(a.qty)-n(a.back)>EPS).map(a=>a.lotId))].map(lotById).filter(Boolean);
   if(ls.length)return `<div class="pkg-exp-ln"><span class="pkg-lot-chip ro" title="ล็อตที่ตัดจริง" data-no-translate>${IC.box}<span>ล็อต ${esc(ls.map(lotNo).join(' · '))}</span></span></div>`;}
  const l=it.lotId?lotById(it.lotId):null,gone=it.lotId&&(!l||!(n(l.left)>EPS)||brOf(l)!==ctxBr());
  const label=it.lotId?'ล็อต '+(l?lotNo(l):(it.lotNo||'-'))+(l&&isIso(l.exp)&&tracked(s)?' · หมดอายุ '+d2s(l.exp):''):'ล็อต: อัตโนมัติ';
  let h=o.ro?(it.lotId?`<span class="pkg-lot-chip ro${gone&&!o.done?' gone':''}" data-no-translate>${IC.box}${esc(label)}</span>`:'')
   :`<button type="button" class="pkg-lot-chip${it.lotId?' set':''}${gone?' gone':''}" ${o.attr||'data-lotpick'}="${o.i}" title="เลือกล็อตของรายการนี้">${IC.box}<span${it.lotId?' data-no-translate':''}>${esc(label)}</span></button>`;
  if(gone&&!o.done)h+='<span class="chip a">ล็อตที่เลือกไม่มีเหลือ — ระบบจะตัดอัตโนมัติ</span>';
  if(!o.done&&tracked(s)){let nx=null;try{const p=pkgFifo.plan(s.id,Math.max(n(it.qty),1e-6),{lotId:it.lotId||''});nx=p.takes.length?p.takes[0].lot:null;}catch(e){}
   const st=nx?lotState(s,nx):'';
   if(st==='expired')h+='<span class="chip r">ล็อตถัดไปหมดอายุแล้ว</span>';else if(st==='soon')h+=`<span class="chip a">ใกล้หมดอายุ ${d2s(nx.exp)}</span>`;}
  return h?`<div class="pkg-exp-ln" data-ln="${o.i}">${h}</div>`:'';
 }
 /* PKG_EXPIRY.decorateLines(tbody, items, {nameCol, ro, done, refNo, kind, after}) — any line table can call it after drawing its rows.
    ro = lines locked (chip shown, not clickable) · done + refNo = already cut under that number (shows the lots really taken) · after = redraw */
 function decorateLines(tb,items,o){
  if(!tb||!Array.isArray(items))return;o=o||{};
  [...tb.rows].forEach((tr,i)=>{const it=items[i],td=tr.cells[o.nameCol==null?2:o.nameCol];if(!it||!td)return;td.querySelectorAll('.pkg-exp-ln').forEach(x=>x.remove());
   const h=lineChips(it,{i,ro:!!o.ro,done:!!o.done,refNo:o.refNo||''});if(h)td.insertAdjacentHTML('beforeend',h);});
  tb._pkgExp={items,o};
  if(!tb._pkgExpOn){tb._pkgExpOn=true;tb.addEventListener('click',e=>{const b=e.target.closest('[data-lotpick]');if(!b)return;e.preventDefault();
    const c=tb._pkgExp,it=c.items[+b.dataset.lotpick];if(!it||c.o.ro)return;
    openLots(it.stockId,{pick:{lotId:it.lotId||'',kind:c.o.kind||'sale',onPick:l=>{if(l){it.lotId=l.id;it.lotNo=lotNo(l);}else{delete it.lotId;delete it.lotNo;}
      if(c.o.after)c.o.after();else decorateLines(tb,c.items,c.o);}}});});}
 }
 if(typeof renderQItems==='function'&&$i('qItems')){const o=window.renderQItems;
  window.renderQItems=function(){const r=o.apply(this,arguments);
   try{if(typeof Q!=='undefined'&&Q){const cut=Q.deducted&&window.PKG_STOCK_CUT?PKG_STOCK_CUT.activeCut(Q):null;
     const pl=$i('pkg-qprint-lot');if(pl){pl.checked=!!Q.lotDetail;pl.closest('label').hidden=!(Q.items||[]).some(it=>it&&it.lotId);}
     decorateLines($i('qItems').tBodies[0],Q.items,{nameCol:3,ro:typeof pkgQLock==='function'?pkgQLock(Q):false,done:!!Q.deducted,refNo:cut?(cut.moveRef||cut.no):'',kind:'quote',after:()=>renderQItems()});}}catch(e){console.error('stock-expiry',e);}
   return r;};}
 /* printed quote: tick "แสดงล็อต" in the quote's print options → the chosen lot under the item (Q.lotDetail, saved with the quote).
    The sheet already calls pkgKitPrint(it, doc) after each item name; that call is extended. */
 const kitTick=$i('pkg-qprint-kit')&&$i('pkg-qprint-kit').closest('label');
 if(kitTick&&typeof pkgKitPrint==='function'){
  const lb=document.createElement('label');lb.innerHTML='<input type="checkbox" id="pkg-qprint-lot"> แสดงล็อต';lb.hidden=true;kitTick.after(lb);
  lb.querySelector('input').addEventListener('change',e=>{if(typeof Q!=='undefined'&&Q)Q.lotDetail=e.target.checked;});
  const o=window.pkgKitPrint;
  window.pkgKitPrint=function(it,d){let h=o.apply(this,arguments)||'';
   try{if(d&&d.lotDetail&&it&&it.type==='part'&&it.lotId){const l=lotById(it.lotId),s=stockOf(it.stockId);
     h+='<div style="font-size:10.5px;color:#444">ล็อต '+esc(l?lotNo(l):(it.lotNo||'-'))+(l&&tracked(s)&&isIso(l.exp)?' · หมดอายุ '+d2(l.exp):'')+'</div>';}}catch(e){}
   return h;};
 }
 /* 4.4: the sale window calls window.PKG_SALE_LINE_EXTRA(it, i, {saved, locked}) for each line (stock-cut.js lineExtra) and
    leaves clicks on [data-lot-line] to this module. A window that does not call the hook is decorated after it redraws. */
 let hookSeen=false;const prevExtra=window.PKG_SALE_LINE_EXTRA;
 window.PKG_SALE_LINE_EXTRA=function(it,i,o){
  hookSeen=true;o=o||{};let h='';try{if(typeof prevExtra==='function')h=prevExtra.apply(this,arguments)||'';}catch(e){}
  try{const W=window.PKG_STOCK_CUT&&PKG_STOCK_CUT.state,c=W&&W.cur;
   h+=lineChips(it,{i,ro:!!(o.saved||o.locked),done:!!o.saved,refNo:o.saved&&c&&!c.cancelled?(c.moveRef||c.no):'',attr:'data-lot-line'});}catch(e){console.error('stock-expiry',e);}
  return h;};
 document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest?e.target.closest('[data-lot-line]'):null;if(!b||!b.closest('#mSale'))return;e.preventDefault();
  const W=window.PKG_STOCK_CUT&&PKG_STOCK_CUT.state,d=W&&(W.cur||W.S),it=d&&(d.items||[])[+b.getAttribute('data-lot-line')];if(!it||W.cur||d.quoteId)return;
  openLots(it.stockId,{pick:{lotId:it.lotId||'',kind:'sale',onPick:l=>{if(l){it.lotId=l.id;it.lotNo=lotNo(l);}else{delete it.lotId;delete it.lotNo;}
    if(typeof pkgSaleRender==='function')pkgSaleRender();else saleDecorate();}}});});
 function saleDecorate(){
  if(hookSeen)return;
  const tb=$i('saItems')&&$i('saItems').tBodies[0],W=window.PKG_STOCK_CUT&&PKG_STOCK_CUT.state;if(!tb||!W)return;const d=W.cur||W.S;if(!d)return;
  decorateLines(tb,d.items||[],{nameCol:2,ro:!!W.cur||!!d.quoteId,done:!!W.cur,refNo:W.cur&&!W.cur.cancelled?(W.cur.moveRef||W.cur.no):'',kind:'sale'});
 }
 if($i('saItems')&&typeof MutationObserver!=='undefined'){let busy=false;
  new MutationObserver(()=>{if(busy)return;busy=true;try{saleDecorate();}catch(e){console.error('stock-expiry',e);}Promise.resolve().then(()=>{busy=false;});}).observe($i('saItems').tBodies[0],{childList:true});}

 window.PKG_EXPIRY={status,lotsOf,lotState,lotNo,tracked,warnOf,addMonths,weekToIso,isoWeek,lineExp,grMissing,finalize,
  lotDates,incoming,consumeOpt,onOut,guard,guardSale,disarm,armed:()=>live(),maySell,
  openLots,renderLots,openLotEdit,setLot,openReport:openRep,renderReport:renderRep,reportRows:()=>RS.rows,reportState:RS,reportData:repData,excel:repExcel,print:repPrint,
  riskRows,counts,paintHome,paintReg,decorateLines,saleDecorate,toDoc,sumHtml,COLS,csvCells};
 try{paintReg();paintHome();}catch(e){}
})();
