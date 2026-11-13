'use client';

import { Tabs, TabItem } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import FlatAssetGrid from '@/src/components/Assets/FlatAssetGrid/FlatAssetGrid';
import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useFlatAssets } from '@/src/hooks/use-flat-assets';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { AssetSourceCounts, getAvailableSources, getDefaultSource } from '@/src/utils/files/asset-sources';
import { ENTITY_SELECT_CONFIGS } from './constants';
import { EntitySelectType, PickedEntity } from './models';
import PublicEntityTree from './PublicEntityTree';

interface Props {
  entityType: EntitySelectType;
  value: string;
  isModalOpen: boolean;
  onChangeSelectedPath?: (path: string | null) => void;
  onChangeSelectedPaths?: (paths: string[]) => void;
  onChangeSelectedEntities: (entities: PickedEntity[]) => void;
}

const TAB_LABEL_KEYS: Record<AssetSource, AssetTabsI18nKey> = {
  [AssetSource.Public]: AssetTabsI18nKey.Public,
  [AssetSource.Platform]: AssetTabsI18nKey.Platform,
  [AssetSource.ConfigFile]: AssetTabsI18nKey.ConfigFile,
};

/**
 * The same sources as the listing, one tab each. Every body stays mounted (hidden while inactive) so a pick made
 * on one tab survives a visit to another. The two flat sources share one set of names, because a platform and a
 * config.json entity of the same name are stored under the same key.
 */
const TabbedEntityPicker: FC<Props> = ({ entityType, onChangeSelectedEntities, ...treeProps }) => {
  const t = useI18n();
  const { isUnitMode } = useAppContext();
  const { route } = ENTITY_SELECT_CONFIGS[entityType];
  const sources = useMemo(() => getAvailableSources(route, isUnitMode), [route, isUnitMode]);
  const [activeSource, setActiveSource] = useState<AssetSource>(getDefaultSource(route));
  const [publicPaths, setPublicPaths] = useState<string[]>([]);
  const [flatNames, setFlatNames] = useState<ReadonlySet<string>>(new Set());
  const platform = useFlatAssets(route, AssetSource.Platform, sources.includes(AssetSource.Platform));
  const configFile = useFlatAssets(route, AssetSource.ConfigFile, sources.includes(AssetSource.ConfigFile));

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

  const report = useCallback(
    (paths: string[], names: ReadonlySet<string>) => {
      const platformNames = new Set(platform.rows.map((row) => row.name));
      onChangeSelectedEntities([
        ...paths.map((path) => ({ source: AssetSource.Public, path, name: path })),
        ...[...names].map((name) => ({
          source: platformNames.has(name) ? AssetSource.Platform : AssetSource.ConfigFile,
          name,
        })),
      ]);
    },
    [onChangeSelectedEntities, platform.rows],
  );

  const onChangePublicPaths = useCallback(
    (paths: string[]) => {
      setPublicPaths(paths);
      report(paths, flatNames);
    },
    [flatNames, report],
  );

  const onChangeFlatSelection = useCallback(
    (tabRows: AssetListItem[], selectedRows: AssetListItem[]) => {
      const tabNames = new Set(tabRows.map((row) => row.name));
      const next = new Set([...flatNames].filter((name) => !tabNames.has(name)));
      selectedRows.forEach((row) => next.add(row.name));
      setFlatNames(next);
      report(publicPaths, next);
    },
    [flatNames, publicPaths, report],
  );

  return (
    <div className="flex size-full min-h-0 flex-col">
      {sources.length > 1 && (
        <div className="px-3 pt-3">
          <Tabs
            ariaLabel={t(AssetTabsI18nKey.TabsLabel)}
            tabs={tabs}
            activeTabId={activeSource}
            onTabChange={(id) => setActiveSource(id as AssetSource)}
          />
        </div>
      )}
      <div className="min-h-0 flex-1">
        {sources.includes(AssetSource.Public) && (
          <div className={classNames('size-full', activeSource !== AssetSource.Public && 'hidden')}>
            <PublicEntityTree {...treeProps} entityType={entityType} onChangeSelectedPaths={onChangePublicPaths} />
          </div>
        )}
        {sources.includes(AssetSource.Platform) && (
          <div className={classNames('size-full p-3', activeSource !== AssetSource.Platform && 'hidden')}>
            <FlatAssetGrid
              isSelectMode
              view={route}
              source={AssetSource.Platform}
              assets={platform}
              selectedNames={flatNames}
              onSelectionChange={(rows) => onChangeFlatSelection(platform.rows, rows)}
            />
          </div>
        )}
        {sources.includes(AssetSource.ConfigFile) && (
          <div className={classNames('size-full p-3', activeSource !== AssetSource.ConfigFile && 'hidden')}>
            <FlatAssetGrid
              isSelectMode
              view={route}
              source={AssetSource.ConfigFile}
              assets={configFile}
              selectedNames={flatNames}
              onSelectionChange={(rows) => onChangeFlatSelection(configFile.rows, rows)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedEntityPicker;
