(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  const nativeReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const forced=new URLSearchParams(location.search).get('motion')==='force';
  const isForced=(()=>{if(forced)return true;try{return localStorage.getItem('zzzMotionForce')==='1';}catch(e){return false;}})();
  const reduced=()=>nativeReduce.matches&&!isForced;
  const fineQuery=window.matchMedia('(hover:hover) and (pointer:fine)');

  // 影画视差参数：2880px 宽图在 ~1280px 视口有充足横向空间
  const PX_RANGE_X=130;
  const PX_RANGE_Y=32;
  const SLIDE_RATE=0.28;   // 影画本身移动（最远层）
  const GLOW_RATE=0.55;    // 氛围光中层
  const FRONT_RATE=-0.32;  // 文字反向（最前层）

  const init=()=>{
    const hero=document.querySelector('.hero');
    const art=document.querySelector('#homeHeroArt');
    if(!hero||!art||!window.gsap)return;
    const gsap=window.gsap;

    // 注入氛围光层（仍保留，提供景深感）
    if(!art.querySelector('.zzz-hero-glow')){
      const glow=document.createElement('div');
      glow.className='zzz-hero-glow';
      glow.setAttribute('aria-hidden','true');
      art.prepend(glow);
    }

    const glowEl=art.querySelector('.zzz-hero-glow');
    const frontEl=document.querySelector('.hero-copy');

    const glowX=glowEl?gsap.quickTo(glowEl,'x',{duration:.6,ease:'power2.out',overwrite:'auto'}):null;
    const glowY=glowEl?gsap.quickTo(glowEl,'y',{duration:.6,ease:'power2.out',overwrite:'auto'}):null;
    const frontX=frontEl?gsap.quickTo(frontEl,'x',{duration:.55,ease:'power2.out',overwrite:'auto'}):null;
    const frontY=frontEl?gsap.quickTo(frontEl,'y',{duration:.55,ease:'power2.out',overwrite:'auto'}):null;

    // 动态追踪当前活动影画 img，slide 切换时自动跟随
    let activeImg=null,imgX=null,imgY=null;
    const refreshImg=()=>{
      const img=art.querySelector('.hero-carousel-slide.is-active .hero-star');
      if(img===activeImg)return;
      // 将旧 img 归位，避免切换时跳变
      if(activeImg)gsap.set(activeImg,{x:0,y:0});
      activeImg=img;
      if(!img)return;
      imgX=gsap.quickTo(img,'x',{duration:.7,ease:'power2.out',overwrite:'auto'});
      imgY=gsap.quickTo(img,'y',{duration:.7,ease:'power2.out',overwrite:'auto'});
    };

    const apply=(nx,ny)=>{
      refreshImg();
      if(imgX){imgX(nx*PX_RANGE_X*SLIDE_RATE);imgY(ny*PX_RANGE_Y*SLIDE_RATE);}
      if(glowX){glowX(nx*PX_RANGE_X*GLOW_RATE);glowY(ny*PX_RANGE_Y*GLOW_RATE);}
      if(frontX){frontX(nx*PX_RANGE_X*FRONT_RATE);frontY(ny*PX_RANGE_Y*FRONT_RATE);}
    };

    const home=()=>{
      refreshImg();
      if(imgX){imgX(0);imgY(0);}
      if(glowX){glowX(0);glowY(0);}
      if(frontX){frontX(0);frontY(0);}
    };

    const onMove=event=>{
      const rect=hero.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const clamp=v=>Math.max(-1,Math.min(1,v));
      apply(
        clamp(((event.clientX-rect.left)/rect.width)*2-1),
        clamp(((event.clientY-rect.top)/rect.height)*2-1),
      );
    };

    let bound=false;
    const sync=()=>{
      const on=fineQuery.matches&&!reduced();
      if(on===bound){if(!on)home();return;}
      bound=on;
      if(on){
        hero.addEventListener('pointermove',onMove,{passive:true});
        hero.addEventListener('pointerleave',home,{passive:true});
        hero.addEventListener('pointercancel',home,{passive:true});
      }else{
        hero.removeEventListener('pointermove',onMove);
        hero.removeEventListener('pointerleave',home);
        hero.removeEventListener('pointercancel',home);
      }
      home();
    };

    fineQuery.addEventListener('change',sync);
    nativeReduce.addEventListener('change',sync);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)home();});
    // slide 切换时刷新 img 绑定
    const track=art.querySelector('.hero-carousel-track');
    if(track&&'MutationObserver' in window){
      new MutationObserver(()=>{refreshImg();home();}).observe(track,{attributes:true,attributeFilter:['class'],subtree:true});
    }
    sync();
    window.__zzzHeroParallax={mode:'mindscape-parallax',PX_RANGE_X,PX_RANGE_Y,SLIDE_RATE};
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
