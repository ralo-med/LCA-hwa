import { useState } from "react";
import { TEXT_MODEL } from "@/constants";
import {
  callGemini,
  extractText,
  GEMINI_KEY_MISSING_MSG,
  GeminiNotConfiguredError,
} from "@/lib/gemini";
import type { PatientProfile } from "@/types";

export function useLifestyleGuide() {
  const [guide, setGuide] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const generate = async (profile: PatientProfile) => {
    const { age, gender } = profile;
    setIsGenerating(true);
    setErrorMsg("");
    setGuide("");

    const prompt = `화순전남대학교병원 폐암 전문의로서, ${age}세 ${gender === "female" ? "여성" : "남성"} 폐암 환자를 위한 "✨ 맞춤형 항암 생활 가이드"를 작성해주세요. 
    1. 식단 조언 (단백질 섭취, 피해야 할 음식 등)
    2. 운동 강도 제안 (걷기 등)
    3. 마음 관리 팁.
    아주 구체적이고 실천 가능한 내용으로 마크다운 형식을 사용하여 작성해주세요.`;

    try {
      const data = await callGemini(`${TEXT_MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      setGuide(extractText(data));
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof GeminiNotConfiguredError
          ? GEMINI_KEY_MISSING_MSG
          : "생활 가이드 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return { guide, isGenerating, errorMsg, generate };
}
