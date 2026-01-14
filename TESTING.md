# Testing Guide for Hattrick Match View Extension

## Prerequisites

- Google Chrome or Chromium-based browser
- Access to chrome://extensions page

## Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle (top right corner)
3. Click "Load unpacked" button
4. Navigate to the extension directory and select it
5. The extension should now appear in your extensions list

## Testing OAuth Flow

### Test 1: Initial State (Not Connected)

1. Click the extension icon in the toolbar
2. **Expected Result**: Popup should display:
   - "Hattrick Match View" title
   - "Not connected to Hattrick" message
   - "Connect to Hattrick" button with blue background

### Test 2: OAuth Authorization Flow

1. Click "Connect to Hattrick" button
2. **Expected Result**: 
   - Browser opens Hattrick authorization page
   - URL should be: `https://chpp.hattrick.org/oauth/authorize.aspx?oauth_token=...`
3. On Hattrick page, click "Grant Access" or "Authorize"
4. **Expected Result**:
   - Browser redirects back to the extension
   - Popup now shows "✓ Connected to Hattrick"
   - "Successfully authenticated" message appears
   - "Disconnect" button is visible

### Test 3: Connected State Persistence

1. Close the popup
2. Click the extension icon again
3. **Expected Result**: 
   - Popup should still show connected state
   - Connection persists across browser sessions

### Test 4: Disconnect

1. When connected, click "Disconnect" button
2. **Expected Result**:
   - Popup returns to "Not connected" state
   - Storage is cleared

### Test 5: Error Handling

1. Disconnect from Hattrick (if connected)
2. Disconnect your internet connection
3. Click "Connect to Hattrick"
4. **Expected Result**:
   - Popup should show error state with red "✗ Connection Error" message
   - Error log box should display error details
   - "Retry Connection" button should be visible

### Test 6: Content Script on Match Pages

1. Ensure extension is loaded
2. Navigate to a Hattrick match page, e.g.:
   - `https://www85.hattrick.org/Club/Matches/Match.aspx?matchID=76084062`
   - `https://www46.hattrick.org/Club/Matches/Match.aspx?matchID=76084062`
3. Open browser console (F12)
4. **Expected Result**:
   - Console should show: "Hattrick Match View extension loaded on match page"
   - If authenticated: "User is authenticated"
   - If not authenticated: "User not authenticated"

## Visual Inspection

### Popup Design

- Width: 350px
- Clean, modern design with rounded corners
- Color scheme:
  - Success: Green (#22c55e)
  - Error: Red (#ef4444)
  - Primary button: Blue (#3b82f6)
  - Secondary button: Gray (#6b7280)

### Button Interactions

- Buttons should have hover effect (slight elevation)
- Click feedback (returns to normal position)

## Troubleshooting

### Extension Won't Load

- Check manifest.json is valid JSON
- Ensure all referenced files exist (icons, scripts)
- Check browser console for errors

### OAuth Fails

- Verify consumer key and secret are correct
- Check network tab for failed requests
- Look for CORS or network errors

### Content Script Not Running

- Verify URL matches pattern in manifest.json
- Check content script permissions
- Reload the extension after changes

## Security Checks

- Consumer secret should never be exposed in requests (only used for signing)
- OAuth tokens stored securely in chrome.storage.local
- All Hattrick communication uses HTTPS
- No sensitive data logged to console in production

## Browser Compatibility

This extension is designed for:
- Chrome (Manifest V3)
- Edge (Chromium-based)
- Brave
- Opera (Chromium-based)

Not compatible with:
- Firefox (uses different extension API)
- Safari (requires conversion to Safari extension format)
