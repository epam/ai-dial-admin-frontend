import { fireEvent, render, screen, within } from '@testing-library/react';
import { FC, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { MetricScoresData } from '@/src/components/Runs/Summary/models';
import MetricScoresSection from '../MetricScoresSection';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
    DialSegmentedControl: ({ options, value, onChange }: any) => (
      <div role="tablist">
        {(options || []).map((option: any) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    ),
    DialAnalyticsBarGroup: ({ title, data, compareData, compareLabels }: any) => (
      <div role="group" aria-label={String(title)}>
        <span>{compareLabels?.[0]}</span>
        <span>{compareLabels?.[1]}</span>
        {Object.entries(data || {}).map(([name, value]) => (
          <span key={`p-${name}`}>
            p:{name}:{String(value)}
          </span>
        ))}
        {Object.entries(compareData || {}).map(([name, value]) => (
          <span key={`c-${name}`}>
            c:{name}:{String(value)}
          </span>
        ))}
      </div>
    ),
  };
});

const PRIMARY: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG', 'P90'],
  byStatistic: {
    AVG: [{ name: 'ragas', bars: { context_recall: 0.8 } }],
    P90: [{ name: 'ragas', bars: { context_recall: 0.95 } }],
  },
};

const COMPARED: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG', 'P90'],
  byStatistic: {
    AVG: [{ name: 'ragas', bars: { context_recall: 0.3 } }],
    P90: [{ name: 'ragas', bars: { context_recall: 0.4 } }],
  },
};

const Controlled: FC<{ primary?: MetricScoresData | null; compared?: MetricScoresData | null }> = ({
  primary = PRIMARY,
  compared = COMPARED,
}) => {
  const [selectedStatistic, setSelectedStatistic] = useState<string | null>('AVG');
  return (
    <MetricScoresSection
      primaryData={primary}
      comparedData={compared}
      primaryRunName="Run #316"
      comparedRunName="Run #315"
      selectedStatistic={selectedStatistic}
      onSelectStatistic={setSelectedStatistic}
    />
  );
};

describe('Compare Summary :: MetricScoresSection', () => {
  test('shows a loader while either side is null', () => {
    render(
      <MetricScoresSection
        primaryData={null}
        comparedData={COMPARED}
        primaryRunName="Run #316"
        comparedRunName="Run #315"
        selectedStatistic={null}
        onSelectStatistic={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
  });

  test('renders compare bars for the selected statistic', () => {
    render(<Controlled />);

    const group = screen.getByRole('group', { name: 'ragas' });
    expect(within(group).getByText('p:context_recall:0.8')).toBeInTheDocument();
    expect(within(group).getByText('c:context_recall:0.3')).toBeInTheDocument();
    expect(within(group).getByText('Run #316')).toBeInTheDocument();
    expect(within(group).getByText('Run #315')).toBeInTheDocument();
  });

  test('switches statistic values via segmented control', () => {
    render(<Controlled />);

    fireEvent.click(screen.getByRole('tab', { name: 'P90' }));

    const group = screen.getByRole('group', { name: 'ragas' });
    expect(within(group).getByText('p:context_recall:0.95')).toBeInTheDocument();
    expect(within(group).getByText('c:context_recall:0.4')).toBeInTheDocument();
  });
});
