import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';

export const createUpdatedMetricBinding = (
  value: string | object,
  data: MetricBinding,
  field: string,
): MetricBinding => {
  const newData: MetricBinding = {
    ...data,
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
