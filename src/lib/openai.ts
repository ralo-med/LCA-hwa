import { API_KEY, isOpenAIConfigured } from '@/constants';

const BASE_URL = 'https://api.openai.com/v1';

export const OPENAI_KEY_MISSING_MSG =
  'OpenAI API 키가 없습니다. 프로젝트 루트 .env 파일에 VITE_OPENAI_API_KEY를 설정한 뒤 개발 서버를 다시 실행해 주세요.';

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

export async function callOpenAIChat(
  messages: OpenAIChatMessage[],
  model: string,
  retries: number = 5,
  options: OpenAIChatOptions = {},
): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new OpenAINotConfiguredError();
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          ...(options.maxTokens != null ? { max_tokens: options.maxTokens } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? '';
      }

      if (i === retries) {
        throw new Error(`OpenAI API failed (${response.status})`);
      }
      await new Promise<void>((r) => setTimeout(r, Math.pow(2, i) * 1000));
    } catch (err) {
      if (i === retries) throw err;
    }
  }

  return '';
}

export async function callOpenAIEmbed(text: string, model: string): Promise<number[]> {
  if (!isOpenAIConfigured()) {
    throw new OpenAINotConfiguredError();
  }

  const response = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) throw new Error('임베딩 생성에 실패했습니다.');

  const json = await response.json();
  return json.data[0].embedding as number[];
}

export async function callOpenAITTS(
  text: string,
  model: string,
  voice: string,
): Promise<Blob> {
  if (!isOpenAIConfigured()) {
    throw new OpenAINotConfiguredError();
  }

  const response = await fetch(`${BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, voice, input: text }),
  });

  if (!response.ok) throw new Error('TTS 생성에 실패했습니다.');
  return response.blob();
}
