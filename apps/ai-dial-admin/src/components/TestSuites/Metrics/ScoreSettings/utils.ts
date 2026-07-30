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
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
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
