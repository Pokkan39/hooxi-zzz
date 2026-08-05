/* subpage-motion.js — 子页滚动入场动效
   依赖：GSAP（已全局加载）
   效果：卡片/section stagger 入场 + hero 视差微动 */
(function(){
  'use strict';
  // 等待 DOM 和 GSAP 就绪
  function init(){
    if(typeof gsap==='undefined') return;

    // ── 1. 滚动入场：为所有匹配元素加 .sp-reveal ──
    const targets = document.querySelectorAll([
      '.archive-content .record',
      '.archive-content > div > div',
      '.page-timeline-item',
      '.archive-group',
      '.archive-record',
      '.cultivate-faq-item',
      '.cultivate-mat-card',
      '.section-head'
    ].join(','));

    targets.forEach(function(el,i){
      el.classList.add('sp-reveal');
      // 同组内 stagger
      var groupIndex = i % 8;
      el.style.setProperty('--sp-delay', (groupIndex * 60) + 'ms');
    });

    // ── 2. IntersectionObserver 触发入场 ──
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0 });

    document.querySelectorAll('.sp-reveal').forEach(function(el){
      observer.observe(el);
    });

    // ── 3. Hero 视差微动（鼠标跟随） ──
    var hero = document.querySelector('.archive-hero');
    if(hero && window.matchMedia('(hover:hover)').matches){
      var decorBefore = hero; // ::before 由 CSS transform 驱动
      hero.addEventListener('mousemove', function(e){
        var rect = hero.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(hero, {
          '--hero-dx': (x * 12) + 'px',
          '--hero-dy': (y * 8) + 'px',
          duration: 0.8,
          ease: 'power2.out'
        });
      });
      hero.addEventListener('mouseleave', function(){
        gsap.to(hero, {'--hero-dx':'0px','--hero-dy':'0px', duration:0.6, ease:'power2.out'});
      });
    }

    // ── 4. Section 标题入场闪烁 ──
    var headings = document.querySelectorAll('.section-head h2');
    var headObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('sp-heading-flash');
          headObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    headings.forEach(function(h){ headObserver.observe(h); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
})();
