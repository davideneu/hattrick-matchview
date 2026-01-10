// Check if current tab is on Hattrick
async function checkHattrickStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    
    if (tab.url && tab.url.includes('hattrick.org')) {
      statusIndicator.textContent = '🟢';
      statusText.textContent = 'Connected to Hattrick';
      
      // Enable fetch button if on match page
      if (tab.url.includes('/Club/Matches/Match.aspx')) {
        fetchDataBtn.disabled = false;
        fetchDataBtn.textContent = '📊 Show Match Data';
      } else {
        fetchDataBtn.disabled = true;
        fetchDataBtn.textContent = '📊 (Not on match page)';
      }
    } else {
      statusIndicator.textContent = '⚪';
      statusText.textContent = 'Not on Hattrick';
      fetchDataBtn.disabled = true;
      fetchDataBtn.textContent = '📊 (Not on Hattrick)';
    }
  } catch (error) {
    console.error('Error checking Hattrick status:', error);
  }
}

// Fetch match data button handler
document.getElementById('fetch-data-btn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to show match data
    chrome.tabs.sendMessage(tab.id, { action: 'showMatchData' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        alert('Error: Please refresh the Hattrick page and try again.');
      } else {
        console.log('Match data display triggered');
      }
    });
  } catch (error) {
    console.error('Error fetching match data:', error);
    alert('Error fetching match data. Please try again.');
  }
});

// Options button handler
document.getElementById('options-btn').addEventListener('click', () => {
  // Placeholder for future options page
  console.log('Options clicked - to be implemented');
  alert('Options page coming soon!');
});

// Settings button handler
document.getElementById('settings-btn').addEventListener('click', () => {
  // Open settings page in a new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/settings.html') });
});

// Initialize on popup load
document.addEventListener('DOMContentLoaded', () => {
  checkHattrickStatus();
});
