'use client';

import { FC } from 'react';

import { bulkDeletePrompts, createPrompt, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { filterLatestVersions, getVersionsPerName } from '@/src/components/Assets/utils';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { ASSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

const PromptsList: FC = () => {
  const { data } = usePromptFolder();
  if (data == null) {
    return <Page403 />;
  }
  const names = filterNames(data);

  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data);

  return (
    <BaseEntityList
      baseColumns={ASSETS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.Prompts}
      createEntity={createPrompt}
      removeEntity={removePrompt}
      moveFiles={movePrompts}
      bulkDelete={bulkDeletePrompts}
      context={usePromptFolder as () => AssetsFolderContext<DialFile | DialPrompt>}
      showFolders={true}
      showExport={true}
    />
  );
};

export default PromptsList;
