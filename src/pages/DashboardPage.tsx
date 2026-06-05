import { useState } from 'react';
import Footer from '@/components/Footer';
import PatientForm from '@/components/PatientForm';
import PrintHeader from '@/components/PrintHeader';
import PrintPatientSummary from '@/components/PrintPatientSummary';
import SurvivalChart from '@/components/SurvivalChart';
import SurvivalSummary from '@/components/SurvivalSummary';
import { usePatientProfile } from '@/hooks/usePatientProfile';
import { useSurvival } from '@/hooks/useSurvival';
import { generateIssueNumber } from '@/lib/utils';

const DashboardPage = () => {
  const patient = usePatientProfile();
  const { profile } = patient;
  const survival = useSurvival(profile);

  const [issueNumber] = useState<string>(() => generateIssueNumber());
  const [issuedAt] = useState<string>(() => new Date().toLocaleString());

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
          />

          <main className="print-full space-y-6 lg:col-span-8">
            <SurvivalSummary
              data={survival.data}
              isLoading={survival.isLoading}
              error={survival.error}
            />
            <SurvivalChart data={survival.data} isLoading={survival.isLoading} />
            <PrintPatientSummary profile={profile} />
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardPage;
