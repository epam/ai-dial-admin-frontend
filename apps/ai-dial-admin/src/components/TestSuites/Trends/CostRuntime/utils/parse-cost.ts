import { ComboTrendPoint, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { RunTotalCosts } from '@/src/models/evaluation/run';

const toFiniteOrNull = (raw: number | null | undefined): number | null =>
  raw != null && Number.isFinite(raw) ? raw : null;

export const parseTrendsCostPoints = (
  runOrder: TrendsRunPoint[],
  costsByRunId: Record<string, RunTotalCosts | null>,
): ComboTrendPoint[] =>
  runOrder.map((point) => {
    const costs = costsByRunId[point.runId];
    return {
      runId: point.runId,
      runName: point.runName,
      computedAtMs: point.computedAtMs,
      source: toFiniteOrNull(costs?.testCaseCost),
      metrics: toFiniteOrNull(costs?.metricEvalCost),
    };
  });
