import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatModelPriceShort,
  PROVIDER_LABELS,
  type LlmProvider,
} from '@/lib/llm-models';
import { cn } from '@/lib/cn';
import type { useLlmSettings } from '@/hooks/useLlmSettings';

type LlmSettings = ReturnType<typeof useLlmSettings>;

interface ModelSettingsPanelProps {
  settings: LlmSettings;
  disabled?: boolean;
}

const API_KEY_PLACEHOLDERS: Record<LlmProvider, string> = {
  openai: 'sk-...',
  google: 'AIza...',
  anthropic: 'sk-ant-...',
};

export function ModelSettingsPanel({
  settings,
  disabled,
}: ModelSettingsPanelProps) {
  const modelsByProvider = (['openai', 'google', 'anthropic'] as LlmProvider[]).map(
    (provider) => ({
      provider,
      models: settings.chatModels.filter((m) => m.provider === provider),
    }),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">챗봇 모델</Label>
        <Select
          value={settings.selectedModelId}
          onValueChange={settings.setSelectedModelId}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="모델 선택" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
              USD per 1M tokens
            </p>
            {modelsByProvider.map(({ provider, models }) => (
              <SelectGroup key={provider}>
                <SelectLabel>{PROVIDER_LABELS[provider]}</SelectLabel>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label} · {formatModelPriceShort(model)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {settings.selectedModel.label} · {formatModelPriceShort(settings.selectedModel)}{' '}
          <span className="text-muted-foreground/80">per 1M tokens</span>
        </p>
        {settings.canUseSelectedModel ? (
          <p className="text-[11px] text-muted-foreground">
            {settings.isFreeTier ? (
              <>
                <span className="font-medium text-primary">무료</span> ·{' '}
                {settings.defaultModel.label} (서버 제공)
              </>
            ) : (
              <>선택한 모델을 사용할 수 있습니다.</>
            )}
          </p>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            이 모델을 쓰려면 아래에 맞는 API 키를 입력해 주세요. (가격만
            둘러볼 수 있습니다)
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-1">
        {settings.providerStatus.map(({ provider, label, configured }) => (
          <div key={provider} className="space-y-1">
            <Label htmlFor={`api-key-${provider}`} className="text-xs">
              {label}
              <span
                className={cn(
                  'ml-1.5 font-normal',
                  configured
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                {configured ? '입력됨' : '미입력'}
              </span>
            </Label>
            <Input
              id={`api-key-${provider}`}
              type="password"
              autoComplete="off"
              placeholder={API_KEY_PLACEHOLDERS[provider]}
              value={settings.apiKeys[provider] ?? ''}
              onChange={(e) => settings.setApiKey(provider, e.target.value)}
              disabled={disabled}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>

      {!settings.openAiAvailable && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          가이드라인 벡터 검색에는 OpenAI 키가 필요합니다.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground">
        가격은 공식 API 기준 USD 추정치입니다. 키는 이 브라우저에만 저장됩니다.
      </p>
    </div>
  );
}
