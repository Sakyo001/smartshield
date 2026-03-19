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
  if (
    window.location.protocol !== "http:" &&
    window.location.protocol !== "https:"
  )
    return;
  if (window.location.protocol === "chrome-extension:") return;
  if (window.__smartshieldLoaded) return;
  window.__smartshieldLoaded = true;

  const TRUSTED_WEB_APP_ORIGINS = new Set([
    "https://smartshield.it.com",
    "https://www.smartshield.it.com",
    "https://smartshield-ai.vercel.app",
  ]);

  function isTrustedWebAppOrigin(origin) {
    return TRUSTED_WEB_APP_ORIGINS.has(origin);
  }

  function isWebAppHost() {
    const host = window.location.hostname.toLowerCase();
    return (
      host === "smartshield.it.com" ||
      host === "www.smartshield.it.com" ||
      host === "smartshield-ai.vercel.app"
    );
  }

  function requestSessionSyncFromPage() {
    if (!isWebAppHost()) return;
    window.postMessage(
      {
        type: "SMARTSHIELD_REQUEST_SESSION",
      },
      window.location.origin,
    );
  }

  async function persistSyncedAuth(tokens) {
    if (!tokens || typeof tokens !== "object") {
      throw new Error("Invalid token payload");
    }

    const accessToken =
      typeof tokens.access_token === "string" ? tokens.access_token : "";
    const refreshToken =
      typeof tokens.refresh_token === "string" ? tokens.refresh_token : "";

    if (!accessToken || !refreshToken) {
      throw new Error("Missing access or refresh token");
    }

    const expiresIn = Number(tokens.expires_in || 0);
    const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : null;

    const authPayload = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: tokens.user || null,
      token_type: tokens.token_type || "bearer",
      expires_at: expiresAt,
      synced_at: Date.now(),
    };

    await chrome.storage.local.set({
      smartshield_auth: authPayload,
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!isTrustedWebAppOrigin(event.origin)) return;

    const data = event.data || {};
    if (data.type !== "SMARTSHIELD_SYNC_SESSION") return;

    Promise.resolve(persistSyncedAuth(data.tokens))
      .then(() => {
        window.postMessage(
          {
            type: "SMARTSHIELD_SYNC_CONFIRMED",
            success: true,
          },
          event.origin,
        );
      })
      .catch((err) => {
        window.postMessage(
          {
            type: "SMARTSHIELD_SYNC_CONFIRMED",
            success: false,
            error: err instanceof Error ? err.message : "Unknown sync error",
          },
          event.origin,
        );
      });
  });

  // Request session hand-off shortly after script boot for already logged-in users.
  if (isWebAppHost()) {
    setTimeout(requestSessionSyncFromPage, 400);
    setTimeout(requestSessionSyncFromPage, 1800);
  }

  // Tracks domains the user has *explicitly* closed via the X button this session.
  // Safe auto-dismisses do NOT add here so the badge can re-appear on tab switch.
  const dismissedDomains = new Set();

  // Track which domain's banner is currently displayed
  let currentBannerDomain = null;

  // References to active window-level drag listeners so we can clean them up
  let activeDragHandlers = null;
  // Reference to the live badge element inside the shadow DOM (for flash/locate)
  let activeBadgeEl = null;

  // ── Duplicate-prevention: serial counter for concurrent showBanner calls ──
  // getSavedPosition is async; without this, two overlapping calls both append
  // a badge before either has finished, causing duplicates.
  let bannerBuildId = 0;
  // Tracks a host that has been created but not yet attached to the DOM
  let pendingHostEl = null;

  function getRootDomain() {
    return window.location.protocol + "//" + window.location.hostname;
  }

  chrome.storage.local.get(["safeModeEnabled"], (res) => {
    const enabled =
      res.safeModeEnabled !== undefined ? res.safeModeEnabled : true;
    if (!enabled) return;
    init();
  });

  function checkAuthStatus() {
    try {
      // Check if any Supabase auth token exists in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("auth-token")) {
          const tokenData = localStorage.getItem(key);
          if (tokenData) {
            try {
              const parsed = JSON.parse(tokenData);
              if (parsed.access_token) return true;
            } catch {
              // Invalid JSON, continue checking
            }
          }
        }
      }
    } catch {
      // localStorage access error
    }
    return false;
  }

  function init() {
    const rootDomain = getRootDomain();

    // Listen for results pushed from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "showScanResult" && message.result) {
        const domain = message.rootDomain || rootDomain;

        // Don't show if user already dismissed this domain
        if (dismissedDomains.has(domain)) {
          sendResponse({ displayed: false, reason: "dismissed" });
          return;
        }

        // If a badge is already visible for this domain, update it in-place
        // instead of destroying & recreating (which resets position visually)
        if (
          currentBannerDomain === domain &&
          document.getElementById("smartshield-root")
        ) {
          // Only re-create if the scan was pending and now has a real result
          if (message.result.scanPending) {
            sendResponse({ displayed: false, reason: "already_shown" });
            return;
          }
          // Replace with real result, keeping persistent & position
        }

        showBanner(message.result, domain, false, !!message.persistent);
        sendResponse({ displayed: true });
      }

      if (message.action === "showThreatWarning" && message.result) {
        const domain = message.rootDomain || rootDomain;
        if (!dismissedDomains.has(domain)) {
          showBanner(message.result, domain);
        }
        sendResponse({ displayed: true });
      }

      // "Show Badge on Page" button in popup — force show + flash + persist
      if (message.action === "locateBadge") {
        dismissedDomains.delete(rootDomain);
        currentBannerDomain = null;
        chrome.storage.local.set({ badgeForceVisible: true });
        const sk = `result_${rootDomain}`;
        chrome.storage.local.get([sk], (stored) => {
          showBanner(
            stored[sk] || { scanPending: true },
            rootDomain,
            true,
            true,
          );
        });
        sendResponse({ ok: true });
      }

      // Check authentication status for community feature
      if (message.action === "checkAuth") {
        const authenticated = checkAuthStatus();
        sendResponse({ authenticated });
      }

      if (message.action === "requestSessionSync") {
        requestSessionSyncFromPage();
        sendResponse({ requested: true });
      }
    });

    // On initial load: immediately show a scanning badge so the icon is always
    // visible, then replace it with the real result when the scan completes.
    const storageKey = `result_${rootDomain}`;
    chrome.storage.local.get([storageKey, "badgeForceVisible"], (stored) => {
      if (!dismissedDomains.has(rootDomain)) {
        showBanner(
          stored[storageKey] || { scanPending: true },
          rootDomain,
          false,
          !!stored.badgeForceVisible,
        );
      }
    });
  }

  /**
   * Returns the default bottom-left corner position.
   * Position always resets on page load — dragging during a session is
   * temporary and is never persisted to storage.
   */
  function getSavedPosition(callback) {
    const isMobile = window.innerWidth < 768;
    const offset = isMobile ? 12 : 28;
    callback({ offsetLeft: offset, offsetBottom: offset });
  }

  /**
   * Show a small floating SmartShield badge — draggable, position persists across tabs.
   * Color-coded: green = safe, orange = warning, red = phishing/high risk.
   * Hovering expands a compact tooltip with details.
   */
  function showBanner(result, domain, flash = false, persistent = false) {
    if (!result) return;

    // Claim this build slot — any concurrent build still waiting on
    // getSavedPosition (which is async) will see a stale ID and abort.
    const myBuildId = ++bannerBuildId;

    // Remove existing badge + cancel any in-flight build
    removeBanner();

    currentBannerDomain = domain;

    const isPending = !!result.scanPending;
    const isSafe = !isPending && !result.isSuspicious;
    const isHigh =
      !isPending && (result.riskLevel === "high" || result.riskScore >= 70);

    let glowColor, statusLabel, tooltipDesc;

    if (isPending) {
      glowColor = "#6b7280";
      statusLabel = "Scanning";
      tooltipDesc = "Analyzing page security…";
    } else if (isSafe) {
      glowColor = "#10b981";
      statusLabel = "Safe";
      tooltipDesc = "No threats detected";
    } else if (isHigh) {
      glowColor = "#ef4444";
      statusLabel = "Danger";
      tooltipDesc = "Phishing risk — avoid entering personal info";
    } else {
      glowColor = "#f59e0b";
      statusLabel = "Warning";
      tooltipDesc = "Suspicious signals — proceed with caution";
    }

    const logoURL = chrome.runtime.getURL("images/light-logo-extension.png");
    // Inline SVG verified checkmark icon for safe logo-swap
    const safeIconURL = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/%3E%3Cpolyline points='22 4 12 14.01 9 11.01'/%3E%3C/svg%3E`;
    // Inline SVG warning icon for suspicious logo-swap
    const warnIconURL = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E`;

    // Build the badge at the default bottom-left position
    getSavedPosition(({ offsetLeft, offsetBottom }) => {
      // Abort if a newer showBanner call has already taken over
      if (myBuildId !== bannerBuildId) return;

      const host = document.createElement("div");
      host.id = "smartshield-root";
      // Use left/bottom positioning — bottom-left corner
      host.style.cssText = `position:fixed;left:${offsetLeft}px;bottom:${offsetBottom}px;width:56px;height:56px;z-index:2147483647;pointer-events:none;`;

      // Track as pending until actually in the DOM
      pendingHostEl = host;
      document.body.appendChild(host);
      pendingHostEl = null; // now owned by the DOM / removeBanner

      const shadow = host.attachShadow({ mode: "closed" });

      const style = document.createElement("style");
      style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: block;
          width: 56px;
          height: 56px;
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

        /* ── Safe: logo swap with checkmark ── */
        ${
          isSafe
            ? `
        .ss-logo-main {
          animation: logoSwap 2.4s ease-in-out infinite;
        }
        .ss-logo-safe {
          animation: logoSwapSafe 2.4s ease-in-out infinite;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 26px;
          height: 26px;
          object-fit: contain;
          filter: drop-shadow(0 0 5px #34d399cc);
        }
        @keyframes logoSwap {
          0%      { opacity: 1; }
          35%     { opacity: 1; }
          50%     { opacity: 0; }
          65%     { opacity: 0; }
          100%    { opacity: 1; }
        }
        @keyframes logoSwapSafe {
          0%      { opacity: 0; }
          35%     { opacity: 0; }
          50%     { opacity: 1; }
          65%     { opacity: 1; }
          100%    { opacity: 0; }
        }`
            : ""
        }

        /* ── Suspicious: wobble + double pulse rings + glow throb + logo swap ── */
        ${
          !isSafe && !isHigh && !isPending
            ? `
        @keyframes wobble {
          0%,100% { transform: rotate(0deg) scale(1); }
          15%     { transform: rotate(-8deg) scale(1.05); }
          30%     { transform: rotate(6deg) scale(1.03); }
          45%     { transform: rotate(-5deg) scale(1.04); }
          60%     { transform: rotate(4deg) scale(1.02); }
          75%     { transform: rotate(-2deg) scale(1.01); }
        }
        .ss-badge { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), wobble 2.8s ease-in-out 1s infinite; }
        .ss-badge.dragging { animation: none; }
        @keyframes glowThrob {
          0%,100% { box-shadow: 0 0 14px ${glowColor}66, 0 2px 12px rgba(0,0,0,0.4); }
          50%     { box-shadow: 0 0 28px ${glowColor}cc, 0 0 48px ${glowColor}44, 0 2px 12px rgba(0,0,0,0.4); }
        }
        .ss-icon {
          animation: glowThrob 1.8s ease-in-out infinite;
        }
        .ss-icon::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid ${glowColor};
          opacity: 0;
          animation: pulseRing 2s ease-out infinite;
        }
        .ss-ring2 {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid ${glowColor};
          opacity: 0;
          animation: pulseRing 2s ease-out 1s infinite;
          pointer-events: none;
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .ss-logo-main {
          animation: logoSwap 2.4s ease-in-out infinite;
        }
        .ss-logo-warn {
          animation: logoSwapWarn 2.4s ease-in-out infinite;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 26px;
          height: 26px;
          object-fit: contain;
          filter: drop-shadow(0 0 5px ${glowColor}cc);
        }
        @keyframes logoSwap {
          0%      { opacity: 1; }
          35%     { opacity: 1; }
          50%     { opacity: 0; }
          65%     { opacity: 0; }
          100%    { opacity: 1; }
        }
        @keyframes logoSwapWarn {
          0%      { opacity: 0; }
          35%     { opacity: 0; }
          50%     { opacity: 1; }
          65%     { opacity: 1; }
          100%    { opacity: 0; }
        }`
            : ""
        }

        /* ── Dangerous: shake + triple sonar rings + border throb + always-shown close ── */
        ${
          isHigh
            ? `
        @keyframes dangerShake {
          0%,100% { transform: translateX(0); }
          10%     { transform: translateX(-4px) rotate(-2deg); }
          20%     { transform: translateX(4px)  rotate(2deg); }
          30%     { transform: translateX(-3px) rotate(-1deg); }
          40%     { transform: translateX(3px)  rotate(1deg); }
          50%     { transform: translateX(-2px); }
          60%     { transform: translateX(2px); }
        }
        .ss-badge { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), dangerShake 0.7s ease-in-out 0.5s infinite; }
        .ss-badge.dragging { animation: none; }
        @keyframes dangerGlow {
          0%,100% { box-shadow: 0 0 14px ${glowColor}88, 0 2px 12px rgba(0,0,0,0.4); }
          50%     { box-shadow: 0 0 36px ${glowColor}ff, 0 0 64px ${glowColor}55, 0 2px 12px rgba(0,0,0,0.6); border-color: #ff6b6b; }
        }
        .ss-icon {
          animation: dangerGlow 0.9s ease-in-out infinite;
        }
        .ss-icon::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2.5px solid ${glowColor};
          opacity: 0;
          animation: sonarRing 1.4s ease-out infinite;
        }
        .ss-ring2 {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid ${glowColor};
          opacity: 0;
          animation: sonarRing 1.4s ease-out 0.47s infinite;
          pointer-events: none;
        }
        .ss-ring3 {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1.5px solid ${glowColor};
          opacity: 0;
          animation: sonarRing 1.4s ease-out 0.93s infinite;
          pointer-events: none;
        }
        @keyframes sonarRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        /* Close button always visible on dangerous badge */
        .ss-close {
          opacity: 1 !important;
          background: rgba(239, 68, 68, 0.25) !important;
          border-color: ${glowColor} !important;
          color: ${glowColor} !important;
        }`
            : ""
        }

        /* Tooltip — hidden while dragging */
        .ss-tooltip {
          position: absolute;
          left: 52px;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
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

        /* 5-second countdown warning before auto-dismiss */
        @keyframes warningPulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%     { transform: scale(0.88); opacity: 0.55; }
        }
        .ss-badge.expiring .ss-icon {
          animation: warningPulse 0.9s ease-in-out infinite;
        }
        .ss-badge.expiring .ss-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2.5px solid ${glowColor};
          animation: countdownRing 5s linear forwards;
          transform-origin: center;
        }
        @keyframes countdownRing {
          from { opacity: 0.9; transform: scale(1.0) rotate(0deg);   clip-path: inset(0 0 0 0 round 50%); }
          to   { opacity: 0;   transform: scale(0.6) rotate(-180deg); }
        }

        /* Spiral-out dismiss */
        @keyframes spiralOut {
          0%   { transform: scale(1)   rotate(0deg)   translateY(0);  opacity: 1; }
          60%  { transform: scale(0.6) rotate(-90deg) translateY(6px); opacity: 0.4; }
          100% { transform: scale(0)   rotate(-180deg) translateY(16px); opacity: 0; }
        }
        .ss-badge.dismiss-spiral {
          animation: spiralOut 0.5s cubic-bezier(0.55, 0, 1, 0.45) forwards !important;
        }
      `;

      const badge = document.createElement("div");
      badge.className = isPending ? "ss-badge pending" : "ss-badge";
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
          <img class="${isSafe ? "ss-logo-main" : !isSafe && !isHigh && !isPending ? "ss-logo-main" : ""}" src="${logoURL}" alt="SmartShield" />
          ${isSafe ? `<img class="ss-logo-safe" src="${safeIconURL}" alt="Safe" />` : ""}
          ${!isSafe && !isHigh && !isPending ? `<img class="ss-logo-warn" src="${warnIconURL}" alt="Warning" />` : ""}
          ${!isSafe && !isPending ? '<span class="ss-ring2"></span>' : ""}
          ${isHigh ? '<span class="ss-ring3"></span>' : ""}
        </div>
        <button class="ss-close" title="Dismiss">✕</button>
        <span class="ss-drag-hint">drag to move</span>
      `;

      shadow.appendChild(style);
      shadow.appendChild(badge);

      // Flash / locate animation when triggered from "Show Badge on Page" button
      if (flash) {
        setTimeout(() => {
          badge.classList.add("flash");
          badge.addEventListener(
            "animationend",
            () => badge.classList.remove("flash"),
            { once: true },
          );
        }, 160);
      }

      // ── Drag logic ──────────────────────────────────────────────
      // Remove any stale drag handlers from a previous badge instance
      if (activeDragHandlers) {
        window.removeEventListener("mousemove", activeDragHandlers.move, {
          capture: true,
        });
        window.removeEventListener("mouseup", activeDragHandlers.up, {
          capture: true,
        });
        activeDragHandlers = null;
      }

      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let hasMoved = false;

      // mousedown lives inside the shadow DOM — fires reliably
      badge.addEventListener("mousedown", (e) => {
        // Don't drag when clicking close button
        if (e.target.classList.contains("ss-close")) return;
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        hasMoved = false;
        const rect = host.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        badge.classList.add("dragging");
        document.documentElement.style.userSelect = "none";
        document.documentElement.style.pointerEvents = "none";
        host.style.pointerEvents = "auto";
      });

      // Move & up go on WINDOW with capture:true so they fire even if the
      // page calls stopPropagation on its own mousemove/mouseup handlers
      const onMouseMove = (e) => {
        if (!isDragging) return;
        hasMoved = true;
        // Calculate new position from bottom-left corner
        const newLeft = Math.min(
          Math.max(0, e.clientX - dragOffsetX),
          window.innerWidth - 56,
        );
        const newBottom = Math.min(
          Math.max(0, window.innerHeight - e.clientY - dragOffsetY),
          window.innerHeight - 56,
        );
        host.style.left = newLeft + "px";
        host.style.bottom = newBottom + "px";
      };

      const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        badge.classList.remove("dragging");
        document.documentElement.style.userSelect = "";
        document.documentElement.style.pointerEvents = "";
        host.style.pointerEvents = "none";

        // Treat as click if barely moved — open the extension popup on report tab
        if (!hasMoved) {
          chrome.storage.local.set({ openOnTab: "report" }, () => {
            chrome.runtime.sendMessage({ action: "openPopup" });
          });
        }
      };

      window.addEventListener("mousemove", onMouseMove, { capture: true });
      window.addEventListener("mouseup", onMouseUp, { capture: true });
      activeDragHandlers = { move: onMouseMove, up: onMouseUp };

      // Reset badge to default bottom-left corner when entering/exiting fullscreen
      const resetToSavedPosition = () => {
        const isMobile = window.innerWidth < 768;
        const offset = isMobile ? 12 : 28;
        host.style.left = offset + "px";
        host.style.bottom = offset + "px";
      };

      document.addEventListener("fullscreenchange", resetToSavedPosition);
      document.addEventListener("webkitfullscreenchange", resetToSavedPosition);
      document.addEventListener("mozfullscreenchange", resetToSavedPosition);
      document.addEventListener("MSFullscreenChange", resetToSavedPosition);
      host._resetToSavedPosition = resetToSavedPosition;

      // Reset badge to original bottom-left corner on window resize,
      // regardless of where the user may have dragged it during the session.
      const onWindowResize = () => {
        const isMobile = window.innerWidth < 768;
        const offset = isMobile ? 12 : 28;
        host.style.left = offset + "px";
        host.style.bottom = offset + "px";
      };
      window.addEventListener("resize", onWindowResize);
      host._resizeHandler = onWindowResize; // Store for cleanup
      // ────────────────────────────────────────────────────────────

      // Dismiss on close button click — only explicit close marks domain as dismissed
      const closeBtn = badge.querySelector(".ss-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dismissedDomains.add(domain); // intentional user dismiss
          currentBannerDomain = null;
          chrome.storage.local.remove("badgeForceVisible"); // clear persistent flag
          // Cancel any pending auto-dismiss timers
          if (host._warningTimer) clearTimeout(host._warningTimer);
          if (host._dismissTimer) clearTimeout(host._dismissTimer);
          if (activeDragHandlers) {
            window.removeEventListener("mousemove", activeDragHandlers.move, {
              capture: true,
            });
            window.removeEventListener("mouseup", activeDragHandlers.up, {
              capture: true,
            });
            activeDragHandlers = null;
          }
          dismissBadge(host, badge);
        });
      }

      // Auto-dismiss timers — duration depends on risk level:
      //   Safe      → 30s (warning at 25s)
      //   Suspicious→ 60s (warning at 55s)
      //   Dangerous → never auto-dismisses; stays until user closes it or leaves the page
      if (!isHigh) {
        const totalMs = isSafe ? 30000 : 60000;
        const warningMs = isSafe ? 25000 : 55000;

        const warningTimer = setTimeout(() => {
          if (host.parentNode) {
            badge.classList.add("expiring");
          }
        }, warningMs);

        const dismissTimer = setTimeout(() => {
          if (host.parentNode) {
            // Mark as dismissed so background re-activation won't re-show it
            dismissedDomains.add(domain);
            currentBannerDomain = null;
            dismissBadge(host, badge);
          }
        }, totalMs);

        // Store timers so close button and removeBanner can cancel them
        host._warningTimer = warningTimer;
        host._dismissTimer = dismissTimer;
      }
      // Dangerous badge: no timers set — persists until user explicitly closes it
    }); // end getSavedPosition
  }

  function removeBanner() {
    // Also abort any in-flight (not-yet-attached) badge build
    if (pendingHostEl) {
      pendingHostEl.remove();
      pendingHostEl = null;
    }
    const existing = document.getElementById("smartshield-root");
    if (existing) {
      // Cancel any pending auto-dismiss timers before removing
      if (existing._warningTimer) clearTimeout(existing._warningTimer);
      if (existing._dismissTimer) clearTimeout(existing._dismissTimer);
      // Clean up all listeners if attached
      if (existing._resizeHandler) {
        window.removeEventListener("resize", existing._resizeHandler);
      }
      if (existing._resetToSavedPosition) {
        document.removeEventListener(
          "fullscreenchange",
          existing._resetToSavedPosition,
        );
        document.removeEventListener(
          "webkitfullscreenchange",
          existing._resetToSavedPosition,
        );
        document.removeEventListener(
          "mozfullscreenchange",
          existing._resetToSavedPosition,
        );
        document.removeEventListener(
          "MSFullscreenChange",
          existing._resetToSavedPosition,
        );
      }
      existing.remove();
    }
    currentBannerDomain = null;
    activeBadgeEl = null;
  }

  function dismissBadge(host, badge) {
    badge.classList.remove("expiring");
    badge.classList.add("dismiss-spiral");
    badge.addEventListener(
      "animationend",
      () => {
        if (host.parentNode) host.remove();
      },
      { once: true },
    );
    setTimeout(() => {
      if (host.parentNode) host.remove();
    }, 550);
  }
})();
