import { Check, Copy, Download, FileText, Loader2, Printer, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { copyToClipboard, saveTextFile, triggerPrint } from '@/lib/utils';

interface ReportCardProps {
  text: string;
  isLoading: boolean;
  isPlayingAudio: boolean;
  aiReady: boolean;
  onPlayAudio: () => void;
}

const ReportCard = ({
  text,
  isLoading,
  isPlayingAudio,
  aiReady,
  onPlayAudio,
}: ReportCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    toast.success('소견서가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <CardHeader className="no-print flex flex-row items-center justify-between space-y-0 border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-primary" />
          전문의 소견서
        </CardTitle>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPlayAudio}
                disabled={!aiReady || isPlayingAudio}
                aria-label="음성 소견 듣기"
              >
                {isPlayingAudio ? <Loader2 className="animate-spin" /> : <Volume2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>음성으로 듣기</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="복사">
                {copied ? <Check className="text-primary" /> : <Copy />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>텍스트 복사</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveTextFile(text, '화순전남대병원_폐암_정밀의학_소견서.txt')}
                aria-label="저장"
              >
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>파일로 저장</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={triggerPrint} aria-label="인쇄">
                <Printer />
              </Button>
            </TooltipTrigger>
            <TooltipContent>인쇄 / PDF 저장</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-4 hidden border-b pb-2 font-bold text-foreground print:block">
          전문의 소견 요약 및 설명
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground md:text-lg">
            {text}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportCard;
