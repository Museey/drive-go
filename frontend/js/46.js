/* 01 ลูกค้าสัมพันธ์ — the two tools at the top of the page (user 2026-10-11).
   1 · "ดูประวัติการติดตาม" opens its own window (#mCrmHist) instead of the generic audit list: how many customers were
       followed up and how. Data = what the program already stores when "บันทึกติดตาม" is pressed:
         DB.crm record: done (true) + doneDate (day only) · owner / ownerId (ผู้ติดตาม of the appointment) · type · date
         (วันที่นัด) · note · refNo;   DB.audit entry kind 'crm' act 'done' for that record: time + the account that pressed it.
       Nothing else is stored (no result text, no channel), so the window shows these and, worked out from the two dates,
       whether the follow-up came before / on / after the appointment day. A follow-up that was reverted (ย้อนสถานะ) is
       not counted. Filters: the day the follow-up was recorded (from – to + quick choices), ผู้ติดตาม, type, branch,
       search; page size 10 / 25 / 50 / 100 + pager; ส่งออก CSV / พิมพ์รายงาน take exactly what is filtered and need the
       page's "ส่งออกข้อมูล" box (m.crm_export — the right the Excel / PDF buttons of the registers use; owner always).
   2 · "สร้างนัดจากใบเสร็จอัตโนมัติ" no longer creates everything at once: it opens a picker (#mCrmPick) with the
       appointments the original autoCrm() WOULD create — found by running the original on a throw-away copy of DB.crm,
       so its rules (one "warranty" appointment per receipt, months = the longest warranty of the lines, at least the
       shop's default) and its record shape stay the original's. Left out of the list: cancelled receipts, receipts
       whose customer no longer exists, branches the account may not use. Nothing is ticked; the ticked ones are created
       after a confirmation (candidates are worked out again at that moment = the original's duplicate guard), each
       with the recorder's name (stampRec), the receipt's branch and a usage-log line.
   3 · "บันทึกติดตาม" asks HOW it went (user 2026-10-11 "เพิ่มช่องผลการติดตามเลย"): crmDone on an appointment that is not
       followed up yet opens a small pop-up (#mCrmDone) — result (6 choices), channel, day, who, note, and for
       "จะเข้ามา" / "ขอเลื่อน" an optional next appointment. Saving runs the ORIGINAL crmDone (its question answered by the
       pop-up) and then writes on the DB.crm record: doneResult (key) · doneResultText · doneChannel (key) · doneNote ·
       doneBy / doneById · doneDate = the chosen day, plus one usage-log line; a next date makes a new appointment through
       the original form (openCrm → saveCrm). "ย้อนสถานะ" (the original undo) also clears these fields. Followed rows of
       the 01 register carry the result chip under the status (crmRowHtml wrapped; pressing it re-opens the pop-up for
       accounts with doc.crmEdit). Follow-ups recorded before this keep the chip worked out from the dates + "ไม่ได้บันทึกผล".
   The generic audit window and the original functions are untouched (PKG_CRM_TOOLS.orig). */
(()=>{
 if(typeof autoCrm!=='function'||typeof openCrmHistory!=='function'||typeof openModal!=='function'||typeof pagerHtml!=='function')return;
 const $i=id=>document.getElementById(id);
 const MAIN='main',BR=()=>window.PKG_BRANCH||null;
 const orig={history:openCrmHistory,auto:autoCrm,done:typeof crmDone==='function'?crmDone:null,row:typeof crmRowHtml==='function'?crmRowHtml:null};
 const today=()=>iso();
 const mayExport=()=>!curEmp()||can('m.crm_export');
 const who=()=>meName(),when=()=>thDate(iso())+' '+new Date().toTimeString().slice(0,5);
 const shortUser=s=>{s=String(s||'');if(s.indexOf('เจ้าของกิจการ')===0)return 'เจ้าของกิจการ';const i=s.indexOf(' · ');return i>=0?s.slice(i+3):s;};
 const squash=s=>String(s||'').toLowerCase().replace(/[\s\-.]/g,'');
 const hit=(q,parts)=>{q=String(q||'').trim();if(!q)return true;const t=parts.filter(Boolean).join(' ').toLowerCase(),b=squash(q);return t.includes(q.toLowerCase())||(!!b&&squash(t).includes(b));};
 const localDay=ts=>{const d=new Date(ts);return isNaN(d)?'':iso(d);};
 const hhmm=ts=>{const d=new Date(ts);return isNaN(d)?'':String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
 const brands=v=>(((v&&v.brand)||'').replace(/\s*\(.*/,'')+' '+((v&&v.model)||'')).trim();
 /* branches: the ones the account may use (as the page's own branch picker); a record without a branch follows its receipt */
 const brList=()=>{const B=BR();return B?B.list().filter(b=>B.access(b.id)):[];};
 const brOk=id=>{const B=BR();return !B||B.access(id);};
 const brLabel=id=>{const B=BR(),b=B&&B.get(id);return b?b.code+' · '+b.name:'';};
 const rcMap=()=>{const m={};(DB.receipts||[]).forEach(r=>{m[r.id]=r;});return m;};
 const brOfCrm=(k,rm)=>{const B=BR();if(!B)return MAIN;if(k.br)return k.br;const r=k.refId&&rm[k.refId];return r?B.brOf(r):MAIN;};
 /* paging shared by the two windows */
 const pageOf=(rows,st)=>{const pages=Math.max(1,Math.ceil(rows.length/st.size));st.page=Math.min(Math.max(1,+st.page||1),pages);const from=(st.page-1)*st.size;return{pages,from,slice:rows.slice(from,from+st.size)};};
 const infoText=(total,pg,st)=>pg.pages<=1?('พบ '+total+' รายการ · ครบทุกรายการ'):('พบ '+total+' รายการ · แสดง '+(pg.from+1)+'–'+Math.min(total,pg.from+st.size)+' · หน้า '+st.page+'/'+pg.pages);
 const sizeOpts=(list,cur)=>list.map(v=>`<option value="${v}"${v===cur?' selected':''}>${v} รายการ</option>`).join('');
 const fill=(sel,html,val)=>{sel.innerHTML=html;sel.value=val;if(sel.value!==val)sel.value='';return sel.value;};
 function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 const api={orig,save:download,print:html=>printDocs(html),mayExport};

 /* follow-up results (key → full label · short label for chips · chip colour · counts as "reached the customer") and channels */
 const RES={come:{l:'ติดต่อได้ · ลูกค้าจะเข้ามา / นัดวันเข้ารับบริการ',s:'ลูกค้าจะเข้ามา',c:'g',ok:true,next:true},
  later:{l:'ติดต่อได้ · ยังไม่สะดวก ขอเลื่อน',s:'ขอเลื่อน',c:'a',ok:true,next:true},
  no:{l:'ติดต่อได้ · ไม่สนใจ / ไม่ใช้บริการ',s:'ไม่สนใจ',c:'r',ok:true},
  noans:{l:'ติดต่อไม่ได้ / ไม่รับสาย',s:'ไม่รับสาย',c:'',ok:false},
  wrong:{l:'เบอร์ผิด / ติดต่อไม่ได้ถาวร',s:'เบอร์ผิด',c:'r',ok:false},
  other:{l:'อื่น ๆ',s:'อื่น ๆ',c:'b',ok:false}};
 const CH={call:'โทร',line:'LINE',sms:'SMS',visit:'มาพบที่ร้าน',other:'อื่น ๆ'};
 const EXTRA=['doneResult','doneResultText','doneChannel','doneNote','doneBy','doneById'];
 const resText=k=>k.doneResult?(k.doneResultText||(RES[k.doneResult]||{}).l||k.doneResult):'';
 const chText=k=>k.doneChannel?(CH[k.doneChannel]||k.doneChannel):'';
 /* the chip of a followed appointment; with `edit` it can be pressed by accounts that may edit CRM */
 const resChip=(k,edit)=>{const r=RES[k.doneResult],full=resText(k),press=!!edit&&can('doc.crmEdit');
  return `<span class="chip ${r?r.c:''} pkg-ct-reschip${press?' pkg-ct-resedit':''}"${press?` data-crm-res="${esc(k.id)}" role="button" tabindex="0"`:''} title="${esc((full?full+(press?' — ':''):'')+(press?(full?'กดเพื่อแก้ไขผลการติดตาม':'กดเพื่อบันทึกผลการติดตาม'):''))}">${esc(r?r.s:(full||'ไม่ได้บันทึกผล'))}</span>`;};

 /* ================= 1 · follow-up history ================= */
 const H={from:'',to:'',quick:'all',who:'',type:'',res:'',br:'',q:'',size:25,page:1};
 const NONE='-';                                           /* "ไม่ระบุ" in the ผู้ติดตาม filter */
 function histAll(){
  const au={};(DB.audit||[]).forEach(a=>{if(a.kind==='crm'&&a.act==='done'&&a.docId)au[a.docId]=a;});   /* the latest "done" of each appointment */
  const rm=rcMap(),done=[],pend=[];
  (DB.crm||[]).forEach(k=>{
   const br=brOfCrm(k,rm);if(!brOk(br))return;
   const c=findCust(k.custId),v=c&&(c.vehicles||[])[k.vehIdx];
   const x={k,c,v,br,name:custName(c)||'-',co:c&&c.type==='company'&&c.name?c.name:'',tel:(c&&c.tel)||'',tel2:(c&&c.tel2)||'',plate:plateOf(v)||'',car:brands(v)};
   if(!k.done){x.who=k.owner||'';pend.push(x);return;}
   const a=au[k.id];
   x.fdate=k.doneDate||(a?localDay(a.ts):'');
   x.time=a&&localDay(a.ts)===x.fdate?hhmm(a.ts):'';
   x.by=a?shortUser(a.userName):'';                       /* the account that pressed "บันทึกติดตาม" (usage log) */
   x.who=k.doneBy||k.owner||x.by||'';                      /* who followed up (pop-up) → ผู้ติดตาม of the appointment → who recorded it */
   x.res=k.doneResult||'';x.resText=resText(k);x.ch=chText(k);x.dnote=k.doneNote||'';
   x.lag=x.fdate&&k.date?daysBetween(k.date,x.fdate):null; /* days after (+) / before (−) the appointment day */
   done.push(x);});
  return{done,pend};
 }
 function histData(){
  const all=histAll();
  const base=x=>(!H.who||(H.who===NONE?!x.who:x.who===H.who))&&(!H.type||x.k.type===H.type)&&(!H.br||x.br===H.br)&&hit(H.q,[x.name,x.co,x.tel,x.tel2,x.plate,x.car,x.k.note,x.k.refNo,x.resText,x.dnote]);
  const byRes=x=>!H.res||(H.res===NONE?!x.res:x.res===H.res);
  const inRange=x=>(!H.from&&!H.to)||(!!x.fdate&&(!H.from||x.fdate>=H.from)&&(!H.to||x.fdate<=H.to));
  let rows=all.done.filter(x=>base(x)&&byRes(x)&&inRange(x));
  rows.sort((a,b)=>String(b.fdate+' '+b.time).localeCompare(String(a.fdate+' '+a.time))||a.name.localeCompare(b.name,'th'));   /* newest first */
  rows=sortRows('crmHistTbl',rows);
  const pend=all.pend.filter(base),t=today();
  const types=Object.keys(CRM_TYPE).map(k=>({k,l:CRM_TYPE[k],n:rows.filter(x=>x.k.type===k).length}));
  const other=rows.filter(x=>!CRM_TYPE[x.k.type]).length;if(other)types.push({k:'',l:'อื่น ๆ',n:other});
  const wm=new Map();rows.forEach(x=>{const key=x.who||'';const o=wm.get(key)||{l:key||'ไม่ระบุ',n:0,c:new Set()};o.n++;o.c.add(x.k.custId);wm.set(key,o);});
  const whoList=[...wm.values()].map(o=>({l:o.l,n:o.n,cust:o.c.size})).sort((a,b)=>b.n-a.n||a.l.localeCompare(b.l,'th'));
  const sum={customers:new Set(rows.map(x=>x.k.custId)).size,times:rows.length,late:rows.filter(x=>x.lag!=null&&x.lag>0).length,
   pending:pend.length,overdue:pend.filter(x=>String(x.k.date||'')<t).length,types,who:whoList};
  sum.onTime=sum.times-sum.late;
  /* by result: the six choices (+ any older key), then the follow-ups made before results were recorded */
  const keys=Object.keys(RES).concat([...new Set(rows.map(x=>x.res).filter(r=>r&&!RES[r]))]);
  sum.results=keys.map(k=>({k,l:RES[k]?RES[k].s:k,n:rows.filter(x=>x.res===k).length}));
  sum.noResult=rows.filter(x=>!x.res).length;
  sum.recorded=sum.times-sum.noResult;sum.reached=rows.filter(x=>RES[x.res]&&RES[x.res].ok).length;
  sum.reachRate=sum.recorded?Math.round(sum.reached*100/sum.recorded):null;   /* reached ÷ follow-ups that have a result */
  return{all,rows,pend,sum};
 }
 const lagText=x=>x.lag==null?'ติดตามแล้ว':x.lag===0?'ติดตามตรงวันนัด':x.lag<0?('ติดตามก่อนวันนัด '+(-x.lag)+' วัน'):('ติดตามหลังวันนัด '+x.lag+' วัน');
 const periodText=()=>H.from||H.to?('วันที่บันทึกติดตาม '+(H.from?thDate(H.from):'เริ่มต้น')+' – '+(H.to?thDate(H.to):'ล่าสุด')):'ทุกช่วงวันที่';
 const filtersText=()=>[periodText(),H.who?('ผู้ติดตาม: '+(H.who===NONE?'ไม่ระบุ':H.who)):'',H.type?('ประเภท: '+(CRM_TYPE[H.type]||H.type)):'',H.res?('ผลการติดตาม: '+(H.res===NONE?'ไม่ได้บันทึกผล':(RES[H.res]||{}).l||H.res)):'',H.br?('สาขา: '+brLabel(H.br)):'',H.q.trim()?('ค้นหา: '+H.q.trim()):''].filter(Boolean);

 const HM=document.createElement('div');HM.className='modal pkg-mid pkg-wide';HM.id='mCrmHist';
 HM.innerHTML=`<div class="sheet pkg-ct-sheet">
  <header><h2>ประวัติการติดตามลูกค้า</h2><span class="tag" id="ctHTag"></span></header>
  <div class="body pkg-ct-body">
   <div class="pkg-ct-cards" id="ctHCards"></div>
   <div class="pkg-ct-filter">
    <div class="pkg-ct-quick"><span>ช่วงวันที่ที่บันทึกติดตาม</span>
     <div class="seg" id="ctHQuick" role="group" aria-label="ช่วงวันที่ที่บันทึกติดตาม"><button type="button" data-q="today">วันนี้</button><button type="button" data-q="7">7 วัน</button><button type="button" data-q="month">เดือนนี้</button><button type="button" data-q="all">ทั้งหมด</button></div>
     <span class="pkg-ct-sp"></span>
     <button type="button" class="btn gh" id="ctHCsv">ส่งออก CSV</button>
     <button type="button" class="btn gh" id="ctHPrint">พิมพ์รายงาน</button>
     <button type="button" class="btn gh" id="ctHClear">ล้างตัวกรอง</button></div>
    <div class="pkg-ct-fields" id="ctHFields">
     <label class="f"><span>ตั้งแต่วันที่</span><input type="date" id="ctHFrom"></label>
     <label class="f"><span>ถึงวันที่</span><input type="date" id="ctHTo"></label>
     <label class="f"><span>ผู้ติดตาม</span><select id="ctHWho"></select></label>
     <label class="f"><span>ประเภทการติดตาม</span><select id="ctHType"></select></label>
     <label class="f"><span>ผลการติดตาม</span><select id="ctHRes"></select></label>
     <label class="f" id="ctHBrWrap"><span>สาขา</span><select id="ctHBr"></select></label>
     <label class="f pkg-ct-q"><span>ค้นหา</span><input type="text" id="ctHSearch" autocomplete="off" placeholder="ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร"></label>
    </div>
   </div>
   <div class="pkg-ct-ctl"><label><span>แสดง</span><select id="ctHSize" aria-label="จำนวนที่แสดงต่อหน้า">${sizeOpts([10,25,50,100],25)}</select></label><span class="hint" id="ctHInfo"></span><span class="pkg-ct-pg" id="ctHPager"></span></div>
   <div class="scroll pkg-ct-scroll"><table class="tbl" id="crmHistTbl">
    <thead><tr><th class="ctr" style="width:60px">ลำดับ</th><th class="ctr" style="width:140px">วันที่บันทึกติดตาม</th><th style="width:200px">ลูกค้า</th><th style="width:150px">ทะเบียนรถ</th>
     <th class="ctr" style="width:170px">ประเภท</th><th class="ctr" style="width:110px">วันที่นัด</th><th>ผลการติดตาม / รายละเอียด</th><th style="width:140px">ผู้ติดตาม</th></tr></thead>
    <tbody></tbody></table></div>
   <div class="empty" id="ctHEmpty" hidden>ยังไม่มีรายการติดตามลูกค้าตามตัวกรองนี้</div>
  </div>
  <footer><button type="button" class="btn gh" onclick="closeModal('mCrmHist')">ปิด</button></footer></div>`;
 (document.getElementById('pkg-app')||document.body).append(HM);
 SORT_DEF.crmHistTbl={cols:{
  1:{lbl:'วันที่บันทึกติดตาม',key:x=>x.fdate+' '+x.time},2:{lbl:'ลูกค้า',key:x=>x.name},3:{lbl:'ทะเบียนรถ',key:x=>x.plate},
  4:{lbl:'ประเภท',key:x=>CRM_TYPE[x.k.type]||''},5:{lbl:'วันที่นัด',key:x=>String(x.k.date||'')},6:{lbl:'ผลการติดตาม',key:x=>x.resText||''},7:{lbl:'ผู้ติดตาม',key:x=>x.who}}};

 function histOptions(){
  const all=histAll(),names=[...new Set([...all.done,...all.pend].map(x=>x.who).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  const none=[...all.done,...all.pend].some(x=>!x.who);
  H.who=fill($i('ctHWho'),'<option value="">ทุกคน</option>'+names.map(nm=>`<option value="${esc(nm)}">${esc(nm)}</option>`).join('')+(none?`<option value="${NONE}">ไม่ระบุ</option>`:''),H.who);
  H.type=fill($i('ctHType'),'<option value="">ทุกประเภท</option>'+Object.entries(CRM_TYPE).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join(''),H.type);
  H.res=fill($i('ctHRes'),'<option value="">ทุกผลการติดตาม</option>'+Object.entries(RES).map(([k,r])=>`<option value="${k}">${esc(r.l)}</option>`).join('')+(all.done.some(x=>!x.res)?`<option value="${NONE}">ไม่ได้บันทึกผล</option>`:''),H.res);
  const bl=brList();$i('ctHBrWrap').hidden=bl.length<2;$i('ctHFields').classList.toggle('pkg-ct-nobr',bl.length<2);
  H.br=fill($i('ctHBr'),'<option value="">ทุกสาขา</option>'+bl.map(b=>`<option value="${esc(b.id)}">${esc(b.code+' · '+b.name)}</option>`).join(''),bl.length<2?'':H.br);
 }
 function renderHist(){
  const d=histData(),s=d.sum,pg=pageOf(d.rows,H);
  $i('ctHFrom').value=H.from;$i('ctHTo').value=H.to;
  [...$i('ctHQuick').children].forEach(b=>b.classList.toggle('on',b.dataset.q===H.quick));
  $i('ctHTag').textContent=periodText();
  const li=(l,v)=>`<li><span>${esc(l)}</span><b>${v}</b></li>`;
  $i('ctHCards').innerHTML=
   `<div class="pkg-ct-card g"><span>จำนวนลูกค้าที่ติดตามแล้ว</span><b data-k="customers">${s.customers}</b><small>ราย · ไม่นับซ้ำ</small></div>`
   +`<div class="pkg-ct-card"><span>จำนวนครั้งที่ติดตาม</span><b data-k="times">${s.times}</b><small>ครั้ง · ทันวันนัด <i data-k="onTime">${s.onTime}</i> · หลังวันนัด <i data-k="late">${s.late}</i></small></div>`
   +`<div class="pkg-ct-card ${s.overdue?'r':'a'}"><span>นัดที่ยังไม่ได้ติดตาม</span><b data-k="pending">${s.pending}</b><small>รายการ ณ วันนี้ · เลยกำหนด <i data-k="overdue">${s.overdue}</i> รายการ</small></div>`
   +`<div class="pkg-ct-card pkg-ct-brk"><span>แยกตามประเภทการติดตาม</span><ul class="pkg-ct-list" id="ctHTypes">${s.types.map(t=>li(t.l,t.n+' ครั้ง')).join('')}</ul></div>`
   +`<div class="pkg-ct-card pkg-ct-brk"><span>แยกตามผลการติดตาม</span><small id="ctHRate">${s.reachRate==null?'ยังไม่มีการบันทึกผล':'อัตราติดต่อได้ <i data-k="reachRate">'+s.reachRate+'%</i> (<i data-k="reached">'+s.reached+'</i> จาก <i data-k="recorded">'+s.recorded+'</i> ครั้งที่บันทึกผล)'}</small><div class="pkg-ct-chips" id="ctHResults">${s.results.filter(r=>r.n).map(r=>`<span class="chip ${(RES[r.k]||{}).c||''}" title="${esc((RES[r.k]||{}).l||r.l)}">${esc(r.l)} <b>${r.n}</b></span>`).join('')}${s.noResult?`<span class="chip">ไม่ได้บันทึกผล <b>${s.noResult}</b></span>`:''}</div></div>`
   +`<div class="pkg-ct-card pkg-ct-brk"><span>แยกตามผู้ติดตาม</span><ul class="pkg-ct-list" id="ctHWhos">${s.who.length?s.who.map(o=>li(o.l,o.n+' ครั้ง · '+o.cust+' ราย')).join(''):'<li class="hint">ยังไม่มีรายการ</li>'}</ul></div>`;
  $i('crmHistTbl').tBodies[0].innerHTML=pg.slice.map((x,i)=>{const k=x.k,late=x.lag!=null&&x.lag>0;
   return `<tr><td class="ctr">${pg.from+i+1}</td>
    <td class="ctr">${thDate(x.fdate)}${x.time?`<div class="hint">${x.time} น.</div>`:''}</td>
    <td><b>${esc(x.name)}</b>${x.co?`<div class="hint">${esc(x.co)}</div>`:''}<div class="hint">${esc(x.tel||'-')}${x.tel2?' · '+esc(x.tel2):''}</div></td>
    <td>${esc(x.plate||'-')}${x.car?`<div class="hint">${esc(x.car)}</div>`:''}</td>
    <td class="ctr"><span class="chip ${k.type==='prospect'?'b':'a'}">${esc(CRM_TYPE[k.type]||'-')}</span></td>
    <td class="ctr">${thDate(k.date)}</td>
    <td>${x.res?resChip(k,true)+`<span class="hint pkg-ct-ch">ช่องทาง ${esc(x.ch||'-')}</span>${x.dnote?`<div>${esc(x.dnote)}</div>`:''}`
      :`<span class="chip ${late?'a':'g'}">${esc(lagText(x))}</span> <span class="hint pkg-ct-ch">ไม่ได้บันทึกผล</span>`}
     <div class="${x.res?'hint':''}">${esc(k.note||'-')}</div>${k.refNo?`<div class="hint">อ้างอิงใบเสร็จ ${esc(k.refNo)}</div>`:''}</td>
    <td>${esc(x.who||'ไม่ระบุ')}${x.by&&x.by!==x.who?`<div class="hint">บันทึกโดย ${esc(x.by)}</div>`:''}</td></tr>`;}).join('');
  $i('ctHEmpty').hidden=d.rows.length>0;
  $i('ctHInfo').textContent=infoText(d.rows.length,pg,H);
  $i('ctHPager').innerHTML=pagerHtml(H.page,pg.pages,'PKG_CRM_TOOLS.histPage');
  const ok=mayExport();$i('ctHCsv').hidden=!ok;$i('ctHPrint').hidden=!ok;
  paintSort('crmHistTbl');
  return d;
 }
 function quick(q){
  const t=today();H.quick=q;H.page=1;
  if(q==='today'){H.from=t;H.to=t;}else if(q==='7'){H.from=addDays(t,-6);H.to=t;}else if(q==='month'){H.from=t.slice(0,8)+'01';H.to=t;}else{H.quick='all';H.from='';H.to='';}
  renderHist();
 }
 function openHist(){H.page=1;histOptions();$i('ctHSearch').value=H.q;renderHist();openModal('mCrmHist');}
 $i('ctHQuick').addEventListener('click',e=>{const b=e.target.closest('button[data-q]');if(b)quick(b.dataset.q);});
 [['ctHFrom','from'],['ctHTo','to']].forEach(([id,k])=>{$i(id).addEventListener('change',e=>{H[k]=e.target.value||'';H.quick=H.from||H.to?'':'all';H.page=1;renderHist();});});
 [['ctHWho','who'],['ctHType','type'],['ctHRes','res'],['ctHBr','br']].forEach(([id,k])=>{$i(id).addEventListener('change',e=>{H[k]=e.target.value;H.page=1;renderHist();});});
 $i('ctHSearch').addEventListener('input',e=>{H.q=e.target.value;H.page=1;renderHist();});
 $i('ctHSize').addEventListener('change',e=>{H.size=+e.target.value||25;H.page=1;renderHist();});
 $i('ctHClear').addEventListener('click',()=>{Object.assign(H,{from:'',to:'',quick:'all',who:'',type:'',res:'',br:'',q:'',page:1});sortState.crmHistTbl=null;$i('ctHSearch').value='';histOptions();renderHist();});
 bindSort('crmHistTbl',()=>{H.page=1;renderHist();});

 /* --- export / print: exactly the filtered rows, for accounts with the page's "ส่งออกข้อมูล" box --- */
 const fileName=ext=>('ประวัติการติดตามลูกค้า '+iso()+' ('+shortUser(who()).split('/')[0].trim()+')').replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ')+'.'+ext;
 const multiBr=()=>brList().length>1;
 function histTable(d){
  const head=['ลำดับ','วันที่บันทึกติดตาม','เวลา','ลูกค้า','เบอร์โทร','ทะเบียนรถ','ประเภท','วันที่นัด','ผลการติดตาม','ช่องทาง','หมายเหตุการติดตาม','เทียบกับวันนัด','รายละเอียดนัดหมาย','ใบเสร็จอ้างอิง','ผู้ติดตาม','บันทึกโดย'].concat(multiBr()?['สาขา']:[]);
  const rows=d.rows.map((x,i)=>[i+1,thDate(x.fdate),x.time,x.name+(x.co?' ('+x.co+')':''),[x.tel,x.tel2].filter(Boolean).join(' / '),x.plate,CRM_TYPE[x.k.type]||'',thDate(x.k.date),x.resText||'ไม่ได้บันทึกผล',x.ch,x.dnote,x.lag==null?'':lagText(x),x.k.note||'',x.k.refNo||'',x.who||'ไม่ระบุ',x.by||''].concat(multiBr()?[brLabel(x.br)]:[]));
  return{head,rows};
 }
 function histCsv(){
  if(!mayExport())return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');
  const d=histData();if(!d.rows.length)return toast('ไม่มีรายการให้ส่งออก');
  const t=histTable(d),cell=v=>{v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const csv='﻿'+[t.head].concat(t.rows).map(r=>r.map(cell).join(',')).join('\r\n');
  api.save(fileName('csv'),new Blob([csv],{type:'text/csv;charset=utf-8'}),csv);
  logAudit('crm',{id:'',no:'ประวัติการติดตามลูกค้า'},'print','ส่งออก CSV '+d.rows.length+' รายการ · โดย '+who()+' · '+filtersText().join(' · '));save();
  toast('ส่งออก CSV '+d.rows.length+' รายการแล้ว');
 }
 function histPrint(){
  if(!mayExport())return toast('บัญชีนี้ไม่มีสิทธิ์ส่งออกข้อมูลในหน้านี้');
  const d=histData(),s=d.sum;if(!d.rows.length)return toast('ไม่มีรายการให้พิมพ์');
  const t=histTable(d),drop=new Set([2,11,13,15]);         /* paper: the time goes under the date; no "เทียบกับวันนัด" / receipt / recorder columns */
  const cols=t.head.map((l,i)=>({l,i})).filter(c=>!drop.has(c.i));
  const by='พิมพ์โดย '+who()+' · '+when();
  const html=sheetTop({title:'รายงานประวัติการติดตามลูกค้า',en:'CRM FOLLOW-UP REPORT',copy:'รายงานภายใน',
    fields:[['วันที่พิมพ์',esc(when())],['ผู้พิมพ์',esc(who())],['จำนวน',d.rows.length+' รายการ']],
    note:esc('ตัวกรอง: '+filtersText().join(' · '))+'<br>'+esc('ลูกค้าที่ติดตามแล้ว '+s.customers+' ราย · ติดตาม '+s.times+' ครั้ง (ทันวันนัด '+s.onTime+' · หลังวันนัด '+s.late+') · ยังไม่ได้ติดตาม '+s.pending+' รายการ (เลยกำหนด '+s.overdue+')'+(s.reachRate==null?'':' · อัตราติดต่อได้ '+s.reachRate+'% ('+s.reached+' จาก '+s.recorded+' ครั้งที่บันทึกผล)'))})
   +`<table class="pkg-rep"><thead><tr class="pkg-rep-by"><th colspan="${cols.length}">${esc(by)}</th></tr><tr>${cols.map(c=>`<th${c.i===0?' style="width:42px"':''}>${esc(c.l)}</th>`).join('')}</tr></thead><tbody>`
   +t.rows.map(r=>`<tr>${cols.map(c=>`<td${c.i===0?' style="text-align:center"':''}>${esc(c.i===1&&r[2]?r[1]+' '+r[2]:r[c.i])}</td>`).join('')}</tr>`).join('')
   +'</tbody></table></div>';
  logAudit('crm',{id:'',no:'ประวัติการติดตามลูกค้า'},'print','พิมพ์รายงาน '+d.rows.length+' รายการ · โดย '+who()+' · '+filtersText().join(' · '));save();
  api.print(html);
 }
 $i('ctHCsv').addEventListener('click',histCsv);$i('ctHPrint').addEventListener('click',histPrint);

 /* ================= 2 · appointments from receipts: pick, then confirm ================= */
 const P={from:'',to:'',quick:'30',br:'',q:'',size:25,page:1,sel:new Set(),rows:[],shown:[]};
 /* what the original autoCrm() would add, without adding it: run it on a copy of DB.crm with saving / redrawing held */
 function dryRun(){
  const real=DB.crm,keep={},names=['save','renderCrm','renderHome','toast'];
  names.forEach(k=>{keep[k]=window[k];window[k]=()=>{};});
  DB.crm=real.slice();
  try{orig.auto();return DB.crm.slice(real.length);}
  finally{DB.crm=real;names.forEach(k=>{window[k]=keep[k];});}
 }
 function candidates(){
  if(!can('doc.crmEdit'))return [];
  const rm=rcMap(),B=BR();
  return dryRun().map(rec=>{const r=rm[rec.refId];if(!r||r.cancelled)return null;
   const c=findCust(r.custId);if(!c)return null;
   const br=B?B.brOf(r):MAIN;if(!brOk(br))return null;
   const v=(c.vehicles||[])[rec.vehIdx];
   return{rec,r,c,v,br,id:r.id,name:custName(c)||'-',tel:c.tel||'',tel2:c.tel2||'',plate:plateOf(v)||'',car:brands(v)};}).filter(Boolean)
   .sort((a,b)=>String(b.r.date||'').localeCompare(String(a.r.date||''))||String(b.r.no||'').localeCompare(String(a.r.no||'')));   /* newest receipt first */
 }
 const PM=document.createElement('div');PM.className='modal pkg-mid pkg-wide';PM.id='mCrmPick';
 PM.innerHTML=`<div class="sheet pkg-ct-sheet">
  <header><h2>สร้างนัดหมายจากใบเสร็จ</h2><span class="tag" id="ctPTag"></span></header>
  <div class="body pkg-ct-body">
   <p class="hint pkg-ct-lead">รายการด้านล่างคือใบเสร็จที่ยังไม่มีนัดตรวจเช็กตามระยะรับประกัน — ติ๊กเลือกใบที่ต้องการ แล้วกด “สร้างนัดหมาย” ระบบจะสร้างเฉพาะรายการที่เลือกเท่านั้น</p>
   <div class="pkg-ct-filter">
    <div class="pkg-ct-quick"><span>ช่วงวันที่ของใบเสร็จ</span>
     <div class="seg" id="ctPQuick" role="group" aria-label="ช่วงวันที่ของใบเสร็จ"><button type="button" data-q="30">30 วันล่าสุด</button><button type="button" data-q="90">90 วันล่าสุด</button><button type="button" data-q="all">ทั้งหมด</button></div></div>
    <div class="pkg-ct-fields" id="ctPFields">
     <label class="f"><span>ใบเสร็จตั้งแต่วันที่</span><input type="date" id="ctPFrom"></label>
     <label class="f"><span>ถึงวันที่</span><input type="date" id="ctPTo"></label>
     <label class="f" id="ctPBrWrap"><span>สาขา</span><select id="ctPBr"></select></label>
     <label class="f pkg-ct-q"><span>ค้นหา</span><input type="text" id="ctPSearch" autocomplete="off" placeholder="เลขที่ใบเสร็จ / ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร"></label>
    </div>
   </div>
   <div class="pkg-ct-ctl"><label><span>แสดง</span><select id="ctPSize" aria-label="จำนวนที่แสดงต่อหน้า">${sizeOpts([25,50,100],25)}</select></label><span class="hint" id="ctPInfo"></span><span class="pkg-ct-pg" id="ctPPager"></span></div>
   <div class="scroll pkg-ct-scroll"><table class="tbl" id="crmPickTbl">
    <thead><tr><th class="ctr" style="width:56px"><input type="checkbox" id="ctPAll" title="เลือกทั้งหน้านี้" aria-label="เลือกทั้งหน้านี้"></th><th style="width:170px">ใบเสร็จ</th><th style="width:220px">ลูกค้า</th><th style="width:160px">รถ / ทะเบียน</th>
     <th class="ctr" style="width:190px">ประเภทการติดตามที่จะสร้าง</th><th class="ctr" style="width:150px">วันที่นัดที่จะได้</th><th>รายละเอียด</th></tr></thead>
    <tbody></tbody></table></div>
   <div class="empty" id="ctPEmpty" hidden></div>
  </div>
  <footer class="pkg-ct-foot"><span class="pkg-ct-count" id="ctPCount"></span><button type="button" class="btn gh" onclick="closeModal('mCrmPick')">ยกเลิก</button><button type="button" class="btn pri" id="ctPGo" disabled>สร้างนัดหมาย 0 รายการ</button></footer></div>`;
 (document.getElementById('pkg-app')||document.body).append(PM);

 function pickFilter(){
  return P.rows.filter(x=>(!P.from||String(x.r.date||'')>=P.from)&&(!P.to||String(x.r.date||'')<=P.to)&&(!P.br||x.br===P.br)&&hit(P.q,[x.r.no,x.name,x.tel,x.tel2,x.plate,x.car]));
 }
 function renderPick(){
  const live=new Set(P.rows.map(x=>x.id));[...P.sel].forEach(id=>{if(!live.has(id))P.sel.delete(id);});
  const rows=pickFilter(),pg=pageOf(rows,P);P.shown=pg.slice;
  $i('ctPFrom').value=P.from;$i('ctPTo').value=P.to;
  [...$i('ctPQuick').children].forEach(b=>b.classList.toggle('on',b.dataset.q===P.quick));
  $i('ctPTag').textContent='ยังไม่มีนัด '+P.rows.length+' ใบ';
  $i('crmPickTbl').tBodies[0].innerHTML=pg.slice.map(x=>{const st=crmStatus(x.rec),on=P.sel.has(x.id);
   return `<tr data-id="${esc(x.id)}"${on?' class="pkg-ct-on"':''}><td class="ctr"><input type="checkbox" data-pick="${esc(x.id)}"${on?' checked':''} aria-label="เลือกใบเสร็จ ${esc(x.r.no||'')}"></td>
    <td><b>${esc(x.r.no||'-')}</b><div class="hint">${thDate(x.r.date)}</div></td>
    <td><b>${esc(x.name)}</b><div class="hint">${esc(x.tel||'-')}${x.tel2?' · '+esc(x.tel2):''}</div></td>
    <td>${esc(x.plate||'-')}${x.car?`<div class="hint">${esc(x.car)}</div>`:''}</td>
    <td class="ctr"><span class="chip a">${esc(CRM_TYPE[x.rec.type]||'-')}</span></td>
    <td class="ctr">${thDate(x.rec.date)}<div><span class="chip ${st.cls}">${esc(st.txt)}</span></div></td>
    <td>${esc(x.rec.note||'-')}</td></tr>`;}).join('');
  const none=!P.rows.length;
  $i('ctPEmpty').hidden=rows.length>0;
  $i('ctPEmpty').textContent=none?'ทุกใบเสร็จมีนัดตรวจเช็กครบแล้ว — ไม่มีรายการให้สร้างเพิ่ม':'ไม่พบใบเสร็จตามตัวกรองนี้ — ลองขยายช่วงวันที่ หรือกด “ทั้งหมด”';
  $i('ctPInfo').textContent=infoText(rows.length,pg,P);
  $i('ctPPager').innerHTML=pagerHtml(P.page,pg.pages,'PKG_CRM_TOOLS.pickPage');
  paintPick(rows);
 }
 /* counter, tick-all box and the create button — after every tick, without redrawing the table */
 function paintPick(rows){
  rows=rows||pickFilter();const inF=new Set(rows.map(x=>x.id)),n=P.sel.size,out=[...P.sel].filter(id=>!inF.has(id)).length;
  $i('ctPCount').textContent='เลือกแล้ว '+n+' จาก '+rows.length+' รายการ'+(out?' (อยู่นอกตัวกรองตอนนี้ '+out+' รายการ)':'');
  const all=$i('ctPAll'),on=P.shown.filter(x=>P.sel.has(x.id)).length;
  all.checked=P.shown.length>0&&on===P.shown.length;all.indeterminate=on>0&&on<P.shown.length;all.disabled=!P.shown.length;
  const go=$i('ctPGo');go.disabled=n===0;go.textContent='สร้างนัดหมาย '+n+' รายการ';
 }
 function tick(id,on){
  if(on)P.sel.add(id);else P.sel.delete(id);
  const tr=[...$i('crmPickTbl').tBodies[0].rows].find(r=>r.dataset.id===id);
  if(tr){tr.classList.toggle('pkg-ct-on',on);const cb=tr.querySelector('input[data-pick]');if(cb)cb.checked=on;}
 }
 function pickQuick(q){
  const t=today();P.quick=q;P.page=1;
  if(q==='30'||q==='90'){P.from=addDays(t,-(+q));P.to=t;}else{P.quick='all';P.from='';P.to='';}
  renderPick();
 }
 function openPick(){
  if(!can('doc.crmEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  P.rows=candidates();P.sel.clear();P.q='';P.br='';$i('ctPSearch').value='';
  const bl=brList();$i('ctPBrWrap').hidden=bl.length<2;$i('ctPFields').classList.toggle('pkg-ct-nobr',bl.length<2);
  fill($i('ctPBr'),'<option value="">ทุกสาขา</option>'+bl.map(b=>`<option value="${esc(b.id)}">${esc(b.code+' · '+b.name)}</option>`).join(''),'');
  pickQuick('30');                                          /* default: receipts of the last 30 days */
  openModal('mCrmPick');
 }
 async function createPicked(){
  if(!can('doc.crmEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  const want=new Set(P.sel);if(!want.size)return;
  if(!await askP({title:'สร้างนัดหมายจากใบเสร็จ',text:'ยืนยันสร้างนัดตรวจเช็กตามระยะรับประกัน '+want.size+' รายการ จากใบเสร็จที่เลือก?',yes:'สร้างนัดหมาย',no:'ยกเลิก'}))return;
  let add=0;
  candidates().forEach(x=>{                                  /* worked out again now: a receipt that got its appointment meanwhile is skipped */
   if(!want.has(x.id))return;
   const rec=x.rec;stampRec(rec,null);
   if(BR())rec.br=x.br;                                     /* the receipt's branch, not the branch the screen happens to be on */
   DB.crm.push(rec);
   logAudit('crm',{id:rec.id},'save','ลูกค้า '+x.name+' · นัดหมายวันที่ '+thDate(rec.date)+' (สร้างจากใบเสร็จ '+(x.r.no||'')+')');
   add++;});
  P.sel.clear();
  save();closeModal('mCrmPick');renderCrm();renderHome();
  toast(add?('สร้างนัดตรวจเช็กตามระยะรับประกัน '+add+' รายการ'):'ใบเสร็จที่เลือกมีนัดตรวจเช็กครบแล้ว');
  return add;
 }
 $i('ctPQuick').addEventListener('click',e=>{const b=e.target.closest('button[data-q]');if(b)pickQuick(b.dataset.q);});
 [['ctPFrom','from'],['ctPTo','to']].forEach(([id,k])=>{$i(id).addEventListener('change',e=>{P[k]=e.target.value||'';P.quick=P.from||P.to?'':'all';P.page=1;renderPick();});});
 $i('ctPBr').addEventListener('change',e=>{P.br=e.target.value;P.page=1;renderPick();});
 $i('ctPSearch').addEventListener('input',e=>{P.q=e.target.value;P.page=1;renderPick();});
 $i('ctPSize').addEventListener('change',e=>{P.size=+e.target.value||25;P.page=1;renderPick();});
 $i('ctPAll').addEventListener('change',e=>{const on=e.target.checked;P.shown.forEach(x=>tick(x.id,on));paintPick();});
 $i('crmPickTbl').tBodies[0].addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-id]');if(!tr)return;const cb=e.target.closest('input[data-pick]');
  tick(tr.dataset.id,cb?cb.checked:!P.sel.has(tr.dataset.id));paintPick();});
 $i('ctPGo').addEventListener('click',()=>{createPicked();});

 /* ================= 3 · "บันทึกติดตาม": how did it go ================= */
 const D={id:'',edit:false,ch:'call'};
 const OWNER='@owner',OWNER_NAME='เจ้าของกิจการ';
 const DM=document.createElement('div');DM.className='modal pkg-mid';DM.id='mCrmDone';
 DM.innerHTML=`<div class="sheet pkg-cd-sheet">
  <header><h2 id="ctDTitle">บันทึกผลการติดตาม</h2></header>
  <div class="body pkg-cd-body">
   <div class="pkg-cd-info" id="ctDInfo"></div>
   <div><span class="pkg-cd-l">ผลการติดตาม <b class="req">*</b></span>
    <div class="pkg-cd-opts" id="ctDResult" role="radiogroup" aria-label="ผลการติดตาม">${Object.entries(RES).map(([k,r])=>`<label class="pkg-cd-opt"><input type="radio" name="ctDRes" value="${k}"><i class="${r.c}" aria-hidden="true"></i><span>${esc(r.l)}</span></label>`).join('')}</div></div>
   <div><span class="pkg-cd-l">ช่องทาง</span>
    <div class="seg" id="ctDChannel" role="group" aria-label="ช่องทาง">${Object.entries(CH).map(([k,l])=>`<button type="button" data-c="${k}">${esc(l)}</button>`).join('')}</div></div>
   <div class="pkg-cd-g2">
    <label class="f"><span>วันที่ติดตาม</span><input type="date" id="ctDDate"></label>
    <label class="f"><span>ผู้ติดตาม</span><select id="ctDBy"></select></label></div>
   <label class="f" id="ctDNextWrap" hidden><span>นัดครั้งถัดไป</span><input type="date" id="ctDNext"><small class="hint">ไม่บังคับ — ถ้าระบุวันที่ ระบบจะสร้างนัดหมายใหม่ของลูกค้ารายนี้ให้หลังบันทึก</small></label>
   <label class="f"><span id="ctDNoteL">รายละเอียด / หมายเหตุ</span><textarea id="ctDNote" rows="2" placeholder="เช่น ลูกค้าสะดวกช่วงบ่ายวันเสาร์"></textarea></label>
  </div>
  <footer><button type="button" class="btn gh" onclick="closeModal('mCrmDone')">ปิด</button><button type="button" class="btn pri" id="ctDSave">บันทึกผลการติดตาม</button></footer></div>`;
 (document.getElementById('pkg-app')||document.body).append(DM);
 const dRes=()=>{const r=DM.querySelector('input[name="ctDRes"]:checked');return r?r.value:'';};
 function dPaint(){
  const res=dRes();
  [...$i('ctDChannel').children].forEach(b=>b.classList.toggle('on',b.dataset.c===D.ch));
  $i('ctDNextWrap').hidden=!(RES[res]&&RES[res].next)||D.edit;
  $i('ctDNoteL').innerHTML='รายละเอียด / หมายเหตุ'+(res==='other'?' <b class="req">*</b>':'');
 }
 /* who followed up: staff as in the appointment form (code · name) + the owner; names are stored as the program stores owners */
 function dFillBy(k){
  const el=$i('ctDBy'),emps=typeof empActiveList==='function'?empActiveList():(DB.emp||[]);
  el.innerHTML=emps.map(e=>`<option value="${esc(e.id)}">${esc((e.code?e.code+' · ':'')+e.name)}${e.position?' ('+esc(e.position)+')':''}</option>`).join('')+`<option value="${OWNER}">${OWNER_NAME}</option>`;
  const has=v=>[...el.options].some(o=>o.value===v),byName=nm=>{const e=nm&&emps.find(x=>x.name===nm);return e?e.id:'';};
  const legacy=nm=>{el.insertAdjacentHTML('beforeend',`<option value="legacy:${esc(nm)}">${esc(nm)}</option>`);return 'legacy:'+nm;};
  let v='';
  if(k.done&&(k.doneBy||k.doneById))v=has(k.doneById)?k.doneById:k.doneBy===OWNER_NAME?OWNER:(byName(k.doneBy)||legacy(k.doneBy));
  else if(k.ownerId&&has(k.ownerId))v=k.ownerId;                    /* the appointment's own ผู้ติดตาม first */
  else if(byName(k.owner))v=byName(k.owner);
  else if(k.owner)v=legacy(k.owner);
  else{const me=curEmp();v=me&&has(me.id)?me.id:OWNER;}              /* else the account at the screen */
  el.value=v;
 }
 function dBy(){
  const v=$i('ctDBy').value;if(v===OWNER||!v)return{id:'',name:OWNER_NAME};
  if(v.indexOf('legacy:')===0)return{id:'',name:v.slice(7)};
  const e=(DB.emp||[]).find(x=>x.id===v);return e?{id:e.id,name:e.name}:{id:'',name:OWNER_NAME};
 }
 function openDone(id,edit){
  const k=(DB.crm||[]).find(x=>x.id===id);if(!k)return;
  if(!can('doc.crmEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  const c=findCust(k.custId),v=c&&(c.vehicles||[])[k.vehIdx],t=today();
  D.id=id;D.edit=!!edit&&!!k.done;D.ch=(D.edit&&CH[k.doneChannel])?k.doneChannel:'call';
  $i('ctDTitle').textContent=D.edit?'แก้ไขผลการติดตาม':'บันทึกผลการติดตาม';
  $i('ctDInfo').innerHTML=`<b>${esc(custName(c)||'-')}</b><span>${esc(plateOf(v)||'-')}${c&&c.tel?' · '+esc(c.tel):''}</span><span>${esc(CRM_TYPE[k.type]||'-')} · นัดวันที่ ${thDate(k.date)}</span>`;
  DM.querySelectorAll('input[name="ctDRes"]').forEach(r=>{r.checked=D.edit&&r.value===k.doneResult;});
  const dd=$i('ctDDate');dd.max=t;dd.value=D.edit&&k.doneDate?k.doneDate:t;
  const nx=$i('ctDNext');nx.min=t;nx.value='';
  $i('ctDNote').value=D.edit?(k.doneNote||''):'';
  dFillBy(k);dPaint();openModal('mCrmDone');DM.querySelector('.pkg-cd-body').scrollTop=0;
 }
 /* the next appointment: through the program's own form (openCrm fills it, saveCrm writes it) so the record is the original's */
 function nextAppt(k,date,text){
  const n0=DB.crm.length,kt=window.toast;window.toast=()=>{};
  try{
   openCrm();
   const M=$i('mCrm'),kc=$i('kCust');
   if(M&&M.classList.contains('on')){
    kc.value=k.custId;
    if(kc.value===k.custId){
     crmFillVeh();$i('kVeh').value=String(k.vehIdx||0);
     const rf=$i('kRef');rf.value=k.refId||'';if(rf.value!==(k.refId||''))rf.value='';
     $i('kType').value=k.type;$i('kDate').value=date;fillCrmOwnerSel(k);$i('kNote').value=text;
     saveCrm();}
    if(M.classList.contains('on'))closeModal('mCrm');}
  }catch(e){console.error('crm-tools next appointment',e);try{closeModal('mCrm');}catch(_){}}
  finally{window.toast=kt;}
  if(DB.crm.length>n0)return DB.crm[DB.crm.length-1];
  /* the form only lists customers with a live receipt: for the others the same record is written here */
  const ref=k.refId&&(DB.receipts||[]).find(r=>r.id===k.refId);
  const rec={id:uid(),custId:k.custId,vehIdx:k.vehIdx||0,type:k.type,date,owner:k.owner||'',ownerId:k.ownerId||'',note:text,refId:ref?ref.id:'',refNo:ref?ref.no:'',done:false,openedAt:iso()};
  stampRec(rec,null);DB.crm.push(rec);
  logAudit('crm',{id:rec.id},'save','ลูกค้า '+custName(findCust(k.custId))+' · นัดหมายวันที่ '+thDate(date)+' (สร้างใหม่)');
  return rec;
 }
 async function saveDone(){
  const k=(DB.crm||[]).find(x=>x.id===D.id);if(!k)return closeModal('mCrmDone');
  if(!can('doc.crmEdit'))return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  const res=dRes(),date=$i('ctDDate').value,note=$i('ctDNote').value.trim(),t=today();
  if(!RES[res])return toast('เลือกผลการติดตามก่อนบันทึก');
  if(!date)return toast('ระบุวันที่ติดตามก่อนบันทึก');
  if(date>t)return toast('วันที่ติดตามต้องไม่เป็นวันในอนาคต');
  if(res==='other'&&!note)return toast('ผลการติดตาม “อื่น ๆ” ต้องระบุรายละเอียด');
  const edit=D.edit&&k.done,next=!edit&&RES[res].next?$i('ctDNext').value:'';
  if(next&&next<=date)return toast('วันที่นัดครั้งถัดไปต้องอยู่หลังวันที่ติดตาม');
  const by=dBy();
  if(!k.done){
   /* the ORIGINAL "บันทึกติดตาม" (done · doneDate · usage log · save · redraw); its yes / no was this pop-up */
   const ka=window.askP,kt=window.toast;window.askP=async()=>true;window.toast=()=>{};
   try{await orig.done(k.id);}finally{window.askP=ka;window.toast=kt;}
   if(!k.done)return toast('บันทึกการติดตามไม่สำเร็จ ลองอีกครั้ง');
  }
  Object.assign(k,{doneDate:date,doneResult:res,doneResultText:RES[res].l,doneChannel:D.ch,doneNote:note,doneBy:by.name,doneById:by.id});
  logAudit('crm',{id:k.id},'save',(edit?'แก้ไขผลการติดตาม: ':'ผลการติดตาม: ')+RES[res].l+' · ช่องทาง '+CH[D.ch]+' · ผู้ติดตาม '+by.name+' · วันที่ '+thDate(date)+(note?' · '+note:''));
  let made=null;
  if(next)made=nextAppt(k,next,'ต่อเนื่องจากการติดตามวันที่ '+thDate(date)+' · '+RES[res].s+(note?' · '+note:''));
  save();closeModal('mCrmDone');renderCrm();renderHome();
  if(HM.classList.contains('on'))renderHist();
  toast((edit?'แก้ไขผลการติดตามแล้ว':'บันทึกผลการติดตามแล้ว')+(made?' · สร้างนัดครั้งถัดไปวันที่ '+thDate(made.date)+' ให้แล้ว':''));
  return made||true;
 }
 $i('ctDResult').addEventListener('change',dPaint);
 $i('ctDChannel').addEventListener('click',e=>{const b=e.target.closest('button[data-c]');if(b){D.ch=b.dataset.c;dPaint();}});
 $i('ctDSave').addEventListener('click',()=>{saveDone();});
 if(orig.done){
  /* every "บันทึกติดตาม" button (01 register, home list) calls crmDone: not followed yet → the pop-up; followed → the original undo */
  window.crmDone=async function(id){
   const k=(DB.crm||[]).find(x=>x.id===id);if(!k)return;
   if(!k.done)return openDone(id,false);
   const r=await orig.done.apply(this,arguments);
   if(!k.done&&EXTRA.some(f=>f in k)){EXTRA.forEach(f=>{delete k[f];});save();}   /* ย้อนสถานะ: the result goes with it */
   return r;};
 }
 if(orig.row){
  /* 01 register: the result under "ติดตามแล้ว" of a followed row — same cell, the table is not widened */
  const MARK='<span class="chip g">ติดตามแล้ว</span>';
  window.crmRowHtml=function(k,compact){
   let h=orig.row.apply(this,arguments);
   try{if(!compact&&k&&k.done){const i=h.indexOf(MARK);if(i>=0)h=h.slice(0,i+MARK.length)+'<div class="pkg-ct-resline">'+resChip(k,true)+'</div>'+h.slice(i+MARK.length);}}catch(e){}
   return h;};
 }
 const pressChip=e=>{const c=e.target.closest&&e.target.closest('[data-crm-res]');if(!c)return false;openDone(c.dataset.crmRes,true);return true;};
 document.addEventListener('click',pressChip);
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&pressChip(e))e.preventDefault();});

 /* ================= the two page buttons ================= */
 window.openCrmHistory=openHist;window.autoCrm=openPick;
 /* normal height (user: "แก้ไขปุ่มให้สูงกว่านี้") — the register header (reg-head.js) makes the side buttons small */
 const tall=()=>document.querySelectorAll('#v-crm button[onclick="openCrmHistory()"],#v-crm button[onclick="autoCrm()"]').forEach(b=>b.classList.remove('sm'));
 const paint=()=>{tall();const ok=mayExport();$i('ctHCsv').hidden=!ok;$i('ctHPrint').hidden=!ok;};
 const ap=window.applyPerms;if(typeof ap==='function')window.applyPerms=function(){const r=ap.apply(this,arguments);try{paint();}catch(e){}return r;};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(paint,0));
 [0,300,1500].forEach(t=>setTimeout(paint,t));

 Object.assign(api,{openHistory:openHist,renderHistory:renderHist,histData,histState:H,histPage:p=>{H.page=p;renderHist();},quick,csv:histCsv,printReport:histPrint,
  openDone,saveDone,doneState:D,results:RES,channels:CH,openPicker:openPick,renderPicker:renderPick,candidates,pickState:P,pickPage:p=>{P.page=p;renderPick();},pickQuick,tick:(id,on)=>{tick(id,on!==false);paintPick();},create:createPicked});
 window.PKG_CRM_TOOLS=api;
})();
