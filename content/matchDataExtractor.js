// Match Data Extractor for Hattrick
// Fetches match information from the Hattrick CHPP API via background service worker

class HattrickMatchDataExtractor {
  constructor() {
    this.matchData = null;
  }

  // Initialize the extractor
  async initialize() {
    // Check authentication status via background worker
    const response = await this.sendMessageToBackground({ action: 'checkAuthentication' });
    console.log(`CHPP API initialized: ${response.authenticated ? 'authenticated' : 'not authenticated, needs OAuth flow'}`);
    return response.authenticated;
  }

  // Main extraction function
  async extractMatchData() {
    console.log('Starting match data extraction from CHPP API...');
    
    // Get match ID from URL
    const matchId = this.getMatchIdFromUrl();
    if (!matchId) {
      throw new Error('Could not extract match ID from URL');
    }

    // Fetch data from API via background worker
    const matchData = await this.extractFromAPI(matchId);
    
    this.matchData = matchData;
    console.log('Match data extracted from API:', matchData);
    return matchData;
  }

  // Extract data from CHPP API via background worker
  async extractFromAPI(matchId) {
    // Fetch match details (required) and events (optional, may fail) in parallel via background
    const results = await Promise.allSettled([
      this.sendMessageToBackground({ action: 'getMatchDetails', matchId: matchId }),
      this.sendMessageToBackground({ action: 'getLiveMatchEvents', matchId: matchId })
    ]);

    // Handle match details (must succeed)
    const matchDetailsResult = results[0];
    if (matchDetailsResult.status === 'rejected' || !matchDetailsResult.value.success) {
      const error = matchDetailsResult.status === 'rejected' 
        ? matchDetailsResult.reason.message 
        : matchDetailsResult.value.error;
      throw new Error(error || 'Failed to fetch match details');
    }

    // Handle live events (optional, can fail gracefully)
    const liveEventsResult = results[1];
    let liveEvents = [];
    if (liveEventsResult.status === 'fulfilled' && liveEventsResult.value.success) {
      liveEvents = liveEventsResult.value.data;
    } else {
      const error = liveEventsResult.status === 'rejected'
        ? liveEventsResult.reason.message
        : liveEventsResult.value.error;
      console.warn('Could not fetch live events:', error);
    }

    const matchDetails = matchDetailsResult.value.data;

    // Merge the data
    return {
      matchInfo: matchDetails.matchInfo,
      teams: matchDetails.teams,
      players: matchDetails.players,
      stats: matchDetails.stats,
      events: liveEvents
    };
  }

  // Helper: Send message to background worker
  async sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Helper: Extract match ID from URL
  getMatchIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/matchID=(\d+)/i);
    return match ? match[1] : null;
  }

  // Get the extracted data
  getMatchData() {
    return this.matchData;
  }

  // Check if API is available
  async isAPIAvailable() {
    const response = await this.sendMessageToBackground({ action: 'checkAuthentication' });
    return response.authenticated;
  }

  // Start authentication flow via background worker
  async authenticate(consumerKey, consumerSecret) {
    const response = await this.sendMessageToBackground({ 
      action: 'authenticate', 
      consumerKey: consumerKey || null,
      consumerSecret: consumerSecret || null
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Authentication failed');
    }
    
    return true;
  }
}
