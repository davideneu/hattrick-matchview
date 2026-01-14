// content.js - Content script for match pages

console.log('Hattrick Match View extension loaded on match page');

// Extract matchID from URL
function getMatchIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('matchID');
}

// Get the main content container
function getMainContent() {
  return document.querySelector('#mainBody') || document.querySelector('body');
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
      <h2>Match Information</h2>
      
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
      
      <div class="teams-container">
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
      </div>
      
      <div class="possession-stats">
        <h3>Possession</h3>
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

// Display match data on the page
function displayMatchData(data) {
  // Create a container for the match data
  const container = document.createElement('div');
  container.id = 'hattrick-match-view-container';
  container.innerHTML = formatMatchData(data);
  
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    #hattrick-match-view-container {
      background: #f8f9fa;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      font-family: Arial, sans-serif;
    }
    
    .hattrick-match-data h2 {
      color: #1e40af;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-top: 0;
    }
    
    .hattrick-match-data h3 {
      color: #3b82f6;
      margin-top: 15px;
    }
    
    .hattrick-match-data h4 {
      color: #6b7280;
      margin-top: 10px;
      margin-bottom: 5px;
    }
    
    .match-header {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .match-meta p {
      margin: 5px 0;
    }
    
    .scoreboard {
      margin-top: 15px;
      text-align: center;
    }
    
    .score-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.2em;
      font-weight: bold;
      padding: 10px;
      background: #e0e7ff;
      border-radius: 6px;
    }
    
    .score {
      font-size: 1.5em;
      color: #1e40af;
    }
    
    .arena-info {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .arena-info p {
      margin: 5px 0;
    }
    
    .teams-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .team-section {
      background: white;
      padding: 15px;
      border-radius: 6px;
    }
    
    .home-team {
      border-left: 4px solid #22c55e;
    }
    
    .away-team {
      border-left: 4px solid #ef4444;
    }
    
    .team-stats p {
      margin: 5px 0;
    }
    
    .team-stats ul {
      list-style: none;
      padding-left: 0;
    }
    
    .team-stats ul li {
      margin: 3px 0;
    }
    
    .possession-stats {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .possession-half {
      padding: 10px;
      background: #f3f4f6;
      border-radius: 6px;
    }
    
    .possession-half p {
      margin: 5px 0;
    }
    
    .events-section {
      background: white;
      padding: 15px;
      border-radius: 6px;
    }
    
    .events-list {
      list-style: none;
      padding-left: 0;
    }
    
    .events-list li {
      margin: 8px 0;
      padding: 8px;
      background: #f3f4f6;
      border-radius: 4px;
    }
    
    .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 15px;
      border-radius: 6px;
      border: 2px solid #ef4444;
      margin: 20px 0;
    }
    
    .loading-message {
      background: #e0e7ff;
      color: #1e40af;
      padding: 15px;
      border-radius: 6px;
      border: 2px solid #3b82f6;
      margin: 20px 0;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      .teams-container {
        grid-template-columns: 1fr;
      }
      
      .possession-stats {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  // Insert the container at the top of the main content area
  const mainContent = getMainContent();
  if (mainContent) {
    mainContent.insertBefore(style, mainContent.firstChild);
    mainContent.insertBefore(container, mainContent.firstChild);
  }
}

// Show loading message
function showLoading() {
  const container = document.createElement('div');
  container.id = 'hattrick-match-view-container';
  container.innerHTML = '<div class="loading-message">Loading match data from Hattrick API...</div>';
  
  const mainContent = getMainContent();
  if (mainContent) {
    mainContent.insertBefore(container, mainContent.firstChild);
  }
}

// Show error message
function showError(message) {
  const existingContainer = document.getElementById('hattrick-match-view-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.id = 'hattrick-match-view-container';
  container.innerHTML = `<div class="error-message"><strong>Error:</strong> ${message}</div>`;
  
  const mainContent = getMainContent();
  if (mainContent) {
    mainContent.insertBefore(container, mainContent.firstChild);
  }
}

// Main execution
(async () => {
  try {
    // Check if user is authenticated
    const result = await chrome.storage.local.get(['authStatus', 'accessToken']);
    
    if (result.authStatus !== 'connected' || !result.accessToken) {
      console.log('User not authenticated');
      showError('Not connected to Hattrick. Please click the extension icon and connect.');
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
    showLoading();
    
    // Request match data from background script
    const response = await chrome.runtime.sendMessage({
      action: 'fetchMatchData',
      matchId: matchId
    });
    
    if (response.success) {
      console.log('Match data received:', response.data);
      displayMatchData(response.data);
    } else {
      console.error('Failed to fetch match data:', response.error);
      showError(response.error);
    }
  } catch (error) {
    console.error('Error in content script:', error);
    showError(error.message);
  }
})();
