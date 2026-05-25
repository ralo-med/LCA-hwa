/**
 * 조직형별로 여러 cBioPortal 코호트를 풀링해 K-M 생존율 계산
 */
import {
  buildPatientRecords,
  fetchClinicalData,
  fetchMutations,
  type PatientRecord,
} from "@/lib/cbioportal";
import {
  ALL_LUNG_DRIVER_GENES,
  MUTATION_TO_ENTREZ,
  STUDIES_BY_HISTOLOGY,
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
  label: string;
  citation: string;
  population: StudyConfig["population"];
  n: number;
  totalN: number;
}

export interface SurvivalEstimate {
  year5: number | null;
  year3: number | null;
  year1: number | null;
  median: number | null;
  cohortN: number;
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
const cohortCache = new Map<Histology, CachedCohort>();
const inflight = new Map<Histology, Promise<CachedCohort>>();

async function fetchSingleStudy(
  study: StudyConfig,
  fetchDriverMutations: boolean,
): Promise<PatientRecord[]> {
  try {
    const clinical = await fetchClinicalData(study.studyId);
    const mutations = fetchDriverMutations
      ? await fetchMutations(
          getMutationProfileId(study.studyId),
          getSampleListId(study.studyId),
          ALL_LUNG_DRIVER_GENES,
        )
      : [];
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
      const recs = perStudyRecords[idx];
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
): SurvivalEstimate {
  return {
    year5: null,
    year3: null,
    year1: null,
    median: null,
    cohortN: 0,
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
    Array.from(wantedEntrez).some((g) => r.mutations.has(g));

  const cohort = applyFilters(records, [
    hasOS,
    matchSex,
    matchAge,
    matchMutation,
  ]);

  const cohortKeys = new Set(cohort.map((r) => `${r.studyId}::${r.patientId}`));
  const contributingStudies: ContributingStudy[] = studies
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
        n,
        totalN: studyRecords.length,
      };
    })
    .filter((c) => c.n > 0);

  const hasAsianCohort = contributingStudies.some(
    (c) => c.population === "Asian",
  );

  if (cohort.length < 5) {
    return emptyEstimate("조건 일치 환자 부족", ageBand, koreanReference);
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

  const studyCount = contributingStudies.length;
  const source = `cBioPortal · ${studyCount}개 연구 · n=${cohort.length}`;

  const year5 = s60?.val ?? null;
  const year3 = s36?.val ?? null;
  const year1 = s12?.val ?? null;

  return {
    year5,
    year3,
    year1,
    median: km.median !== null ? km.median / 12 : null,
    cohortN: cohort.length,
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
