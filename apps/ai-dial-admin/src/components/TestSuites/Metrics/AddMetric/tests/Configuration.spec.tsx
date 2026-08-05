import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import MetricConfiguration from '../Configuration';
import { MetricBindingType } from '@/src/types/evaluation';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  SelectSize: { Sm: 'Sm' },
  SelectVariant: { Secondary: 'Secondary' },
  DialInput: ({ labelProps, value, onChange, error }: any) => (
    <>
      <input
        role="textbox"
        aria-label={labelProps?.label}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {error ? <span>{error}</span> : null}
    </>
  ),
  DialSelect: ({ value, onChange, options = [] }: any) => (
    <select role="combobox" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((option: { label: string; value: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../Values/SchemaSection', () => ({
  default: ({ title, fields }: any) => (
    <div role="region" aria-label={title}>
      {`fields:${fields?.length ?? 0}`}
    </div>
  ),
}));

vi.mock('../Values/Inputs', () => ({
  default: ({ title, fields }: any) => (
    <div role="region" aria-label={title}>
      {`fields:${fields?.length ?? 0}`}
    </div>
  ),
}));

vi.mock('../Values/Outputs', () => ({
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
    displayName: 'Details Name',
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
    displayName: 'Selected Name',
    description: 'Selected Description',
  };

  const configBindings: MetricBinding[] = [
    { property: 'threshold', source: { $type: MetricBindingType.Constant, value: '1' } },
  ];
  const inputBindings: MetricBinding[] = [
    { property: 'prompt', source: { $type: MetricBindingType.Response, columnName: 'prompt' } },
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

  test('renders plain URLs as clickable links', () => {
    const descriptionWithUrl: Metric = {
      id: 'metric-6',
      name: 'URL Metric',
      description: 'Check this link: https://example.com for more info',
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={descriptionWithUrl} />);

    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders markdown-style links as clickable links', () => {
    const descriptionWithMarkdownLink: Metric = {
      id: 'metric-7',
      name: 'Markdown Link Metric',
      description: 'Check [documentation](https://docs.example.com) for details',
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={descriptionWithMarkdownLink} />);

    const link = screen.getByRole('link', { name: 'documentation' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://docs.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('renders multiple links in description', () => {
    const descriptionWithMultipleLinks: Metric = {
      id: 'metric-8',
      name: 'Multiple Links Metric',
      description:
        'Visit [our site](https://example.com) or check https://docs.example.com and [more info](https://info.example.com)',
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={descriptionWithMultipleLinks} />);

    expect(screen.getByRole('link', { name: 'our site' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://docs.example.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'more info' })).toBeInTheDocument();
  });

  test('renders the condition input with its value and fires onChangeCondition', () => {
    const onChangeCondition = vi.fn();

    render(
      <MetricConfiguration
        metricName="Metric Name"
        selectedMetricDetails={selectedMetricDetails}
        condition="$exists(response.answer)"
        onChangeCondition={onChangeCondition}
      />,
    );

    const conditionInput = screen.getByRole('textbox', { name: TestSuitesI18nKey.Condition });
    expect(conditionInput).toHaveValue('$exists(response.answer)');

    fireEvent.change(conditionInput, { target: { value: '$exists(response.score)' } });
    expect(onChangeCondition).toHaveBeenCalledWith('$exists(response.score)');
  });

  test('shows the condition error when provided', () => {
    render(
      <MetricConfiguration
        metricName="Metric Name"
        selectedMetricDetails={selectedMetricDetails}
        condition="isLastTurn()"
        conditionError={TestSuitesI18nKey.ConditionSystemFunctionUnavailable}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.ConditionSystemFunctionUnavailable)).toBeInTheDocument();
  });
});
