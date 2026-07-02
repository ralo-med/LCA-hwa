import type { Gender, Histology, PatientProfile } from '@/types';
import { histologyLabel } from '@/lib/utils';

export const DEFAULT_PATIENT_PROFILE: PatientProfile = {
  age: 60,
  gender: 'female',
  histology: 'adenocarcinoma',
  selectedMutations: ['none'],
  pdl1: 'unknown',
};

export const EMPTY_PATIENT_PROFILE: PatientProfile = {
  age: null,
  gender: null,
  histology: null,
  selectedMutations: ['none'],
  pdl1: 'unknown',
};

export function hasPatientProfileInfo(profile: PatientProfile): boolean {
  return (
    profile.age != null ||
    profile.gender != null ||
    profile.histology != null
  );
}

export type ResolvedPatientProfile = Omit<
  PatientProfile,
  'age' | 'gender' | 'histology'
> & {
  age: number;
  gender: Gender;
  histology: Histology;
};

/** 생존 분석·대시보드용 — null 필드는 기본값으로 보완 */
export function resolveProfileForSurvival(
  profile: PatientProfile,
): ResolvedPatientProfile {
  return {
    age: profile.age ?? DEFAULT_PATIENT_PROFILE.age!,
    gender: profile.gender ?? DEFAULT_PATIENT_PROFILE.gender!,
    histology: profile.histology ?? DEFAULT_PATIENT_PROFILE.histology!,
    selectedMutations: profile.selectedMutations,
    pdl1: profile.pdl1,
  };
}

export function formatProfileSummary(profile: PatientProfile): string {
  if (!hasPatientProfileInfo(profile)) return '내 정보 없음';

  const parts: string[] = [];
  if (profile.age != null) {
    parts.push(`${profile.age}세`);
  }
  if (profile.gender != null) {
    parts.push(profile.gender === 'female' ? '여성' : '남성');
  }
  if (profile.histology != null) {
    parts.push(histologyLabel(profile.histology));
  }

  return parts.join(' · ') || '내 정보 없음';
}

export function genderLabel(gender: Gender | null): string {
  if (gender === 'male') return '남성';
  if (gender === 'female') return '여성';
  return '-';
}
