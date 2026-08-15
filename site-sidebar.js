(()=>{
  if(window.__hooxiSiteSidebar)return;
  window.__hooxiSiteSidebar=true;

  const body=document.body;
  if(!body||!body.classList.contains('subpage'))return;

  const TRAIL_KEY='hooxi:nav-trail';
  const MOBILE_MQ=window.matchMedia('(max-width:760px)');

  const LANES=[
    {id:'home',href:'index.html',label:'总览',short:'总'},
    {id:'mainline',href:'mainline.html',label:'主线',short:'主'},
    {id:'stories',href:'stories.html',label:'角色与阵营',short:'角'},
    {id:'events',href:'events.html',label:'往期活动',short:'活'},
    {id:'cultivate',href:'cultivate.html',label:'养成',short:'养'},
    {id:'behind',href:'behind-scenes.html',label:'幕后',short:'幕'}
  ];

  const pageFile=()=>{
    const name=(location.pathname.split('/').pop()||'').trim();
    return name||'index.html';
  };

  const laneIdForPage=file=>{
    if(file==='index.html'||file==='')return 'home';
    if(file==='mainline.html')return 'mainline';
    if(file==='stories.html'||file==='character.html'||file==='faction.html')return 'stories';
    if(file==='events.html')return 'events';
    if(file==='cultivate.html')return 'cultivate';
    if(file==='behind-scenes.html')return 'behind';
    return '';
  };

  const currentFile=pageFile();
  const currentLaneId=laneIdForPage(currentFile);
  const currentIndex=LANES.findIndex(lane=>lane.id===currentLaneId);
  const prevLane=currentIndex>0?LANES[currentIndex-1]:null;
  const nextLane=currentIndex>=0&&currentIndex<LANES.length-1?LANES[currentIndex+1]:null;

  const emptyTrail=()=>({stack:[],index:-1});

  const readTrail=()=>{
    try{
      const raw=sessionStorage.getItem(TRAIL_KEY);
      if(!raw)return emptyTrail();
      const parsed=JSON.parse(raw);
      const stack=Array.isArray(parsed.stack)?parsed.stack.map(String):[];
      let index=Number(parsed.index);
      if(!Number.isFinite(index))index=stack.length-1;
      index=Math.max(-1,Math.min(stack.length-1,index));
      return {stack,index};
    }catch{
      return emptyTrail();
    }
  };

  const writeTrail=trail=>{
    try{sessionStorage.setItem(TRAIL_KEY,JSON.stringify(trail))}catch{/* ignore */}
  };

  const currentEntry=()=>`${currentFile}${location.search||''}${location.hash||''}`;

  const recordTrailVisit=()=>{
    const entry=currentEntry();
    const trail=readTrail();
    if(trail.index>=0&&trail.stack[trail.index]===entry)return trail;
    const stack=trail.stack.slice(0,Math.max(0,trail.index)+1);
    if(stack[stack.length-1]!==entry)stack.push(entry);
    if(stack.length>40)stack.splice(0,stack.length-40);
    const next={stack,index:stack.length-1};
    writeTrail(next);
    return next;
  };

  const pushTrailBeforeLeave=()=>{
    try{
      const trail=readTrail();
      const entry=currentEntry();
      const stack=trail.stack.slice(0,Math.max(0,trail.index)+1);
      if(stack[stack.length-1]!==entry)stack.push(entry);
      writeTrail({stack,index:stack.length-1});
    }catch{/* ignore */}
  };

  recordTrailVisit();

  const root=document.createElement('div');
  root.className='site-sidebar-root';

  const backdrop=document.createElement('button');
  backdrop.type='button';
  backdrop.className='site-sidebar-backdrop';
  backdrop.setAttribute('aria-label','关闭栏目侧栏');
  backdrop.hidden=true;

  const aside=document.createElement('aside');
  aside.className='site-sidebar';
  aside.id='siteSidebar';
  aside.setAttribute('aria-label','站点栏目导航');

  aside.innerHTML=`
    <div class="site-sidebar-head">
      <button type="button" class="site-sidebar-toggle" data-sidebar-toggle aria-expanded="false" aria-controls="siteSidebar" title="展开栏目 [">
        <span class="site-sidebar-toggle-mark" aria-hidden="true">☰</span>
        <span class="site-sidebar-label">栏目</span>
      </button>
    </div>
    <nav class="site-sidebar-nav" aria-label="档案栏目">
      ${LANES.map(lane=>`
        <a class="site-sidebar-link" href="${lane.href}" data-lane="${lane.id}" title="${lane.label}">
          <span class="site-sidebar-short" aria-hidden="true">${lane.short}</span>
          <span class="site-sidebar-label">${lane.label}</span>
        </a>
      `).join('')}
      <a class="site-sidebar-link site-sidebar-search" href="stories.html#agentSearchForm" title="搜索代理人">
        <span class="site-sidebar-short" aria-hidden="true">搜</span>
        <span class="site-sidebar-label">搜索</span>
      </a>
    </nav>
    <div class="site-sidebar-foot">
      <div class="site-sidebar-tools" role="group" aria-label="栏目翻页">
        <button type="button" class="site-sidebar-tool" data-lane-prev ${prevLane?'':'disabled'} title="${prevLane?`上一栏目：${prevLane.label}`:'已是首个栏目'}" aria-label="${prevLane?`上一栏目：${prevLane.label}`:'上一栏目不可用'}">←</button>
        <button type="button" class="site-sidebar-tool" data-lane-next ${nextLane?'':'disabled'} title="${nextLane?`下一栏目：${nextLane.label}`:'已是末个栏目'}" aria-label="${nextLane?`下一栏目：${nextLane.label}`:'下一栏目不可用'}">→</button>
      </div>
      <div class="site-sidebar-tools" role="group" aria-label="浏览器历史">
        <button type="button" class="site-sidebar-tool" data-hist-back title="浏览器后退" aria-label="浏览器后退">↩</button>
        <button type="button" class="site-sidebar-tool" data-hist-forward title="浏览器前进" aria-label="浏览器前进">↪</button>
      </div>
    </div>
  `;

  root.append(backdrop,aside);
  body.prepend(root);
  body.classList.add('has-site-sidebar');

  const toggleBtn=aside.querySelector('[data-sidebar-toggle]');
  const backBtn=aside.querySelector('[data-hist-back]');
  const forwardBtn=aside.querySelector('[data-hist-forward]');
  const prevBtn=aside.querySelector('[data-lane-prev]');
  const nextBtn=aside.querySelector('[data-lane-next]');

  // 侧栏永远从隐藏态开始，不记忆上次状态，否则刷新后会自己弹出。
  const setExpanded=open=>{
    const expanded=!!open;
    body.classList.toggle('is-sidebar-expanded',expanded);
    aside.classList.toggle('is-expanded',expanded);
    toggleBtn.setAttribute('aria-expanded',expanded?'true':'false');
    toggleBtn.title=expanded?'收起栏目 [':'展开栏目 [';
    const showBackdrop=expanded&&MOBILE_MQ.matches;
    backdrop.hidden=!showBackdrop;
    backdrop.classList.toggle('is-visible',showBackdrop);
  };

  const syncActive=()=>{
    aside.querySelectorAll('.site-sidebar-link[data-lane]').forEach(anchor=>{
      const active=anchor.dataset.lane===currentLaneId;
      anchor.classList.toggle('is-active',active);
      if(active)anchor.setAttribute('aria-current','page');
      else anchor.removeAttribute('aria-current');
    });
  };

  const syncHistoryButtons=()=>{
    // Best-effort affordance only. Prefer leaving clicks enabled over hard-disable
    // when the trail is incomplete — browser history.back/forward can no-op safely.
    try{
      const trail=readTrail();
      const canBack=trail.index>0||(typeof history.length==='number'&&history.length>1);
      const canForward=trail.index>=0&&trail.index<trail.stack.length-1;
      if(canBack){
        backBtn.removeAttribute('aria-disabled');
      }else{
        backBtn.setAttribute('aria-disabled','true');
      }
      if(canForward){
        forwardBtn.removeAttribute('aria-disabled');
      }else{
        forwardBtn.setAttribute('aria-disabled','true');
      }
      backBtn.disabled=false;
      forwardBtn.disabled=false;
    }catch{
      backBtn.disabled=false;
      forwardBtn.disabled=false;
    }
  };

  // Always start collapsed, hover-to-expand
  setExpanded(false);
  syncActive();
  syncHistoryButtons();

  // Auto-expand on hover near left edge
  let hoverExpandTimer=null;
  let isHoverExpanded=false;

  const checkHoverExpand=(event)=>{
    if(MOBILE_MQ.matches)return;
    const expanded=body.classList.contains('is-sidebar-expanded');
    // 沉浸式角色舞台:关闭"贴左边缘自动弹出",避免拖卡片/点立绘误触发。
    // 仍可点把手或按 [ 展开;已展开时保持展开。
    const immersiveDetail=body.classList.contains('archive-stories')&&!expanded;
    if(immersiveDetail){
      if(hoverExpandTimer)clearTimeout(hoverExpandTimer);
      return;
    }
    // Collapsed: arm on the left edge. Expanded: stay armed across the panel's full
    // width. Use offsetWidth, not getBoundingClientRect — the latter includes the
    // slide-in transform, so a mid-animation pointer move reads as "already left".
    const edge=expanded?aside.offsetWidth:60;
    const shouldExpand=event.clientX<=edge;

    if(shouldExpand&&!expanded){
      if(hoverExpandTimer)clearTimeout(hoverExpandTimer);
      hoverExpandTimer=setTimeout(()=>{
        setExpanded(true);
        isHoverExpanded=true;
      },150);
    }else if(!shouldExpand&&isHoverExpanded){
      if(hoverExpandTimer)clearTimeout(hoverExpandTimer);
      hoverExpandTimer=setTimeout(()=>{
        setExpanded(false);
        isHoverExpanded=false;
      },300);
    }
  };

  addEventListener('mousemove',checkHoverExpand);

  // Clicking the toggle takes over from hover auto-collapse.
  const toggleExpanded=()=>{
    isHoverExpanded=false;
    if(hoverExpandTimer)clearTimeout(hoverExpandTimer);
    setExpanded(!body.classList.contains('is-sidebar-expanded'));
  };

  toggleBtn.addEventListener('click',toggleExpanded);
  backdrop.addEventListener('click',()=>setExpanded(false));

  const isTypingTarget=target=>{
    if(!(target instanceof Element))return false;
    if(target.isContentEditable)return true;
    const tag=target.tagName;
    return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
  };

  addEventListener('keydown',event=>{
    if(event.key==='Escape'&&body.classList.contains('is-sidebar-expanded')&&MOBILE_MQ.matches){
      setExpanded(false);
      toggleBtn.focus();
      return;
    }
    if(event.key!=='[')return;
    if(event.metaKey||event.ctrlKey||event.altKey)return;
    if(isTypingTarget(event.target))return;
    event.preventDefault();
    toggleExpanded();
  });

  const onMobileChange=()=>{
    setExpanded(false);
    isHoverExpanded=false;
  };
  if(typeof MOBILE_MQ.addEventListener==='function')MOBILE_MQ.addEventListener('change',onMobileChange);
  else if(typeof MOBILE_MQ.addListener==='function')MOBILE_MQ.addListener(onMobileChange);

  prevBtn?.addEventListener('click',()=>{
    if(!prevLane)return;
    pushTrailBeforeLeave();
    location.assign(prevLane.href);
  });

  nextBtn?.addEventListener('click',()=>{
    if(!nextLane)return;
    pushTrailBeforeLeave();
    location.assign(nextLane.href);
  });

  backBtn.addEventListener('click',()=>{
    try{
      const trail=readTrail();
      if(trail.index>0)writeTrail({stack:trail.stack,index:trail.index-1});
    }catch{/* ignore */}
    history.back();
  });

  forwardBtn.addEventListener('click',()=>{
    try{
      const trail=readTrail();
      if(trail.index>=0&&trail.index<trail.stack.length-1){
        writeTrail({stack:trail.stack,index:trail.index+1});
      }
    }catch{/* ignore */}
    history.forward();
  });

  aside.querySelectorAll('.site-sidebar-link[href]').forEach(anchor=>{
    anchor.addEventListener('click',event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      let target;
      try{target=new URL(anchor.href,location.href)}catch{return}
      const sameDocument=target.pathname===location.pathname&&target.search===location.search;
      if(sameDocument&&target.hash){
        if(MOBILE_MQ.matches)setExpanded(false);
        return;
      }
      pushTrailBeforeLeave();
      if(MOBILE_MQ.matches)setExpanded(false);
    });
  });

  addEventListener('popstate',()=>{
    recordTrailVisit();
    syncHistoryButtons();
  });

  addEventListener('pageshow',()=>{
    recordTrailVisit();
    syncHistoryButtons();
  });
})();
