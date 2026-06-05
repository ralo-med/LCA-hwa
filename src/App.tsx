import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "@/pages/DashboardPage";
import GuideChatPage from "@/pages/GuideChatPage";

const App = () => (
  <TooltipProvider delayDuration={200}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/guide-chat" element={<GuideChatPage />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-center" />
  </TooltipProvider>
);

export default App;
