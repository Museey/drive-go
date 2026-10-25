/* ตัดชำระยอดค้าง — the debt-settlement window (user's approved mockup, mockups/settle-options.html, 2026-10-11).
   Replaces the look and the working of #mPartPay ("รับชำระเงินลูกหนี้" / "ชำระเงินเจ้าหนี้"); the openers, the titles and the
   rights (doc.payRec / doc.payGr) are the original's. The original controls stay in the page, hidden (.pkg-st-old + the
   footer), so ppAuto / ppConfirm / ppFillBills are still there; the live cut below replaces "รับเงินรวม" + "จัดสรรอัตโนมัติ".
   · left: สาขา · ลูกค้า / ผู้ขาย (type-ahead) · วันที่ชำระ · ผู้บันทึก · ยอดค้าง · bills (newest on top; cards on phones)
   · right: slips (big preview, full-screen viewer) · ยอดค้าง − รับครั้งนี้ = คงค้าง · เต็มจำนวน · method tiles · method cards
     (โอน = up to 6 transfer lines, each with account / amount / date-time / ref / own slip) · หมายเหตุ · save bar
   · the money received is cut over the ticked bills oldest first while typing; typing a bill's own amount = manual mode;
     less than the ticked total is normal (partial bill stays open), more is blocked, zero is blocked
   Writes per bill = the original ppConfirm's: one payments[] record {id,amt,date,method,by,note,bank,ref,card4,chkDate},
   paid / paidDate (AR) or paid / payDate / payMethod / payBank / payRef / payCard4 / chkDate / payBy / payNote (AP),
   logAudit(…,'pay',…), save(), the same register refreshes. New fields on the record: payId (shared by the settlement),
   payTotal, payBills, methods [{k,amt,…}], transLines [{no,bank,amt,when,ref,slip}], slipCount, br.
   `method` = the method with the largest share (old reports keep working). Slip pictures (jpeg ≤1100px, q .78) are kept
   once per settlement in DB.paySlips[payId] = [{url,name,line}]. Records without payId are shown exactly as before. */
(()=>{
 if(typeof openPartPay!=='function'||typeof ppOutDocs!=='function'||typeof renderPayHist!=='function')return;
 const M=document.getElementById('mPartPay');if(!M||M.querySelector('.pkg-st'))return;
 const host=document.getElementById('pkg-app')||document.body;
 const $i=id=>document.getElementById(id);
 const num=v=>{const x=parseFloat(String(v==null?'':v).replace(/,/g,''));return isFinite(x)?x:0;};
 const r2=v=>Math.round(v*100)/100;
 const fm=v=>(+v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const Br=()=>window.PKG_BRANCH||null;
 const nowText=()=>{const d=new Date();return thDate(iso(d))+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
 const say=msg=>{if(typeof toast==='function')toast(msg);};
 /* line icons (stroke = the text colour) */
 const sv=(d,c)=>`<svg class="pkg-st-ic${c?' '+c:''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
 const IC={cash:'<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 10v4M17.5 10v4"/>',
  trans:'<path d="M3.5 10 12 4.5l8.5 5.5"/><path d="M5.5 10.5v6.5M9.8 10.5v6.5M14.2 10.5v6.5M18.5 10.5v6.5"/><path d="M3.5 19.5h17"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18M7 15h4"/>',
  check:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6.5 10.5h6M6.5 14h3"/><path d="M13 14.6c.9-1.7 1.6-1.7 2.1 0 .4 1.4 1.3 1.1 2.4-.9"/>',
  clip:'<path d="m20 11.5-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
  up:'<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  zoom:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5"/>',
  warn:'<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>'};
 const METH=[['cash','เงินสด','#16865c'],['trans','โอน','#2457c5'],['card','บัตร','#7c3aed'],['check','เช็ค','#b25e00']];
 const MI=Object.fromEntries(METH.map(x=>[x[0],x]));
 const mlabel=k=>(typeof PAY_METHOD_LABEL==='object'&&PAY_METHOD_LABEL[k])||(MI[k]||[])[1]||k;
 const L={ar:{party:'ลูกค้า',doc:'ใบขาย',recv:'รับ',hint:'แตะวิธีที่ลูกค้าจ่าย — แตะหลายอันได้ (แบ่งจ่าย)',save:'บันทึกรับชำระ',verb:'รับชำระ',amt:'จำนวนเงินที่รับจริง',
   trans:'บัญชีร้านที่รับโอน',card:'ธนาคารของบัตร',chk:'ธนาคารตามหน้าเช็ค',slip:'แนบสลิปที่ลูกค้าโอนมา / รูปเช็ค',sub:'รับเงินจากลูกค้าเงินเชื่อ',cfm:'ยืนยันบันทึกรับชำระ'},
  ap:{party:'ผู้ขาย',doc:'ใบรับสินค้า',recv:'จ่าย',hint:'แตะวิธีที่จ่ายให้ผู้ขาย — แตะหลายอันได้ (แบ่งจ่าย)',save:'บันทึกจ่ายชำระ',verb:'จ่ายชำระ',amt:'จำนวนเงินที่จ่ายจริง',
   trans:'โอนจากบัญชีร้าน',card:'บัตรของร้าน (ธนาคาร)',chk:'ธนาคารของเช็คร้าน',slip:'แนบสลิปที่ร้านโอนไป / รูปเช็ค',sub:'จ่ายเงินให้ผู้ขายเงินเชื่อ',cfm:'ยืนยันบันทึกจ่ายชำระ'}};
 /* ระบบขายแบบใหม่ (owner 12 Oct): while it is on the bill is called "ใบตัดสต็อก", never "ใบขาย" */
 Object.defineProperty(L.ar,'doc',{get:()=>window.PKG_SALE&&PKG_SALE.on()?'ใบตัดสต็อก':'ใบขาย'});
 const MAXLINES=6,MAXFREE=2,MAXM=3,NONE='__none';

 /* ---------- state ---------- */
 let S=null,LID=0;
 const blank=mode=>({mode,branch:'',party:'',ticks:{},manual:false,man:{},rows:[],note:'',slips:[],slipIx:0,date:iso(),by:meName(),result:null,open:false,q:'',hi:-1,docs:[],pl:[]});
 const lb=()=>L[S.mode];
 const clearSel=()=>{S.ticks={};S.man={};S.manual=false;S.rows=[];};
 /* open documents of this side, in the branches the account may use (read again after every save) */
 /* ระบบขายแบบใหม่ (sale-pay.js): withholding a juristic customer confirms for a bill in this settlement — it is not money, so it lowers what is left to pay */
 const whtOf=id=>S&&S.mode==='ar'&&S.wht&&S.wht[id]?num(S.wht[id].amt):0;
 /* DriveGo new system (task 3.4, R7-ข): withholding from a vendor (58-payment-voucher.js) lowers what is left to pay the same way */
 const PV=()=>S&&S.mode==='ap'&&window.PKG_PV?window.PKG_PV:null;
 const whtAp=id=>PV()&&S.wht&&S.wht[id]?num(S.wht[id].amt):0;
 function reload(){
  const b=Br();PP.mode=S.mode;
  S.docs=ppOutDocs().map(x=>{const paid=r2(paidAmtOf(x.d)),br=b?b.brOf(x.d):'main';
   return {d:x.d,id:x.d.id,who:x.who||NONE,no:x.no,date:x.date||'',due:x.due||x.date||'',total:r2(x.total),paid,br,
    cnt:(x.d.payments||[]).filter(p=>!p.cancelled&&num(p.amt)>0).length,raw:r2(Math.max(0,x.total-paid)),out:r2(Math.max(0,x.total-paid-whtOf(x.d.id)-whtAp(x.d.id))),inv:S.mode==='ap'?(x.d.inv||''):''};})
   .filter(x=>x.out>.004&&(!b||b.access(x.br)));
  listParties();
 }
 const openBills=()=>S.docs.filter(x=>S.branch==='all'||!S.branch||x.br===S.branch);
 function listParties(){
  const map={};openBills().forEach(x=>{const p=map[x.who]||(map[x.who]={id:x.who,cnt:0,sum:0});p.cnt++;p.sum=r2(p.sum+x.out);});
  S.pl=Object.values(map).map(p=>{const w=S.mode==='ar'?findCust(p.id):(DB.vendors||[]).find(v=>v.id===p.id);
   const name=ppWhoName(p.id),extra=S.mode==='ar'?((w&&w.type==='company'&&w.name)||''):((w&&w.contact)||''),tel=(w&&w.tel)||'';
   return Object.assign(p,{name,sub:[extra,tel].filter(Boolean).join(' · '),search:(name+' '+extra+' '+tel).toLowerCase()});})
   .sort((a,b)=>b.sum-a.sum||a.name.localeCompare(b.name));   /* the biggest debt first, like the original list */
 }
 const partyName=()=>{const p=S.pl.find(x=>x.id===S.party);return p?p.name:(S.party?ppWhoName(S.party):'');};
 /* newest on top, oldest at the bottom (like the reference) */
 const bills=()=>openBills().filter(x=>x.who===S.party).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
 const findBill=id=>S.docs.find(x=>x.id===id);
 const selList=()=>bills().filter(x=>S.ticks[x.id]);
 const selOut=()=>r2(selList().reduce((a,x)=>a+x.out,0));
 const manSum=()=>r2(selList().reduce((a,x)=>a+num(S.man[x.id]),0));
 const target=()=>S.manual?manSum():selOut();   /* what the payment methods are expected to add up to */

 /* ---------- payment methods: an amount is only what the user typed; only "เต็มจำนวน" and "ยอดที่เหลือ" put a number in.
    โอน holds transfer LINES (one per bank transfer) — its amount is the sum of the lines ---------- */
 const banks=()=>((DB.shop&&DB.shop.banks)||[]).map(b=>typeof bankLabel==='function'?bankLabel(b):[b.name,b.no].filter(Boolean).join(' ')).filter(Boolean);
 const newLine=(amt='')=>({id:'L'+(++LID),bank:'',amt,when:nowText(),ref:''});
 const newRow=k=>k==='trans'?{k,lines:[newLine()]}:{k,amt:'',bank:'',last4:'',appr:'',no:'',date:''};
 const rowAmt=r=>r.k==='trans'?r2(r.lines.reduce((a,x)=>a+num(x.amt),0)):r2(num(r.amt));
 /* DriveGo new system (task 3.5, F3): a card surcharge the customer pays on top (not income; it covers the bank's fee) */
 const cardFee=r=>S&&S.mode==='ar'&&r.k==='card'&&num(r.pct)>0?r2(rowAmt(r)*num(r.pct)/100):0;
 const hasPay=()=>S.rows.length>0;
 const got=()=>r2(S.rows.reduce((a,r)=>a+rowAmt(r),0));
 const tLines=()=>(S.rows.find(r=>r.k==='trans')||{lines:[]}).lines;
 const findLine=id=>tLines().find(x=>x.id===id);
 const slipOf=id=>S.slips.find(x=>x.line===id);
 const bankShort=b=>b?String(b).split(' ')[0]:'ยังไม่เลือกบัญชี';
 const lineLabel=id=>{const ls=tLines(),j=ls.findIndex(x=>x.id===id);if(!id||j<0)return 'ไม่ระบุ';const x=ls[j];return 'โอน '+(j+1)+' · '+bankShort(x.bank)+(num(x.amt)>0?' · '+fm(num(x.amt)):'');};
 const lineTxt=(x,j)=>'โอน '+(j+1)+' · '+(x.bank||'ยังไม่เลือกบัญชี')+' · ฿'+fm(num(x.amt))+' · '+x.when+(x.ref?' · อ้างอิง '+x.ref:'')+' · '+(slipOf(x.id)?'มีสลิป':'ไม่มีสลิป');
 /* same account + same amount + same date-time on two lines → soft warning only */
 function dupIds(){const seen={},d=new Set();tLines().forEach(x=>{if(!x.bank||!(num(x.amt)>0))return;const k=x.bank+'|'+r2(num(x.amt))+'|'+String(x.when).trim();if(seen[k]){d.add(x.id);d.add(seen[k]);}else seen[k]=x.id;});return d;}
 const needTick=()=>say('ติ๊กเลือก'+lb().doc+'ก่อน หรือติ๊ก “เลือกทั้งหมด”');
 function addRow(k){if(S.rows.length>=MAXM){say('แบ่งจ่ายได้สูงสุด 3 วิธี');return false;}
  if(!selList().length){needTick();return false;}
  S.rows.push(newRow(k));return true;}
 function delRow(i){S.rows.splice(i,1);normSlips();}
 function full(k){if(!selList().length)return needTick();const T=String(target());S.rows=[k==='trans'?{k,lines:[newLine(T)]}:Object.assign(newRow(k),{amt:T})];normSlips();}

 /* ---------- cutting the bills ---------- */
 /* spread an amount over the ticked bills, oldest first (bottom of the table upwards) */
 function allocOldest(amt,cap){let left=r2(amt);const o={};selList().slice().reverse().forEach(x=>{const a=r2(Math.max(0,Math.min(cap(x),left)));left=r2(left-a);o[x.id]=a;});return o;}
 /* what the table shows in "ชำระครั้งนี้" */
 function shown(){const o={};
  if(S.manual){selList().forEach(x=>o[x.id]=r2(num(S.man[x.id])));return o;}
  if(!hasPay()){selList().forEach(x=>o[x.id]=x.out);return o;}      /* no money typed yet: plan = pay everything ticked */
  return allocOldest(got(),x=>x.out);}                               /* live: cut by the money really received */
 const manShort=()=>S.manual&&hasPay()&&got()<manSum()-.004;
 /* what will really be saved */
 function plan(){return manShort()?allocOldest(got(),x=>r2(num(S.man[x.id]))):shown();}
 const paidNow=()=>hasPay()?r2(Object.values(plan()).reduce((a,v)=>a+v,0)):0;
 const over=()=>hasPay()?r2(got()-paidNow()):0;
 const after=()=>r2(selOut()-paidNow());
 function counts(){const p=plan();let f=0,pt=0,z=0;selList().forEach(x=>{const a=p[x.id]||0;if(a<=.004)z++;else if(x.out-a<=.004)f++;else pt++;});return {f,pt,z};}
 const stOf=()=>!selList().length?'st-none':!hasPay()?'st-nopay':over()>.004?'st-over':after()<=.004?'st-ok':'st-part';
 const planTxt=(x,a)=>a<=.004?'ไม่ได้ตัดครั้งนี้':x.out-a<=.004?'ตัดครบ':'ตัดบางส่วน ฿'+fm(a)+' · ค้างต่อ ฿'+fm(r2(x.out-a));

 /* ---------- bill selection ---------- */
 function tick(id,on){const x=findBill(id);if(!x)return;if(on){S.ticks[id]=true;if(S.manual)S.man[id]=String(x.out);}else{delete S.ticks[id];delete S.man[id];}}
 function tickAll(){const list=bills(),all=list.length&&list.every(x=>S.ticks[x.id]);
  if(all){S.ticks={};S.man={};S.manual=false;}else list.forEach(x=>{if(!S.ticks[x.id]){S.ticks[x.id]=true;if(S.manual)S.man[x.id]=String(x.out);}});}
 function goManual(){if(S.manual)return;const sh=shown();S.man={};selList().forEach(x=>S.man[x.id]=String(sh[x.id]||0));S.manual=true;}
 function goAuto(){S.manual=false;S.man={};}

 /* ---------- the window: original controls hidden, new body ---------- */
 const body=M.querySelector('.body'),old=document.createElement('div');old.className='pkg-st-old';old.hidden=true;
 while(body.firstChild)old.appendChild(body.firstChild);
 const root=document.createElement('div');root.className='pkg-st';root.id='pkgSt';
 const file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;file.id='pkgStFile';
 body.append(old,root,file);M.classList.add('pkg-st-win');
 const foot=M.querySelector('.sheet>footer');if(foot){foot.classList.add('pkg-st-oldfoot');foot.hidden=true;}
 const h2=$i('ppTitle'),subT=document.createElement('span');subT.className='pkg-st-sub';if(h2)h2.after(subT);

 function partyField(){
  return `<div class="f pkg-st-pbox"><span>${lb().party} <b class="pkg-st-req">*</b></span><input type="text" data-st="pq" autocomplete="off" value="${es(S.open?S.q:partyName())}" placeholder="พิมพ์ชื่อ${lb().party} / เบอร์โทร — หรือคลิกเพื่อเลือก" aria-label="${lb().party}"><i class="pkg-st-car" aria-hidden="true"></i>
  <div class="pkg-st-plist" data-st="plist" ${S.open?'':'hidden'}>${S.open?plistHTML():''}</div></div>`;}
 function plistHTML(){const q=S.q.trim().toLowerCase(),list=S.pl.filter(p=>!q||p.search.includes(q));
  return list.slice(0,40).map((p,i)=>`<button type="button" data-pick="${es(p.id)}" class="${i===S.hi?'hi':''}${p.id===S.party?' cur':''}"><span class="nm"><b>${es(p.name)}</b>${p.sub?`<small>${es(p.sub)}</small>`:''}</span><span class="amt">ค้าง ${p.cnt} ใบ · ฿${fm(p.sum)}</span></button>`).join('')
   +(list.length>40?`<div class="none">…และอีก ${list.length-40} ราย — พิมพ์เพิ่มเพื่อค้นหา</div>`:'')||`<div class="none">ไม่พบ${lb().party}ที่มียอดค้าง</div>`;}
 function billRows(){const list=bills(),today=iso();if(!S.party)return `<tr><td colspan="6" class="pkg-st-empty">เลือก${lb().party}ก่อน</td></tr>`;
  if(!list.length)return `<tr><td colspan="6" class="pkg-st-empty">${es(partyName())} ไม่มี${lb().doc}ค้างชำระแล้ว</td></tr>`;
  return list.map(x=>{const d=daysBetween(x.due,today);const chip=d>0?`<span class="pkg-st-chip late">เกินกำหนด ${d} วัน</span>`:d===0?`<span class="pkg-st-chip today">ครบกำหนดวันนี้</span>`:'';
   const pc=x.paid>0?'<span class="pkg-st-chip part">ชำระบางส่วน</span>':'';
   /* .d-only = table view · .m-only = card view (phones); the checkbox, the input and the "aft" cell are shared */
   return `<tr data-id="${es(x.id)}"><td class="ck"><input type="checkbox" data-tick="${es(x.id)}" aria-label="เลือก ${es(x.no)}"></td>
   <td class="c-doc"><span class="no">${es(x.no)}</span><span class="mchips m-only">${chip}${pc}</span><span class="sub d-only">${thDate(x.date)}</span>${x.inv?`<span class="sub d-only">บิลผู้ขาย ${es(x.inv)}</span>`:''}${x.paid>0?`<span class="pkg-st-chip part d-only">ชำระบางส่วน</span>`:''}
    <span class="sub minfo m-only">วันที่ ${thDate(x.date)} · ครบกำหนด ${thDate(x.due)}${x.inv?' · บิลผู้ขาย '+es(x.inv):''}</span></td>
   <td class="c-due">${thDate(x.due)}${chip?'<br>'+chip:''}</td>
   <td class="r c-out"><b class="d-only">${fm(x.out)}</b>${x.paid>0?`<span class="sub d-only">ยอดบิล ${fm(x.total)}</span><span class="sub d-only">ชำระแล้ว ${fm(x.paid)} (${x.cnt}&nbsp;ครั้ง)</span>`:''}
    <span class="mgrid m-only"><span>ยอดบิล</span><span>${fm(x.total)}</span><span>ชำระแล้ว${x.cnt?` (${x.cnt} ครั้ง)`:''}</span><span>${fm(x.paid)}</span><span>คงค้าง</span><b>${fm(x.out)}</b></span></td>
   <td class="r c-pay"><input type="text" class="pkg-st-bamt" data-bamt="${es(x.id)}" inputmode="decimal" placeholder="—" aria-label="ชำระครั้งนี้ ${es(x.no)}"></td>
   <td class="r aft" data-aft="${es(x.id)}"></td></tr>`;}).join('');}
 function details(i){const r=S.rows[i],p='r.'+i+'.',l=lb();
  const fld=(lab,f,extra='',req=false)=>`<label class="f"><span>${lab}${req?' <b class="pkg-st-req">*</b>':''}</span><input type="text" data-f="${p+f}" value="${es(r[f])}" ${extra}></label>`;
  if(r.k==='card')return `<div class="pkg-st-det">${fld(l.card,'bank','list="cardBankList" placeholder="เช่น กสิกรไทย / KTC / VISA"',true)}<div class="pkg-st-g2">${fld('เลข 4 ตัวท้ายบัตร','last4','maxlength="4" inputmode="numeric" placeholder="เช่น 1234"',true)}${fld('เลขที่อนุมัติ','appr','inputmode="numeric"')}</div>${S.mode==='ar'?`<div class="pkg-st-g2">${fld('ชาร์จเพิ่ม (%)','pct','inputmode="decimal" placeholder="0"')}</div><div class="hint" data-cardfee="${i}"></div>`:''}</div>`;
  if(r.k==='check')return `<div class="pkg-st-det">${fld(l.chk,'bank','list="cardBankList"',true)}<div class="pkg-st-g2">${fld('เลขที่เช็ค','no','inputmode="numeric"',true)}<label class="f"><span>วันที่หน้าเช็ค <b class="pkg-st-req">*</b></span><input type="date" data-f="${p}date" value="${es(r.date)}"></label></div></div>`;
  return '';}
 const mhead=k=>`<span class="mt">${sv(IC[k])}${MI[k][1]}</span>`;
 function rowCard(i){const r=S.rows[i];if(r.k==='trans')return transCard(i);
  return `<div class="pkg-st-row" style="--mc:${MI[r.k][2]}"><div class="rh">${mhead(r.k)}<button type="button" class="btn sm dgr" data-act="del" data-i="${i}" title="เอาวิธีนี้ออก">เอาออก</button></div>
  <div class="af"><span>${lb().amt} (บาท)</span><div class="amtline"><input type="text" class="pkg-st-amtbig" data-f="r.${i}.amt" data-amt="${i}" inputmode="decimal" placeholder="0.00" aria-label="${lb().amt} ${MI[r.k][1]}"><button type="button" class="btn gh pkg-st-rest" data-act="rest" data-i="${i}">ยอดที่เหลือ</button></div></div>
  ${details(i)}</div>`;}
 function transCard(i){const r=S.rows[i],l=lb(),bs=banks();
  const bankF=x=>bs.length?`<select data-lf="bank" data-l="${x.id}"><option value="">กรุณาเลือกบัญชี</option>${bs.map(o=>`<option ${o===x.bank?'selected':''}>${es(o)}</option>`).join('')}${x.bank&&!bs.includes(x.bank)?`<option selected>${es(x.bank)}</option>`:''}</select>`
   :`<input type="text" data-lf="bank" data-l="${x.id}" value="${es(x.bank)}" placeholder="พิมพ์ชื่อธนาคาร / เลขที่บัญชี">`;
  return `<div class="pkg-st-row" style="--mc:${MI.trans[2]}"><div class="rh">${mhead('trans')}<span class="tsum" data-out="tsum"></span><button type="button" class="btn sm dgr" data-act="del" data-i="${i}" title="เอาวิธีนี้ออก">เอาออก</button></div>
  ${r.lines.map((x,j)=>{const sp=slipOf(x.id);return `<div class="pkg-st-tl" data-line="${x.id}"><div class="tlh"><span class="tno">โอน ${j+1}</span><span class="dupw" data-dup="${x.id}" hidden>${sv(IC.warn)}รายการซ้ำกันหรือเปล่า?</span><span class="sp"></span>${r.lines.length>1?`<button type="button" class="btn sm dgr" data-act="delline" data-l="${x.id}" title="เอารายการโอนนี้ออก">เอาออก</button>`:''}</div>
   <label class="f"><span>${l.trans} <b class="pkg-st-req">*</b></span>${bankF(x)}</label>
   <div class="af"><span>จำนวนเงินที่โอน (บาท) <b class="pkg-st-req">*</b></span><div class="amtline"><input type="text" class="pkg-st-amtbig" data-lf="amt" data-l="${x.id}" data-lamt="${x.id}" inputmode="decimal" placeholder="0.00" aria-label="จำนวนเงินที่โอน รายการที่ ${j+1}"><button type="button" class="btn gh pkg-st-rest" data-act="restline" data-l="${x.id}">ยอดที่เหลือ</button></div></div>
   <div class="pkg-st-g2"><div class="f"><span>วันที่ / เวลาโอน <b class="pkg-st-req">*</b> <button type="button" class="pkg-st-link sm" data-act="nowline" data-l="${x.id}">ตอนนี้</button></span><input type="text" data-lf="when" data-l="${x.id}" value="${es(x.when)}" aria-label="วันที่ / เวลาโอน รายการที่ ${j+1}"></div><label class="f"><span>เลขอ้างอิง / เลขที่สลิป</span><input type="text" data-lf="ref" data-l="${x.id}" value="${es(x.ref)}"></label></div>
   <div class="tls">${sp?`<button type="button" class="lth" data-act="lineview" data-l="${x.id}" title="ดูสลิปเต็มจอ"><img src="${sp.url}" alt="สลิปของ โอน ${j+1}"></button><span class="nm">${sv(IC.clip)}${es(sp.name)}</span><button type="button" class="btn sm gh" data-act="lineslip" data-l="${x.id}">เปลี่ยน</button><button type="button" class="btn sm dgr" data-act="lineunslip" data-l="${x.id}">เอาออก</button>`
    :`<span class="hint noslip">ยังไม่แนบสลิป</span><button type="button" class="btn sm gh" data-act="lineslip" data-l="${x.id}">${sv(IC.clip)}แนบสลิป</button>`}</div></div>`;}).join('')}
  <button type="button" class="pkg-st-add" data-act="addline">+ เพิ่มรายการโอน (อีกบัญชี / อีกครั้ง)</button></div>`;}
 function slipHTML(){const k=S.slips.length,tl=tLines();
  if(!k)return `<div class="pkg-st-up" data-drop data-act="pickfile" role="button" tabindex="0" aria-label="แนบรูปสลิป">${sv(IC.up,'big')}
   <b>แตะเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางตรงนี้</b><span class="hint">${lb().slip}</span><span class="hint">${tl.length?'แนบได้หลายรูป — สลิปโอน 1 รูปต่อ 1 รายการโอน (ระบบผูกกับรายการโอนที่ยังไม่มีสลิปให้ก่อน เปลี่ยนได้ใต้รูป) + อื่น ๆ อีก '+MAXFREE+' รูป':'แนบได้หลายรูป · สลิปโอนแนบที่แต่ละรายการโอนได้เลย'} · ไม่บังคับ</span><span class="pick">เลือกรูป</span></div>`;
  const ix=Math.min(S.slipIx,k-1),c=S.slips[ix];
  return `<div class="pkg-st-slipbox" data-drop><button type="button" class="pv" data-act="viewslip" title="แตะเพื่อดูเต็มจอ"><img src="${c.url}" alt="สลิปที่แนบ รูปที่ ${ix+1}"><span class="pvlbl" data-slbl="${ix}"></span><span class="zoom">${sv(IC.zoom)}ดูเต็มจอ</span></button>
   ${tl.length?`<div class="owner"><span>สลิปนี้เป็นของ</span>${tl.map((x,j)=>`<button type="button" class="chipb${c.line===x.id?' on':''}" data-act="own" data-l="${x.id}">โอน ${j+1}</button>`).join('')}<button type="button" class="chipb${c.line?'':' on'}" data-act="own" data-l="">ไม่ระบุ</button></div>`:''}
   <div class="thumbs">${S.slips.map((x,i)=>`<button type="button" class="thb${i===ix?' on':''}" data-act="slipix" data-i="${i}" title="รูปที่ ${i+1}"><img src="${x.url}" alt="รูปที่ ${i+1}"><small data-slbl="${i}"></small></button>`).join('')}${canAddSlip()?'<button type="button" class="thb add" data-act="addslip" title="แนบรูปเพิ่ม">+<small>เพิ่มรูป</small></button>':''}</div>
   <div class="sinfo"><span class="nm">${sv(IC.clip)}${es(c.name)}</span><span class="hint">${(c.kb||0).toLocaleString('en-US')} KB · รูปที่ ${ix+1} / ${k} · เก็บไว้กับการชำระครั้งนี้</span></div>
   <div class="sbtn"><button type="button" class="btn sm gh" data-act="viewslip">ดูเต็มจอ</button><button type="button" class="btn sm gh" data-act="repslip">เปลี่ยนรูป</button><button type="button" class="btn sm dgr" data-act="unslip">เอารูปออก</button></div></div>`;}
 function resultHTML(){const r=S.result;if(!r)return '';return `<div class="pkg-st-res"><button type="button" class="x" data-act="hideres" title="ซ่อนข้อความนี้" aria-label="ซ่อนข้อความนี้">✕</button>
  <div class="t">${sv(IC.ok)}บันทึกแล้ว · ตัดยอด ${r.cnt} ใบ · คงค้างเหลือ ฿${fm(r.left)}</div>
  <div class="d">${es(r.party)} · ${r.verb} ฿${fm(r.amt)} (${es(r.meth)}) · วันที่ ${thDate(r.date)} · โดย ${es(r.by||'-')}</div>${r.pvNo&&window.PKG_PV?window.PKG_PV.resultLine(r.pvNo):''}
  ${r.tl.map(t=>`<div class="d">${sv(IC.trans)}${es(t)}</div>`).join('')}<div class="d">${es(r.lines)}</div></div>`;}
 function branchField(){const b=Br();if(!b)return '';const acc=b.accessible();if(!acc.length)return '';
  return `<label class="f"><span>สาขา</span><select data-st="branch">${acc.map(x=>`<option value="${es(x.id)}"${x.id===S.branch?' selected':''}>${es(x.code+' · '+x.name)}</option>`).join('')}${acc.length>1?`<option value="all"${S.branch==='all'?' selected':''}>ทุกสาขา</option>`:''}</select></label>`;}
 function render(){if(!S)return;const l=lb(),tb=root.querySelector('.pkg-st-tbox'),sc=tb?tb.scrollTop:0,orc=root.querySelector('.pkg-st-rcs'),rsc=orc?orc.scrollTop:0,bf=branchField();
  subT.textContent=l.sub;
  root.innerHTML=`<div class="pkg-st-cols"><div class="pkg-st-lc">
   <div class="${bf?'pkg-st-g12':'pkg-st-g1'}">${bf}${partyField()}</div>
   <div class="pkg-st-g2"><label class="f"><span>วันที่ชำระ <b class="pkg-st-req">*</b></span><input type="date" data-st="date" value="${es(S.date)}"></label>
    <label class="f"><span>ผู้บันทึก</span><input type="text" data-st="by" value="${es(S.by)}"></label></div>
   <div class="pkg-st-obox"><span>ยอดเงินที่ค้างชำระ (ตามบิลที่เลือก)</span><b><span data-out="selout"></span><small>บาท</small></b></div>
   <div class="pkg-st-oline"><span>ค้างทั้งหมดของ${l.party}รายนี้ <b data-out="allsum"></b> (<span data-out="allcnt"></span> ใบ) → หลังชำระครั้งนี้เหลือ <b data-out="allafter"></b></span><span>· เลือก <b data-out="selcnt"></b> ใบ</span><span class="sp"></span>
    <button type="button" class="btn sm gh d-clear" data-act="clear">ล้างที่เลือก</button>${PV()?PV().whtButton(S):''}</div>
   ${resultHTML()}
   <div class="pkg-st-manline" data-st="manline" hidden><span>${sv(IC.pen)}กำหนดยอดรายใบเอง</span><button type="button" class="pkg-st-link" data-act="automode">กลับไปตัดอัตโนมัติ (ใบเก่าก่อน)</button></div>
   <div class="pkg-st-selbar m-only"><label><input type="checkbox" data-st="all2" aria-label="เลือกทั้งหมด"><span>เลือกทั้งหมด (<span data-out="allcnt"></span> ใบ)</span></label><button type="button" class="btn sm gh" data-act="clear">ล้างที่เลือก</button></div>
   <div class="pkg-st-mhint m-only">ระบบตัดจากใบเก่าที่สุด (ล่างสุด) ขึ้นมา</div>
   <div class="pkg-st-tbox"><table class="pkg-st-tbl"><thead><tr><th class="ck"><input type="checkbox" data-st="all" aria-label="เลือกทั้งหมด"></th><th>${l.doc}</th><th>ครบกำหนด</th><th class="r">คงค้าง</th><th class="r">ชำระครั้งนี้</th><th class="r">เหลือ<wbr>หลังชำระ</th></tr></thead>
   <tbody>${billRows()}</tbody></table></div>${S.mode==='ar'&&window.PKG_SALE_PAY&&PKG_SALE_PAY.settleExtra?PKG_SALE_PAY.settleExtra(S,selList(),'wht'):''}${PV()?PV().settleExtra(S,selList()):''}
   <div class="hint pkg-st-foothint">ระบบตัดจากใบเก่าที่สุด (ล่างสุด) ขึ้นมา · แตะแถวเพื่อติ๊ก · อยากกำหนดยอดรายใบเอง แก้ช่อง “ชำระครั้งนี้” ได้ (ไม่เกินยอดคงค้าง)</div>
  </div>
  <div class="pkg-st-rc"><div class="pkg-st-rcs">
   <div class="pkg-st-sec">แนบสลิป / รูปหลักฐานการ${l.recv}เงิน</div>${slipHTML()}
   <div class="pkg-st-sec">วิธีการชำระเงิน</div>
   <div class="pkg-st-sub3" data-st="r2sum"><div class="ln"><span>ยอดค้างของบิลที่เลือก <small data-out="totcnt"></small></span><b data-out="selout2"></b></div>
    <div class="ln"><span>− ${l.recv}ครั้งนี้</span><b data-out="got"></b></div>
    <div class="ln big"><span><span data-out="duelbl"></span><small class="dsub" data-out="duesub"></small></span><b class="dueC" data-out="due"></b></div></div>
   <button type="button" class="btn pri pkg-st-shortbtn" data-act="short" data-st="shortbtn" hidden></button><div class="pkg-st-shortnote" data-st="shortnote" hidden></div>
   <div class="pkg-st-quick"><button type="button" class="btn grn" data-act="full" data-k="cash">${sv(IC.cash)}เงินสดเต็มจำนวน</button><button type="button" class="btn grn" data-act="full" data-k="trans">${sv(IC.trans)}โอนเต็มจำนวน</button></div>
   <div class="pkg-st-mhd">${l.hint}</div>
   <div class="pkg-st-tiles" role="group" aria-label="วิธีการชำระเงิน">${METH.map(([k,t,c])=>`<button type="button" class="pkg-st-tile" style="--mc:${c}" data-act="tile" data-k="${k}">${sv(IC[k],'ti')}<b>${t}</b><small data-tile="${k}"></small></button>`).join('')}</div>
   ${S.rows.map((_,i)=>rowCard(i)).join('')}
   <label class="f"><span>หมายเหตุ</span><textarea data-st="note" placeholder="เช่น ชำระงวดที่ 2 / ลูกค้าขอแบ่งจ่าย">${es(S.note)}</textarea></label>
  </div>
  ${S.mode==='ar'&&window.PKG_SALE_PAY&&PKG_SALE_PAY.settleExtra?PKG_SALE_PAY.settleExtra(S,selList(),'share'):''}<div class="pkg-st-savebar"><div class="s" data-out="savesum"></div><button type="button" class="btn pri ${S.mode==='ar'?'pc-payRec':'pc-payGr'}" data-act="save">${l.save}</button></div>
  </div></div>`;
  const nb=root.querySelector('.pkg-st-tbox');if(nb)nb.scrollTop=sc;const nr=root.querySelector('.pkg-st-rcs');if(nr)nr.scrollTop=rsc;refresh();}
 const q1=sel=>root.querySelector(sel);
 /* live update without rebuilding inputs (keeps focus while typing) */
 function refresh(){if(!S||!root.firstChild)return;const l=lb(),list=bills(),sl=selList(),sh=shown(),state=stOf(),act=document.activeElement;
  const set=(o,v)=>root.querySelectorAll(`[data-out="${o}"]`).forEach(x=>{if(x.textContent!==String(v))x.textContent=v;});
  const allSum=r2(list.reduce((a,x)=>a+x.out,0)),so=selOut(),g=got(),pn=paidNow(),af=after(),ov=over(),c=counts();
  set('selout',fm(so));set('allcnt',list.length);set('allsum','฿'+fm(allSum));set('allafter','฿'+fm(r2(allSum-pn)));set('selcnt',sl.length);
  set('selout2',fm(so));set('totcnt',sl.length?'('+sl.length+' ใบ)':'');set('got',hasPay()?fm(g):'—');
  q1('[data-st="r2sum"]').className='pkg-st-sub3 '+state;
  const zero=hasPay()&&g<=.004,zeroTxt='ยังไม่ได้ใส่จำนวนเงินที่'+l.recv;
  const cntTxt=zero?zeroTxt+' — พิมพ์ในช่องด้านล่าง หรือกด “เต็มจำนวน”':'ตัดครบ '+c.f+' ใบ · บางส่วน '+c.pt+' ใบ'+(c.z?' · '+(S.manual?'ไม่ได้ตัด ':'ยังไม่ถึง ')+c.z+' ใบ':'');
  if(state==='st-over'){set('duelbl',l.recv+'เกิน'+(S.manual?'ยอดรายใบที่กำหนด':'บิลที่เลือก'));set('due',fm(ov));set('duesub',(S.manual?'เพิ่มยอดรายใบ ':'')+'ติ๊กบิลเพิ่ม หรือลดยอดเงินลง (ยังบันทึกไม่ได้)');}
  else{set('duelbl','= คงค้างหลังชำระครั้งนี้');set('due',state==='st-none'||state==='st-nopay'?'—':fm(af));
   set('duesub',state==='st-none'?'ยังไม่ได้เลือกบิล — ติ๊กบิลด้านซ้ายก่อน':state==='st-nopay'?'แตะวิธีจ่ายด้านล่าง แล้วพิมพ์'+l.amt:state==='st-ok'?'ตัดครบทุกใบที่เลือก':cntTxt);}
  /* manual mode: money typed is less than the per-bill amounts the user set */
  const ms=manShort(),sb=q1('[data-st="shortbtn"]'),sn=q1('[data-st="shortnote"]');sb.hidden=!ms;sn.hidden=!ms;q1('[data-st="manline"]').hidden=!S.manual;
  if(ms){sb.textContent='ตัดตามยอดที่'+l.recv+'จริง ฿'+fm(g)+' (ใบเก่าก่อน)';sn.textContent=l.recv+'มา ฿'+fm(g)+' น้อยกว่ายอดรายใบที่กำหนดไว้ ฿'+fm(manSum())+' — กดปุ่มนี้ให้ระบบตัดจากใบเก่าก่อน หรือกดบันทึกได้เลย';}
  /* save bar */
  const ss=q1('[data-out="savesum"]'),html=state==='st-none'?'ยังไม่ได้เลือกบิล':state==='st-nopay'?`เลือก ${sl.length} ใบ <b>฿${fm(so)}</b><br>ยังไม่ได้ใส่เงินที่${l.recv}`:
   zero?`เลือก ${sl.length} ใบ <b>฿${fm(so)}</b><br><span class="amb">${zeroTxt}</span>`:
   state==='st-over'?`${l.verb} <b>฿${fm(g)}</b><br><span class="red">${l.recv}เกิน ฿${fm(ov)}</span>`:
   `${l.verb} <b>฿${fm(g)}</b> · ตัดครบ ${c.f} ใบ · บางส่วน ${c.pt} ใบ<br>คงค้างหลังชำระ <b class="${af<=.004?'grn':'amb'}">฿${fm(af)}</b>`;
  if(ss.__h!==html){ss.innerHTML=html;ss.__h=html;}
  /* bill rows */
  root.querySelectorAll('tr[data-id]').forEach(tr=>{const id=tr.dataset.id,x=findBill(id);if(!x)return;const on=!!S.ticks[id],a=on?(sh[id]||0):0,rest=r2(x.out-a);
   const z=on&&a<=.004,part=on&&a>.004&&rest>.004;
   tr.classList.toggle('on',on&&!z);tr.classList.toggle('part',part);tr.classList.toggle('wait',z);
   tr.querySelector('[data-tick]').checked=on;const inp=tr.querySelector('[data-bamt]');if(inp!==act){const v=on?fm(a):'';if(inp.value!==v)inp.value=v;}
   const cell=tr.querySelector('[data-aft]'),h=!on?'<span class="hint">—</span>':z?`<b class="gry">${fm(rest)}</b><span class="sub">${S.manual?'ไม่ได้ตัด':'ยังไม่ถึง'}</span>`:part?`<b class="amb">${fm(rest)}</b><span class="sub">ตัดบางส่วน</span>`:`<b class="ok">${sv(IC.ok)}ครบ</b>`;
   if(cell.__h!==h){cell.innerHTML=h;cell.__h=h;}});
  ['all','all2'].forEach(k=>{const a=q1(`[data-st="${k}"]`);if(!a)return;const n=sl.length;a.checked=list.length>0&&n===list.length;a.indeterminate=n>0&&n<list.length;a.disabled=!list.length;});
  /* DriveGo new system (task 3.5, F3): what a card surcharge comes to */
  S.rows.forEach((r,i)=>{const el=q1(`[data-cardfee="${i}"]`);if(!el)return;const f=cardFee(r),t=f>0?'ค่าธรรมเนียม '+money(f)+' บาท · ยอดที่ต้องรูดรวม '+money(r2(rowAmt(r)+f))+' บาท':'';if(el.textContent!==t)el.textContent=t;});
  /* tiles */
  METH.forEach(([k])=>{const btn=q1(`[data-act="tile"][data-k="${k}"]`),r=S.rows.find(x=>x.k===k);btn.classList.toggle('on',!!r);btn.setAttribute('aria-pressed',String(!!r));btn.disabled=!r&&S.rows.length>=MAXM;
   const cap=q1(`[data-tile="${k}"]`),a=r?rowAmt(r):0,h=!r?(S.rows.length>=MAXM?'ครบ 3 วิธี':'แตะเพื่อเพิ่ม'):a>0?fm(a)+(k==='trans'&&r.lines.length>1?'<br>'+r.lines.length+' รายการ':''):'ยังไม่ใส่ยอด';
   if(cap.__h!==h){cap.innerHTML=h;cap.__h=h;}cap.classList.toggle('z',!!r&&!(a>0));});
  /* payment amounts */
  root.querySelectorAll('[data-amt]').forEach(x=>{const r=S.rows[+x.dataset.amt];if(r&&x!==act){const v=num(r.amt)>0?fm(num(r.amt)):'';if(x.value!==v)x.value=v;}});
  /* transfer lines: sum, per-line amount, soft duplicate warning, slip labels */
  const tl=tLines(),dup=dupIds();set('tsum','รวมโอน ฿'+fm(r2(tl.reduce((a,x)=>a+num(x.amt),0)))+' ('+tl.length+' รายการ)');
  root.querySelectorAll('[data-lamt]').forEach(x=>{const ln=findLine(x.dataset.lamt);if(ln&&x!==act){const v=num(ln.amt)>0?fm(num(ln.amt)):'';if(x.value!==v)x.value=v;}});
  root.querySelectorAll('[data-dup]').forEach(x=>{x.hidden=!dup.has(x.dataset.dup);});
  root.querySelectorAll('[data-slbl]').forEach(x=>{const sp=S.slips[+x.dataset.slbl];x.textContent=sp?lineLabel(sp.line):'';});}

 /* ---------- save ---------- */
 const mayPay=()=>{if(S.mode==='ar'&&!can('doc.payRec')){say('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');return false;}if(S.mode==='ap'&&!can('doc.payGr')){say('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');return false;}return true;};
 function validate(){const l=lb();if(!S.party)return S.mode==='ar'?'พิมพ์ค้นหาและเลือกลูกค้าก่อน':'พิมพ์ค้นหาและเลือกผู้ขายก่อน';if(!S.date)return 'ใส่วันที่ชำระ';
  if(!selList().length)return 'ติ๊กเลือก'+l.doc+'อย่างน้อย 1 ใบ หรือติ๊ก “เลือกทั้งหมด”';
  if(!S.rows.length)return 'แตะวิธีชำระก่อน (เงินสด / โอน / บัตร / เช็ค) แล้วพิมพ์'+l.amt;
  if(!(got()>0))return 'ยังไม่ได้ใส่จำนวนเงินที่'+l.recv+' — พิมพ์'+l.amt+' หรือกด “เต็มจำนวน”';
  if(over()>.004)return l.recv+'เกิน'+(S.manual?'ยอดรายใบที่กำหนด':'บิลที่เลือก')+' ฿'+fm(over())+' — '+(S.manual?'เพิ่มยอดรายใบ ':'')+'ติ๊กบิลเพิ่ม หรือลดยอดเงินลง';
  for(const r of S.rows){const p=MI[r.k][1]+': ';
   if(r.k==='trans'){for(const [j,x] of r.lines.entries()){const q='โอน รายการที่ '+(j+1)+': ';if(!String(x.bank).trim())return q+'ยังไม่ได้เลือกบัญชี';if(!(num(x.amt)>0))return q+'ยังไม่ได้ใส่จำนวนเงิน'+(r.lines.length>1?' — พิมพ์ยอด หรือกด “เอาออก” ที่รายการนี้':'');if(!String(x.when).trim())return q+'ใส่วันที่ / เวลาโอน';}continue;}
   if(!(num(r.amt)>0))return p+'ยังไม่ได้ใส่จำนวนเงิน — พิมพ์ยอด หรือแตะปุ่ม '+MI[r.k][1]+' อีกครั้งเพื่อเอาวิธีนี้ออก';
   if(r.k==='card'&&!String(r.bank).trim())return p+'กรอกธนาคาร / ผู้ให้บริการบัตรก่อน';if(r.k==='card'&&!/^\d{4}$/.test(String(r.last4).trim()))return p+'ใส่เลข 4 ตัวท้ายบัตร';
   if(r.k==='check'&&(!String(r.bank).trim()||!String(r.no).trim()||!r.date))return p+'ใส่ธนาคาร เลขที่เช็ค และวันที่หน้าเช็คให้ครบ';}
  if(!(paidNow()>0))return 'ยังไม่มียอดที่จะตัด';return '';}
 /* the card before saving: what will be cut bill by bill (paying less than the ticked bills is normal) */
 const cfm=document.createElement('div');cfm.className='pkg-st-cfm';cfm.id='pkgStCfm';cfm.hidden=true;host.append(cfm);
 function showConfirm(){const l=lb(),p=plan(),g=got(),list=selList().slice().reverse(),af=after(),tl=tLines();
  cfm.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="ตรวจก่อนบันทึก"><h3>ตรวจก่อนบันทึก · ${l.verb} ฿${fm(g)}</h3>
  <div class="who">${es(partyName())} · วันที่ ${thDate(S.date)} · ${es(S.rows.map(r=>MI[r.k][1]+' '+fm(rowAmt(r))).join(' + '))}</div>
  <div class="sum"><div><span>ยอดค้างของบิลที่เลือก ${list.length} ใบ</span><b>${fm(selOut())}</b></div><div><span>− ${l.recv}ครั้งนี้</span><b>${fm(g)}</b></div><div class="${af<=.004?'ok':'amb'}"><span>= คงค้างหลังชำระ</span><b>${fm(af)}</b></div></div>${PV()?PV().confirmLine(S,list):''}
  ${S.rows.map(r=>cardFee(r)).some(f=>f>0)?`<div class="ex">${S.rows.filter(r=>cardFee(r)>0).map(r=>'ค่าธรรมเนียมบัตร '+num(r.pct)+'% ฿'+fm(cardFee(r))+' — ยอดที่ต้องรูดรวม ฿'+fm(r2(rowAmt(r)+cardFee(r)))).join(' · ')}</div>`:''}
  ${af>.004?`<div class="ex">เงิน ฿${fm(g)} ตัด<b>จากใบเก่าที่สุดก่อน</b> · ใบที่เงินไม่พอ<b>ตัดบางส่วน</b> ที่เหลือค้างต่อไว้รอ${l.verb}ครั้งหน้า · ใบที่เงินไปไม่ถึงยังค้างเท่าเดิม ไม่ถูกแตะ</div>`:''}
  ${tl.length?`<div class="tlist"><b>รายการโอน ${tl.length} รายการ</b>${tl.map((x,j)=>`<span>${es(lineTxt(x,j))}</span>`).join('')}</div>`:''}
  <div class="pl">${list.map((x,i)=>{const a=p[x.id]||0,t=planTxt(x,a);return `<div><i>${i+1}</i><span><b>${es(x.no)}</b> <i>${thDate(x.date)}</i></span><span class="${a<=.004?'no0':x.out-a<=.004?'ok':'pt'}">${t==='ตัดครบ'?sv(IC.ok):''}${t}</span></div>`;}).join('')}</div>
  <div class="bt"><button type="button" class="btn gh" data-cfm="back">กลับไปแก้</button><button type="button" class="btn grn" data-cfm="go">${l.cfm} ฿${fm(g)}</button></div></div>`;
  cfm.hidden=false;const go=cfm.querySelector('[data-cfm="go"]');if(go)go.focus();}
 cfm.addEventListener('click',e=>{const b=e.target.closest('[data-cfm]');if(b){cfm.hidden=true;if(b.dataset.cfm==='go')doSave();return;}if(e.target===cfm)cfm.hidden=true;});
 /* DriveGo new system (task 3.5, R8-ข): the money of each method spread over the bills it pays — bills oldest first, methods (and
    transfer lines) in the order entered — so each bill's payment holds only its own share and a report by method counts the money
    once (the legacy app copied the whole settlement onto every bill); payTotal / payBills still tell the settlement's total. A card
    surcharge goes with the card money it was charged on. */
 function split(amts,methods,lines){
  const left=methods.map(m=>r2(m.amt)),feeLeft=methods.map(m=>r2(num(m.fee))),lleft=lines.map(l=>r2(l.amt));
  return amts.map(a=>{let need=r2(a);const ms=[],ls=[];
   methods.forEach((m,i)=>{const take=r2(Math.min(left[i],need));if(!(take>0.004))return;left[i]=r2(left[i]-take);need=r2(need-take);const o=Object.assign({},m,{amt:take});
    if(m.k==='trans'){let t=take,cnt=0;lines.forEach((l,j)=>{const tk=r2(Math.min(lleft[j],t));if(!(tk>0.004))return;lleft[j]=r2(lleft[j]-tk);t=r2(t-tk);ls.push(Object.assign({},l,{amt:tk}));cnt++;});o.lines=cnt;}
    if(feeLeft[i]>0){const f=left[i]<=0.004?feeLeft[i]:r2(num(m.fee)*take/num(m.amt));o.fee=f;feeLeft[i]=r2(feeLeft[i]-f);}
    ms.push(o);});
   return {methods:ms,transLines:ls};});
 }
 /* the one-method fields of a payment: its largest method (first wins a tie) */
 function mainOf(ms,ls){const m=ms.reduce((a,x)=>!a||x.amt>a.amt+.004?x:a,null)||{k:''},big=ls.reduce((a,x)=>!a||x.amt>a.amt+.004?x:a,null);
  return {method:m.k,bank:m.k==='trans'?(big?big.bank:''):(m.bank||''),ref:m.k==='trans'?(big?big.ref:''):(m.ref||''),card4:m.k==='card'?(m.card4||''):'',chkDate:m.k==='check'?(m.chkDate||''):''};}
 function trySave(){if(!mayPay())return;const er=validate();if(er)return say(er);showConfirm();}
 function doSave(){
  if(!S||!mayPay())return;const er=validate();if(er)return say(er);
  const mode=S.mode,l=lb(),p=plan(),g=got(),done=selList().slice().reverse().filter(x=>(p[x.id]||0)>.004);if(!done.length)return;
  const date=S.date||iso(),by=String(S.by||'').trim(),note=String(S.note||'').trim(),tl=tLines(),payId='ST'+uid(),b=Br();
  const methods=S.rows.map(r=>{const amt=rowAmt(r);
   if(r.k==='trans')return {k:'trans',amt,lines:tl.length};
   if(r.k==='card'){const o={k:'card',amt,bank:String(r.bank).trim(),card4:String(r.last4).trim(),ref:String(r.appr).trim()};if(cardFee(r)>0){o.pct=num(r.pct);o.fee=cardFee(r);}return o;}
   if(r.k==='check')return {k:'check',amt,bank:String(r.bank).trim(),ref:String(r.no).trim(),chkDate:r.date||''};
   return {k:'cash',amt};});
  const transLines=tl.map((x,j)=>({no:j+1,bank:String(x.bank).trim(),amt:r2(num(x.amt)),when:String(x.when).trim(),ref:String(x.ref).trim(),slip:!!slipOf(x.id)}));
  const slips=S.slips.map(x=>({url:x.url,name:x.name,line:x.line?tl.findIndex(t=>t.id===x.line)+1:0}));
  if(slips.length){DB.paySlips=DB.paySlips||{};DB.paySlips[payId]=slips;}
  /* the original one-method fields: the method with the largest share (first wins a tie) */
  const main=methods.reduce((a,x)=>x.amt>a.amt+.004?x:a,methods[0]),mm=main.k,bigT=transLines.reduce((a,x)=>!a||x.amt>a.amt+.004?x:a,null);
  const base={date,method:mm,by,note,bank:mm==='trans'?bigT.bank:(main.bank||''),ref:mm==='trans'?bigT.ref:(main.ref||''),card4:mm==='card'?main.card4:'',chkDate:mm==='check'?main.chkDate:''};
  const mtxt=methods.map(x=>mlabel(x.k)).join(' + '),br=b?(S.branch&&S.branch!=='all'?S.branch:b.ctx()):'';
  const lines=[],SF=mode==='ar'&&window.PKG_SALE&&PKG_SALE.on()&&window.PKG_SALE_PAY&&PKG_SALE_PAY.settleFields?PKG_SALE_PAY:null;
  const pv=PV(),pvNo=pv?pv.newNo():'';   /* DriveGo new system (task 3.4): one payment voucher for the whole settlement */
  const shares=split(done.map(x=>r2(p[x.id])),methods,transLines),logs=[];
  done.forEach((x,bi)=>{const d=x.d,amt=r2(p[x.id]),sh=shares[bi],bb=Object.assign({},base,mainOf(sh.methods,sh.transLines)),mt=sh.methods.map(m=>mlabel(m.k)).join(' + ');
   d.payments=d.payments||[];
   const pay=Object.assign({id:uid(),amt},bb,{payId,payTotal:g,payBills:done.length,methods:sh.methods,transLines:sh.transLines,slipCount:slips.length,br},SF&&d.pkgSale?SF.settleFields(S,x,done):null,pv?pv.settleFields(S,x,pvNo):null);
   d.payments.push(pay);
   const rem=x.total-paidAmtOf(d)-whtOf(x.id);   /* a vendor's withholding is in paidAmtOf already (58-payment-voucher.js) */
   if(rem<=0.005){
    d.paid=true;
    if(mode==='ar'){d.paidDate=date;}
    else{d.payDate=date;d.payMethod=bb.method;d.payBank=bb.bank;d.payRef=bb.ref;d.payCard4=bb.card4;d.chkDate=bb.chkDate;d.payBy=by;d.payNote=note;}
   }
   const head=(mode==='ar'?'รับชำระ ':'จ่ายเจ้าหนี้ ')+money(amt)+' บาท ('+mt+')'+(whtOf(x.id)>0?' · ลูกค้าหัก ณ ที่จ่าย '+money(whtOf(x.id))+' บาท':'')   /* DriveGo new system (task 3.4, finding 4) */
    +(whtAp(x.id)>0?' · หัก ณ ที่จ่าย '+money(whtAp(x.id))+' บาท':'')+(pvNo?' · ใบสำคัญจ่าย '+pvNo:''),tail=rem<=0.005?' · ชำระครบแล้ว':' · คงค้าง '+money(Math.max(0,rem))+' บาท';
   logAudit(mode==='ar'?(SF&&d.pkgSale&&PKG_SALE.saleOf(d)?'stockcut':'receipt'):'gr',(SF&&d.pkgSale&&PKG_SALE.saleOf(d))||d,'pay',head+tail);
   logs.push({e:DB.audit[DB.audit.length-1],head,tail,pay});
   lines.push(x.no+(rem<=0.005?' ครบ':' ชำระบางส่วน · ค้างต่อ ฿'+fm(Math.max(0,r2(rem)))));
  });
  if(mode==='ar'&&window.PKG_SALE&&PKG_SALE.on())PKG_SALE.afterPay(done.map(x=>x.d));   /* sale-flow.js: receipt number + derived paid for a sale's ledger record */
  logs.forEach(z=>{if(z.e&&z.pay.reNo)z.e.note=z.head+' · ใบเสร็จ '+z.pay.reNo+z.tail;});   /* DriveGo new system (task 3.5, R2): the receipt, as the sale window writes it */
  save();
  const res={cnt:done.length,amt:g,party:partyName(),date,by,verb:l.verb,payId,pvNo,
   meth:S.rows.map(r=>MI[r.k][1]+' '+fm(rowAmt(r))+(r.k==='trans'&&r.lines.length>1?' ['+r.lines.length+' รายการ]':'')).join(' + '),
   tl:tl.map(lineTxt),lines:lines.join(' · ')+(slips.length?' · แนบสลิป '+slips.length+' รูป':'')};
  clearSel();S.wht={};S.note='';S.slips=[];S.slipIx=0;reload();
  res.left=r2(bills().reduce((a,x)=>a+x.out,0));S.result=res;render();
  const rf=fn=>{try{if(typeof fn==='function')fn();}catch(e){}};
  rf(window.renderHome||(typeof renderHome==='function'&&renderHome));
  if(mode==='ap')rf(typeof renderGRList==='function'&&renderGRList);
  if(mode==='ar')rf(typeof renderDocOverview==='function'&&renderDocOverview);
  if(typeof acctPane!=='undefined'){if(acctPane==='ar')rf(typeof renderAcctAR==='function'&&renderAcctAR);if(acctPane==='ap')rf(typeof renderAcctAP==='function'&&renderAcctAP);}
  try{if(typeof ppFillBills==='function')ppFillBills();}catch(e){}
  say('บันทึกชำระ '+done.length+' ใบ รวม '+money(g)+' บาทแล้ว');
  const top=root.querySelector('.pkg-st-res');if(top&&top.scrollIntoView)top.scrollIntoView({block:'nearest'});
 }

 /* ---------- slip pictures — each belongs to one transfer line, or to "ไม่ระบุ" (cash / cheque / card slips).
    Limit: 1 per transfer line + MAXFREE unassigned. Downscaled like the other slips (≤1100px, jpeg .78). ---------- */
 let fileMode='add',fileLine=null;
 const freeCount=()=>S.slips.filter(x=>!x.line).length;
 const firstFreeLine=()=>(tLines().find(x=>!slipOf(x.id))||{}).id||null;
 const canAddSlip=()=>!!firstFreeLine()||freeCount()<MAXFREE;
 /* after transfer lines change: a slip whose line is gone moves to "ไม่ระบุ" (kept while there is room) */
 function normSlips(){const ids=new Set(tLines().map(x=>x.id));let moved=0,drop=0,f=0;S.slips.forEach(x=>{if(x.line&&!ids.has(x.line)){x.line=null;moved++;}});
  S.slips=S.slips.filter(x=>{if(x.line)return true;f++;if(f>MAXFREE){drop++;return false;}return true;});S.slipIx=Math.max(0,Math.min(S.slipIx,S.slips.length-1));
  if(drop)say('สลิปที่ไม่ผูกกับรายการโอนเก็บได้ '+MAXFREE+' รูป — เอาออก '+drop+' รูป');else if(moved)say('สลิปของรายการโอนที่เอาออก '+moved+' รูป ย้ายไปอยู่ “ไม่ระบุ” (ยังไม่หาย)');}
 const shrink=(f,max,q)=>new Promise((ok,bad)=>{if(!f||!/^image\//.test(f.type))return bad(new Error('type'));
  const rd=new FileReader();rd.onerror=bad;rd.onload=()=>{const img=new Image();img.onerror=bad;img.onload=()=>{
   const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
   c.getContext('2d').drawImage(img,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q));};img.src=rd.result;};rd.readAsDataURL(f);});
 const readSlip=f=>shrink(f,1100,.78).then(url=>({name:f.name||'สลิป',url,kb:Math.max(1,Math.round(url.length*.75/1024)),line:null}));
 function pickFile(mode,line){fileMode=mode;fileLine=line||null;file.multiple=mode==='add';file.click();}
 /* put pictures in (mode / line as chosen by the button; the big drop zone = "add") */
 function placeSlips(arr,mode,line){
  if(!arr.length)return;
  if(mode==='replace'&&S.slips.length){const ix=Math.min(S.slipIx,S.slips.length-1),p=arr[0];p.line=S.slips[ix].line;S.slips[ix]=p;render();return;}
  /* from a transfer line's own button: the picture is that line's slip, and opens big right away so it can be checked */
  if(mode==='line'&&findLine(line)){const p=arr[0];p.line=line;const ix=S.slips.findIndex(x=>x.line===line);if(ix>=0){S.slips[ix]=p;S.slipIx=ix;}else{S.slips.push(p);S.slipIx=S.slips.length-1;}render();showViewer();return;}
  /* from the big drop zone: first transfer line without a slip, then "ไม่ระบุ" — the chips under the picture change it */
  const room=tLines().filter(x=>!slipOf(x.id)).length+(MAXFREE-freeCount());
  if(room<=0)return say('แนบครบแล้ว (รายการโอนละ 1 รูป + อื่น ๆ '+MAXFREE+' รูป) — เอารูปเดิมออกก่อน');
  if(arr.length>room)say('แนบได้อีก '+room+' รูป — รับไว้ '+room+' รูปแรก');
  const take=arr.slice(0,room);take.forEach(p=>{p.line=firstFreeLine();S.slips.push(p);});S.slipIx=S.slips.length-take.length;render();}
 function takeFiles(files){const list=[...(files||[])].filter(f=>/^image\//.test(f.type)),mode=fileMode,line=fileLine;fileMode='add';fileLine=null;
  if(!S)return Promise.resolve();
  if(!list.length){say('รับเฉพาะไฟล์รูป (jpg / png)');return Promise.resolve();}
  return Promise.all(list.slice(0,MAXLINES+MAXFREE).map(f=>readSlip(f).catch(()=>null))).then(arr=>{arr=arr.filter(Boolean);if(!arr.length)return say('เลือกไฟล์รูปภาพเท่านั้น');placeSlips(arr,mode,line);});}
 file.addEventListener('change',()=>{const fs=[...file.files];file.value='';takeFiles(fs);});

 /* ---------- full-screen slip viewer (also used by the payment history) ---------- */
 const vw=document.createElement('div');vw.className='pkg-st-vw';vw.id='pkgStView';vw.hidden=true;vw.setAttribute('role','dialog');vw.setAttribute('aria-modal','true');vw.setAttribute('aria-label','ดูสลิปเต็มจอ');
 vw.innerHTML='<div class="vbar"><span class="nm"></span><button type="button" data-v="prev" title="รูปก่อนหน้า" aria-label="รูปก่อนหน้า">‹</button><span class="vcount"></span><button type="button" data-v="next" title="รูปถัดไป" aria-label="รูปถัดไป">›</button><button type="button" data-v="size"></button><button type="button" data-v="close" class="vx" title="ปิด" aria-label="ปิด">✕</button></div><div class="vbody"><img alt="สลิปที่แนบ"></div>';
 host.append(vw);
 const V={list:[],ix:0,live:false};
 const vq=s=>vw.querySelector(s);
 function paintViewer(){const k=V.list.length;if(!k)return closeViewer();V.ix=Math.max(0,Math.min(V.ix,k-1));const c=V.list[V.ix],img=vq('img');
  vw.classList.remove('real');vq('.nm').textContent=c.label+(c.name?' — '+c.name:'');vq('.vcount').textContent=k>1?(V.ix+1)+' / '+k:'';vq('[data-v="prev"]').hidden=vq('[data-v="next"]').hidden=k<2;
  img.onload=sizeBtn;img.src=c.url;vw.hidden=false;const vb=vq('.vbody');vb.scrollTop=0;vb.scrollLeft=0;sizeBtn();}
 function sizeBtn(){const img=vq('img'),real=vw.classList.contains('real'),wide=img.naturalWidth>vq('.vbody').clientWidth-24,b=vq('[data-v="size"]');
  b.hidden=!wide;b.textContent=real?'พอดีความกว้างจอ':'ขนาดจริง 100%';img.style.cursor=wide?'':'default';}
 function showViewer(){if(!S||!S.slips.length)return;V.live=true;V.list=S.slips.map(x=>({url:x.url,name:x.name,label:lineLabel(x.line)}));V.ix=Math.min(S.slipIx,S.slips.length-1);paintViewer();}
 function viewList(list,ix){V.live=false;V.list=list;V.ix=ix||0;paintViewer();}
 function closeViewer(){vw.hidden=true;}
 function viewerStep(d){const k=V.list.length;if(k<2)return;V.ix=(V.ix+d+k)%k;if(V.live&&S){S.slipIx=V.ix;render();}paintViewer();}
 vw.addEventListener('click',e=>{const b=e.target.closest('[data-v]');
  if(b){const a=b.dataset.v;if(a==='close')closeViewer();else if(a==='prev')viewerStep(-1);else if(a==='next')viewerStep(1);else if(a==='size'){vw.classList.toggle('real');sizeBtn();}return;}
  if(e.target===vq('img')){if(!vq('[data-v="size"]').hidden){vw.classList.toggle('real');sizeBtn();}return;}
  if(e.target===vq('.vbody'))closeViewer();});
 document.addEventListener('keydown',e=>{
  if(!vw.hidden){if(e.key==='Escape'){e.stopPropagation();closeViewer();}else if(e.key==='ArrowLeft')viewerStep(-1);else if(e.key==='ArrowRight')viewerStep(1);return;}
  if(!cfm.hidden&&e.key==='Escape'){e.stopPropagation();cfm.hidden=true;}},true);

 /* ---------- events (delegated on the window) ---------- */
 function setParty(id){if(S.party!==id){S.party=id;clearSel();S.slips=[];S.slipIx=0;S.result=null;
   try{if(typeof ppSelectWho==='function'&&(PP.whoOpts||[]).some(o=>o.id===id))ppSelectWho(id);}catch(e){}}
  S.open=false;S.q='';S.hi=-1;render();}
 const openList=()=>{const pl=q1('[data-st="plist"]');if(pl){pl.hidden=false;pl.innerHTML=plistHTML();}};
 M.addEventListener('input',e=>{const t=e.target;if(!S||!root.contains(t))return;const st=t.dataset.st;
  if(st==='pq'){S.q=t.value;S.open=true;S.hi=-1;openList();return;}
  if(st==='note'){S.note=t.value;return;}
  if(st==='by'){S.by=t.value;return;}
  if(st==='date'){S.date=t.value;return;}
  if(t.dataset.bamt){const x=findBill(t.dataset.bamt);if(!x)return;let v=num(t.value);       /* typing a per-bill amount = the user takes over (manual mode) */
   if(v>x.out+.004){v=x.out;t.value=String(v);say('ชำระได้ไม่เกินยอดคงค้าง ฿'+fm(x.out));}
   if(v<0){v=0;t.value='';}
   goManual();S.ticks[x.id]=true;S.man[x.id]=String(v);refresh();return;}
  if(t.dataset.lf){const ln=findLine(t.dataset.l);if(!ln)return;ln[t.dataset.lf]=t.value;refresh();return;}
  if(t.dataset.f){const [,i,f]=t.dataset.f.split('.');const r=S.rows[+i];if(!r)return;r[f]=t.value;refresh();}});
 M.addEventListener('change',e=>{const t=e.target;if(!S||!root.contains(t))return;const st=t.dataset.st;
  if(st==='branch'){S.branch=t.value;listParties();if(S.party&&!S.pl.some(p=>p.id===S.party))S.party='';clearSel();S.slips=[];S.slipIx=0;S.result=null;render();return;}
  if(st==='date'){S.date=t.value;return;}if(st==='by'){S.by=t.value;return;}
  if(st==='all'||st==='all2'){tickAll();refresh();return;}
  if(t.dataset.tick){tick(t.dataset.tick,t.checked);refresh();return;}
  if(t.dataset.lf&&t.tagName==='SELECT'){const ln=findLine(t.dataset.l);if(ln){ln[t.dataset.lf]=t.value;refresh();}return;}
  if(t.dataset.f){const [,i,f]=t.dataset.f.split('.');const r=S.rows[+i];if(r){r[f]=t.value;refresh();}}});
 M.addEventListener('focusin',e=>{const t=e.target;if(!S||!root.contains(t))return;
  if(t.dataset.st==='pq'){S.open=true;S.q='';t.value='';t.placeholder=partyName()||('พิมพ์ชื่อ'+lb().party+'…');openList();return;}
  if(t.dataset.bamt){const v=S.ticks[t.dataset.bamt]?(shown()[t.dataset.bamt]||0):0;t.value=v>0?String(v):'';t.select();return;}
  if(t.dataset.lamt){const ln=findLine(t.dataset.lamt);if(ln)t.value=num(ln.amt)>0?String(r2(num(ln.amt))):'';t.select();return;}
  if(t.dataset.amt!=null){const r=S.rows[+t.dataset.amt];if(r)t.value=num(r.amt)>0?String(r2(num(r.amt))):'';t.select();}});
 M.addEventListener('focusout',e=>{const t=e.target;if(!S||!root.contains(t))return;
  if(t.dataset.st==='pq'){setTimeout(()=>{if(!S||!S.open)return;const pq=q1('[data-st="pq"]');if(pq&&document.activeElement===pq)return;S.open=false;S.q='';if(pq){pq.value=partyName();const pl=q1('[data-st="plist"]');if(pl)pl.hidden=true;}},180);return;}
  if(t.dataset.bamt||t.dataset.amt!=null||t.dataset.lamt)refresh();});
 M.addEventListener('keydown',e=>{const t=e.target;if(!S||!root.contains(t))return;
  if((e.key==='Enter'||e.key===' ')&&t.matches('.pkg-st-up')){e.preventDefault();pickFile('add');return;}
  if(t.dataset.st!=='pq')return;const items=[...root.querySelectorAll('.pkg-st-plist [data-pick]')];
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();S.hi=Math.max(0,Math.min(items.length-1,S.hi+(e.key==='ArrowDown'?1:-1)));items.forEach((x,i)=>x.classList.toggle('hi',i===S.hi));if(items[S.hi]&&items[S.hi].scrollIntoView)items[S.hi].scrollIntoView({block:'nearest'});}
  else if(e.key==='Enter'){e.preventDefault();const it=items[S.hi>=0?S.hi:0];if(it)setParty(it.dataset.pick);}
  else if(e.key==='Escape'){e.stopPropagation();t.blur();}});
 M.addEventListener('mousedown',e=>{const p=e.target.closest&&e.target.closest('[data-pick]');if(p&&S&&root.contains(p)){e.preventDefault();setParty(p.dataset.pick);}});
 M.addEventListener('dragover',e=>{const d=e.target.closest&&e.target.closest('[data-drop]');if(d){e.preventDefault();d.classList.add('drag');}});
 M.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('[data-drop]');if(d)d.classList.remove('drag');});
 M.addEventListener('drop',e=>{const d=e.target.closest&&e.target.closest('[data-drop]');if(!d)return;e.preventDefault();d.classList.remove('drag');fileMode='add';fileLine=null;takeFiles(e.dataTransfer&&e.dataTransfer.files);});
 M.addEventListener('click',e=>{if(!S||!root.contains(e.target))return;
  const pk=e.target.closest('[data-pick]');if(pk){setParty(pk.dataset.pick);return;}   /* keyboard / touch (the mouse picks on mousedown) */
  const tr=e.target.closest('tr[data-id]');if(tr&&!e.target.closest('input')){tick(tr.dataset.id,!S.ticks[tr.dataset.id]);refresh();return;}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,i=+b.dataset.i;
  if(a==='save')return trySave();
  if(a==='pickfile'||a==='addslip')return pickFile('add');
  if(a==='repslip')return pickFile('replace');
  if(a==='viewslip')return showViewer();
  if(a==='lineslip')return pickFile('line',b.dataset.l);
  if(a==='lineview'){const ix=S.slips.findIndex(x=>x.line===b.dataset.l);if(ix<0)return;S.slipIx=ix;render();return showViewer();}
  if(a==='restline'){const ln=findLine(b.dataset.l);if(!ln)return;ln.amt=String(Math.max(0,r2(target()-(got()-num(ln.amt)))));refresh();return;}
  if(a==='nowline'){const ln=findLine(b.dataset.l);if(!ln)return;ln.when=nowText();const inp=q1(`[data-lf="when"][data-l="${ln.id}"]`);if(inp)inp.value=ln.when;refresh();return;}
  if(a==='addline'){const ls=tLines();if(ls.length>=MAXLINES)return say('เพิ่มรายการโอนได้สูงสุด 6 รายการ');const ln=newLine();ls.push(ln);render();const f=q1(`[data-lamt="${ln.id}"]`);if(f)f.focus();return;}
  if(a==='delline'){const ls=tLines(),ix=ls.findIndex(x=>x.id===b.dataset.l);if(ix<0||ls.length<2)return;ls.splice(ix,1);normSlips();render();return;}
  if(a==='lineunslip'){const ix=S.slips.findIndex(x=>x.line===b.dataset.l);if(ix>=0){S.slips.splice(ix,1);S.slipIx=Math.max(0,Math.min(S.slipIx,S.slips.length-1));}render();return;}
  /* the chips under the big picture: which transfer line this slip belongs to (a line that already has one swaps with it) */
  if(a==='own'){const c=S.slips[Math.min(S.slipIx,S.slips.length-1)],to=b.dataset.l||null;if(!c||c.line===to)return;
   if(to){const other=slipOf(to);if(other)other.line=c.line;c.line=to;}else{if(freeCount()>=MAXFREE)return say('“ไม่ระบุ” เก็บได้ '+MAXFREE+' รูป');c.line=null;}render();return;}
  if(a==='automode'){goAuto();refresh();return;}
  if(a==='short'){const p=allocOldest(got(),x=>r2(num(S.man[x.id])));selList().forEach(x=>S.man[x.id]=String(p[x.id]||0));refresh();const c=counts();
   say('ตัดตามยอดที่'+lb().recv+'จริงแล้ว (ใบเก่าก่อน) · ตัดครบ '+c.f+' ใบ · ตัดบางส่วน '+c.pt+' ใบ'+(c.z?' · ไม่ได้ตัด '+c.z+' ใบ':''));return;}
  if(a==='clear'){const rows=S.rows;clearSel();S.rows=rows;refresh();return;}
  if(a==='rest'){const r=S.rows[i];if(!r)return;const others=S.rows.filter(x=>x!==r).reduce((x,y)=>x+rowAmt(y),0);r.amt=String(Math.max(0,r2(target()-others)));refresh();return;}
  if(a==='hideres'){S.result=null;}
  else if(a==='unslip'){S.slips.splice(Math.min(S.slipIx,S.slips.length-1),1);S.slipIx=Math.max(0,Math.min(S.slipIx,S.slips.length-1));}
  else if(a==='slipix'){S.slipIx=i;}
  else if(a==='full'){full(b.dataset.k);}
  else if(a==='tile'){const ix=S.rows.findIndex(r=>r.k===b.dataset.k);if(ix>=0)delRow(ix);else{if(!addRow(b.dataset.k))return;render();const f=b.dataset.k==='trans'?q1('[data-lamt]'):q1(`[data-amt="${S.rows.length-1}"]`);if(f)f.focus();return;}}
  else if(a==='del'){delRow(i);}
  else return;
  render();});

 /* ---------- opening: the original opener runs first (rights, "ไม่มีลูกหนี้ค้างชำระ", title, its own hidden fields) ---------- */
 const open0=openPartPay;
 openPartPay=window.openPartPay=function(mode,whoId,billId){
  M.classList.remove('on');
  const r=open0.apply(this,arguments);
  if(!M.classList.contains('on'))return r;
  cfm.hidden=true;closeViewer();
  S=blank(mode==='ap'?'ap':'ar');const b=Br();if(b){try{b.ensure();}catch(e){}}
  S.branch=b?b.ctx():'';reload();
  const pre=billId?S.docs.find(x=>x.id===billId):null;
  if(b){
   if(pre&&pre.br!==S.branch)S.branch=pre.br;
   else if(whoId&&!openBills().some(x=>x.who===whoId)&&S.docs.some(x=>x.who===whoId))S.branch='all';
   else if(!openBills().length&&S.docs.length)S.branch='all';
   listParties();
  }
  if(whoId&&S.pl.some(p=>p.id===whoId)){S.party=whoId;if(pre&&pre.who===whoId)S.ticks[pre.id]=true;}
  render();
  if(!S.party){const mine=S;setTimeout(()=>{const pq=q1('[data-st="pq"]');if(pq&&S===mine&&!S.party&&M.classList.contains('on'))pq.focus();},60);}
  return r;
 };

 /* ---------- payment history (mPayHist): new records show their methods, each transfer line and the slips ---------- */
 const slipsOf=p=>(p&&p.payId&&DB.paySlips&&DB.paySlips[p.payId])||[];
 const slipLabel=(p,s)=>{const t=(p.transLines||[]).find(x=>x.no===s.line);return t?'โอน '+t.no+' · '+bankShort(t.bank)+' · '+fm(t.amt):'ไม่ระบุ';};
 function methodHTML(p){
  const ms=p.methods||[],tl=p.transLines||[],k=slipsOf(p).length;
  const one=x=>{let t=mlabel(x.k)+' '+fm(x.amt);
   if(x.k==='card')t+=(x.bank?' · '+x.bank:'')+(x.card4?' เลขท้าย '+x.card4:'')+(x.ref?' · เลขอนุมัติ '+x.ref:'');
   if(x.k==='check')t+=(x.bank?' · '+x.bank:'')+(x.ref?' · เลขที่เช็ค '+x.ref:'')+(x.chkDate?' · ลงวันที่ '+thDate(x.chkDate):'');
   return `<div class="m">${es(t)}</div>`;};
  return `<div class="pkg-st-ph" data-pay="${es(p.id)}">${ms.map(one).join('')}
   ${tl.map(x=>`<div class="t">${es('โอน '+x.no+' · '+(x.bank||'-')+' · ฿'+fm(x.amt)+' · '+(x.when||'-')+(x.ref?' · อ้างอิง '+x.ref:'')+' · '+(x.slip?'มีสลิป':'ไม่มีสลิป'))}</div>`).join('')}
   ${p.payBills>1||Math.abs(num(p.payTotal)-num(p.amt))>.004?`<div class="hint">${es('ชำระรวมครั้งนี้ ฿'+fm(p.payTotal)+' · ตัด '+(p.payBills||1)+' ใบ')}</div>`:''}
   ${k?thumbsHTML(p):''}</div>`;}
 /* owner 12 Oct: the slips are SHOWN in the row — no "ดูสลิป" press. One thumbnail per picture of that payment (the pictures of
    its transfer lines too); a click opens the full-size viewer on that picture. Used by the payment history and, through
    PKG_SETTLE.thumbs, by the receipt window of the sale flow ("same function = same look"). loading="lazy": a picture
    that is not on screen is not decoded. */
 function thumbsHTML(p){
  const sl=slipsOf(p);if(!sl.length)return '';
  return `<div class="pkg-st-thumbs${p.cancelled?' off':''}" data-pay="${es(p.id)}">${sl.map((s,i)=>`<button type="button" class="pkg-st-thumb" data-st-slip="${i}" title="${es(slipLabel(p,s))}" aria-label="${es('ดูรูป '+slipLabel(p,s))}"><img loading="lazy" decoding="async" src="${es(s.url)}" alt="${es(slipLabel(p,s))}"></button>`).join('')}</div>`;}
 const openSlip=(p,i)=>{const sl=slipsOf(p);if(!sl.length)return false;viewList(sl.map(s=>({url:s.url,name:s.name,label:slipLabel(p,s)})),Math.max(0,Math.min(sl.length-1,i|0)));return true;};
 const hist0=renderPayHist;
 renderPayHist=window.renderPayHist=function(){
  const r=hist0.apply(this,arguments);
  try{const d=typeof phDoc==='function'?phDoc():null;if(!d)return r;
   const rows=document.querySelectorAll('#phTbl tbody tr');
   (d.payments||[]).forEach((p,i)=>{if(!p||!p.payId||!rows[i]||!rows[i].cells[2])return;rows[i].cells[2].innerHTML=methodHTML(p);});
   /* DriveGo new system (task 3.4, finding 4): what the customer withheld, under the money received (as the sale window shows it) */
   (d.payments||[]).forEach((p,i)=>{if(!p||p.cancelled||!p.wht||!(num(p.wht.amt)>0)||!rows[i]||!rows[i].cells[1])return;
    rows[i].cells[1].insertAdjacentHTML('beforeend','<div class="hint">หัก ณ ที่จ่าย '+money(p.wht.amt)+(p.wht.got?' · ได้รับหนังสือรับรองแล้ว':p.wht.got===false?' · รอหนังสือรับรอง':'')+'</div>');});}catch(e){}
  return r;};
 const PHM=$i('mPayHist');
 if(PHM)PHM.addEventListener('click',e=>{const th=e.target.closest('[data-st-slip]');
  if(th){const dd=typeof phDoc==='function'?phDoc():null,box=th.closest('.pkg-st-thumbs'),pp=dd&&box&&(dd.payments||[]).find(x=>x.id===box.dataset.pay);if(pp)openSlip(pp,+th.dataset.stSlip);return;}
  const b=e.target.closest('[data-st-slips]');if(!b)return;const d=typeof phDoc==='function'?phDoc():null;
  const p=d&&(d.payments||[]).find(x=>x.id===b.dataset.stSlips),sl=slipsOf(p);if(!sl.length)return;
  viewList(sl.map(s=>({url:s.url,name:s.name,label:slipLabel(p,s)})),0);});
 /* the text the original builds for a payment (history cell before it is replaced, anything else that asks) */
 if(typeof payMethodDetail==='function'){const d0=payMethodDetail;
  payMethodDetail=window.payMethodDetail=function(p){if(!p||!p.payId||!(p.methods||[]).length)return d0.apply(this,arguments);
   return p.methods.map(x=>mlabel(x.k)+' '+fm(x.amt)).join(' + ')+(p.transLines||[]).map(x=>' · โอน '+x.no+' '+(x.bank||'')+' ฿'+fm(x.amt)+' '+(x.when||'')).join('');};}

 window.PKG_SETTLE={thumbs:thumbsHTML,openSlip,slipsOf,reload,selList,shrink:readSlip,state:()=>S,render,refresh,plan,shown,got,over,after,validate,save:trySave,confirm:doSave,takeFiles,viewer:{open:viewList,close:closeViewer},
  /* a picture already in data-URL form (tests; the file button and drag-and-drop go through takeFiles) */
  addSlip:(url,name,line)=>{if(!S)return;placeSlips([{url,name:name||'สลิป',kb:Math.max(1,Math.round(String(url).length*.75/1024)),line:null}],line?'line':'add',line||null);}};
})();
