import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });

const API_KEY = (
  process.env.VITE_OPENAI_API_KEY ??
  process.env.OPENAI_API_KEY ??
  ''
).trim();

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;
const BATCH_SIZE = 100;

const DOCS = [
  {
    id: 'metastatic',
    file: 'lung-metastatic-patient.pdf',
    title: '전이성 폐암 환자 안내',
    tags: ['metastatic', 'nsclc', 'general'],
  },
  {
    id: 'earlystage',
    file: 'lung-early-stage-patient.pdf',
    title: '조기 폐암 환자 안내',
    tags: ['earlystage', 'nsclc'],
  },
  {
    id: 'sclc',
    file: 'SCLC-patient-guideline.pdf',
    title: '소세포폐암 환자 가이드라인',
    tags: ['sclc', 'smallcell'],
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

function chunkText(text, docMeta, page) {
  const chunks = [];
  if (!text.trim()) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const slice = text.slice(start, end).trim();
    if (slice.length >= 80) {
      const prefix = `[${docMeta.title} | p.${page} | lung cancer patient treatment guideline]`;
      chunks.push({
        id: `${docMeta.id}-p${page}-c${chunks.length}`,
        docId: docMeta.id,
        docTitle: docMeta.title,
        tags: docMeta.tags,
        page,
        text: `${prefix}\n${slice}`,
      });
    }
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
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
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API failed (${response.status}): ${err}`);
  }

  const json = await response.json();
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
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
    if (!API_KEY || !API_KEY.startsWith('sk-') || API_KEY.includes('your_openai')) {
      console.error(
        'VITE_OPENAI_API_KEY가 .env에 없습니다. 키 설정 후 다시 실행하거나 --extract-only를 사용하세요.',
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

  const output = {
    version: 1,
    model: extractOnly ? null : EMBEDDING_MODEL,
    generatedAt: new Date().toISOString(),
    docs: DOCS.map(({ id, title, tags }) => ({ id, title, tags })),
    chunks: allChunks,
  };

  const publicPdfDir = path.join(ROOT, 'public', 'pdfs');
  await fs.mkdir(publicPdfDir, { recursive: true });
  for (const doc of DOCS) {
    await fs.copyFile(
      path.join(pdfDir, doc.file),
      path.join(publicPdfDir, doc.file),
    );
  }

  const outPath = path.join(ROOT, 'public', 'data', 'guide-chunks.json');
  await fs.writeFile(outPath, JSON.stringify(output));
  const sizeMb = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
  console.log(`Saved ${outPath} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
