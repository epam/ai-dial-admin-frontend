import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import OverallScoreOfLatestRunCard from '@/src/components/TestSuites/Trends/Kpi/OverallScoreOfLatestRunCard';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType } from '@/src/models/evaluation/test-suite';

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
    <div role="tooltip" aria-hidden={!!hideTooltip}>
      {!hideTooltip && <span>{tooltip}</span>}
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
    render(<OverallScoreOfLatestRunCard runOrder={runOrder} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreOfLatestRun)).toBeInTheDocument();
    expect(screen.getByText('0.580')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsDeltaVsPrev)).toBeInTheDocument();
    const deltaBadgeTooltip = screen
      .getAllByRole('tooltip', { hidden: true })
      .find((node) => node.textContent?.includes(TestSuitesI18nKey.TrendsDeltaVsPrev));
    expect(deltaBadgeTooltip).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod }),
    ).not.toBeInTheDocument();
  });

  test('shows above/below threshold tip on the score when suite has a threshold', () => {
    render(<OverallScoreOfLatestRunCard runOrder={runOrder} />);

    expect(screen.getByText(TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip)).toBeInTheDocument();
  });

  test('hides the score tip when latest run snapshot has no threshold', () => {
    render(
      <OverallScoreOfLatestRunCard runOrder={runOrder.map((point) => ({ ...point, overallScoreThreshold: null }))} />,
    );

    const scoreTip = screen
      .getAllByRole('tooltip', { hidden: true })
      .find((node) => node.textContent?.includes('0.580'));
    expect(scoreTip).toHaveAttribute('aria-hidden', 'true');
  });

  test('omits threshold glyph when latest run snapshot has no threshold', () => {
    const { container } = render(
      <OverallScoreOfLatestRunCard runOrder={runOrder.map((point) => ({ ...point, overallScoreThreshold: null }))} />,
    );

    expect(container.querySelector('.bg-score-abs-11')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-score-abs-00')).not.toBeInTheDocument();
  });

  test('describes the latest run snapshot method in the info tooltip', () => {
    render(
      <OverallScoreOfLatestRunCard
        runOrder={runOrder.map((point, index) =>
          index === 1
            ? { ...point, overallScoreMethod: { type: OverallScoreType.Mean }, metricNames: ['a', 'b'] }
            : { ...point, overallScoreMethod: { type: OverallScoreType.WeightedMean, weights: [] } },
        )}
      />,
    );

    expect(screen.getByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanFormula)).toBeInTheDocument();
  });

  test('omits the info control when the latest run records no method', () => {
    render(
      <OverallScoreOfLatestRunCard runOrder={runOrder.map((point) => ({ ...point, overallScoreMethod: null }))} />,
    );

    expect(
      screen.queryByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod }),
    ).not.toBeInTheDocument();
  });
});
