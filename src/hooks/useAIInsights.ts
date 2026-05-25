import { useState } from 'react';
import { MUTATION_OPTIONS, PDL1_OPTIONS, TEXT_MODEL } from '@/constants';
import { callGemini, extractText } from '@/lib/gemini';
import type { PatientProfile } from '@/types';

export function useAIInsights() {
  const [response, setResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const generate = async (profile: PatientProfile) => {
    const { age, gender, histology, selectedMutations, pdl1 } = profile;
    setIsGenerating(true);
    setErrorMsg('');
    setResponse('');

    const mutationLabels = MUTATION_OPTIONS
      .filter((m) => selectedMutations.includes(m.id))
      .map((m) => m.label)
      .join(', ');
    const pdl1Label = PDL1_OPTIONS.find((o) => o.id === pdl1)?.label ?? '결과 없음';

    const prompt = `당신은 "화순전남대학교병원" 소속 폐암 전문의입니다. ${age}대 ${gender === 'female' ? '여성' : '남성'} 환자(${histology}, 변이: ${mutationLabels}, PD-L1: ${pdl1Label})를 위한 4기 폐암 관리 정밀 리포트를 따뜻하게 작성해주세요. 최신 치료법을 언급하고 마지막엔 '화순전남대학교병원 폐암 전문의 드림'이라고 적어주세요.`;

    try {
      const data = await callGemini(`${TEXT_MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      setResponse(extractText(data));
    } catch {
      setErrorMsg('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return { response, isGenerating, errorMsg, generate };
}
