/**
 * 조직형별 cBioPortal 다중 코호트 매핑
 * cBioPortal 폐암 카테고리에 공개된 연구를 가능한 한 모두 포함합니다.
 * 각 study는 OS_MONTHS + `{studyId}_mutations` / `{studyId}_all` API 패턴 검증 완료.
 *
 * 주의: TCGA LUAD/LUSC는 PanCancer·GDC·Legacy 등 코호트 간 환자 중복이 있을 수 있어
 * totalN는 연구별 합이며, 고유 환자 수보다 클 수 있습니다.
 */
import type { Histology } from "@/types";

export interface StudyConfig {
  studyId: string;
  label: string;
  citation: string;
  population: "Western" | "Asian" | "Mixed";
  focus?: string;
  approxN: number;
}

export function getMutationProfileId(studyId: string): string {
  return `${studyId}_mutations`;
}

export function getSampleListId(studyId: string): string {
  return `${studyId}_all`;
}

/** Lung Adenocarcinoma (cBioPortal LUAD 목록) */
const LUAD_STUDIES: StudyConfig[] = [
  {
    studyId: "luad_mskcc_2023_met_organotropism",
    label: "LUAD Met Organotropism",
    citation: "MSK, Cancer Cell 2023",
    population: "Mixed",
    focus: "metastatic LUAD",
    approxN: 2653,
  },
  {
    studyId: "lung_msk_2017",
    label: "MSK NSCLC",
    citation: "MSK, Cancer Discov 2017",
    population: "Mixed",
    focus: "NSCLC mixed histology",
    approxN: 915,
  },
  {
    studyId: "luad_msk_npjpo_2021",
    label: "MSK LUAD NPJPO",
    citation: "MSK, NPJ Precision Oncology 2021",
    population: "Mixed",
    approxN: 426,
  },
  {
    studyId: "luad_mskcc_2020",
    label: "MSK LUAD",
    citation: "Caso et al. J Thorac Oncol 2020",
    population: "Mixed",
    approxN: 604,
  },
  {
    studyId: "luad_tcga_gdc",
    label: "TCGA LUAD (GDC)",
    citation: "TCGA GDC 2025",
    population: "Western",
    approxN: 559,
  },
  {
    studyId: "luad_tcga_pan_can_atlas_2018",
    label: "TCGA LUAD PanCancer Atlas",
    citation: "TCGA, Cell 2018",
    population: "Western",
    approxN: 566,
  },
  {
    studyId: "luad_oncosg_2020",
    label: "OncoSG LUAD",
    citation: "Chen et al. Nat Genet 2020",
    population: "Asian",
    focus: "East Asian",
    approxN: 302,
  },
  {
    studyId: "lung_nci_2022",
    label: "Never Smokers (NCI)",
    citation: "NCI, Nature Genetics 2021",
    population: "Western",
    focus: "never smokers",
    approxN: 232,
  },
  {
    studyId: "luad_broad",
    label: "Broad LUAD",
    citation: "Broad, Cell 2012",
    population: "Western",
    approxN: 183,
  },
  {
    studyId: "luad_tsp",
    label: "LUAD TSP",
    citation: "TSP, Nature 2008",
    population: "Western",
    approxN: 163,
  },
  {
    studyId: "luad_mskimpact_2021",
    label: "MSK-IMPACT LUAD",
    citation: "Skoulidis et al. 2021",
    population: "Mixed",
    approxN: 186,
  },
  {
    studyId: "luad_cptac_gdc",
    label: "CPTAC LUAD (GDC)",
    citation: "CPTAC GDC 2025",
    population: "Western",
    approxN: 236,
  },
  {
    studyId: "luad_cptac_2020",
    label: "CPTAC LUAD",
    citation: "CPTAC, Cell 2020",
    population: "Western",
    approxN: 110,
  },
  {
    studyId: "luad_cas_2020",
    label: "CAS LUAD",
    citation: "CAS, Cell 2020",
    population: "Asian",
    focus: "Chinese cohort",
    approxN: 103,
  },
  {
    studyId: "luad_tcga_pub",
    label: "TCGA LUAD (Firehose)",
    citation: "TCGA Firehose Legacy",
    population: "Western",
    approxN: 230,
  },
  {
    studyId: "luad_tcga",
    label: "TCGA LUAD (Nature 2014)",
    citation: "TCGA, Nature 2014",
    population: "Western",
    approxN: 230,
  },
  {
    studyId: "luad_mskcc_2015",
    label: "MSK LUAD 2015",
    citation: "MSK, Science 2015",
    population: "Mixed",
    approxN: 35,
  },
];

/** Lung Squamous Cell Carcinoma (cBioPortal LUSC 목록) */
const LUSC_STUDIES: StudyConfig[] = [
  {
    studyId: "lusc_tcga_gdc",
    label: "TCGA LUSC (GDC)",
    citation: "TCGA GDC 2025",
    population: "Western",
    approxN: 484,
  },
  {
    studyId: "lusc_tcga_pan_can_atlas_2018",
    label: "TCGA LUSC PanCancer Atlas",
    citation: "TCGA, Cell 2018",
    population: "Western",
    approxN: 484,
  },
  {
    studyId: "lusc_tcga_pub",
    label: "TCGA LUSC (Firehose)",
    citation: "TCGA Firehose Legacy",
    population: "Western",
    approxN: 178,
  },
  {
    studyId: "lusc_tcga",
    label: "TCGA LUSC (Nature 2012)",
    citation: "TCGA, Nature 2012",
    population: "Western",
    approxN: 178,
  },
  {
    studyId: "lusc_cptac_gdc",
    label: "CPTAC LUSC (GDC)",
    citation: "CPTAC GDC 2025",
    population: "Western",
    approxN: 110,
  },
  {
    studyId: "lusc_cptac_2021",
    label: "CPTAC LUSC",
    citation: "CPTAC, Cell 2021",
    population: "Western",
    approxN: 108,
  },
];

/**
 * Small Cell Lung Cancer — cBioPortal에 OS_MONTHS/OS_STATUS가 있는 연구만.
 * (JHU·CLCGP는 게놈만 있고 생존 임상데이터 없음)
 */
const SCLC_STUDIES: StudyConfig[] = [
  {
    studyId: "sclc_ucologne_2015",
    label: "U Cologne SCLC",
    citation: "George et al. Nature 2015",
    population: "Western",
    approxN: 120,
  },
  {
    studyId: "sclc_cancercell_gardner_2017",
    label: "SCLC Multi-Institute (PDX)",
    citation: "Gardner et al. Cancer Cell 2017",
    population: "Western",
    focus: "paired chemo-sensitive/resistant PDX",
    approxN: 20,
  },
];

/** Non-Small Cell Lung Cancer (cBioPortal NSCLC 목록) */
const NSCLC_STUDIES: StudyConfig[] = [
  {
    studyId: "nsclc_ctdx_msk_2022",
    label: "MSK ctDx Metastatic NSCLC",
    citation: "Jee et al. Nature Medicine 2022",
    population: "Mixed",
    focus: "metastatic / stage IV",
    approxN: 2621,
  },
  {
    studyId: "nsclc_tcga_broad_2016",
    label: "Pan-Lung TCGA",
    citation: "Campbell et al. Nat Genet 2016",
    population: "Western",
    focus: "LUAD + LUSC",
    approxN: 1144,
  },
  {
    studyId: "nsclc_tracerx_2017",
    label: "TRACERx NSCLC",
    citation: "TRACERx, NEJM & Nature 2017",
    population: "Western",
    approxN: 447,
  },
  {
    studyId: "bm_nsclc_mskcc_2023",
    label: "NSCLC Brain Metastasis",
    citation: "MSK, Nat Commun 2023",
    population: "Mixed",
    approxN: 322,
  },
  {
    studyId: "nsclc_pd1_msk_2018",
    label: "MSK NSCLC PD-1",
    citation: "MSK, J Clin Oncol 2018",
    population: "Mixed",
    approxN: 240,
  },
  {
    studyId: "alk_msk_2026",
    label: "MSK ALK NSCLC",
    citation: "MSK, 2026",
    population: "Mixed",
    approxN: 90,
  },
  {
    studyId: "nsclc_mskcc_2018",
    label: "MSK NSCLC 2018",
    citation: "MSK, Cancer Cell 2018",
    population: "Mixed",
    approxN: 75,
  },
  {
    studyId: "nsclc_unito_2016",
    label: "Turin NSCLC",
    citation: "University of Turin, Lung Cancer 2017",
    population: "Western",
    approxN: 41,
  },
  {
    studyId: "nsclc_mskcc_2015",
    label: "MSK NSCLC 2015",
    citation: "MSK, Science 2015",
    population: "Mixed",
    approxN: 16,
  },
];

export const STUDIES_BY_HISTOLOGY: Record<Histology, StudyConfig[]> = {
  adenocarcinoma: LUAD_STUDIES,
  squamous: LUSC_STUDIES,
  smallcell: SCLC_STUDIES,
  others: NSCLC_STUDIES,
};

/**
 * 우리 mutation option id → Entrez Gene ID
 */
export const MUTATION_TO_ENTREZ: Record<string, number | null> = {
  none: null,
  egfr: 1956,
  alk: 238,
  ros1: 6098,
  braf: 673,
  ntrk: 4914,
  met: 4233,
  ret: 5979,
  kras: 3845,
  egfr20: 1956,
  her2: 2064,
};

export const ALL_LUNG_DRIVER_GENES = Array.from(
  new Set(
    Object.values(MUTATION_TO_ENTREZ).filter((v): v is number => v !== null),
  ),
);
