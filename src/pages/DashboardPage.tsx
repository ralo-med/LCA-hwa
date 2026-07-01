import { useState } from 'react';
import PatientForm from '@/components/PatientForm';
import PrintHeader from '@/components/PrintHeader';
import PrintPatientSummary from '@/components/PrintPatientSummary';
import { ShareButton } from '@/components/ShareButton';
import SurvivalChart from '@/components/SurvivalChart';
import SurvivalSummary from '@/components/SurvivalSummary';
import { usePatientProfile } from '@/hooks/usePatientProfile';
import { useSurvival } from '@/hooks/useSurvival';
import { generateIssueNumber, histologyLabel } from '@/lib/utils';

const DashboardPage = () => {
  const patient = usePatientProfile();
  const { profile } = patient;
  const survival = useSurvival(profile);

  const [issueNumber] = useState<string>(() => generateIssueNumber());
  const [issuedAt] = useState<string>(() => new Date().toLocaleString());

  const genderLabel = profile.gender === 'female' ? '여성' : '남성';
  const year5 = survival.data?.year5;
  const median =
    survival.data?.medianOsStatus === 'estimated'
      ? survival.data.median
      : null;
  const shareText = [
    '[화순전남대학교병원 폐암 정밀의료]',
    `${profile.age}세 ${genderLabel} · ${histologyLabel(profile.histology)} 기준 추정`,
    year5 != null ? `5년 생존 추정치: ${year5.toFixed(1)}%` : null,
    median != null ? `중앙 생존기간: ${median.toFixed(1)}년` : null,
    '※ AI 보조 정보이며 실제 진료는 담당 전문의와 상의하세요.',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="bg-background text-foreground transition-colors print:bg-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <PrintHeader issueNumber={issueNumber} issuedAt={issuedAt} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <PatientForm
            profile={profile}
            setAge={patient.setAge}
            setGender={patient.setGender}
            setHistology={patient.setHistology}
            toggleMutation={patient.toggleMutation}
            resetMutations={patient.resetMutations}
          />

          <main className="print-full space-y-6 lg:col-span-8">
            <div className="no-print flex justify-end">
              <ShareButton
                payload={{ title: '폐암 생존 분석 결과', text: shareText }}
                label="결과 공유"
                variant="outline"
                size="sm"
              />
            </div>
            <SurvivalSummary
              data={survival.data}
              isLoading={survival.isLoading}
              studiesMetaPending={survival.studiesMetaPending}
              error={survival.error}
            />
            <SurvivalChart data={survival.data} isLoading={survival.isLoading} />
            <PrintPatientSummary profile={profile} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
