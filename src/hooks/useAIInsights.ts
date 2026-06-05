import { useState } from "react";
import { MUTATION_OPTIONS, TEXT_MODEL } from "@/constants";
import {
  callOpenAIChat,
  OPENAI_KEY_MISSING_MSG,
  OpenAINotConfiguredError,
} from "@/lib/openai";
import { histologyLabel, usesNsclcBiomarkerPanel } from "@/lib/utils";
import type { PatientProfile } from "@/types";

export function useAIInsights() {
  const [response, setResponse] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const generate = async (profile: PatientProfile) => {
    const { age, gender, histology, selectedMutations } = profile;
    setIsGenerating(true);
    setErrorMsg("");
    setResponse("");

    const hLabel = histologyLabel(histology);
    const biomarkerNote = usesNsclcBiomarkerPanel(histology)
      ? (() => {
          const mutationLabels = MUTATION_OPTIONS.filter((m) =>
            selectedMutations.includes(m.id),
          )
            .map((m) => m.label)
            .join(", ");
          return `변이: ${mutationLabels} (PD-L1 %는 앱에서 입력·K-M 반영 없음, 진료 TPS·가이드라인 참고)`;
        })()
      : "소세포폐암(표적치료·PD-L1 % 기반 1차 선택 해당 적음)";

    const prompt = `당신은 "화순전남대학교병원" 소속 폐암 전문의입니다. ${age}대 ${gender === "female" ? "여성" : "남성"} 환자(조직형: ${hLabel}, ${biomarkerNote})를 위한 폐암 관리 정밀 리포트를 따뜻하게 작성해주세요. 최신 치료법을 언급하고 마지막엔 '화순전남대학교병원 폐암 전문의 드림'이라고 적어주세요.`;

    try {
      const text = await callOpenAIChat(
        [{ role: "user", content: prompt }],
        TEXT_MODEL,
      );
      setResponse(text);
    } catch (err) {
      setErrorMsg(
        err instanceof OpenAINotConfiguredError
          ? OPENAI_KEY_MISSING_MSG
          : "리포트 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return { response, isGenerating, errorMsg, generate };
}
