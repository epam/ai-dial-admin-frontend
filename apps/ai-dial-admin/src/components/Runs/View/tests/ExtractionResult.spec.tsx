import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useCallback, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { ExtractionResultTabUiState } from '../models';
import ExtractionResultTab from '../ExtractionResult';
import { createDefaultRunViewTabState } from '../use-run-view-tab-state';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();

const getTestCaseRunResultsMock = vi.fn().mockResolvedValue({
  content: [
    {
      id: 'r1',
      responseStatusCode: 200,
      runIndex: 0,
      executionStatus: 'SUCCESS',
      testCaseName: 'Test Case 1',
    },
    {
      id: 'r2',
      responseStatusCode: 200,
      runIndex: 1,
      executionStatus: 'SUCCESS',
      testCaseName: 'Test Case 2',
    },
  ],
});

const executeStructuredQueryMock = vi.fn();

const SCORE_ROWS_RESULT = {
  rows: [
    { test_suite_run_id: 'run-1', test_case_name: 'Test Case 1', score: 0.7 },
    { test_suite_run_id: 'run-1', test_case_name: 'Test Case 2', score: 0 },
  ],
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      showSidebar: mockShowSidebar,
      closeSidebar: mockCloseSidebar,
    },
    featureFlags: { deploymentsEnabled: true },
    isReadOnlyAdmin: false,
  }),
}));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
  executeStructuredQuery: (...args: unknown[]) => executeStructuredQueryMock(...args),
  getTestCaseRunResultDetails: vi.fn().mockResolvedValue({
    id: 'r1',
    responseStatusCode: 200,
    runIndex: 0,
    executionStatus: 'SUCCESS',
    execDurationMs: 1000,
    testCaseName: 'Test Case 1',
    testCaseData: {},
    metricValues: {},
  }),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Spinner: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
  };
});

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    additionalGridOptions,
    columnWidths,
    onColumnWidthsChange,
    rowData,
  }: {
    additionalGridOptions: Record<string, (e: unknown) => void>;
    columnWidths: Record<string, number>;
    onColumnWidthsChange: (widths: Record<string, number>) => void;
    rowData: { testCaseScore?: number | null }[] | null;
  }) => (
    <div
      role="grid"
      aria-label="Analytics grid"
      data-column-widths={JSON.stringify(columnWidths)}
      data-row-scores={JSON.stringify((rowData ?? []).map((row) => row.testCaseScore))}
    >
      <button onClick={() => onColumnWidthsChange({ testCaseName: 240 })}>Resize column</button>
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r1' } })}>Row 1</button>
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r2' } })}>Row 2</button>
      <button
        onClick={() =>
          additionalGridOptions.onCellClicked({
            data: { id: 'r1' },
            column: { getColId: () => 'http' },
            colDef: { colId: 'http' },
          })
        }
      >
        Cell HTTP
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel', () => ({
  default: ({ toggleColumnsPanel }: { toggleColumnsPanel: () => void }) => (
    <div role="dialog" aria-label="Columns panel">
      <button onClick={toggleColumnsPanel}>Close panel</button>
    </div>
  ),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailPanel', () => ({
  default: () => <div data-testid="execution-row-detail-bottom-panel" />,
}));

const mockRun = {
  id: 'run-1',
  name: 'Test Run',
  testSuiteRunId: 'tsr-1',
} as never;

const ControlledExtractionResultTab: FC<{ initialState?: Partial<ExtractionResultTabUiState> }> = ({
  initialState,
}) => {
  const [extractionResultState, setState] = useState<ExtractionResultTabUiState>(() => ({
    ...createDefaultRunViewTabState().extractionResult,
    ...initialState,
  }));

  const setExtractionResultState = useCallback((patch: Partial<ExtractionResultTabUiState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <ExtractionResultTab
      run={mockRun}
      extractionResultState={extractionResultState}
      setExtractionResultState={setExtractionResultState}
    />
  );
};

describe('ExtractionResultTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeStructuredQueryMock.mockResolvedValue(SCORE_ROWS_RESULT);
  });

  test('renders grid after loading without Columns button in tab body', async () => {
    render(<ControlledExtractionResultTab />);
    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Columns })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Columns panel' })).not.toBeInTheDocument();
  });

  test('keeps the column widths the grid reports in the tab state', async () => {
    render(<ControlledExtractionResultTab initialState={{ columnWidths: { status: 90 } }} />);
    const grid = await screen.findByRole('grid', { name: 'Analytics grid' });
    expect(grid).toHaveAttribute('data-column-widths', JSON.stringify({ status: 90 }));

    await userEvent.click(screen.getByRole('button', { name: 'Resize column' }));

    expect(screen.getByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-column-widths',
      JSON.stringify({ testCaseName: 240 }),
    );
  });

  test('shows Columns panel when showTreePanel is true', async () => {
    render(<ControlledExtractionResultTab initialState={{ showTreePanel: true }} />);
    expect(await screen.findByRole('dialog', { name: 'Columns panel' })).toBeInTheDocument();
  });

  test('does not refetch results when cached state is provided', async () => {
    render(
      <ControlledExtractionResultTab
        initialState={{
          results: [
            {
              id: 'r1',
              responseStatusCode: 200,
              runIndex: 0,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'Test Case 1',
            },
          ],
        }}
      />,
    );

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();

    expect(getTestCaseRunResultsMock).not.toHaveBeenCalled();
  });

  test('requests the scores of the run with one structured query', async () => {
    render(<ControlledExtractionResultTab />);

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(executeStructuredQueryMock).toHaveBeenCalledOnce();
    expect(executeStructuredQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'test_case_eval_scores',
        filter: expect.objectContaining({
          args: [expect.anything(), expect.objectContaining({ items: [expect.objectContaining({ value: 'run-1' })] })],
        }),
      }),
    );
  });

  test('hands the grid rows that carry their test case score', async () => {
    render(<ControlledExtractionResultTab />);

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-row-scores',
      JSON.stringify([0.7, 0]),
    );
  });

  test('keeps the spinner until the scores have loaded', async () => {
    executeStructuredQueryMock.mockReturnValue(new Promise(() => {}));
    render(<ControlledExtractionResultTab />);

    expect(await screen.findByLabelText('loading-40')).toBeInTheDocument();
    await vi.waitFor(() => expect(getTestCaseRunResultsMock).toHaveBeenCalledOnce());
    expect(screen.queryByRole('grid', { name: 'Analytics grid' })).not.toBeInTheDocument();
  });

  test.each([
    ['rejects', () => executeStructuredQueryMock.mockRejectedValue(new Error('boom'))],
    ['returns nothing', () => executeStructuredQueryMock.mockResolvedValue(null)],
  ])('still renders the grid, with no scores, when the scores request %s', async (_name, arrange) => {
    arrange();
    render(<ControlledExtractionResultTab />);

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-row-scores',
      JSON.stringify([null, null]),
    );
  });

  test('does not refetch scores when cached state is provided', async () => {
    render(<ControlledExtractionResultTab initialState={{ testCaseScores: [] }} />);

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('opens bottom panel on row click by default', async () => {
    render(<ControlledExtractionResultTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), expect.any(String), SidebarPosition.Bottom);
  });

  test('opens bottom panel with focus field on cell click', async () => {
    render(<ControlledExtractionResultTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Cell HTTP' }));

    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), expect.any(String), SidebarPosition.Bottom);
  });

  test('calls closeSidebar on unmount', async () => {
    const { unmount } = render(<ControlledExtractionResultTab />);
    mockCloseSidebar.mockClear();

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});
