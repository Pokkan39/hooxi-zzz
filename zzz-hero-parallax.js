(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  const fineQuery=window.matchMedia('(hover:hover) and (pointer:fine)');
  const reduceQuery=window.matchMedia('(prefers-reduced-motion:reduce)');

  // 视差倍率（鼠标位移范围）
  const PX_X=80,PX_Y=25;
  const FAR_RATE=-0.04;
  const MID_RATE=0.10;
  const NEAR_RATE=0.22;
  const GLOW_RATE=0.26;
  const FRONT_RATE=-0.15;

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

    // === 持续呼吸动画（Live2D 感）===
    // GSAP 控制 x/y/scale/rotation — 这是唯一写 transform 的通道
    let breath=null;
    if(!reduceQuery.matches){
      // 设各层起始态：scale 已反解 translateZ 的透视放大（perspective 1000px），
      // 使三层有效缩放相等，消除静止态层间错位
      if(farEl)gsap.set(farEl,{scale:1.05,z:0,x:0,y:0});
      if(midEl)gsap.set(midEl,{scale:1.0237,z:25,x:0,y:0});
      if(nearEl)gsap.set(nearEl,{scale:0.9975,z:50,x:0,y:0});

      breath=gsap.timeline({repeat:-1,yoyo:true,defaults:{ease:'sine.inOut'}});
      // scale 三层必须同时长同缓动：时长不同会让各层有效缩放在动画中途拉开，
      // 重新引入层间错位（实测最大 14px），抵消起始态的对齐
      if(farEl)breath.to(farEl,{scale:1.07,duration:9},0);
      if(midEl)breath.to(midEl,{scale:1.04325,duration:9},0);
      if(nearEl)breath.to(nearEl,{scale:1.0165,duration:9},0);
      // 幅度克制：微旋+极小位移。各层节奏刻意不同步，这是 Live2D 感的来源
      if(farEl)breath.to(farEl,{rotation:-0.15,x:3,y:2,duration:9},0);
      if(midEl)breath.to(midEl,{rotation:0.2,x:-3,y:2,duration:7,ease:'power1.inOut'},0);
      if(nearEl)breath.to(nearEl,{rotation:-0.1,x:2,y:-3,duration:4.5,ease:'back.inOut(1.2)'},0);
      if(glowEl)breath.to(glowEl,{x:6,y:-4,scale:1.04,duration:11},0);
    }

    // === 鼠标视差（用 CSS translate 属性叠加，不干扰 GSAP 的 transform）===
    // CSS translate 和 transform 是独立属性，浏览器自动叠加渲染
    let rafId=0;
    let targetNx=0,targetNy=0,curNx=0,curNy=0;
    const LERP=0.08;

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
      // 视差只要求精确指针设备，不受 reduced-motion 限制
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

    window.__zzzHeroParallax={mode:'card-carve-live2d',FAR_RATE,MID_RATE,NEAR_RATE,breath:!!breath};
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
