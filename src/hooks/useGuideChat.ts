import { useEffect, useState } from 'react';
import { GUIDE_CHAT_MODEL } from '@/constants';
import {
  callOpenAIChat,
  OPENAI_KEY_MISSING_MSG,
  OpenAINotConfiguredError,
} from '@/lib/openai';
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
  PatientProfile,
} from '@/types';

export function useGuideChat(profile: PatientProfile) {
  const [history, setHistory] = useState<GuideChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [guideMode, setGuideMode] = useState<GuideSearchMode>('auto');
  const [isChatting, setIsChatting] = useState(false);
  const [loadingPhase, setLoadingPhase] =
    useState<GuideChatLoadingPhase>('idle');
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    loadGuideChunks()
      .then(() => {
        setDataReady(true);
        setDataError('');
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
    const willSearch = shouldSearchGuidelines(
      userMsg,
      guideMode,
      priorHistory,
    );
    setIsChatting(true);
    setLoadingPhase(willSearch ? 'searching' : 'replying');

    const profileCtx = {
      age: profile.age,
      gender: profile.gender,
      histology: profile.histology,
    };

    try {
      const plan = await planChatResponse(
        userMsg,
        profileCtx,
        priorHistory,
        guideMode,
      );

      setLoadingPhase('replying');
      const rawText = await callOpenAIChat(plan.messages, GUIDE_CHAT_MODEL, 5, {
        maxTokens: 1600,
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
            err instanceof OpenAINotConfiguredError
              ? OPENAI_KEY_MISSING_MSG
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
  };
}
