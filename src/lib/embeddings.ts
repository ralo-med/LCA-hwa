import { EMBEDDING_MODEL } from '@/constants';
import { getApiKey, isGoogleAvailable } from '@/lib/llm-settings';

export const EMBEDDING_OUTPUT_DIMENSIONALITY = 768;

type EmbedTaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';

export class EmbeddingNotConfiguredError extends Error {
  constructor() {
    super('GOOGLE_API_KEY_MISSING');
    this.name = 'EmbeddingNotConfiguredError';
  }
}

function l2Normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function normalizeEmbedding(values: number[]): number[] {
  if (EMBEDDING_OUTPUT_DIMENSIONALITY < 3072) {
    return l2Normalize(values);
  }
  return values;
}

async function callGoogleEmbed(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const apiKey = getApiKey('google');
  if (!apiKey) throw new EmbeddingNotConfiguredError();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('임베딩 생성에 실패했습니다.');
  }

  const data = (await response.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values?.length) {
    throw new Error('임베딩 생성에 실패했습니다.');
  }
  return normalizeEmbedding(values);
}

export function isEmbeddingAvailable(): boolean {
  return isGoogleAvailable();
}

export async function embedQueryText(text: string): Promise<number[]> {
  if (!isGoogleAvailable()) throw new EmbeddingNotConfiguredError();
  return callGoogleEmbed(text, 'RETRIEVAL_QUERY');
}
