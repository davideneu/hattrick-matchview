// content.js - Content script for match pages

console.log('Hattrick Match View extension loaded on match page');

// Check if user is authenticated
chrome.storage.local.get(['authStatus', 'accessToken'], (result) => {
  if (result.authStatus === 'connected' && result.accessToken) {
    console.log('User is authenticated');
    // Future functionality: Display match data enhancements
  } else {
    console.log('User not authenticated');
  }
});
