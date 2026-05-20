import { render, screen } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import TreeGrid from '../TreeGrid';
import { TreeRow } from '../types';

type Row = { name: string; parent: string | null };

// Captured between renders so tests can assert on column definitions handed
// to GridView. Reset in beforeEach.
let lastColumnDefs: ColDef[] | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    getIsEmptyData,
    emptyDataProps,
  }: {
    rowData: unknown[];
    getIsEmptyData?: () => boolean;
    emptyDataProps?: { title: string };
    columnDefs?: ColDef[];
  }) => {
    lastColumnDefs = columnDefs;
    const empty = getIsEmptyData ? getIsEmptyData() : !rowData?.length;
    if (empty && emptyDataProps) {
      return <div data-testid="empty">{emptyDataProps.title}</div>;
    }
    return (
      <div data-testid="grid">
        {(rowData as TreeRow<Row>[])?.map((row) => (
          <div key={row.id} data-testid={`row-${row.name}`} data-depth={row.depth}>
            {row.name}
          </div>
        ))}
      </div>
    );
  },
}));

beforeEach(() => {
  lastColumnDefs = undefined;
});

const makeTree = (rows: TreeRow<Row>[]): TreeRow<Row>[] => rows;

const root: TreeRow<Row> = {
  name: 'a',
  parent: null,
  id: 'a:',
  parentId: null,
  depth: 0,
  expanded: false,
  children: [
    {
      name: 'b',
      parent: 'a',
      id: 'b:a',
      parentId: 'a',
      depth: 1,
      expanded: false,
      children: [],
    },
  ],
};

const columnDefs = [{ field: 'name', headerName: 'Name' }];

describe('TreeGrid', () => {
  test('renders roots only when collapsed', () => {
    render(<TreeGrid rows={makeTree([root])} columnDefs={columnDefs} expanderColumnField="name" />);
    expect(screen.getByTestId('row-a')).toBeInTheDocument();
    expect(screen.queryByTestId('row-b')).not.toBeInTheDocument();
  });

  test('shows empty state when rows is empty', () => {
    render(<TreeGrid rows={[]} columnDefs={columnDefs} expanderColumnField="name" emptyDataTitle="No data" />);
    expect(screen.getByTestId('empty')).toHaveTextContent('No data');
  });

  test('leaf rows have correct depth attribute', () => {
    const expandedRoot: TreeRow<Row> = { ...root, expanded: true };
    render(<TreeGrid rows={makeTree([expandedRoot])} columnDefs={columnDefs} expanderColumnField="name" />);
    expect(screen.getByTestId('row-a')).toHaveAttribute('data-depth', '0');
    expect(screen.getByTestId('row-b')).toHaveAttribute('data-depth', '1');
  });

  test('renders synthetic rows', () => {
    const syntheticRoot: TreeRow<Row> = {
      ...root,
      synthetic: true,
      children: [{ ...root.children[0] }],
    };
    render(<TreeGrid rows={makeTree([syntheticRoot])} columnDefs={columnDefs} expanderColumnField="name" />);
    expect(screen.getByTestId('row-a')).toBeInTheDocument();
  });

  test('strips default column sort and disables sortable so tree order is preserved', () => {
    // Regression: a column carrying `sort: 'desc'` (as `TELEMETRY_GRID_COLUMNS`
    // does on `cost`) would otherwise let AG Grid scatter children away from
    // their parents on every rowData update, breaking expand/collapse rendering.
    const sortedCols: ColDef[] = [
      { field: 'name', headerName: 'Name', sort: 'asc', sortable: true },
      { field: 'cost', headerName: 'Cost', sort: 'desc', sortable: true },
    ];
    render(<TreeGrid rows={makeTree([root])} columnDefs={sortedCols} expanderColumnField="name" />);
    expect(lastColumnDefs).toBeDefined();
    for (const col of lastColumnDefs!) {
      // `sort: null` is the AG Grid-canonical "no sort" value (same effect as
      // omitting). Either null or undefined satisfies the regression intent.
      expect(col.sort ?? null).toBeNull();
      expect(col.sortable).toBe(false);
      expect(col.filter).toBe(false);
    }
  });

  test('new tree prop updates displayed rows', () => {
    const { rerender } = render(
      <TreeGrid rows={makeTree([root])} columnDefs={columnDefs} expanderColumnField="name" />,
    );
    expect(screen.queryByTestId('row-c')).not.toBeInTheDocument();

    const newRoot: TreeRow<Row> = {
      name: 'c',
      parent: null,
      id: 'c:',
      parentId: null,
      depth: 0,
      expanded: false,
      children: [],
    };
    rerender(<TreeGrid rows={makeTree([newRoot])} columnDefs={columnDefs} expanderColumnField="name" />);
    expect(screen.getByTestId('row-c')).toBeInTheDocument();
    expect(screen.queryByTestId('row-a')).not.toBeInTheDocument();
  });
});
