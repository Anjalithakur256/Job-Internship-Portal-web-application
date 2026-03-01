/**
 * Glass Panels System
 * Blur glass floating panels with animations
 */

class GlasPanels {
  constructor() {
    this.panels = [];
    this.init();
  }

  init() {
    this.setupPanels();
    this.setupInteractions();
  }

  setupPanels() {
    const panelElements = document.querySelectorAll('.glass-panel');

    panelElements.forEach((panel, index) => {
      // Add floating animation
      panel.style.animation = `float 6s ease-in-out infinite`;
      panel.style.animationDelay = `${index * 0.5}s`;

      this.panels.push({
        element: panel,
        index: index
      });
    });
  }

  setupInteractions() {
    this.panels.forEach(panelData => {
      const panel = panelData.element;

      // Hover effects
      panel.addEventListener('mouseenter', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(panel, {
            duration: 0.3,
            boxShadow: '0 40px 100px rgba(0, 212, 255, 0.3), 0 0 30px rgba(0, 212, 255, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            ease: 'power2.out'
          });
        }
      });

      panel.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(panel, {
            duration: 0.3,
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            ease: 'power2.out'
          });
        }
      });

      // Add scroll trigger animation
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.from(panel, {
          scrollTrigger: {
            trigger: panel,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          },
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    });
  }

  // Create new glass panel dynamically
  createPanel(options = {}) {
    const defaults = {
      title: 'Untitled',
      content: '',
      className: 'glass-panel'
    };

    const config = { ...defaults, ...options };
    const panelElement = document.createElement('div');
    panelElement.className = config.className;
    panelElement.innerHTML = `
      <h3 style="margin-top: 0; color: #00d4ff; font-size: 18px; font-weight: 600;">
        ${config.title}
      </h3>
      <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
        ${config.content}
      </p>
    `;

    return panelElement;
  }

  addPanel(element, container) {
    if (container) {
      container.appendChild(element);
      this.setupInteractions();
    }
  }
}

// Initialize glass panels
document.addEventListener('DOMContentLoaded', () => {
  window.glassPanels = new GlasPanels();
});

window.GlasPanels = GlasPanels;
