
window.PKG_PLAN=(function(){var p='';try{p=new URL(location.href).searchParams.get('package')||'';}catch(e){}return ['biz','prox','franchise'].indexOf(p)>=0?p:'biz';})();
const COPY_PREFIX='drivego-package-copy-v1:'+(window.PKG_PLAN||'selection')+':';
const COPY_LOCAL_STORAGE={getItem:k=>localStorage.getItem(COPY_PREFIX+k),setItem:(k,v)=>localStorage.setItem(COPY_PREFIX+k,v),removeItem:k=>localStorage.removeItem(COPY_PREFIX+k),keys:()=>Object.keys(localStorage).filter(k=>k.startsWith(COPY_PREFIX)).map(k=>k.slice(COPY_PREFIX.length))};
