import { describe, expect, it } from 'vitest';
import { fitKaplanMeier, type KMSample } from './kaplan-meier';

describe('fitKaplanMeier', () => {
  it('빈 샘플 — atTime(0)은 survival=1', () => {
    const result = fitKaplanMeier([]);
    expect(result.curve).toEqual([]);
    expect(result.median).toBeNull();
    expect(result.atTime(0)).toEqual({ survival: 1, ci95: [1, 1] });
  });

  it('단일 이벤트 — survival 감소', () => {
    const samples: KMSample[] = [{ timeMonths: 12, event: true }];
    const result = fitKaplanMeier(samples);
    expect(result.curve).toHaveLength(1);
    expect(result.curve[0].survival).toBe(0);
    expect(result.median).toBe(12);
    expect(result.atTime(12).survival).toBe(0);
    expect(result.atTime(6).survival).toBe(1);
  });

  it('중도절단만 — survival 유지', () => {
    const samples: KMSample[] = [{ timeMonths: 24, event: false }];
    const result = fitKaplanMeier(samples);
    expect(result.curve[0].survival).toBe(1);
    expect(result.median).toBeNull();
  });

  it('복합 코호트 — 중앙 생존 및 atTime', () => {
    const samples: KMSample[] = [
      { timeMonths: 6, event: true },
      { timeMonths: 12, event: true },
      { timeMonths: 18, event: false },
      { timeMonths: 24, event: true },
      { timeMonths: 36, event: false },
    ];
    const result = fitKaplanMeier(samples);

    expect(result.curve.length).toBeGreaterThan(0);
    expect(result.atTime(0).survival).toBe(1);
    expect(result.atTime(6).survival).toBeCloseTo(0.8, 5);
    expect(result.atTime(12).survival).toBeCloseTo(0.6, 5);
    expect(result.atTime(24).survival).toBeCloseTo(0.3, 5);

    const at18 = result.atTime(18);
    expect(at18.survival).toBeCloseTo(0.6, 5); // 24개월 이벤트 전까지 0.6 유지
    expect(at18.ci95[0]).toBeLessThanOrEqual(at18.survival);
    expect(at18.ci95[1]).toBeGreaterThanOrEqual(at18.survival);
  });

  it('음수/비유한 timeMonths 필터링', () => {
    const samples: KMSample[] = [
      { timeMonths: -1, event: true },
      { timeMonths: NaN, event: true },
      { timeMonths: 12, event: true },
    ];
    const result = fitKaplanMeier(samples);
    expect(result.curve).toHaveLength(1);
    expect(result.curve[0].t).toBe(12);
  });

  it('동일 시점 다중 환자 그룹핑', () => {
    const samples: KMSample[] = [
      { timeMonths: 12, event: true },
      { timeMonths: 12, event: true },
      { timeMonths: 12, event: false },
    ];
    const result = fitKaplanMeier(samples);
    expect(result.curve).toHaveLength(1);
    expect(result.curve[0].events).toBe(2);
    expect(result.curve[0].atRisk).toBe(3);
    expect(result.curve[0].survival).toBeCloseTo(1 / 3, 5);
  });
});
