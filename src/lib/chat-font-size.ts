export type ChatFontSizeId = 'small' | 'medium' | 'large';

export const DEFAULT_CHAT_FONT_SIZE: ChatFontSizeId = 'medium';

export const CHAT_FONT_SIZE_OPTIONS: {
  id: ChatFontSizeId;
  label: string;
  className: string;
}[] = [
  { id: 'small', label: '작게', className: 'text-xs' },
  { id: 'medium', label: '보통', className: 'text-sm' },
  { id: 'large', label: '크게', className: 'text-base' },
];

export function getChatFontSizeOption(id: ChatFontSizeId) {
  return (
    CHAT_FONT_SIZE_OPTIONS.find((o) => o.id === id) ??
    CHAT_FONT_SIZE_OPTIONS.find((o) => o.id === DEFAULT_CHAT_FONT_SIZE)!
  );
}
