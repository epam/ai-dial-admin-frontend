'use client';

import { PrimaryButton, TabItem, Tabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { getFileManagerLabel } from '@/src/components/Assets/BaseAssetList/utils';
import FlatAssetGrid from '@/src/components/Assets/FlatAssetGrid/FlatAssetGrid';
import CreatePlatformEntity from '@/src/components/Assets/Platform/CreatePlatformEntity';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import { listViewTitleMap } from '@/src/components/ListView/constants';
import { AssetTabsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useFlatAssets } from '@/src/hooks/use-flat-assets';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetSource } from '@/src/models/dial/asset-source';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import {
  AssetSourceCounts,
  getAvailableSources,
  getDefaultSource,
  getHeaderCount,
  parseSourceParam,
} from '@/src/utils/files/asset-sources';
import { TAB_QUERY_PARAM } from './constants';

interface Props {
  view: ApplicationRoute;
  /** For the application create form on the Platform tab. */
  runners?: DialApplicationScheme[];
  translators?: ResourceInfo[];
  isUnsafeImportEnabled?: boolean;
}

const TAB_LABEL_KEYS: Record<AssetSource, AssetTabsI18nKey> = {
  [AssetSource.Public]: AssetTabsI18nKey.Public,
  [AssetSource.Platform]: AssetTabsI18nKey.Platform,
  [AssetSource.ConfigFile]: AssetTabsI18nKey.ConfigFile,
};

/**
 * One layout for every platform entity listing, Applications and Toolsets: a header (title, count), a tab row for the sources that exist (with the Create button at its end),
 * a tab row for the sources that exist, and the active source's body. Public is the file manager on the single
 * `public/` root; Platform and config.json are flat grids.
 */
const TabbedAssetList: FC<Props> = ({ view, runners, translators, isUnsafeImportEnabled }) => {
  const t = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isUnitMode } = useAppContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isTabletScreen = useIsTabletScreen();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const sources = useMemo(() => getAvailableSources(view, isUnitMode), [view, isUnitMode]);
  const activeSource = parseSourceParam(view, searchParams.get(TAB_QUERY_PARAM), sources);
  const platform = useFlatAssets(view, AssetSource.Platform, sources.includes(AssetSource.Platform));
  const configFile = useFlatAssets(view, AssetSource.ConfigFile, sources.includes(AssetSource.ConfigFile));

  const onChangeTab = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === getDefaultSource(view)) {
        params.delete(TAB_QUERY_PARAM);
      } else {
        params.set(TAB_QUERY_PARAM, id);
      }
      setGridApi(null);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, view],
  );

  // Public is a tree and is not counted, so it has no entry here and its tab shows no badge.
  const counts = useMemo<AssetSourceCounts>(
    () => ({ [AssetSource.Platform]: platform.count, [AssetSource.ConfigFile]: configFile.count }),
    [platform.count, configFile.count],
  );

  const tabs = useMemo<TabItem[]>(
    () =>
      sources.map((source) => ({
        id: source,
        label: t(TAB_LABEL_KEYS[source]),
        count: source === AssetSource.Public ? undefined : counts[source],
      })),
    [sources, t, counts],
  );

  const headerCount = getHeaderCount(sources, counts);
  const platformNames = useMemo(() => platform.rows.map((row) => row.name), [platform.rows]);
  const canCreate = !isReadOnlyAdmin && activeSource === AssetSource.Platform;
  const hasTabs = sources.length > 1;
  const onCloseCreate = useCallback(() => setIsCreateOpen(false), []);
  // With a tab row the button ends that row; a listing with a single source has no tab row, so it stays in the header.
  const createButton = canCreate ? (
    <PrimaryButton
      label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
      aria-label={t(ButtonsI18nKey.Create)}
      iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      onClick={() => setIsCreateOpen(true)}
    />
  ) : null;

  return (
    <div className="flex size-full flex-col">
      <div className="mb-3 flex h-[40px] min-w-0 flex-row items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <h1 className="dial-h1-text">{t(listViewTitleMap[view])}</h1>
          {headerCount != null && (
            <span className="dial-small-text text-secondary">
              {headerCount} {t(getFileManagerLabel(view)).toLowerCase()}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          {activeSource !== AssetSource.Public && <ResetFiltersButton gridApi={gridApi} />}
          {!hasTabs && createButton}
        </div>
      </div>
      {hasTabs && (
        <div className="mb-4 flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Tabs
              ariaLabel={t(AssetTabsI18nKey.TabsLabel)}
              tabs={tabs}
              activeTabId={activeSource}
              onTabChange={onChangeTab}
            />
          </div>
          {createButton}
        </div>
      )}
      <div className="min-h-0 flex-1">
        {activeSource === AssetSource.Public && (
          <BaseAssetList
            view={view}
            runners={runners}
            translators={translators}
            isUnsafeImportEnabled={isUnsafeImportEnabled}
          />
        )}
        {activeSource === AssetSource.Platform && (
          <FlatAssetGrid view={view} source={AssetSource.Platform} assets={platform} onGridApiChange={setGridApi} />
        )}
        {activeSource === AssetSource.ConfigFile && (
          <FlatAssetGrid view={view} source={AssetSource.ConfigFile} assets={configFile} onGridApiChange={setGridApi} />
        )}
      </div>
      {isCreateOpen && (
        <SaveValidationContextProvider>
          <CreatePlatformEntity
            view={view}
            isOpen={isCreateOpen}
            names={platformNames}
            runners={runners}
            translators={translators}
            onClose={onCloseCreate}
          />
        </SaveValidationContextProvider>
      )}
    </div>
  );
};

export default TabbedAssetList;
