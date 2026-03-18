(() => {
  'use strict';

  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || 'ontouchstart' in window
    || navigator.maxTouchPoints > 0;

  if (!isTouchDevice) return;

  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');

  const isMenuOpen = () => !!(navMenu && navMenu.classList.contains('open'));

  const enforceSinglePageScroll = () => {
    if (isMenuOpen()) {
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = '';
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.overflowX = 'hidden';

    if (navBackdrop && !navBackdrop.classList.contains('show')) {
      navBackdrop.style.pointerEvents = 'none';
    }

    if (document.documentElement.classList.contains('lenis-stopped')) {
      document.documentElement.classList.remove('lenis-stopped');
    }
  };

  const onReady = () => {
    enforceSinglePageScroll();

    // If smooth scroll engine is present on touch devices, disable it for stable native scrolling.
    if (window.smoothScroll && typeof window.smoothScroll.destroy === 'function') {
      try { window.smoothScroll.destroy(); } catch (_) {}
      window.smoothScroll = null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }

  window.addEventListener('pageshow', enforceSinglePageScroll, { passive: true });
  window.addEventListener('focus', enforceSinglePageScroll, { passive: true });
  window.addEventListener('resize', enforceSinglePageScroll, { passive: true });
  window.addEventListener('orientationchange', enforceSinglePageScroll, { passive: true });
  document.addEventListener('visibilitychange', enforceSinglePageScroll, { passive: true });

  if (navMenu) {
    const navObserver = new MutationObserver(enforceSinglePageScroll);
    navObserver.observe(navMenu, { attributes: true, attributeFilter: ['class'] });
  }

  const bodyObserver = new MutationObserver(enforceSinglePageScroll);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
})();
