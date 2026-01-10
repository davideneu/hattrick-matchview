// Content script - runs on Hattrick pages
console.log('Hattrick Matchview content script loaded');

// Import the data extractor and panel (they will be loaded via manifest)
let dataExtractor = null;
let dataPanel = null;

// Function to initialize match visualization
function initializeMatchView() {
  // Check if we're on a match page
  const isMatchPage = window.location.href.includes('/Club/Matches/Match.aspx');
  
  if (isMatchPage) {
    console.log('Match page detected - ready for visualization');
    
    // Initialize extractor and panel
    dataExtractor = new HattrickMatchDataExtractor();
    dataPanel = new MatchDataPanel();
    
    // Add a visual indicator and button that the extension is active
    addExtensionIndicator();
    addDataFetchButton();
  }
}

// Add a small indicator to show the extension is active
function addExtensionIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'hattrick-matchview-indicator';
  indicator.textContent = '⚽ Matchview Active';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-family: sans-serif;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);
  
  // Remove indicator after 3 seconds
  setTimeout(() => {
    indicator.style.transition = 'opacity 0.3s ease-out';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 3000);
}

// Add a button to fetch and display match data
function addDataFetchButton() {
  const button = document.createElement('button');
  button.id = 'hattrick-fetch-data-btn';
  button.textContent = '📊 Show Match Data';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-family: sans-serif;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  button.addEventListener('click', () => {
    fetchAndDisplayMatchData();
  });
  
  document.body.appendChild(button);
}

// Fetch and display match data
function fetchAndDisplayMatchData() {
  console.log('Fetching match data...');
  
  try {
    // Extract data from page
    const matchData = dataExtractor.extractMatchData();
    
    // Display in panel
    dataPanel.createPanel(matchData);
    
    console.log('Match data displayed successfully');
  } catch (error) {
    console.error('Error fetching match data:', error);
    alert('Error fetching match data. See console for details.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMatchView);
} else {
  initializeMatchView();
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getMatchData') {
    // Extract and return match data
    if (dataExtractor) {
      const matchData = dataExtractor.extractMatchData();
      sendResponse({ status: 'success', data: matchData });
    } else {
      sendResponse({ status: 'error', message: 'Not on a match page' });
    }
  }
  
  if (request.action === 'showMatchData') {
    // Show the data panel
    fetchAndDisplayMatchData();
    sendResponse({ status: 'success' });
  }
  
  return true; // Keep message channel open for async response
});
