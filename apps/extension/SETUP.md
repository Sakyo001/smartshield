# SmartShield Browser Extension

AI-powered phishing detection browser extension with full Supabase integration.

## Features

- 🔐 **Supabase Authentication** - Real authentication with session sharing
- 🛡️ **Real-time Phishing Detection** - AI-powered URL scanning
- 📊 **5 Comprehensive Tabs**:
  - **Detection**: Scan results and risk scores
  - **Explanation**: AI-generated analysis with risk factors
  - **Details**: WHOIS, DNS, and SSL certificate information
  - **Relations**: Historical changes tracking
  - **Community**: User feedback and comments
- 🔄 **Session Sync** - Shares authentication with web app
- 💬 **Community Feedback** - Post and view comments about URLs

## Installation

### Development Mode

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `src` folder from this directory

### Using the Extension

1. **Sign Up/Login**:
   - Use email/password authentication
   - Or sign in with Google (requires OAuth setup - see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md))
   - Sessions are shared with the web app
   - If you're logged into the web app, the extension will use the same session

2. **Scan a Website**:
   - Navigate to any website
   - Click the SmartShield extension icon
   - Click "Scan Current Page"
   - View results across all 5 tabs

3. **View Details**:
   - **Detection**: See the overall risk assessment
   - **Explanation**: Read AI analysis of threats and trust signals
   - **Details**: Explore WHOIS, DNS, and SSL data
   - **Relations**: Check historical changes
   - **Community**: Read and post feedback

## Configuration

The extension is pre-configured to connect to:
- **Supabase**: `https://jlgktijajxapqclgjyjx.supabase.co`
- **API**: `https://smartshield-whois-api.onrender.com`

### Session Sharing

The extension automatically:
- Stores Supabase sessions in Chrome local storage
- Verifies session validity on startup
- Syncs user data to the database
- Shares authentication with the web app

## File Structure

```
src/
├── manifest.json       # Extension manifest
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic and tab management
├── supabase.js         # Supabase client for authentication
├── background.js       # Background script for scanning
├── content.js          # Content script
├── config.js           # Configuration constants
└── images/            # Extension icons and images
```

## API Endpoints Used

- `POST /api/scan` - Scan URL for phishing
- `POST /api/domain-info` - Get WHOIS, DNS, SSL data
- `POST /api/explain` - Generate AI explanation
- `POST /api/domain-history` - Get historical changes
- `GET /api/reports` - Fetch community comments
- `POST /api/reports` - Post community comment

## Supabase Tables

- `users` - User accounts
- `reports` - Community feedback
- `domain_whois_history` - WHOIS change tracking
- `domain_dns_history` - DNS change tracking
- `domain_ssl_history` - SSL certificate tracking

## Development

### Testing Authentication

1. Sign up via the extension with a test email
2. Verify the user appears in Supabase `users` table
3. Check that sessions persist across browser restarts
4. Test logout and re-login functionality

### Testing Features

1. Scan various URLs (safe and phishing)
2. Verify all 5 tabs load correct data
3. Post comments and verify they appear
4. Check historical data loading

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the `src` folder
- Check Chrome Developer Tools for console errors
- Reload the extension after making changes

### Google Sign-In Issues
- See [GOOGLE_SIGNIN_TROUBLESHOOTING.md](GOOGLE_SIGNIN_TROUBLESHOOTING.md) for detailed fixes
- Most common issue: Missing Google OAuth Client ID configuration
- Email/password login always works as fallback

### Authentication Issues
- Clear Chrome local storage
- Check Supabase credentials
- Verify network connectivity

### API Errors
- Check that the API is online
- Verify host permissions in manifest.json
- Check network tab for failed requests

## Security

- Uses Supabase JWT tokens for authentication
- Stores sessions securely in Chrome local storage
- API keys are public (anon key only)
- All API calls use HTTPS

## License

MIT
