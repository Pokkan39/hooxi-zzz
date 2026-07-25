(()=>{
  if(window.__hooxiMotionEngine)return;

  const root=document.documentElement;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const revealSelector='.path-card,.home-agent-card,.home-lane-card,.chapter,.archive-group,.page-timeline-item,.page-card,.agent-roster-card,.agent-file-card,.agent-entry,.faction-entry,.faction-card,.faction-story-card,.faction-member,.faction-relationship,.faction-project-card,.character-hero-main,.character-media-cover,.character-content-card,.character-gallery-item,.related-record,.section-plate';
  const magnetSelector='.button,.icon-button,.player-control,.playlist-button,.play-button,.lane-chip,.deck-btn,.side-btn,.cassette-close,.cassette-mini,.agent-orbit-button,.agent-clear-button';
  const pressSelector='button,.button,.icon-button,.player-control,.playlist-button,.play-button,.lane-chip,.deck-btn,.side-btn,.cassette-close,.cassette-mini,.agent-orbit-button,.agent-clear-button,[data-fx]';
  const nativePageTransitions=CSS.supports?.('view-transition-name: none')&&matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const mutationRoots=new Set();
  const pressedPointers=new Map();
  let revealObserver=null;
  let mutationFrame=0;
  let pointerFrame=0;
  let scrollFrame=0;
  let hideTimer=0;
  let navigating=false;
  let latestPointer=null;
  let currentMagnet=null;
  let motionFeaturesBound=false;

  root.classList.add('motion-ready');

  const engineStyles=document.createElement('style');
  engineStyles.textContent=`
    html.motion-ready{--hooxi-signal-x:0px;--hooxi-signal-y:0px;--hooxi-signal-scroll:0px;--hooxi-signal-depth:1;--site-progress:0}
    html.motion-ready .topbar .brand{translate:calc(var(--hooxi-signal-x)*.12) calc(var(--hooxi-signal-y)*.08)}
    html.motion-ready :is(.button,.icon-button,.player-control,.playlist-button,.play-button,.lane-chip,.deck-btn,.side-btn,.cassette-close,.cassette-mini,.agent-orbit-button,.agent-clear-button){
      translate:var(--magnet-x,0px) var(--magnet-y,0px);
      scale:var(--press-scale,1);
      filter:brightness(var(--press-brightness,1));
      will-change:translate,scale;
    }
    html.motion-ready .is-pressed{--press-scale:.965;--press-brightness:.98}
    html.motion-ready .hooxi-signal-field{
      transform:translate3d(var(--hooxi-signal-x),calc(var(--hooxi-signal-y) + var(--hooxi-signal-scroll)),0) scale(var(--hooxi-signal-depth));
    }
    html.motion-ready .hooxi-route-loader__track i{transform:scaleX(var(--site-progress))}
    html.motion-ready :is(.character-content-card,.character-gallery-item,.related-record)[data-motion-surface]{
      transition:
        transform 360ms var(--motion-curve,cubic-bezier(.16,1,.3,1)),
        box-shadow 360ms var(--motion-curve,cubic-bezier(.16,1,.3,1)),
        border-color 240ms ease;
    }
    @media (hover:hover) and (pointer:fine){
      html.motion-ready :is(.character-content-card,.character-gallery-item,.related-record)[data-motion-surface]:hover{
        transform:translate3d(0,-5px,0);
      }
    }
    @media (prefers-reduced-motion:reduce){
      html.motion-ready .topbar .brand{translate:none}
      html.motion-ready .is-pressed{scale:none;filter:none}
    }
  `;
  document.head.append(engineStyles);

  const signalField=document.createElement('div');
  signalField.className='hooxi-signal-field';
  signalField.setAttribute('aria-hidden','true');

  const routeLoader=document.createElement('div');
  routeLoader.className='hooxi-route-loader';
  routeLoader.setAttribute('role','status');
  routeLoader.setAttribute('aria-live','polite');
  routeLoader.setAttribute('aria-atomic','true');
  routeLoader.setAttribute('aria-hidden','true');
  routeLoader.dataset.state='idle';
  routeLoader.innerHTML='<div class="hooxi-route-loader__frame"><div class="hooxi-route-loader__head"><strong>HOOXI <i>//</i></strong><b>LOADING</b></div><p><span data-route-status>ARCHIVE CHANNEL / READY</span><b data-route-progress>100</b></p><div class="hooxi-route-loader__track" aria-hidden="true"><i></i></div></div>';

  document.body.prepend(signalField);
  document.body.append(routeLoader);

  const status=routeLoader.querySelector('[data-route-status]');
  const progress=routeLoader.querySelector('[data-route-progress]');

  const setLoader=(state,message,value)=>{
    clearTimeout(hideTimer);
    routeLoader.classList.remove('is-entering','is-leaving','is-running');
    routeLoader.classList.add('is-active',`is-${state}`);
    routeLoader.dataset.state=state;
    routeLoader.setAttribute('aria-hidden','false');
    status.textContent=message;
    progress.textContent=value;
    requestAnimationFrame(()=>routeLoader.classList.add('is-running'));
  };

  const hideLoader=()=>{
    clearTimeout(hideTimer);
    routeLoader.classList.remove('is-active','is-entering','is-leaving','is-running');
    routeLoader.dataset.state='idle';
    routeLoader.setAttribute('aria-hidden','true');
    status.textContent='ARCHIVE CHANNEL / READY';
    progress.textContent='100';
    navigating=false;
  };

  const revealElement=element=>{
    if(element.classList.contains('is-revealed'))return;
    revealObserver?.unobserve(element);
    element.classList.add('is-revealed');
  };

  const ensureRevealObserver=()=>{
    if(reducedMotion.matches||revealObserver||!('IntersectionObserver' in window))return;
    revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting||entry.intersectionRatio>0)revealElement(entry.target);
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  };

  const scanReveal=scope=>{
    const elements=[];
    let revealIndex=0;
    if(scope instanceof Element&&scope.matches(revealSelector))elements.push(scope);
    scope.querySelectorAll?.(revealSelector).forEach(element=>elements.push(element));
    elements.forEach(element=>{
      if(element.hasAttribute('data-motion-reveal'))return;
      element.setAttribute('data-motion-reveal','once');
      element.style.setProperty('--motion-i',String(revealIndex++%8));
      if(reducedMotion.matches||!('IntersectionObserver' in window))revealElement(element);
      else{
        ensureRevealObserver();
        revealObserver.observe(element);
      }
    });
  };

  const updateActiveNavigation=()=>{
    const currentPage=location.pathname.split('/').pop()||'index.html';
    const navPage=['character.html','faction.html'].includes(currentPage)?'stories.html':currentPage;
    document.querySelectorAll('.topbar nav a[href], .site-sidebar a[href]').forEach(anchor=>{
      let target;
      try{target=new URL(anchor.href,location.href)}catch{return}
      const targetPage=target.pathname.split('/').pop()||'index.html';
      const active=!target.hash&&targetPage===navPage;
      anchor.classList.toggle('is-active',active);
      if(active)anchor.setAttribute('aria-current','page');
      else anchor.removeAttribute('aria-current');
    });
  };

  const refresh=scope=>{
    const target=scope&&scope.querySelectorAll?scope:document;
    scanReveal(target);
    updateActiveNavigation();
  };

  const queueMutationRoot=node=>{
    if(!(node instanceof Element))return;
    for(const queued of mutationRoots){
      if(queued.contains(node))return;
      if(node.contains(queued))mutationRoots.delete(queued);
    }
    mutationRoots.add(node);
    if(mutationFrame)return;
    mutationFrame=requestAnimationFrame(()=>{
      mutationFrame=0;
      mutationRoots.forEach(added=>{
        if(added.isConnected)scanReveal(added);
      });
      mutationRoots.clear();
      updateActiveNavigation();
    });
  };

  const mutationObserver=new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(queueMutationRoot));
  });
  mutationObserver.observe(document.body,{childList:true,subtree:true});

  const resetMagnet=element=>{
    const target=element||currentMagnet;
    if(!target)return;
    target.style.setProperty('--magnet-x','0px');
    target.style.setProperty('--magnet-y','0px');
    if(target===currentMagnet)currentMagnet=null;
  };

  const applyPointer=()=>{
    pointerFrame=0;
    if(!latestPointer||reducedMotion.matches||latestPointer.pointerType==='touch')return;
    const x=Math.max(0,Math.min(1,latestPointer.x/Math.max(innerWidth,1)));
    const y=Math.max(0,Math.min(1,latestPointer.y/Math.max(innerHeight,1)));
    root.style.setProperty('--hooxi-signal-x',`${((x-.5)*8).toFixed(2)}px`);
    root.style.setProperty('--hooxi-signal-y',`${((y-.5)*6).toFixed(2)}px`);

    const source=latestPointer.target instanceof Element?latestPointer.target:null;
    const magnet=finePointer.matches&&latestPointer.pointerType!=='touch'?source?.closest(magnetSelector):null;
    if(currentMagnet&&currentMagnet!==magnet)resetMagnet(currentMagnet);
    if(!magnet)return;
    const rect=magnet.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const magnetX=Math.max(-1,Math.min(1,((latestPointer.x-rect.left)/rect.width-.5)*2))*6;
    const magnetY=Math.max(-1,Math.min(1,((latestPointer.y-rect.top)/rect.height-.5)*2))*6;
    magnet.style.setProperty('--magnet-x',`${magnetX.toFixed(2)}px`);
    magnet.style.setProperty('--magnet-y',`${magnetY.toFixed(2)}px`);
    currentMagnet=magnet;
  };

  const updatePointer=event=>{
    latestPointer={x:event.clientX,y:event.clientY,target:event.target,pointerType:event.pointerType};
    if(!pointerFrame)pointerFrame=requestAnimationFrame(applyPointer);
  };

  const applyScroll=includeSignal=>{
    scrollFrame=0;
    const top=Math.max(0,scrollY||root.scrollTop||0);
    const range=Math.max(root.scrollHeight-innerHeight,1);
    const ratio=Math.max(0,Math.min(1,top/range));
    root.style.setProperty('--site-progress',String(Number(ratio.toFixed(4))));
    document.querySelector('.topbar')?.classList.toggle('is-condensed',top>24);
    if(!includeSignal)return;
    root.style.setProperty('--hooxi-signal-scroll',`${(ratio*10).toFixed(2)}px`);
    root.style.setProperty('--hooxi-signal-depth',String((.99+ratio*.02).toFixed(3)));
  };

  const updateScroll=()=>{
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>applyScroll(!reducedMotion.matches));
  };

  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',updateScroll,{passive:true});

  const releasePressed=pointerId=>{
    const target=pressedPointers.get(pointerId);
    if(!target)return;
    target.classList.remove('is-pressed');
    pressedPointers.delete(pointerId);
  };

  const clearPressed=()=>{
    new Set(pressedPointers.values()).forEach(target=>target.classList.remove('is-pressed'));
    pressedPointers.clear();
  };

  const pressDown=event=>{
    const target=event.target instanceof Element?event.target.closest(pressSelector):null;
    if(!target)return;
    releasePressed(event.pointerId);
    target.classList.add('is-pressed');
    pressedPointers.set(event.pointerId,target);
  };

  const pressUp=event=>releasePressed(event.pointerId);

  const pressOut=event=>{
    const target=pressedPointers.get(event.pointerId);
    if(target&&(!event.relatedTarget||!target.contains(event.relatedTarget)))releasePressed(event.pointerId);
    if(!event.relatedTarget)resetMagnet();
  };

  const enableMotionFeatures=()=>{
    if(motionFeaturesBound||reducedMotion.matches)return;
    motionFeaturesBound=true;
    addEventListener('pointermove',updatePointer,{passive:true});
    addEventListener('blur',clearPressed);
    document.addEventListener('pointerdown',pressDown,{passive:true});
    document.addEventListener('pointerup',pressUp,{passive:true});
    document.addEventListener('pointercancel',pressUp,{passive:true});
    document.addEventListener('pointerout',pressOut,{passive:true});
    updateScroll();
  };

  const disableMotionFeatures=()=>{
    if(!motionFeaturesBound)return;
    motionFeaturesBound=false;
    removeEventListener('pointermove',updatePointer);
    removeEventListener('blur',clearPressed);
    document.removeEventListener('pointerdown',pressDown);
    document.removeEventListener('pointerup',pressUp);
    document.removeEventListener('pointercancel',pressUp);
    document.removeEventListener('pointerout',pressOut);
    cancelAnimationFrame(pointerFrame);
    cancelAnimationFrame(scrollFrame);
    pointerFrame=0;
    scrollFrame=0;
    latestPointer=null;
    clearPressed();
    resetMagnet();
  };

  const handleReducedMotion=()=>{
    if(reducedMotion.matches){
      disableMotionFeatures();
      revealObserver?.disconnect();
      revealObserver=null;
      document.querySelectorAll('[data-motion-reveal]:not(.is-revealed)').forEach(revealElement);
      root.style.setProperty('--hooxi-signal-x','0px');
      root.style.setProperty('--hooxi-signal-y','0px');
      root.style.setProperty('--hooxi-signal-scroll','0px');
      root.style.setProperty('--hooxi-signal-depth','1');
      applyScroll(false);
      return;
    }
    ensureRevealObserver();
    enableMotionFeatures();
  };

  window.__hooxiMotionEngine=true;

  refresh(document);
  if(reducedMotion.matches)handleReducedMotion();
  else{
    ensureRevealObserver();
    enableMotionFeatures();
    applyScroll(true);
  }

  if(typeof reducedMotion.addEventListener==='function')reducedMotion.addEventListener('change',handleReducedMotion);
  else reducedMotion.addListener(handleReducedMotion);

  document.addEventListener('click',event=>{
    if(navigating||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const anchor=event.target.closest?.('a[href]');
    if(!anchor||anchor.hasAttribute('target')||anchor.hasAttribute('download'))return;

    let target;
    try{target=new URL(anchor.href,location.href)}catch{return}
    if(!['http:','https:'].includes(target.protocol)||target.origin!==location.origin)return;
    const pageName=target.pathname.split('/').pop()||'';
    if(pageName.includes('.')&&!pageName.endsWith('.html'))return;
    const sameDocument=target.pathname===location.pathname&&target.search===location.search;
    if((sameDocument&&target.hash)||target.href===location.href||reducedMotion.matches||nativePageTransitions)return;

    event.preventDefault();
    navigating=true;
    setLoader('leaving','ARCHIVE ROUTE / SIGNAL HANDOFF','72');
    hideTimer=setTimeout(()=>location.assign(target.href),220);
  });

  addEventListener('pageshow',event=>{
    if(event.persisted||routeLoader.dataset.state==='leaving')hideLoader();
    if(reducedMotion.matches)applyScroll(false);
    else updateScroll();
  });
})();
