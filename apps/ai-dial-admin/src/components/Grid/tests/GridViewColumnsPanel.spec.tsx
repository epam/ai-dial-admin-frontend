import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import GridView from '@/src/components/Grid/GridView/GridView';
import { COLUMN_PANEL_PREFIX } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';

let capturedColumnDefs: ColDef[] | undefined;
let onGridReadyCb: ((event: GridReadyEvent) => void) | undefined;

vi.mock('@/src/components/Grid/AgGridWrapper', () => ({
  default: (props: { columnDefs?: ColDef[]; onGridReady?: (event: GridReadyEvent) => void }) => {
    capturedColumnDefs = props.columnDefs;
    onGridReadyCb = props.onGridReady;
    return <section aria-label="grid" />;
  },
}));

const applyColumnState = vi.fn();
const setFilterModel = vi.fn();
const getFilterModel = vi.fn(() => ({}));
const getColumnState = vi.fn(() => []);

const gridApi = { applyColumnState, setFilterModel, getFilterModel, getColumnState } as unknown as GridApi;

const FLAT: ColDef[] = [
  { field: 'a', headerName: 'Alpha' },
  { field: 'b', headerName: 'Beta' },
];

const GROUPED = [
  {
    groupId: 'left',
    headerName: 'Left group',
    children: [
      { field: 'a', headerName: 'Alpha' },
      { field: 'b', headerName: 'Beta' },
    ],
  },
  { groupId: 'right', headerName: 'Right group', children: [{ field: 'c', headerName: 'Gamma' }] },
] as unknown as ColDef[];

const renderPanel = (columnDefs: ColDef[]) => {
  const result = render(
    <GridView columnDefs={columnDefs} rowData={[]} showColumnsPanel toggleColumnsPanel={vi.fn()} />,
  );
  onGridReadyCb?.({ api: gridApi } as GridReadyEvent);
  return result;
};

const checkboxFor = (field: string) => document.getElementById(`${COLUMN_PANEL_PREFIX}${field}`) as HTMLInputElement;

const leaves = (): string[] => {
  const flatten = (defs: ColDef[]): ColDef[] =>
    defs.flatMap((col) => {
      const children = (col as { children?: ColDef[] }).children;
      return children ? children : [col];
    });
  return flatten(capturedColumnDefs ?? []).map((col) => col.field as string);
};

beforeEach(() => {
  capturedColumnDefs = undefined;
  onGridReadyCb = undefined;
  vi.clearAllMocks();
  getFilterModel.mockReturnValue({});
  getColumnState.mockReturnValue([]);
  localStorage.clear();
});

describe('GridView columns panel :: flat grids', () => {
  test('lists every column with a checkbox', () => {
    renderPanel(FLAT);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  test('toggling a checkbox hides that column', async () => {
    const user = userEvent.setup();
    renderPanel(FLAT);

    await user.click(checkboxFor('a'));

    expect(capturedColumnDefs?.find((col) => col.field === 'a')?.hide).toBe(true);
  });

  test('shows no group label when the grid is not grouped', () => {
    renderPanel(FLAT);

    expect(screen.queryByText('Left group')).not.toBeInTheDocument();
  });
});

describe('GridView columns panel :: grouped grids', () => {
  test('lists the columns inside the groups rather than the groups', () => {
    renderPanel(GROUPED);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(checkboxFor('c')).toBeTruthy();
  });

  test('shows which group each column belongs to', () => {
    renderPanel(GROUPED);

    expect(screen.getAllByText('Left group')).toHaveLength(2);
    expect(screen.getByText('Right group')).toBeInTheDocument();
    expect(screen.queryByText('left')).not.toBeInTheDocument();
  });

  test('toggling a checkbox hides that column inside its group', async () => {
    const user = userEvent.setup();
    renderPanel(GROUPED);

    await user.click(checkboxFor('c'));

    expect(leaves()).toEqual(['a', 'b', 'c']);
    const gamma = (capturedColumnDefs?.[1] as { children?: ColDef[] }).children?.[0];
    expect(gamma?.hide).toBe(true);
  });

  test('clears the hidden column sort and filter through the grid api', async () => {
    const user = userEvent.setup();
    getFilterModel.mockReturnValue({ c: { type: 'contains', filter: 'x' } });
    renderPanel(GROUPED);

    await user.click(checkboxFor('c'));

    expect(applyColumnState).toHaveBeenCalledWith({ state: [{ colId: 'c', sort: null }] });
    expect(setFilterModel).toHaveBeenCalledWith({});
  });

  test('leaves the grid api alone when a column is shown rather than hidden', async () => {
    const user = userEvent.setup();
    renderPanel([
      { groupId: 'left', children: [{ field: 'a', headerName: 'Alpha', hide: true }] },
    ] as unknown as ColDef[]);

    await user.click(checkboxFor('a'));

    expect(applyColumnState).not.toHaveBeenCalled();
    expect(setFilterModel).not.toHaveBeenCalled();
  });

  test('offers the reset affordance once the state differs from the defaults', async () => {
    const user = userEvent.setup();
    renderPanel(GROUPED);

    expect(screen.queryByText(ButtonsI18nKey.ResetToDefault)).not.toBeInTheDocument();

    await user.click(checkboxFor('a'));

    expect(screen.getByText(ButtonsI18nKey.ResetToDefault)).toBeInTheDocument();
  });

  test('reset clears the sort and filter of a column it hides', async () => {
    const user = userEvent.setup();
    getFilterModel.mockReturnValue({ b: { type: 'contains', filter: 'x' } });
    renderPanel([
      { groupId: 'left', headerName: 'Left group', children: [{ field: 'b', headerName: 'Beta', hide: true }] },
    ] as unknown as ColDef[]);

    await user.click(checkboxFor('b'));
    applyColumnState.mockClear();
    setFilterModel.mockClear();
    await user.click(screen.getByText(ButtonsI18nKey.ResetToDefault));

    expect(applyColumnState).toHaveBeenCalledWith({ state: [{ colId: 'b', sort: null }] });
    expect(setFilterModel).toHaveBeenCalledWith({});
  });

  test('writes the visibility choice to storage under the view key', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'gridColumnsStategrouped-view',
      JSON.stringify({ columns: [{ colId: 'a' }, { colId: 'b' }, { colId: 'c' }], filters: {} }),
    );
    render(
      <GridView
        columnDefs={GROUPED}
        rowData={[]}
        showColumnsPanel
        storageKey="grouped-view"
        toggleColumnsPanel={vi.fn()}
      />,
    );
    onGridReadyCb?.({ api: gridApi } as GridReadyEvent);

    await user.click(checkboxFor('a'));

    const stored = JSON.parse(localStorage.getItem('gridColumnsStategrouped-view') as string);
    expect(stored.columns.find((col: { colId: string }) => col.colId === 'a')).toMatchObject({ hide: true });
  });

  test('restores a persisted visibility choice on mount', () => {
    localStorage.setItem(
      'gridColumnsStategrouped-view',
      JSON.stringify({ columns: [{ colId: 'a', hide: true }, { colId: 'b' }, { colId: 'c' }], filters: {} }),
    );
    render(
      <GridView
        columnDefs={GROUPED}
        rowData={[]}
        showColumnsPanel
        storageKey="grouped-view"
        toggleColumnsPanel={vi.fn()}
      />,
    );

    const alpha = (capturedColumnDefs?.[0] as { children?: ColDef[] }).children?.find((col) => col.field === 'a');
    expect(alpha?.hide).toBe(true);
  });

  test('reset returns the columns to the view defaults', async () => {
    const user = userEvent.setup();
    renderPanel(GROUPED);

    await user.click(checkboxFor('a'));
    await user.click(screen.getByText(ButtonsI18nKey.ResetToDefault));

    expect(capturedColumnDefs).toEqual(GROUPED);
    expect(screen.queryByText(ButtonsI18nKey.ResetToDefault)).not.toBeInTheDocument();
  });
});
