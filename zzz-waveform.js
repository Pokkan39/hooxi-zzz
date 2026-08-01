/* zzz-waveform.js —— 全站声纹可视化播放器
   依赖 zzz-player.js（或首页已有的 #audio 元素）：
   zzz-player.js 负责注入 #audio 和控件，本文件只负责可视化与顶栏 UI。 */
(function () {
  'use strict';

  /* ---- 等 DOM Ready ---- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !document.documentElement.classList.contains('zzz-motion-forced');

  /* ---- 注入顶栏播放控件 ---- */
  function injectStrip() {
    if (document.querySelector('.zzz-player-strip')) return;
    var topbar = document.querySelector('.topbar, .character-topbar');
    if (!topbar) return;

    var strip = document.createElement('div');
    strip.className = 'zzz-player-strip';
    strip.setAttribute('aria-label', '音乐播放器');
    strip.innerHTML =
      '<button type="button" class="zzz-player-btn" id="wvPrev" aria-label="上一首">◀◀</button>' +
      '<button type="button" class="zzz-player-btn" id="wvToggle" aria-label="播放">▶</button>' +
      '<button type="button" class="zzz-player-btn" id="wvNext" aria-label="下一首">▶▶</button>' +
      '<span class="zzz-player-name" id="wvName" aria-live="polite">——</span>';
    // 插到 icon-button 之前，保持 icon-button 仍是 lastElementChild
    var iconBtn = topbar.querySelector(':scope > .icon-button');
    if (iconBtn) topbar.insertBefore(strip, iconBtn);
    else topbar.appendChild(strip);
  }

  /* ---- 绑定控件事件（代理转发到 zzz-player.js 的隐藏控件） ---- */
  function bindControls() {
    var toggle = document.getElementById('wvToggle');
    var prev   = document.getElementById('wvPrev');
    var next   = document.getElementById('wvNext');
    var name   = document.getElementById('wvName');
    var audio  = document.getElementById('audio');
    var srcToggle = document.getElementById('musicToggle');
    var srcPrev   = document.getElementById('prevTrack');
    var srcNext   = document.getElementById('nextTrack');
    var srcName   = document.getElementById('trackName');

    if (!toggle || !audio) return;

    function click(el) { if (el) el.click(); }
    if (toggle) toggle.addEventListener('click', function () { click(srcToggle); });
    if (prev)   prev.addEventListener('click',   function () { click(srcPrev); });
    if (next)   next.addEventListener('click',   function () { click(srcNext); });

    /* 同步 play/pause 状态到顶栏按钮 */
    function syncPlay() {
      if (!toggle) return;
      var playing = !audio.paused;
      toggle.textContent = playing ? '⏸' : '▶';
      toggle.setAttribute('aria-label', playing ? '暂停' : '播放');
      toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }
    audio.addEventListener('play',  syncPlay);
    audio.addEventListener('pause', syncPlay);
    syncPlay();

    /* 同步曲名 */
    function syncName() {
      if (!name || !srcName) return;
      var t = srcName.textContent || '';
      name.textContent = t || '——';
      name.title = t;
    }
    if (srcName) {
      new MutationObserver(syncName).observe(srcName, { childList: true, characterData: true, subtree: true });
    }
    syncName();
  }

  /* ---- Web Audio 声纹可视化 ---- */
  var audioCtx = null, analyser = null, mediaSource = null;

  function initAnalyser(audio) {
    if (analyser) return;
    try {
      audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      analyser  = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      mediaSource = audioCtx.createMediaElementSource(audio);
      mediaSource.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) { analyser = null; }
  }

  function injectCanvases() {
    if (document.querySelector('.zzz-wv-left')) return;
    var l = document.createElement('div');
    l.className = 'zzz-wv-left';
    l.setAttribute('aria-hidden', 'true');
    var cl = document.createElement('canvas');
    cl.width = 22; cl.height = 1;
    l.appendChild(cl);

    var r = document.createElement('div');
    r.className = 'zzz-wv-right';
    r.setAttribute('aria-hidden', 'true');
    var cr = document.createElement('canvas');
    cr.width = 22; cr.height = 1;
    r.appendChild(cr);

    document.body.appendChild(l);
    document.body.appendChild(r);
    return { cl: cl, cr: cr };
  }

  function startDraw(cl, cr) {
    var dataArr = null;

    function resize() {
      var h = window.innerHeight;
      cl.height = h; cr.height = h;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function drawSide(canvas, data, mirror) {
      var ctx = canvas.getContext('2d');
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      var bars = Math.min(data.length, 32);
      var bh   = h / bars;
      for (var i = 0; i < bars; i++) {
        var val = data[i] / 255;
        if (val < 0.02) val = 0.02; /* 静止时保留极细底线 */
        var bw = mirror ? Math.round(val * w) : Math.round(val * w);
        var alpha = 0.12 + val * 0.78;
        ctx.fillStyle = 'rgba(216,250,0,' + alpha.toFixed(2) + ')';
        var x = mirror ? w - bw : 0;
        ctx.fillRect(x, i * bh + 1, bw, Math.max(1, bh - 2));
      }
    }

    function frame() {
      requestAnimationFrame(frame);
      if (analyser) {
        if (!dataArr) dataArr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArr);
        drawSide(cl, dataArr, false);
        drawSide(cr, dataArr, true);
      } else {
        /* 无 analyser：显示静态微光 */
        var ctx = cl.getContext('2d');
        ctx.clearRect(0, 0, cl.width, cl.height);
        var ctx2 = cr.getContext('2d');
        ctx2.clearRect(0, 0, cr.width, cr.height);
      }
    }
    frame();
  }

  /* ---- 首次用户交互后初始化 Web Audio（浏览器 autoplay 策略） ---- */
  function setupOnGesture(audio, cl, cr) {
    function onGesture() {
      document.removeEventListener('click', onGesture);
      document.removeEventListener('keydown', onGesture);
      initAnalyser(audio);
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
    document.addEventListener('click',   onGesture, { once: true, passive: true });
    document.addEventListener('keydown', onGesture, { once: true, passive: true });

    /* 如果 audio 已在播放（跨页恢复），立即尝试初始化 */
    if (!audio.paused) onGesture();
  }

  ready(function () {
    injectStrip();

    var audio = document.getElementById('audio');
    if (!audio) {
      /* zzz-player.js 尚未运行（理论上不应发生，因为脚本顺序保证它在前），稍后重试 */
      setTimeout(function () {
        audio = document.getElementById('audio');
        if (audio) { bindControls(); var c = injectCanvases(); if (c) { startDraw(c.cl, c.cr); setupOnGesture(audio, c.cl, c.cr); } }
      }, 400);
      return;
    }

    bindControls();
    var canvases = injectCanvases();
    if (!canvases) return;
    startDraw(canvases.cl, canvases.cr);
    setupOnGesture(audio, canvases.cl, canvases.cr);
  });
})();
