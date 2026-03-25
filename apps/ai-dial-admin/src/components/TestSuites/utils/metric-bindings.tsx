import { JSONSchema7 } from 'json-schema';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import { getSchemaDefaults } from '@/src/utils/schema';

export const createUpdatedMetricBinding = (
  value: string | object,
  data: MetricBinding,
  field: string,
): MetricBinding => {
  const newData: MetricBinding = {
    property: data.property,
    source: { ...data.source },
  };
  if (field === 'source.$type') {
    newData.source.$type = value as string;
    newData.source.value = void 0;
    newData.source.columnName = void 0;
  } else {
    if (data.source.$type === MetricBindingType.Constant) {
      newData.source.value = value as string;
      newData.source.columnName = void 0;
    } else {
      newData.source.columnName = value as string;
      newData.source.value = void 0;
    }
  }
  return newData;
};

const createDefaultBinding = (property: string): MetricBinding => ({
  property,
  source: {
    $type: 'Constant',
    value: '',
  },
});

export const generateMetricBindingsRowData = (
  configBindings: MetricBinding[],
  inputBindings: MetricBinding[],
  configSchema: SchemaFieldRow[],
  inputSchema: SchemaFieldRow[],
): MetricBinding[] => {
  const configRows = configSchema.map((field) => {
    const existing = configBindings.find((b) => b.property === field.name);
    return existing ?? createDefaultBinding(field.name);
  });

  const inputRows = inputSchema.map((field) => {
    const existing = inputBindings.find((b) => b.property === field.name);
    return existing ?? createDefaultBinding(field.name);
  });

  return [...configRows, ...inputRows];
};

export const generateMetricDefaultInputBindings = (schema: JSONSchema7) => {
  return Object.entries(getSchemaDefaults(schema ?? {})).map(([key, value]) => ({
    property: key,
    source: {
      $type: 'Constant',
      value: value as string,
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
