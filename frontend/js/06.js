
/* Presentation adapter only. Business operations remain in the original scripts. */
(async()=>{
 const gate=document.getElementById('drivego-studio'),app=document.getElementById('pkg-app');
 const field=id=>gate.querySelector('#studio-'+id);
 const plan=window.PKG_PLAN,franchise=plan==='franchise';
 const labels={biz:'DriveGoBiz',prox:'DriveGoProX',franchise:'DriveGoProX Franchise'};
 let ready=false,loggedIn=false,loginIdentity='';
 // Remove this copy-only experiment before production promotion.
 const COPY_ACCOUNT_SWITCHER=false;   // DriveGo phase 2 (A1): no switching accounts without a password
 const previewSwitch=document.createElement('label');previewSwitch.id='pkg-preview-account';previewSwitch.hidden=true;
 const switchCaption=document.createElement('span');switchCaption.textContent='ทดลองสลับบัญชี';previewSwitch.appendChild(switchCaption);
 const switchSelect=document.createElement('select');switchSelect.id='pkg-preview-user';switchSelect.setAttribute('aria-label','ทดลองสลับบัญชี');switchSelect.dataset.noTranslate='';previewSwitch.appendChild(switchSelect);
 document.getElementById('topBrand').appendChild(previewSwitch);
 function syncPreviewSwitch(){
  const enabled=COPY_ACCOUNT_SWITCHER&&loggedIn&&new URL(location.href).searchParams.get('login')!=='account';
  previewSwitch.hidden=!enabled;accountButton.hidden=enabled;
  if(!enabled)return;
  const entries=franchise?FR.accounts.filter(a=>a.active!==false&&(a.role==='HQ'||frBranch(a.branchId)?.active!==false)).map(a=>({id:a.id,label:a.user+' · '+a.name+' ('+a.role+')'})):
   [{id:'',label:(DGB.shop?.ownerUser||'Owner')+' · เจ้าของร้าน'},...empActiveList().filter(e=>e.dgbActive!==false).map(e=>({id:e.id,label:(e.code||e.tel||'')+' · '+e.name+(e.position?' ('+e.position+')':'')}))];
  const signature=JSON.stringify(entries);
  if(switchSelect.dataset.signature!==signature){
   switchSelect.replaceChildren();entries.forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.label;switchSelect.appendChild(o);});switchSelect.dataset.signature=signature;
  }
  switchSelect.value=franchise?(FR.session.accId||''):(DB.curEmp||'');
 }
 switchSelect.addEventListener('change',async()=>{
  if(!COPY_ACCOUNT_SWITCHER||!loggedIn||new URL(location.href).searchParams.get('login')==='account')return;
  const id=switchSelect.value;switchSelect.disabled=true;
  try{
   await save();
   if(franchise){
    const a=FR.accounts.find(x=>x.id===id&&x.active!==false);if(!a)throw new Error('บัญชีนี้ถูกปิดใช้งาน');
    if(a.role!=='HQ'&&(!frBranch(a.branchId)||frBranch(a.branchId).active===false))throw new Error('สาขานี้ถูกปิดใช้งาน');
    FR.session={accId:a.id,inspect:'',...(a.role==='SHB'?{empId:a.empId}: {})};DB.curEmp='';await frSave();await frEnterSession();
    if(!frAcc())throw new Error('บัญชีพนักงานยังตั้งค่าไม่ครบ');
    loginIdentity=a.user;applyPerms();frApplyUI();
   }else{
    const employee=id?DB.emp.find(e=>e.id===id):null;
    if(id&&(!empActive(employee)||employee.dgbActive===false))throw new Error('บัญชีนี้ถูกปิดใช้งาน');
    DB.curEmp=id;DGB.session={who:id||'owner'};
    loginIdentity=employee?(employee.tel||employee.code||employee.name):(DGB.shop.ownerUser||DGB.shop.email);
    await dgbSave();await save();applyPerms();dgbApplyUI();renderStock();renderHome();
    const current=document.querySelector('section.view.on');
    if(!current||!can('tabs.'+current.id.slice(2))||!allowed(current.id.slice(2))){
     const first=PERM_TABS.find(([key])=>allowed(key)&&can('tabs.'+key));if(first)go(first[0]);
    }
   }
   filter();syncPreviewSwitch();
  }catch(e){error(e.message);toast(e.message);syncPreviewSwitch();}
  finally{switchSelect.disabled=false;}
 });

 const headerActions=document.createElement('div');headerActions.id='pkg-header-actions';
 document.querySelector('.brandline').appendChild(headerActions);
 const accountButton=document.createElement('button');accountButton.type='button';accountButton.id='pkg-account-button';accountButton.title='ออกจากระบบ';
 const accountName=document.createElement('span');accountName.id='pkg-account-name';accountButton.appendChild(accountName);
 const exitLabel=document.createElement('span');exitLabel.className='pkg-account-exit';exitLabel.textContent='ออกจากระบบ';accountButton.appendChild(exitLabel);
 document.getElementById('topBrand').appendChild(accountButton);
 headerActions.appendChild(document.getElementById('apvBell'));
 const logoutButton=document.createElement('button');logoutButton.type='button';logoutButton.id='pkg-logout';logoutButton.className='bell';
 logoutButton.title='เมนูบัญชี';logoutButton.setAttribute('aria-label','เมนูบัญชี');logoutButton.setAttribute('aria-expanded','false');logoutButton.setAttribute('aria-controls','pkg-account-menu');
 logoutButton.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 2.4-2 .9-2.2-.7-2 3.4 1.7 1.7-.2 2.2-1.5 1.8 2 3.4 2.3-.6 1.9 1 .6 2.5h4l.6-2.5 1.9-1 2.3.6 2-3.4-1.5-1.8-.2-2.2 1.7-1.7-2-3.4-2.2.7-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg>';
 headerActions.appendChild(logoutButton);
 const accountMenu=document.createElement('div');accountMenu.id='pkg-account-menu';accountMenu.hidden=true;
 const exitAction=document.createElement('button');exitAction.type='button';exitAction.id='pkg-exit-action';exitAction.textContent='ออกจากระบบ';accountMenu.append(exitAction);headerActions.append(accountMenu);
 const closeAccountMenu=()=>{accountMenu.hidden=true;logoutButton.setAttribute('aria-expanded','false');};
 logoutButton.addEventListener('click',()=>{const open=accountMenu.hidden;accountMenu.hidden=!open;logoutButton.setAttribute('aria-expanded',String(open));});
 document.addEventListener('click',e=>{if(!accountMenu.contains(e.target)&&!logoutButton.contains(e.target))closeAccountMenu();});
 headerActions.addEventListener('keydown',e=>{if(e.key==='Escape'&&!accountMenu.hidden){closeAccountMenu();logoutButton.focus();}});
 accountButton.addEventListener('click',()=>exitAction.click());
 exitAction.addEventListener('click',async()=>{exitAction.disabled=true;try{await save();if(franchise)await frLogout();else await dgbLogout();closeAccountMenu();}finally{exitAction.disabled=false;}});
 function error(message){field('result').hidden=false;field('result').textContent=message;}
 function allowed(view){return plan!=='biz'||!['prox','techroom'].includes(view);}
 function syncAccountLabel(){
  syncPreviewSwitch();
  accountName.textContent=loggedIn?(loginIdentity||(franchise?frAcc()?.user:DGB.shop?.ownerUser)||''):'';
  accountName.title=accountName.textContent;accountButton.setAttribute('aria-label',accountName.textContent+' — ออกจากระบบ');
  const select=document.getElementById('curUser');if(!select)return;
  const ownerOption=select.querySelector('option[value=""]');if(!ownerOption)return;
  if(franchise){
   const account=frAcc();if(account){const branch=frBranch(account.branchId);
    ownerOption.textContent=account.name+' · '+(account.role==='HQ'?'สำนักงานใหญ่':branch?branch.code:'สาขา');
   }
  }else if(DGB.shop){
   ownerOption.textContent=(DGB.shop.owner||DGB.shop.ownerUser)+' ('+(DGB.shop.ownerUser||DGB.shop.email)+') · เจ้าของร้าน';
  }
 }
 const originalFillUsers=fillUserSelect,originalDgbChip=dgbChip,originalFrBadge=frRenderBadge;
 fillUserSelect=function(){const result=originalFillUsers();syncAccountLabel();return result;};
 dgbChip=function(){const result=originalDgbChip();syncAccountLabel();return result;};
 frRenderBadge=function(){const result=originalFrBadge();syncAccountLabel();return result;};
 function filter(){
  document.documentElement.dataset.package=plan||'none';
  syncAccountLabel();
  document.querySelectorAll('#tabs .navparent').forEach(b=>{
   const item=b.closest('.navitem');
   if(item)item.classList.toggle('pkg-permission-hidden',b.style.display==='none');
   if(item) item.classList.toggle('pkg-excluded',!allowed(b.dataset.v)||(!franchise&&b.dataset.v==='hq'));
  });
  document.querySelectorAll('#stkTabs [data-s="px"]').forEach(b=>b.classList.toggle('pkg-excluded',plan==='biz'));
  const brand=document.querySelector('.brandline .capx');if(brand)brand.textContent=labels[plan]||'DriveGo';
 }
 function lock(){loggedIn=false;document.documentElement.classList.remove('pkg-open');app.inert=true;gate.hidden=false;field('password').value='';}
 function unlock(){if(!ready)return;loggedIn=true;gate.hidden=true;app.inert=false;document.documentElement.classList.add('pkg-open');filter();}
 const oldGo=go;
 go=function(v){if(ready&&!loggedIn)return; if(!allowed(v)||(!franchise&&v==='hq')){toast('หัวข้อนี้ไม่อยู่ในแพ็กเกจ '+labels[plan]);return;}return oldGo(v);};
 const oldStock=stkGo;
 stkGo=function(v){if((plan==='biz'&&v==='px')||(!franchise&&v==='hqreq'))v='stock';return oldStock(v);};
 const oldPx=pxGo,oldTr=trGo;
 pxGo=function(v){if(plan==='biz')return;return oldPx(v);};
 trGo=function(v){if(plan==='biz')return;return oldTr(v);};
 const oldPerms=applyPerms,oldFrUI=frApplyUI;
 applyPerms=function(){const r=oldPerms();filter();return r;};
 frApplyUI=function(){const r=oldFrUI();filter();return r;};
 function accountMode(){const url=new URL(location.href);url.searchParams.set('login','account');history.replaceState(null,'',url.href);}
 async function previewOwner(){
  if(!ready)return;
  const url=new URL(location.href);url.searchParams.delete('login');history.replaceState(null,'',url.href);
  loggedIn=true;
  try{
   if(franchise){
    const account=FR.accounts.find(a=>a.role==='HQ'&&a.active!==false);
    if(!account)throw new Error('ไม่มีบัญชี HQ ที่เปิดใช้งานสำหรับทดสอบ');
    loginIdentity=account.user||account.name;DB.curEmp='';FR.session={accId:account.id,inspect:''};await frSave();await frEnterSession();unlock();go('hq');
   }else{await dgbDemoOwner();loginIdentity=DGB.shop.ownerUser||DGB.shop.email;unlock();}
  }catch(e){accountMode();lock();error(e.message);}
 }
 const oldDgbOut=dgbLogout,oldFrOut=frLogout;
 dgbLogout=async function(){await oldDgbOut();await window.storage.signOut();accountMode();lock();};
 frLogout=async function(){await oldFrOut();if(!frAcc()){await window.storage.signOut();accountMode();lock();}};
 gate.querySelectorAll('[data-package]').forEach(b=>b.addEventListener('click',()=>{
  const url=new URL(location.href);url.searchParams.set('package',b.dataset.package);url.searchParams.delete('login');location.href=url.href;
 }));
 field('back').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.delete('package');location.href=url.href;});
 field('eye').addEventListener('click',()=>{const show=field('password').type==='password';field('password').type=show?'text':'password';field('eye').setAttribute('aria-pressed',String(show));field('eye').setAttribute('aria-label',show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน');});
 field('help').addEventListener('click',()=>{field('help-answer').hidden=!field('help-answer').hidden;field('help').setAttribute('aria-expanded',String(!field('help-answer').hidden));});
 field('form').addEventListener('submit',async event=>{
  event.preventDefault();if(!ready)return;field('result').hidden=true;
  const submit=field('form').querySelector('[type="submit"]');submit.disabled=true;
  try{
   // DriveGo phase 2 (T7): the server decides first, with the same rules and messages; then the shop's
   // data is read (before signing in the browser has none) and the routines below run as before.
   const signIn=await window.storage.signIn(field('username').value,field('password').value);
   if(!signIn.ok){error(signIn.error);return;}
   await frLoadFR();await dgbLoad();
   // A franchise account may read only its own branch (T8), so frDoLogin below loads it: KEY='' makes every path load.
   if(franchise)KEY='';else{DB=frFreshDB();await load();boot();}
   // The existing routines retain all password, suspension and employee permission checks.
   loggedIn=true;
   if(franchise){
    FR.session={accId:'',inspect:''};
    document.getElementById('frLoginUser').value=field('username').value;
    document.getElementById('frLoginPass').value=field('password').value;
    await frDoLogin();
    if(!frAcc()){loggedIn=false;await window.storage.signOut();error(document.getElementById('frLoginErr').textContent||'เข้าสู่ระบบไม่สำเร็จ');return;}
    loginIdentity=field('username').value.trim();unlock();if(frRole()==='HQ'&&!FR.session.inspect)go('hq');
   }else{
    DGB.session={who:''};
    const identity=field('username').value.trim(), normalized=identity.toLowerCase();
    const owner=!!normalized&&[DGB.shop?.ownerUser,DGB.shop?.email].some(v=>v&&String(v).toLowerCase()===normalized);
    const phone=/^[+\d\s().-]+$/.test(identity)?telNorm(identity):'';
    const employees=phone?(DB.emp||[]).filter(e=>telNorm(e.tel)===phone&&e.dgbPass):[];
    // Resolve one account first; never retry a failed owner password as another role.
    if((owner&&employees.length)||employees.length>1){loggedIn=false;await window.storage.signOut();error('ข้อมูลเข้าสู่ระบบซ้ำกัน กรุณาให้ผู้ดูแลแก้ไขบัญชีก่อน');return;}
    if(!owner&&!employees.length){loggedIn=false;await window.storage.signOut();error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');return;}
    dgbLoginTab(owner?'owner':'emp');
    if(!owner){$('#dgbLeShop').value=DGB.shop.code;$('#dgbLeTel').value=identity;$('#dgbLePass').value=field('password').value;}
    else{$('#dgbLoEmail').value=identity;$('#dgbLoPass').value=field('password').value;}
    const ok=await dgbLogin();if(!ok){loggedIn=false;await window.storage.signOut();error($('#dgbLoErr').textContent);return;}
    loginIdentity=identity;unlock();
   }
   field('password').value='';
  }catch(e){lock();await window.storage.signOut().catch(()=>{});error('เข้าใช้งานไม่สำเร็จ: '+e.message);}finally{submit.disabled=false;}
 });
 const status=document.getElementById('pkg-copy-status');
 const switchAccount=document.createElement('button');switchAccount.type='button';switchAccount.textContent='ทดสอบบัญชีอื่น';
 switchAccount.addEventListener('click',async()=>{
  if(!ready)return;await save();accountMode();
  DGB.session={who:''};FR.session={accId:'',inspect:''};await dgbSave();await frSave();await window.storage.signOut();
  lock();field('result').hidden=true;field('username').value='';field('username').focus();
 });
 status.appendChild(switchAccount);
 // DriveGo phase 2 (A1): no way in without a password (was: 'กลับเข้าโหมดทดลอง… โดยไม่กรอกรหัส').
 status.querySelector('button').addEventListener('click',async()=>{
  if(loggedIn&&!confirm('บันทึกข้อมูลแล้วกลับไปเลือกแพ็กเกจ?'))return;
  if(ready)await save();const url=new URL(location.href);url.searchParams.delete('package');location.href=url.href;
 });
 field('choices').hidden=!!plan;field('login').hidden=!plan;
 if(plan){
  field('heading').textContent='เข้าสู่ '+labels[plan];field('intro').textContent='สำเนาทดสอบ · ใช้ฟังก์ชันจริงของโปรแกรม';
  field('login-tone').dataset.tone=plan;field('product-name').textContent=franchise?'Franchise':plan==='biz'?'Biz':'ProX';field('login-brand').textContent=franchise?'DRIVEGO PROX':'DRIVEGO';
  field('context').textContent=franchise?'พื้นที่ทำงานสำนักงานใหญ่และสาขา':'พื้นที่ทำงานของร้านคุณ';
  field('account').textContent=franchise?'ใช้บัญชี HQ / HB / SHB ตามสิทธิเดิมของระบบ':'ใช้บัญชีเจ้าของร้านหรือพนักงานตามสิทธิเดิม';
  field('submit-label').textContent='เข้าสู่ระบบ';
  field('user-label').textContent=franchise?'ชื่อผู้ใช้':'ชื่อผู้ใช้ / อีเมล / เบอร์โทร';
  field('username').placeholder=franchise?'ชื่อผู้ใช้ของคุณ':'ชื่อผู้ใช้ อีเมล หรือเบอร์โทร';
  field('step-one').classList.remove('active');field('step-two').classList.add('active');
 }
 lock();filter();
 try{
  // Wait for the unmodified business boot and both legacy login initializers.
  await window.PKG_FR_BOOT;
  for(let i=0;i<1200&&!window.__dgbReady;i++)await new Promise(r=>setTimeout(r,25));
  if(!window.__dgbReady)throw new Error('ระบบเดิมยังเริ่มทำงานไม่สำเร็จ กรุณาเปิดไฟล์ใหม่');
  if(franchise){
   // DriveGo phase 2: no demo accounts (A1), no passwords shown (A3), and a signed-in browser stays signed in (Q2).
   FR.enabled=true;if(!window.storage.signedIn){FR.session={accId:'',inspect:''};await frSave();
   DGB.session={who:''};await dgbSave();}
  }else if(plan){
   // DriveGo phase 2: no demo shop (A1), no passwords shown (A3), and a signed-in browser stays signed in (Q2).
   FR.enabled=false;if(!window.storage.signedIn){FR.session={accId:'',inspect:''};await frSave();
   DGB.session={who:''};DB.curEmp='';await dgbSave();}
  }
  // DriveGo phase 2 (A3): the line under the button showed the demo accounts once ready; now it is only cleared.
  if(plan)field('credentials').textContent='';
  frApplyUI();applyPerms();ready=true;field('form').querySelector('[type="submit"]').disabled=false;
  // DriveGo phase 2: signed in already (Q2) -> straight in; otherwise the sign-in form (no preview as owner, A1).
  if(plan&&window.storage.signedIn&&(franchise?frAcc():DGB.session.who)){
   const e=!franchise&&DGB.session.who!=='owner'?(DB.emp||[]).find(x=>x.id===DGB.session.who):null;
   loginIdentity=franchise?frAcc().user:e?(e.tel||e.code||e.name):(DGB.shop.ownerUser||DGB.shop.email);unlock();
  }else if(plan)field('username').focus();
 }catch(e){error(e.message);}
})();

