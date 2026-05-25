import { useEffect, useState } from 'react';
import { estimateSurvival, type SurvivalEstimate } from '@/lib/survival-cbioportal';
import type { PatientProfile } from '@/types';

interface UseSurvivalResult {
  data: SurvivalEstimate | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 프로필 변화 시 cBioPortal에서 생존율 추정.
 * 300ms 디바운스 + StrictMode 중복 호출 방지.
 */
export function useSurvival(profile: PatientProfile, debounceMs: number = 300): UseSurvivalResult {
  const [data, setData] = useState<SurvivalEstimate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await estimateSurvival(profile);
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '생존율 데이터를 불러오지 못했습니다.');
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [profile, debounceMs]);

  return { data, isLoading, error };
}
