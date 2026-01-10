// Match Data Display Panel
// Creates a UI panel to display extracted match data

class MatchDataPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.matchData = null;
    this.displayMode = 'all'; // 'all', 'timer', 'manual', 'auto'
    this.currentEventIndex = 0;
    this.timerInterval = null;
    this.currentMinute = 0;
    this.isPaused = false;
    this.autoPlayInterval = null;
    this.typewriterIntervals = [];
    this.fieldVisualization = null;
  }

  // Create and show the panel
  createPanel(matchData) {
    // Remove existing panel if any
    this.removePanel();

    // Store match data
    this.matchData = matchData;
    this.currentEventIndex = 0;
    this.currentMinute = 0;
    this.isPaused = false;

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'hattrick-matchview-panel';
    this.panel.className = 'hattrick-matchview-panel';
    
    // Create panel HTML
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2>⚽ Hattrick Match Data</h2>
        <div class="header-buttons">
          <button class="show-field-btn" id="show-field-btn" title="Show Football Field">⚽ Field View</button>
          <button class="close-btn" id="close-panel">✕</button>
        </div>
      </div>
      <div class="panel-content">
        ${this.generateMatchInfoHTML(matchData.matchInfo)}
        ${this.generateTeamsHTML(matchData.teams)}
        ${this.generateStatsHTML(matchData.stats)}
        ${this.generatePlayersHTML(matchData.players)}
        ${this.generateEventControlsHTML()}
        ${this.generateEventsHTML(matchData.events)}
      </div>
    `;

    // Add to page
    document.body.appendChild(this.panel);

    // Add event listeners
    this.attachEventListeners();

    // Initialize display with 'all' mode (default)
    this.setDisplayMode('all');

    this.isVisible = true;
  }

  // Attach all event listeners
  attachEventListeners() {
    document.getElementById('close-panel').addEventListener('click', () => {
      this.removePanel();
    });

    // Field visualization button
    document.getElementById('show-field-btn')?.addEventListener('click', () => {
      this.showFieldVisualization();
    });

    // Mode selection buttons
    document.getElementById('mode-all')?.addEventListener('click', () => this.setDisplayMode('all'));
    document.getElementById('mode-timer')?.addEventListener('click', () => this.setDisplayMode('timer'));
    document.getElementById('mode-manual')?.addEventListener('click', () => this.setDisplayMode('manual'));
    document.getElementById('mode-auto')?.addEventListener('click', () => this.setDisplayMode('auto'));

    // Control buttons
    document.getElementById('timer-play-pause')?.addEventListener('click', () => this.toggleTimerPlayPause());
    document.getElementById('manual-next')?.addEventListener('click', () => this.showNextEvent());
    document.getElementById('manual-prev')?.addEventListener('click', () => this.showPreviousEvent());
  }

  // Generate event controls HTML
  generateEventControlsHTML() {
    return `
      <div class="data-section event-controls-section">
        <h3>Event Display Mode</h3>
        <div class="data-content">
          <div class="mode-buttons">
            <button id="mode-all" class="mode-btn active" title="Show all events at once">
              📋 All Events
            </button>
            <button id="mode-timer" class="mode-btn" title="Follow match timer from minute 0">
              ⏱️ Match Timer
            </button>
            <button id="mode-manual" class="mode-btn" title="Click to show next event">
              👆 Step-by-Step
            </button>
            <button id="mode-auto" class="mode-btn" title="Auto-play events one by one">
              ▶️ Auto-Play
            </button>
          </div>
          <div id="control-panel" class="control-panel"></div>
        </div>
      </div>
    `;
  }

  // Set display mode
  setDisplayMode(mode) {
    // Clear any running timers/intervals
    this.stopAllTimers();

    this.displayMode = mode;
    this.currentEventIndex = 0;
    this.currentMinute = 0;
    this.isPaused = false;

    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`)?.classList.add('active');

    // Update control panel and events display
    this.updateControlPanel();
    this.updateEventsDisplay();

    // Start appropriate mode
    if (mode === 'timer') {
      this.startTimer();
    } else if (mode === 'auto') {
      this.startAutoPlay();
    }
  }

  // Update control panel based on mode
  updateControlPanel() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) return;

    let controlHTML = '';

    if (this.displayMode === 'timer') {
      controlHTML = `
        <div class="timer-controls">
          <div class="timer-display">Minute: <span id="timer-minute">0</span></div>
          <button id="timer-play-pause" class="control-btn">⏸️ Pause</button>
        </div>
      `;
    } else if (this.displayMode === 'manual') {
      controlHTML = `
        <div class="manual-controls">
          <div class="event-counter">Event <span id="event-current">0</span> of <span id="event-total">${this.matchData.events.length}</span></div>
          <div class="manual-buttons">
            <button id="manual-prev" class="control-btn" ${this.currentEventIndex === 0 ? 'disabled' : ''}>← Previous</button>
            <button id="manual-next" class="control-btn" ${this.currentEventIndex >= this.matchData.events.length ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      `;
    } else if (this.displayMode === 'auto') {
      controlHTML = `
        <div class="auto-controls">
          <div class="event-counter">Event <span id="event-current">0</span> of <span id="event-total">${this.matchData.events.length}</span></div>
          <div class="auto-status">Auto-playing events...</div>
        </div>
      `;
    }

    controlPanel.innerHTML = controlHTML;

    // Re-attach control listeners
    if (this.displayMode === 'timer') {
      document.getElementById('timer-play-pause')?.addEventListener('click', () => this.toggleTimerPlayPause());
    } else if (this.displayMode === 'manual') {
      document.getElementById('manual-next')?.addEventListener('click', () => this.showNextEvent());
      document.getElementById('manual-prev')?.addEventListener('click', () => this.showPreviousEvent());
    }
  }

  // Update events display based on mode
  updateEventsDisplay() {
    const eventsContainer = this.panel.querySelector('.events-list');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '';
    
    let currentEvent = null;

    if (this.displayMode === 'all') {
      // Show all events
      this.matchData.events.forEach(event => {
        const eventElement = this.createEventElement(event, false);
        eventsContainer.appendChild(eventElement);
      });
    } else if (this.displayMode === 'timer') {
      // Show events up to current minute
      const eventsToShow = this.matchData.events.filter(event => 
        event.minute !== null && event.minute <= this.currentMinute
      );
      eventsToShow.forEach(event => {
        const eventElement = this.createEventElement(event, true);
        eventsContainer.appendChild(eventElement);
      });
      // Get most recent event for field visualization
      if (eventsToShow.length > 0) {
        currentEvent = eventsToShow[eventsToShow.length - 1];
      }
    } else if (this.displayMode === 'manual' || this.displayMode === 'auto') {
      // Show events up to current index
      for (let i = 0; i < this.currentEventIndex; i++) {
        const event = this.matchData.events[i];
        const eventElement = this.createEventElement(event, true);
        eventsContainer.appendChild(eventElement);
      }
      // Get current event for field visualization
      if (this.currentEventIndex > 0) {
        currentEvent = this.matchData.events[this.currentEventIndex - 1];
      }
    }
    
    // Update field visualization if it's visible
    if (this.fieldVisualization && currentEvent) {
      this.fieldVisualization.showEvent(currentEvent);
    }
  }

  // Create event element with optional typewriter effect
  createEventElement(event, useTypewriter) {
    const eventIcon = this.getEventIcon(event.type);
    const minuteDisplay = event.minute !== null ? `${event.minute}'` : '?';
    
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item ${event.type}`;
    
    const minuteSpan = document.createElement('span');
    minuteSpan.className = 'event-minute';
    minuteSpan.textContent = minuteDisplay;
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'event-icon';
    iconSpan.textContent = eventIcon;
    
    const descSpan = document.createElement('span');
    descSpan.className = 'event-description';
    
    if (useTypewriter && this.displayMode !== 'all') {
      descSpan.textContent = '';
      this.typewriterEffect(descSpan, event.description);
    } else {
      descSpan.textContent = event.description;
    }
    
    eventDiv.appendChild(minuteSpan);
    eventDiv.appendChild(iconSpan);
    eventDiv.appendChild(descSpan);
    
    return eventDiv;
  }

  // Typewriter effect for event description
  typewriterEffect(element, text, charIndex = 0) {
    if (charIndex < text.length) {
      element.textContent += text.charAt(charIndex);
      
      // Calculate delay based on reading speed (average ~250-300 words per minute)
      // Approximately 4-5 characters per second for comfortable reading
      const delay = 40; // milliseconds per character
      
      const timeout = setTimeout(() => {
        this.typewriterEffect(element, text, charIndex + 1);
      }, delay);
      
      this.typewriterIntervals.push(timeout);
    }
  }

  // Start timer mode
  startTimer() {
    this.isPaused = false;
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.currentMinute++;
        document.getElementById('timer-minute').textContent = this.currentMinute;
        this.updateEventsDisplay();
        
        // Stop at 90+ minutes (or max event minute)
        const maxMinute = Math.max(...this.matchData.events.map(e => e.minute || 0));
        if (this.currentMinute >= maxMinute + 5) {
          this.stopAllTimers();
        }
      }
    }, 1000); // 1 second = 1 match minute (adjust as needed)
  }

  // Toggle timer play/pause
  toggleTimerPlayPause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('timer-play-pause');
    if (btn) {
      btn.textContent = this.isPaused ? '▶️ Play' : '⏸️ Pause';
    }
  }

  // Show next event (manual mode)
  showNextEvent() {
    if (this.currentEventIndex < this.matchData.events.length) {
      this.currentEventIndex++;
      this.updateEventsDisplay();
      this.updateEventCounter();
      this.updateManualButtons();
    }
  }

  // Show previous event (manual mode)
  showPreviousEvent() {
    if (this.currentEventIndex > 0) {
      // Clear typewriter intervals
      this.stopTypewriters();
      this.currentEventIndex--;
      this.updateEventsDisplay();
      this.updateEventCounter();
      this.updateManualButtons();
    }
  }

  // Update event counter
  updateEventCounter() {
    const currentSpan = document.getElementById('event-current');
    if (currentSpan) {
      currentSpan.textContent = this.currentEventIndex;
    }
  }

  // Update manual mode buttons
  updateManualButtons() {
    const prevBtn = document.getElementById('manual-prev');
    const nextBtn = document.getElementById('manual-next');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentEventIndex === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentEventIndex >= this.matchData.events.length;
    }
  }

  // Start auto-play mode
  startAutoPlay() {
    this.currentEventIndex = 0;
    this.showNextEventAuto();
  }

  // Show next event automatically
  showNextEventAuto() {
    if (this.currentEventIndex < this.matchData.events.length) {
      this.currentEventIndex++;
      this.updateEventsDisplay();
      this.updateEventCounter();
      
      // Calculate delay: typewriter time + pause between events
      const event = this.matchData.events[this.currentEventIndex - 1];
      const typewriterTime = event.description.length * 40; // 40ms per char
      const pauseTime = 1000; // 1 second pause between events
      
      this.autoPlayInterval = setTimeout(() => {
        this.showNextEventAuto();
      }, typewriterTime + pauseTime);
    }
  }

  // Stop all timers and intervals
  stopAllTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.autoPlayInterval) {
      clearTimeout(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.stopTypewriters();
  }

  // Stop typewriter effects
  stopTypewriters() {
    this.typewriterIntervals.forEach(timeout => clearTimeout(timeout));
    this.typewriterIntervals = [];
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

    return `
      <div class="data-section">
        <h3>Match Events (Telecronaca) - ${events.length} events</h3>
        <div class="data-content events-list">
          <!-- Events will be dynamically added here based on display mode -->
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

  // Show field visualization
  showFieldVisualization() {
    // Initialize field visualization if not already done
    if (!this.fieldVisualization) {
      this.fieldVisualization = new FieldVisualization();
    }

    // Create the field with match data
    this.fieldVisualization.createField(this.matchData);

    // Add close button to field
    const closeBtn = document.createElement('button');
    closeBtn.className = 'field-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => {
      this.fieldVisualization.removeField();
    });
    
    const fieldContainer = document.getElementById('hattrick-field-container');
    if (fieldContainer) {
      fieldContainer.appendChild(closeBtn);
    }

    // Set example tactics (can be extracted from match data later)
    // this.fieldVisualization.setTeamTactics('home', 'pressing');
    // this.fieldVisualization.setTeamTactics('away', 'counter');

    // If there are events, show the current event on the field
    if (this.currentEvent) {
      this.fieldVisualization.showEvent(this.currentEvent);
    }
  }

  // Remove the panel
  removePanel() {
    // Stop all timers before removing
    this.stopAllTimers();
    
    // Remove field visualization if it exists
    if (this.fieldVisualization) {
      this.fieldVisualization.removeField();
    }
    
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    this.isVisible = false;
    this.matchData = null;
  }

  // Toggle panel visibility
  toggle() {
    if (this.isVisible) {
      this.removePanel();
    }
  }
}
