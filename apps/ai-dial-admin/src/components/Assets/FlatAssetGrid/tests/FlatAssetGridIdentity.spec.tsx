import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridApi } from 'ag-grid-community';
import { createRef } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import FlatAssetGrid from '@/src/components/Assets/FlatAssetGrid/FlatAssetGrid';
import { FlatAssetGridHandle, FlatAssets } from '@/src/components/Assets/FlatAssetGrid/models';
import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';

const row = (name: string, path: string): AssetListItem => ({ name, path, bucket: BucketType.Platform });
const assets = (rows: AssetListItem[]): FlatAssets => ({
  rows,
  count: rows.length,
  isLoading: false,
  hasError: false,
  refetch: vi.fn(),
});

const view = ApplicationRoute.PlatformPolicies;
const storageKey = `${GRID_COLUMNS_KEY}${view}:${AssetSource.Platform}`;

describe('FlatAssetGrid — real grid selection', () => {
  afterEach(() => localStorage.removeItem(storageKey));

  test('retains the selected path when rows are replaced and a filter hides it', async () => {
    const onSelectionChange = vi.fn();
    const grid: { api: GridApi | null } = { api: null };
    const onGridApiChange = (gridApi: GridApi | null) => {
      grid.api = gridApi;
    };
    const initialRows = [row('first', 'platform/team-a/shared'), row('second', 'platform/team-b/shared')];
    const renderGrid = (rows: AssetListItem[]) => (
      <FlatAssetGrid
        view={view}
        source={AssetSource.Platform}
        assets={assets(rows)}
        onSelectionChange={onSelectionChange}
        onGridApiChange={onGridApiChange}
      />
    );
    const { rerender } = render(renderGrid(initialRows));

    expect(await screen.findByRole('row', { name: /first/ })).toBeInTheDocument();
    await act(async () => {
      grid.api?.getRowNode(initialRows[0].path)?.setSelected(true, false, 'checkboxSelected');
    });
    await waitFor(() => expect(screen.getByRole('row', { name: /first/ })).toHaveAttribute('aria-selected', 'true'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([initialRows[0]]);

    const updatedRows = [
      row('second updated', 'platform/team-b/shared'),
      row('first updated', 'platform/team-a/shared'),
    ];
    rerender(renderGrid(updatedRows));
    const updated = await screen.findByRole('row', { name: /first updated/ });
    await waitFor(() => expect(updated).toHaveAttribute('aria-selected', 'true'));
    expect(grid.api?.getSelectedRows()).toEqual([updatedRows[1]]);

    await act(async () => {
      grid.api?.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'second' } });
    });
    expect(await screen.findByRole('row', { name: /second updated/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /first updated/ })).not.toBeInTheDocument();
    expect(grid.api?.getSelectedRows()).toEqual([updatedRows[1]]);
  });

  test('shows a filtered-out selected row in the delete confirmation', async () => {
    const grid: { api: GridApi | null } = { api: null };
    const gridRef = createRef<FlatAssetGridHandle>();
    const rows = [row('first', 'platform/team-a/first'), row('second', 'platform/team-b/second')];
    render(
      <FlatAssetGrid
        ref={gridRef}
        view={view}
        source={AssetSource.Platform}
        assets={assets(rows)}
        onGridApiChange={(gridApi) => {
          grid.api = gridApi;
        }}
      />,
    );
    expect(await screen.findByRole('row', { name: /first/ })).toBeInTheDocument();
    await act(async () => {
      grid.api?.getRowNode(rows[0].path)?.setSelected(true, false, 'checkboxSelected');
      grid.api?.getRowNode(rows[1].path)?.setSelected(true, false, 'checkboxSelected');
    });
    await waitFor(() => expect(screen.getByRole('row', { name: /first/ })).toHaveAttribute('aria-selected', 'true'));
    expect(grid.api?.getSelectedRows()).toHaveLength(2);
    await act(async () => {
      grid.api?.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'second' } });
    });
    await waitFor(() => expect(screen.queryByRole('row', { name: /first/ })).not.toBeInTheDocument());

    act(() => gridRef.current?.openDelete(grid.api?.getSelectedRows() ?? []));

    expect(await screen.findByRole('row', { name: /first.*team-a/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /second.*team-b/ })).toBeInTheDocument();
  });

  test('the kit header checkbox selects only filtered rows and preserves hidden selections', async () => {
    const user = userEvent.setup();
    const grid: { api: GridApi | null } = { api: null };
    const rows = [row('first', 'platform/team-a/first'), row('second', 'platform/team-b/second')];
    render(
      <FlatAssetGrid
        view={view}
        source={AssetSource.Platform}
        assets={assets(rows)}
        onGridApiChange={(gridApi) => {
          grid.api = gridApi;
        }}
      />,
    );
    expect(await screen.findByRole('row', { name: /first/ })).toBeInTheDocument();
    await act(async () => {
      grid.api?.getRowNode(rows[0].path)?.setSelected(true, false, 'checkboxSelected');
    });
    await waitFor(() => expect(screen.getByRole('row', { name: /first/ })).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByRole('row', { name: /first/ }).querySelector('.tabler-icon-check')).toBeInTheDocument();
    const selectionHeader = screen
      .getAllByRole('columnheader')
      .find((header) => within(header).queryByRole('checkbox'));
    expect(selectionHeader).toBeDefined();
    await waitFor(() => expect(selectionHeader!.querySelector('.tabler-icon-minus')).toBeInTheDocument());
    await act(async () => {
      grid.api?.setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'second' } });
    });
    await waitFor(() => expect(screen.queryByRole('row', { name: /first/ })).not.toBeInTheDocument());

    await user.click(within(selectionHeader!).getByRole('checkbox'));

    expect(grid.api?.getSelectedRows()).toEqual(expect.arrayContaining(rows));
    expect(selectionHeader!.querySelector('.tabler-icon-check')).toBeInTheDocument();
  });

  test('keeps single-picker selection exclusive and reports user selections', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const rows = [row('first', 'platform/first'), row('second', 'platform/second')];
    render(
      <FlatAssetGrid
        view={view}
        source={AssetSource.Platform}
        assets={assets(rows)}
        isSelectMode
        isSingleSelect
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(await screen.findByRole('radio', { name: 'first' }));
    expect(screen.getByRole('radio', { name: 'first' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'second' }));
    expect(screen.getByRole('radio', { name: 'second' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'first' })).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith([rows[1]]);
  });

  test('keeps multi-picker selections and applies names selected elsewhere without reporting them', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const rows = [row('first', 'platform/first'), row('second', 'platform/second')];
    const renderPicker = (selectedNames?: ReadonlySet<string>) => (
      <FlatAssetGrid
        view={view}
        source={AssetSource.Platform}
        assets={assets(rows)}
        isSelectMode
        selectedNames={selectedNames}
        onSelectionChange={onSelectionChange}
      />
    );
    const { rerender } = render(renderPicker());

    expect(await screen.findByRole('row', { name: /first/ })).toBeInTheDocument();
    const selectionHeader = screen
      .getAllByRole('columnheader')
      .find((header) => within(header).queryByRole('checkbox'));
    expect(selectionHeader).toBeDefined();
    await user.click(within(selectionHeader!).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(rows);

    onSelectionChange.mockClear();
    rerender(renderPicker(new Set(['second'])));
    const second = await screen.findByRole('row', { name: /second/ });
    await waitFor(() => expect(second).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByRole('row', { name: /first/ })).toHaveAttribute('aria-selected', 'false');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('keeps the selection column first when a saved data-column order exists', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ columns: [{ colId: 'costObject' }, { colId: 'name' }], filters: {}, sizedColIds: [] }),
    );
    const grid: { api: GridApi | null } = { api: null };
    render(
      <FlatAssetGrid
        view={view}
        source={AssetSource.Platform}
        assets={assets([row('first', 'platform/team-a/first')])}
        onGridApiChange={(gridApi) => {
          grid.api = gridApi;
        }}
      />,
    );

    expect(await screen.findByRole('row', { name: /first/ })).toBeInTheDocument();
    const selectionHeader = screen
      .getAllByRole('columnheader')
      .find((header) => within(header).queryByRole('checkbox'));
    expect(selectionHeader).toHaveAttribute('aria-colindex', '1');
    const ids = grid.api?.getAllDisplayedColumns().map((column) => column.getColId()) ?? [];
    expect(ids).toContain('costObject');
    expect(ids).toContain('name');
    expect(ids.indexOf('costObject')).toBeLessThan(ids.indexOf('name'));
  });
});
