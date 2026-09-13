(() => {
  // EVENTS 竖向轮播：先随机打乱活动卡顺序，然后持续匀速向上滑动；
  // 每卷过一整张卡就把最上面的卡移到队尾，形成无限跑马灯（无停顿、无瞬移）。
  // GAP 从 --ev-gap 动态读取，与 .event-reel 的 gap 始终一致。
  const reel = document.querySelector('.event-reel');
  if (!reel) return;
  const cards = [...reel.querySelectorAll('.event-card')];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards.forEach((c, i) => { reel.appendChild(c); c.classList.toggle('is-active', i === 1); }); // 官方中间可视卡亮绿框
  cards.forEach(c => reel.appendChild(c.cloneNode(true))); // 整组克隆递补：舞台底部不露空白，且循环中不出现相邻重复卡

  // 间距/速度读 CSS 变量（编辑器可实时调整），缺省 15px 与 36px/s 对齐官方
  const cssNum = (name, fallback) => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };
  let pos = 0, last = performance.now(), activeIdx = 0, looping = false;
  const frame = (now) => {
    if (document.hidden) { looping = false; return; }
    looping = true;
    const dt = Math.min((now - last) / 1000, 0.1); // 后台标签切回时避免跳变
    last = now;
    pos += cssNum('--event-speed', 36) * dt; // px/s，约 8 秒滚过一张卡
    const step = reel.firstElementChild.offsetHeight + cssNum('--ev-gap', 15); // 与 .event-reel 的 gap 保持一致
    while (pos >= step) {
      reel.appendChild(reel.firstElementChild);
      pos -= step;
    }
    reel.style.transform = `translateY(${-pos}px)`;
    if (!frame.spr) frame.spr = reel.closest('.film-strip')?.querySelectorAll('.film-sprockets') || [];
    frame.spr.forEach(s => { s.style.backgroundPositionY = `${-pos}px`; }); // 齿孔与帧联动滚动
    const k = (Math.round(pos / step) + 1) % reel.children.length; // +1：亮可视区中间那张，对齐官方
    if (k !== activeIdx) {
      activeIdx = k;
      [...reel.children].forEach((c, i) => c.classList.toggle('is-active', i === k));
    }
    requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !looping) {
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });
  requestAnimationFrame(frame);
})();

(() => {
  const nav = document.querySelector('.bottom-nav');
  if (nav) document.documentElement.style.setProperty('--nav-h', Math.ceil(nav.getBoundingClientRect().height) + 'px');

  const items = [...document.querySelectorAll('.nav-item')];
  items.forEach((btn) => {
    if (!btn.querySelector('.zap')) {
      const z = document.createElement('i');
      z.className = 'zap';
      z.setAttribute('aria-hidden', 'true');
      btn.prepend(z);
    }
  });

  const flash = (btn) => {
    items.forEach((x) => x.classList.remove('is-zap'));
    btn.classList.add('is-zap');
    const done = (e) => {
      if (e.target !== btn.querySelector('.zap') && e.animationName !== 'zapFlash') return;
      btn.classList.remove('is-zap');
      btn.removeEventListener('animationend', done);
    };
    btn.addEventListener('animationend', done);
    setTimeout(() => btn.classList.remove('is-zap'), 400);
  };

  const mask = document.getElementById('wip-mask');
  const codeEl = document.getElementById('wip-code');
  const modEl = document.getElementById('wip-mod');
  const logEl = document.getElementById('wip-log');
  let lastBtn = null;
  const openWip = (code, btn) => {
    if (!mask) return;
    lastBtn = btn;
    const ch = code || 'STANDBY';
    if (codeEl) codeEl.textContent = ch;
    if (modEl) modEl.textContent = ch;
    if (logEl) logEl.textContent = `> handshake timeout\n> ${ch} locked\n> return to HUD`;
    mask.hidden = false;
    mask.classList.remove('is-closing');
    document.getElementById('wip-close')?.focus();
  };
  const closeWip = () => {
    if (!mask || mask.hidden) return;
    mask.classList.add('is-closing');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      mask.hidden = true;
      mask.classList.remove('is-closing');
      lastBtn?.focus();
    };
    mask.querySelector('.wip-tv')?.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 460);
  };
  document.getElementById('wip-close')?.addEventListener('click', closeWip);
  mask?.addEventListener('click', (e) => { if (e.target === mask) closeWip(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mask && !mask.hidden) closeWip();
  });

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goWithCut = (href) => {
    if (!href) return;
    if (reduced()) { location.href = href; return; }
    let layer = document.querySelector('.hud-cut');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'hud-cut';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    layer.classList.add('is-on');
    setTimeout(() => { location.href = href; }, 280);
  };
  window.__hooxiHudGo = goWithCut;

  const shell = document.querySelector('.game-shell');
  if (shell) {
    const press = (on) => shell.classList.toggle('is-press', on);
    shell.addEventListener('pointerdown', () => { if (!reduced()) press(true); });
    window.addEventListener('pointerup', () => press(false));
    window.addEventListener('pointercancel', () => press(false));
  }

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  items.forEach((btn) => {
    btn.addEventListener('click', () => {
      flash(btn);
      items.forEach((x) => {
        x.classList.toggle('is-active', x === btn);
        x.setAttribute('aria-current', x === btn ? 'page' : 'false');
      });
      const wip = btn.getAttribute('data-wip');
      if (wip) { openWip(wip, btn); return; }
      const href = (btn.getAttribute('data-href') || '').trim();
      if (!href) return;
      const dest = href.split('?')[0].split('/').pop().toLowerCase();
      if (dest && dest !== page && dest !== 'index.html') goWithCut(href);
    });
  });

  document.getElementById('bg-switch')?.addEventListener('click', () => {
    goWithCut('wallpaper.html');
  });
})();
