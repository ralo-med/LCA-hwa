import type { SurvivalResult } from '../types';

interface SurvivalSummaryProps {
  survival: SurvivalResult;
}

const SurvivalSummary = ({ survival }: SurvivalSummaryProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-8 rounded-3xl shadow-lg text-white text-center transform hover:scale-[1.01] transition-all card">
      <span className="text-emerald-100 text-xs font-black uppercase tracking-wider block mb-2">
        예상 5년 생존율 시뮬레이션
      </span>
      <div className="text-6xl font-black tracking-tight">{survival.year5.toFixed(1)}%</div>
      <div className="w-full bg-white/20 h-2 rounded-full mt-5 no-print overflow-hidden">
        <div
          className="h-full bg-emerald-200 transition-all duration-1000"
          style={{ width: `${survival.year5}%` }}
        ></div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-8 rounded-3xl shadow-lg text-white text-center transform hover:scale-[1.01] transition-all card">
      <span className="text-orange-100 text-xs font-black uppercase tracking-wider block mb-2">
        통계적 중앙 생존 기간(추정)
      </span>
      <div className="text-5xl font-black tracking-tight">
        {survival.median.toFixed(1)} <span className="text-2xl font-normal">년</span>
      </div>
      <p className="text-[10px] text-orange-200 mt-5 font-bold uppercase tracking-wider">
        한국인 암등록사업 데이터 및 정밀의료 보정
      </p>
    </div>
  </div>
);

export default SurvivalSummary;
