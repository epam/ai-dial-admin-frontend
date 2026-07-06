import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { MetricScoresData } from '../models';
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
    DialAnalyticsBarGroup: ({ title, data, onBarClick }: any) => (
      <div role="group" aria-label={String(title)}>
        {Object.entries(data || {}).map(([name, value]) => (
          <button key={name} onClick={() => onBarClick?.(name, value)}>
            {name}:{String(value)}
          </button>
        ))}
      </div>
    ),
  };
});

const DATA: MetricScoresData = {
  statistics: ['AVG', 'P90'],
  byStatistic: {
    AVG: [
      { name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.8, answer_relevancy: 0.6 } },
      { name: 'aidial_rag_eval.retrieval', bars: { context_recall: 0.9 } },
    ],
    P90: [{ name: 'aidial_rag_eval.generation', bars: { context_to_answer: 0.95 } }],
  },
};

describe('Runs Summary :: MetricScoresSection', () => {
  test('shows a loader while data is null', () => {
    render(<MetricScoresSection data={null} testCaseCount={0} onSelectMetric={vi.fn()} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    expect(screen.getByText('Runs.MetricScoresTitle')).toBeInTheDocument();
  });

  test('renders a bar group per metric prefix with leaf-name bars for the selected statistic', () => {
    render(<MetricScoresSection data={DATA} testCaseCount={0} onSelectMetric={vi.fn()} />);

    const generation = screen.getByRole('group', { name: 'aidial_rag_eval.generation' });
    expect(within(generation).getByText('context_to_answer:0.8')).toBeInTheDocument();
    expect(within(generation).getByText('answer_relevancy:0.6')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'aidial_rag_eval.retrieval' })).toBeInTheDocument();
  });

  test('exposes the statistics as segmented-control tabs, first selected by default', () => {
    render(<MetricScoresSection data={DATA} testCaseCount={0} onSelectMetric={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'AVG' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'P90' })).toHaveAttribute('aria-selected', 'false');
  });

  test('switches the shown statistic values when a tab is selected', () => {
    render(<MetricScoresSection data={DATA} testCaseCount={0} onSelectMetric={vi.fn()} />);

    const before = screen.getByRole('group', { name: 'aidial_rag_eval.generation' });
    expect(within(before).getByText('context_to_answer:0.8')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'P90' }));

    const after = screen.getByRole('group', { name: 'aidial_rag_eval.generation' });
    expect(within(after).getByText('context_to_answer:0.95')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'aidial_rag_eval.retrieval' })).not.toBeInTheDocument();
  });

  test('selects the full metric name when a bar is clicked', () => {
    const onSelectMetric = vi.fn();
    render(<MetricScoresSection data={DATA} testCaseCount={0} onSelectMetric={onSelectMetric} />);

    fireEvent.click(screen.getByText('context_to_answer:0.8'));

    expect(onSelectMetric).toHaveBeenCalledWith('aidial_rag_eval.generation.context_to_answer');
  });

  test('shows an empty message when there are no metric scores', () => {
    render(
      <MetricScoresSection data={{ statistics: [], byStatistic: {} }} testCaseCount={0} onSelectMetric={vi.fn()} />,
    );

    expect(screen.getByText('Runs.NoMetricScores')).toBeInTheDocument();
  });
});
