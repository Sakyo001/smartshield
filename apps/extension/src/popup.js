/**
 * Popup Script - Runs when user clicks extension icon
 * Shows current page status and allows manual scanning
 */

document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const warningsDiv = document.getElementById('warnings');
  const scanButton = document.getElementById('scan-button');

  // Load current page status
  loadCurrentStatus();

  // Handle scan button click
  scanButton.addEventListener('click', function() {
    scanCurrentPage();
  });

  /**
   * Load the current page status from storage
   */
  async function loadCurrentStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.id) {
        chrome.storage.local.get([`result_${currentTab.id}`], function(data) {
          const result = data[`result_${currentTab.id}`];
          if (result) {
            displayResult(result);
          } else {
            statusText.textContent = 'Click "Scan This Page" to check for phishing';
          }
        });
      }
    } catch (error) {
      console.error('Error loading status:', error);
      statusText.textContent = 'Error loading page status';
    }
  }

  /**
   * Scan the current page manually
   */
  async function scanCurrentPage() {
    scanButton.textContent = 'Scanning...';
    scanButton.disabled = true;
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.url) {
        chrome.runtime.sendMessage({
          action: 'checkURL',
          url: currentTab.url
        }, function(result) {
          displayResult(result);
          scanButton.textContent = 'Scan This Page';
          scanButton.disabled = false;
        });
      }
    } catch (error) {
      console.error('Error scanning page:', error);
      statusText.textContent = 'Error scanning page';
      scanButton.textContent = 'Scan This Page';
      scanButton.disabled = false;
    }
  }

  /**
   * Display the scan result in the popup
   */
  function displayResult(result) {
    if (!result) {
      statusText.textContent = 'No result available';
      return;
    }

    // Update status based on result
    if (result.isSuspicious) {
      if (result.riskLevel === 'high') {
        statusDiv.className = 'status danger';
        statusText.textContent = '🚨 HIGH RISK - Likely phishing website!';
      } else {
        statusDiv.className = 'status warning';
        statusText.textContent = '⚠️ SUSPICIOUS - Be careful with this website';
      }
    } else {
      statusDiv.className = 'status safe';
      statusText.textContent = '✅ This website appears safe';
    }

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      warningsDiv.innerHTML = `
        <strong>Issues found:</strong>
        <ul>
          ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
      `;
    } else {
      warningsDiv.innerHTML = '<em>No issues detected</em>';
    }

    console.log('Popup displaying result:', result);
  }
});