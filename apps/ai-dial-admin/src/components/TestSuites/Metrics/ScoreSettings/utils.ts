import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { Metric } from '@/src/models/evaluation/metric';
import {
  ComparisonNode,
  ComparisonOp,
  FnExpr,
  QueryMode,
  StructuredQuery,
} from '@/src/models/evaluation/structured-query';
import {
  OverallScoreMean,
  OverallScoreType,
  OverallScoreWeight,
  OverallScoreWeightedMean,
  TestCaseOverallScoreConfig,
  TestSuite,
} from '@/src/models/evaluation/test-suite';
import { and, col, field, fn, param } from '@/src/utils/structured-query/build';
import { ErrorType } from '@/src/types/error-type';
import {
  COMPUTATION_ID_FIELD,
  COMPUTATION_ID_PARAM,
  EVAL_SUMMARIES_ENTITY,
  FIELD_NAME_SEPARATOR,
  FUNCTION_RESULT_ALIAS,
  METRIC_FIELD_PREFIX,
  RESPONSE_FIELD_PREFIX,
  RUN_ID_FIELD,
  RUN_ID_PARAM,
  TEST_CASE_FIELD_PREFIX,
} from './constants';
import {
  FunctionParameterSource,
  FunctionParameterSourceType,
  MetricOutputOption,
  OverallScoreFunctionName,
} from './models';
import { JSONSchema7 } from 'json-schema';

const DEFAULT_METRIC_SCORE_FIELD = 'score';

export const getOverallScoreThresholdError = (
  value: number | string | undefined,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  if (value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 1) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.AllowedRange, { min: 0, max: 1 }) : '' };
  }

  return null;
};

export const getMetricOutputOptions = (metrics?: Metric[]): MetricOutputOption[] =>
  (metrics ?? []).flatMap((metric) => {
    const metricName = metric.name ?? '';
    const outputFields = metric.outputSchema?.properties ? Object.keys(metric.outputSchema.properties) : [];
    const fields = outputFields.length > 0 ? outputFields : [DEFAULT_METRIC_SCORE_FIELD];

    return fields.map((outputField) => ({
      value: `${metricName}::${outputField}`,
      metricName,
      outputField,
      label: `${metricName} — ${outputField}`,
    }));
  });

/** Default coefficient for a new weighted-mean row (Figma: 1.0). */
export const DEFAULT_WEIGHTED_MEAN_WEIGHT = 1;

/**
 * Format weight for NumberInput so whole numbers render with one decimal (Figma: 1.0).
 * Passing a string avoids the browser collapsing numeric `1` to `"1"`.
 */
export const formatWeightedMeanWeightInputValue = (weight: number | undefined): string | number | undefined => {
  if (weight === undefined || !Number.isFinite(weight)) {
    return weight;
  }

  return Number.isInteger(weight) ? weight.toFixed(1) : String(weight);
};

export const createWeightedMeanWeight = (
  option: Pick<MetricOutputOption, 'metricName' | 'outputField'>,
  weight = DEFAULT_WEIGHTED_MEAN_WEIGHT,
): OverallScoreWeight => ({
  metricName: option.metricName,
  outputField: option.outputField,
  weight,
});

/** Seed weighted mean with the first metric output and weight 1.0 when selecting the method. */
export const createDefaultWeightedMeanWeights = (metrics?: Metric[]): OverallScoreWeight[] => {
  const firstOption = getMetricOutputOptions(metrics)[0];
  return firstOption ? [createWeightedMeanWeight(firstOption)] : [];
};

/** Next unused metric output for Add, or null when every option is already used. */
export const createNextWeightedMeanWeight = (
  metrics: Metric[] | undefined,
  weights: OverallScoreWeight[],
): OverallScoreWeight | null => {
  const nextOption = getAvailableOptionsForRow(getMetricOutputOptions(metrics), weights, weights.length)[0];
  return nextOption ? createWeightedMeanWeight(nextOption) : null;
};

export const getMetricOutputTags = (metric?: Metric) => {
  return Object.entries(metric?.outputSchema?.properties ?? {}).map(
    ([key, property]) => (property as JSONSchema7)?.title || key,
  );
};

export const getAvailableOptionsForRow = (
  allOptions: MetricOutputOption[],
  weights: OverallScoreWeight[],
  index: number,
): MetricOutputOption[] => {
  const takenValues = new Set(
    weights.filter((_, i) => i !== index).map((weight) => `${weight.metricName}::${weight.outputField}`),
  );

  return allOptions.filter((option) => !takenValues.has(option.value));
};

export const getWeightError = (
  value: number | string | undefined,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  if (value === undefined || value === '') {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.EmptyField) : '' };
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.EmptyField) : '' };
  }

  if (numericValue <= 0) {
    return { type: ErrorType.INVALID, text: t ? t(TestSuitesI18nKey.OverallScoreWeightPositive) : '' };
  }

  return null;
};

export const getMetricSelectionError = (
  metricValue: string | undefined,
  t?: (key: string, options?: Record<string, string | number>) => string,
  exists = true,
): FieldError | null => {
  if (!metricValue) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.EmptyField) : '' };
  }

  if (!exists) {
    return { type: ErrorType.INVALID, text: t ? t(TestSuitesI18nKey.OverallScoreMetricDeleted) : '' };
  }

  return null;
};

const DEFAULT_FUNCTION_PARAMETER_SOURCE: FunctionParameterSource = { $type: FunctionParameterSourceType.TestCase };

const eqFieldParam = (fieldName: string, paramName: string): ComparisonNode => ({
  op: ComparisonOp.Eq,
  args: [field(fieldName), param(paramName)],
});

export const buildFunctionParameterFieldName = (source: FunctionParameterSource): string => {
  switch (source.$type) {
    case FunctionParameterSourceType.TestCase:
      return `${TEST_CASE_FIELD_PREFIX}${FIELD_NAME_SEPARATOR}${source.columnName ?? ''}`;
    case FunctionParameterSourceType.Response:
      return `${RESPONSE_FIELD_PREFIX}${FIELD_NAME_SEPARATOR}${source.columnName ?? ''}`;
    case FunctionParameterSourceType.Metric:
      return `${METRIC_FIELD_PREFIX}${FIELD_NAME_SEPARATOR}${source.metricName ?? ''}${FIELD_NAME_SEPARATOR}${source.outputField ?? ''}`;
    default:
      return '';
  }
};

export const parseFunctionParameterFieldName = (fieldName?: string): FunctionParameterSource => {
  if (!fieldName) {
    return DEFAULT_FUNCTION_PARAMETER_SOURCE;
  }

  const [prefix, ...rest] = fieldName.split(FIELD_NAME_SEPARATOR);

  if (prefix === TEST_CASE_FIELD_PREFIX) {
    return { $type: FunctionParameterSourceType.TestCase, columnName: rest[0] || undefined };
  }

  if (prefix === RESPONSE_FIELD_PREFIX) {
    return { $type: FunctionParameterSourceType.Response, columnName: rest[0] || undefined };
  }

  if (prefix === METRIC_FIELD_PREFIX) {
    return {
      $type: FunctionParameterSourceType.Metric,
      metricName: rest[0] || undefined,
      outputField: rest[1] || undefined,
    };
  }

  return DEFAULT_FUNCTION_PARAMETER_SOURCE;
};

export const getFunctionName = (expression: StructuredQuery): OverallScoreFunctionName => {
  const expr = expression.select?.[0]?.expr as FnExpr | undefined;

  return (expr?.name as OverallScoreFunctionName) || OverallScoreFunctionName.RocAuc;
};

export const getFunctionParameterSources = (expression: StructuredQuery): FunctionParameterSource[] => {
  const expr = expression.select?.[0]?.expr as FnExpr | undefined;
  const args = expr?.args ?? [];
  const sources = args.map((arg) => parseFunctionParameterFieldName((arg as { name?: string }).name));

  while (sources.length < 2) {
    sources.push(DEFAULT_FUNCTION_PARAMETER_SOURCE);
  }

  return sources;
};

export const buildOverallScoreFunctionExpression = (
  functionName: OverallScoreFunctionName,
  parameterSources: FunctionParameterSource[],
): StructuredQuery => ({
  entity: EVAL_SUMMARIES_ENTITY,
  mode: QueryMode.Aggregate,
  filter: and([eqFieldParam(RUN_ID_FIELD, RUN_ID_PARAM), eqFieldParam(COMPUTATION_ID_FIELD, COMPUTATION_ID_PARAM)]),
  select: [
    col(
      fn(
        functionName,
        parameterSources.map((source) => field(buildFunctionParameterFieldName(source))),
      ),
      FUNCTION_RESULT_ALIAS,
    ),
  ],
});

const isWeightedMeanValid = (weights: OverallScoreWeight[]): boolean =>
  weights.length > 0 &&
  weights.every(
    (weight) =>
      Boolean(weight.metricName) && Boolean(weight.outputField) && Number.isFinite(weight.weight) && weight.weight > 0,
  );

const isTestCaseOverallScoreValid = (config?: TestCaseOverallScoreConfig): boolean => {
  if (!config) {
    return false;
  }

  if (config.type === OverallScoreType.Mean) {
    return true;
  }

  return config.type === OverallScoreType.WeightedMean && isWeightedMeanValid(config.weights);
};

/** Normalize suite score fields for Apply: clear nested for mean/weighted_mean; keep for function. */
export const normalizeOverallScoreApplyPayload = (suite: TestSuite): TestSuite => {
  const overallType = suite.overallScore?.type;

  if (overallType === OverallScoreType.Function) {
    return {
      ...suite,
      testCaseOverallScore: suite.testCaseOverallScore ?? { type: OverallScoreType.Mean },
    };
  }

  const { testCaseOverallScore: __, ...rest } = suite;
  return rest;
};

export const isOverallScoreDraftValid = (suite: TestSuite): boolean => {
  const overall = suite.overallScore;

  if (!overall) {
    return true;
  }

  if (overall.type === OverallScoreType.WeightedMean && !isWeightedMeanValid(overall.weights)) {
    return false;
  }

  if (overall.type === OverallScoreType.Function && !isTestCaseOverallScoreValid(suite.testCaseOverallScore)) {
    return false;
  }

  if (suite.testCaseOverallScore?.type === OverallScoreType.WeightedMean) {
    if (!isWeightedMeanValid(suite.testCaseOverallScore.weights)) {
      return false;
    }
  }

  if (getOverallScoreThresholdError(suite.overallScoreThreshold)) {
    return false;
  }

  return true;
};

export const getOverallScoreMethodLabelKey = (suite: TestSuite): string => {
  switch (suite.overallScore?.type) {
    case OverallScoreType.WeightedMean:
      return TestSuitesI18nKey.OverallScoreWeightedMean;
    case OverallScoreType.Function:
      return TestSuitesI18nKey.OverallScoreFunction;
    case OverallScoreType.Mean:
    default:
      return TestSuitesI18nKey.OverallScoreMean;
  }
};

/** Short method label for the Overall Score summary card (Figma). */
export const getOverallScoreCardMethodLabelKey = (suite: TestSuite): string => {
  switch (suite.overallScore?.type) {
    case OverallScoreType.WeightedMean:
      return TestSuitesI18nKey.OverallScoreWeightedMean;
    case OverallScoreType.Function:
      return TestSuitesI18nKey.OverallScoreFunction;
    case OverallScoreType.Mean:
    default:
      return TestSuitesI18nKey.OverallScoreMeanCard;
  }
};

export const getOverallScoreFormulaLabelKey = (suite: TestSuite): string | null => {
  switch (suite.overallScore?.type) {
    case OverallScoreType.WeightedMean:
      return TestSuitesI18nKey.OverallScoreWeightedMeanFormula;
    case OverallScoreType.Function:
      return TestSuitesI18nKey.OverallScoreFunctionRocAuc;
    case OverallScoreType.Mean:
    default:
      return TestSuitesI18nKey.OverallScoreMeanFormula;
  }
};

/** Method label for nested test-case score on the Overall Score card (Figma). */
export const getTestCaseOverallScoreCardMethodLabelKey = (suite: TestSuite): string => {
  switch (suite.testCaseOverallScore?.type) {
    case OverallScoreType.WeightedMean:
      return TestSuitesI18nKey.OverallScoreWeightedMean;
    case OverallScoreType.Mean:
    default:
      return TestSuitesI18nKey.OverallScoreMeanCard;
  }
};

export const getTestCaseOverallScoreFormulaLabelKey = (suite: TestSuite): string | null => {
  switch (suite.testCaseOverallScore?.type) {
    case OverallScoreType.WeightedMean:
      return TestSuitesI18nKey.OverallScoreWeightedMeanFormula;
    case OverallScoreType.Mean:
    default:
      return TestSuitesI18nKey.OverallScoreMeanFormula;
  }
};

const DEFAULT_OVERALL_SCORE: OverallScoreMean = { type: OverallScoreType.Mean };

const isDefaultOverallScore = (suite: TestSuite): boolean =>
  (suite.overallScore === undefined || suite.overallScore.type === OverallScoreType.Mean) &&
  suite.overallScoreThreshold === undefined &&
  suite.testCaseOverallScore === undefined;

/** Mean of all metrics, no threshold, no nested test-case score. */
export const resetOverallScoreDefaults = (suite: TestSuite): TestSuite => {
  if (isDefaultOverallScore(suite)) {
    return suite;
  }

  const {
    overallScoreThreshold: __threshold,
    testCaseOverallScore: __nested,
    overallScore: __overall,
    ...rest
  } = suite;
  return { ...rest, overallScore: DEFAULT_OVERALL_SCORE };
};

const filterWeightedMean = (
  config: OverallScoreWeightedMean,
  metricNames: Set<string>,
): OverallScoreWeightedMean | OverallScoreMean => {
  const remainingWeights = config.weights.filter((weight) => metricNames.has(weight.metricName));

  if (remainingWeights.length === 0) {
    return DEFAULT_OVERALL_SCORE;
  }

  if (remainingWeights.length === config.weights.length) {
    return config;
  }

  return { type: OverallScoreType.WeightedMean, weights: remainingWeights };
};

/**
 * Drop overall-score rows that reference metrics no longer bound.
 * When no metrics remain, or weighted mean has no valid rows left, reset to Mean and clear threshold.
 */
export const sanitizeOverallScoreForMetricNames = (suite: TestSuite, remainingMetricNames: string[]): TestSuite => {
  if (remainingMetricNames.length === 0) {
    return resetOverallScoreDefaults(suite);
  }

  const names = new Set(remainingMetricNames);
  let next = suite;

  if (next.overallScore?.type === OverallScoreType.WeightedMean) {
    const sanitized = filterWeightedMean(next.overallScore, names);
    if (sanitized.type === OverallScoreType.Mean) {
      next = resetOverallScoreDefaults(next);
    } else if (sanitized !== next.overallScore) {
      next = { ...next, overallScore: sanitized };
    }
  }

  if (next.testCaseOverallScore?.type === OverallScoreType.WeightedMean) {
    const sanitized = filterWeightedMean(next.testCaseOverallScore, names);
    if (sanitized !== next.testCaseOverallScore) {
      next = { ...next, testCaseOverallScore: sanitized };
    }
  }

  return next;
};

export const stripMetricFromScoreWeights = (suite: TestSuite, removedMetricName: string): TestSuite => {
  const remainingNames = [
    ...(suite.overallScore?.type === OverallScoreType.WeightedMean
      ? suite.overallScore.weights.map((weight) => weight.metricName)
      : []),
    ...(suite.testCaseOverallScore?.type === OverallScoreType.WeightedMean
      ? suite.testCaseOverallScore.weights.map((weight) => weight.metricName)
      : []),
  ].filter((name) => name !== removedMetricName);

  return sanitizeOverallScoreForMetricNames(suite, remainingNames);
};
