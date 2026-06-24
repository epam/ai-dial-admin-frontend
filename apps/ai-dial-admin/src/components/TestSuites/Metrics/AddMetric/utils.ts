import { JSONSchema7 } from 'json-schema';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { CSV_COLUMN_SEPARATOR } from '@/src/constants/eval-export';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';

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
