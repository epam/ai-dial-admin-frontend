import { ColDef } from 'ag-grid-community';

import { getValidityStatusColumn } from '@/src/components/TestSuites/utils/columns';
import { ImportPreview } from './models';

export const getGridDataFromImportPreview = (importPreview: ImportPreview) => {
  const colDefs: ColDef[] = [
    { field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' },
    ...importPreview.detectedColumns.map((col) => ({
      field: col.fieldName,
      headerName: col.headerName,
    })),
  ];

  return {
    colDefs: [...colDefs, getValidityStatusColumn()],
    rowData: importPreview.sampleRows.map((row) => ({ ...row, ...row.data })),
  };
};
