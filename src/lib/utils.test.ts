import { describe, expect, it } from 'vitest';
import {
  histologyLabel,
  usesDriverMutationFilter,
  usesNsclcBiomarkerPanel,
} from './utils';

describe('usesNsclcBiomarkerPanel', () => {
  it('smallcell 제외', () => {
    expect(usesNsclcBiomarkerPanel(null)).toBe(false);
    expect(usesNsclcBiomarkerPanel('smallcell')).toBe(false);
    expect(usesNsclcBiomarkerPanel('adenocarcinoma')).toBe(true);
  });
});

describe('usesDriverMutationFilter', () => {
  it('usesNsclcBiomarkerPanel과 동일', () => {
    expect(usesDriverMutationFilter('squamous')).toBe(
      usesNsclcBiomarkerPanel('squamous'),
    );
  });
});

describe('histologyLabel', () => {
  it('조직형 라벨', () => {
    expect(histologyLabel(null)).toBe('-');
    expect(histologyLabel('adenocarcinoma')).toBe('선암');
    expect(histologyLabel('squamous')).toBe('편평상피세포암');
    expect(histologyLabel('others')).toBe('기타 비소세포암');
    expect(histologyLabel('smallcell')).toBe('소세포암');
  });
});
