// Content script - runs on Hattrick pages
console.log('Hattrick Matchview content script loaded');

// Import the data extractor and panel (they will be loaded via manifest)
let dataExtractor = null;
let dataPanel = null;

// Function to initialize match visualization
async function initializeMatchView() {
  // Check if we're on a match page
  const isMatchPage = window.location.href.includes('/Club/Matches/Match.aspx');
  
  if (isMatchPage) {
    console.log('Match page detected - ready for visualization');
    
    // Initialize extractor and panel
    dataExtractor = new HattrickMatchDataExtractor();
    dataPanel = new MatchDataPanel();
    
    // Initialize API client
    try {
      await dataExtractor.initialize();
    } catch (error) {
      console.warn('Could not initialize API client:', error);
    }
    
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
async function addDataFetchButton() {
  const button = document.createElement('button');
  button.id = 'hattrick-fetch-data-btn';
  
  // Check authentication status to determine button text
  const isAuthenticated = await dataExtractor.isAPIAvailable();
  
  if (isAuthenticated) {
    button.textContent = '📊 Show Match Data';
  } else {
    button.textContent = '🔐 Authenticate with Hattrick';
  }
  
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
  
  button.addEventListener('click', async () => {
    const currentlyAuthenticated = await dataExtractor.isAPIAvailable();
    if (currentlyAuthenticated) {
      fetchAndDisplayMatchData();
    } else {
      // Start authentication flow
      await handleAuthentication(button);
    }
  });
  
  document.body.appendChild(button);
}

// Handle authentication flow
async function handleAuthentication(button) {
  console.log('Starting authentication flow...');
  
  const originalText = button.textContent;
  button.textContent = '🔄 Authenticating...';
  button.disabled = true;
  
  try {
    // Use default credentials (null for both means use defaults)
    await dataExtractor.authenticate(null, null);
    
    // Success - update button
    button.textContent = '📊 Show Match Data';
    button.disabled = false;
    
    // Show success message
    const successMsg = showTemporaryMessage('✅ Authentication successful! Click the button to view match data.', 'success');
    setTimeout(() => {
      if (successMsg && successMsg.parentNode) {
        successMsg.parentNode.removeChild(successMsg);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Reset button
    button.textContent = originalText;
    button.disabled = false;
    
    // Show error
    alert('Authentication failed: ' + error.message + '\n\nPlease try again or check the Settings page.');
  }
}

// Fetch and display match data
async function fetchAndDisplayMatchData() {
  console.log('Fetching match data...');
  
  // Show loading indicator
  const loadingMsg = showLoadingMessage('Loading match data...');
  
  try {
    // Extract data from page (now async)
    const matchData = await dataExtractor.extractMatchData();
    
    // Remove loading indicator
    if (loadingMsg && loadingMsg.parentNode) {
      loadingMsg.parentNode.removeChild(loadingMsg);
    }
    
    // Display in panel
    dataPanel.createPanel(matchData);
    
    console.log('Match data displayed successfully');
  } catch (error) {
    console.error('Error fetching match data:', error);
    
    // Remove loading indicator
    if (loadingMsg && loadingMsg.parentNode) {
      loadingMsg.parentNode.removeChild(loadingMsg);
    }
    
    alert('Error fetching match data. See console for details.');
  }
}

// Show loading message
function showLoadingMessage(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'hattrick-loading-msg';
  loadingDiv.textContent = message;
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 40px;
    border-radius: 10px;
    font-family: sans-serif;
    font-size: 16px;
    font-weight: bold;
    z-index: 10001;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: pulse 1.5s ease-in-out infinite;
  `;
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(loadingDiv);
  
  return loadingDiv;
}

// Show temporary message
function showTemporaryMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'hattrick-temp-msg';
  messageDiv.textContent = message;
  
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea';
  
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColor};
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translate(-50%, -100%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(messageDiv);
  
  return messageDiv;
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
    // Extract and return match data (async)
    if (dataExtractor) {
      dataExtractor.extractMatchData().then(matchData => {
        sendResponse({ status: 'success', data: matchData });
      }).catch(error => {
        sendResponse({ status: 'error', message: error.message });
      });
    } else {
      sendResponse({ status: 'error', message: 'Not on a match page' });
    }
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'showMatchData') {
    // Show the data panel (async)
    fetchAndDisplayMatchData().then(() => {
      sendResponse({ status: 'success' });
    }).catch(error => {
      sendResponse({ status: 'error', message: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  return true; // Keep message channel open for async response
});
