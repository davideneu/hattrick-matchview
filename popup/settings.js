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
      
      // Load and display current credentials (masked)
      const credentials = await apiClient.loadCredentials();
      if (credentials) {
        document.getElementById('consumer-key').value = maskCredential(credentials.consumerKey);
        document.getElementById('consumer-secret').value = maskCredential(credentials.consumerSecret);
      } else if (apiClient.isUsingDefaultCredentials()) {
        // Show masked default credentials
        document.getElementById('consumer-key').value = maskCredential(apiClient.defaultConsumerKey);
        document.getElementById('consumer-secret').value = maskCredential(apiClient.defaultConsumerSecret);
      }
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

// Mask credential for display
function maskCredential(credential) {
  if (!credential) return '';
  if (credential.length <= 8) return '***';
  return credential.substring(0, 4) + '***' + credential.substring(credential.length - 4);
}

// Attach event listeners
function attachEventListeners() {
  // Authentication form
  document.getElementById('api-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleAuthenticate();
  });
  
  // Clear authentication button
  document.getElementById('clear-auth-btn').addEventListener('click', async () => {
    await handleClearAuth();
  });
}

// Handle authentication
async function handleAuthenticate() {
  let consumerKey = document.getElementById('consumer-key').value.trim();
  let consumerSecret = document.getElementById('consumer-secret').value.trim();
  const authenticateBtn = document.getElementById('authenticate-btn');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  // If fields are empty or masked, use default credentials
  if (!consumerKey || consumerKey.includes('***')) {
    consumerKey = apiClient.defaultConsumerKey;
    consumerSecret = apiClient.defaultConsumerSecret;
    console.log('Using default credentials for authentication');
  } else if (!consumerSecret || consumerSecret.includes('***')) {
    alert('Please enter both Consumer Key and Consumer Secret, or leave both empty to use default credentials');
    return;
  }
  
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
    const usingDefault = (consumerKey === apiClient.defaultConsumerKey);
    alert(`Successfully authenticated with Hattrick CHPP API!\n\n${usingDefault ? 'Using default credentials for testing.' : 'Using your custom credentials.'}\n\nThe extension will now use the API to fetch match data.`);
    
    // Reload auth status
    await checkAuthStatus();
    
  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Show error
    statusIcon.textContent = '🔴';
    statusText.textContent = `Authentication failed: ${error.message}`;
    
    alert(`Authentication failed:\n${error.message}\n\nPlease check your credentials and try again.`);
    
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
    
    // Clear form fields
    document.getElementById('consumer-key').value = '';
    document.getElementById('consumer-secret').value = '';
    
    // Update status
    statusIcon.textContent = '🟡';
    statusText.textContent = 'Authentication cleared - Ready to re-authenticate';
    
    alert('Authentication cleared successfully.\n\nClick "Authenticate" to re-authenticate (or leave fields empty to use default credentials).');
    
  } catch (error) {
    console.error('Error clearing authentication:', error);
    alert(`Error clearing authentication:\n${error.message}`);
  }
}
