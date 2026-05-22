import type { MutationOption, Pdl1Option } from './types';

export const MUTATION_OPTIONS: MutationOption[] = [
  { id: 'none', label: '변이 없음 / 미확인', bonus: 0 },
  { id: 'egfr', label: 'EGFR (L858R/ex19del)', bonus: 15 },
  { id: 'alk', label: 'ALK', bonus: 28 },
  { id: 'ros1', label: 'ROS1', bonus: 22 },
  { id: 'braf', label: 'BRAF (V600E)', bonus: 12 },
  { id: 'ntrk', label: 'NTRK', bonus: 25 },
  { id: 'met', label: 'MET (ex14 skipping)', bonus: 10 },
  { id: 'ret', label: 'RET', bonus: 18 },
  { id: 'kras', label: 'KRAS G12C', bonus: 8 },
  { id: 'egfr20', label: 'EGFR ex20ins', bonus: 7 },
  { id: 'her2', label: 'HER2', bonus: 9 },
];

export const PDL1_OPTIONS: Pdl1Option[] = [
  { id: '50', label: 'PD-L1 50% 이상', bonus: 12 },
  { id: '1-49', label: 'PD-L1 1-49%', bonus: 5 },
  { id: '0', label: 'PD-L1 0%', bonus: 0 },
  { id: 'unknown', label: '결과 없음', bonus: 0 },
];

export const TEXT_MODEL = 'gemini-2.5-flash-preview-09-2025';
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';
