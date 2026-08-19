import { fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, FC, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { MetricScoresData } from '@/src/components/Runs/Summary/models';
import MetricScoresSection from '../MetricScoresSection';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => {
      return createElement('div', { 'aria-label': `loading-${size}` });
    },
    DialSegmentedControl: ({ options, value, onChange }: any) => {
      return createElement(
        'div',
        { role: 'tablist' },
        ...(options || []).map((option: any) =>
          createElement(
            'button',
            {
              key: option.value,
              role: 'tab',
              'aria-selected': option.value === value,
              onClick: () => onChange(option.value),
            },
            option.label,
          ),
        ),
      );
    },
    DialAnalyticsBarGroup: ({ title, data, compareData, compareLabels, barDescriptions, onBarClick }: any) => {
      return createElement(
        'div',
        { role: 'group', 'aria-label': String(title) },
        createElement('span', null, compareLabels?.[0]),
        createElement('span', null, compareLabels?.[1]),
        ...Object.entries(data || {}).map(([name, value]) =>
          createElement(
            'button',
            {
              key: `p-${name}`,
              type: 'button',
              title: String(barDescriptions?.[name] ?? ''),
              onClick: () => onBarClick?.(name, value),
            },
            `p:${name}:${String(value)}`,
          ),
        ),
        ...Object.entries(compareData || {}).map(([name, value]) =>
          createElement(
            'button',
            {
              key: `c-${name}`,
              type: 'button',
              title: String(barDescriptions?.[name] ?? ''),
              onClick: () => onBarClick?.(name, value),
            },
            `c:${name}:${String(value)}`,
          ),
        ),
      );
    },
  };
});

const PRIMARY: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG', 'P90'],
  byStatistic: {
    AVG: [
      { name: 'ragas', bars: { context_recall: 0.8 }, barDescriptions: { context_recall: 'Primary recall tooltip' } },
    ],
    P90: [
      { name: 'ragas', bars: { context_recall: 0.95 }, barDescriptions: { context_recall: 'Primary recall tooltip' } },
    ],
  },
};

const COMPARED: MetricScoresData = {
  overallScore: null,
  statistics: ['AVG', 'P90'],
  byStatistic: {
    AVG: [
      { name: 'ragas', bars: { context_recall: 0.3 }, barDescriptions: { context_recall: 'Compared recall tooltip' } },
    ],
    P90: [
      { name: 'ragas', bars: { context_recall: 0.4 }, barDescriptions: { context_recall: 'Compared recall tooltip' } },
    ],
  },
};

const Controlled: FC<{
  primary?: MetricScoresData | null;
  compared?: MetricScoresData | null;
  onSelectMetric?: (name: string) => void;
}> = ({ primary = PRIMARY, compared = COMPARED, onSelectMetric = vi.fn() }) => {
  const [selectedStatistic, setSelectedStatistic] = useState<string | null>('AVG');
  return (
    <MetricScoresSection
      primaryData={primary}
      comparedData={compared}
      primaryRunName="Run #316"
      comparedRunName="Run #315"
      selectedStatistic={selectedStatistic}
      onSelectStatistic={setSelectedStatistic}
      onSelectMetric={onSelectMetric}
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
        onSelectMetric={vi.fn()}
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

  test('selects the full metric name when a bar is clicked', () => {
    const onSelectMetric = vi.fn();
    render(<Controlled onSelectMetric={onSelectMetric} />);

    fireEvent.click(screen.getByText('p:context_recall:0.8'));

    expect(onSelectMetric).toHaveBeenCalledWith('ragas.context_recall');
  });
});
