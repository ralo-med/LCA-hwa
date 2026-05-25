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
    source: getUntreatedEstimateFootnote(),
  };
}

/** 차트·막대 아래 — 미치료 추정 계산 로직 설명 */
export function getUntreatedEstimateFootnoteParagraphs(): string[] {
  return [
    "실선(치료 코호트)은 cBioPortal에서 조건에 맞는 환자 생존 기록으로 계산한 Kaplan–Meier 추정입니다. 이 데이터는 대체로 항암·병원 치료를 받은 환자에 가깝습니다.",
    "점선(미치료 추정)은 같은 DB에서 ‘미치료만’ 따로 뽑은 실측이 아닙니다. 치료 코호트의 1·3·5년 생존율에, 문헌의 치료 대비 미치료 비율(약 38%·14%·9%)을 곱해 낮춘 뒤, 4기 미치료·최선의 지원요법(BSC) 자연경과 논문에서 보고된 상한(1년 약 22%, 3년 약 6%, 5년 약 2.5% 이하)을 넘지 않게 맞춘 모델 추정치입니다.",
    "치료와 미치료의 차이를 대략 비교하려는 목적이며, 연구·표본마다 다른 미치료 실측을 대신하지 않습니다. 본인 예후로 쓰지 마세요.",
  ];
}

export function getUntreatedEstimateFootnote(): string {
  return getUntreatedEstimateFootnoteParagraphs().join(" ");
}
