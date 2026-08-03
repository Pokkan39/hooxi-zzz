/* theme-switcher.js — ZZZ 主题切换
   机制：URL ?theme=xxx → body.dataset.theme → theme-tokens.css 的 body[data-theme] 选择器覆盖 tokens.css
   持久化：localStorage，key=hooxi-theme
   回退：未配置时默认 warehouse（theme-tokens.css 已在 :root 块定义，无需额外处理）
   用法：theme-switcher.js 需加载在 theme-tokens.css 之后
*/
(function () {
  "use strict";
  var THEMES = ["warehouse", "arcade", "slate", "paper", "ink-wash"];
  var LS_KEY = "hooxi-theme";
  var PARAM = "theme";

  function pick() {
    var p = new URLSearchParams(location.search).get(PARAM);
    if (p && THEMES.indexOf(p) >= 0) {
      localStorage.setItem(LS_KEY, p);
      return p;
    }
    var stored = localStorage.getItem(LS_KEY);
    if (stored && THEMES.indexOf(stored) >= 0) return stored;
    return "warehouse";
  }

  function apply(t) {
    document.body.dataset.theme = t;
    var badge = document.getElementById("themeBadge");
    if (badge) {
      var labels = { warehouse: "仓库", arcade: "街机", slate: "板岩", paper: "纸样", "ink-wash": "墨淡" };
      badge.textContent = "色板 · " + (labels[t] || t);
      badge.style.display = "inline";
    }
  }

  apply(pick());

  // 暴露给开发者控制台手动切换
  window.__setTheme = function (t) {
    if (THEMES.indexOf(t) >= 0) {
      localStorage.setItem(LS_KEY, t);
      apply(t);
    }
  };
  window.__theme = pick();
})();
