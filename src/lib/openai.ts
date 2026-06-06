import { getApiKey, isOpenAIAvailable } from '@/lib/llm-settings';
import { resolveOpenAiTokenLimitKey } from '@/lib/llm-models';

const BASE_URL = 'https://api.openai.com/v1';

export const OPENAI_KEY_MISSING_MSG =
  'OpenAI API 키가 없습니다. 챗봇 설정에서 키를 입력하거나 .env에 VITE_OPENAI_API_KEY를 설정해 주세요.';

export class OpenAINotConfiguredError extends Error {
  constructor() {
    super('OPENAI_API_KEY_MISSING');
    this.name = 'OpenAINotConfiguredError';
  }
}

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatOptions {
  maxTokens?: number;
}

/** @deprecated resolveOpenAiTokenLimitKey 사용 */
export function openAiUsesMaxCompletionTokens(model: string): boolean {
  return resolveOpenAiTokenLimitKey(model) === 'max_completion_tokens';
}

export function buildOpenAiTokenLimit(
  model: string,
  maxTokens: number,
): Record<string, number> {
  const key = resolveOpenAiTokenLimitKey(model);
  return { [key]: maxTokens };
}

async function readOpenAIErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string };
    };
    return data.error?.message?.trim() ?? '';
  } catch {
    return '';
  }
}

export async function callOpenAIChat(
  messages: OpenAIChatMessage[],
  model: string,
  retries: number = 5,
  options: OpenAIChatOptions = {},
): Promise<string> {
  if (!isOpenAIAvailable()) {
    throw new OpenAINotConfiguredError();
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getApiKey('openai')}`,
        },
        body: JSON.stringify({
          model,
          messages,
          ...(options.maxTokens != null
            ? buildOpenAiTokenLimit(model, options.maxTokens)
            : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? '';
      }

      if (i === retries) {
        const detail = await readOpenAIErrorMessage(response);
        throw new Error(
          detail
            ? `OpenAI API failed (${response.status}): ${detail}`
            : `OpenAI API failed (${response.status})`,
        );
      }
      await new Promise<void>((r) => setTimeout(r, Math.pow(2, i) * 1000));
    } catch (err) {
      if (i === retries) throw err;
    }
  }

  return '';
}

export async function callOpenAIEmbed(text: string, model: string): Promise<number[]> {
  if (!isOpenAIAvailable()) {
    throw new OpenAINotConfiguredError();
  }

  const response = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey('openai')}`,
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) throw new Error('임베딩 생성에 실패했습니다.');

  const json = await response.json();
  return json.data[0].embedding as number[];
}
