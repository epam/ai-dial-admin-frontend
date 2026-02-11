'use client';
import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { CellValueChangedEvent, ColDef, GridOptions, GridReadyEvent, RowClassRules } from 'ag-grid-community';
import { DialRadioGroup, RadioGroupOrientation, RadioButtonWithContent, StepStatus } from '@epam/ai-dial-ui-kit';

import {
  changeFilesMap,
  generateFileColumnsForImportGrid,
  generateFileRowDataForImportGrid,
  generateAssetColumnsForImportGrid,
  generateAssetRowDataForImportGrid,
  isErrorFileNode,
  isErrorPromptNode,
} from '@/src/components/EntityListView/Import/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ConflictResolutionPolicy } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';

interface Props {
  route?: ApplicationRoute;
  existing?: (DialFile | DialPrompt)[];
  filesMap: Map<string, FileImportMap>;
  resolutions: RadioButtonWithContent[];
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
  const t = useI18n();

  const isAssetWithVersionImport = isAssetWithVersion(route);
  const fileCount = [...filesMap.values()].reduce((total, value) => total + value.files.length, 0);

  const changeFile = useCallback(
    (value: string, data: unknown, field: string) => {
      setEditedFileMap((prev) => changeFilesMap(prev, data as FileImportGridData, field, value));
    },
    [setEditedFileMap],
  );

  const rowData = isAssetWithVersionImport
    ? generateAssetRowDataForImportGrid(filesMap, existing as DialPrompt[])
    : generateFileRowDataForImportGrid(filesMap, existing as DialFile[]);

  const columnDefs: ColDef[] = isAssetWithVersionImport
    ? generateAssetColumnsForImportGrid(changeFile)
    : generateFileColumnsForImportGrid(changeFile);

  const rowClassRules: RowClassRules = {
    'ag-error-row': (params) => {
      return isAssetWithVersionImport ? isErrorPromptNode(params.data) : isErrorFileNode(params.data);
    },
  };
  const setErrorState = (event: GridReadyEvent | CellValueChangedEvent) => {
    let isError = false;

    event.api?.forEachNode((node) => {
      if (isAssetWithVersionImport ? isErrorPromptNode(node.data) : isErrorFileNode(node.data)) {
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

  const options: GridOptions = {
    onGridReady,
    onCellValueChanged,
  };

  return (
    <div className="flex flex-col min-h-0">
      <h3 className="pt-6 pb-4">{t(ImportI18nKey.ConflictResolution)}</h3>
      <DialRadioGroup
        orientation={RadioGroupOrientation.Column}
        radioButtons={resolutions}
        activeRadioButton={resolution}
        elementId="conflict-resolution"
        onChange={setResolution}
      />
      {resolution === ConflictResolutionPolicy.MANUAL && (
        <div className="flex flex-col flex-1 min-h-0 mt-4">
          <div>
            {t(getImportTitle(route))}: {fileCount}
          </div>
          <div className="min-h-0">
            <GridView additionalGridOptions={options} onGridReady={onGridReady} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportConflicts;
