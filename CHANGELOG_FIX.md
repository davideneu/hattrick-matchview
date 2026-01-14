# Fix for DOMParser Error and Dev Mode Implementation

## Issue
The extension was failing to fetch match data with the error:
```
Failed to fetch match data: DOMParser is not defined
```

## Root Cause
The `parseMatchXML` function in `background.js` was using `DOMParser`, which is a DOM API that is **not available in service workers**. Since Manifest V3 extensions use service workers instead of background pages, `DOMParser` is not accessible in the background script context.

## Solution Implemented

### 1. Fixed DOMParser Issue
- **Moved XML parsing from background.js to content.js**
  - Background.js (service worker) now returns raw XML text
  - Content.js (runs in DOM context) now parses the XML using DOMParser
  - This is the correct architecture: service workers handle API calls, content scripts handle DOM operations

### 2. Added API Parameters
- Added `sourceSystem=Hattrick` parameter to API request
- Added `matchEvents=true` parameter to API request
- These parameters ensure the API returns all match events as requested

### 3. Implemented Dev Mode Feature
Added a new dev mode toggle in the extension popup that allows users to view the raw XML response from the Hattrick API without any parsing or formatting.

**Features:**
- Toggle checkbox in the popup when connected
- Persists dev mode state in chrome.storage.local
- When enabled, displays raw XML in a styled code block
- When disabled, displays formatted match data as before

**Benefits:**
- Debugging: Users can see the exact API response
- Transparency: Shows what data is being received from the API
- Development: Helps identify API issues vs parsing issues

## Files Changed

### background.js
- Removed `parseMatchXML` function (moved to content.js)
- Modified `fetchMatchData` to return raw XML text
- Added `sourceSystem` and `matchEvents` parameters to API request
- Updated API URL to include new parameters

### content.js
- Added `parseMatchXML` function (moved from background.js)
- Added `formatRawXML` function for dev mode display
- Modified `loadMatchData` to check dev mode setting
- Added conditional logic: dev mode shows raw XML, normal mode shows formatted data
- Added CSS styles for raw XML display (dark theme code block)

### popup.html
- Added dev mode toggle checkbox in the connected state section
- Toggle appears between user info and disconnect button

### popup.js
- Added event listener for dev mode checkbox
- Added `toggleDevMode` function to persist state
- Modified `checkAuthStatus` to restore dev mode checkbox state
- Dev mode state persists across popup opens

### popup.css
- Added styles for dev mode toggle container
- Styled checkbox and label for better UX
- Consistent with existing design system

## Testing Recommendations

1. **Test Normal Mode (Dev Mode OFF)**
   - Connect to Hattrick
   - Navigate to a match page
   - Click "Match Data" button
   - Verify formatted match data displays correctly

2. **Test Dev Mode (Dev Mode ON)**
   - Connect to Hattrick
   - Enable "Dev Mode" checkbox in popup
   - Navigate to a match page
   - Click "Match Data" button
   - Verify raw XML displays in styled code block

3. **Test State Persistence**
   - Enable dev mode
   - Close popup
   - Reopen popup
   - Verify checkbox remains checked

4. **Test Error Handling**
   - Test with invalid match ID
   - Test with network errors
   - Verify error messages display correctly

## Technical Details

### Why This Fix Works
- Service workers (Manifest V3) don't have access to DOM APIs like `DOMParser`
- Content scripts run in the page context and DO have access to DOM APIs
- By moving XML parsing to the content script, we use the right tool in the right context

### Architecture Pattern
```
Match Page → Content Script → Service Worker → Hattrick API
                    ↑              ↓
                    └── Raw XML ──┘
                    ↓
              DOMParser (works here!)
                    ↓
              Formatted Display
```

### Dev Mode Flow
```
User enables dev mode → State saved to chrome.storage
                             ↓
              Content script checks devMode state
                             ↓
        If true: Display raw XML (no parsing)
        If false: Parse XML and display formatted data
```

## Security Considerations
- Raw XML is properly escaped using `escapeHtml()` before display
- No XSS vulnerabilities introduced
- Dev mode is opt-in and clearly labeled
- OAuth tokens not exposed in raw XML display

## Backward Compatibility
- Changes are fully backward compatible
- Existing authentication flows unaffected
- Default behavior (dev mode off) maintains previous functionality
- No breaking changes to API or storage structure
