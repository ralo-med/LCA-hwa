import { useEffect, useState } from 'react';
import { EMBEDDING_MODEL } from '@/constants';
import {
  callLlmChat,
  chatKeyMissingMessage,
  LlmNotConfiguredError,
} from '@/lib/llm-client';
import type { GuidePatientContext } from '@/lib/guide-patient-context';
import {
  answerDeniesGuidelineRelevance,
  buildSupplementMessages,
  dedupeSupplementText,
  filterRelevantCitations,
  loadGuideChunks,
  planChatResponse,
  resolveAnswerSources,
  shouldSearchGuidelines,
  stripDefensiveClosing,
} from '@/lib/rag';
import type {
  GuideChatLoadingPhase,
  GuideChatMessage,
  GuideSearchMode,
} from '@/types';

export function useGuideChat(
  patientContext: GuidePatientContext,
  chatModelId: string,
) {
  const [history, setHistory] = useState<GuideChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [guideMode, setGuideMode] = useState<GuideSearchMode>('auto');
  const [isChatting, setIsChatting] = useState(false);
  const [loadingPhase, setLoadingPhase] =
    useState<GuideChatLoadingPhase>('idle');
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState('');
  const [embedModel, setEmbedModel] = useState(EMBEDDING_MODEL);
  const [supplementLoadingIndex, setSupplementLoadingIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    loadGuideChunks()
      .then((store) => {
        setDataReady(true);
        setDataError('');
        if (store.model) setEmbedModel(store.model);
      })
      .catch((err: Error) => {
        setDataError(err.message);
        setDataReady(false);
      });
  }, []);

  const send = async () => {
    if (!input.trim() || isChatting || !dataReady) return;

    const userMsg = input.trim();
    const priorHistory = history;

    setInput('');
    setHistory((p) => [...p, { role: 'user', text: userMsg }]);
    const willSearch = shouldSearchGuidelines(userMsg, guideMode, priorHistory);
    setIsChatting(true);
    setLoadingPhase(willSearch ? 'searching' : 'replying');

    try {
      const plan = await planChatResponse(
        userMsg,
        patientContext,
        priorHistory,
        guideMode,
      );

      setLoadingPhase('replying');
      const rawText = await callLlmChat(plan.messages, chatModelId, {
        maxTokens: 900,
        retries: 5,
      });
      const text = stripDefensiveClosing(rawText || '');
      const resolved = resolveAnswerSources(
        plan.citations,
        text,
        plan.retrievalQuery,
        plan.searchedGuidelines,
      );
      const sources =
        plan.fromGuidelineRag && plan.citations.length > 0
          ? filterRelevantCitations(plan.citations, plan.retrievalQuery)
          : resolved.sources;
      const answerType = plan.fromSurvivalDashboard
        ? 'survival'
        : plan.fromGuidelineRag &&
            plan.citations.length > 0 &&
            !answerDeniesGuidelineRelevance(text)
          ? 'guideline'
          : resolved.answerType;

      setHistory((p) => [
        ...p,
        {
          role: 'ai',
          text: text || '답변을 생성하지 못했습니다.',
          sources,
          answerType,
        },
      ]);
    } catch (err) {
      setHistory((p) => [
        ...p,
        {
          role: 'ai',
          text:
            err instanceof LlmNotConfiguredError
              ? chatKeyMissingMessage(err.provider)
              : err instanceof Error
                ? err.message
                : '통신 오류가 발생했습니다.',
        },
      ]);
    } finally {
      setIsChatting(false);
      setLoadingPhase('idle');
    }
  };

  const requestSupplement = async (aiMessageIndex: number) => {
    const msg = history[aiMessageIndex];
    if (
      !msg ||
      msg.role !== 'ai' ||
      msg.answerType !== 'guideline' ||
      msg.supplementText ||
      isChatting ||
      supplementLoadingIndex !== null
    ) {
      return;
    }

    let userQuestion = '';
    for (let i = aiMessageIndex - 1; i >= 0; i--) {
      if (history[i]?.role === 'user') {
        userQuestion = history[i]!.text;
        break;
      }
    }
    if (!userQuestion) return;

    setSupplementLoadingIndex(aiMessageIndex);
    try {
      const messages = buildSupplementMessages(
        userQuestion,
        msg.text,
        patientContext,
      );
      const rawText = await callLlmChat(messages, chatModelId, {
        maxTokens: 1000,
        retries: 3,
      });
      const text = dedupeSupplementText(
        stripDefensiveClosing(rawText || ''),
        msg.text,
      );
      setHistory((p) =>
        p.map((m, i) =>
          i === aiMessageIndex
            ? { ...m, supplementText: text || '추가 정보를 생성하지 못했습니다.' }
            : m,
        ),
      );
    } catch (err) {
      setHistory((p) =>
        p.map((m, i) =>
          i === aiMessageIndex
            ? {
                ...m,
                supplementText:
                  err instanceof LlmNotConfiguredError
                    ? chatKeyMissingMessage(err.provider)
                    : err instanceof Error
                      ? err.message
                      : '추가 정보를 가져오지 못했습니다.',
              }
            : m,
        ),
      );
    } finally {
      setSupplementLoadingIndex(null);
    }
  };

  const reset = () => {
    if (isChatting || supplementLoadingIndex !== null) return;
    setHistory([]);
    setInput('');
    setLoadingPhase('idle');
    setSupplementLoadingIndex(null);
  };

  return {
    history,
    input,
    setInput,
    send,
    requestSupplement,
    reset,
    isChatting,
    loadingPhase,
    supplementLoadingIndex,
    guideMode,
    setGuideMode,
    dataReady,
    dataError,
    chatModelId,
    embedModel,
  };
}
