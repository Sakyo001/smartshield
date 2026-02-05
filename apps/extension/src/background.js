/**
 * Background Script - Runs in the background
 * Handles the main phishing detection logic using SmartShield Whois API
 */

const WHOIS_API_URL = 'https://smartshield-whois-api.onrender.com';
let safeModeEnabled = true; // Default to enabled

// Initialize Safe Mode state
chrome.storage.local.get(['safeModeEnabled'], (result) => {
  safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
  console.log('Safe Mode initialized:', safeModeEnabled);
});

// Listen for Safe Mode changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'safeModeChanged') {
    safeModeEnabled = message.enabled;
    console.log('Safe Mode updated:', safeModeEnabled);
    
    // Update badge to reflect state
    updateBadge(safeModeEnabled);
    
    // If Safe Mode is enabled, scan all tabs immediately
    if (safeModeEnabled) {
      scanAllTabs();
    }
    
    return true;
  }
  
  if (message.action === 'checkURL') {
    console.log('Background received message:', message);
    checkURLWithAPI(message.url).then(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'scanAllTabsNow') {
    console.log('Popup requested scan of all tabs');
    scanAllTabsForPopup().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
});

// Update badge to show Safe Mode status
function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  }
}

// Initialize badge on install
chrome.runtime.onInstalled.addListener(() => {
  updateBadge(safeModeEnabled);
  
  // Scan all existing tabs on install/update
  if (safeModeEnabled) {
    scanAllTabs();
  }
});

// Scan all existing tabs on startup
chrome.runtime.onStartup.addListener(() => {
  if (safeModeEnabled) {
    scanAllTabs();
  }
});

// Function to scan all open tabs
async function scanAllTabs() {
  console.log('Scanning all open tabs...');
  
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      // Skip browser internal pages
      if (!tab.url || 
          tab.url.startsWith('chrome://') || 
          tab.url.startsWith('edge://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:')) {
        continue;
      }
      
      // Scan tab in background without waiting
      scanTabInBackground(tab.id, tab.url);
    }
    
    console.log(`Started background scan for ${tabs.length} tabs`);
  } catch (error) {
    console.error('Error scanning all tabs:', error);
  }
}

// Function to scan all tabs in current window (called from popup)
async function scanAllTabsForPopup() {
  console.log('Scanning all tabs from popup request...');
  
  try {
    // Query ALL tabs from ALL windows, not just current window
    const tabs = await chrome.tabs.query({});
    
    console.log('Found total tabs:', tabs.length);
    
    const scanPromises = [];
    
    for (const tab of tabs) {
      // Skip browser internal pages and APIs
      if (!tab.url || 
          tab.url.startsWith('chrome://') || 
          tab.url.startsWith('edge://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.includes('smartshield-whois-api')) {
        continue;
      }
      
      // Scan all tabs (don't wait for cache, force fresh scan if needed)
      scanPromises.push(scanTabInBackground(tab.id, tab.url));
    }
    
    // Wait for all scans to complete
    await Promise.all(scanPromises);
    console.log(`Completed scan of ${scanPromises.length} tabs from popup`);
    
  } catch (error) {
    console.error('Error scanning all tabs from popup:', error);
  }
}

// Scan a single tab in background and cache result
async function scanTabInBackground(tabId, url) {
  try {
    // Check if result is already cached
    const storageKey = `result_${url}`;
    const cached = await chrome.storage.local.get([storageKey]);
    
    if (cached[storageKey]) {
      console.log(`Using cached result for: ${url}`);
      updateTabBadge(tabId, cached[storageKey]);
      return;
    }
    
    // Perform scan
    const result = await checkURLWithAPI(url);
    
    // Cache the result
    await chrome.storage.local.set({
      [storageKey]: result
    });
    
    // Update badge
    updateTabBadge(tabId, result);
    
    console.log(`Completed background scan for: ${url}`);
  } catch (error) {
    console.error(`Error scanning tab ${tabId}:`, error);
  }
}

// Update tab badge based on scan result
function updateTabBadge(tabId, result) {
  if (result.isSuspicious) {
    chrome.action.setBadgeText({
      text: '⚠️',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: result.riskLevel === 'high' ? '#ef4444' : '#f59e0b',
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({
      text: '✓',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#10b981',
      tabId: tabId
    });
  }
}

// Auto-scan on tab update (only if Safe Mode is enabled)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!safeModeEnabled) {
    console.log('Auto-scan skipped: Safe Mode is disabled');
    return;
  }

  if (changeInfo.status === 'complete' && tab.url) {
    // Skip chrome:// urls and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    console.log('Auto-scanning page (Safe Mode ON):', tab.url);
    
    // Check if we already have a cached result
    const storageKey = `result_${tab.url}`;
    chrome.storage.local.get([storageKey], (cached) => {
      if (cached[storageKey]) {
        console.log('Using cached result for updated tab:', tab.url);
        handleScanResult(tabId, tab.url, cached[storageKey]);
      } else {
        // Perform fresh scan
        checkURLWithAPI(tab.url).then((result) => {
          handleScanResult(tabId, tab.url, result);
        });
      }
    });
  }
});

// Handle scan result (DRY - Don't Repeat Yourself)
function handleScanResult(tabId, url, result) {
  // Cache the result
  chrome.storage.local.set({
    [`result_${url}`]: result
  });
  
  if (result && result.isSuspicious) {
    // Show warning badge
    updateTabBadge(tabId, result);
    
    // INSTANT NOTIFICATION - Show immediately when threat detected
    const isHighRisk = result.riskLevel === 'high' || result.riskScore >= 70;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon48.png',
      title: isHighRisk ? '🚨 Dangerous Website Detected' : '⚠️ Suspicious Website',
      message: isHighRisk 
        ? 'SmartShield has detected a phishing attempt. Leave this site immediately.'
        : 'SmartShield has flagged this page as suspicious. Proceed with caution.',
      priority: 2,
      requireInteraction: isHighRisk
    });
    
    // Send result to content script immediately for instant warning
    chrome.tabs.sendMessage(tabId, {
      action: 'showThreatWarning',
      result: result
    }).catch(err => console.log('Content script not ready yet'));
  } else if (result) {
    // Clear badge for safe sites or show checkmark
    updateTabBadge(tabId, result);
  }
}

/**
 * Check URL against Whois API
 */
async function checkURLWithAPI(url) {
  try {
    // First, get the scan result
    const response = await fetch(`${WHOIS_API_URL}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Scan result from API:', data);

    // Then, get detailed WHOIS, DNS, and SSL information
    let details = null;
    try {
      const domainInfoResponse = await fetch(`${WHOIS_API_URL}/api/domain-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
        timeout: 30000
      });

      if (domainInfoResponse.ok) {
        const domainData = await domainInfoResponse.json();
        details = {
          whois: domainData.whois,
          dns: domainData.dns,
          ssl: domainData.ssl,
          riskAdjustment: domainData.risk_adjustment,
          registrar: domainData.whois?.registrar || 'Unknown',
          creationDate: domainData.whois?.creation_date || 'Unknown',
          expirationDate: domainData.whois?.expiration_date || 'Unknown'
        };
      }
    } catch (detailError) {
      console.warn('Could not fetch detailed domain info:', detailError);
    }

    // Convert API response to extension format
    // Match the web app's logic exactly:
    // - For PHISHING: confidence represents danger level (100 = very dangerous)
    // - For LEGITIMATE: confidence represents safety (100 = very safe, so low risk)
    let riskLevel = 'low';
    let isSuspicious = false;
    let warnings = [];
    let riskScore = 0;

    console.log(`🔍 Processing scan result for ${url}:`, {
      decision: data.decision,
      confidence: data.confidence,
      riskScore: data.risk_score
    });

    if (data.decision === 'PHISHING') {
      // If PHISHING, confidence represents danger level (100 = very dangerous)
      riskScore = Math.round(data.confidence || 100);
      console.log(`  PHISHING decision: riskScore=${riskScore}`);
      
      if (riskScore >= 70) {
        riskLevel = 'high';
        isSuspicious = true;
        status = 'Dangerous';
        warnings.push('High risk of phishing detected');
      } else if (riskScore >= 40) {
        riskLevel = 'medium';
        isSuspicious = true;
        status = 'Warning';
        warnings.push('Suspicious activity detected');
      } else {
        riskLevel = 'low';
        isSuspicious = false;
        status = 'Safe';
      }
    } else if (data.decision === 'LEGITIMATE') {
      // If LEGITIMATE, confidence represents safety (100 = very safe)
      // Invert it to get risk score (100% safe = 0% risk)
      riskScore = Math.round(100 - (data.confidence || 0));
      console.log(`  LEGITIMATE decision: confidence=${data.confidence}, riskScore=${riskScore}`);
      
      if (riskScore >= 70) {
        riskLevel = 'high';
        isSuspicious = true;
        status = 'Dangerous';
        warnings.push('High risk detected despite legitimate classification');
      } else if (riskScore >= 40) {
        riskLevel = 'medium';
        isSuspicious = true;
        status = 'Warning';
        warnings.push('Some suspicious indicators detected');
      } else {
        riskLevel = 'low';
        isSuspicious = false;
        status = 'Safe';
      }
    }

    // Check for HTTP (insecure)
    if (url.toLowerCase().startsWith('http://')) {
      warnings.push('Insecure HTTP connection - data is not encrypted');
      if (riskScore < 40) {
        riskScore = 40;
        riskLevel = 'medium';
        isSuspicious = true;
      }
    }

    return {
      isSuspicious: isSuspicious,
      riskLevel: riskLevel,
      riskScore: riskScore,
      warnings: warnings,
      decision: data.decision,
      confidence: data.confidence,
      details: details,
      rawResponse: data
    };
  } catch (error) {
    console.error('Error checking URL with API:', error);
    // Return a warning status if API fails
    return {
      isSuspicious: true,
      riskLevel: 'medium',
      riskScore: 50,
      warnings: ['Unable to verify - service unavailable'],
      decision: 'UNKNOWN',
      confidence: 0,
      details: null,
      error: error.message
    };
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.action === 'safeModeChanged') {
    safeModeEnabled = message.enabled;
    updateBadge(safeModeEnabled);
    console.log('Safe Mode updated:', safeModeEnabled);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'checkURL') {
    // Check the URL using Whois API
    checkURLWithAPI(message.url).then(result => {
      console.log('Detection result:', result);
      sendResponse(result);
    }).catch(error => {
      console.error('Error in checkURL:', error);
      sendResponse({
        isSuspicious: true,
        riskLevel: 'medium',
        warnings: ['Error during scan'],
        error: error.message
      });
    });
    
    return true; // Keep message channel open
  }
});

// Check pages automatically when they load (only if Safe Mode is enabled)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip browser internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    // Only auto-scan if Safe Mode is enabled
    if (!safeModeEnabled) {
      console.log('Auto-scan skipped: Safe Mode is disabled');
      return;
    }
    
    console.log('Auto-scanning page (Safe Mode ON):', tab.url);
    
    // Check if we already have a cached result
    const storageKey = `result_${tab.url}`;
    chrome.storage.local.get([storageKey], (cached) => {
      if (cached[storageKey]) {
        console.log('Using cached result:', tab.url);
        handleScanResult(tabId, tab.url, cached[storageKey]);
      } else {
        // Perform fresh scan
        checkURLWithAPI(tab.url).then((result) => {
          handleScanResult(tabId, tab.url, result);
        }).catch(error => {
          console.error('Error checking page:', error);
        });
      }
    });
  }
});

// Real-time scanning when switching tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      // Skip browser internal pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) {
        return;
      }
      
      // Only auto-scan if Safe Mode is enabled
      if (!safeModeEnabled) {
        console.log('Real-time scan skipped: Safe Mode is disabled');
        return;
      }
      
      console.log('Real-time scanning on tab switch:', tab.url);
      
      // Check if we have a cached result first
      const storageKey = `result_${tab.url}`;
      chrome.storage.local.get([storageKey], (cached) => {
        if (cached[storageKey]) {
          console.log('Using cached result for activated tab:', tab.url);
          
          // If it's suspicious, show notification again
          if (cached[storageKey].isSuspicious) {
            const isHighRisk = cached[storageKey].riskLevel === 'high' || cached[storageKey].riskScore >= 70;
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'images/icon48.png',
              title: isHighRisk ? '🚨 Dangerous Website Detected' : '⚠️ Suspicious Website',
              message: isHighRisk 
                ? 'SmartShield has detected a phishing attempt. Leave this site immediately.'
                : 'SmartShield has flagged this page as suspicious. Proceed with caution.',
              priority: 2,
              requireInteraction: isHighRisk
            });
            
            // Send result to content script immediately
            chrome.tabs.sendMessage(activeInfo.tabId, {
              action: 'showThreatWarning',
              result: cached[storageKey]
            }).catch(err => console.log('Content script not ready yet'));
          }
          
          updateTabBadge(activeInfo.tabId, cached[storageKey]);
        } else {
          // No cached result, scan in background
          scanTabInBackground(activeInfo.tabId, tab.url).then(() => {
            // After scan, check if still suspicious
            chrome.storage.local.get([storageKey], (result) => {
              if (result[storageKey] && result[storageKey].isSuspicious) {
                const isHighRisk = result[storageKey].riskLevel === 'high' || result[storageKey].riskScore >= 70;
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'images/icon48.png',
                  title: isHighRisk ? '🚨 Dangerous Website Detected' : '⚠️ Suspicious Website',
                  message: isHighRisk 
                    ? 'SmartShield has detected a phishing attempt. Leave this site immediately.'
                    : 'SmartShield has flagged this page as suspicious. Proceed with caution.',
                  priority: 2,
                  requireInteraction: isHighRisk
                });
                
                chrome.tabs.sendMessage(activeInfo.tabId, {
                  action: 'showThreatWarning',
                  result: result[storageKey]
                }).catch(err => console.log('Content script not ready yet'));
              }
            });
          });
        }
      });
    }
  });
});

console.log('SmartShield background script loaded with Whois API integration');