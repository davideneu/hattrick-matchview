// Settings page JavaScript

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Settings page loaded');
  
  // Check current authentication status
  await checkAuthStatus();
  
  // Attach event listeners
  attachEventListeners();
});

// Helper: Send message to background worker with retry logic
async function sendMessageToBackground(message, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        // Longer timeout for authentication (60s) vs other operations (10s)
        const timeoutDuration = message.action === 'authenticate' ? 60000 : 10000;
        
        const timeout = setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutDuration/1000}s - background service worker may be inactive`));
        }, timeoutDuration);
        
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response == null) {
            // Check for both null and undefined
            reject(new Error('No response from background service worker'));
          } else {
            resolve(response);
          }
        });
      });
      
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt < retries) {
        // Wait before retrying (exponential backoff with max delay cap)
        const delay = Math.min(Math.pow(2, attempt - 1) * 500, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying... (attempt ${attempt + 1}/${retries})`);
      } else {
        // All retries failed
        throw new Error(`Failed to communicate with background service worker after ${retries} attempts: ${error.message}`);
      }
    }
  }
}

// Check authentication status
async function checkAuthStatus() {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  // Show loading state
  statusIcon.textContent = '🔄';
  statusText.textContent = 'Checking authentication...';
  
  try {
    const response = await sendMessageToBackground({ action: 'checkAuthentication' });
    
    if (response.authenticated) {
      statusIcon.textContent = '🟢';
      statusText.textContent = `Authenticated - Using CHPP API ${response.usingDefault ? '(Default Credentials)' : '(User Credentials)'}`;
    } else {
      statusIcon.textContent = '🟡';
      statusText.textContent = 'Ready to Authenticate - Click "Authenticate" below';
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    statusIcon.textContent = '🔴';
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Attach event listeners
function attachEventListeners() {
  // Authentication button
  document.getElementById('authenticate-btn').addEventListener('click', async () => {
    await handleAuthenticate();
  });
  
  // Clear authentication button
  document.getElementById('clear-auth-btn').addEventListener('click', async () => {
    await handleClearAuth();
  });
}

// Handle authentication
async function handleAuthenticate() {
  const authenticateBtn = document.getElementById('authenticate-btn');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  console.log('Starting authentication with default credentials');
  
  // Disable button and show progress
  authenticateBtn.disabled = true;
  authenticateBtn.textContent = '🔄 Authenticating...';
  statusIcon.textContent = '🔄';
  statusText.textContent = 'Starting OAuth authentication...';
  
  try {
    // Start OAuth flow via background worker (omit credentials to use defaults)
    statusText.textContent = 'Requesting authorization token...';
    
    const response = await sendMessageToBackground({ 
      action: 'authenticate'
      // consumerKey and consumerSecret are omitted, background will use defaults
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Authentication failed');
    }
    
    // Success
    statusIcon.textContent = '🟢';
    statusText.textContent = 'Authentication successful!';
    
    // Show success message
    alert('✅ Successfully authenticated with Hattrick CHPP API!\n\nUsing default credentials for testing.\n\nThe extension can now fetch match data from the API.');
    
    // Reload auth status
    await checkAuthStatus();
    
  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Show error
    statusIcon.textContent = '🔴';
    statusText.textContent = `Authentication failed: ${error.message}`;
    
    // Provide helpful error messages based on error type
    let errorMessage = `Authentication failed:\n${error.message}\n\n`;
    
    if (error.message.includes('timeout') || error.message.includes('inactive')) {
      errorMessage += 'The authentication process took too long or the extension became inactive.\n\nTry:\n1. Reload the extension from chrome://extensions/\n2. Try authenticating again\n3. Complete the authorization quickly when the browser window opens';
    } else if (error.message.includes('No response') || error.message.includes('service worker')) {
      errorMessage += 'The extension background service is not responding.\n\nTry:\n1. Reload the extension from chrome://extensions/\n2. Close and reopen this settings page\n3. Try authenticating again';
    } else if (error.message.includes('verifier')) {
      errorMessage += 'The OAuth callback did not complete properly.\n\nTry:\n1. Make sure you clicked "Approve" in the authorization window\n2. Check that popups are not blocked\n3. Try authenticating again';
    } else {
      errorMessage += 'Please try again. If the problem persists, try reloading the extension.';
    }
    
    alert(errorMessage);
    
  } finally {
    // Re-enable button
    authenticateBtn.disabled = false;
    authenticateBtn.textContent = '🔐 Authenticate with Hattrick';
  }
}

// Handle clear authentication
async function handleClearAuth() {
  const confirmed = confirm('Are you sure you want to clear your authentication?\n\nYou will need to re-authenticate to use the extension.');
  
  if (!confirmed) return;
  
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  try {
    const response = await sendMessageToBackground({ action: 'clearCredentials' });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to clear credentials');
    }
    
    // Update status
    statusIcon.textContent = '🟡';
    statusText.textContent = 'Authentication cleared - Ready to re-authenticate';
    
    alert('Authentication cleared successfully.\n\nClick "Authenticate" to re-authenticate.');
    
  } catch (error) {
    console.error('Error clearing authentication:', error);
    alert(`Error clearing authentication:\n${error.message || 'Unknown error occurred'}`);
  }
}
