/**
 * Smooth Scrolling with Lenis
 * Premium smooth scroll experience
 */

class SmoothScroll {
  constructor() {
    this.lenis = null;
    this.rafId = null;
    this.isEnabled = false;
    this.reduceMotionMedia = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.init();
  }

  shouldEnableLenis() {
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const prefersReducedMotion = this.reduceMotionMedia ? this.reduceMotionMedia.matches : false;
    return !isTouchDevice && !prefersReducedMotion;
  }

  init() {
    // Check if Lenis is loaded
    if (typeof Lenis === 'undefined') {
      return;
    }

    if (!this.shouldEnableLenis()) {
      this.destroy();
      return;
    }

    if (this.lenis) return;

    // Initialize Lenis
    this.lenis = new Lenis({
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });
    this.isEnabled = true;

    // RAF loop
    const raf = (time) => {
      if (!this.lenis) return;
      this.lenis.raf(time);
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger if available
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      this.lenis.on('scroll', ScrollTrigger.update);
      ScrollTrigger.addEventListener('refresh', () => this.lenis?.resize?.());
    }

    this.handleResize = () => this.lenis?.resize?.();
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  // Public methods

  scrollTo(target, options = {}) {
    if (this.lenis) {
      this.lenis.scrollTo(target, {
        duration: options.duration || 1.2,
        easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
        ...options
      });
    }
  }

  scrollToElement(element, options = {}) {
    if (this.lenis && element) {
      this.lenis.scrollTo(element, options);
    }
  }

  stop() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  destroy() {
    this.isEnabled = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
      this.handleResize = null;
    }
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}

// Initialize smooth scrolling
document.addEventListener('DOMContentLoaded', () => {
  if (!window.smoothScroll) {
    window.smoothScroll = new SmoothScroll();
  }
});

window.SmoothScroll = SmoothScroll;
