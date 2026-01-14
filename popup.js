// popup.js - Handles the popup UI and user interactions

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  
  // Set up event listeners
  document.getElementById('connect-btn')?.addEventListener('click', initiateAuth);
  document.getElementById('retry-btn')?.addEventListener('click', initiateAuth);
  document.getElementById('disconnect-btn')?.addEventListener('click', disconnect);
});

async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get(['authStatus', 'error', 'userInfo']);
    const status = result.authStatus || 'not-connected';
    
    showStatus(status, result.error, result.userInfo);
  } catch (error) {
    console.error('Error checking auth status:', error);
    showStatus('error', error.message);
  }
}

function showStatus(status, error = null, userInfo = null) {
  // Hide all status sections
  const sections = ['loading', 'not-connected', 'connected', 'error'];
  sections.forEach(section => {
    const element = document.getElementById(section);
    if (element) {
      element.style.display = 'none';
    }
  });
  
  // Show the appropriate section
  const activeSection = document.getElementById(status);
  if (activeSection) {
    activeSection.style.display = 'block';
  }
  
  // Update error log if present
  if (status === 'error' && error) {
    const errorLog = document.getElementById('error-log');
    if (errorLog) {
      errorLog.textContent = error;
    }
  }
  
  // Update user info if connected
  if (status === 'connected' && userInfo) {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
      userInfoElement.textContent = userInfo;
    }
  }
}

async function initiateAuth() {
  try {
    // Send message to background script to start OAuth flow
    const response = await chrome.runtime.sendMessage({ action: 'startAuth' });
    
    if (!response) {
      showStatus('error', 'Failed to communicate with background script');
      return;
    }
    
    if (response.success) {
      showStatus('connected', null, response.userInfo);
    } else {
      showStatus('error', response.error);
    }
  } catch (error) {
    console.error('Error initiating auth:', error);
    showStatus('error', error.message);
  }
}

async function disconnect() {
  try {
    await chrome.storage.local.clear();
    showStatus('not-connected');
  } catch (error) {
    console.error('Error disconnecting:', error);
    showStatus('error', error.message);
  }
}

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'statusUpdate') {
    showStatus(message.status, message.error, message.userInfo);
  }
});
