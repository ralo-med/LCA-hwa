import { describe, expect, it } from 'vitest';
import {
  anchorsFromYear5Only,
  anchorsFromYearly,
  buildKmStepCiBand,
  buildKmStepPath,
  buildSmoothCiBand,
  buildSmoothSvgPath,
  sampleKmAnchors,
} from './survival-curve-path';

const VIEW_W = 400;
const VIEW_H = 200;

describe('buildKmStepPath', () => {
  it('빈 curve — 빈 문자열', () => {
    expect(buildKmStepPath([], VIEW_W, VIEW_H)).toBe('');
  });

  it('단일 시점 step path', () => {
    const curve = [{ t: 12, survival: 0.8 }];
    const path = buildKmStepPath(curve, VIEW_W, VIEW_H);
    expect(path).toBe('M 0,0 L 80,0 L 80,40 L 400,40');
  });

  it('maxMonths 초과 시 조기 종료', () => {
    const curve = [
      { t: 12, survival: 0.9 },
      { t: 72, survival: 0.5 },
    ];
    const path = buildKmStepPath(curve, VIEW_W, VIEW_H, 60);
    expect(path).not.toContain('480');
    expect(path.endsWith('L 400,')).toBe(false);
    expect(path).toMatch(/L 400,\d+$/);
  });
});

describe('buildKmStepCiBand', () => {
  it('빈 curve — 빈 문자열', () => {
    expect(buildKmStepCiBand([], VIEW_W, VIEW_H)).toBe('');
  });

  it('CI 띠 path 생성 (Z로 닫힘)', () => {
    const curve = [{ t: 12, survival: 0.8, variance: 0.01 }];
    const band = buildKmStepCiBand(curve, VIEW_W, VIEW_H);
    expect(band.startsWith('M ')).toBe(true);
    expect(band.endsWith(' Z')).toBe(true);
  });
});

describe('sampleKmAnchors', () => {
  it('빈 curve — [{months:0, survival:1}]', () => {
    expect(sampleKmAnchors([])).toEqual([{ months: 0, survival: 1 }]);
  });

  it('step curve에서 앵커 샘플링', () => {
    const curve = [
      { t: 6, survival: 0.95 },
      { t: 12, survival: 0.8 },
      { t: 24, survival: 0.6 },
    ];
    const anchors = sampleKmAnchors(curve);
    expect(anchors[0]).toEqual({ months: 0, survival: 1 });
    expect(anchors.find((a) => a.months === 12)?.survival).toBe(0.8);
    expect(anchors.find((a) => a.months === 24)?.survival).toBe(0.6);
  });
});

describe('anchorsFromYearly', () => {
  it('null만 — 시작점만', () => {
    expect(anchorsFromYearly(null, null, null)).toEqual([
      { months: 0, survival: 1 },
    ]);
  });

  it('전체 연도', () => {
    expect(anchorsFromYearly(50, 30, 10)).toEqual([
      { months: 0, survival: 1 },
      { months: 12, survival: 0.5 },
      { months: 36, survival: 0.3 },
      { months: 60, survival: 0.1 },
    ]);
  });
});

describe('anchorsFromYear5Only', () => {
  it('5년 생존율 보간', () => {
    const anchors = anchorsFromYear5Only(10);
    expect(anchors[0]).toEqual({ months: 0, survival: 1 });
    expect(anchors[3]).toEqual({ months: 60, survival: 0.1 });
    expect(anchors[1].survival).toBeCloseTo(0.59, 5);
    expect(anchors[2].survival).toBeCloseTo(0.345, 5);
  });
});

describe('buildSmoothSvgPath', () => {
  it('앵커 2개 미만 — 빈 문자열', () => {
    expect(buildSmoothSvgPath([{ months: 0, survival: 1 }], VIEW_W, VIEW_H)).toBe(
      '',
    );
  });

  it('Catmull-Rom 곡선 path', () => {
    const anchors = anchorsFromYearly(50, 30, 10);
    const path = buildSmoothSvgPath(anchors, VIEW_W, VIEW_H);
    expect(path.startsWith('M 0.00,')).toBe(true);
    expect(path).toContain(' C ');
  });
});

describe('buildSmoothCiBand', () => {
  it('빈 curve — 빈 문자열', () => {
    expect(buildSmoothCiBand([], VIEW_W, VIEW_H)).toBe('');
  });

  it('부드러운 CI 띠 (Z로 닫힘)', () => {
    const curve = [
      { t: 12, survival: 0.8, variance: 0.01 },
      { t: 36, survival: 0.5, variance: 0.02 },
    ];
    const band = buildSmoothCiBand(curve, VIEW_W, VIEW_H);
    expect(band.endsWith(' Z')).toBe(true);
  });
});
