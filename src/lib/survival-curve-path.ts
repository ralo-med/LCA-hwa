/**
 * K-M step path (정확) + 부드러운 곡선 (미치료 추정 등 대략 비교용)
 */

export interface SurvivalAnchor {
  months: number;
  survival: number; // 0–1
}

const DEFAULT_ANCHOR_MONTHS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60];

/** Kaplan-Meier step function SVG path */
export function buildKmStepPath(
  curve: { t: number; survival: number }[],
  viewW: number,
  viewH: number,
  maxMonths = 60,
): string {
  if (curve.length === 0) return '';
  const xOf = (m: number) => Math.min(viewW, (m / maxMonths) * viewW);
  const yOf = (s: number) => viewH - s * viewH;

  let prev = 1;
  let d = `M 0,${yOf(1)}`;
  for (const p of curve) {
    if (p.t > maxMonths) {
      d += ` L ${viewW},${yOf(prev)}`;
      return d;
    }
    d += ` L ${xOf(p.t)},${yOf(prev)} L ${xOf(p.t)},${yOf(p.survival)}`;
    prev = p.survival;
  }
  d += ` L ${viewW},${yOf(prev)}`;
  return d;
}

/** K-M step 기반 95% CI 띠 */
export function buildKmStepCiBand(
  curve: { t: number; survival: number; variance: number }[],
  viewW: number,
  viewH: number,
  maxMonths = 60,
): string {
  if (curve.length === 0) return '';
  const xOf = (m: number) => Math.min(viewW, (m / maxMonths) * viewW);
  const yOf = (s: number) => viewH - Math.max(0, Math.min(1, s)) * viewH;

  const upper: [number, number][] = [[0, 1]];
  const lower: [number, number][] = [[0, 1]];
  let prevU = 1;
  let prevL = 1;

  for (const p of curve) {
    if (p.t > maxMonths) break;
    const se = Math.sqrt(Math.max(0, p.variance));
    const u = Math.min(1, p.survival + 1.96 * se);
    const l = Math.max(0, p.survival - 1.96 * se);
    upper.push([p.t, prevU], [p.t, u]);
    lower.push([p.t, prevL], [p.t, l]);
    prevU = u;
    prevL = l;
  }
  upper.push([maxMonths, prevU]);
  lower.push([maxMonths, prevL]);

  const up = upper.map(([x, y]) => `${xOf(x)},${yOf(y)}`).join(' L ');
  const down = lower.reverse().map(([x, y]) => `${xOf(x)},${yOf(y)}`).join(' L ');
  return `M ${up} L ${down} Z`;
}

/** K-M step curve에서 앵커 샘플링 (부드러운 곡선용) */
export function sampleKmAnchors(
  curve: { t: number; survival: number }[],
  maxMonths = 60,
): SurvivalAnchor[] {
  if (curve.length === 0) return [{ months: 0, survival: 1 }];

  const atTime = (t: number): number => {
    if (t < curve[0].t) return 1;
    let idx = 0;
    for (let i = 0; i < curve.length; i++) {
      if (curve[i].t <= t) idx = i;
      else break;
    }
    return curve[idx].survival;
  };

  return DEFAULT_ANCHOR_MONTHS.filter((m) => m <= maxMonths).map((months) => ({
    months,
    survival: atTime(months),
  }));
}

/** 1·3·5년(%) 앵커 — K-M 시점값이 있을 때 */
export function anchorsFromYearly(
  year1: number | null,
  year3: number | null,
  year5: number | null,
): SurvivalAnchor[] {
  const anchors: SurvivalAnchor[] = [{ months: 0, survival: 1 }];
  if (year1 !== null) anchors.push({ months: 12, survival: year1 / 100 });
  if (year3 !== null) anchors.push({ months: 36, survival: year3 / 100 });
  if (year5 !== null) anchors.push({ months: 60, survival: year5 / 100 });
  return anchors;
}

/** 5년 생존율만 있을 때 1·3년 대략 보간 (인구곡선 형태) */
export function anchorsFromYear5Only(year5Pct: number): SurvivalAnchor[] {
  const y5 = year5Pct / 100;
  const y1 = Math.min(0.95, y5 * 2.1 + 0.38);
  const y3 = Math.min(0.9, y5 * 1.65 + 0.18);
  return [
    { months: 0, survival: 1 },
    { months: 12, survival: y1 },
    { months: 36, survival: y3 },
    { months: 60, survival: y5 },
  ];
}

export function buildSmoothSvgPath(
  anchors: SurvivalAnchor[],
  viewW: number,
  viewH: number,
  maxMonths = 60,
): string {
  if (anchors.length < 2) return '';

  const pts = anchors
    .filter((a) => a.months <= maxMonths)
    .map((a) => ({
      x: (a.months / maxMonths) * viewW,
      y: viewH - Math.max(0, Math.min(1, a.survival)) * viewH,
    }));

  if (pts.length < 2) return '';

  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

/** K-M + CI 앵커 → 부드러운 CI 띠 (대략) */
export function buildSmoothCiBand(
  curve: { t: number; survival: number; variance: number }[],
  viewW: number,
  viewH: number,
  maxMonths = 60,
): string {
  if (curve.length === 0) return '';

  const atTime = (t: number) => {
    if (t < curve[0].t) return { s: 1, v: 0 };
    let idx = 0;
    for (let i = 0; i < curve.length; i++) {
      if (curve[i].t <= t) idx = i;
      else break;
    }
    return { s: curve[idx].survival, v: curve[idx].variance };
  };

  const upperAnchors: SurvivalAnchor[] = [];
  const lowerAnchors: SurvivalAnchor[] = [];

  for (const months of DEFAULT_ANCHOR_MONTHS.filter((m) => m <= maxMonths)) {
    const { s, v } = atTime(months);
    const se = Math.sqrt(Math.max(0, v));
    upperAnchors.push({ months, survival: Math.min(1, s + 1.96 * se) });
    lowerAnchors.push({ months, survival: Math.max(0, s - 1.96 * se) });
  }

  const up = buildSmoothSvgPath(upperAnchors, viewW, viewH, maxMonths);
  if (!up) return '';

  const xOf = (m: number) => (m / maxMonths) * viewW;
  const yOf = (s: number) => viewH - Math.max(0, Math.min(1, s)) * viewH;

  let d = up;
  for (const a of [...lowerAnchors].reverse()) {
    d += ` L ${xOf(a.months).toFixed(2)},${yOf(a.survival).toFixed(2)}`;
  }
  return `${d} Z`;
}
