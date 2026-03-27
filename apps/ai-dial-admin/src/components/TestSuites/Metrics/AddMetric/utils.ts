import { JSONSchema7 } from 'json-schema';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
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

  const allBindings = [...configBindings, ...inputBindings];

  const selectedMetricParameters = jsonSchemaToFields(configSchema, configSchema);
  const selectedMetricInputs = jsonSchemaToFields(inputSchema, inputSchema);

  const requiredConfigFields = selectedMetricParameters.filter((field) => field.required).map((field) => field.name);
  const requiredInputFields = selectedMetricInputs.filter((field) => field.required).map((field) => field.name);
  const requiredFields = [...requiredConfigFields, ...requiredInputFields];

  for (const field of requiredFields) {
    const binding = allBindings.find((item) => item.property === field);
    if (!binding) {
      return false;
    }
  }

  for (const binding of allBindings) {
    if (binding.source.$type === MetricBindingType.Constant) {
      if (binding.source.value == null || binding.source.value === '') {
        return false;
      }
    } else {
      if (!binding.source.columnName || binding.source.columnName === '') {
        return false;
      }
    }
  }

  return true;
};
