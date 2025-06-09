'use client';

import { FC } from 'react';

import { FILES_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { useFileFolder } from '@/src/context/FileFolderContext';
import { moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
import { getGridFileData } from './files-list';

const FilesList: FC = () => {
  const { data } = useFileFolder();
  const gridFileData = getGridFileData(data);

  return (
    <BaseEntityList
      baseColumns={FILES_COLUMNS}
      data={gridFileData}
      route={ApplicationRoute.Files}
      removeEntity={removeFile}
      moveFiles={moveFiles}
      context={useFileFolder}
      showFolders={true}
      showExport={true}
    />
  );
};

export default FilesList;
