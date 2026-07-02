import { describe, expect, it } from 'vitest';
import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  formatModelPrice,
  formatModelPriceShort,
  getChatModel,
  getDefaultChatModel,
  resolveOpenAiTokenLimitKey,
} from './llm-models';

describe('getChatModel', () => {
  it('존재하는 모델', () => {
    expect(getChatModel('gpt-5.5').provider).toBe('openai');
  });

  it('없는 모델 — 기본값', () => {
    expect(getChatModel('nonexistent').id).toBe(DEFAULT_CHAT_MODEL_ID);
  });
});

describe('getDefaultChatModel', () => {
  it('기본 모델 반환', () => {
    expect(getDefaultChatModel().id).toBe(DEFAULT_CHAT_MODEL_ID);
  });
});

describe('formatModelPrice', () => {
  it('가격 포맷', () => {
    const model = CHAT_MODELS[0];
    expect(formatModelPrice(model)).toContain('per 1M tokens');
    expect(formatModelPrice(model)).toContain('input');
    expect(formatModelPrice(model)).toContain('output');
  });
});

describe('formatModelPriceShort', () => {
  it('짧은 가격 포맷', () => {
    const model = CHAT_MODELS.find((m) => m.inputPricePerM < 1)!;
    expect(formatModelPriceShort(model)).toMatch(/input \$0\.\d+/);
    expect(formatModelPriceShort(model)).not.toContain('per 1M');
  });
});

describe('resolveOpenAiTokenLimitKey', () => {
  it('카탈로그 모델 — openAiTokenLimitKey', () => {
    expect(resolveOpenAiTokenLimitKey('gpt-5.5')).toBe('max_completion_tokens');
    expect(resolveOpenAiTokenLimitKey('gemini-3.1-flash-lite')).toBe(
      'max_tokens',
    );
  });

  it('비카탈로그 GPT-5/o 시리즈', () => {
    expect(resolveOpenAiTokenLimitKey('gpt-5-custom')).toBe(
      'max_completion_tokens',
    );
    expect(resolveOpenAiTokenLimitKey('o3-mini')).toBe('max_completion_tokens');
  });

  it('레거시 모델', () => {
    expect(resolveOpenAiTokenLimitKey('gpt-4o')).toBe('max_tokens');
  });
});
