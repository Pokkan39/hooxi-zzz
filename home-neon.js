(function(){
  'use strict';

  // 阶段 2：仅注册 GSAP ScrollTrigger，不写业务动效。库缺失时静默跳过。
  if(window.gsap&&window.ScrollTrigger&&typeof window.gsap.registerPlugin==='function'){
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  if(!document.body.classList.contains('home-page'))return;

  const reduceQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce=reduceQuery.matches;
  const selectors='.hero-copy>*,.section-head,.path-card,.home-agent-card,.home-reel-card,.about-column';
  const reveal=root=>{
    const nodes=(root||document).querySelectorAll(selectors);
    if(reduce||!('IntersectionObserver' in window)){
      nodes.forEach(node=>{node.dataset.neonReveal='';node.classList.add('is-in');});
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.12});
    nodes.forEach(node=>{
      if(node.dataset.neonReveal)return;
      node.dataset.neonReveal='';
      observer.observe(node);
    });
  };

  const initHeroParallax=()=>{
    const hero=document.querySelector('.hero');
    if(!hero)return;

    const finePointerQuery=window.matchMedia('(hover:hover) and (pointer:fine)');
    const root=document.body;
    const track=hero.querySelector('.hero-carousel-track');
    let enabled=false;
    let frame=0;
    let pointerX=0;
    let pointerY=0;

    const write=(name,value)=>root.style.setProperty(name,`${value.toFixed(2)}px`);
    const reset=()=>{
      if(frame){
        cancelAnimationFrame(frame);
        frame=0;
      }
      pointerX=0;
      pointerY=0;
      write('--home-bg-x',0);
      write('--home-bg-y',0);
      write('--home-glow-x',0);
      write('--home-glow-y',0);
      write('--home-copy-x',0);
      write('--home-copy-y',0);
      write('--home-num-x',0);
      write('--home-num-y',0);
    };
    const render=()=>{
      frame=0;
      write('--home-bg-x',pointerX*8);
      write('--home-bg-y',pointerY*6);
      write('--home-glow-x',pointerX*12);
      write('--home-glow-y',pointerY*9);
      write('--home-copy-x',pointerX*-4);
      write('--home-copy-y',pointerY*-3);
      write('--home-num-x',pointerX*-10);
      write('--home-num-y',pointerY*-7);
    };
    const onPointerMove=event=>{
      const rect=hero.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      pointerX=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width)*2-1));
      pointerY=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height)*2-1));
      if(!frame)frame=requestAnimationFrame(render);
    };
    const sync=()=>{
      const shouldEnable=finePointerQuery.matches&&!reduceQuery.matches;
      if(shouldEnable===enabled){
        if(!shouldEnable)reset();
        return;
      }
      enabled=shouldEnable;
      if(enabled){
        hero.addEventListener('pointermove',onPointerMove,{passive:true});
        hero.addEventListener('pointerleave',reset,{passive:true});
        hero.addEventListener('pointercancel',reset,{passive:true});
      }else{
        hero.removeEventListener('pointermove',onPointerMove);
        hero.removeEventListener('pointerleave',reset);
        hero.removeEventListener('pointercancel',reset);
      }
      reset();
    };

    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)reset();
    });
    finePointerQuery.addEventListener('change',sync);
    reduceQuery.addEventListener('change',sync);
    if(track&&'MutationObserver' in window){
      new MutationObserver(reset).observe(track,{attributes:true,attributeFilter:['class'],subtree:true});
    }
    sync();
  };

  const boot=()=>{
    reveal();
    // Hero 视差已由 zzz-hero-parallax.js 的 GSAP quickTo 四层方案接管
    // （规范第 5.2 节要求用 gsap.quickTo，禁止自写 lerp/rAF 循环）。
    // 延后一帧检查：仅当该模块确实缺失时才回退到此处的轻量实现。
    requestAnimationFrame(()=>{if(!window.__zzzHeroParallax)initHeroParallax();});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
