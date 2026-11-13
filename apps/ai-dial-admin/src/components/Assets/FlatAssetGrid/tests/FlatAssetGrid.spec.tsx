import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import FlatAssetGrid from '../FlatAssetGrid';
import { getFlatAssetColumns } from '../columns';
import { FlatAssets } from '../models';
import { PlatformModalType, usePlatformAssetActions } from '../use-platform-asset-actions';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn() }));
vi.mock('../use-platform-asset-actions', () => ({
  PlatformModalType: { Duplicate: 'duplicate', Delete: 'delete' },
  usePlatformAssetActions: vi.fn(),
}));
vi.mock('@/src/components/Assets/BaseAssetList/utils', () => ({
  getEmptyStateContent: () => ({ title: 'empty-title', description: 'empty-description' }),
}));
vi.mock('@/src/components/Assets/Modals/DuplicatePlatformAsset', () => ({
  default: ({ onDuplicate }: any) => (
    <button onClick={() => onDuplicate({ name: 'copy' })}>duplicate-asset-modal</button>
  ),
}));
vi.mock('@/src/components/Assets/Platform/Keys/DuplicatePlatformKeyModal', () => ({
  default: () => <div>duplicate-key-modal</div>,
}));
vi.mock('@/src/components/Assets/Modals/DeletePlatformAssetsModal', () => ({
  default: ({ itemsToDelete, onRemove }: any) => (
    <button onClick={onRemove}>delete-modal:{itemsToDelete.map((item: AssetListItem) => item.name).join(',')}</button>
  ),
}));
vi.mock('@/src/components/Common/FileManager/utils', () => ({ isItemOpenable: () => true }));

// The real grid is covered by its own specs; this stand-in exposes what the component hands it: a link per row, the
// action-menu items of every row and the selection hooks.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs, additionalGridOptions, onGridReady }: any) => {
    const actions = columnDefs.find((column: any) => column.cellRendererParams?.items)?.cellRendererParams.items ?? [];
    const costObject = columnDefs.find((column: any) => column.colId === 'costObject');
    return (
      <div>
        <span>columns:{columnDefs.map((column: any) => column.colId ?? column.field).join(',')}</span>
        <span>selection:{additionalGridOptions.rowSelection ? 'on' : 'off'}</span>
        <button onClick={() => onGridReady({ api: (globalThis as any).gridApi })}>grid-ready</button>
        <button
          onClick={() =>
            additionalGridOptions.onSelectionChanged({
              source: 'checkboxSelected',
              api: { getSelectedRows: () => rowData },
            })
          }
        >
          select-all
        </button>
        <button
          onClick={() =>
            additionalGridOptions.onSelectionChanged({ source: 'api', api: { getSelectedRows: () => rowData } })
          }
        >
          select-from-api
        </button>
        {rowData.map((row: AssetListItem) => {
          const href = columnDefs[0].cellRendererParams.getHref(row);
          return (
            <div key={row.path} role="group" aria-label={row.name}>
              {href ? <a href={href}>{row.name}</a> : row.name}
              {costObject && <span>cost-object:{costObject.valueGetter({ data: row })}</span>}
              {actions.map((action: any) => (
                <button key={action.id} onClick={() => action.onClick(row)}>
                  {row.name}:{action.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    );
  },
}));

const row = (name: string, path = `platform/${name}`): AssetListItem => ({ name, path, bucket: BucketType.Platform });

const assets = (rows: AssetListItem[], overrides: Partial<FlatAssets> = {}): FlatAssets => ({
  rows,
  count: rows.length,
  isLoading: false,
  hasError: false,
  refetch: vi.fn(),
  ...overrides,
});

const onOpenDuplicate = vi.fn();
const onOpenDelete = vi.fn();
const onDuplicate = vi.fn();
const onDelete = vi.fn();
const onCloseModal = vi.fn();

const armActions = (state: Record<string, unknown> = {}) =>
  vi.mocked(usePlatformAssetActions).mockReturnValue({
    modalType: null,
    duplicateItem: null,
    deletedItems: null,
    onOpenDuplicate,
    onDuplicate,
    onOpenDelete,
    onDelete,
    onCloseModal,
    ...state,
  } as never);

const renderGrid = (props: Partial<React.ComponentProps<typeof FlatAssetGrid>> = {}) =>
  render(
    <FlatAssetGrid
      view={ApplicationRoute.PlatformModels}
      source={AssetSource.Platform}
      assets={assets([row('gpt'), row('claude')])}
      {...props}
    />,
  );

describe('FlatAssetGrid :: icon size', () => {
  test.each([AssetSource.Platform, AssetSource.ConfigFile] as const)('uses 28px entity icons for %s', (source) => {
    const columns = getFlatAssetColumns(ApplicationRoute.PlatformModels, source, () => undefined, {
      name: 'Name',
      costObject: 'Cost object',
    });

    expect(columns[0].cellRendererParams).toEqual(expect.objectContaining({ iconSize: 28 }));
  });
});

describe('FlatAssetGrid :: Platform source', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    armActions();
  });

  test('offers open, duplicate and delete on every row', () => {
    renderGrid();

    ['Open_in_new_tab', 'Duplicate', 'Delete'].forEach((operation) => {
      expect(screen.getByRole('button', { name: new RegExp(`^gpt:.*${operation}`) })).toBeInTheDocument();
    });
  });

  test('opens the duplicate and delete flows for the clicked row', async () => {
    renderGrid();

    await user.click(screen.getByRole('button', { name: /^gpt:.*Duplicate/ }));
    await user.click(screen.getByRole('button', { name: /^claude:.*Delete/ }));

    expect(onOpenDuplicate).toHaveBeenCalledWith(expect.objectContaining({ name: 'gpt' }));
    expect(onOpenDelete).toHaveBeenCalledWith([expect.objectContaining({ name: 'claude' })]);
  });

  test('opens a row in a new tab through the entity detail route', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderGrid();

    await user.click(screen.getByRole('button', { name: /^gpt:.*Open_in_new_tab/ }));

    expect(open).toHaveBeenCalledWith('/platform-models/gpt', '_blank');
  });

  test('links a row name to its detail route without the config.json flag', () => {
    renderGrid();

    expect(screen.getByRole('link', { name: 'gpt' })).toHaveAttribute('href', '/platform-models/gpt');
  });

  test('offers only open to a read-only admin and turns selection off', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);
    renderGrid();

    expect(screen.queryByRole('button', { name: /Duplicate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^gpt:.*Open_in_new_tab/ })).toBeInTheDocument();
    expect(screen.getByText('selection:off')).toBeInTheDocument();
  });

  test('has no selection column or bulk toolbar on the Platform tab', () => {
    renderGrid();

    expect(screen.getByText('selection:off')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  test('shows a spinner while the first read is pending', () => {
    renderGrid({ assets: assets([], { isLoading: true, count: undefined }) });

    expect(screen.queryByText(/columns:/)).not.toBeInTheDocument();
  });

  test('renders the duplicate and delete modals the actions hook asks for', async () => {
    armActions({ modalType: PlatformModalType.Duplicate, duplicateItem: { name: 'gpt' } });
    const { unmount } = renderGrid();
    await user.click(screen.getByRole('button', { name: 'duplicate-asset-modal' }));
    expect(onDuplicate).toHaveBeenCalledWith({ name: 'copy' });
    unmount();

    armActions({ modalType: PlatformModalType.Delete, deletedItems: [row('gpt')] });
    renderGrid();
    await user.click(screen.getByRole('button', { name: 'delete-modal:gpt' }));
    expect(onDelete).toHaveBeenCalled();
  });

  test('renders the key duplicate modal for keys', () => {
    armActions({ modalType: PlatformModalType.Duplicate, duplicateItem: { name: 'k' } });

    renderGrid({ view: ApplicationRoute.PlatformKeys });

    expect(screen.getByText('duplicate-key-modal')).toBeInTheDocument();
  });

  test.each([ApplicationRoute.PlatformPolicies, ApplicationRoute.PlatformPolicyAssignments])(
    'shows the cost object of every record in a Cost object column for %s',
    (view) => {
      renderGrid({ view, assets: assets([row('daily-cap'), row('team-cap', 'platform/team-a/team-cap')]) });

      expect(screen.getByText(/columns:.*costObject/)).toBeInTheDocument();
      expect(screen.getByText('cost-object:team-a')).toBeInTheDocument();
      expect(screen.getByText('cost-object:')).toBeInTheDocument();
    },
  );

  test('has no Cost object column for a view without cost objects', () => {
    renderGrid();

    expect(screen.getByText(/^columns:name,author,createdAt,updatedAt/)).toBeInTheDocument();
    expect(screen.queryByText(/cost-object/)).not.toBeInTheDocument();
  });
});

describe('FlatAssetGrid :: config.json source', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    armActions();
  });

  const configRows = [{ name: 'gpt', path: 'gpt', bucket: BucketType.Platform }];

  test('lists names only and offers only open, even to a full admin', () => {
    renderGrid({ source: AssetSource.ConfigFile, assets: assets(configRows) });

    expect(screen.getByText(/^columns:name,[^,]*$/)).toBeInTheDocument();
    expect(screen.queryByText(/author/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^gpt:.*Open_in_new_tab/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Duplicate/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByText('selection:off')).toBeInTheDocument();
  });

  test('links to the read-only detail route with configFile=true', () => {
    renderGrid({ source: AssetSource.ConfigFile, assets: assets(configRows) });

    expect(screen.getByRole('link', { name: 'gpt' })).toHaveAttribute('href', '/platform-models/gpt?configFile=true');
  });

  test('opens in a new tab with the same flag', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderGrid({ source: AssetSource.ConfigFile, assets: assets(configRows) });

    await user.click(screen.getByRole('button', { name: /^gpt:.*Open_in_new_tab/ }));

    expect(open).toHaveBeenCalledWith('/platform-models/gpt?configFile=true', '_blank');
  });

  test('keeps the plain address for a catalog schema, which resolves config-file schemas by id', () => {
    renderGrid({
      view: ApplicationRoute.PlatformCatalogSchemas,
      source: AssetSource.ConfigFile,
      assets: assets(configRows),
    });

    expect(screen.getByRole('link', { name: 'gpt' })).toHaveAttribute('href', '/platform-catalog-schemas/gpt');
  });
});

describe('FlatAssetGrid :: select mode', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    armActions();
  });

  test('has no row actions or bulk toolbar and turns multi-select on', async () => {
    renderGrid({ isSelectMode: true, onSelectionChange: vi.fn() });

    expect(screen.queryByRole('button', { name: /Delete|Duplicate|Open_in_new_tab/ })).not.toBeInTheDocument();
    expect(screen.getByText('selection:on')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'select-all' }));
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  test('reports a selection the user made', async () => {
    const onSelectionChange = vi.fn();
    renderGrid({ isSelectMode: true, onSelectionChange });

    await user.click(screen.getByRole('button', { name: 'select-all' }));

    expect(onSelectionChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'gpt' }),
      expect.objectContaining({ name: 'claude' }),
    ]);
  });

  test('does not report a selection it applied itself through the grid api', async () => {
    const onSelectionChange = vi.fn();
    renderGrid({ isSelectMode: true, onSelectionChange });

    await user.click(screen.getByRole('button', { name: 'select-from-api' }));

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('applies the names selected elsewhere to the grid through its api', async () => {
    const select = (value: boolean) => vi.fn(() => value);
    const gptNode = { data: { name: 'gpt' }, isSelected: select(false), setSelected: vi.fn() };
    const claudeNode = { data: { name: 'claude' }, isSelected: select(true), setSelected: vi.fn() };
    (globalThis as any).gridApi = {
      isDestroyed: () => false,
      forEachNode: (callback: (node: unknown) => void) => [gptNode, claudeNode].forEach(callback),
    };
    renderGrid({ isSelectMode: true, selectedNames: new Set(['gpt']) });

    await user.click(screen.getByRole('button', { name: 'grid-ready' }));

    await vi.waitFor(() => expect(gptNode.setSelected).toHaveBeenCalledWith(true, false, 'api'));
    expect(claudeNode.setSelected).toHaveBeenCalledWith(false, false, 'api');
    await act(async () => {});
    delete (globalThis as any).gridApi;
  });
});
