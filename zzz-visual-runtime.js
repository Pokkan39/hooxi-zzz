const zzzVisualSearchParams = new URLSearchParams(window.location.search);
const zzzVisualExactV2 = window.location.search === '?fx=v2'
  && zzzVisualSearchParams.get('fx') === 'v2'
  && [...zzzVisualSearchParams.keys()].length === 1;

(function () {
  'use strict';

  if (!zzzVisualExactV2 || window.__zzzVisualRuntimeV2) return;

  const root = document.documentElement;
  const state = {
    version: 'v2',
    reducedMotion: false,
    finePointer: false,
    motionActive: false,
    rafId: 0,
    progressRafId: 0,
    pointerRafId: 0,
    rafCount: 0,
    pageHidden: document.visibilityState === 'hidden',
  };
  let failClosed = () => {
    root.removeAttribute('data-zzz-fx');
    try { delete window.__zzzVisualRuntimeV2; } catch (ignored) { /* fail closed */ }
  };

  try {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const pendingPointer = new Map();
    const roleSpecs = [
      ['.topbar, .archive-topbar', 'topbar'],
      ['.hero, .archive-hero', 'hero'],
      ['.section-head', 'section-head'],
      ['.archive-sources, [data-source-section]', 'source'],
      ['footer, .archive-footer', 'footer'],
      ['.stories-workbench-bar, .agent-workbench', 'stories-workbench'],
      ['.character-screen, .character-module', 'character'],
    ];
    let progress = null;
    let progressOwnsScroll = false;
    let revealObserver = null;
    let pageHidden = document.visibilityState === 'hidden';

    const syncMediaState = () => {
      state.reducedMotion = reduceQuery.matches;
      state.finePointer = finePointerQuery.matches;
      state.motionActive = !state.reducedMotion && state.finePointer && !pageHidden;
      if (!state.motionActive) {
        pendingPointer.clear();
        if (state.pointerRafId) {
          window.cancelAnimationFrame(state.pointerRafId);
          state.pointerRafId = 0;
        }
      }
    };

    const cancelOwnRaf = () => {
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      if (state.progressRafId) window.cancelAnimationFrame(state.progressRafId);
      if (state.pointerRafId) window.cancelAnimationFrame(state.pointerRafId);
      state.rafId = 0;
      state.progressRafId = 0;
      state.pointerRafId = 0;
      pendingPointer.clear();
    };
    failClosed = () => {
      cancelOwnRaf();
      root.removeAttribute('data-zzz-fx');
      try { delete window.__zzzVisualRuntimeV2; } catch (ignored) { /* fail closed */ }
    };

    const setPageHidden = hidden => {
      pageHidden = hidden;
      state.pageHidden = hidden;
      root.toggleAttribute('data-zzz-page-hidden', hidden);
      if (hidden) cancelOwnRaf();
      syncMediaState();
      if (!hidden && progressOwnsScroll) scheduleProgress();
    };

    const setVisible = element => {
      if (!element.hasAttribute('data-zzz-vfx-visible')) {
        element.setAttribute('data-zzz-vfx-visible', 'true');
      }
      revealObserver?.unobserve(element);
    };

    const decorate = element => {
      if (!(element instanceof Element)) return;
      const role = element.getAttribute('data-zzz-vfx-role');
      if (!role) return;
      if (!element.querySelector(':scope > .zzz-vfx-frame')) {
        const frame = document.createElement('span');
        frame.className = 'zzz-vfx-frame';
        frame.setAttribute('aria-hidden', 'true');
        element.appendChild(frame);
      }
      if (state.reducedMotion || !('IntersectionObserver' in window)) setVisible(element);
      else revealObserver?.observe(element);
      if (state.motionActive && (role === 'section-head' || role === 'source')) bindSpotlight(element);
    };

    const assignRoles = scope => {
      roleSpecs.forEach(([selector, role]) => {
        if (scope instanceof Element && scope.matches(selector) && !scope.hasAttribute('data-zzz-vfx-role')) {
          scope.setAttribute('data-zzz-vfx-role', role);
        }
        scope.querySelectorAll?.(selector).forEach(element => {
          if (!element.hasAttribute('data-zzz-vfx-role')) element.setAttribute('data-zzz-vfx-role', role);
        });
      });
    };

    const decorateScope = scope => {
      if (!(scope instanceof Element) && scope !== document) return;
      assignRoles(scope);
      if (scope instanceof Element && scope.hasAttribute('data-zzz-vfx-role')) decorate(scope);
      scope.querySelectorAll?.('[data-zzz-vfx-role]').forEach(decorate);
    };

    const bindSpotlight = element => {
      if (element.dataset.zzzVfxPointerBound === 'true') return;
      element.dataset.zzzVfxPointerBound = 'true';
      element.addEventListener('pointermove', event => {
        if (!state.motionActive || pageHidden) return;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pendingPointer.set(element, {
          x: `${((event.clientX - rect.left) / rect.width * 100).toFixed(2)}%`,
          y: `${((event.clientY - rect.top) / rect.height * 100).toFixed(2)}%`,
        });
        if (!state.pointerRafId) state.pointerRafId = window.requestAnimationFrame(paintPointer);
      }, { passive: true });
      element.addEventListener('pointerleave', () => {
        pendingPointer.delete(element);
        element.style.removeProperty('--zzz-vfx-x');
        element.style.removeProperty('--zzz-vfx-y');
      }, { passive: true });
    };

    const paintPointer = () => {
      state.pointerRafId = 0;
      if (!state.motionActive || pageHidden) return;
      pendingPointer.forEach((position, element) => {
        element.style.setProperty('--zzz-vfx-x', position.x);
        element.style.setProperty('--zzz-vfx-y', position.y);
      });
      pendingPointer.clear();
    };

    const readProgress = () => {
      if (!progress || pageHidden) return;
      const documentElement = document.documentElement;
      const scrollRange = Math.max(documentElement.scrollHeight - window.innerHeight, 0);
      const short = scrollRange <= 0;
      progress.toggleAttribute('data-zzz-vfx-short', short);
      if (short) {
        progress.style.setProperty('--zzz-vfx-progress', '0');
        return;
      }
      const top = Math.max(0, window.scrollY || documentElement.scrollTop || 0);
      progress.style.setProperty('--zzz-vfx-progress', String(Math.min(1, top / scrollRange).toFixed(4)));
    };

    const scheduleProgress = () => {
      if (!progress || pageHidden || !progressOwnsScroll || state.reducedMotion || state.progressRafId) return;
      state.progressRafId = window.requestAnimationFrame(() => {
        state.progressRafId = 0;
        readProgress();
      });
    };

    const initProgress = () => {
      progress = document.createElement('div');
      progress.className = 'zzz-vfx-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);
      const pagePath = window.location.pathname.split('/').pop() || 'index.html';
      const reusesExistingProgress = pagePath === 'index.html' || pagePath === 'character.html';
      progressOwnsScroll = !reusesExistingProgress;
      readProgress();
      if (progressOwnsScroll && !state.reducedMotion) {
        window.addEventListener('scroll', scheduleProgress, { passive: true });
        window.addEventListener('resize', scheduleProgress, { passive: true });
        scheduleProgress();
      }
    };

    const boot = () => {
      if (state.booted) return;
      try {
        state.booted = true;
        syncMediaState();
        if ('IntersectionObserver' in window && !state.reducedMotion) {
          revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting || entry.intersectionRatio > 0) setVisible(entry.target);
            });
          }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        }
        decorateScope(document);
        initProgress();

        if ('MutationObserver' in window && document.body) {
          const mutationObserver = new MutationObserver(records => {
            try {
              records.forEach(record => record.addedNodes.forEach(node => {
                if (node instanceof Element) decorateScope(node);
              }));
            } catch (error) {
              failClosed();
            }
          });
          mutationObserver.observe(document.body, { childList: true, subtree: true });
          state.mutationObserver = mutationObserver;
        }
      } catch (error) {
        failClosed();
      }
    };

    const handleMotionChange = () => {
      syncMediaState();
      if (state.reducedMotion) {
        document.querySelectorAll('[data-zzz-vfx-role]').forEach(setVisible);
        cancelOwnRaf();
      } else if (revealObserver) {
        document.querySelectorAll('[data-zzz-vfx-role]:not([data-zzz-vfx-visible])').forEach(element => revealObserver.observe(element));
      }
      if (state.motionActive) {
        document.querySelectorAll('[data-zzz-vfx-role="section-head"], [data-zzz-vfx-role="source"]').forEach(bindSpotlight);
      }
    };

    if (typeof reduceQuery.addEventListener === 'function') reduceQuery.addEventListener('change', handleMotionChange);
    else if (typeof reduceQuery.addListener === 'function') reduceQuery.addListener(handleMotionChange);
    if (typeof finePointerQuery.addEventListener === 'function') finePointerQuery.addEventListener('change', handleMotionChange);
    else if (typeof finePointerQuery.addListener === 'function') finePointerQuery.addListener(handleMotionChange);
    document.addEventListener('visibilitychange', () => setPageHidden(document.visibilityState === 'hidden'));
    window.addEventListener('pagehide', () => setPageHidden(true), { once: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();

    state.boot = boot;
    state.cancel = cancelOwnRaf;
    window.__zzzVisualRuntimeV2 = state;
    root.dataset.zzzFx = 'v2';
  } catch (error) {
    failClosed();
  }
}());
