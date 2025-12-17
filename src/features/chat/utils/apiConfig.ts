const API_URL_KEY = 'gemini_api_url';
const API_KEY_KEY = 'gemini_api_key';
const API_TYPE_KEY = 'api_type';
const REQUEST_MODE_KEY = 'request_mode';
export const STORAGE_KEY_MODEL = 'chat_model';

export const MODEL_LIST = [
  'gemini-3-pro-image-preview-1-1-4K',
  'gemini-3-pro-image-preview-16-9-4K',
  'gemini-3-pro-image-preview-4k',
  'gemini-3-pro-image-preview-9-16-4K',
  'gemini-3-pro-image-preview',
] as const;

export type ModelName = (typeof MODEL_LIST)[number];
const DEFAULT_MODEL: ModelName = 'gemini-3-pro-image-preview';

export type ApiType = 'gemini' | 'openai';
export type RequestMode = 'client' | 'server';

export type ApiConfig = {
  getUrl: () => string;
  getKey: () => string;
  getType: () => ApiType;
  /**
   * API 请求发起方式：客户端直连 or 服务端转发，用于解决 CORS
   */
  getRequestMode: () => RequestMode;
  /**
   * 当前选择的模型名称
   */
  getModel: () => ModelName;
  setUrl: (url: string) => void;
  setKey: (key: string) => void;
  setType: (type: ApiType) => void;
  setRequestMode: (mode: RequestMode) => void;
  setModel: (model: ModelName) => void;
  isConfigured: () => boolean;
  clear: () => void;
};

export const apiConfig: ApiConfig = {
  getUrl: () => localStorage.getItem(API_URL_KEY) || '',
  getKey: () => localStorage.getItem(API_KEY_KEY) || '',
  getType: () => (localStorage.getItem(API_TYPE_KEY) as ApiType) || 'gemini',
  getRequestMode: () => (localStorage.getItem(REQUEST_MODE_KEY) as RequestMode) || 'client',
  getModel: () => (localStorage.getItem(STORAGE_KEY_MODEL) as ModelName) || DEFAULT_MODEL,
  setUrl: (url: string) => localStorage.setItem(API_URL_KEY, url),
  setKey: (key: string) => localStorage.setItem(API_KEY_KEY, key),
  setType: (type: ApiType) => localStorage.setItem(API_TYPE_KEY, type),
  setRequestMode: (mode: RequestMode) => localStorage.setItem(REQUEST_MODE_KEY, mode),
  setModel: (model: ModelName) => localStorage.setItem(STORAGE_KEY_MODEL, model),
  isConfigured: () => !!(localStorage.getItem(API_URL_KEY) && localStorage.getItem(API_KEY_KEY)),
  clear: () => {
    localStorage.removeItem(API_URL_KEY);
    localStorage.removeItem(API_KEY_KEY);
    localStorage.removeItem(API_TYPE_KEY);
    localStorage.removeItem(REQUEST_MODE_KEY);
    localStorage.removeItem(STORAGE_KEY_MODEL);
  },
};
