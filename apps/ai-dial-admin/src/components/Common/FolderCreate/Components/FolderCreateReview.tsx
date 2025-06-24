'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';
import { isEqual } from 'lodash';

import { previewPromptZip } from '@/src/app/[lang]/folders-storage/actions';
import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import { ZipFilePreview } from '@/src/components/Common/FolderCreate/models';
import {
  generatePreviewData,
  isErrorFileReview,
  isErrorPromptReview,
  readAllFiles,
  readJsonFiles,
} from '@/src/components/Common/FolderCreate/utils';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/EntityListHeaderButtons.utils';
import {
  changeFilesMap,
  generateFileColumnsForImportGrid,
  generateFileRowDataForImportGrid,
  generatePromptColumnsForImportGrid,
  generatePromptRowDataForImportGrid,
} from '@/src/components/EntityListView/Import/import';
import Grid from '@/src/components/Grid/Grid';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { Step, StepStatus } from '@/src/models/step';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { PromptImportGridData } from '@/src/models/prompts';

interface Props {
  view?: ApplicationRoute;
  files: File[];
  fileType: string;
  currentStep: Step;
  editedFileMap: Map<string, FileImportMap>;
  setEditedFileMap: Dispatch<SetStateAction<Map<string, FileImportMap>>>;
  setSteps: Dispatch<SetStateAction<Step[]>>;
  setCurrentStep: Dispatch<SetStateAction<Step>>;
}

const FolderCreateReview: FC<Props> = ({
  view,
  files,
  fileType,
  currentStep,
  editedFileMap,
  setEditedFileMap,
  setSteps,
  setCurrentStep,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [count, setCount] = useState<number>(0);

  const isPromptReview = view === ApplicationRoute.Prompts;
  const prevFilesRef = useRef<File[]>([]);

  const changeFile = useCallback(
    (value: string, data: unknown, field: string) => {
      setEditedFileMap((prev) => changeFilesMap(prev, data as FileImportGridData, field, value));
    },
    [setEditedFileMap],
  );

  const columnDefs: ColDef[] = isPromptReview
    ? generatePromptColumnsForImportGrid(changeFile, true, fileType === ImportFileType.ARCHIVE)
    : generateFileColumnsForImportGrid(changeFile, true, fileType === ImportFileType.ARCHIVE);

  const rowClassRules: RowClassRules = {
    'ag-error-row': (params) => {
      return isPromptReview ? isErrorPromptReview(params.data) : isErrorFileReview(params.data);
    },
  };

  const setErrorState = (event: GridReadyEvent | CellValueChangedEvent) => {
    let isError = false;

    event.api?.forEachNode((node) => {
      if (isPromptReview ? isErrorPromptReview(node.data) : isErrorFileReview(node.data)) {
        isError = true;
      }
    });
    setCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
  };

  const setCurrentSteps = useCallback(
    (status: StepStatus) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === CreateFolderSteps.FILE_REVIEW);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
      if (currentStep.id === CreateFolderSteps.FILE_REVIEW) {
        setCurrentStep((prev) => {
          return {
            ...prev,
            status,
          };
        });
      }
    },
    [currentStep.id, setCurrentStep, setSteps],
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
    if (isEqual(prevFiles, files)) return;
    prevFilesRef.current = files;

    if (isPromptReview && files.length) {
      if (fileType === ImportFileType.ARCHIVE) {
        const body = getFormDataForImport('public/', files[0], fileType, ConflictResolutionPolicy.SKIP);
        previewPromptZip(body).then((data) => {
          const preview = generatePreviewData(
            (data.response as { resourcePreviews: ZipFilePreview[] }).resourcePreviews,
          );
          setEditedFileMap(preview);
        });
      } else {
        readJsonFiles(files).then((result) => {
          setEditedFileMap(result);
        });
      }
    } else if (!isPromptReview && files.length) {
      if (fileType !== ImportFileType.ARCHIVE) {
        setEditedFileMap(readAllFiles(files));
      }
    } else if (!files.length) {
      setEditedFileMap(new Map());
    }
  }, [files, isPromptReview, setEditedFileMap, fileType]);

  useEffect(() => {
    if (currentStep.id !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size !== 0) {
      let rowData: (PromptImportGridData | FileImportGridData)[] = [];
      let isError;

      if (isPromptReview) {
        rowData = generatePromptRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as PromptImportGridData[]).some((r) => isErrorPromptReview(r));
      } else {
        rowData = generateFileRowDataForImportGrid(editedFileMap, [], t);
        isError = (rowData as FileImportGridData[]).some((r) => isErrorFileReview(r));
      }
      gridApi?.updateGridOptions({
        rowData,
        columnDefs,
      });
      setCurrentSteps(isError ? StepStatus.ERROR : StepStatus.VALID);
      setCount(rowData?.length || 0);
    } else if (currentStep.id !== CreateFolderSteps.FILE_REVIEW && editedFileMap.size === 0) {
      gridApi?.updateGridOptions({
        rowData: [],
        columnDefs,
      });
      setCount(0);
      setCurrentSteps(StepStatus.INVALID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, editedFileMap]);

  return (
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
