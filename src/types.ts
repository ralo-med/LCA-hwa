export type Gender = 'male' | 'female';
export type Histology = 'adenocarcinoma' | 'squamous' | 'others' | 'smallcell';
export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface GuideChatSource {
  docTitle: string;
  fileName: string;
  page: number;
  excerpt: string;
}

export type GuideAnswerType = 'chat' | 'general' | 'guideline';

export interface GuideChatMessage {
  role: ChatRole;
  text: string;
  sources?: GuideChatSource[];
  answerType?: GuideAnswerType;
}

export type GuideSearchMode = 'auto' | 'search' | 'chat';

export type GuideChatLoadingPhase = 'idle' | 'searching' | 'replying';

export interface MutationOption {
  id: string;
  label: string;
  bonus: number;
}

export interface Pdl1Option {
  id: string;
  label: string;
  bonus: number;
}

export interface SurvivalResult {
  year5: number;
  year3: number;
  year1: number;
  median: number;
}

export interface PatientProfile {
  age: number;
  gender: Gender;
  histology: Histology;
  selectedMutations: string[];
  pdl1: string;
}
