'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconEyeOff } from '@tabler/icons-react';
import { CellValueChangedEvent, ColDef, GridApi, GridOptions, GridReadyEvent, RowClassRules } from 'ag-grid-community';

import { previewAppZip, previewPromptZip, previewToolsetZip } from '@/src/app/[lang]/folders-storage/actions';
import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import { ZipFilePreview } from '@/src/components/Common/FolderCreate/models';
import {
  generateColumnsForImportGrid,
  generatePreviewData,
  isErrorAssetReview,
  isErrorFileReview,
  isErrorRowForImport,
  readAllFiles,
  readJsonFiles,
} from '@/src/components/Common/FolderCreate/utils';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import {
  changeFilesMap,
  generateAssetRowDataForImportGrid,
  generateFileRowDataForImportGrid,
} from '@/src/components/EntityListView/Import/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { AssetImportGridData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

interface Props {
  view?: ApplicationRoute;
  files: File[];
  fileType: string;
  currentStepId: string;
  editedFileMap: Map<string, FileImportMap>;
  onChangeFileMap: Dispatch<SetStateAction<Map<string, FileImportMap>>>;
  onChangeSteps: Dispatch<SetStateAction<Step[]>>;
}

const FolderCreateReview: FC<Props> = ({
  view,
  files,
  fileType,
  currentStepId,
  editedFileMap,
  onChangeFileMap,
  onChangeSteps,
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [count, setCount] = useState<number>(0);
  const getReqRef = useRef(useProtectedRequest());

  const prevFilesRef = useRef<File[]>([]);

  const rowClassRules: RowClassRules = {
    'ag-error-row': (params) => isErrorRowForImport(params.data),
  };

  const onChangeFile = useCallback(
    (value: string, data: unknown, field: string) => {
      onChangeFileMap((prev) => changeFilesMap(prev, data as FileImportGridData, field, value, view));
    },
    [onChangeFileMap, view],
  );

  const columnDefs: ColDef[] = generateColumnsForImportGrid(onChangeFile, fileType, view);

  const onChangeErrorState = (event: GridReadyEvent | CellValueChangedEvent) => {
    let isError = false;

    event.api?.forEachNode((node) => {
      if (isErrorRowForImport(node.data)) {
        isError = true;
      }
    });
    onChangeCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
  };

  const onChangeCurrentSteps = useCallback(
    (status?: StepStatus) => {
      onChangeSteps((prev) => {
        const index = prev.findIndex((step) => step.id === CreateFolderSteps.FILE_REVIEW);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
    },
    [onChangeSteps],
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs,
      rowClassRules,
    });
  };

  const onCellValueChanged = (event: CellValueChangedEvent) => {
    onChangeErrorState(event);
    event.api?.updateGridOptions({
      rowClassRules,
    });
  };

  const getCorrectPreview = (view?: ApplicationRoute) => {
    if (view === ApplicationRoute.Prompts) {
      return previewPromptZip;
    }
    if (view === ApplicationRoute.AssetsApplications) {
      return previewAppZip;
    }
    if (view === ApplicationRoute.AssetsToolsets) {
      return previewToolsetZip;
    }
  };

  useEffect(() => {
    const prevFiles = prevFilesRef.current;
    if (isEqualSkippingUndefined(prevFiles, files)) return;
    prevFilesRef.current = files;

    if (isAssetWithVersion(view) && files.length) {
      if (fileType === ImportFileType.ARCHIVE) {
        const body = getFormDataForImport(
          'public/',
          files[0],
          fileType,
          ConflictResolutionPolicy.SKIP,
          void 0,
          void 0,
          view,
        ).body;
        getReqRef.current(getCorrectPreview(view), body).then((data) => {
          const preview = generatePreviewData(
            (data.response as { resourcePreviews: ZipFilePreview[] }).resourcePreviews,
          );
          onChangeFileMap(preview);
        });
      } else {
        readJsonFiles(files, view).then((result) => {
          onChangeFileMap(result);
        });
      }
    } else if (view === ApplicationRoute.Files && files.length) {
      if (fileType !== ImportFileType.ARCHIVE) {
        onChangeFileMap(readAllFiles(files));
      }
    } else if (!files.length) {
      onChangeFileMap(new Map());
    }
  }, [files, onChangeFileMap, fileType, view]);

  useEffect(() => {
    if (currentStepId !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size !== 0) {
      let rowData: (AssetImportGridData | FileImportGridData)[] = [];
      let isError;

      if (isAssetWithVersion(view)) {
        rowData = generateAssetRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as AssetImportGridData[]).some((r) => isErrorAssetReview(r));
      } else if (view === ApplicationRoute.Files) {
        rowData = generateFileRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as FileImportGridData[]).some((r) => isErrorFileReview(r));
      }
      gridApi?.updateGridOptions({
        rowData,
        columnDefs,
      });
      onChangeCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
      setCount(rowData?.length || 0);
    } else if (currentStepId !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size === 0) {
      gridApi?.updateGridOptions({
        rowData: [],
        columnDefs,
      });
      setCount(0);
      onChangeCurrentSteps(isAssetWithVersion(view) ? void 0 : StepStatus.VALID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId, editedFileMap]);

  const options: GridOptions = {
    onCellValueChanged,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div>
        {t(MenuI18nKey.Files)}: {count || 0}
      </div>

      <div className="min-h-0 flex-1">
        <GridView
          getIsEmptyData={() => fileType === ImportFileType.ARCHIVE && view === ApplicationRoute.Files}
          emptyDataProps={{ title: t(FoldersI18nKey.NoPreviewArchive), icon: <IconEyeOff size={50} /> }}
          onGridReady={onGridReady}
          additionalGridOptions={options}
        />
      </div>
    </div>
  );
};

export default FolderCreateReview;
