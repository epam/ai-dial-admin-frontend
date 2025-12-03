'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { DialNoDataContent, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconEyeOff } from '@tabler/icons-react';
import { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';

import { previewPromptZip } from '@/src/app/[lang]/folders-storage/actions';
import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import { ZipFilePreview } from '@/src/components/Common/FolderCreate/models';
import {
  generateColumnsForImportGrid,
  generatePreviewData,
  isErrorFileReview,
  isErrorPromptReview,
  isErrorRowForImport,
  readAllFiles,
  readJsonFiles,
} from '@/src/components/Common/FolderCreate/utils';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import {
  changeFilesMap,
  generateFileRowDataForImportGrid,
  generatePromptRowDataForImportGrid,
} from '@/src/components/EntityListView/Import/utils';
import Grid from '@/src/components/Grid/Grid';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { PromptImportGridData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  view?: ApplicationRoute;
  files: File[];
  fileType: string;
  currentStepId: string;
  editedFileMap: Map<string, FileImportMap>;
  setEditedFileMap: Dispatch<SetStateAction<Map<string, FileImportMap>>>;
  setSteps: Dispatch<SetStateAction<Step[]>>;
}

const FolderCreateReview: FC<Props> = ({
  view,
  files,
  fileType,
  currentStepId,
  editedFileMap,
  setEditedFileMap,
  setSteps,
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [count, setCount] = useState<number>(0);
  const getReqRef = useRef(useProtectedRequest());

  const prevFilesRef = useRef<File[]>([]);

  const changeFile = useCallback(
    (value: string, data: unknown, field: string) => {
      setEditedFileMap((prev) => changeFilesMap(prev, data as FileImportGridData, field, value));
    },
    [setEditedFileMap],
  );

  const columnDefs: ColDef[] = generateColumnsForImportGrid(changeFile, fileType, view);

  const rowClassRules: RowClassRules = {
    'ag-error-row': (params) => isErrorRowForImport(params.data),
  };

  const setErrorState = (event: GridReadyEvent | CellValueChangedEvent) => {
    let isError = false;

    event.api?.forEachNode((node) => {
      if (isErrorRowForImport(node.data)) {
        isError = true;
      }
    });
    setCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
  };

  const setCurrentSteps = useCallback(
    (status?: StepStatus) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === CreateFolderSteps.FILE_REVIEW);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
    },
    [setSteps],
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs,
      rowClassRules,
    });
  };

  const onCellValueChanged = (event: CellValueChangedEvent) => {
    setErrorState(event);
    event.api?.updateGridOptions({
      rowClassRules,
    });
  };

  useEffect(() => {
    const prevFiles = prevFilesRef.current;
    if (isEqualSkippingUndefined(prevFiles, files)) return;
    prevFilesRef.current = files;

    if (view === ApplicationRoute.Prompts && files.length) {
      if (fileType === ImportFileType.ARCHIVE) {
        const body = getFormDataForImport('public/', files[0], fileType, ConflictResolutionPolicy.SKIP).body;
        getReqRef.current(previewPromptZip, body).then((data) => {
          const preview = generatePreviewData(
            (data.response as { resourcePreviews: ZipFilePreview[] }).resourcePreviews,
          );
          setEditedFileMap(preview);
        });
      } else {
        readJsonFiles(files, view).then((result) => {
          setEditedFileMap(result);
        });
      }
    } else if (view === ApplicationRoute.Files && files.length) {
      if (fileType !== ImportFileType.ARCHIVE) {
        setEditedFileMap(readAllFiles(files));
      }
    } else if (!files.length) {
      setEditedFileMap(new Map());
    }
  }, [files, setEditedFileMap, fileType, view]);

  useEffect(() => {
    if (currentStepId !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size !== 0) {
      let rowData: (PromptImportGridData | FileImportGridData)[] = [];
      let isError;

      if (view === ApplicationRoute.Prompts) {
        rowData = generatePromptRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as PromptImportGridData[]).some((r) => isErrorPromptReview(r));
      } else if (view === ApplicationRoute.Files) {
        rowData = generateFileRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as FileImportGridData[]).some((r) => isErrorFileReview(r));
      }
      gridApi?.updateGridOptions({
        rowData,
        columnDefs,
      });
      setCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
      setCount(rowData?.length || 0);
    } else if (currentStepId !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size === 0) {
      gridApi?.updateGridOptions({
        rowData: [],
        columnDefs,
      });
      setCount(0);
      setCurrentSteps(view === ApplicationRoute.Prompts ? void 0 : StepStatus.VALID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId, editedFileMap]);

  return fileType === ImportFileType.ARCHIVE ? (
    <DialNoDataContent title={t(FoldersI18nKey.NoPreviewArchive)} icon={<IconEyeOff width={50} height={50} />} />
  ) : (
    <div className="flex flex-col flex-1 min-h-0">
      <div>
        {t(MenuI18nKey.Files)}: {count || 0}
      </div>
      <div className="min-h-0 flex-1">
        <Grid additionalGridOptions={{ onGridReady, onCellValueChanged }} />
      </div>
    </div>
  );
};

export default FolderCreateReview;
