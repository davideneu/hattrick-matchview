# Testing Guide for CHPP API Integration

This document provides a comprehensive testing guide for the CHPP API integration in Hattrick Matchview.

## Prerequisites

Before testing, ensure:
1. Chrome browser is installed
2. Extension is loaded in Developer Mode
3. You have access to Hattrick.org
4. (Optional) CHPP application registered for API testing

## Test Scenarios

### 1. Extension Installation and Loading

**Test Case 1.1: Extension Loads Successfully**
- [ ] Load extension in Chrome (chrome://extensions/)
- [ ] No errors in console
- [ ] Extension icon appears in toolbar
- [ ] Click icon → popup appears

**Expected Result**: Extension loads without errors

---

### 2. DOM Fallback Mode (No API Authentication)

**Test Case 2.1: Navigate to Match Page**
- [ ] Go to https://www.hattrick.org
- [ ] Log in to Hattrick
- [ ] Navigate to any match page
- [ ] Wait for page to load completely

**Expected Result**: Extension indicator appears briefly

**Test Case 2.2: Fetch Match Data (DOM Mode)**
- [ ] Click "📊 Show Match Data" button
- [ ] Wait for loading message
- [ ] Data panel appears on right side

**Expected Result**: 
- Console shows: "Using DOM parsing (API not authenticated)"
- Match data displayed with teams, scores, events
- No API errors in console

**Test Case 2.3: Check Settings Page**
- [ ] Click extension icon
- [ ] Click "⚙️ Settings"
- [ ] Settings page opens in new tab
- [ ] Status shows: "Not Authenticated - Using DOM Parsing (Fallback)"

**Expected Result**: Settings page displays correctly with unauthenticated status

---

### 3. API Authentication Flow

**Test Case 3.1: Enter Credentials**
- [ ] Open Settings page
- [ ] Enter Consumer Key
- [ ] Enter Consumer Secret
- [ ] Click "🔐 Authenticate with Hattrick"

**Expected Result**: OAuth popup window opens

**Test Case 3.2: Authorize Application**
- [ ] OAuth window shows Hattrick authorization page
- [ ] Log in if needed
- [ ] Click "Authorize" button
- [ ] Window closes automatically

**Expected Result**: 
- Success message appears
- Status changes to: "Authenticated - Using CHPP API"

**Test Case 3.3: Verify Stored Credentials**
- [ ] Refresh Settings page
- [ ] Consumer Key shows masked: "abcd***efgh"
- [ ] Consumer Secret shows masked: "1234***5678"
- [ ] Status remains: "Authenticated - Using CHPP API"

**Expected Result**: Credentials persisted and masked for security

---

### 4. API Mode (With Authentication)

**Test Case 4.1: Fetch Match Data (API Mode)**
- [ ] Navigate to any Hattrick match page
- [ ] Click "📊 Show Match Data" button
- [ ] Wait for loading message

**Expected Result**:
- Console shows: "Fetching match data from CHPP API..."
- Console shows: "Match data fetched from API successfully"
- Data panel displays with match information

**Test Case 4.2: Verify API Data Structure**
- [ ] Open browser console
- [ ] Check logged match data object
- [ ] Verify structure matches documentation

**Expected Structure**:
```javascript
{
  matchInfo: { matchId, date, type, arena },
  teams: { home: {...}, away: {...} },
  players: { home: [...], away: [...] },
  stats: { possession, chances, ratings },
  events: [...]
}
```

**Test Case 4.3: Compare API vs DOM Data**
- [ ] Fetch data using API mode
- [ ] Clear authentication in Settings
- [ ] Refresh page and fetch data using DOM mode
- [ ] Compare both results

**Expected Result**: Data structure is consistent between modes

---

### 5. Error Handling

**Test Case 5.1: Invalid Credentials**
- [ ] Enter invalid Consumer Key
- [ ] Enter invalid Consumer Secret
- [ ] Click "Authenticate"

**Expected Result**: 
- Error message appears
- Status shows authentication failed
- Extension falls back to DOM mode

**Test Case 5.2: Network Error**
- [ ] Authenticate successfully
- [ ] Disable network connection
- [ ] Try to fetch match data

**Expected Result**:
- Console shows: "API extraction failed, falling back to DOM parsing"
- Data fetched from DOM instead
- User sees data (no blank screen)

**Test Case 5.3: Invalid Match ID**
- [ ] Navigate to non-match page on Hattrick
- [ ] Try to fetch data

**Expected Result**: Error message about invalid match ID

---

### 6. Clear Authentication

**Test Case 6.1: Clear Credentials**
- [ ] Open Settings (while authenticated)
- [ ] Click "🗑️ Clear Authentication"
- [ ] Confirm in dialog

**Expected Result**:
- Credentials cleared from form
- Status: "Authentication cleared - Using DOM Parsing (Fallback)"
- Success message appears

**Test Case 6.2: Verify Cleared State**
- [ ] Refresh Settings page
- [ ] Status shows: "Not Authenticated"
- [ ] Form fields are empty
- [ ] Navigate to match page
- [ ] Fetch data

**Expected Result**: Extension uses DOM parsing mode

---

### 7. Popup Functionality

**Test Case 7.1: Status Indicator**
- [ ] Navigate to Hattrick.org (any page)
- [ ] Click extension icon
- [ ] Check status indicator

**Expected Result**: 
- On Hattrick: 🟢 "Connected to Hattrick"
- On match page: Button enabled
- Not on Hattrick: ⚪ "Not on Hattrick"

**Test Case 7.2: Settings Navigation**
- [ ] Click extension icon
- [ ] Click "⚙️ Settings"

**Expected Result**: Settings page opens in new tab

**Test Case 7.3: Show Match Data from Popup**
- [ ] Navigate to match page
- [ ] Click extension icon
- [ ] Click "📊 Show Match Data"

**Expected Result**: Data panel appears on match page

---

### 8. UI/UX Testing

**Test Case 8.1: Settings Page Layout**
- [ ] Open Settings page
- [ ] Check all sections visible
- [ ] Check buttons are styled correctly
- [ ] Resize window

**Expected Result**: Page is responsive and well-formatted

**Test Case 8.2: Loading States**
- [ ] Click "Authenticate" button
- [ ] Observe button state during authentication

**Expected Result**: 
- Button disabled during process
- Text changes to "🔄 Authenticating..."
- Re-enabled after completion

**Test Case 8.3: Data Panel Display**
- [ ] Fetch match data
- [ ] Check data panel layout
- [ ] Scroll through events
- [ ] Close panel

**Expected Result**: Panel is properly styled and functional

---

### 9. Cross-Browser Compatibility

**Test Case 9.1: Chrome**
- [ ] Test all scenarios in Chrome

**Expected Result**: All features work

**Test Case 9.2: Edge** (if supported)
- [ ] Load extension in Edge
- [ ] Test basic functionality

**Expected Result**: Extension works (Chromium-based)

---

### 10. Performance Testing

**Test Case 10.1: API Response Time**
- [ ] Fetch data from API
- [ ] Check console for timing logs
- [ ] Measure time to display

**Expected Result**: Data loads within 2-3 seconds

**Test Case 10.2: DOM Parsing Time**
- [ ] Use DOM mode
- [ ] Fetch data
- [ ] Check console for timing

**Expected Result**: Data loads within 1-2 seconds (may vary by page load)

**Test Case 10.3: Multiple Requests**
- [ ] Fetch data multiple times
- [ ] Check for memory leaks
- [ ] Monitor network requests

**Expected Result**: No memory leaks, efficient caching

---

## Known Issues & Limitations

### Current Limitations
1. OAuth requires user to have CHPP application registered
2. API rate limits may apply (Hattrick CHPP terms)
3. DOM fallback depends on page structure
4. Live event updates not real-time (requires refresh)

### Browser Compatibility
- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ❌ Firefox (different extension API)
- ❌ Safari (different extension API)

---

## Debugging Tips

### Check Console Messages
Look for these key messages:
```
"Data extraction method: CHPP API" - Using API
"Data extraction method: DOM parsing (fallback)" - Using DOM
"Fetching match data from CHPP API..." - API request started
"API extraction failed, falling back to DOM parsing" - API error
```

### Common Issues

**Issue**: "Not authenticated" despite entering credentials
- **Solution**: Check if OAuth flow completed successfully
- **Solution**: Try clearing and re-authenticating

**Issue**: "API request failed: 401"
- **Solution**: Credentials may be invalid or expired
- **Solution**: Re-authenticate with valid credentials

**Issue**: Data panel doesn't appear
- **Solution**: Check console for JavaScript errors
- **Solution**: Ensure match ID is valid
- **Solution**: Refresh page and try again

**Issue**: OAuth popup blocked
- **Solution**: Allow popups for extension
- **Solution**: Check browser popup settings

---

## Reporting Bugs

When reporting bugs, include:
1. Browser version
2. Extension version
3. Authentication status (API or DOM mode)
4. Console error messages
5. Steps to reproduce
6. Expected vs actual behavior

---

## Success Criteria

The implementation is successful if:
- ✅ Extension loads without errors
- ✅ DOM fallback works without authentication
- ✅ OAuth authentication completes successfully
- ✅ API data fetching works when authenticated
- ✅ Error handling works (fallback to DOM on API failure)
- ✅ Settings page allows credential management
- ✅ No security issues (credentials stored securely)
- ✅ UI is responsive and user-friendly
