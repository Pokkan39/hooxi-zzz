/* ============================================================
   HOOXI // WebP 优先加载
   scripts/optimize-images.py 已为超大素材生成限宽 1400px 的 .webp 副本
   （全站 966MB → 89MB）。本脚本让页面从一开始就请求 webp，而不是
   先下载原图再替换（那样会双份流量）。

   做法：在数据渲染前重写 window.archiveData / agentCatalog 里的图片路径，
   使 page.js / app.js 生成的 <img> 直接指向 webp。
   对 HTML 里已硬编码的图片，用 onerror 回退保证不出现坏图。

   本脚本不改磁盘上的数据文件或原图；删除引用即完整回滚。
   ============================================================ */
(function () {
  'use strict';

  var DIRS = /\/?assets\/(hero|wiki\/(?:media|events|behind)|covers|gallery)\//;
  var RASTER = /\.(png|jpe?g)$/i;
  var FIELDS = ['cover', 'portrait', 'avatar', 'headshot', 'iconUrl',
    'headerImgUrl', 'image', 'src', 'thumb'];

  function toWebp(v) {
    if (typeof v !== 'string' || !v) return v;
    var clean = v.replace(/\?.*$/, '');
    if (!RASTER.test(clean) || !DIRS.test(clean)) return v;
    return clean.replace(RASTER, '.webp');
  }

  /* 递归改写对象中的图片字段与图片数组 */
  function walk(node, depth) {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        if (typeof node[i] === 'string') node[i] = toWebp(node[i]);
        else walk(node[i], depth + 1);
      }
      return;
    }
    if (typeof node !== 'object') return;
    for (var k in node) {
      if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
      var v = node[k];
      if (typeof v === 'string') {
        if (FIELDS.indexOf(k) > -1) node[k] = toWebp(v);
      } else walk(v, depth + 1);
    }
  }

  function rewriteData() {
    ['archiveData', 'agentCatalog', 'agentEnrichment', 'hooxiMediaCatalog',
      'cultivateData', 'layoutData'].forEach(function (name) {
        try { if (window[name]) walk(window[name], 0); } catch (e) { }
      });
  }

  /* 坏图兜底：webp 缺失时回退同名原图，避免出现空白 */
  function bindFallback() {
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG' || img.dataset.webpFallback) return;
      var src = img.getAttribute('src') || '';
      if (!/\.webp$/i.test(src) || !DIRS.test(src)) return;
      img.dataset.webpFallback = '1';
      // 依次尝试原始扩展名
      var base = src.replace(/\.webp$/i, '');
      var exts = ['.png', '.jpg', '.jpeg'], idx = 0;
      (function next() {
        if (idx >= exts.length) return;
        var cand = base + exts[idx++];
        var probe = new Image();
        probe.onload = function () { img.src = cand; };
        probe.onerror = next;
        probe.src = cand;
      })();
    }, true);
  }

  /* app.js 内硬编码的首图回退路径不在数据里，单独兜住，
     避免 2.1MB 原图覆盖已优化的 webp。 */
  function guardHeroImage() {
    var HERO = /assets\/hero\/zzz-random-play-keyart\.png/;
    var obs = new MutationObserver(function () {
      var img = document.getElementById('heroStarImg');
      if (!img) return;
      var s = img.getAttribute('src') || '';
      if (HERO.test(s)) img.src = s.replace(/\.png$/i, '.webp');
    });
    var start = function () {
      obs.observe(document.documentElement, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['src']
      });
      // 10 秒后停止观察，避免长期占用
      setTimeout(function () { obs.disconnect(); }, 10000);
    };
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  bindFallback();
  rewriteData();
  guardHeroImage();
  // 数据脚本可能在本脚本之后加载，DOM 就绪时再补一次
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', rewriteData);
})();
