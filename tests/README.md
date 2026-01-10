# DOM Parsing Tests

This directory contains tests for the Hattrick Match Data Extractor's DOM parsing functionality.

## Files

- **test-runner.html** - Main test runner with interactive UI
- **match-sample.html** - Sample Hattrick match page for testing
- **README.md** - This file

## Running the Tests

1. Open `test-runner.html` in a web browser (Chrome recommended)
2. Click "▶️ Run All Tests" to execute the full test suite
3. Review the results displayed on the page

## Test Coverage

The test suite validates the following functionality:

### 1. Match Info Extraction
- ✅ Match ID extraction from URL
- ✅ Match date/time extraction
- ✅ Match type/league extraction
- ✅ Arena name extraction

### 2. Team Extraction
- ✅ Home team name
- ✅ Away team name
- ✅ Home team score
- ✅ Away team score

### 3. Match Events Extraction
- ✅ Event detection (goals, cards, substitutions)
- ✅ Event minute parsing
- ✅ Event type classification
- ✅ Event sorting by minute
- ✅ Goal detection (2 goals expected)
- ✅ Yellow card detection
- ✅ Substitution detection

### 4. Statistics Extraction
- ✅ Possession percentage (home and away)
- ✅ Match chances/opportunities
- ✅ First half statistics
- ✅ Second half statistics

### 5. Player Extraction
- ✅ Player names extraction
- ✅ Player IDs from links
- ✅ Complete lineup parsing
- ✅ Specific player identification (goalkeepers, goal scorers)

## Test Data

The test uses real match data from:
- **Match ID**: 757402591
- **Teams**: quelli di Cico vs Team Paradiso
- **Final Score**: 0-2
- **Date**: 10/01/2026 12:00
- **Events**: 2 goals, 1 yellow card, 2+ substitutions

This data was provided by the user and represents an actual Hattrick match page structure.

## Expected Results

All tests should pass with the current implementation. If any tests fail, it indicates:
1. The DOM structure has changed
2. The parser logic needs updating
3. The test expectations need adjustment

## Troubleshooting

### Test page doesn't load
- Make sure you're opening the HTML file through a web server or allow local file access in your browser
- Check browser console for CORS errors

### Extractor script not found
- Verify that `matchDataExtractor.js` exists at `../content/matchDataExtractor.js`
- Check the relative path is correct

### All tests fail
- Open browser console (F12) to see JavaScript errors
- Verify the test page structure matches the expected format
- Check that all required elements have the correct class names and structure

## Extending the Tests

To add new tests:

1. **Add test data to match-sample.html** if needed for the new test case

2. **Add a new test function** in `run-tests.js`:
```javascript
async function testNewFeature() {
    const sectionName = 'X. New Feature Test';
    try {
        // Your test logic here
        const result = extractor.extractNewFeature();
        
        testResult(
            'Feature works correctly',
            result === expectedValue,
            'expected',
            result
        );
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
    }
}
```

3. **Call the function in `runTests()`**:
```javascript
await testNewFeature();
```

4. **Run tests** to verify:
```bash
npm test
```

## Test Structure

The test suite validates DOM parsing by:
1. Loading a mock Hattrick HTML page (`match-sample.html`)
2. Instantiating the `HattrickMatchDataExtractor` 
3. Calling extraction methods
4. Validating results against expected values

Each test section focuses on a specific extraction capability:
- Match info (ID, date, league, arena)
- Teams (names, scores)
- Events (goals, cards, substitutions)
- Statistics (possession, chances)
- Players (lineups, IDs)

## Notes

- Tests run in the browser using a hidden iframe
- The extractor is tested against a static HTML mock of a Hattrick match page
- No actual API calls are made during testing
- Tests use the same extractor code used in production
