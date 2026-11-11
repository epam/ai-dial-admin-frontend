import { describe, expect, test } from 'vitest';

import { parseTrendsRuntimeResult } from '@/src/components/TestSuites/Trends/CostRuntime/utils/parse-runtime';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

const runOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: null, durationMs: 10, isFailed: false },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, overallScore: null, durationMs: 20, isFailed: false },
];

describe('parseTrendsRuntimeResult', () => {
  test('maps summed duration columns onto runOrder', () => {
    const points = parseTrendsRuntimeResult(
      {
        rows: [
          { test_suite_run_id: 'run-1', total_duration_ms: 100.6, total_metric_eval_duration_ms: 50.2 },
          { test_suite_run_id: 'run-2', total_duration_ms: 200, total_metric_eval_duration_ms: null },
        ],
      },
      runOrder,
    );

    expect(points).toEqual([
      { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, source: 101, metrics: 50 },
      { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, source: 200, metrics: null },
    ]);
  });

  test('leaves missing runs as null segments', () => {
    expect(parseTrendsRuntimeResult({ rows: [] }, runOrder)).toEqual([
      { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, source: null, metrics: null },
      { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, source: null, metrics: null },
    ]);
  });
});
