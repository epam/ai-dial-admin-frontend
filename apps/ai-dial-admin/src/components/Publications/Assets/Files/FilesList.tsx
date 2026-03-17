import { GridApi, IRowNode } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

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
import { ActionType, PublicationFile } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import {
  FileRowData,
  getGridFileColumns,
  getPublicationGridFileData,
  getPublicationGridFileDataFromString,
} from '@/src/utils/files/grid-data';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { isAddAction } from '@/src/utils/publications';

interface Props {
  files: PublicationFile[] | string[];
  action: ActionType;
  onChange?: (files: PublicationFile[]) => void;
  addedFiles?: File[];
  onRemoveAdded?: (index: number) => void;
}

const FilesList: FC<Props> = ({ files, action, onChange, addedFiles, onRemoveAdded }) => {
  const t = useI18n();
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const download = useCallback((file?: FileRowData) => {
    window.open(`${FILE_DOWNLOAD}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const openInNewTab = useCallback((file?: FileRowData) => {
    onOpenInNewTab(ApplicationRoute.Files, file);
  }, []);

  const preview = useCallback(async (file?: FileRowData) => {
    window.open(`${FILE_PREVIEW}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const remove = useCallback(
    (data?: FileRowData, index?: number) => {
      if (data?.path !== '') {
        if (index != null) {
          const newFiles = [...(filesRef.current as PublicationFile[])];
          newFiles?.splice(index, 1);
          onChange?.(newFiles);
        }
      } else {
        if (index != null) {
          onRemoveAdded?.(index - files.length);
        }
      }
    },
    [files, onChange, onRemoveAdded],
  );

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension) || node.data.path === '';
  };

  const isOpenActionHidden = () => {
    return isAddAction(action);
  };

  const isRemoveActionHidden = () => {
    return !onChange;
  };

  const rowData: FileRowData[] = useMemo(() => {
    return typeof files[0] === 'string'
      ? getPublicationGridFileDataFromString(files as string[])
      : getPublicationGridFileData(files as PublicationFile[], addedFiles || []);
  }, [files, addedFiles]);

  const actions = [
    getPreviewOperation(preview, isPreviewActionHidden),
    getOpenInNewTabOperation(openInNewTab, isOpenActionHidden),
    getDownloadOperation(download, isPreviewActionHidden),
    getRemoveOperation(remove, isRemoveActionHidden),
  ];

  const columnDefs = getGridFileColumns(FILES_COLUMNS, actions);

  return <GridView emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }} columnDefs={columnDefs} rowData={rowData} />;
};

export default FilesList;
