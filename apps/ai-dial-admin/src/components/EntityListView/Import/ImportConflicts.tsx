'use client';
import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { CellValueChangedEvent, ColDef, GridReadyEvent, RowClassRules } from 'ag-grid-community';

import RadioButton from '@/src/components/Common/RadioButton/RadioButton';
import {
  changeFilesMap,
  generateFileColumnsForImportGrid,
  generateFileRowDataForImportGrid,
  generatePromptColumnsForImportGrid,
  generatePromptRowDataForImportGrid,
  isErrorFileNode,
  isErrorPromptNode,
} from '@/src/components/EntityListView/Import/import';
import Grid from '@/src/components/Grid/Grid';
import { ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { RadioButtonModel } from '@/src/models/radio-button';
import { StepStatus } from '@/src/models/step';
import { ConflictResolutionPolicy } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  route?: ApplicationRoute;
  existing?: (DialFile | DialPrompt)[];
  filesMap: Map<string, FileImportMap>;
  resolutions: RadioButtonModel[];
  resolution: string;
  setResolution: Dispatch<SetStateAction<string>>;
  setEditedFileMap: Dispatch<SetStateAction<Map<string, FileImportMap>>>;
  setStepsState: (status: StepStatus) => void;
}

const ImportConflicts: FC<Props> = ({
  route,
  existing,
  filesMap,
  resolutions,
  resolution,
  setResolution,
  setEditedFileMap,
  setStepsState,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const isPromptImport = route === ApplicationRoute.Prompts;
  const fileCount = [...filesMap.values()].reduce((total, value) => total + value.files.length, 0);

  const changeFile = useCallback(
    (value: string, data: unknown, field: string) => {
      setEditedFileMap((prev) => changeFilesMap(prev, data as FileImportGridData, field, value));
    },
    [setEditedFileMap],
  );

  const rowData = isPromptImport
    ? generatePromptRowDataForImportGrid(filesMap, existing as DialPrompt[])
    : generateFileRowDataForImportGrid(filesMap, existing as DialFile[]);

  const columnDefs: ColDef[] = isPromptImport
    ? generatePromptColumnsForImportGrid(changeFile)
    : generateFileColumnsForImportGrid(changeFile);

  const rowClassRules: RowClassRules = {
    'ag-error-row': (params) => {
      return isPromptImport ? isErrorPromptNode(params.data) : isErrorFileNode(params.data);
    },
  };

  const setErrorState = (event: GridReadyEvent | CellValueChangedEvent) => {
    let isError = false;

    event.api?.forEachNode((node) => {
      if (isPromptImport ? isErrorPromptNode(node.data) : isErrorFileNode(node.data)) {
        isError = true;
      }
    });
    setStepsState(isError ? StepStatus.ERROR : StepStatus.VALID);
  };

  const onGridReady = (event: GridReadyEvent) => {
    setEditedFileMap(filesMap);
    event.api?.updateGridOptions({
      columnDefs,
      rowData,
      rowClassRules,
    });
    setErrorState(event);
  };

  const onCellValueChanged = (event: CellValueChangedEvent) => {
    setErrorState(event);
    event.api?.updateGridOptions({
      rowClassRules,
    });
  };

  return (
    <div className="flex flex-col min-h-0">
      <h3 className="pt-6 pb-4">{t(ImportI18nKey.ConflictResolution)}</h3>
      {resolutions.map((r) => (
        <div key={r.id} className="mb-2">
          <RadioButton
            inputId={r.id}
            title={r.name}
            checked={r.id === resolution}
            onChange={() => setResolution(r.id)}
          />
        </div>
      ))}
      {resolution === ConflictResolutionPolicy.MANUAL && (
        <div className="flex flex-col flex-1 min-h-0">
          <div>
            {t(MenuI18nKey.Prompts)}: {fileCount}
          </div>
          <div className="min-h-0">
            <Grid additionalGridOptions={{ onGridReady, onCellValueChanged }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportConflicts;
