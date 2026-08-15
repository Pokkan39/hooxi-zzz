(function () {
  "use strict";

  if (window.__hooxiFxFlowingNav) return;
  window.__hooxiFxFlowingNav = true;

  var navSelector = ".topbar nav,.character-module-nav,.agent-category-menu,.archive-mobile-nav nav";
  var itemSelector = ":scope > a,:scope > button";
  var decorated = new WeakSet();
  var navs = [];
  var frame = 0;

  function installStyle() {
    if (document.getElementById("fx-flowing-nav-style")) return;
    var style = document.createElement("style");
    style.id = "fx-flowing-nav-style";
    style.textContent = ".fx-flow-nav{position:relative!important;isolation:isolate}.fx-flow-nav>:is(a,button){position:relative;z-index:1}.fx-flow-nav>.fx-flow-indicator{position:absolute!important;z-index:0!important;height:3px;left:0;bottom:0;width:0;opacity:0;pointer-events:none;background:linear-gradient(90deg,var(--page-accent,var(--data-accent,var(--v3-cyan,#00e5ff))),var(--v3-cyan,#00e5ff));box-shadow:0 0 16px color-mix(in srgb,var(--page-accent,var(--data-accent,#00e5ff)) 58%,transparent);transition:left 260ms cubic-bezier(.16,1,.3,1),width 260ms cubic-bezier(.16,1,.3,1),opacity 140ms linear}.fx-flow-nav.is-flow-active>.fx-flow-indicator{opacity:1}@media(prefers-reduced-motion:reduce){.fx-flow-indicator{transition:none!important}}";
    document.head.appendChild(style);
  }

  function items(nav) {
    return Array.from(nav.querySelectorAll(itemSelector)).filter(function (item) {
      return !item.hidden && item.getAttribute("aria-disabled") !== "true";
    });
  }

  function activeItem(nav) {
    return nav.querySelector(':scope > [aria-current="page"],:scope > [aria-current="true"],:scope > [aria-selected="true"],:scope > .is-active') || items(nav)[0] || null;
  }

  function move(nav, item) {
    var indicator = nav.querySelector(":scope > .fx-flow-indicator");
    if (!indicator || !item || !item.isConnected) {
      nav.classList.remove("is-flow-active");
      return;
    }
    var navRect = nav.getBoundingClientRect();
    var itemRect = item.getBoundingClientRect();
    indicator.style.left = itemRect.left - navRect.left + nav.scrollLeft + "px";
    indicator.style.width = itemRect.width + "px";
    nav.classList.add("is-flow-active");
  }

  function reset(nav) {
    move(nav, activeItem(nav));
  }

  function decorate(nav) {
    if (decorated.has(nav) || !items(nav).length) return;
    decorated.add(nav);
    navs.push(nav);
    nav.classList.add("fx-flow-nav");

    var indicator = document.createElement("span");
    indicator.className = "fx-flow-indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.appendChild(indicator);

    nav.addEventListener("pointerover", function (event) {
      var item = event.target.closest("a,button");
      if (item && item.parentElement === nav) move(nav, item);
    });
    nav.addEventListener("focusin", function (event) {
      var item = event.target.closest("a,button");
      if (item && item.parentElement === nav) move(nav, item);
    });
    nav.addEventListener("pointerleave", function () { reset(nav); });
    nav.addEventListener("focusout", function () {
      requestAnimationFrame(function () {
        if (!nav.contains(document.activeElement)) reset(nav);
      });
    });

    reset(nav);
  }

  function scan(root) {
    if (root.nodeType === 1 && root.matches(navSelector)) decorate(root);
    if (root.querySelectorAll) root.querySelectorAll(navSelector).forEach(decorate);
  }

  function refresh() {
    frame = 0;
    navs.forEach(function (nav) {
      if (nav.isConnected) reset(nav);
    });
  }

  function scheduleRefresh() {
    if (!frame) frame = requestAnimationFrame(refresh);
  }

  function init() {
    installStyle();
    scan(document);
    window.addEventListener("resize", scheduleRefresh, { passive: true });

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(scan);
      });
      scheduleRefresh();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-current", "aria-selected", "class"]
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
