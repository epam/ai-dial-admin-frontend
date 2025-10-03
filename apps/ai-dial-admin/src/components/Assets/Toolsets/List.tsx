'use client';

import { FC } from 'react';

import { bulkDeleteApps, moveApps, removeApp } from '@/src/app/[lang]/assets-toolsets/actions';
import { filterLatestVersions, getVersionsPerName } from '@/src/components/Assets/utils';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { APPS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';

const ToolsetsList: FC = () => {
  const { data } = useToolsetFolder();
  if (data == null) {
    return <Page403 />;
  }
  const names = filterNames(data);

  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data);

  return (
    <BaseEntityList
      baseColumns={APPS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.AssetsToolsets}
      removeEntity={removeApp}
      moveFiles={moveApps}
      bulkDelete={bulkDeleteApps}
      context={useAppsFolder as () => AssetsFolderContext<DialAssetApp | DialFile>}
      showFolders={true}
    />
  );
};

export default ToolsetsList;
