import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PatientProfileFields from '@/components/PatientProfileFields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatientProfile } from '@/hooks/usePatientProfile';

const PatientProfilePage = () => {
  const navigate = useNavigate();
  const patient = usePatientProfile();

  const goToChat = () => {
    navigate('/guide-chat');
  };

  const handleSkip = () => {
    patient.skipProfile();
    goToChat();
  };

  const handleSave = () => {
    patient.saveProfile();
    goToChat();
  };

  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain"
      >
        <div className="absolute -right-40 -top-40 h-144 w-xl rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-120 w-120 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl p-4 pb-12 md:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="animate-rise-delay-1">
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              환자·보호자
            </span>
          </div>

          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            내 암 정보
          </h1>
          <p className="mt-3 text-pretty text-base text-muted-foreground">
            아는 정보만 입력해 주세요. 모르는 항목은 비워두거나 건너뛰셔도
            챗봇을 이용할 수 있습니다.
          </p>
        </div>

        <Card className="animate-rise-delay-2 mt-8 border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">진단·검사 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientProfileFields
              profile={patient.profile}
              setAge={patient.setAge}
              setGender={patient.setGender}
              setHistology={patient.setHistology}
              toggleMutation={patient.toggleMutation}
              resetMutations={patient.resetMutations}
            />
          </CardContent>
        </Card>

        <div className="animate-rise-delay-2 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11"
            onClick={handleSkip}
          >
            건너뛰기
          </Button>
          <Button
            type="button"
            size="lg"
            className="min-h-11"
            onClick={handleSave}
          >
            저장하고 챗봇 시작
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
