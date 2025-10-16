/**
 * Background Script - Runs in the background
 * Handles the main phishing detection logic
 */

// Load our detection library
importScripts('../../../packages/ml/index.js');

// Create detector instance
const detector = new PhishingDetector();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.action === 'checkURL') {
    // Check the URL for phishing
    const result = detector.checkURL(message.url);
    console.log('Detection result:', result);
    sendResponse(result);
  }
  
  return true; // Keep message channel open
});

// Check pages automatically when they load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip browser internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      return;
    }
    
    // Check the page
    const result = detector.checkURL(tab.url);
    
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
  }
});

console.log('PhishGuard background script loaded');