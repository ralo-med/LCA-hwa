import { ALargeSmall } from 'lucide-react';
import { useFontScale } from '@/hooks/useFontScale';
import { cn } from '@/lib/cn';

export function FontScaleControl() {
  const font = useFontScale();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1"
      role="group"
      aria-label="글자 크기 조절"
    >
      <span className="ml-1 hidden items-center gap-1 pr-1 text-sm font-medium text-muted-foreground sm:inline-flex">
        <ALargeSmall className="h-4 w-4" />
        글자
      </span>
      {font.options.map((opt) => {
        const active = font.scaleId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => font.setScale(opt.id)}
            aria-pressed={active}
            aria-label={`글자 크기 ${opt.label}`}
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
