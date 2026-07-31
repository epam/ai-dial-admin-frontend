import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useCallback, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import { ExtractionResultTabUiState } from '../models';
import ExtractionResultTab from '../ExtractionResult';
import { createDefaultRunViewTabState } from '../use-run-view-tab-state';

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
  getMetricSnapshots: vi.fn().mockResolvedValue([]),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
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
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
  };
});

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ additionalGridOptions, rowData, columnDefs }: any) => (
    <div role="grid" aria-label="Analytics grid" data-column-defs={JSON.stringify(columnDefs ?? [])}>
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r1' } })}>Row 1</button>
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r2' } })}>Row 2</button>
      {(rowData ?? []).map((row: any, index: number) => (
        <button key={index} onClick={() => additionalGridOptions.onRowClicked({ data: row })}>
          Grid Row {index}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel', () => ({
  default: ({ toggleColumnsPanel }: any) => (
    <div role="dialog" aria-label="Columns panel">
      <button onClick={toggleColumnsPanel}>Close panel</button>
    </div>
  ),
}));

const mockRun = {
  id: 'run-1',
  name: 'Test Run',
  testSuiteRunId: 'tsr-1',
} as any;

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

const flattenCols = (cols: any[]): any[] =>
  cols.flatMap((col) => (Array.isArray(col.children) ? flattenCols(col.children) : [col]));

const getRenderedColumnDefs = (): any[] =>
  JSON.parse(screen.getByRole('grid', { name: 'Analytics grid' }).getAttribute('data-column-defs') ?? '[]');

describe('ExtractionResultTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders grid after loading without Columns button in tab body', async () => {
    render(<ControlledExtractionResultTab />);
    await waitFor(() => {
      expect(screen.getByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Columns })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Columns panel' })).not.toBeInTheDocument();
  });

  test('shows Columns panel when showTreePanel is true', async () => {
    render(<ControlledExtractionResultTab initialState={{ showTreePanel: true }} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Columns panel' })).toBeInTheDocument();
    });
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
              executionStatus: 'SUCCESS',
              testCaseName: 'Test Case 1',
            },
          ],
          snapshots: [],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    });

    expect(getTestCaseRunResultsMock).not.toHaveBeenCalled();
  });

  test('opens sidebar on row click in default mode', async () => {
    render(<ControlledExtractionResultTab />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
  });

  test('toggles sidebar closed on same row click', async () => {
    render(<ControlledExtractionResultTab />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  test('clicking a multi-turn TURN row opens detail with the real result id, not the composite group key', async () => {
    render(
      <ControlledExtractionResultTab
        initialState={{
          results: [
            {
              id: 'r1',
              testCaseId: 'tc1',
              runIndex: 0,
              turnIndex: 0,
              totalTurns: 2,
              responseStatusCode: 200,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'conversation',
            },
            {
              id: 'r2',
              testCaseId: 'tc1',
              runIndex: 0,
              turnIndex: 1,
              totalTurns: 2,
              responseStatusCode: 200,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'conversation',
            },
          ],
          snapshots: [],
        }}
      />,
    );

    // Projection order (defaultExpanded, singlesFirst, no singles here): [GROUP, TURN(r1), TURN(r2)].
    await waitFor(() => screen.getByRole('button', { name: 'Grid Row 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Grid Row 2' }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    const panelElement = mockShowSidebar.mock.calls[0][0];
    expect(panelElement.props.resultId).toBe('r2');
  });

  test('keeps result columns sortable when all results are single-turn (no grouping transform)', async () => {
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
            {
              id: 'r2',
              responseStatusCode: 200,
              runIndex: 1,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'Test Case 2',
            },
          ],
          snapshots: [],
        }}
      />,
    );

    await waitFor(() => screen.getByRole('grid', { name: 'Analytics grid' }));

    const cols = flattenCols(getRenderedColumnDefs());
    expect(cols.find((c) => c.colId === EXPANDER_COLUMN_CEL_ID)).toBeUndefined();
    expect(cols.length).toBeGreaterThan(0);
    expect(cols.some((c) => c.sortable === false)).toBe(false);
  });

  test('uses the sort-disabled grouped columns when a multi-turn conversation is present', async () => {
    render(
      <ControlledExtractionResultTab
        initialState={{
          results: [
            {
              id: 'r1',
              testCaseId: 'tc1',
              runIndex: 0,
              turnIndex: 0,
              totalTurns: 2,
              responseStatusCode: 200,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'conversation',
            },
            {
              id: 'r2',
              testCaseId: 'tc1',
              runIndex: 0,
              turnIndex: 1,
              totalTurns: 2,
              responseStatusCode: 200,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'conversation',
            },
          ],
          snapshots: [],
        }}
      />,
    );

    await waitFor(() => screen.getByRole('grid', { name: 'Analytics grid' }));

    const cols = flattenCols(getRenderedColumnDefs());
    expect(cols.find((c) => c.colId === EXPANDER_COLUMN_CEL_ID)).toBeDefined();
    expect(cols.filter((c) => c.colId !== EXPANDER_COLUMN_CEL_ID).every((c) => c.sortable === false)).toBe(true);
  });

  test('calls closeSidebar on unmount', async () => {
    const { unmount } = render(<ControlledExtractionResultTab />);
    mockCloseSidebar.mockClear();

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});
