/* Customer import · 1 row = 1 car (user 2026-09-30: customers / companies with 2–100 cars, and more cars coming later).
   Rows of the same customer become one customer with many cars. A customer already in the system only gets the cars it
   doesn't have yet — its own details are never changed. Same customer = same 13-digit tax ID, else the same company name
   (บจก. / บริษัท … จำกัด / หจก. read alike) or the same person name with no conflicting phone. A car already on that customer
   (same plate + province, or same VIN) is skipped. The form keeps the original 11 columns first, so old files still import,
   and adds optional car columns; the 11.3 customer download writes this layout, so it imports back without duplicates. */
(()=>{
 if(typeof impCustApply!=='function'||typeof DB==='undefined')return;
 const HEAD=['ชื่อลูกค้า*','ชื่อบริษัท (ถ้าเป็นนิติบุคคล)','เบอร์โทร','เบอร์สำรอง','เลขผู้เสียภาษี','ที่อยู่','จังหวัด',
  'ทะเบียนรถ','จังหวัดทะเบียน','ยี่ห้อรถ','รุ่นรถ','สีรถ','ปีจดทะเบียน','เลขตัวถัง (VIN)','เลขเครื่องยนต์','เลขไมล์ล่าสุด'];
 const EXAMPLE=[
  ['สมชาย ใจดี','','0812345678','','','123 ถ.สุขุมวิท','กรุงเทพมหานคร','1กข 4567','กรุงเทพมหานคร','Toyota','Vigo','ขาว','2560','','',''],
  ['วิภา รุ่งเรือง','บริษัท ขนส่งไทย จำกัด','021234567','0899999999','0105561234567','99 ถ.บางนา','สมุทรปราการ','2ฮค 8899','สมุทรปราการ','Isuzu','D-Max','ขาว','2565','MP1TFR86JP0123456','4JK1-889900','85000'],
  ['วิภา รุ่งเรือง','บริษัท ขนส่งไทย จำกัด','','','','','','2ฮค 8900','สมุทรปราการ','Isuzu','D-Max','ขาว','2565','','',''],
  ['วิภา รุ่งเรือง','บริษัท ขนส่งไทย จำกัด','','','','','','70-1234','สมุทรปราการ','Hino','500','','2563','','','']];
 /* ---------- reading a cell the way people type it ---------- */
 const low=s=>String(s==null?'':s).replace(/\s+/g,' ').trim().toLowerCase();
 const dig=s=>String(s==null?'':s).replace(/\D/g,'');
 const taxKey=s=>{const d=dig(s);return d.length===13?d:'';};          /* Excel's 1.05561E+12 is not a tax ID — ignored for matching */
 const telKey=s=>{let d=dig(s);if(d.length===11&&d.startsWith('66'))d=d.slice(2);return d.replace(/^0+/,'');};
 const telFix=s=>{s=String(s||'').trim();return /^[689]\d{8}$/.test(s)||/^[2-7]\d{7}$/.test(s)?'0'+s:s;};   /* Excel drops the leading 0 */
 const nameKey=s=>low(s).replace(/^(บริษัท|บจก\.?|ห้างหุ้นส่วนจำกัด|หจก\.?|บมจ\.?)\s*/,'').replace(/\s*(จำกัด\s*\(มหาชน\)|\(มหาชน\)|จำกัด)$/,'').replace(/[\s.]/g,'');
 /* brand / province as the customer form's lists write them — a value off the list shows as the list's first entry in the form */
 const OTHER=BRANDS.find(b=>/^อื่น/.test(b))||'';
 const bKey=s=>low(String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'')).replace(/[^0-9a-z฀-๿]/g,'');
 const BRAND=new Map();
 BRANDS.forEach(b=>{const en=b.replace(/\s*\(.*\)\s*$/,''),th=(b.match(/\(([^)]*)\)/)||[])[1]||'';
  [b,en,th,...en.split('/')].forEach(a=>{const k=bKey(a);if(k&&!BRAND.has(k))BRAND.set(k,b);});});
 [['benz','Mercedes'],['เบนซ์','Mercedes'],['vw','Volkswagen'],['ud','UD Trucks'],['chevy','Chevrolet'],['haval','GWM']].forEach(([a,to])=>{const b=BRANDS.find(x=>x.startsWith(to));if(b&&!BRAND.has(bKey(a)))BRAND.set(bKey(a),b);});
 const brandOf=(b,model)=>{b=String(b||'').trim();if(!b)return{brand:'',model};const hit=BRAND.get(bKey(b));
  return hit?{brand:hit,model}:OTHER?{brand:OTHER,model:[b,model].filter(Boolean).join(' ')}:{brand:b,model};};   /* the form's own rule: "อื่น ๆ (ระบุในรุ่นรถ)" */
 const provOf=p=>{p=String(p||'').replace(/\s+/g,' ').trim().replace(/^(จ\.|จังหวัด)\s*/,'');if(!p)return'';
  if(/^(กทม\.?|กรุงเทพ(ฯ|ฯ\.|มหานคร)?|bangkok|bkk)$/i.test(p))return'กรุงเทพมหานคร';if(p==='อยุธยา')return'พระนครศรีอยุธยา';
  const k=p.replace(/\s/g,'');return PROVINCES.find(x=>x.replace(/\s/g,'')===k)||p;};
 const splitPlate=p=>{p=String(p||'').replace(/\s+/g,' ').trim();if(!p)return['',''];
  const sp=p.split(' ');if(sp.length>1){const N=sp.pop();return[sp.join(' '),N];}   /* as the original import: the last group is the number */
  const m=p.match(/^(\d?[ก-ฮ]{1,3})-?(\d{1,4})$/);return m?[m[1],m[2]]:[p,''];};
 const plateKey=v=>low((v.plateL||'')+(v.plateN||'')).replace(/[\s.\-]/g,''),vinKey=v=>low(v.vin).replace(/[\s\-]/g,'');
 const sig=v=>{const b=brandOf(v.brand,v.model);return[b.brand,low(b.model),low(v.color),low(v.year)].join('|');};
 /* same car: same VIN, or same plate (+ province when both have one). loose: a car with neither plate nor VIN already in
    the system counts as the same when make, model, colour and year match — so importing a file twice adds nothing */
 const sameCar=(a,b,loose)=>{const va=vinKey(a),vb=vinKey(b);if(va&&va===vb)return true;const pa=plateKey(a),pb=plateKey(b);
  if(pa||pb)return pa===pb&&(!a.plateProv||!b.plateProv||a.plateProv===b.plateProv);
  return!!loose&&!(va&&vb)&&sig(a)===sig(b);};
 const carOf=r=>{const[L,N]=splitPlate(r.plate),b=brandOf(r.brand,r.model),m=(String(r.mile||'').replace(/,/g,'').match(/\d+(\.\d+)?/)||[''])[0];
  const v={brand:b.brand,model:b.model,color:r.color,plateL:L,plateN:N,plateProv:provOf(r.pprov),mile:m?String(Math.round(+m)):'',engine:r.engine,vin:r.vin,year:r.year};
  return(L||v.brand||v.model||v.vin||v.engine)?v:null;};
 /* ---------- who is who ---------- */
 const ident=(name,company,tax,tel,tel2)=>({tax:taxKey(tax),nm:nameKey(name),co:nameKey(company),tels:[telKey(tel),telKey(tel2)].filter(Boolean)});
 function same(r,c){                 /* r: a row · c: a customer in the system or one started earlier in this file */
  if(r.tax&&c.tax)return r.tax===c.tax;
  if(r.co&&!c.co)return false;       /* a company row never joins a private customer */
  if(c.co&&(r.co===c.co||r.nm===c.co))return true;   /* the company's name is enough, in either column */
  if(r.co&&c.co)return false;
  if(!r.nm||r.nm!==c.nm)return false;
  return!r.tels.length||!c.tels.length||r.tels.some(t=>c.tels.includes(t));
 }
 const WHY={noname:'ไม่มีชื่อลูกค้า',many:'ชื่อตรงกับลูกค้าในระบบหลายราย (ใส่เบอร์หรือเลขผู้เสียภาษีเพื่อระบุ)',dup:'รถคันนี้มีอยู่แล้ว',nocar:'ลูกค้ามีอยู่แล้ว ไม่มีรถใหม่'};
 /* Work out what the file would do, without touching the data (also used by the tests). */
 function plan(rows){
  const ids=new Map(DB.cust.map(c=>[c,ident(c.name,c.company,c.tax,c.tel,c.tel2)]));
  const owners=new Map();            /* plate / VIN → customers already holding that car */
  const own=(k,c)=>{if(k){if(!owners.has(k))owners.set(k,[]);owners.get(k).push(c);}};
  DB.cust.forEach(c=>(c.vehicles||[]).forEach(v=>{own('p'+plateKey(v),c);own('v'+vinKey(v),c);}));
  const heldElsewhere=(car,c)=>['p'+plateKey(car),'v'+vinKey(car)].some(k=>k.length>1&&(owners.get(k)||[]).some(x=>x!==c));
  const groups=[],skip={};let elsewhere=0;
  const miss=k=>{skip[k]=(skip[k]||0)+1;};
  rows.forEach(raw=>{
   const g=i=>String(raw[i]==null?'':raw[i]).trim();
   const r={name:g(0),company:g(1),tel:telFix(g(2)),tel2:telFix(g(3)),tax:g(4),addr:g(5),prov:g(6),plate:g(7),pprov:g(8),brand:g(9),model:g(10),color:g(11),year:g(12),vin:g(13),engine:g(14),mile:g(15)};
   const id=ident(r.name,r.company,r.tax,r.tel,r.tel2),car=carOf(r);
   if(!id.nm&&!id.co&&!id.tax)return miss('noname');
   let grp=null,started=false;
   for(let i=groups.length-1;i>=0&&!grp;i--)if(same(id,groups[i].id))grp=groups[i];
   if(grp&&grp.rec){const c=grp.rec;               /* details may sit on any row of a new customer: fill the blanks */
    if(!c.company&&r.company){c.company=r.company;c.type='company';}if(!c.tel&&r.tel)c.tel=r.tel;if(!c.tel2&&r.tel2)c.tel2=r.tel2;if(!c.tax&&r.tax)c.tax=r.tax;
    if(!c.addr.no&&r.addr)c.addr.no=r.addr;if(!c.addr.prov&&r.prov)c.addr.prov=provOf(r.prov);
    if(!grp.id.co)grp.id.co=id.co;if(!grp.id.tax)grp.id.tax=id.tax;id.tels.forEach(t=>{if(!grp.id.tels.includes(t))grp.id.tels.push(t);});}
   if(!grp){
    let c=DB.cust.filter(x=>same(id,ids.get(x)));
    if(c.length>1&&id.tax){const t=c.filter(x=>ids.get(x).tax===id.tax);if(t.length)c=t;}
    if(c.length>1&&car){const t=c.filter(x=>(x.vehicles||[]).some(v=>sameCar(v,car)));if(t.length)c=t;}
    if(c.length>1){const t=c.filter(x=>ids.get(x).nm===id.nm&&ids.get(x).co===id.co);if(t.length===1)c=t;}
    if(c.length>1)return miss('many');
    if(c.length)groups.push(grp={cust:c[0],id:ids.get(c[0]),cars:[]});
    else{if(!r.name)return miss('noname');started=true;
     groups.push(grp={rec:{id:uid(),type:r.company?'company':'person',tax:r.tax,name:r.name,company:r.company,branch:'',tier:'B',stars:0,
      addr:{no:r.addr,village:'',moo:'',soi:'',road:'',sub:'',dist:'',prov:provOf(r.prov),zip:''},tel:r.tel,tel2:r.tel2,vehicles:[]},
      id:Object.assign({},id,{tels:id.tels.slice()}),cars:[]});}
   }
   if(!car){if(!started&&!grp.rec)miss('nocar');return;}
   if((grp.cust?grp.cust.vehicles||[]:[]).some(v=>sameCar(v,car,true))||grp.cars.some(v=>sameCar(v,car)))return miss('dup');
   if(heldElsewhere(car,grp.cust)||groups.some(o=>o!==grp&&o.cars.some(v=>sameCar(v,car))))elsewhere++;
   grp.cars.push(car);
  });
  const fresh=groups.filter(g=>g.rec),old=groups.filter(g=>g.cust&&g.cars.length);
  return{fresh,old,skip,elsewhere,carsNew:fresh.reduce((s,g)=>s+g.cars.length,0),carsOld:old.reduce((s,g)=>s+g.cars.length,0),
   skipped:Object.values(skip).reduce((a,b)=>a+b,0),why:Object.entries(skip).map(([k,v])=>WHY[k]+' '+v).join(' · ')};
 }
 async function apply(rows){
  if(!can('doc.custEdit'))return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขข้อมูลลูกค้า');
  const p=plan(rows),{fresh,old}=p;
  if(!fresh.length&&!p.carsOld)return toast('ไม่มีรายการใหม่ให้เพิ่ม'+(p.skipped?' — ข้าม '+p.skipped+' แถว ('+p.why+')':''));
  const nm=g=>esc(custName(g.cust||g.rec)),few=(a,f)=>a.slice(0,4).map(f).join(', ')+(a.length>4?' และอีก '+(a.length-4)+' ราย':'');
  const line=(b,s,cls)=>`<div class="pkg-imp-l${cls?' '+cls:''}"><b>${b}</b>${s?`<div class="hint">${s}</div>`:''}</div>`;
  const msg=(fresh.length?line('ลูกค้าใหม่ '+fresh.length+' ราย · รถ '+p.carsNew+' คัน',few(fresh,g=>nm(g)+(g.cars.length>1?' ('+g.cars.length+' คัน)':''))):'')
   +(p.carsOld?line('เพิ่มรถให้ลูกค้าเดิม '+old.length+' ราย · '+p.carsOld+' คัน',few(old,g=>nm(g)+' +'+g.cars.length+' คัน')):'')
   +(p.skipped?line('ข้าม '+p.skipped+' แถว',esc(p.why),'skip'):'')
   +(p.elsewhere?line('ทะเบียน / เลขตัวถังตรงกับรถของลูกค้ารายอื่น '+p.elsewhere+' คัน','ยังเพิ่มตามไฟล์ — ตรวจภายหลังได้ในเมนู 02','warn'):'')
   +'<div class="pkg-imp-q">ข้อมูลของลูกค้าเดิมจะไม่ถูกแก้ไข · ยืนยันนำเข้า?</div>';
  if(!await askP({title:'นำเข้าลูกค้า / รถจาก CSV',msg,yes:'นำเข้า',no:'ยกเลิก'}))return;
  fresh.forEach(g=>{const c=g.rec;c.type=c.company?'company':'person';c.vehicles=g.cars;stampRec(c,null);DB.cust.push(c);});
  old.forEach(g=>{const c=g.cust;c.vehicles=(c.vehicles||[]).concat(g.cars);stampRec(c,c);
   logAudit('cust',{id:c.id,no:c.name},'save','เพิ่มรถจากไฟล์ CSV '+g.cars.length+' คัน · รวม '+c.vehicles.length+' คัน');});
  const sum=[fresh.length?'ลูกค้าใหม่ '+fresh.length+' ราย':'',p.carsOld?'เพิ่มรถให้ลูกค้าเดิม '+old.length+' ราย':'','รถ '+(p.carsNew+p.carsOld)+' คัน'].filter(Boolean).join(' · ');
  logAudit('cust',{id:'',no:'CSV'},'save','นำเข้าลูกค้าจากไฟล์ · '+sum+(p.skipped?' · ข้าม '+p.skipped+' แถว':''));
  save();renderCust();if(typeof renderGrade==='function')renderGrade();refreshQuoteRefs();
  saveFx('นำเข้าลูกค้า / รถแล้ว',sum);
  toast('นำเข้าแล้ว — '+sum+(p.skipped?' · ข้าม '+p.skipped+' แถว':''));
 }
 const orig={form:window.impCustForm,apply:window.impCustApply,read:window.impFileChanged,vehRow:window.vehRow};
 window.impCustForm=function(){
  csvDownload('แบบฟอร์มนำเข้าลูกค้า.csv',[HEAD].concat(EXAMPLE));
  toast('ดาวน์โหลดแบบฟอร์มแล้ว — 1 แถวต่อรถ 1 คัน ลูกค้าที่มีหลายคันใส่ชื่อซ้ำ · ลบแถวตัวอย่างก่อนกรอก');
 };
 window.impCustApply=apply;
 /* Excel's plain "CSV" on Thai Windows is Windows-874, not UTF-8: read either (the original read UTF-8 only → garbled names) */
 if(typeof orig.read==='function')window.impFileChanged=async function(){
  const f=document.getElementById('impCsvFile'),file=f&&f.files&&f.files[0];if(!file)return;
  let text;
  try{const buf=await file.arrayBuffer();
   try{text=new TextDecoder('utf-8',{fatal:true}).decode(buf);}catch(e){text=new TextDecoder('windows-874').decode(buf);}}
  catch(e){return orig.read.apply(this,arguments);}
  const rows=csvParse(text);
  if(!rows.length)return toast('ไฟล์ว่าง หรืออ่านไม่ได้ — ตรวจว่าเป็นไฟล์ CSV');
  const h=String(rows[0][0]||''),m=(window.PKG_IMPORT_MODES||{})[IMPMODE];   /* more kinds of data (vendors…) register there */
  if(h.includes('ชื่อลูกค้า')||h.includes('รหัสสินค้า')||(m&&h.includes(m.head)))rows.shift();   /* ตัดแถวหัวตาราง */
  if(!rows.length)return toast('ไม่มีข้อมูลใต้หัวตาราง');
  if(IMPMODE==='cust')await impCustApply(rows);else if(m)await m.apply(rows);else await impStockApply(rows);
 };
 /* The customer form: a saved car whose make or plate province isn't on the list (older imports, bookings) used to show the
    list's first entry and be overwritten on the next save — keep its own value as the selected option. New blank cars unchanged. */
 if(typeof orig.vehRow==='function')window.vehRow=function(v){
  let h=orig.vehRow.apply(this,arguments);
  if(!v||!(v.plateL||v.plateN||v.model||v.brand||v.vin))return h;
  [['vBrand',v.brand,BRANDS],['vPP',v.plateProv,PROVINCES]].forEach(([cls,val,list])=>{if(list.includes(val||''))return;
   h=h.replace(`<select class="${cls}">`,`<select class="${cls}"><option value="${esc(val||'')}" selected>${val?esc(val):'— ไม่ระบุ —'}</option>`);});
  return h;
 };
 window.PKG_CUST_IMPORT={HEAD,EXAMPLE,plan,apply,same,ident,sameCar,carOf,splitPlate,brandOf,provOf,telFix,nameKey,orig};
})();
