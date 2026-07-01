import { ExternalLink, FileText, Stethoscope, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GUIDE_DOC_META, type GuideDocId } from '@/lib/rag';

const PATIENT_DOCS: GuideDocId[] = [
  'factsheet',
  'patient_qa',
  'earlystage',
  'metastatic',
  'sclc',
];
const CLINICIAN_DOCS: GuideDocId[] = ['kalc_guideline'];

const DocCard = ({ id }: { id: GuideDocId }) => {
  const meta = GUIDE_DOC_META[id];
  const href = `/pdfs/${meta.fileName}`;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{meta.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.source}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          PDF 열기
        </a>
      </CardContent>
    </Card>
  );
};

const GuidePdfsPage = () => {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              자료실
            </span>
          </div>
          <h1 className="font-display mt-4 flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
            <FileText className="h-6 w-6 text-primary" />
            가이드라인 · 안내 자료
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            챗봇 답변의 근거로 쓰이는 원문 자료입니다. 직접 열람·저장하실 수
            있어요.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Users className="h-4 w-4" />
            환자·보호자용
          </h2>
          {PATIENT_DOCS.map((id) => (
            <DocCard key={id} id={id} />
          ))}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Stethoscope className="h-4 w-4" />
            의료진용
          </h2>
          {CLINICIAN_DOCS.map((id) => (
            <DocCard key={id} id={id} />
          ))}
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          출처: 화순전남대학교병원 · 대한폐암학회 · NCCN Guidelines for Patients
        </p>
      </div>
    </div>
  );
};

export default GuidePdfsPage;
