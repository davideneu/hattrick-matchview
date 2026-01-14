# Hattrick Match View Chrome Extension

A Chrome extension that enhances the match viewing experience on Hattrick.org by providing OAuth authentication and extended functionality for match pages.

## Features

- **OAuth Authentication**: Secure OAuth 1.0a authentication with Hattrick CHPP API
- **Connection Status Display**: Visual popup showing connection status:
  - Not Connected (with authorization button)
  - Connected (showing success status)
  - Error (displaying error logs)
- **Match Page Integration**: Works on all Hattrick subdomains (e.g., www85.hattrick.org, www46.hattrick.org)

## Installation

### Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top right
3. Click "Load unpacked"
4. Select the extension directory
5. The extension icon should appear in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar
2. Click "Connect to Hattrick" button
3. You'll be redirected to Hattrick's authorization page
4. Authorize the application
5. You'll be redirected back and the extension will show "Connected"

## Files Structure

```
├── manifest.json         # Extension configuration
├── background.js         # Service worker handling OAuth flow
├── popup.html           # Popup UI structure
├── popup.css            # Popup UI styling
├── popup.js             # Popup UI logic
├── content.js           # Content script for match pages
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## OAuth Implementation

The extension uses OAuth 1.0a for authentication with the Hattrick CHPP API:

1. **Request Token**: Obtains a temporary request token
2. **User Authorization**: Redirects user to Hattrick to authorize
3. **Access Token**: Exchanges the authorized request token for an access token

Access tokens are securely stored in Chrome's local storage and used for API requests.

## Security

- Consumer secret is properly secured and used only for signing requests
- OAuth tokens are stored locally using Chrome's storage API
- All communication with Hattrick uses HTTPS

## Permissions

- `storage`: To save OAuth tokens and connection status
- `identity`: For OAuth authentication flow
- `https://*.hattrick.org/*`: To interact with all Hattrick subdomains

## Development

The extension is built using:
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no external dependencies)
- OAuth 1.0a with HMAC-SHA1 signing

## Future Enhancements

- Display enhanced match data on match pages
- Real-time match updates
- Match statistics and analysis
- Custom match notifications
