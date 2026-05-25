import { Check, Copy, Download, Utensils } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { copyToClipboard, saveTextFile } from '@/lib/utils';

interface LifestyleCardProps {
  text: string;
  isLoading: boolean;
}

const LifestyleCard = ({ text, isLoading }: LifestyleCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    toast.success('생활 가이드가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-chart-2 bg-chart-2/5">
      <CardHeader className="no-print flex flex-row items-center justify-between space-y-0 border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Utensils className="h-5 w-5 text-chart-2" />
          맞춤형 항암 생활 가이드
        </CardTitle>
        <div className="flex gap-1">
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
                onClick={() => saveTextFile(text, '화순전남대병원_맞춤형_항암_생활_가이드.txt')}
                aria-label="저장"
              >
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>파일로 저장</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-4 hidden border-b pb-2 font-bold text-foreground print:block">
          맞춤형 항암 생활 가이드
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/6 animate-pulse rounded bg-muted" />
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

export default LifestyleCard;
