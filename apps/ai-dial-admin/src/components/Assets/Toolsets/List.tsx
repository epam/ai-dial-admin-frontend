'use client';

import { FC } from 'react';

import {
  bulkDeleteToolsets,
  createToolset,
  moveToolsets,
  removeToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { filterLatestVersions, getVersionsPerName } from '@/src/components/Assets/utils';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { DEPLOYMENT_ASSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { DialFile } from '@/src/models/dial/file';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

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
      baseColumns={DEPLOYMENT_ASSETS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.AssetsToolsets}
      removeEntity={removeToolset}
      createEntity={createToolset}
      moveFiles={moveToolsets}
      bulkDelete={bulkDeleteToolsets}
      context={useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>}
    />
  );
};

export default ToolsetsList;
