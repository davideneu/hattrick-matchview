# Live Match Support Implementation

## Overview

This document describes the implementation of live match support for the Hattrick Match View Chrome extension. The extension now supports both finished match pages (`Match.aspx`) and live match pages (`Live.aspx`).

## Features Implemented

### 1. Content Script Support for Live Pages

**File Modified:** `manifest.json`

Added `Live.aspx` to the content scripts configuration:

```json
"content_scripts": [
  {
    "matches": [
      "https://*.hattrick.org/Club/Matches/Match.aspx*",
      "https://*.hattrick.org/Club/Matches/Live.aspx*"
    ],
    "js": ["content.js"]
  }
]
```

### 2. Page Type Detection

**File Modified:** `content.js`

Added function to detect if the current page is a live match page:

```javascript
function isLiveMatchPage() {
  return window.location.pathname.includes('/Club/Matches/Live.aspx');
}
```

### 3. Live Match API Integration

**File Modified:** `background.js`

Added `fetchLiveMatchData` function to communicate with the Hattrick HT Live API:

- **Endpoint:** `https://chpp.hattrick.org/chppxml.ashx`
- **File:** `htlive`
- **Version:** `1.4`
- **Action Types:**
  - `viewAll` - Retrieves all events (used for initial request)
  - `viewNew` - Retrieves only new events since last request (for polling)
- **Parameters:**
  - `actionType` - Required (viewAll or viewNew)
  - `lastShownIndexes` - Optional JSON string for viewNew requests

### 4. XML Response Parsing

**File Modified:** `content.js`

Added `parseLiveMatchXML` function to parse the HT Live API response structure:

#### Response Structure

```xml
<HattrickData>
  <Team>
    <TeamID>...</TeamID>
    <TeamName>...</TeamName>
    <ShortTeamName>...</ShortTeamName>
    <League>
      <LeagueID>...</LeagueID>
      <LeagueName>...</LeagueName>
      <LeagueLevelUnit>
        <LeagueLevelUnitID>...</LeagueLevelUnitID>
        <LeagueLevelUnitName>...</LeagueLevelUnitName>
        <LeagueLevel>...</LeagueLevel>
      </LeagueLevelUnit>
    </League>
    <MatchList>
      <Match>
        <MatchID>...</MatchID>
        <HomeTeam>...</HomeTeam>
        <AwayTeam>...</AwayTeam>
        <MatchDate>...</MatchDate>
        <SourceSystem>...</SourceSystem>
        <MatchType>...</MatchType>
        <HomeGoals>...</HomeGoals>
        <AwayGoals>...</AwayGoals>
        <Status>...</Status>
      </Match>
    </MatchList>
  </Team>
</HattrickData>
```

#### Parsed Data Structure

```javascript
{
  team: {
    teamId: string,
    teamName: string,
    shortTeamName: string,
    league: {
      leagueId: string,
      leagueName: string,
      leagueLevelUnitId: string,
      leagueLevelUnitName: string,
      leagueLevel: string
    }
  },
  matches: [
    {
      matchId: string,
      homeTeam: { homeTeamId, homeTeamName, homeTeamShortName },
      awayTeam: { awayTeamId, awayTeamName, awayTeamShortName },
      matchDate: string,
      sourceSystem: string,
      matchType: string,
      homeGoals: string,
      awayGoals: string,
      status: string,
      ordersGiven: string
    }
  ]
}
```

### 5. Display Formatting

**File Modified:** `content.js`

Added `formatLiveMatchData` function to display live match information:

- Team information (name, league, level)
- Match status badges (ONGOING, UPCOMING, FINISHED)
- Current scores
- Match type and date
- Orders given status (for user's own matches)

### 6. Visual Styling

**File Modified:** `content.js`

Added CSS styles for live match display:

- `.live-matches-section` - Container for live match list
- `.live-match-item` - Individual match card with status-based coloring
  - `.ongoing` - Green gradient for live matches
  - `.upcoming` - Orange gradient for upcoming matches
  - `.finished` - Gray gradient for finished matches
- `.match-status-badge` - Status indicator with color coding
- `.match-teams` - Team names and scores display
- `.team-row` - Individual team display with score

### 7. Smart API Selection

**File Modified:** `content.js`

Updated `loadMatchData` function to automatically select the appropriate API:

```javascript
const isLivePage = isLiveMatchPage();

if (isLivePage) {
  // Use htlive API for Live.aspx pages
  response = await chrome.runtime.sendMessage({
    action: 'fetchLiveMatchData',
    matchId: matchId,
    actionType: 'viewAll'
  });
} else {
  // Use matchdetails API for Match.aspx pages
  response = await chrome.runtime.sendMessage({
    action: 'fetchMatchData',
    matchId: matchId
  });
}
```

## Security Considerations

1. **OAuth Signing:** All API requests properly signed with OAuth 1.0a
2. **Input Validation:** Match ID validated with regex `/^\d+$/`
3. **Action Type Validation:** Only accepts 'viewAll' or 'viewNew'
4. **XSS Prevention:** All HTML output escaped using `escapeHtml()` function

## API Differences

### Live Match API (htlive)
- Returns list of matches for a team
- Includes match status (ONGOING, UPCOMING, FINISHED)
- Shows current scores
- Provides orders given status for user's own matches
- No detailed ratings or events

### Finished Match API (matchdetails)
- Returns single match details
- Includes team ratings (midfield, attack, defense)
- Provides full event list with text descriptions
- Shows possession statistics
- Includes arena information

## Testing

A visual test page has been created: `visual-test-live.html`

### Manual Testing Steps

1. Load extension in Chrome
2. Authenticate with Hattrick account
3. Navigate to Live.aspx page
4. Click "Match Data" button
5. Verify:
   - Team information displays correctly
   - Match list shows with appropriate status badges
   - Scores are visible
   - Color coding matches status
   - Dev Mode still works for raw XML viewing

## Future Enhancements

1. **Auto-polling:** Implement automatic polling using viewNew action type
2. **Event notifications:** Alert user when match status changes
3. **Detailed live events:** Fetch and display live match events
4. **Last shown indexes:** Store and use lastShownIndexes for efficient polling
5. **Match filtering:** Allow user to filter matches by status

## Files Changed

- `manifest.json` - Added Live.aspx to content scripts
- `background.js` - Added fetchLiveMatchData function
- `content.js` - Added live match detection, parsing, and display functions
- `README.md` - Updated with live match feature documentation
- `visual-test-live.html` - Created visual test page

## API Documentation Reference

Based on Hattrick CHPP API documentation for htlive (version 1.4):
- Action types: viewAll, viewNew
- Returns Team and MatchList structure
- Supports lastShownIndexes parameter for incremental updates
- Match Status values: FINISHED, ONGOING, UPCOMING
