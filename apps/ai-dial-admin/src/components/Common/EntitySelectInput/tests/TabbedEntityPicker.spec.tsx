import { appContextMock } from '@/test-mocks/app-context';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { FlatAssets } from '@/src/components/Assets/FlatAssetGrid/models';
import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import TabbedEntityPicker from '../TabbedEntityPicker';
import { EntitySelectType, PickedEntity } from '../models';

const row = (name: string) => ({ name, path: name }) as AssetListItem;

const flat: Record<string, FlatAssets> = {};
const setFlat = (source: AssetSource, names: string[]) => {
  flat[source] = {
    rows: names.map(row),
    count: names.length,
    isLoading: false,
    hasError: false,
    refetch: vi.fn(),
  };
};

const appContext = vi.hoisted(() => ({ isUnitMode: false }));

beforeEach(() => {
  appContextMock.use(() => appContext);
});
vi.mock('@/src/hooks/use-flat-assets', () => ({
  useFlatAssets: (_view: string, source: string, isEnabled: boolean) =>
    isEnabled ? flat[source] : { rows: [], count: undefined, isLoading: false, hasError: false, refetch: vi.fn() },
}));

// Stand-ins for the tree and the grid: expose the callbacks the picker hands them and the names it marks selected.
vi.mock('../PublicEntityTree', () => ({
  default: ({
    onChangeSelectedPaths,
    onChangeSelectedPath,
  }: {
    onChangeSelectedPaths?: (paths: string[]) => void;
    onChangeSelectedPath?: (path: string | null) => void;
  }) => (
    <div>
      <button
        onClick={() =>
          (onChangeSelectedPaths ?? ((paths: string[]) => onChangeSelectedPath?.(paths[0] ?? null)))([
            'public/team/app/1.0',
          ])
        }
      >
        pick-public
      </button>
      <button onClick={() => onChangeSelectedPath?.(null)}>clear-public</button>
      <span>{onChangeSelectedPaths ? 'tree:multi' : 'tree:single'}</span>
    </div>
  ),
}));
vi.mock('@/src/components/Assets/FlatAssetGrid/FlatAssetGrid', () => ({
  default: ({
    source,
    assets,
    selectedNames,
    isSingleSelect,
    onSelectionChange,
  }: {
    source: string;
    isSingleSelect?: boolean;
    assets: FlatAssets;
    selectedNames: ReadonlySet<string>;
    onSelectionChange: (rows: AssetListItem[]) => void;
  }) => (
    <div role="group" aria-label={source}>
      <span>{`${source}-selected:${[...selectedNames].join(',')}`}</span>
      <span>{`${source}-${isSingleSelect ? 'single' : 'multi'}`}</span>
      <button onClick={() => onSelectionChange(assets.rows.filter((item) => item.name === 'assistant'))}>
        {`pick-${source}`}
      </button>
      <button onClick={() => onSelectionChange([])}>{`clear-${source}`}</button>
    </div>
  ),
}));

describe('TabbedEntityPicker', () => {
  const onChangeSelectedEntities = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    appContext.isUnitMode = false;
    setFlat(AssetSource.Platform, ['assistant', 'only-platform']);
    setFlat(AssetSource.ConfigFile, ['assistant', 'only-file']);
  });

  const renderPicker = () =>
    render(
      <TabbedEntityPicker
        entityType={EntitySelectType.Application}
        value=""
        isModalOpen
        onChangeSelectedEntities={onChangeSelectedEntities}
      />,
    );

  const lastReport = () => onChangeSelectedEntities.mock.calls.at(-1)?.[0] as PickedEntity[];
  const platformTab = () => screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.Platform) });

  test('offers a tab per source', () => {
    renderPicker();

    expect(screen.getByRole('tab', { name: AssetTabsI18nKey.Public })).toBeTruthy();
    expect(platformTab()).toBeTruthy();
    expect(screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.ConfigFile) })).toBeTruthy();
  });

  test('shows no tab row for a unit-mode caller, who has the public tree only', () => {
    appContext.isUnitMode = true;
    renderPicker();

    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('button', { name: 'pick-public' })).toBeTruthy();
  });

  test('reports a public tree pick with its path and source', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'pick-public' }));

    expect(lastReport()).toEqual([
      { source: AssetSource.Public, path: 'public/team/app/1.0', name: 'public/team/app/1.0' },
    ]);
  });

  test('keeps a pick made on one tab after visiting another', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'pick-public' }));
    await user.click(platformTab());
    await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));

    expect(lastReport()).toEqual([
      { source: AssetSource.Public, path: 'public/team/app/1.0', name: 'public/team/app/1.0' },
      { source: AssetSource.Platform, name: 'assistant' },
    ]);
  });

  test('treats a name present on both flat tabs as one selection shown on both', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));

    expect(lastReport()).toEqual([{ source: AssetSource.Platform, name: 'assistant' }]);
    expect(screen.getByText(`${AssetSource.ConfigFile}-selected:assistant`)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: `pick-${AssetSource.ConfigFile}` }));

    expect(lastReport()).toEqual([{ source: AssetSource.Platform, name: 'assistant' }]);
  });

  test('deselecting a name on one flat tab removes it from the other too', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));
    await user.click(screen.getByRole('button', { name: `clear-${AssetSource.Platform}` }));

    expect(lastReport()).toEqual([]);
    expect(screen.getByText(`${AssetSource.ConfigFile}-selected:`)).toBeTruthy();
  });

  test('attributes a name that only config.json has to the config.json source', async () => {
    const user = userEvent.setup();
    setFlat(AssetSource.Platform, ['other']);
    setFlat(AssetSource.ConfigFile, ['assistant']);
    renderPicker();

    await user.click(screen.getByRole('button', { name: `pick-${AssetSource.ConfigFile}` }));

    expect(lastReport()).toEqual([{ source: AssetSource.ConfigFile, name: 'assistant' }]);
  });
  describe('single selection', () => {
    const onChangeSelectedEntity = vi.fn();

    const renderSingle = (entityType = EntitySelectType.Application) =>
      render(
        <TabbedEntityPicker
          entityType={entityType}
          value=""
          isModalOpen
          onChangeSelectedEntity={onChangeSelectedEntity}
        />,
      );

    const lastEntity = () => onChangeSelectedEntity.mock.calls.at(-1)?.[0] as PickedEntity | null;

    test('asks the tree and both grids for single selection', () => {
      renderSingle();

      expect(screen.getByText('tree:single')).toBeTruthy();
      expect(screen.getByText(`${AssetSource.Platform}-single`)).toBeTruthy();
      expect(screen.getByText(`${AssetSource.ConfigFile}-single`)).toBeTruthy();
    });

    test('keeps multi-selection for the callers that pass the multi callback', () => {
      renderPicker();

      expect(screen.getByText('tree:multi')).toBeTruthy();
      expect(screen.getByText(`${AssetSource.Platform}-multi`)).toBeTruthy();
    });

    test('reports a Public pick as the one selected entity', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: 'pick-public' }));

      expect(lastEntity()).toEqual({
        source: AssetSource.Public,
        path: 'public/team/app/1.0',
        name: 'public/team/app/1.0',
      });
    });

    test('replaces a Public pick with a Platform pick and clears the tree', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: 'pick-public' }));
      await user.click(platformTab());
      await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));

      expect(lastEntity()).toEqual({ source: AssetSource.Platform, name: 'assistant' });
      expect(onChangeSelectedEntity).toHaveBeenCalledTimes(2);
    });

    test('replaces a Platform pick with a Public pick and clears the grids', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));
      await user.click(screen.getByRole('button', { name: 'pick-public' }));

      expect(lastEntity()).toEqual({
        source: AssetSource.Public,
        path: 'public/team/app/1.0',
        name: 'public/team/app/1.0',
      });
      expect(screen.getByText(`${AssetSource.Platform}-selected:`)).toBeTruthy();
      expect(screen.getByText(`${AssetSource.ConfigFile}-selected:`)).toBeTruthy();
    });

    test('reports null once the pick is cleared', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));
      await user.click(screen.getByRole('button', { name: `clear-${AssetSource.Platform}` }));

      expect(lastEntity()).toBeNull();
    });

    test('reports null when the Public pick is cleared and nothing else is picked', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: 'pick-public' }));
      await user.click(screen.getByRole('button', { name: 'clear-public' }));

      expect(lastEntity()).toBeNull();
    });

    test('treats a name on both flat tabs as one pick shown on both', async () => {
      const user = userEvent.setup();
      renderSingle();

      await user.click(screen.getByRole('button', { name: `pick-${AssetSource.Platform}` }));

      expect(screen.getByText(`${AssetSource.ConfigFile}-selected:assistant`)).toBeTruthy();
    });

    test('offers a model only the Platform and config.json tabs', () => {
      renderSingle(EntitySelectType.Model);

      expect(screen.getAllByRole('tab')).toHaveLength(2);
      expect(screen.queryByRole('tab', { name: AssetTabsI18nKey.Public })).toBeNull();
      expect(screen.queryByRole('button', { name: 'pick-public' })).toBeNull();
    });
  });
});
