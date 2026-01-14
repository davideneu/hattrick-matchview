// Hattrick CHPP API Client
// Handles communication with Hattrick CHPP API endpoints

class CHPPApiClient {
  constructor() {
    this.baseUrl = 'https://chpp.hattrick.org';
    this.xmlBaseUrl = 'https://www.hattrick.org/chppxml';
    // Default test credentials provided by the user for quick setup
    // NOTE: These are intentionally included for testing purposes
    // Users can override with their own credentials via the settings page
    this.defaultConsumerKey = 'SNbqfVnQkV9IkrMhbGAqae';
    this.defaultConsumerSecret = 'EriFMHbmnnKG9HT3YL7Y9LANP7ziJtaHWnpJqSeFLsH';
    this.consumerKey = null;
    this.consumerSecret = null;
    this.accessToken = null;
    this.accessTokenSecret = null;
  }

  // Initialize client with credentials
  async initialize() {
    // Load stored credentials from chrome.storage
    const stored = await this.loadCredentials();
    if (stored) {
      this.consumerKey = stored.consumerKey;
      this.consumerSecret = stored.consumerSecret;
      this.accessToken = stored.accessToken;
      this.accessTokenSecret = stored.accessTokenSecret;
    } else {
      // Use default credentials if no user credentials are stored
      this.consumerKey = this.defaultConsumerKey;
      this.consumerSecret = this.defaultConsumerSecret;
    }
    return this.isAuthenticated();
  }

  // Check if client is authenticated
  isAuthenticated() {
    return !!(this.consumerKey && this.consumerSecret && 
              this.accessToken && this.accessTokenSecret);
  }

  // Check if using default credentials
  isUsingDefaultCredentials() {
    return this.consumerKey === this.defaultConsumerKey;
  }

  // Load credentials from storage
  async loadCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['chppCredentials'], (result) => {
        resolve(result.chppCredentials || null);
      });
    });
  }

  // Save credentials to storage
  async saveCredentials(credentials) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ chppCredentials: credentials }, () => {
        resolve();
      });
    });
  }

  // Start OAuth authentication flow
  async authenticate(consumerKey, consumerSecret) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;

    try {
      // Step 1: Get request token
      const requestToken = await this.getRequestToken();
      
      // Step 2: Authorize with user
      const verifier = await this.authorizeUser(requestToken);
      
      // Step 3: Exchange for access token
      const accessToken = await this.getAccessToken(requestToken, verifier);
      
      // Save credentials
      await this.saveCredentials({
        consumerKey: this.consumerKey,
        consumerSecret: this.consumerSecret,
        accessToken: accessToken.token,
        accessTokenSecret: accessToken.secret
      });
      
      this.accessToken = accessToken.token;
      this.accessTokenSecret = accessToken.secret;
      
      return true;
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      throw error;
    }
  }

  // Step 1: Get OAuth request token
  async getRequestToken() {
    // Generate OAuth parameters
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: this.generateNonce(),
      oauth_version: '1.0',
      oauth_callback: chrome.identity.getRedirectURL('oauth')
    };

    // Generate signature
    const signature = await this.generateSignature('POST', 
      `${this.baseUrl}/oauth/request_token.ashx`, oauthParams, '');

    oauthParams.oauth_signature = signature;

    // Make request
    const response = await fetch(`${this.baseUrl}/oauth/request_token.ashx`, {
      method: 'POST',
      headers: {
        'Authorization': this.buildAuthorizationHeader(oauthParams)
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get request token: ${response.status}`);
    }

    const text = await response.text();
    return this.parseOAuthResponse(text);
  }

  // Step 2: Authorize user via browser
  async authorizeUser(requestToken) {
    const authUrl = `${this.baseUrl}/oauth/authorize.aspx?oauth_token=${requestToken.oauth_token}`;
    
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        // Parse verifier from redirect URL
        const url = new URL(responseUrl);
        const verifier = url.searchParams.get('oauth_verifier');
        
        if (!verifier) {
          reject(new Error('No verifier received'));
          return;
        }
        
        resolve(verifier);
      });
    });
  }

  // Step 3: Get access token
  async getAccessToken(requestToken, verifier) {
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_token: requestToken.oauth_token,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: this.generateNonce(),
      oauth_version: '1.0',
      oauth_verifier: verifier
    };

    const signature = await this.generateSignature('POST',
      `${this.baseUrl}/oauth/access_token.ashx`, oauthParams, 
      requestToken.oauth_token_secret);

    oauthParams.oauth_signature = signature;

    const response = await fetch(`${this.baseUrl}/oauth/access_token.ashx`, {
      method: 'POST',
      headers: {
        'Authorization': this.buildAuthorizationHeader(oauthParams)
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const text = await response.text();
    const parsed = this.parseOAuthResponse(text);
    
    return {
      token: parsed.oauth_token,
      secret: parsed.oauth_token_secret
    };
  }

  // Fetch match details from API
  async getMatchDetails(matchId) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const url = `${this.xmlBaseUrl}/matchdetails.asp`;
    const params = {
      matchID: matchId,
      outputType: 'XML'
    };

    const xml = await this.makeAuthenticatedRequest('GET', url, params);
    return this.parseMatchDetails(xml);
  }

  // Fetch live match events from API
  async getLiveMatchEvents(matchId) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const url = `${this.xmlBaseUrl}/live.asp`;
    const params = {
      matchID: matchId,
      actionType: 'view',
      outputType: 'XML'
    };

    const xml = await this.makeAuthenticatedRequest('GET', url, params);
    return this.parseLiveEvents(xml);
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(method, url, params = {}) {
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_token: this.accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: this.generateNonce(),
      oauth_version: '1.0'
    };

    // Build full URL with query params
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Generate signature (include query params)
    const signature = await this.generateSignature(method, url, 
      { ...oauthParams, ...params }, this.accessTokenSecret);

    oauthParams.oauth_signature = signature;

    // Make request
    const response = await fetch(fullUrl, {
      method: method,
      headers: {
        'Authorization': this.buildAuthorizationHeader(oauthParams)
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  // Generate OAuth signature (HMAC-SHA1)
  async generateSignature(method, url, params, tokenSecret = '') {
    // Sort parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`)
      .join('&');

    // Create signature base string
    const baseString = [
      method.toUpperCase(),
      this.percentEncode(url),
      this.percentEncode(sortedParams)
    ].join('&');

    // Create signing key
    const signingKey = `${this.percentEncode(this.consumerSecret)}&${this.percentEncode(tokenSecret)}`;

    // Generate HMAC-SHA1 signature
    const signature = await this.hmacSha1(signingKey, baseString);
    return signature;
  }

  // HMAC-SHA1 implementation using Web Crypto API
  async hmacSha1(key, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return base64;
  }

  // Build Authorization header
  buildAuthorizationHeader(params) {
    const header = Object.keys(params)
      .map(key => `${this.percentEncode(key)}="${this.percentEncode(params[key])}"`)
      .join(', ');
    return `OAuth ${header}`;
  }

  // Generate random nonce
  generateNonce() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Percent encode per OAuth spec
  percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  // Parse OAuth response (query string format)
  parseOAuthResponse(text) {
    const params = {};
    text.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });
    return params;
  }

  // Parse XML match details
  parseMatchDetails(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for errors
    const error = xmlDoc.querySelector('Error');
    if (error) {
      throw new Error(`API Error: ${error.textContent}`);
    }

    // Extract match information
    const matchData = {
      matchInfo: {
        matchId: this.getXMLValue(xmlDoc, 'MatchID'),
        date: this.getXMLValue(xmlDoc, 'MatchDate'),
        type: this.getXMLValue(xmlDoc, 'MatchType'),
        arena: this.getXMLValue(xmlDoc, 'Arena > ArenaName')
      },
      teams: {
        home: {
          name: this.getXMLValue(xmlDoc, 'HomeTeam > HomeTeamName'),
          id: this.getXMLValue(xmlDoc, 'HomeTeam > HomeTeamID'),
          score: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > HomeGoals') || '0')
        },
        away: {
          name: this.getXMLValue(xmlDoc, 'AwayTeam > AwayTeamName'),
          id: this.getXMLValue(xmlDoc, 'AwayTeam > AwayTeamID'),
          score: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > AwayGoals') || '0')
        }
      },
      players: {
        home: this.extractPlayers(xmlDoc, 'HomeTeam'),
        away: this.extractPlayers(xmlDoc, 'AwayTeam')
      },
      stats: {
        possession: {
          home: parseInt(this.getXMLValue(xmlDoc, 'PossessionFirstHalfHome') || '0'),
          away: parseInt(this.getXMLValue(xmlDoc, 'PossessionFirstHalfAway') || '0')
        },
        chances: {
          home: this.countChances(xmlDoc, 'Home'),
          away: this.countChances(xmlDoc, 'Away')
        },
        ratings: {
          home: {
            midfield: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingMidfield') || '0'),
            leftDef: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingLeftDef') || '0'),
            midDef: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingMidDef') || '0'),
            rightDef: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingRightDef') || '0'),
            leftAtt: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingLeftAtt') || '0'),
            midAtt: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingMidAtt') || '0'),
            rightAtt: parseInt(this.getXMLValue(xmlDoc, 'HomeTeam > RatingRightAtt') || '0')
          },
          away: {
            midfield: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingMidfield') || '0'),
            leftDef: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingLeftDef') || '0'),
            midDef: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingMidDef') || '0'),
            rightDef: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingRightDef') || '0'),
            leftAtt: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingLeftAtt') || '0'),
            midAtt: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingMidAtt') || '0'),
            rightAtt: parseInt(this.getXMLValue(xmlDoc, 'AwayTeam > RatingRightAtt') || '0')
          }
        }
      }
    };

    return matchData;
  }

  // Parse XML live events
  parseLiveEvents(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for errors
    const error = xmlDoc.querySelector('Error');
    if (error) {
      throw new Error(`API Error: ${error.textContent}`);
    }

    const events = [];
    const eventNodes = xmlDoc.querySelectorAll('Event');

    eventNodes.forEach(node => {
      const minute = parseInt(this.getXMLValue(node, 'Minute') || '0');
      const eventTypeId = parseInt(this.getXMLValue(node, 'EventTypeID') || '0');
      const eventText = this.getXMLValue(node, 'EventText');
      
      events.push({
        minute: minute,
        type: this.mapEventType(eventTypeId),
        typeId: eventTypeId,
        description: eventText,
        teamId: this.getXMLValue(node, 'TeamID'),
        playerId: this.getXMLValue(node, 'PlayerID')
      });
    });

    return events;
  }

  // Extract players from XML
  extractPlayers(xmlDoc, teamType) {
    const players = [];
    const playerNodes = xmlDoc.querySelectorAll(`${teamType} > StartingLineup > Player`);

    playerNodes.forEach(node => {
      players.push({
        id: this.getXMLValue(node, 'PlayerID'),
        name: this.getXMLValue(node, 'PlayerName'),
        roleId: this.getXMLValue(node, 'RoleID'),
        behaviour: this.getXMLValue(node, 'Behaviour')
      });
    });

    return players;
  }

  // Count chances from match events
  countChances(xmlDoc, team) {
    // This would need to be extracted from scorers or goalchances if available
    // For now, return null as it might not be in matchdetails
    return null;
  }

  // Get XML value helper
  getXMLValue(node, path) {
    const parts = path.split(' > ');
    let current = node;
    
    for (const part of parts) {
      const element = current.querySelector(part);
      if (!element) return null;
      current = element;
    }
    
    return current.textContent;
  }

  // Map event type ID to readable type
  mapEventType(eventTypeId) {
    const eventTypes = {
      10: 'goal',
      11: 'goal', // Goal by penalty
      12: 'goal', // Goal by indirect free kick
      13: 'goal', // Goal by direct free kick  
      14: 'goal', // Goal by long shot
      15: 'goal', // Goal by special
      20: 'yellow_card',
      21: 'red_card',
      22: 'red_card', // Second yellow card
      30: 'substitution',
      31: 'swap_positions',
      40: 'injury',
      50: 'near_miss',
      51: 'chance',
      52: 'special_chance',
      60: 'halfway',
      61: 'whistle'
    };

    return eventTypes[eventTypeId] || 'info';
  }

  // Clear stored credentials
  async clearCredentials() {
    this.consumerKey = null;
    this.consumerSecret = null;
    this.accessToken = null;
    this.accessTokenSecret = null;
    
    return chrome.storage.local.remove(['chppCredentials']);
  }
}
