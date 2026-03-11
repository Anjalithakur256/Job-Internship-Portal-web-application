/* =========================================================
   JobNexus PWA — js/pwa.js
   Handles:
     1. Service Worker registration
     2. Install prompt button (injected dynamically)
     3. App-installed event cleanup
   ========================================================= */

(function () {
  'use strict';

  /* ── 1. Register Service Worker ────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    });
  }

  /* ── 2. Inject Install Button CSS ──────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #pwa-install-btn {
      display: none;
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      align-items: center;
      gap: 10px;
      padding: 14px 22px;
      background: linear-gradient(135deg, #e53935, #b71c1c);
      color: #fff;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 15px;
      font-weight: 600;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(229, 57, 53, 0.45);
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
      text-decoration: none;
      letter-spacing: 0.3px;
      animation: pwa-pulse 2.5s infinite;
    }
    #pwa-install-btn:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 10px 32px rgba(229, 57, 53, 0.60);
    }
    #pwa-install-btn:active {
      transform: scale(0.97);
    }
    #pwa-install-btn svg {
      flex-shrink: 0;
    }
    #pwa-install-dismiss {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 22px;
      height: 22px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 50%;
      font-size: 12px;
      line-height: 22px;
      text-align: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      z-index: 100000;
    }
    #pwa-install-wrapper {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      display: none;
    }
    #pwa-install-wrapper.visible {
      display: block;
    }
    @keyframes pwa-pulse {
      0%, 100% { box-shadow: 0 6px 24px rgba(229, 57, 53, 0.45); }
      50%       { box-shadow: 0 6px 36px rgba(229, 57, 53, 0.70); }
    }
    @media (max-width: 480px) {
      #pwa-install-btn {
        bottom: 18px;
        right: 18px;
        padding: 12px 18px;
        font-size: 14px;
      }
      #pwa-install-wrapper {
        bottom: 18px;
        right: 18px;
      }
    }
  `;
  document.head.appendChild(style);

  /* ── 3. Inject Install Button HTML ─────────────────────── */
  const wrapper = document.createElement('div');
  wrapper.id = 'pwa-install-wrapper';
  wrapper.setAttribute('aria-label', 'Install JobNexus App');

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.setAttribute('aria-label', 'Install JobNexus App on your device');
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Install App
  `;

  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'pwa-install-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss install prompt');
  dismissBtn.innerHTML = '&times;';

  wrapper.appendChild(btn);
  wrapper.appendChild(dismissBtn);

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(wrapper));
  } else {
    document.body.appendChild(wrapper);
  }

  /* ── 4. Install Prompt Logic ────────────────────────────── */
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show the install button
    wrapper.classList.add('visible');
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      wrapper.classList.remove('visible');
    }
  });

  dismissBtn.addEventListener('click', () => {
    wrapper.classList.remove('visible');
    deferredPrompt = null;
  });

  /* ── 5. Hide button after successful install ────────────── */
  window.addEventListener('appinstalled', () => {
    wrapper.classList.remove('visible');
    deferredPrompt = null;
  });

})();
