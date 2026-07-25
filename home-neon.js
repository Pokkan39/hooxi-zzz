/* ============================================================
   HOOXI // 首页霓虹交互层（打样）
   仅首页引入；不修改 app.js 的轮播与数据逻辑，只在其渲染结果上叠加交互。
   删除 index.html 中的 script 引用即可完整回滚。
   ============================================================ */
(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. 鼠标跟随光标 ---------- */
  function initCursor(){
    // 光标跟随不含循环动画，reduce 下保留但去掉缩放过渡（由 CSS 控制）
    if(!finePointer)return;
    var dot=document.createElement('div');
    dot.className='neon-cursor';
    var ring=document.createElement('div');
    ring.className='neon-cursor-ring';
    dot.setAttribute('aria-hidden','true');
    ring.setAttribute('aria-hidden','true');
    document.body.append(dot,ring);

    // 初始置于视口外，待首次移动再显现，避免左上角残留光点
    var tx=-100,ty=-100,rx=tx,ry=ty,raf=null;
    dot.style.transform=ring.style.transform='translate3d(-100px,-100px,0)';
    function loop(){
      rx+=(tx-rx)*0.18;
      ry+=(ty-ry)*0.18;
      dot.style.transform='translate3d('+tx+'px,'+ty+'px,0)';
      ring.style.transform='translate3d('+rx+'px,'+ry+'px,0)';
      raf=requestAnimationFrame(loop);
    }
    addEventListener('pointermove',function(e){
      tx=e.clientX;ty=e.clientY;
      if(!raf)raf=requestAnimationFrame(loop);
    },{passive:true});
    addEventListener('pointerdown',function(){ring.classList.add('is-down')},{passive:true});
    addEventListener('pointerup',function(){ring.classList.remove('is-down')},{passive:true});
    // 悬停可交互元素时放大（含动态生成的卡片）
    var hot='a,button,input,select,summary,[role="button"],[role="tab"]';
    addEventListener('pointerover',function(e){
      if(e.target.closest&&e.target.closest(hot))ring.classList.add('is-hot');
    },{passive:true});
    addEventListener('pointerout',function(e){
      if(e.target.closest&&e.target.closest(hot))ring.classList.remove('is-hot');
    },{passive:true});
  }

  /* ---------- 2. 滚动进度条 ---------- */
  function initProgress(){
    var bar=document.createElement('div');
    bar.className='neon-progress';
    bar.setAttribute('aria-hidden','true');
    document.body.appendChild(bar);
    var ticking=false;
    function update(){
      var max=document.documentElement.scrollHeight-innerHeight;
      bar.style.setProperty('--p',max>0?(scrollY/max).toFixed(4):0);
      ticking=false;
    }
    addEventListener('scroll',function(){
      if(!ticking){ticking=true;requestAnimationFrame(update)}
    },{passive:true});
    update();
  }

  /* ---------- 3. 滚动入场 ---------- */
  var revealTargets=[
    '.hero-copy>*',
    '.section-head',
    '.path-card',
    '.home-agent-card',
    '.home-lane-card',
    '.home-lane-jump',
    '.about-column'
  ].join(',');

  var io=null;
  function ensureObserver(){
    if(io||reduce||!('IntersectionObserver' in window))return io;
    io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:0.12});
    return io;
  }

  function markReveal(root){
    var scope=root||document;
    var nodes=scope.querySelectorAll(revealTargets);
    if(reduce){
      nodes.forEach(function(n){n.dataset.neonReveal='';n.classList.add('is-in')});
      return;
    }
    var obs=ensureObserver();
    var groupIndex=new Map();
    nodes.forEach(function(node){
      if(node.dataset.neonReveal)return;
      node.dataset.neonReveal='';
      var key=node.parentElement||document.body;
      var i=(groupIndex.get(key)||0);
      groupIndex.set(key,i+1);
      node.style.setProperty('--neon-i',Math.min(i,8));
      if(obs)obs.observe(node);
      else node.classList.add('is-in');
    });
  }

  /* ---------- 4. 卡片磁吸倾斜 + 光斑 ---------- */
  var tiltSelector='.path-card,.home-agent-card,.home-lane-card';
  function bindTilt(){
    if(reduce||!finePointer)return;
    document.addEventListener('pointermove',function(e){
      var card=e.target.closest&&e.target.closest(tiltSelector);
      if(!card)return;
      var r=card.getBoundingClientRect();
      var px=(e.clientX-r.left)/r.width;
      var py=(e.clientY-r.top)/r.height;
      card.style.setProperty('--tilt-x',(px-0.5).toFixed(3));
      card.style.setProperty('--tilt-y',(py-0.5).toFixed(3));
      card.style.setProperty('--mx',(px*100).toFixed(1)+'%');
      card.style.setProperty('--my',(py*100).toFixed(1)+'%');
    },{passive:true});
    document.addEventListener('pointerout',function(e){
      var card=e.target.closest&&e.target.closest(tiltSelector);
      if(!card)return;
      card.style.setProperty('--tilt-x',0);
      card.style.setProperty('--tilt-y',0);
    },{passive:true});
  }

  /* ---------- 5. 主标题故障切字 ---------- */
  function initGlitch(){
    var h1=document.querySelector('.hero h1');
    if(!h1||reduce)return;
    function sync(){h1.dataset.glitch=(h1.textContent||'').trim()}
    sync();
    function fire(){
      sync();
      h1.classList.add('is-glitching');
      setTimeout(function(){h1.classList.remove('is-glitching')},340);
    }
    setTimeout(fire,700);
    h1.addEventListener('pointerenter',fire);
    // app.js 会重写标题文本，保持 data-glitch 同步
    new MutationObserver(sync).observe(h1,{childList:true,characterData:true,subtree:true});
  }

  /* ---------- 6. 监听动态渲染的卡片 ---------- */
  function watchDynamic(){
    var hosts=['#homeModules','#homeSecondaryRail','#homeAgentRail',
               '#homeLaneMainline','#homeLaneEvents','#homeLaneBehind']
      .map(function(s){return document.querySelector(s)}).filter(Boolean);
    if(!hosts.length)return;
    var mo=new MutationObserver(function(muts){
      var touched=false;
      muts.forEach(function(m){if(m.addedNodes&&m.addedNodes.length)touched=true});
      if(touched)markReveal();
    });
    hosts.forEach(function(h){mo.observe(h,{childList:true})});
  }

  function boot(){
    initCursor();
    initProgress();
    markReveal();
    bindTilt();
    initGlitch();
    watchDynamic();
    // app.js 异步渲染后补一次
    setTimeout(markReveal,300);
    setTimeout(markReveal,1200);
    // 兜底：任何已在视口内却仍未入场的元素强制显示，避免内容永久透明
    function failsafe(){
      document.querySelectorAll('[data-neon-reveal]:not(.is-in)').forEach(function(el){
        var r=el.getBoundingClientRect();
        // 已进入视口，或已滚过（在视口上方）的元素都直接显示
        if(r.top<innerHeight)el.classList.add('is-in');
      });
    }
    addEventListener('scroll',failsafe,{passive:true});
    addEventListener('resize',failsafe,{passive:true});
    setTimeout(failsafe,2000);
    // 动态内容可能在滚动后才渲染，限次轮询兜底后自动停止
    var passes=0;
    var timer=setInterval(function(){
      failsafe();
      if(++passes>=8)clearInterval(timer);
    },1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
