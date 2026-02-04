
/**
 * Content Script - Runs on every webpage
 * Provides real-time protection and warnings (only when Safe Mode is enabled)
 */

// Get Safe Mode status and check current page
chrome.storage.local.get(['safeModeEnabled'], (result) => {
  const safeModeEnabled = result.safeModeEnabled !== undefined ? result.safeModeEnabled : true;
  
  console.log('[SmartShield Content] Safe Mode status:', safeModeEnabled);
  
  // Only run protection if Safe Mode is enabled
  if (!safeModeEnabled) {
    console.log('[SmartShield Content] Skipping page check - Safe Mode is disabled');
    return;
  }

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
  
  // Listen for instant warnings from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showThreatWarning' && message.result) {
      showWarning(message.result);
      sendResponse({ displayed: true });
    }
  });

  /**
   * Show warning banner at top of page using Shadow DOM
   */
  function showWarning(result) {
    // Check if running inside our own extension context to prevent loops
    if (window.location.protocol === 'chrome-extension:') return;

    // Remove existing warning if any
    const existing = document.getElementById('smartshield-root');
    if (existing) existing.remove();

    // Create host element
    const host = document.createElement('div');
    host.id = 'smartshield-root';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100%';
    host.style.zIndex = '2147483647'; // Max z-index
    host.style.pointerEvents = 'none'; // Allow clicking through the container, but enable for banner
    
    document.body.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'closed' });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        :host {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .banner {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 2px solid ${result.riskLevel === 'high' ? '#ef4444' : '#eab308'};
            color: #ededed;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            pointer-events: auto;
            transform: translateY(-100%);
            animation: slideDown 0.5s forwards ease-out;
        }
        
        @keyframes slideDown {
            to { transform: translateY(0); }
        }

        .content {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .icon {
            font-size: 24px;
        }

        .text h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: ${result.riskLevel === 'high' ? '#ef4444' : '#eab308'};
        }
        
        .text p {
            margin: 0;
            font-size: 14px;
            color: #ccc;
        }

        .actions {
            display: flex;
            gap: 12px;
        }

        button {
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
        }

        .btn-ignore {
            background: transparent;
            color: #888;
            border: 1px solid #444;
        }
        
        .btn-ignore:hover {
            border-color: #666;
            color: #ededed;
        }

        .btn-leave {
            background: ${result.riskLevel === 'high' ? '#ef4444' : '#eab308'};
            color: ${result.riskLevel === 'high' ? '#fff' : '#000'};
        }
        
        .btn-leave:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
    `;

    // HTML Content
    const banner = document.createElement('div');
    banner.className = 'banner';
    
    const riskTitle = result.riskLevel === 'high' ? 'High Risk Website Detected' : 'Suspicious Website Detected';
    const riskDesc = result.riskLevel === 'high' 
        ? 'SmartShield has identified this page as a likely phishing attempt. Entering personal information is dangerous.'
        : 'SmartShield has flagged this page as suspicious. Proceed with caution.';

    banner.innerHTML = `
        <div class="content">
            <span class="icon">${result.riskLevel === 'high' ? '🚨' : '⚠️'}</span>
            <div class="text">
                <h3>${riskTitle}</h3>
                <p>${riskDesc}</p>
            </div>
        </div>
        <div class="actions">
            <button class="btn-ignore" id="ignore-btn">I understand the risk</button>
            <button class="btn-leave" id="leave-btn">Get me out of here</button>
        </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(banner);

    // Event Listeners
    banner.querySelector('#leave-btn').addEventListener('click', () => {
        window.history.back(); // Go back
        // If back fails (new tab), fallback
        setTimeout(() => {
            window.location.href = 'https://google.com';
        }, 500);
    });

    banner.querySelector('#ignore-btn').addEventListener('click', () => {
        host.remove(); // Remove banner
    });
  }
  }
});
