# Testing Guide for CORS Fix and Authentication UX Improvements

## Overview
This guide helps you test the changes made to fix CORS errors and improve the authentication user experience.

## Prerequisites
- Chrome browser
- Hattrick account
- Access to a Hattrick match page

## Installation

1. **Load the Extension:**
   ```
   - Open Chrome and go to chrome://extensions/
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the repository directory
   ```

2. **Verify Extension Loaded:**
   - Look for "Hattrick Matchview" in the extensions list
   - Extension icon should appear in Chrome toolbar

## Test Scenarios

### Test 1: Settings Page Authentication (New Flow)

**Steps:**
1. Click the extension icon in Chrome toolbar
2. Click "⚙️ Settings" button
3. Verify you see:
   - Status indicator showing "Ready to Authenticate"
   - Single "🔐 Authenticate with Hattrick" button (NO input fields)
   - Clear Authentication button
4. Click "🔐 Authenticate with Hattrick"
5. Browser should open Hattrick OAuth page
6. Approve the application
7. Return to settings page
8. Verify status changes to "🟢 Authenticated - Using CHPP API (Default Credentials)"

**Expected Result:** ✅ Authentication succeeds without entering any credentials

**Error to Check:** No CORS errors in console during authentication

---

### Test 2: Match Page Authentication Button

**Steps:**
1. Clear authentication from Settings page if already authenticated
2. Navigate to a Hattrick match page:
   - Example: `https://www[XX].hattrick.org/Club/Matches/Match.aspx?matchID=XXXXXX`
3. Verify floating button appears at bottom-right
4. Button should say "🔐 Authenticate with Hattrick" (NOT "Show Match Data")
5. Click the button
6. Browser should open Hattrick OAuth page
7. Approve the application
8. Return to match page
9. Button should now say "📊 Show Match Data"
10. Success message should appear briefly

**Expected Result:** ✅ Authentication works from match page, button text updates

**Error to Check:** No CORS errors in console

---

### Test 3: Fetch Match Data (CORS Fix Test)

**Steps:**
1. Ensure you're authenticated (from Test 1 or Test 2)
2. Navigate to a Hattrick match page
3. Button should show "📊 Show Match Data"
4. Click the button
5. Loading indicator should appear
6. Match data panel should display with match information

**Expected Result:** ✅ Match data loads successfully

**Critical Check:** Open Chrome DevTools Console (F12) and verify:
- ❌ NO errors like "Access to fetch... has been blocked by CORS policy"
- ✅ Should see successful API responses
- ✅ Should see logs like "Match data extracted from API:"

---

### Test 4: Clear Authentication

**Steps:**
1. Go to Settings page
2. Click "🗑️ Clear Authentication"
3. Confirm the dialog
4. Verify status changes to "Ready to Authenticate"
5. Go to a match page
6. Button should say "🔐 Authenticate with Hattrick" (NOT "Show Match Data")

**Expected Result:** ✅ Authentication cleared, UI updates accordingly

---

### Test 5: Re-authentication After Clearing

**Steps:**
1. Clear authentication (Test 4)
2. Re-authenticate from either Settings or match page
3. Verify it works again

**Expected Result:** ✅ Can re-authenticate multiple times without issues

---

## Console Checks

Open Chrome DevTools (F12) and monitor the Console tab during testing:

### ✅ Good Signs:
```
Hattrick Matchview content script loaded
Match page detected - ready for visualization
Background received message: {action: "checkAuthentication"}
Starting match data extraction from CHPP API...
Match data extracted from API: {...}
```

### ❌ Bad Signs (Should NOT See):
```
Access to fetch at 'https://www.hattrick.org/chppxml/matchdetails.asp...' 
from origin 'https://www83.hattrick.org' has been blocked by CORS policy

Failed to fetch

net::ERR_FAILED
```

## Network Tab Checks

1. Open Chrome DevTools → Network tab
2. Click "📊 Show Match Data" button
3. Should see:
   - NO requests to `chppxml/matchdetails.asp` or `chppxml/live.asp` from the content script context
   - API requests are made by the background service worker (not visible in page context)

## Common Issues & Solutions

### Issue: Button doesn't appear on match page
**Solution:** Refresh the page after loading the extension

### Issue: OAuth popup doesn't open
**Solution:** 
- Check if popups are blocked
- Verify extension has `identity` permission in manifest.json

### Issue: "Authentication failed" error
**Solution:**
- Check internet connection
- Try clearing authentication and re-authenticating
- Check console for specific error message

### Issue: Match data doesn't load
**Solution:**
- Verify you're on an actual match page with a valid matchID
- Check console for error messages
- Verify authentication is still valid

## Success Criteria

All tests pass when:
- ✅ No input fields visible in Settings page
- ✅ Authentication works with single button click
- ✅ Button on match page changes based on auth state
- ✅ NO CORS errors appear in console
- ✅ Match data loads successfully from API
- ✅ Can authenticate, clear, and re-authenticate without issues

## Reporting Issues

If you encounter problems, please report:
1. Which test scenario failed
2. Console error messages (if any)
3. Network tab screenshots
4. Browser version
5. Extension version

## Technical Notes

### Architecture Changes Made:
- API client now runs only in background service worker
- Content scripts communicate via `chrome.runtime.sendMessage`
- Background worker has full CORS permissions
- Settings page also uses message passing (no direct API access)

### Why This Fixes CORS:
- Background service workers are not subject to CORS restrictions
- Content scripts were blocked from making cross-origin requests
- Message passing delegates requests to privileged context
