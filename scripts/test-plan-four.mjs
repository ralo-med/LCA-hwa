/**
 * 4종 제안 질문 — planChatResponse 가이드라인 RAG 경로 검증
 * node scripts/test-plan-four.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, '');
process.env.VITE_OPENAI_API_KEY = env.VITE_OPENAI_API_KEY ?? '';

const json = fs.readFileSync(path.join(ROOT, 'public/data/guide-chunks.json'), 'utf8');
const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (url, init) => {
  if (String(url).includes('guide-chunks.json')) {
    return new Response(json, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return nativeFetch(url, init);
};

const { planChatResponse } = await import('../src/lib/rag.ts');

const QUESTIONS = [
  '항암치료 부작용은 어떻게 관리하나요?',
  '소세포폐암 치료 과정을 알려주세요.',
  '전이성 폐암에서 일상생활 시 주의할 점은?',
  '영양·식이 관리는 어떻게 해야 하나요?',
];

const ctx = {
  profile: {
    age: 60,
    gender: 'female',
    histology: 'adenocarcinoma',
    selectedMutations: ['none'],
    pdl1: 'unknown',
  },
};

let fail = 0;
for (const q of QUESTIONS) {
  const plan = await planChatResponse(q, ctx, [], 'auto');
  const ok = plan.fromGuidelineRag && plan.citations.length > 0;
  console.log(`\nQ: ${q}`);
  console.log(`  RAG: ${plan.fromGuidelineRag} | cites: ${plan.citations.length}`);
  if (ok) {
    plan.citations.forEach((c) =>
      console.log(`  ✓ ${c.fileName} p.${c.page}`),
    );
    console.log('  ✅ PASS');
  } else {
    console.log('  ❌ FAIL (일반 안내 경로)');
    fail++;
  }
}

console.log(`\n=== ${QUESTIONS.length - fail}/${QUESTIONS.length} RAG PASS ===`);
process.exit(fail ? 1 : 0);
