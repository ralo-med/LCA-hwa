import { useCallback, useState } from 'react';
import {
  DEFAULT_CHAT_FONT_SIZE,
  getChatFontSizeOption,
  type ChatFontSizeId,
} from '@/lib/chat-font-size';

const STORAGE_KEY = 'lca-chat-font-size';

function loadChatFontSize(): ChatFontSizeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_CHAT_FONT_SIZE;
}

export function useChatFontSize() {
  const [sizeId, setSizeId] = useState<ChatFontSizeId>(loadChatFontSize);
  const option = getChatFontSizeOption(sizeId);

  const setSize = useCallback((id: ChatFontSizeId) => {
    setSizeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    sizeId,
    setSize,
    label: option.label,
    className: option.className,
  };
}
