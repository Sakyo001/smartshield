/**
 * Content Script - SmartShield
 * Shows an on-page banner for scan results (safe, suspicious, or dangerous).
 * 
 * Key behaviors:
 * - Receives results from background script (no own API calls)
 * - Once dismissed, banner stays hidden for that domain during session
 * - Sub-route navigations on the same domain do NOT re-trigger banners
 * - Safe banners auto-dismiss after 5s
 */

(function () {
  if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
  if (window.location.protocol === 'chrome-extension:') return;
  if (window.__smartshieldLoaded) return;
  window.__smartshieldLoaded = true;

  // Tracks domains the user has *explicitly* closed via the X button this session.
  // Safe auto-dismisses do NOT add here so the badge can re-appear on tab switch.
  const dismissedDomains = new Set();

  // Track which domain's banner is currently displayed
  let currentBannerDomain = null;

  // References to active window-level drag listeners so we can clean them up
  let activeDragHandlers = null;
  // Reference to the live badge element inside the shadow DOM (for flash/locate)
  let activeBadgeEl = null;

  function getRootDomain() {
    return window.location.protocol + '//' + window.location.hostname;
  }

  chrome.storage.local.get(['safeModeEnabled'], (res) => {
    const enabled = res.safeModeEnabled !== undefined ? res.safeModeEnabled : true;
    if (!enabled) return;
    init();
  });

  function init() {
    const rootDomain = getRootDomain();

    // Listen for results pushed from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showScanResult' && message.result) {
        const domain = message.rootDomain || rootDomain;

        // Don't show if user already dismissed this domain
        if (dismissedDomains.has(domain)) {
          sendResponse({ displayed: false, reason: 'dismissed' });
          return;
        }

        // Don't show if banner is already displayed for this domain
        if (currentBannerDomain === domain && document.getElementById('smartshield-root')) {
          sendResponse({ displayed: false, reason: 'already_shown' });
          return;
        }

        showBanner(message.result, domain);
        sendResponse({ displayed: true });
      }

      if (message.action === 'showThreatWarning' && message.result) {
        const domain = message.rootDomain || rootDomain;
        if (!dismissedDomains.has(domain)) {
          showBanner(message.result, domain);
        }
        sendResponse({ displayed: true });
      }

      // "Show Badge on Page" button in popup — force show + flash
      if (message.action === 'locateBadge') {
        dismissedDomains.delete(rootDomain);
        currentBannerDomain = null;
        const sk = `result_${rootDomain}`;
        chrome.storage.local.get([sk], (stored) => {
          showBanner(stored[sk] || { scanPending: true }, rootDomain, true);
        });
        sendResponse({ ok: true });
      }
    });

    // On initial load: immediately show a scanning badge so the icon is always
    // visible, then replace it with the real result when the scan completes.
    const storageKey = `result_${rootDomain}`;
    chrome.storage.local.get([storageKey], (stored) => {
      if (!dismissedDomains.has(rootDomain)) {
        showBanner(stored[storageKey] || { scanPending: true }, rootDomain);
      }
    });
  }

  /**
   * Resolves a previously saved drag position from storage,
   * falling back to the default bottom-right corner.
   */
  function getSavedPosition(callback) {
    chrome.storage.local.get(['badgePosition'], (res) => {
      const pos = res.badgePosition;
      if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') {
        // Clamp to current viewport in case screen size changed
        const clampedLeft = Math.min(Math.max(0, pos.left), window.innerWidth - 56);
        const clampedTop  = Math.min(Math.max(0, pos.top),  window.innerHeight - 56);
        callback({ left: clampedLeft, top: clampedTop });
      } else {
        // Default: bottom-right
        callback({ left: window.innerWidth - 72, top: window.innerHeight - 72 });
      }
    });
  }

   /**
   * Show a small floating SmartShield badge — draggable, position persists across tabs.
   * Color-coded: green = safe, orange = warning, red = phishing/high risk.
   * Hovering expands a compact tooltip with details.
   */
  function showBanner(result, domain, flash = false) {
    if (!result) return;

    // Remove existing badge first
    removeBanner();

    currentBannerDomain = domain;

    const isPending = !!result.scanPending;
    const isSafe    = !isPending && !result.isSuspicious;
    const isHigh    = !isPending && (result.riskLevel === 'high' || result.riskScore >= 70);

    let glowColor, statusLabel, tooltipDesc;

    if (isPending) {
      glowColor   = '#6b7280';
      statusLabel = 'Scanning';
      tooltipDesc = 'Analyzing page security…';
    } else if (isSafe) {
      glowColor = '#10b981';
      statusLabel = 'Safe';
      tooltipDesc = 'No threats detected';
    } else if (isHigh) {
      glowColor = '#ef4444';
      statusLabel = 'Danger';
      tooltipDesc = 'Phishing risk — avoid entering personal info';
    } else {
      glowColor = '#f59e0b';
      statusLabel = 'Warning';
      tooltipDesc = 'Suspicious signals — proceed with caution';
    }

    const logoURL = chrome.runtime.getURL('images/light-logo-extension.png');

    // Load saved position, then build the badge at that position
    getSavedPosition(({ left, top }) => {
      const host = document.createElement('div');
      host.id = 'smartshield-root';
      host.style.cssText = `position:fixed;left:${left}px;top:${top}px;z-index:2147483647;pointer-events:none;`;
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'closed' });

      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .ss-badge {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: center;
          cursor: grab;
          animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .ss-badge.dragging {
          cursor: grabbing;
          animation: none;
        }

        @keyframes popIn {
          from { transform: scale(0.3) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes popOut {
          from { transform: scale(1) translateY(0); opacity: 1; }
          to   { transform: scale(0.3) translateY(20px); opacity: 0; }
        }
        .ss-badge.dismissing {
          animation: popOut 0.3s forwards cubic-bezier(0.55, 0, 1, 0.45);
        }

        /* The logo circle */
        .ss-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(10, 10, 15, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2.5px solid ${glowColor};
          box-shadow: 0 0 14px ${glowColor}66, 0 2px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          z-index: 2;
        }
        .ss-icon img {
          width: 26px;
          height: 26px;
          object-fit: contain;
          pointer-events: none;
          -webkit-user-drag: none;
        }
        .ss-badge:not(.dragging):hover .ss-icon {
          transform: scale(1.08);
          box-shadow: 0 0 22px ${glowColor}88, 0 4px 16px rgba(0,0,0,0.5);
        }

        /* Pulse ring for danger */
        ${!isSafe ? `
        .ss-icon::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid ${glowColor};
          opacity: 0;
          animation: pulseRing ${isHigh ? '1.4s' : '2s'} ease-out infinite;
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }` : ''}

        /* Tooltip — hidden while dragging */
        .ss-tooltip {
          position: absolute;
          right: 52px;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
          background: rgba(10, 10, 15, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1;
        }
        .ss-badge:not(.dragging):hover .ss-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
          pointer-events: auto;
        }
        .ss-tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${glowColor};
          flex-shrink: 0;
          box-shadow: 0 0 6px ${glowColor}aa;
        }
        .ss-tooltip-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .ss-tooltip-label {
          font-size: 12px;
          font-weight: 700;
          color: ${glowColor};
          letter-spacing: -0.01em;
        }
        .ss-tooltip-desc {
          font-size: 11px;
          color: #999;
          line-height: 1.3;
        }

        /* Drag hint */
        .ss-drag-hint {
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .ss-badge:not(.dragging):hover .ss-drag-hint {
          opacity: 1;
        }

        /* Close button (visible on hover) */
        .ss-close {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #333;
          border: 1px solid #555;
          color: #aaa;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s;
          z-index: 3;
          line-height: 1;
        }
        .ss-badge:not(.dragging):hover .ss-close {
          opacity: 1;
        }
        .ss-close:hover {
          background: #555;
          color: #fff;
        }

        /* Scanning spinner ring around icon */
        .ss-badge.pending .ss-icon {
          opacity: 0.82;
          border-style: dashed;
        }
        .ss-badge.pending .ss-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #9ca3af;
          border-right-color: rgba(156,163,175,0.35);
          animation: scanSpin 1.3s linear infinite;
          z-index: 3;
        }
        @keyframes scanSpin { to { transform: rotate(360deg); } }

        /* Flash pulse for "Show Badge on Page" locate feature */
        @keyframes flashLocate {
          0%,100% { transform: scale(1);    filter: brightness(1); }
          30%     { transform: scale(1.38); filter: brightness(2.6); }
          70%     { transform: scale(1.18); filter: brightness(1.6); }
        }
        .ss-badge.flash { animation: flashLocate 0.55s ease-in-out 3 !important; }
      `;

      const badge = document.createElement('div');
      badge.className = isPending ? 'ss-badge pending' : 'ss-badge';
      activeBadgeEl = badge;
      badge.innerHTML = `
        <div class="ss-tooltip">
          <span class="ss-tooltip-dot"></span>
          <div class="ss-tooltip-text">
            <span class="ss-tooltip-label">${statusLabel}</span>
            <span class="ss-tooltip-desc">${tooltipDesc}</span>
          </div>
        </div>
        <div class="ss-icon">
          <img src="${logoURL}" alt="SmartShield" />
        </div>
        <button class="ss-close" title="Dismiss">✕</button>
        <span class="ss-drag-hint">drag to move</span>
      `;

      shadow.appendChild(style);
      shadow.appendChild(badge);

      // Flash / locate animation when triggered from "Show Badge on Page" button
      if (flash) {
        setTimeout(() => {
          badge.classList.add('flash');
          badge.addEventListener('animationend', () => badge.classList.remove('flash'), { once: true });
        }, 160);
      }

      // ── Drag logic ──────────────────────────────────────────────
      // Remove any stale drag handlers from a previous badge instance
      if (activeDragHandlers) {
        window.removeEventListener('mousemove', activeDragHandlers.move, { capture: true });
        window.removeEventListener('mouseup',   activeDragHandlers.up,   { capture: true });
        activeDragHandlers = null;
      }

      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let hasMoved = false;

      // mousedown lives inside the shadow DOM — fires reliably
      badge.addEventListener('mousedown', (e) => {
        // Don't drag when clicking close button
        if (e.target.classList.contains('ss-close')) return;
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        hasMoved = false;
        const rect = host.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        badge.classList.add('dragging');
        document.documentElement.style.userSelect = 'none';
        document.documentElement.style.pointerEvents = 'none';
        host.style.pointerEvents = 'auto';
      });

      // Move & up go on WINDOW with capture:true so they fire even if the
      // page calls stopPropagation on its own mousemove/mouseup handlers
      const onMouseMove = (e) => {
        if (!isDragging) return;
        hasMoved = true;
        const newLeft = Math.min(Math.max(0, e.clientX - dragOffsetX), window.innerWidth  - 56);
        const newTop  = Math.min(Math.max(0, e.clientY - dragOffsetY), window.innerHeight - 56);
        host.style.left   = newLeft + 'px';
        host.style.top    = newTop  + 'px';
        host.style.right  = 'auto';
        host.style.bottom = 'auto';
      };

      const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        badge.classList.remove('dragging');
        document.documentElement.style.userSelect = '';
        document.documentElement.style.pointerEvents = '';
        host.style.pointerEvents = 'none';

        const rect = host.getBoundingClientRect();
        chrome.storage.local.set({
          badgePosition: { left: Math.round(rect.left), top: Math.round(rect.top) }
        });

        // Treat as click if barely moved
        if (!hasMoved && isHigh) {
          dismissedDomains.add(domain);
          currentBannerDomain = null;
          window.history.back();
          setTimeout(() => { window.location.href = 'https://google.com'; }, 500);
        }
      };

      window.addEventListener('mousemove', onMouseMove, { capture: true });
      window.addEventListener('mouseup',   onMouseUp,   { capture: true });
      activeDragHandlers = { move: onMouseMove, up: onMouseUp };
      // ────────────────────────────────────────────────────────────

      // Dismiss on close button click — only explicit close marks domain as dismissed
      const closeBtn = badge.querySelector('.ss-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dismissedDomains.add(domain); // intentional user dismiss
          currentBannerDomain = null;
          if (activeDragHandlers) {
            window.removeEventListener('mousemove', activeDragHandlers.move, { capture: true });
            window.removeEventListener('mouseup',   activeDragHandlers.up,   { capture: true });
            activeDragHandlers = null;
          }
          dismissBadge(host, badge);
        });
      }

      // Auto-dismiss safe badges after 4s — do NOT add to dismissedDomains
      // so the badge can re-appear when the user switches back to this tab
      if (isSafe) {
        setTimeout(() => {
          const el = document.getElementById('smartshield-root');
          if (el) {
            // currentBannerDomain = null but domain NOT added to dismissedDomains
            currentBannerDomain = null;
            dismissBadge(host, badge);
          }
        }, 4000);
      }
    }); // end getSavedPosition
  }

  function removeBanner() {
    const existing = document.getElementById('smartshield-root');
    if (existing) existing.remove();
    currentBannerDomain = null;
    activeBadgeEl = null;
  }

  function dismissBadge(host, badge) {
    badge.classList.add('dismissing');
    badge.addEventListener('animationend', () => {
      if (host.parentNode) host.remove();
    }, { once: true });
    setTimeout(() => { if (host.parentNode) host.remove(); }, 350);
  }
})();
