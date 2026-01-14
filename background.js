// background.js - Service worker for OAuth authentication

// OAuth credentials for Hattrick CHPP API
// Note: In OAuth 1.0a client-side implementations (like Chrome extensions), the consumer
// secret must be included in the code for signing requests. The secret is used ONLY for
// generating signatures and is never sent directly in requests. This is a standard practice
// for browser extensions and is acceptable per OAuth 1.0a specifications.
const CONSUMER_KEY = 'SNbqfVnQkV9IkrMhbGAqae';
const CONSUMER_SECRET = 'EriFMHbmnnKG9HT3YL7Y9LANP7ziJtaHWnpJqSeFLsH';
const REQUEST_TOKEN_URL = 'https://chpp.hattrick.org/oauth/request_token.ashx';
const AUTHORIZE_URL = 'https://chpp.hattrick.org/oauth/authorize.aspx';
const ACCESS_TOKEN_URL = 'https://chpp.hattrick.org/oauth/access_token.ashx';
const CALLBACK_URL = chrome.identity.getRedirectURL('oauth');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAuth') {
    handleOAuthFlow()
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('OAuth error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  } else if (message.action === 'fetchMatchData') {
    fetchMatchData(message.matchId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => {
        console.error('Match data fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  } else if (message.action === 'fetchLiveMatchData') {
    fetchLiveMatchData(message.matchId, message.actionType, message.lastShownIndexes)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => {
        console.error('Live match data fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Check auth status on startup
chrome.runtime.onStartup.addListener(async () => {
  await checkExistingAuth();
});

chrome.runtime.onInstalled.addListener(async () => {
  await checkExistingAuth();
});

async function checkExistingAuth() {
  const result = await chrome.storage.local.get(['accessToken', 'accessTokenSecret']);
  
  if (result.accessToken && result.accessTokenSecret) {
    await chrome.storage.local.set({ authStatus: 'connected' });
  } else {
    await chrome.storage.local.set({ authStatus: 'not-connected' });
  }
}

async function handleOAuthFlow() {
  try {
    // Step 1: Get request token
    const requestTokenData = await getRequestToken();
    
    // Step 2: Get user authorization
    const verifier = await getUserAuthorization(requestTokenData.token);
    
    // Step 3: Exchange for access token
    const accessTokenData = await getAccessToken(
      requestTokenData.token,
      requestTokenData.tokenSecret,
      verifier
    );
    
    // Save tokens
    await chrome.storage.local.set({
      accessToken: accessTokenData.token,
      accessTokenSecret: accessTokenData.tokenSecret,
      authStatus: 'connected',
      userInfo: 'Successfully authenticated'
    });
    
    return { success: true, userInfo: 'Successfully authenticated' };
  } catch (error) {
    console.error('OAuth flow error:', error);
    await chrome.storage.local.set({
      authStatus: 'error',
      error: error.message
    });
    throw error;
  }
}

async function getRequestToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  
  const params = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_callback: CALLBACK_URL
  };
  
  const signature = await generateSignature('POST', REQUEST_TOKEN_URL, params, CONSUMER_SECRET, '');
  params.oauth_signature = signature;
  
  const response = await fetch(REQUEST_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(params)
    }
  });
  
  if (!response.ok) {
    throw new Error(`Request token failed: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  const data = parseQueryString(text);
  
  return {
    token: data.oauth_token,
    tokenSecret: data.oauth_token_secret
  };
}

async function getUserAuthorization(requestToken) {
  const authUrl = `${AUTHORIZE_URL}?oauth_token=${requestToken}`;
  
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (callbackUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (!callbackUrl) {
        reject(new Error('No callback URL received'));
        return;
      }
      
      const url = new URL(callbackUrl);
      const verifier = url.searchParams.get('oauth_verifier');
      
      if (!verifier) {
        reject(new Error('No verifier in callback'));
        return;
      }
      
      resolve(verifier);
    });
  });
}

async function getAccessToken(requestToken, requestTokenSecret, verifier) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  
  const params = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_token: requestToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_verifier: verifier
  };
  
  const signature = await generateSignature('POST', ACCESS_TOKEN_URL, params, CONSUMER_SECRET, requestTokenSecret);
  params.oauth_signature = signature;
  
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(params)
    }
  });
  
  if (!response.ok) {
    throw new Error(`Access token failed: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  const data = parseQueryString(text);
  
  return {
    token: data.oauth_token,
    tokenSecret: data.oauth_token_secret
  };
}

async function generateSignature(method, url, params, consumerSecret, tokenSecret) {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');
  
  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Generate HMAC-SHA1 signature
  return await hmacSha1(signatureBaseString, signingKey);
}

function buildAuthHeader(params) {
  // Only include OAuth parameters in the Authorization header (not API query parameters)
  const oauthParams = Object.keys(params)
    .filter(key => key.startsWith('oauth_'))
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');
  
  return `OAuth ${oauthParams}`;
}

function generateNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function parseQueryString(queryString) {
  const params = {};
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  
  return params;
}

// HMAC-SHA1 implementation using Web Crypto API
async function hmacSha1(message, key) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // Convert to base64
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));
  
  return signatureBase64;
}

// Fetch match data from Hattrick CHPP API
async function fetchMatchData(matchId) {
  // Get stored tokens
  const result = await chrome.storage.local.get(['accessToken', 'accessTokenSecret']);
  
  if (!result.accessToken || !result.accessTokenSecret) {
    throw new Error('Not authenticated. Please connect to Hattrick first.');
  }
  
  // Validate matchId to prevent URL injection
  if (!matchId || !/^\d+$/.test(matchId)) {
    throw new Error('Invalid match ID format');
  }
  
  // Base URL without query parameters (required for OAuth signature)
  const baseUrl = 'https://chpp.hattrick.org/chppxml.ashx';
  
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  
  // All parameters including API query parameters (required for OAuth signature)
  const params = {
    file: 'matchdetails',
    version: '3.1',
    matchID: matchId,
    sourceSystem: 'Hattrick',
    matchEvents: 'true',
    oauth_consumer_key: CONSUMER_KEY,
    oauth_token: result.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0'
  };
  
  // Generate signature with all parameters
  const signature = await generateSignature('GET', baseUrl, params, CONSUMER_SECRET, result.accessTokenSecret);
  params.oauth_signature = signature;
  
  // Build full URL with API query parameters (not OAuth parameters)
  const apiParams = new URLSearchParams({
    file: params.file,
    version: params.version,
    matchID: params.matchID,
    sourceSystem: params.sourceSystem,
    matchEvents: params.matchEvents
  });
  const apiUrl = `${baseUrl}?${apiParams.toString()}`;
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': buildAuthHeader(params)
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch match data: ${response.status} ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  
  // Return raw XML text instead of parsing it here
  // Parsing will be done in content.js where DOMParser is available
  return xmlText;
}

// Fetch live match data from Hattrick HT Live API
async function fetchLiveMatchData(matchId, actionType = 'viewAll', lastShownIndexes = null) {
  // Get stored tokens
  const result = await chrome.storage.local.get(['accessToken', 'accessTokenSecret']);
  
  if (!result.accessToken || !result.accessTokenSecret) {
    throw new Error('Not authenticated. Please connect to Hattrick first.');
  }
  
  // Validate matchId to prevent URL injection
  if (!matchId || !/^\d+$/.test(matchId)) {
    throw new Error('Invalid match ID format');
  }
  
  // Validate actionType
  if (!['viewAll', 'viewNew'].includes(actionType)) {
    throw new Error('Invalid action type. Must be viewAll or viewNew.');
  }
  
  // Base URL without query parameters (required for OAuth signature)
  const baseUrl = 'https://chpp.hattrick.org/chppxml.ashx';
  
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  
  // All parameters including API query parameters (required for OAuth signature)
  const params = {
    file: 'htlive',
    version: '1.4',
    actionType: actionType,
    oauth_consumer_key: CONSUMER_KEY,
    oauth_token: result.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0'
  };
  
  // Add lastShownIndexes if provided (for viewNew actionType)
  // Store the stringified version for use in both signature and URL
  let lastShownIndexesStr = null;
  if (lastShownIndexes && actionType === 'viewNew') {
    lastShownIndexesStr = JSON.stringify(lastShownIndexes);
    params.lastShownIndexes = lastShownIndexesStr;
  }
  
  // Generate signature with all parameters
  const signature = await generateSignature('GET', baseUrl, params, CONSUMER_SECRET, result.accessTokenSecret);
  params.oauth_signature = signature;
  
  // Build full URL with API query parameters (not OAuth parameters)
  const apiParams = new URLSearchParams({
    file: params.file,
    version: params.version,
    actionType: params.actionType
  });
  
  // Add lastShownIndexes to URL if provided (using the same stringified value)
  if (lastShownIndexesStr) {
    apiParams.append('lastShownIndexes', lastShownIndexesStr);
  }
  
  const apiUrl = `${baseUrl}?${apiParams.toString()}`;
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': buildAuthHeader(params)
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch live match data: ${response.status} ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  
  // Return raw XML text instead of parsing it here
  // Parsing will be done in content.js where DOMParser is available
  return xmlText;
}

