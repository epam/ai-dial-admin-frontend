import {
  RUN_ID_FIELD,
  TOTAL_DURATION_ALIAS,
  TOTAL_METRIC_EVAL_DURATION_ALIAS,
} from '@/src/components/Runs/Summary/constants';
import { parseDurationMs } from '@/src/components/Runs/Summary/utils';
import { ComboTrendPoint, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

/**
 * Maps `eval_summaries` sum rows onto `runOrder` as source/metrics durations (ms), rounded the same
 * way as the Run Summary total. Runs with no row stay null/null.
 */
export const parseTrendsRuntimeResult = (
  result: StructuredQueryResult | null,
  runOrder: TrendsRunPoint[],
): ComboTrendPoint[] => {
  const byRunId = new Map<string, { source: number | null; metrics: number | null }>();

  for (const row of result?.rows ?? []) {
    const runId = row[RUN_ID_FIELD];
    if (typeof runId !== 'string') {
      continue;
    }
    const summed = { rows: [row] };
    byRunId.set(runId, {
      source: parseDurationMs(summed, TOTAL_DURATION_ALIAS),
      metrics: parseDurationMs(summed, TOTAL_METRIC_EVAL_DURATION_ALIAS),
    });
  }

  return runOrder.map((point) => {
    const values = byRunId.get(point.runId);
    return {
      runId: point.runId,
      runName: point.runName,
      computedAtMs: point.computedAtMs,
      source: values?.source ?? null,
      metrics: values?.metrics ?? null,
    };
  });
};
