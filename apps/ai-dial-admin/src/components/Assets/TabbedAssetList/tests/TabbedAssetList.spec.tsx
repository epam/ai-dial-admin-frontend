import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { FlatAssets } from '@/src/components/Assets/FlatAssetGrid/models';
import { AssetTabsI18nKey, ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useFlatAssets } from '@/src/hooks/use-flat-assets';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import TabbedAssetList from '../TabbedAssetList';

const appContext = vi.hoisted(() => ({ isUnitMode: false }));

vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => appContext }));
vi.mock('@/src/hooks/use-flat-assets', () => ({ useFlatAssets: vi.fn() }));
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn() }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsTabletScreen: () => false }));
vi.mock('@/src/components/ListView/Header/ResetFiltersButton', () => ({ default: () => null }));
vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: { view: string }) => <div>public-tree:{view}</div>,
}));
vi.mock('@/src/components/Assets/FlatAssetGrid/FlatAssetGrid', () => ({
  default: ({ source, assets }: { source: string; assets: { rows: unknown[] } }) => (
    <div>
      flat-grid:{source}:{assets.rows.length}
    </div>
  ),
}));
vi.mock('@/src/components/Assets/Platform/CreatePlatformEntity', () => ({
  default: ({ view, names }: { view: string; names: string[] }) => (
    <div>
      create-platform-entity:{view}:{names.join(',')}
    </div>
  ),
}));
vi.mock('@/src/components/Assets/BaseAssetList/utils', () => ({
  getFileManagerLabel: () => 'FileManager.Models',
}));

const flat = (count: number | undefined, overrides: Partial<FlatAssets> = {}): FlatAssets => ({
  rows: Array.from({ length: count ?? 0 }, (_, index) => ({
    name: `row-${index}`,
    path: `platform/row-${index}`,
    bucket: 'platform' as never,
  })),
  count,
  isLoading: false,
  hasError: count === undefined,
  refetch: vi.fn(),
  ...overrides,
});

const replace = vi.fn();
let counts: Record<AssetSource.Platform | AssetSource.ConfigFile, FlatAssets>;

const renderList = (view: ApplicationRoute, query = '') => {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
  return render(<TabbedAssetList view={view} />);
};

describe('TabbedAssetList', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    appContext.isUnitMode = false;
    counts = { [AssetSource.Platform]: flat(5), [AssetSource.ConfigFile]: flat(3) };
    vi.mocked(useRouter).mockReturnValue({ replace } as never);
    vi.mocked(usePathname).mockReturnValue('/assets-applications');
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
    vi.mocked(useFlatAssets).mockImplementation(
      ((_: unknown, source: AssetSource.Platform | AssetSource.ConfigFile) => counts[source]) as never,
    );
  });

  describe('tabs', () => {
    test('shows Public, Platform and config.json for Applications, with Public selected by default', () => {
      renderList(ApplicationRoute.AssetsApplications);

      const tabs = screen.getAllByRole('tab');
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        expect.stringContaining(AssetTabsI18nKey.Public),
        expect.stringContaining(AssetTabsI18nKey.Platform),
        expect.stringContaining(AssetTabsI18nKey.ConfigFile),
      ]);
      expect(screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.Public) })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByText(`public-tree:${ApplicationRoute.AssetsApplications}`)).toBeInTheDocument();
    });

    test('shows Platform and config.json for Models, with Platform selected by default', () => {
      renderList(ApplicationRoute.PlatformModels);

      expect(screen.getAllByRole('tab')).toHaveLength(2);
      expect(screen.queryByRole('tab', { name: new RegExp(AssetTabsI18nKey.Public) })).not.toBeInTheDocument();
      expect(screen.getByText(`flat-grid:${AssetSource.Platform}:5`)).toBeInTheDocument();
    });

    test('renders no tab row for Keys, which has a single source', () => {
      renderList(ApplicationRoute.PlatformKeys);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText(`flat-grid:${AssetSource.Platform}:5`)).toBeInTheDocument();
    });

    test('offers only the Public tree, with no tab row, to a unit-mode user on Applications', () => {
      appContext.isUnitMode = true;

      renderList(ApplicationRoute.AssetsApplications);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText(`public-tree:${ApplicationRoute.AssetsApplications}`)).toBeInTheDocument();
      expect(useFlatAssets).toHaveBeenCalledWith(ApplicationRoute.AssetsApplications, AssetSource.Platform, false);
      expect(useFlatAssets).toHaveBeenCalledWith(ApplicationRoute.AssetsApplications, AssetSource.ConfigFile, false);
    });

    test('follows the tab query parameter', () => {
      renderList(ApplicationRoute.AssetsApplications, 'tab=config');

      expect(screen.getByText(`flat-grid:${AssetSource.ConfigFile}:3`)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.ConfigFile) })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    test('falls back to the default tab for an unavailable tab parameter', () => {
      renderList(ApplicationRoute.PlatformKeys, 'tab=config');

      expect(screen.getByText(`flat-grid:${AssetSource.Platform}:5`)).toBeInTheDocument();
    });

    test('writes a non-default tab to the query parameter', async () => {
      renderList(ApplicationRoute.AssetsApplications);

      await user.click(screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.Platform) }));

      expect(replace).toHaveBeenCalledWith('/assets-applications?tab=platform', { scroll: false });
    });

    test('drops the query parameter when the default tab is selected again', async () => {
      renderList(ApplicationRoute.AssetsApplications, 'tab=platform');

      await user.click(screen.getByRole('tab', { name: new RegExp(AssetTabsI18nKey.Public) }));

      expect(replace).toHaveBeenCalledWith('/assets-applications', { scroll: false });
    });
  });

  describe('badges', () => {
    test('shows the Platform and config.json counts, and none on Public', () => {
      renderList(ApplicationRoute.AssetsApplications);

      expect(screen.getByRole('tab', { name: new RegExp(`${AssetTabsI18nKey.Platform}.*5`) })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: new RegExp(`${AssetTabsI18nKey.ConfigFile}.*3`) })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: AssetTabsI18nKey.Public })).toBeInTheDocument();
    });

    test('shows no badge for a source whose read failed, rather than a zero', () => {
      counts[AssetSource.ConfigFile] = flat(undefined);

      renderList(ApplicationRoute.AssetsApplications);

      expect(screen.getByRole('tab', { name: AssetTabsI18nKey.ConfigFile })).toBeInTheDocument();
    });
  });

  describe('header count', () => {
    const countLabel = (count: number) => `${count} ${'FileManager.Models'.toLowerCase()}`;

    test('shows the Platform plus config.json total for an entity without a Public tab', () => {
      renderList(ApplicationRoute.PlatformModels);

      expect(screen.getByRole('heading', { level: 1, name: MenuI18nKey.Models })).toBeInTheDocument();
      expect(screen.getByText(countLabel(8))).toBeInTheDocument();
    });

    test('shows the Platform count alone for Keys', () => {
      renderList(ApplicationRoute.PlatformKeys);

      expect(screen.getByText(countLabel(5))).toBeInTheDocument();
    });

    test('shows no count for Applications, whose Public tree is not counted', () => {
      renderList(ApplicationRoute.AssetsApplications);

      expect(screen.queryByText(/filemanager\.models/)).not.toBeInTheDocument();
    });

    test('withholds the total when one source failed to load', () => {
      counts[AssetSource.ConfigFile] = flat(undefined);

      renderList(ApplicationRoute.PlatformModels);

      expect(screen.queryByText(/filemanager\.models/)).not.toBeInTheDocument();
    });

    test('keeps the count when another tab is selected', () => {
      renderList(ApplicationRoute.PlatformModels, 'tab=config');

      expect(screen.getByText(countLabel(8))).toBeInTheDocument();
    });
  });

  describe('Create button', () => {
    test('is shown on the Platform tab and opens the platform create popup with the platform names', async () => {
      renderList(ApplicationRoute.PlatformModels);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

      expect(
        screen.getByText('create-platform-entity:/platform-models:row-0,row-1,row-2,row-3,row-4'),
      ).toBeInTheDocument();
    });

    test('is shown for a single-source listing such as Keys', () => {
      renderList(ApplicationRoute.PlatformKeys);

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
    });

    test('is hidden on the Public tab, which has its own Create dropdown', () => {
      renderList(ApplicationRoute.AssetsApplications);

      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).not.toBeInTheDocument();
    });

    test('is hidden on the config.json tab', () => {
      renderList(ApplicationRoute.PlatformModels, 'tab=config');

      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).not.toBeInTheDocument();
    });

    test('is shown on the Platform tab of Applications', () => {
      renderList(ApplicationRoute.AssetsApplications, 'tab=platform');

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
    });

    test('is hidden for a read-only admin', () => {
      vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

      renderList(ApplicationRoute.PlatformModels);

      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).not.toBeInTheDocument();
    });
  });
});
