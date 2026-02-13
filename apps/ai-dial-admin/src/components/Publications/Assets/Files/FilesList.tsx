import { GridApi, IRowNode } from 'ag-grid-community';
import { FC, useCallback } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { FILE_DOWNLOAD, FILE_PREVIEW, PREVIEW_EXTENSIONS } from '@/src/constants/file';
import {
  getDownloadOperation,
  getOpenInNewTabOperation,
  getPreviewOperation,
  getRemoveOperation,
} from '@/src/constants/grid-columns/actions';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getGridFileColumns, getGridFileData, getGridFileDataFromString } from '@/src/utils/files/grid-data';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { isAddAction } from '@/src/utils/publications';

interface Props {
  files: Partial<DialFile | string>[];
  action: ActionType;
  onChange?: (files: DialFile[]) => void;
}

const FilesList: FC<Props> = ({ files, action, onChange }) => {
  const t = useI18n();
  const download = useCallback((file?: DialFile) => {
    window.open(`/${FILE_DOWNLOAD}/?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const openInNewTab = useCallback((file?: DialFile) => {
    onOpenInNewTab(ApplicationRoute.Files, file);
  }, []);

  const preview = useCallback(async (file?: DialFile) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const remove = useCallback(
    (_?: DialFile, index?: number) => {
      if (index != null) {
        files?.splice(index, 1);
      }
      onChange?.(files as DialFile[]);
    },
    [files, onChange],
  );

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension);
  };

  const isOpenActionHidden = () => {
    return isAddAction(action);
  };

  const isRemoveActionHidden = () => {
    return !onChange;
  };

  const rowData =
    typeof files[0] === 'string' ? getGridFileDataFromString(files as string[]) : getGridFileData(files as DialFile[]);

  const actions = [
    getPreviewOperation(preview, isPreviewActionHidden),
    getOpenInNewTabOperation(openInNewTab, isOpenActionHidden),
    getDownloadOperation(download),
    getRemoveOperation(remove, isRemoveActionHidden),
  ];

  const columnDefs = getGridFileColumns(FILES_COLUMNS, actions);

  return <GridView emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }} columnDefs={columnDefs} rowData={rowData} />;
};

export default FilesList;
