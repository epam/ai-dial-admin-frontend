import { ColDef } from 'ag-grid-community';

import { ImportPreview } from './models';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';

export const getGridDataFromImportPreview = (importPreview: ImportPreview) => {
  const colDefs: ColDef[] = [
    ...TEST_CASES_COLUMN,
    ...importPreview.detectedColumns.map((col) => ({
      field: col.fieldName,
      headerName: col.headerName,
    })),
  ];

  return { colDefs, rowData: importPreview.sampleRows.map((row) => ({ ...row, ...row.facts, ...row.parameters })) };
};
