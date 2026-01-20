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
import { DEPLOYMENT_ASSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { DialFile } from '@/src/models/dial/file';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

const ToolsetsList: FC = () => {
  const { data } = useToolsetFolder();
  const names = filterNames(data);

  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data || []);

  return (
    <BaseEntityList
      baseColumns={DEPLOYMENT_ASSETS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.AssetsToolsets}
      onRemoveEntity={removeToolset}
      onCreateEntity={createToolset}
      onMoveFiles={moveToolsets}
      onBulkDelete={bulkDeleteToolsets}
      getAssetContext={useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>}
    />
  );
};

export default ToolsetsList;
