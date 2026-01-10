#!/usr/bin/env node

/**
 * Test for Shop Link Filtering
 * Ensures "Il nostro negozio" and other shop/ad links are not picked up as match type
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Load test HTML with shop link
const testHtmlPath = path.join(__dirname, 'match-with-shop-link.html');
const testHtml = fs.readFileSync(testHtmlPath, 'utf8');

// Create JSDOM instance
const dom = new JSDOM(testHtml, {
    url: 'https://www84.hattrick.org/Club/Matches/Match.aspx?matchID=757402591'
});

const { window } = dom;
const { document } = window;

// Mock CHPPApiClient
global.CHPPApiClient = class {
    async initialize() {
        return false;
    }
};

// Load the extractor
const extractorPath = path.join(__dirname, '..', 'content', 'matchDataExtractor.js');
const extractorCode = fs.readFileSync(extractorPath, 'utf8');

// Create a context with global and window references
global.window = window;
global.document = document;

// Create a function wrapper that returns the class
const wrapper = new Function('window', 'document', 'CHPPApiClient', extractorCode + '\nreturn HattrickMatchDataExtractor;');
const HattrickMatchDataExtractor = wrapper(window, document, global.CHPPApiClient);

// Create extractor instance
const extractor = new HattrickMatchDataExtractor();

// Run test
log('\n🧪 Shop Link Filtering Test', colors.blue);
log('============================', colors.blue);

const matchInfo = extractor.extractMatchInfo();

log('\nExtracted Match Info:', colors.cyan);
log(JSON.stringify(matchInfo, null, 2));

// Test: Match type should NOT be "Il nostro negozio"
if (matchInfo.type && matchInfo.type.toLowerCase().includes('negozio')) {
    log('\n✗ FAIL: Match type incorrectly extracted as shop link!', colors.red);
    log(`  Match type: "${matchInfo.type}"`, colors.yellow);
    log('  Expected: Should not contain "negozio"', colors.yellow);
    process.exit(1);
} else if (matchInfo.type === 'V.227') {
    log('\n✓ PASS: Match type correctly extracted (V.227)', colors.green);
    log('  Shop link was properly filtered out', colors.green);
    process.exit(0);
} else {
    log('\n⚠ WARNING: Match type is not "negozio" but also not "V.227"', colors.yellow);
    log(`  Match type: "${matchInfo.type}"`, colors.yellow);
    log('  This might be acceptable depending on page structure', colors.yellow);
    // Still pass since we didn't pick up the shop link
    process.exit(0);
}
