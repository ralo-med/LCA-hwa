import { useCallback, useEffect, useState } from 'react';
import {
  applyFontScale,
  DEFAULT_FONT_SCALE,
  FONT_SCALE_OPTIONS,
  getFontScaleOption,
  type FontScaleId,
} from '@/lib/font-scale';

const STORAGE_KEY = 'lca-font-scale';

function loadFontScale(): FontScaleId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'normal' || raw === 'large' || raw === 'xlarge') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_FONT_SCALE;
}

export function useFontScale() {
  const [scaleId, setScaleId] = useState<FontScaleId>(loadFontScale);

  useEffect(() => {
    applyFontScale(scaleId);
  }, [scaleId]);

  const setScale = useCallback((id: FontScaleId) => {
    setScaleId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const cycle = useCallback(() => {
    setScaleId((prev) => {
      const idx = FONT_SCALE_OPTIONS.findIndex((o) => o.id === prev);
      const next = FONT_SCALE_OPTIONS[(idx + 1) % FONT_SCALE_OPTIONS.length];
      try {
        localStorage.setItem(STORAGE_KEY, next.id);
      } catch {
        /* ignore */
      }
      return next.id;
    });
  }, []);

  return {
    scaleId,
    setScale,
    cycle,
    options: FONT_SCALE_OPTIONS,
    label: getFontScaleOption(scaleId).label,
  };
}
