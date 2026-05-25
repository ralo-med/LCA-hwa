/**
 * Kaplan-Meier 추정량 + Greenwood 분산 기반 95% 신뢰구간
 *
 * 입력: (시간, 사건여부) 튜플 배열
 *   - time (months): 마지막 추적 시점 또는 사망 시점
 *   - event = true → 사망(이벤트 발생), false → 중도절단(censored)
 */

export interface KMSample {
  timeMonths: number;
  event: boolean;
}

export interface KMPoint {
  t: number; // months
  survival: number; // S(t) ∈ [0,1]
  variance: number; // Greenwood variance estimate
  atRisk: number; // n_i
  events: number; // d_i
}

export interface KMResult {
  curve: KMPoint[]; // 시간 오름차순
  median: number | null; // 추정 중앙 생존 (months), 불가 시 null
  atTime: (t: number) => { survival: number; ci95: [number, number] };
}

/**
 * 유효 샘플만 K-M에 투입 (time>=0, status 정의됨)
 */
export function fitKaplanMeier(samples: KMSample[]): KMResult {
  const data = samples
    .filter((s) => Number.isFinite(s.timeMonths) && s.timeMonths >= 0)
    .sort((a, b) => a.timeMonths - b.timeMonths);

  const curve: KMPoint[] = [];
  let survival = 1.0;
  let varianceSum = 0; // Σ d_i / [n_i (n_i - d_i)] for Greenwood
  let atRisk = data.length;

  // 같은 시점에 여러 환자가 있을 수 있으므로 이벤트 시점별 그룹핑
  let i = 0;
  while (i < data.length) {
    const t = data[i].timeMonths;
    let events = 0;
    let censored = 0;
    let j = i;
    while (j < data.length && data[j].timeMonths === t) {
      if (data[j].event) events++;
      else censored++;
      j++;
    }

    if (events > 0 && atRisk > 0) {
      const n = atRisk;
      const d = events;
      survival = survival * (1 - d / n);
      if (n - d > 0) varianceSum += d / (n * (n - d));
    }

    curve.push({
      t,
      survival,
      variance: survival * survival * varianceSum,
      atRisk,
      events,
    });

    atRisk -= events + censored;
    i = j;
  }

  // 중앙 생존: S(t) ≤ 0.5가 되는 첫 t
  const medianPoint = curve.find((p) => p.survival <= 0.5);
  const median = medianPoint?.t ?? null;

  // 임의 시점 t에서의 S(t) 추정 (step function의 마지막 값)
  const atTime = (t: number): { survival: number; ci95: [number, number] } => {
    if (curve.length === 0) return { survival: 1, ci95: [1, 1] };
    if (t < curve[0].t) return { survival: 1, ci95: [1, 1] };
    let lo = 0;
    let hi = curve.length - 1;
    let idx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (curve[mid].t <= t) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const p = curve[idx];
    const se = Math.sqrt(Math.max(0, p.variance));
    const lower = Math.max(0, p.survival - 1.96 * se);
    const upper = Math.min(1, p.survival + 1.96 * se);
    return { survival: p.survival, ci95: [lower, upper] };
  };

  return { curve, median, atTime };
}
