import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import TestCaseStability from '@/src/components/TestSuites/Trends/Stability/TestCaseStability';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import { QueryMode } from '@/src/models/evaluation/structured-query';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn(),
}));

vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({
  default: ({ rowData }: { rowData: { label: string }[] }) => (
    <div data-testid="stability-grid">{rowData.map((row) => row.label).join(',')}</div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  NoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  Notification: ({ message, role }: { message: string; role?: string }) => <div role={role ?? 'status'}>{message}</div>,
  NotificationVariant: { Error: 'error' },
  NotificationType: { SectionMessage: 'section-message', Toast: 'toast' },
}));

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';

describe('TestCaseStability', () => {
  const runOrder: TrendsRunPoint[] = [
    {
      runId: 'run-1',
      runName: 'Run#1',
      computedAtMs: 1,
      overallScore: 0.5,
      durationMs: 10,
      isFailed: false,
      metricNames: ['a', 'b', 'c', 'd'],
    },
    {
      runId: 'run-2',
      runName: 'Run#2',
      computedAtMs: 2,
      overallScore: 0.6,
      durationMs: 20,
      isFailed: false,
      metricNames: ['a', 'b', 'c', 'd'],
    },
  ];

  const suite = { id: 'suite-1', name: 'Suite' } as TestSuite;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders section title and loading then matrix', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      rows: [
        { test_suite_run_id: 'run-1', test_case_name: 'alpha', score: 0.9, passed: true },
        { test_suite_run_id: 'run-2', test_case_name: 'alpha', score: 0.2, passed: false },
        { test_suite_run_id: 'run-1', test_case_name: 'beta', score: 0.5, passed: true },
      ],
    });

    render(<TestCaseStability runOrder={runOrder} selectedTestSuite={suite} />);

    expect(screen.getByText(TestSuitesI18nKey.TestCaseStability, { exact: false })).toBeInTheDocument();

    expect(await screen.findByTestId('stability-grid')).toHaveTextContent('Run#2,Run#1');
  });

  test('shows no-data when summaries are empty', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    render(<TestCaseStability runOrder={runOrder} selectedTestSuite={suite} />);

    expect(await screen.findByText(BasicI18nKey.NoData)).toBeInTheDocument();
  });

  test('shows load-failure message when the query rejects', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    render(<TestCaseStability runOrder={runOrder} selectedTestSuite={suite} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(TestSuitesI18nKey.TrendsStabilityLoadFailed);
    expect(screen.queryByText(BasicI18nKey.NoData)).not.toBeInTheDocument();
  });

  test('shows test-case method label when suite overall is ROC AUC', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    render(
      <TestCaseStability
        runOrder={runOrder}
        selectedTestSuite={
          {
            ...suite,
            overallScore: {
              type: OverallScoreType.Function,
              expression: { entity: 'eval_summaries', mode: QueryMode.Aggregate },
            },
            testCaseOverallScore: { type: OverallScoreType.Mean },
          } as TestSuite
        }
      />,
    );

    expect(await screen.findByText(TestSuitesI18nKey.TrendsMeanOfNMetrics)).toBeInTheDocument();
  });
});
