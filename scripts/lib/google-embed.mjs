export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_OUTPUT_DIMENSIONALITY = 768;

function l2Normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export function normalizeEmbedding(values) {
  if (EMBEDDING_OUTPUT_DIMENSIONALITY < 3072) {
    return l2Normalize(values);
  }
  return values;
}

export function isValidGoogleKey(key) {
  const trimmed = key.trim();
  return (
    (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) &&
    trimmed.length >= 20
  );
}

export async function embedBatchGoogle(apiKey, texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY,
        })),
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API failed (${response.status}): ${err}`);
  }

  const json = await response.json();
  const embeddings = json.embeddings;
  if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
    throw new Error('Embedding API returned an unexpected response.');
  }

  return embeddings.map((item) => normalizeEmbedding(item.values ?? []));
}
