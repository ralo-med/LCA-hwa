import { Activity, AlertTriangle, Clock, Database, Globe2, Info, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SurvivalEstimate } from '@/lib/survival-cbioportal';

interface SurvivalSummaryProps {
  data: SurvivalEstimate | null;
  isLoading: boolean;
  error: string | null;
}

const Skeleton = () => (
  <div className="h-12 w-32 animate-pulse rounded-md bg-muted" />
);

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toFixed(1);

const SurvivalSummary = ({ data, isLoading, error }: SurvivalSummaryProps) => {
  const showSkeleton = isLoading && !data;
  const median = data?.median;
  const year5 = data?.year5 ?? null;
  const noData = !!data && data.cohortN === 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" />
              5년 K-M 생존 추정치
            </div>

            {showSkeleton ? (
              <Skeleton />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  {fmtPct(year5)}
                  <span className="ml-1 text-2xl font-medium text-muted-foreground">
                    {year5 !== null ? '%' : ''}
                  </span>
                </div>
                {data?.ci95Year5 && (
                  <p className="text-xs text-muted-foreground">
                    95% CI {data.ci95Year5[0].toFixed(1)}% ~ {data.ci95Year5[1].toFixed(1)}%
                  </p>
                )}
                {year5 === null && data && !noData && (
                  <p className="text-[11px] text-muted-foreground">
                    추적 기간이 60개월 미만이라 외삽하지 않습니다
                  </p>
                )}
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.min(100, year5 ?? 0)}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-chart-4/30 bg-gradient-to-br from-chart-4/10 via-chart-4/5 to-transparent">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-chart-4" />
              중앙 생존 기간 (median OS)
            </div>

            {showSkeleton ? (
              <Skeleton />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  {median !== null && median !== undefined ? median.toFixed(1) : '—'}
                  <span className="ml-1 text-2xl font-medium text-muted-foreground">
                    {median !== null && median !== undefined ? '년' : ''}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {median === null
                    ? '추적 기간 내 50% 미도달 또는 데이터 없음'
                    : '코호트 절반 사망 시점'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {data && noData && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <div className="font-semibold text-amber-700 dark:text-amber-300">
              {data.unavailableReason ?? '추정 불가'}
            </div>
            <div className="mt-0.5 text-muted-foreground">
              임의 추정치를 표시하지 않습니다. 환자 단위 공개 데이터에서 매칭되는 코호트가 없습니다.
            </div>
          </div>
        </div>
      )}

      {data && !noData && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
                <Database className="h-3 w-3" />
                <span className="font-medium">{data.source}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              cBioPortal Public Datasets · 환자 단위 K-M 추정
            </TooltipContent>
          </Tooltip>

          <Badge variant={data.insufficient ? 'destructive' : 'secondary'}>
            n = {data.cohortN}
            {data.totalN > 0 && ` / ${data.totalN}`}
          </Badge>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help">
                {data.ageBand[0]}대 코호트
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {data.ageBand[0]}–{data.ageBand[1]}세(연령대)·성별·변이 조건을 모두 만족하는 환자만 집계합니다.
            </TooltipContent>
          </Tooltip>

          {data.hasAsianCohort && (
            <Badge variant="outline" className="border-chart-2/40 bg-chart-2/10 text-chart-2">
              <Globe2 className="mr-1 h-3 w-3" /> 아시아 코호트 포함
            </Badge>
          )}

          {data.contributingStudies.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
                  <Library className="h-3 w-3" />
                  <span className="font-medium">기여 연구 {data.contributingStudies.length}건</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-1.5 text-[11px]">
                  {data.contributingStudies.map((c) => (
                    <div key={c.studyId} className="flex justify-between gap-3">
                      <div>
                        <div className="font-semibold">{c.label}</div>
                        <div className="text-muted-foreground">{c.citation} · {c.population}</div>
                      </div>
                      <div className="whitespace-nowrap font-mono">
                        n={c.n}<span className="text-muted-foreground">/{c.totalN}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {data.insufficient && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              표본 부족 — 해석 주의
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};

export default SurvivalSummary;
