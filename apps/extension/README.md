# SmartShield Extension

AI-Powered Phishing Protection for Your Browser

## Features

- **🛡️ Real-Time Protection**: Automatically scans pages for phishing threats
- **🔍 Manual Scanning**: Scan any page with a single click
- **⚡ Safe Mode Toggle**: Enable/disable automatic scanning
- **📊 Detailed Analysis**: View WHOIS, DNS, and SSL certificate information
- **🚨 Instant Warnings**: Visual alerts for suspicious websites

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartshield.git
   cd smartshield/apps/extension
   ```

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `apps/extension/src` folder

3. **Start using SmartShield!**
   - The extension icon will appear in your browser toolbar
   - Safe Mode is enabled by default

## Usage

### Safe Mode

**Safe Mode** automatically scans every page you visit for phishing threats.

- **Toggle ON** (Default): All pages are automatically scanned
- **Toggle OFF**: Manual scanning only

To toggle Safe Mode:
1. Click the SmartShield extension icon
2. Use the "Safe Mode" toggle at the top

### Manual Scanning

Even with Safe Mode off, you can manually scan any page:

1. Navigate to the website you want to check
2. Click the SmartShield extension icon
3. Click "Scan Current Page"

### Understanding Results

**✅ Safe**: Website appears legitimate
- Low risk score
- No suspicious indicators found

**⚠️ Suspicious**: Website has concerning characteristics
- Medium risk score
- Proceed with caution
- Review the warning details

**🚨 High Risk**: Strong phishing indicators detected
- High risk score
- Do not enter personal information
- Leave the website immediately

### Page Warnings

When Safe Mode is ON and a suspicious page is detected, you'll see:

- **Warning Banner**: Appears at the top of the page
- **Badge Icon**: Extension icon shows a warning indicator
- **Risk Details**: Click the extension to see full analysis

## How It Works

SmartShield uses the **SmartShield Whois API** to analyze websites:

1. **URL Analysis**: Examines the website URL structure
2. **WHOIS Data**: Checks domain registration information
3. **DNS Records**: Verifies DNS configuration
4. **SSL Certificate**: Validates HTTPS security
5. **AI Detection**: Uses machine learning to identify phishing patterns

## Configuration

### Safe Mode State

Safe Mode setting is saved automatically and persists across browser sessions.

### Badge Indicators

When Safe Mode is enabled:
- **ON Badge**: Green badge shows Safe Mode is active
- **✓ Badge**: Page is safe (per-tab indicator)
- **⚠️ Badge**: Page is suspicious (per-tab indicator)

When Safe Mode is disabled:
- **OFF Badge**: Gray badge shows Safe Mode is inactive

## Development

### File Structure

```
src/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic and UI updates
├── background.js     # Background script (API calls, auto-scan)
├── content.js        # Content script (page warnings)
├── config.js         # Configuration constants
└── images/           # Extension icons
```

### API Integration

The extension connects to:
```
https://smartshield-whois-api.onrender.com
```

Endpoints used:
- `POST /api/scan` - Scan a URL for phishing
- `POST /api/domain-info` - Get detailed domain information

## Troubleshooting

### Extension not loading
- Make sure Developer mode is enabled in `chrome://extensions/`
- Check that you selected the correct folder (`src/`)
- Try reloading the extension

### Scans not working
- Check your internet connection
- Verify the API is accessible
- Check the browser console for errors (F12)

### Safe Mode not saving
- Check Chrome's storage permissions
- Try toggling Safe Mode again
- Reload the extension

### Warnings not appearing
- Ensure Safe Mode is enabled
- Check that content scripts are allowed on the page
- Some pages (chrome://, edge://, etc.) cannot be scanned

## Privacy & Security

- **No Account Required**: Extension works without signup or login
- **No Data Collection**: Your browsing history is not stored
- **Local Storage Only**: Settings are saved locally in your browser
- **Secure API**: All API calls use HTTPS encryption

## Support

For issues or questions:
- Open an issue on GitHub
- Check the console for error messages
- Verify the API is operational

## Version

**Current Version**: 1.0.0

## License

MIT License - See LICENSE file for details
