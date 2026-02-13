/**
 * SmartShield Extension Configuration
 * Centralized configuration for the Chrome extension
 * Optimized for fast current-page scanning
 */

const CONFIG = {
  // API Endpoints
  WHOIS_API_URL: 'https://smartshield-whois-api.onrender.com',
  
  // API Timeouts (in milliseconds)
  SCAN_TIMEOUT: 30000,        // 30s - Render free tier cold starts
  DETAIL_TIMEOUT: 30000,      // 30s - Details fetched lazily
  
  // Cache TTL (in milliseconds) - 10 minutes
  CACHE_TTL: 10 * 60 * 1000,
  
  // Storage Keys
  AUTH_STORAGE_KEY: 'smartshield_auth',
  RESULT_STORAGE_KEY_PREFIX: 'result_',
  
  // Badge Configuration
  BADGE_COLORS: {
    HIGH_RISK: '#ff0000',
    MEDIUM_RISK: '#ff8800',
    LOW_RISK: '#10b981'
  },
  
  // Scan Thresholds
  RISK_THRESHOLDS: {
    HIGH: 70,
    MEDIUM: 40,
    LOW: 0
  },

  // URLs to skip scanning
  SKIP_PREFIXES: ['chrome://', 'edge://', 'chrome-extension://', 'about:', 'moz-extension://']
};

// Export for use in background and popup scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
