import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import TestCaseStability from '@/src/components/TestSuites/Trends/TestCaseStability';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn(),
}));

vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({
  default: ({ rowData }: { rowData: { label: string }[] }) => (
    <div data-testid="stability-grid">{rowData.map((row) => row.label).join(',')}</div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLoader: () => <div>loader</div>,
  DialNoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';

describe('TestCaseStability', () => {
  const runOrder: TrendsRunPoint[] = [
    { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: 0.5, durationMs: 10, isFailed: false },
    { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, overallScore: 0.6, durationMs: 20, isFailed: false },
  ];

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

    render(<TestCaseStability runOrder={runOrder} runCount={2} />);

    expect(screen.getByText(TestSuitesI18nKey.TestCaseStability, { exact: false })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('stability-grid')).toHaveTextContent('Run#1,Run#2');
    });
  });

  test('shows no-data when summaries are empty', async () => {
    (executeStructuredQuery as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    render(<TestCaseStability runOrder={runOrder} runCount={2} />);

    await waitFor(() => {
      expect(screen.getByText(BasicI18nKey.NoData)).toBeInTheDocument();
    });
  });
});
