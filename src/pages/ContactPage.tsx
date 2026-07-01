import { Mail, MessageSquare } from 'lucide-react';
import { InfoPageLayout } from '@/components/InfoPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTACT_EMAIL, DOCTORS_URL } from '@/constants/site';

const ContactPage = () => {
  return (
    <InfoPageLayout
      title="문의하기"
      subtitle="오류 제보, 답변·인용 이상, UI 문제, 개선 제안을 받습니다."
    >
      <section className="space-y-3">
        <p>
          서비스 이용 중 불편 사항이나 버그가 있으면 아래 이메일로
          알려 주세요.
        </p>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5 text-primary" />
            이메일 문의
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-mono text-sm md:text-base">{CONTACT_EMAIL}</p>
          <Button asChild>
            <a href={`mailto:${CONTACT_EMAIL}`}>메일 보내기</a>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          이런 내용을 보내주시면 도움이 됩니다
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>챗봇 답변·가이드라인 인용이 이상했던 질문 예시</li>
          <li>대시보드·생존 그래프 표시 오류</li>
          <li>모바일·브라우저 환경에서의 UI 문제</li>
          <li>추가로 다루었으면 하는 환자 교육 주제</li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        의료 상담·응급 문의는 이 메일이 아닌{' '}
        <a
          href={DOCTORS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          병원 폐암 의료진
        </a>
        을 통해 진행해 주세요.
      </p>
    </InfoPageLayout>
  );
};

export default ContactPage;
