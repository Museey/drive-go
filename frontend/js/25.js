/* Register column widths: every register keeps fixed column widths (percent of the table), so sorting or paging no
   longer makes columns jump; long text wraps and the row grows taller instead. Menu 11 (temporary settings group)
   lets the shop set each column's share per register; nothing is set = defaults taken from the original header widths.
   A column can also be hidden (shop choice): hidden columns get 0%, the rest share 100%.
   Stored in DB.regCols[tableId] = {cols:[labels], w:[percent], hide:[bool]} — ignored if the register's column count changes
   (labels are kept for reference only, so switching the interface language does not drop the setting). */
(()=>{
 const REGS=[
  ['00 · หน้าแรก',[['apvListTbl','รายงานเอกสารรอการอนุมัติ']]],
  ['01 · ลูกค้าสัมพันธ์',[['crmTbl','นัดหมายและติดตามลูกค้า']]],
  ['02 · ข้อมูลลูกค้า',[['custTbl','ข้อมูลลูกค้า'],['custLTbl','รายชื่อลูกค้า (เข้ารับบริการล่าสุด)']]],
  ['03 · ใบเสนอราคา',[['qOvTbl','ทะเบียนใบเสนอราคา / ใบอนุมัติซ่อม']]],
  ['04 · ใบเสร็จรับเงิน',[['docOvTbl','ใบเสร็จรับเงิน / ใบแจ้งหนี้'],['taxOvTbl','ใบกำกับภาษี'],['bnTbl','ใบวางบิล'],['scutTbl','ใบตัดสต็อกสินค้า'],['sinvTbl','ใบแจ้งหนี้ (ระบบขายแบบใหม่)'],['srcpTbl','ใบเสร็จรับเงิน (ระบบขายแบบใหม่)'],['swhtTbl','ใบหัก ณ ที่จ่าย · ลูกค้าหักเรา'],['swhtOutTbl','ใบหัก ณ ที่จ่าย · เราหักผู้ขาย']]],
  ['05 · ข้อมูลผู้ขาย',[['venTbl','ข้อมูลผู้ขาย']]],
  ['06 · รายจ่าย / ซื้อสินค้า',[['grTbl','ใบรับสินค้า / ซื้อสินค้า'],['utilTbl','ค่าน้ำ ค่าไฟ ค่าโทรศัพท์'],['basTbl','ซื้อสินทรัพย์ถาวร'],['offTbl','อุปกรณ์และวัสดุสำนักงาน'],['othTbl','รายจ่ายอื่น ๆ']]],
  ['07 · สต๊อกอะไหล่',[['stockTbl','ทะเบียนอะไหล่'],['clTbl','ใบเคลมสินค้า'],['ccTbl','เคลมสินค้าลูกค้า'],['isTbl','เบิกใช้ภายใน'],['scTbl','ตรวจนับสินค้า'],['kit-register','ชุดอะไหล่ซ่อมบำรุง'],['mvTbl','โอนสินค้าระหว่างสาขา']]],
  ['08 · บัญชี - การเงิน',[['aArTbl','ลูกหนี้ (ค้างรับ)'],['aApTbl','เจ้าหนี้ (ค้างจ่าย)'],['expTbl','ค่าใช้จ่ายกิจการ'],['assetTbl','ทะเบียนสินทรัพย์']]],
  ['09 · งานบุคคล',[['recTbl','บันทึกการทำงานและการลา'],['wnTbl','ใบเตือน']]],
  ['10 · ตั้งค่าองค์กร',[['empTbl','ข้อมูลพนักงาน']]]
 ];
 const IDS=REGS.flatMap(g=>g[1].map(r=>r[0])),NAME=Object.fromEntries(REGS.flatMap(g=>g[1].map(r=>[r[0],g[0].slice(0,2)+' · '+r[1]])));
 const REF=1200,r1=v=>Math.round(v*10)/10;   /* REF: the original header widths assume a table about this wide */
 const store=()=>DB.regCols||(DB.regCols={});
 const heads=tbl=>tbl&&tbl.tHead?[...tbl.tHead.rows[0].cells]:[];
 const labelOf=th=>((th.dataset.lbl||th.textContent).replace(/[▴▾]/g,'').replace(/\s+/g,' ').trim())||'ช่องปุ่มจัดการ';
 const labels=tbl=>heads(tbl).map(labelOf);
 /* Column kinds decide the default widths (the original page writes a px width on some headers only):
    ลำดับ · the “จัดการ” button column · a written px width · a number column (.num) · a centred column (.ctr: dates,
    statuses) · otherwise a name / description column, which gets what is left (180–320px on a ~1500px table).
    Registers with many columns (07 ทะเบียนอะไหล่ has 15) get a minimum table width from the narrowest comfortable width
    of every shown column, and scroll sideways below it instead of squeezing — hiding columns in 11.1 shrinks it. */
 /* code = a document-number / code column with no written width (08 AR / AP): one line like the written ones, not a text column (user 2026-10-01: it came out 250px wide) */
 const colKind=th=>th.classList.contains('pkg-seq')?'seq':th.hasAttribute('data-fixw')?'fix':/^(จัดการ|ช่องปุ่มจัดการ)$/.test(labelOf(th))?'act':/^รูป/.test(labelOf(th))?'img':/^(เลขบัตร|เลขประจำตัว|เลขผู้เสียภาษี|เลขที่|เอกสารเลขที่)/.test(labelOf(th))?'code':/^(เบอร์โทร|โทรศัพท์|มือถือ)/.test(labelOf(th))?'tel':parseFloat(th.style.width)?'px':th.classList.contains('num')?'num':th.classList.contains('ctr')?'ctr':/^(เลขที่|รหัส)/.test(labelOf(th))?'code':'text';   /* 13-digit numbers outrank a written width that is too small */   /* img = picture column: never narrower than its frame (user 2026-10-01) */
 const colPx={};   /* per register: px each one-line column (buttons, numbers, dates) really needs — measured from drawn rows, only grows */
 const IMG_MIN=126;   /* 104px frame + cell padding */
 const SEQ_MIN=4.8;   /* ลำดับ: at least 4.8%, always shown (user 2026-10-02) */
 const isDate=th=>/วันที่|ครบกำหนด|ล่าสุด/.test(labelOf(th));
 function natural(tbl){
  const ths=heads(tbl),k=ths.map(colKind),w=th=>parseFloat(th.style.width)||0;
  const px=ths.map((th,i)=>({fix:w(th),seq:68,act:Math.max(96,w(th)),px:Math.max(isDate(th)?100:84,w(th)),num:110,ctr:110,code:/^เลขบัตร|^เลขประจำตัว|^เลขผู้เสียภาษี/.test(labelOf(th))?160:/^(เลขที่|เอกสารเลขที่)/.test(labelOf(th))?172:150,img:132,tel:118,text:0})[k[i]]).map((x,i)=>k[i]==='text'||k[i]==='seq'?x:Math.max(x,(colPx[tbl.id]||[])[i]||0));
  const texts=k.filter(x=>x==='text').length,used=px.reduce((a,b)=>a+b,0),each=texts?Math.min(320,Math.max(180,(1500-used)/texts)):0;
  return px.map((x,i)=>k[i]==='text'?each:x);
 }
 function minimum(tbl){const ths=heads(tbl),m=colPx[tbl.id]||[];return ths.map((th,i)=>Math.max(m[i]||0,{fix:parseFloat(th.style.width)||0,seq:62,act:80,px:Math.max(70,(parseFloat(th.style.width)||0)*0.8),num:80,ctr:88,code:/^เลขบัตร|^เลขประจำตัว|^เลขผู้เสียภาษี/.test(labelOf(th))?150:/^(เลขที่|เอกสารเลขที่)/.test(labelOf(th))?158:120,img:IMG_MIN,tel:112,text:130}[colKind(th)]));}
 function defaults(tbl){const n=natural(tbl),t=n.reduce((a,b)=>a+b,0)||1;return fit(n.map(x=>x/t*100));}
 /* One decimal each, total exactly 100 (the rounding difference goes to the widest column). */
 function fit(w){const out=w.map(r1),d=r1(100-out.reduce((a,b)=>a+b,0));if(d){const i=out.indexOf(Math.max(...out));out[i]=r1(out[i]+d);}return out;}
 /* Default widths at the table's real width W. Name / description columns aim for their natural width (180–320px each);
    one-line columns (ลำดับ, buttons, numbers, dates, written widths) start from their natural width and give way down to
    what their content really needs (measured) or their minimum, so the text columns reach their aim first. If even then the
    text columns would be under 170px, the proportional defaults stand and the table's minimum width scrolls sideways. */
 function auto(tbl){
  const n=natural(tbl),mn=minimum(tbl),k=heads(tbl).map(colKind),W=Math.round(tbl.getBoundingClientRect().width);
  const text=k.map((x,i)=>x==='text'?i:-1).filter(i=>i>=0);if(!W||!text.length)return defaults(tbl);
  const one=k.map((x,i)=>x==='text'?-1:i).filter(i=>i>=0),px=n.slice();
  const aim=text.reduce((a,i)=>a+n[i],0),room=W-one.reduce((a,i)=>a+n[i],0);
  if(room<aim){const give=one.reduce((a,i)=>a+Math.max(0,n[i]-mn[i]),0),take=Math.min(aim-room,give);
   if(give>0)one.forEach(i=>{px[i]=n[i]-Math.max(0,n[i]-mn[i])*take/give;});}
  const left=W-one.reduce((a,i)=>a+px[i],0);
  if(left<130*text.length)return defaults(tbl);   /* name / description columns may go down to 130px (wrapping) before the table scrolls (user 2026-10-04) */
  text.forEach(i=>{px[i]=left*n[i]/aim;});
  return fit(px.map(x=>x/W*100));
 }
 function widths(id){
  const tbl=document.getElementById(id),s=store()[id],L=labels(tbl);
  if(s&&s.w&&s.w.length===L.length)return s.w.slice();
  return auto(tbl);
 }
 /* columns hidden until the user shows them in 11.1 (user 2026-10-09: 05 ผู้ขาย without "ยอดซื้อสะสม") */
 const DEF_HIDE={venTbl:['ยอดซื้อสะสม','เครดิต']};   /* 05: credit too (user 2026-10-09) — still in the vendor window */
 function hidden(id){
  const tbl=document.getElementById(id),s=store()[id],n=heads(tbl).length;
  if(s&&s.hide&&s.hide.length===n&&s.w&&s.w.length===n)return s.hide.map(Boolean);
  const def=DEF_HIDE[id]||[];return heads(tbl).map(th=>def.includes(labelOf(th)));
 }
 /* Hidden columns: their cells are taken out of every row by one shared style sheet, and the colgroup lists only the
    shown columns, so the remaining cells line up with the remaining widths (sorting still uses the full header). */
 const cssId=id=>'#'+id.replace(/[^\w-]/g,'\\$&');   /* register ids are plain; no dependency on CSS.escape */
 const hideCss=document.createElement('style');hideCss.id='pkg-reg-hide';document.head.append(hideCss);
 function paintHidden(){
  hideCss.textContent=IDS.map(id=>{const h=document.getElementById(id)?hidden(id):[];return h.map((x,i)=>x?`${cssId(id)}>thead>tr>:nth-child(${i+1}),${cssId(id)}>tbody>tr:not([data-pkg-seq="span"])>:nth-child(${i+1})`:'').filter(Boolean).join(',');})
   .filter(Boolean).map(sel=>sel+'{display:none!important}').join('\n');
 }
 function apply(id){
  const tbl=document.getElementById(id);if(!tbl||!tbl.tHead)return;
  tbl.classList.add('pkg-reg');   /* the one shared register look for every register (biz-design.css .pkg-reg) */
  const h=hidden(id),ws=widths(id).filter((_,i)=>!h[i]),wt=ws.reduce((a,b)=>a+(+b||0),0)||100,w=Math.abs(wt-100)<0.05?ws:fit(ws.map(x=>(+x||0)/wt*100));   /* columns hidden by default: the rest share 100% */let cg=tbl.querySelector(':scope > colgroup.pkg-cols');
  if(!cg){cg=document.createElement('colgroup');cg.className='pkg-cols';tbl.prepend(cg);}
  if(cg.children.length!==w.length)cg.innerHTML=w.map(()=>'<col>').join('');
  [...cg.children].forEach((c,i)=>{const v=w[i]+'%';if(c.style.width!==v)c.style.width=v;});
  const minW=Math.max(900,Math.round(minimum(tbl).reduce((a,x,i)=>a+(h[i]?0:x),0)))+'px';
  if(tbl.style.getPropertyValue('--pkg-minw')!==minW)tbl.style.setProperty('--pkg-minw',minW);   /* used only by the desktop grid CSS */
  tbl.classList.add('pkg-fixed');
 }
 /* One-line columns get the room their longest content really needs: the “จัดการ” buttons
    (stacked, as in the original: as wide as the widest, e.g. 02 customers “เปิดใบเสนอราคา”), big amounts (05 vendors: 13,297,532.00), dates. Measured from the drawn rows,
    only ever grows; nothing is measured without layout (hidden page, tests). */
 function measureCols(id){
  const tbl=document.getElementById(id);if(!tbl||!tbl.tBodies[0]||!tbl.tHead||!tbl.getBoundingClientRect().width)return;
  const ths=heads(tbl),kinds=ths.map(colKind),rows=[...tbl.tBodies[0].rows].filter(r=>r.cells.length===ths.length).slice(0,40);
  /* two-part headers (label over a thin rule, 4.4 / 03, user 2026-10-08): each part needs one line — measured even with no rows */
  const hp=[];ths.forEach((th,i)=>{if(kinds[i]==='text'||kinds[i]==='seq')return;   /* every one-line column: its header never breaks (user 2026-10-09) */
   const p=document.createElement('div');p.className='pkg-measure';p.setAttribute('aria-hidden','true');
   p.style.cssText='position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;width:max-content;height:auto';
   p.innerHTML=th.innerHTML;p.querySelectorAll('.sarr,.pkg-measure').forEach(x=>x.remove());th.appendChild(p);hp.push([i,p,th]);});
  if(hp.length){const need=colPx[id]||(colPx[id]=Array(ths.length).fill(0));let grow=false;
   hp.forEach(([i,p,th])=>{const cs=getComputedStyle(th),w=Math.ceil(p.getBoundingClientRect().width+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+2);p.remove();if(w>need[i]+2){need[i]=w;grow=true;}});
   if(grow)apply(id);}
  if(!rows.length)return;
  /* Each cell's content is copied into a hidden, no-wrap, max-content box inside the same cell: its width is the
     content's own width, whatever the column's width is now. (Measuring the cell's own boxes made block content — a date
     chip over a “ผ่านมา … วัน” line — report the column's width back, so every sort grew the column a little more.)
     All boxes are added first and read in one go, so the page lays out once. */
  const probes=[],acts=[];
  kinds.forEach((k,i)=>{
   if(k==='text'||k==='seq')return;
   rows.forEach(tr=>{const td=tr.cells[i];if(!td||!td.firstChild)return;
    /* buttons: the stacked button box sizes itself (its content or a width set by the page), never by the column */
    if(k==='act'){const box=td.querySelector(':scope>div'),b=[...td.querySelectorAll('button,a.btn')];
     if(b.length)acts.push([i,box?box.getBoundingClientRect().width:Math.max(...b.map(x=>x.getBoundingClientRect().width))]);return;}
    if(!td.matches('.num,.ctr,.byc')&&!td.querySelector(':scope>.chip:only-child'))return;   /* only cells kept on one line (numbers, dates, statuses, who recorded it, a single status chip) */
    const p=document.createElement('div');p.className='pkg-measure';p.setAttribute('aria-hidden','true');
    p.style.cssText='position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;width:max-content;height:auto';
    p.innerHTML=td.innerHTML;td.appendChild(p);probes.push([i,p]);});
  });
  if(!probes.length&&!acts.length)return;
  const got=probes.map(([i,p])=>[i,p.getBoundingClientRect().width]).concat(acts);probes.forEach(([,p])=>p.remove());
  const need=colPx[id]||(colPx[id]=Array(ths.length).fill(0));let grow=false;
  got.forEach(([i,w])=>{if(!w)return;w=Math.ceil(w+20);if(w>need[i]+2){need[i]=w;grow=true;}});
  if(grow)apply(id);
 }
 /* Headers can be rebuilt (ลำดับ column, translations): keep the colgroup in step. */
 IDS.forEach(id=>{const tbl=document.getElementById(id);if(!tbl)return;apply(id);
  if(tbl.tHead)new MutationObserver(()=>apply(id)).observe(tbl.tHead,{childList:true,subtree:true});
  let tm=0;if(tbl.tBodies[0])new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(()=>{measureCols(id);apply(id);},60);}).observe(tbl.tBodies[0],{childList:true});});   /* a timer, not rAF: rAF pauses in hidden tabs */
 paintHidden();

 /* ---------- Menu 11 (temporary settings group) with sub-pages: 11.1 column widths, 11.2 problem register, … ----------
    Other modules add their page with PKG_UISET.addSub({key,label,allowed,el,show}). */
 const tabs=document.getElementById('tabs'),setItem=tabs&&tabs.querySelector('.navparent[data-v="setting"]')?.closest('.navitem');
 if(!tabs||!setItem)return;
 const SUBS=[];let pane=null;
 const firstAllowed=()=>SUBS.find(x=>x.allowed());
 /* Menu 11 is open to whoever may use at least one of its sub-pages (the original router asks can('tabs.uiset')). */
 const canO=can;
 can=function(path){
  if(path==='tabs.uiset')return SUBS.length?SUBS.some(x=>x.allowed()):canO('tabs.setting');
  return canO.apply(this,arguments);
 };
 const item=document.createElement('div');item.className='navitem';
 item.innerHTML='<button class="navparent" data-v="uiset"><span class="n">11</span><span class="lbl">ตั้งค่าเพิ่มเติม</span><span class="chev">›</span></button>'
  +'<div class="navchildren" id="nc-uiset"><div class="seg navseg" id="uisetTabs"></div></div>';
 setItem.after(item);
 const view=document.createElement('section');view.className='view';view.id='v-uiset';
 document.querySelector('main').append(view);
 function uisetGo(k){
  const s=SUBS.find(x=>x.key===k&&x.allowed())||firstAllowed();if(!s)return;pane=s.key;
  $$('#uisetTabs button').forEach(b=>b.classList.toggle('on',b.dataset.u===s.key));
  SUBS.forEach(x=>x.el.style.display=x===s?'':'none');
  mSetPageTitle('uiset');if(s.show)s.show();
 }
 /* Shown with menu 10 for franchise roles / HQ, and only if the account may use one of the sub-pages. */
 function paintSubs(){
  const mine=item.querySelector('.navparent'),ok=can('tabs.uiset');
  item.style.display=setItem.style.display;mine.style.display=ok?'':'none';
  item.classList.toggle('pkg-permission-hidden',!ok);item.classList.toggle('pkg-excluded',setItem.classList.contains('pkg-excluded'));
  $$('#uisetTabs button').forEach(b=>{const s=SUBS.find(x=>x.key===b.dataset.u);b.style.display=s&&s.allowed()?'':'none';});
  if(view.classList.contains('on')&&!(SUBS.find(x=>x.key===pane)||{allowed:()=>false}).allowed())uisetGo(firstAllowed()?.key);
 }
 function addSub(s){
  SUBS.push(s);const b=document.createElement('button');b.type='button';b.dataset.u=s.key;b.textContent=s.label;
  document.getElementById('uisetTabs').append(b);
  s.el.classList.add('pkg-upane');s.el.id='u-'+s.key;s.el.style.display='none';view.append(s.el);paintSubs();
 }
 document.getElementById('uisetTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-u]');if(!b)return;go('uiset');uisetGo(b.dataset.u);});
 NAV_HAS_CHILDREN.push('uiset');NAV_FIRST_SUB.uiset=()=>uisetGo(firstAllowed()?.key);   /* parent click opens the first sub-page, like other menus */
 new MutationObserver(paintSubs).observe(setItem,{attributes:true,subtree:true,attributeFilter:['style','class']});
 const applyO=applyPerms;applyPerms=function(){const r=applyO.apply(this,arguments);paintSubs();return r;};

 /* ---------- 11.1 · column widths (tabs.setting to open, doc.orgEdit to save) ---------- */
 const colsPanel=document.createElement('div');
 colsPanel.innerHTML=`<div class="panel pkg-regw"><header><h2>11.1 · ความกว้างช่องตารางทะเบียน</h2></header><div class="body">
  <p class="hint pkg-regw-note">กำหนดว่าแต่ละช่องของตารางทะเบียนกว้างกี่ % (รวมทั้งตาราง = 100%) · ช่องจะคงที่ ไม่ขยับเวลาเรียงข้อมูลหรือเปลี่ยนหน้า ข้อความที่ยาวเกินช่องจะขึ้นบรรทัดใหม่ แถวจะสูงขึ้นแทน · ตั้งแยกได้ทีละทะเบียน · เอาติ๊ก “แสดง” ออก (หรือใส่ 0%) เพื่อซ่อนช่องที่ไม่ต้องการ ความกว้างจะแบ่งให้ช่องที่เหลือเอง</p>
  <div class="pkg-regw-top"><label class="f"><span>เลือกตารางทะเบียน</span><select id="pkgRegwSel">${REGS.map(([g,rs])=>`<optgroup label="${g}">${rs.filter(r=>document.getElementById(r[0])).map(([id,l])=>`<option value="${id}">${l}</option>`).join('')}</optgroup>`).join('')}</select></label>
   <div class="pkg-regw-state" id="pkgRegwState"></div></div>
  <div class="pkg-regw-strip" id="pkgRegwStrip" aria-hidden="true"></div>
  <div class="scroll"><table class="tbl pkg-regw-tbl"><thead><tr><th class="ctr" style="width:60px">ช่องที่</th><th>ชื่อช่อง</th><th class="ctr" style="width:80px">แสดง</th><th style="width:190px">ความกว้าง (%)</th><th>สัดส่วน</th></tr></thead><tbody id="pkgRegwRows"></tbody>
   <tfoot><tr><td></td><td class="num"><b>รวมทั้งหมด</b></td><td></td><td><b id="pkgRegwSum">0%</b></td><td id="pkgRegwMsg" class="hint"></td></tr></tfoot></table></div>
  <div class="pkg-regw-btns"><button type="button" class="btn pri pkg-regw-view" data-w="edit">แก้ไข</button><span class="pkg-regw-editbtns"><button type="button" class="btn gh" data-w="fit">ปรับให้รวมครบ 100% อัตโนมัติ</button><button type="button" class="btn gh" data-w="equal">แบ่งเท่ากันทุกช่อง</button>
   <button type="button" class="btn gh" data-w="reset">คืนค่าเริ่มต้น</button><button type="button" class="btn gh" data-w="cancel">ยกเลิก</button><button type="button" class="btn pri" data-w="save">บันทึก</button></span></div>
 </div></div>`;
 addSub({key:'cols',label:'11.1 ความกว้างช่องตาราง',allowed:()=>canO('tabs.setting'),el:colsPanel,show:()=>pick(cur&&document.getElementById(cur)?cur:'qOvTbl')});
 let cur=null,draft=[],hideD=[],orderD=[],editing=false;   /* editing: the page opens read-only; “แก้ไข” unlocks it (user 2026-10-02) */   /* orderD: for the parts register, original column index at each position (editor draft) */
 const ORDERABLE=id=>id==='stockTbl'&&!!window.PKG_REG_ORDER;
 /* Keep the shown columns' proportions and scale them to fill 100% (optionally leaving room for one column). */
 function refit(keep){if(keep==null&&cur&&!hideD[0]&&heads(document.getElementById(cur))[orderD[0]??0]?.classList.contains('pkg-seq')&&+draft[0]<SEQ_MIN){draft[0]=SEQ_MIN;keep=0;}   /* ลำดับ never below its floor */const idx=draft.map((_,i)=>i).filter(i=>!hideD[i]&&i!==keep),room=100-(keep!=null?+draft[keep]||0:0),t=idx.reduce((a,i)=>a+(+draft[i]||0),0)||1;
  idx.forEach(i=>draft[i]=Math.max(0.5,(+draft[i]||0.5)/t*room));draft=draft.map((x,i)=>hideD[i]?0:x);const f=fit(draft.filter((_,i)=>!hideD[i]));let k=0;draft=draft.map((x,i)=>hideD[i]?0:f[k++]);
  const seq=cur&&!hideD[0]&&heads(document.getElementById(cur))[orderD[0]??0]?.classList.contains('pkg-seq');
  if(seq&&+draft[0]<SEQ_MIN){const diff=SEQ_MIN-draft[0];draft[0]=SEQ_MIN;let j=-1;draft.forEach((x,i)=>{if(i>0&&!hideD[i]&&(j<0||x>draft[j]))j=i;});if(j>0)draft[j]=r1(draft[j]-diff);}}   /* the rounding pass may push ลำดับ under its floor again */
 const $v=id=>document.getElementById(id);
 function draw(){
  const tbl=document.getElementById(cur),L0=labels(tbl),L=orderD.length===L0.length?orderD.map(p=>L0[p]):L0;   /* names follow the draft order (the bug: they stayed in table order, so a moved column looked hidden) */
  const mv=ORDERABLE(cur)&&editing;colsPanel.classList.toggle('pkg-regw-editing',editing);
  $v('pkgRegwRows').innerHTML=L.map((l,i)=>editing?`<tr class="${hideD[i]?'pkg-regw-off':''}${mv&&i>0?' pkg-regw-drag':''}" data-pos="${i}" ${mv&&i>0?'draggable="true"':''}><td class="ctr">${mv&&i>0?`<span class="pkg-regw-grip" title="กดค้างแล้วลากไปวางตำแหน่งที่ต้องการ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg><span class="pkg-regw-grip-t">ลากย้าย</span></span>`:''}<span class="pkg-regw-no">${i+1}</span></td><td>${esc(l)}${hideD[i]?' <span class="chip">ซ่อนอยู่</span>':''}</td>
   <td class="ctr">${heads(tbl)[orderD[i]??i]?.classList.contains('pkg-seq')?'<input type="checkbox" class="pkg-regw-show" checked disabled title="ช่อง “ลำดับ” แสดงเสมอ ปิดไม่ได้" aria-label="แสดงช่อง ลำดับ (แสดงเสมอ)">':`<input type="checkbox" class="pkg-regw-show" data-s="${i}" ${hideD[i]?'':'checked'} aria-label="แสดงช่อง ${esc(l)}">`}</td>
   <td><div class="pkg-unit"><input type="number" min="${minPct(i)||0}" max="90" step="0.5" data-i="${i}" value="${draft[i]}" ${hideD[i]?'disabled':''}><em>%</em></div>${minPct(i)?`<small class="pkg-regw-min" data-min="${i}" ${colKind(heads(tbl)[orderD[i]??i])==='img'?'data-img="1"':''}>ต่ำสุด ${minPct(i)}%${colKind(heads(tbl)[orderD[i]??i])==='img'?' (กรอบรูป '+IMG_MIN+'px)':''}</small>`:''}</td>
   <td><div class="pkg-regw-bar"><i style="width:${Math.min(100,draft[i]*2.5)}%"></i></div></td></tr>`
   :`<tr class="${hideD[i]?'pkg-regw-off':''}" data-pos="${i}"><td class="ctr">${i+1}</td><td>${esc(l)}${hideD[i]?' <span class="chip">ซ่อนอยู่</span>':''}</td><td class="ctr">${hideD[i]?'<span class="hint">—</span>':'<span class="pkg-regw-on" title="แสดง">✓</span>'}</td><td class="num pkg-regw-val">${hideD[i]?'<span class="hint">0 %</span>':draft[i]+' %'}</td><td><div class="pkg-regw-bar"><i style="width:${Math.min(100,draft[i]*2.5)}%"></i></div></td></tr>`).join('');
  const s=store()[cur],custom=!!(s&&s.w&&s.w.length===L.length),nh=hideD.filter(Boolean).length,moved=mv&&orderD.some((x,i)=>x!==i);
  $v('pkgRegwState').innerHTML=(custom?'<span class="chip ok">ใช้ค่าที่ร้านกำหนด</span>':'<span class="chip">ใช้ค่าเริ่มต้น</span>')+(nh?` <span class="chip">ซ่อน ${nh} ช่อง</span>`:'')+(moved?' <span class="chip">สลับตำแหน่งแล้ว — กดบันทึก</span>':'')+(mv?' <span class="hint">ลากแถว (จับที่ ⋮⋮) ไปวางตามลำดับที่ต้องการ · ช่อง “ลำดับ” อยู่หน้าสุดเสมอ</span>':'');
  sum();
 }
 function sum(){
  const L0=labels(document.getElementById(cur)),L=orderD.length===L0.length?orderD.map(p=>L0[p]):L0,t=r1(draft.reduce((a,b)=>a+(+b||0),0)),ok=Math.abs(t-100)<0.05;
  $v('pkgRegwSum').textContent=t+'%';$v('pkgRegwSum').style.color=ok?'#1f8a52':'#c0392b';
  $v('pkgRegwMsg').textContent=ok?'ครบ 100% พร้อมบันทึก':(t>100?'เกิน ':'ขาด ')+r1(Math.abs(100-t))+'% — กด “ปรับให้รวมครบ 100% อัตโนมัติ” หรือแก้ตัวเลขเอง';
  $v('pkgRegwStrip').innerHTML=L.map((l,i)=>hideD[i]?'':`<span style="width:${Math.max(0,+draft[i]||0)/Math.max(t,100)*100}%" title="${esc(l)} ${draft[i]}%"><b>${esc(l)}</b><em>${draft[i]}%</em></span>`).join('');
  [...$v('pkgRegwRows').querySelectorAll('.pkg-regw-bar i')].forEach((b,i)=>b.style.width=Math.min(100,(+draft[i]||0)*2.5)+'%');
 }
 /* the least a column may get in the editor (% of the table): picture frame 126px, ลำดับ 4% — shown at the box, typed values are held there (user 2026-10-02) */
 function minPct(i){const tb=document.getElementById(cur),hs=heads(tb),th=hs[orderD[i]??i];if(!th)return 0;
  if(th.classList.contains('pkg-seq'))return SEQ_MIN;
  if(colKind(th)==='img'){const W=Math.round(tb.getBoundingClientRect().width)||natural(tb).reduce((a,b)=>a+b,0)||1500;return r1(IMG_MIN/W*100);}
  return 0;}
 function pick(id){cur=id;editing=false;draft=widths(id);hideD=hidden(id);orderD=draft.map((_,i)=>i);if(heads(document.getElementById(id))[0]?.classList.contains('pkg-seq')){hideD[0]=false;if(+draft[0]<SEQ_MIN){draft[0]=SEQ_MIN;refit(0);}}$v('pkgRegwSel').value=id;draw();}
 /* swap two positions in the editor draft (widths and hidden go with their column) */
 /* take position `from` out and put it at `to` (never before ลำดับ) */
 function moveTo(from,to){if(from<1||to<1||from>=draft.length||to>=draft.length||from===to)return;[draft,hideD,orderD].forEach(a=>{const x=a.splice(from,1)[0];a.splice(to,0,x);});draw();}
 function show(i,on){
  if(!on&&heads(document.getElementById(cur))[orderD[i]??i]?.classList.contains('pkg-seq')){toast('ช่อง “ลำดับ” แสดงเสมอ ปิดไม่ได้');draw();return;}
  if(!on&&hideD.filter(x=>!x).length<=2){toast('ต้องแสดงอย่างน้อย 2 ช่อง');draw();return;}
  hideD[i]=!on;
  if(on){draft[i]=defaults(document.getElementById(cur))[i];refit(i);}else{draft[i]=0;refit();}
  draw();
 }
 $v('pkgRegwSel').addEventListener('change',e=>pick(e.target.value));
 /* drag a row (HTML5 drag; a marker shows where it will land) */
 let dragFrom=-1;const rowsEl=$v('pkgRegwRows'),mark=()=>rowsEl.querySelectorAll('.pkg-drop-before,.pkg-drop-after').forEach(r=>r.classList.remove('pkg-drop-before','pkg-drop-after'));
 rowsEl.addEventListener('dragstart',e=>{const tr=e.target.closest('tr[draggable]');if(!tr)return;dragFrom=+tr.dataset.pos;tr.classList.add('pkg-dragging');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dragFrom));}catch(x){}});
 rowsEl.addEventListener('dragend',()=>{dragFrom=-1;mark();rowsEl.querySelectorAll('.pkg-dragging').forEach(r=>r.classList.remove('pkg-dragging'));});
 rowsEl.addEventListener('dragover',e=>{if(dragFrom<0)return;const tr=e.target.closest('tr[data-pos]');if(!tr||+tr.dataset.pos<1)return;e.preventDefault();e.dataTransfer.dropEffect='move';
  const r=tr.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;mark();tr.classList.add(after?'pkg-drop-after':'pkg-drop-before');});
 rowsEl.addEventListener('drop',e=>{if(dragFrom<0)return;const tr=e.target.closest('tr[data-pos]');if(!tr)return;e.preventDefault();
  const r=tr.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;let to=+tr.dataset.pos+(after?1:0);if(to>dragFrom)to--;mark();moveTo(dragFrom,Math.max(1,to));dragFrom=-1;});
 window.pkgRegwMoveTo=moveTo;
 $v('pkgRegwRows').addEventListener('input',e=>{const i=e.target.dataset.i;if(i==null)return;let v=r1(+e.target.value||0);const m=minPct(+i),note=$v('pkgRegwRows').querySelector(`.pkg-regw-min[data-min="${i}"]`);
  const seqCol=heads(document.getElementById(cur))[orderD[+i]??+i]?.classList.contains('pkg-seq');
  if(m&&(v<m)&&(v>0||seqCol)){v=m;e.target.value=m;e.target.classList.add('pkg-regw-atmin');if(note)note.textContent='ลดต่ำกว่า '+m+'% ไม่ได้ — ต่ำสุดแล้ว';}
  else{e.target.classList.remove('pkg-regw-atmin');if(note&&m)note.textContent='ต่ำสุด '+m+'%'+(/กรอบรูป/.test(note.dataset.t||'')?'':'')+(note.dataset.img?' (กรอบรูป '+IMG_MIN+'px)':'');}
  draft[+i]=v;sum();});
 /* 0% = hide the column; the tick box shows / hides it. */
 $v('pkgRegwRows').addEventListener('change',e=>{
  if(e.target.dataset.s!=null)return show(+e.target.dataset.s,e.target.checked);
  const i=e.target.dataset.i;if(i!=null&&!(+e.target.value>0)){if(heads(document.getElementById(cur))[orderD[+i]??+i]?.classList.contains('pkg-seq')){draft[+i]=SEQ_MIN;draw();return;}show(+i,false);}
 });
 colsPanel.querySelector('.pkg-regw-btns').addEventListener('click',e=>{
  const w=e.target.closest('[data-w]')?.dataset.w;if(!w||!cur)return;
  if(w==='edit'){if(!can('doc.orgEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขการตั้งค่า');editing=true;draw();return;}
  if(w==='cancel'){pick(cur);toast('ยกเลิกการแก้ไข — ใช้ค่าเดิม');return;}
  if(w==='fit'){refit();draw();}
  if(w==='equal'){const n=hideD.filter(x=>!x).length;draft=draft.map((_,i)=>hideD[i]?0:100/n);refit();draw();}
  if(w==='reset'||w==='save'){
   if(!can('doc.orgEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขการตั้งค่า');
   if(w==='save'){
    const t=r1(draft.reduce((a,b)=>a+(+b||0),0));if(Math.abs(t-100)>=0.05)return toast('ความกว้างรวมต้องเท่ากับ 100% (ตอนนี้ '+t+'%)');
    if(draft.some((x,i)=>!hideD[i]&&!(+x>0)))return toast('ช่องที่แสดงต้องกว้างมากกว่า 0%');
    if(heads(document.getElementById(cur))[0]?.classList.contains('pkg-seq')&&!hideD[0]&&+draft[0]<SEQ_MIN)return toast('ช่อง “ลำดับ” ต้องกว้างอย่างน้อย '+SEQ_MIN+'% เพื่อให้ช่องติ๊กกับเลขลำดับอยู่บรรทัดเดียวกัน');
    {const tb=document.getElementById(cur),W=Math.round(tb.getBoundingClientRect().width)||natural(tb).reduce((a,b)=>a+b,0)||1500,hs=heads(tb);
     const bad=hs.findIndex((th,i)=>colKind(th)==='img'&&!hideD[i]&&(+draft[i]||0)/100*W<IMG_MIN);
     if(bad>=0)return toast('ช่อง “'+labelOf(hs[bad])+'” ต้องกว้างอย่างน้อย '+r1(IMG_MIN/W*100)+'% ('+IMG_MIN+'px) เพื่อให้กรอบรูปพอดี');}
    const prev=(store()[cur]||{}).order,base=Array.isArray(prev)&&prev.length===draft.length?prev:draft.map((_,i)=>i);   /* positions on screen → original index */
    const rec={cols:labels(document.getElementById(cur)),w:draft.map((x,i)=>hideD[i]?0:Number(x)),hide:hideD.slice()};
    if(ORDERABLE(cur)){const o=orderD.map(p=>base[p]);if(o.some((x,i)=>x!==i))rec.order=o;rec.cols=orderD.map(p=>rec.cols[p]);}
    store()[cur]=rec;
   }else delete store()[cur];
   save();if(ORDERABLE(cur))PKG_REG_ORDER.changed();apply(cur);paintHidden();pick(cur);
   toast((w==='save'?'บันทึกความกว้างช่อง ':'คืนค่าเริ่มต้น ')+NAME[cur]+' แล้ว');
  }
 });
 /* Router: menu 11 is handled here; every other menu goes to the original router. */
 const goO=go;
 go=function(v){
  if(v!=='uiset'){const r=goO.apply(this,arguments);IDS.forEach(apply);paintHidden();return r;}   /* data may have been (re)loaded since */
  if(!can('tabs.uiset')){toast('บัญชีพนักงานนี้ไม่ได้รับสิทธิเข้าใช้เมนูดังกล่าว');return;}
  $$('#tabs button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
  syncNavExpand(v);
  $$('section.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));
  uisetGo(pane);
  window.scrollTo(0,0);
 };
 let rz=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>IDS.forEach(apply),150);});   /* defaults follow the real table width */
 /* Register titles sit above their frame, on the page background (user 2026-09-30): the heading and the count tags right
    after it move into .pkg-page-head just before the panel; buttons / filters stay in the frame; an emptied header hides.
    Runs after every script (the customer page builds its own title in interface-enhancements.js). Windows are left alone. */
 function liftTitles(){
  const done=new Set();
  IDS.forEach(id=>{
   const tbl=document.getElementById(id);if(!tbl||tbl.closest('.modal'))return;
   const panel=tbl.closest('.panel');if(!panel||done.has(panel)||panel.previousElementSibling?.classList.contains('pkg-page-head'))return;done.add(panel);
   const header=panel.querySelector(':scope>header');if(!header)return;
   const src=header.querySelector(':scope>.pkg-cust-title')||header,h2=src.querySelector(':scope>h2');if(!h2)return;
   const head=document.createElement('div');head.className='pkg-page-head';let n=h2.nextElementSibling;head.append(h2);
   while(n&&(n.classList.contains('tag')||/Count$/.test(n.id||''))){const nx=n.nextElementSibling;head.append(n);n=nx;}
   panel.before(head);
   if(src!==header&&!src.children.length)src.classList.add('pkg-empty');
   if(![...header.children].some(c=>!c.classList.contains('spacer')&&!c.classList.contains('pkg-empty')&&!c.hidden))header.classList.add('pkg-empty');
  });
 }
 /* The create button gets its own row at the top of the frame, like 03 / 4.1 — on 05 vendors it sat in the filter row,
    where the taller search box pushed it down (user 2026-09-30). The filter row below turns white like the other registers. */
 function toolRows(){
  ['venInfo'].forEach(info=>{
   const row=document.getElementById(info)?.parentElement;if(!row||row.previousElementSibling?.classList.contains('pkg-tool-row'))return;
   const lead=[];for(const c of row.children){if(c.matches('button.btn'))lead.push(c);else break;}
   if(!lead.length)return;
   const top=document.createElement('div');top.className='row pkg-tool-row';
   top.setAttribute('style','padding:9px 12px;border-bottom:1px solid var(--line2);background:#fbfcfc');
   top.append(...lead);row.before(top);row.style.background='';
  });
 }
 const atLoad=()=>{liftTitles();toolRows();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',atLoad);else setTimeout(atLoad,0);
 /* Sort icons: every sortable header shows ↑↓ at its right edge; the sorted one marks its direction (CSS reads data-sort-dir) */
 const tip={asc:'เรียงจากน้อยไปมาก — คลิกเพื่อเรียงจากมากไปน้อย',desc:'เรียงจากมากไปน้อย — คลิกเพื่อกลับเป็นค่าเริ่มต้น',none:'คลิกเพื่อเรียงจากน้อยไปมาก'};
 function markSort(id){
  const t=document.getElementById(id);if(!t||!t.tHead)return;const st=sortState[id];
  [...t.tHead.rows[0].cells].forEach((th,i)=>{if(!th.classList.contains('sortable'))return;const dir=st&&st.col===i?st.dir:'';
   if(dir)th.dataset.sortDir=dir;else delete th.dataset.sortDir;
   th.setAttribute('aria-sort',dir==='asc'?'ascending':dir==='desc'?'descending':'none');th.title=tip[dir||'none'];});
 }
 const paintO=paintSort;paintSort=function(id){const r=paintO.apply(this,arguments);markSort(id);return r;};
 const bindS=bindSort;bindSort=function(id){const r=bindS.apply(this,arguments);markSort(id);return r;};
 Object.keys(SORT_DEF).forEach(markSort);
 /* The shop's data loads after this module: apply the saved widths once it has booted. */
 if(typeof boot==='function'){const bootO=boot;boot=function(){const r=bootO.apply(this,arguments);IDS.forEach(apply);paintHidden();return r;};}
 window.PKG_REG_LAYOUT={liftTitles,toolRows,markSort,apply,hidden,paintHidden,widths,defaults,natural,minimum,measureCols,colPx,pick,ids:IDS};
 window.PKG_UISET={addSub,go:uisetGo,paint:paintSubs,subs:SUBS};
})();
