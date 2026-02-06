'use client';

import { FC } from 'react';

import { bulkDeleteApps, createApp, moveApps, removeApp } from '@/src/app/[lang]/assets-applications/actions';
import { filterLatestVersions, getVersionsPerName } from '@/src/components/Assets/utils';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DEPLOYMENT_ASSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

interface Props {
  runners: DialApplicationScheme[];
}

const AppsList: FC<Props> = ({ runners }) => {
  const { data } = useAppsFolder();
  const names = filterNames(data);

  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data || []);

  return (
    <BaseEntityList
      baseColumns={DEPLOYMENT_ASSETS_COLUMNS}
      names={names}
      runners={runners}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.AssetsApplications}
      onRemoveEntity={removeApp}
      onCreateEntity={createApp}
      onMoveFiles={moveApps}
      onBulkDelete={bulkDeleteApps}
      getAssetContext={useAppsFolder}
    />
  );
};

export default AppsList;
