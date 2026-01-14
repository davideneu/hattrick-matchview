// Settings page JavaScript
let apiClient = null;

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Settings page loaded');
  
  // Create API client instance
  apiClient = new CHPPApiClient();
  
  // Check current authentication status
  await checkAuthStatus();
  
  // Attach event listeners
  attachEventListeners();
});

// Check authentication status
async function checkAuthStatus() {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  try {
    const isAuthenticated = await apiClient.initialize();
    
    if (isAuthenticated) {
      statusIcon.textContent = '🟢';
      statusText.textContent = `Authenticated - Using CHPP API ${apiClient.isUsingDefaultCredentials() ? '(Default Credentials)' : '(User Credentials)'}`;
    } else {
      statusIcon.textContent = '🟡';
      statusText.textContent = 'Ready to Authenticate - Click "Authenticate" below';
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    statusIcon.textContent = '🔴';
    statusText.textContent = 'Error checking authentication status';
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
  
  // Use default credentials
  const consumerKey = apiClient.defaultConsumerKey;
  const consumerSecret = apiClient.defaultConsumerSecret;
  
  console.log('Using default credentials for authentication');
  
  // Disable button and show progress
  authenticateBtn.disabled = true;
  authenticateBtn.textContent = '🔄 Authenticating...';
  statusIcon.textContent = '🔄';
  statusText.textContent = 'Starting OAuth authentication...';
  
  try {
    // Start OAuth flow
    await apiClient.authenticate(consumerKey, consumerSecret);
    
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
    await apiClient.clearCredentials();
    
    // Update status
    statusIcon.textContent = '🟡';
    statusText.textContent = 'Authentication cleared - Ready to re-authenticate';
    
    alert('Authentication cleared successfully.\n\nClick "Authenticate" to re-authenticate.');
    
  } catch (error) {
    console.error('Error clearing authentication:', error);
    alert(`Error clearing authentication:\n${error.message}`);
  }
}
