import { describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { ComparisonOp, ExprType, QueryMode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { OverallScoreType, OverallScoreWeight, TestSuite } from '@/src/models/evaluation/test-suite';
import { ErrorType } from '@/src/types/error-type';
import { FunctionParameterSource, FunctionParameterSourceType, OverallScoreFunctionName } from '../models';
import {
  buildFunctionParameterFieldName,
  buildOverallScoreFunctionExpression,
  createDefaultWeightedMeanWeights,
  createNextWeightedMeanWeight,
  DEFAULT_WEIGHTED_MEAN_WEIGHT,
  formatWeightedMeanWeightInputValue,
  getAvailableOptionsForRow,
  getFunctionName,
  getFunctionParameterSources,
  getMetricOutputOptions,
  getMetricSelectionError,
  getOverallScoreCardMethodLabelKey,
  getOverallScoreFormulaLabelKey,
  getOverallScoreMethodLabelKey,
  getOverallScoreThresholdError,
  getWeightError,
  isOverallScoreDraftValid,
  normalizeOverallScoreApplyPayload,
  parseFunctionParameterFieldName,
  stripMetricFromScoreWeights,
} from '../utils';

describe('getOverallScoreThresholdError', () => {
  test.each([0, 0.5, 1])('returns null for in-range value %s', (value) => {
    expect(getOverallScoreThresholdError(value)).toBeNull();
  });

  test.each([undefined, ''])('returns null for %s', (value) => {
    expect(getOverallScoreThresholdError(value)).toBeNull();
  });

  test.each([-0.1, 1.1, NaN])('returns an error for out-of-range value %s', (value) => {
    expect(getOverallScoreThresholdError(value)).toEqual({ type: ErrorType.INVALID, text: '' });
  });

  test('builds error text via t when provided', () => {
    const t = vi.fn((key: string) => key);

    const error = getOverallScoreThresholdError(2, t);

    expect(t).toHaveBeenCalledWith(ErrorI18nKey.AllowedRange, { min: 0, max: 1 });
    expect(error).toEqual({ type: ErrorType.INVALID, text: ErrorI18nKey.AllowedRange });
  });
});

describe('getMetricOutputOptions', () => {
  test('returns an option per output-schema property', () => {
    const metrics: Metric[] = [
      {
        name: 'Ragas Answer Relevancy',
        outputSchema: { type: 'object', properties: { relevancy: { type: 'number' } } },
      },
    ];

    expect(getMetricOutputOptions(metrics)).toEqual([
      {
        value: 'Ragas Answer Relevancy::relevancy',
        metricName: 'Ragas Answer Relevancy',
        outputField: 'relevancy',
        label: 'Ragas Answer Relevancy — relevancy',
      },
    ]);
  });

  test('falls back to the default score field when a metric has no output schema', () => {
    const metrics: Metric[] = [{ name: 'Exact Match' }];

    expect(getMetricOutputOptions(metrics)).toEqual([
      { value: 'Exact Match::score', metricName: 'Exact Match', outputField: 'score', label: 'Exact Match — score' },
    ]);
  });

  test('returns an empty array for undefined metrics', () => {
    expect(getMetricOutputOptions(undefined)).toEqual([]);
  });
});

describe('formatWeightedMeanWeightInputValue', () => {
  test('formats whole numbers with one decimal place', () => {
    expect(formatWeightedMeanWeightInputValue(1)).toBe('1.0');
    expect(formatWeightedMeanWeightInputValue(2)).toBe('2.0');
  });

  test('keeps fractional weights as-is', () => {
    expect(formatWeightedMeanWeightInputValue(1.5)).toBe('1.5');
    expect(formatWeightedMeanWeightInputValue(0.25)).toBe('0.25');
  });

  test('passes through undefined', () => {
    expect(formatWeightedMeanWeightInputValue(undefined)).toBeUndefined();
  });
});

describe('createDefaultWeightedMeanWeights', () => {
  test('seeds the first metric output with weight 1', () => {
    const metrics: Metric[] = [{ name: 'A' }, { name: 'B' }];

    expect(createDefaultWeightedMeanWeights(metrics)).toEqual([
      { metricName: 'A', outputField: 'score', weight: DEFAULT_WEIGHTED_MEAN_WEIGHT },
    ]);
  });

  test('returns an empty array when there are no metrics', () => {
    expect(createDefaultWeightedMeanWeights(undefined)).toEqual([]);
    expect(createDefaultWeightedMeanWeights([])).toEqual([]);
  });
});

describe('createNextWeightedMeanWeight', () => {
  test('returns the next unused metric output with weight 1', () => {
    const metrics: Metric[] = [{ name: 'A' }, { name: 'B' }];
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    expect(createNextWeightedMeanWeight(metrics, weights)).toEqual({
      metricName: 'B',
      outputField: 'score',
      weight: DEFAULT_WEIGHTED_MEAN_WEIGHT,
    });
  });

  test('returns null when every option is already used', () => {
    const metrics: Metric[] = [{ name: 'A' }];
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    expect(createNextWeightedMeanWeight(metrics, weights)).toBeNull();
  });
});

describe('getAvailableOptionsForRow', () => {
  const options = [
    { value: 'A::score', metricName: 'A', outputField: 'score', label: 'A — score' },
    { value: 'B::score', metricName: 'B', outputField: 'score', label: 'B — score' },
    { value: 'C::score', metricName: 'C', outputField: 'score', label: 'C — score' },
  ];

  test('excludes values already picked by other rows', () => {
    const weights: OverallScoreWeight[] = [
      { metricName: 'A', outputField: 'score', weight: 0.5 },
      { metricName: 'B', outputField: 'score', weight: 0.5 },
    ];

    expect(getAvailableOptionsForRow(options, weights, 1)).toEqual([options[1], options[2]]);
  });

  test('keeps the row own selection visible', () => {
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 0.5 }];

    expect(getAvailableOptionsForRow(options, weights, 0)).toEqual(options);
  });
});

describe('getWeightError', () => {
  test.each([0.5, 1, 100])('returns null for valid numeric value %s', (value) => {
    expect(getWeightError(value)).toBeNull();
  });

  test.each([undefined, ''])('returns an error for missing value %s', (value) => {
    expect(getWeightError(value)).toEqual({ type: ErrorType.INVALID, text: '' });
  });

  test('returns an error for a non-numeric value', () => {
    expect(getWeightError('abc')).toEqual({ type: ErrorType.INVALID, text: '' });
  });

  test.each([0, -1, -0.5])('returns an error for non-positive value %s', (value) => {
    expect(getWeightError(value)).toEqual({ type: ErrorType.INVALID, text: '' });
  });

  test('builds the weight-must-be-positive text via t for a zero weight', () => {
    const t = vi.fn((key: string) => key);

    const error = getWeightError(0, t);

    expect(t).toHaveBeenCalledWith(TestSuitesI18nKey.OverallScoreWeightPositive);
    expect(error).toEqual({ type: ErrorType.INVALID, text: TestSuitesI18nKey.OverallScoreWeightPositive });
  });

  test('builds error text via t when provided', () => {
    const t = vi.fn((key: string) => key);

    const error = getWeightError(undefined, t);

    expect(t).toHaveBeenCalledWith(ErrorI18nKey.EmptyField);
    expect(error).toEqual({ type: ErrorType.INVALID, text: ErrorI18nKey.EmptyField });
  });
});

describe('getMetricSelectionError', () => {
  test('returns null when a metric value is selected and still exists', () => {
    expect(getMetricSelectionError('A::score')).toBeNull();
  });

  test.each([undefined, ''])('returns an error for %s', (value) => {
    expect(getMetricSelectionError(value)).toEqual({ type: ErrorType.INVALID, text: '' });
  });

  test('returns a metric-deleted error when the selected metric no longer exists', () => {
    const t = vi.fn((key: string) => key);

    const error = getMetricSelectionError('A::score', t, false);

    expect(t).toHaveBeenCalledWith(TestSuitesI18nKey.OverallScoreMetricDeleted);
    expect(error).toEqual({ type: ErrorType.INVALID, text: TestSuitesI18nKey.OverallScoreMetricDeleted });
  });

  test('builds error text via t when provided', () => {
    const t = vi.fn((key: string) => key);

    const error = getMetricSelectionError(undefined, t);

    expect(t).toHaveBeenCalledWith(ErrorI18nKey.EmptyField);
    expect(error).toEqual({ type: ErrorType.INVALID, text: ErrorI18nKey.EmptyField });
  });
});

describe('buildFunctionParameterFieldName', () => {
  test('builds a data:: field name for a test-case source', () => {
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' };

    expect(buildFunctionParameterFieldName(source)).toBe('data::y_true_float');
  });

  test('builds a response:: field name for a response source', () => {
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.Response, columnName: 'y_pred' };

    expect(buildFunctionParameterFieldName(source)).toBe('response::y_pred');
  });

  test('builds a metric:: field name for a metric source', () => {
    const source: FunctionParameterSource = {
      $type: FunctionParameterSourceType.Metric,
      metricName: 'Classifier',
      outputField: 'score',
    };

    expect(buildFunctionParameterFieldName(source)).toBe('metric::Classifier::score');
  });

  test.each([
    [{ $type: FunctionParameterSourceType.TestCase }, 'data::'],
    [{ $type: FunctionParameterSourceType.Response }, 'response::'],
    [{ $type: FunctionParameterSourceType.Metric, metricName: 'Classifier' }, 'metric::Classifier::'],
    [{ $type: FunctionParameterSourceType.Metric, outputField: 'score' }, 'metric::::score'],
  ])('keeps the type prefix for an incomplete source %j', (source, expected) => {
    expect(buildFunctionParameterFieldName(source as FunctionParameterSource)).toBe(expected);
  });
});

describe('parseFunctionParameterFieldName', () => {
  test('parses a data:: field name into a test-case source', () => {
    expect(parseFunctionParameterFieldName('data::y_true_float')).toEqual({
      $type: FunctionParameterSourceType.TestCase,
      columnName: 'y_true_float',
    });
  });

  test('parses a response:: field name into a response source', () => {
    expect(parseFunctionParameterFieldName('response::y_pred')).toEqual({
      $type: FunctionParameterSourceType.Response,
      columnName: 'y_pred',
    });
  });

  test('parses a metric:: field name into a metric source', () => {
    expect(parseFunctionParameterFieldName('metric::Classifier::score')).toEqual({
      $type: FunctionParameterSourceType.Metric,
      metricName: 'Classifier',
      outputField: 'score',
    });
  });

  test.each([undefined, '', 'unknown::x'])('falls back to a default test-case source for %s', (fieldName) => {
    expect(parseFunctionParameterFieldName(fieldName)).toEqual({ $type: FunctionParameterSourceType.TestCase });
  });

  test('preserves the response type when no column has been picked yet', () => {
    expect(parseFunctionParameterFieldName('response::')).toEqual({ $type: FunctionParameterSourceType.Response });
  });

  test('preserves the metric type when no output field has been picked yet', () => {
    expect(parseFunctionParameterFieldName('metric::Classifier')).toEqual({
      $type: FunctionParameterSourceType.Metric,
      metricName: 'Classifier',
    });
  });
});

describe('getFunctionName', () => {
  test('reads the function name from the expression select', () => {
    const expression: StructuredQuery = {
      entity: 'eval_summaries',
      mode: QueryMode.Aggregate,
      select: [{ expr: { type: ExprType.Fn, name: 'roc_auc', args: [] } }],
    };

    expect(getFunctionName(expression)).toBe(OverallScoreFunctionName.RocAuc);
  });

  test('falls back to roc_auc when the expression has no select', () => {
    expect(getFunctionName({ entity: 'eval_summaries', mode: QueryMode.Aggregate } as StructuredQuery)).toBe(
      OverallScoreFunctionName.RocAuc,
    );
  });
});

describe('getFunctionParameterSources', () => {
  test('parses each fn arg into its parameter source', () => {
    const expression = {
      select: [
        {
          expr: {
            type: ExprType.Fn,
            name: 'roc_auc',
            args: [
              { type: ExprType.Field, name: 'data::y_true_float' },
              { type: ExprType.Field, name: 'response::y_pred' },
            ],
          },
        },
      ],
    } as StructuredQuery;

    expect(getFunctionParameterSources(expression)).toEqual([
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.Response, columnName: 'y_pred' },
    ]);
  });

  test('pads with default test-case sources when fewer than 2 args are present', () => {
    expect(
      getFunctionParameterSources({ entity: 'eval_summaries', mode: QueryMode.Aggregate } as StructuredQuery),
    ).toEqual([{ $type: FunctionParameterSourceType.TestCase }, { $type: FunctionParameterSourceType.TestCase }]);
  });
});

describe('buildOverallScoreFunctionExpression', () => {
  test('builds the exact structured-query shape expected by the backend', () => {
    const parameterSources: FunctionParameterSource[] = [
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.Response, columnName: 'y_pred' },
    ];

    expect(buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, parameterSources)).toEqual({
      entity: 'eval_summaries',
      mode: QueryMode.Aggregate,
      filter: {
        op: 'and',
        args: [
          {
            op: ComparisonOp.Eq,
            args: [
              { type: ExprType.Field, name: 'test_suite_run_id' },
              { type: ExprType.Param, name: 'runId' },
            ],
          },
          {
            op: ComparisonOp.Eq,
            args: [
              { type: ExprType.Field, name: 'computation_id' },
              { type: ExprType.Param, name: 'computationId' },
            ],
          },
        ],
      },
      select: [
        {
          expr: {
            type: ExprType.Fn,
            name: 'roc_auc',
            args: [
              { type: ExprType.Field, name: 'data::y_true_float' },
              { type: ExprType.Field, name: 'response::y_pred' },
            ],
          },
          as: 'value',
        },
      ],
    });
  });

  test('has no page key', () => {
    const expression = buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, [
      { $type: FunctionParameterSourceType.TestCase },
      { $type: FunctionParameterSourceType.Response },
    ]);

    expect(expression.page).toBeUndefined();
  });
});

describe('normalizeOverallScoreApplyPayload', () => {
  test('clears testCaseOverallScore for mean', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
      testCaseOverallScore: { type: OverallScoreType.Mean },
    };

    expect(normalizeOverallScoreApplyPayload(suite)).toEqual({
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
    });
  });

  test('defaults testCaseOverallScore for custom_function', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Function, expression: { entity: 'eval_summaries' } as any },
    };

    expect(normalizeOverallScoreApplyPayload(suite).testCaseOverallScore).toEqual({ type: OverallScoreType.Mean });
  });
});

describe('isOverallScoreDraftValid', () => {
  test('rejects weighted mean with empty weights', () => {
    expect(
      isOverallScoreDraftValid({
        overallScore: { type: OverallScoreType.WeightedMean, weights: [] },
      }),
    ).toBe(false);
  });

  test('rejects custom_function without nested test case score', () => {
    expect(
      isOverallScoreDraftValid({
        overallScore: { type: OverallScoreType.Function, expression: { entity: 'eval_summaries' } as any },
      }),
    ).toBe(false);
  });

  test('accepts custom_function with mean test case score', () => {
    expect(
      isOverallScoreDraftValid({
        overallScore: { type: OverallScoreType.Function, expression: { entity: 'eval_summaries' } as any },
        testCaseOverallScore: { type: OverallScoreType.Mean },
      }),
    ).toBe(true);
  });
});

describe('stripMetricFromScoreWeights', () => {
  test('strips metric from overall and test-case weighted means', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [
          { metricName: 'A', outputField: 'score', weight: 1 },
          { metricName: 'B', outputField: 'score', weight: 1 },
        ],
      },
      testCaseOverallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'A', outputField: 'score', weight: 1 }],
      },
    };

    expect(stripMetricFromScoreWeights(suite, 'A')).toEqual({
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'B', outputField: 'score', weight: 1 }],
      },
      testCaseOverallScore: { type: OverallScoreType.WeightedMean, weights: [] },
    });
  });
});

describe('getOverallScoreMethodLabelKey', () => {
  test('returns mean by default', () => {
    expect(getOverallScoreMethodLabelKey({})).toBe(TestSuitesI18nKey.OverallScoreMean);
  });
});

describe('getOverallScoreCardMethodLabelKey', () => {
  test('returns short mean label for the card', () => {
    expect(getOverallScoreCardMethodLabelKey({})).toBe(TestSuitesI18nKey.OverallScoreMeanCard);
  });
});

describe('getOverallScoreFormulaLabelKey', () => {
  test('returns mean formula by default', () => {
    expect(getOverallScoreFormulaLabelKey({})).toBe(TestSuitesI18nKey.OverallScoreMeanFormula);
  });
});
