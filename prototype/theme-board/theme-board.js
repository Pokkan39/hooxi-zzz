// HOOXI Theme Board — 单页 6 主题切换
// 只切 <html data-theme>，DOM 不动；键盘 1-6 快捷切换；localStorage 持久化。

(() => {
  const THEMES = [
    'warehouse',
    'arcade',
    'slate',
    'ink-wash',
    'archive-paper',
    'film-print',
  ];
  const LBL = {
    'warehouse':     '01 · 废仓 · WAREHOUSE',
    'arcade':        '02 · 街角街机 · ARCADE',
    'slate':         '03 · 冷雾板岩 · SLATE',
    'ink-wash':      '04 · 墨淡米色 · INK WASH',
    'archive-paper': '05 · 档案纸 · ARCHIVE PAPER',
    'film-print':    '06 · 胶片印样 · FILM PRINT',
  };
  const KEY = 'hooxi-theme-board-theme';

  const html = document.documentElement;
  const btns = [...document.querySelectorAll('.tb-btn')];
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function apply(name, silent) {
    if (!THEMES.includes(name)) return;
    html.setAttribute('data-theme', name);
    btns.forEach(b => {
      const on = b.dataset.t === name;
      b.setAttribute('aria-selected', String(on));
    });
    try { localStorage.setItem(KEY, name); } catch (_) {}
    if (!silent) showToast(LBL[name]);
  }

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1600);
  }

  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.t, false)));

  window.addEventListener('keydown', e => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= THEMES.length) apply(THEMES[n - 1], false);
  });

  // 初始：localStorage 优先，其次 URL hash（便于剪贴板直接分享视角）
  const fromHash = (location.hash || '').replace(/^#/, '');
  let initial = 'warehouse';
  if (THEMES.includes(fromHash)) initial = fromHash;
  else { try { const v = localStorage.getItem(KEY); if (THEMES.includes(v)) initial = v; } catch (_) {} }
  apply(initial, true);
})();
