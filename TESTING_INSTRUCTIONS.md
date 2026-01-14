# Quick Testing Guide - Authentication Fix

## What Was Fixed

Authentication was stalling during OAuth because the Chrome service worker was being terminated after 30 seconds, but users often take longer to approve the OAuth request.

**Solution**: Added a "keepalive" mechanism that prevents the service worker from being terminated during authentication.

---

## How to Test

### Setup (5 minutes)

1. **Load the Extension**
   ```
   1. Open Chrome browser
   2. Go to chrome://extensions/
   3. Enable "Developer mode" (toggle in top-right)
   4. Click "Load unpacked"
   5. Select: /home/runner/work/hattrick-matchview/hattrick-matchview
   6. Extension should appear with green checkmark
   ```

2. **Verify Extension Loaded**
   ```
   1. Look for Hattrick Matchview icon in toolbar
   2. Click icon → popup should appear
   3. Click "⚙️ Settings" → new tab should open
   ```

---

### Test 1: Quick Authentication (2 minutes)

**Purpose**: Verify basic authentication works

1. In Settings page, click "🔐 Authenticate with Hattrick"
2. OAuth window opens → Hattrick login page
3. Quickly click "Approve" (within 10 seconds)
4. Window closes automatically
5. ✅ **Success message** should appear: "Successfully authenticated..."

**If this fails**: Check browser console (F12) for errors

---

### Test 2: Slow Authentication (2 minutes)

**Purpose**: Verify keepalive fixes the stalling issue

1. Click "🗑️ Clear Authentication" to reset
2. Click "🔐 Authenticate with Hattrick" again
3. OAuth window opens
4. **Wait 40+ seconds** before clicking "Approve"
   - Open browser console (F12)
   - Look for "Keeping service worker alive during OAuth..." messages every 20s
5. After 40+ seconds, click "Approve"
6. ✅ **Success message** should appear

**Expected**: Authentication completes successfully despite the delay

**Before the fix**: Would stall here - no success message

---

### Test 3: Match Data Retrieval (3 minutes)

**Purpose**: Verify API integration still works

1. Go to https://www.hattrick.org
2. Log in to your Hattrick account
3. Navigate to any match page (e.g., from "Matches" menu)
4. Click Hattrick Matchview extension icon
5. Click "📊 Show Match Data"
6. ✅ Data panel should appear on right side with:
   - Team names and scores
   - Match statistics
   - Player lineups
   - Match events

**If this fails**: 
- Check console (F12) for API errors
- Verify you're authenticated (Settings page shows green status)

---

### Test 4: Error Handling (1 minute)

**Purpose**: Verify timeout works

1. Click "🗑️ Clear Authentication"
2. Click "🔐 Authenticate with Hattrick"
3. In OAuth window, click browser's "Back" button or close window
4. ✅ **Error message** should appear with helpful guidance

---

## Expected Console Logs

### During Authentication (Background Console)
```
Background received message: {action: "authenticate"}
Initializing CHPP API client...
Keeping service worker alive during OAuth...
Keeping service worker alive during OAuth...
(may repeat several times if user is slow)
CHPP API client initialized successfully
```

### During Match Data Fetch (Content Script Console)
```
Starting match data extraction from CHPP API...
Making GET request to: https://www.hattrick.org/chppxml/matchdetails.asp
Response status: 200 OK
Parsed match data: {matchInfo: {...}, teams: {...}, ...}
```

---

## Success Criteria

All of these should work:

- ✅ **Quick auth** (< 10 seconds) completes successfully
- ✅ **Slow auth** (> 30 seconds) completes successfully  ← **THIS IS THE FIX**
- ✅ Match data loads from API after authentication
- ✅ Clear error messages if OAuth is cancelled
- ✅ No JavaScript errors in console

---

## Common Issues

### Issue: "No response from background service worker"

**Solution**: 
1. Go to chrome://extensions/
2. Click refresh icon on Hattrick Matchview
3. Try again

### Issue: OAuth window doesn't open

**Solution**:
1. Check popup blocker settings
2. Allow popups for chrome-extension:// URLs
3. Try again

### Issue: Authentication succeeds but no success message

**Solution**: 
1. Open Settings page
2. Check status indicator - should be green "Authenticated"
3. If green, authentication actually worked!

### Issue: Match data shows "Loading..." forever

**Solution**:
1. Check browser console (F12) for errors
2. Verify authentication status in Settings
3. Try clearing auth and re-authenticating

---

## Files to Check if Issues Occur

1. **Background Console** (chrome://extensions/ → Details → "service worker")
   - Shows OAuth keepalive messages
   - Shows authentication errors

2. **Content Script Console** (F12 on Hattrick page)
   - Shows match data extraction logs
   - Shows API request/response logs

3. **Popup Console** (Right-click extension icon → Inspect popup)
   - Shows popup-related errors

---

## Rollback Instructions

If major issues occur:

```bash
cd /home/runner/work/hattrick-matchview/hattrick-matchview
git revert HEAD
# Then reload extension in Chrome
```

---

## Report Results

After testing, please report:

1. ✅ or ❌ for each test
2. Any console errors seen
3. Chrome version used
4. Any unexpected behavior

**Questions?** Check `AUTHENTICATION_FIX_SUMMARY.md` for detailed technical explanation.
