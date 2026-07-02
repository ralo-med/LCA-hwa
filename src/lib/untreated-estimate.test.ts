import { describe, expect, it } from 'vitest';
import {
  estimateUntreatedFromTreated,
  getUntreatedEstimateFootnote,
  getUntreatedEstimateFootnoteParagraphs,
} from './untreated-estimate';

describe('estimateUntreatedFromTreated', () => {
  it('모든 입력이 null이면 null 반환', () => {
    expect(estimateUntreatedFromTreated(null, null, null)).toBeNull();
  });

  it('year1만 주어지면 fallback year3/year5로 계산', () => {
    const result = estimateUntreatedFromTreated(50, null, null);
    expect(result).not.toBeNull();
    expect(result!.year1).toBeCloseTo(19, 5);
    expect(result!.year3).toBeCloseTo(1.68, 5);
    expect(result!.year5).toBeCloseTo(0.45, 5);
    expect(result!.points).toEqual([
      { months: 0, survival: 1 },
      { months: 12, survival: result!.year1 / 100 },
      { months: 36, survival: result!.year3 / 100 },
      { months: 60, survival: result!.year5 / 100 },
    ]);
    expect(result!.source).toBe(getUntreatedEstimateFootnote());
  });

  it('문헌 상한을 초과하지 않음', () => {
    const result = estimateUntreatedFromTreated(100, 100, 100);
    expect(result!.year1).toBe(22);
    expect(result!.year3).toBe(6);
    expect(result!.year5).toBe(2.5);
  });

  it('최소 하한 적용', () => {
    const result = estimateUntreatedFromTreated(1, 1, 1);
    expect(result!.year1).toBe(1);
    expect(result!.year3).toBe(0.5);
    expect(result!.year5).toBe(0.3);
  });

  it('전체 연도 입력 — 문헌 상한 적용', () => {
    const result = estimateUntreatedFromTreated(60, 30, 20);
    expect(result!.year1).toBe(22); // min(22, 60*0.38=22.8)
    expect(result!.year3).toBeCloseTo(4.2, 5);
    expect(result!.year5).toBeCloseTo(1.8, 5);
  });
});

describe('getUntreatedEstimateFootnoteParagraphs', () => {
  it('3개 문단 반환', () => {
    const paragraphs = getUntreatedEstimateFootnoteParagraphs();
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('cBioPortal');
    expect(paragraphs[1]).toContain('38%');
    expect(paragraphs[2]).toContain('본인 예후');
  });
});

describe('getUntreatedEstimateFootnote', () => {
  it('문단을 공백으로 연결', () => {
    expect(getUntreatedEstimateFootnote()).toBe(
      getUntreatedEstimateFootnoteParagraphs().join(' '),
    );
  });
});
