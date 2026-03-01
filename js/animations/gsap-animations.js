/**
 * GSAP Timeline Animations
 * Advanced animations for hero sections, cards, and interactive elements
 */

class GSAPAnimations {
  constructor() {
    this.timelines = {};
    this.init();
  }

  init() {
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded. Install via npm: npm install gsap');
      return;
    }

    // Register ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    this.createHeroAnimation();
    this.createCardAnimations();
    this.createScrollAnimations();
    this.createButtonAnimations();
  }

  createHeroAnimation() {
    if (typeof gsap === 'undefined') return;

    this.timelines.hero = gsap.timeline({
      defaults: { duration: 0.8, ease: 'power2.out' }
    });

    // Animate hero title — translate only, NO opacity (CSS handles that)
    this.timelines.hero.from('.hero-title', {
      y: 30,
      duration: 1
    }, 0);

    // Animate hero subtitle — translate only
    this.timelines.hero.from('.hero-subtitle', {
      y: 20,
      duration: 0.8
    }, 0.2);

    // Floating animation
    if (typeof gsap !== 'undefined') {
      gsap.to('.float-element', {
        y: 30,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }
  }

  createCardAnimations() {
    const cards = document.querySelectorAll('.glass-panel, .card-3d-container');

    cards.forEach((card, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.from(card, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        ease: 'power2.out'
      });

      // Hover animation
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -10,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  }

  createScrollAnimations() {
    // Stagger item animations
    const staggerItems = document.querySelectorAll('.stagger-item');

    staggerItems.forEach((item) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: item.parentElement,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.from(item, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out'
      });
    });

    // Parallax effect
    gsap.utils.toArray('[data-parallax]').forEach(element => {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          scrub: 1,
          markers: false
        },
        y: -100,
        duration: 1
      });
    });
  }

  createButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-magnetic');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const tl = gsap.timeline();

        tl.to(button, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.out'
        });

        tl.to(button, {
          scale: 1,
          duration: 0.2,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }

  // Public methods for animations

  animateIn(element, options = {}) {
    const defaults = {
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.1
    };

    return gsap.from(element, { ...defaults, ...options });
  }

  animateOut(element, options = {}) {
    const defaults = {
      duration: 0.6,
      ease: 'power2.in',
      stagger: 0.1
    };

    return gsap.to(element, { ...defaults, ...options });
  }

  pulse(element, options = {}) {
    const defaults = {
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
      scale: 1.1
    };

    return gsap.to(element, { ...defaults, ...options });
  }

  wobble(element, options = {}) {
    const defaults = {
      duration: 0.6,
      ease: 'power1.inOut',
      x: 10,
      repeat: 5,
      yoyo: true
    };

    return gsap.to(element, { ...defaults, ...options });
  }

  rotate(element, options = {}) {
    const defaults = {
      duration: 1,
      ease: 'power2.inOut',
      rotation: 360
    };

    return gsap.to(element, { ...defaults, ...options });
  }

  slideIn(element, options = {}) {
    const defaults = {
      duration: 0.6,
      ease: 'power2.out',
      x: -100,
      opacity: 0
    };

    return gsap.from(element, { ...defaults, ...options });
  }

  fadeIn(element, options = {}) {
    const defaults = {
      duration: 0.6,
      ease: 'power2.out',
      opacity: 0
    };

    return gsap.from(element, { ...defaults, ...options });
  }

  createTimeline(options = {}) {
    const defaults = {
      defaults: { duration: 0.6, ease: 'power2.out' }
    };

    return gsap.timeline({ ...defaults, ...options });
  }
}

// Initialize GSAP animations
document.addEventListener('DOMContentLoaded', () => {
  window.gsapAnimations = new GSAPAnimations();
});

window.GSAPAnimations = GSAPAnimations;
