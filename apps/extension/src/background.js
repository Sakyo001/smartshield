/**
 * Background Script - SmartShield
 * Optimized for fast real-time scanning of the CURRENT page only.
 * 
 * Key optimizations:
 * - Single API call for scan (domain-info fetched lazily on demand)
 * - Request deduplication: only one in-flight request per URL
 * - Smart cache with TTL to avoid redundant scans
 * - No "scan all tabs" overhead — only current page matters
 * - AbortController for proper request cancellation/timeout
 */

const WHOIS_API_URL = 'https://smartshield-whois-api.onrender.com';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SCAN_TIMEOUT = 30000;        // 30s for scan (Render cold-start can be slow)
const DETAIL_TIMEOUT = 30000;      // 30s for details (lazy)

let safeModeEnabled = true;

// ── In-flight request deduplication ──
// Maps URL → Promise so concurrent requests for the same URL share one API call
const pendingScans = new Map();

// ── In-memory result cache with timestamps ──
const resultCache = new Map();

// ── Initialize ──
chrome.storage.local.get(['safeModeEnabled'], (result) => {
  safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
  updateBadge(safeModeEnabled);
});

// ── Message Listener (single, unified) ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'safeModeChanged') {
    safeModeEnabled = message.enabled;
    updateBadge(safeModeEnabled);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'checkURL') {
    scanURL(message.url).then(sendResponse);
    return true; // keep channel open for async
  }

  if (message.action === 'getDetails') {
    fetchDomainDetails(message.url).then(sendResponse);
    return true;
  }
});

// ── Badge helpers ──
function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#10b981' : '#6b7280' });
}

function updateTabBadge(tabId, result) {
  if (!result) return;
  if (result.isSuspicious) {
    chrome.action.setBadgeText({ text: '!', tabId });
    chrome.action.setBadgeBackgroundColor({
      color: result.riskLevel === 'high' ? '#ef4444' : '#f59e0b',
      tabId
    });
  } else {
    chrome.action.setBadgeText({ text: '✓', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });
  }
}

// ── Should we skip this URL? ──
function shouldSkip(url) {
  if (!url) return true;
  const skip = ['chrome://', 'edge://', 'chrome-extension://', 'about:', 'moz-extension://'];
  return skip.some(prefix => url.startsWith(prefix));
}

// ── Core: Fast URL scan with dedup + cache ──
async function scanURL(url) {
  if (shouldSkip(url)) return null;

  // 1. Check in-memory cache (fastest)
  const cached = resultCache.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.result;
  }

  // 2. Check storage cache
  const storageKey = `result_${url}`;
  try {
    const stored = await chrome.storage.local.get([storageKey, `${storageKey}_ts`]);
    if (stored[storageKey] && stored[`${storageKey}_ts`]) {
      const age = Date.now() - stored[`${storageKey}_ts`];
      if (age < CACHE_TTL) {
        // Still fresh — put in memory cache and return
        resultCache.set(url, { result: stored[storageKey], timestamp: stored[`${storageKey}_ts`] });
        return stored[storageKey];
      }
    }
  } catch (e) { /* storage error, continue to API */ }

  // 3. Deduplicate: if there's already an in-flight request for this URL, wait for it
  if (pendingScans.has(url)) {
    return pendingScans.get(url);
  }

  // 4. Fire the API call
  const scanPromise = performScan(url);
  pendingScans.set(url, scanPromise);

  try {
    const result = await scanPromise;
    // Cache result
    const now = Date.now();
    resultCache.set(url, { result, timestamp: now });
    chrome.storage.local.set({
      [storageKey]: result,
      [`${storageKey}_ts`]: now
    });
    return result;
  } finally {
    pendingScans.delete(url);
  }
}

// ── Perform the actual API scan (single call, with AbortController) ──
async function performScan(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Scan timeout'), SCAN_TIMEOUT);

  try {
    const response = await fetch(`${WHOIS_API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    return processScanResult(url, data);

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn('Scan timed out for:', url);
    } else {
      console.error('Scan error for', url, error.message);
    }

    // Return a non-error safe result so the UI doesn't show "Scan Error"
    return {
      isSuspicious: false,
      riskLevel: 'low',
      riskScore: 0,
      warnings: [],
      decision: 'UNKNOWN',
      confidence: 0,
      details: null,
      scanPending: true
    };
  }
}

// ── Process raw API scan result into extension format ──
function processScanResult(url, data) {
  let riskLevel = 'low';
  let isSuspicious = false;
  let warnings = [];
  let riskScore = 0;

  if (data.decision === 'PHISHING') {
    riskScore = Math.round(data.confidence || 100);
    if (riskScore >= 70) {
      riskLevel = 'high';
      isSuspicious = true;
      warnings.push('High risk of phishing detected');
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
      isSuspicious = true;
      warnings.push('Suspicious activity detected');
    }
  } else if (data.decision === 'LEGITIMATE') {
    riskScore = Math.round(100 - (data.confidence || 0));
    if (riskScore >= 70) {
      riskLevel = 'high';
      isSuspicious = true;
      warnings.push('High risk detected despite legitimate classification');
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
      isSuspicious = true;
      warnings.push('Some suspicious indicators detected');
    }
  }

  if (url.toLowerCase().startsWith('http://')) {
    warnings.push('Insecure HTTP connection - data is not encrypted');
    if (riskScore < 40) {
      riskScore = 40;
      riskLevel = 'medium';
      isSuspicious = true;
    }
  }

  return {
    isSuspicious,
    riskLevel,
    riskScore,
    warnings,
    decision: data.decision,
    confidence: data.confidence,
    details: null, // details fetched lazily on demand
    rawResponse: data
  };
}

// ── Lazy: Fetch domain details only when user expands the details panel ──
async function fetchDomainDetails(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Detail fetch timeout'), DETAIL_TIMEOUT);

  try {
    const response = await fetch(`${WHOIS_API_URL}/api/domain-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API ${response.status}`);
    const domainData = await response.json();

    const details = {
      whois: domainData.whois,
      dns: domainData.dns,
      ssl: domainData.ssl,
      riskAdjustment: domainData.risk_adjustment,
      registrar: domainData.whois?.registrar || 'Unknown',
      creationDate: domainData.whois?.creation_date || 'Unknown',
      expirationDate: domainData.whois?.expiration_date || 'Unknown'
    };

    // Attach details to cached result
    const storageKey = `result_${url}`;
    const stored = await chrome.storage.local.get([storageKey]);
    if (stored[storageKey]) {
      stored[storageKey].details = details;
      chrome.storage.local.set({ [storageKey]: stored[storageKey] });
      // Update memory cache too
      const cached = resultCache.get(url);
      if (cached) {
        cached.result.details = details;
      }
    }

    return details;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Domain detail fetch failed:', error.message);
    return null;
  }
}

// ── Auto-scan on navigation (current tab only, no "scan all") ──
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || !safeModeEnabled) return;
  if (shouldSkip(tab.url)) return;

  scanURL(tab.url).then(result => {
    if (!result) return;
    updateTabBadge(tabId, result);

    // Always notify content script so it shows a banner (safe or dangerous)
    chrome.tabs.sendMessage(tabId, {
      action: 'showScanResult',
      result
    }).catch(() => {}); // content script may not be ready

    if (result.isSuspicious) {
      // Browser notification for threats only
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
    }
  });
});

// ── On tab switch: show cached badge instantly (no new API call) ──
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab || !tab.url || shouldSkip(tab.url)) return;

    // Just update badge from cache — no new API call
    const cached = resultCache.get(tab.url);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      updateTabBadge(activeInfo.tabId, cached.result);
    }
  });
});

// ── On install: just set up badge ──
chrome.runtime.onInstalled.addListener(() => {
  updateBadge(safeModeEnabled);
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge(safeModeEnabled);
});

console.log('SmartShield background loaded — fast current-page scanning');
