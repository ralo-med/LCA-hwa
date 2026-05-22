import { TrendingUp } from 'lucide-react';
import type { SurvivalResult } from '../types';

interface SurvivalChartProps {
  survival: SurvivalResult;
  isTreated: boolean;
}

const SurvivalChart = ({ survival, isTreated }: SurvivalChartProps) => {
  const stroke = isTreated ? '#2563eb' : '#94a3b8';
  const points = [
    { x: 0, y: 100 },
    { x: 1 / 5, y: survival.year1 },
    { x: 3 / 5, y: survival.year3 },
    { x: 1, y: survival.year5 },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 no-print">
      <div className="flex items-center justify-between mb-8 border-b pb-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-500" />
          연도별 생존 시뮬레이션 곡선
        </h3>
        <div className="flex gap-4 text-[10px] font-extrabold text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>현재 프로필 치료군
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>대조군 (비치료 보존 요법)
          </div>
        </div>
      </div>

      <div className="relative h-56 w-full px-6 mb-4">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-bold pointer-events-none">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map((v) => (
            <line key={v} x1="0" y1={v} x2="500" y2={v} stroke="#f1f5f9" strokeWidth="1.5" />
          ))}

          <path
            d={`M 0,0 L ${500 * (1 / 5)},${100 - 15} L ${500 * (3 / 5)},${100 - 5} L 500,${100 - 1.2}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeDasharray="5,5"
          />

          <path
            d={`M 0,0 
                L ${500 * (1 / 5)},${100 - survival.year1} 
                L ${500 * (3 / 5)},${100 - survival.year3} 
                L 500,${100 - survival.year5}`}
            fill="none"
            stroke={stroke}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000"
          />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * 500}
              cy={100 - p.y}
              r="5.5"
              fill="white"
              stroke={stroke}
              strokeWidth="3"
            />
          ))}
        </svg>

        <div className="absolute left-6 -bottom-6 w-full flex justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
          <span>진단</span>
          <span>1년</span>
          <span>2년</span>
          <span>3년</span>
          <span>4년</span>
          <span>5년</span>
        </div>
      </div>
    </div>
  );
};

export default SurvivalChart;
