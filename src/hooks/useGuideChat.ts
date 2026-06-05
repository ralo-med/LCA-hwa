import { useEffect, useState } from 'react';
import { EMBEDDING_MODEL } from '@/constants';
import {
  callLlmChat,
  chatKeyMissingMessage,
  LlmNotConfiguredError,
} from '@/lib/llm-client';
import type { GuidePatientContext } from '@/lib/guide-patient-context';
import {
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
        maxTokens: 1600,
        retries: 5,
      });
      const text = stripDefensiveClosing(rawText || '');
      const { sources, answerType } = resolveAnswerSources(
        plan.citations,
        text,
        plan.retrievalQuery,
        plan.searchedGuidelines,
      );

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

  const reset = () => {
    if (isChatting) return;
    setHistory([]);
    setInput('');
    setLoadingPhase('idle');
  };

  return {
    history,
    input,
    setInput,
    send,
    reset,
    isChatting,
    loadingPhase,
    guideMode,
    setGuideMode,
    dataReady,
    dataError,
    chatModelId,
    embedModel,
  };
}
