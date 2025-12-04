const API_URL_KEY = 'gemini_api_url';
const API_KEY_KEY = 'gemini_api_key';

export type ApiConfig = {
  getUrl: () => string;
  getKey: () => string;
  setUrl: (url: string) => void;
  setKey: (key: string) => void;
  isConfigured: () => boolean;
  clear: () => void;
};

export const apiConfig: ApiConfig = {
  getUrl: () => localStorage.getItem(API_URL_KEY) || '',
  getKey: () => localStorage.getItem(API_KEY_KEY) || '',
  setUrl: (url: string) => localStorage.setItem(API_URL_KEY, url),
  setKey: (key: string) => localStorage.setItem(API_KEY_KEY, key),
  isConfigured: () => !!(localStorage.getItem(API_URL_KEY) && localStorage.getItem(API_KEY_KEY)),
  clear: () => {
    localStorage.removeItem(API_URL_KEY);
    localStorage.removeItem(API_KEY_KEY);
  },
};
