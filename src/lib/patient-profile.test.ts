import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PATIENT_PROFILE,
  EMPTY_PATIENT_PROFILE,
  formatProfileSummary,
  genderLabel,
  hasPatientProfileInfo,
  resolveProfileForSurvival,
} from './patient-profile';

describe('hasPatientProfileInfo', () => {
  it('빈 프로필 — false', () => {
    expect(hasPatientProfileInfo(EMPTY_PATIENT_PROFILE)).toBe(false);
  });

  it('age만 있어도 true', () => {
    expect(hasPatientProfileInfo({ ...EMPTY_PATIENT_PROFILE, age: 50 })).toBe(
      true,
    );
  });

  it('기본 프로필 — true', () => {
    expect(hasPatientProfileInfo(DEFAULT_PATIENT_PROFILE)).toBe(true);
  });
});

describe('resolveProfileForSurvival', () => {
  it('null 필드를 기본값으로 보완', () => {
    const resolved = resolveProfileForSurvival(EMPTY_PATIENT_PROFILE);
    expect(resolved.age).toBe(DEFAULT_PATIENT_PROFILE.age);
    expect(resolved.gender).toBe(DEFAULT_PATIENT_PROFILE.gender);
    expect(resolved.histology).toBe(DEFAULT_PATIENT_PROFILE.histology);
    expect(resolved.selectedMutations).toEqual(['none']);
    expect(resolved.pdl1).toBe('unknown');
  });

  it('기존 값 유지', () => {
    const profile = {
      age: 45,
      gender: 'male' as const,
      histology: 'squamous' as const,
      selectedMutations: ['EGFR'],
      pdl1: 'high',
    };
    const resolved = resolveProfileForSurvival(profile);
    expect(resolved).toEqual(profile);
  });
});

describe('formatProfileSummary', () => {
  it('정보 없음', () => {
    expect(formatProfileSummary(EMPTY_PATIENT_PROFILE)).toBe('내 정보 없음');
  });

  it('전체 정보', () => {
    expect(formatProfileSummary(DEFAULT_PATIENT_PROFILE)).toBe(
      '60세 · 여성 · 선암',
    );
  });

  it('조직형별 라벨', () => {
    expect(
      formatProfileSummary({
        ...EMPTY_PATIENT_PROFILE,
        histology: 'smallcell',
      }),
    ).toBe('소세포암');
  });
});

describe('genderLabel', () => {
  it('male/female/null', () => {
    expect(genderLabel('male')).toBe('남성');
    expect(genderLabel('female')).toBe('여성');
    expect(genderLabel(null)).toBe('-');
  });
});
