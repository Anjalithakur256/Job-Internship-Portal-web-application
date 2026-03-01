/**
 * Premium UI Master Initialization
 * Initializes all premium effects and animations
 */

class PremiumUI {
  constructor() {
    this.systems = {};
    this.init();
  }

  init() {
    console.log('🚀 Initializing Premium UI System...');

    // Loading screen disabled — shows over content and blocks page
    this.systems.loadingScreen = null;

    // Custom cursor disabled
    this.systems.mouseEffects = null;

    // Initialize smooth scrolling
    this.systems.smoothScroll = window.SmoothScroll ? new window.SmoothScroll() : null;

    // Initialize 3D tilt cards
    this.systems.card3DTilt = window.Card3DTilt ? new window.Card3DTilt() : null;

    // Initialize glass panels
    this.systems.glassPanels = window.GlasPanels ? new window.GlasPanels() : null;

    // Initialize gradient text
    this.systems.gradientText = window.DynamicGradientText ? new window.DynamicGradientText() : null;

    // Initialize GSAP animations
    this.systems.gsapAnimations = window.GSAPAnimations ? new window.GSAPAnimations() : null;

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    console.log('✅ Premium UI System Initialized');
    console.log('📊 Active Systems:', Object.keys(this.systems).filter(k => this.systems[k] !== null));
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + S: Toggle smooth scroll
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (this.systems.smoothScroll?.lenis) {
          this.systems.smoothScroll.lenis.isSmooth ? 
            this.systems.smoothScroll.stop() : 
            this.systems.smoothScroll.start();
        }
      }

      // Alt + L: Show/Hide loading screen (debug)
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        if (this.systems.loadingScreen) {
          this.systems.loadingScreen.isVisible ?
            this.systems.loadingScreen.hide() :
            this.systems.loadingScreen.show();
        }
      }

      // Alt + G: Toggle GUI (if available)
      if (e.altKey && e.key === 'g') {
        e.preventDefault();
        console.log('GUI Toggle - implement as needed');
      }
    });
  }

  setupPerformanceMonitoring() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Log slow operations
            console.warn(`⚠️ Slow operation: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
      // Performance monitoring not supported
    }
  }

  // Public API methods

  getSystem(name) {
    return this.systems[name] || null;
  }

  getAllSystems() {
    return { ...this.systems };
  }

  // Animation helpers

  animateElement(element, animation = 'fadeIn', options = {}) {
    if (this.systems.gsapAnimations) {
      return this.systems.gsapAnimations[animation](element, options);
    }
    return null;
  }

  scrollToElement(element, options = {}) {
    if (this.systems.smoothScroll) {
      this.systems.smoothScroll.scrollToElement(element, options);
    }
  }

  // Utility methods

  loadingScreenProgress(percent) {
    if (this.systems.loadingScreen) {
      this.systems.loadingScreen.setProgress(percent);
    }
  }

  hideLoadingScreen() {
    if (this.systems.loadingScreen) {
      this.systems.loadingScreen.hide();
    }
  }

  showLoadingScreen() {
    if (this.systems.loadingScreen) {
      this.systems.loadingScreen.show();
    }
  }
}

// Initialize Premium UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.PremiumUI = new PremiumUI();
});

// Also store class for later instantiation
window.PremiumUIClass = PremiumUI;
