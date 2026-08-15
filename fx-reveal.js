/* Hallmark FX runtime · shared reveal / glare / click spark · no dependency */
(function(){
  'use strict';
  if (window.__HOOXI_V3_FX__) return;
  window.__HOOXI_V3_FX__ = true;

  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(reduceQuery && reduceQuery.matches);
  var revealSelector = [
    '.home-act', '.agent-spotlight', '.archive-hero', '.archive-content',
    '.archive-group', '.archive-record', '.page-timeline-item', '.page-card',
    '.cultivate-directory', '.cultivate-faq-item', '.cultivate-mat-card',
    '.faction-directory-card', '.faction-member-card', '.faction-record',
    '.agent-workbench', '.agent-selected-stage', '.agent-roster-panel',
    '.agent-roster-card', '.archive-sources', '.about-column'
  ].join(',');
  var glareSelector = [
    '.home-agent-card', '.home-reel-card', '.path-card', '.agent-spotlight-card',
    '.archive-record', '.page-card', '.cultivate-mat-card',
    '.faction-directory-card', '.faction-record',
    '.agent-roster-card', '.archive-primary-action', '.cultivate-primary-action',
    '.faction-primary-action'
  ].join(',');
  var revealed = typeof WeakSet === 'function' ? new WeakSet() : null;
  var decorated = typeof WeakSet === 'function' ? new WeakSet() : null;
  var observer;

  function eachMatch(root, selector, callback){
    if (!root || root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1 && root.matches(selector)) callback(root);
    root.querySelectorAll(selector).forEach(callback);
  }

  function markReveal(el, index){
    if (!el || (revealed && revealed.has(el))) return;
    if (revealed) revealed.add(el);
    el.classList.add('fx-reveal');
    el.style.setProperty('--fx-delay', Math.min((index || 0) * 55, 330) + 'ms');
    if (reduced) el.classList.add('is-visible');
  }

  function finishReveal(el){
    if (!el || reduced) return;
    requestAnimationFrame(function(){ el.classList.add('is-visible'); });
  }

  function addGlare(el){
    if (!el || el.closest('.faction-member-react-card') || (decorated && decorated.has(el))) return;
    if (decorated) decorated.add(el);
    el.classList.add('fx-glare-target');
    if (reduced || !window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    el.addEventListener('pointermove', function(event){
      var rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--glare-x', x.toFixed(2) + '%');
      el.style.setProperty('--glare-y', y.toFixed(2) + '%');
      el.classList.add('is-glare-active');
      if (el.matches('.home-agent-card,.home-reel-card,.path-card,.agent-spotlight-card')) {
        var rx = ((y - 50) / 14).toFixed(2);
        var ry = ((50 - x) / 14).toFixed(2);
        el.style.setProperty('--spot-rx', rx + 'deg');
        el.style.setProperty('--spot-ry', ry + 'deg');
        el.style.setProperty('--spot-x', x.toFixed(2) + '%');
        el.style.setProperty('--spot-y', y.toFixed(2) + '%');
        el.classList.add('is-spotlight');
      }
    }, {passive:true});
    el.addEventListener('pointerleave', function(){
      el.classList.remove('is-glare-active');
      el.classList.remove('is-spotlight');
      el.style.removeProperty('--spot-rx');
      el.style.removeProperty('--spot-ry');
      el.style.removeProperty('--spot-x');
      el.style.removeProperty('--spot-y');
    });
  }

  function decorate(root){
    var revealIndex = 0;
    eachMatch(root, revealSelector, function(el){ markReveal(el, revealIndex++); });
    eachMatch(root, glareSelector, addGlare);
    if (root && root.querySelectorAll) {
      root.querySelectorAll('.archive-group').forEach(function(group){
        if (group.dataset.v3Year) return;
        var text = (group.querySelector('.archive-group-heading h2,.group-title,summary') || {}).textContent || '';
        var year = text.match(/(?:20|19)\d{2}/);
        if (year) group.dataset.v3Year = year[0];
      });
    }
  }

  function initRevealObserver(){
    decorate(document);
    var targets = document.querySelectorAll('.fx-reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }
    observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        finishReveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    targets.forEach(function(el){ observer.observe(el); });
  }

  function initMutationBridge(){
    if (!('MutationObserver' in window) || !document.body) return;
    var mutationObserver = new MutationObserver(function(records){
      records.forEach(function(record){
        record.addedNodes.forEach(function(node){
          if (node.nodeType !== 1) return;
          decorate(node);
          if (observer) node.querySelectorAll('.fx-reveal').forEach(function(el){ observer.observe(el); });
          else node.querySelectorAll('.fx-reveal').forEach(function(el){ el.classList.add('is-visible'); });
        });
      });
    });
    mutationObserver.observe(document.body, {childList:true, subtree:true});
  }

  function initClickSparks(){
    if (reduced) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-click-spark-canvas';
    canvas.setAttribute('aria-hidden','true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = 1;
    var width = 0;
    var height = 0;
    var sparks = [];
    var raf = 0;
    var colors = document.body.classList.contains('data-stories') ? ['#ff4fb8','#8b7dff','#fff']
      : document.body.classList.contains('data-faction') ? ['#00e5ff','#ffb000','#fff']
      : document.body.classList.contains('archive-events') ? ['#ff6b5f','#ffb000','#fff']
      : document.body.classList.contains('archive-behind') ? ['#8b7dff','#00e5ff','#fff']
      : ['#d8fa00','#00e5ff','#fff'];

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function draw(){
      raf = 0;
      ctx.clearRect(0,0,width,height);
      var live = [];
      for (var i=0;i<sparks.length;i++){
        var s = sparks[i];
        s.life -= 0.028;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.045;
        s.vx *= 0.985;
        if (s.life <= 0) continue;
        live.push(s);
        ctx.globalAlpha = Math.max(0,s.life);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x,s.y,s.size,s.size);
      }
      ctx.globalAlpha = 1;
      sparks = live;
      if (sparks.length) raf = requestAnimationFrame(draw);
    }
    function burst(x,y){
      for (var i=0;i<12;i++){
        var angle = (Math.PI * 2 * i / 12) + (Math.random() - .5) * .35;
        var speed = 1.2 + Math.random() * 2.8;
        sparks.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-0.5,life:.65+Math.random()*.35,size:1+Math.random()*2.2,color:colors[i%colors.length]});
      }
      if (!raf) raf = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    document.addEventListener('pointerdown', function(event){
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      burst(event.clientX,event.clientY);
    }, {passive:true});
  }

  function init(){
    initRevealObserver();
    initMutationBridge();
    initClickSparks();
    if (reduceQuery && typeof reduceQuery.addEventListener === 'function') {
      reduceQuery.addEventListener('change', function(){ location.reload(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
