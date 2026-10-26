/* DriveGo new system (task 3.7, decisions R12, R13, F5, X2 and the owner's answers 2026-10-25): payroll and social security.
   · Social security (R12): the base is the month's wage — salary plus the employee's regular monthly income (a new
     field "เงินได้ประจำ", e.regular), never overtime or bonuses — between 1,650 and the ceiling of the law, 5% each
     side, rounded to the baht. The figures come from a table of the law by month (LAW: ceiling 15,000, from
     Jan 2026 17,500, 2029 20,000, 2032 23,000). The shop may still set its own (R12 = ค): menu 10 asks first and
     writes the audit log; its figures (DB.shop.ssoOwn) apply from the month they were set. The legacy fields
     DB.shop.ssoRate … are no longer read and are left as they are.
   · A payroll period (R13, F5): DB.payroll[] = { id, month, label, date, lines, totals, sso, payId, payNo, ssoId, ssoNo,
     cancelled … }. Recording it writes the two legacy expenses (wages, the employer's contribution) dated the last day
     of the month and unpaid (R13-ก) — or paid at once when asked; "จ่ายเงินเดือน" and "นำส่งประกันสังคม" pay them
     later with a date and a method, each with its payment voucher (MA-PV, task 3.4). Overtime and bonuses are typed on
     the payroll page for that month (R13-ข; the employee form no longer has them). Someone who starts or leaves in
     the month gets salary ÷ 30 × the calendar days worked (R13-จ). A month already recorded cannot be recorded again:
     cancelling it first (with a reason, even once paid) removes its two expenses and keeps the period, cancelled,
     with their numbers (F5 = ค and the answer of 2026-10-25). Recording, paying and cancelling take the owner or the
     right "บันทึกค่าใช้จ่าย" (doc.acctEdit). Each employee has a payslip (R13-ง).
   · Reports (X2 and the answer of 2026-10-25 "เฉพาะงวดที่บันทึก"): the estimate from today's staff list is gone
     (payrollMonthly). The profit-and-loss, cash and trial balance read the recorded periods (their expenses); the
     health page says which months have none; the tax report's social security and ภ.ง.ด.1 base and its payroll
     table are those of the recorded period of the month.
   · Employee income tax (task 3.8, F6 and the owner's answers of 2026-10-25): the shop types each employee's tax withheld
     for the month on the payroll page (the accountant works it out; the system does not compute it yet), l.tax. The
     wage expense stays the gross pay; the employee is paid net of social security and the tax; the tax is owed until
     "นำส่ง ภ.ง.ด.1" (after the salaries are paid: tax is withheld when paid) records its remittance on the period —
     p.taxRemit {date, method, pvNo, …} — with its payment voucher. The tax report shows the month's ภ.ง.ด.1 by the date
     the salaries were paid (as ภ.ง.ด.3 / 53, answer of task 3.4) and prints its summary; each employee's certificate
     of the year (50 ทวิ, ภ.ง.ด.1ก, 52.js) shows what was paid in that year, its number kept on the employee
     (e.cert50[year]). The employee form has an address for it (e.addr). */
(function(){
 if(typeof payrollRun!=='function'||typeof ssoOf!=='function'||typeof finance!=='function'||typeof PAY_CAT==='undefined')return;
 const r2=v=>round2(v),$i=id=>document.getElementById(id),PCAT=PAY_CAT;
 const thisMonth=()=>iso().slice(0,7);
 const monthEnd=mo=>iso(new Date(+mo.slice(0,4),+mo.slice(5,7),0));
 const monthName=mo=>TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
 const lbl=mo=>'งวด '+monthName(mo);
 /* pay and personal data (task 3.9, answer of 2026-10-26): the owner, "ดูสรุปการเงิน ภาษี และเงินเดือน" or "ดูและแก้ไขข้อมูลพนักงาน" —
    the server sends nobody else the other employees' pay (server/lib/visibility.ts), so the payroll needs it */
 const payOk=()=>!curEmp()||can('doc.fin')||can('doc.emp');
 const NO_PAY='บัญชีนี้ไม่มีสิทธิ์ดูเงินเดือน (ต้องมีสิทธิ์ดูสรุปการเงิน ภาษี และเงินเดือน หรือดูและแก้ไขข้อมูลพนักงาน)';
 const canPay=()=>!curEmp()||(can('doc.acctEdit')&&payOk());
 const NO_RIGHT='บัญชีนี้ไม่มีสิทธิ์บันทึกเงินเดือน (ต้องมีสิทธิ์บันทึกค่าใช้จ่าย)',why=()=>payOk()?NO_RIGHT:NO_PAY;

 /* ---------- social security: the law by month, or the shop's own figures (R12 = ค) ---------- */
 const LAW=[{from:'0000-01',rate:5,min:1650,max:15000},{from:'2026-01',rate:5,min:1650,max:17500},
  {from:'2029-01',rate:5,min:1650,max:20000},{from:'2032-01',rate:5,min:1650,max:23000}];
 const withCap=p=>({rate:n(p.rate),min:n(p.min),max:n(p.max),cap:p.cap!=null&&p.cap!==''?n(p.cap):Math.round(n(p.max)*n(p.rate)/100)});
 const lawOf=mo=>Object.assign(withCap(LAW.filter(l=>l.from<=mo).pop()),{from:LAW.filter(l=>l.from<=mo).pop().from});
 const own=()=>(DB.shop&&DB.shop.ssoOwn)||null;
 function paramsOf(mo){const o=own();return o&&String(o.from||'')<=mo?Object.assign(withCap(o),{own:true}):lawOf(mo);}
 const ssoAmt=(wage,P)=>{if(!(wage>0))return{base:0,amt:0};const base=Math.min(Math.max(wage,P.min),P.max);return{base,amt:Math.min(Math.round(base*P.rate/100),P.cap)};};

 /* ---------- an employee's month ---------- */
 const dayN=d=>Math.round(Date.parse(d+'T00:00:00Z')/864e5);
 function daysOf(e,mo){const a=mo+'-01',b=monthEnd(mo),from=e.start&&e.start>a?e.start:a,to=e.leftDate&&e.leftDate<b?e.leftDate:b;
  return from>to?null:{from,to,days:dayN(to)-dayN(from)+1,full:from===a&&to===b};}
 function lineOf(e,mo,x){x=x||{};const d=daysOf(e,mo);if(!d)return null;const P=paramsOf(mo);
  const part=v=>d.full?n(v):r2(n(v)/30*d.days);
  const salary=part(e.salary),regular=part(e.regular),ot=r2(n(x.ot)),bonus=r2(n(x.bonus)),wage=r2(salary+regular),gross=r2(wage+ot+bonus),s=ssoAmt(wage,P);
  const tax=Math.min(r2(n(x.tax)),Math.max(0,r2(gross-s.amt)));   /* typed (task 3.8), never more than what is left to pay */
  return {empId:e.id,code:e.code,name:e.name,position:e.position||'',salaryRate:n(e.salary),regularRate:n(e.regular),
   from:d.from,to:d.to,days:d.days,full:d.full,salary,regular,ot,bonus,gross,ssoBase:s.base,ssoEmp:s.amt,ssoEr:s.amt,tax,net:r2(gross-s.amt-tax)};}
 const draft={};   /* month → { employee id → {ot, bonus, tax} } typed on the payroll page, until the month is recorded */
 const rowsOf=(mo,typed)=>empListOfMonth(mo).map(e=>lineOf(e,mo,typed?(draft[mo]||{})[e.id]:null)).filter(Boolean);
 const sum=L=>L.reduce((a,l)=>({g:r2(a.g+l.gross),e:a.e+l.ssoEmp,r:a.r+l.ssoEr,x:r2(a.x+n(l.tax)),n:r2(a.n+l.net)}),{g:0,e:0,r:0,x:0,n:0});
 /* a period's totals in the short form (x: the tax withheld, 0 for a period recorded before task 3.8) */
 const tot=p=>({g:p.totals.gross,e:p.totals.emp,r:p.totals.er,x:n(p.totals.tax),n:p.totals.net});

 /* ---------- periods ---------- */
 const periods=()=>Array.isArray(DB.payroll)?DB.payroll:[];
 const periodOf=mo=>periods().find(p=>p&&p.month===mo&&!p.cancelled)||null;
 const expOf=id=>(DB.expenses||[]).find(x=>x&&x.id===id)||null;
 const periodOfExp=x=>x&&x.payroll?periods().find(p=>p.id===x.payroll)||null:null;

 /* the legacy helpers, now on the recorded figures */
 window.payrollMonthly=()=>0;   /* the estimate from today's staff list: no longer in any report */
 window.ssoOf=function(e){if(!e||!(n(e.salary)>0||n(e.regular)>0))return {gross:0,base:0,emp:0,er:0};
  const gross=r2(n(e.salary)+n(e.regular)),s=ssoAmt(gross,paramsOf(thisMonth()));return {gross,base:s.base,emp:s.amt,er:s.amt};};
 window.ssoSummaryOf=function(mo){const p=periodOf(mo),t=p?{g:p.totals.gross,e:p.totals.emp,r:p.totals.er}:sum(rowsOf(mo));
  return {gross:t.g,emp:t.e,er:t.r,total:t.e+t.r,recorded:!!p};};
 /* social security still to remit (trial balance 2060): recorded periods whose contribution is not paid */
 const owed=()=>periods().filter(p=>!p.cancelled).reduce((a,p)=>{const x=expOf(p.ssoId);return a+(x&&!x.paid?p.totals.emp+p.totals.er:0);},0);
 window.ssoSummary=()=>({gross:0,emp:0,er:0,total:owed()});

 /* ---------- the payroll page (06.4) ---------- */
 const METHODS=['เงินโอน','เงินสด','เช็ค'];
 function payAsk(o){return new Promise(res=>{
  const msg=o.html+'<div class="grid g3" style="margin-top:10px">'
   +(o.later?'<label class="f"><span>สถานะ</span><select id="pkgPayWhen"><option value="0">ค้างจ่าย (จ่ายทีหลัง)</option><option value="1">จ่ายแล้ว</option></select></label>':'')
   +`<label class="f"><span>วันที่จ่าย</span><input type="date" id="pkgPayDate" value="${iso()}"></label>`
   +`<label class="f"><span>วิธีจ่าย</span><select id="pkgPayMethod">${METHODS.map(m=>`<option>${m}</option>`).join('')}</select></label></div>`;
  askConfirm({title:o.title,msg,yes:o.yes,no:'ยกเลิก',onNo:()=>res(null),onYes:()=>{const w=$i('pkgPayWhen');
   res({paid:o.later?!!(w&&w.value==='1'):true,date:($i('pkgPayDate')||{}).value||iso(),method:($i('pkgPayMethod')||{}).value||METHODS[0]});}});});}
 const sumHtml=(t,k)=>`<table class="tbl" style="margin-top:6px"><tbody>
   <tr><td>พนักงาน</td><td class="num">${k} คน</td></tr><tr><td>รวมรายได้</td><td class="num">${money(t.g)}</td></tr>
   <tr><td>หักประกันสังคม (ลูกจ้าง)</td><td class="num">${money(t.e)}</td></tr>${t.x?`<tr><td>หักภาษีเงินได้ ณ ที่จ่าย (ภ.ง.ด.1)</td><td class="num">${money(t.x)}</td></tr>`:''}<tr><td><b>จ่ายสุทธิ</b></td><td class="num"><b>${money(t.n)}</b></td></tr>
   <tr><td>นายจ้างสมทบ</td><td class="num">${money(t.r)}</td></tr><tr><td>รวมนำส่งประกันสังคม</td><td class="num">${money(t.e+t.r)}</td></tr></tbody></table>`;
 function markPaid(x,a,head){const old=Object.assign({},x);Object.assign(x,{paid:true,payDate:a.date,method:a.method});
  if(!x.pvNo)x.pvNo=window.PKG_PV?PKG_PV.newNo():docNo('PV');stampRec(x,old);
  logAudit('expense',x,'pay',head+' ('+a.method+') · ใบสำคัญจ่าย '+x.pvNo);}
 window.payrollRun=async function(){
  if(!canPay())return toast(why());
  const mo=payMonthVal(),L=rowsOf(mo,true);if(!L.length)return toast('ยังไม่มีข้อมูลพนักงาน — เพิ่มที่เมนูตั้งค่าองค์กร');
  const cur=periodOf(mo);if(cur)return toast(lbl(mo)+' บันทึกแล้ว ('+cur.payNo+') — ต้องยกเลิกงวดเดิมก่อนจึงจะบันทึกใหม่ได้');
  const t=sum(L),d=monthEnd(mo);
  const a=await payAsk({title:'บันทึกเงินเดือน '+lbl(mo),yes:'บันทึก',later:true,
   html:`<p>ลงค่าใช้จ่ายวันที่ ${thDate(d)} (สิ้นงวด)</p>`+sumHtml(t,L.length)});
  if(!a)return;
  if(periodOf(mo))return toast(lbl(mo)+' บันทึกแล้ว — ต้องยกเลิกงวดเดิมก่อนจึงจะบันทึกใหม่ได้');
  const pid=uid(),k=L.length;
  const mk=(desc,base,note,part,payee)=>{const x={id:uid(),no:docNo('EX'),date:d,cat:PCAT,desc,payee,tax:'',inv:'',base,vat:0,wht:0,method:'',paid:false,note,payroll:pid,payPart:part};stampRec(x,null);return x;};
  const e1=mk('จ่ายเงินเดือนและค่าล่วงเวลา '+lbl(mo),t.g,'หักประกันสังคมลูกจ้าง '+money(t.e)+' บาท'+(t.x?' · หักภาษี ณ ที่จ่าย '+money(t.x)+' บาท':'')+' · จ่ายสุทธิ '+money(t.n)+' บาท','pay','พนักงาน '+k+' คน');
  const e2=mk('เงินสมทบประกันสังคมส่วนนายจ้าง '+lbl(mo),t.r,'นำส่งพร้อมส่วนลูกจ้าง รวม '+money(t.e+t.r)+' บาท','sso','สำนักงานประกันสังคม');
  DB.expenses.push(e1,e2);
  const p={id:pid,month:mo,label:lbl(mo),date:d,lines:L,totals:Object.assign({n:k,gross:t.g,emp:t.e,er:t.r,net:t.n},t.x?{tax:t.x}:{}),sso:paramsOf(mo),
   payId:e1.id,payNo:e1.no,ssoId:e2.id,ssoNo:e2.no,cancelled:false};
  stampRec(p,null);DB.payroll=periods().concat(p);
  logAudit('expense',e1,'save','บันทึกเงินเดือน '+lbl(mo)+' · '+k+' คน รวม '+money(t.g)+' บาท · หักประกันสังคม '+money(t.e)+' บาท'+(t.x?' · หักภาษี ณ ที่จ่าย '+money(t.x)+' บาท':'')+' · จ่ายสุทธิ '+money(t.n)+' บาท · นายจ้างสมทบ '+money(t.r)+' บาท'+(a.paid?'':' · ค้างจ่าย'));
  if(a.paid)markPaid(e1,a,'จ่ายเงินเดือน '+lbl(mo)+' สุทธิ '+money(t.n)+' บาท');
  delete draft[mo];save();window.renderPayroll();renderHome();
  toast('บันทึกเงินเดือน '+lbl(mo)+' แล้ว · เงินเดือน '+money0(t.g)+' + สมทบนายจ้าง '+money0(t.r)+' บาท'+(a.paid?' · จ่ายแล้ว':' · ค้างจ่าย'));
 };
 async function paySalary(id){
  if(!canPay())return toast(why());const p=periods().find(x=>x.id===id),x=p&&expOf(p.payId);if(!x||x.paid||p.cancelled)return;
  const a=await payAsk({title:'จ่ายเงินเดือน '+p.label,yes:'บันทึกการจ่าย',html:`<p>จ่ายสุทธิให้พนักงาน ${p.totals.n} คน <b>${money(p.totals.net)}</b> บาท
   (รวมรายได้ ${money(p.totals.gross)} หักประกันสังคม ${money(p.totals.emp)}${n(p.totals.tax)?' หักภาษี ณ ที่จ่าย '+money(p.totals.tax):''})</p>`});
  if(!a)return;markPaid(x,a,'จ่ายเงินเดือน '+p.label+' สุทธิ '+money(p.totals.net)+' บาท');save();window.renderPayroll();renderHome();
  toast('บันทึกจ่ายเงินเดือน '+p.label+' แล้ว · ใบสำคัญจ่าย '+x.pvNo);}
 async function paySso(id){
  if(!canPay())return toast(why());const p=periods().find(x=>x.id===id),x=p&&expOf(p.ssoId);if(!x||x.paid||p.cancelled)return;
  const a=await payAsk({title:'นำส่งประกันสังคม '+p.label,yes:'บันทึกการนำส่ง',html:`<p>นำส่งสำนักงานประกันสังคม <b>${money(p.totals.emp+p.totals.er)}</b> บาท
   (ลูกจ้าง ${money(p.totals.emp)} + นายจ้าง ${money(p.totals.er)}) ภายในวันที่ 15 ของเดือนถัดไป</p>`});
  if(!a)return;markPaid(x,a,'นำส่งประกันสังคม '+p.label+' '+money(p.totals.emp+p.totals.er)+' บาท (ลูกจ้าง '+money(p.totals.emp)+' + นายจ้าง '+money(p.totals.er)+')');
  save();window.renderPayroll();renderHome();toast('บันทึกนำส่งประกันสังคม '+p.label+' แล้ว · ใบสำคัญจ่าย '+x.pvNo);}
 /* ---------- the tax withheld (task 3.8): remitted with ภ.ง.ด.1 once the salaries are paid ---------- */
 const nextMonth=d=>{const y=+String(d).slice(0,4),m=+String(d).slice(5,7);return m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0');};
 const taxN=p=>p.lines.filter(l=>n(l.tax)>0).length;
 async function payTax(id){
  if(!canPay())return toast(why());const p=periods().find(x=>x.id===id),x=p&&expOf(p.payId),T=p&&n(p.totals.tax);
  if(!x||!T||p.cancelled||p.taxRemit)return;
  if(!x.paid)return toast('ยังไม่ได้จ่ายเงินเดือน '+p.label+' — ภาษีหัก ณ ที่จ่ายนำส่งได้หลังจ่ายเงินเดือน');
  const due='7 '+monthName(nextMonth(x.payDate||x.date));
  const a=await payAsk({title:'นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) '+p.label,yes:'บันทึกการนำส่ง',html:`<p>นำส่งกรมสรรพากร <b>${money(T)}</b> บาท
   (ภาษีเงินได้ที่หักจากเงินเดือน ${taxN(p)} คน) ภายในวันที่ ${due}</p>`});
  if(!a||p.taxRemit)return;
  const old=Object.assign({},p);p.taxRemit={date:a.date,method:a.method,pvNo:window.PKG_PV?PKG_PV.newNo():docNo('PV'),at:nowTs(),by:DB.curEmp||'',byName:meName()};stampRec(p,old);
  logAudit('expense',{id:p.payId,no:p.payNo},'pay','นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) '+p.label+' '+money(T)+' บาท ('+a.method+') · ใบสำคัญจ่าย '+p.taxRemit.pvNo);
  save();window.renderPayroll();renderHome();toast('บันทึกนำส่ง ภ.ง.ด.1 '+p.label+' แล้ว · ใบสำคัญจ่าย '+p.taxRemit.pvNo);}
 /* its voucher (58-payment-voucher.js asks for a number it does not find) */
 function remitVoucher(no){const p=periods().find(q=>q&&q.taxRemit&&q.taxRemit.pvNo===no);if(!p)return null;const r=p.taxRemit;
  return {date:r.date,payee:'กรมสรรพากร',tax:'',addr:null,method:r.method,by:r.byName||'',note:'',doc:{id:p.payId,no:p.payNo},kind:'expense',ded:[],
   lines:[{text:'ภาษีเงินได้หัก ณ ที่จ่ายจากเงินเดือน (ภ.ง.ด.1) '+p.label+' ('+taxN(p)+' คน)',ref:p.payNo,amt:n(p.totals.tax),wht:0,rate:0}]};}
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||periods().some(p=>p&&p.taxRemit&&p.taxRemit.pvNo===no)
  ||(DB.emp||[]).some(e=>e&&e.cert50&&Object.values(e.cert50).includes(no));};
 async function cancelPeriod(id){
  if(!canPay())return toast(why());const p=periods().find(x=>x.id===id);if(!p||p.cancelled)return;
  const xs=[expOf(p.payId),expOf(p.ssoId)].filter(Boolean),paid=xs.filter(x=>x.paid).map(x=>x.pvNo).concat(p.taxRemit?[p.taxRemit.pvNo]:[]);
  const why=await askPromptP({title:'ยกเลิกเงินเดือน '+p.label,text:'ระบุเหตุผลที่ยกเลิก (จำเป็น)\nรายจ่าย '+xs.map(x=>x.no).join(' และ ')+' ของงวดนี้จะถูกยกเลิก'
   +(paid.filter(Boolean).length?' รวมการจ่ายที่บันทึกไว้ ('+paid.filter(Boolean).join(', ')+')':'')+' แล้วบันทึกงวดใหม่ได้',yes:'ยกเลิกงวดนี้',no:'ไม่ยกเลิก',required:true});
  if(why===null)return;if(!String(why).trim())return toast('ต้องระบุเหตุผลที่ยกเลิก');
  p.cancelledDocs=xs.map(x=>({no:x.no,desc:x.desc,base:x.base,paid:!!x.paid,payDate:x.payDate||'',method:x.method||'',pvNo:x.pvNo||''}));
  xs.forEach(x=>{const i=DB.expenses.indexOf(x);if(i>=0)DB.expenses.splice(i,1);});
  Object.assign(p,{cancelled:true,cancelReason:String(why).trim(),cancelDate:iso(),cancelAt:nowTs(),cancelBy:DB.curEmp||'',cancelByName:meName()});
  logAudit('expense',{id:p.payId,no:p.payNo},'del','ยกเลิกเงินเดือน '+p.label+' — '+p.cancelReason+' · '+p.cancelledDocs.map(c=>c.no+(c.paid?' (จ่ายแล้ว '+c.pvNo+')':'')).join(', ')
   +(p.taxRemit?' · นำส่ง ภ.ง.ด.1 แล้ว '+p.taxRemit.pvNo:''));
  save();window.renderPayroll();renderHome();toast('ยกเลิกเงินเดือน '+p.label+' แล้ว — บันทึกงวดใหม่ได้');}

 const hint=s=>`<div class="hint">${s}</div>`;
 window.renderPayroll=function(){
  const mo=payMonthVal(),p=periodOf(mo),L=p?p.lines:rowsOf(mo,true),t=p?tot(p):sum(L),edit=!p&&canPay();
  const hr=$i('payTbl').tHead&&$i('payTbl').tHead.rows[0];   /* the tax withheld (task 3.8), after social security */
  if(hr&&!hr.querySelector('.pkg-pay-tax'))hr.cells[7].insertAdjacentHTML('afterend','<th class="num pkg-pay-tax" style="width:110px">หักภาษี ณ ที่จ่าย</th>');
  if(!payOk()){$i('payTag').textContent=lbl(mo);$i('payTbl').tBodies[0].innerHTML=`<tr><td colspan="11" class="empty">${NO_PAY}</td></tr>`;
   $i('payTbl').tFoot.innerHTML='';$i('payEmpty').style.display='none';const st=$i('pkgPayState');if(st){st.innerHTML='';delete st.dataset.pid;}history();return;}
  $i('payTag').textContent=lbl(mo)+' · '+L.length+' คน'+(p?' · บันทึกแล้ว':'');
  const box=(l,k)=>edit?`<input type="number" min="0" step="0.01" class="pkg-pay-in" data-emp="${esc(l.empId)}" data-k="${k}" value="${n(l[k])||''}" placeholder="0" aria-label="${{ot:'ค่าล่วงเวลา',bonus:'เงินพิเศษ',tax:'ภาษีหัก ณ ที่จ่าย'}[k]} ${esc(l.code)}" style="width:96px;text-align:right">`:money(n(l[k]));
  $i('payTbl').tBodies[0].innerHTML=L.map(l=>`<tr><td class="mono">${esc(l.code)}</td>
   <td>${esc(l.name)}${p?`<div><button type="button" class="btn sm gh" data-slip="${esc(l.empId)}">สลิปเงินเดือน</button></div>`:''}</td><td>${esc(l.position||'-')}</td>
   <td class="num">${money(l.salary)}${l.full?'':hint(l.days+' วัน ('+thDate(l.from)+' – '+thDate(l.to)+')')}${l.regular?hint('+ เงินได้ประจำ '+money(l.regular)):''}</td>
   <td class="num">${box(l,'ot')}</td><td class="num">${box(l,'bonus')}</td>
   <td class="num"><b>${money(l.gross)}</b></td><td class="num">${money(l.ssoEmp)}</td><td class="num">${box(l,'tax')}</td><td class="num"><b>${money(l.net)}</b></td><td class="num">${money(l.ssoEr)}</td></tr>`).join('');
  $i('payTbl').tFoot.innerHTML=`<tr><td colspan="6">รวม ${L.length} คน</td><td class="num"><b>${money(t.g)}</b></td>
    <td class="num"><b>${money(t.e)}</b></td><td class="num"><b>${money(t.x)}</b></td><td class="num"><b>${money(t.n)}</b></td><td class="num"><b>${money(t.r)}</b></td></tr>
    <tr><td colspan="10" class="hint">ยอดที่ต้องนำส่งประกันสังคม (ลูกจ้าง ${money(t.e)} + นายจ้าง ${money(t.r)})</td><td class="num"><b>${money(t.e+t.r)}</b></td></tr>`
   +(t.x?`<tr><td colspan="10" class="hint">ภาษีหัก ณ ที่จ่ายที่ต้องนำส่ง (ภ.ง.ด.1) ภายในวันที่ 7 ของเดือนถัดจากเดือนที่จ่ายเงินเดือน</td><td class="num"><b>${money(t.x)}</b></td></tr>`:'');
  $i('payEmpty').style.display=L.length?'none':'block';
  state(mo,p);history();
 };
 /* under the table: what the month has (recorded or not, paid or not) and its actions */
 function state(mo,p){let el=$i('pkgPayState');const tbl=$i('payTbl'),wrap=tbl&&(tbl.closest('.scroll')||tbl);if(!wrap)return;
  if(!el){el=document.createElement('div');el.id='pkgPayState';el.className='pkg-pay-state';el.style.cssText='margin:10px 0 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center';wrap.after(el);}
  const P=paramsOf(mo),law=`ประกันสังคม ${P.rate}% ฐาน ${money0(P.min)} – ${money0(P.max)} บาท (หักสูงสุด ${money0(P.cap)} บาท)${P.own?' · ร้านตั้งเอง':''}`;
  if(!p){el.innerHTML=`<span class="hint">ยังไม่ได้บันทึก${lbl(mo)} — กรอกค่าล่วงเวลา เงินพิเศษ และภาษีหัก ณ ที่จ่ายของงวดนี้ (ถ้ามี) แล้วกด "บันทึกจ่ายเงินเดือนงวดนี้" · ${law}</span>`;return;}
  const x1=expOf(p.payId),x2=expOf(p.ssoId),ok=canPay();
  const part=(x,name,btn,act)=>x&&x.paid?`<span class="chip g">${name}แล้ว ${thDate(x.payDate||x.date)} (${esc(x.method||'-')}) · ใบสำคัญจ่าย <span data-no-translate>${esc(x.pvNo||'-')}</span></span>`
   +(x.pvNo?` <button type="button" class="btn sm gh" data-pvp="${esc(x.pvNo)}">พิมพ์ใบสำคัญจ่าย</button>`:'')
   :`<span class="chip a">${name==='จ่าย'?'เงินเดือนค้างจ่าย':'ประกันสังคมค้างนำส่ง'}</span>`+(ok?` <button type="button" class="btn sm pri" data-act="${act}">${btn}</button>`:'');
  el.innerHTML=`<span class="hint">บันทึกแล้ว · รายจ่าย <span data-no-translate>${esc(p.payNo)}</span> (เงินเดือน) และ <span data-no-translate>${esc(p.ssoNo)}</span> (นายจ้างสมทบ)</span>`
   +part(x1,'จ่าย','จ่ายเงินเดือน','pay')+part(x2,'นำส่ง','นำส่งประกันสังคม','sso')+taxPart(p,x1,ok)
   +`<button type="button" class="btn sm gh" data-slip="*">พิมพ์สลิปเงินเดือนทุกคน</button>`+(ok?`<button type="button" class="btn sm dgr" data-act="cancel">ยกเลิกงวดนี้</button>`:'');
  el.dataset.pid=p.id;}
 /* the tax withheld of a period: owed once the salaries are paid, remitted with its voucher */
 function taxPart(p,x1,ok){const T=n(p.totals.tax),r=p.taxRemit;if(!T)return '';
  if(r)return `<span class="chip g">นำส่ง ภ.ง.ด.1 แล้ว ${thDate(r.date)} (${esc(r.method||'-')}) · ใบสำคัญจ่าย <span data-no-translate>${esc(r.pvNo)}</span></span>`
   +` <button type="button" class="btn sm gh" data-pvp="${esc(r.pvNo)}">พิมพ์ใบสำคัญจ่าย</button>`;
  if(!(x1&&x1.paid))return `<span class="chip">ภาษีหัก ณ ที่จ่าย ${money(T)} บาท — นำส่งหลังจ่ายเงินเดือน</span>`;
  return `<span class="chip a">ภาษี ภ.ง.ด.1 ค้างนำส่ง</span>`+(ok?` <button type="button" class="btn sm pri" data-act="tax">นำส่ง ภ.ง.ด.1</button>`:'');}
 /* the history: payroll expenses (also those recorded before task 3.7) and the cancelled periods */
 function history(){
  const tb=$i('payHistTbl')&&$i('payHistTbl').tBodies[0];if(!tb)return;
  const hist=DB.expenses.filter(x=>x.cat===PCAT).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.no).localeCompare(String(a.no)));
  const gone=periods().filter(p=>p.cancelled).sort((a,b)=>String(b.cancelAt||'').localeCompare(String(a.cancelAt||'')));
  const rem=periods().filter(p=>!p.cancelled&&n(p.totals.tax)>0);   /* the remittance of the tax withheld (task 3.8) */
  const rowExp=x=>{const p=periodOfExp(x);return `<tr><td class="mono" style="font-size:12px">${esc(x.no)}${x.pvNo?hint('ใบสำคัญจ่าย '+esc(x.pvNo)):''}</td>
    <td class="ctr">${thDate(x.paid&&x.payDate||x.date)}</td><td>${esc(x.desc)}${x.note?hint(esc(x.note)):''}</td>
    <td class="num"><b>${money(x.payPart==='sso'&&p?p.totals.emp+p.totals.er:x.payPart==='pay'&&p?p.totals.net:expTotals(x).net)}</b></td>
    <td class="ctr">${p?(x.paid?'<span class="chip g">จ่ายแล้ว</span>':`<button type="button" class="btn sm pri" data-pay="${esc(x.id)}">จ่าย</button>`):expStatusCell(x)}</td>
    <td class="ctr">${p?`<button type="button" class="btn sm gh" data-month="${esc(p.month)}">เปิด${esc(p.label)}</button>`
     :`<div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px"><button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
       <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div>`}</td></tr>`;};
  const rowTax=p=>{const r=p.taxRemit,x1=expOf(p.payId);return `<tr><td class="mono" style="font-size:12px">ภ.ง.ด.1${r?hint('ใบสำคัญจ่าย '+esc(r.pvNo)):''}</td>
    <td class="ctr">${thDate(r?r.date:p.date)}</td><td>นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) ${esc(p.label)}${hint('ภาษีเงินได้ที่หักจากเงินเดือน '+taxN(p)+' คน')}</td>
    <td class="num"><b>${money(p.totals.tax)}</b></td>
    <td class="ctr">${r?'<span class="chip g">จ่ายแล้ว</span>':x1&&x1.paid?`<button type="button" class="btn sm pri" data-taxpay="${esc(p.id)}">จ่าย</button>`:'<span class="chip">รอจ่ายเงินเดือน</span>'}</td>
    <td class="ctr"><button type="button" class="btn sm gh" data-month="${esc(p.month)}">เปิด${esc(p.label)}</button></td></tr>`;};
  tb.innerHTML=hist.map(x=>({d:String(x.date),k:String(x.no),h:rowExp(x)})).concat(rem.map(p=>({d:String(p.date),k:String(p.ssoNo)+'~',h:rowTax(p)})))
    .sort((a,b)=>b.d.localeCompare(a.d)||b.k.localeCompare(a.k)).map(r=>r.h).join('')
   +gone.map(p=>`<tr class="cancelrow"><td class="mono" style="font-size:12px">${(p.cancelledDocs||[]).map(c=>esc(c.no)).concat(p.taxRemit?['ภ.ง.ด.1 '+esc(p.taxRemit.pvNo)]:[]).join('<br>')}</td>
    <td class="ctr">${thDate(p.date)}</td><td>${esc(p.label)} · ยกเลิกแล้ว${hint('ยกเลิก '+thDate(p.cancelDate)+' โดย '+esc(p.cancelByName||'')+' — '+esc(p.cancelReason||''))}</td>
    <td class="num">${money(p.totals.gross)}</td><td class="ctr"><span class="chip r">ยกเลิกแล้ว</span></td><td></td></tr>`).join('');
  $i('payHistEmpty').style.display=hist.length+rem.length+gone.length?'none':'block';
  $i('payHistTag').textContent=(hist.length+rem.length+gone.length)+' รายการ';}
 const pane=$i('b-pay');
 if(pane){
  pane.addEventListener('change',e=>{const t=e.target;if(!t.classList||!t.classList.contains('pkg-pay-in'))return;
   const mo=payMonthVal();if(periodOf(mo))return;const d=draft[mo]=draft[mo]||{},r=d[t.dataset.emp]=d[t.dataset.emp]||{};
   const v=Math.max(0,n(t.value));
   if(t.dataset.k==='tax'&&v>0){const e=(DB.emp||[]).find(z=>z.id===t.dataset.emp),l=e&&lineOf(e,mo,Object.assign({},r,{tax:0})),max=l?r2(l.gross-l.ssoEmp):0;
    if(v>max){toast('ภาษีหัก ณ ที่จ่ายของ '+(l?l.code:'')+' ต้องไม่เกินรายได้หลังหักประกันสังคม ('+money(max)+' บาท)');return window.renderPayroll();}}
   r[t.dataset.k]=v;window.renderPayroll();});
  pane.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   const st=$i('pkgPayState'),pid=st&&st.dataset.pid,mo=payMonthVal(),p=periodOf(mo);
   if(b.dataset.act==='pay'&&pid)return paySalary(pid);
   if(b.dataset.act==='sso'&&pid)return paySso(pid);
   if(b.dataset.act==='tax'&&pid)return payTax(pid);
   if(b.dataset.taxpay)return payTax(b.dataset.taxpay);
   if(b.dataset.act==='cancel'&&pid)return cancelPeriod(pid);
   if(b.dataset.pvp&&window.PKG_PV)return PKG_PV.print(b.dataset.pvp);
   if(b.dataset.slip&&p)return printSlips(p,b.dataset.slip==='*'?null:b.dataset.slip);
   if(b.dataset.pay){const x=expOf(b.dataset.pay),q=periodOfExp(x);if(q)return x.payPart==='sso'?paySso(q.id):paySalary(q.id);}
   if(b.dataset.month){$i('payMonth').value=b.dataset.month;window.renderPayroll();}});}
 const pm=$i('payMonth');if(pm)pm.onchange=()=>window.renderPayroll();

 /* ---------- the printed sheet and the payslips ---------- */
 window.printPayroll=function(){if(!payOk())return toast(NO_PAY);
  const mo=payMonthVal(),p=periodOf(mo),L=p?p.lines:rowsOf(mo,true),t=p?tot(p):sum(L);
  printDocs(sheetTop({title:'ใบจ่ายเงินเดือนพนักงาน',en:'PAYROLL SHEET',copy:'เอกสารภายใน',
    fields:[['งวดเดือน',monthName(mo)],['จำนวนพนักงาน',L.length+' คน'],['วันที่พิมพ์',thDate(iso())]]})+
    `<table><thead><tr><th style="width:60px">รหัส</th><th>ชื่อ - นามสกุล</th><th style="width:95px">ตำแหน่ง</th>
      <th style="width:70px">เงินเดือน</th><th style="width:60px">ล่วงเวลา</th><th style="width:60px">เงินพิเศษ</th>
      <th style="width:74px">รวมรายได้</th><th style="width:66px">หัก ปกส.</th><th style="width:66px">หักภาษี</th><th style="width:78px">จ่ายสุทธิ</th>
      <th style="width:70px">ลงชื่อรับเงิน</th></tr></thead><tbody>
      ${L.map(l=>`<tr><td>${esc(l.code)}</td><td>${esc(l.name)}</td><td>${esc(l.position||'-')}</td>
        <td class="num">${money(r2(l.salary+l.regular))}${l.full?'':'<br><span class="lbl">'+l.days+' วัน</span>'}</td><td class="num">${money(l.ot)}</td><td class="num">${money(l.bonus)}</td>
        <td class="num">${money(l.gross)}</td><td class="num">${money(l.ssoEmp)}</td><td class="num">${money(n(l.tax))}</td><td class="num">${money(l.net)}</td><td></td></tr>`).join('')}
      <tr><td colspan="6" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(t.g)}</b></td>
        <td class="num"><b>${money(t.e)}</b></td><td class="num"><b>${money(t.x)}</b></td><td class="num"><b>${money(t.n)}</b></td><td></td></tr>
      <tr><td colspan="10" style="text-align:right">เงินสมทบประกันสังคมส่วนนายจ้าง</td><td class="num">${money(t.r)}</td></tr>
      <tr><td colspan="10" style="text-align:right"><b>รวมนำส่งสำนักงานประกันสังคม</b></td><td class="num"><b>${money(t.e+t.r)}</b></td></tr>
      ${t.x?`<tr><td colspan="10" style="text-align:right"><b>ภาษีหัก ณ ที่จ่ายนำส่ง (ภ.ง.ด.1)</b></td><td class="num"><b>${money(t.x)}</b></td></tr>`:''}
      </tbody></table>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติจ่าย</span></div></div></div>`);};
 function slip(p,l){const x=expOf(p.payId),e=(DB.emp||[]).find(z=>z.id===l.empId)||{};
  const row=(t,v)=>`<tr><td>${t}</td><td class="num">${money(v)}</td></tr>`;
  return sheetTop({title:'สลิปเงินเดือน',en:'PAY SLIP',copy:'สำหรับพนักงาน',fields:[['งวด',monthName(p.month)],['วันที่จ่าย',x&&x.paid?thDate(x.payDate||x.date):'-']]})+`
  <table><tr><td><span class="lbl">พนักงาน</span><br><b>${esc(l.code)} · ${esc(l.name)}</b><br>${esc(l.position||'-')}</td>
   <td><span class="lbl">เลขประจำตัวประชาชน</span><br>${esc(e.idcard||'-')}<br><span class="lbl">โรงพยาบาลประกันสังคม</span> ${esc(e.hospital||'-')}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th>รายได้</th><th style="width:110px">จำนวนเงิน</th></tr></thead><tbody>
   ${row('เงินเดือน'+(l.full?'':' ('+l.days+' วัน: '+thDate(l.from)+' – '+thDate(l.to)+' · อัตรา '+money(l.salaryRate)+' ÷ 30)'),l.salary)}
   ${l.regular?row('เงินได้ประจำ',l.regular):''}${l.ot?row('ค่าล่วงเวลา',l.ot):''}${l.bonus?row('เงินพิเศษ',l.bonus):''}
   <tr><td style="text-align:right"><b>รวมรายได้</b></td><td class="num"><b>${money(l.gross)}</b></td></tr></tbody></table>
  <table style="margin-top:7px"><thead><tr><th>รายการหัก</th><th style="width:110px">จำนวนเงิน</th></tr></thead><tbody>
   ${row('เงินสมทบประกันสังคม '+p.sso.rate+'% (ฐาน '+money(l.ssoBase)+')',l.ssoEmp)}${n(l.tax)?row('ภาษีเงินได้หัก ณ ที่จ่าย',l.tax):''}
   <tr><td style="text-align:right"><b>รวมรายการหัก</b></td><td class="num"><b>${money(r2(l.ssoEmp+n(l.tax)))}</b></td></tr>
   <tr><td style="text-align:right"><b>รับสุทธิ</b></td><td class="num"><b>${money(l.net)}</b></td></tr>
   <tr><td colspan="2" style="text-align:center">(${bahtText(l.net)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">นายจ้างสมทบประกันสังคมให้</span> ${money(l.ssoEr)} บาท</div>
  <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จ่ายเงิน</span></div>
   <div><div class="line"></div>( ${esc(l.name)} )<br><span class="lbl">ผู้รับเงิน</span></div></div></div>`;}
 function printSlips(p,empId){if(!payOk())return toast(NO_PAY);const L=p.lines.filter(l=>!empId||l.empId===empId);if(!L.length)return;
  logAudit('expense',{id:p.payId,no:p.payNo},'print','สลิปเงินเดือน '+p.label+(empId?' · '+L[0].code:' · ทุกคน '+L.length+' ใบ'));save();
  printDocs(L.map(l=>slip(p,l)).join(''));}

 /* the payroll expenses elsewhere (08 ค่าใช้จ่ายกิจการ): paid, edited and deleted only through their period */
 const px0=window.payExp;window.payExp=function(id){const x=expOf(id),p=periodOfExp(x);if(!p)return px0.apply(this,arguments);
  return x.payPart==='sso'?paySso(p.id):paySalary(p.id);};
 const dx0=window.delExp;window.delExp=function(id){const x=expOf(id),p=periodOfExp(x);
  if(p)return toast('รายจ่ายนี้เป็นของเงินเดือน '+p.label+' — ยกเลิกที่หน้า 06.4 จ่ายเงินเดือน');return dx0.apply(this,arguments);};
 const sx0=window.saveExp;window.saveExp=function(){const x=typeof editExpId!=='undefined'&&editExpId?expOf(editExpId):null,p=periodOfExp(x);
  if(p)return toast('รายจ่ายนี้เป็นของเงินเดือน '+p.label+' — แก้ไขที่หน้า 06.4 จ่ายเงินเดือน (ยกเลิกงวดแล้วบันทึกใหม่)');return sx0.apply(this,arguments);};
 /* its payment voucher: what was paid, net of the employee's contribution (58-payment-voucher.js) */
 function voucher(x){const p=periodOfExp(x);if(!p)return null;const T=p.totals;
  return x.payPart==='sso'
   ?{payee:'สำนักงานประกันสังคม',lines:[{text:'เงินสมทบประกันสังคมส่วนนายจ้าง '+p.label,ref:x.no,amt:T.er,wht:0,rate:0},
     {text:'เงินสมทบประกันสังคมส่วนลูกจ้าง (หักจากเงินเดือน '+p.label+')',ref:p.payNo,amt:T.emp,wht:0,rate:0}],ded:[]}
   :{payee:'พนักงาน '+T.n+' คน',lines:[{text:'เงินเดือนและค่าจ้าง '+p.label+' ('+T.n+' คน)',ref:x.no,amt:T.gross,wht:0,rate:0}],
     ded:[{text:'หัก เงินสมทบประกันสังคม (ส่วนลูกจ้าง)',amt:T.emp}].concat(n(T.tax)?[{text:'หัก ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1)',amt:n(T.tax)}]:[])};}

 /* ---------- reports ---------- */
 const payExps=y=>(DB.expenses||[]).filter(x=>x&&x.cat===PCAT&&(y==null||inYear(x.date,y)));
 /* cash and payables: the salary is paid net; the employee's part leaves with the contribution */
 function cashAdj(y){let c=0;periods().forEach(p=>{if(p.cancelled)return;const a=expOf(p.payId),b=expOf(p.ssoId);
  if(!a||!b||+String(p.date).slice(0,4)>y)return;if(a.paid&&!b.paid)c+=p.totals.emp;else if(!a.paid&&b.paid)c-=p.totals.emp;
  const x=n(p.totals.tax);if(x){if(a.paid&&!p.taxRemit)c+=x;else if(!a.paid&&p.taxRemit)c-=x;}});return c;}   /* the tax withheld leaves when remitted */
 /* the tax withheld from salaries already paid, not yet remitted (trial balance: ภาษีหัก ณ ที่จ่ายค้างนำส่ง) */
 const taxOwed=y=>periods().reduce((a,p)=>{if(p.cancelled||!n(p.totals.tax)||p.taxRemit||+String(p.date).slice(0,4)>y)return a;const x=expOf(p.payId);return x&&x.paid?r2(a+n(p.totals.tax)):a;},0);
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
  const pay=r2(payExps(y).reduce((a,x)=>a+expTotals(x).base,0)),c=cashAdj(y);
  if(pay){f.payroll=pay;f.expBase=r2(f.expBase-pay);}   /* opex already holds them once: they are expenses */
  if(c){f.cash+=c;f.ap+=c;f.assetsTotal=f.cash+f.ar+f.inv+f.nbv;f.liab=f.ap+f.loanOut;f.equity=f.assetsTotal-f.liab;
   f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;}
  return f;};
 if(typeof expenseRank==='function'){const o=window.expenseRank;
  window.expenseRank=function(){return (o.apply(this,arguments)||[]).filter(r=>r.label!==PCAT);};}   /* they are in "เงินเดือนและสวัสดิการพนักงาน" */
 if(typeof trialBalance==='function'){const o=window.trialBalance;
  window.trialBalance=function(y){const out=o.apply(this,arguments),M=DB.map||{},from=expAcc(PCAT),to=M.ssoEr||'6011';
   const er=r2(payExps(y).filter(x=>x.payPart==='sso'||/^เงินสมทบประกันสังคมส่วนนายจ้าง/.test(String(x.desc||''))).reduce((a,x)=>a+expTotals(x).base,0));
   const wt=taxOwed(y),wc=M.whtOut;
   if(wt&&wc){let w=out.find(r=>r.code===wc);if(!w){w={code:wc,name:accName(wc),type:((DB.coa||[]).find(z=>z.code===wc)||{}).type||'',debit:0,credit:0};out.push(w);}w.credit=r2(w.credit+wt);}
   if(er&&from!==to){const a=out.find(r=>r.code===from);if(a){a.debit=r2(a.debit-er);let b=out.find(r=>r.code===to);
    if(!b){b={code:to,name:accName(to),type:((DB.coa||[]).find(z=>z.code===to)||{}).type||'',debit:0,credit:0};out.push(b);}b.debit=r2(b.debit+er);}}
   return out.filter(r=>Math.abs(r.debit)>=0.005||Math.abs(r.credit)>=0.005).sort((a,b)=>a.code.localeCompare(b.code));};}
 /* months of the year with staff and no recorded payroll (the health page says so) */
 function unrecorded(y){const last=+String(y)===+thisMonth().slice(0,4)?+thisMonth().slice(5,7):(+y<+thisMonth().slice(0,4)?12:0),out=[];
  for(let m=1;m<=last;m++){const mo=y+'-'+String(m).padStart(2,'0');if(!periodOf(mo)&&empListOfMonth(mo).length&&!payExps().some(x=>String(x.desc||'').includes(lbl(mo))))out.push(mo);}return out;}
 if(typeof renderHealth==='function'){const o=window.renderHealth;
  window.renderHealth=function(){const out=o.apply(this,arguments);
   try{const y=acctY(),f=finance(y),tb=$i('cashTbl')&&$i('cashTbl').tBodies[0];
    if(tb){const rows=[...tb.rows],at=t=>rows.find(r=>r.cells[0]&&r.cells[0].textContent.trim().startsWith(t));
     const paidPay=r2((DB.expenses||[]).filter(x=>x.paid&&x.cat===PCAT).reduce((a,x)=>a+expTotals(x).net,0)-cashAdj(y));
     const opx=at('จ่ายค่าใช้จ่ายดำเนินงาน'),pr=at('จ่ายเงินเดือนและประกันสังคม');
     if(opx)opx.cells[1].textContent='-'+money((DB.expenses||[]).filter(x=>x.paid&&x.cat!==PCAT).reduce((a,x)=>a+expTotals(x).net,0));
     if(pr){pr.cells[0].textContent='จ่ายเงินเดือนและประกันสังคม';pr.cells[1].textContent='-'+money(paidPay);}}
    const miss=unrecorded(y),host=$i('cashTbl');let el=$i('pkgPayMissing');
    if(host&&!el){el=document.createElement('p');el.id='pkgPayMissing';el.className='hint';el.style.margin='8px 0 0';(host.closest('.scroll')||host).after(el);}
    if(el){el.style.display=miss.length?'':'none';el.textContent=miss.length?'ยังไม่ได้บันทึกเงินเดือน '+miss.length+' เดือน ('+monthName(miss[0])+(miss.length>1?' – '+monthName(miss[miss.length-1]):'')+') — งบและเงินสดยังไม่มีเงินเดือนของเดือนเหล่านั้น (บันทึกที่ 06.4 จ่ายเงินเดือน)':'';}
   }catch(e){}
   return out;};}
 if(typeof renderFS==='function'){const o=window.renderFS;
  window.renderFS=function(){const out=o.apply(this,arguments);
   try{const y=acctY(),tb=$i('cfTbl')&&$i('cfTbl').tBodies[0];if(!tb)return out;const rows=[...tb.rows],at=t=>rows.find(r=>r.cells[0]&&r.cells[0].textContent.trim()===t);
    const paid=DB.expenses.filter(x=>x.paid&&inYear(x.payDate||x.date,y)),pay=paid.filter(x=>x.cat===PCAT);
    const a=at('เงินสดจ่ายค่าใช้จ่ายดำเนินงาน'),b=at('เงินสดจ่ายเงินเดือนและประกันสังคม');
    if(a)a.cells[1].textContent=money(paid.filter(x=>x.cat!==PCAT).reduce((s,x)=>s+expTotals(x).net,0));
    if(b)b.cells[1].textContent=money(r2(pay.reduce((s,x)=>s+expTotals(x).net,0)-cashAdj(y)));
   }catch(e){}
   return out;};}
 /* the tax report (X2): the recorded period of the month, nothing when there is none */
 if(typeof renderTax==='function'){const o=window.renderTax;
  window.renderTax=function(){const out=o.apply(this,arguments);
   try{const mo=acctM(),p=periodOf(mo),T=p?p.totals:{n:0,gross:0,emp:0,er:0,tax:0},rate=p?p.sso.rate:paramsOf(mo).rate;
    const st=$i('taxSumTbl')&&$i('taxSumTbl').tBodies[0];
    if(st)[...st.rows].forEach(r=>{const t=r.cells[0]&&r.cells[0].textContent.trim();if(!t||!r.cells[1])return;
     if(t.startsWith('เงินสมทบประกันสังคมนำส่ง'))r.cells[1].textContent=money(T.emp+T.er);
     if(t.startsWith('ฐานเงินเดือนสำหรับ ภ.ง.ด.1'))r.cells[1].textContent=money(T.gross);});
    /* the month's ภ.ง.ด.1 by the date the salaries were paid (task 3.8): a line of its own when there is tax withheld */
    const R=pnd1(mo),wt=r2(R.reduce((a,r)=>a+n(r.l.tax),0));
    if(st&&wt){const at=[...st.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim().startsWith('ฐานเงินเดือนสำหรับ ภ.ง.ด.1'));
     if(at)at.insertAdjacentHTML('afterend',`<tr><td>ภาษีเงินเดือนหัก ณ ที่จ่ายที่ต้องนำส่ง (ภ.ง.ด.1) ภายในวันที่ 7 ของเดือนถัดไป (ยื่นแบบกระดาษ) · นับตามวันที่จ่ายเงินเดือน</td><td class="num">${money(wt)}</td></tr>`);}
    const pt=$i('payrollTbl');if(pt){
     const th=pt.tHead&&pt.tHead.rows[0];
     if(th&&!th.querySelector('.pkg-pay-tax'))th.cells[5].insertAdjacentHTML('afterend','<th class="num pkg-pay-tax">ภาษีหัก ณ ที่จ่าย</th>');
     if(th&&th.cells[7]){th.cells[7].textContent='ลูกจ้าง '+rate+'%';th.cells[8].textContent='นายจ้าง '+rate+'%';}
     pt.tBodies[0].innerHTML=!payOk()?`<tr><td colspan="10" class="empty">${NO_PAY}</td></tr>`:p?p.lines.map(l=>`<tr><td>${esc(l.code)} · ${esc(l.name)}</td><td>${esc(l.position||'-')}</td>
      <td class="num">${money(r2(l.salary+l.regular))}${l.full?'':hint(l.days+' วัน')}</td><td class="num">${money(l.ot)}</td><td class="num">${money(l.bonus)}</td>
      <td class="num">${money(l.gross)}</td><td class="num">${money(n(l.tax))}</td><td class="num">${money(l.ssoEmp)}</td><td class="num">${money(l.ssoEr)}</td><td class="num">${money(l.ssoEmp+l.ssoEr)}</td></tr>`).join('')
      :`<tr><td colspan="10" class="empty">ยังไม่ได้บันทึกเงินเดือน${esc(lbl(mo))} (06.4 จ่ายเงินเดือน)</td></tr>`;
     pt.tFoot.innerHTML=!payOk()?'':`<tr><td colspan="5">รวม ${T.n} คน</td><td class="num">${money(T.gross)}</td><td class="num">${money(n(T.tax))}</td><td class="num">${money(T.emp)}</td><td class="num">${money(T.er)}</td><td class="num">${money(T.emp+T.er)}</td></tr>`;
     const h=pt.closest('.panel')&&pt.closest('.panel').querySelector('header');
     if(h&&!h.querySelector('[data-pnd1]'))h.insertAdjacentHTML('beforeend','<div class="spacer"></div><button type="button" class="btn sm gh" data-pnd1="1">พิมพ์สรุป ภ.ง.ด.1</button><button type="button" class="btn sm gh" data-cert50="1">พิมพ์ 50 ทวิ ประจำปีของพนักงาน</button>');}
   }catch(e){}
   return out;};}
 /* ---------- ภ.ง.ด.1 and the employees' certificates of the year (task 3.8) ---------- */
 const paidOn=p=>{const x=!p.cancelled&&expOf(p.payId);return x&&x.paid?String(x.payDate||x.date):'';};
 const idOf=id=>((DB.emp||[]).find(e=>e.id===id)||{}).idcard||'';
 /* what was paid in a month (by the day the salaries were paid), one row per employee and period */
 function pnd1(mo){const out=[];periods().forEach(p=>{const d=paidOn(p);if(d.slice(0,7)===mo)p.lines.forEach(l=>out.push({p,l,date:d}));});
  return out.sort((a,b)=>a.date.localeCompare(b.date)||String(a.l.code).localeCompare(String(b.l.code)));}
 function printPnd1(){if(!payOk())return toast(NO_PAY);const mo=acctM(),R=pnd1(mo);if(!R.length)return toast('เดือน '+monthName(mo)+' ยังไม่มีเงินเดือนที่จ่ายแล้ว');
  const g=r2(R.reduce((a,r)=>a+r.l.gross,0)),x=r2(R.reduce((a,r)=>a+n(r.l.tax),0)),k=R.filter(r=>n(r.l.tax)>0).length,ps=[...new Set(R.map(r=>r.p))];
  logAudit('expense',{id:ps[0].payId,no:ps[0].payNo},'print','สรุป ภ.ง.ด.1 เดือน '+monthName(mo)+' · '+R.length+' ราย · ภาษี '+money(x)+' บาท');save();
  printDocs(sheetTop({title:'สรุปภาษีเงินได้หัก ณ ที่จ่าย ภ.ง.ด.1',en:'P.N.D.1 SUMMARY',copy:'เอกสารภายใน',
    fields:[['เดือนที่จ่ายเงินได้',monthName(mo)],['ผู้มีเงินได้',R.length+' ราย'],['วันที่พิมพ์',thDate(iso())]]})+`
   <table><thead><tr><th style="width:40px">ลำดับที่</th><th style="width:120px">เลขประจำตัวผู้เสียภาษีอากร</th><th>ชื่อผู้มีเงินได้</th>
    <th style="width:80px">วันที่จ่าย</th><th style="width:95px">เงินได้ที่จ่าย</th><th style="width:95px">ภาษีที่หักนำส่ง</th><th style="width:55px">เงื่อนไข</th></tr></thead><tbody>
    ${R.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(idOf(r.l.empId)||'-')}</td><td>${esc(r.l.code)} · ${esc(r.l.name)}</td>
     <td style="text-align:center">${thDate(r.date)}</td><td class="num">${money(r.l.gross)}</td><td class="num">${money(n(r.l.tax))}</td><td style="text-align:center">1</td></tr>`).join('')}
    <tr><td colspan="4" style="text-align:right"><b>รวม ${R.length} ราย (หักภาษี ${k} ราย)</b></td><td class="num"><b>${money(g)}</b></td><td class="num"><b>${money(x)}</b></td><td></td></tr>
    <tr><td colspan="7">รวมภาษีที่นำส่ง (ตัวอักษร) <b>(${bahtText(x)})</b></td></tr></tbody></table>
   <div class="box"><span class="lbl">การนำส่ง (ภายในวันที่ 7 ${monthName(nextMonth(mo))} ยื่นแบบกระดาษ)</span><br>${ps.map(p=>esc(p.label)+': '+(n(p.totals.tax)
     ?(p.taxRemit?'นำส่งแล้ว '+thDate(p.taxRemit.date)+' · ใบสำคัญจ่าย '+esc(p.taxRemit.pvNo):'ยังไม่นำส่ง '+money(p.totals.tax)+' บาท'):'ไม่มีภาษีหัก ณ ที่จ่าย')).join('<br>')}
    <br><span class="lbl">เงื่อนไข 1 = หัก ณ ที่จ่าย · ให้ผู้ทำบัญชีตรวจก่อนยื่นแบบ</span></div>
   <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</span></div></div></div>`);}
 /* a year's pay by employee (paid in that year), in the order of their codes */
 function yearRows(y){const m=new Map();periods().forEach(p=>{if(paidOn(p).slice(0,4)!==String(y))return;
  p.lines.forEach(l=>{const a=m.get(l.empId)||{empId:l.empId,code:l.code,name:l.name,g:0,x:0,s:0};a.g=r2(a.g+l.gross);a.x=r2(a.x+n(l.tax));a.s=r2(a.s+l.ssoEmp);m.set(l.empId,a);});});
  return [...m.values()].sort((a,b)=>String(a.code).localeCompare(String(b.code)));}
 /* 50 ทวิ of the year for every employee paid in it: copies 1 and 2, a number of its own (MA-WH…, the one of task 3.4)
    given on the first print and kept on the employee for that year */
 function printCert50(){if(!canPay())return toast(payOk()?'บัญชีนี้ไม่มีสิทธิ์ออก 50 ทวิ ของพนักงาน (ต้องมีสิทธิ์บันทึกค่าใช้จ่าย)':NO_PAY);
  const y=+acctM().slice(0,4),R=yearRows(y),W=window.PKG_WHT_OUT;if(!R.length)return toast('ปี '+(y+543)+' ยังไม่มีเงินเดือนที่จ่ายแล้ว');if(!W||!W.sheet)return;
  const E=a=>(DB.emp||[]).find(e=>e.id===a.empId);
  R.forEach(a=>{const e=E(a);if(!e||(e.cert50&&e.cert50[y]))return;const old=Object.assign({},e);e.cert50=Object.assign({},e.cert50,{[y]:docNo('WH')});stampRec(e,old);});
  const no=a=>((E(a)||{}).cert50||{})[y]||'';
  logAudit('emp',{id:'cert50-'+y,no:'50 ทวิ ปี '+(y+543)},'print','หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) ปี '+(y+543)+' · พนักงาน '+R.length+' คน · '+R.map(a=>a.code+' '+no(a)).join(', '));save();
  printDocs(R.map((a,i)=>{const e=E(a)||{},v={form:'1',payee:a.name,tax:e.idcard||'',addr:e.addr||'',seq:i+1,when:'ปี '+(y+543),base:a.g,amt:a.x,sso:a.s,date:iso(),x:{whtCertNo:no(a)}};
   return W.sheet(v,1)+W.sheet(v,2);}).join(''));}
 const taxPane=$i('payrollTbl')&&$i('payrollTbl').closest('.panel');
 if(taxPane)taxPane.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pnd1)return printPnd1();if(b.dataset.cert50)return printCert50();});

 /* the home page's social security box: the month's recorded lines, else what it would be */
 if(typeof renderHome==='function'){const o=window.renderHome;
  window.renderHome=function(){const out=o.apply(this,arguments);
   try{const tb=$i('ssoTbl')&&$i('ssoTbl').tBodies[0],mo=($i('finMonth')||{}).value||thisMonth();if(!tb||!DB.emp.length)return out;
    const p=periodOf(mo),L=p?p.lines:rowsOf(mo),t=sum(L);
    tb.innerHTML=L.map(l=>`<tr><td>${esc(l.code)} · ${esc(l.name)}</td><td class="num">${money(l.gross)}</td><td class="num">${money(l.ssoEmp)}</td><td class="num">${money(l.ssoEr)}</td><td class="num">${money(l.ssoEmp+l.ssoEr)}</td></tr>`).join('')
     +`<tr style="background:#f6f8f9"><td><b>รวมนำส่งสำนักงานประกันสังคม</b></td><td class="num"><b>${money(t.g)}</b></td>
      <td class="num"><b>${money(t.e)}</b></td><td class="num"><b>${money(t.r)}</b></td><td class="num"><b>${money(t.e+t.r)}</b></td></tr>`;
    /* an estimate says so in the panel's tag: a line in the table would move everything below it */
    const tag=$i('ssoTag');if(tag){tag.textContent=L.length+' คน'+(p?'':' · ประมาณการ');tag.title=p?'':'ยังไม่ได้บันทึกเงินเดือน'+lbl(mo)+' (06.4 จ่ายเงินเดือน)';}
   }catch(e){}
   return out;};}

 /* ---------- the employee form: regular monthly income instead of fixed overtime and bonus (R12, R13-ข) ---------- */
 (function(){const sal=$i('eSalary'),lab=sal&&sal.closest('label');if(!lab||$i('eRegular'))return;
  const L=document.createElement('label');L.className='f';L.innerHTML='<span>เงินได้ประจำ (บาท/เดือน)</span><input type="number" id="eRegular" value="0" min="0">';
  lab.after(L);['eOt','eBonus'].forEach(id=>{const x=$i(id),l=x&&x.closest('label');if(l)l.style.display='none';});
  const pin=$i('ePin'),pl=pin&&pin.closest('label');if(pl&&!$i('eAddr')){const A=document.createElement('label');A.className='f';
   A.innerHTML='<span>ที่อยู่ (สำหรับ 50 ทวิ)</span><input type="text" id="eAddr" placeholder="ที่อยู่ตามบัตรประชาชน">';pl.after(A);}})();
 if(typeof openEmp==='function'){const o=window.openEmp;window.openEmp=function(id){const out=o.apply(this,arguments);
  const e=id?DB.emp.find(x=>x.id===id):null,el=$i('eRegular'),ad=$i('eAddr');if(el)el.value=n(e&&e.regular);if(ad)ad.value=(e&&e.addr)||'';return out;};}
 let empSaving=null;
 const sr0=window.stampRec;window.stampRec=function(rec,old){
  if(empSaving&&rec&&typeof rec==='object'&&'salary' in rec&&'perms' in rec){const v=Math.max(0,n(empSaving.regular));if(v>0||(old&&old.regular!=null))rec.regular=v;
   const a=String(empSaving.addr||'').trim();if(a||(old&&old.addr!=null))rec.addr=a;
   if(old&&old.cert50)rec.cert50=old.cert50;}   /* the numbers of the certificates already given (not in the form) */
  return sr0.apply(this,arguments);};
 if(typeof saveEmp==='function'){const o=window.saveEmp;window.saveEmp=function(){empSaving={regular:($i('eRegular')||{}).value,addr:($i('eAddr')||{}).value};try{return o.apply(this,arguments);}finally{empSaving=null;}};}

 /* ---------- menu 10: the law's figures, the shop's own with a warning and the audit log (R12 = ค) ---------- */
 const F=['sSsoRate','sSsoCap','sSsoMin','sSsoMax'],K=['rate','cap','min','max'];
 function fillSso(){const P=paramsOf(thisMonth()),L=lawOf(thisMonth());F.forEach((id,i)=>{const el=$i(id);if(el)el.value=P[K[i]];});
  /* in the panel's header (beside its title): nothing below moves */
  const head=$i('sSsoMax')&&$i('sSsoMax').closest('.panel'),h=head&&head.querySelector('header');if(!h)return;let el=$i('pkgSsoLaw');
  if(!el){el=document.createElement('span');el.id='pkgSsoLaw';el.className='hint';el.style.marginLeft='12px';h.append(el);}
  const o=own();el.textContent='ประกันสังคมตามกฎหมาย (ตั้งแต่ '+monthName(L.from==='0000-01'?thisMonth():L.from)+'): '+L.rate+'% · ฐาน '+money0(L.min)+' – '+money0(L.max)
   +' · หักสูงสุด '+money0(L.cap)+' บาท — ระบบปรับให้เอง'
   +(o?' · ตอนนี้ใช้ค่าที่ร้านตั้งเอง ('+o.rate+'% · ฐาน '+money0(o.min)+' – '+money0(o.max)+' · หักสูงสุด '+money0(withCap(o).cap)+') ตั้งแต่ '+monthName(o.from)+' โดย '+(o.by||'-'):'');}
 if(typeof fillSetting==='function'){const o=window.fillSetting;window.fillSetting=function(){const out=o.apply(this,arguments);try{fillSso();}catch(e){}return out;};}
 if(typeof saveSetting==='function'){const o=window.saveSetting;
  window.saveSetting=async function(){
   if(!can('doc.orgEdit'))return o.apply(this,arguments);
   const mo=thisMonth(),v=withCap(Object.fromEntries(K.map((k,i)=>[k,n(($i(F[i])||{}).value)]))),P=paramsOf(mo),L=lawOf(mo);
   const same=(a,b)=>K.every(k=>Math.abs(n(a[k])-n(b[k]))<0.005);let set;
   if(!same(v,P)){if(same(v,L))set=null;
    else{if(!await askP({title:'อัตราประกันสังคมต่างจากกฎหมาย',text:'ตามกฎหมาย: '+L.rate+'% ฐาน '+money0(L.min)+' – '+money0(L.max)+' บาท หักสูงสุด '+money0(L.cap)
     +' บาท\nที่กรอก: '+v.rate+'% ฐาน '+money0(v.min)+' – '+money0(v.max)+' บาท หักสูงสุด '+money0(v.cap)+' บาท\nใช้ค่าที่กรอกกับเงินเดือนตั้งแต่งวด '+monthName(mo)+' เป็นต้นไป — ระบบจะไม่ปรับตามกฎหมายให้จนกว่าจะกลับไปใช้ค่าตามกฎหมาย',
     yes:'ใช้ค่าที่ร้านตั้ง',no:'ไม่เปลี่ยน'})){fillSso();return;}
     set=Object.assign({},v,{from:mo,at:nowTs(),by:meName()});}}
   /* the legacy save writes the fields into DB.shop.sso…: give it the stored values, so nothing changes there */
   const s=DB.shop||{},keep=[s.ssoRate||5,s.ssoCap||750,s.ssoMin||1650,s.ssoMax||15000];F.forEach((id,i)=>{const el=$i(id);if(el)el.value=keep[i];});
   let out;try{out=await o.apply(this,arguments);}finally{fillSso();}
   if(set!==undefined){if(set)DB.shop.ssoOwn=set;else delete DB.shop.ssoOwn;
    logAudit('setting',{id:'sso',no:'ประกันสังคม'},'save',set?'ตั้งอัตราประกันสังคมเอง '+set.rate+'% ฐาน '+money0(set.min)+' – '+money0(set.max)+' หักสูงสุด '+money0(set.cap)
     +' บาท ตั้งแต่ '+monthName(mo)+' (กฎหมาย: '+L.rate+'% ฐาน '+money0(L.min)+' – '+money0(L.max)+')':'กลับไปใช้อัตราประกันสังคมตามกฎหมาย');
    save();fillSso();}
   return out;};}
 if(typeof AUD_KIND==='object'&&!AUD_KIND.setting)AUD_KIND.setting='ตั้งค่าองค์กร';
 try{fillSso();}catch(e){}

 window.PKG_PAYROLL={LAW,lawOf,paramsOf,lineOf,rowsOf,periodOf,periods,voucher,paySalary,paySso,cancelPeriod,printSlips,payTax,remitVoucher,pnd1,printPnd1,yearRows,printCert50};
})();
