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

  function agentLabel(stage) {
    var en = stage && stage.querySelector('#selectedAgentBackdropName');
    if (en && en.textContent.trim()) return en.textContent.trim().toUpperCase();
    var n = stage && stage.querySelector('#selectedAgentName');
    return ((n && n.textContent) || '').trim().toUpperCase() || 'AGENT';
  }

  function applyMarquee(stage, id) {
    var host = document.querySelector('.agent-roster-panel') || stage;
    var q = document.querySelector('.agent-stage-marquee');
    if (q && q.parentNode !== host) {
      host.insertBefore(q, host.firstChild);
    }
    if (!q) {
      q = document.createElement('div');
      q.className = 'agent-stage-marquee';
      q.setAttribute('aria-hidden', 'true');
      q.innerHTML = '<span></span><span></span>';
      host.insertBefore(q, host.firstChild);
    }
    var line = (agentLabel(stage) + '  ·  ').repeat(8);
    var spans = q.querySelectorAll('span');
    if (q.getAttribute('data-cur') === id && spans[0] && spans[0].textContent.indexOf(agentLabel(stage)) !== -1) return;
    q.setAttribute('data-cur', id);
    for (var i = 0; i < spans.length; i++) spans[i].textContent = line;
  }

  // 彩色 full 影画铺舞台。缺 full 时回落到 mindscape。
  function applyMindscape(stage) {
    var art = stage && stage.querySelector(ART_SEL);
    if (!art) return;
    var id = currentAgentId(stage);
    if (!id) return;
    applyMarquee(stage, id);
    var ms = art.querySelector('.stage-mindscape');
    var full = 'assets/mindscape/full/' + encodeURIComponent(id) + '.webp';
    var fallback = 'assets/mindscape/' + encodeURIComponent(id) + '-mindscape.webp';
    if (ms && ms.getAttribute('data-cur') === full) return;
    if (!ms) {
      ms = document.createElement('img');
      ms.className = 'stage-mindscape';
      ms.alt = '';
      ms.setAttribute('aria-hidden', 'true');
      art.insertBefore(ms, art.firstChild);
    }
    function show(src) {
      if (currentAgentId(stage) !== id) return;
      ms.src = src;
      ms.setAttribute('data-cur', src);
      requestAnimationFrame(function () { ms.classList.add('on'); });
    }
    var probe = new Image();
    probe.onload = function () { show(full); };
    probe.onerror = function () {
      var fb = new Image();
      fb.onload = function () { show(fallback); };
      fb.onerror = function () { ms.classList.remove('on'); };
      fb.src = fallback;
    };
    probe.src = full;
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
