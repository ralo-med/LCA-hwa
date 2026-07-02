export type FontScaleId = 'normal' | 'large' | 'xlarge';

export const DEFAULT_FONT_SCALE: FontScaleId = 'normal';

/**
 * 루트(html) font-size를 바꿔 rem 기반 전체 UI를 실제로 확대한다.
 * normal 16px 기준: text-sm=14px, text-base=16px (P0 최소 폰트 요건 충족)
 */
export const FONT_SCALE_OPTIONS: {
  id: FontScaleId;
  label: string;
  shortLabel: string;
  rootPx: number;
}[] = [
  { id: 'normal', label: '기본', shortLabel: '기본', rootPx: 16 },
  { id: 'large', label: '크게', shortLabel: '크게', rootPx: 18 },
  { id: 'xlarge', label: '아주 크게', shortLabel: '더 크게', rootPx: 20 },
];

export function getFontScaleOption(id: FontScaleId) {
  return (
    FONT_SCALE_OPTIONS.find((o) => o.id === id) ??
    FONT_SCALE_OPTIONS.find((o) => o.id === DEFAULT_FONT_SCALE)!
  );
}

export function applyFontScale(id: FontScaleId): void {
  const { rootPx } = getFontScaleOption(id);
  document.documentElement.style.fontSize = `${rootPx}px`;
}
