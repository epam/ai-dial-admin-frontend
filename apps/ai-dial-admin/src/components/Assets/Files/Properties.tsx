import { FC, useCallback } from 'react';

import { GridApi, IRowNode } from 'ag-grid-community';

import AssetHeader from '@/src/components/Assets/Deployments/Header';
import Field from '@/src/components/Common/Field/Field';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Grid from '@/src/components/Grid/Grid';
import { FILE_DOWNLOAD, FILE_PREVIEW, PREVIEW_EXTENSIONS } from '@/src/constants/file';
import { getDownloadOperation, getPreviewOperation } from '@/src/constants/grid-columns/actions';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { BasicI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { getGridFileColumns, getGridFileData } from '@/src/utils/files/grid-data';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';

interface Props {
  file: DialFile;
  onChangeFile?: (file: DialFile) => void;
}

const FileProperties: FC<Props> = ({ file, onChangeFile }) => {
  const t = useI18n();

  const onChangePath = useCallback(
    (folderId: string) => {
      onChangeFile?.({ ...file, folderId });
    },
    [file, onChangeFile],
  );

  const download = useCallback((file?: DialFile) => {
    window.open(`/${FILE_DOWNLOAD}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const preview = useCallback(async (file?: DialFile) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(file?.path || '')}`, '_blank');
  }, []);

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension);
  };

  const rowData = getGridFileData([file]);
  const columnDefs = getGridFileColumns(
    [...FILES_COLUMNS],
    [getPreviewOperation(preview, isPreviewActionHidden), getDownloadOperation(download)],
  );

  return (
    <div className="h-full flex flex-col w-full">
      <AssetHeader asset={file} />

      <div className="flex flex-col gap-y-8 mt-8">
        <div className="flex flex-col">
          <Field fieldTitle={t(EntitiesI18nKey.Source)} />
          <Grid columnDefs={columnDefs} rowData={rowData} />
        </div>
        <FilePath
          value={file.folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={onChangePath}
          context={useFileFolder as unknown as () => AssetsFolderContext<Asset>}
        />
      </div>
    </div>
  );
};

export default FileProperties;
