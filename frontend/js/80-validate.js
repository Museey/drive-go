/* DriveGo new system (team's check of 2026-11-18; the owner approved group ก of the checks and their messages on
   2026-11-20, and "ปี ค.ศ. ให้แปลงเป็น พ.ศ. เอง"): what a form takes is checked before the original save runs.
   Blocked (a message, the form stays open): phone numbers (9–10 digits each; several split by , / ; and an extension
   "ต่อ 12" / "ext 12" / "#12" allowed; +66 / 66 followed by 8–9 digits), postcodes (5 digits), mileage (a whole number,
   0 or more), the year a car was registered (พ.ศ. 4 digits from 2490 to next year; a ค.ศ. year 1947 to next year is
   turned into พ.ศ. in the field first), selling prices A–C and Min / Max of a part (not below 0; Min not above Max when
   Max is set). Warned (the person may save anyway): a new customer whose name, 13-digit tax ID (and branch) or phone is
   already a customer's; a plate (with its province) already on another customer's car; a new vendor whose name (its
   legal form read alike: บจก. = บริษัท … จำกัด, but not หจก.) or 13-digit tax ID is already a vendor's.
   Only values a person typed or changed are checked: the record's stored values pass as they are. Tax IDs, credit days
   and negative stock or cost wait for the accountant (round 4, T04–T08). The CSV imports use the same checks (28.js,
   29.js, 03.js impStockApply). */
(function(){
 if(typeof DB==='undefined'||typeof toast!=='function'||typeof askP!=='function')return;
 const $i=id=>document.getElementById(id),val=id=>{const e=$i(id);return e?String(e.value).trim():'';};
 const MSG={tel:'เบอร์โทรไม่ถูกต้อง — กรอกเลข 9-10 หลัก',zip:'รหัสไปรษณีย์ต้องเป็นเลข 5 หลัก',mile:'เลขไมล์ต้องเป็นตัวเลข 0 ขึ้นไป',
  year:'ปีจดทะเบียนต้องเป็นปี พ.ศ. 4 หลัก เช่น 2565',price:'ราคา จำนวน และ Min / Max ต้องเป็นตัวเลขไม่ติดลบ',minmax:'Min — จุดสั่งซื้อ ต้องไม่มากกว่า Max'};

 /* ---------- the checks (also read by the CSV imports) ---------- */
 function tel(s){s=String(s==null?'':s).trim();if(!s)return true;
  return s.split(/[,\/;]/).every(p=>{p=p.trim();if(!p)return false;
   const m=/^(.*?)\s*(?:(?:ต่อ|ext\.?|#)\s*\d{1,6})$/i.exec(p),main=(m?m[1]:p).trim();
   if(!/^[0-9+\-(). ]+$/.test(main))return false;
   let d=main.replace(/\D/g,'');
   if(/^\+\s*66/.test(main)||(d.length===11&&d.startsWith('66'))){d=d.slice(2);return d.length>=8&&d.length<=9;}
   return d.length>=9&&d.length<=10;});}
 const zip=s=>{s=String(s==null?'':s).trim();return!s||/^\d{5}$/.test(s);};
 /* a mileage as typed: '' (none), or a whole number 0–9,999,999 (commas allowed); null when it is not one */
 const mile=s=>{s=String(s==null?'':s).replace(/,/g,'').trim();if(!s)return'';return /^\d{1,7}$/.test(s)?String(+s):null;};
 /* a registration year as typed: '' (none), the พ.ศ. year (a ค.ศ. year turned into one), or null when it is not one */
 const thisCE=()=>+String(typeof iso==='function'?iso():new Date().toISOString()).slice(0,4);
 function year(s){s=String(s==null?'':s).trim();if(!s)return'';if(!/^\d{4}$/.test(s))return null;
  const y=+s,top=thisCE()+1;
  if(y>=1947&&y<=top)return String(y+543);
  return y>=2490&&y<=top+543?s:null;}
 const num=s=>{s=String(s==null?'':s).replace(/,/g,'').trim();return!s?0:/^-?\d+(\.\d+)?$/.test(s)?+s:null;};
 /* a vendor's name for matching: the legal form kept apart (บจก. = บริษัท … จำกัด, หจก. = ห้างหุ้นส่วนจำกัด, บมจ. = … มหาชน) */
 function venKey(s){const C=window.PKG_CUST_IMPORT,t=String(s==null?'':s).replace(/\s+/g,' ').trim();
  const form=/^(บมจ\.?|บริษัทมหาชน)|\(?มหาชน\)?/.test(t)?'pcl':/^(บริษัท|บจก\.?)/.test(t)?'co':/^(ห้างหุ้นส่วนจำกัด|หจก\.?)/.test(t)?'lp':/^(ห้างหุ้นส่วนสามัญ|หสม\.?)/.test(t)?'op':'';
  return {form,k:C&&C.nameKey?C.nameKey(t):t.toLowerCase()};}
 const sameVen=(a,b)=>a.k===b.k&&(!a.form||!b.form||a.form===b.form);
 const tax13=s=>{const d=String(s==null?'':s).replace(/\D/g,'');return d.length===13?d:'';};
 const telKey=s=>String(s==null?'':s).split(/[,\/;]/).map(p=>{let d=p.replace(/\D/g,'');if(d.length===11&&d.startsWith('66'))d=d.slice(2);return d.replace(/^0+/,'');}).filter(d=>d.length>=8);
 const plateKey=v=>String((v.plateL||'')+(v.plateN||'')).toLowerCase().replace(/[\s.\-]/g,'');
 window.PKG_VALID={tel,zip,mile,year,num,venKey,sameVen,MSG};

 const stop=(msg,id)=>{toast(msg);const e=id&&$i(id);if(e)try{e.focus();}catch(x){}return false;};
 const lines=(list,why)=>list.slice(0,5).map(x=>x.label+' ('+why(x).join(', ')+')').join('\n')+(list.length>5?'\nและอีก '+(list.length-5)+' ราย':'');
 /* runs check() first: false = stopped (message shown), a promise = asked (true goes on), anything else goes on */
 function guard(name,check){const o=window[name];if(typeof o!=='function')return;
  window[name]=function(){const self=this,args=arguments;let r;try{r=check();}catch(e){r=null;}
   if(r===false)return false;
   if(r&&typeof r.then==='function')return r.then(ok=>ok?o.apply(self,args):false);
   return o.apply(self,args);};}

 /* ---------- 02 customer ---------- */
 guard('saveCust',function(){
  if(typeof can==='function'&&!can('doc.custEdit'))return;if(!val('cName'))return;
  const id=typeof editCustId!=='undefined'?editCustId:null,old=id?(DB.cust||[]).find(x=>x.id===id):null;
  for(const f of ['cTel','cTel2']){const v=val(f),was=old?String((f==='cTel'?old.tel:old.tel2)||'').trim():null;if(v!==was&&!tel(v))return stop(MSG.tel,f);}
  {const v=val('aZip');if(v!==(old?String((old.addr||{}).zip||'').trim():null)&&!zip(v))return stop(MSG.zip,'aZip');}
  const olds=(old&&old.vehicles)||[],rows=[...document.querySelectorAll('#vehWrap > div.grid')];
  for(const r of rows){const q=c=>r.querySelector(c),pl=q('.vPL'),pn=q('.vPN');if(!pl||!pn)continue;
   const was=olds.find(v=>String(v.plateL||'').trim()===pl.value.trim()&&String(v.plateN||'').trim()===pn.value.trim()&&(pl.value.trim()||pn.value.trim()));
   const mi=q('.vMile');if(mi&&(!was||String(was.mile||'')!==mi.value)&&((mi.validity&&mi.validity.badInput)||mile(mi.value)===null)){toast(MSG.mile);mi.focus();return false;}
   const yr=q('.vYear');if(yr&&(!was||String(was.year||'').trim()!==yr.value.trim())){const y=year(yr.value);if(y===null){toast(MSG.year);yr.focus();return false;}if(y!==yr.value.trim())yr.value=y;}
  }
  /* warnings: a new customer like one there is; a plate on another customer's car */
  const ask=[];
  if(!old){const C=window.PKG_CUST_IMPORT,nk=C&&C.nameKey?C.nameKey:(s=>String(s||'').trim().toLowerCase());
   const me={nm:nk(val('cName')),co:nk(val('cCompany')),tax:tax13(val('cTax')),br:val('cBranch'),tels:telKey(val('cTel')).concat(telKey(val('cTel2')))};
   const hits=(DB.cust||[]).map(c=>{const why=[];
    if(me.nm&&(nk(c.name)===me.nm||(me.co&&nk(c.company)===me.co)))why.push('ชื่อเดียวกัน');
    if(me.tax&&tax13(c.tax)===me.tax&&String(c.branch||'').trim()===me.br)why.push('เลขผู้เสียภาษีเดียวกัน');
    const ct=telKey(c.tel).concat(telKey(c.tel2));if(me.tels.some(t=>ct.includes(t)))why.push('เบอร์โทรเดียวกัน');
    return why.length?{label:[c.code,typeof custName==='function'?custName(c):c.name].filter(Boolean).join(' ')+(c.tel?' · '+c.tel:''),why}:null;}).filter(Boolean);
   if(hits.length)ask.push({title:'มีลูกค้าที่คล้ายกันอยู่แล้ว',text:'พบในระบบ:\n'+lines(hits,x=>x.why)+'\n\nบันทึกเป็นลูกค้าใหม่อีกรายหรือไม่?',yes:'บันทึกเป็นรายใหม่',no:'กลับไปแก้ไข'});}
  const seen=new Set();
  rows.forEach(r=>{const v={plateL:(r.querySelector('.vPL')||{}).value||'',plateN:(r.querySelector('.vPN')||{}).value||'',plateProv:(r.querySelector('.vPP')||{}).value||''},k=plateKey(v);
   if(!k||!String(v.plateN).trim()||seen.has(k+'|'+v.plateProv))return;seen.add(k+'|'+v.plateProv);
   if(olds.some(w=>plateKey(w)===k&&(w.plateProv||'')===v.plateProv))return;   /* already this customer's */
   const other=(DB.cust||[]).find(c=>(!old||c.id!==old.id)&&(c.vehicles||[]).some(w=>plateKey(w)===k&&(!w.plateProv||!v.plateProv||w.plateProv===v.plateProv)));
   if(other)ask.push({title:'ทะเบียนรถซ้ำ',text:'ทะเบียน '+(String(v.plateL).trim()+' '+String(v.plateN).trim()).trim()+' '+v.plateProv+' เป็นรถของ '+[other.code,typeof custName==='function'?custName(other):other.name].filter(Boolean).join(' ')+' อยู่แล้ว — บันทึกต่อหรือไม่ (เช่น รถเปลี่ยนเจ้าของ)',yes:'บันทึกต่อ',no:'กลับไปแก้ไข'});});
  if(!ask.length)return;
  return ask.reduce((p,q)=>p.then(ok=>ok&&askP(q)),Promise.resolve(true));
 });

 /* ---------- 05 vendor ---------- */
 guard('saveVen',function(){
  if(typeof can==='function'&&!can('doc.venEdit'))return;if(!val('vName'))return;
  const id=typeof editVenId!=='undefined'?editVenId:null,old=id?(DB.vendors||[]).find(x=>x.id===id):null;
  for(const f of ['vTel','vTel2']){const v=val(f),was=old?String((f==='vTel'?old.tel:old.tel2)||'').trim():null;if(v!==was&&!tel(v))return stop(MSG.tel,f);}
  {const v=val('vZip');if(v!==(old?String((old.addr||{}).zip||'').trim():null)&&!zip(v))return stop(MSG.zip,'vZip');}
  if(old)return;
  const me=venKey(val('vName')),tx=tax13(val('vTax'));
  const hits=(DB.vendors||[]).map(v=>{const why=[];if(sameVen(venKey(v.name),me))why.push('ชื่อเดียวกัน');if(tx&&tax13(v.tax)===tx)why.push('เลขผู้เสียภาษีเดียวกัน');
   return why.length?{label:[v.code,v.name].filter(Boolean).join(' ')+(v.tel?' · '+v.tel:''),why}:null;}).filter(Boolean);
  if(hits.length)return askP({title:'มีผู้ขายที่คล้ายกันอยู่แล้ว',text:'พบในระบบ:\n'+lines(hits,x=>x.why)+'\n\nบันทึกเป็นผู้ขายใหม่อีกรายหรือไม่?',yes:'บันทึกเป็นรายใหม่',no:'กลับไปแก้ไข'});
 });

 /* ---------- 07 part: selling prices and Min / Max ---------- */
 guard('saveStock',function(){
  if(typeof can==='function'&&!can('stock.edit'))return;if(!val('fCode')||!val('fName'))return;
  const id=typeof editStockId!=='undefined'?editStockId:null,old=id?(DB.stock||[]).find(x=>x.id===id):null;
  const F={fPA:'pa',fPB:'pb',fPC:'pc',fMin:'min',fMax:'max'};let changed=false;
  for(const [f,k] of Object.entries(F)){const e=$i(f);if(!e)continue;const v=num(e.value),bad=(e.validity&&e.validity.badInput)||v===null;
   if(old&&!bad&&v===n(old[k]))continue;changed=true;if(bad||v<0)return stop(MSG.price,f);}
  const mn=num(val('fMin')),mx=num(val('fMax'));
  if(changed&&mx>0&&mn>mx)return stop(MSG.minmax,'fMin');
 });

 /* ---------- 10 the shop's phone · 09 an employee's phone ---------- */
 guard('saveSetting',function(){const was=String(((DB.shop||{}).tel)||'').trim(),v=val('sTel');if(v!==was&&!tel(v))return stop(MSG.tel,'sTel');});
 guard('saveEmp',function(){
  const id=typeof editEmpId!=='undefined'?editEmpId:null,old=id?(DB.emp||[]).find(x=>x.id===id):null,v=val('eTel');
  if(v!==(old?String(old.tel||'').trim():null)&&!tel(v))return stop(MSG.tel,'eTel');});

 /* ---------- 03 quote: its mileage ---------- */
 guard('saveQuote',function(){const e=$i('qMile');if(!e)return;
  const old=typeof Q!=='undefined'&&Q&&Q.id?(DB.quotes||[]).find(x=>x.id===Q.id):null;
  if(old&&String(old.mile||'')===e.value)return;
  if((e.validity&&e.validity.badInput)||mile(e.value)===null)return stop(MSG.mile,'qMile');});
})();
