import { getChatModel, type LlmProvider } from '@/lib/llm-models';
import { buildOpenAiTokenLimit } from '@/lib/openai';
import { canUseModel, getApiKeyForModel } from '@/lib/llm-settings';

export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmChatOptions {
  maxTokens?: number;
  retries?: number;
}

export class LlmNotConfiguredError extends Error {
  readonly provider: LlmProvider;

  constructor(provider: LlmProvider) {
    super(`LLM_NOT_CONFIGURED:${provider}`);
    this.name = 'LlmNotConfiguredError';
    this.provider = provider;
  }
}

export function chatKeyMissingMessage(provider: LlmProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI API 키가 없습니다. 설정에서 키를 입력해 주세요.';
    case 'google':
      return 'Google AI API 키가 없습니다. 설정에서 Gemini용 키를 입력해 주세요.';
    case 'anthropic':
      return 'Anthropic API 키가 없습니다. 설정에서 Claude용 키를 입력해 주세요.';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function callLlmChat(
  messages: LlmChatMessage[],
  modelId: string,
  options: LlmChatOptions = {},
): Promise<string> {
  const model = getChatModel(modelId);
  const retries = options.retries ?? 3;

  if (!canUseModel(modelId)) {
    throw new LlmNotConfiguredError(model.provider);
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const text = await dispatchChat(model.id, messages, options);
      return text;
    } catch (err) {
      if (err instanceof LlmNotConfiguredError) throw err;
      if (i === retries) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }

  return '';
}

async function dispatchChat(
  modelId: string,
  messages: LlmChatMessage[],
  options: LlmChatOptions,
): Promise<string> {
  const provider = getChatModel(modelId).provider;
  switch (provider) {
    case 'openai':
      return callOpenAI(modelId, messages, options);
    case 'google':
      return callGemini(modelId, messages, options);
    case 'anthropic':
      return callAnthropic(modelId, messages, options);
  }
}

async function callOpenAI(
  model: string,
  messages: LlmChatMessage[],
  options: LlmChatOptions,
): Promise<string> {
  const apiKey = getApiKeyForModel(model);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(options.maxTokens != null
        ? buildOpenAiTokenLimit(model, options.maxTokens)
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(
  model: string,
  messages: LlmChatMessage[],
  options: LlmChatOptions,
): Promise<string> {
  const apiKey = getApiKeyForModel(model);
  const systemText = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemText
          ? { systemInstruction: { parts: [{ text: systemText }] } }
          : {}),
        contents,
        generationConfig: {
          ...(options.maxTokens != null
            ? { maxOutputTokens: options.maxTokens }
            : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API failed (${response.status})`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: { text?: string }) => p.text ?? '').join('');
}

async function callAnthropic(
  model: string,
  messages: LlmChatMessage[],
  options: LlmChatOptions,
): Promise<string> {
  const apiKey = getApiKeyForModel(model);
  const systemText = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1600,
      ...(systemText ? { system: systemText } : {}),
      messages: chatMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API failed (${response.status})`);
  }

  const data = await response.json();
  const block = data.content?.find(
    (c: { type: string }) => c.type === 'text',
  );
  return block?.text ?? '';
}
