import { FC, useCallback } from 'react';
import { GridApi, IRowNode } from 'ag-grid-community';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialFile } from '@/src/models/dial/file';
import { ActionType } from '@/src/models/dial/publications';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { ApplicationRoute } from '@/src/types/routes';
import { FILE_DOWNLOAD, FILE_PREVIEW, PREVIEW_EXTENSIONS } from '@/src/constants/file';
import { getGridFileColumns, getGridFileData, getGridFileDataFromString } from '@/src/utils/files/grid-data';
import {
  getDownloadOperation,
  getOpenInNewTabOperation,
  getPreviewOperation,
} from '@/src/constants/grid-columns/actions';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { isAddAction } from '@/src/utils/publications';

interface Props {
  files: Partial<DialFile | string>[];
  action: ActionType;
}

const FilesList: FC<Props> = ({ files, action }) => {
  const download = useCallback((file?: DialFile) => {
    window.open(`/${FILE_DOWNLOAD}/?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const openInNewTab = useCallback((file?: DialFile) => {
    onOpenInNewTab(ApplicationRoute.Files, file);
  }, []);

  const preview = useCallback(async (file?: DialFile) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension);
  };

  const isOpenActionHidden = () => {
    return isAddAction(action);
  };

  const rowData =
    typeof files[0] === 'string' ? getGridFileDataFromString(files as string[]) : getGridFileData(files as DialFile[]);

  const actions = [
    getPreviewOperation(preview, isPreviewActionHidden),
    getOpenInNewTabOperation(openInNewTab, isOpenActionHidden),
    getDownloadOperation(download),
  ];

  const columnDefs = getGridFileColumns(FILES_COLUMNS, actions);

  return <AgGridWrapper columnDefs={columnDefs} rowData={rowData} />;
};

export default FilesList;
