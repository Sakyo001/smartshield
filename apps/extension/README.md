# Browser Extension

Simple browser extension that protects users from phishing websites.

## How it works

1. **Automatic checking** - Scans every webpage you visit
2. **Warning badges** - Shows warning badge on suspicious sites
3. **Warning banners** - Displays warning at top of dangerous pages
4. **Manual scanning** - Click extension icon to check current page

## Files

- `manifest.json` - Extension configuration
- `background.js` - Main detection logic (runs in background)
- `content.js` - Page warnings (runs on every webpage)
- `popup.html` & `popup.js` - Extension popup interface

## Installation

1. Build the extension: `npm run build`
2. Open Chrome/Edge extensions page
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## Features

- ✅ Real-time phishing detection
- ✅ Visual warnings for dangerous sites
- ✅ Simple, clear interface
- ✅ No complex dependencies
- ✅ Works offline