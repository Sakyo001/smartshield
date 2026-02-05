document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const safeModeToggle = document.getElementById("safe-mode-toggle");
  const statusIcon = document.getElementById("status-icon");
  const statusTitle = document.getElementById("status-title");
  const statusDesc = document.getElementById("status-desc");
  const scanWarnings = document.getElementById("scan-warnings");
  const warningList = document.getElementById("warning-list");
  const loadingOverlay = document.getElementById("loading-overlay");
  const detailsContainer = document.getElementById("details-container");
  const urlDisplay = document.getElementById("url-display");
  const urlText = document.getElementById("url-text");
  const tabsList = document.getElementById("tabs-list");
  const tabsCount = document.getElementById("tabs-count");

  // Alert Modal Elements
  const alertModal = document.getElementById("alert-modal");
  const alertContent = document.getElementById("alert-content");
  const alertIcon = document.getElementById("alert-icon");
  const alertTitle = document.getElementById("alert-title");
  const alertMessage = document.getElementById("alert-message");
  const alertLeaveBtn = document.getElementById("alert-leave");
  const alertDismissBtn = document.getElementById("alert-dismiss");

  // Details toggles
  const whoisToggle = document.getElementById("whois-toggle");
  const dnsToggle = document.getElementById("dns-toggle");
  const sslToggle = document.getElementById("ssl-toggle");

  // State
  let currentScanResult = null;
  let currentTabId = null;

  // Alert Modal Event Listeners
  alertLeaveBtn.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: "https://www.google.com" });
    }
    alertModal.classList.add("hidden");
  });

  alertDismissBtn.addEventListener("click", () => {
    alertModal.classList.add("hidden");
  });

  // Initialize
  initializeApp();

  async function initializeApp() {
    try {
      console.log('🔧 Initializing app...');
      
      // Load Safe Mode state
      const result = await chrome.storage.local.get(['safeModeEnabled']);
      const safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
      safeModeToggle.checked = safeModeEnabled;
      console.log('✓ Safe Mode loaded:', safeModeEnabled);

      // Auto-scan current page when popup opens
      loadCurrentStatus();
      
      // Request background script to scan ALL tabs right now
      chrome.runtime.sendMessage({ action: 'scanAllTabsNow' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ scanAllTabsNow error:', chrome.runtime.lastError);
        } else if (response && response.success) {
          console.log('✓ Background script started scanning all tabs');
          setTimeout(() => {
            loadAllTabsStatus();
          }, 500);
        }
      });
      
      // Load all tabs scan results
      console.log('📋 Loading all tabs status...');
      await loadAllTabsStatus();
      console.log('✓ App initialization complete');
      
    } catch (error) {
      console.error('❌ Initialization error:', error);
      tabsList.innerHTML = `<div style="color: var(--danger); padding: 20px;">Error: ${error.message}</div>`;
    }
  }

  // Listen for storage changes to update tab statuses in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Check if any scan result was updated
      for (let key in changes) {
        if (key.startsWith('result_')) {
          console.log('Storage changed for:', key);
          // Reload all tabs status to reflect the change
          loadAllTabsStatus();
          break; // Only need to reload once
        }
      }
    }
  });

  // Safe Mode Toggle
  safeModeToggle.addEventListener("change", async (e) => {
    const isEnabled = e.target.checked;
    await chrome.storage.local.set({ safeModeEnabled: isEnabled });
    
    console.log('Safe Mode:', isEnabled ? 'ENABLED' : 'DISABLED');
    
    // Notify background script about the change
    chrome.runtime.sendMessage({
      action: "safeModeChanged",
      enabled: isEnabled
    });

    // If enabled, scan current page immediately
    if (isEnabled) {
      scanCurrentPage();
    }
  });

  // Details toggles
  if (whoisToggle) {
    whoisToggle.addEventListener("click", () => toggleSection("whois-data", whoisToggle));
  }
  if (dnsToggle) {
    dnsToggle.addEventListener("click", () => toggleSection("dns-data", dnsToggle));
  }
  if (sslToggle) {
    sslToggle.addEventListener("click", () => toggleSection("ssl-data", sslToggle));
  }

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

  // Define Icons
  const Icons = {
    search: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    safe: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    warning: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    danger: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    error: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
  };

  // Load current page status
  async function loadCurrentStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (currentTab && currentTab.url) {
        // Display the URL being scanned
        displayURL(currentTab.url);
        
        // Check if we have a cached result for this URL
        const storageKey = `result_${currentTab.url}`;
        const result = await chrome.storage.local.get([storageKey]);
        
        if (result[storageKey]) {
          console.log('Loaded cached result:', result[storageKey]);
          currentScanResult = result[storageKey];
          displayResult(currentScanResult);
        } else {
          // Start scanning immediately
          statusIcon.innerHTML = Icons.search;
          statusTitle.textContent = "Scanning...";
          statusDesc.textContent = "Analyzing this page for threats";
          scanCurrentPage();
        }
      }
    } catch (error) {
      console.error("Error loading status:", error);
    }
  }

  // Display URL being scanned
  function displayURL(url) {
    try {
      const urlObj = new URL(url);
      const displayedUrl = urlObj.hostname + urlObj.pathname;
      urlText.textContent = displayedUrl;
      urlDisplay.classList.remove("hidden");
    } catch (error) {
      console.error("Invalid URL:", error);
    }
  }

  // Scan current page
  async function scanCurrentPage() {
    // UI updates for scanning state
    statusIcon.classList.add("scanning");
    statusIcon.innerHTML = Icons.search;
    statusTitle.style.color = "var(--text-main)"; 
    statusTitle.textContent = "Scanning...";
    statusDesc.textContent = "Analyzing page content and domain data...";
    
    // Clear previous results/warnings
    scanWarnings.classList.add("hidden");
    detailsContainer.classList.add("hidden");
    document.getElementById("metrics-grid").classList.add("hidden");
    
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (currentTab && currentTab.url) {
        chrome.runtime.sendMessage(
          {
            action: "checkURL",
            url: currentTab.url,
          },
          function (result) {
            
            if (chrome.runtime.lastError) {
              statusIcon.classList.remove("scanning");
              console.error("Runtime error:", chrome.runtime.lastError);
              displayError("Scan service is temporarily unavailable. Please try again.");
            } else if (result && result.error) {
              statusIcon.classList.remove("scanning");
              console.error("Scan error:", result.error);
              displayError("Unable to complete scan. Please check your connection.");
            } else if (result) {
              console.log("Scan completed successfully:", result);
              currentScanResult = result;
              displayResult(result);
              
              // Cache the result
              const storageKey = `result_${currentTab.url}`;
              chrome.storage.local.set({ [storageKey]: result });
            } else {
              statusIcon.classList.remove("scanning");
              displayError("No result received from scan service.");
            }
          }
        );
      } else {
        statusIcon.classList.remove("scanning");
        displayError("Unable to access current page URL.");
      }
    } catch (error) {
      statusIcon.classList.remove("scanning");
      console.error("Error scanning page:", error);
      displayError("An error occurred during the scan.");
    }
  }

  // Display scan result
  function displayResult(result) {
    if (!result) return;

    // Stop scanning animation
    statusIcon.classList.remove("scanning");
    const statusCard = document.querySelector('.status-card');
    const metricsGrid = document.getElementById("metrics-grid");
    
    // New Gauge Elements
    const riskScoreText = document.getElementById("risk-score-text");
    const riskCirclePath = document.getElementById("risk-circle-path");
    const confidenceScoreEl = document.getElementById("confidence-score");

    const riskScore = result.riskScore || 0;
    const confidence = result.confidence || 0;
    
    // Show metrics
    metricsGrid.classList.remove("hidden");
    
    // Update Score UI (Gauge)
    if (riskScoreText) riskScoreText.textContent = riskScore.toString();
    
    if (riskCirclePath) {
      // Small timeout to trigger animation
      setTimeout(() => {
        riskCirclePath.setAttribute("stroke-dasharray", `${riskScore}, 100`);
        
        // Color based on risk
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
        
        statusCard.className = 'status-card danger';
        
        // Show alert modal for high risk
        showAlertModal(
          "Phishing Website Detected",
          "This website has been identified as a phishing attempt. Do not enter any personal information, passwords, or credit card details.",
          "danger"
        );
        
        // Show browser notification
        showNotification(
          "🚨 Dangerous Website Detected",
          "SmartShield has blocked a phishing attempt. Leave this site immediately."
        );
      } else {
        statusIcon.innerHTML = Icons.warning;
        statusTitle.textContent = "Suspicious Activity";
        statusTitle.style.color = "var(--warning)";
        statusDesc.textContent = "This site has some suspicious characteristics. Proceed with caution.";
        
        statusCard.className = 'status-card warning';
        
        // Show alert modal for medium risk
        showAlertModal(
          "Suspicious Website",
          "This website shows suspicious characteristics. Exercise caution and avoid entering sensitive information.",
          "warning"
        );
        
        // Show browser notification
        showNotification(
          "⚠️ Suspicious Website",
          "SmartShield detected suspicious activity on this page."
        );
      }

      if (result.warnings && result.warnings.length > 0) {
        scanWarnings.classList.remove("hidden");
        warningList.innerHTML = result.warnings
          .map((w) => `<div style="margin-bottom: 4px;">• ${w}</div>`)
          .join("");
      } else {
        scanWarnings.classList.add("hidden");
      }
    } else {
      statusIcon.innerHTML = Icons.safe;
      statusTitle.textContent = "Site is Safe";
      statusTitle.style.color = "var(--success)";
      statusDesc.textContent = "This website appears safe to use.";
      
      statusCard.className = 'status-card safe';
      
      scanWarnings.classList.add("hidden");
    }

    // Show details section if we have detail data
    if (result.details) {
      detailsContainer.classList.remove("hidden");
      populateDetails(result);
    } else {
      detailsContainer.classList.add("hidden");
    }
  }

  // Populate detail sections
  function populateDetails(result) {
    const details = result.details;
    
    // WHOIS Data
    if (details.whois) {
      const whoisData = document.getElementById("whois-data");
      whoisData.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Registrar:</span>
          <span class="detail-value">${details.registrar || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created:</span>
          <span class="detail-value">${details.creationDate || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expires:</span>
          <span class="detail-value">${details.expirationDate || 'Unknown'}</span>
        </div>
      `;
    }

    // DNS Data
    if (details.dns) {
      const dnsData = document.getElementById("dns-data");
      let dnsHTML = '';
      
      if (details.dns.A && details.dns.A.length > 0) {
        dnsHTML += `
          <div class="detail-row">
            <span class="detail-label">A Records:</span>
            <span class="detail-value">${details.dns.A.join(', ')}</span>
          </div>
        `;
      }
      
      if (details.dns.MX && details.dns.MX.length > 0) {
        dnsHTML += `
          <div class="detail-row">
            <span class="detail-label">MX Records:</span>
            <span class="detail-value">${details.dns.MX.join(', ')}</span>
          </div>
        `;
      }
      
      dnsData.innerHTML = dnsHTML || '<p>No DNS records available</p>';
    }

    // SSL Data
    if (details.ssl) {
      const sslData = document.getElementById("ssl-data");
      if (details.ssl.error) {
        sslData.innerHTML = `<p>${details.ssl.error}</p>`;
      } else {
        sslData.innerHTML = `
          <div class="detail-row">
            <span class="detail-label">Issuer:</span>
            <span class="detail-value">${details.ssl.issuer || 'Unknown'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Valid Until:</span>
            <span class="detail-value">${details.ssl.valid_to || 'Unknown'}</span>
          </div>
        `;
      }
    }
  }

  // Display error
  function displayError(message) {
    statusIcon.innerHTML = Icons.error;
    statusTitle.textContent = "Scan Error";
    statusTitle.style.color = "var(--danger)";
    statusDesc.textContent = message;
    scanWarnings.classList.add("hidden");
    detailsContainer.classList.add("hidden");
    document.getElementById("metrics-grid").classList.add("hidden");
  }

  // Show Alert Modal
  function showAlertModal(title, message, type = "danger") {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    if (type === "warning") {
      alertContent.classList.add("warning");
    } else {
      alertContent.classList.remove("warning");
    }
    
    alertModal.classList.remove("hidden");
  }

  // Show Browser Notification
  function showNotification(title, message) {
    // Check if we have permission
    if (chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("images/icon48.png"),
        title: title,
        message: message,
        priority: 2
      });
    }
  }

  // Show/hide loading overlay (Deprecated but kept for safety if called)
  function showLoading(show) {
    // No-op as we use inline loading now
  }

  // Load all tabs and their scan status
  async function loadAllTabsStatus() {
    try {
      console.log('📋 === Starting loadAllTabsStatus ===');
      
      // First, just try to query tabs and see what we get
      console.log('🔍 Querying chrome.tabs...');
      const tabs = await chrome.tabs.query({});
      console.log('✓ chrome.tabs.query({}) returned:', tabs.length, 'tabs');
      console.log('RAW TABS:', JSON.stringify(tabs.map(t => ({id: t.id, title: t.title, url: t.url})), null, 2));
      
      // Log each tab's URL
      tabs.forEach((t, i) => {
        console.log(`  [${i}] ${t.title || 'Untitled'} - ${t.url}`);
      });
      
      if (!tabs || tabs.length === 0) {
        console.warn('⚠️ No tabs found! This might be a permissions issue.');
        tabsList.innerHTML = '<div style="text-align: center; color: var(--warning); padding: 20px;">No tabs found - check permissions</div>';
        return;
      }
      
      const currentTabArray = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = currentTabArray[0];
      console.log('✓ Current tab:', currentTab?.title || 'Unknown');
      
      // Filter out chrome://, extension pages, and API backend tabs
      console.log('🔍 Filtering tabs...');
      const validTabs = tabs.filter(tab => {
        console.log(`\n  Checking tab: "${tab.title}" - ${tab.url}`);
        
        if (!tab.url) {
          console.log('    ✗ NO URL PROPERTY');
          return false;
        }
        
        if (tab.url.startsWith('chrome://')) {
          console.log('    ✗ Chrome system page');
          return false;
        }
        if (tab.url.startsWith('chrome-extension://')) {
          console.log('    ✗ Chrome extension page');
          return false;
        }
        if (tab.url.startsWith('edge://')) {
          console.log('    ✗ Edge system page');
          return false;
        }
        if (tab.url.startsWith('about:')) {
          console.log('    ✗ About page');
          return false;
        }
        if (tab.url.includes('smartshield-whois-api')) {
          console.log('    ✗ API URL');
          return false;
        }
        
        console.log('    ✓ VALID TAB');
        return true;
      });
      
      console.log(`✓ Valid tabs after filtering: ${validTabs.length} / ${tabs.length}`);
      tabsCount.textContent = validTabs.length;
      
      // Clear existing tabs
      tabsList.innerHTML = '';
      
      if (validTabs.length === 0) {
        console.warn('⚠️ All tabs were filtered out');
        tabsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No user tabs to display</div>';
        return;
      }
      
      // Display ALL tabs immediately with "Pending" state
      console.log(`📝 Creating ${validTabs.length} tab elements...`);
      for (const tab of validTabs) {
        const tabElement = createTabElement(tab, undefined, currentTab && currentTab.id === tab.id);
        tabElement.id = `tab-item-${tab.id}`;
        tabsList.appendChild(tabElement);
        console.log(`  ✓ Added: ${tab.title || 'Untitled'}`);
      }
      
      // Now load scan results asynchronously for each tab
      console.log(`🔄 Loading scan results for ${validTabs.length} tabs...`);
      for (const tab of validTabs) {
        const storageKey = `result_${tab.url}`;
        
        try {
          const result = await chrome.storage.local.get([storageKey]);
          const scanResult = result[storageKey];
          
          if (scanResult) {
            console.log(`  ✓ Cached: ${tab.url.substring(0, 40)}`);
            updateTabElementInUI(tab, scanResult, currentTab && currentTab.id === tab.id);
          } else {
            console.log(`  → Scanning: ${tab.url.substring(0, 40)}`);
            chrome.runtime.sendMessage(
              { action: 'checkURL', url: tab.url },
              (response) => {
                if (!chrome.runtime.lastError) {
                  if (response) {
                    console.log(`    ✓ Scan done: ${tab.url.substring(0, 40)}`);
                    chrome.storage.local.set({ [storageKey]: response });
                    updateTabElementInUI(tab, response, currentTab && currentTab.id === tab.id);
                  }
                } else {
                  console.warn(`    ✗ Error scanning: ${chrome.runtime.lastError.message}`);
                }
              }
            );
          }
        } catch (err) {
          console.error(`  ✗ Storage error for ${tab.url}:`, err);
        }
      }
      
      console.log('✓ === loadAllTabsStatus complete ===');
      
    } catch (error) {
      console.error('❌ Error loading all tabs:', error);
      console.error('Stack:', error.stack);
      tabsList.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Error: ${error.message}</div>`;
    }
  }

  // Update a specific tab element in the UI after scan completes
  function updateTabElementInUI(tab, scanResult, isActive) {
    console.log(`🔄 Updating tab element for ${tab.url}:`, {
      isSuspicious: scanResult?.isSuspicious,
      riskScore: scanResult?.riskScore,
      riskLevel: scanResult?.riskLevel,
      decision: scanResult?.decision,
      confidence: scanResult?.confidence
    });
    
    const tabElementId = `tab-item-${tab.id}`;
    const existingElement = document.getElementById(tabElementId);
    
    if (existingElement) {
      const newElement = createTabElement(tab, scanResult, isActive);
      newElement.id = tabElementId;
      existingElement.replaceWith(newElement);
    }
  }

  // Create tab element for the list
  function createTabElement(tab, scanResult, isActive) {
    const tabItem = document.createElement('div');
    tabItem.className = `tab-item ${isActive ? 'active' : ''}`;
    
    // Determine status
    let statusIcon = '⏳';
    let statusClass = 'pending';
    let riskBadge = 'Pending';
    let riskBadgeClass = 'pending';
    
    if (scanResult === null || scanResult === undefined) {
      // Not scanned yet or actively scanning
      statusIcon = '⏳';
      statusClass = 'pending';
      riskBadge = 'Pending';
      riskBadgeClass = 'pending';
    } else if (scanResult) {
      // Scan completed
      if (scanResult.isSuspicious) {
        if (scanResult.riskLevel === 'high' || scanResult.riskScore >= 70) {
          statusIcon = '🚨';
          statusClass = 'danger';
          riskBadge = 'High Risk';
          riskBadgeClass = 'high';
        } else {
          statusIcon = '⚠️';
          statusClass = 'warning';
          riskBadge = 'Suspicious';
          riskBadgeClass = 'medium';
        }
      } else {
        statusIcon = '✓';
        statusClass = 'safe';
        riskBadge = 'Safe';
        riskBadgeClass = 'safe';
      }
    }
    
    // Get domain from URL
    let displayUrl = tab.url;
    try {
      const urlObj = new URL(tab.url);
      displayUrl = urlObj.hostname + urlObj.pathname;
    } catch (e) {
      displayUrl = tab.url;
    }
    
    // Truncate title if too long
    const displayTitle = tab.title && tab.title.length > 30 
      ? tab.title.substring(0, 30) + '...' 
      : tab.title || 'Untitled';
    
    tabItem.innerHTML = `
      <div class="tab-status-icon ${statusClass}">
        ${statusIcon}
      </div>
      <div class="tab-info">
        <div class="tab-title">${displayTitle}</div>
        <div class="tab-url">${displayUrl}</div>
        <div class="full-url-display" title="${tab.url}">
          ${tab.url}
        </div>
      </div>
      <div class="tab-risk-badge ${riskBadgeClass}">
        ${riskBadge}
      </div>
    `;
    
    // Click to switch to this tab
    tabItem.addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });
    
    return tabItem;
  }
});
