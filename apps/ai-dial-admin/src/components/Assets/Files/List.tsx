'use client';

import { FC } from 'react';

import { bulkDeleteFiles, moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getGridFileData } from '@/src/utils/files/grid-data';

const FilesList: FC = () => {
  const { data } = useFileFolder();
  const gridFileData = getGridFileData(data || []);

  return (
    <BaseEntityList
      baseColumns={FILES_COLUMNS}
      data={gridFileData}
      route={ApplicationRoute.Files}
      onRemoveEntity={removeFile}
      onMoveFiles={moveFiles}
      getAssetContext={useFileFolder}
      onBulkDelete={bulkDeleteFiles}
    />
  );
};

export default FilesList;
