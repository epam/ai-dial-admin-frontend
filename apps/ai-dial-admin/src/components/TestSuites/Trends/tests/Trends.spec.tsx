import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Trends from '@/src/components/TestSuites/Trends/Trends';
import { ButtonsI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn(),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getRuns: vi.fn(),
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
}));

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';

describe('Trends', () => {
  const suite = { id: 'suite-1', name: 'Suite', valid: true } as TestSuite;

  beforeEach(() => {
    vi.clearAllMocks();
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
    });
  });

  test('renders KPI and section titles when data is available', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
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
    });
    (getRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [{ id: 'run-1', testRunName: 'Run#1', startedAt: 0, completedAt: 341 }],
    });

    render(<Trends selectedTestSuite={suite} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.TrendsSingleRunMessage)).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.OverallScoreTrend, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.MetricTrends, { exact: false })).toBeInTheDocument();
      expect(screen.getByText('0.58')).toBeInTheDocument();
    });

    expect(screen.queryByText(new RegExp(TestSuitesI18nKey.RunsPassedThreshold))).not.toBeInTheDocument();
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
      expect(screen.getByText(new RegExp(TestSuitesI18nKey.RunsPassedThreshold))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(TestSuitesI18nKey.TrendsLastNRuns))).toBeInTheDocument();
      expect(screen.getByText('/ 2')).toBeInTheDocument();
      expect(screen.getByText(`1 ${RunsI18nKey.Pass}`)).toBeInTheDocument();
      expect(screen.getByText(`0 ${RunsI18nKey.Fail}`)).toBeInTheDocument();
      expect(screen.getByText(`1 ${RunsI18nKey.ExecError}`)).toBeInTheDocument();
    });
  });
});
