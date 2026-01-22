# SmartShield API Integration

This document outlines how SmartShield uses the Whois API for phishing detection across both the web application and browser extension.

## API Endpoint

**URL**: `https://smartshield-whois-api.onrender.com`

## Overview

Both the web application and browser extension use the same API endpoint for URL scanning and threat analysis. The API provides comprehensive phishing detection through WHOIS lookups, DNS records, SSL certificate analysis, and AI-powered risk assessment.

## Web Application Integration

### Environment Configuration

The web app is configured via the `.env` file:

```bash
NEXT_PUBLIC_WHOIS_API_URL=https://smartshield-whois-api.onrender.com
```

### Usage in Dashboard

The main scanning functionality is in [`apps/web/src/app/dashboard/[userId]/page.tsx`](../../apps/web/src/app/dashboard/%5BuserId%5D/page.tsx):

1. **URL Scan**: Sends a POST request to `/api/scan` with the URL to check
2. **Domain Info**: Fetches WHOIS, DNS, and SSL information from `/api/domain-info`
3. **Historical Data**: Gets domain history from `/api/domain-history`
4. **XAI Explanation**: Gets interpretable AI explanations from `/api/explain`
5. **Community Reports**: Manages user feedback via `/api/reports`

### Example Request

```javascript
const response = await fetch(`${WHOIS_API_URL}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: urlInput }),
  timeout: 30000
})

const data = await response.json()
// Returns: { decision: "PHISHING" | "LEGITIMATE", confidence: 0-100, ... }
```

## Browser Extension Integration

### Configuration

The extension uses a centralized config file at [`apps/extension/src/config.js`](../../apps/extension/src/config.js):

```javascript
const CONFIG = {
  WHOIS_API_URL: 'https://smartshield-whois-api.onrender.com',
  SCAN_TIMEOUT: 15000,
  // ... other settings
};
```

### Architecture

1. **Background Script** ([`background.js`](../../apps/extension/src/background.js)):
   - Intercepts page loads
   - Calls the Whois API for automatic scanning
   - Updates extension badge with risk level
   - Stores results for the popup

2. **Popup Script** ([`popup.js`](../../apps/extension/src/popup.js)):
   - Displays scan results to the user
   - Allows manual scanning via "Scan" button
   - Shows warnings and risk indicators

### Example Background Service Worker

```javascript
async function checkURLWithAPI(url) {
  const response = await fetch(`${WHOIS_API_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url }),
    timeout: 15000
  });

  const data = await response.json();
  
  // Convert API response to extension format
  return {
    isSuspicious: data.decision === 'PHISHING',
    riskLevel: data.confidence >= 70 ? 'high' : 'medium',
    warnings: ['...'],
    decision: data.decision,
    confidence: data.confidence
  };
}
```

## API Endpoints

### POST /api/scan
Scans a URL for phishing indicators.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "decision": "LEGITIMATE" | "PHISHING",
  "confidence": 0-100,
  "score": 0-1
}
```

### POST /api/domain-info
Retrieves detailed WHOIS, DNS, and SSL information for a domain.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "whois": { ... },
  "dns": { ... },
  "ssl": { ... },
  "risk_adjustment": { ... }
}
```

### POST /api/domain-history
Gets historical information about a domain.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "history": [ ... ],
  "timeline": [ ... ]
}
```

### POST /api/explain
Gets explainable AI explanation for a scan result.

**Request:**
```json
{
  "url": "https://example.com",
  "scan_result": { ... },
  "whois_info": { ... },
  "dns_info": { ... },
  "ssl_info": { ... }
}
```

**Response:**
```json
{
  "risk_factors": [ ... ],
  "positive_factors": [ ... ],
  "explanation": "..."
}
```

### GET /health
Checks if the API is online and operational.

**Response:**
```json
{
  "status": "online"
}
```

## Risk Assessment

The API uses a multi-layer risk assessment approach:

1. **Deterministic Rules**: Immediate flagging for obvious phishing patterns
2. **Machine Learning**: Deep analysis of URL, domain, and certificate patterns
3. **Threat Intelligence**: Cross-referencing with known phishing databases
4. **Contextual Analysis**: WHOIS age, SSL validity, DNS configuration
5. **Community Input**: User reports and feedback integration

## Error Handling

Both the web app and extension include robust error handling:

- **Timeout errors**: If the API takes longer than configured timeout (30s web, 15s extension)
- **Network errors**: Falls back to a warning state when service is unavailable
- **Invalid responses**: Safely handles malformed data from the API
- **API offline**: Shows appropriate user-friendly error messages

## Deployment

### Production
- **API URL**: `https://smartshield-whois-api.onrender.com`
- **Status**: Active on Render.com

### Development
- Web app can use `http://localhost:5001` via environment variable
- Extension requires rebuild to change API endpoint (edit `config.js`)

## Security Considerations

1. **HTTPS Only**: All API communications use HTTPS
2. **CORS**: API handles cross-origin requests from the web app
3. **Timeouts**: Requests include timeouts to prevent hanging
4. **Rate Limiting**: API implements rate limiting for protection
5. **Privacy**: No browsing history is stored; only scan results are cached locally
