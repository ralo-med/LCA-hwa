interface PrintHeaderProps {
  issueNumber: string;
  issuedAt: string;
}

const PrintHeader = ({ issueNumber, issuedAt }: PrintHeaderProps) => (
  <div className="mb-8 hidden border-b-2 border-foreground pb-6 text-center print:block">
    <h1 className="mb-2 text-3xl font-bold tracking-tight">폐암 정밀의료 맞춤 소견서</h1>
    <p className="text-lg font-semibold text-muted-foreground">화순전남대학교병원 폐암 센터</p>
    <div className="mt-4 flex justify-between text-xs text-muted-foreground">
      <span>발급번호: {issueNumber}</span>
      <span>작성 일시: {issuedAt}</span>
    </div>
  </div>
);

export default PrintHeader;
