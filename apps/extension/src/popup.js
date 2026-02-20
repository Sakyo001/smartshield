/**
 * Popup Script - SmartShield
 * Scans by ROOT DOMAIN (not full URL) for speed.
 * Details (WHOIS/DNS/SSL) are fetched lazily when user clicks expand.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ── DOM Elements ──
  const safeModeToggle = document.getElementById("safe-mode-toggle");
  const statusIcon = document.getElementById("status-icon");
  const statusTitle = document.getElementById("status-title");
  const statusDesc = document.getElementById("status-desc");
  const scanWarnings = document.getElementById("scan-warnings");
  const warningList = document.getElementById("warning-list");
  const detailsContainer = document.getElementById("details-container");
  const urlDisplay = document.getElementById("url-display");
  const urlText = document.getElementById("url-text");
  const metricsGrid = document.getElementById("metrics-grid");

  // Alert Modal
  const alertModal = document.getElementById("alert-modal");
  const alertContent = document.getElementById("alert-content");
  const alertTitle = document.getElementById("alert-title");
  const alertMessage = document.getElementById("alert-message");
  const alertLeaveBtn = document.getElementById("alert-leave");
  const alertDismissBtn = document.getElementById("alert-dismiss");

  // Detail toggles
  const whoisToggle = document.getElementById("whois-toggle");
  const dnsToggle = document.getElementById("dns-toggle");
  const sslToggle = document.getElementById("ssl-toggle");

  // State
  let currentUrl = null;
  let currentRootDomain = null;
  let detailsFetched = false;

  // ── Helper: extract root domain ──
  function getRootDomain(url) {
    try {
      const u = new URL(url);
      return u.protocol + '//' + u.hostname;
    } catch {
      return url;
    }
  }

  // ── Alert Modal — fully dismiss on click ──
  alertLeaveBtn.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: "https://www.google.com" });
    alertModal.classList.add("hidden");
    alertModal.style.display = "none";
  });
  alertDismissBtn.addEventListener("click", () => {
    alertModal.classList.add("hidden");
    alertModal.style.display = "none";
  });

  // ── Icons ──
  const Icons = {
    search: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    safe: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    warning: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    danger: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    error: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
  };

  // ── Initialize: only scan current page ──
  initializeApp();

  async function initializeApp() {
    // Load Safe Mode state
    const result = await chrome.storage.local.get(["safeModeEnabled"]);
    const safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
    safeModeToggle.checked = safeModeEnabled;

    // Scan current page immediately
    scanCurrentPage();
  }

  // ── Safe Mode Toggle ──
  safeModeToggle.addEventListener("change", async (e) => {
    const isEnabled = e.target.checked;
    await chrome.storage.local.set({ safeModeEnabled: isEnabled });
    chrome.runtime.sendMessage({ action: "safeModeChanged", enabled: isEnabled });
    if (isEnabled) scanCurrentPage();
  });

  // ── Detail section toggles (lazy-fetch details on first open) ──
  if (whoisToggle) whoisToggle.addEventListener("click", () => { lazyLoadDetails(); toggleSection("whois-data", whoisToggle); });
  if (dnsToggle) dnsToggle.addEventListener("click", () => { lazyLoadDetails(); toggleSection("dns-data", dnsToggle); });
  if (sslToggle) sslToggle.addEventListener("click", () => { lazyLoadDetails(); toggleSection("ssl-data", sslToggle); });

  function toggleSection(sectionId, button) {
    const section = document.getElementById(sectionId);
    if (section.style.display === "none") {
      section.style.display = "block";
      button.classList.add("open");
    } else {
      section.style.display = "none";
      button.classList.remove("open");
    }
  }

  // ── Lazy-load details from background (only once per popup session) ──
  function lazyLoadDetails() {
    if (detailsFetched || !currentRootDomain) return;
    detailsFetched = true;

    // Show loading state in detail sections
    ["whois-data", "dns-data", "ssl-data"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;">Loading...</p>';
    });

    chrome.runtime.sendMessage({ action: "getDetails", url: currentRootDomain }, (details) => {
      if (chrome.runtime.lastError || !details) {
        ["whois-data", "dns-data", "ssl-data"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;">Could not load details</p>';
        });
        return;
      }
      populateDetails(details);
    });
  }

  // ── Scan ONLY the current page ──
  async function scanCurrentPage() {
    // Show scanning state
    statusIcon.classList.add("scanning");
    statusIcon.innerHTML = Icons.search;
    statusTitle.style.color = "var(--text-main)";
    statusTitle.textContent = "Scanning...";
    statusDesc.textContent = "Analyzing page content and domain data...";
    scanWarnings.classList.add("hidden");
    detailsContainer.classList.add("hidden");
    metricsGrid.classList.add("hidden");

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab || !tab.url) {
        statusIcon.classList.remove("scanning");
        displayError("Unable to access current page URL.");
        return;
      }

      currentUrl = tab.url;
      currentRootDomain = getRootDomain(tab.url);
      displayURL(tab.url);

      // Send scan request using root domain (deduped + cached in background)
      chrome.runtime.sendMessage({ action: "checkURL", url: currentRootDomain }, (result) => {
        statusIcon.classList.remove("scanning");

        if (chrome.runtime.lastError) {
          displayError("Scan service is temporarily unavailable. Please try again.");
          return;
        }
        if (!result) {
          displayError("Unable to complete scan. Please check your connection.");
          return;
        }

        displayResult(result);
      });
    } catch (error) {
      statusIcon.classList.remove("scanning");
      displayError("An error occurred during the scan.");
    }
  }

  // ── Display URL ──
  function displayURL(url) {
    try {
      const u = new URL(url);
      urlText.textContent = u.hostname + u.pathname;
      urlDisplay.classList.remove("hidden");
    } catch (e) { /* ignore */ }
  }

  // ── Display result ──
  function displayResult(result) {
    if (!result) return;

    const statusCard = document.querySelector(".status-card");
    const riskScoreText = document.getElementById("risk-score-text");
    const riskCirclePath = document.getElementById("risk-circle-path");
    const confidenceScoreEl = document.getElementById("confidence-score");
    const riskScore = result.riskScore || 0;
    const confidence = result.confidence || 0;

    // Show metrics
    metricsGrid.classList.remove("hidden");

    // Gauge
    if (riskScoreText) riskScoreText.textContent = riskScore.toString();
    if (riskCirclePath) {
      setTimeout(() => {
        riskCirclePath.setAttribute("stroke-dasharray", `${riskScore}, 100`);
        if (riskScore >= 70) riskCirclePath.style.stroke = "var(--danger)";
        else if (riskScore >= 40) riskCirclePath.style.stroke = "var(--warning)";
        else riskCirclePath.style.stroke = "var(--success)";
      }, 50);
    }

    if (confidence) {
      confidenceScoreEl.textContent = `${Math.round(confidence)}%`;
      if (confidence > 80) confidenceScoreEl.style.color = "var(--success)";
      else if (confidence > 50) confidenceScoreEl.style.color = "var(--warning)";
      else confidenceScoreEl.style.color = "var(--text-muted)";
    } else {
      confidenceScoreEl.textContent = "N/A";
    }

    if (result.isSuspicious) {
      if (result.riskLevel === "high" || riskScore >= 70) {
        statusIcon.innerHTML = Icons.danger;
        statusTitle.textContent = "High Risk Detected";
        statusTitle.style.color = "var(--danger)";
        statusDesc.textContent = "This site shows strong signs of phishing. Do not enter personal information.";
        statusCard.className = "status-card danger";

        showAlertModal(
          "Phishing Website Detected",
          "This website has been identified as a phishing attempt. Do not enter any personal information, passwords, or credit card details.",
          "danger"
        );
      } else {
        statusIcon.innerHTML = Icons.warning;
        statusTitle.textContent = "Suspicious Activity";
        statusTitle.style.color = "var(--warning)";
        statusDesc.textContent = "This site has some suspicious characteristics. Proceed with caution.";
        statusCard.className = "status-card warning";

        showAlertModal(
          "Suspicious Website",
          "This website shows suspicious characteristics. Exercise caution and avoid entering sensitive information.",
          "warning"
        );
      }

      if (result.warnings && result.warnings.length > 0) {
        scanWarnings.classList.remove("hidden");
        warningList.innerHTML = result.warnings.map(w => `<div style="margin-bottom:4px;">• ${w}</div>`).join("");
      }
    } else {
      statusIcon.innerHTML = Icons.safe;
      statusTitle.textContent = "Site is Safe";
      statusTitle.style.color = "var(--success)";
      statusDesc.textContent = "This website appears safe to use.";
      statusCard.className = "status-card safe";
      scanWarnings.classList.add("hidden");
    }

    // Show the details toggle section (data loads lazily on click)
    detailsContainer.classList.remove("hidden");

    // If details already came with the result (unlikely now), populate
    if (result.details) {
      detailsFetched = true;
      populateDetails(result.details);
    }
  }

  // ── Populate detail sections ──
  function populateDetails(details) {
    if (!details) return;

    if (details.whois) {
      document.getElementById("whois-data").innerHTML = `
        <div class="detail-row"><span class="detail-label">Registrar:</span><span class="detail-value">${details.registrar || "Unknown"}</span></div>
        <div class="detail-row"><span class="detail-label">Created:</span><span class="detail-value">${details.creationDate || "Unknown"}</span></div>
        <div class="detail-row"><span class="detail-label">Expires:</span><span class="detail-value">${details.expirationDate || "Unknown"}</span></div>
      `;
    }

    if (details.dns) {
      let dnsHTML = "";
      if (details.dns.A && details.dns.A.length > 0) {
        dnsHTML += `<div class="detail-row"><span class="detail-label">A Records:</span><span class="detail-value">${details.dns.A.join(", ")}</span></div>`;
      }
      if (details.dns.MX && details.dns.MX.length > 0) {
        dnsHTML += `<div class="detail-row"><span class="detail-label">MX Records:</span><span class="detail-value">${details.dns.MX.join(", ")}</span></div>`;
      }
      document.getElementById("dns-data").innerHTML = dnsHTML || "<p>No DNS records available</p>";
    }

    if (details.ssl) {
      if (details.ssl.error) {
        document.getElementById("ssl-data").innerHTML = `<p>${details.ssl.error}</p>`;
      } else {
        document.getElementById("ssl-data").innerHTML = `
          <div class="detail-row"><span class="detail-label">Issuer:</span><span class="detail-value">${details.ssl.issuer || "Unknown"}</span></div>
          <div class="detail-row"><span class="detail-label">Valid Until:</span><span class="detail-value">${details.ssl.valid_to || "Unknown"}</span></div>
        `;
      }
    }
  }

  // ── Display error ──
  function displayError(message) {
    statusIcon.innerHTML = Icons.error;
    statusTitle.textContent = "Scan Error";
    statusTitle.style.color = "var(--danger)";
    statusDesc.textContent = message;
    scanWarnings.classList.add("hidden");
    detailsContainer.classList.add("hidden");
    metricsGrid.classList.add("hidden");
  }

  // ── Alert modal ──
  function showAlertModal(title, message, type = "danger") {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertContent.className = type === "warning" ? "alert-content warning" : "alert-content danger";
    alertModal.classList.remove("hidden");
    alertModal.style.display = "";
  }
});
