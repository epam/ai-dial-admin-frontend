import { fireEvent, render, screen } from '@testing-library/react';
import { FC, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { MetricOption, MetricScoresData } from '../models';
import DistributionSection from '../DistributionSection';

const executeStructuredQueryMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
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
    DialAnalyticsHistogram: ({ valueTitle, values }: any) => (
      <div role="figure" aria-label={String(valueTitle)}>
        histogram:{(values || []).length}
      </div>
    ),
    DialAnalyticsCard: ({ title, value }: any) => (
      <div role="region" aria-label={String(title)}>
        {value}
      </div>
    ),
  };
});

const METRIC_OPTIONS: MetricOption[] = [
  { name: 'DeepEval: Answer Relevancy.score', field: 'metric::DeepEval: Answer Relevancy::score', computationId: 'c1' },
];

const METRIC_SCORES: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG', 'MAX'],
  byStatistic: {
    AVG: [{ name: 'DeepEval: Answer Relevancy', bars: { score: 0.8 } }],
    MAX: [{ name: 'DeepEval: Answer Relevancy', bars: { score: 1 } }],
  },
};

const HISTOGRAM_ROWS = {
  rows: [{ value: 0 }, { value: 0.2 }, { value: 0.5 }, { value: 0.9 }, { value: 1 }],
};

/** Wraps the controlled section so the lifted `selectedMetricName` behaves like the parent's. */
const ControlledDistributionSection: FC<{ metricOptions?: MetricOption[]; metricScores?: MetricScoresData | null }> = ({
  metricOptions = METRIC_OPTIONS,
  metricScores = METRIC_SCORES,
}) => {
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  return (
    <DistributionSection
      run={{ id: 'run-1' } as any}
      metricOptions={metricOptions}
      metricScores={metricScores}
      selectedMetricName={selectedMetricName}
      onSelectMetric={setSelectedMetricName}
    />
  );
};

describe('Runs Summary :: DistributionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeStructuredQueryMock.mockResolvedValue(HISTOGRAM_ROWS);
  });

  test('prompts to pick a metric before any selection', () => {
    render(<ControlledDistributionSection />);

    expect(screen.getByText('Runs.DistributionTitle')).toBeInTheDocument();
    expect(screen.getByText('Runs.SelectMetricToSeeDistribution')).toBeInTheDocument();
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('fetches the distribution and renders histogram + stat cards on selection', async () => {
    render(<ControlledDistributionSection />);

    fireEvent.change(screen.getByLabelText('select-Runs.Metric'), {
      target: { value: 'DeepEval: Answer Relevancy.score' },
    });

    const histogram = await screen.findByRole('figure', { name: 'Runs.DistributionValueTitle' });
    expect(histogram).toHaveTextContent('histogram:5'); // one value per fetched row

    const avgCard = screen.getByRole('region', { name: 'AVG' });
    expect(avgCard).toHaveTextContent('0.8');
    expect(screen.getByRole('region', { name: 'MAX' })).toHaveTextContent('1');
  });

  test('queries the distribution with the selected metric field', async () => {
    render(<ControlledDistributionSection />);

    fireEvent.change(screen.getByLabelText('select-Runs.Metric'), {
      target: { value: 'DeepEval: Answer Relevancy.score' },
    });

    await screen.findByRole('figure', { name: 'Runs.DistributionValueTitle' });

    const query = executeStructuredQueryMock.mock.calls[0][0] as StructuredQuery;
    const field = (query.select?.[0]?.expr as any)?.name;
    expect(field).toBe('metric::DeepEval: Answer Relevancy::score');
  });
});
