/**
 * 한국 인구·등록집계 참고 생존율 (K-M 코호트와 직접 비교 불가, 그래프 참고용).
 *
 * certainty:
 * - kccr_official: 국가암정보센터(KCCR) 암종(C34 등) 공표 5년 상대생존율
 * - registry_official: KALC-R 등 전국 등록 연구 공표 (병기·조직형 세부)
 * - estimated: 조직형 전용 공표가 없어 전체 폐암 등 근사·참고
 */
import type { Histology } from "@/types";

export type KoreanReferenceCertainty =
  | "kccr_official"
  | "registry_official"
  | "estimated";

export interface KoreanReference {
  /** 5년 상대생존율 (%) */
  year5: number;
  certainty: KoreanReferenceCertainty;
  /** 주 출처 (연도·기관·지표) */
  source: string;
  /** UI 보조 설명 */
  note?: string;
}

export const CERTAINTY_LABEL: Record<KoreanReferenceCertainty, string> = {
  kccr_official: "KCCR 공표",
  registry_official: "등록 연구 공표",
  estimated: "추정·참고",
};

export const KOREAN_REFERENCE_BY_HISTOLOGY: Record<Histology, KoreanReference> =
  {
    adenocarcinoma: {
      year5: 42.5,
      certainty: "estimated",
      source:
        "국가암정보센터 · 폐암(C34) 2019–2023 진단군 5년 상대생존율 (선암 전용 KCCR 공표 없음)",
      note: "전체 폐암 기준 참고치. 조직형·병기와 맞지 않을 수 있습니다.",
    },
    squamous: {
      year5: 42.5,
      certainty: "estimated",
      source:
        "국가암정보센터 · 폐암(C34) 2019–2023 진단군 5년 상대생존율 (편평상피 전용 KCCR 공표 없음)",
      note: "전체 폐암 기준 참고치. 조직형·병기와 맞지 않을 수 있습니다.",
    },
    others: {
      year5: 42.5,
      certainty: "kccr_official",
      source:
        "국가암정보센터 · 폐암(C34) 2019–2023 진단군 5년 상대생존율 (남녀 합산)",
      note: "비소세포·기타 포함 전체 폐암 집계. 소세포는 별도 수치 참고.",
    },
    smallcell: {
      year5: 4.0,
      certainty: "registry_official",
      source:
        "KALC-R 2015 코호트 · 확장병기(ED) 5년 상대생존율 4% (Cancer Res Treat 2022;55:260-270)",
      note: "제한병기(LD) 16%. 2015 진단·병기별 공표이며 최신 KCCR 연도와 다를 수 있음.",
    },
  };

export function getKoreanReference(histology: Histology): KoreanReference {
  return KOREAN_REFERENCE_BY_HISTOLOGY[histology];
}

export function getCertaintyLabel(
  certainty: KoreanReferenceCertainty,
): string {
  return CERTAINTY_LABEL[certainty];
}

/** UI용 연령대 라벨 (age는 decade 시작값: 60 → "60대") */
export function formatAgeDecade(age: number): string {
  const start = Math.floor(age / 10) * 10;
  return `${start}대`;
}

/** 코호트 필터용 [시작, 끝] (10년 단위) */
export function getAgeDecadeBand(age: number): [number, number] {
  const start = Math.floor(age / 10) * 10;
  return [start, start + 9];
}
