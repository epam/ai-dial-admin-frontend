import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MetricTrendCard from '@/src/components/TestSuites/Trends/MetricTrendCard';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

vi.mock('echarts-for-react', () => ({
  default: ({ option }: { option: { series?: { name: string }[] } }) => (
    <div data-chart-series={(option.series ?? []).map((series) => series.name).join(',')} />
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('MetricTrendCard', () => {
  const runOrder: TrendsRunPoint[] = [
    { runId: 'r1', runName: 'Run1', computedAtMs: 1, overallScore: 0.4, durationMs: 100, isFailed: false },
    { runId: 'r2', runName: 'Run2', computedAtMs: 2, overallScore: 0.5, durationMs: 120, isFailed: true },
  ];

  const group: MetricTrendGroup = {
    name: 'ragas',
    series: [
      { name: 'faithfulness', color: '#30E070', values: [0.5, 0.7] },
      { name: 'precision', color: '#D4BE3A', values: [0.4, 0.6] },
    ],
  };

  test('renders group title and legend chips', () => {
    render(<MetricTrendCard group={group} runOrder={runOrder} />);
    expect(screen.getByText('ragas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'faithfulness' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'precision' })).toBeInTheDocument();
  });

  test('toggles series visibility when a legend chip is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<MetricTrendCard group={group} runOrder={runOrder} />);

    expect(container.querySelector('[data-chart-series]')?.getAttribute('data-chart-series')).toBe(
      'faithfulness,precision',
    );

    await user.click(screen.getByRole('button', { name: 'faithfulness' }));

    expect(container.querySelector('[data-chart-series]')?.getAttribute('data-chart-series')).toBe('precision');
  });
});
