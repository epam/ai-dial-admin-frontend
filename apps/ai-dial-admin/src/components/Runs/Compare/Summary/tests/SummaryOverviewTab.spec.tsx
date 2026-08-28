import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { Run } from '@/src/models/evaluation/run';
import SummaryOverviewTab from '../SummaryOverviewTab';

const useSummaryOverviewDataMock = vi.fn();

vi.mock('../use-summary-overview-data', () => ({
  useSummaryOverviewData: (...args: unknown[]) => useSummaryOverviewDataMock(...args),
}));

vi.mock('../Header', () => ({ default: () => <div>header</div> }));
vi.mock('../Analytics', () => ({ default: () => <div>analytics</div> }));
vi.mock('../MetricScoresSection', () => ({ default: () => <div>metric-scores</div> }));
vi.mock('../DistributionSection', () => ({ default: () => <div>distribution</div> }));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    DialNoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  };
});

const RUN: Run = { id: 'run-1' } as Run;
const EMPTY_ANALYTICS: RunAnalyticsSlice = {
  statusCounts: { passed: 0, failed: 0, error: 0, total: 0 },
  avgRunTimeMs: null,
  avgMetricEvalDurationMs: null,
};
const EMPTY_SCORES = { overallScore: null, statistics: [], byStatistic: {} };

const defaultHookValue = {
  primaryRun: RUN,
  comparedRun: { id: 'run-2' } as Run,
  testSuite: null,
  enrichedPrimaryScores: EMPTY_SCORES,
  enrichedComparedScores: EMPTY_SCORES,
  metricOptions: [],
  primaryMatchedAnalytics: EMPTY_ANALYTICS,
  comparedMatchedAnalytics: EMPTY_ANALYTICS,
  primaryUnmatchedIds: [],
  comparedUnmatchedIds: [],
  hasNoMatchingTestCases: false,
};

const renderTab = (onlyMatchingTestCases = true) =>
  render(
    <SummaryOverviewTab
      primaryRunId="run-1"
      comparedRunId="run-2"
      primaryRunName="Run #850"
      comparedRunName="Run #851"
      onlyMatchingTestCases={onlyMatchingTestCases}
      summaryState={{ selectedStatistic: null, selectedDistributionMetricName: null }}
      setSummaryState={vi.fn()}
    />,
  );

describe('SummaryOverviewTab', () => {
  test('shows a loader until both runs are available', () => {
    useSummaryOverviewDataMock.mockReturnValue({
      ...defaultHookValue,
      primaryRun: null,
      comparedRun: null,
    });

    renderTab();

    expect(screen.getByLabelText('loading-40')).toBeInTheDocument();
  });

  test('shows the No Results empty state when only matching test cases have no overlap', () => {
    useSummaryOverviewDataMock.mockReturnValue({
      ...defaultHookValue,
      hasNoMatchingTestCases: true,
    });

    renderTab();

    expect(screen.getByText('header')).toBeInTheDocument();
    expect(screen.getByText('Entities.NoResults')).toBeInTheDocument();
    expect(screen.queryByText('analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('metric-scores')).not.toBeInTheDocument();
    expect(screen.queryByText('distribution')).not.toBeInTheDocument();
  });

  test('renders analytics and score sections when matching test cases exist', () => {
    useSummaryOverviewDataMock.mockReturnValue(defaultHookValue);

    renderTab(false);

    expect(screen.getByText('header')).toBeInTheDocument();
    expect(screen.getByText('analytics')).toBeInTheDocument();
    expect(screen.getByText('metric-scores')).toBeInTheDocument();
    expect(screen.getByText('distribution')).toBeInTheDocument();
    expect(screen.queryByText('Entities.NoResults')).not.toBeInTheDocument();
  });
});
