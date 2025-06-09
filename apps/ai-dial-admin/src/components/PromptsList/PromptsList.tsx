'use client';

import { FC } from 'react';

import { createPrompt, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { PROMPTS_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { filterLatestVersions, getVersionsPerName } from './prompts-list';
import { usePromptFolder } from '@/src/context/PromptFolderContext';

const PromptsList: FC = () => {
  const { data } = usePromptFolder();
  const names = data?.map((entity) => entity.name || '');
  const versionsMap = getVersionsPerName(data || []);
  const filteredData = filterLatestVersions(data);

  return (
    <BaseEntityList
      baseColumns={PROMPTS_COLUMNS}
      names={names}
      versionsMap={versionsMap}
      data={filteredData}
      route={ApplicationRoute.Prompts}
      createEntity={createPrompt}
      removeEntity={removePrompt}
      moveFiles={movePrompts}
      context={usePromptFolder}
      showFolders={true}
      showExport={true}
    />
  );
};

export default PromptsList;
