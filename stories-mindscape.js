/* HOOXI - 代理人舞台 彩色影画 + 裸眼3D卡雕互动 (独立注入, 不改 stories.js) */
(function () {
  'use strict';
  var STAGE_SEL = '.agent-selected-stage';
  var ART_SEL = '.agent-stage-art';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function currentAgentId(stage) {
    if (!stage) return '';
    var p = stage.querySelector('.agent-stage-portrait');
    if (p && p.getAttribute('data-stage-agent-id')) return p.getAttribute('data-stage-agent-id');
    var img = stage.querySelector('.agent-stage-portrait img');
    if (img) {
      var m = /assets\/portraits\/(.+?)-portrait\./.exec(img.getAttribute('src') || '');
      if (m) return decodeURIComponent(m[1]);
    }
    return '';
  }

  // 彩色影画背景层(插入 art 底层),保留原竖版立绘
  function applyMindscape(stage) {
    var art = stage && stage.querySelector(ART_SEL);
    if (!art) return;
    var id = currentAgentId(stage);
    if (!id) return;
    var ms = art.querySelector('.stage-mindscape');
    var target = 'assets/mindscape/' + encodeURIComponent(id) + '-mindscape.webp';
    if (ms && ms.getAttribute('data-cur') === target) return;
    if (!ms) {
      ms = document.createElement('img');
      ms.className = 'stage-mindscape';
      ms.alt = '';
      ms.setAttribute('aria-hidden', 'true');
      art.insertBefore(ms, art.firstChild);
    }
    var probe = new Image();
    probe.onload = function () {
      if (currentAgentId(stage) !== id) return;
      ms.src = target;
      ms.setAttribute('data-cur', target);
      requestAnimationFrame(function () { ms.classList.add('on'); });
    };
    probe.onerror = function () { ms.classList.remove('on'); };
    probe.src = target;
  }

  // 全息高光层
  function ensureGlare(stage) {
    var g = stage.querySelector('.stage-glare');
    if (!g) {
      g = document.createElement('div');
      g.className = 'stage-glare';
      g.setAttribute('aria-hidden', 'true');
      stage.appendChild(g);
    }
    return g;
  }

  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, stage = null;
  function onMove(e) {
    if (!stage) return;
    var r = stage.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
    ty = (e.clientY - r.top) / r.height - 0.5;
    schedule();
  }
  function onLeave() { tx = 0; ty = 0; schedule(); }
  function schedule() { if (raf || reduced) return; raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0;
    cx += (tx - cx) * 0.1;   // 惯性
    cy += (ty - cy) * 0.1;
    if (!stage) return;
    var art = stage.querySelector(ART_SEL);
    var ms = stage.querySelector('.stage-mindscape');
    var portrait = stage.querySelector('.agent-stage-portrait');
    var backdrop = stage.querySelector('.agent-stage-backdrop-name');
    var heading = stage.querySelector('.agent-stage-heading');
    var glare = stage.querySelector('.stage-glare');

    // 卡片整体 3D 倾斜(裸眼3D): 鼠标右->绕Y右转, 鼠标下->绕X下俯
    var ry = cx * 18;         // deg
    var rx = -cy * 14;        // deg
    if (art) art.style.transform =
      'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';

    // 各层 translateZ 拉开深度(相对卡片, 卡片转时层次产生视差)
    if (ms) ms.style.transform = 'translateZ(-60px) scale(1.08)';
    if (backdrop) backdrop.style.transform = 'translateZ(6px) translate3d(' + (cx * 20) + 'px,' + (cy * 14) + 'px,0)';
    if (portrait) portrait.style.transform = 'translateZ(44px) translate3d(' + (cx * -16) + 'px,' + (cy * -10) + 'px,0)';
    if (heading) heading.style.transform = 'translateZ(80px)';

    // 高光随鼠标扫掠
    if (glare) {
      glare.style.opacity = '1';
      glare.style.backgroundPosition = (50 + cx * 120) + '% ' + (50 + cy * 120) + '%';
    }

    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) schedule();
    else if (glare && tx === 0 && ty === 0) glare.style.opacity = '0';
  }

  function bind() {
    var s = document.querySelector(STAGE_SEL);
    if (s === stage) { if (s) applyMindscape(s); return; }
    if (stage) { stage.removeEventListener('mousemove', onMove); stage.removeEventListener('mouseleave', onLeave); }
    stage = s;
    if (!stage) return;
    applyMindscape(stage);
    ensureGlare(stage);
    if (!reduced) {
      stage.addEventListener('mousemove', onMove, { passive: true });
      stage.addEventListener('mouseleave', onLeave, { passive: true });
    }
  }

  var root = document.getElementById('storiesRoot') || document.body;
  var mo = new MutationObserver(function () { bind(); });
  function start() {
    bind();
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-stage-agent-id', 'src'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
