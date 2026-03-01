/**
 * Smooth Scrolling with Lenis
 * Premium smooth scroll experience
 */

class SmoothScroll {
  constructor() {
    this.lenis = null;
    this.init();
  }

  init() {
    // Check if Lenis is loaded
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not loaded. Install via npm: npm install @studio-freight/lenis');
      return;
    }

    // Initialize Lenis
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });

    // RAF loop
    const raf = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger if available
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      ScrollTrigger.addEventListener('refresh', () => lenis.resize());
      const proxy = { target: document.documentElement, x: 0, y: 0 },
        proxyCallback = (value) => {
          proxy.y = value;
        },
        clamp = gsap.utils.clamp(0, document.documentElement.scrollHeight - window.innerHeight),
        tweenTo = (value) => {
          if (proxy.tween) {
            proxy.tween.kill();
          }
          proxy.tween = gsap.to(proxy, {
            y: value,
            duration: 0.8,
            ease: 'power1.inOut',
            overwrite: auto,
            onUpdate: () => this.lenis.scrollTo(proxy.y, { immediate: true, force: true })
          });
        },
        allowsmoothScroll = () => {
          !proxy.tween && this.lenis.scrollTo(clamp(proxy.y));
        },
        handler = () => proxyCallback(window.scrollY);

      gsap.set(proxy, { y: window.scrollY });
      window.addEventListener('scroll', handler);
      ScrollTrigger.addEventListener('refresh', handler);
      ScrollTrigger.addEventListener('kill', handler);
    }
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
}

// Initialize smooth scrolling
document.addEventListener('DOMContentLoaded', () => {
  window.smoothScroll = new SmoothScroll();
});

window.SmoothScroll = SmoothScroll;
