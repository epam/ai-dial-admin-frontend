import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';

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
