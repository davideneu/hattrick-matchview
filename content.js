// content.js - Content script for match pages

console.log('Hattrick Match View extension loaded on match page');

// Check if user is authenticated
(async () => {
  try {
    const result = await chrome.storage.local.get(['authStatus', 'accessToken']);
    if (result.authStatus === 'connected' && result.accessToken) {
      console.log('User is authenticated');
      // Future functionality: Display match data enhancements
    } else {
      console.log('User not authenticated');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
})();
