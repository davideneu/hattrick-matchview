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
        // Add a timeout to detect hanging requests
        const timeout = setTimeout(() => {
          reject(new Error('Message timeout - background service worker may be inactive'));
        }, 5000);
        
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response === undefined) {
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
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying... (attempt ${attempt + 1}/${retries})`);
      } else {
        // All retries failed
        throw new Error(`Failed to communicate with background service worker after ${retries} attempts. Please try reloading the extension.`);
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
  
  console.log('Using default credentials for authentication');
  
  // Disable button and show progress
  authenticateBtn.disabled = true;
  authenticateBtn.textContent = '🔄 Authenticating...';
  statusIcon.textContent = '🔄';
  statusText.textContent = 'Starting OAuth authentication...';
  
  try {
    // Start OAuth flow via background worker (omit credentials to use defaults)
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
    alert('Successfully authenticated with Hattrick CHPP API!\n\nUsing default credentials for testing.\n\nThe extension will now use the API to fetch match data.');
    
    // Reload auth status
    await checkAuthStatus();
    
  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Show error
    statusIcon.textContent = '🔴';
    statusText.textContent = `Authentication failed: ${error.message}`;
    
    alert(`Authentication failed:\n${error.message}\n\nPlease try again.`);
    
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
