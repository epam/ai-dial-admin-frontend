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
    DialNotification: ({ title, message }: { title: string; message: string }) => (
      <div>
        <span>{title}</span>
        <span>{message}</span>
      </div>
    ),
    DialPrimaryButton: ({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick?: () => void }) => (
      <button disabled={disabled} onClick={onClick}>
        {label}
      </button>
    ),
    DialTag: ({ label, onClick }: { label: string; onClick?: () => void }) => (
      <button type="button" disabled={!onClick} onClick={onClick}>
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
    getRunMock.mockResolvedValue({
      id: 'run-1',
      testSuiteId: 'suite-1',
      testRunName: 'Run #316',
    });
    getRunsMock.mockResolvedValue({ content: [] });
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

  test('renders title, run tag, info banner, and disabled add button when no sibling runs', async () => {
    render(<CompareView runId="run-1" />);

    expect(screen.getByText('Runs.RunComparison')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareVs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Runs.RunCompareAddRun' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Runs.RunCompareTag')).toBeInTheDocument();
    });

    expect(screen.getByText('Runs.RunCompareAddSecondRunTitle')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareAddSecondRunMessage')).toBeInTheDocument();
    expect(getRunMock).toHaveBeenCalledWith('run-1');
    expect(getTestCaseRunResultsMock).toHaveBeenCalledTimes(1);
  });

  test('enables add button when sibling runs exist', async () => {
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });

    render(<CompareView runId="run-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Runs.RunCompareAddRun' })).toBeEnabled();
    });
  });

  test('opens select run modal on add click', async () => {
    const user = userEvent.setup();
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });

    render(<CompareView runId="run-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Runs.RunCompareAddRun' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareAddRun' }));

    await waitFor(() => {
      expect(screen.getByText('Runs.RunCompareSelectRun')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Buttons.Confirm' })).toBeDisabled();
  });

  test('opens modal from primary run tag click and updates url on confirm', async () => {
    const user = userEvent.setup();
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });

    render(<CompareView runId="run-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Runs.RunCompareTag' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareTag' }));

    await waitFor(() => {
      expect(screen.getByText('Runs.RunCompareSelectRun')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Buttons.Confirm' }));

    expect(routerReplaceMock).toHaveBeenCalledWith('/runs/compare?runs=run-1', { scroll: false });
  });

  test('shows load error when run fetch fails', async () => {
    getRunMock.mockRejectedValue(new Error('failed'));

    render(<CompareView runId="run-1" />);

    await waitFor(() => {
      expect(screen.getByText('Runs.LoadError')).toBeInTheDocument();
    });
  });
});
