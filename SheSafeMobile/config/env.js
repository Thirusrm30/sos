const DEV_API_URL = 'http://192.168.1.4:3001';
const PROD_API_URL = 'https://shesafe-api.example.com';

export const getApiUrl = () => {
  if (__DEV__) {
    return DEV_API_URL;
  }
  return PROD_API_URL;
};

export default {
  DEV: DEV_API_URL,
  PROD: PROD_API_URL,
  getApiUrl,
};
