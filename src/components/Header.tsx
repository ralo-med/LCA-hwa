import { HeartPulse, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  onGenerateInsights: () => void;
  onGenerateGuide: () => void;
  isGeneratingInsights: boolean;
  isGeneratingGuide: boolean;
}

const Header = ({
  onGenerateInsights,
  onGenerateGuide,
  isGeneratingInsights,
  isGeneratingGuide,
}: HeaderProps) => (
  <header className="no-print mb-8 flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        <img
          src="/logo.png"
          alt="화순전남대학교병원"
          width={80}
          height={80}
          className="h-16 w-16 shrink-0 object-contain md:h-20 md:w-20"
        />
        폐암 정밀의료 대시보드
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">화순전남대학교병원</span>
        <span className="text-muted-foreground/50">|</span>
        <span className="font-medium text-primary">정밀의료 &amp; 환자 맞춤 케어 시스템</span>
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onGenerateInsights} disabled={isGeneratingInsights}>
        {isGeneratingInsights ? <Loader2 className="animate-spin" /> : <Sparkles />}
        정밀 의학 소견 생성
      </Button>
      <Button onClick={onGenerateGuide} disabled={isGeneratingGuide} variant="secondary">
        {isGeneratingGuide ? <Loader2 className="animate-spin" /> : <HeartPulse />}
        생활 가이드 생성
      </Button>
      <ThemeToggle />
    </div>
  </header>
);

export default Header;
