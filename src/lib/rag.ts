import { EMBEDDING_MODEL, TEXT_MODEL } from "@/constants";
import { isOpenAIAvailable } from "@/lib/llm-settings";
import {
  callOpenAIEmbed,
  callOpenAIChat,
  type OpenAIChatMessage,
} from "@/lib/openai";
import {
  biomarkerSearchHint,
  buildPatientContextBlock,
  type GuidePatientContext,
} from "@/lib/guide-patient-context";
import { histologyLabel } from "@/lib/utils";

export type { GuidePatientContext } from "@/lib/guide-patient-context";
import type {
  GuideAnswerType,
  GuideChatMessage,
  GuideChatSource,
  GuideSearchMode,
  Histology,
} from "@/types";

export type GuideDocId = "metastatic" | "earlystage" | "sclc";

export const GUIDE_DOC_META: Record<
  GuideDocId,
  { fileName: string; title: string }
> = {
  metastatic: {
    fileName: "lung-metastatic-patient.pdf",
    title: "전이성 폐암 환자 안내",
  },
  earlystage: {
    fileName: "lung-early-stage-patient.pdf",
    title: "조기 폐암 환자 안내",
  },
  sclc: {
    fileName: "SCLC-patient-guideline.pdf",
    title: "소세포폐암 환자 가이드라인",
  },
};

export interface GuideChunk {
  id: string;
  docId: GuideDocId;
  docTitle: string;
  tags: string[];
  page: number;
  text: string;
  embedding: number[];
}

export interface GuideChunkStore {
  version: number;
  model: string | null;
  generatedAt: string;
  docs: { id: string; title: string; tags: string[] }[];
  chunks: GuideChunk[];
}

const SCLC_QUERY = /소세포|SCLC|small\s*cell/i;
const EARLY_STAGE_QUERY = /초기|조기|early\s*stage|1기|2기|stage\s*[12]|수술/i;
const METASTATIC_QUERY = /전이|전이성|metastatic|4기|stage\s*iv/i;
const NSCLC_GENERAL =
  /비소세포|NSCLC|선암|편평|대세포|기관지|squamous|adenocarcinoma/i;
const NUTRITION_QUERY =
  /영양|식이|식사|식욕|체중|음식|nutrition|diet|eating|weight/i;
const SUPPORTIVE_CARE_QUERY =
  /부작용|항암|지지|완화|증상|supportive|palliative|side effect|피로|오심|구토|설사|감염/i;
const OVERVIEW_QUERY =
  /가이드라인|정리|요약|개요|관련|알려\s*줘|줄로|overview|summary/i;
const BIOMARKER_QUERY =
  /PD[- ]?L1|EGFR|ALK|ROS1|BRAF|KRAS|면역관문|면역치료|immunotherapy|표적치료|바이오마커|biomarker/i;
const TREATMENT_METHOD_QUERY =
  /치료\s*(방법|법|옵션|과정)|수술|방사선|항암|화학|어떻게\s*치료/i;
const MY_DISEASE_QUERY =
  /내\s*병|나랑?\s*관련|나에게|저에게|내\s*상황|내\s*경우|설명해\s*줘/i;
const GUIDELINE_FOLLOWUP_QUERY =
  /가이드라인.*(없|있|은|이|에|에서|에선)|뭐래|뭐라|관련\s*내용|원문.*(없|있|들어|더|구체)|^가이드라인\s*\??$|더\s*구체적|단계별/i;
const USER_SOURCE_REQUEST =
  /원문.*(주시|보내|첨부|공유|함께)|PDF.*(보내|주시)|주시면.*정리|알려주시면.*정리/i;
const DAILY_LIVING_QUERY =
  /일상|생활|주의|일상생활|감염|위생|휴식|체력|정서|품질|daily\s*life|quality of life|lifestyle/i;
const SUN_UV_QUERY =
  /자외선|선크림|햇빛|햇볕|sunscreen|\bUV\b|ultraviolet|sun\s*exposure/i;

const MIN_CITATION_SIMILARITY = 0.5;
const OFF_TOPIC_EXCERPT =
  /You have NSCLC if you have|Adenocarcinoma \(A-deh|thoracic radiologist|There's a lot to learn|don't know what the future holds|reading pictures \(images\) of the inside of the chest|expert in reading pictures|Testing is needed to plan treatment|first tests used for cancer staging|pathologist will examine/i;
const MEDICAL_SIGNAL =
  /폐|암|치료|항암|nsclc|sclc|병기|수술|방사|화학|영양|식이|부작용|PD[- ]?L1|면역|가이드라인|임상|전이|조기|초기|소세포|선암|편평|EGFR|ALK/i;
const GENERIC_BOILERPLATE =
  /Treatment by clinical stage.*very important for planning|Everyone with cancer should carefully consider all of the treatment options|Learn more about your primary treatment in the next chapters|Other specialists who may be involved in your care include/i;

function hasEmbeddings(store: GuideChunkStore): boolean {
  return store.chunks.some((c) => c.embedding.length > 0);
}

function keywordScore(query: string, text: string): number {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
  const lower = text.toLowerCase();
  return terms.reduce(
    (score, term) => score + (lower.includes(term) ? 1 : 0),
    0,
  );
}

export interface RetrievedChunk {
  chunk: GuideChunk;
  score: number;
  similarity: number;
}

export interface RetrieveResult {
  contextChunks: RetrievedChunk[];
  citations: GuideChatSource[];
  relevanceScore: number;
}

let storeCache: GuideChunkStore | null = null;

export async function loadGuideChunks(): Promise<GuideChunkStore> {
  if (storeCache) return storeCache;
  const res = await fetch("/data/guide-chunks.json");
  if (!res.ok) {
    throw new Error(
      "가이드 데이터를 불러오지 못했습니다. npm run embed-pdfs를 실행해 주세요.",
    );
  }
  storeCache = (await res.json()) as GuideChunkStore;
  return storeCache;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function resolveTargetDocs(
  query: string,
  histology: Histology,
): GuideDocId[] {
  const docs: GuideDocId[] = [];

  if (SCLC_QUERY.test(query)) docs.push("sclc");
  if (EARLY_STAGE_QUERY.test(query)) docs.push("earlystage");
  if (METASTATIC_QUERY.test(query)) docs.push("metastatic");

  if (BIOMARKER_QUERY.test(query)) {
    docs.push("metastatic");
    if (histology !== "smallcell") docs.push("earlystage");
  }

  if (NUTRITION_QUERY.test(query) && !docs.includes("earlystage")) {
    docs.unshift("earlystage");
  }

  if (NSCLC_GENERAL.test(query) && docs.length === 0) {
    docs.push("earlystage", "metastatic");
  }

  if (docs.length === 0) {
    if (histology === "smallcell") docs.push("sclc");
    else docs.push("earlystage", "metastatic");
  }

  return [...new Set(docs)];
}

function docBoost(targetDocs: GuideDocId[], docId: GuideDocId): number {
  if (targetDocs[0] === docId) return 0.15;
  if (targetDocs.includes(docId)) return 0.08;
  return 0;
}

function topicSearchHint(query: string): string {
  if (NUTRITION_QUERY.test(query)) {
    return "nutrition diet registered dietitian healthy eating weight management supportive care survivorship healthy living";
  }
  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    return "supportive care palliative care chemotherapy side effects symptom management nausea vomiting diarrhea infection fatigue mouth sores fever";
  }
  if (OVERVIEW_QUERY.test(query)) {
    return "primary treatment planning staging surgery radiation chemotherapy definitive chemoradiation clinical stage treatment options";
  }
  if (BIOMARKER_QUERY.test(query)) {
    return "PD-L1 immunotherapy immune checkpoint inhibitor pembrolizumab nivolumab durvalumab biomarker expression";
  }
  if (TREATMENT_METHOD_QUERY.test(query)) {
    return "surgery lobectomy pneumonectomy radiation chemotherapy chemoradiation adjuvant definitive treatment";
  }
  if (MY_DISEASE_QUERY.test(query)) {
    return "histology adenocarcinoma squamous cell stage staging TNM primary treatment clinical stage";
  }
  if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    return "small cell lung cancer SCLC limited stage extensive stage initial treatment chemoradiation chemoimmunotherapy platinum durvalumab";
  }
  if (DAILY_LIVING_QUERY.test(query)) {
    return "supportive care quality of life daily living fatigue infection hygiene exercise nutrition emotional support rest symptom management";
  }
  if (SUN_UV_QUERY.test(query)) {
    return "sunscreen ultraviolet sun exposure healthy living skin cancer prevention survivorship";
  }
  return "";
}

function topicKeywordBoost(query: string, text: string): number {
  if (NUTRITION_QUERY.test(query)) {
    let boost = 0;
    if (
      /healthful foods|healthy living|Common goals for healthy living/i.test(
        text,
      )
    ) {
      boost += 0.22;
    }
    if (/managing body weight|body weight/i.test(text)) boost += 0.08;
    if (
      /registered dietitian/i.test(text) &&
      !/healthful foods|healthy living/i.test(text)
    ) {
      boost -= 0.12;
    }
    return boost;
  }
  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    let boost = 0;
    if (/supportive care/i.test(text)) boost += 0.16;
    if (/nausea|vomiting|antiemetic|fatigue|side effect/i.test(text)) {
      boost += 0.14;
    }
    if (
      /What is metastatic|spread to other|biopsy|pathologist report/i.test(
        text,
      ) &&
      !/nausea|vomiting|fatigue|supportive care/i.test(text)
    ) {
      boost -= 0.22;
    }
    return boost;
  }
  if (BIOMARKER_QUERY.test(query)) {
    let boost = 0;
    if (/PD-L1|abnormal PD-L1/i.test(text)) boost += 0.28;
    if (/immunotherapy|immune checkpoint/i.test(text)) boost += 0.14;
    return boost;
  }
  if (TREATMENT_METHOD_QUERY.test(query)) {
    let boost = 0;
    if (
      /Treating lung cancer with surgery|Surgery is a standard treatment/i.test(
        text,
      )
    ) {
      boost += 0.16;
    }
    if (/lobectomy|pneumonectomy|wedge resection/i.test(text)) boost += 0.1;
    if (/radiation|chemotherapy|chemoradiation/i.test(text)) boost += 0.06;
    return boost;
  }
  if (DAILY_LIVING_QUERY.test(query)) {
    let boost = 0;
    if (/supportive care|quality of life/i.test(text)) boost += 0.18;
    if (
      /fatigue|infection|hygiene|exercise|nutrition|emotional|rest/i.test(text)
    ) {
      boost += 0.1;
    }
    if (OFF_TOPIC_EXCERPT.test(text)) boost -= 0.25;
    return boost;
  }
  if (SUN_UV_QUERY.test(query)) {
    let boost = 0;
    if (/sunscreen|sun exposure|ultraviolet/i.test(text)) boost += 0.2;
    if (/Common goals for healthy living/i.test(text)) boost += 0.12;
    if (/Testing is needed|first tests used for cancer staging/i.test(text)) {
      boost -= 0.25;
    }
    return boost;
  }
  if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    let boost = 0;
    if (/Initial treatment/i.test(text)) boost += 0.22;
    if (/chemoradiation|chemoimmunotherapy|platinum/i.test(text)) boost += 0.18;
    if (/Limited.?stage|Extensive.?stage/i.test(text)) boost += 0.14;
    if (isCoverOrFrontMatter(text)) boost -= 0.35;
    return boost;
  }
  return 0;
}

function supportiveCareSignalStrength(text: string): number {
  let strength = 0;
  if (/nausea|vomiting|antiemetic/i.test(text)) strength += 4;
  if (/diarrhea|constipation|mouth|mucositis|stomatitis/i.test(text)) {
    strength += 3;
  }
  if (/side effect|fatigue|infection|fever|pain|bleeding/i.test(text)) {
    strength += 2;
  }
  if (/supportive care|palliative care|symptom/i.test(text)) strength += 1;
  if (isCoverOrFrontMatter(text) || isNavigationOrTocText(text)) strength -= 3;
  return strength;
}

function isWeakSupportiveIntro(excerpt: string): boolean {
  const ex = excerpt.toLowerCase();
  return (
    /supportive care improves lives|addresses the challenges of cancer|involves multiple types of aid/i.test(
      ex,
    ) &&
    !/nausea|vomiting|diarrhea|constipation|fatigue|infection|fever|mouth|pain|antiemetic|side effect/i.test(
      ex,
    )
  );
}

function hasTopicSignal(query: string, text: string): boolean {
  if (NUTRITION_QUERY.test(query)) {
    return /healthful foods|healthy living|Common goals for healthy living|managing body weight/i.test(
      text,
    );
  }
  if (BIOMARKER_QUERY.test(query)) {
    return /PD-L1|abnormal PD-L1|immunotherapy|immune checkpoint/i.test(text);
  }
  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    return /supportive care|nausea|vomiting|fatigue|side effect|infection|diarrhea/i.test(
      text,
    );
  }
  if (DAILY_LIVING_QUERY.test(query)) {
    return /supportive care|quality of life|fatigue|infection|hygiene|exercise|nutrition|emotional/i.test(
      text,
    );
  }
  if (SUN_UV_QUERY.test(query)) {
    return /sunscreen|sun exposure|ultraviolet|Common goals for healthy living/i.test(
      text,
    );
  }
  if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    return /Initial treatment|Limited.?stage|Extensive.?stage|chemoradiation|chemoimmunotherapy|platinum/i.test(
      text,
    );
  }
  if (TREATMENT_METHOD_QUERY.test(query)) {
    return /Surgery is a standard|Treating lung cancer with surgery|lobectomy|definitive chemoradiation/i.test(
      text,
    );
  }
  return false;
}

function getTopicPatterns(query: string): RegExp[] {
  if (NUTRITION_QUERY.test(query)) {
    return [
      /Common goals for healthy living include/i,
      /healthful foods/i,
      /healthy living/i,
      /managing body weight|body weight/i,
    ];
  }
  if (BIOMARKER_QUERY.test(query)) {
    return [
      /PD-L1|abnormal PD-L1/i,
      /immunotherapy restores/i,
      /immune checkpoint inhibitor/i,
      /stopping cancer-fighting T cells/i,
    ];
  }
  if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    return [
      /Initial treatment/i,
      /Limited.?stage cancers|limited-stage/i,
      /Extensive.?stage|extensive-stage/i,
      /chemoradiation|concurrent chemoradiation/i,
      /chemoimmunotherapy|platinum/i,
      /durvalumab/i,
    ];
  }
  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    return [
      /supportive care/i,
      /palliative care/i,
      /nausea|vomiting/i,
      /fatigue/i,
      /side effect/i,
    ];
  }
  if (DAILY_LIVING_QUERY.test(query)) {
    return [
      /supportive care addresses/i,
      /quality of life/i,
      /fatigue/i,
      /infection/i,
      /hygiene|hand washing/i,
      /exercise|physical activity/i,
      /emotional|social needs/i,
    ];
  }
  if (SUN_UV_QUERY.test(query)) {
    return [
      /sunscreen|sun exposure|ultraviolet/i,
      /Common goals for healthy living include/i,
    ];
  }
  if (TREATMENT_METHOD_QUERY.test(query)) {
    return [
      /Surgery is a standard treatment/i,
      /Treating lung cancer with surgery/i,
      /lobectomy|pneumonectomy/i,
      /definitive chemoradiation|definitive radiation/i,
      /postoperative therapy|adjuvant/i,
    ];
  }
  return [];
}

function normalizePageText(text: string): string {
  return text
    .replace(/\[[^\]]+\]\n?/g, "")
    .replace(/NCCN Guidelines for Patients[^\n]*\n?/gi, "")
    .replace(/Early & Locally Advanced Non-Small Cell Lung Cancer/gi, "")
    .replace(/[•\u0086\u2020\u2021]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCoverOrFrontMatter(text: string): boolean {
  const clean = normalizePageText(text);
  if (
    /Presented with support from FOUNDATION|NCCN\.org\/patientguidelines|Find an NCCN Cancer Center|Supporters To make a gift|Guiding Treatment\. Changing Lives/i.test(
      clean,
    )
  ) {
    return true;
  }
  if (
    clean.length < 280 &&
    /NCCN Guidelines for Patients/i.test(clean) &&
    !/Initial treatment|supportive care|healthy living|healthful foods/i.test(
      clean,
    )
  ) {
    return true;
  }
  return false;
}

function isNavigationOrTocText(text: string): boolean {
  const clean = normalizePageText(text);
  if (/\bContents\b/i.test(clean)) return true;
  if (
    /Supporters|NCCN Foundation gratefully|Connect with us|To make a gift|Questions to ask$/i.test(
      clean,
    )
  ) {
    return true;
  }

  const pageRefs =
    clean.match(
      /\b\d{1,3}\s+(?:Types of|Planning|Staging|Treatment|Early|Stage|Key points|Questions|Improving|Initial|Surveillance|Making|Words)/gi,
    ) ?? [];
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 35);
  if (pageRefs.length >= 2 && sentences.length < 2) return true;

  const tocStarts = clean.match(/\b\d{1,3}\s+[A-Z][a-z]/g) ?? [];
  if (tocStarts.length >= 4 && sentences.length < 3) return true;

  return false;
}

function getSubstantiveSentences(clean: string): string[] {
  return clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 45 && s.length <= 400)
    .filter((s) => !/^\d{1,3}\s/.test(s))
    .filter((s) => !/^NCCN Guidelines for Patients/i.test(s))
    .filter((s) => !isNavigationOrTocText(s))
    .filter((s) => {
      const digitCount = (s.match(/\d/g) ?? []).length;
      return digitCount / s.length <= 0.08;
    });
}

function isHealthyLivingExcerpt(excerpt: string): boolean {
  return /healthy living|healthful foods|Common goals for healthy living/i.test(
    excerpt,
  );
}

function isSubstantiveExcerpt(excerpt: string): boolean {
  if (!excerpt || excerpt.length < 45) return false;
  if (isNavigationOrTocText(excerpt)) return false;
  if (isCoverOrFrontMatter(excerpt)) return false;
  if (isGenericBoilerplateExcerpt(excerpt)) return false;
  if (isHealthyLivingExcerpt(excerpt) && excerpt.length >= 60) return true;
  if (!/[.!?]/.test(excerpt)) return false;
  if (/^\d{1,3}\s/.test(excerpt.trim())) return false;
  const digitRatio = (excerpt.match(/\d/g) ?? []).length / excerpt.length;
  return digitRatio <= 0.12;
}

function isGenericBoilerplateExcerpt(excerpt: string): boolean {
  return GENERIC_BOILERPLATE.test(excerpt);
}

function retrievalScoreAdjust(
  text: string,
  page: number,
  query: string,
): number {
  let adjust = 0;
  if (isNavigationOrTocText(text)) adjust -= 0.3;
  if (isCoverOrFrontMatter(text)) adjust -= 0.28;
  if (page <= 6) adjust -= 0.08;
  if (
    SCLC_QUERY.test(query) &&
    TREATMENT_METHOD_QUERY.test(query) &&
    page <= 12
  ) {
    adjust -= 0.1;
  }
  if (GENERIC_BOILERPLATE.test(text)) adjust -= 0.22;
  if (OFF_TOPIC_EXCERPT.test(text)) adjust -= 0.28;
  if (DAILY_LIVING_QUERY.test(query) && page <= 12) adjust -= 0.06;
  if (NUTRITION_QUERY.test(query) && /registered dietitian/i.test(text)) {
    if (!/healthful foods|healthy living/i.test(text)) adjust -= 0.15;
  }
  return adjust + topicKeywordBoost(query, text);
}

function extractConversationTopic(priorHistory: GuideChatMessage[]): string {
  const userMsgs = priorHistory.filter((m) => m.role === "user");
  for (let i = userMsgs.length - 1; i >= 0; i--) {
    const text = userMsgs[i]!.text;
    if (
      MEDICAL_SIGNAL.test(text) &&
      !GUIDELINE_FOLLOWUP_QUERY.test(text) &&
      text.length > 8
    ) {
      return text;
    }
  }
  return userMsgs[userMsgs.length - 1]?.text ?? "";
}

export function buildRetrievalQuery(
  query: string,
  priorHistory: GuideChatMessage[],
): string {
  if (priorHistory.length === 0) return query;

  const topic = extractConversationTopic(priorHistory);

  if (GUIDELINE_FOLLOWUP_QUERY.test(query) && topic) {
    return `${topic} ${query}`.trim();
  }

  if (query.length < 35 && topic) {
    return `${topic} ${query}`.trim();
  }

  return query;
}

function getRecentlyCitedPages(priorHistory: GuideChatMessage[]): Set<string> {
  const pages = new Set<string>();
  for (const msg of priorHistory.slice(-8)) {
    for (const source of msg.sources ?? []) {
      pages.add(`${source.fileName}:${source.page}`);
    }
  }
  return pages;
}

function isOffTopicExcerpt(excerpt: string): boolean {
  return (
    OFF_TOPIC_EXCERPT.test(excerpt) || isGenericBoilerplateExcerpt(excerpt)
  );
}

function excerptRelatesToQuery(excerpt: string, query: string): boolean {
  if (isOffTopicExcerpt(excerpt)) return false;

  const exLower = excerpt.toLowerCase();

  if (BIOMARKER_QUERY.test(query)) {
    return /pd-l1|immunotherapy|immune checkpoint/i.test(excerpt);
  }
  if (NUTRITION_QUERY.test(query)) {
    return /healthful foods|healthy living|common goals for healthy living|managing body weight|eating healthful/i.test(
      exLower,
    );
  }
  if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    return /initial treatment|limited.?stage|extensive.?stage|chemoradiation|chemoimmunotherapy|platinum|durvalumab|small cell/i.test(
      exLower,
    );
  }
  if (DAILY_LIVING_QUERY.test(query) || SUPPORTIVE_CARE_QUERY.test(query)) {
    if (
      /cause of concerning symptoms/i.test(excerpt) &&
      !/supportive care/i.test(exLower)
    ) {
      return false;
    }
    if (SUPPORTIVE_CARE_QUERY.test(query) && isWeakSupportiveIntro(excerpt)) {
      return false;
    }
    return /supportive care|quality of life|fatigue|infection|hygiene|exercise|emotional|rest|palliative|nausea|vomiting|antiemetic|side effect/i.test(
      exLower,
    );
  }
  if (SUN_UV_QUERY.test(query)) {
    return /sunscreen|ultraviolet|\buv\b|sun exposure|sun protection|healthy living/i.test(
      exLower,
    );
  }
  if (TREATMENT_METHOD_QUERY.test(query)) {
    return /surgery|surgical|lobectomy|radiation|chemotherapy|chemoradiation|definitive treatment/i.test(
      exLower,
    );
  }

  if (OVERVIEW_QUERY.test(query) || MY_DISEASE_QUERY.test(query)) {
    return /treatment|staging|surgery|radiation|chemotherapy|clinical stage|histology|adenocarcinoma|squamous|supportive care/i.test(
      exLower,
    );
  }

  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3);
  const koreanHits = terms.filter((t) => excerpt.includes(t)).length;
  if (koreanHits >= 2) return true;

  return false;
}

export function filterRelevantCitations(
  citations: GuideChatSource[],
  query: string,
): GuideChatSource[] {
  const filtered = citations.filter((c) =>
    excerptRelatesToQuery(c.excerpt, query),
  );
  if (filtered.length > 0) return filtered;

  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    const strong = citations.filter(
      (c) =>
        !isWeakSupportiveIntro(c.excerpt) &&
        /nausea|vomiting|diarrhea|constipation|fatigue|infection|side effect|immunotherapy side|low blood count/i.test(
          c.excerpt,
        ),
    );
    if (strong.length > 0) return strong.slice(0, 4);
  }

  return filtered;
}

function filterDisplayCitations(
  citations: GuideChatSource[],
  query: string,
): GuideChatSource[] {
  return filterRelevantCitations(citations, query);
}

export function answerDeniesGuidelineRelevance(text: string): boolean {
  return /직접\s*관련이\s*없|관련\s*내용이\s*없|다루어지지\s*않|찾지\s*못했|원문과\s*직접\s*관련/i.test(
    text,
  );
}

export function answerReferencesGuideline(text: string): boolean {
  if (answerDeniesGuidelineRelevance(text)) return false;
  return (
    /NCCN|가이드라인\s*(에\s*따르|에서|원문|발췌|제시)/i.test(text) ||
    (/가이드라인/i.test(text) &&
      /금연|건강한\s*식사|건강한\s*생활|신체\s*활동|체중\s*관리/i.test(text))
  );
}

export function resolveAnswerSources(
  citations: GuideChatSource[],
  answer: string,
  retrievalQuery: string,
  usedGuidelineSearch: boolean,
): {
  sources: GuideChatSource[];
  answerType: GuideAnswerType;
} {
  if (!usedGuidelineSearch) {
    return { sources: [], answerType: "chat" };
  }

  if (answerDeniesGuidelineRelevance(answer)) {
    return { sources: [], answerType: "general" };
  }

  const displayCitations = filterDisplayCitations(citations, retrievalQuery);

  if (
    displayCitations.length > 0 &&
    shouldShowCitations(answer, displayCitations, retrievalQuery)
  ) {
    return { sources: displayCitations, answerType: "guideline" };
  }

  return { sources: [], answerType: "general" };
}

function trimToWordBoundary(text: string): string {
  const trimmed = text.trim();
  const space = trimmed.indexOf(" ");
  if (space > 0 && space < 25 && /^[a-z]/.test(trimmed)) {
    return trimmed.slice(space + 1);
  }
  return trimmed;
}

function extractSentenceWindow(
  clean: string,
  idx: number,
  maxLen: number,
): string {
  let start = Math.max(
    clean.lastIndexOf(". ", idx),
    clean.lastIndexOf("? ", idx),
    clean.lastIndexOf("! ", idx),
  );
  start = start >= 0 ? start + 2 : Math.max(0, idx - 60);

  let end = clean.length;
  for (const punct of [". ", "? ", "! "]) {
    const pos = clean.indexOf(punct, idx + 20);
    if (pos >= 0 && pos < end) end = pos + 1;
  }
  end = Math.min(end, start + maxLen);

  return trimToWordBoundary(clean.slice(start, end).trim());
}

function extractRelevantExcerpt(
  pageText: string,
  query: string,
  maxLen: number = 280,
): string | null {
  const clean = normalizePageText(pageText);
  const patterns = getTopicPatterns(query);

  if (patterns.length > 0) {
    if (/healthful foods|healthy living/i.test(clean)) {
      const goals = clean.match(
        /Common goals for healthy living include:.*?(?:More information|Survivorship)/i,
      );
      if (goals) return goals[0].slice(0, maxLen);
    }

    for (const re of patterns) {
      const idx = clean.search(re);
      if (idx < 0) continue;
      const excerpt = extractSentenceWindow(clean, idx, maxLen);
      if (excerpt.length >= 40) return excerpt;
    }
    return null;
  }

  const sentences = getSubstantiveSentences(clean);
  if (sentences.length === 0) return null;

  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: terms.reduce(
        (sum, term) => sum + (sentence.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length);

  const best = ranked[0]?.sentence ?? sentences[0]!;
  return best.slice(0, maxLen);
}

function selectHitsWithAnchors(
  ranked: RetrievedChunk[],
  pool: GuideChunk[],
  query: string,
  topPages: number,
  recentPages: Set<string>,
): RetrievedChunk[] {
  if (
    NUTRITION_QUERY.test(query) ||
    SUPPORTIVE_CARE_QUERY.test(query) ||
    DAILY_LIVING_QUERY.test(query) ||
    SUN_UV_QUERY.test(query) ||
    BIOMARKER_QUERY.test(query) ||
    TREATMENT_METHOD_QUERY.test(query) ||
    (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query))
  ) {
    const seen = new Set<string>();
    const anchorHits: RetrievedChunk[] = [];

    for (const chunk of pool) {
      if (!hasTopicSignal(query, chunk.text)) continue;
      const key = `${chunk.docId}:${chunk.page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = ranked.find(
        (r) => r.chunk.docId === chunk.docId && r.chunk.page === chunk.page,
      );
      const signalBoost = SUPPORTIVE_CARE_QUERY.test(query)
        ? supportiveCareSignalStrength(chunk.text) * 0.04
        : 0;
      anchorHits.push(
        existing
          ? {
              ...existing,
              score: existing.score + signalBoost,
            }
          : {
              chunk,
              score: MIN_CITATION_SIMILARITY + 0.05 + signalBoost,
              similarity: MIN_CITATION_SIMILARITY + 0.05,
            },
      );
    }

    if (anchorHits.length > 0) {
      anchorHits.sort((a, b) => b.score - a.score);
      return anchorHits.slice(0, topPages + 1);
    }
  }

  return selectTopPages(ranked, topPages, recentPages);
}

function buildSearchQuery(
  englishQuery: string,
  targetDocs: GuideDocId[],
  query: string,
): string {
  const hints = targetDocs
    .map((id) => {
      if (id === "sclc") {
        return "NCCN Guidelines for Patients Small Cell Lung Cancer SCLC treatment stages chemotherapy radiation immunotherapy";
      }
      if (id === "metastatic") {
        return "NCCN Guidelines for Patients Metastatic Non-Small Cell Lung Cancer NSCLC treatment";
      }
      if (id === "earlystage") {
        return "NCCN Guidelines for Patients Early Stage Non-Small Cell Lung Cancer NSCLC surgery radiation chemotherapy";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
  const topicHint = topicSearchHint(query);
  return [englishQuery, hints, topicHint].filter(Boolean).join("\n");
}

async function translateQueryForRetrieval(
  query: string,
  patientContext: GuidePatientContext,
  targetDocs: GuideDocId[],
  priorHistory: GuideChatMessage[],
): Promise<string> {
  const { profile } = patientContext;
  const hLabel = histologyLabel(profile.histology);
  const docHint = targetDocs
    .map((id) => GUIDE_DOC_META[id].fileName)
    .join(", ");
  const biomarkerHint = biomarkerSearchHint(profile);
  const recentContext = priorHistory
    .slice(-4)
    .map((m) => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.text}`)
    .join("\n");

  if (!isOpenAIAvailable()) {
    return query;
  }

  const translated = await callOpenAIChat(
    [
      {
        role: "system",
        content:
          "Translate Korean patient questions into a concise English search query for NCCN lung cancer patient guideline PDFs. Include specific medical terms from the current AND prior conversation when relevant. Output ONLY the English query.",
      },
      {
        role: "user",
        content: `Patient histology: ${hLabel}${biomarkerHint ? `\nBiomarkers: ${biomarkerHint}` : ""}\nTarget PDFs: ${docHint}\nRecent conversation:\n${recentContext || "(none)"}\nCurrent Korean question: ${query}`,
      },
    ],
    TEXT_MODEL,
    2,
  );
  return translated.trim() || query;
}

function filterChunkPool(
  chunks: GuideChunk[],
  targetDocs: GuideDocId[],
): GuideChunk[] {
  return chunks.filter((c) => targetDocs.includes(c.docId));
}

function selectTopPages(
  ranked: RetrievedChunk[],
  topPages: number = 5,
  recentPages: Set<string> = new Set(),
): RetrievedChunk[] {
  const selected: RetrievedChunk[] = [];
  const seen = new Set<string>();

  const tryPick = (skipRecent: boolean) => {
    for (const item of ranked) {
      const key = `${item.chunk.docId}:${item.chunk.page}`;
      if (seen.has(key)) continue;

      const fileKey = `${GUIDE_DOC_META[item.chunk.docId].fileName}:${item.chunk.page}`;
      if (
        skipRecent &&
        recentPages.has(fileKey) &&
        selected.length < topPages - 1
      ) {
        continue;
      }

      selected.push(item);
      seen.add(key);
      if (selected.length >= topPages) break;
    }
  };

  tryPick(true);
  if (selected.length < topPages) tryPick(false);

  return selected.length > 0 ? selected : ranked.slice(0, topPages);
}

function expandNeighborChunks(
  hits: RetrievedChunk[],
  pool: GuideChunk[],
  radius: number = 1,
): GuideChunk[] {
  const expanded = new Map<string, GuideChunk>();

  for (const hit of hits) {
    for (const chunk of pool) {
      if (chunk.docId !== hit.chunk.docId) continue;
      if (Math.abs(chunk.page - hit.chunk.page) > radius) continue;
      expanded.set(chunk.id, chunk);
    }
  }

  return [...expanded.values()].sort(
    (a, b) => a.page - b.page || a.id.localeCompare(b.id),
  );
}

function getPageText(
  pool: GuideChunk[],
  docId: GuideDocId,
  page: number,
  query: string,
): string {
  const chunks = pool.filter((c) => c.docId === docId && c.page === page);
  if (chunks.length === 0) return "";

  const withSignal = chunks.find((c) => hasTopicSignal(query, c.text));
  if (withSignal) return normalizePageText(withSignal.text);

  const normalized = chunks.map((c) => normalizePageText(c.text));
  return normalized.sort((a, b) => b.length - a.length)[0] ?? "";
}

function nutritionSignalStrength(text: string): number {
  let strength = 0;
  if (/Common goals for healthy living include/i.test(text)) strength += 4;
  if (/healthful foods|Eating healthful/i.test(text)) strength += 3;
  if (/healthy living|managing body weight/i.test(text)) strength += 2;
  if (
    /registered dietitian/i.test(text) &&
    !/healthful foods|healthy living|Common goals/i.test(text)
  ) {
    strength -= 2;
  }
  if (isCoverOrFrontMatter(text)) strength -= 3;
  return strength;
}

function sclcTreatmentSignalStrength(text: string): number {
  let strength = 0;
  if (/Initial treatment/i.test(text)) strength += 4;
  if (/chemoradiation|chemoimmunotherapy|platinum|durvalumab/i.test(text)) {
    strength += 3;
  }
  if (/Limited.?stage|Extensive.?stage/i.test(text)) strength += 2;
  if (isCoverOrFrontMatter(text) || isNavigationOrTocText(text)) strength -= 3;
  return strength;
}

function dailyLivingSignalStrength(text: string): number {
  let strength = 0;
  if (/supportive care addresses|quality of life/i.test(text)) strength += 3;
  if (/fatigue|infection|hygiene|hand washing|exercise|emotional/i.test(text)) {
    strength += 2;
  }
  if (/supportive care|nausea|vomiting/i.test(text)) strength += 1;
  if (isWeakSupportiveIntro(text)) strength -= 2;
  return strength;
}

function buildTopicFallbackCitations(
  pool: GuideChunk[],
  query: string,
  limit: number = 4,
): GuideChatSource[] {
  let strengthFn: (text: string) => number = () => 0;
  let minStrength = 2;
  let rejectExcerpt: (excerpt: string) => boolean = () => false;

  if (SUPPORTIVE_CARE_QUERY.test(query)) {
    strengthFn = supportiveCareSignalStrength;
    rejectExcerpt = isWeakSupportiveIntro;
  } else if (NUTRITION_QUERY.test(query)) {
    strengthFn = nutritionSignalStrength;
    rejectExcerpt = (excerpt) =>
      /registered dietitian/i.test(excerpt) &&
      !/healthful foods|healthy living|Common goals for healthy living/i.test(
        excerpt,
      );
  } else if (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) {
    strengthFn = sclcTreatmentSignalStrength;
  } else if (DAILY_LIVING_QUERY.test(query)) {
    strengthFn = dailyLivingSignalStrength;
    rejectExcerpt = isWeakSupportiveIntro;
  } else {
    return [];
  }

  const bestByPage = new Map<string, GuideChunk>();
  for (const chunk of pool) {
    const strength = strengthFn(chunk.text);
    if (strength < minStrength) continue;
    const key = `${chunk.docId}:${chunk.page}`;
    const prev = bestByPage.get(key);
    if (!prev || strength > strengthFn(prev.text)) {
      bestByPage.set(key, chunk);
    }
  }

  const sorted = [...bestByPage.values()].sort(
    (a, b) => strengthFn(b.text) - strengthFn(a.text),
  );

  const citations: GuideChatSource[] = [];
  for (const chunk of sorted) {
    if (citations.length >= limit) break;
    const pageText = normalizePageText(chunk.text);
    const excerpt = extractRelevantExcerpt(pageText, query);
    if (
      !excerpt ||
      !isSubstantiveExcerpt(excerpt) ||
      isOffTopicExcerpt(excerpt) ||
      rejectExcerpt(excerpt)
    ) {
      continue;
    }
    const meta = GUIDE_DOC_META[chunk.docId];
    citations.push({
      docTitle: chunk.docTitle,
      fileName: meta.fileName,
      page: chunk.page,
      excerpt,
    });
  }

  return citations;
}

export function buildCitations(
  hits: RetrievedChunk[],
  pool: GuideChunk[],
  query: string,
  rankedFallback: RetrievedChunk[] = [],
): GuideChatSource[] {
  const citations: GuideChatSource[] = [];
  const seen = new Set<string>();

  const candidates: RetrievedChunk[] = [];
  for (const hit of [...hits, ...rankedFallback]) {
    const key = `${hit.chunk.docId}:${hit.chunk.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(hit);
  }

  for (const hit of candidates) {
    const pageText = getPageText(pool, hit.chunk.docId, hit.chunk.page, query);
    const excerpt = extractRelevantExcerpt(pageText, query);
    if (
      !excerpt ||
      !isSubstantiveExcerpt(excerpt) ||
      isOffTopicExcerpt(excerpt)
    ) {
      continue;
    }

    const meta = GUIDE_DOC_META[hit.chunk.docId];
    citations.push({
      docTitle: hit.chunk.docTitle,
      fileName: meta.fileName,
      page: hit.chunk.page,
      excerpt,
    });
  }

  const excerptPriority = (excerpt: string): number => {
    if (BIOMARKER_QUERY.test(query) && /PD-L1/i.test(excerpt)) return 0;
    if (
      NUTRITION_QUERY.test(query) &&
      /healthful foods|healthy living/i.test(excerpt)
    ) {
      return 0;
    }
    if (
      SCLC_QUERY.test(query) &&
      TREATMENT_METHOD_QUERY.test(query) &&
      /Initial treatment|chemoradiation|chemoimmunotherapy|Limited.?stage|Extensive.?stage/i.test(
        excerpt,
      )
    ) {
      return 0;
    }
    if (
      TREATMENT_METHOD_QUERY.test(query) &&
      /surgery|lobectomy/i.test(excerpt)
    ) {
      return 0;
    }
    if (SUPPORTIVE_CARE_QUERY.test(query)) {
      if (/nausea|vomiting|antiemetic/i.test(excerpt)) return 0;
      if (/diarrhea|constipation|mouth|mucositis/i.test(excerpt)) return 1;
      if (isWeakSupportiveIntro(excerpt)) return 9;
    }
    if (isCoverOrFrontMatter(excerpt)) return 8;
    if (isGenericBoilerplateExcerpt(excerpt)) return 9;
    return 2;
  };

  const sorted = citations.sort(
    (a, b) =>
      excerptPriority(a.excerpt) - excerptPriority(b.excerpt) ||
      a.fileName.localeCompare(b.fileName) ||
      a.page - b.page,
  );

  const maxCitations =
    NUTRITION_QUERY.test(query) ||
    SUPPORTIVE_CARE_QUERY.test(query) ||
    OVERVIEW_QUERY.test(query)
      ? 3
      : 4;

  const deduped: GuideChatSource[] = [];
  for (const cite of sorted) {
    if (isGenericBoilerplateExcerpt(cite.excerpt)) continue;
    const similar = deduped.some(
      (d) => d.excerpt.slice(0, 60) === cite.excerpt.slice(0, 60),
    );
    if (!similar) deduped.push(cite);
    if (deduped.length >= maxCitations) break;
  }

  return deduped;
}

const MAX_HISTORY_TURNS = 10;

const OFF_TOPIC_QUERY =
  /날씨|주식|비트코인|암호화폐|축구|야구|농구|연예인|아이돌|드라마|영화\s*추천|게임\s*추천|맛집|레시피|여행지\s*추천|맛있는|연애\s*상담|이별\s*조언/i;

const CHITCHAT_PATTERNS = [
  /^(너는?|넌|당신은?)\s*(누구|뭐|무엇)/,
  /^누구(야|세요|신가|냐)/,
  /^(hi|hello|hey)\b/i,
  /^(감사|고마|thanks|thank you)/i,
  /^(뭐|무엇).*(할\s*수|도와|기능)/,
  /챗봇|도우미|assistant|봇이야/,
  /자기\s*소개/,
  /^who\s+are\s+you/i,
  /^(잘\s*지내|반가)/,
];

const PURE_GREETING =
  /^(안녕|안녕하세요|하이|헬로|hello|hi|hey|반가워|반갑습니다)[\s!.~]*$/i;

export function isOffTopicQuery(query: string): boolean {
  const trimmed = query.trim();
  if (OFF_TOPIC_QUERY.test(trimmed) && !MEDICAL_SIGNAL.test(trimmed)) {
    return true;
  }
  if (
    OFF_TOPIC_QUERY.test(trimmed) &&
    !/폐|lung|암\s*치료|nsclc|sclc/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

export function isChitchatQuery(query: string): boolean {
  const trimmed = query.trim().replace(/[?!.。？！]/g, "");

  if (isOffTopicQuery(query)) return true;

  if (MEDICAL_SIGNAL.test(trimmed) && !PURE_GREETING.test(trimmed)) {
    return false;
  }

  if (PURE_GREETING.test(trimmed)) return true;

  if (CHITCHAT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return !MEDICAL_SIGNAL.test(trimmed) || trimmed.length <= 14;
  }

  if (/^안녕/.test(trimmed) && MEDICAL_SIGNAL.test(trimmed)) {
    return false;
  }

  if (trimmed.length <= 12 && !MEDICAL_SIGNAL.test(trimmed)) {
    return true;
  }

  return false;
}

export function shouldSearchGuidelines(
  query: string,
  mode: GuideSearchMode,
  priorHistory: GuideChatMessage[] = [],
): boolean {
  if (mode === "chat") return false;
  if (isOffTopicQuery(query)) return false;
  if (isChitchatQuery(query)) return false;
  if (mode === "search") return true;

  if (GUIDELINE_FOLLOWUP_QUERY.test(query)) return true;
  if (/다\s*검색|검색해\s*봐|찾아\s*봐|찾아\s*줘/i.test(query)) return true;
  if (MEDICAL_SIGNAL.test(query)) return true;

  const lastUser = [...priorHistory].reverse().find((m) => m.role === "user");
  if (lastUser && query.length < 45 && MEDICAL_SIGNAL.test(lastUser.text)) {
    return true;
  }

  const topic = extractConversationTopic(priorHistory);
  if (topic && SUPPORTIVE_CARE_QUERY.test(topic) && query.length < 50) {
    return true;
  }

  return false;
}

function toOpenAIHistory(history: GuideChatMessage[]): OpenAIChatMessage[] {
  return history.slice(-MAX_HISTORY_TURNS).map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.text,
  }));
}

export function stripInlineGuidelineSection(text: string): string {
  return text
    .replace(/#{1,3}\s*(가이드라인\s*원문|직역|가이드라인에서)[\s\S]*$/im, "")
    .replace(/\*\*가이드라인에서 확인된 내용\*\*[\s\S]*$/im, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function shouldShowCitations(
  answer: string,
  citations: GuideChatSource[],
  query: string,
): boolean {
  if (filterRelevantCitations(citations, query).length === 0) return false;
  if (answerDeniesGuidelineRelevance(answer)) return false;
  return true;
}

export async function embedText(text: string): Promise<number[]> {
  if (!isOpenAIAvailable()) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }
  return callOpenAIEmbed(text, EMBEDDING_MODEL);
}

export async function retrieveChunks(
  query: string,
  patientContext: GuidePatientContext,
  topPages: number = 5,
  priorHistory: GuideChatMessage[] = [],
): Promise<RetrieveResult> {
  const { profile } = patientContext;
  const store = await loadGuideChunks();
  const retrievalQuery = buildRetrievalQuery(query, priorHistory);
  const targetDocs = resolveTargetDocs(retrievalQuery, profile.histology);
  const pool = filterChunkPool(store.chunks, targetDocs);
  const recentPages = getRecentlyCitedPages(priorHistory);

  const canVectorSearch = hasEmbeddings(store) && isOpenAIAvailable();
  const ranked = canVectorSearch
    ? await (async () => {
        const englishQuery = await translateQueryForRetrieval(
          retrievalQuery,
          patientContext,
          targetDocs,
          priorHistory,
        );
        const searchQuery = buildSearchQuery(
          englishQuery,
          targetDocs,
          retrievalQuery,
        );
        const queryEmbedding = await embedText(searchQuery);
        return pool
          .map((chunk) => {
            const similarity =
              cosineSimilarity(queryEmbedding, chunk.embedding) +
              retrievalScoreAdjust(chunk.text, chunk.page, retrievalQuery);
            return {
              chunk,
              similarity,
              score: similarity + docBoost(targetDocs, chunk.docId),
            };
          })
          .sort((a, b) => b.score - a.score);
      })()
    : pool
        .map((chunk) => {
          const hint = topicSearchHint(retrievalQuery);
          const kwQuery = hint
            ? `${retrievalQuery} ${hint}`
            : retrievalQuery;
          const similarity = keywordScore(kwQuery, chunk.text) / 10;
          return {
            chunk,
            similarity,
            score: similarity + docBoost(targetDocs, chunk.docId),
          };
        })
        .sort((a, b) => b.score - a.score);

  const relevanceScore = ranked[0]?.similarity ?? 0;
  const relevantHits = ranked.filter(
    (item) => item.similarity >= MIN_CITATION_SIMILARITY,
  );
  const rankedPool = relevantHits.length > 0 ? relevantHits : ranked;
  const hits = selectHitsWithAnchors(
    rankedPool,
    pool,
    retrievalQuery,
    topPages,
    recentPages,
  );
  const expanded = expandNeighborChunks(hits, pool, 1);

  const hitPages = new Set(hits.map((h) => `${h.chunk.docId}:${h.chunk.page}`));
  const sortedExpanded = [...expanded].sort((a, b) => {
    const aHit = hitPages.has(`${a.docId}:${a.page}`) ? 0 : 1;
    const bHit = hitPages.has(`${b.docId}:${b.page}`) ? 0 : 1;
    return aHit - bHit || a.page - b.page;
  });

  const built = buildCitations(hits, pool, retrievalQuery, ranked.slice(0, 24));
  let citations = filterRelevantCitations(built, retrievalQuery);
  if (citations.length === 0 && hasTopicAnchor(retrievalQuery)) {
    citations = buildTopicFallbackCitations(pool, retrievalQuery);
  }

  return {
    contextChunks: sortedExpanded.map((chunk) => ({
      chunk,
      score: 1,
      similarity: relevanceScore,
    })),
    citations,
    relevanceScore,
  };
}

function formatExcerptSources(citations: GuideChatSource[]): string {
  return citations
    .map(
      (c, i) => `[원문 ${i + 1}] ${c.fileName} · p.${c.page}\n"${c.excerpt}"`,
    )
    .join("\n\n");
}

const CHATBOT_PERSONA = `당신은 화순전남대학교병원 폐암 환자 안내 챗봇입니다.

**답변 방식 (상황별)**
1. **가이드라인 원문이 제공된 경우** → 질문에 대한 **핵심 답을 먼저** 1~2문장으로 말한 뒤, 원문에 있는 내용만 근거로 풀어 설명합니다. 원문에 없는 내용은 추측하지 않습니다.
2. **원문이 없는 폐암·의학 질문** → 메타 설명 없이 바로 본론부터, 환자·보호자가 이해하기 쉽게 **충분히** 설명합니다. NCCN·가이드라인·원문·발췌라는 말은 쓰지 않습니다.
3. **잡담·관련 없는 주제** → 짧고 따뜻하게. 폐암·치료·일상 관리 질문이면 그쪽으로 자연스럽게 안내합니다.

**공통**
- 이전 대화 맥락을 반드시 이어갑니다. "그거", "가이드라인은?" 같은 후속 질문은 직전 주제를 기준으로 답합니다.
- 대시보드에서 넘어온 환자 정보(나이·성별·조직형·유전자 변이·PD-L1)를 참고해 맞춤형으로 답합니다.
- 대화체, 완결된 문장, 방어적 마무리·면책 반복 금지.
- 환자에게 가이드라인 원문·PDF·캡처 제출을 요청하지 마세요.
- **간결히** 답하세요. 목록 4~6개, 항목당 1~2문장. 되묻기·마무리 질문 금지.
- 목록은 \`1. 제목: 설명\` 형식으로 한 줄에 씁니다. 마크다운(**, #, _)은 쓰지 마세요. 번호만 단독 줄로 두지 마세요.`;

export interface ChatPlan {
  messages: OpenAIChatMessage[];
  citations: GuideChatSource[];
  searchedGuidelines: boolean;
  retrievalQuery: string;
  /** buildRagMessages 경로로 답변 생성 */
  fromGuidelineRag: boolean;
}

function isDefensiveSentence(sentence: string): boolean {
  const s = sentence.trim();
  if (!s || s.length < 12) return false;
  if (/^\d+\.?$/.test(s)) return false;
  if (/궁금한\s*점이\s*있으면\s*언제든지/i.test(s)) return true;
  if (/있을\s*가능성|흩어져\s*있|한\s*제목\s*아래|찾지\s*못한\s*것처럼|캡처.*보내/i.test(s)) {
    return true;
  }
  if (USER_SOURCE_REQUEST.test(s)) return true;
  if (/대화\s*안에서.*어려|열람.*대조|그대로\s*수행하/i.test(s)) return true;
  if (SUPPLEMENT_DOCTOR_DEFERRAL.test(s)) return true;
  if (/더\s*궁금한\s*점/i.test(s) && /말씀해\s*주세요/i.test(s)) return true;
  if (/구체적인\s*지침을\s*받/i.test(s)) return true;
  if (
    /(?:담당\s*의료진|의료진에게|의료진과|주치의와)/i.test(s) &&
    /상의|상담|지침|확인|받으|문의/i.test(s)
  ) {
    return true;
  }
  if (/개별적인\s*관리\s*계획을\s*세우/i.test(s)) return true;
  return false;
}

function fixDanglingEnding(text: string): string {
  let result = text.trim();

  result = result.replace(
    /(.+?)달라질\s*수\s*있기\s*때문에,?\s*$/i,
    "$1달라질 수 있습니다.",
  );

  if (/(?:하며|되며|이며|으며|하는\s*데),?\s*\.?\s*$/i.test(result)) {
    const lastSentenceEnd = Math.max(
      result.lastIndexOf("."),
      result.lastIndexOf("!"),
      result.lastIndexOf("?"),
    );
    if (lastSentenceEnd > 0) {
      result = result.slice(0, lastSentenceEnd + 1).trim();
    } else {
      result = result
        .replace(/(?:중요한\s*역할을\s*)?하며,?\s*\.?\s*$/i, "합니다.")
        .replace(/(?:하며|되며|이며|으며),?\s*\.?\s*$/i, "");
    }
  }

  if (result && !/[.!?…]$/.test(result) && !/\d+\.\s*$/.test(result)) {
    result += ".";
  }
  return result;
}

function cleanTrailingDefensive(para: string): string {
  const lines = para.split("\n");

  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    if (!last) {
      lines.pop();
      continue;
    }
    if (isDefensiveSentence(last)) {
      lines.pop();
      continue;
    }
    break;
  }

  let result = lines.join("\n").trim();
  const tail = result.slice(Math.max(0, result.length - 220));
  if (isDefensiveSentence(tail)) {
    const cutAt = result.lastIndexOf(tail);
    if (cutAt > 0) result = result.slice(0, cutAt).trim();
  }

  return fixDanglingEnding(result);
}

export function stripDefensiveClosing(text: string): string {
  const paragraphs = text.trim().split(/\n{2,}/);
  const cleaned = paragraphs.map((para, idx) => {
    if (idx !== paragraphs.length - 1) return para.trim();
    return cleanTrailingDefensive(para.trim());
  });
  return cleaned
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildChitchatMessages(
  question: string,
  patientContext: GuidePatientContext,
  priorHistory: GuideChatMessage[] = [],
): OpenAIChatMessage[] {
  const offTopic = isOffTopicQuery(question);
  const offTopicHint = offTopic
    ? `\n- 질문 주제는 폐암 안내와 직접 관련이 없습니다. 2~3문장으로 정중히 답한 뒤, 폐암·치료·부작용·영양·일상 관리 질문을 도와드릴 수 있다고 짧게 안내하세요.`
    : "";

  return [
    {
      role: "system",
      content: `${CHATBOT_PERSONA}

인사·자기소개·감사·잡담에는 2~4문장으로 답하세요.${offTopicHint}

**현재 환자 정보 (대시보드)**
${buildPatientContextBlock(patientContext)}`,
    },
    ...toOpenAIHistory(priorHistory),
    { role: "user", content: question },
  ];
}

export function buildGuidelineFollowUpNoMatchMessages(
  question: string,
  topic: string,
  patientContext: GuidePatientContext,
  priorHistory: GuideChatMessage[] = [],
): OpenAIChatMessage[] {
  return [
    {
      role: "system",
      content: `${CHATBOT_PERSONA}

사용자가 이전 주제(**${topic}**)가 가이드라인 PDF에 있는지 확인하고 있습니다.
검색 결과 해당 주제를 **직접 다루는 원문을 찾지 못했습니다**.

**답변 규칙**
- **첫 문장**에 "가이드라인 PDF에서 [주제]를 직접 다루는 원문은 찾지 못했습니다."처럼 **명확히** 말하세요.
- "있을 가능성이 높습니다", "흩어져 있을 수 있습니다", "한 제목 아래에 없을 수 있습니다" 같은 **회피 표현 금지**.
- 이어서 일반 환자 교육 수준으로 **짧게**(3~5문장) 보충할 수 있습니다.
- "PDF 캡처를 보내주세요", "어떤 단어로 찾으셨는지" 같은 **되묻기 금지**.

**현재 환자 정보 (대시보드)**
${buildPatientContextBlock(patientContext)}`,
    },
    ...toOpenAIHistory(priorHistory),
    { role: "user", content: question },
  ];
}

export function buildGeneralMedicalMessages(
  question: string,
  patientContext: GuidePatientContext,
  priorHistory: GuideChatMessage[] = [],
  retrievalQuery?: string,
): OpenAIChatMessage[] {
  const topic = extractConversationTopic(priorHistory);
  const contextHint =
    topic && topic !== question ? `\n\n(대화 맥락: 이전 주제 — ${topic})` : "";

  return [
    {
      role: "system",
      content: `${CHATBOT_PERSONA}

이 질문은 NCCN 환자 안내 PDF에서 **직접 맞는 원문을 찾지 못했습니다**.
- 질문의 핵심에 맞게 **4~6개 항목**으로 간결히 설명하세요.
- NCCN·가이드라인·원문·발췌라는 말은 쓰지 마세요.
- "관련이 없어", "찾지 못했" 같은 메타 설명으로 시작하지 마세요. 바로 본론부터 답하세요.
- 폐암 환자·보호자 관점에서 실질적으로 도움이 되게 답하세요.

**현재 환자 정보 (대시보드)**
${buildPatientContextBlock(patientContext)}`,
    },
    ...toOpenAIHistory(priorHistory),
    {
      role: "user",
      content: `${retrievalQuery && retrievalQuery !== question ? `[검색 맥락] ${retrievalQuery}\n\n` : ""}## 질문\n${question}${contextHint}`,
    },
  ];
}

export function buildRagMessages(
  question: string,
  patientContext: GuidePatientContext,
  citations: GuideChatSource[],
  priorHistory: GuideChatMessage[] = [],
): OpenAIChatMessage[] {
  const sourceBlock = formatExcerptSources(citations);

  const formatHint = /(\d+)\s*줄|한\s*줄|두\s*줄|세\s*줄/.exec(question);
  const lineHint = formatHint
    ? `\n- 사용자가 ${formatHint[1] ?? "요청한"}줄 형식을 요청했습니다. 그 줄 수에 맞게 **요약**하세요.`
    : "";

  const topic = extractConversationTopic(priorHistory);
  const isGuidelineFollowUp =
    GUIDELINE_FOLLOWUP_QUERY.test(question) && Boolean(topic);
  const followUpHint = isGuidelineFollowUp
    ? `\n- 사용자는 이전 주제(**${topic}**)가 **가이드라인에 있는지** 묻고 있습니다.
- **첫 문장**에 "네, 가이드라인에 관련 내용이 있습니다."처럼 **있음/없음을 명확히** 답하세요.
- "가능성이 높습니다", "흩어져 있을 수 있습니다" 같은 **회피 표현 금지**.
- 이어서 아래 원문 근거로 구체적으로 설명하세요.`
    : "";

  const answerGuide = `가이드라인 원문이 제공되었습니다.

**답변 규칙**
- **첫 문장**에 핵심 답을 말하세요.
- 아래 [참고 원문]에 있는 내용만 근거로 **4~6개 항목**, 항목당 1~2문장으로 설명하세요.
- 원문에 없는 내용은 추측하지 마세요. 보충이 필요하면 짧게 구분하세요.
- 환자에게 원문을 더 보내달라고 하지 마세요. 찾은 원문 범위에서 단계별로 최대한 구체적으로 설명하세요.
- 원문 직역·### 제목·페이지 번호는 응답에 넣지 마세요. (원문은 UI에 별도 표시됩니다.)
- 목차 나열 금지.${lineHint}${followUpHint}`;

  return [
    {
      role: "system",
      content: `${CHATBOT_PERSONA}

${answerGuide}

**현재 환자 정보 (대시보드)**
${buildPatientContextBlock(patientContext)}`,
    },
    ...toOpenAIHistory(priorHistory),
    {
      role: "user",
      content: `## 참고 원문
${sourceBlock}

## 질문
${question}${topic && question !== topic ? `\n\n(대화 맥락: 이전 주제 — ${topic})` : ""}`,
    },
  ];
}

function summarizeCoveredPoints(answer: string): string {
  const numbered = answer.match(/^\d+\.\s*.+$/gm) ?? [];
  if (numbered.length > 0) {
    return numbered
      .map((line) => `- ${line.replace(/^\d+\.\s*/, "").trim()}`)
      .join("\n");
  }
  return answer
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15)
    .slice(0, 4)
    .map((p) => `- ${p}`)
    .join("\n");
}

function splitSupplementItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.trim().split("\n");
  let current = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.trim()) {
        items.push(current.trim());
        current = "";
      }
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed) && current.trim()) {
      items.push(current.trim());
      current = trimmed;
      continue;
    }
    current = current ? `${current}\n${trimmed}` : trimmed;
  }
  if (current.trim()) items.push(current.trim());
  return items.length > 0 ? items : [text.trim()];
}

function termOverlapRatio(a: string, b: string): number {
  const terms = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length >= 2),
    );
  const setA = terms(a);
  const setB = terms(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared++;
  }
  return shared / Math.min(setA.size, setB.size);
}

const SUPPLEMENT_NEW_SIGNAL =
  /식사|체중|단백질|영양|수분|간식|운동|챙기|준비|응급|연락|일상|보호자|오해|팁|기록|일정|통증|부작용|감염|휴식|정서|비용|보험|입원|방법|기준|예시/i;

const SUPPLEMENT_DOCTOR_DEFERRAL =
  /진료\s*(때|에서|시|실에서)|물어볼\s*질문|의료진에게\s*물어|주치의에게\s*물어|담당\s*의료진에게\s*확인|병원에\s*가서\s*물어/i;

function isDoctorDeferralItem(item: string): boolean {
  if (SUPPLEMENT_DOCTOR_DEFERRAL.test(item)) return true;
  const quotes = item.match(/[“"'][\s\S]{8,}[”"']/g) ?? [];
  if (
    quotes.length >= 2 &&
    /물어보|확인해\s*주세요|어떻게\s*잡으면|써도\s*되는지/i.test(item)
  ) {
    return true;
  }
  return false;
}

/** 추가 안내에서 기존 가이드라인 답변과 겹치는 항목 제거 */
export function dedupeSupplementText(
  supplement: string,
  baseline: string,
): string {
  const items = splitSupplementItems(supplement);
  const kept = items.filter((item) => {
    if (isDoctorDeferralItem(item)) return false;
    const overlap = termOverlapRatio(item, baseline);
    if (overlap < 0.38) return true;
    return SUPPLEMENT_NEW_SIGNAL.test(item) && overlap < 0.55;
  });

  if (kept.length === 0) {
    return (
      items.find(
        (item) =>
          !isDoctorDeferralItem(item) && SUPPLEMENT_NEW_SIGNAL.test(item),
      ) ??
      "더 맞춤으로 도와드리고 싶어요. 지금 가장 걱정되시는 증상이나 일상 속 어려움을 조금만 더 알려주시면, 그에 맞는 실천 팁을 이어서 정리해 드릴게요."
    );
  }

  return kept
    .map((item, idx) => item.replace(/^\d+\.\s*/, `${idx + 1}. `))
    .join("\n\n")
    .trim();
}

const SUPPLEMENT_GUIDE = `가이드라인 답변을 읽은 환자·보호자가 **추가 안내**를 요청했습니다.

**말투·관점**
- 환자분·보호자분께 직접 말하듯 **친절하고 따뜻하게** 씁니다. (~하시면 도움이 됩니다, ~해 보셔도 괜찮아요, ~걱정되실 수 있어요)
- 딱딱한 의학 설명보다 **일상·마음·집에서 할 수 있는 것**을 먼저 떠올리세요.
- 치료·병기 용어는 꼭 필요할 때만 짧게 풀어 설명합니다.

**내용**
- 아래 '이미 답변한 내용'과 **겹치지 않게**, 오늘부터 시도해 볼 수 있는 실천 팁을 3~4개 항목으로 이어 씁니다.
- 각 항목에 **왜 도움이 되는지**를 환자 눈높이로 한 줄 섞어 주세요.
- **첫 줄**에 공감·격려 한 문장(2문장 이내)을 쓴 뒤 목록을 이어갑니다. 예: "치료 과정이 길게 느껴지실 수 있어요. 일상에서 도움이 될 만한 것들을 정리해 드릴게요."

**금지**
- 진료 때 물어보세요, 의료진·주치의에게 확인, 병원에 가서 등 **진료 위임** 표현
- 가이드라인·원문·PDF·NCCN 등 메타 표현
- 이미 답한 병기·약제·치료 절차의 반복

**형식**
- 목록 3~4개, 항목당 2~3문장
- \`1. 짧은 제목: 설명\` 형식. 마크다운(**, #) 금지. 번호만 단독 줄로 두지 마세요.`;

export function buildSupplementMessages(
  question: string,
  guidelineAnswer: string,
  patientContext: GuidePatientContext,
): OpenAIChatMessage[] {
  const covered = summarizeCoveredPoints(guidelineAnswer);

  return [
    {
      role: "system",
      content: `${CHATBOT_PERSONA}

${SUPPLEMENT_GUIDE}

**현재 환자 정보 (대시보드)**
${buildPatientContextBlock(patientContext)}`,
    },
    {
      role: "user",
      content: `## 원래 질문
${question}

## 이미 답변한 내용 (여기에 없는 것만, 환자·보호자에게 친절하게 이어서 안내)
${covered}`,
    },
  ];
}

function hasTopicAnchor(query: string): boolean {
  return (
    NUTRITION_QUERY.test(query) ||
    SUPPORTIVE_CARE_QUERY.test(query) ||
    BIOMARKER_QUERY.test(query) ||
    TREATMENT_METHOD_QUERY.test(query) ||
    DAILY_LIVING_QUERY.test(query) ||
    SUN_UV_QUERY.test(query) ||
    (SCLC_QUERY.test(query) && TREATMENT_METHOD_QUERY.test(query)) ||
    SCLC_QUERY.test(query) ||
    METASTATIC_QUERY.test(query) ||
    EARLY_STAGE_QUERY.test(query) ||
    MY_DISEASE_QUERY.test(query)
  );
}

export async function planChatResponse(
  question: string,
  patientContext: GuidePatientContext,
  priorHistory: GuideChatMessage[] = [],
  guideMode: GuideSearchMode = "auto",
): Promise<ChatPlan> {
  const searchedGuidelines = shouldSearchGuidelines(
    question,
    guideMode,
    priorHistory,
  );

  if (!searchedGuidelines) {
    return {
      messages: buildChitchatMessages(question, patientContext, priorHistory),
      citations: [],
      searchedGuidelines: false,
      retrievalQuery: question,
      fromGuidelineRag: false,
    };
  }

  const retrievalQuery = buildRetrievalQuery(question, priorHistory);
  const isGuidelineFollowUp = GUIDELINE_FOLLOWUP_QUERY.test(question);
  const conversationTopic = extractConversationTopic(priorHistory);
  const searchQuestion =
    isGuidelineFollowUp && conversationTopic ? conversationTopic : question;

  const wantsExtraPages = hasTopicAnchor(retrievalQuery);

  const retrieved = await retrieveChunks(
    searchQuestion,
    patientContext,
    wantsExtraPages ? 8 : 5,
    priorHistory,
  );
  let citations = filterRelevantCitations(
    retrieved.citations,
    retrievalQuery,
  );

  if (citations.length === 0 && hasTopicAnchor(retrievalQuery)) {
    const store = await loadGuideChunks();
    const pool = filterChunkPool(
      store.chunks,
      resolveTargetDocs(retrievalQuery, patientContext.profile.histology),
    );
    citations = buildTopicFallbackCitations(pool, retrievalQuery);
  }

  const canUseGuidelineRag =
    citations.length > 0 && hasTopicAnchor(retrievalQuery);

  if (canUseGuidelineRag) {
    return {
      messages: buildRagMessages(
        question,
        patientContext,
        citations,
        priorHistory,
      ),
      citations,
      searchedGuidelines: true,
      retrievalQuery,
      fromGuidelineRag: true,
    };
  }

  if (isGuidelineFollowUp && conversationTopic) {
    return {
      messages: buildGuidelineFollowUpNoMatchMessages(
        question,
        conversationTopic,
        patientContext,
        priorHistory,
      ),
      citations: [],
      searchedGuidelines: true,
      retrievalQuery,
      fromGuidelineRag: false,
    };
  }

  return {
    messages: buildGeneralMedicalMessages(
      question,
      patientContext,
      priorHistory,
      retrievalQuery,
    ),
    citations: [],
    searchedGuidelines: true,
    retrievalQuery,
    fromGuidelineRag: false,
  };
}
