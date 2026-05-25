/**
 * 치료 코호트 K-M 시점 생존율로부터 미치료(최선의 지원요법) 곡선을 대략 추정.
 *
 * - cBioPortal 풀링 코호트 ≈ 치료·항암 관리 환자군
 * - 4기 미치료 자연경과 문헌(1년 ~15–20%, 5년 ~1–2%)과의 비율을 함께 적용
 * - 개인 예후가 아닌 시각적 비교용 추정치임
 */

export interface UntreatedSurvivalEstimate {
  year1: number;
  year3: number;
  year5: number;
  /** 0–60개월, 생존율 0–1 */
  points: { months: number; survival: number }[];
  source: string;
}

/** 문헌 상한 (4기 NSCLC, 미치료·BSC, %) */
const LITERATURE_CAP = { year1: 22, year3: 6, year5: 2.5 };

/** 치료 코호트 대비 대략 비율 (시각 비교용) */
const RATIO_VS_TREATED = { year1: 0.38, year3: 0.14, year5: 0.09 };

export function estimateUntreatedFromTreated(
  year1: number | null,
  year3: number | null,
  year5: number | null,
): UntreatedSurvivalEstimate | null {
  if (year1 === null && year3 === null && year5 === null) return null;

  const y1 = Math.min(
    LITERATURE_CAP.year1,
    Math.max(1, (year1 ?? 40) * RATIO_VS_TREATED.year1),
  );
  const y3 = Math.min(
    LITERATURE_CAP.year3,
    Math.max(0.5, (year3 ?? 12) * RATIO_VS_TREATED.year3),
  );
  const y5 = Math.min(
    LITERATURE_CAP.year5,
    Math.max(0.3, (year5 ?? 5) * RATIO_VS_TREATED.year5),
  );

  const points = [
    { months: 0, survival: 1 },
    { months: 12, survival: y1 / 100 },
    { months: 36, survival: y3 / 100 },
    { months: 60, survival: y5 / 100 },
  ];

  return {
    year1: y1,
    year3: y3,
    year5: y5,
    points,
    source: '미치료 추정 · 치료 K-M 대비 문헌 비율(상한 적용)',
  };
}
