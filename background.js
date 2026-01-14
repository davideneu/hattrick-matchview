// background.js - Service worker for OAuth authentication

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
  const headerParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');
  
  return `OAuth ${headerParams}`;
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
