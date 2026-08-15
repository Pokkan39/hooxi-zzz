(function () {
  "use strict";

  if (window.__hooxiFxParallax) return;
  window.__hooxiFxParallax = true;

  if (!window.CSS || !CSS.supports || !CSS.supports("translate", "0 0")) return;

  var selector = [
    ".archive-record-cover img",
    ".video-cover-wrap img",
    ".faction-heading-logo img",
    ".faction-directory-emblem img",
    ".cultivate-mat-cover img",
    ".agent-stage-art img",
    ".character-hero-portrait",
    ".character-gallery-item img"
  ].join(",");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var tracked = new WeakSet();
  var originals = new WeakMap();
  var items = [];
  var frame = 0;

  function depthFor(element) {
    if (element.matches(".character-hero-portrait,.agent-stage-art img")) return 18;
    if (element.matches(".faction-heading-logo img")) return 13;
    return 8;
  }

  function add(root) {
    var nodes = [];
    if (root.nodeType === 1 && root.matches(selector)) nodes.push(root);
    if (root.querySelectorAll) nodes = nodes.concat(Array.from(root.querySelectorAll(selector)));

    nodes.forEach(function (element) {
      if (tracked.has(element)) return;
      tracked.add(element);
      originals.set(element, element.style.translate || "");
      items.push({ element: element, depth: depthFor(element) });
    });
  }

  function restore(item) {
    item.element.style.translate = originals.get(item.element) || "";
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches || document.hidden) {
      items.forEach(restore);
      return;
    }

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var buffer = viewportHeight * 0.6;

    items.forEach(function (item) {
      if (!item.element.isConnected) return;
      var rect = item.element.getBoundingClientRect();
      if (rect.bottom < -buffer || rect.top > viewportHeight + buffer) {
        restore(item);
        return;
      }

      var center = rect.top + rect.height / 2;
      var ratio = (viewportHeight / 2 - center) / viewportHeight;
      var offset = Math.max(-item.depth, Math.min(item.depth, ratio * item.depth * 2));
      item.element.style.translate = "0 " + offset.toFixed(2) + "px";
    });
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function init() {
    add(document);
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);

    var onMotionChange = function () { schedule(); };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionChange);
    else reducedMotion.addListener(onMotionChange);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(add);
      });
      schedule();
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
