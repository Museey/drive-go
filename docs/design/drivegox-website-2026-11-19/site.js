/* Shared header, footer, language switch and garage drawing for the DriveGo X sub-pages. */
(function(){
  const C={
    th:{home:'หน้าแรก',eco:'ระบบนิเวศ',plans:'แพ็กเกจ',art:'บทความน่ารู้',td:'Test Drive',login:'เข้าระบบ',demo:'ทดลองใช้งานฟรี',support:'ฝ่ายสนับสนุน',priv:'นโยบายความเป็นส่วนตัว',co:'บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด',addr:'เลขที่ 66 ซอยแสมดำ 13 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร 10150',rights:'สงวนลิขสิทธิ์'},
    en:{home:'Home',eco:'Ecosystem',plans:'Packages',art:'Articles',td:'Test Drive',login:'Log in',demo:'Request a demo',support:'Support',priv:'Privacy policy',co:'Drivebiz Mecalyze Solution Co., Ltd.',addr:'66 Soi Samae Dam 13, Samae Dam, Bang Khun Thian, Bangkok 10150, Thailand',rights:'All rights reserved.'},
    zh:{home:'首页',eco:'生态系统',plans:'产品方案',art:'知识文章',td:'Test Drive',login:'登录',demo:'申请免费试用',support:'客户支持',priv:'隐私政策',co:'Drivebiz Mecalyze Solution Co., Ltd.',addr:'66 Soi Samae Dam 13, Samae Dam, Bang Khun Thian, Bangkok 10150, Thailand',rights:'版权所有'}
  };
  const LOGO='<span class="logo-m"><svg class="lx" viewBox="0 0 48 48" aria-hidden="true"><circle class="tr" cx="24" cy="24" r="20.500"/><circle class="rm" cx="24" cy="24" r="15"/><g transform="translate(24 24) scale(1.150) translate(-12 -12)"><path d="M4 20h5L20 4h-5z"/><path class="c" d="M4 4h5l2.450 3.560-2.500 3.640zM20 20h-5l-2.450-3.560 2.500-3.640z"/></g></svg></span><span>DriveGo <span class="lgx">X</span></span>';
  let lang='th'; try{const s=localStorage.getItem('dg-lang'); if(C[s])lang=s}catch(e){}
  const subs=[];
  const page=document.body.dataset.page;
  function chrome(){
    const c=C[lang];
    document.getElementById('hdr').innerHTML=`<div class="wrap">
      <a class="logo" href="index.html" aria-label="DriveGo X">${LOGO}</a>
      <nav class="nav-l" aria-label="Main"><a href="index.html">${c.home}</a><a href="index.html#eco">${c.eco}</a><a href="index.html#plans">${c.plans}</a><a href="testdrive.html" ${page==='testdrive'?'aria-current="page"':''}>${c.td}</a><a href="articles.html" ${page==='articles'?'aria-current="page"':''}>${c.art}</a></nav>
      <div class="nav-r">
        <div class="lang" role="group" aria-label="Language">${[['th','TH'],['en','EN'],['zh','CN']].map(l=>`<button type="button" data-lang="${l[0]}" aria-pressed="${l[0]===lang}">${l[1]}</button>`).join('')}</div>
        ${page==='login'?`<a class="btn btn-a" href="index.html#contact">${c.demo}</a>`:`<a class="btn btn-a" href="login.html">${c.login}</a>`}
      </div></div>`;
    document.getElementById('ftr').innerHTML=`<div class="wrap"><div class="ft">
      <a class="logo" href="index.html">${LOGO}</a>
      <div>${c.support}<br><a class="tel" href="tel:+66821087000">082-108-7000</a><br><a href="mailto:sales@drivegox.com">sales@drivegox.com</a></div></div>
      <div class="cp">© 2026 ${c.co} · ${c.addr}<br>${c.rights} · <a href="privacy.html">${c.priv}</a></div></div>`;
  }
  function set(l){lang=l;document.documentElement.lang=l==='zh'?'zh-Hans':l;try{localStorage.setItem('dg-lang',l)}catch(e){}chrome();subs.forEach(f=>f(l))}
  document.addEventListener('click',e=>{const b=e.target.closest('.lang button');if(b)set(b.dataset.lang)});
  window.DG={get lang(){return lang},onLang(f){subs.push(f)},start(){set(lang)},pick:o=>o[lang]??o.th,
    garage(svg){
      const car=`<path d="M8 62V46q2-8 22-12l32-4 22-20q4-4 12-4h54q10 0 16 6l20 20 20 6q8 2 8 12v12h-24a18 18 0 0 0-36 0H70a18 18 0 0 0-36 0z"/><path d="M70 30l18-18h30v18zM124 12h26l22 18h-48z"/>`;
      const wheels=`<g class="wh"><circle cx="52" cy="62" r="13"/><path d="M52 49v26M39 62h26"/></g><g class="wh"><circle cx="172" cy="62" r="13"/><path d="M172 49v26M159 62h26"/></g>`;
      const L=t=>[260-260*t,200-140*t], R=t=>[1180+260*t,200-140*t];
      let h=`<path d="M260 200H1180V470H260zM260 200L0 60M1180 200L1440 60M260 470L0 720M1180 470L1440 720"/>`;
      [.22,.5,.85].forEach(t=>{const a=L(t),b=R(t);h+=`<path d="M${a[0]} ${a[1]}H${b[0]}"/><path class="thin" d="M${a[0]} ${a[1]+26}H${b[0]}"/>`;
        let z=`M${a[0]} ${a[1]+26}`;const n=14,w=(b[0]-a[0])/n;for(let i=1;i<=n;i++)z+=`L${(a[0]+w*i).toFixed(0)} ${a[1]+(i%2?0:26)}`;h+=`<path class="thin" d="${z}"/>`});
      [[470,150,610],[830,150,970],[380,96,560],[880,96,1060]].forEach(l=>h+=`<path class="lamp" d="M${l[0]} ${l[1]}H${l[2]}"/>`);
      [400,560,720,880,1040].forEach(x=>h+=`<path class="thin" d="M${x} 470L${(720+(x-720)*4.667).toFixed(0)} 800"/>`);
      [506,560,650].forEach(y=>{const k=(y-470)/250;h+=`<path class="thin" d="M${(260-260*k).toFixed(0)} ${y}H${(1180+260*k).toFixed(0)}"/>`});
      h+=`<path d="M330 290H520V470M330 290V470"/><g class="door"><path class="thin" d="M330 320H520M330 350H520M330 380H520M330 410H520M330 440H520"/></g>`;
      h+=`<path d="M620 270H820V470M620 270V470M620 320H820M620 370H820M620 420H820M687 270V470M753 270V470"/>`;
      h+=`<path d="M920 290H1110V470M920 290V470"/><path class="thin" d="M920 320H1110M920 350H1110M920 380H1110M920 410H1110M920 440H1110"/>`;
      h+=`<path d="M398 286h16v276h-16zM626 286h16v276h-16zM390 562h32M618 562h32M414 286H626"/>`;
      h+=`<g class="up"><path d="M414 538H626M414 532v12M626 532v12"/><g transform="translate(410 458)">${car}${wheels}</g></g>`;
      h+=`<path class="thin" d="M968 340h9v132h-9zM1090 340h9v132h-9zM977 340H1090M977 452H1090"/>`;
      h+=`<g class="roll"><g transform="translate(880 520) scale(1.300)">${car}${wheels}</g></g>`;
      h+=`<path d="M1250 590h70v70h-70zM1250 612h70M1250 634h70M1262 660v14M1308 660v14"/>`;
      h+=`<ellipse cx="150" cy="676" rx="44" ry="13"/><ellipse cx="150" cy="652" rx="44" ry="13"/><ellipse cx="150" cy="628" rx="44" ry="13"/><path d="M106 628v48M194 628v48"/>`;
      svg.innerHTML=h;
      svg.querySelectorAll('path,ellipse,circle').forEach((e,i)=>{if(e.closest('.wh')||e.classList.contains('lamp'))return;e.setAttribute('pathLength','1');e.classList.add('dr');e.style.animationDelay=(i*.045).toFixed(2)+'s'});
    }};
})();
