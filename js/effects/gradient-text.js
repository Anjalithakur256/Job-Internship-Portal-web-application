/**
 * Dynamic Gradient Text System
 * Animated gradients for text elements
 */

class DynamicGradientText {
  constructor() {
    this.gradientTexts = [];
    this.init();
  }

  init() {
    this.setupGradientTexts();
  }

  setupGradientTexts() {
    const elements = document.querySelectorAll('.gradient-text');

    elements.forEach((element, index) => {
      const gradientClass = element.className;

      // Determine gradient type
      let gradientColors = ['#00d4ff', '#a78bfa'];

      if (gradientClass.includes('secondary')) {
        gradientColors = ['#ff006e', '#00d4ff'];
      } else if (gradientClass.includes('tertiary')) {
        gradientColors = ['#a78bfa', '#ff006e'];
      }

      // Animate gradient
      this.animateGradientText(element, gradientColors);
    });
  }

  animateGradientText(element, colors) {
    if (typeof gsap === 'undefined') {
      return;
    }

    const text = element;
    const duration = 8;

    gsap.to(text, {
      backgroundPosition: '200% center',
      duration: duration,
      ease: 'none',
      repeat: -1,
      yoyo: false
    });

    // Create gradient animation using CSS
    const gradientKeyframes = `
      @keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;

    // Add keyframes to document
    const style = document.createElement('style');
    style.textContent = gradientKeyframes;
    document.head.appendChild(style);

    element.style.backgroundSize = '200% 200%';
    element.style.animation = `gradientAnimation ${duration}s ease infinite`;
  }

  // Create gradient text element dynamically
  createGradientText(text, options = {}) {
    const defaults = {
      type: 'primary', // 'primary', 'secondary', 'tertiary'
      fontSize: '24px',
      fontWeight: '700'
    };

    const config = { ...defaults, ...options };
    const element = document.createElement('span');

    element.className = `gradient-text ${config.type !== 'primary' ? config.type : ''}`;
    element.textContent = text;
    element.style.fontSize = config.fontSize;
    element.style.fontWeight = config.fontWeight;

    return element;
  }

  // Apply gradient text style to existing element
  applyGradientStyle(element, type = 'primary') {
    element.classList.add('gradient-text');

    if (type !== 'primary') {
      element.classList.add(type);
    }

    this.animateGradientText(element, this.getGradientColors(type));
  }

  // Get gradient colors by type
  getGradientColors(type) {
    const colorMap = {
      primary: ['#00d4ff', '#a78bfa'],
      secondary: ['#ff006e', '#00d4ff'],
      tertiary: ['#a78bfa', '#ff006e']
    };

    return colorMap[type] || colorMap.primary;
  }
}

// Initialize gradient text
document.addEventListener('DOMContentLoaded', () => {
  window.gradientText = new DynamicGradientText();
});

window.DynamicGradientText = DynamicGradientText;
