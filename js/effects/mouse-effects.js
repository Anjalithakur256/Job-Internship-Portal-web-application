/**
 * Advanced Mouse Effects System
 * - Custom animated cursor
 * - Mouse-follow light glow
 * - Magnetic buttons
 */

class MouseEffects {
  constructor() {
    this.cursor = null;
    this.cursorFollower = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.followerX = 0;
    this.followerY = 0;
    this.isHoveringButton = false;
    this.init();
  }

  init() {
    this.createCursorElements();
    this.setupEventListeners();
    this.animate();
  }

  createCursorElements() {
    // Main cursor
    this.cursor = document.createElement('div');
    this.cursor.className = 'cursor';
    document.body.appendChild(this.cursor);

    // Cursor follower
    this.cursorFollower = document.createElement('div');
    this.cursorFollower.className = 'cursor-follower';
    document.body.appendChild(this.cursorFollower);

    // Enable custom cursor
    document.body.classList.add('custom-cursor');
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseenter', () => this.onMouseEnter());
    document.addEventListener('mouseleave', () => this.onMouseLeave());

    // Magnetic buttons
    this.setupMagneticButtons();

    // Light glow effect
    this.setupLightGlow();
  }

  onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    // Update cursor position
    this.cursor.style.left = this.mouseX + 'px';
    this.cursor.style.top = this.mouseY + 'px';
  }

  onMouseEnter() {
    this.cursor.style.opacity = '0.8';
    this.cursorFollower.style.opacity = '0.6';
  }

  onMouseLeave() {
    this.cursor.style.opacity = '0';
    this.cursorFollower.style.opacity = '0';
  }

  setupMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.btn-magnetic');

    magneticButtons.forEach(button => {
      button.addEventListener('mousemove', (e) => this.magneticEffect(e));
      button.addEventListener('mouseleave', (e) => this.resetMagneticButton(e));
      button.addEventListener('mouseenter', () => {
        this.cursor.classList.add('active');
      });
      button.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('active');
      });
    });
  }

  magneticEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(e.clientX - buttonCenterX, 2) +
      Math.pow(e.clientY - buttonCenterY, 2)
    );

    const magneticRange = 100;

    if (distance < magneticRange) {
      const angle = Math.atan2(e.clientY - buttonCenterY, e.clientX - buttonCenterX);
      const targetX = buttonCenterX - Math.cos(angle) * 30;
      const targetY = buttonCenterY - Math.sin(angle) * 30;

      button.style.transform = `translate(${targetX - buttonCenterX}px, ${targetY - buttonCenterY}px)`;
    }
  }

  resetMagneticButton(e) {
    const button = e.currentTarget;
    button.style.transform = 'translate(0, 0)';
  }

  setupLightGlow() {
    // Create light glow element
    const lightGlow = document.createElement('div');
    lightGlow.id = 'light-glow';
    lightGlow.style.cssText = `
      position: fixed;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent);
      pointer-events: none;
      z-index: 1;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(lightGlow);

    document.addEventListener('mousemove', (e) => {
      lightGlow.style.left = (e.clientX - 100) + 'px';
      lightGlow.style.top = (e.clientY - 100) + 'px';
      lightGlow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      lightGlow.style.opacity = '0';
    });
  }

  animate() {
    // Smooth follower animation
    this.followerX += (this.mouseX - this.followerX) * 0.15;
    this.followerY += (this.mouseY - this.followerY) * 0.15;

    this.cursorFollower.style.left = this.followerX + 'px';
    this.cursorFollower.style.top = this.followerY + 'px';

    requestAnimationFrame(() => this.animate());
  }
}

// Auto-init disabled
// document.addEventListener('DOMContentLoaded', () => { new MouseEffects(); });

window.MouseEffects = MouseEffects;
