/* =========================================================================
   cassette-skin.js  —  磁带机配色控制器（角色印象色）
   加载顺序：置于 agent-xray.js / agent-catalog.js 之后、cassette-float.js 之前。

   职责单一：算出一套可用的配色 + 一个角色英文名，暴露给磁带机使用。
   不碰 DOM 结构、不碰播放逻辑。

   色源说明：
   - 印象色取 agent-xray.js 的 l 字段（影画上大号招牌英文字母的颜色），
     它比全图均值 c 更接近「这个角色的标志色」。
   - 英文名取 agent-catalog.js 的 englishName。

   为什么必须提亮：53 个印象色里有 23 个在深色机身上对比度不足 4.5:1
   （如 billy-kid 深红 2.52、zhu-yuan 深蓝 2.28、miyabi 墨青 3.26），
   直接用会让机身丝印文字读不清。提亮算法与角色页 archive-tools.js 同源
   （目标相对亮度 0.48），实测提亮后仅 pyrois 差 0.11，故再补迭代收尾。
   ========================================================================= */
(function () {
  'use strict';

  var LS_MODE = 'hooxiCassetteSkinMode';   // 'random' | 'custom'
  var LS_COLOR = 'hooxiCassetteSkinColor'; // 自定义色 'r,g,b'
  var DARK = [24, 23, 26];                 // 机身走带窗底色，对比度基准

  function srgb(c) {
    var v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function relLum(c) {
    return 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]);
  }
  function contrast(a, b) {
    var l1 = relLum(a), l2 = relLum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /* 提亮到可读：先按目标相对亮度整体抬一次（与角色页同一算法），
     若仍不足 4.5:1 再逐步迭代。迭代上限 40 步足够收敛。 */
  function toReadable(rgb) {
    var lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    var k = lum < 0.48 ? 0.48 / Math.max(lum, 0.04) : 1;
    var out = rgb.map(function (v) { return Math.min(255, Math.round(v * k)); });
    for (var i = 0; i < 40 && contrast(out, DARK) < 4.5; i++) {
      out = out.map(function (v) { return Math.min(255, Math.round(v * 1.05) + 1); });
    }
    return out;
  }

  /* 机身金属需要三档明度：高光、主色、暗部。
     阳极氧化铝的特征是高光偏白而暗部仍保有色相，所以暗部不是简单变黑。 */
  function shade(rgb, k) {
    return rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * k))); });
  }

  /* 英文名丝印：SONY 标那个位置放不下长名。
     最长的 Orphie Magnusson & Magus 有 24 字符，超限则退到首词。 */
  function plateName(en) {
    var s = String(en || '').trim();
    if (!s) return 'STEREO';
    if (s.length <= 14) return s.toUpperCase();
    var first = s.split(/[\s\-&]+/)[0];
    return (first || s.slice(0, 14)).toUpperCase();
  }

  function buildPool() {
    var xray = window.agentXray || {};
    var cat = (window.agentCatalog && window.agentCatalog.characters) || [];
    var byId = {};
    cat.forEach(function (c) { if (c && c.id) byId[c.id] = c; });
    return Object.keys(xray).filter(function (id) {
      return xray[id] && xray[id].l && byId[id] && byId[id].englishName;
    }).map(function (id) {
      return { id: id, color: xray[id].l, englishName: byId[id].englishName };
    });
  }

  function parseColor(str) {
    var m = String(str || '').match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    var hex = String(str || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    return null;
  }

  function pick() {
    var mode, saved;
    try {
      mode = localStorage.getItem(LS_MODE);
      saved = localStorage.getItem(LS_COLOR);
    } catch (e) {}

    if (mode === 'custom') {
      var custom = parseColor(saved);
      if (custom) return { id: '', englishName: 'CUSTOM', color: custom, mode: 'custom' };
    }

    var pool = buildPool();
    if (!pool.length) {
      /* 无色源时退到站点既有黄，保证磁带机不会失色 */
      return { id: '', englishName: 'STEREO', color: [251, 216, 63], mode: 'fallback' };
    }
    var hit = pool[Math.floor(Math.random() * pool.length)];
    return { id: hit.id, englishName: hit.englishName, color: hit.color, mode: 'random' };
  }

  /* 把一套配色写成 CSS 变量。机身主色随角色变，
     前面板银灰与橙色开关是 TPS-L2 的固有特征，恒定不变——
     若它们也跟着变，53 种配色就不再是「同一台机器的不同颜色」。 */
  function apply(target, skin) {
    var body = toReadable(skin.color);
    var s = target.style;
    s.setProperty('--cf-accent', body.join(','));
    s.setProperty('--cf-body-hi', shade(body, 1.18).join(','));
    s.setProperty('--cf-body-lo', shade(body, 0.42).join(','));
    s.setProperty('--cf-body-deep', shade(body, 0.24).join(','));
    /* 机身色上放文字时在黑白间择优，深色机身配黑字反而更像丝印 */
    var fg = contrast([0, 0, 0], body) >= contrast([255, 255, 255], body) ? '17,19,21' : '255,255,255';
    s.setProperty('--cf-on-body', fg);
    target.dataset.skinAgent = skin.id || '';
    target.dataset.skinMode = skin.mode;
  }

  window.cassetteSkin = {
    pick: pick,
    apply: apply,
    plateName: plateName,
    toReadable: toReadable,
    contrast: contrast,
    setCustom: function (input) {
      var rgb = parseColor(input);
      if (!rgb) return false;
      try {
        localStorage.setItem(LS_MODE, 'custom');
        localStorage.setItem(LS_COLOR, rgb.join(','));
      } catch (e) {}
      return true;
    },
    clearCustom: function () {
      try {
        localStorage.setItem(LS_MODE, 'random');
        localStorage.removeItem(LS_COLOR);
      } catch (e) {}
    },
    isCustom: function () {
      try { return localStorage.getItem(LS_MODE) === 'custom'; } catch (e) { return false; }
    },
  };
})();
