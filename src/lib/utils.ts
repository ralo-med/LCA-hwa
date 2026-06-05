import type { Histology } from "@/types";

/** 소세포 제외 — NSCLC식 드라이버 변이 입력·K-M 필터 대상 */
export function usesNsclcBiomarkerPanel(h: Histology): boolean {
  return h !== "smallcell";
}

/** @deprecated usesNsclcBiomarkerPanel 사용 */
export function usesDriverMutationFilter(h: Histology): boolean {
  return usesNsclcBiomarkerPanel(h);
}

export function histologyLabel(h: Histology): string {
  switch (h) {
    case "adenocarcinoma":
      return "선암";
    case "squamous":
      return "편평상피세포암";
    case "others":
      return "기타 비소세포암";
    case "smallcell":
      return "소세포암";
  }
}

export function generateIssueNumber(): string {
  return `CNUHH-LUNG-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
}
