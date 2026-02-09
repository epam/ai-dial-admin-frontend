import { ColDef } from 'ag-grid-community';

import { ImportPreview } from './models';

export const getGridDataFromImportPreview = (importPreview: ImportPreview) => {
  const colDefs: ColDef[] = [
    { field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' },
    ...importPreview.detectedColumns.map((col) => ({
      field: col.fieldName,
      headerName: col.headerName,
    })),
  ];

  return { colDefs, rowData: importPreview.sampleRows.map((row) => ({ ...row, ...row.facts, ...row.parameters })) };
};
