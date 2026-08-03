/* game-feel.js — 自动注入游戏感交互层
   色散(chromatic aberration)：自动为 [data-disperse] img 克隆 R/B 通道层
   自动标记：角色立绘、卡片图片、首页英雄图等自动获得 data-disperse
*/
(function () {
  "use strict";

  // ── 自动标记需要色散效果的容器 ──
  var AUTO_SELECTORS = [
    // .d-keyart 不参与色散：已有 X-ray 双层交互
    ".agent-stage-art",       // 角色舞台立绘
    ".agent-roster-card",     // 角色花名册卡片
    ".home-agent-card",       // 首页代理人卡片
    ".home-reel-card",        // 首页剧集卡片
    ".agent-entry",           // 角色条目（多页）
    ".path-card figure",      // 路径卡图片区
    ".episode figure",        // 剧集条目图片
    ".faction-entry"          // 阵营条目
  ];

  function autoTag() {
    AUTO_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.hasAttribute("data-disperse") && el.querySelector("img")) {
          el.setAttribute("data-disperse", "");
        }
      });
    });
  }

  // ── 色散：自动注入 R/B 层 ──
  function injectChromatic() {
    var containers = document.querySelectorAll("[data-disperse]");
    containers.forEach(function (container) {
      if (container.querySelector(".gf-chr-r")) return;
      var img = container.querySelector("img:not(.gf-chr-r):not(.gf-chr-b)");
      if (!img) return;
      var r = img.cloneNode(false);
      var b = img.cloneNode(false);
      r.className = "gf-chr-r";
      b.className = "gf-chr-b";
      r.removeAttribute("alt");
      b.removeAttribute("alt");
      r.setAttribute("aria-hidden", "true");
      b.setAttribute("aria-hidden", "true");
      r.removeAttribute("loading");
      b.removeAttribute("loading");
      img.parentNode.insertBefore(r, img);
      img.parentNode.insertBefore(b, img);
    });
  }

  function init() {
    autoTag();
    injectChromatic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // MutationObserver 处理动态加载
  var debounce = null;
  var observer = new MutationObserver(function () {
    if (debounce) return;
    debounce = setTimeout(function () {
      debounce = null;
      autoTag();
      injectChromatic();
    }, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── 02. 卡片倾斜 + 高光跟随 ──
  var TILT_SELECTORS = [
    ".agent-roster-card",
    ".home-agent-card",
    ".home-reel-card",
    ".path-card",
    ".episode"
  ];
  var MAX_TILT = 10; // 度

  function initTilt() {
    // 自动标记
    TILT_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.hasAttribute("data-tilt-card")) return;
        el.setAttribute("data-tilt-card", "");
        el.style.position = el.style.position || "relative";
        // 注入高光层
        var sheen = document.createElement("span");
        sheen.className = "gf-sheen";
        sheen.setAttribute("aria-hidden", "true");
        el.appendChild(sheen);
        // 给父容器加 perspective
        var parent = el.parentElement;
        if (parent && !parent.classList.contains("gf-perspective")) {
          parent.classList.add("gf-perspective");
        }
      });
    });

    // 绑定事件（使用 GSAP 若可用，否则 rAF 回退）
    document.querySelectorAll("[data-tilt-card]:not([data-tilt-bound])").forEach(function (card) {
      card.setAttribute("data-tilt-bound", "");
      var sheen = card.querySelector(".gf-sheen");
      var useGsap = typeof gsap !== "undefined" && gsap.quickTo;

      var qx, qy;
      if (useGsap) {
        qx = gsap.quickTo(card, "rotationX", { duration: 0.35, ease: "power2.out" });
        qy = gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power2.out" });
      }

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
        var ny = (e.clientY - rect.top) / rect.height * 2 - 1;

        if (useGsap) {
          qx(-ny * MAX_TILT);
          qy(nx * MAX_TILT);
        } else {
          card.style.transform = "perspective(800px) rotateX(" + (-ny * MAX_TILT) + "deg) rotateY(" + (nx * MAX_TILT) + "deg)";
        }

        // 高光跟随
        if (sheen) {
          card.style.setProperty("--sx", ((nx + 1) / 2 * 100) + "%");
          card.style.setProperty("--sy", ((ny + 1) / 2 * 100) + "%");
        }
      });

      card.addEventListener("mouseenter", function () {
        card.classList.add("is-tilt-live");
      });

      card.addEventListener("mouseleave", function () {
        card.classList.remove("is-tilt-live");
        if (useGsap) {
          qx(0);
          qy(0);
        } else {
          card.style.transform = "";
        }
      });
    });
  }

  // 等 GSAP 加载完再初始化 tilt
  function waitAndInitTilt() {
    if (typeof gsap !== "undefined") {
      initTilt();
    } else {
      setTimeout(waitAndInitTilt, 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndInitTilt);
  } else {
    waitAndInitTilt();
  }

  // ── 03. 方向下划线 ──
  var DIR_SELECTORS = [
    "[data-dir-link]",
    ".topbar nav a",
    ".site-sidebar-link"
  ];

  function initDirLinks() {
    DIR_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (link) {
        if (link.hasAttribute("data-dir-bound")) return;
        link.setAttribute("data-dir-bound", "");
        link.addEventListener("mouseenter", function (e) {
          var rect = link.getBoundingClientRect();
          var midX = rect.left + rect.width / 2;
          if (e.clientX > midX) {
            link.classList.add("is-from-right");
          } else {
            link.classList.remove("is-from-right");
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDirLinks);
  } else {
    initDirLinks();
  }
})();
