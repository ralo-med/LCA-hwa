import { useMemo, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import GlobalStyles from './components/GlobalStyles';
import Header from './components/Header';
import LifestyleCard from './components/LifestyleCard';
import PatientForm from './components/PatientForm';
import PrintHeader from './components/PrintHeader';
import PrintPatientSummary from './components/PrintPatientSummary';
import ReportCard from './components/ReportCard';
import SurvivalChart from './components/SurvivalChart';
import SurvivalSummary from './components/SurvivalSummary';
import { useAIInsights } from './hooks/useAIInsights';
import { useChat } from './hooks/useChat';
import { useLifestyleGuide } from './hooks/useLifestyleGuide';
import { usePatientProfile } from './hooks/usePatientProfile';
import { useTTS } from './hooks/useTTS';
import { calculateSurvival } from './lib/survival';
import { generateIssueNumber } from './lib/utils';

const App = () => {
  const patient = usePatientProfile();
  const { profile } = patient;

  const insights = useAIInsights();
  const lifestyle = useLifestyleGuide();
  const tts = useTTS();
  const chat = useChat(profile);

  const survival = useMemo(() => calculateSurvival(profile), [profile]);
  const [issueNumber] = useState<string>(() => generateIssueNumber());
  const [issuedAt] = useState<string>(() => new Date().toLocaleString());

  const aggregatedError = insights.errorMsg || lifestyle.errorMsg;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f4f7f6] via-[#eff6ff] to-[#f5f3ff] font-sans text-slate-900 print:bg-white overflow-x-hidden transition-all duration-300">
      <GlobalStyles />

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Header
          onGenerateInsights={() => insights.generate(profile)}
          onGenerateGuide={() => lifestyle.generate(profile)}
          isGeneratingInsights={insights.isGenerating}
          isGeneratingGuide={lifestyle.isGenerating}
        />

        {aggregatedError && <ErrorBanner message={aggregatedError} />}

        <PrintHeader issueNumber={issueNumber} issuedAt={issuedAt} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <PatientForm
            profile={profile}
            setAge={patient.setAge}
            setGender={patient.setGender}
            setHistology={patient.setHistology}
            setPdl1={patient.setPdl1}
            setIsTreated={patient.setIsTreated}
            toggleMutation={patient.toggleMutation}
          />

          <main className="lg:col-span-8 space-y-6 print-full">
            <SurvivalSummary survival={survival} />
            <SurvivalChart survival={survival} isTreated={profile.isTreated} />

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
  );
};

export default App;
