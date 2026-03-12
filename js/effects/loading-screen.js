/**
 * Animated Loading Screen
 * Premium loading experience with progress tracking
 */

class LoadingScreen {
  constructor() {
    this.screen = null;
    this.isVisible = true;
    this.progress = 0;
    this.init();
  }

  init() {
    this.createLoadingScreen();
    this.setupEventListeners();

    // Auto-hide loading screen after page loads
    window.addEventListener('load', () => {
      this.hide();
    });

    // Fallback: hide after 3 seconds
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  createLoadingScreen() {
    this.screen = document.createElement('div');
    this.screen.className = 'loading-screen';
    this.screen.innerHTML = `
      <img src="/Public/Job%20Nexus%20logo.png" alt="JobNexus" style="height:72px;width:auto;object-fit:contain;margin-bottom:16px">
      <div class="loading-spinner"></div>
      <div class="loading-progress"></div>
    `;
    document.body.insertBefore(this.screen, document.body.firstChild);
  }

  hide() {
    if (this.isVisible && this.screen) {
      // Animate out
      if (typeof gsap !== 'undefined') {
        gsap.to(this.screen, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            this.screen.classList.add('hidden');
            this.isVisible = false;
          }
        });
      } else {
        this.screen.classList.add('hidden');
        this.isVisible = false;
      }
    }
  }

  show() {
    if (!this.isVisible && this.screen) {
      this.screen.classList.remove('hidden');
      this.isVisible = true;
    }
  }

  setProgress(percent) {
    this.progress = Math.min(percent, 100);
    if (this.screen) {
      const progressBar = this.screen.querySelector('.loading-progress::after');
      if (progressBar) {
        progressBar.style.width = this.progress + '%';
      }
    }
  }

  incrementProgress(amount = 10) {
    this.setProgress(this.progress + amount);
  }
}

// Initialize loading screen
document.addEventListener('DOMContentLoaded', () => {
  window.loadingScreen = new LoadingScreen();
});

window.LoadingScreen = LoadingScreen;
