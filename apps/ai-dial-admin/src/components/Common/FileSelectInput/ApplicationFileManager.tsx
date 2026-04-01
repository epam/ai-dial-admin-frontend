import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialFileIcon, DialLoader, DialLoadFileAreaField, SIZE_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions } from 'ag-grid-community';

import { getTestSuiteFiles, removeTestSuiteFile, uploadTestSuiteFiles } from '@/src/app/[lang]/test-suites/actions';
import { getFormDataForUpload } from '@/src/components/EntityListView/HeaderButtons/utils';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ONE_ACTION_COLUMN, SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { CustomFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { CustomFileRowData, generateCustomFileGridData } from '@/src/utils/files/grid-data';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  id?: string;
  value?: string;
  selectedFilePath: string | null;
  onChangeSelectedFilePath: (filePath: string | null) => void;
}

const ApplicationFileManager: FC<Props> = ({ id, value, selectedFilePath, onChangeSelectedFilePath }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(false);

  const [separateFiles, setSeparateFiles] = useState<File[]>([]);
  const [files, setFiles] = useState<CustomFile[]>([]);
  // const [separateFileMap, setSeparateFileMap] = useState(new Map<string, FileImportMap>());

  const getFiles = useCallback(() => {
    if (id) {
      getTestSuiteFiles(id).then((res) => {
        setFiles(res || []);
        setIsLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    getFiles();
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
      setIsLoading(true);
      uploadTestSuiteFiles(id as string, body).then((res) => {
        setSeparateFiles([]);

        if (res.success) {
          showNotification(
            getSuccessNotification(
              t(ImportI18nKey.FileUploadSuccessTitle),
              t(ImportI18nKey.FileUploadSuccessDescription, { folder: `${ApplicationRoute.TestSuites}` }),
            ),
          );
          getFiles();
        } else {
          setIsLoading(false);
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [getFiles, id, showNotification, t],
  );

  const onRemoveFile = useCallback(
    (data?: CustomFileRowData) => {
      setIsLoading(true);
      removeTestSuiteFile(id as string, data?.displayName as string).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(ImportI18nKey.FileRemovedTitle), t(ImportI18nKey.FileRemovedDescription)),
          );
          getFiles();
        } else {
          setIsLoading(false);
          showNotification(getErrorNotification(res?.errorHeader || '', res?.errorMessage || ''));
        }
      });
    },
    [getFiles, showNotification, t, id],
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

  const data = useMemo(() => generateCustomFileGridData(files), [files]);

  const gridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    rowSelection: {
      mode: 'singleRow',
      enableClickSelection: false,
    },
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: CustomFile; id: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.path as string}
          isChecked={selectedFilePath ? data.data?.path === selectedFilePath : data.data?.path === value}
        />
      ),
    },
    onCellClicked: (event) => {
      if (event.column.getColId() === 'action-remove') {
        return;
      }
      event.node.setSelected(true);
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        onChangeSelectedFilePath(event.data.path);
      }
    },
  };

  return (
    <div className="flex flex-col gap-4 py-4 px-6 flex-1 min-h-0">
      <div className="h-[200px] shrink-0">
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
          // deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
          // addButtonLabel={t(ButtonsI18nKey.Add)}
          // additionalActionButtons={<DialPrimaryButton label={t(ButtonsI18nKey.Upload)} onClick={onUpload} />}
          multiple={false}
        />
      </div>
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <GridView
          getIsEmptyData={() => !data.length}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }}
          columnDefs={[
            DISPLAY_NAME_COLUMN,
            SIZE_COLUMN('Size') as ColDef,
            {
              ...ONE_ACTION_COLUMN(getRemoveOperation(onRemoveFile, void 0, 'text-error w-4 h-4')),
              colId: 'action-remove',
            },
          ]}
          rowData={data}
          additionalGridOptions={gridOptions}
        />
      )}
    </div>
  );
};

export default ApplicationFileManager;
