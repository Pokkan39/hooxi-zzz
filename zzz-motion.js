(function(){
  'use strict';
  /* 规范 4.1 要求底层五条铺到所有页面。
     其中噪点扫描线与自定义光标／磁吸不依赖首页结构，可全站生效；
     信号锁定入场与标题逐字浮现依赖 .home-act 与 #heroTitle，仅首页有。 */
  const isHome=document.body.classList.contains('home-page');

  const nativeReduceQuery={matches:false,addEventListener:()=>{}};
  // 预览开关：仅当访客系统开启「减少动态效果」时，允许显式加 ?motion=force 预览动效。
  // 支持 localStorage 持久化：点一次后刷新/跳页都保持 force 状态，提供关闭出口。
  const forcedPreview=new URLSearchParams(location.search).get('motion')==='force';
  // 若 URL 有 force 参数，写入 localStorage 供后续页面使用
  if(forcedPreview){try{localStorage.setItem('zzzMotionForce','1');}catch(e){}}
  // 若 localStorage 有持久化的 force，等效 URL 参数
  const persistedForce=!forcedPreview&&(()=>{try{return localStorage.getItem('zzzMotionForce')==='1';}catch(e){return false;}})();
  const isForced=forcedPreview||persistedForce;
  const reduceQuery={
    get matches(){return false;},
    addEventListener:()=>{},
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
    jitter.to(state,{
      duration:.25,
      noise:0,
      clear:1,
      ease:'power2.out',
      onUpdate(){
        node.style.setProperty('--zzz-lock-noise',String(state.noise.toFixed(3)));
        node.style.setProperty('--zzz-lock-clear',String(state.clear.toFixed(3)));
        node.style.setProperty('--sx',`${(Math.random()*3-1.5).toFixed(2)}px`);
        node.style.setProperty('--sy',`${(Math.random()*3-1.5).toFixed(2)}px`);
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
      duration:.65,
      yPercent:70,
      opacity:0,
      filter:'blur(4px)',
      ease:'power2.out',
      stagger:.025,
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

  /* ---------- Hero 入场 stagger timeline ---------- */
  const initHeroEntrance=()=>{
    if(reduceQuery.matches||!gsap)return;
    const tl=gsap.timeline();
    const q=s=>document.querySelectorAll(s);
    const one=s=>document.querySelector(s);

    const eyebrow=one('.hero .eyebrow');
    if(eyebrow)tl.from(eyebrow,{y:20,opacity:0,duration:0.6,ease:'power2.out',clearProps:'all'},0);

    const viewport=one('.hero-layered');
    if(viewport)tl.from(viewport,{opacity:0,filter:'blur(6px)',duration:0.8,ease:'power2.out',clearProps:'all'},0.1);

    const intro=one('#heroIntro');
    if(intro)tl.from(intro,{y:16,opacity:0,duration:0.5,ease:'power2.out',clearProps:'all'},0.4);

    const actions=[...q('.hero-actions > *')];
    if(actions.length)tl.from(actions,{y:20,opacity:0,stagger:0.12,duration:0.5,ease:'power2.out',clearProps:'all'},0.6);

    const scrollHint=one('.hero-scroll-hint');
    if(scrollHint)tl.from(scrollHint,{y:10,opacity:0,duration:0.4,ease:'power2.out',clearProps:'all'},1.2);
  };

  /* ---------- P3: Hero Pinned 段 ---------- */
  const initHeroPin=()=>{
    if(!gsap||!ScrollTrigger||!isHome)return;
    const hero=document.querySelector('.hero');
    const heroCopy=document.querySelector('.hero-copy');
    const heroArt=document.querySelector('#homeHeroArt');
    if(!hero||!heroCopy||!heroArt)return;

    const tl=gsap.timeline({
      scrollTrigger:{
        trigger:hero,
        start:'top top',
        end:'+=60%',
        pin:true,
        scrub:0.5,
        pinSpacing:true,
      }
    });
    // 标题区：模糊 + 缩小 + 淡出
    tl.to(heroCopy,{scale:0.9,filter:'blur(8px)',opacity:0,ease:'none'},0);
    // 影画区：微放大
    tl.to(heroArt,{scale:1.08,ease:'none'},0);
    // 整体最终淡出
    tl.to(hero,{opacity:0,ease:'power1.in'},.7);
  };

  /* ---------- P4: 辉光文字 ---------- */
  const initGlowText=()=>{
    if(!gsap||!ScrollTrigger||!isHome)return;
    const headings=[...document.querySelectorAll('.home-act h2')];
    headings.forEach(h2=>{
      h2.classList.add('zzz-glow-text');
      ScrollTrigger.create({
        trigger:h2,
        start:'top 85%',
        once:true,
        onEnter:()=>{
          h2.classList.add('is-glowing');
          setTimeout(()=>h2.classList.remove('is-glowing'),500);
        }
      });
    });
  };

  /* ---------- P4: HUD 角标 ---------- */
  const initHudFrames=()=>{
    if(!gsap||!ScrollTrigger||!isHome)return;
    const heads=[...document.querySelectorAll('.home-act .section-head')];
    heads.forEach(head=>{
      if(head.classList.contains('zzz-hud-frame'))return;
      head.classList.add('zzz-hud-frame');
      // 注入额外伪元素载体（另两角）
      const extra=document.createElement('span');
      extra.className='zzz-hud-frame__extra';
      extra.setAttribute('aria-hidden','true');
      head.appendChild(extra);
      // 注入扫描线
      const scan=document.createElement('span');
      scan.className='zzz-hud-scan';
      scan.setAttribute('aria-hidden','true');
      head.appendChild(scan);
      // ScrollTrigger 触发
      ScrollTrigger.create({
        trigger:head,
        start:'top 85%',
        once:true,
        onEnter:()=>head.classList.add('is-hud-on')
      });
    });
  };

  /* ---------- P4: 命中反馈 ---------- */
  const initHitFeedback=()=>{
    if(!gsap)return;
    // 全站按钮/链接点击涟漪 + 缩放弹跳
    document.addEventListener('pointerdown',e=>{
      const target=e.target instanceof Element?e.target.closest('a,button,[data-fx]'):null;
      if(!target)return;
      // 缩放弹跳
      gsap.fromTo(target,
        {scale:1},
        {scale:0.92,duration:0.08,ease:'power2.in',yoyo:true,repeat:1,
         onComplete:()=>gsap.to(target,{scale:1.04,duration:0.12,ease:'back.out(3)',
           onComplete:()=>gsap.set(target,{clearProps:'scale'})
         })
        }
      );
      // 涟漪
      const rect=target.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='zzz-ripple';
      ripple.style.left=(e.clientX-rect.left)+'px';
      ripple.style.top=(e.clientY-rect.top)+'px';
      target.style.position=target.style.position||'relative';
      target.style.overflow='hidden';
      target.appendChild(ripple);
      setTimeout(()=>ripple.remove(),500);
    });
  };

  /* ---------- P4: 能量流 ---------- */
  const initEnergyFlow=()=>{
    if(!isHome)return;
    // 仅 Hero 底部加能量流，不铺全站避免视觉疲劳
    const hero=document.querySelector('.hero');
    const addFlow=(el)=>{
      if(!el||el.classList.contains('zzz-energy-flow'))return;
      el.classList.add('zzz-energy-flow');
      const pulse=document.createElement('span');
      pulse.className='zzz-energy-pulse';
      pulse.setAttribute('aria-hidden','true');
      el.appendChild(pulse);
    };
    if(hero)addFlow(hero);
  };

  /* ---------- P2: 全站 stagger 入场 ---------- */
  const initPageStagger=()=>{
    if(!gsap||!ScrollTrigger)return;
    // 首页楼层内容区 stagger 入场
    const sections=[...document.querySelectorAll('.route-section,.about')];
    sections.forEach(sec=>{
      const children=[...sec.querySelectorAll('.start-paths > *,.home-agent-rail > *,.home-lane-grid > *,.about-credits > *,.archive-reel-links > *,.section-note')];
      if(!children.length)return;
      gsap.set(children,{opacity:0,y:24,scale:1,filter:'blur(3px)'});
      ScrollTrigger.create({
        trigger:sec,
        start:'top 82%',
        once:true,
        onEnter:()=>{
          gsap.to(children,{
            opacity:1,y:0,scale:1,filter:'blur(0px)',
            duration:0.55,stagger:0.08,ease:'power2.out',clearProps:'all'
          });
        }
      });
    });
  };

  /* ---------- P2: 背景渐变（分段色带） ---------- */
  const initBgShift=()=>{
    if(!gsap||!ScrollTrigger||!isHome)return;
    const root=document.documentElement;
    const sections=[...document.querySelectorAll('.route-section,.about')];
    // 每个楼层进入时加深背景
    const levels=['var(--bg)','var(--bg-soft)','var(--bg-panel)','var(--bg-soft)','var(--bg)'];
    sections.forEach((sec,i)=>{
      const bg=levels[Math.min(i,levels.length-1)];
      ScrollTrigger.create({
        trigger:sec,
        start:'top 60%',
        end:'bottom 40%',
        onEnter:()=>gsap.to(document.body,{backgroundColor:bg,duration:0.8,ease:'power1.inOut',overwrite:'auto'}),
        onLeaveBack:()=>{
          const prev=levels[Math.max(0,Math.min(i-1,levels.length-1))];
          gsap.to(document.body,{backgroundColor:prev,duration:0.8,ease:'power1.inOut',overwrite:'auto'});
        }
      });
    });
  };

  const boot=()=>{
    mountScanlines();
    initHitFeedback();
    if(isHome){
      initHeroEntrance();
      initHeroPin();
      initSignalLock();
      initSplitRevealWhenStable();
      initFloorRail();
      initPageStagger();
      initBgShift();
      initGlowText();
      initHudFrames();
      initEnergyFlow();
    }else{
      // 非首页也做 stagger 入场
      initPageStagger();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
