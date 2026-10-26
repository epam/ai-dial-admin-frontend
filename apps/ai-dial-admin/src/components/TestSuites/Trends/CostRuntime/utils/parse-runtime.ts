import {
  AVG_DURATION_ALIAS,
  AVG_METRIC_EVAL_DURATION_ALIAS,
  RUN_ID_FIELD,
} from '@/src/components/Runs/Summary/constants';
import { ComboTrendPoint, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const toFiniteOrNull = (raw: unknown): number | null => {
  if (raw == null) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

/**
 * Maps `eval_summaries` aggregate rows onto `runOrder` as combo source/metrics durations (ms).
 * Runs with no row stay null/null.
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
    byRunId.set(runId, {
      source: toFiniteOrNull(row[AVG_DURATION_ALIAS]),
      metrics: toFiniteOrNull(row[AVG_METRIC_EVAL_DURATION_ALIAS]),
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
