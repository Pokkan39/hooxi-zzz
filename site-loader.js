(()=>{
  'use strict';

  if(window.__hooxiSiteLoader?.version)return;

  const root=document.documentElement;
  const boot=window.__hooxiSiteLoaderBoot||{};
  const loader=document.querySelector('[data-site-loader]');
  if(loader&&document.body.firstElementChild!==loader)document.body.prepend(loader);
  const status=loader?.querySelector('[data-site-loader-status]');
  const code=loader?.querySelector('[data-site-loader-code]');
  const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>reducedQuery.matches;
  const PENDING_KEY='zzzTvPending';
  let state='booting';
  let finished=false;
  let navigating=false;
  let navigationTimer=0;
  let appObserver=null;

  const ensureFirst=()=>{
    if(loader&&document.body?.firstElementChild!==loader)document.body.prepend(loader);
  };

  const setStatus=(message,value)=>{
    if(status)status.textContent=message;
    if(code)code.textContent=value;
  };

  const clearPending=()=>{
    try{sessionStorage.removeItem(PENDING_KEY);}catch{}
  };

  const hasPending=()=>{
    try{return sessionStorage.getItem(PENDING_KEY)==='1';}catch{return false}
  };

  const setPending=()=>{
    try{sessionStorage.setItem(PENDING_KEY,'1');}catch{}
  };

  const stopBootTimer=()=>{
    clearTimeout(boot.timer);
    boot.finished=true;
  };

  const hideLoader=()=>{
    root.classList.remove('site-loading','site-booting','site-loader-finishing','site-navigating');
    loader?.setAttribute('aria-hidden','true');
  };

  const complete=(nextState='ready')=>{
    if(finished)return;
    finished=true;
    state=nextState;
    appObserver?.disconnect();
    stopBootTimer();
    hideLoader();
    root.dataset.siteLoaderState=nextState;
    root.classList.add(nextState==='degraded'?'site-degraded':'site-ready');
    setStatus(nextState==='degraded'?'SIGNAL / DEGRADED':'SIGNAL / READY',nextState==='degraded'?'ERR':'00:00:00');
  };

  const finish=(nextState='ready')=>{
    if(finished)return;
    if(reduced()){
      complete(nextState);
      return;
    }
    state='finishing';
    root.classList.remove('site-booting');
    root.classList.add('site-loader-finishing');
    setStatus(nextState==='degraded'?'SIGNAL / DEGRADED':'SIGNAL / LOCKED',nextState==='degraded'?'ERR':'00:00:00');
    setTimeout(()=>complete(nextState),180);
  };

  const degrade=()=>{
    if(finished)return;
    root.classList.add('site-degraded');
    root.dataset.siteLoaderState='degraded';
    setStatus('SIGNAL / DEGRADED','ERR');
    clearPending();
    window.__hooxiTvTransition?.reset?.();
    complete('degraded');
  };

  const forceFinish=()=>{
    if(finished)return;
    clearPending();
    window.__hooxiTvTransition?.reset?.();
    complete(root.classList.contains('site-degraded')||boot.degraded?'degraded':'timeout');
  };

  const afterTwoFrames=callback=>requestAnimationFrame(()=>requestAnimationFrame(callback));

  const ready=()=>{
    if(finished||state==='ready'||state==='locking')return;
    ensureFirst();
    if(hasPending()&&!reduced()){
      const tv=window.__hooxiTvTransition;
      if(tv?.lockBack){
        state='locking';
        setStatus('SIGNAL / RELOCKING','00:00:01');
        let covered=false;
        const onCovered=()=>{
          if(covered)return;
          covered=true;
          hideLoader();
          clearPending();
        };
        const onComplete=()=>{
          onCovered();
          complete('ready');
        };
        try{tv.lockBack({onCovered,onComplete});}
        catch{onCovered();complete('ready');}
        return;
      }
      clearPending();
    }
    finish('ready');
  };

  const waitForHomeHero=()=>{
    const near=document.getElementById('heroNear');
    if(!near||typeof near.decode!=='function')return Promise.resolve();
    return near.decode().catch(()=>{});
  };

  const onDomReady=()=>{
    if(finished)return;
    if(document.getElementById('root')||document.getElementById('storiesRoot')){
      if(root.dataset.appReady==='true')afterTwoFrames(ready);
      else{
        const onAppReady=()=>afterTwoFrames(ready);
        window.addEventListener('hooxi:app-ready',onAppReady,{once:true});
        appObserver=new MutationObserver(()=>{
          if(root.dataset.appReady==='true'){
            appObserver.disconnect();
            afterTwoFrames(ready);
          }
        });
        appObserver.observe(root,{attributes:true,attributeFilter:['data-app-ready']});
      }
      return;
    }
    const wait=root.querySelector('body.home-page')?waitForHomeHero():Promise.resolve();
    wait.finally(()=>afterTwoFrames(ready));
  };

  const withMotionForce=raw=>{
    if(!root.classList.contains('zzz-motion-forced'))return raw;
    try{
      const url=new URL(raw,location.href);
      url.searchParams.set('motion','force');
      return url.href;
    }catch{return raw}
  };

  const assign=url=>location.assign(withMotionForce(url.href));

  const navigate=value=>{
    let url;
    try{url=value instanceof URL?value:new URL(String(value),location.href);}catch{return false}
    if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return false;
    if(url.pathname===location.pathname&&url.search===location.search){
      clearPending();
      location.assign(url.href);
      return true;
    }
    if(navigating)return true;
    navigating=true;
    root.classList.add('site-navigating');

    if(reduced()){
      clearPending();
      assign(url);
      return true;
    }

    let swapped=false;
    const swap=()=>{
      if(swapped)return;
      swapped=true;
      clearTimeout(navigationTimer);
      setPending();
      assign(url);
    };
    const tv=window.__hooxiTvTransition;
    if(!tv?.cutOut){
      swap();
      return true;
    }
    navigationTimer=setTimeout(swap,900);
    try{tv.cutOut({onSwap:swap,onComplete:()=>{}});}catch{swap()}
    return true;
  };

  const eligibleUrl=(anchor,event)=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return null;
    if(anchor.hasAttribute('download'))return null;
    if(anchor.hasAttribute('target'))return null;
    const raw=(anchor.getAttribute('href')||'').trim();
    if(!raw||raw.startsWith('#')||/^(?:mailto:|tel:|javascript:|data:)/i.test(raw))return null;
    let url;
    try{url=new URL(raw,location.href);}catch{return null}
    if(!['http:','https:'].includes(url.protocol)||url.origin!==location.origin)return null;
    const sameDocument=url.pathname===location.pathname&&url.search===location.search;
    if(sameDocument&&(url.hash||url.href===location.href))return null;
    const name=url.pathname.split('/').pop()||'';
    if(name.includes('.')&&!name.toLowerCase().endsWith('.html'))return null;
    return url;
  };

  const onClick=event=>{
    if(document.body?.classList.contains('tape-wall-page'))return;
    const anchor=event.target.closest?.('a[href]');
    if(!anchor)return;
    const url=eligibleUrl(anchor,event);
    if(!url)return;
    event.preventDefault();
    navigate(url);
  };

  const onPageShow=event=>{
    if(!event.persisted)return;
    clearTimeout(navigationTimer);
    navigationTimer=0;
    clearPending();
    window.__hooxiTvTransition?.reset?.();
    navigating=false;
    state='ready';
    finished=true;
    appObserver?.disconnect();
    stopBootTimer();
    root.classList.remove('site-loading','site-booting','site-loader-finishing','site-navigating','site-degraded');
    root.classList.add('site-ready');
    root.dataset.siteLoaderState='ready';
    loader?.setAttribute('aria-hidden','true');
  };

  const api=window.__hooxiSiteLoader={
    version:1,
    navigate,
    ready,
    finish,
    degrade,
    forceFinish,
    get state(){return state}
  };

  if(reduced()){
    root.classList.add('site-loader-reduced');
    clearPending();
  }

  boot.finish=complete;
  boot.fail=degrade;
  document.addEventListener('DOMContentLoaded',ensureFirst,{once:true});
  document.addEventListener('click',onClick);
  addEventListener('pageshow',onPageShow);
  addEventListener('hooxi:app-error',degrade,{once:true});

  if(boot.degraded)degrade();
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onDomReady,{once:true});
  else onDomReady();
})();
