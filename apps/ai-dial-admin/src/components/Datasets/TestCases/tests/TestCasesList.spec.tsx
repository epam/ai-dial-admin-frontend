import { render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as actions from '@/src/app/[lang]/datasets/actions';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCaseItemType } from '@/src/types/evaluation';

import DatasetTestCasesList, { DatasetTestCasesActions } from '../TestCasesList';
import { GridRowType } from '@/src/types/grid-row-type';

type TestCase = Partial<DatasetTestCase>;

const createPageData = (content: TestCase[]) => ({
  page: 0,
  size: 1000,
  totalElements: content.length,
  totalPages: 1,
  content: content as DatasetTestCase[],
});

let capturedGridOptions: Record<string, unknown> | null = null;
let capturedOnCellChange: ((data: Record<string, unknown>, field: string, value: unknown) => void) | null = null;
let capturedRowData: Record<string, unknown>[] | null = null;
let capturedOnToggleExpand: ((groupKey: string) => void) | null = null;
let capturedTurnActionHandlers: Record<string, (row: any) => void> | null = null;
let capturedRemoveIconClick: ((row: any) => void) | null = null;

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getTestCases: vi.fn(),
  createTestCase: vi.fn(),
  importTestCase: vi.fn(),
  removeTestCase: vi.fn(),
  removeMultipleTestCases: vi.fn(),
  getDataset: vi.fn(),
}));

vi.mock('@/src/components/Grid/columns/turn-columns', () => ({
  getTurnActionsColumn: (handlers: any) => {
    capturedTurnActionHandlers = handlers;
    return { colId: 'action-turns' };
  },
}));

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ additionalGridOptions, rowData, children }: any) => {
    capturedGridOptions = additionalGridOptions;
    capturedRowData = rowData ?? null;
    return (
      <div>
        <div>List View Component</div>
        <div>{children}</div>
      </div>
    );
  },
}));

vi.mock('@/src/components/Datasets/utils/columns', () => ({
  getDatasetTestCaseColumns: ({ onCellChange, onToggleExpand }: any) => {
    capturedOnCellChange = onCellChange;
    capturedOnToggleExpand = onToggleExpand;
    return [];
  },
}));

vi.mock('@/src/components/Datasets/TestCases/Header', () => ({
  default: () => <div>Header Buttons</div>,
}));

vi.mock('@/src/constants/grid-columns/actions', async () => {
  const actual = await vi.importActual<any>('@/src/constants/grid-columns/actions');
  return {
    ...actual,
    getRemoveOperation: (onClick: any, ...rest: any[]) => {
      capturedRemoveIconClick = onClick;
      return actual.getRemoveOperation(onClick, ...rest);
    },
  };
});

vi.mock('@/src/components/EntityView/Modals/Delete/Delete', () => ({
  default: ({ entity }: any) => <div>{`Delete modal for ${entity?.id}`}</div>,
}));

describe('DatasetTestCasesList', () => {
  const mockOnDirtyChange = vi.fn();
  const perTurnSchemaDataset: Dataset = {
    id: 'ds-1',
    testCaseSchema: [{ name: 'value', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true }],
  };

  const multiTurnCase: TestCase = {
    id: 'case-1',
    testCaseName: 'Multi turn case',
    createdAt: 0,
    data: {},
    multiTurnData: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
  };

  const singleTurnCase: TestCase = {
    id: 'case-2',
    testCaseName: 'Single turn case',
    createdAt: 0,
    data: { value: 'only' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnToggleExpand = null;
    capturedTurnActionHandlers = null;
    capturedRemoveIconClick = null;
  });

  test('fetches test cases on mount using the dataset id', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([singleTurnCase]));

    render(<DatasetTestCasesList dataset={{ id: 'ds-1' }} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith('ds-1', 0, 1000, [], []);
    });
  });

  test('renders a multi-turn case as one collapsed GROUP row, not one row per turn', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => {
      expect(capturedRowData).not.toBeNull();
      expect(capturedRowData!.length).toBe(1);
    });
    expect(capturedRowData![0].rowType).toBe(GridRowType.GROUP);
    expect(capturedRowData![0].turnCount).toBe(3);
  });

  test('expanding a group emits the GROUP row followed by its TURN rows; collapsing returns to just the GROUP row', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => expect(capturedOnToggleExpand).not.toBeNull());

    capturedOnToggleExpand!('case-1');

    await waitFor(() => expect(capturedRowData!.length).toBe(4));
    expect(capturedRowData!.map((row) => row.rowType)).toEqual([
      GridRowType.GROUP,
      GridRowType.TURN,
      GridRowType.TURN,
      GridRowType.TURN,
    ]);

    capturedOnToggleExpand!('case-1');

    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    expect(capturedRowData![0].rowType).toBe(GridRowType.GROUP);
  });

  test('renders a single-turn case as a plain SINGLE row — regression: unchanged from before multi-turn', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([singleTurnCase]));

    render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => {
      expect(capturedRowData).not.toBeNull();
      expect(capturedRowData!.length).toBe(1);
    });
    expect(capturedRowData![0].rowType).toBe(GridRowType.SINGLE);
    expect(capturedRowData![0].turnCount).toBeUndefined();
    expect(capturedRowData![0].turns).toBeUndefined();
  });

  test('adding a turn to a single-turn case promotes it into an expanded two-turn group', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([singleTurnCase]));

    render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => expect(capturedTurnActionHandlers).not.toBeNull());

    capturedTurnActionHandlers!.onAddTurn('case-2');

    await waitFor(() => expect(capturedRowData!.length).toBe(3));
    expect(capturedRowData!.map((row) => row.rowType)).toEqual([GridRowType.GROUP, GridRowType.TURN, GridRowType.TURN]);
    expect(capturedRowData![0].turnCount).toBe(2);
  });

  test('deleting turns down to one demotes the case back to a plain SINGLE row', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => expect(capturedTurnActionHandlers).not.toBeNull());

    capturedTurnActionHandlers!.onDeleteTurn({ groupKey: 'case-1', _turnIndex: 2 });
    await waitFor(() => expect(capturedRowData!.length).toBe(3));

    capturedTurnActionHandlers!.onDeleteTurn({ groupKey: 'case-1', _turnIndex: 1 });
    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    expect(capturedRowData![0].rowType).toBe(GridRowType.SINGLE);
  });

  test('the row trash icon deletes only that turn on a TURN row, leaving the rest of the case intact', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    const { queryByText } = render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => expect(capturedOnToggleExpand).not.toBeNull());
    capturedOnToggleExpand!('case-1');
    await waitFor(() => expect(capturedRowData!.length).toBe(4));

    const turnRow = capturedRowData![2];
    expect(turnRow.rowType).toBe(GridRowType.TURN);

    capturedRemoveIconClick!(turnRow);

    await waitFor(() => expect(capturedRowData!.length).toBe(3));
    expect(capturedRowData![0].turnCount).toBe(2);
    expect(queryByText('Delete modal for case-1')).toBeNull();
  });

  test('the row trash icon still opens the delete-case modal on a GROUP row', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    const { findByText } = render(<DatasetTestCasesList dataset={perTurnSchemaDataset} />);

    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    const groupRow = capturedRowData![0];
    expect(groupRow.rowType).toBe(GridRowType.GROUP);

    capturedRemoveIconClick!(groupRow);

    expect(await findByText('Delete modal for case-1')).toBeInTheDocument();
    expect(capturedRowData!.length).toBe(1);
  });

  test('getDirtyTestCases returns a collapsed multi-turn DTO after editing a turn, including while the group is collapsed', async () => {
    const actionsRef = createRef<DatasetTestCasesActions | null>();
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([multiTurnCase]));

    render(
      <DatasetTestCasesList
        dataset={perTurnSchemaDataset}
        testCasesActionsRef={actionsRef}
        onDirtyChange={mockOnDirtyChange}
      />,
    );

    await waitFor(() => expect(capturedOnCellChange).not.toBeNull());
    expect(capturedRowData!.length).toBe(1); // still collapsed — never toggled

    capturedOnCellChange!({ id: 'case-1', _turnIndex: 1, data: { value: 'b' } }, 'value', 'edited-b');

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].data).toEqual({});
    expect(dirty[0].multiTurnData).toEqual([{ value: 'a' }, { value: 'edited-b' }, { value: 'c' }]);
  });
});
