import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MetricTrendCard from '@/src/components/TestSuites/Trends/MetricTrends/MetricTrendCard';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';

vi.mock('echarts-for-react', () => ({
  default: ({ option }: { option: { series?: { name: string; lineStyle?: { color: string } }[] } }) => (
    <div
      data-chart-series={(option.series ?? []).map((series) => series.name).join(',')}
      data-chart-colors={(option.series ?? []).map((series) => series.lineStyle?.color ?? '').join(',')}
    />
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Tag: ({
    label,
    onClick,
    selected,
    style,
    icon,
  }: {
    label: string;
    onClick?: () => void;
    selected?: boolean;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
  }) => (
    <span role="button" aria-pressed={selected} onClick={onClick} style={style}>
      {icon}
      {label}
    </span>
  ),
  TagAppearance: { Selectable: 'selectable', Outlined: 'outlined' },
  Tooltip: ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => (
    <div data-testid="run-label-tooltip" data-tooltip={tooltip}>
      {children}
    </div>
  ),
}));

describe('MetricTrendCard', () => {
  afterEach(() => {
    vi.mocked(useTheme).mockReturnValue({
      currentTheme: EDITOR_THEMES.dark,
      setTheme: vi.fn(),
      images: null,
    });
  });

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

  test('renders stripped run names under the plot with full names in tooltips', () => {
    render(<MetricTrendCard group={group} runOrder={runOrder} />);
    const tooltips = screen.getAllByTestId('run-label-tooltip');
    expect(tooltips).toHaveLength(2);
    expect(tooltips[0]).toHaveAttribute('data-tooltip', 'Run1');
    expect(tooltips[1]).toHaveAttribute('data-tooltip', 'Run2');
    expect(tooltips[0].querySelector('.line-clamp-2')).toHaveTextContent('1');
    expect(tooltips[1].querySelector('.line-clamp-2')).toHaveTextContent('2');
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
