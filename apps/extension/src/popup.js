/**
 * Popup Script - SmartShield
 * Onboarding flow + main app UI.
 * Scans by ROOT DOMAIN for speed; details lazy-loaded on accordion open.
 */

document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_ORIGIN = "https://smartshield.it.com";
  const WHOIS_API_URL = "https://web-production-568aa.up.railway.app";
  // ─────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────
  const onboardingEl = document.getElementById("onboarding");
  const appEl = document.getElementById("app");

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
  const obNextBtn = document.getElementById("ob-next");
  const obSkipBtn = document.getElementById("ob-skip");
  const obSafeToggle = document.getElementById("ob-safe-mode");

  let currentSlide = 0; // 0-indexed

  function goToSlide(idx) {
    obSlides.forEach((s, i) => s.classList.toggle("active", i === idx));
    obDots.forEach((d, i) => d.classList.toggle("active", i === idx));
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
    await chrome.storage.local.set({
      onboardingComplete: true,
      safeModeEnabled: safeModeVal,
    });
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
  // Make dots clickable for navigation
  obDots.forEach((dot, idx) => {
    dot.addEventListener("click", () => goToSlide(idx));
  });
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
    const safeModeToggle = document.getElementById("safe-mode-toggle");
    const statusCard = document.getElementById("status-card");
    const statusIcon = document.getElementById("status-icon");
    const statusTitle = document.getElementById("status-title");
    const statusDesc = document.getElementById("status-desc");
    const urlDisplay = document.getElementById("url-display");
    const urlText = document.getElementById("url-text");
    const metricsGrid = document.getElementById("metrics-grid");
    const riskScoreVal = document.getElementById("risk-score-val");
    const riskBarFill = document.getElementById("risk-bar-fill");
    const riskSub = document.getElementById("risk-sub");
    const confidenceScore = document.getElementById("confidence-score");
    const scanWarnings = document.getElementById("scan-warnings");
    const warningList = document.getElementById("warning-list");
    const detailsContainer = document.getElementById("details-container");

    const spContent = document.getElementById("sp-content");

    const alertModal = document.getElementById("alert-modal");
    const alertContent = document.getElementById("alert-content");
    const alertTitle = document.getElementById("alert-title");
    const alertMessage = document.getElementById("alert-message");
    const alertLeaveBtn = document.getElementById("alert-leave");
    const alertDismissBtn = document.getElementById("alert-dismiss");

    // ── Community Feedback Section ──
    const communitySection = document.getElementById("community-section");
    const communityLoginPrompt = document.getElementById(
      "community-login-prompt",
    );
    const communityContentSection = document.getElementById(
      "community-content-section",
    );
    const communityLoginBtn = document.getElementById("community-login-btn");
    const communityViewFeedbackBtn = document.getElementById(
      "community-view-feedback-btn",
    );
    const communitySubmitCommentBtn = document.getElementById(
      "community-submit-comment-btn",
    );
    const communityCommentInput = document.getElementById(
      "community-comment-input",
    );
    const communityCommentStatus = document.getElementById(
      "community-comment-status",
    );
    const communityFlagButtons = document.querySelectorAll(".community-flag-btn");
    const communityFeedbackResults = document.getElementById(
      "community-feedback-results",
    );
    const communityFeedbackState = document.getElementById(
      "community-feedback-state",
    );
    const communityFeedbackList = document.getElementById(
      "community-feedback-list",
    );

    // ── Theme toggle ──
    const themeToggleBtn = document.getElementById("theme-toggle");

    // ── Tab refs ──
    const tabOverview = document.getElementById("tab-overview");
    const tabReport = document.getElementById("tab-report");
    const tabBtns = document.querySelectorAll(".tab-btn");
    const reportTabBadge = document.getElementById("report-tab-badge");
    const reportNudge = document.getElementById("report-nudge");
    const viewReportBtn = document.getElementById("view-report-btn");

    // ── Tab Switching ──
    function switchTab(tabId) {
      tabBtns.forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tab === tabId),
      );
      tabOverview.classList.toggle("hidden", tabId !== "overview");
      tabReport.classList.toggle("hidden", tabId !== "report");
      // Clear badge when user opens report tab
      if (tabId === "report" && reportTabBadge) {
        reportTabBadge.classList.add("hidden");
      }
    }
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    if (viewReportBtn) {
      viewReportBtn.addEventListener("click", () => switchTab("report"));
    }

    // If popup was opened by clicking the badge, jump straight to report tab
    chrome.storage.local.get(["openOnTab"], (r) => {
      if (r.openOnTab) {
        switchTab(r.openOnTab);
        chrome.storage.local.remove("openOnTab");
      }
    });

    function showReportIndicator() {
      if (reportNudge) reportNudge.classList.remove("hidden");
      if (reportTabBadge) reportTabBadge.classList.remove("hidden");
    }

    // ── State ──
    let currentRootDomain = null;
    let lastScanResult = null;
    let detailsFetched = false;
    let dismissedDomains = new Set();
    let selectedCommentFlag = "neutral";
    let submittingComment = false;

    function setCommentStatus(message, kind = "info") {
      if (!communityCommentStatus) return;
      communityCommentStatus.classList.remove("hidden", "info", "success", "error");
      communityCommentStatus.classList.add(kind);
      communityCommentStatus.textContent = message;
    }

    function clearCommentStatus() {
      if (!communityCommentStatus) return;
      communityCommentStatus.textContent = "";
      communityCommentStatus.classList.add("hidden");
      communityCommentStatus.classList.remove("info", "success", "error");
    }

    function setSubmittingCommentState(isSubmitting) {
      submittingComment = isSubmitting;
      if (communitySubmitCommentBtn) {
        communitySubmitCommentBtn.disabled = isSubmitting;
        communitySubmitCommentBtn.textContent = isSubmitting
          ? "Submitting..."
          : "Submit Comment";
      }
    }

    function setActiveCommentFlag(flag) {
      selectedCommentFlag = flag;
      communityFlagButtons.forEach((button) => {
        const matches = button?.dataset?.flag === flag;
        button.classList.toggle("active", matches);
        button.setAttribute("aria-pressed", matches ? "true" : "false");
      });
    }

    function formatFeedbackDate(value) {
      if (!value) return "";
      try {
        return new Date(value).toLocaleString();
      } catch {
        return "";
      }
    }

    function renderFeedbackState(message) {
      if (!communityFeedbackResults || !communityFeedbackState || !communityFeedbackList) {
        return;
      }
      communityFeedbackResults.classList.remove("hidden");
      communityFeedbackState.classList.remove("hidden");
      communityFeedbackState.textContent = message;
      communityFeedbackList.classList.add("hidden");
      communityFeedbackList.innerHTML = "";
    }

    function renderFeedbackList(reports) {
      if (!communityFeedbackResults || !communityFeedbackState || !communityFeedbackList) {
        return;
      }

      communityFeedbackResults.classList.remove("hidden");

      if (!Array.isArray(reports) || reports.length === 0) {
        communityFeedbackState.classList.remove("hidden");
        communityFeedbackState.textContent = "No community feedback yet for this site.";
        communityFeedbackList.classList.add("hidden");
        communityFeedbackList.innerHTML = "";
        return;
      }

      communityFeedbackState.classList.add("hidden");
      communityFeedbackList.classList.remove("hidden");
      communityFeedbackList.innerHTML = reports
        .map((report) => {
          const rawFlag =
            typeof report?.flag === "string" ? report.flag.toLowerCase() : "neutral";
          const flag = ["phishing", "legitimate", "neutral"].includes(rawFlag)
            ? rawFlag
            : "neutral";
          const label =
            flag === "phishing"
              ? "Dangerous"
              : flag === "legitimate"
                ? "Safe"
                : "Neutral";
          const description =
            typeof report?.description === "string" && report.description.trim().length > 0
              ? report.description.trim()
              : "No description provided.";
          const createdAt = formatFeedbackDate(report?.created_at);

          return `
            <article class="community-feedback-item">
              <div class="community-feedback-item-head">
                <span class="community-feedback-flag ${flag}">${label}</span>
                <span class="community-feedback-date">${createdAt}</span>
              </div>
              <p class="community-feedback-desc">${description
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</p>
            </article>
          `;
        })
        .join("");
    }

    async function fetchCommunityFeedback() {
      if (!currentRootDomain) {
        renderFeedbackState("Run a scan first to load feedback for the current site.");
        return;
      }

      renderFeedbackState("Loading community feedback...");

      try {
        const endpoint = `${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentRootDomain)}`;
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          renderFeedbackState("Unable to load feedback right now.");
          return;
        }

        const data = await response.json().catch(() => ({}));
        renderFeedbackList(data?.reports || []);
      } catch {
        renderFeedbackState("Unable to load feedback right now.");
      }
    }

    async function submitCommunityComment() {
      if (submittingComment) return;

      if (!currentRootDomain) {
        setCommentStatus("Run a scan before submitting feedback.", "error");
        return;
      }

      const description =
        typeof communityCommentInput?.value === "string"
          ? communityCommentInput.value.trim()
          : "";

      if (description.length < 3) {
        setCommentStatus("Comment must be at least 3 characters.", "error");
        return;
      }

      if (description.length > 1000) {
        setCommentStatus("Comment is too long.", "error");
        return;
      }

      setSubmittingCommentState(true);
      clearCommentStatus();

      try {
        const response = await fetch(`${WEB_APP_ORIGIN}/api/community`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            url: currentRootDomain,
            description,
            flag: selectedCommentFlag,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          setCommentStatus(
            body?.error ||
              (response.status === 401
                ? "Please log in before commenting."
                : "Unable to submit comment right now."),
            "error",
          );
          return;
        }

        if (communityCommentInput) {
          communityCommentInput.value = "";
        }
        setActiveCommentFlag("neutral");
        setCommentStatus("Comment submitted successfully.", "success");
        await fetchCommunityFeedback();
      } catch {
        setCommentStatus("Unable to submit comment right now.", "error");
      } finally {
        setSubmittingCommentState(false);
      }
    }

    // Load previously dismissed domains from session storage
    chrome.storage.session.get(["dismissedAlerts"], (r) => {
      if (r.dismissedAlerts && Array.isArray(r.dismissedAlerts)) {
        dismissedDomains = new Set(r.dismissedAlerts);
      }
    });

    // ── Icons ──
    const Icons = {
      search: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      safe: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
      warn: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      error: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    };

    // ── Helper ──
    function getRootDomain(url) {
      try {
        const u = new URL(url);
        return u.protocol + "//" + u.hostname;
      } catch {
        return url;
      }
    }

    // ── Community Helpers ──
    async function checkCommunityAuth() {
      // First, ask content scripts for auth status across SmartShield tabs.
      // Users may sign in on a different tab than the currently active one.
      try {
        const tabs = await chrome.tabs.query({
          url: ["*://smartshield.it.com/*", "*://www.smartshield.it.com/*"],
        });

        for (const tab of tabs) {
          if (!tab?.id) continue;

          await chrome.tabs
            .sendMessage(tab.id, { action: "requestSessionSync" })
            .catch(() => null);

          const response = await chrome.tabs
            .sendMessage(tab.id, { action: "checkAuth" })
            .catch(() => null);

          if (response?.authenticated === true) {
            return true;
          }
        }
      } catch {
        // Content script error, fall back to localStorage check
      }

      // Fallback: Check localStorage for Supabase auth tokens
      try {
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

      // Final fallback: check auth synced from web app into extension storage.
      try {
        const stored = await chrome.storage.local.get(["smartshield_auth"]);
        const auth = stored?.smartshield_auth;
        const hasToken = typeof auth?.access_token === "string" && auth.access_token.length > 0;
        const notExpired =
          typeof auth?.expires_at !== "number" || auth.expires_at > Date.now();
        if (hasToken && notExpired) {
          return true;
        }
      } catch {
        // storage read error
      }

      return false;
    }

    async function initializeCommunitySection() {
      if (!communitySection) return;

      const isAuthenticated = await checkCommunityAuth();
      communitySection.classList.remove("hidden");

      if (isAuthenticated) {
        communityLoginPrompt.classList.add("hidden");
        communityContentSection.classList.remove("hidden");
        clearCommentStatus();
        await fetchCommunityFeedback();
      } else {
        communityLoginPrompt.classList.remove("hidden");
        communityContentSection.classList.add("hidden");
      }
    }

    // ── Safe Mode toggle init ──
    chrome.storage.local.get(["safeModeEnabled"], (r) => {
      const enabled =
        r.safeModeEnabled !== undefined ? r.safeModeEnabled : true;
      if (safeModeToggle) safeModeToggle.checked = enabled;
    });
    if (safeModeToggle) {
      safeModeToggle.addEventListener("change", async (e) => {
        const isEnabled = e.target.checked;
        await chrome.storage.local.set({ safeModeEnabled: isEnabled });
        chrome.runtime.sendMessage({
          action: "safeModeChanged",
          enabled: isEnabled,
        });
      });
    }

    // ── Theme toggle init ──
    function initTheme() {
      chrome.storage.local.get(["theme"], (r) => {
        const theme = r.theme || "dark";
        document.body.className = theme;
      });
    }
    initTheme();
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.body.classList.contains("light")
          ? "light"
          : "dark";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.body.className = newTheme;
        chrome.storage.local.set({ theme: newTheme });
      });
    }

    // ── Show Badge on Page button ──
    const locateBadgeBtn = document.getElementById("locate-badge-btn");
    if (locateBadgeBtn) {
      // Glow effect on mousemove
      locateBadgeBtn.addEventListener("mousemove", (e) => {
        const rect = locateBadgeBtn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        locateBadgeBtn.style.setProperty("--glow-x", `${x}%`);
        locateBadgeBtn.style.setProperty("--glow-y", `${y}%`);
      });

      // Reset glow on mouseleave
      locateBadgeBtn.addEventListener("mouseleave", () => {
        locateBadgeBtn.style.setProperty("--glow-intensity", "0");
      });

      locateBadgeBtn.addEventListener("click", async () => {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]) return;
        // Send message to content script to flash / recreate the badge
        chrome.tabs
          .sendMessage(tabs[0].id, { action: "locateBadge" })
          .catch(() => {});
        // Brief visual confirmation in the popup
        const origHTML = locateBadgeBtn.innerHTML;
        locateBadgeBtn.classList.add("done");
        locateBadgeBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Badge shown!`;
        setTimeout(() => {
          locateBadgeBtn.classList.remove("done");
          locateBadgeBtn.innerHTML = origHTML;
        }, 2000);
      });
    }

    // ── Community Feedback Section Init ──
    if (communityLoginBtn) {
      communityLoginBtn.addEventListener("click", () => {
        // Open production web app login page and let extension-sync bridge hand off session.
        chrome.tabs.create({
          url: `${WEB_APP_ORIGIN}/login?source=extension`,
        });
      });
    }

    if (communityViewFeedbackBtn) {
      communityViewFeedbackBtn.addEventListener("click", async () => {
        await fetchCommunityFeedback();
      });
    }

    if (communitySubmitCommentBtn) {
      communitySubmitCommentBtn.addEventListener("click", async () => {
        await submitCommunityComment();
      });
    }

    if (communityCommentInput) {
      communityCommentInput.addEventListener("input", () => {
        if (communityCommentStatus && !communityCommentStatus.classList.contains("hidden")) {
          clearCommentStatus();
        }
      });

      communityCommentInput.addEventListener("keydown", async (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          await submitCommunityComment();
        }
      });
    }

    communityFlagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextFlag = button?.dataset?.flag;
        if (
          nextFlag === "legitimate" ||
          nextFlag === "neutral" ||
          nextFlag === "phishing"
        ) {
          setActiveCommentFlag(nextFlag);
        }
      });
    });

    // ── Spotlight effect for warning banner ──
    if (scanWarnings) {
      scanWarnings.addEventListener("mousemove", (e) => {
        const rect = scanWarnings.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        scanWarnings.style.setProperty("--mouse-x", `${x}px`);
        scanWarnings.style.setProperty("--mouse-y", `${y}px`);
      });

      scanWarnings.addEventListener("mouseleave", () => {
        scanWarnings.style.setProperty("--mouse-x", "0px");
        scanWarnings.style.setProperty("--mouse-y", "0px");
      });
    }

    function dismissAlert() {
      if (alertModal) alertModal.classList.add("hidden");
      if (currentRootDomain) {
        dismissedDomains.add(currentRootDomain);
        chrome.storage.session.set({ dismissedAlerts: [...dismissedDomains] });
      }
    }

    if (alertLeaveBtn) {
      alertLeaveBtn.addEventListener("click", async () => {
        dismissAlert();
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0])
          chrome.tabs.update(tabs[0].id, { url: "https://www.google.com" });
      });
    }
    if (alertDismissBtn) {
      alertDismissBtn.addEventListener("click", () => dismissAlert());
    }

    // ── Lazy-load detail data ──
    function lazyLoadDetails() {
      if (detailsFetched || !currentRootDomain) return;
      detailsFetched = true;
      if (spContent)
        spContent.innerHTML =
          '<div class="sp-loading"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg> Loading details…</div>';
      chrome.runtime.sendMessage(
        { action: "getDetails", url: currentRootDomain },
        (details) => {
          if (chrome.runtime.lastError || !details) {
            if (spContent)
              spContent.innerHTML =
                '<div class="sp-empty">Could not load scan details.</div>';
            return;
          }
          populateDetails(details);
        },
      );
    }

    // ── Scan current page ──
    async function scanCurrentPage() {
      // Reset UI to scanning state
      if (statusIcon) {
        statusIcon.className = "status-ring scanning";
        statusIcon.innerHTML = Icons.search;
      }
      if (statusCard) statusCard.className = "status-card";
      if (statusTitle) {
        statusTitle.textContent = "Scanning…";
        statusTitle.removeAttribute("style");
      }
      if (statusDesc) {
        statusDesc.textContent =
          "Analyzing domain reputation and page content…";
      }
      if (scanWarnings) scanWarnings.classList.add("hidden");
      if (detailsContainer) detailsContainer.classList.add("hidden");
      if (metricsGrid) metricsGrid.classList.add("hidden");
      if (reportNudge) reportNudge.classList.add("hidden");
      if (reportTabBadge) reportTabBadge.classList.add("hidden");

      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs[0];
        if (!tab || !tab.url) {
          displayError("Unable to access the current page URL.");
          return;
        }

        currentRootDomain = getRootDomain(tab.url);
        displayURL(tab.url);

        chrome.runtime.sendMessage(
          { action: "checkURL", url: currentRootDomain },
          (result) => {
            if (statusIcon) statusIcon.classList.remove("scanning");
            if (chrome.runtime.lastError) {
              displayError("Scan service temporarily unavailable. Try again.");
              return;
            }
            if (!result) {
              displayError("Unable to complete scan. Check your connection.");
              return;
            }
            displayResult(result);
          },
        );
      } catch {
        if (statusIcon) statusIcon.classList.remove("scanning");
        displayError("An unexpected error occurred during the scan.");
      }
    }

    // ── Display URL chip ──
    function displayURL(url) {
      try {
        const u = new URL(url);
        if (urlText)
          urlText.textContent =
            u.hostname + (u.pathname !== "/" ? u.pathname : "");
        if (urlDisplay) urlDisplay.classList.remove("hidden");
      } catch {
        /* ignore */
      }
    }

    // ── Render scan results ──
    function displayResult(result) {
      if (!result) return;
      lastScanResult = result;
      const riskScore = result.riskScore || 0;
      const confidence = result.confidence || 0;

      // Metrics row
      if (metricsGrid) metricsGrid.classList.remove("hidden");
      if (riskScoreVal) riskScoreVal.textContent = riskScore;
      if (riskBarFill) {
        setTimeout(() => {
          riskBarFill.style.width = `${riskScore}%`;
        }, 50);
        if (riskScore >= 70) riskBarFill.style.background = "var(--danger)";
        else if (riskScore >= 40)
          riskBarFill.style.background = "var(--warning)";
        else riskBarFill.style.background = "var(--success)";
      }
      if (riskSub) {
        if (riskScore >= 70) riskSub.textContent = "High Risk";
        else if (riskScore >= 40) riskSub.textContent = "Moderate Risk";
        else riskSub.textContent = "Low Risk";
      }
      if (confidenceScore) {
        confidenceScore.textContent = confidence
          ? `${Math.round(confidence)}%`
          : "N/A";
      }

      // Status card
      if (result.isSuspicious) {
        if (result.riskLevel === "high" || riskScore >= 70) {
          if (statusIcon) {
            statusIcon.className = "status-ring danger";
            statusIcon.innerHTML = Icons.danger;
          }
          if (statusCard) statusCard.className = "status-card danger";
          if (statusTitle) {
            statusTitle.textContent = "High Risk Detected";
            statusTitle.style.color = "var(--danger)";
          }
          if (statusDesc)
            statusDesc.textContent =
              "Strong signs of phishing. Do not enter personal information.";
          showAlertModal(
            "Phishing Website Detected",
            "This site has been flagged as a phishing attempt. Do not enter passwords, payment info, or personal data.",
            "danger",
          );
        } else {
          if (statusIcon) {
            statusIcon.className = "status-ring warn";
            statusIcon.innerHTML = Icons.warn;
          }
          if (statusCard) statusCard.className = "status-card warn";
          if (statusTitle) {
            statusTitle.textContent = "Suspicious Activity";
            statusTitle.style.color = "var(--warning)";
          }
          if (statusDesc)
            statusDesc.textContent =
              "This site has suspicious characteristics. Proceed with caution.";
          showAlertModal(
            "Suspicious Website",
            "This site shows suspicious patterns. Avoid entering sensitive information.",
            "warn",
          );
        }
        if (result.warnings && result.warnings.length > 0) {
          if (scanWarnings) scanWarnings.classList.remove("hidden");
          if (warningList)
            warningList.innerHTML = result.warnings
              .map((w) => `<div>• ${w}</div>`)
              .join("");
        }
      } else {
        if (statusIcon) {
          statusIcon.className = "status-ring safe";
          statusIcon.innerHTML = Icons.safe;
        }
        if (statusCard) statusCard.className = "status-card safe";
        if (statusTitle) {
          statusTitle.textContent = "Site is Safe";
          statusTitle.style.color = "var(--success)";
        }
        if (statusDesc)
          statusDesc.textContent =
            "No threats detected. This website appears legitimate.";
        if (scanWarnings) scanWarnings.classList.add("hidden");
      }

      // Show scan detail panel and auto-load details
      detailsFetched = false;
      if (detailsContainer) detailsContainer.classList.remove("hidden");
      if (result.details) {
        detailsFetched = true;
        populateDetails(result.details);
      } else {
        lazyLoadDetails();
      }
      // Show nudge + badge to let user know report is ready
      showReportIndicator();
      // Initialize community feedback section
      initializeCommunitySection();
    }

    // ── Helper: Format relative date ──
    function formatRelativeDate(dateStr) {
      if (!dateStr || dateStr === "—") return "Not available";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Not available";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "1 day ago";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffWeeks === 1) return "1 week ago";
        if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
        if (diffMonths === 1) return "1 month ago";
        if (diffMonths < 12) return `${diffMonths} months ago`;
        if (diffYears === 1) return "1 year ago";
        return `${diffYears} years ago`;
      } catch {
        return "Not available";
      }
    }

    // ── Render ScanTab-style detail panel ──
    function populateDetails(details) {
      if (!details || !spContent) return;

      const r = lastScanResult || {};
      const w = details.whois || {};
      const score = r.riskScore || 0;
      const statusCls =
        score >= 70 ? "danger" : score >= 40 ? "warning" : "safe";
      const statusTxt =
        score >= 70 ? "Phishing Detected" : score >= 40 ? "Suspicious" : "Safe";
      const isHTTP = (r.url || "").toLowerCase().startsWith("http://");

      // Domain hostname
      let domainLabel = "—";
      try {
        const raw = r.url || currentRootDomain || "";
        domainLabel = raw ? new URL(raw).hostname : "—";
      } catch (_) {
        domainLabel = currentRootDomain || "—";
      }

      // WHOIS fields with better handling
      const registrar = w.registrar || w.Registrar || null;
      const created =
        w.creationDate || w.CreationDate || w["Creation Date"] || null;
      const lastAnalysis = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // DNS / SSL data
      const d = details.dns;
      const hasDNS = d && Object.keys(d).some((k) => d[k] && d[k].length > 0);
      const s = details.ssl;
      const hasSSL = s && !s.error;
      const screenshot = details.screenshot || r.screenshot || null;
      const pageBehavior = details.pageBehavior || r.pageBehavior || null;

      const svgIcon = (path) =>
        `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

      const spStat = (iconPath, label, value) => `
        <div class="sp-stat">
          <div class="sp-stat-hd">${svgIcon(iconPath)}<span class="sp-stat-label">${label}</span></div>
          <div class="sp-stat-val${!value ? " placeholder" : ""}">${value || "Not available"}</div>
        </div>`;

      // Generate all bot messages first to extract summary
      const botMsgs = generateBotMessages(r, details);
      const summaryMsg = botMsgs.find((m) => m.id === "summary");
      const otherMsgs = botMsgs.filter((m) => m.id !== "summary");

      // Build summary HTML for insertion above stats
      let summaryHTML = "";
      if (summaryMsg) {
        summaryHTML = `
        <div class="sp-bot-message sp-bot-accent-${summaryMsg.accent}" data-message-index="summary-card" style="animation-delay: 0s;">
          <div class="sp-bot-header">
            <div class="sp-bot-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <span>Analysis Summary</span>
          </div>
          <div class="sp-bot-content">${renderMarkdown(summaryMsg.text)}</div>
        </div>
        `;
      }

      spContent.innerHTML = `
        <!-- URL + Status -->
        <div class="sp-url-row">
          <div class="sp-url-inner">
            <div class="sp-url-dot ${statusCls}"></div>
            <span class="sp-url-text">${domainLabel}</span>
          </div>
          <span class="sp-url-badge ${statusCls}">${statusTxt}</span>
        </div>

        ${summaryHTML}

        <!-- Stats Grid -->
        <div class="sp-stats">
          ${spStat('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', "Registrar", registrar || "Not available")}
          ${spStat('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', "Created", created ? formatRelativeDate(created) : "Not available")}
          ${spStat('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', "Last Analysis", lastAnalysis)}
        </div>

        ${
          pageBehavior
            ? `<div class="sp-bot-message sp-bot-accent-blue" style="margin-top:10px;">
                <div class="sp-bot-header"><span>Playwright Behavior Analysis</span></div>
                <div class="sp-bot-content">
                  Login forms: <strong>${pageBehavior.has_login_form ? `Detected (${pageBehavior.login_forms_detected || 1})` : "None detected"}</strong><br/>
                  Dynamic findings: <strong>${pageBehavior.html_findings_count || 0}</strong><br/>
                  JS interaction probe: <strong>${pageBehavior.js_rendered_analysis ? "Active" : "Unavailable"}</strong>
                </div>
              </div>`
            : ""
        }

        ${
          screenshot
            ? `<div style="margin-top:10px;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg-card2)">
                <div style="padding:8px 10px;font-size:11px;color:var(--muted)">Playwright Screenshot Capture</div>
                <img src="data:image/png;base64,${screenshot}" alt="Scanned page screenshot" style="display:block;width:100%;max-height:200px;object-fit:cover;object-position:top;" />
              </div>`
            : ""
        }

        <!-- HTTP Warning -->
        ${
          isHTTP
            ? `<div class="sp-http-warn">
          <div class="sp-http-warn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
          </div>
          <div>
            <div class="sp-http-warn-title">Insecure Connection (HTTP)</div>
            <div class="sp-http-warn-desc">Data sent to this site is not encrypted and could be intercepted.</div>
          </div>
        </div>`
            : ""
        }
      `;

      // Render remaining bot messages below the stats
      if (otherMsgs.length > 0) {
        const botContainer = document.createElement("div");
        botContainer.className = "sp-bot-container";

        otherMsgs.forEach((msg, idx) => {
          const msgDiv = document.createElement("div");
          msgDiv.className = `sp-bot-message sp-bot-accent-${msg.accent}`;
          msgDiv.dataset.messageIndex = idx + 1; // offset by 1 so idx=0 doesn't match summary card CSS
          msgDiv.style.animationDelay = `${100 + idx * 150}ms`;

          const inlineIcons = {
            verdict: {
              label: "Verdict",
              icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
            },
            "score-meaning": {
              label: "Risk Score",
              icon: '<path d="M3 3v18h18M7 16l4-7 4 4 5-9"/>',
            },
            http: {
              label: "Connection",
              icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01"/>',
            },
            whois: {
              label: "Domain Info",
              icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
            },
            ssl: {
              label: "SSL Certificate",
              icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/>',
            },
            "ssl-err": {
              label: "SSL Warning",
              icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM15 9l-6 6M9 9l6 6"/>',
            },
            final: {
              label: "Recommendation",
              icon: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
            },
          };

          const catInfo = inlineIcons[msg.id] || {
            label: "Info",
            icon: '<circle cx="12" cy="12" r="10"/>',
          };

          // Expand button (if full text exists)
          const hasFullText = msg.fullText && msg.fullText !== msg.text;

          // Header — with optional chevron toggle on the right
          const header = document.createElement("div");
          header.className = "sp-bot-header";
          header.innerHTML = `
            <div class="sp-bot-header-left">
              <div class="sp-bot-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  ${catInfo.icon}
                </svg>
              </div>
              <span>${catInfo.label}</span>
            </div>
            ${
              hasFullText
                ? `<button class="sp-bot-chevron-btn" type="button" title="Expand" aria-expanded="false">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>`
                : ""
            }
          `;

          // Content wrapper
          const contentDiv = document.createElement("div");
          contentDiv.className = "sp-bot-content";

          // Preview
          const previewDiv = document.createElement("div");
          previewDiv.className = "sp-bot-preview";
          previewDiv.innerHTML = renderMarkdown(msg.text);
          contentDiv.appendChild(previewDiv);

          msgDiv.appendChild(header);
          msgDiv.appendChild(contentDiv);

          // Wire up chevron expand toggle
          if (hasFullText) {
            const fullDiv = document.createElement("div");
            fullDiv.className = "sp-bot-full";
            fullDiv.innerHTML = renderMarkdown(msg.fullText);
            contentDiv.appendChild(fullDiv);

            const chevronBtn = header.querySelector(".sp-bot-chevron-btn");
            if (chevronBtn) {
              chevronBtn.addEventListener("click", function () {
                const isExpanded = msgDiv.classList.contains("sp-bot-expanded");
                msgDiv.classList.toggle("sp-bot-expanded", !isExpanded);
                chevronBtn.classList.toggle("sp-bot-chevron-open", !isExpanded);
                chevronBtn.setAttribute("aria-expanded", String(!isExpanded));
              });
            }
          }

          botContainer.appendChild(msgDiv);
        });

        spContent.appendChild(botContainer);

        // Auto-scroll to bottom
        setTimeout(() => {
          if (botContainer) {
            botContainer.scrollTop = botContainer.scrollHeight;
          }
        }, 100);
      }
    }

    // ── Bot Explainer: Generate natural language messages ──
    function generateBotMessages(scan, details) {
      const msgs = [];
      const s = scan.riskScore || 0;
      const status = scan.status || "Safe";
      const whois = details?.whois || {};
      const ssl = details?.ssl || {};
      const pageBehavior = details?.pageBehavior || scan?.pageBehavior || null;
      const isHTTP = (scan.url || "").toLowerCase().startsWith("http://");

      const verdictColor =
        status === "Dangerous"
          ? "red"
          : status === "Warning"
            ? "yellow"
            : "green";

      // 0 — Quick Summary Card (NEW - Compact)
      const summaryTitle =
        status === "Dangerous"
          ? "Highly Dangerous"
          : status === "Warning"
            ? "Suspicious Activity"
            : "Site is Safe";

      const summaryDesc =
        status === "Dangerous"
          ? "Multiple red flags detected. Do not interact."
          : status === "Warning"
            ? "Some warning signs. Proceed with caution."
            : "No major threats detected. Safe to browse.";

      msgs.push({
        id: "summary",
        text: `**${summaryTitle}** (${s}/100)\n${summaryDesc}`,
        accent:
          status === "Dangerous"
            ? "red"
            : status === "Warning"
              ? "yellow"
              : "green",
      });

      // 1 — Verdict + overall assessment
      const verdictPreview =
        status === "Dangerous"
          ? `This site is **highly dangerous**`
          : status === "Warning"
            ? `This site looks **suspicious**`
            : `This site looks **safe**`;
      const verdictFull =
        status === "Dangerous"
          ? `This site is **highly dangerous**. I strongly recommend you **do not visit** it.`
          : status === "Warning"
            ? `This site looks **suspicious**. You should be careful before interacting with it.`
            : `This site looks **safe**. You can browse it normally, but always stay alert.`;
      msgs.push({
        id: "verdict",
        text: verdictPreview,
        fullText: verdictFull,
        accent: verdictColor,
      });

      // 2 — Score meaning (contextual - unified traffic light metaphor)
      const scoreMeaningPreview =
        s >= 67
          ? `Score of **${s}** — Red light zone`
          : s >= 34
            ? `Score of **${s}** — Yellow light zone`
            : `Score of **${s}** — Green light zone`;
      const scoreMeaningFull =
        s >= 67
          ? `Red light zone — score of **${s}**. Multiple security layers detected serious threats. This is likely a scam or phishing site designed to steal your information.`
          : s >= 34
            ? `Yellow light zone — score of **${s}**. Several warning signs detected. Exercise caution and verify legitimacy before entering any personal information.`
            : `Green light zone — score of **${s}**. The site passed security checks. You can browse it normally.`;
      msgs.push({
        id: "score-meaning",
        text: scoreMeaningPreview,
        fullText: scoreMeaningFull,
        accent: "blue",
      });

      // 3 — HTTP warning
      if (isHTTP) {
        msgs.push({
          id: "http",
          text: "Unencrypted connection (**HTTP**)",
          fullText:
            "This site uses **HTTP**, which means your connection is **not encrypted**. Anyone on the same network (like public Wi-Fi) could intercept what you type — passwords, credit cards, personal information.",
          accent: "yellow",
        });
      }

      if (pageBehavior) {
        const loginDetected = !!pageBehavior.has_login_form;
        const loginCount = pageBehavior.login_forms_detected || 0;
        const findingCount = pageBehavior.html_findings_count || 0;

        msgs.push({
          id: "playwright",
          text: loginDetected
            ? `Playwright observed **${loginCount} login-like form${loginCount === 1 ? "" : "s"}**`
            : "Playwright behavior probe completed",
          fullText: loginDetected
            ? `The browser probe detected **${loginCount} login-like form${loginCount === 1 ? "" : "s"}** and generated **${findingCount} dynamic signal${findingCount === 1 ? "" : "s"}** from rendered DOM analysis.`
            : `The Playwright probe completed successfully. No login-form behavior was detected. Dynamic findings count: **${findingCount}**.`,
          accent: loginDetected ? "yellow" : "blue",
        });
      }

      // 4 — WHOIS insights
      if (Object.keys(whois).length > 0) {
        const reg = whois.registrar || whois.Registrar;
        const created =
          whois.creationDate || whois.CreationDate || whois["Creation Date"];
        if (reg || created) {
          // Build preview from available data
          let whoisPreview = "";
          if (reg) whoisPreview = `Registered through **${reg}**`;

          // Build full explanation
          let whoisFull = "Domain ownership information: ";
          if (reg) whoisFull += `Registered through **${reg}**. `;
          if (created) {
            const d = new Date(created);
            const now = new Date();
            const diffDays = Math.floor(
              (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
            );
            if (diffDays < 30)
              whoisFull += `Domain age: **very new** (${diffDays} day${diffDays !== 1 ? "s" : ""} old), so ownership history is limited.`;
            else if (diffDays < 365)
              whoisFull += `Domain age: **moderately established** (${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} old).`;
            else
              whoisFull += `Domain age: **well-established** (${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? "s" : ""} old), indicating longevity.`;
          }

          msgs.push({
            id: "whois",
            text: whoisPreview || "Domain information available",
            fullText: whoisFull.trim(),
            accent: status === "Dangerous" && created ? "yellow" : "blue",
          });
        }
      }

      // 5 — SSL Certificate status (unified message with status-specific caveat)
      if (ssl && !ssl.error) {
        let rawIssuer = ssl.issuer || ssl.issuer_organization;
        let issuer;
        if (rawIssuer && typeof rawIssuer === "object") {
          issuer =
            rawIssuer.O ||
            rawIssuer.CN ||
            rawIssuer.organizationName ||
            Object.values(rawIssuer).find((v) => typeof v === "string");
        } else {
          issuer = rawIssuer;
        }

        const sslPreview = issuer
          ? `SSL verified by **${issuer}**`
          : `SSL certificate verified`;
        let sslFull = `Connection is encrypted, but SSL certification alone doesn't guarantee legitimacy. `;
        if (issuer) {
          sslFull += `SSL certificate verified by **${issuer}**. `;
        }
        sslFull += `An encrypted connection prevents eavesdropping, but scammers can also obtain SSL certificates. `;
        if (status === "Dangerous") {
          sslFull += `Given this site's risk profile, it should be avoided.`;
        } else if (status === "Warning") {
          sslFull += `Consider this alongside the other warning indicators detected.`;
        } else {
          sslFull += `This is a positive security indicator along with the other checks.`;
        }

        const sslAccent =
          status === "Dangerous"
            ? "yellow"
            : status === "Warning"
              ? "yellow"
              : "green";
        msgs.push({
          id: "ssl",
          text: sslPreview,
          fullText: sslFull,
          accent: sslAccent,
        });
      } else if (ssl?.error) {
        msgs.push({
          id: "ssl-err",
          text: `SSL encryption unavailable`,
          fullText: `I couldn't verify this site's SSL certificate — **${ssl.error}**. Without proper encryption, any data you send (passwords, personal info) could be intercepted by attackers.`,
          accent: "red",
        });
      }

      // 6 — Final advice
      const finalPreview =
        status === "Dangerous"
          ? `Do not interact with this site`
          : status === "Warning"
            ? `Be cautious before visiting`
            : `Site appears legitimate`;
      const finalFull =
        status === "Dangerous"
          ? `Do not enter any personal information on this site. Do not download anything from it. If you received this link via email or text message, it's very likely a phishing attempt — let the sender know their account may be compromised.`
          : status === "Warning"
            ? `Be cautious. Don't enter sensitive info like passwords or payment details unless you're absolutely sure this is a legitimate site you trust. When in doubt, visit the official website directly by typing the URL yourself.`
            : `This site appears to be legitimate based on our analysis. You can browse it normally, but always stay alert for unusual requests for personal information.`;
      msgs.push({
        id: "final",
        text: finalPreview,
        fullText: finalFull,
        accent: verdictColor,
      });

      return msgs;
    }

    // ── Bot Explainer: Render messages with animation ──
    function renderBotMessages(messages) {
      if (!spContent || messages.length === 0) return;

      const container = document.createElement("div");
      container.className = "sp-bot-container";

      const categoryIcons = {
        verdict: {
          label: "Verdict",
          iconSvg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        },
        "score-meaning": {
          label: "Risk Score",
          iconSvg: '<path d="M3 3v18h18M7 16l4-7 4 4 5-9"/>',
        },
        http: {
          label: "Connection",
          iconSvg:
            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01"/>',
        },
        whois: {
          label: "Domain Info",
          iconSvg:
            '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        },
        ssl: {
          label: "SSL Certificate",
          iconSvg:
            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/>',
        },
        "ssl-err": {
          label: "SSL Warning",
          iconSvg:
            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM15 9l-6 6M9 9l6 6"/>',
        },
        final: {
          label: "Recommendation",
          iconSvg:
            '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
        },
      };

      messages.forEach((msg, idx) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = `sp-bot-message sp-bot-accent-${msg.accent}`;
        msgDiv.dataset.messageIndex = idx;
        msgDiv.style.animationDelay =
          idx === 0 ? "0s" : `${600 + (idx - 1) * 900}ms`;

        const catInfo = categoryIcons[msg.id] || {
          label: "Info",
          iconSvg: '<circle cx="12" cy="12" r="10"/>',
        };

        // Check if message has expanded content
        const hasFullText = msg.fullText && msg.fullText !== msg.text;

        // Create header — with chevron on right if expandable
        const header = document.createElement("div");
        header.className = "sp-bot-header";
        header.innerHTML = `
          <div class="sp-bot-header-left">
            <div class="sp-bot-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${catInfo.iconSvg}
              </svg>
            </div>
            <span>${catInfo.label}</span>
          </div>
          ${
            hasFullText
              ? `<button class="sp-bot-chevron-btn" type="button" title="Expand" aria-expanded="false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>`
              : ""
          }
        `;

        // Create content wrapper
        const contentDiv = document.createElement("div");
        contentDiv.className = "sp-bot-content";

        // Create preview div
        const previewDiv = document.createElement("div");
        previewDiv.className = "sp-bot-preview";
        previewDiv.innerHTML = renderMarkdown(msg.text);
        contentDiv.appendChild(previewDiv);

        msgDiv.appendChild(header);
        msgDiv.appendChild(contentDiv);

        // Wire up chevron expand toggle
        if (hasFullText) {
          const fullDiv = document.createElement("div");
          fullDiv.className = "sp-bot-full";
          fullDiv.innerHTML = renderMarkdown(msg.fullText);
          contentDiv.appendChild(fullDiv);

          const chevronBtn = header.querySelector(".sp-bot-chevron-btn");
          if (chevronBtn) {
            chevronBtn.addEventListener("click", function () {
              const isExpanded = msgDiv.classList.contains("sp-bot-expanded");
              msgDiv.classList.toggle("sp-bot-expanded", !isExpanded);
              chevronBtn.classList.toggle("sp-bot-chevron-open", !isExpanded);
              chevronBtn.setAttribute("aria-expanded", String(!isExpanded));
            });
          }
        }

        container.appendChild(msgDiv);
      });

      spContent.innerHTML = "";
      spContent.appendChild(container);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }

    // ── Markdown renderer for **bold** text ──
    function renderMarkdown(text) {
      if (!text) return "";
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts
        .map((part) =>
          part.startsWith("**") && part.endsWith("**")
            ? `<strong>${part.slice(2, -2)}</strong>`
            : part
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;"),
        )
        .join("");
    }

    // ── Original JSON renderer ──
    function jsonPre(data) {
      const highlighted = JSON.stringify(data, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="json-str">"$1"</span>')
        .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>')
        .replace(/: null/g, ': <span class="json-null">null</span>');
      return `<pre>${highlighted}</pre>`;
    }

    // ── Error state ──
    function displayError(message) {
      if (statusIcon) {
        statusIcon.className = "status-ring";
        statusIcon.innerHTML = Icons.error;
      }
      if (statusCard) statusCard.className = "status-card";
      if (statusTitle) {
        statusTitle.textContent = "Scan Error";
        statusTitle.style.color = "var(--danger)";
      }
      if (statusDesc) statusDesc.textContent = message;
      if (scanWarnings) scanWarnings.classList.add("hidden");
      if (detailsContainer) detailsContainer.classList.add("hidden");
      if (metricsGrid) metricsGrid.classList.add("hidden");
    }

    // ── Alert modal ──
    function showAlertModal(title, message, type = "danger") {
      if (!alertModal) return;
      // Don't re-show if user already dismissed for this domain
      if (currentRootDomain && dismissedDomains.has(currentRootDomain)) return;
      if (alertTitle) alertTitle.textContent = title;
      if (alertMessage) alertMessage.textContent = message;
      if (alertContent) alertContent.className = `modal-box ${type}`;
      alertModal.classList.remove("hidden");
    }

    // ── Metrics tile interactivity (hover glow + click ripple + tilt) ──
    if (metricsGrid) {
      const metricTiles = metricsGrid.querySelectorAll(".metric-tile");

      metricTiles.forEach((tile) => {
        // Mouse move: spotlight glow + tilt effect
        tile.addEventListener("mousemove", (e) => {
          const rect = tile.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xPercent = (x / rect.width) * 100;
          const yPercent = (y / rect.height) * 100;

          tile.style.setProperty("--glow-x", `${xPercent}%`);
          tile.style.setProperty("--glow-y", `${yPercent}%`);
          tile.style.setProperty("--glow-intensity", "1");

          // Tilt effect based on mouse position
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -10;
          const rotateY = ((x - centerX) / centerX) * 10;

          tile.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        // Mouse leave: fade glow and reset tilt
        tile.addEventListener("mouseleave", () => {
          tile.style.setProperty("--glow-intensity", "0");
          tile.style.transform =
            "perspective(1000px) rotateX(0deg) rotateY(0deg)";
        });

        // Click: ripple effect
        tile.addEventListener("click", (e) => {
          const rect = tile.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const maxDistance = Math.max(
            Math.hypot(x, y),
            Math.hypot(x - rect.width, y),
            Math.hypot(x, y - rect.height),
            Math.hypot(x - rect.width, y - rect.height),
          );

          const ripple = document.createElement("div");
          ripple.style.cssText = `
            position: absolute;
            width: ${maxDistance * 2}px;
            height: ${maxDistance * 2}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(132, 0, 255, 0.4) 0%, rgba(132, 0, 255, 0.2) 30%, transparent 70%);
            left: ${x - maxDistance}px;
            top: ${y - maxDistance}px;
            pointer-events: none;
            z-index: 10;
          `;

          tile.appendChild(ripple);

          // Animate ripple
          const startTime = Date.now();
          const duration = 600;

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ripple.style.transform = `scale(${progress})`;
            ripple.style.opacity = `${1 - progress}`;

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              ripple.remove();
            }
          };

          animate();
        });
      });
    }

    // ── Kick off scan ──
    scanCurrentPage();
  } // end initMainApp
});
