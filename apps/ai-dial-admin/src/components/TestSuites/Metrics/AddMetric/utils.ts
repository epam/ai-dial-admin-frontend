import { JSONSchema7 } from 'json-schema';

import { jsonSchemaToFields, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { CSV_COLUMN_SEPARATOR } from '@/src/constants/eval-export';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { ResponseColumn, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { MetricBindingType } from '@/src/types/evaluation';

import { SYSTEM_FUNCTION_CONDITION_REGEX } from './constants';
import { isTypeCompatible } from './Values/typedSelectOptions';

export const validateMetricBindings = (
  metricName: string | undefined,
  configBindings: MetricBinding[],
  inputBindings: MetricBinding[],
  configSchema?: JSONSchema7,
  inputSchema?: JSONSchema7,
): boolean => {
  if (!metricName?.trim()) {
    return false;
  }

  if (metricName.includes(CSV_COLUMN_SEPARATOR)) {
    return false;
  }

  const allBindings = [...configBindings, ...inputBindings];

  const selectedMetricParameters = jsonSchemaToFields(configSchema, configSchema);
  const selectedMetricInputs = jsonSchemaToFields(inputSchema, inputSchema);

  const requiredConfigFields = selectedMetricParameters.filter((field) => field.required).map((field) => field.name);
  const requiredInputFields = selectedMetricInputs.filter((field) => field.required).map((field) => field.name);
  const requiredFields = [...requiredConfigFields, ...requiredInputFields];

  // Only validate required fields
  for (const field of requiredFields) {
    const binding = allBindings.find((item) => item.property === field);
    if (!binding) {
      return false;
    }

    // Validate the binding value for required fields
    if (binding.source.$type === MetricBindingType.Constant) {
      if (
        binding.source.value == null ||
        (typeof binding.source.value === 'string' && binding.source.value.trim() === '')
      ) {
        return false;
      }
    } else {
      if (!binding.source.columnName || binding.source.columnName.trim() === '') {
        return false;
      }
    }
  }

  return true;
};

export const isReservedSystemFunctionCondition = (condition?: string): boolean => {
  const trimmed = condition?.trim();
  return !!trimmed && SYSTEM_FUNCTION_CONDITION_REGEX.test(trimmed);
};

export const getBindingColumnType = (
  binding: MetricBinding | undefined,
  testCaseSchema: TestCaseSchema[] = [],
  responseColumns: ResponseColumn[] = [],
): string | undefined => {
  const columnName = binding?.source.columnName;
  if (columnName == null) {
    return undefined;
  }
  if (binding?.source.$type === MetricBindingType.TestCase) {
    return testCaseSchema.find((item) => item.name === columnName)?.type;
  }
  if (binding?.source.$type === MetricBindingType.Response) {
    return responseColumns.find((item) => item.name === columnName)?.type;
  }
  return undefined;
};

/** True when the column bound to an input has a type the input does not accept. */
export const isBindingTypeMismatched = (
  field: SchemaFieldRow,
  binding: MetricBinding | undefined,
  testCaseSchema?: TestCaseSchema[],
  responseColumns?: ResponseColumn[],
): boolean => {
  const columnType = getBindingColumnType(binding, testCaseSchema, responseColumns);
  return columnType != null && !isTypeCompatible(field.type, columnType);
};

export const hasInputTypeMismatch = (
  inputBindings: MetricBinding[],
  inputSchema?: JSONSchema7,
  testCaseSchema?: TestCaseSchema[],
  responseColumns?: ResponseColumn[],
): boolean =>
  jsonSchemaToFields(inputSchema, inputSchema).some((field) =>
    isBindingTypeMismatched(
      field,
      inputBindings.find((binding) => binding.property === field.name),
      testCaseSchema,
      responseColumns,
    ),
  );
