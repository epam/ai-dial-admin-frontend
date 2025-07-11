'use client';

import { FC } from 'react';

import { createPrompt, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { PROMPTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { filterLatestVersions, getVersionsPerName } from './utils';

const PromptsList: FC = () => {
  const { data } = usePromptFolder();
  if (data == null) {
    return <Page403 />;
  }
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
