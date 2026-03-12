/* =========================================================
   JobNexus PWA â€” js/pwa.js
   Handles:
     1. Service Worker registration
     2. Platform-aware install flow (Android, iOS, desktop)
     3. iOS "Add to Home Screen" instruction modal
     4. Android guide modal (when prompt not yet available)
     5. Floating auto-prompt install button
     6. Global window.pwaInstall() for inline HTML buttons
   ========================================================= */

(function () {
  'use strict';

  /* â”€â”€ Platform detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  let deferredPrompt = null;

  /* â”€â”€ 1. Register Service Worker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Detect when a new SW is found and waiting
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // There is a previous SW — new one is waiting → show update dialog
                showUpdateDialog(newWorker);
              }
            });
          });
          // Also check if there's already a waiting SW on page load
          if (reg.waiting && navigator.serviceWorker.controller) {
            showUpdateDialog(reg.waiting);
          }
        })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));

      // Reload all clients once new SW has activated
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }

  /* â”€â”€ 2. Inject CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const style = document.createElement('style');
  style.textContent = `
    /* â”€â”€ Floating install button â”€â”€ */
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

    /* â”€â”€ Shared modal base â”€â”€ */
    #pwa-ios-modal, #pwa-android-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 200000;
    }
    #pwa-ios-modal.open,
    #pwa-android-modal.open { display: flex; align-items: flex-end; justify-content: center; }
    .pwa-modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
    }
    .pwa-modal-sheet {
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
    .pwa-modal-close {
      position: absolute;
      top: 16px; right: 18px;
      background: rgba(255,255,255,0.1);
      border: none; color: #fff;
      width: 30px; height: 30px;
      border-radius: 50%; font-size: 18px;
      cursor: pointer; display: flex;
      align-items: center; justify-content: center;
    }
    .pwa-modal-logo {
      width: 64px; height: 64px;
      background: linear-gradient(135deg,#e53935,#b71c1c);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 900; color: #fff;
      font-family: 'Inter', Arial, sans-serif;
      margin: 0 auto 14px;
    }
    .pwa-modal-sheet h3 {
      color: #fff; text-align: center;
      font-size: 20px; font-weight: 700;
      margin-bottom: 6px;
    }
    .pwa-modal-sub {
      color: #8b949e; text-align: center;
      font-size: 14px; margin-bottom: 24px;
    }
    .pwa-modal-sheet ol {
      list-style: none; padding: 0; margin: 0;
    }
    .pwa-modal-sheet ol li {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
      color: #c9d1d9; font-size: 15px;
      flex-wrap: wrap;
    }
    .pwa-modal-sheet ol li:last-child { border-bottom: none; }
    .pwa-step-num {
      width: 28px; height: 28px;
      background: rgba(229,57,53,0.18);
      border-radius: 50%; color: #e53935;
      font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pwa-step-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.1);
      padding: 2px 10px; border-radius: 6px;
      font-size: 13px; color: #fff;
    }

    /* â”€â”€ Toast â”€â”€ */
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

    /* ── Update Available dialog ─────────────────────────── */
    #pwa-update-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 200000;
      align-items: flex-end;
      justify-content: center;
    }
    #pwa-update-modal.open { display: flex; }
    #pwa-update-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(3px);
    }
    #pwa-update-sheet {
      position: relative;
      z-index: 1;
      background: #1a1f2e;
      border-radius: 24px 24px 0 0;
      padding: 28px 24px 44px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 -8px 40px rgba(0,0,0,0.55);
      animation: pwa-slide-up 0.38s cubic-bezier(0.34,1.35,0.64,1) both;
      text-align: center;
    }
    #pwa-update-sheet .upd-icon {
      width: 66px; height: 66px;
      background: linear-gradient(135deg, #e53935, #b71c1c);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      margin: 0 auto 14px;
      box-shadow: 0 4px 20px rgba(229,57,53,0.45);
    }
    #pwa-update-sheet h3 {
      color: #fff; font-size: 21px; font-weight: 700; margin: 0 0 6px;
      font-family: 'Inter', Arial, sans-serif;
    }
    #pwa-update-sheet p {
      color: #8b949e; font-size: 14px; line-height: 1.5; margin: 0 0 26px;
      font-family: 'Inter', Arial, sans-serif;
    }
    #pwa-update-now-btn {
      display: block; width: 100%; padding: 15px;
      background: linear-gradient(135deg, #e53935, #b71c1c);
      color: #fff; border: none; border-radius: 14px;
      font-size: 16px; font-weight: 700; cursor: pointer;
      font-family: 'Inter', Arial, sans-serif;
      margin-bottom: 10px;
      box-shadow: 0 4px 18px rgba(229,57,53,0.45);
      transition: transform 0.18s, box-shadow 0.18s;
      letter-spacing: 0.3px;
    }
    #pwa-update-now-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(229,57,53,0.65);
    }
    #pwa-update-later-btn {
      display: block; width: 100%; padding: 12px;
      background: transparent; color: #8b949e; border: none;
      font-size: 14px; cursor: pointer;
      font-family: 'Inter', Arial, sans-serif;
      transition: color 0.2s;
    }
    #pwa-update-later-btn:hover { color: #c9d1d9; }
  `;
  document.head.appendChild(style);

  /* â”€â”€ 3. Toast utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
  }

  /* â”€â”€ 4. iOS install modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const iosModal = document.createElement('div');
  iosModal.id = 'pwa-ios-modal';
  iosModal.innerHTML = `
    <div class="pwa-modal-overlay"></div>
    <div class="pwa-modal-sheet">
      <button class="pwa-modal-close" aria-label="Close">&times;</button>
      <div class="pwa-modal-logo">J</div>
      <h3>Install JobNexus</h3>
      <p class="pwa-modal-sub">Add to your Home Screen for a full app experience</p>
      <ol>
        <li>
          <span class="pwa-step-num">1</span>
          <span>Tap the <span class="pwa-step-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share
          </span> button at the bottom of Safari</span>
        </li>
        <li>
          <span class="pwa-step-num">2</span>
          <span>Scroll down and tap <span class="pwa-step-badge">+ Add to Home Screen</span></span>
        </li>
        <li>
          <span class="pwa-step-num">3</span>
          <span>Tap <span class="pwa-step-badge">Add</span> in the top-right corner</span>
        </li>
      </ol>
    </div>
  `;

  /* â”€â”€ 5. Android guide modal (when prompt unavailable) â”€â”€â”€â”€ */
  const androidModal = document.createElement('div');
  androidModal.id = 'pwa-android-modal';
  androidModal.innerHTML = `
    <div class="pwa-modal-overlay"></div>
    <div class="pwa-modal-sheet">
      <button class="pwa-modal-close" aria-label="Close">&times;</button>
      <div class="pwa-modal-logo">J</div>
      <h3>Install JobNexus</h3>
      <p class="pwa-modal-sub">Add to your Home Screen in 3 quick steps</p>
      <ol>
        <li>
          <span class="pwa-step-num">1</span>
          <span>Tap the <span class="pwa-step-badge">â‹® Menu</span> (three dots) in the top-right of Chrome</span>
        </li>
        <li>
          <span class="pwa-step-num">2</span>
          <span>Select <span class="pwa-step-badge">Add to Home screen</span> or <span class="pwa-step-badge">Install app</span></span>
        </li>
        <li>
          <span class="pwa-step-num">3</span>
          <span>Tap <span class="pwa-step-badge">Install</span> to confirm â€” done!</span>
        </li>
      </ol>
    </div>
  `;

  function closeModal(modal) { modal.classList.remove('open'); }

  function appendModals() {
    document.body.appendChild(iosModal);
    document.body.appendChild(androidModal);

    iosModal.querySelector('.pwa-modal-overlay').addEventListener('click', () => closeModal(iosModal));
    iosModal.querySelector('.pwa-modal-close').addEventListener('click', () => closeModal(iosModal));

    androidModal.querySelector('.pwa-modal-overlay').addEventListener('click', () => closeModal(androidModal));
    androidModal.querySelector('.pwa-modal-close').addEventListener('click', () => closeModal(androidModal));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendModals);
  } else {
    appendModals();
  }

  /* â”€â”€ 6. Floating install button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* ── Wire hero Install button (click + touchend for mobile) ── */
  function wireHeroBtn() {
    const heroBtn = document.getElementById('heroInstallBtn');
    if (!heroBtn) return;
    let touchMoved = false;
    heroBtn.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
    heroBtn.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
    heroBtn.addEventListener('touchend', (e) => {
      if (!touchMoved) {
        e.preventDefault();
        triggerInstall();
      }
    });
    heroBtn.addEventListener('click', () => triggerInstall());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireHeroBtn);
  } else {
    wireHeroBtn();
  }

  /* â”€â”€ 7. Core install logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function triggerInstall() {
    if (isStandalone) {
      showToast('âœ“ JobNexus is already installed on your device!');
      return;
    }
    if (deferredPrompt) {
      // Android / Chrome / Edge â€” native prompt available
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        deferredPrompt = null;
        wrapper.classList.remove('visible');
        if (outcome === 'accepted') showToast('âœ“ JobNexus installed successfully!');
      });
    } else if (isIOS) {
      // iOS Safari â€” step-by-step modal
      iosModal.classList.add('open');
    } else if (isAndroid) {
      // Android Chrome â€” prompt not yet available, show manual guide
      androidModal.classList.add('open');
    } else {
      // Desktop
      showToast('Open this page in Chrome on Android or Safari on iPhone to install.');
    }
  }

  /* â”€â”€ 8. Expose global for inline HTML buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  window.pwaInstall = triggerInstall;

  /* â”€â”€ 9. Listen for browser prompt event â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    wrapper.classList.add('visible');
  });

  /* â”€â”€ 10. Hide on successful install â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    wrapper.classList.remove('visible');
    const heroBtn = document.getElementById('heroInstallBtn');
    if (heroBtn) heroBtn.classList.add('hidden');
    showToast('âœ“ JobNexus has been installed!');
  });

  /* â”€â”€ 11. Hide hero button if already standalone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* ── Update Available dialog ─────────────────────────── */
  let _updateWorker = null;

  function showUpdateDialog(waitingWorker) {
    _updateWorker = waitingWorker;
    const modal = document.getElementById('pwa-update-modal');
    if (modal) modal.classList.add('open');
  }

  function buildUpdateModal() {
    const modal = document.createElement('div');
    modal.id = 'pwa-update-modal';
    modal.innerHTML = `
      <div id="pwa-update-overlay"></div>
      <div id="pwa-update-sheet">
        <div class="upd-icon">&#x26A1;</div>
        <h3>Update Available!</h3>
        <p>A new version of <strong style="color:#e53935">JobNexus</strong> is ready.<br>Tap below to reload and get the latest features.</p>
        <button id="pwa-update-now-btn">&#x2B06; Update App Now</button>
        <button id="pwa-update-later-btn">Maybe Later</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('pwa-update-now-btn').addEventListener('click', () => {
      modal.classList.remove('open');
      if (_updateWorker) {
        _updateWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    const dismiss = () => modal.classList.remove('open');
    document.getElementById('pwa-update-later-btn').addEventListener('click', dismiss);
    document.getElementById('pwa-update-overlay').addEventListener('click', dismiss);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUpdateModal);
  } else {
    buildUpdateModal();
  }

})();
