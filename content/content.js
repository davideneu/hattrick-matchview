// Content script - runs on Hattrick pages
console.log('Hattrick Matchview content script loaded');

// Function to initialize match visualization
function initializeMatchView() {
  // Check if we're on a match page
  const isMatchPage = window.location.href.includes('/Club/Matches/Match.aspx');
  
  if (isMatchPage) {
    console.log('Match page detected - ready for visualization');
    // Add a visual indicator that the extension is active
    addExtensionIndicator();
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
    // Placeholder for extracting match data
    sendResponse({ status: 'ready', isMatchPage: window.location.href.includes('/Club/Matches/Match.aspx') });
  }
  
  return true; // Keep message channel open for async response
});
