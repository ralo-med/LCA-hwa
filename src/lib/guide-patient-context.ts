import { MUTATION_OPTIONS, PDL1_OPTIONS } from '@/constants';
import { hasPatientProfileInfo, genderLabel } from '@/lib/patient-profile';
import type { SurvivalEstimate } from '@/lib/survival-cbioportal';
import { histologyLabel, usesNsclcBiomarkerPanel } from '@/lib/utils';
import type { PatientProfile } from '@/types';

export interface GuidePatientContext {
  profile: PatientProfile;
  /** 메인 대시보드 K-M 생존 추정 (챗봇 생존율 질문용) */
  survival?: SurvivalEstimate | null;
}

const EMPTY = '-';

export function formatMutationLabels(selectedMutations: string[]): string {
  if (selectedMutations.includes('none') || selectedMutations.length === 0) {
    return EMPTY;
  }
  return selectedMutations
    .map((id) => MUTATION_OPTIONS.find((m) => m.id === id)?.label ?? id)
    .join(', ');
}

export function formatPdl1Label(pdl1: string): string {
  if (pdl1 === 'unknown') return EMPTY;
  return PDL1_OPTIONS.find((p) => p.id === pdl1)?.label ?? pdl1;
}

export function buildPatientContextBlock(ctx: GuidePatientContext): string {
  const { profile } = ctx;
  if (!hasPatientProfileInfo(profile)) {
    return '- 환자 정보: 미입력 (일반적인 폐암 안내 기준으로 답변)';
  }

  const parts: string[] = [];
  if (profile.age != null) parts.push(`${profile.age}세`);
  if (profile.gender != null) parts.push(genderLabel(profile.gender));
  if (profile.histology != null) {
    parts.push(`조직형 ${histologyLabel(profile.histology)}`);
  }

  const lines = [`- 기본: ${parts.join(', ') || EMPTY}`];

  if (profile.histology != null && usesNsclcBiomarkerPanel(profile.histology)) {
    lines.push(
      `- 드라이버 유전자 변이: ${formatMutationLabels(profile.selectedMutations)}`,
    );
    lines.push(`- PD-L1: ${formatPdl1Label(profile.pdl1)}`);
  }

  return lines.join('\n');
}

export function biomarkerSearchHint(profile: PatientProfile): string {
  if (profile.histology == null || !usesNsclcBiomarkerPanel(profile.histology)) {
    return '';
  }
  const parts: string[] = [];
  if (!profile.selectedMutations.includes('none')) {
    parts.push(formatMutationLabels(profile.selectedMutations));
  }
  const pdl1 = formatPdl1Label(profile.pdl1);
  if (pdl1 !== EMPTY) parts.push(`PD-L1 ${pdl1}`);
  return parts.join(' ');
}
