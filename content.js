// content.js - Content script for match pages

console.log('Hattrick Match View extension loaded on match page');

// Extract matchID from URL
function getMatchIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('matchID');
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
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
    </div>
  `;
}

// Create overlay button
function createOverlayButton() {
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
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .sidepane-content .match-meta p {
      margin: 5px 0;
      font-size: 13px;
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
      padding: 10px;
      background: #e0e7ff;
      border-radius: 6px;
    }
    
    .sidepane-content .score {
      font-size: 18px;
      color: #1e40af;
    }
    
    .sidepane-content .team-name {
      font-size: 12px;
    }
    
    .sidepane-content .arena-info {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .sidepane-content .arena-info p {
      margin: 5px 0;
      font-size: 13px;
    }
    
    .sidepane-content .team-section {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .sidepane-content .home-team {
      border-left: 4px solid #22c55e;
    }
    
    .sidepane-content .away-team {
      border-left: 4px solid #ef4444;
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
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .sidepane-content .possession-stats h3 {
      margin-top: 0;
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
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
    }
    
    .sidepane-content .events-list {
      list-style: none;
      padding-left: 0;
    }
    
    .sidepane-content .events-list li {
      margin: 8px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
      font-size: 13px;
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
    setTimeout(() => {
      document.getElementById('hattrick-match-view-sidepane').classList.add('open');
      loadMatchData();
    }, 10);
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
      contentDiv.innerHTML = '<div class="error-message">No match ID found in URL</div>';
      return;
    }
    
    contentDiv.innerHTML = '<div class="loading-message">Loading match data from Hattrick API...</div>';
    
    const response = await chrome.runtime.sendMessage({
      action: 'fetchMatchData',
      matchId: matchId
    });
    
    if (response.success) {
      console.log('Match data received:', response.data);
      contentDiv.innerHTML = formatMatchData(response.data);
      sidePane.dataset.loaded = 'true';
    } else {
      console.error('Failed to fetch match data:', response.error);
      contentDiv.innerHTML = `<div class="error-message"><strong>Error:</strong> ${escapeHtml(response.error)}</div>`;
    }
  } catch (error) {
    console.error('Error loading match data:', error);
    contentDiv.innerHTML = `<div class="error-message"><strong>Error:</strong> ${escapeHtml(error.message)}</div>`;
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
