import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import { jsonSchemaToFields, resolveDef, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
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

/** Types a schema property accepts, without `null`; `undefined` when the property does not restrict its type. */
const collectAcceptedTypes = (def: JSONSchema7Definition, root: JSONSchema7): string[] | undefined => {
  const resolved = resolveDef(def, root);
  if (typeof resolved !== 'object' || resolved == null) {
    return undefined;
  }
  if (resolved.type != null) {
    return (Array.isArray(resolved.type) ? resolved.type : [resolved.type]).filter((type) => type !== 'null');
  }
  const variants = resolved.anyOf ?? resolved.oneOf;
  if (!variants?.length) {
    return undefined;
  }
  const variantTypes = variants.map((variant) => collectAcceptedTypes(variant, root));
  return variantTypes.some((types) => types == null) ? undefined : [...new Set(variantTypes.flat() as string[])];
};

/**
 * Column types an input accepts. An empty list means any type: the schema leaves the property untyped,
 * or a union variant is. Falls back to the field's own type when the schema does not describe it.
 */
export const getInputAcceptedTypes = (field: SchemaFieldRow, inputSchema?: JSONSchema7): string[] => {
  const def = inputSchema?.properties?.[field.name];
  if (def == null) {
    return [field.type];
  }
  return collectAcceptedTypes(def, inputSchema!) ?? [];
};

/** Whether a column of the given type can feed an input that accepts the given types (empty list: any type). */
export const isColumnTypeAccepted = (acceptedTypes: string[], columnType: string): boolean =>
  acceptedTypes.length === 0 || acceptedTypes.some((type) => isTypeCompatible(type, columnType));

/** True when the column bound to an input has a type the input does not accept. */
export const isBindingTypeMismatched = (
  field: SchemaFieldRow,
  binding: MetricBinding | undefined,
  testCaseSchema?: TestCaseSchema[],
  responseColumns?: ResponseColumn[],
  inputSchema?: JSONSchema7,
): boolean => {
  const columnType = getBindingColumnType(binding, testCaseSchema, responseColumns);
  if (columnType == null) {
    return false;
  }
  return !isColumnTypeAccepted(getInputAcceptedTypes(field, inputSchema), columnType);
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
      inputSchema,
    ),
  );
