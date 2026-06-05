import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModel,
  type LlmProvider,
} from '@/lib/llm-models';

const STORAGE_KEY = 'lca-llm-settings';
const CHANGE_EVENT = 'lca-llm-settings-change';

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
      return trimmed.startsWith('AIza') && trimmed.length >= 20;
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
    return {
      selectedModelId: parsed.selectedModelId ?? DEFAULT_CHAT_MODEL_ID,
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

  // 무료 기본 모드: 서버 .env OpenAI 키만 사용
  if (provider === 'openai' && !hasCustomApiKey()) {
    return getEnvOpenAIKey();
  }

  return '';
}

export function isProviderConfigured(provider: LlmProvider): boolean {
  return getApiKey(provider).length > 0;
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

  // 무료: 기본 OpenAI 모델만 서버 키로 사용
  if (
    !hasCustomApiKey(apiKeys) &&
    modelId === DEFAULT_CHAT_MODEL_ID &&
    getEnvOpenAIKey()
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
    model.provider === 'openai' &&
    !hasCustomApiKey(apiKeys) &&
    modelId === DEFAULT_CHAT_MODEL_ID
  ) {
    return getEnvOpenAIKey();
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
