import { FC, useCallback } from 'react';
import { GridApi, IRowNode } from 'ag-grid-community';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialFile } from '@/src/models/dial/file';
import { ActionType } from '@/src/models/dial/publications';
import Grid from '@/src/components/Grid/Grid';
import { ApplicationRoute } from '@/src/types/routes';
import { FILE_DOWNLOAD, FILE_PREVIEW, PREVIEW_EXTENSIONS } from '@/src/constants/file';
import { getGridFileColumns, getGridFileData } from '@/src/utils/files/grid-data';
import {
  getDownloadOperation,
  getOpenInNewTabOperation,
  getPreviewOperation,
} from '@/src/constants/grid-columns/actions';

interface Props {
  files: Partial<DialFile>[];
  action: ActionType;
}

const FilesList: FC<Props> = ({ files, action }) => {
  const download = useCallback((file: DialFile) => {
    window.open(`/${FILE_DOWNLOAD}/?path=${encodeURIComponent(file.path)}`, '_blank');
  }, []);

  const openInNewTab = useCallback((file: DialFile) => {
    window.open(`${ApplicationRoute.Files}/${getEntityPath(ApplicationRoute.Files, file)}`, '_blank');
  }, []);

  const preview = useCallback(async (file: DialFile) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(file.path)}`, '_blank');
  }, []);

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension);
  };

  const isOpenActionHidden = () => {
    return action === ActionType.ADD;
  };

  const rowData = getGridFileData(files as DialFile[]);

  const actions = [
    getPreviewOperation(preview, isPreviewActionHidden),
    getOpenInNewTabOperation(openInNewTab, isOpenActionHidden),
    getDownloadOperation(download),
  ];

  const columnDefs = getGridFileColumns(FILES_COLUMNS, actions);

  return (
    <div data-testid="publication-files-list-grid">
      <Grid columnDefs={columnDefs} rowData={rowData} />
    </div>
  );
};

export default FilesList;
