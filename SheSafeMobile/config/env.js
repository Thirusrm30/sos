// ============================================
// SheSafe Mobile — Environment Configuration
// ============================================
// This file is safe to commit. It imports actual keys
// from env.local.js which is excluded from git.
// ============================================

let LOCAL_SECRETS;
try {
  LOCAL_SECRETS = require('./env.local').LOCAL_SECRETS;
} catch (e) {
  console.warn('⚠️ env.local.js not found — using placeholder keys.');
  console.warn('   Copy config/env.local.example.js → config/env.local.js and fill in your keys.');
  LOCAL_SECRETS = {
    DEV_API_URL: 'http://192.168.1.4:3001',
    PROD_API_URL: 'https://shesafe-api.example.com',
    DEV_GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    PROD_GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
  };
}

export const getApiUrl = () => {
  if (__DEV__) {
    return LOCAL_SECRETS.DEV_API_URL;
  }
  return LOCAL_SECRETS.PROD_API_URL;
};

export const getGoogleMapsApiKey = () => {
  if (__DEV__) {
    return LOCAL_SECRETS.DEV_GOOGLE_MAPS_API_KEY;
  }
  return LOCAL_SECRETS.PROD_GOOGLE_MAPS_API_KEY;
};

export const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

export default {
  DEV: LOCAL_SECRETS.DEV_API_URL,
  PROD: LOCAL_SECRETS.PROD_API_URL,
  getApiUrl,
  getGoogleMapsApiKey,
  GOOGLE_MAPS_BASE_URL,
};
