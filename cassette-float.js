/* =========================================================================
   cassette-float.js  —  悬浮磁带机 控制器（SONY TPS-L2 复刻）
   加载顺序：置于 app.js 之后。

   设计原则（关键）：本文件不重写任何播放逻辑。悬浮磁带机上的每个控件都
   “代理转发”到 app.js 已经绑定好的既有控件（#musicToggle / #prevTrack /
   #nextTrack / #volume / #playlistOpen / #cassetteOpen），
   并通过监听 #audio 的原生事件把状态镜像回悬浮 UI。这样：
     - 播放/暂停/上一首/下一首/音量/歌单/展开全屏磁带机  全部复用
     - A/B 面、进度与播放模式仍由 app.js + 全屏磁带机负责

   本轮还原真机后删掉的控件（真机不存在，留着反而不像实物）：
     - 走带进度条：磁带不可寻址，TPS-L2 没有任何进度指示
     - 播放模式键：1979 年的机械机没有随机/循环模式
     - 双时间码：没有数字显示
   进度信息并未丢失，改由卷轴缠带量表达（左轴渐少、右轴渐多）。
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
  /* 结构照 SONY TPS-L2 实物的横向砖形：
       右缘一条竖向铝质饰条；顶缘横贯丝印带（含实物的双耳机孔）；
       主体左侧是翻盖透明走带窗，右侧是 2x2 金属推杆键（含橙色 HOT LINE）；
       底缘丝印区放音量与次要入口。
     机身固定 TPS-L2 蓝（实物是注塑蓝塑料），角色印象色只落在磁带 A 面标签上。 */
  var skin = (window.cassetteSkin && window.cassetteSkin.pick()) || null;
  var plate = (skin && window.cassetteSkin.plateName(skin.englishName)) || 'RANDOM PLAY';

  el.innerHTML = [
    /* 右缘铝条 */
    '<span class="fc-rail" aria-hidden="true"></span>',
    /* 顶缘横贯丝印带（兼拖拽把手）。不使用 SONY 标：本站为非官方粉丝站。 */
    '<div class="fc-brow" data-drag-handle>',
    '  <span class="fc-wordmark" aria-hidden="true">HOOXI</span>',
    '  <p class="fc-model" aria-hidden="true">STEREO CASSETTE PLAYER</p>',
    /* 双耳机孔：实物顶部并排两个插孔，供两人同听 */
    '  <span class="fc-jacks" aria-hidden="true"><i></i><i></i></span>',
    '</div>',
    '<div class="fc-main">',
    /* 走带窗：内凹深腔 + 磁带实体 + 纸标 + 玻璃高光 */
    '  <div class="fc-window">',
    '    <div class="fc-tape">',
    '      <div class="fc-tapelabel">',
    '        <small><span class="fc-side">A</span><span data-cf="plate">' + plate + '</span></small>',
    '        <b data-cf="track">未选择音乐</b>',
    '      </div>',
    '      <div class="fc-reels" aria-hidden="true">',
    '        <div class="fc-hub fc-hub--l"><em class="fc-wound"></em><i class="fc-teeth"></i></div>',
    '        <div class="fc-tape-span"></div>',
    '        <div class="fc-hub fc-hub--r"><em class="fc-wound"></em><i class="fc-teeth"></i></div>',
    '      </div>',
    '    </div>',
    '    <span class="fc-glass" aria-hidden="true"></span>',
    '  </div>',
    /* 金属推杆键：实物是银色竖纹推杆，不是圆钮 */
    '  <div class="fc-keys">',
    '    <button type="button" class="fc-key" data-cf="prev" aria-label="上一首"><span class="fc-key-face">◀◀</span></button>',
    '    <button type="button" class="fc-key fc-key--play" data-cf="toggle" aria-label="播放音乐"><span class="fc-key-face">▶</span></button>',
    '    <button type="button" class="fc-key" data-cf="next" aria-label="下一首"><span class="fc-key-face">▶▶</span></button>',
    /* HOT LINE：实物那枚橙键，按下压低音乐音量以便两人说话 */
    '    <button type="button" class="fc-hotline" data-cf="hotline" aria-pressed="false" aria-label="HOT LINE：压低音乐音量">HOT<br/>LINE</button>',
    '  </div>',
    '</div>',
    '<div class="fc-foot">',
    '  <label class="fc-vol">VOL<input type="range" min="0" max="1" step=".05" value=".25" data-cf="vol" aria-label="悬浮磁带机音量"/></label>',
    '  <button type="button" class="fc-mini" data-cf="list" aria-label="打开歌单">歌单</button>',
    '  <button type="button" class="fc-mini" data-cf="open" aria-label="打开全屏磁带机">全屏</button>',
    '  <button type="button" class="fc-mini" data-cf="collapse" aria-label="合上磁带舱">▾</button>',
    '</div>'
  ].join('');
  document.body.appendChild(el);

  if (skin && window.cassetteSkin) window.cassetteSkin.apply(el, skin);

  var $ = function (sel) { return el.querySelector(sel); };
  var handle = $('[data-drag-handle]');
  var elToggle = $('[data-cf="toggle"]');
  var elTrack = $('[data-cf="track"]');
  var elVol = $('[data-cf="vol"]');
  var elHotline = $('[data-cf="hotline"]');
  var elCollapse = $('[data-cf="collapse"]');
  /* 推杆键的可见文字在内层 .fc-key-face 上（外层要保留金属层结构），
     写文本必须写内层，否则会把键面结构冲掉。 */
  var faceToggle = elToggle.querySelector('.fc-key-face') || elToggle;

  // 既有控件（转发目标）
  var srcToggle = document.getElementById('musicToggle');
  var srcPrev = document.getElementById('prevTrack');
  var srcNext = document.getElementById('nextTrack');
  var srcVol = document.getElementById('volume');
  var srcList = document.getElementById('playlistOpen');
  var srcOpen = document.getElementById('cassetteOpen');

  function click(node) { if (node) node.click(); }

  // ---- 控件转发 -----------------------------------------------------------
  $('[data-cf="prev"]').addEventListener('click', function () { markGestured(); click(srcPrev); });
  $('[data-cf="next"]').addEventListener('click', function () { markGestured(); click(srcNext); });
  $('[data-cf="list"]').addEventListener('click', function () { markGestured(); click(srcList); });
  $('[data-cf="open"]').addEventListener('click', function () { markGestured(); click(srcOpen); });
  elToggle.addEventListener('click', function () { markGestured(); click(srcToggle); });

  // 音量：写入既有 input 并派发 input 事件，让 app.js 的 handler 生效
  elVol.addEventListener('input', function () {
    /* 用户亲手拨音量即视为接管：退出 HOT LINE 压音状态但不回弹到旧值 */
    if (hotline) releaseHotline(false);
    setVolText(elVol.value);
    if (srcVol) {
      srcVol.value = elVol.value;
      srcVol.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      audio.volume = Number(elVol.value);
    }
  });

  /* HOT LINE：实物按下后压低音乐、开启机内话筒让两人对话。
     网页端没有话筒，只保留可验证的那一半——把音量压到两成便于说话，
     再按一次恢复原音量。不做纯装饰的假按钮。 */
  var hotline = false;
  var hotlinePrev = 0;
  function releaseHotline(restore) {
    hotline = false;
    elHotline.setAttribute('aria-pressed', 'false');
    el.classList.remove('is-hotline');
    if (restore) applyVolume(hotlinePrev);
  }
  function applyVolume(v) {
    var val = Math.min(1, Math.max(0, Number(v) || 0));
    if (srcVol) {
      srcVol.value = String(val);
      srcVol.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      audio.volume = val;
    }
    elVol.value = String(val);
    setVolText(val);
  }
  elHotline.addEventListener('click', function () {
    markGestured();
    if (hotline) { releaseHotline(true); return; }
    hotlinePrev = Number(audio.volume);
    hotline = true;
    elHotline.setAttribute('aria-pressed', 'true');
    el.classList.add('is-hotline');
    applyVolume(hotlinePrev * 0.2);
  });

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
  function syncVol() {
    var v = (srcVol && srcVol.value) || localStorage.getItem('hooxiVolume') || '0.25';
    elVol.value = v;
    setVolText(v);
  }
  /* 音量的 0-1 小数不适合朗读，换成百分比。 */
  function setVolText(v) {
    elVol.setAttribute('aria-valuetext', Math.round(Number(v) * 100) + '%');
  }

  /* 卷轴物理：真实磁带走带时左轴（供带轴）缠带渐少、右轴（收带轴）渐多，
     多数网页复刻忽略这点做成两个等大匀速圆。这里按进度插值缠带半径，
     并让转速反比于卷径——卷径大则转速慢，线速度恒定。
     删掉进度条后，这就是唯一的进度指示，和实物一致。 */
  var hubL = $('.fc-hub--l .fc-wound');
  var hubR = $('.fc-hub--r .fc-wound');
  function syncReels() {
    var d = audio.duration;
    var t = (d && isFinite(d) && d > 0) ? audio.currentTime / d : 0;
    t = Math.min(1, Math.max(0, t));
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
  audio.addEventListener('ended', function () { syncPlaying(); syncReels(); });
  audio.addEventListener('timeupdate', syncReels);
  audio.addEventListener('loadedmetadata', function () { syncReels(); syncTrack(); });
  audio.addEventListener('volumechange', function () {
    elVol.value = String(audio.volume);
    setVolText(audio.volume);
  });

  // trackName 由 app.js 用文本更新，用 MutationObserver 镜像
  var srcName = document.getElementById('trackName');
  if (srcName && window.MutationObserver) {
    new MutationObserver(function () { syncTrack(); }).observe(srcName, { childList: true, characterData: true, subtree: true });
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
    syncTrack(); syncVol(); syncPlaying(); syncReels();
    // 首帧尝试自动播放（多半会被拦，之后走首次交互）
    tryAutoplay();
    // app.js 的 updatePlayer 在 load 时才写入 audio.src，稍后补一次
    setTimeout(tryAutoplay, 400);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
