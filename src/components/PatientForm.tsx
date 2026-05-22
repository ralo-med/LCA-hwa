import { Activity, CheckCircle2, Stethoscope, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { MUTATION_OPTIONS, PDL1_OPTIONS } from '../constants';
import type { Gender, Histology, PatientProfile } from '../types';

interface PatientFormProps {
  profile: PatientProfile;
  setAge: (v: number) => void;
  setGender: (v: Gender) => void;
  setHistology: (v: Histology) => void;
  setPdl1: (v: string) => void;
  setIsTreated: (v: boolean) => void;
  toggleMutation: (id: string) => void;
}

const PatientForm = ({
  profile,
  setAge,
  setGender,
  setHistology,
  setPdl1,
  setIsTreated,
  toggleMutation,
}: PatientFormProps) => {
  const { age, gender, histology, selectedMutations, pdl1, isTreated } = profile;

  return (
    <aside className="lg:col-span-4 space-y-6 no-print">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500"></div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 border-b pb-2 pt-2">
          <Stethoscope size={20} className="text-teal-500" /> 임상 프로필 입력
        </h2>

        <div className="space-y-6">
          {/* 항암 치료 실시 여부 토글 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Activity className={isTreated ? 'text-blue-600 animate-pulse' : 'text-slate-400'} size={22} />
              <div>
                <p className="text-xs font-bold text-slate-800">항암 치료 계획</p>
                <p className="text-[11px] text-blue-700 font-extrabold">
                  {isTreated ? '적극적 복합 치료 실시' : '보존적 증상 완화 요법'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTreated(!isTreated)}
              className="focus:outline-none transition-transform active:scale-95"
              aria-label="항암 치료 계획 토글"
            >
              {isTreated ? (
                <ToggleRight className="text-blue-600" size={42} />
              ) : (
                <ToggleLeft className="text-slate-400" size={42} />
              )}
            </button>
          </div>

          {/* 나이 + 성별 */}
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">
              진단 연령: <span className="text-indigo-600 font-extrabold">{age}세</span>
            </label>
            <input
              type="range"
              min={30}
              max={90}
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex gap-2 mt-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    gender === g
                      ? g === 'male'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-pink-600 text-white border-pink-600 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User size={14} /> {g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>

          {/* 조직형 */}
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">암 조직형 분류</label>
            <select
              value={histology}
              onChange={(e) => setHistology(e.target.value as Histology)}
              className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="adenocarcinoma">선암 (Adenocarcinoma)</option>
              <option value="squamous">편평상피세포암 (Squamous Cell)</option>
              <option value="others">기타 조직형 (Other NSCLC)</option>
              <option value="smallcell">소세포암 (Small Cell)</option>
            </select>
          </div>

          {/* PD-L1 */}
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">PD-L1 발현율 검사 결과</label>
            <div className="grid grid-cols-2 gap-2">
              {PDL1_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setPdl1(o.id)}
                  className={`text-left p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    pdl1 === o.id
                      ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 유전자 변이 중복 선택 */}
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">유전자 변이 검출 결과 (중복 선택)</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {MUTATION_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMutation(m.id)}
                  className={`text-left p-2 rounded-xl border-2 text-[11px] font-bold relative transition-all ${
                    selectedMutations.includes(m.id)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {m.label}
                  {selectedMutations.includes(m.id) && (
                    <CheckCircle2 size={12} className="absolute top-1 right-1 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PatientForm;
