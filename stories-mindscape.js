/* HOOXI - 代理人舞台 彩色影画 (独立注入, 不改 stories.js) */
(function () {
  'use strict';
  var STAGE_SEL = '.agent-selected-stage';
  var ART_SEL = '.agent-stage-art';

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

  var prevStage = null;
  function bind() {
    var s = document.querySelector(STAGE_SEL);
    if (s === prevStage) { if (s) applyMindscape(s); return; }
    prevStage = s;
    if (!s) return;
    applyMindscape(s);
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
