// Football Field Visualization
// Creates a visual representation of a football field with player positions

class FieldVisualization {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.matchData = null;
    this.width = 0;
    this.height = 0;
    this.fieldPadding = 40;
    this.playerPositions = {
      home: [],
      away: []
    };
    this.highlightedPlayers = [];
    this.currentEvent = null;
    
    // Standard formation templates (x%, y% on field)
    this.formations = {
      '442': [
        { x: 10, y: 50 },  // GK
        { x: 25, y: 15 },  // LB
        { x: 25, y: 40 },  // CB
        { x: 25, y: 60 },  // CB
        { x: 25, y: 85 },  // RB
        { x: 50, y: 25 },  // LM
        { x: 50, y: 45 },  // CM
        { x: 50, y: 55 },  // CM
        { x: 50, y: 75 },  // RM
        { x: 75, y: 35 },  // ST
        { x: 75, y: 65 }   // ST
      ],
      '433': [
        { x: 10, y: 50 },  // GK
        { x: 25, y: 15 },  // LB
        { x: 25, y: 40 },  // CB
        { x: 25, y: 60 },  // CB
        { x: 25, y: 85 },  // RB
        { x: 50, y: 25 },  // LM
        { x: 50, y: 50 },  // CM
        { x: 50, y: 75 },  // RM
        { x: 75, y: 25 },  // LW
        { x: 75, y: 50 },  // ST
        { x: 75, y: 75 }   // RW
      ],
      '352': [
        { x: 10, y: 50 },  // GK
        { x: 25, y: 25 },  // CB
        { x: 25, y: 50 },  // CB
        { x: 25, y: 75 },  // CB
        { x: 45, y: 15 },  // LWB
        { x: 45, y: 40 },  // CM
        { x: 45, y: 60 },  // CM
        { x: 45, y: 85 },  // RWB
        { x: 65, y: 50 },  // CAM
        { x: 80, y: 35 },  // ST
        { x: 80, y: 65 }   // ST
      ],
      '451': [
        { x: 10, y: 50 },  // GK
        { x: 25, y: 15 },  // LB
        { x: 25, y: 40 },  // CB
        { x: 25, y: 60 },  // CB
        { x: 25, y: 85 },  // RB
        { x: 45, y: 20 },  // LM
        { x: 45, y: 40 },  // CM
        { x: 45, y: 60 },  // CM
        { x: 45, y: 80 },  // RM
        { x: 60, y: 50 },  // CAM
        { x: 80, y: 50 }   // ST
      ]
    };
    
    // Default to 4-4-2 if formation not specified
    this.defaultFormation = this.formations['442'];
  }

  // Create the field visualization container
  createField(matchData) {
    this.matchData = matchData;
    
    // Remove existing container if any
    this.removeField();
    
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'hattrick-field-container';
    this.container.className = 'hattrick-field-container';
    
    // Create header with team names and tactics
    const header = this.createHeader();
    this.container.appendChild(header);
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'hattrick-field-canvas';
    this.canvas.className = 'hattrick-field-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.updateCanvasSize();
    
    // Add canvas to container
    this.container.appendChild(this.canvas);
    
    // Draw the field
    this.drawField();
    this.drawPlayers();
    
    // Add to page
    document.body.appendChild(this.container);
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    return this.container;
  }

  // Create header with team info
  createHeader() {
    const header = document.createElement('div');
    header.className = 'field-header';
    
    const teams = this.matchData?.teams || { home: {}, away: {} };
    
    // Home team section
    const homeSection = document.createElement('div');
    homeSection.className = 'team-section home-section';
    homeSection.innerHTML = `
      <div class="team-name">${teams.home.name || 'Home Team'}</div>
      <div class="team-score">${teams.home.score !== null ? teams.home.score : '-'}</div>
      <div class="team-tactics" id="home-tactics"></div>
    `;
    
    // VS section
    const vsSection = document.createElement('div');
    vsSection.className = 'vs-section';
    vsSection.textContent = 'VS';
    
    // Away team section
    const awaySection = document.createElement('div');
    awaySection.className = 'team-section away-section';
    awaySection.innerHTML = `
      <div class="team-score">${teams.away.score !== null ? teams.away.score : '-'}</div>
      <div class="team-name">${teams.away.name || 'Away Team'}</div>
      <div class="team-tactics" id="away-tactics"></div>
    `;
    
    header.appendChild(homeSection);
    header.appendChild(vsSection);
    header.appendChild(awaySection);
    
    return header;
  }

  // Update canvas size based on container
  updateCanvasSize() {
    // Get container width (responsive)
    const containerWidth = this.container?.clientWidth || window.innerWidth * 0.9;
    
    // Field aspect ratio (approximately 1.5:1 for lateral view)
    const aspectRatio = 1.5;
    
    this.width = Math.min(containerWidth, 1200); // Max width 1200px
    this.height = this.width / aspectRatio;
    
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  // Handle window resize
  handleResize() {
    this.updateCanvasSize();
    this.drawField();
    this.drawPlayers();
  }

  // Draw the football field
  drawField() {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const padding = this.fieldPadding;
    const fieldWidth = this.width - (padding * 2);
    const fieldHeight = this.height - (padding * 2);
    
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw grass background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#2d7a2e');
    gradient.addColorStop(0.5, '#3a9d3b');
    gradient.addColorStop(1, '#2d7a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(padding, padding, fieldWidth, fieldHeight);
    
    // Draw grass stripes for visual effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    const stripeWidth = fieldWidth / 10;
    for (let i = 0; i < 10; i += 2) {
      ctx.fillRect(padding + (i * stripeWidth), padding, stripeWidth, fieldHeight);
    }
    
    // Draw field outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, fieldWidth, fieldHeight);
    
    // Draw center line
    ctx.beginPath();
    ctx.moveTo(this.width / 2, padding);
    ctx.lineTo(this.width / 2, this.height - padding);
    ctx.stroke();
    
    // Draw center circle
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const centerCircleRadius = fieldHeight * 0.15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw center spot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw penalty areas
    const penaltyAreaWidth = fieldWidth * 0.2;
    const penaltyAreaHeight = fieldHeight * 0.6;
    const penaltyAreaY = (this.height - penaltyAreaHeight) / 2;
    
    // Left penalty area (home)
    ctx.strokeRect(padding, penaltyAreaY, penaltyAreaWidth, penaltyAreaHeight);
    
    // Right penalty area (away)
    ctx.strokeRect(
      this.width - padding - penaltyAreaWidth,
      penaltyAreaY,
      penaltyAreaWidth,
      penaltyAreaHeight
    );
    
    // Draw goal areas
    const goalAreaWidth = fieldWidth * 0.1;
    const goalAreaHeight = fieldHeight * 0.35;
    const goalAreaY = (this.height - goalAreaHeight) / 2;
    
    // Left goal area (home)
    ctx.strokeRect(padding, goalAreaY, goalAreaWidth, goalAreaHeight);
    
    // Right goal area (away)
    ctx.strokeRect(
      this.width - padding - goalAreaWidth,
      goalAreaY,
      goalAreaWidth,
      goalAreaHeight
    );
    
    // Draw goals
    this.drawGoal(padding - 15, centerY, 'left');
    this.drawGoal(this.width - padding + 15, centerY, 'right');
    
    // Draw corner arcs
    const cornerRadius = 10;
    
    // Top-left corner
    ctx.beginPath();
    ctx.arc(padding, padding, cornerRadius, 0, Math.PI / 2);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.arc(this.width - padding, padding, cornerRadius, Math.PI / 2, Math.PI);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.arc(padding, this.height - padding, cornerRadius, 1.5 * Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.arc(this.width - padding, this.height - padding, cornerRadius, Math.PI, 1.5 * Math.PI);
    ctx.stroke();
  }

  // Draw a goal
  drawGoal(x, y, side) {
    const ctx = this.ctx;
    const goalWidth = 20;
    const goalHeight = 60;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(
      side === 'left' ? x - goalWidth : x,
      y - goalHeight / 2,
      goalWidth,
      goalHeight
    );
    
    // Goal net pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    const netSpacing = 8;
    
    // Vertical lines
    for (let i = 0; i < goalWidth; i += netSpacing) {
      ctx.beginPath();
      ctx.moveTo(
        side === 'left' ? x - goalWidth + i : x + i,
        y - goalHeight / 2
      );
      ctx.lineTo(
        side === 'left' ? x - goalWidth + i : x + i,
        y + goalHeight / 2
      );
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= goalHeight; i += netSpacing) {
      ctx.beginPath();
      ctx.moveTo(
        side === 'left' ? x - goalWidth : x,
        y - goalHeight / 2 + i
      );
      ctx.lineTo(
        side === 'left' ? x : x + goalWidth,
        y - goalHeight / 2 + i
      );
      ctx.stroke();
    }
  }

  // Draw players on the field
  drawPlayers() {
    if (!this.ctx) return;
    
    // Get player positions for both teams
    const homeFormation = this.defaultFormation;
    const awayFormation = this.mirrorFormation(this.defaultFormation);
    
    // Draw home team players
    homeFormation.forEach((pos, index) => {
      const player = this.matchData?.players?.home?.[index];
      this.drawPlayer(pos.x, pos.y, 'home', player, index);
    });
    
    // Draw away team players
    awayFormation.forEach((pos, index) => {
      const player = this.matchData?.players?.away?.[index];
      this.drawPlayer(pos.x, pos.y, 'away', player, index);
    });
  }

  // Mirror formation for away team (right side of field)
  mirrorFormation(formation) {
    return formation.map(pos => ({
      x: 100 - pos.x,
      y: pos.y
    }));
  }

  // Draw a single player
  drawPlayer(xPercent, yPercent, team, playerData, index) {
    const ctx = this.ctx;
    const padding = this.fieldPadding;
    const fieldWidth = this.width - (padding * 2);
    const fieldHeight = this.height - (padding * 2);
    
    // Convert percentage to actual coordinates
    const x = padding + (fieldWidth * xPercent / 100);
    const y = padding + (fieldHeight * yPercent / 100);
    
    // Player appearance
    const playerRadius = 18;
    const teamColor = team === 'home' ? '#2196F3' : '#F44336'; // Blue vs Red
    const isHighlighted = this.highlightedPlayers.includes(playerData?.id);
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + playerRadius + 2, playerRadius * 0.8, playerRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player body (simple shape)
    ctx.fillStyle = teamColor;
    if (isHighlighted) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    }
    
    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(x, y + 8, playerRadius * 0.6, playerRadius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head (circle)
    ctx.fillStyle = '#FFE0BD'; // Skin tone
    ctx.beginPath();
    ctx.arc(x, y - 8, playerRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw jersey number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), x, y + 8);
    
    // Draw player name below if available
    if (playerData?.name) {
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(playerData.name, x, y + playerRadius + 15);
      ctx.fillText(playerData.name, x, y + playerRadius + 15);
    }
    
    // Draw highlight circle if player is involved in event
    if (isHighlighted) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, playerRadius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Highlight specific players (for events)
  highlightPlayers(playerIds) {
    this.highlightedPlayers = playerIds || [];
    this.drawField();
    this.drawPlayers();
  }

  // Show event on field
  showEvent(event) {
    this.currentEvent = event;
    
    // Extract player IDs from event if possible
    // This is a simplified approach - in real implementation,
    // you'd parse the event description to find involved players
    
    // For now, just redraw
    this.drawField();
    this.drawPlayers();
    
    // Draw event indicator
    if (event) {
      this.drawEventIndicator(event);
    }
  }

  // Draw event indicator on field
  drawEventIndicator(event) {
    const ctx = this.ctx;
    
    // Position event icon at top center of field
    const x = this.width / 2;
    const y = this.fieldPadding - 20;
    
    // Draw event icon background
    ctx.fillStyle = this.getEventColor(event.type);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw event icon
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = this.getEventIcon(event.type);
    ctx.fillText(icon, x, y);
  }

  // Get color for event type
  getEventColor(type) {
    const colors = {
      'goal': '#4CAF50',
      'yellow_card': '#FFC107',
      'red_card': '#F44336',
      'substitution': '#2196F3',
      'info': '#9E9E9E'
    };
    return colors[type] || '#9E9E9E';
  }

  // Get icon for event type
  getEventIcon(type) {
    const icons = {
      'goal': '⚽',
      'yellow_card': '🟨',
      'red_card': '🟥',
      'substitution': '🔄',
      'info': 'ℹ'
    };
    return icons[type] || 'ℹ';
  }

  // Set team tactics and show indicator
  setTeamTactics(team, tactic) {
    const tacticsDiv = document.getElementById(`${team}-tactics`);
    if (!tacticsDiv) return;
    
    const tacticIcons = {
      'pressing': '🔥 Pressing',
      'counter': '⚡ Counter',
      'longshots': '🎯 Long Shots',
      'aerial': '✈️ Aerial',
      'possession': '🔄 Possession',
      'defensive': '🛡️ Defensive'
    };
    
    if (tactic && tacticIcons[tactic]) {
      tacticsDiv.textContent = tacticIcons[tactic];
      tacticsDiv.style.display = 'block';
    } else {
      tacticsDiv.style.display = 'none';
    }
  }

  // Remove the field
  removeField() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.canvas = null;
    this.ctx = null;
  }

  // Update with new match data
  updateMatchData(matchData) {
    this.matchData = matchData;
    if (this.container) {
      this.drawField();
      this.drawPlayers();
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FieldVisualization;
}
