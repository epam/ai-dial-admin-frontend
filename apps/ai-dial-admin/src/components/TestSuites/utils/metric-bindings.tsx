import { JSONSchema7 } from 'json-schema';

import { Metric, MetricBinding, BindingSourceValue } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import { getSchemaDefaults } from '@/src/utils/schema';

export const generateMetricDefaultInputBindings = (schema: JSONSchema7) => {
  return Object.entries(getSchemaDefaults(schema ?? {})).map(([key, value]) => ({
    property: key,
    source: {
      $type: MetricBindingType.Constant,
      value: value as BindingSourceValue,
    },
  }));
};

export const generateMetricDefaultBindings = (
  name: string,
  details: Metric,
  configBindings: MetricBinding[],
  inputBindings: MetricBinding[],
) => {
  return {
    name,
    metricDeclarationId: details?.metricDeclarationId,
    metricDeclarationVersionId: details?.id,
    inputBindings:
      inputBindings.length > 0 ? inputBindings : generateMetricDefaultInputBindings(details.inputSchema ?? {}),
    configBindings:
      configBindings.length > 0 ? configBindings : generateMetricDefaultInputBindings(details.configSchema ?? {}),
  };
};
