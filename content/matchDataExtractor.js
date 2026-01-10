// Match Data Extractor for Hattrick
// Extracts match information from the Hattrick match page HTML

class HattrickMatchDataExtractor {
  constructor() {
    this.matchData = null;
  }

  // Main extraction function
  async extractMatchData() {
    console.log('Starting match data extraction...');
    
    // Wait for the page to finish loading dynamic content
    await this.waitForPageLoad();
    
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

  // Wait for dynamic content to load
  async waitForPageLoad(maxWaitTime = 15000) {
    console.log('Waiting for page content to load...');
    
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms
    
    while (Date.now() - startTime < maxWaitTime) {
      // Check for indicators that the page has loaded
      const hasTeamNames = document.querySelectorAll('a[href*="TeamID"]').length >= 2;
      const hasEvents = this.hasRealEvents();
      const notLoadingText = !this.hasLoadingText();
      
      if (hasTeamNames && hasEvents && notLoadingText) {
        console.log('Page content loaded successfully');
        return true;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.warn('Timeout waiting for page to load, proceeding with extraction anyway');
    return false;
  }

  // Check if the page has loading text
  hasLoadingText() {
    const bodyText = document.body.textContent.toLowerCase();
    const loadingPhrases = [
      'attendere prego', // Italian: Please wait
      'please wait',     // English
      'bitte warten',    // German
      'espere por favor', // Spanish
      'veuillez patienter', // French
      'por favor aguarde', // Portuguese
      'vänligen vänta', // Swedish
      'loading',
      'cargando',
      'chargement'
    ];
    
    return loadingPhrases.some(phrase => bodyText.includes(phrase));
  }

  // Check if there are real events (not just loading placeholders)
  hasRealEvents() {
    // Look for event containers
    const eventSelectors = [
      '.matchEvent',
      '.event',
      '.commentary',
      '.telecronaca',
      '[class*="event"]',
      '[class*="comment"]'
    ];
    
    for (const selector of eventSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Check if any element has real content (not just loading animations)
        for (const element of elements) {
          const text = element.textContent.trim();
          const hasMinute = /\d+['′]/.test(text);
          const hasCanvas = element.querySelector('canvas');
          const hasRiveAnimator = element.querySelector('[class*="rive"]');
          
          // If it has a minute marker and no loading animations, it's real
          if (hasMinute && !hasCanvas && !hasRiveAnimator) {
            return true;
          }
          
          // If it has substantial text content (more than 10 chars) and no animations
          if (text.length > 10 && !hasCanvas && !hasRiveAnimator) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Extract basic match information
  extractMatchInfo() {
    const matchInfo = {
      matchId: this.getMatchIdFromUrl(),
      date: null,
      type: null,
      arena: null
    };

    // Try to extract match type from page - look for header elements
    // Avoid "loading" text by checking multiple selectors
    const matchHeaderSelectors = [
      '.matchHeader',
      '.boxHead',
      'h1',
      '[class*="header"]',
      '[class*="title"]'
    ];
    
    for (const selector of matchHeaderSelectors) {
      const headers = document.querySelectorAll(selector);
      for (const header of headers) {
        const text = header.textContent.trim();
        // Skip if it's a loading message
        if (text && text.length > 0 && text.length < 100 && !this.isLoadingText(text)) {
          matchInfo.type = text;
          break;
        }
      }
      if (matchInfo.type) break;
    }

    // Extract date if available - look for date/time elements
    const dateSelectors = [
      '.date',
      '.matchDate',
      'time',
      '[class*="date"]',
      '[datetime]'
    ];
    
    for (const selector of dateSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        const dateText = elements[0].textContent.trim();
        if (dateText && !this.isLoadingText(dateText)) {
          matchInfo.date = dateText;
          break;
        }
        // Also check datetime attribute
        const datetime = elements[0].getAttribute('datetime');
        if (datetime) {
          matchInfo.date = datetime;
          break;
        }
      }
    }

    return matchInfo;
  }

  // Helper to check if text is a loading message
  isLoadingText(text) {
    const lowerText = text.toLowerCase();
    const loadingPhrases = [
      'attendere prego',
      'please wait',
      'bitte warten',
      'espere por favor',
      'veuillez patienter',
      'por favor aguarde',
      'vänligen vänta',
      'loading',
      'cargando',
      'chargement',
      'laden'
    ];
    
    return loadingPhrases.some(phrase => lowerText.includes(phrase));
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
      
      // Skip elements with loading indicators
      const hasCanvas = element.querySelector('canvas');
      const hasRiveAnimator = element.querySelector('[class*="rive"]');
      const isLoadingText = this.isLoadingText(text);
      
      // Skip if it's a loading placeholder
      if (hasCanvas || hasRiveAnimator || isLoadingText || text.length < 3) {
        return;
      }
      
      // Extract minute
      const minuteMatch = text.match(/(\d+)['′]/);
      const minute = minuteMatch ? parseInt(minuteMatch[1]) : null;

      // Extract event type and description
      let eventType = 'info';
      if (text.toLowerCase().includes('goal') || text.toLowerCase().includes('gol')) {
        eventType = 'goal';
      } else if (text.toLowerCase().includes('yellow') || text.toLowerCase().includes('giallo') || text.toLowerCase().includes('gelb') || text.toLowerCase().includes('amarillo')) {
        eventType = 'yellow_card';
      } else if (text.toLowerCase().includes('red') || text.toLowerCase().includes('rosso') || text.toLowerCase().includes('rot') || text.toLowerCase().includes('rojo')) {
        eventType = 'red_card';
      } else if (text.toLowerCase().includes('substitution') || text.toLowerCase().includes('cambio') || text.toLowerCase().includes('sostituzione') || text.toLowerCase().includes('auswechslung')) {
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
