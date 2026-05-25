import type { Histology } from "@/types";
import { usesNsclcBiomarkerPanel } from "@/lib/utils";

export interface Pdl1TierNote {
  id: string;
  /** 버튼 라벨 */
  buttonLabel: string;
  /** 상세 제목 */
  range: string;
  treatment: string;
  survival: string;
}

export interface Pdl1SurvivalReference {
  title: string;
  intro: string;
  tiers: Pdl1TierNote[];
  caveat: string;
}

const NSCLC_REFERENCE: Pdl1SurvivalReference = {
  title: "PD-L1 검사, 쉽게 알아보기",
  intro:
    "PD-L1(피디엘원) 검사는 암세포에 ‘면역 치료가 잘 통할지’를 가늠하는 혈액·조직 검사입니다. 결과는 보통 0~100% 숫자(TPS)로 나옵니다. 숫자만으로 약이 정해지지는 않으며, 담당 전문의와 상의해야 합니다. 오른쪽 생존 그래프에는 이 검사가 들어가 있지 않으니, 아래에서 구간별로 ‘대략 어떤 차이가 있는지’만 참고해 주세요.",
  tiers: [
    {
      id: "50",
      buttonLabel: "50% 이상",
      range: "검사 결과가 50% 이상일 때",
      treatment:
        "면역항암제(키트루다·펨브롤리주맙 등)를 항암제 없이 단독으로 1차 치료에 쓸 수 있는 경우가 많습니다. 화학요법을 바로 시작하지 않아도 되는지 전문의와 함께 결정합니다.",
      survival:
        "임상시험에서는 이 구간에서 면역항암제 단독이, 숫자가 낮은 경우보다 암이 더딘 진행·전체 생존이 나은 경향이 보고되었습니다. 다만 사람마다 다르며, 위 그래프 숫자와 직접 연결되지는 않습니다.",
    },
    {
      id: "1-49",
      buttonLabel: "1~49%",
      range: "검사 결과가 1% 이상, 50% 미만일 때",
      treatment:
        "면역항암제만 단독으로 쓰기보다, 항암제(화학요법)와 면역항암제를 함께 맞는 경우가 많습니다. ‘단독 vs 병용’은 병기·체력·다른 검사 결과를 보고 정합니다.",
      survival:
        "이 구간에서는 면역항암제 ‘단독’의 이점이 50% 이상일 때보다 작을 수 있다는 연구 결과가 있습니다. 병용 치료를 받은 분들의 생존은 개인차가 큽니다.",
    },
    {
      id: "0",
      buttonLabel: "1% 미만",
      range: "검사 결과가 1% 미만(거의 없음)일 때",
      treatment:
        "면역항암제만으로 1차 치료를 시작하기 어렵다고 보는 경우가 많습니다. 화학요법·표적치료(EGFR·ALK 등 다른 유전자 검사 결과)를 먼저 검토하는 일이 흔합니다.",
      survival:
        "숫자가 낮다고 해서 ‘치료가 안 통한다’는 뜻은 아닙니다. 다른 약·병용 요법으로 생존을 늘린 분들도 많습니다. 유전자 변이·암이 퍼진 정도가 생존에 더 큰 영향을 주는 경우도 많습니다.",
    },
  ],
  caveat:
    "꼭 기억해 주세요: 최종 처방은 검사 숫자 하나가 아니라, 병기, 뇌·간 등 전이, 체력, 다른 유전자 검사, 이미 받은 치료를 모두 본 뒤 담당 전문의가 정합니다. 본인 검사지에 적힌 TPS%가 가장 정확합니다.",
};

const SCLC_REFERENCE: Pdl1SurvivalReference = {
  title: "소세포폐암과 PD-L1",
  intro:
    "소세포폐암은 PD-L1 숫자로 ‘어떤 약을 처음 쓸지’ 정하는 경우가 많지 않습니다. 보통 항암제와 면역항암제를 함께 쓰는 방식이 표준에 가깝습니다. 오른쪽 생존 그래프는 PD-L1과 연결되어 있지 않습니다.",
  tiers: [
    {
      id: "sclc",
      buttonLabel: "소세포 안내",
      range: "소세포폐암에서 PD-L1 검사",
      treatment:
        "PD-L1 %보다 ‘소세포라는 조직형’과 병기, 체력이 1차 치료 선택에 더 중요하게 쓰이는 경우가 많습니다. 담당 전문의가 안내하는 표준 치료(예: 항암제+면역항암제 병용)를 따르시면 됩니다.",
      survival:
        "이 앱의 생존 곡선은 PD-L1과 무관하게 조직형·나이 등으로만 맞춰져 있습니다. 한국인 폐암 생존 통계는 그래프의 ‘한국 참고’ 선을 함께 보시면 됩니다.",
    },
  ],
  caveat:
    "궁금한 점은 담당 전문의·간호사에게 물어보시는 것이 가장 안전합니다. 이 안내는 교육용이며, 처방을 대신하지 않습니다.",
};

export function getPdl1SurvivalReference(
  histology: Histology,
): Pdl1SurvivalReference | null {
  if (!usesNsclcBiomarkerPanel(histology)) return SCLC_REFERENCE;
  return NSCLC_REFERENCE;
}
