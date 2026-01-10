// Match Data Extractor for Hattrick
// Fetches match information from the Hattrick CHPP API

class HattrickMatchDataExtractor {
  constructor() {
    this.matchData = null;
    this.apiClient = new CHPPApiClient();
    this.useAPI = false; // Flag to use API vs DOM parsing
  }

  // Initialize the extractor
  async initialize() {
    // Check if API client is authenticated
    const isAuthenticated = await this.apiClient.initialize();
    this.useAPI = isAuthenticated;
    console.log(`Data extraction method: ${this.useAPI ? 'CHPP API' : 'DOM parsing (fallback)'}`);
    return this.useAPI;
  }

  // Main extraction function
  async extractMatchData() {
    console.log('Starting match data extraction...');
    
    // Get match ID from URL
    const matchId = this.getMatchIdFromUrl();
    if (!matchId) {
      throw new Error('Could not extract match ID from URL');
    }

    let matchData;

    // Try to use API first if authenticated
    if (this.useAPI) {
      try {
        console.log('Fetching match data from CHPP API...');
        matchData = await this.extractFromAPI(matchId);
        console.log('Match data fetched from API successfully');
      } catch (error) {
        console.error('API extraction failed, falling back to DOM parsing:', error);
        this.useAPI = false;
        matchData = await this.extractFromDOM();
      }
    } else {
      // Fallback to DOM parsing
      console.log('Using DOM parsing (API not authenticated)');
      matchData = await this.extractFromDOM();
    }

    this.matchData = matchData;
    console.log('Match data extracted:', matchData);
    return matchData;
  }

  // Extract data from CHPP API
  async extractFromAPI(matchId) {
    // Fetch match details and events in parallel
    const [matchDetails, liveEvents] = await Promise.all([
      this.apiClient.getMatchDetails(matchId),
      this.apiClient.getLiveMatchEvents(matchId).catch(err => {
        console.warn('Could not fetch live events:', err);
        return [];
      })
    ]);

    // Merge the data
    return {
      matchInfo: matchDetails.matchInfo,
      teams: matchDetails.teams,
      players: matchDetails.players,
      stats: matchDetails.stats,
      events: liveEvents
    };
  }

  // Extract data from DOM (fallback method)
  async extractFromDOM() {
    console.log('Extracting data from DOM...');
    
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
    console.log('Match data extracted from DOM:', matchData);
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
    // Use more specific selectors and validate the content
    // Order matters: more specific selectors first
    const matchHeaderSelectors = [
      '.league',         // League/division name (most specific)
      '.match-type',
      '.matchHeader',
      '.boxHead',
      'h1',
      'h2',
      '[class*="header"]'
    ];
    
    for (const selector of matchHeaderSelectors) {
      const headers = document.querySelectorAll(selector);
      for (const header of headers) {
        const text = header.textContent.trim();
        
        // Skip if the header only contains a link (likely navigation)
        const links = header.querySelectorAll('a');
        if (links.length > 0) {
          const linkText = Array.from(links).map(l => l.textContent.trim()).join(' ').trim();
          // If the header text is mostly/only link text, skip it
          if (linkText === text || text.startsWith(linkText)) {
            continue;
          }
        }
        
        // Skip if it's a loading message, navigation element, or too short/long
        // Match type should be at least 3 characters (e.g., "V.1") and less than 100
        if (text && text.length >= 3 && text.length < 100 && 
            !this.isLoadingText(text) && 
            !this.isNavigationOrUIElement(text, header)) {
          matchInfo.type = text;
          break;
        }
      }
      if (matchInfo.type) break;
    }

    // Extract date if available - look for date/time elements
    // Be more specific and validate content
    const dateSelectors = [
      '.matchDate',
      '.date',
      '.date-time',
      'time',
      '[datetime]'
    ];
    
    for (const selector of dateSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // First try to get datetime attribute (most reliable)
        const datetime = element.getAttribute('datetime');
        if (datetime) {
          matchInfo.date = datetime;
          break;
        }
        
        // Otherwise try text content
        const dateText = element.textContent.trim();
        if (dateText && !this.isLoadingText(dateText) && 
            !this.isNavigationOrUIElement(dateText, element)) {
          matchInfo.date = dateText;
          break;
        }
      }
      if (matchInfo.date) break;
    }

    // Extract arena if available
    const arenaSelectors = [
      '.arena',
      '[class*="arena"]',
      '[class*="stadium"]'
    ];
    
    for (const selector of arenaSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const arenaText = element.textContent.trim();
        if (arenaText && !this.isLoadingText(arenaText) && 
            !this.isNavigationOrUIElement(arenaText, element)) {
          matchInfo.arena = arenaText;
          break;
        }
      }
      if (matchInfo.arena) break;
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

  // Helper to check if text is navigation or UI element (not match data)
  isNavigationOrUIElement(text, element) {
    if (!text) return true;
    
    // Check for navigation arrows
    const navigationPatterns = [
      '>>',
      '<<',
      '»',
      '«',
      '›',
      '‹',
      'successivo',  // Italian: next
      'precedente',  // Italian: previous
      'next',
      'previous',
      'weiter',      // German: next
      'zurück'       // German: back
    ];
    
    const lowerText = text.toLowerCase();
    if (navigationPatterns.some(pattern => lowerText.includes(pattern))) {
      return true;
    }
    
    // Check for promotional/ad keywords
    const adKeywords = [
      'compra',      // Italian: buy
      'buy',
      'shop',
      'negozio',     // Italian: shop/store
      'negozi',      // Italian: shops/stores (plural)
      'regalo',      // Italian: gift
      'gift',
      'sponsor',
      'advertisement',
      'pubblicità'   // Italian: advertisement
    ];
    
    if (adKeywords.some(keyword => lowerText.includes(keyword))) {
      return true;
    }
    
    // Check if element is a link or button (likely navigation)
    if (element) {
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'a' || tagName === 'button') {
        return true;
      }
      
      // Check if element is inside a link or button
      const parentLink = element.closest('a, button');
      if (parentLink) {
        return true;
      }
    }
    
    return false;
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
      // Look for rows with "possesso" OR rows with "primo tempo" / "first half" with percentages
      if (text.includes('possesso') || text.includes('possession') || 
          (text.includes('primo tempo') || text.includes('first half')) && text.includes('%')) {
        const percentages = text.match(/(\d+)%/g);
        if (percentages && percentages.length >= 2) {
          stats.possession = {
            home: parseInt(percentages[0].replace('%', '')),
            away: parseInt(percentages[1].replace('%', ''))
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
      // First try to get from a dedicated minute element
      const minuteElement = element.querySelector('.minute, [class*="minute"]');
      let minute = null;
      
      if (minuteElement) {
        minute = parseInt(minuteElement.textContent.trim());
      } else {
        // Otherwise try to extract from text with apostrophe marker
        const minuteMatch = text.match(/(\d+)['′]/);
        minute = minuteMatch ? parseInt(minuteMatch[1]) : null;
      }

      // Extract event type and description
      let eventType = 'info';
      const lowerText = text.toLowerCase();
      
      // Detect goals - check for multiple patterns
      if (lowerText.includes('goal') || lowerText.includes('gol') ||
          /\d+\s*[-a]\s*\d+/.test(lowerText) && (lowerText.includes('vale') || lowerText.includes('porta') || lowerText.includes('segna'))) {
        eventType = 'goal';
      } else if (lowerText.includes('yellow') || lowerText.includes('giallo') || lowerText.includes('gelb') || lowerText.includes('amarillo')) {
        eventType = 'yellow_card';
      } else if (lowerText.includes('red') || lowerText.includes('rosso') || lowerText.includes('rot') || lowerText.includes('rojo')) {
        eventType = 'red_card';
      } else if (lowerText.includes('substitution') || lowerText.includes('cambio') || lowerText.includes('sostituzione') || lowerText.includes('auswechslung')) {
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

  // Check if API is available
  isAPIAvailable() {
    return this.useAPI;
  }

  // Get API client for authentication management
  getAPIClient() {
    return this.apiClient;
  }
}
