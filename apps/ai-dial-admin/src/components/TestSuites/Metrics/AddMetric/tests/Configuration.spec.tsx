import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import MetricConfiguration from '../Configuration';
import { MetricBindingType } from '@/src/types/evaluation';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialInput: ({ labelProps, value, onChange }: any) => (
    <input
      role="textbox"
      aria-label={labelProps?.label}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock('../SchemaSection', () => ({
  default: ({ title, fields }: any) => (
    <div role="region" aria-label={title}>
      {`fields:${fields?.length ?? 0}`}
    </div>
  ),
}));

vi.mock('../Output', () => ({
  default: ({ title, fields }: any) => (
    <div role="region" aria-label={title}>
      {`fields:${fields?.length ?? 0}`}
    </div>
  ),
}));

describe('MetricConfiguration', () => {
  const selectedMetricDetails: Metric = {
    id: 'metric-1',
    name: 'Details Name',
    description: 'Details Description',
    configSchema: {
      type: 'object',
      properties: { threshold: { type: 'number' } },
    },
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string' } },
    },
    outputSchema: {
      type: 'object',
      properties: { score: { type: 'number' } },
    },
  };

  const selectedMetric: Metric = {
    id: 'metric-2',
    name: 'Selected Name',
    description: 'Selected Description',
  };

  const configBindings: MetricBinding[] = [
    { property: 'threshold', source: { $type: MetricBindingType.Constant, value: '1' } },
  ];
  const inputBindings: MetricBinding[] = [
    { property: 'prompt', source: { $type: MetricBindingType.Column, columnName: 'prompt' } },
  ];

  test('renders selected metric name and description', () => {
    render(
      <MetricConfiguration
        metricName="Metric Name"
        selectedMetric={selectedMetric}
        selectedMetricDetails={selectedMetricDetails}
      />,
    );

    expect(screen.getByText('Selected Name')).toBeInTheDocument();
    expect(screen.getByText('Selected Description')).toBeInTheDocument();
  });

  test('falls back to details name and description when selected metric is not provided', () => {
    render(<MetricConfiguration metricName="Metric Name" selectedMetricDetails={selectedMetricDetails} />);

    expect(screen.getByText('Details Name')).toBeInTheDocument();
    expect(screen.getByText('Details Description')).toBeInTheDocument();
  });

  test('calls onChangeName when display name input changes', () => {
    const onChangeName = vi.fn();

    render(
      <MetricConfiguration
        metricName="Metric Name"
        onChangeName={onChangeName}
        selectedMetricDetails={selectedMetricDetails}
      />,
    );

    const input = screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayName });
    fireEvent.change(input, { target: { value: 'Updated Metric Name' } });

    expect(onChangeName).toHaveBeenCalledWith('Updated Metric Name');
  });

  test('renders schema sections for configuration, inputs, and outputs', () => {
    render(
      <MetricConfiguration
        metricName="Metric Name"
        selectedMetricDetails={selectedMetricDetails}
        configBindings={configBindings}
        inputBindings={inputBindings}
      />,
    );

    expect(screen.getByRole('region', { name: TestSuitesI18nKey.Configuration })).toHaveTextContent('fields:1');
    expect(screen.getByRole('region', { name: TestSuitesI18nKey.Inputs })).toHaveTextContent('fields:1');
    expect(screen.getByRole('region', { name: TestSuitesI18nKey.Outputs })).toHaveTextContent('fields:1');
  });
});
