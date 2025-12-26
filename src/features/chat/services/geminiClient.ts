import { apiConfig } from '../utils/apiConfig';
import { DEFAULT_REQUEST_TIMEOUT_MS, requestWithMode } from './request';

import type {
  GeminiContentPart,
  GeminiInlineData,
  GeminiInlineDataInput,
  GeminiMessage,
  GeminiRequestPayload,
  GeminiResponse,
  GeminiResult,
} from '@/types/gemini';

const buildModelPath = (model: string): string => `/v1beta/models/${model}:generateContent`;

export class GeminiClientError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown; cause?: unknown } = {}) {
    super(message);
    this.name = 'GeminiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
  }
}

type GeminiCallParams = {
  prompt: string;
  history?: GeminiMessage[];
  images?: GeminiInlineDataInput[];
  aspectRatio?: string;
  imageSize?: string;
  includeThinking?: boolean;
  useSearch?: boolean;
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');

const getModelPath = (): string => {
  const model = apiConfig.getGeminiModel().trim();
  return buildModelPath(model || 'gemini-3-pro-image-preview');
};

const cloneHistory = (history: GeminiMessage[] = []): GeminiMessage[] =>
  history.map((message) => ({
    role: message.role,
    parts: message.parts.map((part) => {
      const inlineData = part.inline_data || part.inlineData;
      return {
        ...(part.text ? { text: part.text } : {}),
        ...(inlineData ? { inline_data: inlineData } : {}),
        ...(part.thought ? { thought: part.thought } : {}),
      };
    }),
  }));

const buildUserMessage = (prompt: string, images: GeminiInlineDataInput[] = []): GeminiMessage => {
  const parts: GeminiContentPart[] = [{ text: prompt }];
  images.forEach(({ data, mimeType }) => {
    if (!data) return;
    const inlineData: GeminiInlineData = {
      mime_type: mimeType || 'image/png',
      data,
    };
    parts.push({ inline_data: inlineData });
  });

  return { role: 'user', parts };
};

const getInlineData = (part?: GeminiContentPart): GeminiInlineData | undefined =>
  part?.inline_data || part?.inlineData;

const extractText = (response: GeminiResponse): string => {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const textSegments = parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text as string);

  return textSegments.length > 0 ? textSegments.join('\n\n') : '';
};

const extractImageData = (response: GeminiResponse): string | null => {
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inlineData = getInlineData(part);
    if (inlineData?.data) {
      return inlineData.data;
    }
  }
  return null;
};

const extractThinkingImages = (response: GeminiResponse): string[] => {
  const thinkingImages: string[] = [];
  const parts = response.candidates?.[0]?.content?.parts || [];
  parts.forEach((part) => {
    if (!part.thought) return;
    const inlineData = getInlineData(part);
    if (inlineData?.data) {
      thinkingImages.push(inlineData.data);
    }
  });
  return thinkingImages;
};

const buildAssistantMessageParts = (
  response: GeminiResponse,
  includeThinking: boolean
): { parts: GeminiContentPart[]; thinkingImages: string[]; textParts: Array<{ text: string; thought?: boolean }> } => {
  const parts: GeminiContentPart[] = [];
  const textParts: Array<{ text: string; thought?: boolean }> = [];
  const thinkingImages = includeThinking ? extractThinkingImages(response) : [];

  thinkingImages.forEach((image) => {
    parts.push({
      inline_data: { mime_type: 'image/png', data: image },
      thought: true,
    });
  });

  const candidateParts = response.candidates?.[0]?.content?.parts || [];
  candidateParts.forEach((part) => {
    const thought = part.thought ? true : undefined;

    if (part.text) {
      const textPart = { text: part.text, ...(thought ? { thought } : {}) };
      parts.push(textPart);
      textParts.push(textPart);
      return;
    }
    const inlineData = getInlineData(part);
    if (inlineData) {
      parts.push({ inline_data: inlineData, ...(thought ? { thought } : {}) });
    }
  });

  return { parts, thinkingImages, textParts };
};

const toGeminiError = (status: number, body: unknown): GeminiClientError => {
  if (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)) {
    const payload = (body as { error?: { message?: string; status?: string; code?: string } }).error;
    const message = payload?.message || '请求失败';
    return new GeminiClientError(message, {
      status,
      code: payload?.status || payload?.code,
      details: body,
    });
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return new GeminiClientError(body, { status, details: body });
  }

  return new GeminiClientError('请求失败', { status, details: body });
};

const parseResponse = async (response: Response): Promise<GeminiResponse> => {
  const text = await response.text();

  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw toGeminiError(response.status, parsed);
  }

  return (parsed || {}) as GeminiResponse;
};

const requestGemini = async (payload: GeminiRequestPayload, apiKey: string, baseUrl: string): Promise<GeminiResponse> => {
  try {
    const response = await requestWithMode({
      url: `${normalizeBaseUrl(baseUrl)}${getModelPath()}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: payload,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    });

    return parseResponse(response);
  } catch (error) {
    if (error instanceof GeminiClientError) {
      throw error;
    }
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      throw new GeminiClientError('请求超时（已等待 20 分钟）', { details: error });
    }
    throw new GeminiClientError('网络请求失败', { details: error });
  }
};

const callGeminiApi = async ({
  prompt,
  images = [],
  history = [],
  aspectRatio = '1:1',
  imageSize = '2K',
  includeThinking = false,
  useSearch = false,
}: GeminiCallParams): Promise<GeminiResult> => {
  const baseUrl = apiConfig.getUrl();
  const apiKey = apiConfig.getKey();

  if (!baseUrl || !apiKey) {
    throw new GeminiClientError('请先配置 API URL 和 Key');
  }

  const safeHistory = cloneHistory(history);
  const userMessage = buildUserMessage(prompt, images);
  const contents = [...safeHistory, userMessage];

  const payload: GeminiRequestPayload = {
    contents,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  if (useSearch) {
    payload.tools = [{ google_search: {} }];
  }

  const response = await requestGemini(payload, apiKey, baseUrl);
  const { parts, thinkingImages, textParts } = buildAssistantMessageParts(response, includeThinking);

  const updatedHistory: GeminiMessage[] =
    parts.length > 0 ? [...contents, { role: 'model', parts }] : contents;

  return {
    text: extractText(response),
    parts: textParts,
    imageData: extractImageData(response),
    thinkingImages,
    groundingMetadata: response.groundingMetadata,
    history: updatedHistory,
  };
};

export const geminiClient = {
  generateImage: ({
    prompt,
    aspectRatio,
    imageSize,
    includeThinking,
    history,
  }: Omit<GeminiCallParams, 'images' | 'useSearch'>) =>
    callGeminiApi({ prompt, aspectRatio, imageSize, includeThinking, history }),

  editImage: ({
    imageData,
    editPrompt,
    aspectRatio,
    imageSize,
    includeThinking,
    history,
  }: {
    imageData: string;
    editPrompt: string;
  } & Omit<GeminiCallParams, 'prompt' | 'images' | 'useSearch'>) =>
    callGeminiApi({
      prompt: editPrompt,
      images: [{ data: imageData, mimeType: 'image/png' }],
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    }),

  compositeImages: ({
    prompt,
    imageDataList,
    aspectRatio,
    imageSize,
    includeThinking,
    history,
  }: {
    prompt: string;
    imageDataList: GeminiInlineDataInput[];
  } & Omit<GeminiCallParams, 'images' | 'useSearch'>) =>
    callGeminiApi({
      prompt,
      images: imageDataList,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
    }),

  generateWithSearch: ({
    prompt,
    aspectRatio,
    imageSize,
    includeThinking,
    history,
  }: Omit<GeminiCallParams, 'images' | 'useSearch'>) =>
    callGeminiApi({
      prompt,
      aspectRatio,
      imageSize,
      includeThinking,
      history,
      useSearch: true,
    }),
};
