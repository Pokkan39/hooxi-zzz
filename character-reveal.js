/**
 * Character Reveal Animation — 触发器
 * 在角色详情页加载后启动入场动画
 */
(function () {
  'use strict';

  // 检查用户是否偏好减弱动效
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // 直接显示所有内容，不播放动画
    return;
  }

  var screen = document.querySelector('.character-screen');
  var portrait = document.getElementById('characterHeroPortrait');

  if (!screen || !portrait) return;

  // 等待立绘加载完成后启动动画
  function startReveal() {
    // 添加触发类，启动 CSS 动画
    screen.classList.add('reveal-active');
  }

  // 立绘已缓存或加载完成
  if (portrait.complete && portrait.naturalHeight > 0) {
    // 延迟 100ms 启动，确保 DOM 完全渲染
    setTimeout(startReveal, 100);
  } else {
    // 监听加载完成事件
    portrait.addEventListener('load', function () {
      setTimeout(startReveal, 100);
    });

    // 容错：如果 3 秒后仍未加载完成，强制启动动画
    setTimeout(function () {
      if (!screen.classList.contains('reveal-active')) {
        startReveal();
      }
    }, 3000);
  }
})();
