/* =========================================================================
   cassette-float.js  —  悬浮可拖拽磁带机 控制器
   加载顺序：置于 app.js 之后。

   设计原则（关键）：本文件不重写任何播放逻辑。悬浮磁带机上的每个控件都
   “代理转发”到 app.js 已经绑定好的既有控件（#musicToggle / #prevTrack /
   #nextTrack / #playMode / #volume / #playlistOpen / #cassetteOpen），
   并通过监听 #audio 的原生事件把状态镜像回悬浮 UI。这样：
     - 播放/暂停/上一首/下一首/模式/音量/歌单/展开全屏磁带机  全部复用
     - A/B 面、进度条逻辑仍由 app.js + 全屏磁带机负责，这里提供快捷进度条
   ========================================================================= */
(function () {
  'use strict';

  // 仅在存在既有播放器的页面（首页）挂载
  var dock = document.getElementById('musicPlayer');
  var audio = document.getElementById('audio');
  if (!dock || !audio) return;
  if (document.getElementById('floatingCassette')) return;

  var LS_POS = 'hooxiCassetteFloatPos';
  var LS_COLLAPSED = 'hooxiCassetteFloatCollapsed';

  // ---- 构建 DOM -----------------------------------------------------------
  var el = document.createElement('div');
  el.className = 'floating-cassette';
  el.id = 'floatingCassette';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', '悬浮磁带机播放器');
  /* 结构照 SONY TPS-L2 实物分两段：
     上段 __deck 是阳极氧化金属机身，含走带窗（可见磁带实体）与铭牌丝印；
     下段 __panel 是银灰前面板，承载曲目、进度、金属推杆键与音量。
     机身色随角色印象色变，前面板银灰与橙色开关是实物固有特征、恒定不变。 */
  var skin = (window.cassetteSkin && window.cassetteSkin.pick()) || null;
  var plate = (skin && window.cassetteSkin.plateName(skin.englishName)) || 'STEREO';

  el.innerHTML = [
    /* ---- 上段：金属机身 ---- */
    '<div class="fc-deck" data-drag-handle>',
    '  <div class="fc-deck-top">',
    '    <span class="fc-plate" data-cf="plate">' + plate + '</span>',
    '    <span class="fc-stereo" aria-hidden="true">STEREO</span>',
    '    <button type="button" class="fc-lid" data-cf="collapse" aria-label="合上或打开磁带舱">▾</button>',
    '  </div>',
    /* 走带窗：内凹深色 + 磁带实体 + 玻璃高光 */
    '  <div class="fc-window" aria-hidden="true">',
    '    <div class="fc-tape">',
    '      <div class="fc-hub fc-hub--l"><i class="fc-teeth"></i><em class="fc-wound"></em></div>',
    '      <div class="fc-tape-span"></div>',
    '      <div class="fc-hub fc-hub--r"><i class="fc-teeth"></i><em class="fc-wound"></em></div>',
    '      <span class="fc-side-label">A</span>',
    '    </div>',
    '    <span class="fc-glass"></span>',
    '  </div>',
    '  <p class="fc-model" aria-hidden="true">STEREO CASSETTE PLAYER TPS-L2</p>',
    '</div>',
    /* ---- 下段：银灰前面板 ---- */
    '<div class="fc-panel">',
    '  <div class="fc-now">',
    '    <small>NOW ON TAPE</small>',
    '    <b data-cf="track">未选择音乐</b>',
    '  </div>',
    '  <div class="fc-seekrow">',
    '    <span data-cf="now">0:00</span>',
    '    <input type="range" min="0" max="1000" value="0" step="1" data-cf="seek" aria-label="悬浮磁带机走带进度"/>',
    '    <span data-cf="end">0:00</span>',
    '  </div>',
    '  <p class="fc-cue" data-cf="cue">点击 ▶ 开始播放</p>',
    /* 金属推杆键：实物是一排银色竖纹推杆，不是圆钮 */
    '  <div class="fc-keys">',
    '    <button type="button" class="fc-key" data-cf="prev" aria-label="上一首"><span class="fc-key-face">◀◀</span></button>',
    '    <button type="button" class="fc-key fc-key--play" data-cf="toggle" aria-label="播放音乐"><span class="fc-key-face">▶</span></button>',
    '    <button type="button" class="fc-key" data-cf="next" aria-label="下一首"><span class="fc-key-face">▶▶</span></button>',
    '    <button type="button" class="fc-key fc-key--wide" data-cf="mode" aria-label="播放模式"><span class="fc-key-face">顺序</span></button>',
    '    <button type="button" class="fc-key fc-key--wide" data-cf="list" aria-label="打开歌单"><span class="fc-key-face">歌单</span></button>',
    /* 橙色滑块：实物右侧那个醒目橙块，这里承担「全屏」入口 */
    '    <button type="button" class="fc-slider-btn" data-cf="open" aria-label="打开全屏磁带机"></button>',
    '  </div>',
    '  <div class="fc-foot">',
    '    <label class="fc-vol">VOLUME<input type="range" min="0" max="1" step=".05" value=".25" data-cf="vol" aria-label="悬浮磁带机音量"/></label>',
    '    <button type="button" class="fc-skin" data-cf="skin" aria-label="自定义磁带机配色">配色</button>',
    '    <input type="color" class="fc-skin-input" data-cf="skinInput" aria-label="选择磁带机机身颜色" tabindex="-1"/>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(el);

  if (skin && window.cassetteSkin) window.cassetteSkin.apply(el, skin);

  var $ = function (sel) { return el.querySelector(sel); };
  var handle = $('[data-drag-handle]');
  var elToggle = $('[data-cf="toggle"]');
  var elTrack = $('[data-cf="track"]');
  var elSeek = $('[data-cf="seek"]');
  var elNow = $('[data-cf="now"]');
  var elEnd = $('[data-cf="end"]');
  var elMode = $('[data-cf="mode"]');
  var elVol = $('[data-cf="vol"]');
  var elCollapse = $('[data-cf="collapse"]');
  /* 推杆键的可见文字在内层 .fc-key-face 上（外层要保留金属层结构），
     写文本必须写内层，否则会把键面结构冲掉。 */
  var face = function (btn) { return btn.querySelector('.fc-key-face') || btn; };
  var faceToggle = face(elToggle);
  var faceMode = face(elMode);

  // 既有控件（转发目标）
  var srcToggle = document.getElementById('musicToggle');
  var srcPrev = document.getElementById('prevTrack');
  var srcNext = document.getElementById('nextTrack');
  var srcMode = document.getElementById('playMode');
  var srcVol = document.getElementById('volume');
  var srcList = document.getElementById('playlistOpen');
  var srcOpen = document.getElementById('cassetteOpen');

  function click(node) { if (node) node.click(); }

  // ---- 控件转发 -----------------------------------------------------------
  $('[data-cf="prev"]').addEventListener('click', function () { markGestured(); click(srcPrev); });
  $('[data-cf="next"]').addEventListener('click', function () { markGestured(); click(srcNext); });
  $('[data-cf="mode"]').addEventListener('click', function () { markGestured(); click(srcMode); });
  $('[data-cf="list"]').addEventListener('click', function () { markGestured(); click(srcList); });
  $('[data-cf="open"]').addEventListener('click', function () { markGestured(); click(srcOpen); });
  elToggle.addEventListener('click', function () { markGestured(); click(srcToggle); });

  // 音量：写入既有 input 并派发 input 事件，让 app.js 的 handler 生效
  elVol.addEventListener('input', function () {
    setVolText(elVol.value);
    if (srcVol) {
      srcVol.value = elVol.value;
      srcVol.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      audio.volume = Number(elVol.value);
    }
  });

  // 进度条：直接控制 audio.currentTime（不依赖 app.js 内部函数）
  elSeek.addEventListener('input', function () {
    markGestured();
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = (Number(elSeek.value) / 1000) * audio.duration;
    }
  });

  /* 配色：点「配色」开原生取色器，选定后写 localStorage 并立即换肤；
     长按（或右键）恢复随机。用原生 input[type=color] 而不自造色板，
     取色器的可访问性与各平台习惯由浏览器负责。 */
  var elSkinBtn = $('[data-cf="skin"]');
  var elSkinInput = $('[data-cf="skinInput"]');
  if (elSkinBtn && elSkinInput && window.cassetteSkin) {
    elSkinBtn.addEventListener('click', function () { elSkinInput.click(); });
    elSkinInput.addEventListener('input', function () {
      if (window.cassetteSkin.setCustom(elSkinInput.value)) {
        window.cassetteSkin.apply(el, {
          id: '', englishName: 'CUSTOM', mode: 'custom',
          color: [
            parseInt(elSkinInput.value.slice(1, 3), 16),
            parseInt(elSkinInput.value.slice(3, 5), 16),
            parseInt(elSkinInput.value.slice(5, 7), 16),
          ],
        });
        var pl = $('[data-cf="plate"]');
        if (pl) pl.textContent = 'CUSTOM';
      }
    });
    /* 右键恢复随机：下次刷新重新抽角色 */
    elSkinBtn.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      window.cassetteSkin.clearCustom();
      elSkinBtn.textContent = '随机';
      setTimeout(function () { elSkinBtn.textContent = '配色'; }, 1200);
    });
  }

  // 折叠/展开
  elCollapse.addEventListener('click', function () {
    var collapsed = el.classList.toggle('is-collapsed');
    /* 舱盖按钮：合上朝上、打开朝下，用箭头表达盖子状态而不是文字 */
    elCollapse.textContent = collapsed ? '▴' : '▾';
    elCollapse.setAttribute('aria-label', collapsed ? '打开磁带舱' : '合上磁带舱');
    try { localStorage.setItem(LS_COLLAPSED, collapsed ? '1' : '0'); } catch (e) {}
    clampToViewport();
  });

  // ---- 状态镜像（监听既有控件与 audio）------------------------------------
  function fmt(sec) {
    var n = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(n / 60), s = n % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function syncPlaying() {
    var playing = !audio.paused && !audio.ended && audio.currentTime >= 0 && !!audio.currentSrc;
    el.classList.toggle('is-playing', playing);
    faceToggle.textContent = playing ? '❚❚' : '▶';
    elToggle.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐');
    if (playing) el.classList.remove('needs-gesture');
  }
  function syncTrack() {
    var srcName = document.getElementById('trackName');
    if (srcName) elTrack.textContent = srcName.textContent || '未选择音乐';
  }
  function syncMode() {
    if (srcMode) faceMode.textContent = (srcMode.textContent || '顺序').trim();
  }
  function syncVol() {
    var v = (srcVol && srcVol.value) || localStorage.getItem('hooxiVolume') || '0.25';
    elVol.value = v;
    setVolText(v);
  }
  /* 音量的 0-1 小数同样不适合朗读，换成百分比。 */
  function setVolText(v) {
    elVol.setAttribute('aria-valuetext', Math.round(Number(v) * 100) + '%');
  }
  function syncTime() {
    var d = audio.duration;
    elEnd.textContent = (d && isFinite(d)) ? fmt(d) : '0:00';
    elNow.textContent = fmt(audio.currentTime);
    if (d && isFinite(d) && d > 0) {
      elSeek.value = String(Math.round((audio.currentTime / d) * 1000));
    } else {
      elSeek.value = '0';
    }
    /* 进度条的 value 是 0-1000 的抽象刻度，屏幕阅读器直接念这个数字没有意义。
       aria-valuetext 优先于 aria-valuenow 被朗读，改为播报可听懂的时间。 */
    elSeek.setAttribute('aria-valuetext',
      (d && isFinite(d) && d > 0) ? (fmt(audio.currentTime) + ' / ' + fmt(d)) : '尚未载入音频');
    syncReels(d && isFinite(d) && d > 0 ? audio.currentTime / d : 0);
  }

  /* 卷轴物理：真实磁带走带时左轴（供带轴）缠带渐少、右轴（收带轴）渐多，
     多数网页复刻忽略这点做成两个等大匀速圆。这里按进度插值缠带半径，
     并让转速反比于卷径——卷径大则转速慢，线速度恒定。 */
  var hubL = $('.fc-hub--l .fc-wound');
  var hubR = $('.fc-hub--r .fc-wound');
  function syncReels(p) {
    var t = Math.min(1, Math.max(0, Number(p) || 0));
    /* 缠带外径在近轮毂(0.34)与满卷(1.0)之间插值。
       下限不取更小值：缠带缩进轮毂内就看不出「带快放完了」。 */
    var rl = 1 - 0.66 * t;
    var rr = 0.34 + 0.66 * t;
    if (hubL) {
      hubL.style.setProperty('--wound', rl.toFixed(3));
      hubL.parentElement.style.setProperty('--spin', (1.05 + rl * 1.6).toFixed(2) + 's');
    }
    if (hubR) {
      hubR.style.setProperty('--wound', rr.toFixed(3));
      hubR.parentElement.style.setProperty('--spin', (1.05 + rr * 1.6).toFixed(2) + 's');
    }
  }

  audio.addEventListener('play', syncPlaying);
  audio.addEventListener('pause', syncPlaying);
  audio.addEventListener('ended', function () { syncPlaying(); syncTime(); });
  audio.addEventListener('timeupdate', syncTime);
  audio.addEventListener('loadedmetadata', function () { syncTime(); syncTrack(); });
  audio.addEventListener('volumechange', function () {
    elVol.value = String(audio.volume);
    setVolText(audio.volume);
  });

  // trackName / playMode 由 app.js 用文本更新，用 MutationObserver 镜像
  var srcName = document.getElementById('trackName');
  if (srcName && window.MutationObserver) {
    new MutationObserver(function () { syncTrack(); }).observe(srcName, { childList: true, characterData: true, subtree: true });
  }
  if (srcMode && window.MutationObserver) {
    new MutationObserver(function () { syncMode(); }).observe(srcMode, { childList: true, characterData: true, subtree: true });
  }

  // ---- 拖拽（pointer 事件，含边界钳制 + 持久化）---------------------------
  var dragging = false, startX = 0, startY = 0, baseLeft = 0, baseTop = 0, moved = false;

  function currentRect() { return el.getBoundingClientRect(); }

  function clampToViewport() {
    // 未转成 left/top 定位前（仍用 CSS right/bottom）：仅当实际越界才接管
    var r = currentRect();
    var maxLeft = Math.max(0, window.innerWidth - r.width);
    var maxTop = Math.max(0, window.innerHeight - r.height);
    if (!el.style.left) {
      var outOfBounds = r.left < 0 || r.top < 0 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1;
      if (!outOfBounds) return;                // 默认 CSS 定位正常，不接管
    }
    var left = el.style.left ? parseFloat(el.style.left) : r.left;
    var top = el.style.top ? parseFloat(el.style.top) : r.top;
    left = Math.min(Math.max(0, left), maxLeft);
    top = Math.min(Math.max(0, top), maxTop);
    setPos(left, top);
  }

  function setPos(left, top) {
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }

  function savePos() {
    try {
      localStorage.setItem(LS_POS, JSON.stringify({ left: parseFloat(el.style.left), top: parseFloat(el.style.top) }));
    } catch (e) {}
  }

  function onDown(e) {
    // 只从把手起拖；忽略把手内的按钮（折叠键）
    if (e.target.closest('[data-cf="collapse"]')) return;
    dragging = true; moved = false;
    var r = currentRect();
    // 若还没转成 left/top 定位，先固定当前位置
    if (!el.style.left) setPos(r.left, r.top);
    baseLeft = parseFloat(el.style.left);
    baseTop = parseFloat(el.style.top);
    startX = e.clientX; startY = e.clientY;
    el.classList.add('is-dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
    var r = currentRect();
    var maxLeft = Math.max(0, window.innerWidth - r.width);
    var maxTop = Math.max(0, window.innerHeight - r.height);
    var left = Math.min(Math.max(0, baseLeft + dx), maxLeft);
    var top = Math.min(Math.max(0, baseTop + dy), maxTop);
    setPos(left, top);
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('is-dragging');
    try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
    if (moved) savePos();
  }
  handle.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('resize', clampToViewport);

  // 恢复持久化位置
  (function restorePos() {
    try {
      var saved = JSON.parse(localStorage.getItem(LS_POS));
      if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
        setPos(saved.left, saved.top);
      }
    } catch (e) {}
    try {
      if (localStorage.getItem(LS_COLLAPSED) === '1') {
        el.classList.add('is-collapsed');
        elCollapse.textContent = '▴';
        elCollapse.setAttribute('aria-label', '打开磁带舱');
      }
    } catch (e) {}
    // 等布局稳定后钳制进视口
    requestAnimationFrame(clampToViewport);
  })();

  // ---- 自动播放（受浏览器限制）-------------------------------------------
  var gestured = false;
  function markGestured() { gestured = true; el.classList.remove('needs-gesture'); }

  function tryAutoplay() {
    // 没有音源时不尝试
    if (!audio.currentSrc && !audio.getAttribute('src')) {
      // app.js 的 updatePlayer 稍后会写入 src；延后再试一次
      return;
    }
    if (!audio.paused) return;
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        el.classList.remove('needs-gesture');
      }).catch(function () {
        // 被浏览器拦截：进入“点击播放”提示态，不做静音规避
        if (!gestured) el.classList.add('needs-gesture');
        armFirstGesture();
      });
    }
  }

  var firstGestureArmed = false;
  function armFirstGesture() {
    if (firstGestureArmed) return;
    firstGestureArmed = true;
    var onFirst = function () {
      document.removeEventListener('pointerdown', onFirst);
      document.removeEventListener('keydown', onFirst);
      if (gestured) return;              // 用户已直接点了播放器，无需再自动起播
      if (audio.paused) {
        var p = audio.play();
        if (p && typeof p.then === 'function') p.catch(function () {});
      }
      el.classList.remove('needs-gesture');
    };
    document.addEventListener('pointerdown', onFirst, { once: true });
    document.addEventListener('keydown', onFirst, { once: true });
  }

  // ---- 初始化 -------------------------------------------------------------
  function init() {
    syncTrack(); syncMode(); syncVol(); syncPlaying(); syncTime();
    // 首帧尝试自动播放（多半会被拦，之后走首次交互）
    tryAutoplay();
    // app.js 的 updatePlayer 在 load 时才写入 audio.src，稍后补一次
    setTimeout(tryAutoplay, 400);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
