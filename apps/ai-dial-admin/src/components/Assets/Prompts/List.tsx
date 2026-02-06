'use client';

import { FC } from 'react';

import { bulkDeletePrompts, createPrompt, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { filterLatestVersions, getVersionsPerName } from '@/src/components/Assets/utils';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { NON_DEPLOYMENT_ASSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

const PromptsList: FC = () => {
  const { data } = usePromptFolder();
  const names = filterNames(data);

  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data || []);

  return (
    <BaseEntityList
      baseColumns={NON_DEPLOYMENT_ASSETS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.Prompts}
      onCreateEntity={createPrompt}
      onRemoveEntity={removePrompt}
      onMoveFiles={movePrompts}
      onBulkDelete={bulkDeletePrompts}
      getAssetContext={usePromptFolder as unknown as () => AssetsFolderContext<Asset>}
    />
  );
};

export default PromptsList;
