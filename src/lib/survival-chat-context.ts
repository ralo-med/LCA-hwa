import type { SurvivalEstimate } from '@/lib/survival-cbioportal';
import {
  getMedianOsSubtitle,
  getYear5KmTooltipParagraphs,
} from '@/lib/survival-cbioportal';

/** 대시보드 K-M 생존 추정 질문 */
export const SURVIVAL_RATE_QUERY =
  /생존율|생존\s*(기간|곡선)|5\s*년|오\s*년|중앙\s*생존|median\s*os|survival\s*rate|year\s*5/i;

export function isSurvivalDashboardQuery(query: string): boolean {
  return SURVIVAL_RATE_QUERY.test(query.trim());
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtYears(months: number | null): string {
  if (months === null) return '—';
  return `${(months / 12).toFixed(1)}년`;
}

export function buildSurvivalDashboardBlock(
  survival: SurvivalEstimate | null | undefined,
): string {
  if (!survival) {
    return `## 대시보드 생존 추정
- 아직 cBioPortal 코호트 계산이 끝나지 않았거나 불러오지 못했습니다.
- 환자 프로필(나이·성별·조직형·변이)과 동일한 조건으로 메인 **생존 대시보드**에서 K-M 곡선을 확인할 수 있습니다.`;
  }

  if (survival.cohortN === 0 || survival.insufficient) {
    const reason = survival.unavailableReason ?? '조건 일치 환자 부족';
    return `## 대시보드 생존 추정
- 상태: ${reason}
- 분석 코호트 n=${survival.cohortN}
- 메인 **생존 대시보드**에서 프로필(나이·변이 등)을 조정하면 비슷한 환자군 기록을 다시 맞출 수 있습니다.`;
  }

  const lines = [
    '## 대시보드 Kaplan–Meier 생존 추정 (cBioPortal, 메인 화면과 동일)',
    `- 출처: ${survival.source}`,
    `- 5년 K-M 생존 추정치: ${fmtPct(survival.year5)}`,
    `- 3년: ${fmtPct(survival.year3)} · 1년: ${fmtPct(survival.year1)}`,
    `- 중앙 생존기간(median OS): ${fmtYears(survival.median)} (${getMedianOsSubtitle(survival.medianOsStatus)})`,
  ];

  if (survival.ci95Year5) {
    lines.push(
      `- 5년 95% 신뢰구간: ${survival.ci95Year5[0].toFixed(1)}% – ${survival.ci95Year5[1].toFixed(1)}%`,
    );
  }

  lines.push(
    `- 한국 참고(5년 상대생존): ${survival.koreanReference.year5.toFixed(1)}% — ${survival.koreanReference.source}`,
    `- 해석 주의: ${getYear5KmTooltipParagraphs().join(' ')}`,
  );

  return lines.join('\n');
}
