import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { GuidePatientContext } from '@/lib/guide-patient-context';
import { callLlmChat, LlmNotConfiguredError } from '@/lib/llm-client';
import { DEFAULT_CHAT_MODEL_ID } from '@/lib/llm-models';
import { canUseModel } from '@/lib/llm-settings';
import { DEFAULT_PATIENT_PROFILE } from '@/lib/patient-profile';
import {
  filterRelevantCitations,
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
  'utf8',
);

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
    requireExcerpt?: RegExp;
    forbidExcerpt?: RegExp;
    forbidAnswer?: RegExp;
    requireAnswer?: RegExp;
  };
}

/** UI 추천 질문 + auto 모드 + 회귀 케이스 */
const CASES: QCase[] = [
  {
    id: 'suggest-side-effects',
    question: '항암치료 부작용은 어떻게 관리하나요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [115, 128],
      requireExcerpt: /Q\s*109|일반적\s*주의|오심|구토|설사|감염|부작용/i,
      forbidExcerpt: /어떤\s*약제인가요|아트로핀|유지요법|치료\s*이득|Q\s*9[3-4]|EGFR\s*억제|항암화학치료제의\s*종류/i,
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
      forbidCitePages: [115, 128],
      requireExcerpt: /Q\s*109|오심|구토|설사|탈모|피로|감염|부작용/i,
      forbidExcerpt: /유지요법|치료\s*이득|독성이\s*항암|몇\s*번\s*하나요|Q\s*9[3-4]|EGFR\s*억제|어떤\s*약제인가요/i,
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
      forbidCitePages: [115],
      requireExcerpt: /부작용|오심|구토|설사|Q\s*109/i,
      forbidExcerpt: /유지요법|치료\s*이득|Q\s*9[3-4]|어떤\s*약제인가요/i,
    },
  },
  {
    id: 'suggest-anxiety',
    question: '진단을 받고 마음이 너무 불안해요.',
    mode: 'chat',
    expect: {
      route: 'emotional',
      searchGuidelines: false,
      requireAnswer: /자연|힘든|불안|괜찮|이해|감정|마음/i,
      forbidAnswer: /NCCN|가이드라인\s*원문|PD-L1|EGFR/i,
    },
  },
  {
    id: 'suggest-nutrition',
    question: '먹어도 되는 음식과 피할 음식이 궁금해요.',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [38, 104, 115, 130, 132, 135, 136],
      requireExcerpt: /식단|식사|음식|영양|Q\s*13[6-9]|섭취|체중/i,
      forbidExcerpt: /석면|ALK|면역관문|EGFR|Q\s*109|Q\s*110|수술\s*후\s*일상|Contents\b/i,
      requireAnswer: /음식|식사|식단|영양|섭취|체중/i,
      forbidAnswer: /석면|ALK|면역관문|PD-L1/i,
    },
  },
  {
    id: 'suggest-family',
    question: '가족으로서 어떻게 도와줄 수 있을까요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      searchGuidelines: true,
      minCites: 1,
      requireExcerpt: /가족|보호|호스피스|완화|돌봄|정서|Q\s*14[56]|caregiver|patient and caregiver/i,
      requireAnswer: /가족|보호|함께|돌봄|정서|지지|호스피스|완화/i,
      forbidAnswer: /PD-L1|EGFR|ALK|표적\s*치료/i,
    },
  },
  {
    id: 'auto-sclc-treatment',
    question: '소세포폐암 치료 과정을 알려주세요.',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [129, 133, 162],
      requireExcerpt: /소세포|치료|Q\s*68|항암|화학|방사|Initial treatment|Limited.?stage|Extensive.?stage/i,
      forbidExcerpt: /Presented with support|NCCN\.org\/patientguidelines|생존\s*기간|5년\s*생존|키트루다|Q\s*62|Q\s*28\b|가슴에\s*미세한\s*통증/i,
      requireAnswer: /소세포|치료|항암|화학|방사/i,
    },
  },
  {
    id: 'auto-daily-living',
    question: '전이성 폐암에서 일상생활 시 주의할 점은?',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [75, 84, 87],
      requireExcerpt: /일상|생활|감염|운동|금연|휴식|삶의\s*질|supportive|quality of life/i,
      forbidExcerpt: /cause of concerning symptoms|해외\s*여행|입원.*며칠|수술\s*부작용/i,
      requireAnswer: /일상|생활|감염|휴식|운동|금연|주의/i,
    },
  },
  {
    id: 'auto-nutrition',
    question: '영양·식이 관리는 어떻게 해야 하나요?',
    mode: 'auto',
    expect: {
      route: 'rag',
      minCites: 1,
      forbidCitePages: [104, 135, 136, 137],
      requireExcerpt: /영양|식이|식단|식사|음식|Q\s*13[6-9]|healthful|healthy living|섭취/i,
      forbidExcerpt: /registered dietitian|Q\s*109|수술\s*후\s*일상|감염\s*의심|과립구|백혈구\s*성장|Q\s*110\b/i,
      requireAnswer: /영양|식이|식단|식사|음식|체중/i,
    },
  },
  {
    id: 'drug-specific-irinotecan',
    question: '이리노테칸 부작용은 어떻게 관리하나요?',
    mode: 'chat',
    expect: {
      route: 'rag',
      minCites: 1,
      requireExcerpt: /이리노|설사|구토|부작용/i,
      requireAnswer: /설사|이리노|구토|오심/i,
    },
  },
  {
    id: 'survival-rate',
    question: '제 5년 생존율은 얼마나 되나요?',
    mode: 'chat',
    expect: {
      route: 'survival',
      searchGuidelines: false,
      requireAnswer: /5\s*년|생존|%|연/i,
      forbidAnswer: /가이드라인\s*원문|NCCN\s*PDF/i,
    },
  },
  {
    id: 'chitchat-greeting',
    question: '안녕하세요',
    mode: 'chat',
    expect: {
      route: 'chitchat',
      searchGuidelines: false,
      requireAnswer: /안녕|도우미|폐암|도와/i,
    },
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

function assertCitationQuality(
  item: QCase,
  plan: Awaited<ReturnType<typeof planChatResponse>>,
  route: ExpectedRoute,
) {
  const citations = filterRelevantCitations(
    plan.citations,
    plan.retrievalQuery,
  );

  if (item.expect.minCites != null && route === 'rag') {
    expect(citations.length).toBeGreaterThanOrEqual(item.expect.minCites);
  }

  if (item.expect.citeFile) {
    expect(
      citations.some(
        (c) =>
          item.expect.citeFile!.test(c.fileName) ||
          item.expect.citeFile!.test(c.docTitle),
      ),
    ).toBe(true);
  }

  for (const page of item.expect.forbidCitePages ?? []) {
    expect(citations.some((c) => c.page === page)).toBe(false);
  }

  if (item.expect.requireExcerpt && route === 'rag') {
    expect(
      citations.some((c) => item.expect.requireExcerpt!.test(c.excerpt)),
    ).toBe(true);
  }

  if (item.expect.forbidExcerpt) {
    for (const c of citations) {
      expect(c.excerpt).not.toMatch(item.expect.forbidExcerpt!);
    }
  }

  if (
    route === 'rag' &&
    isGeneralSideEffectCase(item.question) &&
    citations.length > 0
  ) {
    for (const c of citations) {
      expect(isDrugCatalogOrMonographText(c.excerpt)).toBe(false);
      expect(isTreatmentProgramText(c.excerpt)).toBe(false);
    }
  }
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
      const cites = filterRelevantCitations(plan.citations, plan.retrievalQuery);
      console.log(
        item.id,
        route,
        cites.map((c) => `p${c.page}`),
        cites[0]?.excerpt.slice(0, 80),
      );
    }

    assertCitationQuality(item, plan, route);
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
    const citations = filterRelevantCitations(
      plan.citations,
      plan.retrievalQuery,
    );
    for (const c of citations) {
      expect(isTreatmentProgramText(c.excerpt)).toBe(false);
      expect(c.page).not.toBe(113);
      expect(c.page).not.toBe(114);
      expect(c.page).not.toBe(119);
      expect(c.page).not.toBe(115);
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
  it.each(CASES.filter((c) => c.expect.requireAnswer || c.expect.forbidAnswer))(
    '$id — answer content',
    async (item) => {
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
    },
    60_000,
  );
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
