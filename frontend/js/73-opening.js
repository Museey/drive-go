/* DriveGo new system (accountant round 3, J32; the owner's decision 6 of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): the
   opening balances, "ยอดยกมา".
   · 08 บัญชี → ยอดยกมา (after บัญชีแยกประเภท): the day the shop's books start in this program and every account's
     balance on the day before (the trial balance it closed with), debit or credit. "ใช้ยอดจากข้อมูลในระบบ" fills them
     from what the documents already in the program say up to that day (the general ledger without opening balances,
     PKG_LEDGER.before); the shop changes what it knows better — cash counted, the bank statement, what customers and
     vendors owe, input VAT already claimed on returns filed. Saved only when debits equal credits.
   · The general ledger then starts on that day (71-ledger.js J32): one entry "ยอดยกมา" with these balances, every entry
     dated earlier left out (the documents stay, for their history), no VAT month before it closed, and the input VAT
     carried starting from its 1055. The trial balance and the statements are as before.
   · Seen by the owner and staff with "ดูสรุปการเงิน ภาษี และเงินเดือน" (doc.fin), as the general ledger; saved or
     removed by the owner or staff with the chart of accounts' right (doc.coa; the server checks it, rules.ts).
   DB.opening = { date, lines: [{ a, dr, cr }], at, by, byName } (null when removed) */
(function(){
 const L=window.PKG_LEDGER,tabs=document.getElementById('acctTabs');
 if(!L||!tabs||typeof acctGo!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
 const may=()=>!curEmp()||!!can('doc.fin'),mayEdit=()=>!curEmp()||!!can('doc.coa');
 if(typeof AUD_KIND!=='undefined')AUD_KIND.opening='ยอดยกมา';

 const btn=document.createElement('button');btn.type='button';btn.dataset.a='opening';btn.textContent='ยอดยกมา';
 {const lg=tabs.querySelector('[data-a="ledger"]')||tabs.querySelector('[data-a="coa"]');if(lg)lg.after(btn);else tabs.append(btn);}
 const pane=document.createElement('div');pane.className='apane pkg-opening';pane.id='a-opening';pane.style.display='none';
 {const last=[...document.querySelectorAll('.apane')].pop();if(last)last.after(pane);}
 const tab=()=>{btn.style.display=may()?'':'none';};

 /* the chart's accounts, and those the system posts to that the chart lacks */
 function accounts(){const cs=new Set((DB.coa||[]).map(a=>a.code));Object.keys(L.NEW).forEach(k=>cs.add(L.sys(k)));
  return [...cs].filter(Boolean).sort().map(code=>({code,name:L.nameOf(code),type:L.typeOf(code)}));}
 const saved=()=>DB.opening&&DB.opening.date?DB.opening:null;
 /* the first day of the month of the first sale, or of this month */
 function firstDay(){let d='';(DB.receipts||[]).concat(DB.stockCuts||[]).forEach(x=>{const v=String(x&&x.date||'');if(v&&(!d||v<d))d=v;});
  return (d||iso()).slice(0,7)+'-01';}
 let DATE='',VALS=new Map();   /* code → {dr, cr}: what is on the screen */
 function load(){const o=saved();DATE=o?o.date:firstDay();VALS=new Map();
  if(o)(o.lines||[]).forEach(l=>{if(l&&l.a)VALS.set(l.a,{dr:r2(l.dr),cr:r2(l.cr)});});}
 const tot=()=>{let dr=0,cr=0;VALS.forEach(v=>{dr+=n(v.dr);cr+=n(v.cr);});return {dr:r2(dr),cr:r2(cr),diff:r2(dr-cr)};};
 const amt=v=>n(v)?r2(v).toFixed(2):'';

 function render(){
  tab();if(!may()){pane.innerHTML='<p class="hint">บัญชีนี้ไม่มีสิทธิ์ดูหน้านี้</p>';return;}
  const o=saved(),t=tot(),ed=mayEdit();
  const state=o?`บันทึกแล้ว ${thDate(String(o.at||'').slice(0,10)||o.date)} โดย ${esc(o.byName||'-')} · บัญชีแยกประเภทเริ่มวันที่ ${thDate(o.date)}`
   :'ยังไม่ได้บันทึก — บัญชีแยกประเภทใช้รายการตั้งแต่เอกสารแรก';
  pane.innerHTML=`<div class="panel"><header><h2>ยอดยกมา</h2><span class="hint">${state}</span><div class="spacer"></div>
   ${ed?`<button type="button" class="btn gh" data-op="fill">ใช้ยอดจากข้อมูลในระบบ</button>`
    +(o?`<button type="button" class="btn dgr" data-op="clear">ล้างยอดยกมา</button>`:'')
    +`<button type="button" class="btn pri" data-op="save">บันทึกยอดยกมา</button>`:''}</header><div class="body">
   <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px">
    <label class="f"><span>วันเริ่มใช้โปรแกรม</span><input type="date" id="opDate" aria-label="วันเริ่มใช้โปรแกรม" value="${esc(DATE)}"${ed?'':' disabled'}></label>
    <p class="hint" style="margin:0 0 6px">ยอดคงเหลือของแต่ละบัญชี ณ สิ้นวันก่อนวันเริ่มใช้ (งบทดลองที่ปิดไว้) เดบิตต้องเท่ากับเครดิต</p></div>
   <div class="scroll"><table class="tbl"><thead><tr><th style="width:100px">รหัสบัญชี</th><th>ชื่อบัญชี</th><th style="width:170px">หมวดบัญชี</th>
    <th class="num" style="width:150px">เดบิต</th><th class="num" style="width:150px">เครดิต</th></tr></thead><tbody>
    ${accounts().map(a=>{const v=VALS.get(a.code)||{};
     const box=(k,l)=>`<input type="number" step="0.01" min="0" class="num" style="width:100%" data-code="${esc(a.code)}" data-k="${k}" aria-label="${l} ${esc(a.code)}" value="${amt(v[k])}"${ed?'':' disabled'}>`;
     return `<tr><td class="mono"><b>${esc(a.code)}</b></td><td>${esc(a.name)}</td><td><span class="chip">${esc((typeof ACC_TYPE_LABEL!=='undefined'&&ACC_TYPE_LABEL[a.type])||a.type||'-')}</span></td>
      <td>${box('dr','เดบิต')}</td><td>${box('cr','เครดิต')}</td></tr>`;}).join('')}
    </tbody><tfoot><tr><td colspan="3" style="text-align:right"><b>รวม</b></td><td class="num"><b id="opDr">${money(t.dr)}</b></td><td class="num"><b id="opCr">${money(t.cr)}</b></td></tr>
     <tr><td colspan="3" style="text-align:right">ผลต่าง</td><td class="num" colspan="2"><b id="opDiff">${money(Math.abs(t.diff))}</b></td></tr></tfoot></table></div></div></div>`;
 }
 const totals=()=>{const t=tot();if($i('opDr'))$i('opDr').textContent=money(t.dr);if($i('opCr'))$i('opCr').textContent=money(t.cr);if($i('opDiff'))$i('opDiff').textContent=money(Math.abs(t.diff));};
 pane.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.code){const v=VALS.get(t.dataset.code)||{dr:0,cr:0};v[t.dataset.k]=r2(t.value);VALS.set(t.dataset.code,v);totals();}});
 pane.addEventListener('change',e=>{if(e.target.id==='opDate'){DATE=e.target.value||DATE;}});

 /* from what the documents say before the day */
 function fill(){if(!mayEdit())return;if(!DATE)return toast('เลือกวันเริ่มใช้โปรแกรมก่อน');
  VALS=new Map();L.before(DATE).forEach((v,code)=>{if(Math.abs(v)>=0.005)VALS.set(code,v>0?{dr:r2(v),cr:0}:{dr:0,cr:r2(-v)});});
  render();toast('ใส่ยอดจากข้อมูลในระบบ ณ สิ้นวัน '+thDate(prevDay(DATE))+' แล้ว — ตรวจและแก้ก่อนบันทึก');}
 function prevDay(d){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10);}
 function persist(){
  if(!mayEdit())return toast('บัญชีนี้ไม่มีสิทธิ์บันทึกยอดยกมา');if(!DATE)return toast('เลือกวันเริ่มใช้โปรแกรมก่อน');
  const t=tot();if(Math.abs(t.diff)>=0.005)return toast('ยอดเดบิตและเครดิตต้องเท่ากัน (ต่างกัน '+money(Math.abs(t.diff))+' บาท)');
  const lines=[];VALS.forEach((v,a)=>{const dr=r2(v.dr),cr=r2(v.cr);if(dr||cr)lines.push({a,dr,cr});});lines.sort((x,y)=>x.a.localeCompare(y.a));
  const old=saved();DB.opening={date:DATE,lines,at:nowTs(),by:DB.curEmp||'',byName:meName()};
  logAudit('opening',{id:'opening',no:'ยอดยกมา'},'save',(old?'แก้ไข':'บันทึก')+'ยอดยกมา วันเริ่มใช้ '+thDate(DATE)+' · '+lines.length+' บัญชี · '+money(t.dr)+' บาท');
  save();render();toast('บันทึกยอดยกมาแล้ว · บัญชีแยกประเภทเริ่มวันที่ '+thDate(DATE));}
 async function clear(){
  if(!mayEdit()||!saved())return;
  if(!await askP({title:'ล้างยอดยกมา',text:'บัญชีแยกประเภทจะกลับไปใช้รายการตั้งแต่เอกสารแรก',yes:'ล้างยอดยกมา',no:'ไม่ล้าง'}))return;
  DB.opening=null;logAudit('opening',{id:'opening',no:'ยอดยกมา'},'delete','ล้างยอดยกมา');
  save();load();render();toast('ล้างยอดยกมาแล้ว');}
 pane.addEventListener('click',e=>{const b=e.target.closest('[data-op]');if(!b)return;
  if(b.dataset.op==='fill')fill();else if(b.dataset.op==='save')persist();else if(b.dataset.op==='clear')clear();});

 const go0=acctGo;acctGo=function(a){tab();const r=go0.apply(this,arguments);if(a==='opening'){load();render();}return r;};
 if(typeof applyPerms==='function'){const ap0=window.applyPerms;window.applyPerms=function(){const r=ap0.apply(this,arguments);try{tab();}catch(e){}return r;};}
 tab();
 window.PKG_OPENING={load,render,fill};
})();
