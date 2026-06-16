import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CompareView from '../CompareView';

const getRunMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
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
    DialPrimaryButton: ({ label, disabled }: { label: string; disabled?: boolean }) => (
      <button disabled={disabled}>{label}</button>
    ),
    DialTag: ({ label }: { label: string }) => <span>{label}</span>,
  };
});

describe('CompareView', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    getRunMock.mockResolvedValue({
      id: 'run-1',
      testSuiteId: 'suite-1',
      testRunName: 'Run #316',
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

  test('renders title, run tag, info banner, and add button', async () => {
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
    expect(getTestCaseRunResultsMock).toHaveBeenCalled();
  });

  test('shows load error when run fetch fails', async () => {
    getRunMock.mockRejectedValue(new Error('failed'));

    render(<CompareView runId="run-1" />);

    await waitFor(() => {
      expect(screen.getByText('Runs.LoadError')).toBeInTheDocument();
    });
  });
});
