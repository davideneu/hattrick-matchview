# Hattrick CHPP API Integration

This document describes the CHPP API integration added to the Hattrick Matchview extension.

## Overview

The extension uses the **Hattrick CHPP (Community Web Projects) API** to access match data. This provides reliable and structured access to match information, events, and statistics.

## Key Features

### 1. **API-Only Approach**

- **Primary Method**: CHPP API (OAuth authenticated)
- Includes default test credentials for quick setup
- Users can provide their own credentials for production use
- No DOM parsing fallback

### 2. **OAuth 1.0a Authentication**

The extension implements full OAuth 1.0a authentication flow:
- Uses Chrome's `identity` API for the OAuth flow
- Stores access tokens securely in Chrome's local storage
- Handles token refresh and error cases

### 3. **Two Main API Endpoints**

#### Match Details (`matchdetails.asp`)
Provides:
- Match metadata (ID, date, type, arena)
- Team information (names, IDs, scores)
- Player lineups and formations
- Match statistics (possession, ratings by sector)

#### Live Match Events (`live.asp`)
Provides:
- Real-time match events (goals, cards, substitutions)
- Event timing (minute)
- Player and team associations
- Event types and descriptions

## Architecture

### New Files

1. **`api/chppApiClient.js`** - CHPP API client implementation
   - OAuth 1.0a authentication
   - API request signing
   - XML parsing
   - Data transformation

2. **`popup/settings.html`** - Settings page UI
   - API credential configuration
   - Authentication status display
   - Clear authentication option

3. **`popup/settings.js`** - Settings page logic
   - OAuth flow initiation
   - Credential management
   - Status checking

4. **`popup/settings.css`** - Settings page styles

### Modified Files

1. **`manifest.json`**
   - Added `identity` permission for OAuth
   - Added `storage` permission for token storage
   - Added host permission for CHPP API endpoints
   - Added API client script to content scripts

2. **`content/matchDataExtractor.js`**
   - Added API client integration
   - Implemented `extractFromAPI()` method
   - Added automatic fallback to DOM parsing
   - Added `initialize()` method for API setup

3. **`content/content.js`**
   - Added async initialization for API client

4. **`popup/popup.html` & `popup.js`**
   - Added Settings button
   - Added navigation to settings page

## How to Use

### For Users

#### Quick Start (Default Credentials)

1. Click the extension icon
2. Click "⚙️ Settings"
3. Click "🔐 Authenticate with Hattrick" (no need to enter credentials)
4. Approve the application in the browser popup
5. Done! The extension will now use the API

#### Using Your Own Credentials

1. **Register Your Application**
   - Go to [Hattrick CHPP](https://www.hattrick.org/Community/CHPP/)
   - Log in with your Hattrick account
   - Register a new application
   - Note down your Consumer Key and Consumer Secret

2. **Configure the Extension**
   - Click the extension icon
   - Click "⚙️ Settings"
   - Enter your Consumer Key and Consumer Secret
   - Click "🔐 Authenticate with Hattrick"
   - Authorize the application in the browser popup
   - Done! The extension will now use your credentials

### For Developers

#### Testing the API Integration

```javascript
// In browser console on a Hattrick match page
const extractor = new HattrickMatchDataExtractor();
await extractor.initialize();
const data = await extractor.extractMatchData();
console.log(data);
```

#### API Client Usage

```javascript
// Create client
const client = new CHPPApiClient();

// Authenticate
await client.authenticate(consumerKey, consumerSecret);

// Fetch match details
const details = await client.getMatchDetails(matchId);

// Fetch live events
const events = await client.getLiveMatchEvents(matchId);
```

## Authentication Flow

```
1. User enters Consumer Key/Secret in Settings
   ↓
2. Extension initiates OAuth request token
   ↓
3. User is redirected to Hattrick for authorization
   ↓
4. User approves the application
   ↓
5. Hattrick redirects back with verifier code
   ↓
6. Extension exchanges verifier for access token
   ↓
7. Access token stored in Chrome storage
   ↓
8. API calls now authenticated automatically
```

## Data Format

Both API and DOM parsing methods return the same data structure:

```javascript
{
  matchInfo: {
    matchId: "12345",
    date: "2026-01-10 15:00:00",
    type: "League Match",
    arena: "Stadium Name"
  },
  teams: {
    home: { name: "Team A", id: "123", score: 2 },
    away: { name: "Team B", id: "456", score: 1 }
  },
  players: {
    home: [{ id, name, roleId, behaviour }],
    away: [{ id, name, roleId, behaviour }]
  },
  stats: {
    possession: { home: 55, away: 45 },
    chances: { home: 3, away: 2 },
    ratings: { home: {...}, away: {...} }
  },
  events: [
    {
      minute: 23,
      type: "goal",
      typeId: 10,
      description: "Goal by Player Name",
      teamId: "123",
      playerId: "789"
    }
  ]
}
```

## Security Considerations

### Credentials Storage
- Consumer Key/Secret stored in Chrome's local storage
- Access tokens encrypted by Chrome
- Tokens only accessible to the extension

### API Communication
- All API requests use HTTPS
- OAuth signatures prevent request tampering
- Tokens never exposed in logs or console (in production)

### OAuth Security
- Uses Chrome's identity API (secure)
- No embedded browser secrets
- User must explicitly authorize

## Limitations

### API Limitations
- Requires OAuth authentication (simplified with default credentials)
- API rate limits may apply (check Hattrick CHPP terms)

### Security Features
- Default credentials included for testing
- Users can override with their own credentials
- OAuth signatures prevent request tampering
- Tokens never exposed in logs or console (in production)

## Troubleshooting

### Authentication Fails

**Problem**: "Authentication failed" error

**Solutions**:
1. Verify Consumer Key and Secret are correct
2. Ensure you're logged into Hattrick
3. Check if application is approved in Hattrick CHPP panel
4. Try clearing authentication and re-authenticating

### API Requests Fail

**Problem**: "API request failed: 401"

**Solutions**:
1. Clear authentication in Settings
2. Re-authenticate with fresh credentials
3. Check if CHPP application is still active

### Need to Use Different Credentials

**Problem**: Want to switch from default to custom credentials

**Solutions**:
1. Go to Settings
2. Clear current authentication
3. Enter your Consumer Key and Secret
4. Click Authenticate

## Future Enhancements

- [ ] Automatic token refresh
- [ ] Support for multiple match monitoring
- [ ] Caching of match data
- [ ] Rate limiting and backoff
- [ ] Better error messages
- [ ] Migration tool for existing users

## References

- [Hattrick CHPP Documentation](https://www.hattrick.org/Community/CHPP/)
- [OAuth 1.0a Specification](https://oauth.net/core/1.0a/)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

## Support

For issues or questions:
1. Check the console for error messages
2. Verify authentication status in Settings
3. Try clearing and re-authenticating
4. Open an issue on GitHub with error details
