import { fireEvent, render, screen } from '@testing-library/react';
import { FC, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import DistributionSection from '../DistributionSection';

const executeStructuredQueryMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialSelect: ({ options, value, onChange, prefix }: any) => (
      <select aria-label={`select-${prefix ?? ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" />
        {(options || []).map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
    DialAnalyticsHistogram: ({ valueTitle, values, compareValues, valueSetLabel, compareValueSetLabel }: any) => (
      <div role="figure" aria-label={String(valueTitle)}>
        histogram:{(values || []).length}/{(compareValues || []).length}
        <span>{valueSetLabel}</span>
        <span>{compareValueSetLabel}</span>
      </div>
    ),
    DialAnalyticsCard: ({ title, compareValues, delta }: any) => (
      <div role="region" aria-label={String(title)}>
        {delta != null && <span>delta:{delta}</span>}
        {(compareValues || []).map((item: any, index: number) => (
          <span key={index}>
            {item.title}:{item.value}
          </span>
        ))}
      </div>
    ),
  };
});

const METRIC_OPTIONS: MetricOption[] = [
  { name: 'ragas.context_recall', field: 'metric::ragas::context_recall', computationId: 'c1' },
];

const PRIMARY_SCORES: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG'],
  byStatistic: {
    AVG: [{ name: 'ragas', bars: { context_recall: 0.8 } }],
  },
};

const COMPARED_SCORES: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG'],
  byStatistic: {
    AVG: [{ name: 'ragas', bars: { context_recall: 0.3 } }],
  },
};

const Controlled: FC = () => {
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  return (
    <DistributionSection
      primaryRunId="run-1"
      comparedRunId="run-2"
      primaryRunName="Run #316"
      comparedRunName="Run #315"
      metricOptions={METRIC_OPTIONS}
      primaryMetricScores={PRIMARY_SCORES}
      comparedMetricScores={COMPARED_SCORES}
      selectedMetricName={selectedMetricName}
      onSelectMetric={setSelectedMetricName}
    />
  );
};

describe('Compare Summary :: DistributionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeStructuredQueryMock.mockResolvedValue({
      rows: [{ value: 0.2 }, { value: 0.8 }],
    });
  });

  test('prompts to pick a metric before selection', () => {
    render(<Controlled />);

    expect(screen.getByText('Runs.SelectMetricToSeeDistribution')).toBeInTheDocument();
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('fetches both runs and renders compare histogram + dual cards', async () => {
    render(<Controlled />);

    fireEvent.change(screen.getByLabelText('select-Runs.Metric'), {
      target: { value: 'ragas.context_recall' },
    });

    const histogram = await screen.findByRole('figure', { name: 'Runs.DistributionValueTitle' });
    expect(histogram).toHaveTextContent('histogram:2/2');
    expect(histogram).toHaveTextContent('Run #316');
    expect(histogram).toHaveTextContent('Run #315');
    expect(executeStructuredQueryMock).toHaveBeenCalledTimes(2);

    const avgCard = screen.getByRole('region', { name: 'AVG' });
    expect(avgCard).toHaveTextContent('Run #316:0.8');
    expect(avgCard).toHaveTextContent('Run #315:0.3');
    expect(avgCard).toHaveTextContent('delta:-0.5');
  });
});
