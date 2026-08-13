import { describe, expect, test } from 'vitest';

import { parseTrendsData } from '@/src/components/TestSuites/Trends/utils/parse-trends';
import { Run, RunStatus } from '@/src/models/evaluation/run';

describe('parseTrendsData', () => {
  const runs: Run[] = [
    {
      id: 'run-1',
      testRunName: 'Run#1',
      startedAt: 1000,
      completedAt: 1400,
    },
    {
      id: 'run-2',
      testRunName: 'Run#2',
      startedAt: 2000,
      completedAt: 2600,
    },
  ];

  test('builds KPIs, chronological run order, and metric groups by statistic', () => {
    const parsed = parseTrendsData(
      {
        rows: [
          {
            test_suite_run_id: 'run-2',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.8,
            computed_at_ms: 2000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.4,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'AVG',
            value: 0.5,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-2',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'AVG',
            value: 0.7,
            computed_at_ms: 2000,
          },
          {
            test_suite_run_id: 'run-2',
            metric_name: 'ragas.context_precision',
            metric_score_name: 'AVG',
            value: 0.6,
            computed_at_ms: 2000,
          },
        ],
      },
      runs,
    );

    expect(parsed.runOrder.map((point) => point.runId)).toEqual(['run-1', 'run-2']);
    expect(parsed.runOrder.map((point) => point.isFailed)).toEqual([false, false]);
    expect(parsed.kpis).toEqual({
      runCount: 2,
      latestOverallScore: 0.8,
      avgRunTimeMs: 500,
      scoreMin: 0.4,
      scoreMax: 0.8,
      latestScore: 0.8,
    });
    expect(parsed.statistics).toEqual(['AVG']);
    expect(parsed.byStatistic.AVG).toHaveLength(1);
    expect(parsed.byStatistic.AVG[0].name).toBe('ragas');
    expect(parsed.byStatistic.AVG[0].series.map((series) => series.name)).toEqual([
      'faithfulness',
      'context_precision',
    ]);
    expect(parsed.byStatistic.AVG[0].series[0].values).toEqual([0.5, 0.7]);
    expect(parsed.byStatistic.AVG[0].series[1].values).toEqual([null, 0.6]);
  });

  test('marks failed runs from run status and treats missing status as passed', () => {
    const parsed = parseTrendsData(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.4,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-2',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.8,
            computed_at_ms: 2000,
          },
        ],
      },
      [
        { id: 'run-1', testRunName: 'Run#1', status: RunStatus.FAILED },
        { id: 'run-2', testRunName: 'Run#2', status: RunStatus.COMPLETED },
      ],
    );

    expect(parsed.runOrder.map((point) => ({ id: point.runId, isFailed: point.isFailed }))).toEqual([
      { id: 'run-1', isFailed: true },
      { id: 'run-2', isFailed: false },
    ]);
  });

  test('returns empty structures for null/empty results', () => {
    expect(parseTrendsData(null, []).kpis.runCount).toBe(0);
    expect(parseTrendsData({ rows: [] }, []).statistics).toEqual([]);
  });

  test('seeds run order from runs when score rows are empty', () => {
    const parsed = parseTrendsData({ rows: [] }, [
      {
        id: 'run-1',
        testRunName: 'Run#1',
        status: RunStatus.COMPLETED,
        startedAt: 1000,
        completedAt: 1400,
      },
    ]);

    expect(parsed.kpis.runCount).toBe(1);
    expect(parsed.kpis.latestOverallScore).toBeNull();
    expect(parsed.kpis.avgRunTimeMs).toBe(400);
    expect(parsed.runOrder).toEqual([
      {
        runId: 'run-1',
        runName: 'Run#1',
        computedAtMs: 1400,
        overallScore: null,
        durationMs: 400,
        isFailed: false,
      },
    ]);
    expect(parsed.statistics).toEqual([]);
  });

  test('keeps metric group order stable across statistics', () => {
    const parsed = parseTrendsData(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.5,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'pack.generation.score',
            metric_score_name: 'MIN',
            value: 0.4,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'pack.retrieval.score',
            metric_score_name: 'MIN',
            value: 0.3,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'pack.retrieval.score',
            metric_score_name: 'AVG',
            value: 0.6,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'pack.generation.score',
            metric_score_name: 'AVG',
            value: 0.7,
            computed_at_ms: 1000,
          },
        ],
      },
      runs,
    );

    expect(parsed.byStatistic.MIN.map((group) => group.name)).toEqual(['pack.generation', 'pack.retrieval']);
    expect(parsed.byStatistic.AVG.map((group) => group.name)).toEqual(['pack.generation', 'pack.retrieval']);
  });

  test('orders statistics by Metric Scores segmented-control order', () => {
    const parsed = parseTrendsData(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'MAX',
            value: 0.9,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'MIN',
            value: 0.1,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'P90',
            value: 0.8,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'P10',
            value: 0.2,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'AVG',
            value: 0.5,
            computed_at_ms: 1000,
          },
        ],
      },
      runs,
    );

    expect(parsed.statistics).toEqual(['AVG', 'P90', 'P10', 'MAX', 'MIN']);
  });
});
