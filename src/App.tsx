import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppNav from '@/components/AppNav';
import DashboardPage from '@/pages/DashboardPage';
import GuideChatPage from '@/pages/GuideChatPage';
import GuidePdfsPage from '@/pages/GuidePdfsPage';
const App = () => {
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
