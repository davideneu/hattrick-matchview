# Implementation Changes - CORS Fix and Authentication UX Improvement

## Date: 2026-01-14

## Summary
This document describes the changes made to fix CORS errors and improve the authentication user experience in the Hattrick Matchview extension.

## Issues Addressed

### Issue 1: Simplify Authentication UX
**Problem:** Users had to enter Consumer Key and Consumer Secret in input fields, which was confusing since the extension has default credentials.

**Solution:** 
- Removed input fields from the settings page
- Made "Authenticate with Hattrick" the only authentication option
- Button uses default credentials automatically
- Content script button changes from "Authenticate with Hattrick" to "Show Match Data" based on authentication status

### Issue 2: Fix CORS Errors
**Problem:** Content scripts were making direct fetch requests to CHPP API endpoints, which were blocked by CORS policy:
```
Access to fetch at 'https://www.hattrick.org/chppxml/matchdetails.asp?...' 
from origin 'https://www83.hattrick.org' has been blocked by CORS policy
```

**Solution:**
- Moved all API requests to the background service worker (which can bypass CORS)
- Implemented message passing between content scripts and background worker
- Content scripts now send messages to background worker, which makes the API calls

## Files Modified

### 1. `/background/background.js`
**Changes:**
- Added `importScripts('/api/chppApiClient.js')` to load API client
- Implemented `initializeAPIClient()` function
- Added message handlers for:
  - `checkAuthentication` - Check if user is authenticated
  - `authenticate` - Start OAuth flow with credentials (defaults to built-in credentials)
  - `getMatchDetails` - Fetch match details from CHPP API
  - `getLiveMatchEvents` - Fetch live match events from CHPP API

**Why:** Background service workers can make cross-origin requests without CORS restrictions.

### 2. `/content/matchDataExtractor.js`
**Changes:**
- Removed direct instantiation of `CHPPApiClient`
- Added `sendMessageToBackground()` helper method
- Modified `initialize()` to check authentication via background worker
- Modified `extractFromAPI()` to request data via background worker
- Added `authenticate()` method to trigger auth flow via background

**Why:** Content scripts cannot make cross-origin requests, so they must delegate to background worker.

### 3. `/content/content.js`
**Changes:**
- Modified `addDataFetchButton()` to be async and check authentication status
- Button text changes based on authentication state:
  - Not authenticated: "🔐 Authenticate with Hattrick"
  - Authenticated: "📊 Show Match Data"
- Added `handleAuthentication()` function to manage auth flow from content script
- Added `showTemporaryMessage()` function for success/error notifications

**Why:** Provides better UX by guiding users through authentication directly from the match page.

### 4. `/popup/settings.html`
**Changes:**
- Removed `<form>` element with input fields for Consumer Key and Secret
- Kept only the "Authenticate with Hattrick" button
- Updated instructions to reflect simplified flow

**Why:** Reduces confusion by removing unnecessary input fields.

### 5. `/popup/settings.js`
**Changes:**
- Removed form submission handler
- Removed credential masking logic
- Simplified `handleAuthenticate()` to always use default credentials
- Removed form field clearing logic

**Why:** No longer need to manage form input fields.

### 6. `/manifest.json`
**Changes:**
- Removed `api/chppApiClient.js` from content_scripts
- API client is now only loaded in background service worker

**Why:** API client should only exist in background worker to handle CORS-restricted requests.

## Technical Details

### Message Passing Architecture

**Content Script → Background Worker:**
```javascript
// Check authentication
{ action: 'checkAuthentication' }
→ { authenticated: true/false, usingDefault: true/false }

// Authenticate
{ action: 'authenticate', consumerKey: null, consumerSecret: null }
→ { success: true/false, error?: string }

// Get match details
{ action: 'getMatchDetails', matchId: '760840624' }
→ { success: true/false, data?: {...}, error?: string }

// Get live events
{ action: 'getLiveMatchEvents', matchId: '760840624' }
→ { success: true/false, data?: [...], error?: string }
```

### Authentication Flow

1. User loads match page
2. Content script checks authentication status via background worker
3. If not authenticated, button shows "🔐 Authenticate with Hattrick"
4. User clicks button
5. Content script sends authenticate message to background with null credentials (= use defaults)
6. Background worker starts OAuth flow using default credentials
7. User approves in browser popup
8. Background worker stores access token
9. Content script updates button to "📊 Show Match Data"

### API Request Flow

1. User clicks "📊 Show Match Data"
2. Content script calls `dataExtractor.extractMatchData()`
3. Extractor sends `getMatchDetails` and `getLiveMatchEvents` messages to background
4. Background worker makes API requests with OAuth signatures
5. Background worker returns data to content script
6. Content script displays data in panel

## Testing

### Manual Testing Steps

1. **Load Extension:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked extension from repository

2. **Test Authentication:**
   - Open extension settings
   - Click "Authenticate with Hattrick"
   - Approve OAuth popup
   - Verify status shows "🟢 Authenticated"

3. **Test Match Data Fetching:**
   - Navigate to a Hattrick match page (e.g., `/Club/Matches/Match.aspx?matchID=...`)
   - Click floating "📊 Show Match Data" button
   - Verify match data panel appears with no CORS errors in console

4. **Test Authentication from Match Page:**
   - Clear authentication from settings
   - Navigate to match page
   - Button should show "🔐 Authenticate with Hattrick"
   - Click button to authenticate
   - Button should change to "📊 Show Match Data"

### Expected Behavior

- ✅ No CORS errors in console
- ✅ Authentication works seamlessly with default credentials
- ✅ Match data loads successfully from API
- ✅ Button text changes based on authentication state
- ✅ Settings page shows authentication status

## Security Considerations

1. **OAuth Flow:** Uses Chrome's `identity` API for secure OAuth
2. **Token Storage:** Tokens stored in Chrome's encrypted local storage
3. **Background Worker:** API credentials never exposed to web page context
4. **Default Credentials:** Built-in test credentials allow quick setup but users can still configure custom credentials if needed in future updates

## Future Enhancements

1. Add test infrastructure for automated testing
2. Add error recovery for expired tokens
3. Implement token refresh mechanism
4. Add support for custom credentials via advanced settings
5. Add rate limiting and request caching

## Notes

- The extension now requires the background service worker to be running for API requests
- All API communication goes through message passing (no direct API calls from content scripts)
- Default credentials are used automatically for simplified setup
- The CORS issue is completely resolved by moving API requests to background worker
