/* =========================================================
   JobNexus PWA — js/pwa.js
   Handles:
     1. Service Worker registration
     2. Platform-aware install flow (Android, iOS, desktop)
     3. iOS "Add to Home Screen" instruction modal
     4. Floating auto-prompt install button
     5. Global window.pwaInstall() for inline HTML buttons
   ========================================================= */

(function () {
  'use strict';

  /* ── Platform detection ─────────────────────────────────── */
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  let deferredPrompt = null;

  /* ── 1. Register Service Worker ────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    });
  }

  /* ── 2. Inject CSS ─────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Floating install button ── */
    #pwa-install-wrapper {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      display: none;
    }
    #pwa-install-wrapper.visible { display: block; }
    #pwa-install-btn {
      display: flex;
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
      box-shadow: 0 6px 24px rgba(229,57,53,0.45);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      letter-spacing: 0.3px;
      animation: pwa-pulse 2.5s infinite;
    }
    #pwa-install-btn:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 10px 32px rgba(229,57,53,0.65);
    }
    #pwa-install-btn:active { transform: scale(0.97); }
    #pwa-install-dismiss {
      position: absolute;
      top: -8px; right: -8px;
      width: 22px; height: 22px;
      background: #333; color: #fff;
      border: none; border-radius: 50%;
      font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      z-index: 100000;
    }
    @keyframes pwa-pulse {
      0%, 100% { box-shadow: 0 6px 24px rgba(229,57,53,0.45); }
      50%       { box-shadow: 0 6px 36px rgba(229,57,53,0.70); }
    }

    /* ── Hero "Get the App" button ── */
    .pwa-hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 13px 22px;
      background: rgba(229,57,53,0.12);
      color: #e53935;
      border: 2px solid rgba(229,57,53,0.45);
      border-radius: 50px;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      text-decoration: none;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }
    .pwa-hero-btn:hover {
      background: rgba(229,57,53,0.22);
      border-color: #e53935;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(229,57,53,0.30);
    }
    .pwa-hero-btn:active { transform: scale(0.97); }
    .pwa-hero-btn.hidden { display: none !important; }

    /* ── iOS instruction modal ── */
    #pwa-ios-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 200000;
    }
    #pwa-ios-modal.open { display: flex; align-items: flex-end; justify-content: center; }
    #pwa-ios-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
    }
    #pwa-ios-sheet {
      position: relative;
      z-index: 1;
      background: #1a1f2e;
      border-radius: 24px 24px 0 0;
      padding: 28px 24px 40px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
      animation: pwa-slide-up 0.35s cubic-bezier(0.34,1.4,0.64,1);
    }
    @keyframes pwa-slide-up {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    #pwa-ios-close {
      position: absolute;
      top: 16px; right: 18px;
      background: rgba(255,255,255,0.1);
      border: none; color: #fff;
      width: 30px; height: 30px;
      border-radius: 50%; font-size: 18px;
      cursor: pointer; display: flex;
      align-items: center; justify-content: center;
    }
    #pwa-ios-sheet .pwa-ios-logo {
      width: 64px; height: 64px;
      background: linear-gradient(135deg,#e53935,#b71c1c);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 900; color: #fff;
      font-family: 'Inter', Arial, sans-serif;
      margin: 0 auto 14px;
    }
    #pwa-ios-sheet h3 {
      color: #fff; text-align: center;
      font-size: 20px; font-weight: 700;
      margin-bottom: 6px;
    }
    #pwa-ios-sheet .pwa-ios-sub {
      color: #8b949e; text-align: center;
      font-size: 14px; margin-bottom: 24px;
    }
    #pwa-ios-sheet ol {
      list-style: none; padding: 0; margin: 0;
    }
    #pwa-ios-sheet ol li {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
      color: #c9d1d9; font-size: 15px;
    }
    #pwa-ios-sheet ol li:last-child { border-bottom: none; }
    #pwa-ios-sheet .pwa-step-num {
      width: 28px; height: 28px;
      background: rgba(229,57,53,0.18);
      border-radius: 50%; color: #e53935;
      font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #pwa-ios-sheet .pwa-step-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.1);
      padding: 2px 8px; border-radius: 6px;
      font-size: 13px; color: #fff;
    }

    /* ── Toast ── */
    #pwa-toast {
      position: fixed;
      bottom: 90px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #1e2533;
      color: #e2e8f0;
      padding: 12px 22px;
      border-radius: 50px;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      z-index: 300000;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
    }
    #pwa-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 480px) {
      #pwa-install-wrapper { bottom: 18px; right: 18px; }
      #pwa-install-btn { padding: 12px 18px; font-size: 14px; }
    }
  `;
  document.head.appendChild(style);

  /* ── 3. Toast utility ──────────────────────────────────── */
  let toastEl = null;
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'pwa-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  /* ── 4. iOS install modal ──────────────────────────────── */
  const iosModal = document.createElement('div');
  iosModal.id = 'pwa-ios-modal';
  iosModal.innerHTML = `
    <div id="pwa-ios-overlay"></div>
    <div id="pwa-ios-sheet">
      <button id="pwa-ios-close" aria-label="Close">&times;</button>
      <div class="pwa-ios-logo">J</div>
      <h3>Install JobNexus</h3>
      <p class="pwa-ios-sub">Add to your Home Screen for a full app experience</p>
      <ol>
        <li>
          <span class="pwa-step-num">1</span>
          Tap the <span class="pwa-step-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share
          </span> button at the bottom of Safari
        </li>
        <li>
          <span class="pwa-step-num">2</span>
          Scroll down and tap <span class="pwa-step-badge">+ Add to Home Screen</span>
        </li>
        <li>
          <span class="pwa-step-num">3</span>
          Tap <span class="pwa-step-badge">Add</span> in the top-right corner
        </li>
      </ol>
    </div>
  `;

  function appendModal() {
    document.body.appendChild(iosModal);
    document.getElementById('pwa-ios-overlay').addEventListener('click', closeIosModal);
    document.getElementById('pwa-ios-close').addEventListener('click', closeIosModal);
  }
  function closeIosModal() { iosModal.classList.remove('open'); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendModal);
  } else {
    appendModal();
  }

  /* ── 5. Floating install button ────────────────────────── */
  const wrapper = document.createElement('div');
  wrapper.id = 'pwa-install-wrapper';

  const floatBtn = document.createElement('button');
  floatBtn.id = 'pwa-install-btn';
  floatBtn.setAttribute('aria-label', 'Install JobNexus App');
  floatBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Install App
  `;

  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'pwa-install-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  dismissBtn.innerHTML = '&times;';

  wrapper.appendChild(floatBtn);
  wrapper.appendChild(dismissBtn);

  function appendFloatBtn() { document.body.appendChild(wrapper); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendFloatBtn);
  } else {
    appendFloatBtn();
  }

  floatBtn.addEventListener('click', () => triggerInstall());
  dismissBtn.addEventListener('click', () => {
    wrapper.classList.remove('visible');
    deferredPrompt = null;
  });

  /* ── 6. Core install logic ─────────────────────────────── */
  function triggerInstall() {
    if (isStandalone) {
      showToast('✓ JobNexus is already installed on your device!');
      return;
    }
    if (deferredPrompt) {
      // Android / Chrome / Edge — native prompt
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        deferredPrompt = null;
        wrapper.classList.remove('visible');
        if (outcome === 'accepted') showToast('✓ JobNexus installed successfully!');
      });
    } else if (isIOS) {
      // iOS Safari — show step-by-step modal
      iosModal.classList.add('open');
    } else {
      // Fallback (desktop, Firefox, etc.)
      showToast('Open this page in Chrome on Android to install the app.');
    }
  }

  /* ── 7. Expose global for inline HTML buttons ──────────── */
  window.pwaInstall = triggerInstall;

  /* ── 8. Listen for browser prompt event ───────────────── */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    wrapper.classList.add('visible');
  });

  /* ── 9. Hide everything on successful install ──────────── */
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    wrapper.classList.remove('visible');
    // Hide hero button if present
    const heroBtn = document.getElementById('heroInstallBtn');
    if (heroBtn) heroBtn.classList.add('hidden');
  });

  /* ── 10. Hide hero button if already running standalone ── */
  if (isStandalone) {
    const hideHeroBtn = () => {
      const heroBtn = document.getElementById('heroInstallBtn');
      if (heroBtn) heroBtn.classList.add('hidden');
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideHeroBtn);
    } else {
      hideHeroBtn();
    }
  }

})();

