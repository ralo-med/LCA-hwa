import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CHAT_MODELS,
  formatModelPrice,
  getChatModel,
  getDefaultChatModel,
  PROVIDER_LABELS,
  type LlmProvider,
} from '@/lib/llm-models';
import {
  canUseModel,
  isFreeTierModel,
  isOpenAIAvailable,
  isValidApiKey,
  loadLlmSettings,
  saveLlmSettings,
  subscribeLlmSettings,
} from '@/lib/llm-settings';

export function useLlmSettings() {
  const [selectedModelId, setSelectedModelId] = useState(
    () => loadLlmSettings().selectedModelId,
  );
  const [apiKeys, setApiKeys] = useState(
    () => loadLlmSettings().apiKeys,
  );
  const syncingFromStorage = useRef(false);

  useEffect(() => {
    if (syncingFromStorage.current) {
      syncingFromStorage.current = false;
      return;
    }
    saveLlmSettings({ selectedModelId, apiKeys });
  }, [selectedModelId, apiKeys]);

  useEffect(() => {
    return subscribeLlmSettings(() => {
      syncingFromStorage.current = true;
      const stored = loadLlmSettings();
      setSelectedModelId(stored.selectedModelId);
      setApiKeys(stored.apiKeys);
    });
  }, []);

  const selectedModel = useMemo(
    () => getChatModel(selectedModelId),
    [selectedModelId],
  );

  const canUseSelectedModel = useMemo(
    () => canUseModel(selectedModelId, apiKeys),
    [selectedModelId, apiKeys],
  );

  const isFreeTier = useMemo(
    () => isFreeTierModel(selectedModelId, apiKeys),
    [selectedModelId, apiKeys],
  );

  const setApiKey = useCallback((provider: LlmProvider, value: string) => {
    setApiKeys((prev) => {
      const trimmed = value.trim();
      const next = { ...prev };
      if (!trimmed) {
        delete next[provider];
      } else {
        next[provider] = trimmed;
      }
      return next;
    });
  }, []);

  const isChatReady = canUseSelectedModel;
  const openAiAvailable = isOpenAIAvailable();

  const providerStatus = useMemo(
    () =>
      (['openai', 'google', 'anthropic'] as LlmProvider[]).map((provider) => ({
        provider,
        label: PROVIDER_LABELS[provider],
        configured: isValidApiKey(provider, apiKeys[provider] ?? ''),
      })),
    [apiKeys],
  );

  return {
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    selectedModelPrice: formatModelPrice(selectedModel),
    chatModels: CHAT_MODELS,
    apiKeys,
    setApiKey,
    isChatReady,
    canUseSelectedModel,
    isFreeTier,
    defaultModel: getDefaultChatModel(),
    openAiAvailable,
    providerStatus,
  };
}
