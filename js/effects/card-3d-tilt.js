/**
 * 3D Tilt Card Effect
 * Creates perspective-based tilt effect on job cards
 */

class Card3DTilt {
  constructor() {
    this.cards = [];
    this.init();
  }

  init() {
    const cardContainers = document.querySelectorAll('.card-3d-container');
    cardContainers.forEach(container => {
      this.cards.push(new TiltCard(container));
    });
  }
}

class TiltCard {
  constructor(element) {
    this.element = element;
    this.card = element.querySelector('.card-3d');
    this.innerContent = element.querySelector('.card-3d-content');
    this.light = element.querySelector('.card-3d-light');

    this.x = 0;
    this.y = 0;
    this.rx = 0;
    this.ry = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
  }

  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    this.x = e.clientX - rect.left;
    this.y = e.clientY - rect.top;

    // Calculate rotation based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((this.y - centerY) / centerY) * 10;
    const rotateY = ((this.x - centerX) / centerX) * -10;

    this.rx += (rotateX - this.rx) * 0.1;
    this.ry += (rotateY - this.ry) * 0.1;

    this.updateTransform();

    // Update light position
    const lightX = (this.x / rect.width) * 100;
    const lightY = (this.y / rect.height) * 100;
    this.light.style.left = lightX + '%';
    this.light.style.top = lightY + '%';
  }

  handleMouseLeave() {
    this.rx *= 0.9;
    this.ry *= 0.9;

    if (Math.abs(this.rx) < 0.1) this.rx = 0;
    if (Math.abs(this.ry) < 0.1) this.ry = 0;

    this.updateTransform();

    if (this.rx !== 0 || this.ry !== 0) {
      requestAnimationFrame(() => this.handleMouseLeave());
    }
  }

  updateTransform() {
    this.card.style.transform = `
      perspective(1200px)
      rotateX(${this.rx}deg)
      rotateY(${this.ry}deg)
      translateZ(0)
    `;

    this.innerContent.style.transform = `translateZ(50px)`;
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new Card3DTilt();
});

window.Card3DTilt = Card3DTilt;
