import { describe, expect, test } from 'vitest';

import {
  ComparisonOp,
  ExprType,
  LogicalOp,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { AVG_DURATION_ALIAS, COUNT_ALIAS, EXECUTION_STATUS_FIELD, OVERALL_SCORE_ALIAS } from '../constants';
import { MetricOption, MetricScoresData } from '../models';
import {
  buildAvgRunTimeQuery,
  buildDistributionQuery,
  buildMetricScoresQuery,
  buildOverallScoreQuery,
  buildTestCasesStatusQuery,
  getMetricFieldPath,
  getMetricOutputFields,
  getMetricStatCards,
  parseAvgRunTimeMs,
  parseHistogramValues,
  parseMetricScores,
  parseOverallScore,
  parseTestCaseStatusCounts,
  splitMetricName,
  toMetricOptions,
} from '../utils';

describe('Runs Summary :: query builders', () => {
  test('buildTestCasesStatusQuery groups by execution_status and counts within the run', () => {
    const query = buildTestCasesStatusQuery('run-1');

    expect(query.entity).toBe('eval_summaries');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([EXECUTION_STATUS_FIELD]);
    expect(query.select).toEqual([
      { expr: { type: ExprType.Field, name: EXECUTION_STATUS_FIELD } },
      { expr: { type: ExprType.Fn, name: 'count', args: [] }, as: COUNT_ALIAS },
    ]);
    expect(query.filter).toEqual({
      op: 'eq',
      args: [
        { type: ExprType.Field, name: 'test_suite_run_id' },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
      ],
    });
  });

  test('buildAvgRunTimeQuery averages exec_duration_ms within the run', () => {
    const query = buildAvgRunTimeQuery('run-1');

    expect(query.select).toEqual([
      {
        expr: { type: ExprType.Fn, name: 'avg', args: [{ type: ExprType.Field, name: 'exec_duration_ms' }] },
        as: AVG_DURATION_ALIAS,
      },
    ]);
    expect(query.group_by).toBeUndefined();
  });
});

describe('Runs Summary :: metric options', () => {
  test('getMetricFieldPath joins the metric field family', () => {
    expect(getMetricFieldPath('Ragas Answer Relevancy', 'score')).toBe('metric::Ragas Answer Relevancy::score');
  });

  test('getMetricOutputFields returns all properties, else falls back to score', () => {
    expect(getMetricOutputFields({ properties: { score: {}, reason: {} } } as any)).toEqual(['score', 'reason']);
    expect(getMetricOutputFields({ properties: {} } as any)).toEqual(['score']);
    expect(getMetricOutputFields(undefined)).toEqual(['score']);
  });

  test('toMetricOptions expands one option per output field and skips incomplete snapshots', () => {
    const options = toMetricOptions([
      {
        tsmdName: 'DeepEval: Answer Relevancy',
        computationId: 'comp-1',
        outputSchema: { properties: { score: {}, reason: {} } },
      },
      { tsmdName: 'Exact Match', computationId: 'comp-1', outputSchema: { properties: { exact_match: {} } } },
      { tsmdName: 'No Computation' },
      { computationId: 'comp-1' },
    ] as any);

    expect(options).toEqual([
      {
        name: 'DeepEval: Answer Relevancy.score',
        field: 'metric::DeepEval: Answer Relevancy::score',
        computationId: 'comp-1',
      },
      {
        name: 'DeepEval: Answer Relevancy.reason',
        field: 'metric::DeepEval: Answer Relevancy::reason',
        computationId: 'comp-1',
      },
      { name: 'Exact Match.exact_match', field: 'metric::Exact Match::exact_match', computationId: 'comp-1' },
    ]);
  });

  test('toMetricOptions handles null', () => {
    expect(toMetricOptions(null)).toEqual([]);
  });
});

describe('Runs Summary :: overall score query', () => {
  const option: MetricOption = {
    name: 'Ragas Answer Relevancy',
    field: 'metric::Ragas Answer Relevancy::score',
    computationId: 'comp-1',
  };

  test('buildOverallScoreQuery averages the metric field within run + computation', () => {
    const query = buildOverallScoreQuery('run-1', option);

    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.filter).toEqual({
      op: LogicalOp.And,
      args: [
        {
          op: ComparisonOp.Eq,
          args: [
            { type: ExprType.Field, name: 'test_suite_run_id' },
            { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
          ],
        },
        {
          op: ComparisonOp.Eq,
          args: [
            { type: ExprType.Field, name: 'computation_id' },
            { type: ExprType.Value, value_type: ValueType.Uuid, value: 'comp-1' },
          ],
        },
      ],
    });
    expect(query.select).toEqual([
      {
        expr: {
          type: ExprType.Fn,
          name: 'avg',
          args: [{ type: ExprType.Field, name: 'metric::Ragas Answer Relevancy::score' }],
        },
        as: OVERALL_SCORE_ALIAS,
      },
    ]);
  });

  test('parseOverallScore rounds to two decimals and handles missing data', () => {
    expect(parseOverallScore({ rows: [{ [OVERALL_SCORE_ALIAS]: 0.8532 }] })).toBe(0.85);
    expect(parseOverallScore({ rows: [{ [OVERALL_SCORE_ALIAS]: null }] })).toBeNull();
    expect(parseOverallScore({ rows: [] })).toBeNull();
    expect(parseOverallScore(null)).toBeNull();
  });
});

describe('Runs Summary :: metric scores', () => {
  test('buildMetricScoresQuery selects the metric-score columns, scoped to run + latest computation', () => {
    const query = buildMetricScoresQuery('run-1');

    expect(query.entity).toBe('metric_score_results');
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.select).toEqual([
      { expr: { type: ExprType.Field, name: 'metric_name' } },
      { expr: { type: ExprType.Field, name: 'metric_score_name' } },
      { expr: { type: ExprType.Field, name: 'value' } },
    ]);
    expect(query.filter).toEqual({
      op: LogicalOp.And,
      args: [
        {
          op: ComparisonOp.Eq,
          args: [
            { type: ExprType.Field, name: 'test_suite_run_id' },
            { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
          ],
        },
        {
          op: ComparisonOp.Eq,
          args: [
            { type: ExprType.Field, name: 'computation_id' },
            { type: ExprType.Value, value_type: ValueType.Uuid, value: 'latest' },
          ],
        },
      ],
    });
    expect(query.sort).toEqual([
      { field: 'metric_name', dir: SortDir.Asc, nulls: null },
      { field: 'metric_score_name', dir: SortDir.Asc, nulls: null },
    ]);
  });

  test('splitMetricName splits on the last dot', () => {
    expect(splitMetricName('aidial_rag_eval.generation.context_to_answer')).toEqual({
      group: 'aidial_rag_eval.generation',
      bar: 'context_to_answer',
    });
    expect(splitMetricName('single')).toEqual({ group: 'single', bar: 'single' });
  });

  test('parseMetricScores groups metrics by prefix per statistic and collects statistics', () => {
    const parsed = parseMetricScores({
      rows: [
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 0.8 },
        { metric_name: 'aidial_rag_eval.generation.answer_relevancy', metric_score_name: 'AVG', value: 0.6 },
        { metric_name: 'aidial_rag_eval.retrieval.context_recall', metric_score_name: 'AVG', value: 0.9 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'P90', value: 0.95 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 'x' },
      ],
    });

    expect(parsed.statistics).toEqual(['AVG', 'P90']);
    expect(parsed.byStatistic).toEqual({
      AVG: [
        { name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.8, answer_relevancy: 0.6 } },
        { name: 'aidial_rag_eval.retrieval', bars: { context_recall: 0.9 } },
      ],
      P90: [{ name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.95 } }],
    });
  });

  test('parseMetricScores handles null/empty results', () => {
    expect(parseMetricScores(null)).toEqual({ statistics: [], byStatistic: {} });
    expect(parseMetricScores({ rows: [] })).toEqual({ statistics: [], byStatistic: {} });
  });
});

describe('Runs Summary :: distribution', () => {
  test('buildDistributionQuery buckets the metric field with width_bucket over 0..1.01/10', () => {
    const query = buildDistributionQuery('run-1', 'metric::DeepEval: Answer Relevancy::score');

    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['bucket']);
    expect(query.sort).toEqual([{ field: 'bucket', dir: SortDir.Asc, nulls: null }]);
    expect(query.select).toEqual([
      {
        expr: {
          type: ExprType.Fn,
          name: 'width_bucket',
          args: [
            { type: ExprType.Field, name: 'metric::DeepEval: Answer Relevancy::score' },
            { type: ExprType.Value, value_type: ValueType.Decimal, value: '0' },
            { type: ExprType.Value, value_type: ValueType.Decimal, value: '1.01' },
            { type: ExprType.Value, value_type: ValueType.Integer, value: '10' },
          ],
        },
        as: 'bucket',
      },
      { expr: { type: ExprType.Fn, name: 'count', args: [] }, as: 'cnt' },
    ]);
  });

  test('parseHistogramValues expands bucket counts into midpoint values', () => {
    const values = parseHistogramValues({
      rows: [
        { bucket: 1, cnt: 2 },
        { bucket: 10, cnt: 1 },
        { bucket: 5, cnt: 0 },
      ],
    });

    // bucket 1 → 0.05 (x2), bucket 10 → 0.95 (x1); zero-count buckets skipped.
    expect(values).toEqual([0.05, 0.05, 0.95]);
  });

  test('parseHistogramValues handles null/empty results', () => {
    expect(parseHistogramValues(null)).toEqual([]);
    expect(parseHistogramValues({ rows: [] })).toEqual([]);
  });

  test('getMetricStatCards extracts per-statistic values for a metric name', () => {
    const data: MetricScoresData = {
      statistics: ['AVG', 'P90', 'MIN'],
      byStatistic: {
        AVG: [{ name: 'DeepEval: Answer Relevancy', bars: { score: 0.8 } }],
        P90: [{ name: 'DeepEval: Answer Relevancy', bars: { score: 0.95 } }],
        MIN: [{ name: 'Other', bars: { score: 0.1 } }],
      },
    };

    expect(getMetricStatCards(data, 'DeepEval: Answer Relevancy.score')).toEqual([
      { name: 'AVG', value: 0.8 },
      { name: 'P90', value: 0.95 },
    ]);
  });

  test('getMetricStatCards returns [] for missing data or metric', () => {
    expect(getMetricStatCards(null, 'x.score')).toEqual([]);
    expect(getMetricStatCards({ statistics: [], byStatistic: {} }, null)).toEqual([]);
  });
});

describe('Runs Summary :: result parsers', () => {
  test('parseTestCaseStatusCounts buckets SUCCESS/ERROR/other and totals', () => {
    const counts = parseTestCaseStatusCounts({
      rows: [
        { [EXECUTION_STATUS_FIELD]: 'SUCCESS', [COUNT_ALIAS]: 37 },
        { [EXECUTION_STATUS_FIELD]: 'FAILED', [COUNT_ALIAS]: 3 },
        { [EXECUTION_STATUS_FIELD]: 'TIMEOUT', [COUNT_ALIAS]: 1 },
        { [EXECUTION_STATUS_FIELD]: 'ERROR', [COUNT_ALIAS]: 2 },
      ],
    });

    expect(counts).toEqual({ passed: 37, failed: 4, error: 2, total: 43 });
  });

  test('parseTestCaseStatusCounts returns zeros for empty/null results', () => {
    expect(parseTestCaseStatusCounts(null)).toEqual({ passed: 0, failed: 0, error: 0, total: 0 });
    expect(parseTestCaseStatusCounts({ rows: [] })).toEqual({ passed: 0, failed: 0, error: 0, total: 0 });
  });

  test('parseAvgRunTimeMs rounds the average and handles missing data', () => {
    expect(parseAvgRunTimeMs({ rows: [{ [AVG_DURATION_ALIAS]: 199.6 }] })).toBe(200);
    expect(parseAvgRunTimeMs({ rows: [{ [AVG_DURATION_ALIAS]: null }] })).toBeNull();
    expect(parseAvgRunTimeMs({ rows: [] })).toBeNull();
    expect(parseAvgRunTimeMs(null)).toBeNull();
  });
});
