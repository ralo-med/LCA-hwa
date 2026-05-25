import { MUTATION_OPTIONS, PDL1_OPTIONS } from '@/constants';
import { histologyLabel } from '@/lib/utils';
import type { PatientProfile } from '@/types';

interface PrintPatientSummaryProps {
  profile: PatientProfile;
}

const PrintPatientSummary = ({ profile }: PrintPatientSummaryProps) => {
  const { age, gender, histology, selectedMutations, pdl1 } = profile;

  return (
    <div className="mt-6 hidden rounded-lg border bg-muted/40 p-6 print:block">
      <h4 className="mb-4 border-b pb-2 text-sm font-bold text-foreground">
        환자 임상 데이터 기초 상세내역
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
        <div>
          <span className="font-medium text-muted-foreground">연령:</span> {age}세
        </div>
        <div>
          <span className="font-medium text-muted-foreground">성별:</span>{' '}
          {gender === 'male' ? '남성' : '여성'}
        </div>
        <div>
          <span className="font-medium text-muted-foreground">조직학적 암 분류:</span>{' '}
          {histologyLabel(histology)}
        </div>
        <div>
          <span className="font-medium text-muted-foreground">PD-L1 발현 정도:</span>{' '}
          {PDL1_OPTIONS.find((o) => o.id === pdl1)?.label}
        </div>
        <div className="col-span-2">
          <span className="font-medium text-muted-foreground">진단된 유전자 동반 변이:</span>{' '}
          {selectedMutations.map((m) => MUTATION_OPTIONS.find((o) => o.id === m)?.label).join(', ')}
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        ※ 본 보고서는 화순전남대학교병원 정밀진료 분석 도구를 사용하여 생성되었으며, 진료 시 기초 소견 보조 데이터로 활용됩니다.
      </p>
    </div>
  );
};

export default PrintPatientSummary;
