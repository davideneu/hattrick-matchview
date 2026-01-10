# Match Data Extraction - Feature Documentation

## Overview

This update adds match data extraction and visualization capabilities to the Hattrick Matchview extension. The extension can now parse and display match information directly from Hattrick match pages.

## Features Added

### 1. Match Data Extractor (`matchDataExtractor.js`)

Automatically extracts the following data from Hattrick match pages:

- **Match Information**: Match ID, date, type, arena
- **Teams**: Home and away team names, scores
- **Players**: Lineups for both teams (extracted from player links)
- **Statistics**: Possession, chances, ratings
- **Match Events (Telecronaca)**: All match events with timestamps, icons, and descriptions

### 2. Match Data Panel (`matchDataPanel.js`)

A beautiful side panel that displays extracted match data with:

- Clean, modern UI design
- Color-coded event types (goals, cards, substitutions)
- Scrollable sections for long lists
- Easy-to-read formatting
- Close button to dismiss

### 3. User Interface Elements

#### On Match Pages:
- **"Show Match Data" button** (bottom-right): Click to extract and display match data
- **Active indicator** (top-right): Briefly shows when extension loads

#### In Extension Popup:
- **"Show Match Data" button**: Triggers data extraction when on a match page
- **Status indicator**: Shows if you're on Hattrick and if it's a match page

## How to Use

### Method 1: From the Match Page
1. Navigate to any Hattrick match page (`/Club/Matches/Match.aspx`)
2. Look for the purple **"📊 Show Match Data"** button at the bottom-right
3. Click the button to extract and display match data
4. A panel will slide in from the right showing all extracted data
5. Click the **✕** button to close the panel

### Method 2: From the Extension Popup
1. Navigate to a Hattrick match page
2. Click the extension icon in your toolbar
3. Click the **"📊 Show Match Data"** button in the popup
4. The data panel will appear on the match page

## What Data is Extracted

### Match Information
- Match ID from URL
- Match type (league, friendly, etc.)
- Match date

### Teams & Scores
- Home team name and score
- Away team name and score
- Visual score display

### Match Statistics
- Possession percentage (home vs away)
- Chances created (home vs away)
- Other available statistics

### Player Lineups
- All players for both teams
- Player names with Hattrick IDs
- Count of players per team

### Match Events (Telecronaca)
- All match events sorted by minute
- Event types with color coding:
  - ⚽ Goals (green)
  - 🟨 Yellow cards (yellow)
  - 🟥 Red cards (red)
  - 🔄 Substitutions (blue)
  - 📝 Other events (gray)
- Full event descriptions
- Minute timestamps

## Technical Details

### Data Extraction Approach

The extension uses **DOM parsing** rather than the CHPP API because:

1. **No authentication required**: Direct HTML parsing works immediately
2. **Instant access**: Data is already on the page
3. **No API quota limits**: Can extract data as often as needed
4. **Works for any match**: Including historical matches

### Extraction Method

The `HattrickMatchDataExtractor` class:
- Queries the DOM for specific selectors
- Uses multiple fallback selectors for robustness
- Extracts text content and attributes
- Parses and structures data into JavaScript objects
- Handles missing data gracefully

### Known Limitations

1. **Selector Dependency**: Relies on Hattrick's HTML structure
   - May need updates if Hattrick changes their page structure
   - Some data might not be found on all match types

2. **Language Variations**: Currently optimized for English/Italian
   - Event detection looks for keywords like "goal", "gol", etc.
   - May need adjustment for other languages

3. **Historical Matches**: Some data may be incomplete
   - Older matches might have different page structures
   - Live matches may have partial data during the game

## Future Enhancements

Planned improvements:
- [ ] Better multi-language support
- [ ] More robust selector patterns
- [ ] Formation/tactics extraction
- [ ] Player ratings and statistics
- [ ] Advanced event parsing (who scored, assists, etc.)
- [ ] Export data as JSON/CSV
- [ ] Integration with CHPP API (optional authentication)
- [ ] Live match updates and animations

## Troubleshooting

### Data Panel Doesn't Appear
- Ensure you're on a match page (URL contains `/Club/Matches/Match.aspx`)
- Try refreshing the page
- Check browser console for errors (F12)

### Missing or Incomplete Data
- Some match pages may have different structures
- Partial data extraction is normal; the extension handles this gracefully
- Check the browser console for extraction logs

### Button Not Visible
- Check if another element is covering it
- Try zooming out or scrolling
- Ensure the extension is enabled in `chrome://extensions/`

## For Developers

### Adding New Data Extractors

Edit `content/matchDataExtractor.js` and add methods:

```javascript
extractNewData() {
  // Query the DOM
  const element = document.querySelector('.your-selector');
  
  // Extract and return data
  return element ? element.textContent : null;
}
```

Then call it in `extractMatchData()`.

### Customizing the Display

Edit `content/matchDataPanel.js` to modify the HTML generation:

```javascript
generateNewSectionHTML(data) {
  return `
    <div class="data-section">
      <h3>Your Section</h3>
      <div class="data-content">
        ${data}
      </div>
    </div>
  `;
}
```

### Styling Changes

Edit `content/content.css` to customize the panel appearance.

## API Reference

### HattrickMatchDataExtractor

```javascript
const extractor = new HattrickMatchDataExtractor();
const data = extractor.extractMatchData();
```

**Returns:**
```javascript
{
  matchInfo: { matchId, date, type, arena },
  teams: { home: { name, score }, away: { name, score } },
  players: { home: [...], away: [...] },
  stats: { possession, chances, ratings },
  events: [{ minute, type, description, rawHtml }, ...]
}
```

### MatchDataPanel

```javascript
const panel = new MatchDataPanel();
panel.createPanel(matchData);  // Show panel
panel.removePanel();           // Hide panel
```

## Feedback & Contributions

This is the first iteration of match data extraction. The extraction logic will be refined as we test with real Hattrick match pages. Feedback on accuracy and completeness is welcome!
