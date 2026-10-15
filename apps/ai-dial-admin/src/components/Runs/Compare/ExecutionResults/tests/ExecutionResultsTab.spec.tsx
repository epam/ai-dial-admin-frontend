import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useCallback, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ExecutionResultsTabUiState } from '@/src/components/Runs/Compare/models';
import { createDefaultCompareViewTabState } from '@/src/components/Runs/Compare/use-compare-view-tab-state';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';

import ExecutionResultsTab from '../ExecutionResultsTab';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

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
  runs: getCompareRuns({ id: 'run-1', name: 'Run #316' }, { id: 'run-sibling', name: 'Run #317' }),
  onlyMatchingTestCases: false,
};

const defaultDisplayPanelProps = {
  showDisplayPanel: false,
  onToggleDisplayPanel: vi.fn(),
};

const defaultRowDetailProps = {
  selectedRow: null,
  onOpenRowDetail: vi.fn(),
};

const ControlledExecutionResultsTab: FC<
  Partial<React.ComponentProps<typeof ExecutionResultsTab>> & {
    initialState?: Partial<ExecutionResultsTabUiState>;
  }
> = ({ initialState, ...props }) => {
  const [executionResultsState, setState] = useState<ExecutionResultsTabUiState>(() => ({
    ...createDefaultCompareViewTabState().executionResults,
    ...initialState,
  }));

  const setExecutionResultsState = useCallback((patch: Partial<ExecutionResultsTabUiState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="w-[1200px] h-[600px] flex flex-col">
      <ExecutionResultsTab
        primaryRunId="run-1"
        comparedRunId="run-sibling"
        {...defaultRunProps}
        {...defaultDisplayPanelProps}
        {...defaultRowDetailProps}
        executionResultsState={executionResultsState}
        setExecutionResultsState={setExecutionResultsState}
        {...props}
        // after the spread: `props` is a `Partial`, so it would otherwise widen a required prop to
        // `boolean | undefined`
        onlyMatchingTestCases={props.onlyMatchingTestCases ?? false}
      />
    </div>
  );
};

const renderExecutionResultsTab = (
  props: Partial<React.ComponentProps<typeof ExecutionResultsTab>> & {
    initialState?: Partial<ExecutionResultsTabUiState>;
  } = {},
) => render(<ControlledExecutionResultsTab {...props} />);

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
            executionStatus: ExtractionResultStatus.SUCCESS,
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
            executionStatus: ExtractionResultStatus.SUCCESS,
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

    expect(await screen.findByRole('region', { name: 'Data grid' })).toBeInTheDocument();

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(getRunMock).toHaveBeenCalledWith('run-1');
    expect(getRunMock).toHaveBeenCalledWith('run-sibling');
    expect(getTestCaseRunResultsMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Runs.RunCompareDiffLabel')).toBeInTheDocument();
  });

  test('skips fetch when results are already lifted', async () => {
    const content = [
      {
        id: 'result-1',
        testCaseId: 'tc-1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: ExtractionResultStatus.SUCCESS,
        testCaseName: 'Test Case 1',
        metricValues: { Accuracy: { precision: 0.5 } },
      },
    ];

    renderExecutionResultsTab({
      initialState: {
        results: content,
        comparedResults: content.map((row) => ({
          ...row,
          id: 'result-2',
          metricValues: { Accuracy: { precision: 0.8 } },
        })),
      },
    });

    expect(await screen.findByRole('region', { name: 'Data grid' })).toBeInTheDocument();

    expect(getTestCaseRunResultsMock).not.toHaveBeenCalled();
  });

  test('preserves hideHighlights across remount with lifted state', async () => {
    const user = userEvent.setup();
    let latestState: ExecutionResultsTabUiState | null = null;

    const Harness: FC = () => {
      const [executionResultsState, setState] = useState<ExecutionResultsTabUiState>(
        () => createDefaultCompareViewTabState().executionResults,
      );
      latestState = executionResultsState;

      const setExecutionResultsState = useCallback((patch: Partial<ExecutionResultsTabUiState>) => {
        setState((prev) => ({ ...prev, ...patch }));
      }, []);

      return (
        <div className="w-[1200px] h-[600px] flex flex-col">
          <ExecutionResultsTab
            primaryRunId="run-1"
            comparedRunId="run-sibling"
            {...defaultRunProps}
            showDisplayPanel
            onToggleDisplayPanel={vi.fn()}
            {...defaultRowDetailProps}
            executionResultsState={executionResultsState}
            setExecutionResultsState={setExecutionResultsState}
          />
        </div>
      );
    };

    const { unmount } = render(<Harness />);

    expect(await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' })).toBeInTheDocument();

    const hideHighlightsInput = document.getElementById('compare-hide-highlights');
    expect(hideHighlightsInput).toBeTruthy();
    await user.click(hideHighlightsInput!);

    expect((latestState as ExecutionResultsTabUiState | null)?.hideHighlights).toBe(true);

    const preservedState = latestState!;
    unmount();

    render(
      <div className="w-[1200px] h-[600px] flex flex-col">
        <ExecutionResultsTab
          primaryRunId="run-1"
          comparedRunId="run-sibling"
          {...defaultRunProps}
          showDisplayPanel
          onToggleDisplayPanel={vi.fn()}
          {...defaultRowDetailProps}
          executionResultsState={preservedState}
          setExecutionResultsState={vi.fn()}
        />
      </div>,
    );

    expect(await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' })).toBeInTheDocument();

    expect(document.getElementById('compare-hide-highlights')).toBeChecked();
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

    expect(await screen.findByText('Runs.LoadError')).toBeInTheDocument();
  });

  test('renders nested execution fields in display panel', async () => {
    const user = userEvent.setup();
    renderExecutionResultsTab({ showDisplayPanel: true });

    const panel = await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' });
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

    expect(await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buttons.Close' }));
    expect(onToggleDisplayPanel).toHaveBeenCalled();
  });

  test('view differences only hides rows without metric or status diff', async () => {
    const user = userEvent.setup();

    renderExecutionResultsTab({ showDisplayPanel: true });

    expect(await screen.findByText('Test Case 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Case 2')).toBeInTheDocument();

    const viewDifferencesInput = document.getElementById('compare-view-differences-only');
    expect(viewDifferencesInput).toBeTruthy();
    await user.click(viewDifferencesInput!);

    await waitFor(() => expect(screen.queryByText('Test Case 2')).not.toBeInTheDocument());
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
  });

  test('hides diff legend when row detail panel is open', async () => {
    renderExecutionResultsTab({
      selectedRow: {
        id: 'result-1',
        testCaseId: 'tc-1',
        testCaseName: 'Test Case 1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: ExtractionResultStatus.SUCCESS,
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: null,
      },
    });

    expect(await screen.findByRole('region', { name: 'Data grid' })).toBeInTheDocument();

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(screen.queryByText('Runs.RunCompareDiffLabel')).not.toBeInTheDocument();
  });

  test('shows HTTP columns in grid when HTTP group is checked in display panel', async () => {
    const user = userEvent.setup();
    renderExecutionResultsTab({ showDisplayPanel: true });

    const panel = await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' });

    expect(document.querySelector('[col-id="http"]')).not.toBeInTheDocument();
    expect(document.querySelector('[col-id="cmp_http"]')).not.toBeInTheDocument();

    await user.click(within(panel).getAllByRole('button', { name: 'Expand' })[1]);

    const httpCheckbox = within(panel).getByRole('checkbox', { name: 'HTTP' });
    await user.click(httpCheckbox);

    await waitFor(() => expect(document.querySelector('[col-id="http"]')).toBeInTheDocument());
    await waitFor(() => expect(document.querySelector('[col-id="cmp_http"]')).toBeInTheDocument());
  });

  test('hides HTTP columns in grid when HTTP group is unchecked in display panel', async () => {
    const user = userEvent.setup();
    renderExecutionResultsTab({ showDisplayPanel: true });

    expect(await screen.findByRole('region', { name: 'Data grid' })).toBeInTheDocument();
    const panel = await screen.findByRole('toolbar', { name: 'Runs.RunCompareDisplay' });

    expect(document.querySelector('[col-id="http"]')).not.toBeInTheDocument();
    expect(document.querySelector('[col-id="cmp_http"]')).not.toBeInTheDocument();

    await user.click(within(panel).getAllByRole('button', { name: 'Expand' })[1]);

    const httpCheckbox = within(panel).getByRole('checkbox', { name: 'HTTP' });
    await user.click(httpCheckbox);

    await waitFor(() => expect(document.querySelector('[col-id="http"]')).toBeInTheDocument());
    await waitFor(() => expect(document.querySelector('[col-id="cmp_http"]')).toBeInTheDocument());

    await user.click(httpCheckbox);

    await waitFor(() => expect(document.querySelector('[col-id="http"]')).not.toBeInTheDocument());
    await waitFor(() => expect(document.querySelector('[col-id="cmp_http"]')).not.toBeInTheDocument());
  });

  test('calls onOpenRowDetail when a row is clicked', async () => {
    const onOpenRowDetail = vi.fn();

    renderExecutionResultsTab({ onOpenRowDetail });

    const row = (await screen.findByText('Test Case 1')).closest('.ag-row');
    expect(row).toBeTruthy();

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(document.querySelector('[col-id="compare_action"]')).not.toBeInTheDocument();

    fireEvent.click(row!);

    await vi.waitFor(() =>
      expect(onOpenRowDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'result-1',
          testCaseName: 'Test Case 1',
        }),
      ),
    );
  });

  test('calls onOpenRowDetail with focusFieldKey when a mapped cell is clicked', async () => {
    const onOpenRowDetail = vi.fn();

    renderExecutionResultsTab({ onOpenRowDetail });

    await screen.findByText('Test Case 1');
    const statusCell = await waitFor(() => {
      const cell = document.querySelector<HTMLElement>('.ag-center-cols-container .ag-row [col-id="status"]');
      if (!cell) throw new Error('status cell is not rendered yet');
      return cell;
    });

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();

    fireEvent.click(statusCell);

    await vi.waitFor(() =>
      expect(onOpenRowDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'result-1',
          testCaseName: 'Test Case 1',
        }),
        { focusFieldKey: 'executionStatus' },
      ),
    );
  });
});
