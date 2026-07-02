import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { GuidePatientContext } from '@/lib/guide-patient-context';
import { callLlmChat, LlmNotConfiguredError } from '@/lib/llm-client';
import { DEFAULT_CHAT_MODEL_ID } from '@/lib/llm-models';
import { canUseModel } from '@/lib/llm-settings';
import { DEFAULT_PATIENT_PROFILE } from '@/lib/patient-profile';
import {
  isDrugCatalogOrMonographText,
  isEmotionalSupportQuery,
  isSurvivalDashboardQuery,
  isTreatmentProgramText,
  planChatResponse,
  shouldSearchGuidelines,
  stripDefensiveClosing,
} from '@/lib/rag';
import type { GuideSearchMode } from '@/types';

const ROOT = path.resolve(import.meta.dirname, '../..');
const chunksJson = fs.readFileSync(
  path.join(ROOT, 'public/data/guide-chunks.json'),
  'utf8');

const ctx: GuidePatientContext = { profile: DEFAULT_PATIENT_PROFILE };

type ExpectedRoute = 'rag' | 'general' | 'emotional' | 'chitchat' | 'survival';

interface QCase {
  id: string;
  question: string;
  mode?: GuideSearchMode;
  expect: {
    route: ExpectedRoute;
    searchGuidelines?: boolean;
    minCites?: number;
    citeFile?: RegExp;
    forbidCitePages?: number[];
    forbidExcerpt?: RegExp;
    forbidAnswer?: RegExp;
    requireAnswer?: RegExp;
  };
}

/** UI 추천 질문 + 회귀 케이스 */
const CASES: QCase[] = [
  {
    id: 'suggest-side-effects',
    question: '항암치료 부작용은 어떻게 관리하나요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /어떤\s*약제인가요|아트로핀|유지요법|치료\s*이득|Q\s*9[3-4]/i,
      forbidAnswer: /이리노테칸|아트로핀|유지요법|치료\s*이득과\s*독성|표적치료제는\s*부작용이\s*적/i,
      requireAnswer: /부작용|오심|구토|감염|병원|알려주/i,
    },
  },
  {
    id: 'side-effect-list',
    question: '부작용이 어떤것들이 있어요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /유지요법|치료\s*이득|독성이\s*항암|몇\s*번\s*하나요|Q\s*9[3-4]/i,
      forbidAnswer: /유지요법|치료\s*이득과\s*독성|표적치료제는\s*부작용이\s*적/i,
      requireAnswer: /오심|구토|설사|탈모|피로|감염|백혈구|빈혈/i,
    },
  },
  {
    id: 'side-effect-list-followup',
    question: '부작용이 어떤것들이 있냐고',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /유지요법|치료\s*이득|Q\s*9[3-4]/i,
    },
  },
  {
    id: 'suggest-anxiety',
    question: '진단을 받고 마음이 너무 불안해요.',
    mode: 'chat',
    expect: { route: 'emotional', searchGuidelines: false },
  },
  {
    id: 'suggest-nutrition',
    question: '먹어도 되는 음식과 피할 음식이 궁금해요.',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [38, 130, 132],
      forbidExcerpt: /석면|ALK|면역관문|Contents\b|NCCN Foundation gratefully/i,
    },
  },
  {
    id: 'suggest-family',
    question: '가족으로서 어떻게 도와줄 수 있을까요?',
    mode: 'chat',
    expect: {
      route: 'general',
      searchGuidelines: true,
    },
  },
  {
    id: 'auto-sclc-treatment',
    question: '소세포폐암 치료 과정을 알려주세요.',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /Presented with support|NCCN\.org\/patientguidelines/i,
    },
  },
  {
    id: 'auto-daily-living',
    question: '전이성 폐암에서 일상생활 시 주의할 점은?',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /cause of concerning symptoms/i,
    },
  },
  {
    id: 'auto-nutrition',
    question: '영양·식이 관리는 어떻게 해야 하나요?',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidExcerpt: /registered dietitian/i,
    },
  },
  {
    id: 'drug-specific-irinotecan',
    question: '이리노테칸 부작용은 어떻게 관리하나요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      requireAnswer: /설사|이리노|구토|오심/i,
    },
  },
  {
    id: 'survival-rate',
    question: '제 5년 생존율은 얼마나 되나요?',
    mode: 'chat',
    expect: { route: 'survival', searchGuidelines: false },
  },
  {
    id: 'chitchat-greeting',
    question: '안녕하세요',
    mode: 'chat',
    expect: { route: 'chitchat', searchGuidelines: false },
  },
];

function resolveRoute(plan: Awaited<ReturnType<typeof planChatResponse>>): ExpectedRoute {
  if (plan.fromSurvivalDashboard) return 'survival';
  if (plan.fromGuidelineRag) return 'rag';
  if (!plan.searchedGuidelines) {
    const q = plan.retrievalQuery;
    if (isEmotionalSupportQuery(q)) return 'emotional';
    return 'chitchat';
  }
  return 'general';
}

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
  }

  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('guide-chunks.json')) {
      return new Response(chunksJson, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return nativeFetch(input, init);
  };
});

describe('guide chat QA — plan & citations', () => {
  it.each(CASES)('$id — routing & citations', async (item) => {
    const mode = item.mode ?? 'chat';
    const plan = await planChatResponse(item.question, ctx, [], mode);
    const route = resolveRoute(plan);

    if (item.expect.searchGuidelines != null) {
      expect(shouldSearchGuidelines(item.question, mode, [])).toBe(
        item.expect.searchGuidelines,
      );
    }

    expect(route).toBe(item.expect.route);

    if (process.env.DEBUG_QA === '1') {
      console.log(item.id, route, plan.citations.map((c) => `p${c.page}`));
    }

    if (item.expect.minCites != null && route === 'rag') {
      expect(plan.citations.length).toBeGreaterThanOrEqual(item.expect.minCites);
    }

    if (item.expect.citeFile) {
      expect(
        plan.citations.some(
          (c) =>
            item.expect.citeFile!.test(c.fileName) ||
            item.expect.citeFile!.test(c.docTitle),
        ),
      ).toBe(true);
    }

    for (const page of item.expect.forbidCitePages ?? []) {
      expect(plan.citations.some((c) => c.page === page)).toBe(false);
    }

    if (item.expect.forbidExcerpt) {
      for (const c of plan.citations) {
        expect(c.excerpt).not.toMatch(item.expect.forbidExcerpt!);
      }
    }

    if (
      route === 'rag' &&
      isGeneralSideEffectCase(item.question) &&
      plan.citations.length > 0
    ) {
      for (const c of plan.citations) {
        expect(isDrugCatalogOrMonographText(c.excerpt)).toBe(false);
        expect(isTreatmentProgramText(c.excerpt)).toBe(false);
      }
    }
  }, 30_000);
});

describe('guide chat QA — conversation follow-up', () => {
  it('부작용 관리 후 종류 질문 — 치료 프로그램 인용 없음', async () => {
    const history = [
      {
        role: 'user' as const,
        text: '항암치료 부작용은 어떻게 관리하나요?',
      },
      {
        role: 'ai' as const,
        text: '1. 공통 관리: ...',
        answerType: 'guideline' as const,
        sources: [
          {
            docTitle: 'Q&A',
            fileName: 'lungca-patient-qa.pdf',
            page: 136,
            excerpt: 'Q 109 일반적 주의사항',
          },
        ],
      },
    ];
    const plan = await planChatResponse(
      '부작용이 어떤것들이 있어요?',
      ctx,
      history,
      'chat',
    );
    expect(plan.fromGuidelineRag).toBe(true);
    for (const c of plan.citations) {
      expect(isTreatmentProgramText(c.excerpt)).toBe(false);
      expect(c.page).not.toBe(113);
      expect(c.page).not.toBe(114);
      expect(c.page).not.toBe(119);
    }
  }, 30_000);
});

function isGeneralSideEffectCase(question: string): boolean {
  return (
    question.includes('부작용') &&
    !/이리노테칸|젬시타빈|페메트렉|도세탁|파클리탁|시스플라틴|카보플라틴/i.test(
      question,
    )
  );
}

const llmReady = canUseModel(DEFAULT_CHAT_MODEL_ID);

describe.skipIf(!llmReady)('guide chat QA — LLM answers', () => {
  it.each(
    CASES.filter(
      (c) => c.expect.forbidAnswer || c.expect.requireAnswer,
    ),
  )('$id — answer content', async (item) => {
    const mode = item.mode ?? 'chat';
    const plan = await planChatResponse(item.question, ctx, [], mode);

    let answer: string;
    try {
      answer = stripDefensiveClosing(
        await callLlmChat(plan.messages, DEFAULT_CHAT_MODEL_ID, {
          maxTokens: 700,
          retries: 2,
        }),
      );
    } catch (err) {
      if (err instanceof LlmNotConfiguredError) return;
      throw err;
    }

    expect(answer.length).toBeGreaterThan(20);

    if (item.expect.forbidAnswer) {
      expect(answer).not.toMatch(item.expect.forbidAnswer!);
    }
    if (item.expect.requireAnswer) {
      expect(answer).toMatch(item.expect.requireAnswer!);
    }
  }, 60_000);
});

describe('guide chat QA — routing helpers', () => {
  it('생존율 질문 감지', () => {
    expect(isSurvivalDashboardQuery('5년 생존율')).toBe(true);
  });

  it('가족 돌봄 질문은 가이드라인 검색', () => {
    expect(
      shouldSearchGuidelines(
        '가족으로서 어떻게 도와줄 수 있을까요?',
        'chat',
        [],
      ),
    ).toBe(true);
  });
});
