/**
 * Background Script - SmartShield
 * Optimized for fast real-time scanning.
 * 
 * Key optimizations:
 * - Scans by ROOT DOMAIN (not full URL) — sub-routes reuse the cached result
 * - Single API call for scan (domain-info fetched lazily on demand)
 * - Request deduplication: only one in-flight request per domain
 * - Smart cache with TTL to avoid redundant scans
 * - AbortController for proper request cancellation/timeout
 */

const WHOIS_API_URL = 'https://smartshield-whois-api.onrender.com';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SCAN_TIMEOUT = 30000;
const DETAIL_TIMEOUT = 30000;

let safeModeEnabled = true;

// ── In-flight request deduplication ──
const pendingScans = new Map();

// ── In-memory result cache keyed by ROOT DOMAIN ──
const resultCache = new Map();

// ── Track which tabs have already been notified (prevents re-notify on sub-routes) ──
// Maps tabId → rootDomain that was already shown
const tabNotified = new Map();

// ── Initialize ──
chrome.storage.local.get(['safeModeEnabled'], (result) => {
  safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
  updateBadge(safeModeEnabled);
});

// ── Extract root domain from any URL ──
function getRootDomain(url) {
  try {
    const u = new URL(url);
    return u.protocol + '//' + u.hostname;
  } catch {
    return url;
  }
}

// ── Message Listener ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'safeModeChanged') {
    safeModeEnabled = message.enabled;
    updateBadge(safeModeEnabled);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'checkURL') {
    const rootDomain = getRootDomain(message.url);
    scanURL(rootDomain).then(sendResponse);
    return true;
  }

  if (message.action === 'getDetails') {
    const rootDomain = getRootDomain(message.url);
    fetchDomainDetails(rootDomain).then(sendResponse);
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
  const skip = ['chrome://', 'edge://', 'chrome-extension://', 'about:', 'moz-extension://', 'devtools://'];
  return skip.some(prefix => url.startsWith(prefix));
}

// ── Core: Fast URL scan with dedup + cache (keyed by root domain) ──
async function scanURL(rootDomain) {
  if (shouldSkip(rootDomain)) return null;

  // 1. Check in-memory cache
  const cached = resultCache.get(rootDomain);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.result;
  }

  // 2. Check storage cache
  const storageKey = `result_${rootDomain}`;
  try {
    const stored = await chrome.storage.local.get([storageKey, `${storageKey}_ts`]);
    if (stored[storageKey] && stored[`${storageKey}_ts`]) {
      const age = Date.now() - stored[`${storageKey}_ts`];
      if (age < CACHE_TTL) {
        resultCache.set(rootDomain, { result: stored[storageKey], timestamp: stored[`${storageKey}_ts`] });
        return stored[storageKey];
      }
    }
  } catch (e) { /* continue to API */ }

  // 3. Deduplicate in-flight requests
  if (pendingScans.has(rootDomain)) {
    return pendingScans.get(rootDomain);
  }

  // 4. Fire the API call
  const scanPromise = performScan(rootDomain);
  pendingScans.set(rootDomain, scanPromise);

  try {
    const result = await scanPromise;
    const now = Date.now();
    resultCache.set(rootDomain, { result, timestamp: now });
    chrome.storage.local.set({
      [storageKey]: result,
      [`${storageKey}_ts`]: now
    });
    return result;
  } finally {
    pendingScans.delete(rootDomain);
  }
}

// ── Perform the actual API scan ──
async function performScan(rootDomain) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Scan timeout'), SCAN_TIMEOUT);

  try {
    const response = await fetch(`${WHOIS_API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: rootDomain }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    return processScanResult(rootDomain, data);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('Scan timed out for:', rootDomain);
    } else {
      console.error('Scan error for', rootDomain, error.message);
    }

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

// ── Process raw API scan result ──
function processScanResult(rootDomain, data) {
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

  if (rootDomain.startsWith('http://')) {
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
    details: null,
    rawResponse: data
  };
}

// ── Lazy: Fetch domain details ──
async function fetchDomainDetails(rootDomain) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Detail fetch timeout'), DETAIL_TIMEOUT);

  try {
    const response = await fetch(`${WHOIS_API_URL}/api/domain-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: rootDomain }),
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
    const storageKey = `result_${rootDomain}`;
    const stored = await chrome.storage.local.get([storageKey]);
    if (stored[storageKey]) {
      stored[storageKey].details = details;
      chrome.storage.local.set({ [storageKey]: stored[storageKey] });
      const cached = resultCache.get(rootDomain);
      if (cached) cached.result.details = details;
    }

    return details;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Domain detail fetch failed:', error.message);
    return null;
  }
}

// ── Auto-scan on navigation ──
// Only scans when the ROOT DOMAIN changes for each tab.
// Sub-route navigations within the same domain are skipped entirely.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || !safeModeEnabled) return;
  if (shouldSkip(tab.url)) return;

  const rootDomain = getRootDomain(tab.url);

  // If we already notified this tab for this root domain, skip entirely
  if (tabNotified.get(tabId) === rootDomain) {
    // Just update badge from cache
    const cached = resultCache.get(rootDomain);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      updateTabBadge(tabId, cached.result);
    }
    return;
  }

  scanURL(rootDomain).then(result => {
    if (!result) return;

    // Mark this tab as notified for this domain
    tabNotified.set(tabId, rootDomain);

    updateTabBadge(tabId, result);

    // Send result to content script for banner display
    chrome.tabs.sendMessage(tabId, {
      action: 'showScanResult',
      result,
      rootDomain
    }).catch(() => {});

    if (result.isSuspicious) {
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

// ── On tab switch: show cached badge instantly ──
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab || !tab.url || shouldSkip(tab.url)) return;
    const rootDomain = getRootDomain(tab.url);
    const cached = resultCache.get(rootDomain);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      updateTabBadge(activeInfo.tabId, cached.result);
    }
  });
});

// ── Clean up tabNotified when tab is closed ──
chrome.tabs.onRemoved.addListener((tabId) => {
  tabNotified.delete(tabId);
});

// ── On install/startup ──
chrome.runtime.onInstalled.addListener(() => {
  updateBadge(safeModeEnabled);
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge(safeModeEnabled);
});

console.log('SmartShield background loaded — root-domain scanning');
