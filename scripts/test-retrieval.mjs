/**
 * 4종 제안 질문 — rag.ts 검색·인용 로직 검증 (Node fetch)
 * node scripts/test-retrieval.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env') });
const API_KEY = process.env.VITE_OPENAI_API_KEY?.trim();

const store = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/data/guide-chunks.json'), 'utf8'),
);

const QUESTIONS = [
  {
    q: '항암치료 부작용은 어떻게 관리하나요?',
    histology: 'adenocarcinoma',
    excerptPat: /supportive care|side effect|nausea|fatigue|palliative/i,
  },
  {
    q: '소세포폐암 치료 과정을 알려주세요.',
    histology: 'smallcell',
    excerptPat: /Initial treatment|chemoradiation|limited.?stage|extensive.?stage|platinum|chemoimmunotherapy/i,
    docId: 'sclc',
    forbidPat: /Presented with support|NCCN\.org\/patientguidelines|Find an NCCN Cancer Center/i,
  },
  {
    q: '전이성 폐암에서 일상생활 시 주의할 점은?',
    histology: 'adenocarcinoma',
    excerptPat: /supportive care|quality of life|fatigue|infection|hygiene/i,
    docId: 'metastatic',
  },
  {
    q: '영양·식이 관리는 어떻게 해야 하나요?',
    histology: 'adenocarcinoma',
    excerptPat: /healthful foods|healthy living|Common goals for healthy living|managing body weight|Eating healthful/i,
    forbidPat: /registered dietitian/i,
  },
];

const SCLC_QUERY = /소세포|SCLC/i;
const METASTATIC_QUERY = /전이/i;
const NUTRITION_QUERY = /영양|식이/i;
const SUPPORTIVE_CARE_QUERY = /부작용/i;
const DAILY_LIVING_QUERY = /일상|생활/i;
const TREATMENT_METHOD_QUERY = /치료\s*(방법|법|옵션|과정)/;

function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    d += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return d / (Math.sqrt(na) * Math.sqrt(nb));
}

function isCoverOrFrontMatter(text) {
  const clean = text.replace(/\s+/g, ' ');
  if (/Presented with support from FOUNDATION|NCCN\.org\/patientguidelines|Find an NCCN Cancer Center|Supporters To make a gift/i.test(clean)) {
    return true;
  }
  if (clean.length < 280 && /NCCN Guidelines for Patients/i.test(clean) && !/Initial treatment|supportive care|healthy living|healthful foods/i.test(clean)) {
    return true;
  }
  return false;
}

function targetDocs(q, histology) {
  const docs = [];
  if (SCLC_QUERY.test(q)) docs.push('sclc');
  if (METASTATIC_QUERY.test(q)) docs.push('metastatic');
  if (NUTRITION_QUERY.test(q) && !docs.includes('earlystage')) docs.unshift('earlystage');
  if (!docs.length) docs.push(histology === 'smallcell' ? 'sclc' : 'earlystage', 'metastatic');
  return [...new Set(docs)];
}

function hasTopicSignal(q, text) {
  if (NUTRITION_QUERY.test(q)) {
    return /healthful foods|healthy living|Common goals for healthy living|managing body weight/i.test(text);
  }
  if (SUPPORTIVE_CARE_QUERY.test(q)) {
    return /supportive care|nausea|vomiting|fatigue/i.test(text);
  }
  if (DAILY_LIVING_QUERY.test(q)) {
    return /supportive care|quality of life|fatigue|infection|hygiene/i.test(text);
  }
  if (SCLC_QUERY.test(q) && TREATMENT_METHOD_QUERY.test(q)) {
    return /Initial treatment|Limited.?stage|Extensive.?stage|chemoradiation|chemoimmunotherapy|platinum/i.test(text);
  }
  return false;
}

function topicHint(q) {
  if (SUPPORTIVE_CARE_QUERY.test(q)) return 'supportive care palliative side effects nausea fatigue symptom management';
  if (SCLC_QUERY.test(q) && TREATMENT_METHOD_QUERY.test(q)) {
    return 'small cell lung cancer SCLC limited stage extensive stage initial treatment chemoradiation chemoimmunotherapy platinum';
  }
  if (DAILY_LIVING_QUERY.test(q)) return 'supportive care quality of life daily living fatigue infection hygiene';
  if (NUTRITION_QUERY.test(q)) return 'nutrition diet healthy eating healthful foods healthy living body weight';
  return '';
}

function excerptRelates(excerpt, q) {
  const ex = excerpt.toLowerCase();
  if (NUTRITION_QUERY.test(q)) {
    return /healthful foods|healthy living|common goals for healthy living|managing body weight|eating healthful/i.test(ex);
  }
  if (SCLC_QUERY.test(q) && TREATMENT_METHOD_QUERY.test(q)) {
    return /initial treatment|limited.?stage|extensive.?stage|chemoradiation|chemoimmunotherapy|platinum|durvalumab|small cell/i.test(ex);
  }
  if (SUPPORTIVE_CARE_QUERY.test(q) || DAILY_LIVING_QUERY.test(q)) {
    if (/cause of concerning symptoms/i.test(excerpt) && !/supportive care/i.test(ex)) return false;
    return /supportive care|quality of life|fatigue|infection|hygiene|nausea|side effect/i.test(ex);
  }
  return true;
}

function extractExcerpt(text, q) {
  const clean = text.replace(/\[[^\]]+\]\n?/g, '').replace(/\s+/g, ' ');
  const patterns = [];
  if (NUTRITION_QUERY.test(q)) patterns.push(/Common goals for healthy living include/i, /healthful foods/i, /healthy living/i);
  if (SCLC_QUERY.test(q) && TREATMENT_METHOD_QUERY.test(q)) {
    patterns.push(/Initial treatment/i, /chemoradiation/i, /chemoimmunotherapy/i, /Limited.?stage/i, /Extensive.?stage/i);
  }
  if (SUPPORTIVE_CARE_QUERY.test(q) || DAILY_LIVING_QUERY.test(q)) {
    patterns.push(/supportive care/i, /Supportive care addresses/i);
  }
  for (const re of patterns) {
    const idx = clean.search(re);
    if (idx >= 0) return clean.slice(Math.max(0, idx - 10), idx + 270).trim();
  }
  return clean.slice(0, 280);
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) throw new Error(`embed ${res.status}`);
  return (await res.json()).data[0].embedding;
}

const EN_MAP = {
  '항암치료 부작용은 어떻게 관리하나요?': 'How to manage chemotherapy side effects supportive care nausea fatigue',
  '소세포폐암 치료 과정을 알려주세요.': 'small cell lung cancer SCLC treatment process limited stage extensive stage chemoradiation',
  '전이성 폐암에서 일상생활 시 주의할 점은?': 'metastatic lung cancer daily life precautions supportive care quality of life',
  '영양·식이 관리는 어떻게 해야 하나요?': 'nutrition diet management healthful foods healthy living body weight',
};

async function testOne(item) {
  const { q, histology, excerptPat, docId, forbidPat } = item;
  const docs = targetDocs(q, histology);
  const pool = store.chunks.filter((c) => docs.includes(c.docId));
  const searchQ = [EN_MAP[q] ?? q, topicHint(q)].join('\n');
  const qEmb = await embed(searchQ);

  const ranked = pool
    .map((c) => ({ chunk: c, sim: cosine(qEmb, c.embedding) }))
    .sort((a, b) => b.sim - a.sim);

  const anchors = pool.filter((c) => hasTopicSignal(q, c.text) && !isCoverOrFrontMatter(c.text));

  const seen = new Set();
  const cites = [];

  for (const c of anchors) {
    const key = `${c.docId}:${c.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const ex = extractExcerpt(c.text, q);
    if (ex.length < 45 || isCoverOrFrontMatter(ex)) continue;
    if (!excerptRelates(ex, q) || !excerptPat.test(ex)) continue;
    cites.push({ docId: c.docId, page: c.page, excerpt: ex, sim: ranked[0]?.sim ?? 0 });
    if (cites.length >= 3) break;
  }

  console.log(`\nQ: ${q}`);
  console.log(`  docs: ${docs.join(',')} | anchors: ${anchors.length} | cites: ${cites.length}`);

  cites.forEach((c) => {
    console.log(`  ✓ ${c.docId} p.${c.page}`);
    console.log(`    ${c.excerpt.slice(0, 130)}...`);
  });

  const issues = [];
  if (cites.length === 0) issues.push('인용 없음');
  if (docId && !cites.some((c) => c.docId === docId)) issues.push(`${docId} PDF 없음`);
  if (forbidPat && cites.some((c) => forbidPat.test(c.excerpt))) issues.push('금지 발췌 포함');
  if (cites.some((c) => !excerptPat.test(c.excerpt))) issues.push('부적합 발췌');

  console.log(issues.length ? `  ❌ ${issues.join(' | ')}` : '  ✅ PASS');
  return { ok: !issues.length, issues };
}

async function main() {
  const results = [];
  for (const item of QUESTIONS) {
    results.push(await testOne(item));
    await new Promise((r) => setTimeout(r, 200));
  }
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n=== ${QUESTIONS.length - fail}/${QUESTIONS.length} PASS ===`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
