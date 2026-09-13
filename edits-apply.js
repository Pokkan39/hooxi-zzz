/* edits.json 套用层：只负责把已保存的覆盖（位置/换图/文字/主题/背景视频）应用到页面。
   不含任何编辑界面；edits.json 的写入需到旧版编辑器时期的服务端，现已移除。 */
(() => {
  const state = { version: 1, positions: {}, images: {}, crops: {}, texts: {}, theme: {}, bg: {} };
  let bgTimer = 0;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const migrateState = () => {
    if (num(state.version, 1) >= 2) return;
    /* 旧版偏移基于另一套布局，继续套用会把新版分层整体拉离基准位置。 */
    ['room', 'player', 'events'].forEach((key) => delete state.positions[key]);
    state.version = 2;
  };

  const applyPositions = () => {
    $$('[data-edit]').forEach((el) => {
      const p = state.positions[el.dataset.edit];
      el.style.setProperty('--dx', `${p ? num(p.x, 0) : 0}px`);
      el.style.setProperty('--dy', `${p ? num(p.y, 0) : 0}px`);
    });
  };

  const applyImages = () => {
    $$('[data-img]').forEach((el) => {
      const src = state.images[el.dataset.img];
      if (src && /assets\/uploads\//i.test(src)) return;
      if (src) {
        if (!el.dataset.orig) el.dataset.orig = el.getAttribute('src');
        el.setAttribute('src', src);
      } else if (el.dataset.orig) {
        el.setAttribute('src', el.dataset.orig);
      }
    });
  };

  const applyBgImages = () => {
    $$('[data-bgimg]').forEach((el) => {
      const src = state.images[`bg:${el.dataset.bgimg}`];
      const glyph = el.querySelector('[data-text],span');
      if (src && /assets\/uploads\//i.test(src)) return;
      if (src) {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        if (glyph) glyph.style.visibility = 'hidden';
      }
    });
  };

  const applyCrops = () => {
    $$('[data-crop]').forEach((el) => {
      const y = state.crops[el.dataset.crop];
      el.style.objectPosition = y == null ? '' : `center ${num(y, 50)}%`;
    });
  };

  const applyTexts = () => {
    $$('[data-text]').forEach((el) => {
      const t = state.texts[el.dataset.text];
      if (t != null) el.textContent = t;
    });
  };

  const applyBg = () => {
    clearTimeout(bgTimer);
    const v = $('#bg-video');
    const shade = $('#bg-shade');
    if (!v) return;
    let src = state.bg.src || '';
    // 本地壁纸/背景视频不入库，线上请求只会 404；已有首页壁纸时不再叠第二路视频。
    if (document.body.classList.contains('has-home-wallpaper')) src = '';
    if (src && !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname) && /assets\/(bg|wallpapers)\//i.test(src)) src = '';
    const r = document.documentElement.style;
    r.setProperty('--bg-dim', String(num(state.bg.dim, 35) / 100));
    if (!src) {
      v.hidden = true;
      if (shade) shade.hidden = true;
      v.removeAttribute('src');
      if (!document.body.classList.contains('has-home-wallpaper')) {
        v.load();
        document.body.classList.remove('has-bg-video');
      }
      return;
    }
    v.preload = 'none';
    if (v.getAttribute('src') !== src) v.setAttribute('src', src);
    v.hidden = false;
    if (shade) shade.hidden = false;
    document.body.classList.add('has-bg-video');
    v.play().catch(() => {});
  };

  const applyTheme = () => {
    const r = document.documentElement.style;
    const t = state.theme;
    t.cyan ? r.setProperty('--cyan', t.cyan) : r.removeProperty('--cyan');
    t.lime ? r.setProperty('--lime', t.lime) : r.removeProperty('--lime');
    t.red ? r.setProperty('--red', t.red) : r.removeProperty('--red');
    t.icon ? r.setProperty('--icon-scale', String(num(t.icon, 1))) : r.removeProperty('--icon-scale');
    t.tilt == null ? r.removeProperty('--panel-tilt') : r.setProperty('--panel-tilt', `${num(t.tilt, 1)}deg`);
    t.avatar ? r.setProperty('--avatar-size', `${num(t.avatar, 62)}px`) : r.removeProperty('--avatar-size');
    t.playerCard ? r.setProperty('--player-card-scale', String(num(t.playerCard, 100) / 100)) : r.removeProperty('--player-card-scale');
    t.back ? r.setProperty('--back-w', `${num(t.back, 92)}px`) : r.removeProperty('--back-w');
    t.resource ? r.setProperty('--resource-scale', String(num(t.resource, 100) / 100)) : r.removeProperty('--resource-scale');
    t.nickname ? r.setProperty('--nickname-size', `${num(t.nickname, 24)}px`) : r.removeProperty('--nickname-size');
    t.levelNum ? r.setProperty('--level-size', `${num(t.levelNum, 42)}px`) : r.removeProperty('--level-size');
    t.topbarPad == null ? r.removeProperty('--topbar-pad') : r.setProperty('--topbar-pad', `${num(t.topbarPad, 7)}px`);
    /* --stage-h 在 .events-panel 自身声明，须写该元素内联样式才能覆盖 */
    const evp = document.querySelector('.events-panel');
    if (evp) t.evH == null ? evp.style.removeProperty('--stage-h') : evp.style.setProperty('--stage-h', `${num(t.evH, 468)}px`);
    t.evW == null ? r.removeProperty('--events-w') : r.setProperty('--events-w', `${num(t.evW, 0)}px`);
    t.evGap == null ? r.removeProperty('--ev-gap') : r.setProperty('--ev-gap', `${num(t.evGap, 15)}px`);
    t.evSpeed == null ? r.removeProperty('--event-speed') : r.setProperty('--event-speed', String(num(t.evSpeed, 36)));
  };

  const applyAll = (deferVideo = false) => {
    applyPositions(); applyImages(); applyBgImages(); applyCrops(); applyTexts(); applyTheme();
    if (deferVideo && state.bg.src) {
      bgTimer = setTimeout(() => applyBg(), 900);
    } else {
      applyBg();
    }
  };

  fetch('edits.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      Object.assign(state, data);
      ['positions', 'images', 'crops', 'texts', 'theme', 'bg'].forEach((k) => {
        if (!state[k] || typeof state[k] !== 'object') state[k] = {};
      });
      migrateState();
      applyAll(true);
    })
    .catch(() => {});
})();
