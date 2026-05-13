import { ColDef } from 'ag-grid-community';

import { getValidityStatusColumn } from '@/src/components/TestSuites/utils/columns';
import { ImportPreview } from './models';

export const getGridDataFromImportPreview = (importPreview: ImportPreview) => {
  const colDefs: ColDef[] = [
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
