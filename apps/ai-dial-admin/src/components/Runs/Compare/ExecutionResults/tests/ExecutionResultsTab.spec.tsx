import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const defaultRunProps = {
  primaryRunName: 'Run #316',
  comparedRunName: 'Run #317',
};

const defaultDisplayPanelProps = {
  showDisplayPanel: false,
  onToggleDisplayPanel: vi.fn(),
};

const defaultRowDetailProps = {
  selectedRow: null,
  onOpenRowDetail: vi.fn(),
};

const renderExecutionResultsTab = (props: Partial<React.ComponentProps<typeof ExecutionResultsTab>> = {}) =>
  render(
    <div className="w-[1200px] h-[600px] flex flex-col">
      <ExecutionResultsTab
        primaryRunId="run-1"
        comparedRunId="run-sibling"
        {...defaultRunProps}
        {...defaultDisplayPanelProps}
        {...defaultRowDetailProps}
        {...props}
      />
    </div>,
  );

describe('ExecutionResultsTab', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    defaultDisplayPanelProps.onToggleDisplayPanel.mockReset();
    defaultRowDetailProps.onOpenRowDetail.mockReset();
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
          {
            id: isPrimary ? 'result-3' : 'result-4',
            testCaseId: 'tc-2',
            responseStatusCode: 200,
            runIndex: 1,
            executionStatus: 'SUCCESS',
            testCaseName: 'Test Case 2',
            metricValues: {
              Accuracy: { precision: 0.7 },
            },
          },
        ],
      });
    });
  });

  test('loads compare results for both runs and renders grid', async () => {
    renderExecutionResultsTab();

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

    renderExecutionResultsTab();

    await waitFor(() => {
      expect(screen.getByText('Runs.LoadError')).toBeInTheDocument();
    });
  });

  test('renders nested execution fields in display panel', async () => {
    const user = userEvent.setup();
    renderExecutionResultsTab({ showDisplayPanel: true });

    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: 'Runs.RunCompareDisplay' })).toBeInTheDocument();
    });

    const panel = screen.getByRole('toolbar', { name: 'Runs.RunCompareDisplay' });
    const expandButtons = () => within(panel).getAllByRole('button', { name: 'Expand' });

    await user.click(expandButtons()[1]);
    expect(within(panel).getByRole('checkbox', { name: 'HTTP' })).toBeInTheDocument();

    await user.click(expandButtons()[3]);
    expect(within(panel).getByText('Run #316')).toBeInTheDocument();
    expect(within(panel).getByText('Run #317')).toBeInTheDocument();
  });

  test('closes display panel when close button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleDisplayPanel = vi.fn();

    renderExecutionResultsTab({ showDisplayPanel: true, onToggleDisplayPanel });

    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: 'Runs.RunCompareDisplay' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Buttons.Close' }));
    expect(onToggleDisplayPanel).toHaveBeenCalled();
  });

  test('view differences only hides rows without metric or status diff', async () => {
    const user = userEvent.setup();

    renderExecutionResultsTab({ showDisplayPanel: true });

    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
      expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    });

    const viewDifferencesInput = document.getElementById('compare-view-differences-only');
    expect(viewDifferencesInput).toBeTruthy();
    await user.click(viewDifferencesInput!);

    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Case 2')).not.toBeInTheDocument();
  });

  test('hides HTTP columns in grid when HTTP group is unchecked in display panel', async () => {
    const user = userEvent.setup();
    renderExecutionResultsTab({ showDisplayPanel: true });

    await waitFor(() => {
      expect(document.querySelector('[col-id="http"]')).toBeInTheDocument();
      expect(document.querySelector('[col-id="cmp_http"]')).toBeInTheDocument();
    });

    const panel = screen.getByRole('toolbar', { name: 'Runs.RunCompareDisplay' });
    await user.click(within(panel).getAllByRole('button', { name: 'Expand' })[1]);

    const httpCheckbox = within(panel).getByRole('checkbox', { name: 'HTTP' });
    await user.click(httpCheckbox);

    await waitFor(() => {
      expect(document.querySelector('[col-id="http"]')).not.toBeInTheDocument();
      expect(document.querySelector('[col-id="cmp_http"]')).not.toBeInTheDocument();
    });
  });

  test('calls onOpenRowDetail when eye button is clicked', async () => {
    const onOpenRowDetail = vi.fn();

    renderExecutionResultsTab({ onOpenRowDetail });

    let eyeButton: HTMLButtonElement | null = null;
    await waitFor(() => {
      eyeButton = document.querySelector('.ag-pinned-right-cols-container [col-id="compare_action"] button');
      expect(eyeButton).toBeTruthy();
    });

    fireEvent.click(eyeButton!);

    expect(onOpenRowDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'result-1',
        testCaseName: 'Test Case 1',
      }),
    );
  });
});
