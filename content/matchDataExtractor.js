// Match Data Extractor for Hattrick
// Fetches match information from the Hattrick CHPP API

class HattrickMatchDataExtractor {
  constructor() {
    this.matchData = null;
    this.apiClient = new CHPPApiClient();
  }

  // Initialize the extractor
  async initialize() {
    // Initialize the API client with credentials
    const isAuthenticated = await this.apiClient.initialize();
    console.log(`CHPP API initialized: ${isAuthenticated ? 'authenticated' : 'not authenticated, needs OAuth flow'}`);
    return isAuthenticated;
  }

  // Main extraction function
  async extractMatchData() {
    console.log('Starting match data extraction from CHPP API...');
    
    // Get match ID from URL
    const matchId = this.getMatchIdFromUrl();
    if (!matchId) {
      throw new Error('Could not extract match ID from URL');
    }

    // Fetch data from API
    const matchData = await this.extractFromAPI(matchId);
    
    this.matchData = matchData;
    console.log('Match data extracted from API:', matchData);
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
  isAPIAvailable() {
    return this.apiClient.isAuthenticated();
  }

  // Get API client for authentication management
  getAPIClient() {
    return this.apiClient;
  }
}
