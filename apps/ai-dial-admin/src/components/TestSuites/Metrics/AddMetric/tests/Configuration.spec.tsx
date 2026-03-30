import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
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
  DialLinkButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
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

  test('shows "Show more" button for long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const metricWithLongDescription: Metric = {
      id: 'metric-3',
      name: 'Long Description Metric',
      description: longDescription,
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={metricWithLongDescription} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore })).toBeInTheDocument();
  });

  test('does not show "Show more" button for short descriptions', () => {
    const shortDescription = 'Short description';
    const metricWithShortDescription: Metric = {
      id: 'metric-4',
      name: 'Short Description Metric',
      description: shortDescription,
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={metricWithShortDescription} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ShowMore })).not.toBeInTheDocument();
  });

  test('toggles description expansion when "Show more/less" button is clicked', () => {
    const longDescription = 'A'.repeat(200);
    const metricWithLongDescription: Metric = {
      id: 'metric-5',
      name: 'Toggle Metric',
      description: longDescription,
    };

    render(<MetricConfiguration metricName="Metric Name" selectedMetric={metricWithLongDescription} />);

    const button = screen.getByRole('button', { name: ButtonsI18nKey.ShowMore });
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore })).toBeInTheDocument();
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
});
