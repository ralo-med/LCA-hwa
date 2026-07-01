export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

function canWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * 모바일에서는 OS 공유 시트(카카오톡·문자 등)를 띄우고,
 * 지원하지 않으면 클립보드 복사로 대체한다.
 */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  const { title, text, url } = payload;

  if (canWebShare()) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // 공유 실패 시 복사로 폴백
    }
  }

  const clipboardText = url ? `${text}\n${url}` : text;
  try {
    await navigator.clipboard.writeText(clipboardText);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** 문자(SMS) 앱을 직접 여는 링크 */
export function buildSmsHref(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`;
}
