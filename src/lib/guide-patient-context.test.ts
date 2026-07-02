import { describe, expect, it } from 'vitest';
import {
  biomarkerSearchHint,
  buildPatientContextBlock,
  formatMutationLabels,
  formatPdl1Label,
} from './guide-patient-context';
import { DEFAULT_PATIENT_PROFILE, EMPTY_PATIENT_PROFILE } from './patient-profile';

describe('formatMutationLabels', () => {
  it('none 또는 빈 배열 — "-"', () => {
    expect(formatMutationLabels(['none'])).toBe('-');
    expect(formatMutationLabels([])).toBe('-');
  });

  it('변이 라벨 조합', () => {
    expect(formatMutationLabels(['egfr'])).toBe('EGFR (L858R/ex19del)');
    expect(formatMutationLabels(['egfr', 'alk'])).toBe(
      'EGFR (L858R/ex19del), ALK',
    );
  });
});

describe('formatPdl1Label', () => {
  it('unknown — "-"', () => {
    expect(formatPdl1Label('unknown')).toBe('-');
  });

  it('PD-L1 라벨', () => {
    expect(formatPdl1Label('50')).toBe('PD-L1 50% 이상');
    expect(formatPdl1Label('1-49')).toBe('PD-L1 1-49%');
  });
});

describe('buildPatientContextBlock', () => {
  it('미입력 프로필', () => {
    expect(buildPatientContextBlock({ profile: EMPTY_PATIENT_PROFILE })).toBe(
      '- 환자 정보: 미입력 (일반적인 폐암 안내 기준으로 답변)',
    );
  });

  it('NSCLC 프로필 — 변이·PD-L1 포함', () => {
    const block = buildPatientContextBlock({
      profile: {
        ...DEFAULT_PATIENT_PROFILE,
        selectedMutations: ['egfr'],
        pdl1: '50',
      },
    });
    expect(block).toContain('60세');
    expect(block).toContain('여성');
    expect(block).toContain('선암');
    expect(block).toContain('EGFR (L858R/ex19del)');
    expect(block).toContain('PD-L1 50% 이상');
  });

  it('소세포 — 변이·PD-L1 생략', () => {
    const block = buildPatientContextBlock({
      profile: {
        ...DEFAULT_PATIENT_PROFILE,
        histology: 'smallcell',
      },
    });
    expect(block).not.toContain('드라이버');
    expect(block).not.toContain('PD-L1');
  });
});

describe('biomarkerSearchHint', () => {
  it('소세포 — 빈 문자열', () => {
    expect(
      biomarkerSearchHint({
        ...DEFAULT_PATIENT_PROFILE,
        histology: 'smallcell',
      }),
    ).toBe('');
  });

  it('변이·PD-L1 힌트', () => {
    const hint = biomarkerSearchHint({
      ...DEFAULT_PATIENT_PROFILE,
      selectedMutations: ['alk'],
      pdl1: '1-49',
    });
    expect(hint).toContain('ALK');
    expect(hint).toContain('PD-L1 1-49%');
  });
});
