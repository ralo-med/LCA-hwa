import { API_KEY } from '@/constants';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function callGemini(
  endpoint: string,
  payload: Record<string, unknown>,
  retries: number = 5,
): Promise<any> {
  const url = `${BASE_URL}/${endpoint}?key=${API_KEY}`;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) return await response.json();
      if (i === retries) throw new Error('API request failed after retries');
      await new Promise<void>((r) => setTimeout(r, Math.pow(2, i) * 1000));
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}

export function extractText(data: any): string {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export function extractInlineData(data: any): string | undefined {
  return data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
