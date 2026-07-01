import { ALargeSmall } from 'lucide-react';
import { useFontScale } from '@/hooks/useFontScale';
import { cn } from '@/lib/cn';

export function FontScaleControl() {
  const font = useFontScale();

  return (
    <div
      className="shrink-0"
      style={{ fontSize: '16px' }}
      role="group"
      aria-label="글자 크기 조절"
    >
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
        <span className="ml-1 hidden items-center gap-1 pr-1 text-sm font-medium text-muted-foreground sm:inline-flex">
          <ALargeSmall className="h-4 w-4" />
          글자
        </span>
        <div className="grid w-52 grid-cols-3 gap-1">
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
                  'inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-md px-2 text-sm font-semibold transition-colors',
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
      </div>
    </div>
  );
}
