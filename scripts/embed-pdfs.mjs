import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import {
  EMBEDDING_MODEL,
  embedBatchGoogle,
  isValidGoogleKey,
} from './lib/google-embed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });

const API_KEY = (
  process.env.VITE_GOOGLE_API_KEY ??
  process.env.GOOGLE_API_KEY ??
  ''
).trim();

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;
const BATCH_SIZE = 50;

// lang: 문서 언어. 검색 시 한글 문서는 한글 질의로, 영어 문서는 영어 번역 질의로 매칭한다.
// audience: 'patient'=환자용(챗봇 기본), 'clinician'=의료진용(정확한 의학 답변 모드)
const DOCS = [
  {
    id: 'metastatic',
    file: 'lung-metastatic-patient.pdf',
    title: '전이성 폐암 환자 안내',
    tags: ['metastatic', 'nsclc', 'general'],
    lang: 'en',
    audience: 'patient',
  },
  {
    id: 'earlystage',
    file: 'lung-early-stage-patient.pdf',
    title: '조기 폐암 환자 안내',
    tags: ['earlystage', 'nsclc'],
    lang: 'en',
    audience: 'patient',
  },
  {
    id: 'sclc',
    file: 'SCLC-patient-guideline.pdf',
    title: '소세포폐암 환자 가이드라인',
    tags: ['sclc', 'smallcell'],
    lang: 'en',
    audience: 'patient',
  },
  {
    id: 'patient_qa',
    file: 'lungca-patient-qa.pdf',
    title: '대한폐암학회 환자 Q&A (폐암 무엇이든 물어보세요)',
    tags: ['patient', 'qa', 'nsclc', 'sclc', 'general'],
    lang: 'ko',
    audience: 'patient',
  },
  {
    id: 'kalc_guideline',
    file: 'kalc-lung-guideline-2023.pdf',
    title: '대한폐암학회 폐암 진료지침 (3판, 2023)',
    tags: ['clinician', 'nsclc', 'sclc'],
    lang: 'ko',
    audience: 'clinician',
    // 의료진용 원문은 방대해 청크를 크게 잡고, 참고문헌 위주 페이지는 제외한다.
    chunkSize: 1300,
    chunkOverlap: 150,
    dropReferences: true,
  },
];

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// 참고문헌 위주 텍스트 판별 (저자 et al, 저널명, doi, 연도;권:쪽 패턴 비율)
function looksLikeReferences(text) {
  const refSignal =
    /\bet al\.?|\bdoi:|https?:\/\/|\d{4};\d+[:(]|N Engl J Med|J Clin Oncol|J Thorac|Lancet|Ann Oncol|Cancer\s+\d{4}|Chest\s+\d{4}/gi;
  const matches = text.match(refSignal);
  if (!matches) return false;
  // 대략 200자당 참고문헌 신호 1개 이상이면 참고문헌 페이지로 간주
  return matches.length >= Math.max(3, Math.floor(text.length / 200));
}

function chunkText(text, docMeta, page) {
  const chunks = [];
  if (!text.trim()) return chunks;

  const size = docMeta.chunkSize ?? CHUNK_SIZE;
  const overlap = docMeta.chunkOverlap ?? CHUNK_OVERLAP;
  const isKo = docMeta.lang === 'ko';

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const slice = text.slice(start, end).trim();
    if (slice.length >= 80 && !(docMeta.dropReferences && looksLikeReferences(slice))) {
      const prefix = isKo
        ? `[${docMeta.title} | p.${page} | 폐암 진료 안내]`
        : `[${docMeta.title} | p.${page} | lung cancer patient treatment guideline]`;
      chunks.push({
        id: `${docMeta.id}-p${page}-c${chunks.length}`,
        docId: docMeta.id,
        docTitle: docMeta.title,
        tags: docMeta.tags,
        lang: docMeta.lang ?? 'en',
        audience: docMeta.audience ?? 'patient',
        page,
        text: `${prefix}\n${slice}`,
      });
    }
    if (end >= text.length) break;
    start = end - overlap;
  }
  return chunks;
}

async function extractPdfChunks(pdfPath, docMeta) {
  const buffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();

  const chunks = [];
  for (const page of data.pages ?? []) {
    const pageText = normalizeText(page.text ?? '');
    const pageNum = page.num ?? chunks.length + 1;
    chunks.push(...chunkText(pageText, docMeta, pageNum));
  }

  return chunks;
}

async function embedBatch(texts) {
  return embedBatchGoogle(API_KEY, texts, 'RETRIEVAL_DOCUMENT');
}

async function main() {
  const extractOnly = process.argv.includes('--extract-only');
  const pdfDir = path.join(ROOT, 'data', 'pdfs');
  const allChunks = [];

  for (const doc of DOCS) {
    const pdfPath = path.join(pdfDir, doc.file);
    console.log(`Extracting: ${doc.title}`);
    const chunks = await extractPdfChunks(pdfPath, doc);
    console.log(`  → ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`Total chunks: ${allChunks.length}`);

  if (extractOnly) {
    console.log('Extract-only mode: embeddings skipped.');
    allChunks.forEach((chunk) => {
      chunk.embedding = [];
    });
  } else {
    if (!isValidGoogleKey(API_KEY)) {
      console.error(
        'VITE_GOOGLE_API_KEY가 .env에 없습니다. 키 설정 후 다시 실행하거나 --extract-only를 사용하세요.',
      );
      process.exit(1);
    }

    console.log('Embedding...');
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const vectors = await embedBatch(batch.map((c) => c.text));
      batch.forEach((chunk, idx) => {
        chunk.embedding = vectors[idx];
      });
      console.log(`  ${Math.min(i + BATCH_SIZE, allChunks.length)} / ${allChunks.length}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const model = extractOnly ? null : EMBEDDING_MODEL;
  const generatedAt = new Date().toISOString();
  const docMeta = (filterFn) =>
    DOCS.filter(filterFn).map(({ id, title, tags, lang, audience }) => ({
      id,
      title,
      tags,
      lang: lang ?? 'en',
      audience: audience ?? 'patient',
    }));

  // 환자용(기본, 항상 로딩)과 의료진용(지연 로딩)으로 분리해 초기 로딩을 가볍게 유지
  const isClinician = (c) => c.audience === 'clinician';
  const patientChunks = allChunks.filter((c) => !isClinician(c));
  const clinicianChunks = allChunks.filter(isClinician);

  const publicPdfDir = path.join(ROOT, 'public', 'pdfs');
  await fs.mkdir(publicPdfDir, { recursive: true });
  for (const doc of DOCS) {
    await fs.copyFile(
      path.join(pdfDir, doc.file),
      path.join(publicPdfDir, doc.file),
    );
  }

  const dataDir = path.join(ROOT, 'public', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const write = async (fileName, docs, chunks) => {
    const payload = { version: 1, model, generatedAt, docs, chunks };
    const json = JSON.stringify(payload);
    const outPath = path.join(dataDir, fileName);
    await fs.writeFile(outPath, json);
    const sizeMb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
    console.log(`Saved ${outPath} (${sizeMb} MB, ${chunks.length} chunks)`);
  };

  await write(
    'guide-chunks.json',
    docMeta((d) => (d.audience ?? 'patient') !== 'clinician'),
    patientChunks,
  );
  await write(
    'guide-chunks-clinician.json',
    docMeta((d) => d.audience === 'clinician'),
    clinicianChunks,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
