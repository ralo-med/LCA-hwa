import { useState } from 'react';
import { Check, Copy, Download, Utensils } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../lib/utils';

interface LifestyleCardProps {
  text: string;
  isLoading: boolean;
}

const LifestyleCard = ({ text, isLoading }: LifestyleCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#f0fdf4] border-l-8 border-l-emerald-500 rounded-3xl shadow-md overflow-hidden card border border-emerald-100">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-4 border-b border-emerald-200 pb-4 no-print">
          <h3 className="font-black text-emerald-900 text-lg flex items-center gap-2">
            <Utensils size={22} className="text-emerald-600" /> ✨ 맞춤형 항암 생활 가이드
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2.5 bg-white hover:bg-indigo-50 rounded-xl text-emerald-700 transition-all border border-emerald-200"
              title="텍스트 복사"
            >
              {copied ? <Check className="text-green-600" size={18} /> : <Copy size={18} />}
            </button>

            <button
              onClick={() => saveTextFile(text, '화순전남대병원_맞춤형_항암_생활_가이드.txt')}
              className="p-2.5 bg-white hover:bg-emerald-50 rounded-xl text-emerald-700 transition-all border border-emerald-200"
              title="메모장 파일로 저장"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="hidden print:block mb-4 pb-2 border-b font-bold text-emerald-900">
          맞춤형 항암 생활 가이드
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-emerald-100 w-full rounded"></div>
            <div className="h-5 bg-emerald-100 w-4/6 rounded"></div>
          </div>
        ) : (
          <div className="text-emerald-950 text-lg md:text-xl font-medium leading-loose tracking-wide whitespace-pre-wrap font-sans">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default LifestyleCard;
