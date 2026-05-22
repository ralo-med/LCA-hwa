import { Activity, HeartPulse, Loader2, Sparkles } from 'lucide-react';

interface HeaderProps {
  onGenerateInsights: () => void;
  onGenerateGuide: () => void;
  isGeneratingInsights: boolean;
  isGeneratingGuide: boolean;
}

const Header = ({
  onGenerateInsights,
  onGenerateGuide,
  isGeneratingInsights,
  isGeneratingGuide,
}: HeaderProps) => (
  <header className="mb-8 border-b-2 border-indigo-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-6 rounded-3xl shadow-sm">
    <div>
      <h1 className="text-2xl md:text-3.5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 flex items-center gap-3">
        <Activity className="text-blue-600 animate-pulse" size={36} />
        4병기 폐암 환자를 위한 정밀의료 생존율
      </h1>
      <p className="text-slate-500 font-semibold mt-2 flex items-center gap-1.5">
        <span className="text-indigo-600 font-extrabold">화순전남대학교병원</span>
        <span className="text-slate-400">|</span>
        <span className="text-emerald-600 font-bold">정밀의료 & 환자 맞춤 케어 시스템</span>
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        onClick={onGenerateInsights}
        disabled={isGeneratingInsights}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-2xl font-bold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-sm shadow-md"
      >
        {isGeneratingInsights ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
        <span>정밀 의학 소견 생성</span>
      </button>
      <button
        onClick={onGenerateGuide}
        disabled={isGeneratingGuide}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-sm shadow-md"
      >
        {isGeneratingGuide ? <Loader2 className="animate-spin" size={16} /> : <HeartPulse size={16} />}
        <span>생활 가이드 생성</span>
      </button>
    </div>
  </header>
);

export default Header;
