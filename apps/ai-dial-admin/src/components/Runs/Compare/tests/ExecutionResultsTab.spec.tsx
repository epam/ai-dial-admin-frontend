import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ExecutionResultsTab from '../ExecutionResultsTab';

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
  };
});

describe('ExecutionResultsTab', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: id === 'run-1' ? 'Run #316' : 'Run #317',
      }),
    );
    getTestCaseRunResultsMock.mockImplementation((filters: { column: string; value: string }[]) => {
      const runId = filters.find((filter) => filter.column === 'runId')?.value;
      const isPrimary = runId === 'run-1';
      return Promise.resolve({
        content: [
          {
            id: isPrimary ? 'result-1' : 'result-2',
            testCaseId: 'tc-1',
            responseStatusCode: 200,
            runIndex: 0,
            executionStatus: 'SUCCESS',
            testCaseName: 'Test Case 1',
            metricValues: {
              Accuracy: { precision: isPrimary ? 0.5 : 0.8 },
            },
          },
        ],
      });
    });
  });

  test('loads compare results for both runs and renders grid', async () => {
    render(<ExecutionResultsTab primaryRunId="run-1" comparedRunId="run-sibling" />);

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    expect(getRunMock).toHaveBeenCalledWith('run-1');
    expect(getRunMock).toHaveBeenCalledWith('run-sibling');
    expect(getTestCaseRunResultsMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareDiffLabel')).toBeInTheDocument();
  });

  test('shows load error when run fetch fails', async () => {
    getRunMock.mockImplementation((id: string) => {
      if (id === 'run-1') {
        return Promise.reject(new Error('failed'));
      }
      return Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: 'Run #317',
      });
    });

    render(<ExecutionResultsTab primaryRunId="run-1" comparedRunId="run-sibling" />);

    await waitFor(() => {
      expect(screen.getByText('Runs.LoadError')).toBeInTheDocument();
    });
  });
});
