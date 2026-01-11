// 简化版配置 - API Key 和 URL 由后端 Worker 管理

const GEMINI_MODEL_KEY = 'gemini_model';
const OPENAI_MODEL_KEY = 'openai_model';
const OPENAI_MODEL_LIST_KEY = 'openai_model_list';
const API_TYPE_KEY = 'api_type';

export const OPENAI_PRESET_MODELS = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-preview-image-generation',
] as const;

export type GeminiModelName = string;
export type OpenAIModelName = string;
export type ModelName = string;
export type ApiType = 'gemini' | 'openai';

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-exp-image-generation';
const DEFAULT_OPENAI_MODEL = 'gemini-2.0-flash-exp-image-generation';

const isApiType = (value: unknown): value is ApiType => value === 'gemini' || value === 'openai';

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const normalizeModelName = (model: string): string => model.trim();

const normalizeModelList = (list: unknown): string[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
};

const tryReadOpenAIModelList = (): { ok: boolean; list: string[] } => {
  const raw = safeGetItem(OPENAI_MODEL_LIST_KEY);
  if (!raw) return { ok: true, list: [] };

  try {
    return { ok: true, list: normalizeModelList(JSON.parse(raw)) };
  } catch {
    return { ok: false, list: [] };
  }
};

const getGeminiModel = (): GeminiModelName => {
  const model = safeGetItem(GEMINI_MODEL_KEY);
  const normalized = model ? normalizeModelName(model) : '';
  return normalized || DEFAULT_GEMINI_MODEL;
};

const setGeminiModel = (model: string): void => {
  const normalized = normalizeModelName(model);
  if (!normalized) return;
  safeSetItem(GEMINI_MODEL_KEY, normalized);
};

const getOpenAIModelList = (): string[] => {
  const { list } = tryReadOpenAIModelList();
  return list.length > 0 ? list : [...OPENAI_PRESET_MODELS];
};

const setOpenAIModelList = (models: string[]): boolean => {
  return safeSetItem(OPENAI_MODEL_LIST_KEY, JSON.stringify(models));
};

const addOpenAIModel = (model: string): void => {
  const normalized = normalizeModelName(model);
  if (!normalized) return;

  const list = getOpenAIModelList();
  if (list.includes(normalized)) return;

  setOpenAIModelList([...list, normalized]);
};

const removeOpenAIModel = (model: string): void => {
  const normalized = normalizeModelName(model);
  if (!normalized) return;

  const list = getOpenAIModelList();
  const nextList = list.filter((item) => item !== normalized);
  setOpenAIModelList(nextList);

  const currentModel = safeGetItem(OPENAI_MODEL_KEY)?.trim();
  if (currentModel && currentModel === normalized) {
    const fallback = nextList[0] || DEFAULT_OPENAI_MODEL;
    safeSetItem(OPENAI_MODEL_KEY, fallback);
  }
};

const updateOpenAIModel = (oldModel: string, newModel: string): void => {
  const oldNormalized = normalizeModelName(oldModel);
  const newNormalized = normalizeModelName(newModel);
  if (!oldNormalized || !newNormalized) return;

  const list = getOpenAIModelList();
  if (!list.includes(oldNormalized)) return;

  const nextList: string[] = [];
  for (const item of list) {
    const nextItem = item === oldNormalized ? newNormalized : item;
    if (nextList.includes(nextItem)) continue;
    nextList.push(nextItem);
  }

  setOpenAIModelList(nextList);

  const currentModel = safeGetItem(OPENAI_MODEL_KEY)?.trim();
  if (currentModel && currentModel === oldNormalized) {
    safeSetItem(OPENAI_MODEL_KEY, newNormalized);
  }
};

const getOpenAIModel = (): OpenAIModelName => {
  const model = safeGetItem(OPENAI_MODEL_KEY);
  const normalized = model ? normalizeModelName(model) : '';
  if (normalized) return normalized;

  const list = getOpenAIModelList();
  return list[0] || DEFAULT_OPENAI_MODEL;
};

const setOpenAIModel = (model: string): void => {
  const normalized = normalizeModelName(model);
  if (!normalized) return;
  safeSetItem(OPENAI_MODEL_KEY, normalized);
};

export type ApiConfig = {
  getType: () => ApiType;
  setType: (type: ApiType) => void;

  getGeminiModel: () => GeminiModelName;
  setGeminiModel: (model: string) => void;

  getOpenAIModel: () => OpenAIModelName;
  setOpenAIModel: (model: string) => void;

  getOpenAIModelList: () => string[];
  addOpenAIModel: (model: string) => void;
  removeOpenAIModel: (model: string) => void;
  updateOpenAIModel: (oldModel: string, newModel: string) => void;

  getModel: () => ModelName;
  setModel: (model: ModelName) => void;

  // 始终返回 true，因为不再需要用户配置
  isConfigured: () => boolean;
  clear: () => void;
};

export const apiConfig: ApiConfig = {
  getType: () => {
    const stored = safeGetItem(API_TYPE_KEY);
    return isApiType(stored) ? stored : 'gemini';
  },
  setType: (type: ApiType) => {
    safeSetItem(API_TYPE_KEY, type);
  },

  getGeminiModel,
  setGeminiModel,

  getOpenAIModel,
  setOpenAIModel,

  getOpenAIModelList,
  addOpenAIModel,
  removeOpenAIModel,
  updateOpenAIModel,

  getModel: () => (apiConfig.getType() === 'openai' ? getOpenAIModel() : getGeminiModel()),
  setModel: (model: ModelName) => {
    if (apiConfig.getType() === 'openai') {
      setOpenAIModel(model);
      return;
    }
    setGeminiModel(model);
  },

  isConfigured: () => true,
  clear: () => {
    safeRemoveItem(API_TYPE_KEY);
    safeRemoveItem(GEMINI_MODEL_KEY);
    safeRemoveItem(OPENAI_MODEL_KEY);
    safeRemoveItem(OPENAI_MODEL_LIST_KEY);
  },
};
