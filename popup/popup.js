// Check if current tab is on Hattrick
async function checkHattrickStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (tab.url && tab.url.includes('hattrick.org')) {
      statusIndicator.textContent = '🟢';
      statusText.textContent = 'Connected to Hattrick';
    } else {
      statusIndicator.textContent = '⚪';
      statusText.textContent = 'Not on Hattrick';
    }
  } catch (error) {
    console.error('Error checking Hattrick status:', error);
  }
}

// Options button handler
document.getElementById('options-btn').addEventListener('click', () => {
  // Placeholder for future options page
  console.log('Options clicked - to be implemented');
  alert('Options page coming soon!');
});

// Initialize on popup load
document.addEventListener('DOMContentLoaded', () => {
  checkHattrickStatus();
});
