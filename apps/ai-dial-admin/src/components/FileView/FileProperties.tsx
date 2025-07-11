import { FC, useCallback } from 'react';

import { GridApi, IRowNode } from 'ag-grid-community';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import Field from '@/src/components/Common/Field/Field';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
// import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { FILES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { getGridFileColumns, getGridFileData } from '@/src/utils/files/grid-data';
import Grid from '@/src/components/Grid/Grid';
import { FILE_DOWNLOAD, FILE_PREVIEW, PREVIEW_EXTENSIONS } from '@/src/constants/file';
import { BasicI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { getDownloadOperation, getPreviewOperation } from '@/src/constants/grid-columns/actions';

interface Props {
  file: DialFile;
  onChangeFile?: (file: DialFile) => void;
}

const FileProperties: FC<Props> = ({ file, onChangeFile }) => {
  const t = useI18n() as (t: string) => string;

  const onChangePath = useCallback(
    (folderId: string) => {
      onChangeFile?.({ ...file, folderId });
    },
    [file, onChangeFile],
  );

  const download = useCallback((file: DialFile) => {
    window.open(`/${FILE_DOWNLOAD}?path=${encodeURIComponent(file.path)}`, '_blank');
  }, []);

  const preview = useCallback(async (file: DialFile) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(file.path)}`, '_blank');
  }, []);

  const isPreviewActionHidden = (_: GridApi, node: IRowNode) => {
    return !PREVIEW_EXTENSIONS.includes(node.data.extension);
  };

  const rowData = getGridFileData([file]);
  const columnDefs = getGridFileColumns(FILES_COLUMNS, [
    getPreviewOperation(preview, isPreviewActionHidden),
    getDownloadOperation(download),
  ]);

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
      {/* will be uncommented after BE implement author */}
      {/* <div className="flex flex-row gap-10">
        <LabeledText label="Author" text={file.author} />
      </div> */}

      {/* <div className="mt-8 pt-8"> */}
      <div>
        <div className="flex flex-col gap-6">
          <div className="lg:w-[35%]">
            <TextInputField
              elementId="name"
              fieldTitle={t(CreateI18nKey.NameTitle)}
              placeholder={t(CreateI18nKey.NamePlaceholder)}
              value={file.name}
              disabled={true}
              iconAfterInput={<CopyButton field={file.name} />}
            />
          </div>
          <div>
            <Field fieldTitle={t(BasicI18nKey.Source)} />
            <Grid columnDefs={columnDefs} rowData={rowData} />
          </div>
          <div className="lg:w-[35%]">
            <FilePath
              value={file.folderId}
              label={t(CreateI18nKey.StoragePathTitle)}
              modalTitle={t(BasicI18nKey.MoveToFolder)}
              placeholder={t(CreateI18nKey.StoragePathPlaceholder)}
              onChange={onChangePath}
              context={useFileFolder}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileProperties;
