import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import Results from '../Results';

describe('Results', () => {
  test('renders Results heading', () => {
    const selectedMetric: Metric = {
      id: 'metric-1',
      name: 'Test Metric',
      metricDeclarationVersion: {},
    };

    render(<Results selectedMetric={selectedMetric} />);

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.Results })).toBeInTheDocument();
  });

  test('renders no result items when metric has no outputSchema', () => {
    const selectedMetric: Metric = {
      id: 'metric-1',
      name: 'Test Metric',
      metricDeclarationVersion: {},
    };

    render(<Results selectedMetric={selectedMetric} />);

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.Results })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  test('renders no result items when outputSchema is undefined', () => {
    const selectedMetric: Metric = {
      id: 'metric-1',
      metricDeclarationVersion: { outputSchema: undefined },
    };

    const { container } = render(<Results selectedMetric={selectedMetric} />);

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.Results })).toBeInTheDocument();
    const resultList = container.querySelector('.flex.flex-col.gap-y-2');
    expect(resultList).toBeInTheDocument();
    expect(resultList?.children.length).toBe(0);
  });

  test('renders result items when outputSchema has properties', () => {
    const selectedMetric: Metric = {
      id: 'metric-1',
      name: 'Test Metric',
      metricDeclarationVersion: {
        outputSchema: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'Evaluation score' },
            passed: { type: 'boolean', description: 'Whether the test passed' },
          },
        },
      },
    };

    render(<Results selectedMetric={selectedMetric} />);

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.Results })).toBeInTheDocument();
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByText('Evaluation score')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('Whether the test passed')).toBeInTheDocument();
  });
});
