import { CircleHelp, Globe2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { SurvivalEstimate } from "@/lib/survival-cbioportal";
import { getCertaintyLabel } from "@/lib/korean-reference";
import {
  buildKmStepCiBand,
  buildKmStepPath,
  buildSmoothSvgPath,
} from "@/lib/survival-curve-path";
import { getUntreatedEstimateFootnoteParagraphs } from "@/lib/untreated-estimate";

const metaChipClass =
  "rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted data-[state=open]:bg-muted focus-visible:outline-none focus-visible:ring-0";

const untreatedHelpTooltipClass = cn(
  "border bg-popover text-popover-foreground shadow-md",
  "max-w-sm space-y-2 text-[11px] leading-relaxed",
);

const UntreatedHelpButton = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className={cn(
          "flex shrink-0 items-center justify-center p-1",
          metaChipClass,
        )}
        aria-label="미치료 추정 계산 방식"
      >
        <CircleHelp className="h-3 w-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className={untreatedHelpTooltipClass}>
      {getUntreatedEstimateFootnoteParagraphs().map((p) => (
        <p key={p}>{p}</p>
      ))}
    </TooltipContent>
  </Tooltip>
);

interface SurvivalChartProps {
  data: SurvivalEstimate | null;
  isLoading: boolean;
}

const VIEW_W = 500;
const VIEW_H = 100;
const MAX_MONTHS = 60;

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v.toFixed(0)}%`;

/** K-M SVG와 동일: 생존율 100% → top 0%, 0% → top 100% */
const Y_AXIS_TICKS = [100, 75, 50, 25, 0] as const;

const SurvivalChart = ({ data, isLoading }: SurvivalChartProps) => {
  const stroke = "hsl(var(--primary))";
  const curve = data?.curve ?? [];
  const hasData = curve.length > 0;
  const korean = data?.koreanReference;
  const untreated = data?.untreatedEstimate;

  const treatedPath = hasData
    ? buildKmStepPath(curve, VIEW_W, VIEW_H, MAX_MONTHS)
    : "";

  const ciBand = hasData
    ? buildKmStepCiBand(curve, VIEW_W, VIEW_H, MAX_MONTHS)
    : "";

  const untreatedPath = untreated
    ? buildSmoothSvgPath(untreated.points, VIEW_W, VIEW_H, MAX_MONTHS)
    : "";

  const showTreated = treatedPath.length > 0;

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Kaplan-Meier 생존 곡선
          </CardTitle>
          <div className="flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded-full bg-primary" />
              치료 코호트 K-M
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-3 rounded-sm bg-primary/20" />
              95% CI
            </div>
            {untreatedPath && (
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 border-t-2 border-dashed border-muted-foreground" />
                미치료 추정
                <UntreatedHelpButton />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          실선 = 치료 코호트 K-M, 점선 = 미치료 모델 추정(물음표 참고).
        </p>

        <div className="flex w-full gap-2 py-6 pr-2">
          <div
            className="relative h-56 w-9 shrink-0 text-right text-[10px] font-medium tabular-nums text-muted-foreground"
            aria-hidden
          >
            {Y_AXIS_TICKS.map((pct) => (
              <span
                key={pct}
                className="absolute right-0 -translate-y-1/2 leading-none"
                style={{ top: `${100 - pct}%` }}
              >
                {pct}%
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-56 w-full">
              <svg
                className="h-full w-full overflow-visible"
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
              >
            {[0, 25, 50, 75, 100].map((v) => (
              <line
                key={v}
                x1="0"
                y1={v}
                x2={VIEW_W}
                y2={v}
                stroke="hsl(var(--border))"
                strokeWidth="0.6"
                strokeDasharray="2,3"
              />
            ))}

            {ciBand && (
              <path
                d={ciBand}
                fill={stroke}
                opacity={isLoading ? 0.05 : 0.12}
              />
            )}

            {untreatedPath && (
              <path
                d={untreatedPath}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                strokeDasharray="6,4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={isLoading ? 0.25 : 0.75}
              />
            )}

            {showTreated && (
              <path
                d={treatedPath}
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinejoin="miter"
                vectorEffect="non-scaling-stroke"
                opacity={isLoading ? 0.3 : 1}
              />
            )}

            {!showTreated && !isLoading && (
              <text
                x={VIEW_W / 2}
                y={VIEW_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="6"
              >
                조건 일치 환자 부족
              </text>
            )}
              </svg>
            </div>

            <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>0</span>
              <span>1년</span>
              <span>2년</span>
              <span>3년</span>
              <span>4년</span>
              <span>5년</span>
            </div>
          </div>
        </div>

        {showTreated && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              5년 생존율 (K-M)
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium">
                  치료 코호트
                </span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-primary transition-all duration-700"
                    style={{ width: `${Math.min(100, data?.year5 ?? 0)}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-sm font-bold">
                  {fmtPct(data?.year5 ?? null)}
                </span>
              </div>
              {untreated && (
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                    미치료 추정
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm bg-muted-foreground/50 transition-all duration-700"
                      style={{ width: `${Math.min(100, untreated.year5)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-sm text-muted-foreground">
                    {untreated.year5.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {korean && (
          <div className="flex items-start gap-2 rounded-md border border-chart-3/30 bg-chart-3/5 px-3 py-2 text-xs">
            <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-3" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-chart-3">
                  한국 5년 상대생존율 참고
                </span>
                <span className="font-mono font-bold text-foreground">
                  {korean.year5.toFixed(1)}%
                </span>
                <span
                  className={
                    korean.certainty === "estimated"
                      ? "rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                      : "rounded bg-chart-3/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-3"
                  }
                >
                  {getCertaintyLabel(korean.certainty)}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {korean.source}
              </p>
              {korean.note && (
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  {korean.note} · K-M 코호트와 직접 비교되지 않습니다
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SurvivalChart;
