import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CircleHelp,
  Clock,
  Database,
  Globe2,
  Info,
  Library,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import {
  getMedianOsNotReachedNote,
  getMedianOsSubtitle,
  getMedianOsTooltipParagraphs,
  getYear5KmTooltipParagraphs,
  type SurvivalEstimate,
} from "@/lib/survival-cbioportal";

/** 하단 메타 칩·? 버튼 — 호버·열림 시 primary(초록) 대신 muted */
const metaChipClass =
  "rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted data-[state=open]:bg-muted focus-visible:outline-none focus-visible:ring-0";

const metaTooltipClass =
  "border bg-popover text-popover-foreground shadow-md";

const cardHelpTooltipClass = cn(
  metaTooltipClass,
  "max-w-sm space-y-2 text-[11px] leading-relaxed",
);

interface SurvivalSummaryProps {
  data: SurvivalEstimate | null;
  isLoading: boolean;
  studiesMetaPending?: boolean;
  error: string | null;
}

const Skeleton = () => (
  <div className="h-12 w-32 animate-pulse rounded-md bg-muted" />
);

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : v.toFixed(1);

const linkClass =
  "text-primary underline-offset-2 hover:underline";

const SurvivalSummary = ({
  data,
  isLoading,
  studiesMetaPending = false,
  error,
}: SurvivalSummaryProps) => {
  const [studiesOpen, setStudiesOpen] = useState(false);
  const showSkeleton = isLoading && !data;
  const median = data?.median ?? null;
  const year5 = data?.year5 ?? null;
  const noData = !!data && data.cohortN === 0;
  const hasMedian = data?.medianOsStatus === "estimated" && median != null;
  const medianFollowup =
    data?.medianOsStatus === "not_reached" &&
    data.survivalAtMaxFollowupPct != null &&
    data.maxFollowupMonths > 0
      ? {
          maxFollowupMonths: data.maxFollowupMonths,
          survivalAtMaxFollowupPct: data.survivalAtMaxFollowupPct,
          studyCount: data.contributingStudies.length,
          cohortN: data.cohortN,
        }
      : null;
  const medianSubtitle = data ? getMedianOsSubtitle(data.medianOsStatus) : null;
  const medianTooltip = getMedianOsTooltipParagraphs();
  const year5Tooltip = getYear5KmTooltipParagraphs();
  const medianNotReachedNote =
    data?.medianOsStatus === "not_reached"
      ? getMedianOsNotReachedNote(medianFollowup)
      : [];

  return (
    <div className="space-y-3 overflow-visible">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <Activity className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>5년 K-M 생존 추정치</span>
              </div>
              {!showSkeleton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex shrink-0 items-center justify-center p-1",
                        metaChipClass,
                      )}
                      aria-label="5년 생존 추정치 쉬운 설명"
                    >
                      <CircleHelp className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className={cardHelpTooltipClass}
                  >
                    {year5Tooltip.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {showSkeleton ? (
              <Skeleton />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  {fmtPct(year5)}
                  <span className="ml-1 text-2xl font-medium text-muted-foreground">
                    {year5 !== null ? "%" : ""}
                  </span>
                </div>
                {data?.ci95Year5 && (
                  <p className="text-xs text-muted-foreground">
                    95% CI {data.ci95Year5[0].toFixed(1)}% ~{" "}
                    {data.ci95Year5[1].toFixed(1)}%
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

        <Card className="overflow-hidden border-chart-4/30 bg-linear-to-br from-chart-4/10 via-chart-4/5 to-transparent">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                <span>중앙 생존기간 (median OS)</span>
              </div>
              {!showSkeleton && data && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex shrink-0 items-center justify-center p-1",
                        metaChipClass,
                      )}
                      aria-label="중앙 생존기간 쉬운 설명"
                    >
                      <CircleHelp className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className={cardHelpTooltipClass}
                  >
                    {medianTooltip.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {showSkeleton ? (
              <Skeleton />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  {hasMedian ? median.toFixed(1) : "—"}
                  <span className="ml-1 text-2xl font-medium text-muted-foreground">
                    {hasMedian ? "년" : ""}
                  </span>
                </div>
                {medianSubtitle && (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {medianSubtitle}
                  </p>
                )}
                {medianNotReachedNote.length > 0 && (
                  <div className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {medianNotReachedNote.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                )}
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
              {data.unavailableReason ?? "추정 불가"}
            </div>
            <div className="mt-0.5 text-muted-foreground">
              조건에 맞는 환자가 5명 미만입니다.
            </div>
          </div>
        </div>
      )}

      {data && !noData && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex cursor-help items-center gap-1.5 px-2 py-1",
                  metaChipClass,
                )}
              >
                <Database className="h-3 w-3" />
                <span className="font-medium text-foreground">{data.source}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={metaTooltipClass}>
              cBioPortal Public Datasets · 환자 단위 K-M 추정
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={data.insufficient ? "destructive" : "secondary"}
                className="cursor-help font-mono text-[10px]"
              >
                분석 {data.cohortN}명 · 연구 {data.studiesContributing}개
              </Badge>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className={cn(metaTooltipClass, "max-w-xs")}
            >
              <p>
                조건에 맞아 실제로 쓰인 연구 {data.studiesContributing}개, 환자{" "}
                {data.cohortN}명.
              </p>
              <p className="mt-1 text-muted-foreground">
                같은 {data.studiesContributing}개 연구 안에서 생존 데이터가 있는
                환자는 {data.poolOsN}명입니다(연령·성별·변이 필터 전).
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help">
                {data.ageBand[0]}대 코호트
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={metaTooltipClass}>
              {data.ageBand[0]}–{data.ageBand[1]}세(연령대)·성별·변이 조건을
              모두 만족하는 환자만 집계합니다.
            </TooltipContent>
          </Tooltip>

          {data.hasAsianCohort && (
            <Badge
              variant="outline"
              className="border-chart-2/40 bg-chart-2/10 text-chart-2"
            >
              <Globe2 className="mr-1 h-3 w-3" /> 아시아 코호트 포함
            </Badge>
          )}

          {data.contributingStudies.length > 0 && (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setStudiesOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 text-xs font-medium",
                  metaChipClass,
                  studiesOpen && "bg-muted",
                )}
                aria-expanded={studiesOpen}
              >
                <Library className="h-3 w-3" />
                사용 연구 {data.studiesContributing}개
              </button>
              {studiesOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="목록 닫기"
                    onClick={() => setStudiesOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-80 max-w-[calc(100vw-2rem)] rounded-md border bg-background p-2.5 text-xs text-foreground shadow-lg">
                    <ul className="space-y-2.5">
                      {data.contributingStudies.map((c) => (
                        <li
                          key={c.studyId}
                          className="border-b border-border/50 pb-2 last:border-0 last:pb-0"
                        >
                          <p className="font-medium leading-snug">{c.title}</p>
                          <p className="mt-0.5 text-muted-foreground">
                            {c.citation} · 분석 {c.n}명
                          </p>
                          <p className="mt-1 flex gap-3">
                            <a
                              href={c.cBioPortalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClass}
                            >
                              cBioPortal
                            </a>
                            {c.paperUrl ? (
                              <a
                                href={c.paperUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClass}
                              >
                                논문
                              </a>
                            ) : studiesMetaPending ? (
                              <span className="text-muted-foreground">
                                논문 정보 확인 중…
                              </span>
                            ) : null}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
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
