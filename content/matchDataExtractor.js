// Match Data Extractor for Hattrick
// Extracts match information from the Hattrick match page HTML

class HattrickMatchDataExtractor {
  constructor() {
    this.matchData = null;
  }

  // Main extraction function
  extractMatchData() {
    console.log('Starting match data extraction...');
    
    const matchData = {
      matchInfo: this.extractMatchInfo(),
      teams: this.extractTeams(),
      players: this.extractPlayers(),
      stats: this.extractMatchStats(),
      events: this.extractMatchEvents()
    };

    this.matchData = matchData;
    console.log('Match data extracted:', matchData);
    return matchData;
  }

  // Extract basic match information
  extractMatchInfo() {
    const matchInfo = {
      matchId: this.getMatchIdFromUrl(),
      date: null,
      type: null,
      arena: null
    };

    // Try to extract match date and type from page
    const matchHeader = document.querySelector('.matchHeader, .boxHead, h1');
    if (matchHeader) {
      matchInfo.type = matchHeader.textContent.trim();
    }

    // Extract date if available
    const dateElements = document.querySelectorAll('.date, .matchDate, time');
    if (dateElements.length > 0) {
      matchInfo.date = dateElements[0].textContent.trim();
    }

    return matchInfo;
  }

  // Extract team information
  extractTeams() {
    const teams = {
      home: { name: null, score: null },
      away: { name: null, score: null }
    };

    // Try multiple selectors for team names
    const teamNameSelectors = [
      '.teamName',
      '.team-name',
      'a[href*="TeamID"]',
      '.homeTeam',
      '.awayTeam'
    ];

    const teamLinks = document.querySelectorAll('a[href*="TeamID"]');
    if (teamLinks.length >= 2) {
      teams.home.name = teamLinks[0].textContent.trim();
      teams.away.name = teamLinks[1].textContent.trim();
    }

    // Extract scores
    const scoreElements = document.querySelectorAll('.score, .matchScore, .result');
    if (scoreElements.length > 0) {
      const scoreText = scoreElements[0].textContent.trim();
      const scoreMatch = scoreText.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (scoreMatch) {
        teams.home.score = parseInt(scoreMatch[1]);
        teams.away.score = parseInt(scoreMatch[2]);
      }
    }

    return teams;
  }

  // Extract player lineups
  extractPlayers() {
    const players = {
      home: [],
      away: []
    };

    // Look for player tables or lists
    const playerLinks = document.querySelectorAll('a[href*="PlayerID"]');
    playerLinks.forEach(link => {
      const playerName = link.textContent.trim();
      const playerInfo = {
        name: playerName,
        id: this.extractIdFromUrl(link.href, 'PlayerID')
      };
      
      // Try to determine if home or away (this is heuristic)
      const playerRow = link.closest('tr, li, .player');
      if (playerRow) {
        players.home.push(playerInfo);
      }
    });

    return players;
  }

  // Extract match statistics
  extractMatchStats() {
    const stats = {
      possession: null,
      chances: { home: null, away: null },
      ratings: { home: null, away: null }
    };

    // Look for statistics tables
    const statRows = document.querySelectorAll('tr, .stat-row, .statistic');
    statRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      
      // Try to extract possession
      if (text.includes('possesso') || text.includes('possession')) {
        const numbers = text.match(/(\d+)/g);
        if (numbers && numbers.length >= 2) {
          stats.possession = {
            home: parseInt(numbers[0]),
            away: parseInt(numbers[1])
          };
        }
      }

      // Try to extract chances
      if (text.includes('occasioni') || text.includes('chances') || text.includes('opportunit')) {
        const numbers = text.match(/(\d+)/g);
        if (numbers && numbers.length >= 2) {
          stats.chances.home = parseInt(numbers[0]);
          stats.chances.away = parseInt(numbers[1]);
        }
      }
    });

    return stats;
  }

  // Extract match events (telecronaca/commentary)
  extractMatchEvents() {
    const events = [];

    // Look for event/commentary sections
    const eventSelectors = [
      '.matchEvent',
      '.event',
      '.commentary',
      '.telecronaca',
      '[class*="event"]',
      '[class*="comment"]'
    ];

    let eventElements = [];
    for (const selector of eventSelectors) {
      eventElements = document.querySelectorAll(selector);
      if (eventElements.length > 0) break;
    }

    // Also try to find events by looking for minute markers (45', 90', etc.)
    if (eventElements.length === 0) {
      const allElements = document.querySelectorAll('tr, div, li, p');
      eventElements = Array.from(allElements).filter(el => {
        const text = el.textContent;
        return /\d+['′]/.test(text); // Look for minute markers
      });
    }

    eventElements.forEach((element, index) => {
      const text = element.textContent.trim();
      
      // Extract minute
      const minuteMatch = text.match(/(\d+)['′]/);
      const minute = minuteMatch ? parseInt(minuteMatch[1]) : null;

      // Extract event type and description
      let eventType = 'info';
      if (text.toLowerCase().includes('goal') || text.toLowerCase().includes('gol')) {
        eventType = 'goal';
      } else if (text.toLowerCase().includes('yellow') || text.toLowerCase().includes('giallo')) {
        eventType = 'yellow_card';
      } else if (text.toLowerCase().includes('red') || text.toLowerCase().includes('rosso')) {
        eventType = 'red_card';
      } else if (text.toLowerCase().includes('substitution') || text.toLowerCase().includes('cambio')) {
        eventType = 'substitution';
      }

      events.push({
        minute: minute,
        type: eventType,
        description: text,
        rawHtml: element.innerHTML
      });
    });

    // Sort events by minute
    events.sort((a, b) => (a.minute || 0) - (b.minute || 0));

    return events;
  }

  // Helper: Extract match ID from URL
  getMatchIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/matchID=(\d+)/i);
    return match ? match[1] : null;
  }

  // Helper: Extract ID from URL parameter
  extractIdFromUrl(url, paramName) {
    const match = url.match(new RegExp(`${paramName}=(\\d+)`, 'i'));
    return match ? match[1] : null;
  }

  // Get the extracted data
  getMatchData() {
    return this.matchData;
  }
}
