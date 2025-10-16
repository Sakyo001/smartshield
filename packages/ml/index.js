/**
 * Simple Phishing Detection
 * Human-readable rules for detecting phishing websites
 */

class PhishingDetector {
  /**
   * Check if a URL looks suspicious
   * @param {string} url - The URL to check
   * @returns {object} Detection result
   */
  checkURL(url) {
    const result = {
      url: url,
      isSuspicious: false,
      riskLevel: 'low',
      warnings: [],
      score: 0
    };

    // Basic URL checks
    if (this.isURLTooLong(url)) {
      result.warnings.push('URL is unusually long');
      result.score += 2;
    }

    if (this.hasIPAddress(url)) {
      result.warnings.push('Uses IP address instead of domain name');
      result.score += 3;
    }

    if (this.hasSuspiciousKeywords(url)) {
      result.warnings.push('Contains suspicious keywords');
      result.score += 2;
    }

    if (!this.isHTTPS(url)) {
      result.warnings.push('Not using secure HTTPS connection');
      result.score += 1;
    }

    if (this.hasTooManySubdomains(url)) {
      result.warnings.push('Too many subdomains');
      result.score += 2;
    }

    // Determine risk level
    if (result.score >= 5) {
      result.riskLevel = 'high';
      result.isSuspicious = true;
    } else if (result.score >= 3) {
      result.riskLevel = 'medium';
      result.isSuspicious = true;
    }

    return result;
  }

  /**
   * Check if URL is too long (suspicious)
   */
  isURLTooLong(url) {
    return url.length > 75;
  }

  /**
   * Check if URL uses IP address instead of domain
   */
  hasIPAddress(url) {
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
    return ipPattern.test(url);
  }

  /**
   * Check for suspicious keywords
   */
  hasSuspiciousKeywords(url) {
    const suspiciousWords = [
      'verify', 'account', 'update', 'login', 'secure',
      'bank', 'paypal', 'amazon', 'microsoft', 'apple',
      'urgent', 'click', 'confirm', 'suspended', 'limited'
    ];

    const lowerURL = url.toLowerCase();
    return suspiciousWords.some(word => lowerURL.includes(word));
  }

  /**
   * Check if using HTTPS
   */
  isHTTPS(url) {
    return url.startsWith('https://');
  }

  /**
   * Check if has too many subdomains
   */
  hasTooManySubdomains(url) {
    try {
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      const parts = domain.split('.');
      return parts.length > 4; // More than 4 parts suggests many subdomains
    } catch (e) {
      return false;
    }
  }
}

// Export for use in other packages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhishingDetector };
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.PhishingDetector = PhishingDetector;
}