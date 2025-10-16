# ML Package

Simple phishing detection using human-readable rules.

## How it works

The `PhishingDetector` class checks URLs for common phishing indicators:

- **Long URLs** - Phishing sites often use very long URLs to hide the real domain
- **IP addresses** - Legitimate sites use domain names, not IP addresses
- **Suspicious keywords** - Words like "verify", "urgent", "suspended" are common in phishing
- **No HTTPS** - Legitimate sites should use secure connections
- **Too many subdomains** - Like `secure.login.verify.fake-bank.com`

## Usage

```javascript
const detector = new PhishingDetector();
const result = detector.checkURL('https://example.com');

console.log(result.isSuspicious); // true/false
console.log(result.riskLevel);    // 'low', 'medium', 'high'
console.log(result.warnings);     // Array of warning messages
```

## Files

- `index.js` - Main detection logic
- `package.json` - Package configuration