import { describe, expect, it } from 'vitest';
import {
  CERTAINTY_LABEL,
  formatAgeDecade,
  getAgeDecadeBand,
  getCertaintyLabel,
  getKoreanReference,
  KOREAN_REFERENCE_BY_HISTOLOGY,
} from './korean-reference';

describe('getKoreanReference', () => {
  it('조직형별 참고치', () => {
    expect(getKoreanReference('adenocarcinoma').year5).toBe(42.5);
    expect(getKoreanReference('smallcell').year5).toBe(4.0);
    expect(getKoreanReference('smallcell').certainty).toBe('registry_official');
  });

  it('모든 histology 키 존재', () => {
    for (const h of ['adenocarcinoma', 'squamous', 'others', 'smallcell'] as const) {
      expect(KOREAN_REFERENCE_BY_HISTOLOGY[h]).toBeDefined();
    }
  });
});

describe('getCertaintyLabel', () => {
  it('certainty 라벨 매핑', () => {
    expect(getCertaintyLabel('kccr_official')).toBe(CERTAINTY_LABEL.kccr_official);
    expect(getCertaintyLabel('estimated')).toBe('추정·참고');
  });
});

describe('formatAgeDecade', () => {
  it('연령대 라벨', () => {
    expect(formatAgeDecade(60)).toBe('60대');
    expect(formatAgeDecade(65)).toBe('60대');
    expect(formatAgeDecade(59)).toBe('50대');
  });
});

describe('getAgeDecadeBand', () => {
  it('10년 단위 밴드', () => {
    expect(getAgeDecadeBand(60)).toEqual([60, 69]);
    expect(getAgeDecadeBand(65)).toEqual([60, 69]);
    expect(getAgeDecadeBand(59)).toEqual([50, 59]);
  });
});
