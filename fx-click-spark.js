/* fx-click-spark.js — Global click particle burst
   CSS in redesign-core-v3.css provides .fx-click-spark-canvas */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'fx-click-spark-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const sparks = [];
  const COLORS = ['#d8fa00', '#00e5ff'];

  document.addEventListener('click', e => {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + (Math.random() - 0.5) * 0.4;
      const speed = 60 + Math.random() * 60;
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        born: performance.now(),
      });
    }
  });

  let lastT = 0;
  function draw(t) {
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = (t - s.born) / 400; // 0→1 over 400ms
      s.alpha = Math.max(0, 1 - age);
      if (s.alpha <= 0) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92; s.vy *= 0.92;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
