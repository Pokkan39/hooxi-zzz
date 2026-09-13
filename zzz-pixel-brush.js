/* zzz-pixel-brush.js — pxpush 风"像素刷子"擦开雾玻璃，揭示影画彩色层。
   影画 .d-keyart 为三层结构：
     底层 .d-keyart-image（X 光单色 am）
     彩色层 .d-keyart-color（X 光彩色 ac，原本用平滑径向遮罩透出）
     色差层 .gf-chr-r/b（game-feel 自动注入）
   本模块把平滑聚光灯透出升级为方块像素刷：指针划过处以格子为单位
   擦出彩色层，像冬天擦雾玻璃——擦过的地方先保持清晰约 HOLD 毫秒，
   之后在 FADE 毫秒内重新"结霜"回单色底。每格带固定随机相位，
   结霜有先后差异，呈斑驳蔓延而非整片齐刷刷变暗。
   触屏 / 减少动态偏好下直接跳过，保留原有行为。 */
(function () {
  "use strict";
  if (window.__hooxiPixelBrush) return;
  window.__hooxiPixelBrush = true;

  var CELL = 16;     // 像素格子尺寸 px
  var RADIUS = 150;  // 刷子半径 px
  var HOLD = 1250;   // 擦开后保持清晰的时长 ms
  var FADE = 900;    // 之后结霜回单色的时长 ms
  var LIFE = HOLD + FADE;
  var JITTER = 0.34; // 每格结霜时机的随机偏移比例，制造斑驳感

  function init(keyart, colorImg) {
    var src = colorImg.getAttribute("src");
    if (!src) return;

    var img = new Image();
    img.decoding = "async";
    img.src = src;

    var canvas = document.createElement("canvas");
    canvas.className = "pxb-canvas";
    canvas.setAttribute("aria-hidden", "true");
    keyart.appendChild(canvas);
    keyart.classList.add("pxb-on");
    var ctx = canvas.getContext("2d");

    // 预对齐离屏画布：按 object-fit:cover + object-position 精确贴合底层
    var aligned = document.createElement("canvas");
    var actx = aligned.getContext("2d");

    var W = 0, H = 0, cols = 0, rows = 0, cells = null, phase = null;
    var ox = 0.5, oy = 0.5;
    var pointer = null, needsStamp = false, last = 0, raf = 0;

    function readObjectPosition() {
      var op = getComputedStyle(colorImg).objectPosition || "50% 50%";
      var p = op.split(/\s+/);
      function frac(v) {
        if (/%$/.test(v)) return parseFloat(v) / 100;
        if (v === "left" || v === "top") return 0;
        if (v === "right" || v === "bottom") return 1;
        return 0.5;
      }
      ox = frac(p[0]); oy = frac(p[1] || "50%");
    }

    function buildAligned() {
      if (!img.complete || !img.naturalWidth) return;
      var nw = img.naturalWidth, nh = img.naturalHeight;
      var s = Math.max(W / nw, H / nh);           // object-fit: cover
      var dw = nw * s, dh = nh * s;
      var left = (W - dw) * ox, top = (H - dh) * oy;
      actx.clearRect(0, 0, W, H);
      actx.drawImage(img, left, top, dw, dh);
    }

    function resize() {
      var box = keyart.getBoundingClientRect();
      W = canvas.width = aligned.width = Math.max(1, Math.round(box.width));
      H = canvas.height = aligned.height = Math.max(1, Math.round(box.height));
      cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
      cells = new Float32Array(cols * rows);
      // 每格一个固定随机相位，使结霜时机错开，形成斑驳蔓延
      phase = new Float32Array(cols * rows);
      for (var i = 0; i < phase.length; i++) phase[i] = 1 - Math.random() * JITTER;
      buildAligned();
    }

    function stamp() {
      if (!pointer) return;
      var span = Math.ceil(RADIUS / CELL);
      var cx = Math.floor(pointer.x / CELL), cy = Math.floor(pointer.y / CELL);
      for (var gy = cy - span; gy <= cy + span; gy++) {
        if (gy < 0 || gy >= rows) continue;
        for (var gx = cx - span; gx <= cx + span; gx++) {
          if (gx < 0 || gx >= cols) continue;
          var d = Math.hypot(gx * CELL + CELL * 0.5 - pointer.x, gy * CELL + CELL * 0.5 - pointer.y);
          if (d > RADIUS) continue;
          var i = gy * cols + gx;
          // 中心擦得更彻底，寿命更长；边缘只擦到一半，很快重新结霜
          var target = LIFE * (1 - (d / RADIUS) * 0.55);
          if (target > cells[i]) cells[i] = target;
        }
      }
    }

    function frame(t) {
      var dt = last ? Math.min(t - last, 64) : 16; last = t;
      if (needsStamp) { stamp(); needsStamp = false; }
      ctx.clearRect(0, 0, W, H);
      var any = false;
      for (var i = 0; i < cells.length; i++) {
        var life = cells[i];
        if (life <= 0) continue;
        life -= dt; if (life < 0) life = 0;
        cells[i] = life;
        if (life <= 0) continue;
        any = true;
        // 寿命前段保持全亮（玻璃仍清晰），进入尾段才按各格相位渐隐结霜
        var edge = FADE * phase[i];
        var a = life >= edge ? 1 : life / edge;
        var gx = i % cols, gy = (i / cols) | 0;
        ctx.globalAlpha = a;
        ctx.drawImage(aligned, gx * CELL, gy * CELL, CELL, CELL, gx * CELL, gy * CELL, CELL, CELL);
      }
      ctx.globalAlpha = 1;
      if (any || pointer) raf = requestAnimationFrame(frame);
      else { raf = 0; last = 0; }
    }

    function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

    // 监听父级 .character-screen：portrait/copy 等同级元素遮挡了 keyart 本身的事件
    var screen = keyart.closest(".character-screen") || keyart.parentElement;
    screen.addEventListener("pointermove", function (e) {
      var box = keyart.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
      needsStamp = true;
      kick();
    }, { passive: true });

    screen.addEventListener("pointerleave", function () { pointer = null; kick(); }, { passive: true });

    window.addEventListener("resize", function () { readObjectPosition(); resize(); }, { passive: true });

    function ready() { readObjectPosition(); resize(); kick(); }
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener("load", ready, { once: true });
  }

  function main() {
    var coarse = !window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;
    var tries = 0;
    (function wait() {
      var keyart = document.querySelector(".d-keyart[data-xray-pair]");
      var colorImg = keyart && keyart.querySelector(".d-keyart-color");
      if (!keyart || !colorImg) { if (++tries < 60) requestAnimationFrame(wait); return; }
      init(keyart, colorImg);
    })();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
