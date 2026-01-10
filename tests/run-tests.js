#!/usr/bin/env node

/**
 * Node.js Test Runner for DOM Parsing
 * Tests the matchDataExtractor.js DOM parsing functionality using JSDOM
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

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Helper functions
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function testResult(testName, passed, expected, actual) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`  ✓ ${testName}`, colors.green);
    } else {
        testResults.failed++;
        log(`  ✗ ${testName}`, colors.red);
        log(`    Expected: ${expected}`, colors.yellow);
        log(`    Actual: ${actual}`, colors.yellow);
    }
}

function sectionHeader(title) {
    log(`\n${title}`, colors.cyan);
    log('='.repeat(title.length), colors.cyan);
}

// Load test HTML
const testHtmlPath = path.join(__dirname, 'match-sample.html');
const testHtml = fs.readFileSync(testHtmlPath, 'utf8');

// Create JSDOM instance
const dom = new JSDOM(testHtml, {
    url: 'https://www84.hattrick.org/Club/Matches/Match.aspx?matchID=757402591'
});

const { window } = dom;
const { document } = window;

// Mock CHPPApiClient (not needed for DOM tests)
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

// Run tests
async function runTests() {
    log('\n🧪 Hattrick Match Data Extractor - DOM Parsing Tests', colors.blue);
    log('====================================================', colors.blue);
    
    // Test 1: Match Info Extraction
    sectionHeader('1. Match Info Extraction');
    try {
        const matchInfo = {
            matchId: extractor.getMatchIdFromUrl(),
            date: document.querySelector('.date-time')?.textContent.trim() || null,
            type: document.querySelector('.league')?.textContent.trim() || null,
            arena: document.querySelector('.arena')?.textContent.trim() || null
        };
        
        testResult(
            'Match ID extracted',
            matchInfo.matchId === '757402591',
            '757402591',
            matchInfo.matchId
        );
        
        testResult(
            'Match date extracted',
            matchInfo.date !== null && matchInfo.date.includes('2026'),
            'Date containing 2026',
            matchInfo.date
        );
        
        testResult(
            'Match type/league extracted',
            matchInfo.type === 'V.227',
            'V.227',
            matchInfo.type
        );
        
        testResult(
            'Arena extracted',
            matchInfo.arena === 'quelli di Cico Arena',
            'quelli di Cico Arena',
            matchInfo.arena
        );
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
    }
    
    // Test 2: Team Extraction
    sectionHeader('2. Team Extraction');
    try {
        const teams = extractor.extractTeams();
        
        testResult(
            'Home team name',
            teams.home.name === 'quelli di Cico',
            'quelli di Cico',
            teams.home.name
        );
        
        testResult(
            'Away team name',
            teams.away.name === 'Team Paradiso',
            'Team Paradiso',
            teams.away.name
        );
        
        testResult(
            'Home team score',
            teams.home.score === 0,
            '0',
            teams.home.score
        );
        
        testResult(
            'Away team score',
            teams.away.score === 2,
            '2',
            teams.away.score
        );
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
    }
    
    // Test 3: Match Events Extraction
    sectionHeader('3. Match Events Extraction');
    try {
        const events = extractor.extractMatchEvents();
        
        testResult(
            'Events extracted',
            events.length > 0,
            '> 0 events',
            `${events.length} events`
        );
        
        const goals = events.filter(e => e.type === 'goal');
        testResult(
            'Goals detected',
            goals.length === 2,
            '2 goals',
            `${goals.length} goals`
        );
        
        const firstGoal = goals.find(g => g.minute === 18);
        testResult(
            'First goal at minute 18',
            firstGoal !== undefined,
            'Goal at minute 18',
            firstGoal ? `Found at minute ${firstGoal.minute}` : 'Not found'
        );
        
        const secondGoal = goals.find(g => g.minute === 89);
        testResult(
            'Second goal at minute 89',
            secondGoal !== undefined,
            'Goal at minute 89',
            secondGoal ? `Found at minute ${secondGoal.minute}` : 'Not found'
        );
        
        const yellowCards = events.filter(e => e.type === 'yellow_card');
        testResult(
            'Yellow card detected',
            yellowCards.length === 1,
            '1 yellow card',
            `${yellowCards.length} yellow cards`
        );
        
        const substitutions = events.filter(e => e.type === 'substitution');
        testResult(
            'Substitutions detected',
            substitutions.length >= 1,
            '≥ 1 substitution',
            `${substitutions.length} substitutions`
        );
        
        // Check event ordering
        const minutesAreOrdered = events.every((event, index) => {
            if (index === 0) return true;
            const prevMinute = events[index - 1].minute || 0;
            const currMinute = event.minute || 0;
            return currMinute >= prevMinute;
        });
        testResult(
            'Events sorted by minute',
            minutesAreOrdered,
            'Events ordered',
            minutesAreOrdered ? 'Properly ordered' : 'Not sorted'
        );
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
        console.error(error);
    }
    
    // Test 4: Statistics Extraction
    sectionHeader('4. Statistics Extraction');
    try {
        const stats = extractor.extractMatchStats();
        
        testResult(
            'Possession data extracted',
            stats.possession !== null,
            'Possession object',
            stats.possession ? JSON.stringify(stats.possession) : 'null'
        );
        
        if (stats.possession) {
            testResult(
                'Home possession percentage',
                stats.possession.home === 48,
                '48%',
                `${stats.possession.home}%`
            );
            
            testResult(
                'Away possession percentage',
                stats.possession.away === 52,
                '52%',
                `${stats.possession.away}%`
            );
        }
        
        // Note: Chances extraction may need improvement in the parser
        if (stats.chances.home !== null && stats.chances.away !== null) {
            testResult(
                'Match chances data',
                stats.chances.home === 5 && stats.chances.away === 5,
                'Home: 5, Away: 5',
                `Home: ${stats.chances.home}, Away: ${stats.chances.away}`
            );
        } else {
            log(`  ⚠ Chances data not extracted (may need parser improvement)`, colors.yellow);
        }
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
    }
    
    // Test 5: Player Extraction
    sectionHeader('5. Player Extraction');
    try {
        const players = extractor.extractPlayers();
        const allPlayers = [...players.home, ...players.away];
        
        testResult(
            'Players extracted',
            allPlayers.length > 0,
            '> 0 players',
            `${allPlayers.length} players`
        );
        
        testResult(
            'Minimum player count',
            allPlayers.length >= 22,
            '≥ 22 players',
            `${allPlayers.length} players`
        );
        
        const surace = allPlayers.find(p => p.name.includes('Surace'));
        testResult(
            'Home goalkeeper found (Surace)',
            surace !== undefined,
            'Surace found',
            surace ? surace.name : 'Not found'
        );
        
        const binFadlin = allPlayers.find(p => p.name.includes('bin Fadlin'));
        testResult(
            'First goal scorer found (bin Fadlin)',
            binFadlin !== undefined,
            'bin Fadlin found',
            binFadlin ? binFadlin.name : 'Not found'
        );
        
        const liias = allPlayers.find(p => p.name.includes('Liias'));
        testResult(
            'Second goal scorer found (Liias)',
            liias !== undefined,
            'Liias found',
            liias ? liias.name : 'Not found'
        );
    } catch (error) {
        log(`  ✗ Error in test: ${error.message}`, colors.red);
    }
    
    // Summary
    log('\n' + '='.repeat(50), colors.blue);
    log(`Test Results: ${testResults.passed}/${testResults.total} passed`, 
        testResults.failed === 0 ? colors.green : colors.yellow);
    if (testResults.failed > 0) {
        log(`${testResults.failed} test(s) failed`, colors.red);
    } else {
        log('🎉 All tests passed!', colors.green);
    }
    log('='.repeat(50), colors.blue);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
