import { useState } from 'react';
import PatientForm from '@/components/PatientForm';
import PrintHeader from '@/components/PrintHeader';
import PrintPatientSummary from '@/components/PrintPatientSummary';
import { ShareButton } from '@/components/ShareButton';
import SurvivalChart from '@/components/SurvivalChart';
import SurvivalSummary from '@/components/SurvivalSummary';
import { usePatientProfile } from '@/hooks/usePatientProfile';
import { useSurvival } from '@/hooks/useSurvival';
import {
  formatProfileSummary,
  resolveProfileForSurvival,
} from '@/lib/patient-profile';
import { generateIssueNumber } from '@/lib/utils';

const DashboardPage = () => {
  const patient = usePatientProfile();
  const { profile, configured } = patient;
  const survivalProfile = resolveProfileForSurvival(profile);
  const survival = useSurvival(survivalProfile);

  const [issueNumber] = useState<string>(() => generateIssueNumber());
  const [issuedAt] = useState<string>(() => new Date().toLocaleString());

  const year5 = survival.data?.year5;
  const median =
    survival.data?.medianOsStatus === 'estimated'
      ? survival.data.median
      : null;
  const shareText = [
    '[화순전남대학교병원 폐암 정밀의료]',
    `${formatProfileSummary(survivalProfile)} 기준 추정`,
    year5 != null ? `5년 생존 추정치: ${year5.toFixed(1)}%` : null,
    median != null ? `중앙 생존기간: ${median.toFixed(1)}년` : null,
    '※ AI 보조 정보이며 실제 진료는 담당 전문의와 상의하세요.',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="relative overflow-hidden bg-background text-foreground transition-colors print:bg-white">
      <img
        src="/images/clinical.png"
        alt=""
        aria-hidden
        className="no-print pointer-events-none absolute -bottom-16 -right-16 w-144 max-w-none select-none opacity-[0.42] md:-bottom-24 md:-right-24 md:w-4xl"
        style={{
          WebkitMaskImage:
            "linear-gradient(to top left, black 18%, transparent 78%)",
          maskImage:
            "linear-gradient(to top left, black 18%, transparent 78%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl p-4 md:p-8">
        <PrintHeader issueNumber={issueNumber} issuedAt={issuedAt} />

        <div className="no-print animate-rise-delay-1 mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              생존 분석
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              환자 조건에 맞춘 공개 코호트 기반 추정
            </p>
          </div>
          <ShareButton
            payload={{ title: "폐암 생존 분석 결과", text: shareText }}
            label="결과 공유"
            variant="outline"
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <PatientForm
            profile={profile}
            configured={configured}
            setAge={patient.setAge}
            setGender={patient.setGender}
            setHistology={patient.setHistology}
            toggleMutation={patient.toggleMutation}
            resetMutations={patient.resetMutations}
            setConfigured={patient.setConfigured}
          />

          <main className="print-full space-y-6 lg:col-span-8">
            <SurvivalSummary
              data={survival.data}
              isLoading={survival.isLoading}
              studiesMetaPending={survival.studiesMetaPending}
              error={survival.error}
            />
            <SurvivalChart data={survival.data} isLoading={survival.isLoading} />
            <PrintPatientSummary profile={survivalProfile} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
