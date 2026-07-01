import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModel,
  type LlmProvider,
} from '@/lib/llm-models';

const STORAGE_KEY = 'lca-llm-settings';
const CHANGE_EVENT = 'lca-llm-settings-change';
const LEGACY_DEFAULT_MODEL_IDS = new Set([
  'gpt-5.4-nano',
  'gemini-2.5-flash',
]);

function notifyChange(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeLlmSettings(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export interface LlmSettingsState {
  selectedModelId: string;
  apiKeys: Partial<Record<LlmProvider, string>>;
}

function isPlaceholderKey(key: string): boolean {
  return /^your_/i.test(key) || key.includes('your_openai');
}

export function isValidApiKey(provider: LlmProvider, key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || isPlaceholderKey(trimmed)) return false;
  switch (provider) {
    case 'openai':
      return trimmed.startsWith('sk-');
    case 'google':
      return (
        (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) &&
        trimmed.length >= 20
      );
    case 'anthropic':
      return trimmed.startsWith('sk-ant-');
    default:
      return false;
  }
}

export function loadLlmSettings(): LlmSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { selectedModelId: DEFAULT_CHAT_MODEL_ID, apiKeys: {} };
    }
    const parsed = JSON.parse(raw) as Partial<LlmSettingsState>;
    let selectedModelId = parsed.selectedModelId ?? DEFAULT_CHAT_MODEL_ID;
    if (LEGACY_DEFAULT_MODEL_IDS.has(selectedModelId)) {
      selectedModelId = DEFAULT_CHAT_MODEL_ID;
    }
    return {
      selectedModelId,
      apiKeys: parsed.apiKeys ?? {},
    };
  } catch {
    return { selectedModelId: DEFAULT_CHAT_MODEL_ID, apiKeys: {} };
  }
}

export function saveLlmSettings(state: LlmSettingsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notifyChange();
}

export function getStoredApiKey(provider: LlmProvider): string {
  const stored = loadLlmSettings().apiKeys[provider]?.trim() ?? '';
  return isValidApiKey(provider, stored) ? stored : '';
}

export function getEnvGoogleKey(): string {
  const env = import.meta.env.VITE_GOOGLE_API_KEY?.trim() ?? '';
  return isValidApiKey('google', env) ? env : '';
}

export function getEnvOpenAIKey(): string {
  const env = import.meta.env.VITE_OPENAI_API_KEY?.trim() ?? '';
  return isValidApiKey('openai', env) ? env : '';
}

export function hasCustomApiKey(
  apiKeys: Partial<Record<LlmProvider, string>> = loadLlmSettings().apiKeys,
): boolean {
  return (['openai', 'google', 'anthropic'] as LlmProvider[]).some((p) =>
    isValidApiKey(p, apiKeys[p] ?? ''),
  );
}

export function getApiKey(provider: LlmProvider): string {
  const stored = getStoredApiKey(provider);
  if (stored) return stored;

  if (!hasCustomApiKey()) {
    if (provider === 'google') return getEnvGoogleKey();
    // 벡터 검색 임베딩용 OpenAI 키
    if (provider === 'openai') return getEnvOpenAIKey();
  }

  return '';
}

export function isProviderConfigured(provider: LlmProvider): boolean {
  return getApiKey(provider).length > 0;
}

export function isGoogleAvailable(): boolean {
  if (getStoredApiKey('google')) return true;
  return getEnvGoogleKey().length > 0;
}

export function isOpenAIAvailable(): boolean {
  if (getStoredApiKey('openai')) return true;
  return getEnvOpenAIKey().length > 0;
}

/** 선택한 모델을 실제로 쓸 수 있는지 (유효한 API 키 보유) */
export function canUseModel(
  modelId: string,
  apiKeys: Partial<Record<LlmProvider, string>> = loadLlmSettings().apiKeys,
): boolean {
  const model = getChatModel(modelId);

  if (isValidApiKey(model.provider, apiKeys[model.provider] ?? '')) {
    return true;
  }

  // 무료: 기본 Gemini 모델은 서버 Google 키로 사용
  if (
    !hasCustomApiKey(apiKeys) &&
    modelId === DEFAULT_CHAT_MODEL_ID &&
    model.provider === 'google' &&
    getEnvGoogleKey()
  ) {
    return true;
  }

  return false;
}

export function getApiKeyForModel(modelId: string): string {
  const model = getChatModel(modelId);
  const apiKeys = loadLlmSettings().apiKeys;
  const stored = apiKeys[model.provider]?.trim() ?? '';

  if (isValidApiKey(model.provider, stored)) {
    return stored;
  }

  if (
    !hasCustomApiKey(apiKeys) &&
    modelId === DEFAULT_CHAT_MODEL_ID &&
    model.provider === 'google'
  ) {
    return getEnvGoogleKey();
  }

  return '';
}

export function isFreeTierModel(
  modelId: string,
  apiKeys: Partial<Record<LlmProvider, string>> = loadLlmSettings().apiKeys,
): boolean {
  return (
    !hasCustomApiKey(apiKeys) &&
    modelId === DEFAULT_CHAT_MODEL_ID &&
    canUseModel(modelId, apiKeys)
  );
}
