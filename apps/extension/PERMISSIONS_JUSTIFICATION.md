# SmartShield - Permission & Purpose Justification

## Single Purpose Statement

**SmartShield is an AI-powered website security scanner that analyzes domains in real-time to detect and warn users about phishing, malware, and fraudulent websites.**

The extension performs one core function: scanning websites visitors navigate to and alerting them if the site exhibits phishing or malware characteristics. Nothing more.

---

## Permission Justification

### `activeTab`
**Purpose:** Access the URL of the currently active webpage being visited  
**Usage:** Required to capture the domain of the page the user is viewing so it can be scanned for threats. Without this, SmartShield cannot check what you're visiting.

### `tabs`
**Purpose:** Monitor browser tab navigation and detect URL changes  
**Usage:** Allows SmartShield to detect when users navigate to new sites and trigger scans automatically. Enables per-tab badge updates showing scan status.

### `storage`
**Purpose:** Persist user settings locally  
**Usage:** Stores the user's Safe Mode toggle preference (on/off) in `chrome.storage.local`. No personal data is stored—only extension configuration.

### `notifications`
**Purpose:** Display browser notifications  
**Usage:** Alerts users when a scanned domain is detected as suspicious or high-risk. Critical for warning users before they interact with malicious sites.

### `alarms`
**Purpose:** Schedule periodic background tasks  
**Usage:** Manages cache TTL and automatic cleanup of old scan results to prevent memory bloat. Enables intelligent rate-limiting of API requests.

---

## Host Permission Justification

### `https://smartshield-whois-api.onrender.com/*`
**Purpose:** Whois and DNS lookups  
**Usage:** SmartShield queries this backend API to retrieve domain registration details, nameserver information, and DNS records—all indicators of legitimate vs. fraudulent domains.

### `https://jlgktijajxapqclgjyjx.supabase.co/*`
**Purpose:** ML model inference and risk scoring  
**Usage:** Sends domain metadata to Supabase backend where the AI model evaluates the domain against patterns of known phishing and malware sites. Returns a risk score and threat classification.

---

## Remote Code Execution — NO

**Is SmartShield using remote code?**

No. SmartShield does **not** execute remote code.

- The extension contains **no `eval()`, `Function()` constructor, or dynamic code execution** in the manifest, background script, content script, or popup.
- The extension **does not download or execute scripts** from remote servers.
- Data returned from the backend APIs (`smartshield-whois-api`, `supabase`) is treated as **data only**—it is parsed and displayed, never evaluated as code.
- All extension logic is **static and bundled** at installation time.

The extension communicates with remote APIs only to **read data** (whois records, risk scores) and **write logs/scans**. Communication is request/response only, with no dynamic code injection or execution.

---

## Data Flow Summary

1. **User visits website** → Browser captures URL
2. **SmartShield extracts domain** → `activeTab` + `tabs` permissions
3. **Scan triggered** → Query backend APIs via host permissions
4. **Backend returns risk data** → No code, only threat classification
5. **Result cached locally** → `storage` permission
6. **Alert shown if needed** → `notifications` permission
7. **Cache managed** → `alarms` permission

**Every permission is necessary. No unused or redundant permissions are requested.**
