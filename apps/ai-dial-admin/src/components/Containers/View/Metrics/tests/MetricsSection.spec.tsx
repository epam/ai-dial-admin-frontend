import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import MetricsSection from '@/src/components/Containers/View/Metrics/MetricsSection';
import { MetricCardKind, MetricsSectionConfig } from '@/src/components/Containers/View/Metrics/models';
import { DeploymentMetrics } from '@/src/models/deployments/metrics';

const SECTION: MetricsSectionConfig = {
  titleKey: 'Section.Title',
  cards: [
    { kind: MetricCardKind.Single, labelKey: 'Card.Single', unit: 's', getValue: () => 12 },
    {
      kind: MetricCardKind.Ratio,
      labelKey: 'Card.Ratio',
      getNumerator: () => 2,
      getDenominator: () => 3,
    },
    {
      kind: MetricCardKind.Ratio,
      labelKey: 'Card.RatioWithUnit',
      getNumerator: () => 5,
      getDenominator: () => 20,
      getUnit: () => 'GB',
    },
  ],
};

const METRICS = {} as DeploymentMetrics;

describe('MetricsSection', () => {
  test('renders the section title and one card per config entry', () => {
    render(<MetricsSection section={SECTION} metrics={METRICS} loading={false} />);
    expect(screen.getByText('Section.Title')).toBeInTheDocument();
    expect(screen.getByText('Card.Single')).toBeInTheDocument();
    expect(screen.getByText('Card.Ratio')).toBeInTheDocument();
  });

  test('renders the single value with its unit and the ratio numerator/denominator', () => {
    render(<MetricsSection section={SECTION} metrics={METRICS} loading={false} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('s')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders a ratio card unit when getUnit is provided', () => {
    render(<MetricsSection section={SECTION} metrics={METRICS} loading={false} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('GB')).toBeInTheDocument();
  });
});
