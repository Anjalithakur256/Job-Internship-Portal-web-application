/* ============================================================
   JOBNEXUS — PAGE ANIMATIONS SYSTEM  (js/page-animations.js)
   Covers: scroll reveals, stat counters, button ripples,
   scroll-progress bar, notification bell, stagger grids.
   Auto-initialises on DOMContentLoaded.
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1.  SCROLL PROGRESS BAR
  ────────────────────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);

    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ──────────────────────────────────────────────────────────
     2.  SCROLL REVEAL  (data-reveal  +  data-stagger)
  ────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('[data-reveal]');
    const staggerEls = document.querySelectorAll('[data-stagger]');

    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything immediately
      revealEls.forEach(el => el.classList.add('revealed'));
      staggerEls.forEach(el => el.classList.add('stagger-active'));
      return;
    }

    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObs.observe(el));

    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('stagger-active');
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    staggerEls.forEach(el => staggerObs.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     3.  AUTO-TAG PAGE ELEMENTS for reveal animations
         (adds data-reveal / data-stagger to existing markup)
  ────────────────────────────────────────────────────────── */
  function autoTagElements() {
    const selectors = {
      'data-reveal':        [
        '.section-header',
        '.browse-hero h1', '.browse-hero p',
        '.filter-sidebar',
        '.page-header',
        '.footer-section',
        '.cta-content'
      ],
      'data-reveal="zoom"': ['.hero-badge', '.cta-content'],
      'data-reveal="left"': ['.hero-content', '.hero-anim-left'],
      'data-reveal="right"':[ '.hero-visual', '.hero-anim-right'],
      'data-stagger':       [
        '.stats-row', '.why-grid', '.steps-grid',
        '.testimonials-grid', '.jobs-carousel',
        '.footer-grid', '.chip-group'
      ]
    };

    Object.entries(selectors).forEach(([attr, list]) => {
      list.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.hasAttribute('data-reveal') && !el.hasAttribute('data-stagger')) {
            const [attrName, attrVal] = attr.includes('=')
              ? attr.replace(/"/g,'').split('=')
              : [attr, ''];
            el.setAttribute(attrName, attrVal);
          }
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     4.  BUTTON RIPPLE EFFECT
  ────────────────────────────────────────────────────────── */
  function initRipple() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest(
        '.btn, .cta-button, .chip, .clear-filters-btn, .auth-btn, .tab, .auth-tab'
      );
      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      ripple.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${x}px; top: ${y}px;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  /* ──────────────────────────────────────────────────────────
     5.  STAT COUNTER ANIMATION
         Targets: .stat-number, .stat-card .value
  ────────────────────────────────────────────────────────── */
  function initCounters() {
    const counterEls = document.querySelectorAll(
      '.stat-card .value, .stat-number, #statTotalJobs, #statTotalUsers, #statTotalApplications'
    );
    if (!counterEls.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        animateCounter(entry.target);
      });
    }, { threshold: 0.5 });

    counterEls.forEach(el => {
      el.classList.add('count-anim');
      obs.observe(el);
    });
  }

  function animateCounter(el) {
    const rawText = el.textContent.trim();
    // Extract numeric part and suffix (e.g. "1.2K", "31K+", "98%")
    const match = rawText.match(/^([\d.]+)([KkMm%+]*)(.*)$/);
    if (!match) return;

    const target   = parseFloat(match[1]);
    const suffix   = match[2] + (match[3] || '');
    const decimals = (match[1].split('.')[1] || '').length;
    const duration = 1400;
    const startTime = performance.now();

    const isFloat = decimals > 0;

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease     = 1 - Math.pow(1 - progress, 3);
      const current  = isFloat
        ? (target * ease).toFixed(decimals)
        : Math.round(target * ease);

      el.textContent = current + suffix;
      el.classList.add('ticking');

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = rawText; // restore original text
        el.classList.remove('ticking');
        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), 400);
      }
    }
    requestAnimationFrame(tick);
  }

  /* ──────────────────────────────────────────────────────────
     6.  NOTIFICATION BELL — add has-unread class if badge > 0
  ────────────────────────────────────────────────────────── */
  function initNotifBell() {
    const bell  = document.querySelector('.notif-bell');
    const badge = document.querySelector('.notif-bell .badge-count');
    if (!bell || !badge) return;

    // MutationObserver watches for badge text changes
    const mo = new MutationObserver(() => {
      const count = parseInt(badge.textContent, 10) || 0;
      bell.classList.toggle('has-unread', count > 0);
    });
    mo.observe(badge, { childList: true, subtree: true, characterData: true });

    // Also check immediately
    const initial = parseInt(badge.textContent, 10) || 0;
    bell.classList.toggle('has-unread', initial > 0);
  }

  /* ──────────────────────────────────────────────────────────
     7.  DASHBOARD PAGE SECTION TRANSITIONS
         Override plain .page-section.active reveal with a
         JS-driven animation re-trigger on each nav click.
  ────────────────────────────────────────────────────────── */
  function initSectionTransitions() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    if (!navItems.length) return;

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = document.getElementById(item.dataset.section);
        if (!target) return;
        // Brief flash to retrigger the CSS animation
        target.style.animation = 'none';
        target.offsetHeight; // reflow
        target.style.animation = '';
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     8.  FORM FIELD INTERACTION ENHANCEMENTS
         Adds a .has-value class when input has content (for future label float)
         and a .focused class while typing.
  ────────────────────────────────────────────────────────── */
  function initFormEffects() {
    document.querySelectorAll(
      '.form-group input, .form-group textarea, .form-group select, ' +
      '.search-bar input, .search-bar select'
    ).forEach(input => {
      const update = () => {
        const fg = input.closest('.form-group') || input.parentElement;
        fg && fg.classList.toggle('has-value', input.value.length > 0);
      };
      input.addEventListener('input',  update);
      input.addEventListener('change', update);
      input.addEventListener('focus',
        () => (input.closest('.form-group') || input.parentElement)?.classList.add('focused')
      );
      input.addEventListener('blur',
        () => (input.closest('.form-group') || input.parentElement)?.classList.remove('focused')
      );
      update(); // initial check
    });
  }

  /* ──────────────────────────────────────────────────────────
     9.  NAVBAR SCROLL SHRINK
  ────────────────────────────────────────────────────────── */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    let prev = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 50);
      // Hide navbar on fast scroll down, show on scroll up
      navbar.style.transform = (y > prev && y > 200) ? 'translateY(-100%)' : '';
      navbar.style.transition = 'transform 0.35s ease';
      prev = y;
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     10. TOPBAR SCROLL HIDE ON DASHBOARD
  ────────────────────────────────────────────────────────── */
  function initTopbarScroll() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    // Dashboards have fixed topbar — just add scrolled class for shadow
    window.addEventListener('scroll', () => {
      topbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     11. STAGGER ENTRANCE FOR DYNAMICALLY ADDED CARDS
         (observe .jobs-grid, .stats-row etc. for child additions)
  ────────────────────────────────────────────────────────── */
  function initDynamicStagger() {
    const grids = document.querySelectorAll(
      '.jobs-grid, .stats-row, .why-grid, .steps-grid, .testimonials-grid'
    );
    grids.forEach(grid => {
      const mo = new MutationObserver(muts => {
        muts.forEach(m => {
          m.addedNodes.forEach((node, i) => {
            if (node.nodeType !== 1) return;
            node.style.opacity      = '0';
            node.style.transform    = 'translateY(18px)';
            node.style.transition   = `opacity 0.4s ${i * 0.06}s ease, transform 0.4s ${i * 0.06}s ease`;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                node.style.opacity   = '1';
                node.style.transform = 'translateY(0)';
              });
            });
          });
        });
      });
      mo.observe(grid, { childList: true });
    });
  }

  /* ──────────────────────────────────────────────────────────
     12. HERO TITLE TYPEWRITER (only on index.html)
  ────────────────────────────────────────────────────────── */
  function initTypewriter() {
    const el = document.querySelector('.hero-title-sub');
    if (!el) return;

    const original = el.textContent;
    el.textContent = '';
    el.style.borderRight = '2px solid #667eea';
    el.style.paddingRight = '2px';
    el.style.display = 'inline';

    let i = 0;
    const speed = 55; // ms per char
    const delay = 800; // start after 800ms

    setTimeout(function type() {
      if (i < original.length) {
        el.textContent += original.charAt(i++);
        setTimeout(type, speed);
      } else {
        // Blink cursor then remove
        let blinks = 0;
        const blink = setInterval(() => {
          el.style.borderRight = blinks % 2 === 0 ? 'none' : '2px solid #667eea';
          if (++blinks >= 6) {
            clearInterval(blink);
            el.style.borderRight = 'none';
          }
        }, 300);
      }
    }, delay);
  }

  /* ──────────────────────────────────────────────────────────
     13. TOPBAR & NAV LOGO CLICK RIPPLE
  ────────────────────────────────────────────────────────── */
  function initLogoClick() {
    document.querySelectorAll('.navbar .logo, .topbar .logo').forEach(logo => {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', function() {
        this.style.transform  = 'scale(0.92)';
        this.style.transition = 'transform 0.15s ease';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     14. SCROLL-TO-TOP BUTTON
  ────────────────────────────────────────────────────────── */
  function initScrollToTop() {
    const btn = document.createElement('button');
    btn.id = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ──────────────────────────────────────────────────────────
     15. NOTIFICATION DROPDOWN TOGGLE
         Enhance existing click listeners to use animation class
  ────────────────────────────────────────────────────────── */
  function initNotifDropdown() {
    const bell     = document.querySelector('.notif-bell');
    const dropdown = document.querySelector('.notif-dropdown');
    if (!bell || !dropdown) return;

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('show');
      dropdown.classList.toggle('show', !isOpen);
    });
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }

  /* ──────────────────────────────────────────────────────────
     INIT — wire everything up
  ────────────────────────────────────────────────────────── */
  function init() {
    initScrollProgress();
    autoTagElements();
    setTimeout(initScrollReveal, 80); // slight delay so CSS is painted
    initRipple();
    initCounters();
    initNotifBell();
    initSectionTransitions();
    initFormEffects();
    initNavbarScroll();
    initTopbarScroll();
    initDynamicStagger();
    initTypewriter();
    initLogoClick();
    initScrollToTop();
    initNotifDropdown();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
