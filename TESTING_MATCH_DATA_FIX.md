# Testing Guide: Match Data Loading Fix

## What Was Fixed

The extension's CHPP API client was not correctly parsing XML responses from the Hattrick API. This has been fixed by updating the XML path selectors to match the actual API structure.

## How to Test

### Prerequisites
1. Chrome browser with the extension loaded in developer mode
2. A Hattrick account
3. Access to a match page on Hattrick.org

### Step-by-Step Testing

#### 1. Load the Extension
```bash
# Navigate to Chrome extensions page
chrome://extensions/

# Enable "Developer mode" (toggle in top right)
# Click "Load unpacked"
# Select the hattrick-matchview directory
```

#### 2. Authenticate with Hattrick
1. Click the extension icon in Chrome toolbar
2. Click "⚙️ Settings" 
3. Click "🔐 Authenticate with Hattrick"
   - This will use default test credentials
   - Or enter your own Consumer Key/Secret if you prefer
4. Authorize the application when prompted
5. Verify "Status: Authenticated ✅" is shown

#### 3. Navigate to a Match Page
1. Go to https://www.hattrick.org
2. Log in with your Hattrick account
3. Navigate to any match page, for example:
   - Your team's latest match
   - A live match
   - A completed match from any team

The URL should look like:
```
https://www[XX].hattrick.org/Club/Matches/Match.aspx?matchID=[NUMBERS]
```

#### 4. Trigger the Extension
1. You should see "⚽ Matchview Active" indicator briefly in top-right corner
2. A "📊 Show Match Data" button should appear in bottom-right corner
3. Click the "📊 Show Match Data" button

#### 5. Verify Data is Loaded

**Open Browser Console** (F12) to see detailed logs, then check:

##### Match Information
- ✅ Match ID displayed (not null)
- ✅ Match type shown (not "Loading..." or null)
- ✅ Match date shown (not null)
- ✅ Arena name displayed (not null)

##### Teams & Score
- ✅ Home team name displayed correctly
- ✅ Away team name displayed correctly
- ✅ Home score shown (actual number, not 0 or null)
- ✅ Away score shown (actual number, not 0 or null)

##### Match Statistics
- ✅ Possession percentages shown for both teams (not 0% or null)
- ✅ Team ratings displayed for midfield, defense, attack sectors

##### Players
- ✅ Home team players list populated (not empty)
- ✅ Away team players list populated (not empty)
- ✅ Player names shown correctly (not "null" or empty)

##### Match Events
- ✅ Events list shows actual match events
- ✅ Each event has a minute marker (not null)
- ✅ Event descriptions are meaningful (not loading text)
- ✅ Event types are correctly identified (goals ⚽, cards 🟨🟥, etc.)

### Expected Console Output

You should see logs similar to:
```
Starting match data extraction from CHPP API...
Making GET request to: https://www.hattrick.org/chppxml/matchdetails.asp
Request params: {matchID: "757402591", outputType: "XML"}
Response status: 200 OK
Response received, length: 15234
Parsing matchdetails XML response...
XML length: 15234
Found 11 players for HomeTeam
Found 11 players for AwayTeam
Parsed match data: {...}
Making GET request to: https://www.hattrick.org/chppxml/live.asp
Found 45 event nodes
Parsed events: [...]
Match data extracted from API
Match data displayed successfully
```

### What to Check in Console

**Before the Fix:**
- "Team name: null" or "Loading..."
- "Score: null" or 0
- "Players: []" (empty array)
- "Events: []" or placeholder events

**After the Fix:**
- Real team names
- Actual scores from the match
- Full player lists with names
- Actual match events with descriptions

### Troubleshooting

If data is still not loading:

#### Issue: "Not authenticated" Error
**Solution:** Go to Settings and click Authenticate again

#### Issue: 401 API Error
**Solution:** 
1. Clear credentials in Settings
2. Re-authenticate
3. Refresh the match page

#### Issue: Still seeing null values
**Solution:** 
1. Open console (F12)
2. Look for the "Parsing matchdetails XML response..." log
3. Check if XML is being received (XML length should be > 1000)
4. If XML length is very small or shows an error, there's an API issue
5. Copy any error messages and report them

#### Issue: No button appears
**Solution:**
1. Check the URL - must be a match page with "matchID=" in URL
2. Refresh the page
3. Check console for JavaScript errors

### Test Different Match Types

For thorough testing, try:
- ✅ League matches
- ✅ Friendly matches
- ✅ Cup matches
- ✅ Live matches (currently playing)
- ✅ Completed matches (historical)

### Report Results

Please report back:
1. ✅/❌ Match data loaded successfully
2. ✅/❌ All fields populated (not null)
3. ✅/❌ Players list shows real names
4. ✅/❌ Events show actual match events
5. Any console errors or warnings
6. Screenshots showing the data panel (if possible)

## Technical Details

### What Changed

The XML parsing in `api/chppApiClient.js` was updated to match the actual CHPP API structure:

- Team names: Changed from `HomeTeam > HomeTeamName` to `HomeTeam HomeTeamName`
- Goals: Changed from `HomeTeam > HomeGoals` to `HomeGoals` (at Match level)
- Arena: Changed from `Arena > ArenaName` to `Arena ArenaName`
- Events: Changed from `EventTypeID` to `EventKey`
- Added fallback paths for fields with multiple possible names
- Improved null handling throughout

### Logs to Look For

Key success indicators in console:
```javascript
✅ "Response status: 200 OK"
✅ "XML length: [large number]"
✅ "Found [number] players for HomeTeam"
✅ "Found [number] event nodes"
✅ "Parsed match data: {...}" (with actual data, not nulls)
```

Key failure indicators:
```javascript
❌ "API request failed: 401"
❌ "Not authenticated"
❌ "XML length: 0" or very small
❌ "API Error: [message]"
```

## Support

If you encounter issues:
1. Check console for error messages
2. Verify authentication status
3. Try a different match page
4. Report specific error messages with context
