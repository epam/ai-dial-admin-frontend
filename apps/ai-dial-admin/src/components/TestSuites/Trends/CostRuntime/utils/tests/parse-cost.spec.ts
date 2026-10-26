import { describe, expect, test } from 'vitest';

import { parseTrendsCostPoints } from '@/src/components/TestSuites/Trends/CostRuntime/utils/parse-cost';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

const runOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: null, durationMs: null, isFailed: false },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, overallScore: null, durationMs: null, isFailed: false },
];

describe('parseTrendsCostPoints', () => {
  test('maps /costs averages onto runOrder', () => {
    const points = parseTrendsCostPoints(runOrder, {
      'run-1': { runId: 'run-1', totalCost: 0.5, testCaseCost: 0.5, metricEvalCost: 0.25 },
      'run-2': null,
    });

    expect(points).toEqual([
      { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, source: 0.5, metrics: 0.25 },
      { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, source: null, metrics: null },
    ]);
  });
});
