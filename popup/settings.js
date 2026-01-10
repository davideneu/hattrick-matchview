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
      statusText.textContent = 'Authenticated - Using CHPP API';
      
      // Load and display current credentials (masked)
      const credentials = await apiClient.loadCredentials();
      if (credentials) {
        document.getElementById('consumer-key').value = maskCredential(credentials.consumerKey);
        document.getElementById('consumer-secret').value = maskCredential(credentials.consumerSecret);
      }
    } else {
      statusIcon.textContent = '⚪';
      statusText.textContent = 'Not Authenticated - Using DOM Parsing (Fallback)';
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
  const consumerKey = document.getElementById('consumer-key').value.trim();
  const consumerSecret = document.getElementById('consumer-secret').value.trim();
  const authenticateBtn = document.getElementById('authenticate-btn');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  // Validate inputs
  if (!consumerKey || !consumerSecret) {
    alert('Please enter both Consumer Key and Consumer Secret');
    return;
  }
  
  // Check if values are masked (user didn't change them)
  if (consumerKey.includes('***') || consumerSecret.includes('***')) {
    alert('Please enter new credentials or clear existing ones first');
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
    alert('Successfully authenticated with Hattrick CHPP API!\n\nThe extension will now use the API to fetch match data.');
    
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
  const confirmed = confirm('Are you sure you want to clear your authentication?\n\nThe extension will fall back to DOM parsing mode.');
  
  if (!confirmed) return;
  
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  try {
    await apiClient.clearCredentials();
    
    // Clear form fields
    document.getElementById('consumer-key').value = '';
    document.getElementById('consumer-secret').value = '';
    
    // Update status
    statusIcon.textContent = '⚪';
    statusText.textContent = 'Authentication cleared - Using DOM Parsing (Fallback)';
    
    alert('Authentication cleared successfully.\n\nThe extension will now use DOM parsing mode.');
    
  } catch (error) {
    console.error('Error clearing authentication:', error);
    alert(`Error clearing authentication:\n${error.message}`);
  }
}
