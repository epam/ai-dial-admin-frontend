import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialFileIcon, DialLoadFileAreaField, SIZE_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions } from 'ag-grid-community';

import { getTestSuiteFiles, uploadTestSuiteFiles } from '@/src/app/[lang]/test-suites/actions';
import { getFormDataForUpload } from '@/src/components/EntityListView/HeaderButtons/utils';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { MAX_FILE_SIZE_MB } from '@/src/constants/file';
import { DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CustomFile } from '@/src/models/dial/file';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { generateCustomFileGridData } from '@/src/utils/files/grid-data';

const MAX_FILES_COUNT = 30;
const MAX_TOTAL_FILE_SIZE_MB = 64;
const MAX_TOTAL_FILE_SIZE_BYTES = MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024;

interface Props {
  id?: string;
  value?: string;
  selectedFilePath: string | null;
  onChangeSelectedFilePath: (filePath: string | null) => void;
}

const ApplicationFileManager: FC<Props> = ({ id, value, selectedFilePath, onChangeSelectedFilePath }) => {
  const t = useI18n();
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);

  const [files, setFiles] = useState<CustomFile[]>([]);
  // const [separateFileMap, setSeparateFileMap] = useState(new Map<string, FileImportMap>());

  useEffect(() => {
    getTestSuiteFiles(id as string).then((res) => {
      setFiles(res || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFileIcon = (name: string) => {
    return <DialFileIcon extension={getNameExtensionFromFile(name).extension} />;
  };

  const onChangeFile = useCallback(
    (files: File[]) => {
      // const sliced = files.slice(0, MAX_FILES_COUNT);
      // sliced.forEach((file) => {
      //   const isInvalid = isLargeFile(file);
      //   setSeparateFileMap((prev) => {
      //     const newMap = new Map(prev);
      //     newMap.set(file.name, { files: [file] as unknown as DialFile[], isInvalid });
      //     return newMap;
      //   });
      // });
      // if (sliced.length === 0) {
      //   setSeparateFileMap(new Map());
      // }
      // setSeparateFiles(sliced);

      //currently immideately upload the file with multiple upload should be used code above

      const { body } = getFormDataForUpload(files);
      setSeparateFiles(files);

      uploadTestSuiteFiles(id as string, body).then((res) => {
        setSeparateFiles([]);
        if (res.success) {
          getTestSuiteFiles(id as string).then((res) => {
            setFiles(res || []);
          });
        }
      });
    },
    [id],
  );

  // after implementing multiple upload, the code above should be used
  // const onUpload = () => {
  //   const { body } = getFormDataForUpload(
  //     Array.from(separateFileMap.values()).flatMap((value) => value.files as unknown as File[]),
  //   );

  //   uploadTestSuiteFiles(id as string, body).then((res) => {
  //     console.log(res);
  //   });
  // };

  const totalFileSizeExceeded = useMemo(() => {
    const totalSize = separateFiles.reduce((sum, file) => sum + file.size, 0);
    return totalSize > MAX_TOTAL_FILE_SIZE_BYTES;
  }, [separateFiles]);

  const data = useMemo(() => generateCustomFileGridData(files), [files]);

  const gridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: CustomFile; id: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.path as string}
          isChecked={selectedFilePath ? data.data?.path === selectedFilePath : data.data?.path === value}
        />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        onChangeSelectedFilePath(event.data.path);
      }
    },
  };

  return (
    <div className="flex flex-col gap-4 py-4 px-6 flex-1 min-h-0">
      <div className="max-h-[200px]">
        <DialLoadFileAreaField
          elementId="importFiles"
          fieldTitle={t(ImportI18nKey.Files)}
          emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
          emptyTextSecondLine={t(BasicI18nKey.Or)}
          emptyButtonLabel={t(ButtonsI18nKey.Browse)}
          files={separateFiles}
          acceptTypes="/"
          fileFormatError={t(ImportI18nKey.FileErrorType)}
          onChange={onChangeFile}
          dynamicIcon={getFileIcon}
          errorText={
            totalFileSizeExceeded
              ? t(ImportI18nKey.TotalFileSizeErrorDescription, { size: 64 })
              : t(ImportI18nKey.FileError)
          }
          maxFilesCount={MAX_FILES_COUNT}
          fileSizeError={t(ImportI18nKey.FileSizeErrorDescription, { size: MAX_FILE_SIZE_MB })}
          maxFileSize={MAX_FILE_SIZE_MB}
          // deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
          // addButtonLabel={t(ButtonsI18nKey.Add)}
          // additionalActionButtons={<DialPrimaryButton label={t(ButtonsI18nKey.Upload)} onClick={onUpload} />}
          multiple={false}
        />
      </div>
      <GridView
        getIsEmptyData={() => !data.length}
        emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }}
        columnDefs={[DISPLAY_NAME_COLUMN, SIZE_COLUMN('Size') as ColDef]}
        rowData={data}
        additionalGridOptions={gridOptions}
      />
    </div>
  );
};

export default ApplicationFileManager;
