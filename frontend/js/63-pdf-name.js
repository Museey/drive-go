/* DriveGo new system (task 3.14, decision F9 and the owner's answers 14.1–14.4 of 2026-10-26): the browser's print
   page stays, and "Save as PDF" offers a file name made from what is printed:
   · a document: <type>_<number>_<party>.pdf — the type is the printed heading up to its first " / " without "(…)",
     the number is its "เลขที่" ("ร่าง" before it is saved), the party the customer, vendor, payee, employee or
     the destination branch (walk-in = "ลูกค้าทั่วไป", internal documents have none); "_ยกเลิก" when cancelled;
   · a document without a number (a pay slip): <type>_<period>_<party>;
   · a report: <title>_<period or date> (the whole title, "/" a space), dates as in the Excel files (yyyy-mm-dd, months yyyy-mm, years yyyy);
   · several documents in one print: <type>_<period or dates>_ทุกคน (every employee) or _<n> ใบ;
   · blank forms: แบบฟอร์มเปล่า_<type> or _<n> ชนิด.
   Browsers take the default PDF name from the page's title (Chrome turns the part after the last dot into the
   extension, so the name ends with .pdf). The title is set when the sheets are ready, before the print page opens
   (printDocs waits 80 ms), and put back after printing — on "afterprint", the next print, or a minute later where
   no "afterprint" comes — unless something else (applyPerms) changed it meanwhile.
   Every print goes through window.printDocs (wrapped by 31.js, 37.js, 46.js, 55.js at call time), so this wraps it
   last and reads the printed sheets in #printStage rather than each print's own data. */
(function(){
 if(typeof printDocs!=='function')return;
 const MAX=80;
 const MON=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
 const MONF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 const PARTY=/^(ลูกค้า(?: \(.*\))?|ได้รับเงินจาก|ชื่อผู้ซื้อ \/ ผู้รับบริการ|เรียน|ผู้ขาย(?: \/ ผู้รับเคลม)?|จ่ายให้|ผู้ถูกหักภาษี ณ ที่จ่าย|พนักงาน)$/;
 const txt=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
 /* what may not be in a file name, control and invisible characters: a space, never "_" */
 const clean=s=>String(s||'').replace(/[\\/:*?"<>|~\u0000-\u001f\u007f­​-‏‪-‮⁠-⁤﻿]/g,' ')
  .replace(/\s+/g,' ').replace(/^[\s.]+|[\s.]+$/g,'');
 const year=y=>{y=+y;return String(y>2400?y-543:y);};
 const two=v=>String(v).padStart(2,'0');
 const isoOf=(d,m,y)=>year(y)+'-'+two(m)+'-'+two(d);
 /* a period in printed words → dates as in the Excel files */
 function period(s){if(!s)return '';
  const ds=[...s.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map(m=>isoOf(m[1],m[2],m[3]));
  if(ds.length)return ds.length>1&&ds[0]!==ds[ds.length-1]?ds[0]+'–'+ds[ds.length-1]:ds[0];
  for(const L of [MONF,MON])for(let i=0;i<12;i++){const m=s.match(new RegExp(L[i].replace(/\./g,'\\.')+'\\s*(\\d{4})'));if(m)return year(m[1])+'-'+two(i+1);}
  const y=s.match(/(?:ปี(?:บัญชี)?|พ\.ศ\.)\s*(\d{4})/);return y?year(y[1]):'';}
 function fields(sh){const o=[];sh.querySelectorAll('.dfields tr').forEach(tr=>{const th=tr.querySelector('th'),td=tr.querySelector('td');if(th&&td)o.push([txt(th),txt(td)]);});return o;}
 /* the lines of an 80 mm slip (text between <br> and <hr>) */
 function lines(sh){const d=document.createElement('div');return sh.innerHTML.split(/<br\s*\/?>|<hr\s*\/?>/i).map(h=>{d.innerHTML=h;return txt(d);});}
 function read(sh){
  const F=fields(sh),f=k=>(F.find(([a])=>k.test(a))||[])[1],dt=sh.querySelector('.dtitle');
  let type='',no=null,party='';
  if(dt&&txt(dt)){type=txt(dt);const x=f(/^เลขที่$/);if(x!=null)no=x;}
  else{/* no heading box: an 80 mm slip or the 50 ทวิ form — the last bold line of the first centred block */
   const c=sh.querySelector('div[style*="text-align:center"]'),b=c&&[...c.querySelectorAll('b')].pop();type=txt(b);
   const L=lines(sh),m=txt(sh).match(/เลขที่\s+([A-Z0-9][A-Z0-9\-\/]*)/);no=m?m[1]:'';
   const p=L.find(l=>/^ลูกค้า /.test(l));if(p)party=p.slice(7);}
  const title=type.replace(/\s*\([^)]*\)/g,'');type=title.split(' / ')[0];
  if(!party){const l=[...sh.querySelectorAll('.lbl')].find(e=>PARTY.test(txt(e)));
   if(l){const b=[...l.parentElement.querySelectorAll('b')].find(b=>l.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);party=txt(b);
    if(txt(l)==='พนักงาน')party=party.replace(/^\S+ · /,'');}}
  if(!party)party=f(/^สาขาปลายทาง$/)||'';
  if(party==='-')party='';
  if(/^ลูกค้าทั่วไป/.test(party))party='ลูกค้าทั่วไป';
  const cancelled=[...sh.querySelectorAll('.dstamp,.apvwm span,b')].some(e=>/^(— )?ยกเลิกแล้ว( —)?$/.test(txt(e)));
  const per=period(f(/^(งวด|ช่วง)/)||'')||period((f(/^ปี/)||'').replace(/^/,'ปี '));
  const when=period(f(/^(ณ วันที่|วันที่)/)||'');
  const note=txt(sh.querySelector('.dnote'));
  return {type,title,no,party,cancelled,per,when,F,note,blank:no!=null&&/^\.+$/.test(no)};
 }
 function bodyPeriod(sh){const c=sh.cloneNode(true);c.querySelectorAll('.brand').forEach(e=>e.remove());const s=txt(c);
  const m=s.match(/(?:เดือน|งวด)\s*([^\s]+\s*\d{4})/);if(m&&period(m[1]).length===7)return period(m[1]);
  const y=s.match(/ปีบัญชี(?:สิ้นสุดวันที่ \d+ \S+)?\s*(\d{4})/)||s.match(/ปี\s*(\d{4})/);return y?year(y[1]):'';}
 const draft=no=>!no||no==='-'||/^\(.*\)$/.test(no);
 function nameOf(stage){
  const S=[...stage.querySelectorAll('.sheetpage')];if(!S.length)return '';
  const R=S.map(read),a=R[0];if(!a.type)return '';
  if(a.blank){const k=[...new Set(R.map(r=>r.type))];return ['แบบฟอร์มเปล่า',k.length>1?k.length+' ชนิด':k[0]];}
  const today=typeof iso==='function'?iso():new Date().toISOString().slice(0,10);
  if(a.no==null&&!a.party){   /* a report */
   const t=(/^รายการเอกสาร/.test(a.note)?'รายการ':'')+a.title;
   return [t,a.per||bodyPeriod(S[0])||a.when||today];}
  const key=r=>a.no!=null?r.no:r.party,keys=[...new Set(R.map(key).filter(Boolean))];
  if(keys.length>1){   /* several documents */
   const emp=(DB.emp||[]).map(e=>String(e.name||'').trim()),every=R.every(r=>r.party&&emp.includes(r.party));
   const ws=[...new Set(R.map(r=>r.when).filter(Boolean))].sort();
   const per=a.per||(a.no!=null?'':bodyPeriod(S[0]))||(ws.length?ws.length>1?ws[0]+'–'+ws[ws.length-1]:ws[0]:'')||bodyPeriod(S[0])||today;
   return [a.type,per,every?'ทุกคน':keys.length+' ใบ'];}
  return [a.type,a.no!=null?(draft(a.no)?'ร่าง':a.no):(a.per||a.when),a.party,a.cancelled?'ยกเลิก':''];
 }
 /* longer than MAX: the longest part (the party, as a rule) is shortened, at a word's end where it can be */
 function fileName(parts){
  const p=parts.map(clean).filter(Boolean);if(!p.length)return '';
  const over=p.join('_').length-MAX;
  if(over>0){const i=p.reduce((b,x,j)=>x.length>p[b].length?j:b,0),keep=Math.max(1,p[i].length-over);
   let cut=p[i].slice(0,keep);const sp=cut.lastIndexOf(' ');if(p[i][keep]!==' '&&sp>keep/2)cut=cut.slice(0,sp);   /* at a word's end */
   p[i]=clean(cut);}
  return clean(p.filter(Boolean).join('_').slice(0,MAX))+'.pdf';
 }
 /* the page's own title back after printing */
 let saved=null,mine=null,timer=0;
 function restore(){clearTimeout(timer);if(mine!==null&&document.title===mine)document.title=saved;saved=mine=null;}
 window.addEventListener('afterprint',restore);
 const pd0=window.printDocs;
 window.printDocs=function(){
  const r=pd0.apply(this,arguments);
  try{restore();const st=document.getElementById('printStage'),name=st?fileName(nameOf(st)):'';
   if(name){saved=document.title;document.title=mine=name;timer=setTimeout(restore,60000);}}catch(e){}
  return r;};
 window.PKG_PDF_NAME={nameOf:st=>fileName(nameOf(st))};
})();
