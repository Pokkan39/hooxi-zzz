(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  const fineQuery=window.matchMedia('(hover:hover) and (pointer:fine)');
  const reduceQuery=window.matchMedia('(prefers-reduced-motion:reduce)');

  // A1: 视差倍率加大 — far ±6px, mid ±16px, near ±28px
  const PX_X=80,PX_Y=28;
  const FAR_RATE=-0.075;
  const MID_RATE=0.20;
  const NEAR_RATE=0.35;
  const GLOW_RATE=0.30;
  const FRONT_RATE=-0.18;

  const init=()=>{
    const hero=document.querySelector('.hero');
    const art=document.querySelector('#homeHeroArt');
    if(!hero||!art||!window.gsap)return;
    const gsap=window.gsap;

    // 注入氛围光层
    if(!art.querySelector('.zzz-hero-glow')){
      const g=document.createElement('div');
      g.className='zzz-hero-glow';
      g.setAttribute('aria-hidden','true');
      art.prepend(g);
    }

    const farEl=art.querySelector('.carve-layer--far');
    const midEl=art.querySelector('.carve-layer--mid');
    const nearEl=art.querySelector('.carve-layer--near');
    const glowEl=art.querySelector('.zzz-hero-glow');
    const frontEl=document.querySelector('.hero-copy');
    const particlesEl=art.querySelector('.carve-particles');

    // === A3: 生成 20 个粒子光点 ===
    if(particlesEl && !particlesEl.dataset.dotsReady){
      particlesEl.dataset.dotsReady='1';
      const DOT_COUNT=20;
      const colors=['rgba(255,220,100,.6)','rgba(255,255,255,.5)','rgba(255,200,80,.55)','rgba(216,250,0,.4)','rgba(62,199,214,.35)'];
      for(let i=0;i<DOT_COUNT;i++){
        const dot=document.createElement('span');
        dot.className='carve-dot';
        dot.setAttribute('aria-hidden','true');
        const size=2+Math.random()*2; // 2-4px
        const top=5+Math.random()*90; // 5%-95%
        const left=5+Math.random()*90;
        const dur=4+Math.random()*5; // 4-9s
        const delay=Math.random()*5; // 0-5s
        const o1=(0.3+Math.random()*0.2).toFixed(2);
        const o2=(0.5+Math.random()*0.2).toFixed(2);
        const color=colors[Math.floor(Math.random()*colors.length)];
        dot.style.cssText=`width:${size}px;height:${size}px;top:${top}%;left:${left}%;background:${color};--dot-dur:${dur.toFixed(1)}s;--dot-delay:-${delay.toFixed(1)}s;--dot-o1:${o1};--dot-o2:${o2};`;
        particlesEl.appendChild(dot);
      }
    }

    // === A4: 分段进场动画（GSAP 控制 art 层，CSS 控制 hero-copy 和粒子）===
    if(!reduceQuery.matches){
      // 先隐藏 art 层（GSAP 入场前）
      if(farEl)gsap.set(farEl,{opacity:0,scale:1.05,z:0,x:0,y:0});
      if(midEl)gsap.set(midEl,{opacity:0,scale:1.0237,z:25,x:0,y:0});
      if(nearEl)gsap.set(nearEl,{opacity:0,scale:0.9975,z:50,x:0,y:20});

      // 入场 timeline：far → mid → near → text → particles
      const entrance=gsap.timeline({
        defaults:{ease:'power2.out'},
        onComplete(){
          // 入场结束后清理 inline opacity，让 CSS animation 接管 near glow
          if(farEl)gsap.set(farEl,{clearProps:'opacity'});
          if(midEl)gsap.set(midEl,{clearProps:'opacity'});
          if(nearEl)gsap.set(nearEl,{clearProps:'opacity,y'});
        }
      });
      // far 层淡入（0ms）
      if(farEl)entrance.to(farEl,{opacity:1,duration:0.6,ease:'power2.out'},0);
      // mid 层淡入（200ms）
      if(midEl)entrance.to(midEl,{opacity:1,duration:0.6,ease:'power2.out'},0.2);
      // near 层从下方滑入（400ms）
      if(nearEl)entrance.to(nearEl,{opacity:1,y:0,duration:0.6,ease:'power2.out'},0.4);
      // 600ms 后触发 hero-copy CSS 入场
      entrance.call(()=>{hero.classList.add('hero-entrance-done');},null,0.6);
      // 800ms 后触发粒子 CSS 入场
      entrance.call(()=>{hero.classList.add('hero-particles-on');},null,0.8);

    } else {
      // reduced-motion: 立即显示所有，无动画
      if(farEl)gsap.set(farEl,{scale:1.05,z:0,x:0,y:0});
      if(midEl)gsap.set(midEl,{scale:1.0237,z:25,x:0,y:0});
      if(nearEl)gsap.set(nearEl,{scale:0.9975,z:50,x:0,y:0});
      hero.classList.add('hero-entrance-done');
      hero.classList.add('hero-particles-on');
    }

    // === 持续呼吸动画（Live2D 感）===
    let breath=null;
    if(!reduceQuery.matches){
      breath=gsap.timeline({repeat:-1,yoyo:true,defaults:{ease:'sine.inOut'}});
      // scale 三层同时长同缓动，保持层间对齐
      if(farEl)breath.to(farEl,{scale:1.07,duration:9},0);
      if(midEl)breath.to(midEl,{scale:1.04325,duration:9},0);
      if(nearEl)breath.to(nearEl,{scale:1.0165,duration:9},0);
      // 微旋+极小位移，各层节奏不同步 → Live2D 感
      if(farEl)breath.to(farEl,{rotation:-0.15,x:3,y:2,duration:9},0);
      if(midEl)breath.to(midEl,{rotation:0.2,x:-3,y:2,duration:7,ease:'power1.inOut'},0);
      if(nearEl)breath.to(nearEl,{rotation:-0.1,x:2,y:-3,duration:4.5,ease:'back.inOut(1.2)'},0);
      if(glowEl)breath.to(glowEl,{x:6,y:-4,scale:1.04,duration:11},0);
    }

    // === A1: 鼠标视差（用 CSS translate 属性叠加，不干扰 GSAP 的 transform）===
    let rafId=0;
    let targetNx=0,targetNy=0,curNx=0,curNy=0;
    const LERP=0.06; // 柔和缓动

    const applyParallax=()=>{
      curNx+=(targetNx-curNx)*LERP;
      curNy+=(targetNy-curNy)*LERP;
      const ax=curNx*PX_X,ay=curNy*PX_Y;
      if(farEl)farEl.style.translate=`${ax*FAR_RATE}px ${ay*FAR_RATE}px`;
      if(midEl)midEl.style.translate=`${ax*MID_RATE}px ${ay*MID_RATE}px`;
      if(nearEl)nearEl.style.translate=`${ax*NEAR_RATE}px ${ay*NEAR_RATE}px`;
      if(glowEl)glowEl.style.translate=`${ax*GLOW_RATE}px ${ay*GLOW_RATE}px`;
      if(frontEl)frontEl.style.setProperty('--home-copy-x',`${ax*FRONT_RATE}px`);
      if(frontEl)frontEl.style.setProperty('--home-copy-y',`${ay*FRONT_RATE}px`);
      rafId=requestAnimationFrame(applyParallax);
    };

    const resetParallax=()=>{targetNx=0;targetNy=0;};

    const onMove=event=>{
      const rect=hero.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const clamp=v=>Math.max(-1,Math.min(1,v));
      targetNx=clamp(((event.clientX-rect.left)/rect.width)*2-1);
      targetNy=clamp(((event.clientY-rect.top)/rect.height)*2-1);
    };

    let bound=false;
    const sync=()=>{
      const on=fineQuery.matches;
      if(on===bound)return;
      bound=on;
      if(on){
        hero.addEventListener('pointermove',onMove,{passive:true});
        hero.addEventListener('pointerleave',resetParallax,{passive:true});
        hero.addEventListener('pointercancel',resetParallax,{passive:true});
        if(!rafId)rafId=requestAnimationFrame(applyParallax);
      }else{
        hero.removeEventListener('pointermove',onMove);
        hero.removeEventListener('pointerleave',resetParallax);
        hero.removeEventListener('pointercancel',resetParallax);
        cancelAnimationFrame(rafId);rafId=0;
        [farEl,midEl,nearEl,glowEl].forEach(el=>{if(el)el.style.translate='';});
      }
    };

    fineQuery.addEventListener('change',sync);
    reduceQuery.addEventListener('change',()=>{
      if(reduceQuery.matches&&breath){breath.kill();breath=null;}
      sync();
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetParallax();});
    sync();

    // === C3: 滚动缩放视差 — far 层随页面滚出轻微 scale 1.0→1.06 ===
    if(!reduceQuery.matches && farEl){
      farEl.style.willChange='transform';
      let scrollRaf=0;
      const onScroll=()=>{
        if(scrollRaf)return;
        scrollRaf=requestAnimationFrame(()=>{
          scrollRaf=0;
          const heroH=hero.offsetHeight||1;
          const scrollY=window.scrollY||pageYOffset;
          const ratio=Math.min(1,scrollY/heroH);
          const sc=1+ratio*0.06; // 1.0 → 1.06
          farEl.style.setProperty('--far-scroll-scale',sc.toFixed(4));
        });
      };
      window.addEventListener('scroll',onScroll,{passive:true});
    }

    window.__zzzHeroParallax={mode:'card-carve-live2d-phaseABC',FAR_RATE,MID_RATE,NEAR_RATE,breath:!!breath};
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
