import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Trends from '@/src/components/TestSuites/Trends/Trends';
import { ButtonsI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn(),
  getRunsTotalCosts: vi.fn().mockResolvedValue([{ runId: 'run-1', testCaseCost: null, metricEvalCost: null }]),
  getRunsQuery: vi.fn(),
}));

vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({
  default: () => <div data-testid="heat-map-grid" />,
}));

vi.mock('echarts-for-react', () => ({
  default: () => <div>chart</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  NoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  Notification: ({ title, message }: { title?: string; message: React.ReactNode }) => (
    <div role="status">
      <p>{title}</p>
      <div>{message}</div>
    </div>
  ),
  NotificationType: { SectionMessage: 'section-message' },
  NotificationVariant: { Info: 'info' },
  OutlinedButton: ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  ElementSize: { Small: 'small' },
  AnalyticsCard: ({ title, value }: { title: string; value?: string }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
  SegmentedControl: () => <div>segments</div>,
  EllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  BadgeVariant: { Outlined: 'outlined', Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red', Blue: 'blue' },
  Tag: ({
    label,
    onClick,
    selected,
    style,
  }: {
    label: string;
    onClick?: () => void;
    selected?: boolean;
    style?: React.CSSProperties;
  }) => (
    <span role="button" aria-pressed={selected} onClick={onClick} style={style}>
      {label}
    </span>
  ),
  TagAppearance: { Selectable: 'selectable', Outlined: 'outlined' },
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InteractiveTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { executeStructuredQuery, getRunsQuery } from '@/src/app/[lang]/runs/actions';

describe('Trends', () => {
  const suite = { id: 'suite-1', name: 'Suite', valid: true } as TestSuite;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows info message when there are no runs', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
    (getRunsQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [] });
    const onStartRun = vi.fn();

    render(<Trends selectedTestSuite={suite} onStartRun={onStartRun} />);

    expect(await screen.findByText(TestSuitesI18nKey.TrendsNoRunsTitle)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsNoRunsDescription)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Run }));
    expect(onStartRun).toHaveBeenCalledTimes(1);
  });

  test('renders Trends layout when runs exist but scores are missing', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
    (getRunsQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', status: 'COMPLETED', startedAt: 0, completedAt: 400 }],
    });

    render(<Trends selectedTestSuite={suite} />);

    expect(await screen.findByText(TestSuitesI18nKey.TrendsSingleRunMessage)).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: TabsI18nKey.TestCases })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: TestSuitesI18nKey.TrendsLatestRun })).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.OverallScoreTrend, { exact: false })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: TestSuitesI18nKey.CostTrend })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: TestSuitesI18nKey.RuntimeTrend })).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.MetricTrends, { exact: false })).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TestCaseStability, { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsNoRunsTitle)).not.toBeInTheDocument();
  });

  test('renders KPI and section titles when data is available', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockImplementation(
      async (query: { entity?: string; mode?: string }) => {
        if (query?.entity === 'test_case_eval_scores' && query?.mode === 'aggregate') {
          return {
            rows: [
              {
                test_suite_run_id: 'run-1',
                execution_status: 'SUCCESS',
                passed: true,
                count: 8,
              },
              {
                test_suite_run_id: 'run-1',
                execution_status: 'SUCCESS',
                passed: false,
                count: 2,
              },
            ],
          };
        }
        if (query?.entity === 'test_case_eval_scores') {
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
      },
    );
    (getRunsQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', startedAt: 0, completedAt: 341 }],
    });

    render(<Trends selectedTestSuite={suite} />);

    expect(await screen.findByText(TestSuitesI18nKey.TrendsSingleRunMessage)).toBeInTheDocument();
    const testCasesCard = await screen.findByRole('region', { name: TabsI18nKey.TestCases });
    const latestRunCard = await screen.findByRole('region', { name: TestSuitesI18nKey.TrendsLatestRun });
    const overallScore = await screen.findByText(TestSuitesI18nKey.OverallScoreTrend);
    expect(testCasesCard.compareDocumentPosition(latestRunCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(latestRunCard.compareDocumentPosition(overallScore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(await screen.findByText(TestSuitesI18nKey.MetricTrends)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TestCaseStability)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.OverallScoreOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.CompletionRateOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TotalRuntimeOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TotalCostOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText('0.580')).toBeInTheDocument();
    // Completion rate = SUCCESS counts / total = 10/10 when threshold unset.
    expect(await screen.findByText('100%')).toBeInTheDocument();
    expect(await screen.findAllByText(TestSuitesI18nKey.TrendsTestCasesCompleted)).not.toHaveLength(0);
    expect(await screen.findAllByText('#1')).not.toHaveLength(0);
  });

  test('shows threshold pass rate title when suite threshold is set', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockImplementation(
      async (query: { entity?: string; mode?: string }) => {
        if (query?.entity === 'test_case_eval_scores' && query?.mode === 'aggregate') {
          return {
            rows: [
              {
                test_suite_run_id: 'run-1',
                execution_status: 'SUCCESS',
                passed: true,
                count: 8,
              },
              {
                test_suite_run_id: 'run-1',
                execution_status: 'SUCCESS',
                passed: false,
                count: 2,
              },
            ],
          };
        }
        return {
          rows: [
            {
              test_suite_run_id: 'run-1',
              metric_name: 'overall',
              metric_score_name: 'overall',
              value: 0.8,
              computed_at_ms: 1000,
            },
          ],
        };
      },
    );
    (getRunsQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', status: 'COMPLETED', startedAt: 0, completedAt: 100 }],
    });

    render(<Trends selectedTestSuite={{ ...suite, overallScoreThreshold: 0.5 }} />);

    expect(await screen.findByText(TestSuitesI18nKey.ThresholdPassRateOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.OverallScoreOfLatestRun)).toBeInTheDocument();
    expect(await screen.findByText('0.800')).toBeInTheDocument();
    // Pass rate = above / total = 8/10.
    expect(await screen.findByText('80%')).toBeInTheDocument();
  });
});
