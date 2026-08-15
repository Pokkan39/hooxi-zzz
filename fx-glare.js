/* fx-glare.js — Mouse-follow glare for .fx-glare-target elements
   CSS in redesign-core-v3.css provides the ::after layer and .is-glare-active class */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  document.addEventListener('mousemove', e => {
    const el = e.target.closest('.fx-glare-target');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%';
    el.style.setProperty('--glare-x', x);
    el.style.setProperty('--glare-y', y);
    el.classList.add('is-glare-active');
  });

  document.addEventListener('mouseleave', e => {
    const el = e.target.closest('.fx-glare-target');
    if (el) el.classList.remove('is-glare-active');
  }, true);

  // use mouseover/mouseout for clean enter/leave on nested elements
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('.fx-glare-target');
    if (!el) return;
    if (!el.contains(e.relatedTarget)) el.classList.remove('is-glare-active');
  });
})();
