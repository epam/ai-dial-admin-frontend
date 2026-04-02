'use client';

import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { ArgumentRow } from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { ToolRef } from '@/src/models/evaluation/test-suite';

export function getArgumentColumns(
  toolRef: ToolRef,
  requiredFields: Set<string>,
  onCellChange: (name: string, value: string) => void,
): ColDef[] {
  return [
    {
      field: 'name',
      headerName: 'Argument',
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => {
        const isRequired = requiredFields.has(params.data?.name);
        return (
          <span>
            {params.data?.name}
            {isRequired && <span className="text-error ml-0.5">*</span>}
          </span>
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      editable: false,
      sortable: false,
      filter: false,
      width: 100,
    },
    {
      field: 'value',
      headerName: 'Value',
      editable: false,
      sortable: false,
      filter: false,
      flex: 1,
      valueGetter: (params: ValueGetterParams) => {
        const row = params.data as ArgumentRow;
        if (!row) return '';
        if (row.type === 'object' || row.type === 'array') {
          return JSON.stringify(row.value ?? (row.type === 'object' ? {} : []));
        }
        return row.value != null ? String(row.value) : '';
      },
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        hideTriangle: true,
        skipRequired: true,
        onChange: (value: string | number, rowData: unknown) => {
          const row = rowData as ArgumentRow;
          (row as Record<string, unknown>).value = value;
          onCellChange(row.name, String(value));
        },
      },
    },
  ];
}
