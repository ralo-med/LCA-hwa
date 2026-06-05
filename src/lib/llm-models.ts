export type LlmProvider = 'openai' | 'google' | 'anthropic';

export interface ChatModelOption {
  id: string;
  provider: LlmProvider;
  label: string;
  /** USD per 1M input tokens */
  inputPricePerM: number;
  /** USD per 1M output tokens */
  outputPricePerM: number;
}

export const PROVIDER_LABELS: Record<LlmProvider, string> = {
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  anthropic: 'Anthropic (Claude)',
};

export const CHAT_MODELS: ChatModelOption[] = [
  // OpenAI — GPT 5.x
  {
    id: 'gpt-5.5',
    provider: 'openai',
    label: 'GPT-5.5',
    inputPricePerM: 5,
    outputPricePerM: 30,
  },
  {
    id: 'gpt-5.5-pro',
    provider: 'openai',
    label: 'GPT-5.5 Pro',
    inputPricePerM: 30,
    outputPricePerM: 180,
  },
  {
    id: 'gpt-5.4',
    provider: 'openai',
    label: 'GPT-5.4',
    inputPricePerM: 2.5,
    outputPricePerM: 15,
  },
  {
    id: 'gpt-5.4-mini',
    provider: 'openai',
    label: 'GPT-5.4 mini',
    inputPricePerM: 0.75,
    outputPricePerM: 4.5,
  },
  {
    id: 'gpt-5.4-nano',
    provider: 'openai',
    label: 'GPT-5.4 nano',
    inputPricePerM: 0.2,
    outputPricePerM: 1.25,
  },
  // Google — Gemini 3.x / 2.5
  {
    id: 'gemini-3.1-pro-preview',
    provider: 'google',
    label: 'Gemini 3.1 Pro',
    inputPricePerM: 2,
    outputPricePerM: 12,
  },
  {
    id: 'gemini-3.5-flash',
    provider: 'google',
    label: 'Gemini 3.5 Flash',
    inputPricePerM: 1.5,
    outputPricePerM: 9,
  },
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'google',
    label: 'Gemini 3.1 Flash-Lite',
    inputPricePerM: 0.25,
    outputPricePerM: 1.5,
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    label: 'Gemini 2.5 Pro',
    inputPricePerM: 1.25,
    outputPricePerM: 10,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    label: 'Gemini 2.5 Flash',
    inputPricePerM: 0.3,
    outputPricePerM: 2.5,
  },
  {
    id: 'gemini-2.5-flash-lite',
    provider: 'google',
    label: 'Gemini 2.5 Flash-Lite',
    inputPricePerM: 0.1,
    outputPricePerM: 0.4,
  },
  // Anthropic — Claude 4.x
  {
    id: 'claude-opus-4-8',
    provider: 'anthropic',
    label: 'Claude Opus 4.8',
    inputPricePerM: 5,
    outputPricePerM: 25,
  },
  {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    label: 'Claude Sonnet 4.6',
    inputPricePerM: 3,
    outputPricePerM: 15,
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    label: 'Claude Haiku 4.5',
    inputPricePerM: 1,
    outputPricePerM: 5,
  },
];

export const DEFAULT_CHAT_MODEL_ID = 'gpt-5.4-nano';

export function getChatModel(id: string): ChatModelOption {
  return (
    CHAT_MODELS.find((m) => m.id === id) ??
    CHAT_MODELS.find((m) => m.id === DEFAULT_CHAT_MODEL_ID)!
  );
}

function fmtPrice(n: number): string {
  return n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export function formatModelPrice(model: ChatModelOption): string {
  return `input ${fmtPrice(model.inputPricePerM)} · output ${fmtPrice(model.outputPricePerM)} per 1M tokens`;
}

/** 드롭다운 항목용 가격 표기 (단위는 UI에서 한 번만 표시) */
export function formatModelPriceShort(model: ChatModelOption): string {
  return `input ${fmtPrice(model.inputPricePerM)} · output ${fmtPrice(model.outputPricePerM)}`;
}

export function getDefaultChatModel(): ChatModelOption {
  return getChatModel(DEFAULT_CHAT_MODEL_ID);
}
