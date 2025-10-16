/**
 * Content Script - Runs on every webpage
 * Provides real-time protection and warnings
 */

// Only run on actual web pages
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
  
  // Check current page when script loads
  chrome.runtime.sendMessage({
    action: 'checkURL',
    url: window.location.href
  }, (result) => {
    if (result && result.isSuspicious) {
      showWarning(result);
    }
  });

  /**
   * Show warning banner at top of page
   */
  function showWarning(result) {
    // Don't show multiple warnings
    if (document.getElementById('phishguard-warning')) {
      return;
    }

    const warning = document.createElement('div');
    warning.id = 'phishguard-warning';
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(45deg, #ff4444, #cc0000);
      color: white;
      padding: 12px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      border-bottom: 2px solid #990000;
    `;

    const riskEmoji = result.riskLevel === 'high' ? '🚨' : '⚠️';
    
    warning.innerHTML = `
      <div>
        ${riskEmoji} <strong>PHISHING WARNING</strong> - This website may be dangerous (Risk: ${result.riskLevel.toUpperCase()})
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: 15px;
          background: white;
          color: #cc0000;
          border: none;
          padding: 4px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
        ">Dismiss</button>
      </div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
        Warnings: ${result.warnings.join(', ')}
      </div>
    `;

    document.body.insertBefore(warning, document.body.firstChild);
    
    // Add padding to prevent content overlap
    document.body.style.paddingTop = '80px';
    
    console.log('PhishGuard warning shown:', result);
  }

  console.log('PhishGuard content script loaded on:', window.location.href);
}