// Background service worker for Chrome extension
console.log('Hattrick Matchview background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed for the first time');
    // Set default settings or show welcome page
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'getExtensionStatus') {
    sendResponse({ status: 'active', version: chrome.runtime.getManifest().version });
  }
  
  return true; // Keep message channel open for async response
});

// Handle tab updates to detect when user navigates to Hattrick
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('hattrick.org')) {
    console.log('User navigated to Hattrick:', tab.url);
    // Could send a message to content script or update badge
  }
});

// Optional: Update extension badge based on context
function updateBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}
