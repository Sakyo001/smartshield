/**
 * Shared Utilities
 * Common functions used across PhishGuard packages
 */

/**
 * URL Helper Functions
 */
const URLUtils = {
  /**
   * Check if a URL is valid
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Extract domain from URL
   */
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  },

  /**
   * Check if URL uses HTTPS
   */
  isSecure(url) {
    return url.startsWith('https://');
  },

  /**
   * Get URL without protocol and path
   */
  getCleanDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
};

/**
 * String Helper Functions
 */
const StringUtils = {
  /**
   * Check if text contains any of the given keywords
   */
  containsAny(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  },

  /**
   * Count occurrences of keywords in text
   */
  countKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.reduce((count, keyword) => {
      return count + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
  },

  /**
   * Remove special characters and get clean text
   */
  cleanText(text) {
    return text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }
};

/**
 * Security Helper Functions
 */
const SecurityUtils = {
  /**
   * Common phishing keywords
   */
  PHISHING_KEYWORDS: [
    'verify', 'account', 'update', 'login', 'secure',
    'bank', 'paypal', 'amazon', 'microsoft', 'apple',
    'urgent', 'click', 'confirm', 'suspended', 'limited',
    'expire', 'renewal', 'warning', 'notice', 'action'
  ],

  /**
   * Check if text contains phishing keywords
   */
  hasPhishingKeywords(text) {
    return StringUtils.containsAny(text, this.PHISHING_KEYWORDS);
  },

  /**
   * Count phishing keywords in text
   */
  countPhishingKeywords(text) {
    return StringUtils.countKeywords(text, this.PHISHING_KEYWORDS);
  },

  /**
   * Check if domain looks suspicious
   */
  isSuspiciousDomain(domain) {
    if (!domain) return false;
    
    // Check for IP addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      return true;
    }
    
    // Check for too many subdomains
    if (domain.split('.').length > 4) {
      return true;
    }
    
    // Check for suspicious patterns
    if (domain.includes('--') || domain.includes('..')) {
      return true;
    }
    
    return false;
  }
};

/**
 * Logger for consistent logging across packages
 */
const Logger = {
  info(message, data = null) {
    console.log(`[PhishGuard Info] ${message}`, data || '');
  },
  
  warn(message, data = null) {
    console.warn(`[PhishGuard Warning] ${message}`, data || '');
  },
  
  error(message, error = null) {
    console.error(`[PhishGuard Error] ${message}`, error || '');
  }
};

// Export for use in other packages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    URLUtils,
    StringUtils,
    SecurityUtils,
    Logger
  };
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.PhishGuardUtils = {
    URLUtils,
    StringUtils,
    SecurityUtils,
    Logger
  };
}