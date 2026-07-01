import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppNav from '@/components/AppNav';
import Footer from '@/components/Footer';
import { PageTransitionLayout } from '@/components/PageTransitionLayout';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import DashboardPage from '@/pages/DashboardPage';
import LandingPage from '@/pages/LandingPage';
import GuideChatPage from '@/pages/GuideChatPage';
import GuidePdfsPage from '@/pages/GuidePdfsPage';
import PatientProfilePage from '@/pages/PatientProfilePage';
import { loadCohort } from '@/lib/survival-cbioportal';
import type { Histology } from '@/types';

function getPrefetchHistology(): Histology {
  try {
    const raw = localStorage.getItem('lca-patient-profile');
    if (raw) {
      const p = JSON.parse(raw) as { histology?: Histology };
      if (p.histology) return p.histology;
    }
  } catch {
    /* ignore */
  }
  return 'adenocarcinoma';
}

const App = () => {
  useEffect(() => {
    void loadCohort(getPrefetchHistology());
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <AppNav />
          <main className="flex min-h-0 flex-1 flex-col">
            <Routes>
              <Route element={<PageTransitionLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/profile" element={<PatientProfilePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/guide-chat" element={<GuideChatPage />} />
                <Route path="/guides" element={<GuidePdfsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
};

export default App;
