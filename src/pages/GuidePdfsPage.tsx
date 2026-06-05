import { ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GUIDE_DOC_META, type GuideDocId } from '@/lib/rag';

const DOC_ORDER: GuideDocId[] = ['earlystage', 'metastatic', 'sclc'];

const GuidePdfsPage = () => {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            가이드라인 PDF
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            NCCN 환자용 폐암 가이드라인 원문입니다. 챗봇 답변의 근거 자료로
            사용됩니다.
          </p>
        </div>

        <div className="space-y-3">
          {DOC_ORDER.map((id) => {
            const meta = GUIDE_DOC_META[id];
            const href = `/pdfs/${meta.fileName}`;
            return (
              <Card key={id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{meta.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs text-muted-foreground">
                    {meta.fileName}
                  </p>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    PDF 열기
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          자료 출처: NCCN Guidelines for Patients
        </p>
      </div>
    </div>
  );
};

export default GuidePdfsPage;
