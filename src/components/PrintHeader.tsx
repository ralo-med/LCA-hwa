interface PrintHeaderProps {
  issueNumber: string;
  issuedAt: string;
}

const PrintHeader = ({ issueNumber, issuedAt }: PrintHeaderProps) => (
  <div className="hidden print:block text-center mb-8 pb-6 border-b-2 border-slate-800">
    <h1 className="text-3xl font-black tracking-tight mb-2">폐암 정밀의료 맞춤 소견서</h1>
    <p className="text-slate-600 font-bold text-lg">화순전남대학교병원 폐암 센터</p>
    <div className="flex justify-between text-xs text-slate-400 mt-4">
      <span>발급번호: {issueNumber}</span>
      <span>작성 일시: {issuedAt}</span>
    </div>
  </div>
);

export default PrintHeader;
