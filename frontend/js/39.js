/* หัวทะเบียนแบบใหม่ (user 2026-10-06, mockups/register-layout.html — chosen design, summary strip variant 1).
   Built on 03 first, then (user: "ทำต่อให้ครบ") on every register that has a filter panel (reg-filter.js).
   The existing controls are MOVED, never rebuilt, so every original handler keeps working:
   · card: the create button alone top-left, other buttons small top-right · date basis radios centred (reg-filter) ·
     ช่วงวันที่ / ตั้งแต่ / ถึง (or เดือน / ปี) three equal fields · the filter dropdowns (reg-filter) three equal
     columns, then the register's own older filters (status, category …) in the same grid · tick groups in columns ·
     Excel / PDF bottom-left, ล้างตัวกรอง + ค้นหาข้อมูล bottom-right.
   · under the card: summary strip "ผลการค้นหา | …" (width fits its content) adding up the rows SHOWN on the current
     page (user: "500 per page = the 500 shown"; cancelled documents left out of the amounts), then แสดง N รายการ +
     found count on the left, the text search on the right, the pager on its own line above the table.
   · Controls are found on the page (create = the primary / "+" button, date = select[id$=DateMode], limit / info =
     <prefix>Limit / <prefix>Info, search = the text input whose id has "earch"); SUM says what each strip adds.
   reg-filter.js keeps nodes marked data-keep across its rebuilds and calls PKG_REG_HEAD.arrange(id, box). */
(()=>{
 if(typeof sortRows!=='function')return;
 const $i=id=>document.getElementById(id);
 const N=v=>typeof n==='function'?n(v):(+v||0);
 const fmt=v=>typeof money==='function'?money(v):Number(v||0).toFixed(2);
 const qty=v=>typeof qf==='function'?qf(v):String(v);
 const off=d=>!d||d.cancelled||d.superseded;
 const sumBy=(rows,f)=>rows.reduce((a,r)=>a+(N(f(r))||0),0);
 const rcpt=d=>receiptTotals({items:d.items||[],disc:N(d.disc),vat:N(d.vat),adj:d.adj,wht:0,whtBase:'labor',pay:{}});
 const money3=(get,docOf)=>{const live=rows=>rows.filter(r=>!off(docOf(r)));return [
  ['base','มูลค่าก่อน VAT',rows=>fmt(sumBy(live(rows),r=>get(r).base))],
  ['vat','VAT',rows=>fmt(sumBy(live(rows),r=>get(r).vat))],
  ['total','ยอดรวมทั้งสิ้น (บาท)',rows=>fmt(sumBy(live(rows),r=>get(r).total)),1]];};
 const self=r=>r;
 const lines=rows=>qty(sumBy(rows.filter(d=>!off(d)),d=>(d.items||d.lines||[]).filter(i=>i&&(i.stockId||i.code||i.name)).length));
 const pieces=rows=>qty(sumBy(rows.filter(d=>!off(d)),d=>sumBy((d.items||d.lines||[]).filter(i=>i&&(i.stockId||i.code||i.name)),i=>i.qty)));
 /* what each register's strip adds up (rows = the rows shown on the page) · not listed = no strip */
 const SUM={
  qOvTbl:{unit:'ใบ',f:money3(q=>quoteTotals(q),self)},
  docOvTbl:{unit:'ใบ',f:money3(r=>{const t=receiptTotals(r.obj||r);return {base:t.base,vat:t.vat,total:t.gross};},r=>r.obj||r)},
  taxOvTbl:{unit:'ใบ',f:money3(x=>{const t=receiptTotals(x.r||{});return {base:t.base,vat:t.vat,total:t.gross};},x=>x.d||x.r)},
  bnTbl:{unit:'ใบ',f:[['total','ยอดวางบิล',rows=>fmt(sumBy(rows.filter(b=>!off(b)),b=>bnAmt(b).total))],['paid','รับชำระแล้ว',rows=>fmt(sumBy(rows.filter(b=>!off(b)),b=>bnAmt(b).paid))],
   ['rem','คงค้าง (บาท)',rows=>fmt(sumBy(rows.filter(b=>!off(b)),b=>bnAmt(b).rem)),1]]},
  scutTbl:{unit:'ใบ',f:money3(d=>{const t=rcpt(d);return {base:t.base,vat:t.vat,total:t.gross};},self).concat([   /* new sales flow: money received / still owed of the rows shown */
   ['got','รับแล้ว',rows=>fmt(sumBy(rows.filter(d=>!off(d)),d=>window.PKG_SALE?PKG_SALE.stat(d).got:0))],['rem','ค้างชำระ (บาท)',rows=>fmt(sumBy(rows.filter(d=>!off(d)),d=>window.PKG_SALE?PKG_SALE.stat(d).rem:0))]])},   /* the two cells show only while the new flow is on (html.pkg-sf-on, sale-flow.css) */
  /* ระบบขายแบบใหม่ (sale-docs.js) */
  sinvTbl:{unit:'ใบ',f:[['total','ยอดขาย',rows=>fmt(sumBy(rows,x=>x.st.total))],['got','รับแล้ว',rows=>fmt(sumBy(rows,x=>x.st.got+x.st.wht))],['rem','คงค้าง (บาท)',rows=>fmt(sumBy(rows,x=>x.st.rem)),1],
   ['over','เกิน 7 วัน',rows=>{const o=rows.filter(x=>x.over);return o.length+' ใบ · '+fmt(sumBy(o,x=>x.st.rem));}]]},
  srcpTbl:{unit:'ใบ',f:[['amt','รับเงินรวม (บาท)',rows=>fmt(sumBy(rows.filter(x=>!x.p.cancelled),x=>x.p.amt)),1],['wht','ลูกค้าหัก ณ ที่จ่าย',rows=>fmt(sumBy(rows.filter(x=>!x.p.cancelled),x=>x.p.wht&&x.p.wht.amt))]]},
  swhtTbl:{unit:'รายการ',label:'จำนวนรายการ',f:[['amt','ยอดที่ลูกค้าหักรวม (บาท)',rows=>fmt(sumBy(rows,x=>x.amt)),1],['wait','ยังไม่ได้รับหนังสือรับรอง',rows=>{const o=rows.filter(x=>!x.got&&!x.legacy);return o.length+' รายการ · '+fmt(sumBy(o,x=>x.amt));}]]},
  swhtOutTbl:{unit:'รายการ',label:'จำนวนรายการ',f:[['amt','ยอดที่เราหักรวม (บาท)',rows=>fmt(sumBy(rows,v=>v.amt)),1],['due','ยังไม่นำส่ง',rows=>{const o=rows.filter(v=>!v.remit);return o.length+' รายการ · '+fmt(sumBy(o,v=>v.amt));}]]},
  grTbl:{unit:'ใบ',f:money3(g=>grTotals(g),self)},
  clTbl:{unit:'ใบ',f:[['lines','รายการสินค้า',lines],['qty','จำนวนชิ้นรวม',pieces,1]]},
  isTbl:{unit:'ใบ',f:[['lines','รายการสินค้า',lines],['qty','จำนวนชิ้นรวม',pieces,1]]},
  ccTbl:{unit:'ใบ',f:[['lines','รายการสินค้า',lines],['qty','จำนวนชิ้นรวม',pieces],['cost','ต้นทุนที่เปลี่ยนให้ (บาท)',rows=>fmt(sumBy(rows.filter(d=>!off(d)),d=>sumBy((d.lines||[]).filter(l=>l.cut),l=>N(l.qty)*N(l.cost)))),1,'stock.cost']]},
  scTbl:{unit:'ใบ',f:[['lines','รายการที่ตรวจนับ',rows=>qty(sumBy(rows.filter(d=>!off(d)),d=>(d.items||[]).length)),1]]},
  stockTbl:{unit:'รายการ',label:'จำนวนรายการ',f:[['qty','คงเหลือรวม (ชิ้น)',rows=>qty(sumBy(rows,s=>s.qty))],
   ['cost','มูลค่าทุนคงเหลือ (บาท)',rows=>fmt(sumBy(rows,s=>typeof pkgFifoValue==='function'?pkgFifoValue(s):N(s.qty)*N(s.cost))),1,'stock.cost']]},
  aArTbl:{unit:'ใบ',f:[['amt','ยอดตามเอกสาร',rows=>fmt(sumBy(rows,x=>x.amt))],['paid','รับชำระแล้ว',rows=>fmt(sumBy(rows,x=>x.paidAmt))],
   ['rem','คงค้าง (บาท)',rows=>fmt(sumBy(rows,x=>x.rem)),1],['over','เกินกำหนด',rows=>fmt(sumBy(rows.filter(x=>N(x.over)>0),x=>x.rem))]]},
  aApTbl:{unit:'ใบ',f:[['amt','ยอดตามเอกสาร',rows=>fmt(sumBy(rows,x=>x.amt))],['paid','จ่ายแล้ว',rows=>fmt(sumBy(rows,x=>x.paidAmt))],
   ['rem','คงค้าง (บาท)',rows=>fmt(sumBy(rows,x=>x.rem)),1],['over','เกินกำหนด',rows=>fmt(sumBy(rows.filter(x=>N(x.over)>0),x=>x.rem))]]},
  expTbl:{unit:'รายการ',label:'จำนวนรายการ',f:[['base','มูลค่าก่อน VAT',rows=>fmt(sumBy(rows,x=>expTotals(x).base))],['vat','VAT',rows=>fmt(sumBy(rows,x=>expTotals(x).vat))],
   ['wht','หัก ณ ที่จ่าย',rows=>fmt(sumBy(rows,x=>expTotals(x).wht))],['net','ยอดจ่ายสุทธิ (บาท)',rows=>fmt(sumBy(rows,x=>expTotals(x).net)),1]]}
 };
 /* the register's own older filters get a field label */
 const LABEL={crmFilter:'แสดงนัดหมาย',aArStatus:'สถานะลูกหนี้',aApStatus:'สถานะเจ้าหนี้',expCatFilter:'หมวดค่าใช้จ่าย',venCatFilter:'หมวดสินค้าที่ขาย',stockFilterBottom:'แสดงรายการ'};
 const S={};   /* id → {page, date, f2, f3, act, clr, more, sum} */
 const REGS=()=>(window.PKG_REG_EXPORT&&PKG_REG_EXPORT.registers)||{};
 const IDS=()=>window.PKG_REG_FILTER?Object.keys(PKG_REG_FILTER.config):['qOvTbl'];

 /* ---------- date fields: three equal columns ---------- */
 function dateGrid(id,p,modeSel){
  const g=document.createElement('div');g.className='pkg-rh-date';g.dataset.keep='1';
  let lab=modeSel.closest('label.f');
  if(!lab){lab=document.createElement('label');lab.className='f';lab.innerHTML='<span></span>';modeSel.before(lab);lab.append(modeSel);}
  const sp=lab.querySelector('span');if(sp)sp.textContent='ช่วงวันที่';
  const f=cls=>{const d=document.createElement('label');d.className='f '+cls;d.innerHTML='<span></span><input type="text" class="pkg-rh-ph" disabled value="—" aria-hidden="true" tabindex="-1">';return d;};
  const f2=f('pkg-rh-f2'),f3=f('pkg-rh-f3');
  const d1=$i(p+'D1'),d2=$i(p+'D2'),mm=$i(p+'MonthM'),my=$i(p+'MonthY');
  [d1,mm].forEach(x=>x&&f2.append(x));[d2,my].forEach(x=>x&&f3.append(x));
  [d1,d2,mm,my,modeSel].forEach(x=>{if(x){x.style.width='';x.classList.add('pkg-rh-in');}});
  g.append(lab,f2,f3);
  ['D2Wrap','MonthWrap'].forEach(k=>{const w=$i(p+k);if(w)w.classList.add('pkg-rh-gone');});
  Object.assign(S[id],{date:p,f2,f3});
  return g;
 }
 function syncDate(id){
  const s=S[id];if(!s||!s.f2)return;const p=s.date,m=($i(p+'Mode')||{}).value||'';
  const set=(f,label,el)=>{f.querySelector('span').textContent=label;[...f.children].forEach(x=>{if(x.tagName!=='SPAN')x.style.display=x===el?'':'none';});
   f.classList.toggle('pkg-rh-idle',!!el&&el.classList.contains('pkg-rh-ph'));};   /* not needed for this choice → blank white, space kept (user 2026-10-08) */
  const ph2=s.f2.querySelector('.pkg-rh-ph'),ph3=s.f3.querySelector('.pkg-rh-ph');
  if(m==='one'){set(s.f2,'วันที่',$i(p+'D1'));set(s.f3,'ถึงวันที่',ph3);}
  else if(m==='range'){set(s.f2,'ตั้งแต่วันที่',$i(p+'D1'));set(s.f3,'ถึงวันที่',$i(p+'D2'));}
  else if(m==='month'){set(s.f2,'เดือน',$i(p+'MonthM'));set(s.f3,'ปี',$i(p+'MonthY'));}
  else{set(s.f2,'ตั้งแต่วันที่',ph2);set(s.f3,'ถึงวันที่',ph3);}
 }
 if(typeof toggleDateFilterUI==='function'){const o=toggleDateFilterUI;
  window.toggleDateFilterUI=function(prefix){const r=o.apply(this,arguments);Object.keys(S).forEach(id=>{if(S[id].date===prefix)syncDate(id);});return r;};}

 /* ---------- building the card ---------- */
 const skip=e=>e.closest('.pgtop,.pgbar,.pkg-xbar,.pkg-flt,.pkg-sel-bar,.pkg-rh-card');
 function setup(id){
  const tbl=$i(id);if(!tbl||S[id])return;
  const box=document.querySelector(`.pkg-flt[data-for="${id}"]`);if(!box)return;
  const C=box.parentElement;
  const before=[];for(const c of C.children){if(c===box)break;before.push(c);}
  const holders=before.filter(el=>el.matches('header,.row,.ptools')&&!el.classList.contains('vatgate')&&el.querySelector('button,select,input'));
  if(!holders.length)return;
  const reg=REGS()[id]||{},page=reg.p||'',lim=page?$i(page+'Limit'):null,info=page?$i(page+'Info'):null;
  S[id]={page};
  const all=holders.flatMap(h=>[...h.querySelectorAll('button,select,input,.pkg-rbr,span.tag,span.hint')])
   .filter(e=>e.classList.contains('pkg-rbr')||(!skip(e)&&!e.closest('.pkg-rbr')&&(e.tagName==='BUTTON'||!e.closest('button'))));
  const btns=all.filter(e=>e.tagName==='BUTTON');
  const sbtn=btns.find(b=>/ค้นหาข้อมูล/.test(b.textContent));
  const q=all.find(e=>e.tagName==='INPUT'&&/earch/i.test(e.id||''));
  const modeSel=all.find(e=>e.tagName==='SELECT'&&/DateMode$/.test(e.id||''));
  const dp=modeSel?modeSel.id.replace(/Mode$/,''):'';
  const dateEls=new Set(dp?[dp+'Mode',dp+'D1',dp+'D2',dp+'MonthM',dp+'MonthY'].map($i).filter(Boolean):[]);
  const create=btns.find(b=>b!==sbtn&&b.classList.contains('pri')&&!b.classList.contains('sm'))||btns.find(b=>b!==sbtn&&/^\s*\+/.test(b.textContent));
  const others=btns.filter(b=>b!==sbtn&&b!==create);
  const tags=all.filter(e=>e.tagName==='SPAN'&&e.id&&!e.classList.contains('pkg-rbr')&&e!==info&&!e.closest('label.f')&&!e.closest('[id$="Wrap"]'));   /* count tags / page hints (ids); the old range's "ถึง" stays behind */
  const extras=all.filter(e=>(e.tagName==='SELECT'||(e.tagName==='INPUT'&&e.type!=='checkbox')||e.classList.contains('pkg-rbr'))&&e!==lim&&e!==q&&!dateEls.has(e));
  /* card */
  const card=document.createElement('div');card.className='pkg-rh-card';card.dataset.for=id;
  const first=holders.find(h=>h.tagName!=='HEADER');
  if(first)first.before(card);else holders[holders.length-1].after(card);
  const top=document.createElement('div');top.className='pkg-rh-top';
  if(create)top.append(create);tags.forEach(t=>top.append(t));
  const sp=document.createElement('span');sp.className='pkg-rh-sp';top.append(sp);
  others.forEach(b=>{b.classList.add('sm');top.append(b);});
  card.append(top);
  card.append(box);box.classList.add('pkg-rh-box');
  if(modeSel)box.append(dateGrid(id,dp,modeSel));
  if(extras.length){const more=document.createElement('div');more.className='pkg-rh-more';more.dataset.keep='1';
   extras.forEach(e=>{if(e.classList.contains('pkg-rbr')){e.classList.add('pkg-rh-field');more.append(e);return;}
    let lab=e.closest('label.f');
    if(!lab||!holders.some(h=>h.contains(lab))){const prev=e.previousElementSibling,own=prev&&prev.tagName==='SPAN'&&!prev.id&&!prev.querySelector('*')?prev:null;   /* a loose "สถานะ" text in front of it = its label */
     lab=document.createElement('label');lab.className='f';const t=document.createElement('span');t.textContent=LABEL[e.id]||(own&&own.textContent.trim())||e.getAttribute('aria-label')||e.title||'ตัวกรอง';lab.append(t,e);if(own)own.remove();}
    e.style.width='';more.append(lab);});
   S[id].more=more;}
  const act=document.createElement('div');act.className='pkg-rh-act';act.dataset.keep='1';
  const xbar=document.querySelector(`.pkg-xbar[data-for="${id}"]`)||C.querySelector(':scope > .pkg-xbar');
  if(xbar)act.append(xbar);
  const sp2=document.createElement('span');sp2.className='pkg-rh-sp';act.append(sp2);
  const clr=document.createElement('span');clr.className='pkg-rh-clr';act.append(clr);
  if(sbtn){sbtn.classList.remove('sm');sbtn.classList.add('pkg-rh-go');sbtn.innerHTML='<i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล';act.append(sbtn);}
  else if(q){const b=document.createElement('button');b.type='button';b.className='btn pkg-rh-go';b.innerHTML='<i class="pkg-ic-s" aria-hidden="true"></i>ค้นหาข้อมูล';
   b.onclick=()=>{q.dispatchEvent(new Event('input',{bubbles:true}));q.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));};act.append(b);}
  Object.assign(S[id],{act,clr});
  /* summary strip + table controls below the card */
  let anchor=card;const cfg=SUM[id];
  if(cfg){const sum=document.createElement('div');sum.className='pkg-rh-sum';sum.dataset.for=id;
   sum.innerHTML='<div class="pkg-rh-sum-h">ผลการค้นหา</div>'+`<div><span>${cfg.label||'จำนวนเอกสาร'}</span><b data-k="n">0</b></div>`
    +cfg.f.map(([k,l,,hi])=>`<div data-k-cell="${k}"><span>${l}</span><b data-k="${k}"${hi?' class="pkg-rh-total"':''}>0</b></div>`).join('');
   sum.title='รวมเฉพาะรายการที่แสดงอยู่ในหน้านี้'+(/^(stockTbl|aArTbl|aApTbl|expTbl)$/.test(id)?'':' · ยอดเงินไม่รวมเอกสารที่ยกเลิก');
   anchor.after(sum);anchor=sum;S[id].sum=sum;}
  const ctl=document.createElement('div');ctl.className='pkg-rh-ctl';
  const left=document.createElement('div');left.className='pkg-rh-ctl-l';
  if(lim){let ll=lim.closest('label.f');if(!ll||!holders.some(h=>h.contains(ll))){ll=document.createElement('label');ll.className='f';ll.innerHTML='<span>แสดง</span>';ll.append(lim);}
   const t=ll.querySelector('span');if(t)t.textContent='แสดง';left.append(ll);}
  if(info)left.append(info);
  const right=document.createElement('label');right.className='pkg-rh-q';right.innerHTML='<span class="hint">ค้นหาข้อมูล</span>';if(q){q.style.width='';right.append(q);}else right.hidden=true;
  ctl.append(left,right);anchor.after(ctl);
  /* leftovers: old pagers, emptied rows */
  holders.forEach(h=>{h.querySelectorAll('.pgtop').forEach(x=>x.remove());
   if(!h.querySelector('button,select,input,h2,h3'))h.classList.add('pkg-rh-gone');});
  document.documentElement.classList.add('pkg-rh-on');
  if(window.PKG_REG_FILTER)PKG_REG_FILTER.build(id);else arrange(id,box);
  syncDate(id);
 }
 /* after every filter-panel rebuild: date grid after the basis radios, then dropdowns, older filters, ticks, actions */
 function arrange(id,box){
  const s=S[id];if(!s)return;
  const basis=box.querySelector(':scope > .pkg-flt-basis'),dg=box.querySelector(':scope > .pkg-rh-date'),dd=box.querySelector(':scope > .pkg-flt-dd'),ck=box.querySelector(':scope > .pkg-flt-ck');
  if(basis){const h=basis.querySelector('.hint');if(h)h.remove();}
  [basis,dg,dd,s.more,ck,s.act].filter(Boolean).forEach(el=>box.append(el));
  const newClr=ck&&ck.querySelector('.pkg-flt-clear');
  if(newClr&&s.clr){s.clr.replaceChildren(newClr);newClr.classList.remove('sm');}
  if(ck)ck.classList.add('pkg-rh-ck');
 }

 /* ---------- the summary: the rows shown on this page (after paging) ---------- */
 const lo=limitRows;
 window.limitRows=function(rows,prefix){const out=lo.apply(this,arguments);const id=Object.keys(S).find(k=>S[k].page===prefix);if(id&&S[id].sum&&Array.isArray(out))try{summ(id,out);}catch(e){console.error('reg-head',e);}return out;};
 function summ(id,rows){
  const s=S[id],cfg=SUM[id];if(!s||!s.sum||!cfg)return;
  const put=(k,v)=>{const el=s.sum.querySelector(`[data-k="${k}"]`);if(el)el.textContent=v;};
  put('n',rows.length.toLocaleString('th-TH')+' '+cfg.unit);
  cfg.f.forEach(([k,,fn,,perm])=>{const cell=s.sum.querySelector(`[data-k-cell="${k}"]`);const ok=!perm||typeof can!=='function'||!curEmp()||can(perm);if(cell)cell.hidden=!ok;if(ok)put(k,fn(rows));});
 }

 const whenReady=fn=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,0));else setTimeout(fn,0);};
 whenReady(()=>{IDS().forEach(id=>{try{setup(id);}catch(e){console.error('reg-head',id,e);}});
  Object.keys(S).forEach(id=>{const r=REGS()[id];const fn=r&&window[r.render];try{if(typeof fn==='function')fn();}catch(e){}});});
 window.PKG_REG_HEAD={sum:SUM,state:S,arrange,setup,syncDate,summ};
})();
