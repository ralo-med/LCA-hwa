import { ALargeSmall } from 'lucide-react';
import { useFontScale } from '@/hooks/useFontScale';
import { cn } from '@/lib/cn';

export function FontScaleControl() {
  const font = useFontScale();

  return (
    <div
      className="w-full max-w-full shrink-0 sm:w-auto"
      style={{ fontSize: '16px' }}
      role="group"
      aria-label="글자 크기 조절"
    >
      <div className="flex w-full flex-nowrap items-center gap-1.5 rounded-lg border bg-muted/40 p-1.5 sm:gap-1 sm:p-1">
        <span className="inline-flex shrink-0 items-center gap-1 pl-0.5 text-sm font-medium text-muted-foreground max-lg:hidden xl:inline-flex sm:ml-1 sm:pr-1">
          <ALargeSmall className="h-4 w-4" />
          글자
        </span>
        <div className="grid w-full min-w-0 flex-1 grid-cols-3 gap-1 sm:w-[256px] sm:max-w-full sm:flex-none">
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
                  'inline-flex min-h-[44px] w-full min-w-0 items-center justify-center whitespace-nowrap rounded-md px-1 text-sm font-semibold leading-none transition-colors',
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
