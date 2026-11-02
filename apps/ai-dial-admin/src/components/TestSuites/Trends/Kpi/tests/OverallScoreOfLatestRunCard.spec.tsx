import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import OverallScoreOfLatestRunCard from '@/src/components/TestSuites/Trends/Kpi/OverallScoreOfLatestRunCard';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Tooltip: ({
    children,
    tooltip,
    hideTooltip,
  }: {
    children: React.ReactNode;
    tooltip?: React.ReactNode;
    hideTooltip?: boolean;
  }) => (
    <div data-testid="kpi-tooltip" data-hide={String(!!hideTooltip)}>
      {!hideTooltip && <span data-testid="kpi-tooltip-content">{tooltip}</span>}
      {children}
    </div>
  ),
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  BadgeVariant: { Outlined: 'outlined', Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red', Blue: 'blue' },
}));

const runOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: 0.46, durationMs: 100, isFailed: false },
  {
    runId: 'run-2',
    runName: 'Run#2',
    computedAtMs: 2,
    overallScore: 0.58,
    overallScoreThreshold: 0.6,
    durationMs: 200,
    isFailed: false,
  },
];

describe('OverallScoreOfLatestRunCard', () => {
  test('shows latest overall score and delta vs previous run', () => {
    render(
      <OverallScoreOfLatestRunCard
        runOrder={runOrder}
        selectedTestSuite={{ id: 'suite-1', overallScoreThreshold: 0.4 } as TestSuite}
        metricCount={2}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreOfLatestRun)).toBeInTheDocument();
    expect(screen.getByText('0.580')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsDeltaVsPrev)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)).toBeInTheDocument();
  });

  test('shows above/below threshold tip on the score when suite has a threshold', () => {
    render(
      <OverallScoreOfLatestRunCard
        runOrder={runOrder}
        selectedTestSuite={{ id: 'suite-1', overallScoreThreshold: 0.4 } as TestSuite}
        metricCount={2}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip)).toBeInTheDocument();
  });

  test('hides the score tip when latest run snapshot has no threshold', () => {
    render(
      <OverallScoreOfLatestRunCard
        runOrder={runOrder.map((point) => ({ ...point, overallScoreThreshold: null }))}
        selectedTestSuite={{ id: 'suite-1', overallScoreThreshold: 0.6 } as TestSuite}
        metricCount={2}
      />,
    );

    const scoreTip = screen.getAllByTestId('kpi-tooltip').find((node) => node.textContent?.includes('0.580'));
    expect(scoreTip).toHaveAttribute('data-hide', 'true');
  });

  test('omits threshold glyph when latest run snapshot has no threshold', () => {
    const { container } = render(
      <OverallScoreOfLatestRunCard
        runOrder={runOrder.map((point) => ({ ...point, overallScoreThreshold: null }))}
        selectedTestSuite={{ id: 'suite-1', overallScoreThreshold: 0.6 } as TestSuite}
        metricCount={2}
      />,
    );

    expect(container.querySelector('.bg-score-abs-11')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-score-abs-00')).not.toBeInTheDocument();
  });
});
