import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppNav from '@/components/AppNav';
import DashboardPage from '@/pages/DashboardPage';
import GuideChatPage from '@/pages/GuideChatPage';
import GuidePdfsPage from '@/pages/GuidePdfsPage';
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
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/guide-chat" element={<GuideChatPage />} />
              <Route path="/guides" element={<GuidePdfsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
};

export default App;
