import { describe, expect, test } from 'vitest';

import {
  ComparisonOp,
  ExprType,
  LogicalOp,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { AVG_DURATION_ALIAS, COUNT_ALIAS, EXECUTION_STATUS_FIELD } from '../constants';
import { MetricScoresData } from '../models';
import {
  attachMetricInfo,
  buildAvgRunTimeQuery,
  buildDistributionQuery,
  buildMetricScoresQuery,
  buildTestCasesStatusQuery,
  getMetricFieldPath,
  getMetricOutputDescriptions,
  getMetricOutputFields,
  getMetricStatCards,
  parseAvgRunTimeMs,
  parseComparisonMetricScores,
  parseHistogramValues,
  parseMetricScores,
  parseTestCaseStatusCounts,
  splitMetricName,
  toMetricInfoByName,
  toMetricOptions,
  formatAvgRunTimeSeconds,
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

  test('buildTestCasesStatusQuery ANDs a NOT IN exclusion when unmatched ids are provided', () => {
    const query = buildTestCasesStatusQuery('run-1', ['id-1', 'id-2']);

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
          op: LogicalOp.Not,
          args: [
            {
              op: ComparisonOp.In,
              args: [
                { type: ExprType.Field, name: 'id' },
                {
                  type: ExprType.Array,
                  items: [
                    { type: ExprType.Value, value_type: ValueType.Uuid, value: 'id-1' },
                    { type: ExprType.Value, value_type: ValueType.Uuid, value: 'id-2' },
                  ],
                },
              ],
            },
          ],
        },
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
        name: 'DeepEval: Answer Relevancy.reason',
        field: 'metric::DeepEval: Answer Relevancy::reason',
        computationId: 'comp-1',
      },
      {
        name: 'DeepEval: Answer Relevancy.score',
        field: 'metric::DeepEval: Answer Relevancy::score',
        computationId: 'comp-1',
      },
      { name: 'Exact Match.exact_match', field: 'metric::Exact Match::exact_match', computationId: 'comp-1' },
    ]);
  });

  test('toMetricOptions sorts options alphabetically by name', () => {
    const options = toMetricOptions([
      { tsmdName: 'zebra', computationId: 'comp-1', outputSchema: { properties: { score: {} } } },
      { tsmdName: 'alpha', computationId: 'comp-1', outputSchema: { properties: { score: {} } } },
      { tsmdName: 'middle', computationId: 'comp-1', outputSchema: { properties: { score: {} } } },
    ] as any);

    expect(options.map((option) => option.name)).toEqual(['alpha.score', 'middle.score', 'zebra.score']);
  });

  test('toMetricOptions handles null', () => {
    expect(toMetricOptions(null)).toEqual([]);
  });
});

describe('Runs Summary :: metric info', () => {
  test('getMetricOutputDescriptions extracts descriptions and skips fields without one', () => {
    expect(
      getMetricOutputDescriptions({
        properties: {
          score: { description: 'The relevancy score.' },
          reason: {},
        },
      } as any),
    ).toEqual({ score: 'The relevancy score.' });
  });

  test('getMetricOutputDescriptions handles empty properties and undefined schema', () => {
    expect(getMetricOutputDescriptions({ properties: {} } as any)).toEqual({});
    expect(getMetricOutputDescriptions(undefined)).toEqual({});
  });

  test('toMetricInfoByName maps snapshots to their declaration description + output descriptions', () => {
    const infoByName = toMetricInfoByName(
      [
        {
          tsmdName: 'DeepEval: Answer Relevancy',
          metricDeclarationId: 'decl-1',
        },
        {
          tsmdName: 'Exact Match',
          metricDeclarationId: 'decl-missing',
        },
      ] as any,
      {
        'decl-1': {
          description: 'Measures answer relevancy.',
          outputSchema: { properties: { score: { description: 'The relevancy score.' } } },
        },
      } as any,
    );

    expect(infoByName).toEqual({
      'DeepEval: Answer Relevancy': {
        description: 'Measures answer relevancy.',
        outputDescriptions: { score: 'The relevancy score.' },
      },
      'Exact Match': { description: undefined, outputDescriptions: {} },
    });
  });

  test('toMetricInfoByName skips snapshots missing tsmdName or metricDeclarationId, and handles null', () => {
    expect(toMetricInfoByName([{ metricDeclarationId: 'decl-1' }, { tsmdName: 'No Declaration' }] as any, {})).toEqual(
      {},
    );
    expect(toMetricInfoByName(null, {})).toEqual({});
  });

  test('attachMetricInfo merges description + bar descriptions onto matching groups only', () => {
    const data: MetricScoresData = {
      overallScore: null,
      statistics: ['AVG'],
      byStatistic: {
        AVG: [
          { name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.8 } },
          { name: 'aidial_rag_eval.retrieval', bars: { context_recall: 0.9 } },
        ],
      },
    };

    const enriched = attachMetricInfo(data, {
      'aidial_rag_eval.generation': {
        description: 'Generation metrics.',
        outputDescriptions: { context_to_answer: 'How well the answer uses context.' },
      },
    });

    expect(enriched.byStatistic).toEqual({
      AVG: [
        {
          name: 'aidial_rag_eval.generation',
          bars: { context_to_answer: 0.8 },
          description: 'Generation metrics.',
          barDescriptions: { context_to_answer: 'How well the answer uses context.' },
        },
        { name: 'aidial_rag_eval.retrieval', bars: { context_recall: 0.9 } },
      ],
    });
    expect(enriched.overallScore).toBeNull();
    expect(enriched.statistics).toEqual(['AVG']);
  });

  test('attachMetricInfo returns groups unchanged when infoByName is empty', () => {
    const data: MetricScoresData = {
      overallScore: 0.5,
      statistics: ['AVG'],
      byStatistic: { AVG: [{ name: 'Other', bars: { score: 0.1 } }] },
    };

    expect(attachMetricInfo(data, {})).toEqual(data);
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
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 0.812345 },
        { metric_name: 'aidial_rag_eval.generation.answer_relevancy', metric_score_name: 'AVG', value: 0.6 },
        { metric_name: 'aidial_rag_eval.retrieval.context_recall', metric_score_name: 'AVG', value: 0.9 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'P90', value: 0.9556 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 'x' },
      ],
    });

    expect(parsed.overallScore).toBeNull();
    expect(parsed.statistics).toEqual(['AVG', 'P90']);
    expect(parsed.byStatistic).toEqual({
      AVG: [
        { name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.812, answer_relevancy: 0.6 } },
        { name: 'aidial_rag_eval.retrieval', bars: { context_recall: 0.9 } },
      ],
      P90: [{ name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.956 } }],
    });
  });

  test('parseMetricScores sorts metric groups alphabetically regardless of row order', () => {
    const parsed = parseMetricScores({
      rows: [
        { metric_name: 'ragas.faithfulness.score', metric_score_name: 'AVG', value: 0.5 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 0.8 },
        { metric_name: 'deepeval.answer_relevancy.score', metric_score_name: 'AVG', value: 0.7 },
      ],
    });

    expect(parsed.byStatistic.AVG.map((group) => group.name)).toEqual([
      'aidial_rag_eval.generation',
      'deepeval.answer_relevancy',
      'ragas.faithfulness',
    ]);
  });

  test('parseMetricScores orders statistics by Metric Scores segmented-control order', () => {
    const parsed = parseMetricScores({
      rows: [
        { metric_name: 'm.a', metric_score_name: 'MAX', value: 0.9 },
        { metric_name: 'm.a', metric_score_name: 'MIN', value: 0.1 },
        { metric_name: 'm.a', metric_score_name: 'MED', value: 0.5 },
        { metric_name: 'm.a', metric_score_name: 'P90', value: 0.8 },
        { metric_name: 'm.a', metric_score_name: 'AVG', value: 0.55 },
      ],
    });

    expect(parsed.statistics).toEqual(['AVG', 'P90', 'MAX', 'MED', 'MIN']);
  });

  test('parseMetricScores extracts overall score and excludes it from statistics', () => {
    const parsed = parseMetricScores({
      rows: [
        { metric_name: 'overall', metric_score_name: 'overall', value: 0.812345 },
        { metric_name: 'aidial_rag_eval.generation.context_to_answer', metric_score_name: 'AVG', value: 0.6 },
        { metric_name: 'overall', metric_score_name: 'overall', value: 0.999 },
      ],
    });

    expect(parsed.overallScore).toBe(0.812);
    expect(parsed.statistics).toEqual(['AVG']);
    expect(parsed.byStatistic).toEqual({
      AVG: [{ name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.6 } }],
    });
  });

  test('parseMetricScores handles null/empty results', () => {
    expect(parseMetricScores(null)).toEqual({ overallScore: null, statistics: [], byStatistic: {} });
    expect(parseMetricScores({ rows: [] })).toEqual({ overallScore: null, statistics: [], byStatistic: {} });
  });

  test('parseComparisonMetricScores maps comparison scores into MetricScoresData', () => {
    const parsed = parseComparisonMetricScores([
      { metricScoreName: 'overall', metricName: 'overall', value: 0.77 },
      { metricScoreName: 'AVG', metricName: 'Accuracy.score', value: 0.91 },
    ]);

    expect(parsed.overallScore).toBe(0.77);
    expect(parsed.statistics).toEqual(['AVG']);
    expect(parsed.byStatistic).toEqual({
      AVG: [{ name: 'Accuracy', bars: { score: 0.91 } }],
    });
  });
});

describe('Runs Summary :: distribution', () => {
  test('buildDistributionQuery fetches the raw metric field values as rows', () => {
    const query = buildDistributionQuery('run-1', 'metric::DeepEval: Answer Relevancy::score');

    expect(query.mode).toBe(QueryMode.Row);
    expect(query.page).toEqual({ type: 'offset', offset: 0, limit: 10000, include_total: false });
    expect(query.filter).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: 'test_suite_run_id' },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
      ],
    });
    expect(query.select).toEqual([
      {
        expr: { type: ExprType.Field, name: 'metric::DeepEval: Answer Relevancy::score' },
        as: 'value',
      },
    ]);
  });

  test('buildDistributionQuery ANDs a NOT IN exclusion when unmatched ids are provided', () => {
    const query = buildDistributionQuery('run-1', 'metric::Accuracy::score', ['id-1', 'id-2']);

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
          op: LogicalOp.Not,
          args: [
            {
              op: ComparisonOp.In,
              args: [
                { type: ExprType.Field, name: 'id' },
                {
                  type: ExprType.Array,
                  items: [
                    { type: ExprType.Value, value_type: ValueType.Uuid, value: 'id-1' },
                    { type: ExprType.Value, value_type: ValueType.Uuid, value: 'id-2' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
  test('parseHistogramValues extracts and clamps the raw values', () => {
    const values = parseHistogramValues({
      rows: [{ value: 0 }, { value: 0.42 }, { value: 1 }, { value: 1.2 }, { value: -0.1 }],
    });

    // exact 0 and 1 pass through; out-of-range values clamp into [0, 1].
    expect(values).toEqual([0, 0.42, 1, 1, 0]);
  });

  test('parseHistogramValues skips null / non-numeric values', () => {
    expect(parseHistogramValues({ rows: [{ value: null }, { value: 'x' }, { value: 0.5 }] })).toEqual([0.5]);
  });

  test('parseHistogramValues handles null/empty results', () => {
    expect(parseHistogramValues(null)).toEqual([]);
    expect(parseHistogramValues({ rows: [] })).toEqual([]);
  });

  test('getMetricStatCards extracts per-statistic values for a metric name', () => {
    const data: MetricScoresData = {
      overallScore: null,
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
    expect(getMetricStatCards({ overallScore: null, statistics: [], byStatistic: {} }, null)).toEqual([]);
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

  test('formatAvgRunTimeSeconds rounds ms to one decimal second', () => {
    expect(formatAvgRunTimeSeconds(199.6)).toBe(0.2);
    expect(formatAvgRunTimeSeconds(241000)).toBe(241);
  });
});
