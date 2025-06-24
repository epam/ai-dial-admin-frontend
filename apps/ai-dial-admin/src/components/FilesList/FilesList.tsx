'use client';

import { FC } from 'react';

import { moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import Page403 from '@/src/components/Page403/Page403';
import { useFileFolder } from '@/src/context/FileFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getGridFileData } from './files-list';

const FilesList: FC = () => {
  const { data } = useFileFolder();
  if (data == null) {
    return <Page403 />;
  }
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
