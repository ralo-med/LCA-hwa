import { MUTATION_OPTIONS, PDL1_OPTIONS } from '@/constants';
import { histologyLabel, usesNsclcBiomarkerPanel } from '@/lib/utils';
import type { PatientProfile } from '@/types';

export interface GuidePatientContext {
  profile: PatientProfile;
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
  const genderLabel = profile.gender === 'female' ? '여성' : '남성';
  const lines = [
    `- 기본: ${profile.age}세 ${genderLabel}, 조직형 ${histologyLabel(profile.histology)}`,
  ];

  if (usesNsclcBiomarkerPanel(profile.histology)) {
    lines.push(
      `- 드라이버 유전자 변이: ${formatMutationLabels(profile.selectedMutations)}`,
    );
    lines.push(`- PD-L1: ${formatPdl1Label(profile.pdl1)}`);
  }

  return lines.join('\n');
}

export function biomarkerSearchHint(profile: PatientProfile): string {
  if (!usesNsclcBiomarkerPanel(profile.histology)) return '';
  const parts: string[] = [];
  if (!profile.selectedMutations.includes('none')) {
    parts.push(formatMutationLabels(profile.selectedMutations));
  }
  const pdl1 = formatPdl1Label(profile.pdl1);
  if (pdl1 !== EMPTY) parts.push(`PD-L1 ${pdl1}`);
  return parts.join(' ');
}
