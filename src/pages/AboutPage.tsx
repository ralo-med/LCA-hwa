import {
  LineChart,
  MessageCircleHeart,
  FileText,
  Stethoscope,
} from 'lucide-react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SERVICES = [
  {
    icon: MessageCircleHeart,
    title: '환자 안내 챗봇',
    body: '대한폐암학회 지침·환자용 Q&A·NCCN 가이드라인을 검색해 질문에 답하고, 관련 원문 페이지를 함께 보여 줍니다.',
  },
  {
    icon: LineChart,
    title: '생존 대시보드',
    body: 'cBioPortal 공개 연구 코호트를 바탕으로 Kaplan–Meier 생존 곡선과 요약 통계를 제공합니다.',
  },
  {
    icon: FileText,
    title: '가이드라인 PDF',
    body: '조기·전이성 비소세포폐암, 소세포폐암 환자 안내와 학회 지침 원문을 직접 열람할 수 있습니다.',
  },
  {
    icon: Stethoscope,
    title: '의료진 연결',
    body: '병원 폐암 의료진 정보 페이지로 연결해 실제 진료 상담을 이어갈 수 있습니다.',
  },
];

const AboutPage = () => {
  return (
    <InfoPageLayout
      title="서비스 소개"
      subtitle="폐암 환자와 보호자를 위한 AI 기반 정밀의료 보조·교육 서비스입니다. 맞춤 생존 분석, 가이드라인 기반 챗봇, 원문 PDF를 한곳에서 제공합니다."
      image="/images/clinical.png"
    >
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">우리의 목표</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>데이터 기반 이해</strong>: 추측이 아닌 공개 코호트·가이드라인
            근거로 치료 정보를 설명합니다.
          </li>
          <li>
            <strong>환자 맞춤</strong>: 대시보드에 입력한 프로필을 반영해
            생존 추정과 안내를 개인화합니다.
          </li>
          <li>
            <strong>근거 중심 안내</strong>: 챗봇 답변은 가이드라인 원문을
            검색(RAG)해 페이지 단위로 인용합니다. 한글 환자 자료를 우선
            참고합니다.
          </li>
          <li>
            <strong>이해하기 쉬운 설명</strong>: 복잡한 의학 정보를 환자·보호자
            눈높이의 한국어로 풀어 드립니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">제공 서비스</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.body}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">
          데이터와 AI 분석 과정
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>가이드라인 수집</strong>: NCCN 환자용 가이드라인, 대한폐암학회
            진료지침, 환자용 Q&amp;A 등을 수집·정리합니다.
          </li>
          <li>
            <strong>임베딩·색인</strong>: 문서를 페이지 단위로 나누어 벡터
            임베딩을 생성하고, 질문 시 관련 구간만 검색합니다.
          </li>
          <li>
            <strong>맞춤 답변</strong>: 환자 프로필과 검색된 원문을 바탕으로
            AI가 한국어 안내를 생성합니다.
          </li>
          <li>
            <strong>생존 분석</strong>: 공개 임상 연구 데이터를 코호트별로
            집계해 생존 곡선을 시각화합니다.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <h2 className="font-display text-lg font-semibold">안전성 및 면책</h2>
        <p className="text-sm text-muted-foreground">
          본 서비스의 생존 수치, AI 소견, 챗봇 답변은{' '}
          <strong>의료 결정을 대체하지 않는 보조 정보</strong>입니다. 실제
          치료 계획·약물 선택·응급 상황 판단은 반드시 담당 전문의와 상의하세요.
          응급 증상이 있으면 즉시 의료기관을 방문하세요.
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default AboutPage;
