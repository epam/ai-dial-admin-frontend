import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Trends from '@/src/components/TestSuites/Trends/Trends';
import { ButtonsI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn(),
  getTestCasePassRate: vi.fn(),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getRuns: vi.fn(),
}));

vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({
  default: () => <div data-testid="heat-map-grid" />,
}));

vi.mock('echarts-for-react', () => ({
  default: () => <div>chart</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLoader: () => <div>loader</div>,
  DialNoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  DialNotification: ({ title, message }: { title?: string; message: React.ReactNode }) => (
    <div role="status">
      <p>{title}</p>
      <div>{message}</div>
    </div>
  ),
  NotificationVariant: { Info: 'info' },
  DialNeutralButton: ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  ElementSize: { Small: 'small' },
  DialAnalyticsCard: ({ title, value }: { title: string; value?: string }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
  DialSegmentedControl: () => <div>segments</div>,
  DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  DialTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { executeStructuredQuery, getTestCasePassRate } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';

describe('Trends', () => {
  const suite = { id: 'suite-1', name: 'Suite', valid: true } as TestSuite;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: the case-pass-rate endpoint is unavailable, so its panel stays out of the way of
    // the assertions the other cards make.
    (getTestCasePassRate as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  test('shows info message when there are no runs', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [] });
    const onStartRun = vi.fn();

    render(<Trends selectedTestSuite={suite} onStartRun={onStartRun} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.TrendsNoRunsTitle)).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.TrendsNoRunsDescription)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Run }));
    expect(onStartRun).toHaveBeenCalledTimes(1);
  });

  test('renders Trends layout when runs exist but scores are missing', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', status: 'COMPLETED', startedAt: 0, completedAt: 400 }],
    });

    render(<Trends selectedTestSuite={suite} />);

    await waitFor(() => {
      expect(screen.queryByText(TestSuitesI18nKey.TrendsNoRunsTitle)).not.toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.TrendsSingleRunMessage)).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.OverallScoreTrend, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.MetricTrends, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.TestCaseStability, { exact: false })).toBeInTheDocument();
    });
  });

  test('renders KPI and section titles when data is available', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockImplementation(async (query: { entity?: string }) => {
      if (query?.entity === 'eval_summaries') {
        return {
          rows: [{ test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.5, passed: true }],
        };
      }
      return {
        rows: [
          {
            test_suite_run_id: 'run-1',
            metric_name: 'overall',
            metric_score_name: 'overall',
            value: 0.58,
            computed_at_ms: 1000,
          },
          {
            test_suite_run_id: 'run-1',
            metric_name: 'ragas.faithfulness',
            metric_score_name: 'AVG',
            value: 0.7,
            computed_at_ms: 1000,
          },
        ],
      };
    });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', startedAt: 0, completedAt: 341 }],
    });

    render(<Trends selectedTestSuite={suite} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.TrendsSingleRunMessage)).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.OverallScoreTrend, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.MetricTrends, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.TestCaseStability, { exact: false })).toBeInTheDocument();
      expect(screen.getByText('0.58')).toBeInTheDocument();
    });

    expect(screen.queryByText(new RegExp(TestSuitesI18nKey.RunsPassedThreshold))).not.toBeInTheDocument();
  });

  test('renders the Cases Passed panel between the KPI strip and the Overall Score Trend chart', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', status: 'COMPLETED', startedAt: 0, completedAt: 400 }],
    });
    (getTestCasePassRate as ReturnType<typeof vi.fn>).mockResolvedValue({
      testSuiteId: 'suite-1',
      runs: [
        {
          testSuiteRunId: 'run-1',
          failedCount: 1,
          successPassedCount: 25,
          successNotPassedCount: 3,
          successNoVerdictCount: 0,
          totalCount: 29,
        },
      ],
    });

    render(<Trends selectedTestSuite={suite} />);

    const panelHeading = await screen.findByRole('heading', { name: new RegExp(TestSuitesI18nKey.CasesPassed) });
    const chartHeading = screen.getByRole('heading', { name: new RegExp(TestSuitesI18nKey.OverallScoreTrend) });
    const kpiTitle = screen.getByText(new RegExp(TestSuitesI18nKey.AvgTestSuiteRunTime));

    expect(kpiTitle.compareDocumentPosition(panelHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panelHeading.compareDocumentPosition(chartHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Whether the two sit in one row or stack is decided entirely by classes - the DOM is the same
    // either way - and jsdom computes no layout, so the split can only be asserted through the
    // classes that declare it.
    const panelHalf = panelHeading.closest('.xl\\:w-1\\/2');
    const chartHalf = chartHeading.closest('.xl\\:w-1\\/2');

    expect(panelHalf?.parentElement).toBe(chartHalf?.parentElement);
    expect(panelHalf?.parentElement).toHaveClass('xl:flex-row');
  });

  test('shows Runs Passed Threshold card when suite threshold is set', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      rows: [
        {
          test_suite_run_id: 'run-1',
          metric_name: 'overall',
          metric_score_name: 'overall',
          value: 0.8,
          computed_at_ms: 1000,
        },
        {
          test_suite_run_id: 'run-2',
          metric_name: 'overall',
          metric_score_name: 'overall',
          value: 0.3,
          computed_at_ms: 2000,
        },
      ],
    });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [
        { id: 'run-1', testRunName: 'Run#1', status: 'COMPLETED', startedAt: 0, completedAt: 100 },
        { id: 'run-2', testRunName: 'Run#2', status: 'FAILED', startedAt: 200, completedAt: 300 },
      ],
    });

    render(<Trends selectedTestSuite={{ ...suite, overallScoreThreshold: 0.5 }} />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(TestSuitesI18nKey.RunsPassedThreshold))).toHaveTextContent(
        TestSuitesI18nKey.TrendsLastNRuns,
      );
      expect(screen.getByText('/ 2')).toBeInTheDocument();
      expect(screen.getByText(`1 ${RunsI18nKey.Pass}`)).toBeInTheDocument();
      expect(screen.getByText(`0 ${RunsI18nKey.Fail}`)).toBeInTheDocument();
      expect(screen.getByText(`1 ${RunsI18nKey.ExecError}`)).toBeInTheDocument();
    });
  });
});
