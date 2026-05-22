import { MUTATION_OPTIONS, PDL1_OPTIONS } from '../constants';
import { histologyLabel } from '../lib/utils';
import type { PatientProfile } from '../types';

interface PrintPatientSummaryProps {
  profile: PatientProfile;
}

const PrintPatientSummary = ({ profile }: PrintPatientSummaryProps) => {
  const { age, gender, histology, selectedMutations, pdl1 } = profile;

  return (
    <div className="hidden print:block mt-6 p-6 border border-slate-200 rounded-2xl bg-slate-50">
      <h4 className="font-bold border-b pb-2 mb-4 text-sm text-slate-800">환자 임상 데이터 기초 상세내역</h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
        <div>
          <span className="text-slate-500 font-medium">연령:</span> {age}세
        </div>
        <div>
          <span className="text-slate-500 font-medium">성별:</span> {gender === 'male' ? '남성' : '여성'}
        </div>
        <div>
          <span className="text-slate-500 font-medium">조직학적 암 분류:</span> {histologyLabel(histology)}
        </div>
        <div>
          <span className="text-slate-500 font-medium">PD-L1 발현 정도:</span>{' '}
          {PDL1_OPTIONS.find((o) => o.id === pdl1)?.label}
        </div>
        <div className="col-span-2">
          <span className="text-slate-500 font-medium">진단된 유전자 동반 변이:</span>{' '}
          {selectedMutations.map((m) => MUTATION_OPTIONS.find((o) => o.id === m)?.label).join(', ')}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-6 text-center">
        ※ 본 보고서는 화순전남대학교병원 정밀진료 분석 도구를 사용하여 생성되었으며, 진료 시 기초 소견 보조 데이터로 활용됩니다.
      </p>
    </div>
  );
};

export default PrintPatientSummary;
