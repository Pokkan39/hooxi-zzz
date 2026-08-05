(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  /* 规范最高指令第 1 条：轮播必须由 Swiper 实现。
     本模块只用 Swiper 接管「内部换片调度」这一个接缝：
       - 四张登记片源、顺序、DOM 与 is-active 语义由 app.js 保持不变
       - heroCarouselState.pauses 多原因集合、#heroCarouselIndex 静态页码、
         #heroCarouselPause / #heroCarouselStatus 的 ARIA 合同完全不动
       - 显式关闭 navigation / pagination / thumbs / scrollbar，不引入箭头圆点缩略图
     做法：把 app.js 的 setTimeout 轮转换成 Swiper autoplay 驱动，
     Swiper 每次切换时回调原有 showHeroCarouselSlide，保持单一活动项与页码同步。 */

  const READY_TIMEOUT=8000;
  const AUTOPLAY_DELAY=3000;

  const takeOver=()=>{
    const track=document.querySelector('#heroCarouselTrack');
    const viewport=document.querySelector('.hero-carousel-viewport');
    if(!track||!viewport||!window.Swiper)return false;
    const slides=[...track.querySelectorAll('[data-hero-slide]')];
    if(slides.length<2)return false;
    if(track.dataset.zzzSwiper==='on')return true;

    // Swiper 需要自己的容器 class，但不改变既有节点结构与 ID
    viewport.classList.add('swiper','zzz-hero-swiper');
    track.classList.add('swiper-wrapper');
    slides.forEach(slide=>slide.classList.add('swiper-slide'));

    const syncActive=index=>{
      // 交回 app.js 的既有实现，保持 is-active 单一活动项 + 页码/ARIA 同步
      if(typeof window.showHeroCarouselSlide==='function')window.showHeroCarouselSlide(index);
      else slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===index));
    };

    const swiper=new window.Swiper(viewport,{
      effect:'fade',
      fadeEffect:{crossFade:true},
      speed:480,
      loop:false,
      allowTouchMove:false,   // 保持「无额外上一张/下一张命中区」合同
      simulateTouch:false,
      /* 不用 Swiper 内置 keyboard：它默认挂全局 document 监听，
         会在页面任何位置吞掉方向键，干扰正常滚动与其他控件。
         改为下方受控实现——仅当焦点位于轮播区内时才响应。 */
      keyboard:false,
      navigation:false,
      pagination:false,
      scrollbar:false,
      thumbs:undefined,
      a11y:false,             // ARIA 全部沿用既有 #heroCarouselStatus 合同
      autoplay:{delay:AUTOPLAY_DELAY,disableOnInteraction:false},
      on:{
        slideChange(instance){syncActive(instance.activeIndex);},
      },
    });

    // 用 Swiper autoplay 取代 app.js 的 setTimeout：
    // 保留原 pauses 集合作为唯一判据，只把「是否继续轮转」转给 Swiper。
    /* heroCarouselState 是 app.js 的模块内变量，外部读不到。
       改以既有 #heroCarouselStatus 的公开状态文案作为唯一判据：
       app.js 在任何暂停原因变化时都会重写该节点，因此它等价于 pauses 集合是否为空，
       且完全不需要改动 app.js。 */
    const status=document.querySelector('#heroCarouselStatus');
    const isPaused=()=>{
      const text=(status?.textContent||'').replace(/\s+/g,'');
      if(!text)return false;
      return !text.includes('正在自动播放');
    };
    const applyPauses=()=>{
      if(!swiper.autoplay)return;
      if(isPaused())swiper.autoplay.stop();
      else swiper.autoplay.start();
    };

    if(typeof window.scheduleHeroCarousel==='function'){
      const originalSchedule=window.scheduleHeroCarousel;
      window.scheduleHeroCarousel=function(){
        // 停掉原生 setTimeout 轮转（原函数内部会 clearHeroCarouselTimer），
        // 但不让它再建立新的 timer：先调用以复用清理与守卫，再由 Swiper 接管节奏。
        if(typeof window.clearHeroCarouselTimer==='function')window.clearHeroCarouselTimer();
        applyPauses();
      };
      window.__zzzHeroSwiperOriginalSchedule=originalSchedule;
    }

    // 状态文案由 app.js 在每次暂停原因变化时重写，监听它即可保持 autoplay 同步。
    if(status&&'MutationObserver' in window){
      new MutationObserver(applyPauses).observe(status,{childList:true,characterData:true,subtree:true});
    }

    /* 规范 9.3：Swiper 轮播必须支持方向键。
       仅在焦点位于轮播区内时响应，不挂全局监听、不新增可视控件，
       因此「无箭头圆点缩略图」合同不受影响。
       手动切换后停 autoplay：用户已接管节奏，继续自动跳片会打断阅读；
       这与既有暂停按钮语义一致，走同一个 app.js 暂停原因通道。 */
    viewport.setAttribute('tabindex','0');
    viewport.setAttribute('role','group');
    viewport.setAttribute('aria-roledescription','轮播');
    viewport.setAttribute('aria-label','首页大图轮播，可用左右方向键切换');
    viewport.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
      event.preventDefault();
      if(typeof window.setHeroPauseReason==='function')window.setHeroPauseReason('user',true);
      else if(swiper.autoplay)swiper.autoplay.stop();
      if(event.key==='ArrowRight')swiper.slideNext();
      else swiper.slidePrev();
    });

    // 减动效固定首张由 app.js 的 setHeroPauseReason('reduced-motion') 负责，
    // 此处只需保证 Swiper 不再自行前进。
    applyPauses();
    track.dataset.zzzSwiper='on';
    window.__zzzHeroSwiper={
      engine:'swiper',
      version:window.Swiper?.version||'',
      slides:slides.length,
      effect:'fade',
      controls:{navigation:false,pagination:false,thumbs:false},
      isPaused:()=>!!(window.heroCarouselState&&window.heroCarouselState.pauses.size),
      autoplayRunning:()=>!!swiper.autoplay?.running,
      activeIndex:()=>swiper.activeIndex,
    };
    return true;
  };

  const waitForSlides=()=>{
    const started=Date.now();
    const tick=()=>{
      if(takeOver())return;
      if(Date.now()-started>READY_TIMEOUT)return; // 超时则保持 app.js 原生轮播，页面仍可用
      setTimeout(tick,120);
    };
    tick();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForSlides,{once:true});
  else waitForSlides();
})();

/* ── P1: 缩略图条联动 + 入场动画 ── */
(function(){
  'use strict';
  if(!document.body.classList.contains('home-page'))return;

  /* 入场动画：页面加载时触发信号干扰效果 */
  function triggerEntrance(){
    var hero=document.querySelector('.hero');
    if(!hero)return;
    hero.setAttribute('data-hero-entering','');
    setTimeout(function(){hero.removeAttribute('data-hero-entering');},1200);
  }

  /* 缩略图条联动 */
  function initThumbstrip(){
    var strip=document.getElementById('heroThumbstrip');
    if(!strip)return;
    var thumbs=strip.querySelectorAll('.hero-thumb');
    if(!thumbs.length)return;

    // 点击缩略图 → 切换轮播
    strip.addEventListener('click',function(e){
      var btn=e.target.closest('.hero-thumb');
      if(!btn)return;
      var idx=parseInt(btn.getAttribute('data-thumb-idx'),10);
      if(isNaN(idx))return;

      // 使用 Swiper 切换
      if(window.__zzzHeroSwiper){
        var viewport=document.querySelector('.zzz-hero-swiper');
        if(viewport&&viewport.swiper)viewport.swiper.slideTo(idx);
      }else if(typeof window.showHeroCarouselSlide==='function'){
        window.showHeroCarouselSlide(idx);
      }

      // 暂停自动播放（用户手动操作）
      if(typeof window.setHeroPauseReason==='function')window.setHeroPauseReason('user',true);

      // 更新缩略图激活态
      syncThumbs(idx);
    });

    // 监听轮播切换同步缩略图
    var observer=new MutationObserver(function(){
      var active=document.querySelector('.hero-carousel-slide.is-active, .swiper-slide-active');
      if(!active)return;
      var idx=parseInt(active.getAttribute('data-hero-slide'),10);
      if(!isNaN(idx))syncThumbs(idx);
    });
    var track=document.getElementById('heroCarouselTrack');
    if(track)observer.observe(track,{attributes:true,attributeFilter:['class'],subtree:true});
  }

  function syncThumbs(idx){
    var thumbs=document.querySelectorAll('.hero-thumb');
    thumbs.forEach(function(t,i){
      t.classList.toggle('is-active',i===idx);
    });
  }

  function init(){
    // triggerEntrance() 已由 zzz-motion.js 的 GSAP stagger timeline 替代，
    // 避免 CSS opacity:0 与 GSAP from() 冲突。
    initThumbstrip();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
