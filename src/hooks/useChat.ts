import { useState } from 'react';
import { TEXT_MODEL } from '../constants';
import { callGemini, extractText } from '../lib/gemini';
import type { ChatMessage, PatientProfile } from '../types';

export function useChat(profile: PatientProfile) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isChatting, setIsChatting] = useState<boolean>(false);

  const send = async () => {
    if (!input.trim() || isChatting) return;
    const userMsg = input.trim();
    setInput('');
    setHistory((p) => [...p, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    const { age, gender, histology } = profile;
    const prompt = `화순전남대학교병원 폐암 전문의로서 답변해주세요. 환자 상태: ${age}세, ${gender}, ${histology}. 질문: "${userMsg}"`;

    try {
      const data = await callGemini(`${TEXT_MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      setHistory((p) => [
        ...p,
        { role: 'ai', text: extractText(data) || '답변을 생성하지 못했습니다.' },
      ]);
    } catch {
      setHistory((p) => [...p, { role: 'ai', text: '통신 오류가 발생했습니다.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  return { history, input, setInput, send, isChatting };
}
