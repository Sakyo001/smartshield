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

  // Track dismissed domains for this page session
  // Once user clicks Dismiss / "I understand", don't show again for this domain
  const dismissedDomains = new Set();

  // Track which domain's banner is currently displayed
  let currentBannerDomain = null;

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
    });

    // On initial load, check cache for root domain result (instant)
    const storageKey = `result_${rootDomain}`;
    chrome.storage.local.get([storageKey], (stored) => {
      if (stored[storageKey] && !dismissedDomains.has(rootDomain)) {
        showBanner(stored[storageKey], rootDomain);
      }
    });
  }

  /**
   * Show a banner at the top of the page using Shadow DOM.
   */
  function showBanner(result, domain) {
    if (!result || result.scanPending) return;

    // Remove existing banner first
    removeBanner();

    currentBannerDomain = domain;

    const isSafe = !result.isSuspicious;
    const isHigh = result.riskLevel === 'high' || result.riskScore >= 70;

    let borderColor, iconEmoji, title, description, titleColor;

    if (isSafe) {
      borderColor = '#10b981';
      iconEmoji = '✅';
      title = 'Site Verified Safe';
      description = 'SmartShield has verified this website. No threats detected.';
      titleColor = '#10b981';
    } else if (isHigh) {
      borderColor = '#ef4444';
      iconEmoji = '🚨';
      title = 'High Risk Website Detected';
      description = 'SmartShield has identified this page as a likely phishing attempt. Do not enter personal information.';
      titleColor = '#ef4444';
    } else {
      borderColor = '#eab308';
      iconEmoji = '⚠️';
      title = 'Suspicious Website Detected';
      description = 'SmartShield has flagged this page as suspicious. Proceed with caution.';
      titleColor = '#eab308';
    }

    const host = document.createElement('div');
    host.id = 'smartshield-root';
    host.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .banner {
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 2px solid ${borderColor};
        color: #ededed;
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        pointer-events: auto;
        transform: translateY(-100%);
        animation: slideDown 0.4s forwards cubic-bezier(0.16, 1, 0.3, 1);
      }
      .banner.dismissing {
        animation: slideUp 0.35s forwards cubic-bezier(0.55, 0, 1, 0.45);
      }
      @keyframes slideDown {
        to { transform: translateY(0); }
      }
      @keyframes slideUp {
        from { transform: translateY(0); }
        to { transform: translateY(-100%); }
      }
      .content {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;
      }
      .icon {
        font-size: 22px;
        flex-shrink: 0;
      }
      .text h3 {
        margin: 0 0 2px 0;
        font-size: 14px;
        font-weight: 700;
        color: ${titleColor};
        letter-spacing: -0.01em;
      }
      .text p {
        margin: 0;
        font-size: 12.5px;
        color: #aaa;
        line-height: 1.4;
      }
      .badge {
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        margin-left: 8px;
        flex-shrink: 0;
        background: ${borderColor}20;
        color: ${borderColor};
        border: 1px solid ${borderColor}40;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
        margin-left: 16px;
      }
      button {
        border: none;
        padding: 7px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        font-size: 12px;
        font-family: inherit;
      }
      .btn-dismiss {
        background: transparent;
        color: #888;
        border: 1px solid #444;
      }
      .btn-dismiss:hover {
        border-color: #666;
        color: #ededed;
      }
      .btn-leave {
        background: ${borderColor};
        color: ${isHigh ? '#fff' : '#000'};
      }
      .btn-leave:hover {
        filter: brightness(1.15);
        transform: translateY(-1px);
      }
    `;

    const banner = document.createElement('div');
    banner.className = 'banner';

    if (isSafe) {
      banner.innerHTML = `
        <div class="content">
          <span class="icon">${iconEmoji}</span>
          <div class="text">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <span class="badge">RISK ${result.riskScore || 0}%</span>
        </div>
        <div class="actions">
          <button class="btn-dismiss" id="ss-dismiss">Dismiss</button>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="content">
          <span class="icon">${iconEmoji}</span>
          <div class="text">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <span class="badge">RISK ${result.riskScore || 0}%</span>
        </div>
        <div class="actions">
          <button class="btn-dismiss" id="ss-dismiss">I understand the risk</button>
          <button class="btn-leave" id="ss-leave">Leave this site</button>
        </div>
      `;
    }

    shadow.appendChild(style);
    shadow.appendChild(banner);

    // Dismiss handler — marks domain as dismissed so banner won't reappear
    const dismissBtn = banner.querySelector('#ss-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        dismissedDomains.add(domain);
        currentBannerDomain = null;
        dismissBanner(host, banner);
      });
    }

    // Leave handler
    const leaveBtn = banner.querySelector('#ss-leave');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        dismissedDomains.add(domain);
        currentBannerDomain = null;
        window.history.back();
        setTimeout(() => { window.location.href = 'https://google.com'; }, 500);
      });
    }

    // Auto-dismiss safe banners after 5 seconds
    if (isSafe) {
      setTimeout(() => {
        const el = document.getElementById('smartshield-root');
        if (el) {
          dismissedDomains.add(domain);
          currentBannerDomain = null;
          dismissBanner(host, banner);
        }
      }, 5000);
    }
  }

  function removeBanner() {
    const existing = document.getElementById('smartshield-root');
    if (existing) existing.remove();
    currentBannerDomain = null;
  }

  function dismissBanner(host, banner) {
    banner.classList.add('dismissing');
    banner.addEventListener('animationend', () => {
      if (host.parentNode) host.remove();
    }, { once: true });
    // Fallback removal
    setTimeout(() => { if (host.parentNode) host.remove(); }, 400);
  }
})();
