// Background service worker for Chrome extension
console.log('Hattrick Matchview background service worker loaded');

// Import API client using importScripts (path relative to extension root)
importScripts('api/chppApiClient.js');

// Initialize API client for background context
let apiClient = null;

// Initialize API client
async function initializeAPIClient() {
  if (!apiClient) {
    // We need to instantiate CHPPApiClient in the background
    // Since service workers can't import from content scripts directly,
    // we'll need to have it available here
    apiClient = new CHPPApiClient();
    await apiClient.initialize();
  }
  return apiClient;
}

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
    return true;
  }
  
  // Handle API initialization check
  if (request.action === 'checkAuthentication') {
    initializeAPIClient().then(client => {
      sendResponse({ 
        authenticated: client.isAuthenticated(),
        usingDefault: client.isUsingDefaultCredentials()
      });
    }).catch(error => {
      console.error('Error checking authentication:', error);
      sendResponse({ authenticated: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle authentication flow
  if (request.action === 'authenticate') {
    const { consumerKey, consumerSecret } = request;
    initializeAPIClient().then(client => {
      // If consumerKey/Secret are null, use defaults
      const key = consumerKey || client.defaultConsumerKey;
      const secret = consumerSecret || client.defaultConsumerSecret;
      return client.authenticate(key, secret);
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Authentication failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // Handle match details request
  if (request.action === 'getMatchDetails') {
    const { matchId } = request;
    initializeAPIClient().then(client => {
      return client.getMatchDetails(matchId);
    }).then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      console.error('Error fetching match details:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // Handle live events request
  if (request.action === 'getLiveMatchEvents') {
    const { matchId } = request;
    initializeAPIClient().then(client => {
      return client.getLiveMatchEvents(matchId);
    }).then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      console.error('Error fetching live events:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // Handle clear credentials request
  if (request.action === 'clearCredentials') {
    // If client doesn't exist yet, still try to clear from storage
    if (!apiClient) {
      // Use Promise-based API for consistency
      chrome.storage.local.remove(['chppCredentials']).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error clearing credentials from storage:', error);
        sendResponse({ success: false, error: error.message || 'Failed to clear storage' });
      });
    } else {
      apiClient.clearCredentials().then(() => {
        // Reset the API client instance so it reinitializes on next use
        apiClient = null;
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error clearing credentials:', error);
        sendResponse({ success: false, error: error.message });
      });
    }
    return true;
  }
  
  // Only return true for unhandled messages that might need async response
  return false;
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
