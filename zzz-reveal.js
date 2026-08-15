/**
 * Phase B — Scroll Reveal (B1) + Card 3D Tilt (B2)
 * No external dependencies; uses IntersectionObserver + vanilla mousemove.
 */
(function () {
  'use strict';

  // ─── B1: Scroll Reveal via IntersectionObserver ───────────────────────────
  var REVEAL_EASE = 'cubic-bezier(0.22,1,0.36,1)';
  var REVEAL_DURATION = '0.55s';
  var CHILD_DELAY_STEP = 60; // ms per child
  var CHILD_DELAY_MAX = 300; // ms cap

  // Selectors for sections that participate in reveal
  var SECTION_SEL = [
    '[data-home-act]:not([data-home-act="marquee"])',
    '[data-ow-section]'
  ].join(',');

  // Child items inside sections that get staggered reveal
  var CHILD_SEL = [
    '.path-card',
    '.home-faction-channel',
    '.home-reel-card',
    '.home-agent-card',
    '.ow-roster-item',
    '.about-column',
    '.archive-reel-links a'
  ].join(',');

  function initReveal() {
    var sections = document.querySelectorAll(SECTION_SEL);
    if (!sections.length) return;

    // Mark sections hidden initially (CSS class handles opacity/translateY)
    sections.forEach(function (sec) {
      // If section is already above viewport (user scrolled past), show immediately
      var rect = sec.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top + rect.height * 0.15 < 0) {
        sec.classList.add('zzz-revealed');
        return;
      }
      sec.classList.add('zzz-reveal-pending');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var sec = entry.target;
        sec.classList.remove('zzz-reveal-pending');
        sec.classList.add('zzz-revealing');

        // Stagger children
        var children = sec.querySelectorAll(CHILD_SEL);
        children.forEach(function (child, i) {
          var delay = Math.min(i * CHILD_DELAY_STEP, CHILD_DELAY_MAX);
          child.style.transitionDelay = delay + 'ms';
          child.classList.add('zzz-child-reveal');
        });

        // After animation, clean up
        setTimeout(function () {
          sec.classList.remove('zzz-revealing');
          sec.classList.add('zzz-revealed');
          children.forEach(function (child) {
            child.style.transitionDelay = '';
            child.classList.remove('zzz-child-reveal');
            child.classList.add('zzz-child-revealed');
          });
        }, 550 + CHILD_DELAY_MAX);

        observer.unobserve(sec);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    sections.forEach(function (sec) {
      if (!sec.classList.contains('zzz-reveal-pending')) return;
      observer.observe(sec);
    });
  }

  // ─── B2: Card 3D Mouse Tilt ──────────────────────────────────────────────
  var TILT_MAX = 6; // degrees
  var PERSPECTIVE = 600; // px

  var CARD_SEL = [
    '.path-card',
    '.home-faction-channel',
    '.home-reel-card',
    '.home-agent-card',
    '.ow-roster-item'
  ].join(',');

  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  function initTilt() {
    if (isTouchDevice()) return;
    // Prefer media query for hover capability
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

    document.addEventListener('mousemove', handleTiltMove, { passive: true });
    document.addEventListener('mouseleave', handleTiltLeave, { passive: true, capture: true });
  }

  var currentTiltCard = null;

  function handleTiltMove(e) {
    var card = e.target.closest(CARD_SEL);
    if (!card) {
      if (currentTiltCard) resetTilt(currentTiltCard);
      return;
    }

    currentTiltCard = card;
    var rect = card.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var cx = rect.width / 2;
    var cy = rect.height / 2;

    // Normalized offset: -1 to 1
    var nx = (x - cx) / cx;
    var ny = (y - cy) / cy;

    var rotateY = nx * TILT_MAX;
    var rotateX = -ny * TILT_MAX;

    card.style.perspective = PERSPECTIVE + 'px';
    card.style.transform = 'perspective(' + PERSPECTIVE + 'px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
    card.style.transition = 'transform 0.15s ease-out';

    // Gloss layer via CSS custom properties
    var glowX = (x / rect.width * 100).toFixed(1);
    var glowY = (y / rect.height * 100).toFixed(1);
    card.style.setProperty('--tilt-glow-x', glowX + '%');
    card.style.setProperty('--tilt-glow-y', glowY + '%');
    card.classList.add('zzz-tilting');
  }

  function handleTiltLeave(e) {
    var card = e.target.closest ? e.target.closest(CARD_SEL) : null;
    if (card) resetTilt(card);
    if (currentTiltCard && currentTiltCard !== card) resetTilt(currentTiltCard);
    currentTiltCard = null;
  }

  function resetTilt(card) {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s cubic-bezier(0.15,0,0.35,1)';
    card.classList.remove('zzz-tilting');
    // Clean up after transition
    setTimeout(function () {
      if (!card.classList.contains('zzz-tilting')) {
        card.style.perspective = '';
        card.style.transition = '';
      }
    }, 420);
  }

  // Also handle mouseout from card directly
  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest ? e.target.closest(CARD_SEL) : null;
    if (card && e.relatedTarget && !card.contains(e.relatedTarget)) {
      resetTilt(card);
      if (currentTiltCard === card) currentTiltCard = null;
    }
  }, { passive: true });

  // ─── Init ──────────────────────────────────────────────────────────────────
  function boot() {
    initReveal();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
