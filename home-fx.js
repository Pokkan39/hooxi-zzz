/* Hallmark home signature FX · canvas field / title decrypt / TV handoff */
(function(){
  'use strict';
  var gameHud = !!document.querySelector('.game-shell');
  var archiveHome = document.body.classList.contains('home-page');
  if (window.__HOOXI_V3_HOME__ || (!archiveHome && !gameHud)) return;
  window.__HOOXI_V3_HOME__ = true;

  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(reduceQuery && reduceQuery.matches);

  function decryptTitle(){
    var title = document.getElementById('heroTitle');
    if (!title) return;
    var finalText = title.textContent.trim();
    title.setAttribute('aria-label', finalText);
    if (reduced || !finalText) return;
    var glyphs = 'HOOXI01//绝区零档案△◇✦';
    var chars = Array.from(finalText);
    var frame = 0;
    var total = Math.max(28, chars.length * 5);
    function tick(){
      frame += 1;
      var locked = Math.floor((frame / total) * chars.length);
      title.textContent = chars.map(function(char,index){
        if (/\s/.test(char) || index < locked) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join('');
      if (frame < total) requestAnimationFrame(tick);
      else title.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }

  function initHeroPointer(){
    if (reduced || !window.matchMedia || !window.matchMedia('(hover:hover)').matches) return;
    var hero = document.querySelector('.hero');
    var art = document.getElementById('homeHeroArt');
    if (!hero || !art) return;
    var raf = 0;
    var px = 0;
    var py = 0;
    function render(){
      raf = 0;
      art.style.transform = 'translate3d(' + (px * 10).toFixed(2) + 'px,' + (py * 7).toFixed(2) + 'px,0) scale(1.018)';
    }
    hero.addEventListener('pointermove', function(event){
      var rect = hero.getBoundingClientRect();
      px = (event.clientX - rect.left) / rect.width - .5;
      py = (event.clientY - rect.top) / rect.height - .5;
      if (!raf) raf = requestAnimationFrame(render);
    }, {passive:true});
    hero.addEventListener('pointerleave', function(){
      px = 0;
      py = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      art.style.transform = '';
    });
  }

  function initCanvasField(){
    var canvas = document.createElement('canvas');
    canvas.className = 'home-fx-canvas';
    canvas.setAttribute('aria-hidden','true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var raf = 0;
    var last = 0;
    var points = [];

    function seed(){
      var count = Math.max(24, Math.min(62, Math.round(width / 24)));
      points = Array.from({length:count}, function(_,index){
        return {
          x:Math.random() * width,
          y:Math.random() * height,
          r:.7 + Math.random() * 1.7,
          vx:(Math.random() - .5) * .08,
          vy:.05 + Math.random() * .12,
          phase:index * .72 + Math.random() * 3
        };
      });
    }
    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      seed();
      if (reduced) draw(0, true);
    }
    function draw(time, still){
      ctx.clearRect(0,0,width,height);
      var t = time * .001;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var i=0;i<points.length;i++){
        var p = points[i];
        if (!still){
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > height + 8) p.y = -8;
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;
        }
        var pulse = .42 + Math.sin(t * 1.4 + p.phase) * .22;
        ctx.globalAlpha = Math.max(.12,pulse);
        ctx.fillStyle = i % 5 === 0 ? '#d8fa00' : i % 3 === 0 ? '#8b7dff' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = .09;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      var offset = (t * 14) % 84;
      for (var y=-84+offset;y<height+84;y+=84){
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(width,y-160);
        ctx.stroke();
      }
      ctx.restore();
      if (!still && document.visibilityState !== 'hidden') raf = requestAnimationFrame(loop);
    }
    function loop(time){
      if (time - last < 24){ raf = requestAnimationFrame(loop); return; }
      last = time;
      draw(time, false);
    }
    function start(){
      if (reduced || raf || document.visibilityState === 'hidden') return;
      raf = requestAnimationFrame(loop);
    }
    function stop(){
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') stop();
      else start();
    });
    start();
  }

  function initTvHandoff(){
    var overlay = document.createElement('div');
    overlay.className = 'home-tv-overlay';
    overlay.setAttribute('aria-hidden','true');
    document.body.appendChild(overlay);
    var routing = false;
    document.addEventListener('click', function(event){
      if (routing || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var anchor = event.target.closest('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      var href = anchor.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      var url;
      try { url = new URL(anchor.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      event.preventDefault();
      routing = true;
      document.body.classList.add('v3-tv-transition');
      var delay = reduced ? 0 : 390;
      window.setTimeout(function(){ location.href = url.href; }, delay);
    }, true);
    window.addEventListener('pageshow', function(){
      routing = false;
      document.body.classList.remove('v3-tv-transition');
    });
  }

  function initSectionSignal(){
    if (!('IntersectionObserver' in window)) return;
    var sections = document.querySelectorAll('[data-home-act]');
    var status = document.getElementById('statusText');
    if (!sections.length || !status) return;
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var index = Array.prototype.indexOf.call(sections, entry.target) + 1;
        status.textContent = 'S' + String(index).padStart(2,'0');
      });
    }, {rootMargin:'-20% 0px -62% 0px', threshold:0});
    sections.forEach(function(section){ observer.observe(section); });
  }

  function init(){
    if (gameHud) return;
    decryptTitle();
    initCanvasField();
    initHeroPointer();
    initTvHandoff();
    initSectionSignal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
