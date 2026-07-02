import { describe, expect, it } from 'vitest';
import {
  CHAT_FONT_SIZE_OPTIONS,
  DEFAULT_CHAT_FONT_SIZE,
  getChatFontSizeOption,
} from './chat-font-size';

describe('getChatFontSizeOption', () => {
  it('유효 id — 해당 옵션', () => {
    expect(getChatFontSizeOption('small').id).toBe('small');
    expect(getChatFontSizeOption('large').className).toBe('text-base');
  });

  it('알 수 없는 id — 기본값', () => {
    // @ts-expect-error 테스트용 잘못된 id
    const option = getChatFontSizeOption('invalid');
    expect(option.id).toBe(DEFAULT_CHAT_FONT_SIZE);
    expect(option).toEqual(
      CHAT_FONT_SIZE_OPTIONS.find((o) => o.id === DEFAULT_CHAT_FONT_SIZE),
    );
  });
});
