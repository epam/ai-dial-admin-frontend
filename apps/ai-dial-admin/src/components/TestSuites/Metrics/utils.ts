import { Metric, MetricBinding } from '@/src/models/evaluation/metric';

export const formatBindingValue = (value: unknown): string => {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => formatBindingValue(item)).join(', ')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return `{${entries.map(([key, item]) => `${key}: ${formatBindingValue(item)}`).join(', ')}}`;
  }

  return String(value);
};

export const getBindingDisplayValue = (binding: MetricBinding): string => {
  const formattedValue = formatBindingValue(binding.source.value);

  if (formattedValue !== '') {
    return formattedValue;
  }

  const columnName = binding.source.columnName;
  if (columnName != null && columnName !== '') {
    return String(columnName);
  }

  return '-';
};

export const mergeMetricsWithDeclarations = (metrics: Metric[], declarations: Metric[]): Metric[] => {
  const declarationsById = new Map(declarations.map((declaration) => [declaration.id, declaration]));

  return metrics.map((metric) => ({
    ...metric,
    description: metric.description || declarationsById.get(metric.metricDeclarationId ?? '')?.description,
  }));
};

export const mergeMetricsWithOutputSchemas = (
  metrics: Metric[],
  outputSchemasById: Map<string, Metric['outputSchema']>,
): Metric[] =>
  metrics.map((metric) => ({
    ...metric,
    outputSchema: metric.outputSchema?.properties
      ? metric.outputSchema
      : outputSchemasById.get(metric.id ?? '') || metric.outputSchema,
  }));
