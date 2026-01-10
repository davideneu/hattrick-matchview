// Match Data Display Panel
// Creates a UI panel to display extracted match data

class MatchDataPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
  }

  // Create and show the panel
  createPanel(matchData) {
    // Remove existing panel if any
    this.removePanel();

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'hattrick-matchview-panel';
    this.panel.className = 'hattrick-matchview-panel';
    
    // Create panel HTML
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2>⚽ Hattrick Match Data</h2>
        <button class="close-btn" id="close-panel">✕</button>
      </div>
      <div class="panel-content">
        ${this.generateMatchInfoHTML(matchData.matchInfo)}
        ${this.generateTeamsHTML(matchData.teams)}
        ${this.generateStatsHTML(matchData.stats)}
        ${this.generatePlayersHTML(matchData.players)}
        ${this.generateEventsHTML(matchData.events)}
      </div>
    `;

    // Add to page
    document.body.appendChild(this.panel);

    // Add event listeners
    document.getElementById('close-panel').addEventListener('click', () => {
      this.removePanel();
    });

    this.isVisible = true;
  }

  // Generate match info section HTML
  generateMatchInfoHTML(matchInfo) {
    return `
      <div class="data-section">
        <h3>Match Information</h3>
        <div class="data-content">
          <p><strong>Match ID:</strong> ${matchInfo.matchId || 'N/A'}</p>
          <p><strong>Type:</strong> ${matchInfo.type || 'N/A'}</p>
          <p><strong>Date:</strong> ${matchInfo.date || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  // Generate teams section HTML
  generateTeamsHTML(teams) {
    return `
      <div class="data-section">
        <h3>Teams & Score</h3>
        <div class="data-content teams-display">
          <div class="team home-team">
            <h4>${teams.home.name || 'Home Team'}</h4>
            <span class="score">${teams.home.score !== null ? teams.home.score : '-'}</span>
          </div>
          <div class="vs">VS</div>
          <div class="team away-team">
            <h4>${teams.away.name || 'Away Team'}</h4>
            <span class="score">${teams.away.score !== null ? teams.away.score : '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Generate statistics section HTML
  generateStatsHTML(stats) {
    const possessionHTML = stats.possession 
      ? `<p><strong>Possession:</strong> ${stats.possession.home}% - ${stats.possession.away}%</p>`
      : '<p><strong>Possession:</strong> N/A</p>';
    
    const chancesHTML = (stats.chances.home !== null && stats.chances.away !== null)
      ? `<p><strong>Chances:</strong> ${stats.chances.home} - ${stats.chances.away}</p>`
      : '<p><strong>Chances:</strong> N/A</p>';

    return `
      <div class="data-section">
        <h3>Match Statistics</h3>
        <div class="data-content">
          ${possessionHTML}
          ${chancesHTML}
        </div>
      </div>
    `;
  }

  // Generate players section HTML
  generatePlayersHTML(players) {
    const homePlayersHTML = players.home.length > 0
      ? players.home.map(p => `<li>${p.name}</li>`).join('')
      : '<li>No players found</li>';

    const awayPlayersHTML = players.away.length > 0
      ? players.away.map(p => `<li>${p.name}</li>`).join('')
      : '<li>No players found</li>';

    return `
      <div class="data-section">
        <h3>Players</h3>
        <div class="data-content players-display">
          <div class="player-list">
            <h4>Home Team (${players.home.length})</h4>
            <ul>${homePlayersHTML}</ul>
          </div>
          <div class="player-list">
            <h4>Away Team (${players.away.length})</h4>
            <ul>${awayPlayersHTML}</ul>
          </div>
        </div>
      </div>
    `;
  }

  // Generate events section HTML (telecronaca)
  generateEventsHTML(events) {
    if (!events || events.length === 0) {
      return `
        <div class="data-section">
          <h3>Match Events (Telecronaca)</h3>
          <div class="data-content">
            <p>No events found</p>
          </div>
        </div>
      `;
    }

    const eventsHTML = events.map(event => {
      const eventIcon = this.getEventIcon(event.type);
      const minuteDisplay = event.minute !== null ? `${event.minute}'` : '?';
      
      return `
        <div class="event-item ${event.type}">
          <span class="event-minute">${minuteDisplay}</span>
          <span class="event-icon">${eventIcon}</span>
          <span class="event-description">${event.description}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="data-section">
        <h3>Match Events (Telecronaca) - ${events.length} events</h3>
        <div class="data-content events-list">
          ${eventsHTML}
        </div>
      </div>
    `;
  }

  // Get icon for event type
  getEventIcon(type) {
    const icons = {
      'goal': '⚽',
      'yellow_card': '🟨',
      'red_card': '🟥',
      'substitution': '🔄',
      'info': '📝'
    };
    return icons[type] || '📝';
  }

  // Remove the panel
  removePanel() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    this.isVisible = false;
  }

  // Toggle panel visibility
  toggle() {
    if (this.isVisible) {
      this.removePanel();
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchDataPanel;
}
