(function(){
  'use strict';
  /* 规范 4.1 要求底层五条铺到所有页面。
     其中噪点扫描线与自定义光标／磁吸不依赖首页结构，可全站生效；
     信号锁定入场与标题逐字浮现依赖 .home-act 与 #heroTitle，仅首页有。 */
  const isHome=document.body.classList.contains('home-page');

  const nativeReduceQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  // 预览开关：仅当访客系统开启「减少动态效果」时，允许显式加 ?motion=force 预览动效。
  // 支持 localStorage 持久化：点一次后刷新/跳页都保持 force 状态，提供关闭出口。
  const forcedPreview=new URLSearchParams(location.search).get('motion')==='force';
  // 若 URL 有 force 参数，写入 localStorage 供后续页面使用
  if(forcedPreview){try{localStorage.setItem('zzzMotionForce','1');}catch(e){}}
  // 若 localStorage 有持久化的 force，等效 URL 参数
  const persistedForce=!forcedPreview&&(()=>{try{return localStorage.getItem('zzzMotionForce')==='1';}catch(e){return false;}})();
  const isForced=forcedPreview||persistedForce;
  const reduceQuery={
    get matches(){return nativeReduceQuery.matches&&!isForced;},
    addEventListener(type,handler){nativeReduceQuery.addEventListener(type,handler);},
  };
  if(isForced){
    document.body.classList.add('zzz-motion-forced');
    document.documentElement.classList.add('zzz-motion-forced');
    // 系统开启减少动效时，CSS 媒体查询会把 scroll-behavior 压回 auto；
    // 显式预览下直接在行内恢复平滑锚点滚动。
    document.documentElement.style.setProperty('scroll-behavior','smooth','important');
  }
  const gsap=window.gsap;
  const ScrollTrigger=window.ScrollTrigger;

  /* ---------- 14 噪点扫描线 ---------- */
  const mountScanlines=()=>{
    if(document.querySelector('.zzz-scanlines'))return;
    const layer=document.createElement('div');
    layer.className='zzz-scanlines';
    layer.setAttribute('aria-hidden','true');
    document.body.prepend(layer);
  };

  /* ---------- 05 信号锁定入场 ---------- */
  const LOCK_DELAYS=[0,.22,.44,.66];

  const prepare=node=>{
    const text=(node.textContent||'').trim();
    if(!text)return false;
    node.dataset.zzzLockText=text;
    if(!node.getAttribute('aria-label'))node.setAttribute('aria-label',text);
    return true;
  };

  const lockIn=(node,delay)=>{
    node.classList.add('is-locking');
    const state={noise:1,clear:0};
    const jitter=gsap.timeline({delay});
    // 逐帧随机写 --sx/--sy：静止颗粒像屏幕脏了，抖起来才像信号没锁住
    jitter.to(state,{
      duration:.52,
      noise:0,
      clear:1,
      ease:'power2.out',
      onUpdate(){
        node.style.setProperty('--zzz-lock-noise',String(state.noise.toFixed(3)));
        node.style.setProperty('--zzz-lock-clear',String(state.clear.toFixed(3)));
        node.style.setProperty('--sx',`${(Math.random()*8-4).toFixed(2)}px`);
        node.style.setProperty('--sy',`${(Math.random()*8-4).toFixed(2)}px`);
      },
      onComplete(){
        node.classList.remove('is-locking');
        node.classList.add('is-locked');
        ['--sx','--sy','--zzz-lock-noise','--zzz-lock-clear'].forEach(name=>node.style.removeProperty(name));
      },
    });
    return jitter;
  };

  /* 楼层编号导航错峰入场：DNA 第 7 节的 .section-nav 子元素 translate。
     与标题共用同一 ScrollTrigger 触发点，不新建第二套滚动监听。 */
  const navIn=nav=>{
    const rows=[...nav.children];
    if(!rows.length)return;
    gsap.from(rows,{duration:.5,y:14,opacity:0,ease:'power2.out',stagger:.08});
  };

  const initSignalLock=()=>{
    const heads=[...document.querySelectorAll('.home-act .section-head,.home-act .about-heading')];
    const targets=[...document.querySelectorAll('.home-act .section-head h2,.home-act .about-heading h2')].filter(prepare);
    if(!targets.length)return;
    if(reduceQuery.matches||!gsap)return;
    targets.forEach((node,index)=>{
      const delay=LOCK_DELAYS[Math.min(index,LOCK_DELAYS.length-1)];
      const nav=heads[index]?.querySelector('.section-nav');
      const run=()=>{lockIn(node,delay);if(nav)navIn(nav);};
      if(!ScrollTrigger){run();return;}
      ScrollTrigger.create({trigger:node,start:'top 88%',once:true,onEnter:run});
    });
  };

  /* ---------- 10 磁吸鼠标 + 12 自定义光标 ---------- */
  /* 共用单一 rAF 与单一 pointermove，不新建第二套全局循环。 */
  const initPointerLayer=()=>{
    const fineQuery=window.matchMedia('(hover:hover) and (pointer:fine)');
    // 首页用具名入口；其他正式页退回通用按钮与导航链接，避免逐页维护清单
    const MAGNET_SELECTOR=isHome
      ?'.hero-primary-action,.hero-play-action,.path-card,.archive-reel-links a,#heroCarouselPause'
      :'.topbar nav a,.button,button.play-button,.archive-card a,main a.button';
    const NO_CURSOR='input,textarea,select,[contenteditable="true"]';
    let dot=null;
    let frame=0;
    let enabled=false;
    let pointerX=0,pointerY=0,dotX=0,dotY=0;
    let magnetNode=null;

    const clearMagnet=()=>{
      if(!magnetNode)return;
      magnetNode.style.removeProperty('--zzz-magnet-x');
      magnetNode.style.removeProperty('--zzz-magnet-y');
      magnetNode.classList.remove('is-magnet');
      magnetNode=null;
    };

    const render=()=>{
      frame=0;
      if(!enabled)return;
      dotX+=(pointerX-dotX)*.18;
      dotY+=(pointerY-dotY)*.18;
      if(dot)dot.style.transform=`translate3d(${dotX.toFixed(2)}px,${dotY.toFixed(2)}px,0) translate(-50%,-50%)`;
      if(Math.abs(pointerX-dotX)>.1||Math.abs(pointerY-dotY)>.1)frame=requestAnimationFrame(render);
    };

    const onMove=event=>{
      pointerX=event.clientX;
      pointerY=event.clientY;
      const target=event.target instanceof Element?event.target:null;
      const hot=target?.closest(MAGNET_SELECTOR)||null;
      if(hot!==magnetNode)clearMagnet();
      if(hot){
        const rect=hot.getBoundingClientRect();
        const relX=(pointerX-(rect.left+rect.width/2))/Math.max(1,rect.width/2);
        const relY=(pointerY-(rect.top+rect.height/2))/Math.max(1,rect.height/2);
        const clamp=value=>Math.max(-1,Math.min(1,value));
        hot.style.setProperty('--zzz-magnet-x',`${(clamp(relX)*6).toFixed(2)}px`);
        hot.style.setProperty('--zzz-magnet-y',`${(clamp(relY)*4).toFixed(2)}px`);
        hot.classList.add('is-magnet');
        magnetNode=hot;
      }
      if(dot){
        const ring=!!target?.closest('a,button,summary');
        dot.classList.toggle('is-ring',ring);
        dot.classList.toggle('is-hidden',!!target?.closest(NO_CURSOR));
      }
      if(!frame)frame=requestAnimationFrame(render);
    };

    const reset=()=>{
      if(frame){cancelAnimationFrame(frame);frame=0;}
      clearMagnet();
      if(dot)dot.classList.add('is-hidden');
    };

    const enable=()=>{
      if(enabled)return;
      enabled=true;
      if(!dot){
        dot=document.createElement('div');
        dot.className='zzz-cursor is-hidden';
        dot.setAttribute('aria-hidden','true');
        document.body.append(dot);
      }
      document.body.classList.add('zzz-cursor-on');
      document.addEventListener('pointermove',onMove,{passive:true});
      document.addEventListener('pointerdown',onMove,{passive:true});
      window.addEventListener('blur',reset);
      document.addEventListener('mouseleave',reset);
    };

    const disable=()=>{
      enabled=false;
      document.body.classList.remove('zzz-cursor-on');
      document.removeEventListener('pointermove',onMove);
      document.removeEventListener('pointerdown',onMove);
      window.removeEventListener('blur',reset);
      document.removeEventListener('mouseleave',reset);
      reset();
      if(dot){dot.remove();dot=null;}
    };

    const sync=()=>{
      if(fineQuery.matches&&!reduceQuery.matches)enable();
      else disable();
    };
    fineQuery.addEventListener('change',sync);
    reduceQuery.addEventListener('change',sync);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
    sync();
  };

  /* ---------- 07 文字逐字浮现 ---------- */
  /* 规范 4.2：禁用付费 SplitText，自行拆 span 后 gsap.from(..., {stagger})；
     位移 1.1em + blur(6px) + scale(.82)，收尾回弹；
     原文必须写入容器 aria-label，避免屏幕阅读器逐字朗读。 */
  const initSplitReveal=()=>{
    const title=document.querySelector('#heroTitle');
    if(!title)return;
    if(title.dataset.zzzSplit==='on')return;
    const text=(title.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return;
    // 原文写入容器 aria-label，字符层全部 aria-hidden，避免逐字朗读
    title.setAttribute('aria-label',text);
    if(reduceQuery.matches||!gsap)return;

    // app.js 会用 innerHTML 重写标题（含 <br> 与 <span>），
    // 因此只递归替换文本节点，保留原有换行与次行结构。
    const spans=[];
    const splitTextNodes=node=>{
      [...node.childNodes].forEach(child=>{
        if(child.nodeType===Node.TEXT_NODE){
          const raw=child.nodeValue||'';
          if(!raw.trim())return;
          const frag=document.createDocumentFragment();
          [...raw].forEach(ch=>{
            const span=document.createElement('span');
            span.className='zzz-char';
            span.setAttribute('aria-hidden','true');
            span.textContent=ch===' '?'\u00a0':ch;
            frag.append(span);
            spans.push(span);
          });
          child.replaceWith(frag);
        }else if(child.nodeType===Node.ELEMENT_NODE&&child.tagName!=='BR'){
          splitTextNodes(child);
        }
      });
    };
    splitTextNodes(title);
    if(!spans.length)return;
    title.dataset.zzzSplit='on';

    gsap.from(spans,{
      duration:.72,
      yPercent:110,
      opacity:0,
      scale:.82,
      filter:'blur(6px)',
      ease:'back.out(1.6)',
      stagger:.028,
      clearProps:'all',
    });
  };

  // app.js 的 applyAppearance 会在启动后用 innerHTML 重写 #heroTitle，
  // 因此等标题内容稳定一帧后再拆分，避免被覆盖。
  const initSplitRevealWhenStable=()=>{
    const title=document.querySelector('#heroTitle');
    if(!title)return;
    let timer=0;
    const run=()=>{
      if(observer)observer.disconnect();
      initSplitReveal();
    };
    // 任何一次外部重写都重新计时，静默 260ms 后视为稳定再拆分
    const defer=()=>{
      clearTimeout(timer);
      timer=setTimeout(run,260);
    };
    const observer='MutationObserver' in window
      ?new MutationObserver(()=>{if(title.dataset.zzzSplit!=='on')defer();})
      :null;
    if(observer)observer.observe(title,{childList:true,characterData:true,subtree:true});
    defer();
  };

  /* ---------- C1 固定侧栏楼层页码 ---------- */
  /* 参考 DNA 第 5 节 aside.sidebar。显隐与当前项全部走 ScrollTrigger，
     不新建 scroll 监听（实测新增监听数为 0，共用库的统一 ticker）。
     首屏隐藏是刻意的：实测常驻会切进 Hero keyart 的斜切边框。 */
  const initFloorRail=()=>{
    if(document.querySelector('.zzz-rail'))return;
    const hero=document.querySelector('.hero');
    const floors=[...document.querySelectorAll('.route-section,.about')];
    if(!hero||!floors.length||!gsap||!ScrollTrigger)return;

    const rail=document.createElement('nav');
    rail.className='zzz-rail';
    rail.setAttribute('aria-label','楼层导航');

    const items=floors.map((sec,i)=>{
      // Hero 的 01 由 .hero::before 水印承担，楼层从 02 起
      const num=String(i+2).padStart(2,'0');
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='zzz-rail__item';
      btn.textContent=num;
      const label=(sec.querySelector('h2')?.textContent||num).trim();
      btn.setAttribute('aria-label',`跳到${label}`);
      btn.addEventListener('click',()=>{
        sec.scrollIntoView({behavior:reduceQuery.matches?'auto':'smooth',block:'start'});
      });
      rail.appendChild(btn);
      return btn;
    });
    document.body.appendChild(rail);

    const paint=idx=>items.forEach((btn,i)=>{
      const on=i===idx;
      btn.classList.toggle('is-current',on);
      btn.setAttribute('aria-current',on?'true':'false');
    });

    // Hero 底边过半屏才显示，保护 keyart
    ScrollTrigger.create({
      trigger:hero,
      start:'bottom 50%',
      onEnter:()=>rail.classList.add('is-on'),
      onLeaveBack:()=>rail.classList.remove('is-on'),
    });
    floors.forEach((sec,i)=>{
      ScrollTrigger.create({
        trigger:sec,
        start:'top 40%',
        end:'bottom 40%',
        onToggle:self=>{if(self.isActive)paint(i);},
      });
    });
    paint(0);
  };

  const boot=()=>{
    // 全站底层：扫描线与指针层（自定义光标 + 磁吸）
    mountScanlines();
    initPointerLayer();
    // 首页专属：依赖 .home-act 楼层与 #heroTitle
    if(isHome){
      initSignalLock();
      initSplitRevealWhenStable();
      initFloorRail();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
