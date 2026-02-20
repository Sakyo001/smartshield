/**
 * Popup Script - SmartShield
 * Onboarding flow + main app UI.
 * Scans by ROOT DOMAIN for speed; details lazy-loaded on accordion open.
 */

document.addEventListener("DOMContentLoaded", () => {

  // ─────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────
  const onboardingEl = document.getElementById("onboarding");
  const appEl        = document.getElementById("app");

  const obSlides = [
    document.getElementById("ob-slide-1"),
    document.getElementById("ob-slide-2"),
    document.getElementById("ob-slide-3"),
  ];
  const obDots = [
    document.getElementById("dot-1"),
    document.getElementById("dot-2"),
    document.getElementById("dot-3"),
  ];
  const obNextBtn    = document.getElementById("ob-next");
  const obSkipBtn    = document.getElementById("ob-skip");
  const obSafeToggle = document.getElementById("ob-safe-mode");

  let currentSlide = 0; // 0-indexed

  function goToSlide(idx) {
    obSlides.forEach((s, i) => s.classList.toggle("active", i === idx));
    obDots.forEach((d, i)  => d.classList.toggle("active", i === idx));
    currentSlide = idx;
    if (idx === obSlides.length - 1) {
      obNextBtn.textContent = "Get Started";
    } else {
      obNextBtn.textContent = "Continue";
    }
  }

  function showOnboarding() {
    onboardingEl.classList.remove("hidden");
    appEl.classList.add("hidden");
    goToSlide(0);
  }

  function showApp() {
    onboardingEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    initMainApp();
  }

  async function completeOnboarding() {
    const safeModeVal = obSafeToggle ? obSafeToggle.checked : true;
    await chrome.storage.local.set({ onboardingComplete: true, safeModeEnabled: safeModeVal });
    showApp();
  }

  if (obNextBtn) {
    obNextBtn.addEventListener("click", () => {
      if (currentSlide < obSlides.length - 1) {
        goToSlide(currentSlide + 1);
      } else {
        completeOnboarding();
      }
    });
  }
  if (obSkipBtn) {
    obSkipBtn.addEventListener("click", completeOnboarding);
  }

  // Boot: check if onboarding already done
  chrome.storage.local.get(["onboardingComplete"], (r) => {
    if (r.onboardingComplete) {
      showApp();
    } else {
      showOnboarding();
    }
  });

  // ─────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────
  function initMainApp() {
    // ── DOM refs ──
    const safeModeToggle  = document.getElementById("safe-mode-toggle");
    const statusCard      = document.getElementById("status-card");
    const statusIcon      = document.getElementById("status-icon");
    const statusTitle     = document.getElementById("status-title");
    const statusDesc      = document.getElementById("status-desc");
    const urlDisplay      = document.getElementById("url-display");
    const urlText         = document.getElementById("url-text");
    const metricsGrid     = document.getElementById("metrics-grid");
    const riskScoreVal    = document.getElementById("risk-score-val");
    const riskBarFill     = document.getElementById("risk-bar-fill");
    const riskSub         = document.getElementById("risk-sub");
    const confidenceScore = document.getElementById("confidence-score");
    const scanWarnings    = document.getElementById("scan-warnings");
    const warningList     = document.getElementById("warning-list");
    const detailsContainer = document.getElementById("details-container");

    const whoisBlock  = document.getElementById("whois-block");
    const dnsBlock    = document.getElementById("dns-block");
    const sslBlock    = document.getElementById("ssl-block");
    const whoisToggle = document.getElementById("whois-toggle");
    const dnsToggle   = document.getElementById("dns-toggle");
    const sslToggle   = document.getElementById("ssl-toggle");

    const alertModal   = document.getElementById("alert-modal");
    const alertContent = document.getElementById("alert-content");
    const alertTitle   = document.getElementById("alert-title");
    const alertMessage = document.getElementById("alert-message");
    const alertLeaveBtn   = document.getElementById("alert-leave");
    const alertDismissBtn = document.getElementById("alert-dismiss");

    // ── State ──
    let currentRootDomain = null;
    let detailsFetched = false;

    // ── Icons ──
    const Icons = {
      search: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      safe:   `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
      warn:   `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      error:  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    };

    // ── Helper ──
    function getRootDomain(url) {
      try {
        const u = new URL(url);
        return u.protocol + '//' + u.hostname;
      } catch { return url; }
    }

    // ── Safe Mode toggle init ──
    chrome.storage.local.get(["safeModeEnabled"], (r) => {
      const enabled = r.safeModeEnabled !== undefined ? r.safeModeEnabled : true;
      if (safeModeToggle) safeModeToggle.checked = enabled;
    });
    if (safeModeToggle) {
      safeModeToggle.addEventListener("change", async (e) => {
        const isEnabled = e.target.checked;
        await chrome.storage.local.set({ safeModeEnabled: isEnabled });
        chrome.runtime.sendMessage({ action: "safeModeChanged", enabled: isEnabled });
      });
    }

    // ── Alert modal buttons ──
    if (alertLeaveBtn) {
      alertLeaveBtn.addEventListener("click", async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: "https://www.google.com" });
        alertModal.classList.add("hidden");
      });
    }
    if (alertDismissBtn) {
      alertDismissBtn.addEventListener("click", () => alertModal.classList.add("hidden"));
    }

    // ── Accordion toggles (lazy detail load) ──
    function toggleBlock(block, toggle) {
      if (!block) return;
      const isOpen = block.classList.toggle("open");
      if (isOpen) lazyLoadDetails();
    }
    if (whoisToggle) whoisToggle.addEventListener("click", () => toggleBlock(whoisBlock, whoisToggle));
    if (dnsToggle)   dnsToggle.addEventListener("click",   () => toggleBlock(dnsBlock,   dnsToggle));
    if (sslToggle)   sslToggle.addEventListener("click",   () => toggleBlock(sslBlock,   sslToggle));

    // ── Lazy-load detail data ──
    function lazyLoadDetails() {
      if (detailsFetched || !currentRootDomain) return;
      detailsFetched = true;
      ["whois-data", "dns-data", "ssl-data"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="detail-placeholder">Loading…</div>';
      });
      chrome.runtime.sendMessage({ action: "getDetails", url: currentRootDomain }, (details) => {
        if (chrome.runtime.lastError || !details) {
          ["whois-data", "dns-data", "ssl-data"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="detail-placeholder">Could not load data</div>';
          });
          return;
        }
        populateDetails(details);
      });
    }

    // ── Scan current page ──
    async function scanCurrentPage() {
      // Reset UI to scanning state
      if (statusIcon) {
        statusIcon.className = "status-icon scanning";
        statusIcon.innerHTML = Icons.search;
      }
      if (statusCard) statusCard.className = "status-card";
      if (statusTitle) { statusTitle.textContent = "Scanning…"; statusTitle.removeAttribute("style"); }
      if (statusDesc)  { statusDesc.textContent  = "Analyzing domain reputation and page content…"; }
      if (scanWarnings)    scanWarnings.classList.add("hidden");
      if (detailsContainer) detailsContainer.classList.add("hidden");
      if (metricsGrid)     metricsGrid.classList.add("hidden");

      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (!tab || !tab.url) { displayError("Unable to access the current page URL."); return; }

        currentRootDomain = getRootDomain(tab.url);
        displayURL(tab.url);

        chrome.runtime.sendMessage({ action: "checkURL", url: currentRootDomain }, (result) => {
          if (statusIcon) statusIcon.classList.remove("scanning");
          if (chrome.runtime.lastError) { displayError("Scan service temporarily unavailable. Try again."); return; }
          if (!result)                  { displayError("Unable to complete scan. Check your connection."); return; }
          displayResult(result);
        });
      } catch {
        if (statusIcon) statusIcon.classList.remove("scanning");
        displayError("An unexpected error occurred during the scan.");
      }
    }

    // ── Display URL chip ──
    function displayURL(url) {
      try {
        const u = new URL(url);
        if (urlText)    urlText.textContent = u.hostname + (u.pathname !== "/" ? u.pathname : "");
        if (urlDisplay) urlDisplay.classList.remove("hidden");
      } catch { /* ignore */ }
    }

    // ── Render scan results ──
    function displayResult(result) {
      if (!result) return;
      const riskScore = result.riskScore || 0;
      const confidence = result.confidence || 0;

      // Metrics row
      if (metricsGrid) metricsGrid.classList.remove("hidden");
      if (riskScoreVal) riskScoreVal.textContent = riskScore;
      if (riskBarFill) {
        setTimeout(() => { riskBarFill.style.width = `${riskScore}%`; }, 50);
        if      (riskScore >= 70) riskBarFill.style.background = "var(--danger)";
        else if (riskScore >= 40) riskBarFill.style.background = "var(--warning)";
        else                      riskBarFill.style.background = "var(--success)";
      }
      if (riskSub) {
        if      (riskScore >= 70) riskSub.textContent = "High Risk";
        else if (riskScore >= 40) riskSub.textContent = "Moderate Risk";
        else                      riskSub.textContent = "Low Risk";
      }
      if (confidenceScore) {
        confidenceScore.textContent = confidence ? `${Math.round(confidence)}%` : "N/A";
      }

      // Status card
      if (result.isSuspicious) {
        if (result.riskLevel === "high" || riskScore >= 70) {
          if (statusIcon)  { statusIcon.className = "status-icon danger"; statusIcon.innerHTML = Icons.danger; }
          if (statusCard)  statusCard.className = "status-card danger";
          if (statusTitle) { statusTitle.textContent = "High Risk Detected"; statusTitle.style.color = "var(--danger)"; }
          if (statusDesc)  statusDesc.textContent = "Strong signs of phishing. Do not enter personal information.";
          showAlertModal(
            "Phishing Website Detected",
            "This site has been flagged as a phishing attempt. Do not enter passwords, payment info, or personal data.",
            "danger"
          );
        } else {
          if (statusIcon)  { statusIcon.className = "status-icon warn"; statusIcon.innerHTML = Icons.warn; }
          if (statusCard)  statusCard.className = "status-card warn";
          if (statusTitle) { statusTitle.textContent = "Suspicious Activity"; statusTitle.style.color = "var(--warning)"; }
          if (statusDesc)  statusDesc.textContent = "This site has suspicious characteristics. Proceed with caution.";
          showAlertModal(
            "Suspicious Website",
            "This site shows suspicious patterns. Avoid entering sensitive information.",
            "warn"
          );
        }
        if (result.warnings && result.warnings.length > 0) {
          if (scanWarnings) scanWarnings.classList.remove("hidden");
          if (warningList)  warningList.innerHTML = result.warnings.map(w => `<div>• ${w}</div>`).join("");
        }
      } else {
        if (statusIcon)  { statusIcon.className = "status-icon safe"; statusIcon.innerHTML = Icons.safe; }
        if (statusCard)  statusCard.className = "status-card safe";
        if (statusTitle) { statusTitle.textContent = "Site is Safe"; statusTitle.style.color = "var(--success)"; }
        if (statusDesc)  statusDesc.textContent = "No threats detected. This website appears legitimate.";
        if (scanWarnings) scanWarnings.classList.add("hidden");
      }

      // Show details accordion
      if (detailsContainer) detailsContainer.classList.remove("hidden");
      if (result.details) { detailsFetched = true; populateDetails(result.details); }
    }

    // ── Populate WHOIS / DNS / SSL accordion bodies ──
    function populateDetails(details) {
      if (!details) return;

      const whoisData = document.getElementById("whois-data");
      const dnsData   = document.getElementById("dns-data");
      const sslData   = document.getElementById("ssl-data");

      if (details.whois && whoisData) {
        const w = details.whois;
        whoisData.innerHTML = rows([
          ["Registrar",  w.registrar     || "Unknown"],
          ["Created",    w.creationDate  || "Unknown"],
          ["Expires",    w.expirationDate|| "Unknown"],
          ["Country",    w.country       || "Unknown"],
        ]);
      }

      if (details.dns && dnsData) {
        const d = details.dns;
        const pairs = [];
        if (d.A   && d.A.length)  pairs.push(["A Records",  d.A.join(", ")]);
        if (d.MX  && d.MX.length) pairs.push(["MX Records", d.MX.join(", ")]);
        if (d.NS  && d.NS.length) pairs.push(["NS Records", d.NS.join(", ")]);
        if (d.TXT && d.TXT.length) pairs.push(["TXT", d.TXT.slice(0,2).join(" | ")]);
        dnsData.innerHTML = pairs.length ? rows(pairs) : '<div class="detail-placeholder">No DNS records available</div>';
      }

      if (details.ssl && sslData) {
        const s = details.ssl;
        if (s.error) {
          sslData.innerHTML = `<div class="detail-placeholder">${s.error}</div>`;
        } else {
          sslData.innerHTML = rows([
            ["Issuer",     s.issuer    || "Unknown"],
            ["Valid From", s.valid_from|| "Unknown"],
            ["Valid Until",s.valid_to  || "Unknown"],
            ["Subject",    s.subject   || "Unknown"],
          ]);
        }
      }
    }

    function rows(pairs) {
      return pairs.map(([label, val]) =>
        `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${val}</span></div>`
      ).join("");
    }

    // ── Error state ──
    function displayError(message) {
      if (statusIcon)  { statusIcon.className = "status-icon"; statusIcon.innerHTML = Icons.error; }
      if (statusCard)  statusCard.className = "status-card";
      if (statusTitle) { statusTitle.textContent = "Scan Error"; statusTitle.style.color = "var(--danger)"; }
      if (statusDesc)  statusDesc.textContent = message;
      if (scanWarnings)     scanWarnings.classList.add("hidden");
      if (detailsContainer) detailsContainer.classList.add("hidden");
      if (metricsGrid)      metricsGrid.classList.add("hidden");
    }

    // ── Alert modal ──
    function showAlertModal(title, message, type = "danger") {
      if (!alertModal) return;
      if (alertTitle)   alertTitle.textContent   = title;
      if (alertMessage) alertMessage.textContent = message;
      if (alertContent) alertContent.className   = `modal-box ${type}`;
      alertModal.classList.remove("hidden");
    }

    // ── Kick off scan ──
    scanCurrentPage();
  } // end initMainApp

});
