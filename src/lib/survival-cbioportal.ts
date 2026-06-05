/**
 * 조직형별로 여러 cBioPortal 코호트를 풀링해 K-M 생존율 계산
 */
import {
  buildPatientRecords,
  fetchClinicalData,
  fetchMutations,
  fetchStudyMeta,
  pubmedUrl,
  type PatientRecord,
} from "@/lib/cbioportal";
import {
  ALL_LUNG_DRIVER_GENES,
  MUTATION_TO_ENTREZ,
  STUDIES_BY_HISTOLOGY,
  getCbioportalStudyUrl,
  getMutationProfileId,
  getSampleListId,
  type StudyConfig,
} from "@/lib/cohort-config";
import {
  getAgeDecadeBand,
  getKoreanReference,
  type KoreanReference,
} from "@/lib/korean-reference";
import {
  fitKaplanMeier,
  type KMPoint,
  type KMSample,
} from "@/lib/kaplan-meier";
import {
  estimateUntreatedFromTreated,
  type UntreatedSurvivalEstimate,
} from "@/lib/untreated-estimate";
import { usesDriverMutationFilter } from "@/lib/utils";
import type { Histology, PatientProfile } from "@/types";

export type { KoreanReference } from "@/lib/korean-reference";
export type { UntreatedSurvivalEstimate } from "@/lib/untreated-estimate";

export interface ContributingStudy {
  studyId: string;
  title: string;
  citation: string;
  population: StudyConfig["population"];
  cBioPortalUrl: string;
  paperUrl: string | null;
  /** 필터 후 이 연구에서 분석에 쓰인 환자 수 */
  n: number;
  /** 이 연구에서 생존(OS) 데이터가 있는 환자 수 */
  totalWithOsN: number;
}

interface ContributingStudyDraft {
  studyId: string;
  label: string;
  citation: string;
  population: StudyConfig["population"];
  cBioPortalUrl: string;
  n: number;
  totalWithOsN: number;
}

function toContributingStudy(row: ContributingStudyDraft): ContributingStudy {
  return {
    studyId: row.studyId,
    title: row.label,
    citation: row.citation,
    population: row.population,
    cBioPortalUrl: row.cBioPortalUrl,
    paperUrl: null,
    n: row.n,
    totalWithOsN: row.totalWithOsN,
  };
}

/** cBioPortal 연구 메타(제목·인용·PubMed) — 메모리 캐시 활용, 병렬 조회 */
export async function enrichContributingStudies(
  rows: ContributingStudy[],
): Promise<ContributingStudy[]> {
  return Promise.all(
    rows.map(async (row) => {
      const meta = await fetchStudyMeta(row.studyId);
      return {
        ...row,
        title: meta?.name ?? row.title,
        citation: meta?.citation ?? row.citation,
        paperUrl: meta?.pmid ? pubmedUrl(meta.pmid) : null,
      };
    }),
  );
}

/** 중앙 생존(OS) 숫자를 못/안 보여줄 때 이유 구분 */
export type MedianOsStatus = "estimated" | "not_reached" | "unavailable";

/** not_reached 안내용 — 여러 연구를 풀링한 K-M의 마지막 관찰 시점 */
export interface MedianFollowupSnapshot {
  /** 풀링 코호트에서 관찰된 최장 OS_MONTHS(연구별 최대값이 아님) */
  maxFollowupMonths: number;
  /** 위 시점의 합산 K-M 생존율 S(t)% */
  survivalAtMaxFollowupPct: number;
  studyCount: number;
  cohortN: number;
}

/** 카드 본문용 객관 라벨 */
export function getMedianOsSubtitle(status: MedianOsStatus): string {
  switch (status) {
    case "estimated":
      return "Kaplan–Meier median OS";
    case "not_reached":
      return "Median OS 미산출";
    case "unavailable":
      return "산출 불가";
  }
}

/** 물음표 툴팁 — 항상 동일한 환자·보호자용 설명 */
export function getMedianOsTooltipParagraphs(): string[] {
  return [
    "입력하신 나이·성별·변이와 비슷했던 다른 환자들을 여러 연구 기록에서 모아, 절반 정도가 사망할 때쯤이 대략 몇 년이었는지 보여 줍니다. ‘비슷한 경우에는 대체로 이 정도였다’는 맥락을 잡는 데 쓸 수 있습니다.",
    "본인이 그만큼 살아 있을 연수가 아닙니다. 치료·경과·다음 검사는 담당 전문의와 상의하세요.",
  ];
}

/** K-M 생존 곡선 물음표 툴팁 */
export function getKmCurveTooltipParagraphs(): string[] {
  return [
    "입력하신 나이·성별·변이와 비슷한 다른 환자들의 과거 기록(총 생존 기간·사망 여부)을 cBioPortal에서 모아, 시간이 지날수록 ‘아직 살아 있는 비율’이 어떻게 줄어드는지 보여 주는 그래프입니다.",
    "실선은 Kaplan–Meier 방식입니다. 한동안은 수평으로 가다가, 그 시점에 사망이 기록되면 한 번 아래로 떨어지는 계단 모양입니다. 부드러운 곡선이 아니라 통계에서 쓰는 정석 표현이며, 환자 수가 적거나 사망 시점이 들쭉날쭉하면 계단이 더 잘 보입니다.",
    "연한 초록 띠는 95% 신뢰구간(대략적인 불확실 범위)입니다. 점선은 미치료 비교용 추정이며, 같은 방식으로 그린 실측 곡선이 아닙니다.",
    "본인의 앞으로 생존 곡선이 아닙니다. 해석은 담당 전문의와 상의하세요.",
  ];
}

/** 5년 K-M 생존 추정치 물음표 툴팁 */
export function getYear5KmTooltipParagraphs(): string[] {
  return [
    "입력하신 나이·성별·변이와 비슷했던 다른 환자들을 여러 연구 기록에서 모아, 대략 5년 뒤에도 살아 있던 비율이 어느 정도였는지 보여 줍니다. ‘비슷한 경우에는 대체로 이 정도였다’는 맥락을 잡는 데 쓸 수 있습니다.",
    "본인이 5년 뒤에도 살아 있을 확률이 아닙니다. 치료·경과·다음 검사는 담당 전문의와 상의하세요.",
  ];
}

/** 미산출일 때만 카드 본문(부제 아래)에 표시 */
export function getMedianOsNotReachedNote(
  followup?: MedianFollowupSnapshot | null,
): string[] {
  if (!followup || followup.maxFollowupMonths <= 0) {
    return [
      "아직 절반이 사망한 시점을 ‘몇 년’으로 말하기 어렵습니다.",
      "조사가 끝날 때까지 절반 이상이 살아 있는 편으로 보이지만, 본인 결과와는 다를 수 있습니다.",
    ];
  }
  const years = Math.max(1, Math.round(followup.maxFollowupMonths / 12));
  const surv = Math.round(followup.survivalAtMaxFollowupPct);
  return [
    "아직 절반이 사망한 시점을 ‘몇 년’으로 말하기 어렵습니다.",
    `비슷한 과거 기록을 모아 보면, 조사가 대략 ${years}년쯤까지 이어졌을 때에도 약 ${surv}%가 생존한 것으로 보입니다. 여러 병원·연구 자료를 섞은 참고치입니다.`,
  ];
}

export interface SurvivalEstimate {
  year5: number | null;
  year3: number | null;
  year1: number | null;
  median: number | null;
  medianOsStatus: MedianOsStatus;
  /** 풀링 K-M에서 마지막으로 관찰된 OS 시점(개월) */
  maxFollowupMonths: number;
  /** 위 시점 합산 K-M S(t)% — not_reached 설명용 */
  survivalAtMaxFollowupPct: number | null;
  cohortN: number;
  /** 기여 연구만 — OS 데이터 있는 환자 수(연령·성별·변이 필터 전) */
  poolOsN: number;
  /** 분석에 1명 이상 포함된 연구 수 (= 사용 연구만) */
  studiesContributing: number;
  source: string;
  ci95Year5: [number, number] | null;
  insufficient: boolean;
  contributingStudies: ContributingStudy[];
  hasAsianCohort: boolean;
  ageBand: [number, number];
  curve: KMPoint[];
  unavailableReason?: string;
  koreanReference: KoreanReference;
  untreatedEstimate: UntreatedSurvivalEstimate | null;
}

interface CachedCohort {
  studies: StudyConfig[];
  records: PatientRecord[];
  byStudy: Map<string, PatientRecord[]>;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const LS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LS_COHORT_PREFIX = "lca-cohort-cache:";
const cohortCache = new Map<Histology, CachedCohort>();
const inflight = new Map<Histology, Promise<CachedCohort>>();

type SerializedPatientRecord = Omit<PatientRecord, "mutations"> & {
  mutations: number[];
};

function serializeRecords(records: PatientRecord[]): SerializedPatientRecord[] {
  return records.map((r) => ({
    ...r,
    mutations: [...r.mutations],
  }));
}

function deserializeRecords(rows: SerializedPatientRecord[]): PatientRecord[] {
  return rows.map((r) => ({
    ...r,
    mutations: new Set(r.mutations),
  }));
}

function buildByStudy(
  studies: StudyConfig[],
  records: PatientRecord[],
): Map<string, PatientRecord[]> {
  const byStudy = new Map<string, PatientRecord[]>();
  for (const study of studies) {
    byStudy.set(study.studyId, []);
  }
  for (const rec of records) {
    const list = byStudy.get(rec.studyId);
    if (list) list.push(rec);
  }
  return byStudy;
}

function loadPersistedCohort(histology: Histology): CachedCohort | null {
  try {
    const raw = localStorage.getItem(`${LS_COHORT_PREFIX}${histology}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      studies: StudyConfig[];
      records: SerializedPatientRecord[];
      fetchedAt: number;
    };
    if (Date.now() - parsed.fetchedAt > LS_CACHE_TTL_MS) return null;
    const records = deserializeRecords(parsed.records);
    return {
      studies: parsed.studies,
      records,
      byStudy: buildByStudy(parsed.studies, records),
      fetchedAt: parsed.fetchedAt,
    };
  } catch {
    return null;
  }
}

function persistCohort(histology: Histology, cohort: CachedCohort): void {
  try {
    localStorage.setItem(
      `${LS_COHORT_PREFIX}${histology}`,
      JSON.stringify({
        studies: cohort.studies,
        records: serializeRecords(cohort.records),
        fetchedAt: cohort.fetchedAt,
      }),
    );
  } catch {
    /* quota exceeded 등 — 메모리 캐시만 사용 */
  }
}

async function fetchSingleStudy(
  study: StudyConfig,
  fetchDriverMutations: boolean,
): Promise<PatientRecord[]> {
  try {
    const [clinical, mutations] = await Promise.all([
      fetchClinicalData(study.studyId),
      fetchDriverMutations
        ? fetchMutations(
            getMutationProfileId(study.studyId),
            getSampleListId(study.studyId),
            ALL_LUNG_DRIVER_GENES,
          )
        : Promise.resolve([] as Awaited<ReturnType<typeof fetchMutations>>),
    ]);
    return buildPatientRecords(clinical, mutations);
  } catch (err) {
    console.warn(`[cohort] ${study.studyId} fetch 실패`, err);
    return [];
  }
}

export async function loadCohort(histology: Histology): Promise<CachedCohort> {
  const cached = cohortCache.get(histology);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const persisted = loadPersistedCohort(histology);
  if (persisted) {
    cohortCache.set(histology, persisted);
    return persisted;
  }

  const existing = inflight.get(histology);
  if (existing) return existing;

  const studies = STUDIES_BY_HISTOLOGY[histology];
  const fetchDriverMutations = usesDriverMutationFilter(histology);

  const promise = (async () => {
    const perStudyRecords = await Promise.all(
      studies.map((s) => fetchSingleStudy(s, fetchDriverMutations)),
    );
    const records: PatientRecord[] = [];
    const byStudy = new Map<string, PatientRecord[]>();
    studies.forEach((study, idx) => {
      const recs = perStudyRecords[idx] ?? [];
      byStudy.set(study.studyId, recs);
      records.push(...recs);
    });
    const cohort: CachedCohort = {
      studies,
      records,
      byStudy,
      fetchedAt: Date.now(),
    };
    cohortCache.set(histology, cohort);
    persistCohort(histology, cohort);
    return cohort;
  })();

  inflight.set(histology, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(histology);
  }
}

type Filter = (r: PatientRecord) => boolean;

function applyFilters(
  records: PatientRecord[],
  filters: Filter[],
): PatientRecord[] {
  return records.filter((r) => filters.every((f) => f(r)));
}

function emptyEstimate(
  reason: string,
  ageBand: [number, number],
  koreanReference: KoreanReference,
  poolOsN = 0,
  studiesContributing = 0,
): SurvivalEstimate {
  return {
    year5: null,
    year3: null,
    year1: null,
    median: null,
    medianOsStatus: "unavailable",
    maxFollowupMonths: 0,
    survivalAtMaxFollowupPct: null,
    cohortN: 0,
    poolOsN,
    studiesContributing,
    source: reason,
    ci95Year5: null,
    insufficient: true,
    contributingStudies: [],
    hasAsianCohort: false,
    ageBand,
    curve: [],
    unavailableReason: reason,
    koreanReference,
    untreatedEstimate: null,
  };
}

export async function estimateSurvival(
  profile: PatientProfile,
): Promise<SurvivalEstimate> {
  const { histology, gender, age, selectedMutations } = profile;
  const ageBand = getAgeDecadeBand(age);
  const koreanReference = getKoreanReference(histology);

  const { studies, records, byStudy } = await loadCohort(histology);

  const wantSex: "Male" | "Female" = gender === "female" ? "Female" : "Male";
  const wantedEntrez = new Set<number>(
    selectedMutations
      .map((id) => MUTATION_TO_ENTREZ[id])
      .filter((v): v is number => v !== null && v !== undefined),
  );
  const requiresMutation =
    usesDriverMutationFilter(histology) &&
    wantedEntrez.size > 0 &&
    !selectedMutations.includes("none");

  const hasOS: Filter = (r) => r.osStatus !== null && r.osMonths !== null;
  const matchSex: Filter = (r) => !r.sex || r.sex === wantSex;
  const matchAge: Filter = (r) =>
    r.age === null || (r.age >= ageBand[0] && r.age <= ageBand[1]);
  const matchMutation: Filter = (r) =>
    !requiresMutation ||
    Array.from(wantedEntrez).every((g) => r.mutations.has(g));

  const cohort = applyFilters(records, [
    hasOS,
    matchSex,
    matchAge,
    matchMutation,
  ]);

  const cohortKeys = new Set(cohort.map((r) => `${r.studyId}::${r.patientId}`));
  const contributingBase = studies
    .map((s) => {
      const studyRecords = byStudy.get(s.studyId) ?? [];
      const n = studyRecords.filter((r) =>
        cohortKeys.has(`${r.studyId}::${r.patientId}`),
      ).length;
      return {
        studyId: s.studyId,
        label: s.label,
        citation: s.citation,
        population: s.population,
        cBioPortalUrl: getCbioportalStudyUrl(s.studyId),
        n,
        totalWithOsN: studyRecords.filter(hasOS).length,
      };
    })
    .filter((c) => c.n > 0);

  const contributingStudies = contributingBase.map(toContributingStudy);

  const contributingStudyIds = new Set(
    contributingStudies.map((c) => c.studyId),
  );
  const studiesContributing = contributingStudies.length;
  const poolOsN = records.filter(
    (r) => contributingStudyIds.has(r.studyId) && hasOS(r),
  ).length;

  const hasAsianCohort = contributingStudies.some(
    (c) => c.population === "Asian",
  );

  if (cohort.length < 5) {
    return emptyEstimate(
      "조건 일치 환자 부족",
      ageBand,
      koreanReference,
      poolOsN,
      studiesContributing,
    );
  }

  const samples: KMSample[] = cohort.map((r) => ({
    timeMonths: r.osMonths as number,
    event: r.osStatus === "1:DECEASED",
  }));

  const km = fitKaplanMeier(samples);
  const maxFollowup = km.curve.length > 0 ? km.curve[km.curve.length - 1].t : 0;

  const safeAt = (
    months: number,
  ): { val: number; ci: [number, number] } | null => {
    if (months > maxFollowup) return null;
    const s = km.atTime(months);
    return { val: s.survival * 100, ci: [s.ci95[0] * 100, s.ci95[1] * 100] };
  };

  const s60 = safeAt(60);
  const s36 = safeAt(36);
  const s12 = safeAt(12);

  const source = `cBioPortal · ${studiesContributing}개 연구 · 분석 n=${cohort.length}`;

  const year5 = s60?.val ?? null;
  const year3 = s36?.val ?? null;
  const year1 = s12?.val ?? null;

  const medianOsStatus: MedianOsStatus =
    km.median !== null ? "estimated" : "not_reached";
  const atMaxFollowup = km.atTime(maxFollowup);
  const survivalAtMaxFollowupPct =
    km.curve.length > 0 ? atMaxFollowup.survival * 100 : null;

  return {
    year5,
    year3,
    year1,
    median: km.median !== null ? km.median / 12 : null,
    medianOsStatus,
    maxFollowupMonths: maxFollowup,
    survivalAtMaxFollowupPct,
    cohortN: cohort.length,
    poolOsN,
    studiesContributing,
    source,
    ci95Year5: s60?.ci ?? null,
    insufficient: cohort.length < 30,
    contributingStudies,
    hasAsianCohort,
    ageBand,
    curve: km.curve,
    koreanReference,
    untreatedEstimate: estimateUntreatedFromTreated(year1, year3, year5),
  };
}
