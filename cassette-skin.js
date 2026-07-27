/* =========================================================================
   cassette-skin.js  —  磁带纸标配色控制器（角色印象色）
   加载顺序：置于 agent-xray.js / agent-catalog.js 之后、cassette-float.js 之前。

   职责单一：算出一套可用的配色 + 一个角色英文名，暴露给磁带机使用。
   不碰 DOM 结构、不碰播放逻辑。

   作用范围（本轮收窄）：印象色只染**磁带 A 面纸标**，不再染机身。
   理由：TPS-L2 实物是蓝色注塑塑料机身，机身变色就不是那台机器了；
   而「这盘带子是谁的」本来就是磁带自己的属性，落在纸标上更合逻辑。

   色源说明：
   - 印象色取 agent-xray.js 的 l 字段（影画上大号招牌英文字母的颜色），
     它比全图均值 c 更接近「这个角色的标志色」。
   - 英文名取 agent-catalog.js 的 englishName。
   ========================================================================= */
(function () {
  'use strict';

  /* 纸标基色：真磁带的纸标是米白卡纸，印象色只作为染色叠加。 */
  var PAPER = [232, 229, 219];

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

  /* 染纸：把印象色按固定比例混进米白卡纸。
     53 个印象色里深色不少（billy-kid 深红、zhu-yuan 深蓝、miyabi 墨青），
     直接铺满会把纸标压成深块、手写曲名读不清；混纸后色相仍可辨，
     而底色始终留在浅区，曲名用深墨即可稳定达标。混合比例 0.3 是实测下限：
     再低就分不出角色，再高深色角色会掉出可读区。 */
  function toPaper(rgb) {
    return PAPER.map(function (p, i) {
      return Math.round(p * 0.7 + Math.min(255, Math.max(0, rgb[i])) * 0.3);
    });
  }

  /* 纸标下缘的压暗边：纸贴在磁带壳上会有一道阴影。 */
  function shade(rgb, k) {
    return rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * k))); });
  }

  /* 英文名丝印：纸标那行放不下长名。
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

  function pick() {
    var pool = buildPool();
    if (!pool.length) {
      /* 无色源时退到站点既有黄，保证纸标不会失色 */
      return { id: '', englishName: 'STEREO', color: [251, 216, 63], mode: 'fallback' };
    }
    var hit = pool[Math.floor(Math.random() * pool.length)];
    return { id: hit.id, englishName: hit.englishName, color: hit.color, mode: 'random' };
  }

  /* 把一套配色写成 CSS 变量。只写纸标相关的三个变量——
     机身蓝、右侧铝条银、HOT LINE 橙都是 TPS-L2 的固有特征，由 CSS 固定，
     JS 一律不碰，所以刷新多少次机身都是同一台机器。 */
  function apply(target, skin) {
    var paper = toPaper(skin.color);
    var s = target.style;
    s.setProperty('--cf-label', paper.join(','));
    s.setProperty('--cf-label-edge', shade(paper, 0.7).join(','));
    /* 纸标上的手写曲名在黑白间择优（染纸后基本恒为深墨，仍按实测择优） */
    var ink = contrast([24, 26, 30], paper) >= contrast([255, 255, 255], paper) ? '24,26,30' : '255,255,255';
    s.setProperty('--cf-label-ink', ink);
    target.dataset.skinAgent = skin.id || '';
    target.dataset.skinMode = skin.mode;
  }

  window.cassetteSkin = {
    pick: pick,
    apply: apply,
    plateName: plateName,
    toPaper: toPaper,
    contrast: contrast,
  };
})();
