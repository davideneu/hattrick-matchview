// content.js - Content script for match pages

console.log('Hattrick Match View extension loaded on match page');

// Extract matchID from URL
function getMatchIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('matchID');
}

// Detect if current page is a live match page
function isLiveMatchPage() {
  return window.location.pathname.includes('/Club/Matches/Live.aspx');
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Decode HTML entities and strip HTML tags from EventText
// EventText contains HTML entities (&lt;, &gt;, &amp;, &#39;, &#246;, etc.)
// and HTML tags (<a>, <span>, <br />) that need to be removed for plain text display
function decodeHtmlEntities(text) {
  if (text === null || text === undefined || text === '') return '';
  
  // First decode HTML entities using textarea trick
  const textarea = document.createElement('textarea');
  textarea.innerHTML = String(text);
  const decoded = textarea.value;
  
  // Then create a div to strip HTML tags, keeping only text content
  const div = document.createElement('div');
  div.innerHTML = decoded;
  
  // Get text content and clean up extra whitespace
  return div.textContent.replace(/\s+/g, ' ').trim();
}

// Helper function to get text content safely from XML element
function getTextFromXML(element, selector, defaultValue = '') {
  const node = element.querySelector(selector);
  return node ? node.textContent : defaultValue;
}

// Helper function to get all child elements as an array of DOM nodes
function getElementsFromXML(element, selector) {
  const nodes = element.querySelectorAll(selector);
  return Array.from(nodes);
}

// Parse and validate XML, returning the parsed document
function parseAndValidateXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for XML parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }
  
  // Check for API errors in the XML
  const errorNode = xmlDoc.querySelector('Error');
  if (errorNode) {
    throw new Error(errorNode.textContent || 'Unknown error from API');
  }
  
  return xmlDoc;
}

// Parse match XML data and convert to structured JSON
function parseMatchXML(xmlText) {
  const xmlDoc = parseAndValidateXML(xmlText);
  
  // Extract match data
  const match = xmlDoc.querySelector('Match');
  if (!match) {
    throw new Error('No match data found in response');
  }
  
  const matchData = {
    matchId: getTextFromXML(match, 'MatchID'),
    matchType: getTextFromXML(match, 'MatchType'),
    matchDate: getTextFromXML(match, 'MatchDate'),
    finishedDate: getTextFromXML(match, 'FinishedDate'),
    status: getTextFromXML(match, 'Status'),
    
    homeTeam: {
      teamId: getTextFromXML(match, 'HomeTeam > HomeTeamID'),
      teamName: getTextFromXML(match, 'HomeTeam > HomeTeamName'),
      dressURI: getTextFromXML(match, 'HomeTeam > DressURI'),
      formation: getTextFromXML(match, 'HomeTeam > Formation'),
      tacticType: getTextFromXML(match, 'HomeTeam > TacticType'),
      tacticSkill: getTextFromXML(match, 'HomeTeam > TacticSkill'),
      ratingMidfield: getTextFromXML(match, 'HomeTeam > RatingMidfield'),
      ratingRightDef: getTextFromXML(match, 'HomeTeam > RatingRightDef'),
      ratingMidDef: getTextFromXML(match, 'HomeTeam > RatingMidDef'),
      ratingLeftDef: getTextFromXML(match, 'HomeTeam > RatingLeftDef'),
      ratingRightAtt: getTextFromXML(match, 'HomeTeam > RatingRightAtt'),
      ratingMidAtt: getTextFromXML(match, 'HomeTeam > RatingMidAtt'),
      ratingLeftAtt: getTextFromXML(match, 'HomeTeam > RatingLeftAtt')
    },
    
    awayTeam: {
      teamId: getTextFromXML(match, 'AwayTeam > AwayTeamID'),
      teamName: getTextFromXML(match, 'AwayTeam > AwayTeamName'),
      dressURI: getTextFromXML(match, 'AwayTeam > DressURI'),
      formation: getTextFromXML(match, 'AwayTeam > Formation'),
      tacticType: getTextFromXML(match, 'AwayTeam > TacticType'),
      tacticSkill: getTextFromXML(match, 'AwayTeam > TacticSkill'),
      ratingMidfield: getTextFromXML(match, 'AwayTeam > RatingMidfield'),
      ratingRightDef: getTextFromXML(match, 'AwayTeam > RatingRightDef'),
      ratingMidDef: getTextFromXML(match, 'AwayTeam > RatingMidDef'),
      ratingLeftDef: getTextFromXML(match, 'AwayTeam > RatingLeftDef'),
      ratingRightAtt: getTextFromXML(match, 'AwayTeam > RatingRightAtt'),
      ratingMidAtt: getTextFromXML(match, 'AwayTeam > RatingMidAtt'),
      ratingLeftAtt: getTextFromXML(match, 'AwayTeam > RatingLeftAtt')
    },
    
    arena: {
      arenaId: getTextFromXML(match, 'Arena > ArenaID'),
      arenaName: getTextFromXML(match, 'Arena > ArenaName'),
      weatherId: getTextFromXML(match, 'Arena > WeatherID'),
      soldTotal: getTextFromXML(match, 'Arena > SoldTotal')
    },
    
    scoreboard: {
      homeGoals: getTextFromXML(match, 'HomeTeam > HomeGoals', '0'),
      awayGoals: getTextFromXML(match, 'AwayTeam > AwayGoals', '0')
    },
    
    // Parse events (goals, cards, injuries, etc.)
    events: getElementsFromXML(match, 'Scoreboard > Goal').map(goal => ({
      type: 'goal',
      minute: getTextFromXML(goal, 'Minute'),
      matchPart: getTextFromXML(goal, 'MatchPart'),
      subjectTeamId: getTextFromXML(goal, 'SubjectTeamID'),
      subjectPlayerId: getTextFromXML(goal, 'SubjectPlayerID'),
      subjectPlayerName: getTextFromXML(goal, 'SubjectPlayerName'),
      objectPlayerId: getTextFromXML(goal, 'ObjectPlayerID'),
      objectPlayerName: getTextFromXML(goal, 'ObjectPlayerName')
    })),
    
    // Parse all event list items (includes all events with EventText)
    allEvents: (() => {
      const eventList = getElementsFromXML(match, 'EventList > Event');
      return eventList.map(event => ({
        eventIndex: getTextFromXML(event, 'EventIndex'),
        eventTypeID: getTextFromXML(event, 'EventTypeID'),
        eventVariation: getTextFromXML(event, 'EventVariation'),
        minute: getTextFromXML(event, 'Minute'),
        matchPart: getTextFromXML(event, 'MatchPart'),
        subjectTeamId: getTextFromXML(event, 'SubjectTeamID'),
        subjectPlayerId: getTextFromXML(event, 'SubjectPlayerID'),
        subjectPlayerName: getTextFromXML(event, 'SubjectPlayerName'),
        objectPlayerId: getTextFromXML(event, 'ObjectPlayerID'),
        objectPlayerName: getTextFromXML(event, 'ObjectPlayerName'),
        eventText: getTextFromXML(event, 'EventText')
      }));
    })(),
    
    // Additional data
    possessionFirstHalfHome: getTextFromXML(match, 'PossessionFirstHalfHome'),
    possessionFirstHalfAway: getTextFromXML(match, 'PossessionFirstHalfAway'),
    possessionSecondHalfHome: getTextFromXML(match, 'PossessionSecondHalfHome'),
    possessionSecondHalfAway: getTextFromXML(match, 'PossessionSecondHalfAway')
  };
  
  return matchData;
}

// Parse live match XML data and convert to structured JSON
function parseLiveMatchXML(xmlText) {
  const xmlDoc = parseAndValidateXML(xmlText);
  
  // Extract team data
  const team = xmlDoc.querySelector('Team');
  if (!team) {
    throw new Error('No team data found in response');
  }
  
  const teamData = {
    teamId: getTextFromXML(team, 'TeamID'),
    teamName: getTextFromXML(team, 'TeamName'),
    shortTeamName: getTextFromXML(team, 'ShortTeamName'),
    league: {
      leagueId: getTextFromXML(team, 'League > LeagueID'),
      leagueName: getTextFromXML(team, 'League > LeagueName'),
      leagueLevelUnitId: getTextFromXML(team, 'League > LeagueLevelUnit > LeagueLevelUnitID'),
      leagueLevelUnitName: getTextFromXML(team, 'League > LeagueLevelUnit > LeagueLevelUnitName'),
      leagueLevel: getTextFromXML(team, 'League > LeagueLevelUnit > LeagueLevel')
    }
  };
  
  // Extract match list
  const matchList = getElementsFromXML(team, 'MatchList > Match').map(match => ({
    matchId: getTextFromXML(match, 'MatchID'),
    homeTeam: {
      homeTeamId: getTextFromXML(match, 'HomeTeam > HomeTeamID'),
      homeTeamName: getTextFromXML(match, 'HomeTeam > HomeTeamName'),
      homeTeamShortName: getTextFromXML(match, 'HomeTeam > HomeTeamShortName')
    },
    awayTeam: {
      awayTeamId: getTextFromXML(match, 'AwayTeam > AwayTeamID'),
      awayTeamName: getTextFromXML(match, 'AwayTeam > AwayTeamName'),
      awayTeamShortName: getTextFromXML(match, 'AwayTeam > AwayTeamShortName')
    },
    matchDate: getTextFromXML(match, 'MatchDate'),
    sourceSystem: getTextFromXML(match, 'SourceSystem', 'Hattrick'),
    matchType: getTextFromXML(match, 'MatchType'),
    matchContextId: getTextFromXML(match, 'MatchContextId'),
    cupLevel: getTextFromXML(match, 'CupLevel'),
    cupLevelIndex: getTextFromXML(match, 'CupLevelIndex'),
    homeGoals: getTextFromXML(match, 'HomeGoals', '0'),
    awayGoals: getTextFromXML(match, 'AwayGoals', '0'),
    status: getTextFromXML(match, 'Status'),
    ordersGiven: getTextFromXML(match, 'OrdersGiven')
  }));
  
  return {
    team: teamData,
    matches: matchList
  };
}

// Format raw XML for display in dev mode
function formatRawXML(xmlText) {
  // Escape and format XML for display
  const escaped = escapeHtml(xmlText);
  return `
    <div class="raw-xml-display">
      <div class="dev-mode-header">
        <h3>🔧 Dev Mode - Raw XML Response</h3>
        <p class="dev-mode-note">This is the raw XML response from the Hattrick API</p>
      </div>
      <pre class="xml-content">${escaped}</pre>
    </div>
  `;
}

// Format error message with optional tip
function formatErrorMessage(errorText, showDevModeTip = false) {
  let message = `<div class="error-message"><strong>Error:</strong> ${escapeHtml(errorText)}`;
  if (showDevModeTip) {
    message += `<br><br><small>Tip: Enable "Dev Mode" in the extension popup to view the raw XML response.</small>`;
  }
  message += `</div>`;
  return message;
}

// Format match data as HTML
function formatMatchData(data) {
  return `
    <div class="hattrick-match-data">
      <div class="match-header">
        <div class="match-meta">
          <p><strong>Match ID:</strong> ${escapeHtml(data.matchId)}</p>
          <p><strong>Match Type:</strong> ${escapeHtml(data.matchType)}</p>
          <p><strong>Date:</strong> ${escapeHtml(data.matchDate)}</p>
          <p><strong>Status:</strong> ${escapeHtml(data.status)}</p>
        </div>
        
        <div class="scoreboard">
          <h3>Score</h3>
          <div class="score-display">
            <span class="team-name">${escapeHtml(data.homeTeam.teamName)}</span>
            <span class="score">${escapeHtml(data.scoreboard.homeGoals)} - ${escapeHtml(data.scoreboard.awayGoals)}</span>
            <span class="team-name">${escapeHtml(data.awayTeam.teamName)}</span>
          </div>
        </div>
      </div>
      
      <div class="arena-info">
        <h3>Arena</h3>
        <p><strong>Name:</strong> ${escapeHtml(data.arena.arenaName)}</p>
        <p><strong>Attendance:</strong> ${escapeHtml(data.arena.soldTotal)}</p>
        <p><strong>Weather ID:</strong> ${escapeHtml(data.arena.weatherId)}</p>
      </div>
      
      <div class="team-section home-team">
        <h3>${escapeHtml(data.homeTeam.teamName)} (Home)</h3>
        <div class="team-stats">
          <p><strong>Team ID:</strong> ${escapeHtml(data.homeTeam.teamId)}</p>
          <p><strong>Formation:</strong> ${escapeHtml(data.homeTeam.formation)}</p>
          <p><strong>Tactic:</strong> ${escapeHtml(data.homeTeam.tacticType)} (Skill: ${escapeHtml(data.homeTeam.tacticSkill)})</p>
          <h4>Ratings</h4>
          <ul>
            <li><strong>Midfield:</strong> ${escapeHtml(data.homeTeam.ratingMidfield)}</li>
            <li><strong>Right Defense:</strong> ${escapeHtml(data.homeTeam.ratingRightDef)}</li>
            <li><strong>Mid Defense:</strong> ${escapeHtml(data.homeTeam.ratingMidDef)}</li>
            <li><strong>Left Defense:</strong> ${escapeHtml(data.homeTeam.ratingLeftDef)}</li>
            <li><strong>Right Attack:</strong> ${escapeHtml(data.homeTeam.ratingRightAtt)}</li>
            <li><strong>Mid Attack:</strong> ${escapeHtml(data.homeTeam.ratingMidAtt)}</li>
            <li><strong>Left Attack:</strong> ${escapeHtml(data.homeTeam.ratingLeftAtt)}</li>
          </ul>
        </div>
      </div>
      
      <div class="team-section away-team">
        <h3>${escapeHtml(data.awayTeam.teamName)} (Away)</h3>
        <div class="team-stats">
          <p><strong>Team ID:</strong> ${escapeHtml(data.awayTeam.teamId)}</p>
          <p><strong>Formation:</strong> ${escapeHtml(data.awayTeam.formation)}</p>
          <p><strong>Tactic:</strong> ${escapeHtml(data.awayTeam.tacticType)} (Skill: ${escapeHtml(data.awayTeam.tacticSkill)})</p>
          <h4>Ratings</h4>
          <ul>
            <li><strong>Midfield:</strong> ${escapeHtml(data.awayTeam.ratingMidfield)}</li>
            <li><strong>Right Defense:</strong> ${escapeHtml(data.awayTeam.ratingRightDef)}</li>
            <li><strong>Mid Defense:</strong> ${escapeHtml(data.awayTeam.ratingMidDef)}</li>
            <li><strong>Left Defense:</strong> ${escapeHtml(data.awayTeam.ratingLeftDef)}</li>
            <li><strong>Right Attack:</strong> ${escapeHtml(data.awayTeam.ratingRightAtt)}</li>
            <li><strong>Mid Attack:</strong> ${escapeHtml(data.awayTeam.ratingMidAtt)}</li>
            <li><strong>Left Attack:</strong> ${escapeHtml(data.awayTeam.ratingLeftAtt)}</li>
          </ul>
        </div>
      </div>
      
      <div class="possession-stats">
        <h3>Possession</h3>
        <div class="possession-container">
          <div class="possession-half">
            <h4>First Half</h4>
            <p><strong>Home:</strong> ${escapeHtml(data.possessionFirstHalfHome)}%</p>
            <p><strong>Away:</strong> ${escapeHtml(data.possessionFirstHalfAway)}%</p>
          </div>
          <div class="possession-half">
            <h4>Second Half</h4>
            <p><strong>Home:</strong> ${escapeHtml(data.possessionSecondHalfHome)}%</p>
            <p><strong>Away:</strong> ${escapeHtml(data.possessionSecondHalfAway)}%</p>
          </div>
        </div>
      </div>
      
      ${data.events && data.events.length > 0 ? `
        <div class="events-section">
          <h3>Goals</h3>
          <ul class="events-list">
            ${data.events.map(event => `
              <li>
                <strong>Minute ${escapeHtml(event.minute)}:</strong> 
                ${escapeHtml(event.subjectPlayerName)} 
                ${event.objectPlayerName ? `(assisted by ${escapeHtml(event.objectPlayerName)})` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.allEvents && data.allEvents.length > 0 ? `
        <div class="all-events-section">
          <h3>Match Events Timeline</h3>
          <div class="all-events-list">
            ${data.allEvents.filter(event => event.eventText && event.eventText.trim()).map(event => {
              const eventText = decodeHtmlEntities(event.eventText);
              return `
                <div class="event-item" data-event-type="${escapeHtml(event.eventTypeID)}">
                  <div class="event-time">
                    <span class="minute">${escapeHtml(event.minute)}'</span>
                    ${event.matchPart === '2' ? '<span class="match-part">2H</span>' : event.matchPart === '1' ? '<span class="match-part">1H</span>' : '<span class="match-part">Pre</span>'}
                  </div>
                  <div class="event-content">
                    <div class="event-text">${escapeHtml(eventText)}</div>
                    ${event.subjectPlayerName ? `<div class="event-players"><small>${escapeHtml(event.subjectPlayerName)}</small></div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Format live match data as HTML
function formatLiveMatchData(data) {
  // If there are no matches, show a message
  if (!data.matches || data.matches.length === 0) {
    return `
      <div class="hattrick-match-data">
        <div class="match-header">
          <div class="match-meta">
            <p><strong>Team:</strong> ${escapeHtml(data.team.teamName)}</p>
            <p><strong>League:</strong> ${escapeHtml(data.team.league.leagueName)}</p>
          </div>
        </div>
        <div class="info-message">
          <p>No live or upcoming matches found for this team.</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="hattrick-match-data">
      <div class="match-header">
        <div class="match-meta">
          <p><strong>Team:</strong> ${escapeHtml(data.team.teamName)}</p>
          <p><strong>League:</strong> ${escapeHtml(data.team.league.leagueName)}</p>
          <p><strong>Level:</strong> ${escapeHtml(data.team.league.leagueLevel)}</p>
        </div>
      </div>
      
      <div class="live-matches-section">
        <h3>Live & Upcoming Matches</h3>
        ${data.matches.map(match => `
          <div class="live-match-item ${match.status.toLowerCase()}">
            <div class="match-status-badge ${match.status.toLowerCase()}">
              ${escapeHtml(match.status)}
            </div>
            <div class="match-teams">
              <div class="team-row home-team">
                <span class="team-name">${escapeHtml(match.homeTeam.homeTeamName)}</span>
                <span class="team-score">${escapeHtml(match.homeGoals)}</span>
              </div>
              <div class="team-row away-team">
                <span class="team-name">${escapeHtml(match.awayTeam.awayTeamName)}</span>
                <span class="team-score">${escapeHtml(match.awayGoals)}</span>
              </div>
            </div>
            <div class="match-info">
              <p><strong>Match Type:</strong> ${escapeHtml(match.matchType)}</p>
              <p><strong>Date:</strong> ${escapeHtml(match.matchDate)}</p>
              ${match.ordersGiven ? `<p><strong>Orders Given:</strong> ${escapeHtml(match.ordersGiven)}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Create overlay button
function createOverlayButton() {
  // Check if overlay already exists
  if (document.getElementById('hattrick-match-view-overlay')) {
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'hattrick-match-view-overlay';
  overlay.innerHTML = `
    <button id="hattrick-match-view-toggle" class="hattrick-overlay-button">
      <span class="icon">📊</span>
      <span class="text">Match Data</span>
    </button>
  `;
  
  // Add overlay styles
  const style = document.createElement('style');
  style.textContent = `
    #hattrick-match-view-overlay {
      position: fixed;
      top: 100px;
      right: 0;
      z-index: 10000;
    }
    
    .hattrick-overlay-button {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 8px 0 0 8px;
      padding: 12px 16px;
      cursor: pointer;
      box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .hattrick-overlay-button:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateX(-5px);
      box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .hattrick-overlay-button .icon {
      font-size: 20px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  // Add click handler
  document.getElementById('hattrick-match-view-toggle').addEventListener('click', toggleSidePane);
}

// Create side pane
function createSidePane() {
  // Check if side pane already exists
  if (document.getElementById('hattrick-match-view-sidepane')) {
    return;
  }
  
  const sidePane = document.createElement('div');
  sidePane.id = 'hattrick-match-view-sidepane';
  sidePane.innerHTML = `
    <div class="sidepane-header">
      <h2>Match Data</h2>
      <button id="hattrick-sidepane-close" class="close-button">✕</button>
    </div>
    <div id="hattrick-sidepane-content" class="sidepane-content">
      <div class="loading-message">Loading match data...</div>
    </div>
  `;
  
  // Add side pane styles
  const style = document.createElement('style');
  style.textContent = `
    #hattrick-match-view-sidepane {
      position: fixed;
      top: 0;
      right: -500px;
      width: 500px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      transition: right 0.3s ease;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #hattrick-match-view-sidepane.open {
      right: 0;
    }
    
    .sidepane-header {
      position: sticky;
      top: 0;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
    
    .sidepane-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    
    .close-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .sidepane-content {
      padding: 20px;
    }
    
    .sidepane-content .hattrick-match-data h2 {
      color: #1e40af;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-top: 0;
      font-size: 18px;
    }
    
    .sidepane-content .hattrick-match-data h3 {
      color: #3b82f6;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 16px;
    }
    
    .sidepane-content .hattrick-match-data h4 {
      color: #6b7280;
      margin-top: 12px;
      margin-bottom: 6px;
      font-size: 14px;
    }
    
    .sidepane-content .match-header {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 18px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .sidepane-content .match-meta p {
      margin: 5px 0;
      font-size: 13px;
      color: #374151;
    }
    
    .sidepane-content .scoreboard {
      margin-top: 15px;
      text-align: center;
    }
    
    .sidepane-content .score-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
      padding: 12px 16px;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
    }
    
    .sidepane-content .score {
      font-size: 20px;
      color: #1e40af;
      font-weight: 700;
    }
    
    .sidepane-content .team-name {
      font-size: 12px;
      color: #1e40af;
      font-weight: 600;
    }
    
    .sidepane-content .arena-info {
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .sidepane-content .arena-info p {
      margin: 5px 0;
      font-size: 13px;
      color: #374151;
    }
    
    .sidepane-content .team-section {
      background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .sidepane-content .home-team {
      border-left: 4px solid #22c55e;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }
    
    .sidepane-content .away-team {
      border-left: 4px solid #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    }
    
    .sidepane-content .team-stats p {
      margin: 5px 0;
      font-size: 13px;
    }
    
    .sidepane-content .team-stats ul {
      list-style: none;
      padding-left: 0;
      margin-top: 5px;
    }
    
    .sidepane-content .team-stats ul li {
      margin: 3px 0;
      font-size: 13px;
    }
    
    .sidepane-content .possession-stats {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .sidepane-content .possession-stats h3 {
      margin-top: 0;
      color: #065f46;
    }
    
    .sidepane-content .possession-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .sidepane-content .possession-half {
      padding: 10px;
      background: white;
      border-radius: 6px;
    }
    
    .sidepane-content .possession-half h4 {
      margin-top: 0;
    }
    
    .sidepane-content .possession-half p {
      margin: 5px 0;
      font-size: 13px;
    }
    
    .sidepane-content .events-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #22c55e;
      margin-bottom: 15px;
    }
    
    .sidepane-content .events-list {
      list-style: none;
      padding-left: 0;
    }
    
    .sidepane-content .events-list li {
      margin: 8px 0;
      padding: 10px 12px;
      background: white;
      border-radius: 6px;
      font-size: 13px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border-left: 3px solid #22c55e;
    }
    
    /* All Events Timeline Section */
    .sidepane-content .all-events-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      border-left: 4px solid #f59e0b;
    }
    
    .sidepane-content .all-events-section h3 {
      margin-top: 0;
      color: #92400e;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    
    .sidepane-content .all-events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .sidepane-content .event-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 3px solid #3b82f6;
    }
    
    .sidepane-content .event-item:hover {
      transform: translateX(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .sidepane-content .event-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
      padding: 5px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 6px;
      border: 1px solid #93c5fd;
    }
    
    .sidepane-content .event-time .minute {
      font-size: 16px;
      font-weight: 700;
      color: #1e40af;
      line-height: 1;
    }
    
    .sidepane-content .event-time .match-part {
      font-size: 10px;
      font-weight: 600;
      color: #60a5fa;
      text-transform: uppercase;
      margin-top: 2px;
    }
    
    .sidepane-content .event-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .sidepane-content .event-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
      font-weight: 500;
    }
    
    .sidepane-content .event-players {
      font-size: 11px;
      color: #6b7280;
      font-style: italic;
    }
    
    /* Event type specific colors */
    .sidepane-content .event-item[data-event-type="10"],
    .sidepane-content .event-item[data-event-type="11"],
    .sidepane-content .event-item[data-event-type="12"] {
      border-left-color: #22c55e;
    }
    
    .sidepane-content .event-item[data-event-type="20"],
    .sidepane-content .event-item[data-event-type="21"] {
      border-left-color: #eab308;
    }
    
    .sidepane-content .event-item[data-event-type="22"] {
      border-left-color: #ef4444;
    }
    
    .sidepane-content .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 15px;
      border-radius: 6px;
      border: 2px solid #ef4444;
      margin: 0;
      font-size: 13px;
    }
    
    .sidepane-content .loading-message {
      background: #e0e7ff;
      color: #1e40af;
      padding: 15px;
      border-radius: 6px;
      border: 2px solid #3b82f6;
      margin: 0;
      text-align: center;
      font-size: 13px;
    }
    
    /* Dev Mode Styles */
    .raw-xml-display {
      background: #f9fafb;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .dev-mode-header {
      background: #3b82f6;
      color: white;
      padding: 15px;
      border-radius: 6px 6px 0 0;
    }
    
    .dev-mode-header h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
    }
    
    .dev-mode-note {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }
    
    .xml-content {
      background: #1e293b;
      color: #e2e8f0;
      padding: 20px;
      margin: 0;
      border-radius: 0 0 6px 6px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    /* Live Match Styles */
    .sidepane-content .live-matches-section {
      margin-top: 15px;
    }
    
    .sidepane-content .live-match-item {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #3b82f6;
    }
    
    .sidepane-content .live-match-item.ongoing {
      border-left-color: #22c55e;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }
    
    .sidepane-content .live-match-item.upcoming {
      border-left-color: #f59e0b;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    }
    
    .sidepane-content .live-match-item.finished {
      border-left-color: #6b7280;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    }
    
    .sidepane-content .match-status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    
    .sidepane-content .match-status-badge.ongoing {
      background: #22c55e;
      color: white;
    }
    
    .sidepane-content .match-status-badge.upcoming {
      background: #f59e0b;
      color: white;
    }
    
    .sidepane-content .match-status-badge.finished {
      background: #6b7280;
      color: white;
    }
    
    .sidepane-content .match-teams {
      margin: 10px 0;
    }
    
    .sidepane-content .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin: 5px 0;
      background: white;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .sidepane-content .team-row .team-name {
      font-weight: 600;
      color: #374151;
    }
    
    .sidepane-content .team-row .team-score {
      font-weight: 700;
      font-size: 18px;
      color: #1e40af;
      min-width: 30px;
      text-align: right;
    }
    
    .sidepane-content .match-info {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .sidepane-content .match-info p {
      margin: 5px 0;
      font-size: 12px;
      color: #6b7280;
    }
    
    .sidepane-content .info-message {
      background: #e0e7ff;
      color: #1e40af;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      text-align: center;
    }
    
    .sidepane-content .info-message p {
      margin: 0;
      font-size: 13px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(sidePane);
  
  // Add close button handler
  document.getElementById('hattrick-sidepane-close').addEventListener('click', toggleSidePane);
}

// Toggle side pane
function toggleSidePane() {
  const sidePane = document.getElementById('hattrick-match-view-sidepane');
  if (!sidePane) {
    createSidePane();
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const pane = document.getElementById('hattrick-match-view-sidepane');
        if (pane) {
          pane.classList.add('open');
          loadMatchData();
        }
      });
    });
  } else {
    sidePane.classList.toggle('open');
    if (sidePane.classList.contains('open') && !sidePane.dataset.loaded) {
      loadMatchData();
    }
  }
}

// Load match data into side pane
async function loadMatchData() {
  const contentDiv = document.getElementById('hattrick-sidepane-content');
  const sidePane = document.getElementById('hattrick-match-view-sidepane');
  
  try {
    const matchId = getMatchIdFromUrl();
    if (!matchId) {
      contentDiv.innerHTML = formatErrorMessage('No match ID found in URL');
      return;
    }
    
    const isLivePage = isLiveMatchPage();
    
    contentDiv.innerHTML = `<div class="loading-message">Loading ${isLivePage ? 'live' : 'match'} data from Hattrick API...</div>`;
    
    let response;
    if (isLivePage) {
      // For live matches, use the htlive API
      response = await chrome.runtime.sendMessage({
        action: 'fetchLiveMatchData',
        matchId: matchId,
        actionType: 'viewAll'
      });
    } else {
      // For finished matches, use the matchdetails API
      response = await chrome.runtime.sendMessage({
        action: 'fetchMatchData',
        matchId: matchId
      });
    }
    
    if (response.success) {
      console.log('Match data received (raw XML)');
      
      // Check if dev mode is enabled
      const storage = await chrome.storage.local.get(['devMode']);
      const devMode = storage.devMode || false;
      
      if (devMode) {
        // In dev mode, display raw XML without parsing
        console.log('Dev mode enabled - showing raw XML');
        contentDiv.innerHTML = formatRawXML(response.data);
      } else {
        // In normal mode, parse and format the data
        try {
          let parsedData;
          if (isLivePage) {
            parsedData = parseLiveMatchXML(response.data);
            console.log('Live match data parsed:', parsedData);
            contentDiv.innerHTML = formatLiveMatchData(parsedData);
          } else {
            parsedData = parseMatchXML(response.data);
            console.log('Match data parsed:', parsedData);
            contentDiv.innerHTML = formatMatchData(parsedData);
          }
        } catch (parseError) {
          console.error('XML parsing error:', parseError);
          contentDiv.innerHTML = formatErrorMessage('XML Parsing Error: ' + parseError.message, true);
          return;
        }
      }
      
      sidePane.dataset.loaded = 'true';
    } else {
      console.error('Failed to fetch match data:', response.error);
      contentDiv.innerHTML = formatErrorMessage(response.error);
    }
  } catch (error) {
    console.error('Error loading match data:', error);
    contentDiv.innerHTML = formatErrorMessage(error.message);
  }
}

// Main execution
(async () => {
  try {
    // Check if user is authenticated
    const result = await chrome.storage.local.get(['authStatus', 'accessToken']);
    
    if (result.authStatus !== 'connected' || !result.accessToken) {
      console.log('User not authenticated - overlay button not shown');
      return;
    }
    
    console.log('User is authenticated');
    
    // Get matchID from URL
    const matchId = getMatchIdFromUrl();
    if (!matchId) {
      console.log('No matchID found in URL');
      return;
    }
    
    console.log('Match ID:', matchId);
    
    // Create overlay button (only visible when authenticated)
    createOverlayButton();
  } catch (error) {
    console.error('Error in content script:', error);
  }
})();
