/* 配色对照样板：键盘跳转 + 当前方案高亮。
   刻意不做任何自动动画，避免干扰配色判断。 */
(function () {
  'use strict';

  var schemes = Array.prototype.slice.call(
    document.querySelectorAll('.pc-scheme')
  );
  if (!schemes.length) return;

  var links = Array.prototype.slice.call(
    document.querySelectorAll('.pc-jump a')
  );

  /* 滚动时高亮当前方案对应的跳转项 */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (a) {
          var active = a.getAttribute('href') === '#' + id;
          a.setAttribute('aria-current', active ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    schemes.forEach(function (s) { observer.observe(s); });
  }

  /* 数字键 1/2/3 快速跳到对应方案 */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    var idx = ['1', '2', '3'].indexOf(e.key);
    if (idx === -1 || !schemes[idx]) return;
    schemes[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
