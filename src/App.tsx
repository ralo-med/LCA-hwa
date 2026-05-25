import { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import ErrorBanner from '@/components/ErrorBanner';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import LifestyleCard from '@/components/LifestyleCard';
import PatientForm from '@/components/PatientForm';
import PrintHeader from '@/components/PrintHeader';
import PrintPatientSummary from '@/components/PrintPatientSummary';
import ReportCard from '@/components/ReportCard';
import SurvivalChart from '@/components/SurvivalChart';
import SurvivalSummary from '@/components/SurvivalSummary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useChat } from '@/hooks/useChat';
import { useLifestyleGuide } from '@/hooks/useLifestyleGuide';
import { usePatientProfile } from '@/hooks/usePatientProfile';
import { useSurvival } from '@/hooks/useSurvival';
import { useTTS } from '@/hooks/useTTS';
import { generateIssueNumber } from '@/lib/utils';

const App = () => {
  const patient = usePatientProfile();
  const { profile } = patient;

  const survival = useSurvival(profile);
  const insights = useAIInsights();
  const lifestyle = useLifestyleGuide();
  const tts = useTTS();
  const chat = useChat(profile);

  const [issueNumber] = useState<string>(() => generateIssueNumber());
  const [issuedAt] = useState<string>(() => new Date().toLocaleString());

  const aggregatedError = insights.errorMsg || lifestyle.errorMsg;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground transition-colors print:bg-white">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <Header
            onGenerateInsights={() => insights.generate(profile)}
            onGenerateGuide={() => lifestyle.generate(profile)}
            isGeneratingInsights={insights.isGenerating}
            isGeneratingGuide={lifestyle.isGenerating}
          />

          {aggregatedError && <ErrorBanner message={aggregatedError} />}

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

              {(insights.response || insights.isGenerating) && (
                <ReportCard
                  text={insights.response}
                  isLoading={insights.isGenerating}
                  isPlayingAudio={tts.isPlaying}
                  onPlayAudio={() => tts.play(insights.response)}
                />
              )}

              {(lifestyle.guide || lifestyle.isGenerating) && (
                <LifestyleCard text={lifestyle.guide} isLoading={lifestyle.isGenerating} />
              )}

              {insights.response && (
                <ChatPanel
                  history={chat.history}
                  input={chat.input}
                  setInput={chat.setInput}
                  onSend={chat.send}
                  isChatting={chat.isChatting}
                />
              )}

              <PrintPatientSummary profile={profile} />
            </main>
          </div>

          <Footer />
        </div>
      </div>
      <Toaster position="top-center" />
    </TooltipProvider>
  );
};

export default App;
