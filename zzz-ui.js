/* ============================================================
   ZZZ 角色页视觉复刻 — 结构注入
   参考素材 artifacts/ref/zzz-ui.png（游戏内代理人界面截图）。
   本文件只读 window.agentCatalog，不请求外部接口。
   删除 character.html 里的 script 引用即可完整回滚。

   属性/rank 图标全部为内联 SVG 重画的通用符号（闪电、雪花、
   星形等），不搬运官方 UI 素材原件。配色依据见 design.css 第 12 节。
   ============================================================ */
(function () {
  'use strict';

  /* 属性图标：几何重画，viewBox 统一 24×24，fill 由 --at 决定 */
  var ICONS = {
    '电': 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
    '火': 'M12 2c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3 2-5 0 2 1 3 2 3s1-4 2-8Z',
    '冰': 'M12 2v20M12 2 7 7M12 2l5 5M12 22l-5-5M12 22l5-5M2.5 7l19 10M2.5 7l1 5M2.5 7l5-1M21.5 17l-1-5M21.5 17l-5 1M21.5 7 2.5 17M21.5 7l-5-1M21.5 7l-1 5M2.5 17l5 1M2.5 17l1-5',
    '物理': 'M4 12 12 3l8 9-8 9-8-9Zm8-5-4 5 4 5 4-5-4-5Z',
    '以太': 'M12 2c2 5 5 7 5 10a5 5 0 0 1-10 0c0-3 3-5 5-10Zm0 7c-1 2-2 2-2 3a2 2 0 0 0 4 0c0-1-1-1-2-3Z',
    '风': 'M3 8h11a3 3 0 1 0-3-3M3 13h14M5 18h8a3 3 0 1 1-3 3'
  };
  /* 子属性沿用父属性图形 */
  ICONS['烈霜'] = ICONS['冰'];
  ICONS['霜锋'] = ICONS['冰'];
  ICONS['玄墨'] = ICONS['物理'];

  /* 冰与风是线条型，需要 stroke 而非 fill */
  var STROKE_AT = { '冰': 1, '烈霜': 1, '霜锋': 1, '风': 1 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g,
      function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; });
  }

  function attrIcon(attribute, cls) {
    var d = ICONS[attribute];
    if (!d) return '';
    var stroked = STROKE_AT[attribute];
    return '<svg class="zzz-icon' + (cls ? ' ' + cls : '') + ' zzz-at-' + esc(attribute) + '"'
      + ' viewBox="0 0 24 24" role="img" aria-label="' + esc(attribute) + '属性"'
      + (stroked
        ? ' fill="none" stroke="var(--at,currentColor)" stroke-width="1.5" stroke-linecap="round"'
        : '')
      + '><path d="' + d + '"/></svg>';
  }

  /* 目录里 avatar/headshot/portrait 三个字段都指向 -card.webp，
     那是白底半身图，铺进深色卡片会变成一片白。改用透明底的
     -portrait.webp；只有 55 个角色有该版本，缺失的靠 img onerror
     回退到原 -card。不改 agent-catalog.js 数据本身。 */
  function cardArt(a) {
    var src = a.avatar || a.headshot || a.portrait || '';
    return src.replace(/-card\.webp$/, '-portrait.webp');
  }

  function catalog() {
    var c = window.agentCatalog;
    return c && Array.isArray(c.characters) ? c : null;
  }

  function currentId() {
    return new URLSearchParams(location.search).get('id') || '';
  }

  /* ---------- 1. 立绘背后的水印大字 ---------- */
  function mountWatermark(stage, agent) {
    var en = (agent.englishName || agent.name || '').toUpperCase();
    var parts = en.split(/\s+/);
    var head = parts[0] || en;
    var tail = parts.slice(1).join(' ') || (agent.attribute || '');

    /* 装饰文案用本站自己的标识，不摹写官方界面上的原文——
       照抄官方标语会让人误认为这是官方界面。 */
    var arc = 'HOOXI FAN ARCHIVE \u00B7 UNOFFICIAL \u00B7 AGENT DOSSIER \u00B7 NEW ERIDU';

    var wm = document.createElement('div');
    wm.className = 'zzz-watermark';
    wm.setAttribute('aria-hidden', 'true');
    wm.innerHTML =
      '<div class="zzz-wm-out">' + esc(head) + '</div>'
      + '<div class="zzz-wm-solid">' + esc(tail) + '</div>'
      + '<svg class="zzz-wm-arc" viewBox="0 0 560 300">'
      + '<defs><path id="zzzArc" d="M20 250 A 250 250 0 0 1 520 250"/></defs>'
      + '<text><textPath href="#zzzArc" startOffset="6%">' + esc(arc) + '</textPath></text>'
      + '</svg>';
    stage.insertBefore(wm, stage.firstChild);
  }

  /* ---------- 2. 左下身份牌 ---------- */
  function mountIdCard(stage, agent, factions) {
    var fac = factions.filter(function (f) { return f.id === agent.factionId; })[0];
    var card = document.createElement('div');
    card.className = 'zzz-idcard';
    card.innerHTML =
      (fac && fac.logo
        ? '<span class="zzz-idcard-ring"><img src="' + esc(fac.logo) + '" alt="'
          + esc(fac.name) + '徽记" loading="lazy" decoding="async"/></span>'
        : '')
      + '<b class="zzz-idcard-name">' + esc(agent.name) + '</b>'
      + '<span class="zzz-idcard-tags">'
      + '<span class="zzz-rank" data-rank="' + esc(agent.rank) + '">' + esc(agent.rank) + '</span>'
      + attrIcon(agent.attribute)
      + (agent.specialty
        ? '<small style="color:var(--paper-dim);font:700 10px var(--font-mono);letter-spacing:.1em">'
          + esc(agent.specialty) + '</small>'
        : '')
      + '</span>';
    stage.appendChild(card);
  }

  /* ---------- 3. 右侧角色网格（独立滚动）---------- */
  function mountRoster(screen, list, curId) {
    var box = document.createElement('aside');
    box.className = 'zzz-roster';
    box.setAttribute('aria-label', '代理人名录');

    var cards = list.map(function (a, i) {
      var on = a.id === curId;
      return '<a class="zzz-card' + (on ? ' is-current' : '') + '"'
        + ' href="character.html?id=' + encodeURIComponent(a.id) + '"'
        + ' style="--i:' + Math.min(i, 24) + '"'
        + ' data-agent="' + esc(a.id) + '"'
        + (on ? ' aria-current="page"' : '')
        + ' title="' + esc(a.name) + '">'
        + '<img src="' + esc(cardArt(a)) + '" alt="'
        + esc(a.name) + '" loading="lazy" decoding="async" width="196" height="261"'
        + ' onerror="this.onerror=null;this.src=\'' + esc(a.avatar || '') + '\'"/>'
        + '<span class="zzz-card-bar">'
        + '<span class="zzz-rank" data-rank="' + esc(a.rank) + '">' + esc(a.rank) + '</span>'
        /* 参考图这里是玩家等级，但档案站没有等级概念，
           凭空写「60」等于编造数据，改放职业（真实字段）。
           长角色名移到卡片下沿单独一行，避免窄条溢出。 */
        + '<span class="zzz-card-lv">' + esc(a.specialty || '') + '</span>'
        + attrIcon(a.attribute, 'zzz-icon-sm')
        + '</span>'
        + '<span class="zzz-card-name">' + esc(a.name) + '</span></a>';
    }).join('');

    box.innerHTML =
      '<div class="zzz-roster-head"><span>AGENT ROSTER</span><b>'
      + list.length + '</b></div>'
      + '<div class="zzz-roster-scroll">' + cards + '</div>';
    screen.appendChild(box);

    /* 当前角色滚到可见位置。用 auto 而非 smooth，避免进场时抢动画。*/
    var cur = box.querySelector('.zzz-card.is-current');
    if (cur) {
      requestAnimationFrame(function () {
        var sc = box.querySelector('.zzz-roster-scroll');
        if (!sc) return;
        sc.scrollTop = Math.max(0, cur.offsetTop - sc.clientHeight / 2 + cur.offsetHeight / 2);
      });
    }
  }

  /* ---------- 4. 最右荧光黄竖条 ---------- */
  function mountEdge(screen) {
    var e = document.createElement('div');
    e.className = 'zzz-edge';
    e.setAttribute('aria-hidden', 'true');
    var b = document.createElement('div');
    b.className = 'zzz-edge-badge';
    b.setAttribute('aria-hidden', 'true');
    b.textContent = 'SELECT';
    screen.appendChild(e);
    screen.appendChild(b);
  }

  function boot() {
    var screen = document.querySelector('.character-screen');
    var stage = document.querySelector('.character-stage');
    if (!screen || !stage || screen.dataset.zzzReady) return;
    var c = catalog();
    if (!c) return;
    var id = currentId();
    var agent = c.characters.filter(function (a) { return a.id === id; })[0];
    if (!agent) return;

    screen.dataset.zzzReady = '1';
    screen.classList.add('zzz-screen');

    try { mountWatermark(stage, agent); } catch (e) { }
    try { mountIdCard(stage, agent, c.factions || []); } catch (e) { }
    try { mountRoster(screen, c.characters, id); } catch (e) { }
    try { mountEdge(screen); } catch (e) { }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
