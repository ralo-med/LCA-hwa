/**
 * cBioPortal REST API 클라이언트
 * https://www.cbioportal.org/api/swagger-ui/index.html
 *
 * 인증 불필요, CORS 허용 → 브라우저에서 직접 호출 가능.
 */

const API_BASE = 'https://www.cbioportal.org/api';

export interface ClinicalDatum {
  patientId: string;
  studyId: string;
  clinicalAttributeId: string;
  value: string;
}

export interface MutationDatum {
  patientId: string;
  sampleId: string;
  studyId: string;
  entrezGeneId: number;
  proteinChange?: string;
  mutationType?: string;
}

export type OSStatus = '0:LIVING' | '1:DECEASED';

export interface PatientRecord {
  patientId: string;
  studyId: string;
  osMonths: number | null;
  osStatus: OSStatus | null;
  age: number | null;
  sex: 'Male' | 'Female' | null;
  stage: string | null;
  mutations: Set<number>; // entrezGeneIds with non-silent mutations
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`cBioPortal ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

const PATIENT_ATTRS = [
  'OS_MONTHS',
  'OS_STATUS',
  'AGE',
  'SEX',
  'AJCC_PATHOLOGIC_TUMOR_STAGE',
] as const;

export interface CbioStudyMeta {
  studyId: string;
  name: string;
  citation?: string;
  pmid?: string;
}

export function pubmedUrl(pmid: string | number): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${String(pmid)}/`;
}

const studyMetaCache = new Map<string, CbioStudyMeta | null>();

export async function fetchStudyMeta(
  studyId: string,
): Promise<CbioStudyMeta | null> {
  if (studyMetaCache.has(studyId)) {
    return studyMetaCache.get(studyId) ?? null;
  }
  try {
    const data = await fetchJson<{
      studyId: string;
      name: string;
      citation?: string;
      pmid?: string;
    }>(`/studies/${studyId}`);
    const meta: CbioStudyMeta = {
      studyId: data.studyId,
      name: data.name,
      citation: data.citation,
      pmid: data.pmid,
    };
    studyMetaCache.set(studyId, meta);
    return meta;
  } catch {
    studyMetaCache.set(studyId, null);
    return null;
  }
}

export async function fetchClinicalData(studyId: string): Promise<ClinicalDatum[]> {
  return fetchJson<ClinicalDatum[]>(
    `/studies/${studyId}/clinical-data?clinicalDataType=PATIENT&pageSize=10000`,
  );
}

export async function fetchMutations(
  molecularProfileId: string,
  sampleListId: string,
  entrezGeneIds: number[],
): Promise<MutationDatum[]> {
  if (entrezGeneIds.length === 0) return [];
  return fetchJson<MutationDatum[]>(
    `/molecular-profiles/${molecularProfileId}/mutations/fetch?projection=SUMMARY`,
    {
      method: 'POST',
      body: JSON.stringify({ sampleListId, entrezGeneIds }),
    },
  );
}

/**
 * 임상 데이터를 환자별로 머지 — 가공된 PatientRecord 배열 반환.
 * patientId가 study 간 충돌할 수 있으므로 `${studyId}::${patientId}`를 키로 사용.
 */
export function buildPatientRecords(
  clinical: ClinicalDatum[],
  mutations: MutationDatum[],
): PatientRecord[] {
  const byPatient = new Map<string, PatientRecord>();
  const key = (studyId: string, patientId: string) => `${studyId}::${patientId}`;

  for (const row of clinical) {
    const k = key(row.studyId, row.patientId);
    let rec = byPatient.get(k);
    if (!rec) {
      rec = {
        patientId: row.patientId,
        studyId: row.studyId,
        osMonths: null,
        osStatus: null,
        age: null,
        sex: null,
        stage: null,
        mutations: new Set<number>(),
      };
      byPatient.set(k, rec);
    }

    switch (row.clinicalAttributeId) {
      case 'OS_MONTHS': {
        const n = Number(row.value);
        rec.osMonths = Number.isFinite(n) ? n : null;
        break;
      }
      case 'OS_STATUS':
        rec.osStatus =
          row.value === '0:LIVING' || row.value === '1:DECEASED'
            ? (row.value as OSStatus)
            : null;
        break;
      case 'AGE': {
        const n = Number(row.value);
        rec.age = Number.isFinite(n) ? n : null;
        break;
      }
      case 'SEX':
        rec.sex = row.value === 'Male' || row.value === 'Female' ? row.value : null;
        break;
      case 'AJCC_PATHOLOGIC_TUMOR_STAGE':
        rec.stage = row.value;
        break;
    }
  }

  for (const m of mutations) {
    const rec = byPatient.get(key(m.studyId, m.patientId));
    if (rec) rec.mutations.add(m.entrezGeneId);
  }

  return Array.from(byPatient.values());
}

export { API_BASE, PATIENT_ATTRS };
