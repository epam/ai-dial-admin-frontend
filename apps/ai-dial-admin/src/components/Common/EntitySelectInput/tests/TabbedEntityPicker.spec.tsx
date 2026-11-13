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

vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => appContext }));
vi.mock('@/src/hooks/use-flat-assets', () => ({
  useFlatAssets: (_view: string, source: string, isEnabled: boolean) =>
    isEnabled ? flat[source] : { rows: [], count: undefined, isLoading: false, hasError: false, refetch: vi.fn() },
}));

// Stand-ins for the tree and the grid: expose the callbacks the picker hands them and the names it marks selected.
vi.mock('../PublicEntityTree', () => ({
  default: ({ onChangeSelectedPaths }: { onChangeSelectedPaths?: (paths: string[]) => void }) => (
    <div>
      <button onClick={() => onChangeSelectedPaths?.(['public/team/app/1.0'])}>pick-public</button>
    </div>
  ),
}));
vi.mock('@/src/components/Assets/FlatAssetGrid/FlatAssetGrid', () => ({
  default: ({
    source,
    assets,
    selectedNames,
    onSelectionChange,
  }: {
    source: string;
    assets: FlatAssets;
    selectedNames: ReadonlySet<string>;
    onSelectionChange: (rows: AssetListItem[]) => void;
  }) => (
    <div role="group" aria-label={source}>
      <span>{`${source}-selected:${[...selectedNames].join(',')}`}</span>
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
});
