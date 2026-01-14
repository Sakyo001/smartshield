# Browser Extension

A comprehensive browser extension that protects users from phishing websites.

## How it works

1. **User Authentication** - Secure login and signup flow.
2. **Automatic checking** - Scans every webpage you visit.
3. **Warning badges** - Shows warning badge on suspicious sites.
4. **Warning banners** - Displays warning at top of dangerous pages.
5. **Dashboard** - View security status and risk details in the popup.

## Files

- `manifest.json` - Extension configuration
- `background.js` - Main detection logic (runs in background)
- `content.js` - Page warnings (runs on every webpage)
- `popup.html` & `popup.js` - Extension popup interface with Login/Signup/Dashboard views.

## Installation

1. Build the extension: `npm run build` (if applicable) or use the source directly.
2. Open Chrome/Edge extensions page (`chrome://extensions`).
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `apps/extension` folder (or `src` if loading source directly).

## Features

-  **Login & Signup System**
-  Real-time phishing detection
-  Visual warnings for dangerous sites
-  Modern Dashboard Interface
-  Works offline (Detection Logic)

## Development

The popup UI uses vanilla HTML/CSS/JS for lightweight performance, structured as a mini Single Page Application (SPA).

