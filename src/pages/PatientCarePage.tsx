import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PATIENT_TOOLS,
  PATIENT_TOOLS_INTRO,
  PATIENT_TOOLS_PRICING_NOTE,
  type PatientTool,
} from '@/constants/patient-tools';
import { cn } from '@/lib/cn';

const PRICING_NOTE_HIGHLIGHTS = ['무료', '개발자가 자체 부담하고 있습니다'] as const;

function PricingNoteBody({ text }: { text: string }) {
  const pattern = new RegExp(`(${PRICING_NOTE_HIGHLIGHTS.join('|')})`, 'g');
  const parts = text.split(pattern);

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {parts.map((part, index) =>
        (PRICING_NOTE_HIGHLIGHTS as readonly string[]).includes(part) ? (
          <span
            key={`${part}-${index}`}
            className={cn('font-semibold text-amber-600 dark:text-amber-400')}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function ToolCard({ tool }: { tool: PatientTool }) {
  const Icon = tool.icon;
  const isAvailable = tool.status === 'available';

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {!isAvailable && (
          <Badge variant="secondary">추가 예정입니다</Badge>
        )}
        {isAvailable && <Badge variant="default">이용 가능</Badge>}
      </div>
      <div className="mt-4 min-w-0">
        <h2 className="font-display text-lg font-semibold leading-snug">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>
      {isAvailable && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          바로가기
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  const cardClass = cn(
    'group h-full transition-all',
    isAvailable
      ? 'hover:border-primary/40 hover:shadow-sm'
      : 'opacity-90',
  );

  if (isAvailable && tool.to) {
    return (
      <Link to={tool.to} className="block h-full">
        <Card className={cardClass}>
          <CardContent className="flex h-full flex-col p-5">{inner}</CardContent>
        </Card>
      </Link>
    );
  }

  if (isAvailable && tool.href) {
    return (
      <a
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <Card className={cardClass}>
          <CardContent className="flex h-full flex-col p-5">{inner}</CardContent>
        </Card>
      </a>
    );
  }

  return (
    <Card className={cn(cardClass, 'border-dashed')}>
      <CardContent className="flex h-full flex-col p-5">{inner}</CardContent>
    </Card>
  );
}

const PatientCarePage = () => {
  const IntroIcon = PATIENT_TOOLS_INTRO.icon;

  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain"
      >
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-chart-4/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl p-4 pb-10 md:p-8 md:pb-12">
        <div className="animate-rise-delay-1 mb-8 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {PATIENT_TOOLS_INTRO.eyebrow}
            </span>
          </div>
          <h1 className="font-display mt-4 flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
            <IntroIcon className="h-7 w-7 text-primary" />
            {PATIENT_TOOLS_INTRO.title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            {PATIENT_TOOLS_INTRO.subtitle}
          </p>
        </div>

        <div className="animate-rise-delay-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATIENT_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <section className="animate-rise-delay-3 mt-10 max-w-2xl space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4 md:p-5">
          <h2 className="font-display text-base font-semibold">
            {PATIENT_TOOLS_PRICING_NOTE.title}
          </h2>
          <PricingNoteBody text={PATIENT_TOOLS_PRICING_NOTE.body} />
        </section>

        <p className="animate-rise-delay-3 mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          본 페이지의 안내는 의료 결정을 대체하지 않습니다. 몸 상태가
          걱정되거나 응급 증상이 있으면 즉시 의료기관을 방문하세요.
        </p>
      </div>
    </div>
  );
};

export default PatientCarePage;
