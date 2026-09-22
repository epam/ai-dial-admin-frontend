import {
  BucketPoint,
  KpiFigure,
  KpiMetric,
  UsageMeasures,
  UsageView,
  WindowedValue,
} from '@/src/components/Analytics/Usage/models';

const TOKENS_PER_MILLION = 1_000_000;

export const VIEW_KPI_METRICS: Record<UsageView, KpiMetric[]> = {
  [UsageView.Llm]: [
    KpiMetric.TotalSpend,
    KpiMetric.Requests,
    KpiMetric.Tokens,
    KpiMetric.CostPerMillionTokens,
    KpiMetric.UniqueCallers,
    KpiMetric.ErrorRate,
    KpiMetric.AvgLatency,
  ],
  [UsageView.Mcp]: [
    KpiMetric.Requests,
    KpiMetric.ToolCalls,
    KpiMetric.UniqueCallers,
    KpiMetric.ErrorRate,
    KpiMetric.AvgLatency,
  ],
};

const tokensOf = (measures: UsageMeasures | null): number | null => {
  if (!measures) {
    return null;
  }

  const prompt = measures.promptTokens;
  const completion = measures.completionTokens;
  return prompt == null && completion == null ? null : (prompt ?? 0) + (completion ?? 0);
};

const costPerMillionOf = (measures: UsageMeasures | null): number | null => {
  const tokens = tokensOf(measures);

  if (!measures || measures.spend == null || !tokens) {
    return null;
  }

  return (measures.spend / tokens) * TOKENS_PER_MILLION;
};

const errorRateOf = (measures: UsageMeasures | null): number | null =>
  !measures || measures.calls === 0 ? null : measures.failed / measures.calls;

const METRIC_VALUE: Record<KpiMetric, (measures: UsageMeasures | null) => number | null> = {
  [KpiMetric.TotalSpend]: (m) => m?.spend ?? null,
  [KpiMetric.Requests]: (m) => m?.calls ?? null,
  [KpiMetric.Tokens]: tokensOf,
  [KpiMetric.CostPerMillionTokens]: costPerMillionOf,
  [KpiMetric.UniqueCallers]: (m) => m?.callers ?? null,
  [KpiMetric.ErrorRate]: errorRateOf,
  [KpiMetric.AvgLatency]: (m) => m?.avgLatencyMs ?? null,
  [KpiMetric.ToolCalls]: (m) => m?.toolCalls ?? null,
};

/**
 * A point returning null is left out of the line rather than plotted as zero: a bucket with no
 * tokens has no cost per token, and drawing that as zero reads as a price collapse. A count, by
 * contrast, is genuinely zero when nothing happened.
 */
const METRIC_SPARKLINE: Partial<Record<KpiMetric, (point: BucketPoint) => number | null>> = {
  [KpiMetric.TotalSpend]: (point) => point.measures.spend ?? 0,
  [KpiMetric.CostPerMillionTokens]: (point) => costPerMillionOf(point.measures),
  [KpiMetric.Requests]: (point) => point.measures.calls,
  [KpiMetric.Tokens]: (point) => tokensOf(point.measures) ?? 0,
  [KpiMetric.UniqueCallers]: (point) => point.measures.callers,
  [KpiMetric.ErrorRate]: (point) => errorRateOf(point.measures) ?? 0,
  [KpiMetric.AvgLatency]: (point) => point.measures.avgLatencyMs,
  [KpiMetric.ToolCalls]: (point) => point.measures.toolCalls ?? 0,
};

interface FigureInput {
  view: UsageView;
  current: UsageMeasures | null;
  previous: UsageMeasures | null;
  buckets: BucketPoint[];
}

/**
 * A window with no calls reported nothing, so every card shows a dash rather than a zero.
 *
 * The aggregate answers an empty window with one row whose counts are zero and whose sums are null,
 * so a count would print `0` while the figures beside it printed `—` — a row of cards disagreeing
 * about whether the window held anything. A zero is kept only where it is one: a metric that is
 * genuinely zero in a window that did carry traffic.
 */
const measuresOfWindow = (measures: UsageMeasures | null): UsageMeasures | null =>
  measures && measures.calls > 0 ? measures : null;

export const buildKpiFigures = ({ view, current, previous, buckets }: FigureInput): KpiFigure[] =>
  VIEW_KPI_METRICS[view].map((metric) => {
    const toSparkPoint = METRIC_SPARKLINE[metric];
    const value: WindowedValue = {
      current: METRIC_VALUE[metric](measuresOfWindow(current)),
      previous: previous ? METRIC_VALUE[metric](measuresOfWindow(previous)) : null,
    };

    const sparkline = toSparkPoint ? buckets.map(toSparkPoint).filter((point): point is number => point != null) : [];

    return { metric, value, sparkline };
  });

/** A row's share of the window, against the window total rather than the largest row. */
export const getShareOfTotal = (value: number | null, total: number | null): number | null =>
  value == null || !total ? null : value / total;
