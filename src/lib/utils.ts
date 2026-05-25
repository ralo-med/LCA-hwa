import type { Histology } from '@/types';

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

export function saveTextFile(text: string, fileName: string): void {
  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function triggerPrint(): void {
  window.focus();
  setTimeout(() => window.print(), 200);
}

/** 소세포 제외 — NSCLC식 드라이버 변이·PD-L1 입력·필터 대상 */
export function usesNsclcBiomarkerPanel(h: Histology): boolean {
  return h !== 'smallcell';
}

/** @deprecated usesNsclcBiomarkerPanel 사용 */
export function usesDriverMutationFilter(h: Histology): boolean {
  return usesNsclcBiomarkerPanel(h);
}

export function histologyLabel(h: Histology): string {
  switch (h) {
    case 'adenocarcinoma':
      return '선암';
    case 'squamous':
      return '편평상피세포암';
    case 'others':
      return '기타 비소세포암';
    case 'smallcell':
      return '소세포암';
  }
}

export function generateIssueNumber(): string {
  return `CNUHH-LUNG-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
}
