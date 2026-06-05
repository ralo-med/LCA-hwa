import { useState } from "react";
import { TEXT_MODEL } from "@/constants";
import {
  callOpenAIChat,
  OPENAI_KEY_MISSING_MSG,
  OpenAINotConfiguredError,
} from "@/lib/openai";
import { histologyLabel } from "@/lib/utils";
import type { PatientProfile } from "@/types";

export function useLifestyleGuide() {
  const [guide, setGuide] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const generate = async (profile: PatientProfile) => {
    const { age, gender, histology } = profile;
    setIsGenerating(true);
    setErrorMsg("");
    setGuide("");

    const hLabel = histologyLabel(histology);
    const prompt = `당신은 화순전남대학교병원 폐암 전문의입니다. ${age}대 ${gender === "female" ? "여성" : "남성"} 환자(조직형: ${hLabel})를 위한 일상생활·영양·운동·심리 관리 가이드를 환자 친화적으로 작성해주세요.`;

    try {
      const text = await callOpenAIChat(
        [{ role: "user", content: prompt }],
        TEXT_MODEL,
      );
      setGuide(text);
    } catch (err) {
      setErrorMsg(
        err instanceof OpenAINotConfiguredError
          ? OPENAI_KEY_MISSING_MSG
          : "가이드 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return { guide, isGenerating, errorMsg, generate };
}
