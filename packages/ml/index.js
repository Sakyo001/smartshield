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
      score: 0,
      isHTTP: false,
      protocol: url.startsWith('https://') ? 'https' : (url.startsWith('http://') ? 'http' : 'unknown')
    };

    // Basic URL checks
    // Check for HTTP specifically (much more serious)
    if (url.startsWith('http://')) {
      result.warnings.push('Using unsecure HTTP protocol (not HTTPS)');
      result.score += 3; // Higher score for HTTP
      result.isHTTP = true;
    } else if (!this.isHTTPS(url)) {
      result.warnings.push('Not using secure HTTPS connection');
      result.score += 1;
    }

    if (this.isURLTooLong(url)) {

    if (this.hasTooManySubdomains(url)) {
      result.warnings.push('Too many subdomains');
      result.score += 2;
    }

    if (this.hasUnusualPath(url)) {
      result.warnings.push('Path contains suspicious patterns or excessive parameters');
      result.score += 2;
    }

    if (this.hasUnusualDomainName(url)) {
      result.warnings.push('Domain name appears unusual or mimics legitimate services');
      result.score += 3;
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
    // HTTP is insecure - always flag as warning
    if (url.startsWith('http://')) {
      return false;
    }
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

  /**
   * Check if path contains unusual patterns
   * Phishing sites often use suspicious paths with many parameters, encoded characters, or obfuscation
   */
  hasUnusualPath(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;

      // Check for excessive query parameters
      const paramCount = (urlObj.search.match(/[?&]/g) || []).length;
      if (paramCount > 5) {
        return true; // Too many parameters is suspicious
      }

      // Check for encoded/obfuscated characters in path
      if (/%[0-9a-fA-F]{2}/.test(path)) {
        // URL encoding detected - check if excessive
        const encodedChars = (path.match(/%[0-9a-fA-F]{2}/g) || []).length;
        if (encodedChars > 3) {
          return true; // Excessive URL encoding is suspicious
        }
      }

      // Check for suspicious path patterns
      const suspiciousPaths = [
        /\/admin[^\/]*\//i,
        /\/login[^\/]*\//i,
        /\/api[^\/]*\/verify/i,
        /\/secure[^\/]*\/login/i,
        /\/update[^\/]*\/download/i,
        /\.exe|\.zip|\.rar|\.iso/i, // Executable files
        /redirect|forward|go\?/i, // Redirection patterns
      ];

      return suspiciousPaths.some(pattern => pattern.test(path));
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if domain name appears unusual or mimics legitimate services
   * Phishing sites often use domain names that closely resemble popular services
   */
  hasUnusualDomainName(url) {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname.toLowerCase();
      
      // Remove 'www.' prefix if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      // List of popular legitimate domains to check against (for typosquatting)
      const legitimateDomains = [
        'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
        'apple.com', 'paypal.com', 'netflix.com', 'twitter.com',
        'linkedin.com', 'gmail.com', 'yahoo.com', 'instagram.com',
        'ebay.com', 'github.com', 'dropbox.com', 'icloud.com'
      ];

      // Check for single character differences (typosquatting)
      for (const legitimate of legitimateDomains) {
        const distance = this.levenshteinDistance(domain, legitimate);
        // If domain is very similar (1-2 chars different), it's suspicious
        if (distance > 0 && distance <= 2) {
          return true;
        }
      }

      // Check for homograph attacks (look-alike characters)
      // Common substitutions: 0 for o, 1 for i/l, 5 for s, etc.
      const homoglyphPattern = /[0O1lI5S]/;
      if (homoglyphPattern.test(domain)) {
        // Check if domain contains multiple look-alike characters
        const lookAlikeChars = domain.match(/[0O1lI5S]/g) || [];
        if (lookAlikeChars.length > 2) {
          return true;
        }
      }

      // Check for excessive hyphens (often used in phishing domains)
      if ((domain.match(/-/g) || []).length > 2) {
        return true;
      }

      // Check for very short or very long domain names
      const mainDomain = domain.split('.')[0];
      if (mainDomain.length < 2 || mainDomain.length > 30) {
        return true;
      }

      // Check for numeric-heavy domains
      const numericChars = (domain.match(/[0-9]/g) || []).length;
      if (numericChars > domain.length * 0.4) { // More than 40% numeric
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used to detect typosquatting/domain spoofing
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1,     // Insertion
            matrix[i - 1][j] + 1      // Deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
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