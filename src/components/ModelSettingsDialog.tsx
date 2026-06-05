import { useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSettingsPanel } from '@/components/ModelSettingsPanel';
import type { useLlmSettings } from '@/hooks/useLlmSettings';

type LlmSettings = ReturnType<typeof useLlmSettings>;

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LlmSettings;
  disabled?: boolean;
}

export function ModelSettingsDialog({
  open,
  onOpenChange,
  settings,
  disabled,
}: ModelSettingsDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="설정 닫기"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-settings-title"
        className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2
            id="model-settings-title"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Settings className="h-4 w-4" />
            AI 모델 설정
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          <ModelSettingsPanel settings={settings} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
