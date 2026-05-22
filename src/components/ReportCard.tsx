import { useState } from 'react';
import { Check, Copy, Download, FileText, Loader2, Printer, Volume2 } from 'lucide-react';
import { copyToClipboard, saveTextFile, triggerPrint } from '../lib/utils';

interface ReportCardProps {
  text: string;
  isLoading: boolean;
  isPlayingAudio: boolean;
  onPlayAudio: () => void;
}

const ReportCard = ({ text, isLoading, isPlayingAudio, onPlayAudio }: ReportCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-l-8 border-l-blue-600 rounded-3xl shadow-md overflow-hidden card border border-slate-100">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 no-print border-b pb-4">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <FileText size={22} className="text-blue-600" /> 화순전남대학교병원 전문의 소견서
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onPlayAudio}
              disabled={isPlayingAudio}
              className="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl text-slate-600 hover:text-blue-600 transition-all border border-slate-200"
              title="음성 소견 듣기"
            >
              {isPlayingAudio ? <Loader2 className="animate-spin text-blue-600" size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={handleCopy}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50 rounded-xl text-slate-600 hover:text-indigo-600 transition-all border border-slate-200"
              title="텍스트 복사"
            >
              {copied ? <Check className="text-green-600" size={18} /> : <Copy size={18} />}
            </button>

            <button
              onClick={() => saveTextFile(text, '화순전남대병원_폐암_정밀의학_소견서.txt')}
              className="p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-600 hover:text-emerald-600 transition-all border border-slate-200"
              title="메모장 파일로 저장"
            >
              <Download size={18} />
            </button>

            <button
              onClick={triggerPrint}
              className="p-2.5 bg-slate-50 hover:bg-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
              title="인쇄 전용 모드"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="hidden print:block mb-4 pb-2 border-b font-bold text-slate-700">
          전문의 소견 요약 및 설명
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-slate-100 w-full rounded"></div>
            <div className="h-5 bg-slate-100 w-5/6 rounded"></div>
          </div>
        ) : (
          <div className="text-slate-800 text-lg md:text-xl font-medium leading-loose tracking-wide whitespace-pre-wrap font-sans">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
