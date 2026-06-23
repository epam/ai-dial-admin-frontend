import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CompareView from '../CompareView';

const getRunMock = vi.fn();
const getRunsMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();
const routerReplaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
  getRuns: (...args: unknown[]) => getRunsMock(...args),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    DialTag: ({ label, onClick, ...props }: { label: React.ReactNode; onClick?: () => void }) => (
      <button type="button" disabled={!onClick} onClick={onClick} {...props}>
        {label}
      </button>
    ),
  };
});

describe('CompareView', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getRunsMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    routerReplaceMock.mockReset();
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: id === 'run-1' ? 'Run #316' : 'Run #317',
      }),
    );
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });
    getTestCaseRunResultsMock.mockResolvedValue({
      content: [
        {
          id: 'result-1',
          responseStatusCode: 200,
          runIndex: 0,
          executionStatus: 'SUCCESS',
          testCaseName: 'Test Case 1',
        },
      ],
    });
  });

  test('renders title and both run tags', async () => {
    render(<CompareView runId="run-1" comparedRunId="run-sibling" />);

    expect(screen.getByText('Runs.RunComparison')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareVs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Runs.RunCompareAddRun' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })).toHaveLength(2);
    });

    expect(getRunMock).toHaveBeenCalledWith('run-1');
  });

  test('opens modal from secondary run tag click and updates url on confirm', async () => {
    const user = userEvent.setup();
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
        { id: 'run-other', testSuiteId: 'suite-1', testRunName: 'Run #318', status: 'COMPLETED' },
      ],
    });

    render(<CompareView runId="run-1" comparedRunId="run-sibling" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })[1]).toBeEnabled();
    });

    await user.click(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })[1]);

    await waitFor(() => {
      expect(screen.getByText('Runs.RunCompareSelectRun')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Buttons.Confirm' }));

    expect(routerReplaceMock).toHaveBeenCalledWith('/runs/compare?runs=run-1,run-sibling', { scroll: false });
  });

  test('renders compare tabs with Execution Results active by default', async () => {
    render(<CompareView runId="run-1" comparedRunId="run-sibling" />);

    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabMetricsDetails' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });
  });

  test('switches tab content when clicking Summary Overview and back to Execution Results', async () => {
    const user = userEvent.setup();

    render(<CompareView runId="run-1" comparedRunId="run-sibling" />);

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' }));

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });
  });
});
