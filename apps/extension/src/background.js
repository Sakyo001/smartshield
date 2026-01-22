/**
 * Background Script - Runs in the background
 * Handles the main phishing detection logic using SmartShield Whois API
 */

const WHOIS_API_URL = 'https://smartshield-whois-api.onrender.com';

/**
 * Check URL against Whois API
 */
async function checkURLWithAPI(url) {
  try {
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

    // Convert API response to extension format
    let riskLevel = 'low';
    let isSuspicious = false;
    let warnings = [];

    if (data.decision === 'PHISHING') {
      const confidence = data.confidence || 100;
      if (confidence >= 70) {
        riskLevel = 'high';
        isSuspicious = true;
        warnings.push('High risk of phishing detected');
      } else if (confidence >= 40) {
        riskLevel = 'medium';
        isSuspicious = true;
        warnings.push('Suspicious activity detected');
      }
    } else if (data.decision === 'LEGITIMATE') {
      riskLevel = 'low';
      isSuspicious = false;
    }

    return {
      isSuspicious: isSuspicious,
      riskLevel: riskLevel,
      warnings: warnings,
      decision: data.decision,
      confidence: data.confidence,
      rawResponse: data
    };
  } catch (error) {
    console.error('Error checking URL with API:', error);
    // Return a warning status if API fails
    return {
      isSuspicious: true,
      riskLevel: 'medium',
      warnings: ['Unable to verify - service unavailable'],
      decision: 'UNKNOWN',
      confidence: 0,
      error: error.message
    };
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
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

// Check pages automatically when they load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip browser internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      return;
    }
    
    // Check the page using API
    checkURLWithAPI(tab.url).then(result => {
      // Show warning badge if suspicious
      if (result.isSuspicious) {
        chrome.action.setBadgeText({
          text: '!',
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: result.riskLevel === 'high' ? '#ff0000' : '#ff8800',
          tabId: tabId
        });
      } else {
        chrome.action.setBadgeText({
          text: '',
          tabId: tabId
        });
      }
      
      // Store result for popup
      chrome.storage.local.set({
        [`result_${tabId}`]: result
      });
    }).catch(error => {
      console.error('Error checking page:', error);
    });
  }
});

console.log('PhishGuard background script loaded with Whois API integration');