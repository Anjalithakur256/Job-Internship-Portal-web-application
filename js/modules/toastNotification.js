/**
 * Toast Notification Module
 * Displays temporary toast notifications with animations
 */

class ToastNotification {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.initContainer();
  }

  /**
   * Initialize toast container
   */
  initContainer() {
    if (document.getElementById('toastContainer')) return;

    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    this.container = container;
  }

  /**
   * Show toast notification
   */
  show(message, type = 'info', duration = 3000) {
    const toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration
    };

    this.toasts.push(toast);
    this.render(toast);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }

    return toast.id;
  }

  /**
   * Show success toast
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error toast
   */
  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning toast
   */
  warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info toast
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Show loading toast (persistent until removed)
   */
  loading(message = 'Loading...') {
    return this.show(message, 'loading', 0);
  }

  /**
   * Render toast to DOM
   */
  render(toast) {
    const toastEl = document.createElement('div');
    toastEl.id = toast.id;
    toastEl.className = `toast toast-${toast.type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      loading: '⟳'
    };

    toastEl.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon ${toast.type === 'loading' ? 'spinner' : ''}">
          ${icons[toast.type]}
        </span>
        <span class="toast-message">${toast.message}</span>
      </div>
      ${toast.duration > 0 ? `<div class="toast-progress" style="animation: toastProgress ${toast.duration}ms linear forwards;"></div>` : ''}
    `;

    this.container.appendChild(toastEl);

    // Trigger animation
    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);
  }

  /**
   * Remove toast
   */
  remove(toastId) {
    const toastEl = document.getElementById(toastId);
    if (toastEl) {
      toastEl.classList.remove('show');
      
      setTimeout(() => {
        toastEl.remove();
        this.toasts = this.toasts.filter(t => t.id !== toastId);
      }, 300);
    }
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts.forEach(toast => {
      const toastEl = document.getElementById(toast.id);
      if (toastEl) {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
      }
    });
    this.toasts = [];
  }

  /**
   * Show toast with action button
   */
  showWithAction(message, type, actionText, actionCallback, duration = 5000) {
    const toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
      hasAction: true
    };

    this.toasts.push(toast);

    const toastEl = document.createElement('div');
    toastEl.id = toast.id;
    toastEl.className = `toast toast-${toast.type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      loading: '⟳'
    };

    toastEl.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon ${toast.type === 'loading' ? 'spinner' : ''}">
          ${icons[toast.type]}
        </span>
        <span class="toast-message">${message}</span>
        <button class="toast-action-btn">${actionText}</button>
      </div>
      ${duration > 0 ? `<div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>` : ''}
    `;

    toastEl.querySelector('.toast-action-btn').addEventListener('click', () => {
      actionCallback();
      this.remove(toast.id);
    });

    this.container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }

    return toast.id;
  }

  /**
   * Show promise-based toast (for async operations)
   */
  async promise(promise, messages) {
    // messages = { loading: '...', success: '...', error: '...' }
    const loadingId = this.loading(messages.loading);

    try {
      const result = await promise;
      this.remove(loadingId);
      this.success(messages.success);
      return result;
    } catch (error) {
      this.remove(loadingId);
      this.error(messages.error);
      throw error;
    }
  }

  /**
   * Show confirmation toast with undo action
   */
  showWithUndo(message, undoCallback, undoTime = 5000) {
    return this.showWithAction(
      message,
      'success',
      'Undo',
      undoCallback,
      undoTime
    );
  }

  /**
   * Create custom toast (advanced)
   */
  custom(options) {
    // options = { message, type, duration, customClass, onClose }
    const toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      customClass: options.customClass
    };

    this.toasts.push(toast);

    const toastEl = document.createElement('div');
    toastEl.id = toast.id;
    toastEl.className = `toast toast-${toast.type} ${toast.customClass || ''}`;
    toastEl.innerHTML = `<div class="toast-content">${options.message}</div>`;

    if (toast.duration > 0) {
      toastEl.innerHTML += `<div class="toast-progress" style="animation: toastProgress ${toast.duration}ms linear forwards;"></div>`;
    }

    this.container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);

    if (toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
        options.onClose?.();
      }, toast.duration);
    }

    return toast.id;
  }
}

// Initialize globally
window.toastNotification = new ToastNotification();

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    opacity: 0;
    transform: translateX(400px);
  }

  .toast.show {
    opacity: 1;
    transform: translateX(0);
  }

  .toast-success {
    border-left: 4px solid #10B981;
  }

  .toast-error {
    border-left: 4px solid #EF4444;
  }

  .toast-warning {
    border-left: 4px solid #F59E0B;
  }

  .toast-info {
    border-left: 4px solid #3B82F6;
  }

  .toast-loading {
    border-left: 4px solid #8B5CF6;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .toast-icon {
    font-size: 20px;
    font-weight: bold;
    flex-shrink: 0;
  }

  .toast-icon.success { color: #10B981; }
  .toast-icon.error { color: #EF4444; }
  .toast-icon.warning { color: #F59E0B; }
  .toast-icon.info { color: #3B82F6; }
  .toast-icon.loading { color: #8B5CF6; }

  .toast-icon.spinner {
    animation: spin 1s linear infinite;
  }

  .toast-message {
    flex: 1;
    color: #333;
    font-size: 14px;
    line-height: 1.5;
  }

  .toast-action-btn {
    padding: 4px 12px;
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 12px;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toast-action-btn:hover {
    background: #e0e0e0;
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: currentColor;
    width: 100%;
    opacity: 0.3;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes toastProgress {
    from { width: 100%; }
    to { width: 0%; }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .toast-container {
      left: 10px;
      right: 10px;
      top: 10px;
    }

    .toast {
      min-width: auto;
      max-width: none;
    }
  }
`;
document.head.appendChild(style);
