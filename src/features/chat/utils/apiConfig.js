const API_URL_KEY = 'gemini_api_url';
const API_KEY_KEY = 'gemini_api_key';
const WEB_SEARCH_KEY = 'gemini_web_search';

export const apiConfig = {
  getUrl: () => localStorage.getItem(API_URL_KEY) || '',
  getKey: () => localStorage.getItem(API_KEY_KEY) || '',
  getWebSearch: () => localStorage.getItem(WEB_SEARCH_KEY) === 'true',
  setUrl: (url) => localStorage.setItem(API_URL_KEY, url),
  setKey: (key) => localStorage.setItem(API_KEY_KEY, key),
  setWebSearch: (enabled) => localStorage.setItem(WEB_SEARCH_KEY, String(enabled)),
  isConfigured: () => !!(localStorage.getItem(API_URL_KEY) && localStorage.getItem(API_KEY_KEY)),
  clear: () => {
    localStorage.removeItem(API_URL_KEY);
    localStorage.removeItem(API_KEY_KEY);
    localStorage.removeItem(WEB_SEARCH_KEY);
  },
};
