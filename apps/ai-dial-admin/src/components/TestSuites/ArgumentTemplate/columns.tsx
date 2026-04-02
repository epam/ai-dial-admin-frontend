'use client';

import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { extractBindingColumn, ArgumentRow } from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { TestCaseSchema, ToolRef } from '@/src/models/evaluation/test-suite';

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-success/10 text-success',
  integer: 'bg-warning/10 text-warning',
  number: 'bg-warning/10 text-warning',
  boolean: 'bg-accent-tertiary/10 text-accent-tertiary',
  object: 'bg-secondary/10 text-secondary',
  array: 'bg-secondary/10 text-secondary',
};

export function getArgumentColumns(
  toolRef: ToolRef,
  testCaseSchema: TestCaseSchema[],
  requiredFields: Set<string>,
  rows: ArgumentRow[],
  onRowChange: (rows: ArgumentRow[]) => void,
): ColDef[] {
  const updateRow = (index: number, updates: Partial<ArgumentRow>) => {
    const newRows = rows.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onRowChange(newRows);
  };

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
      cellRenderer: (params: ICellRendererParams) => {
        const type = params.data?.type || 'string';
        const colorClass = TYPE_COLORS[type] || 'bg-secondary/10 text-secondary';
        return <span className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>{type}</span>;
      },
    },
    {
      field: 'mode',
      headerName: 'Mode',
      editable: false,
      sortable: false,
      filter: false,
      width: 130,
      cellRenderer: (params: ICellRendererParams) => {
        const row = params.data as ArgumentRow;
        if (!row) return null;
        const isComplex = row.type === 'object' || row.type === 'array';

        if (isComplex) {
          return <span className="text-secondary text-xs">Constant</span>;
        }

        return (
          <DialSwitch
            switchId={`mode-${row.name}`}
            isOn={row.mode === 'binding'}
            onChange={() => {
              const idx = params.node.rowIndex ?? 0;
              if (row.mode === 'binding') {
                updateRow(idx, { mode: 'constant', value: getEmptyValue(row.type) });
              } else {
                updateRow(idx, { mode: 'binding', value: '${{}}' });
              }
            }}
            label={row.mode === 'binding' ? 'Binding' : 'Constant'}
          />
        );
      },
    },
    {
      field: 'value',
      headerName: 'Value',
      editable: false,
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: (params: ICellRendererParams) => {
        const row = params.data as ArgumentRow;
        if (!row) return null;
        const idx = params.node.rowIndex ?? 0;

        if (row.mode === 'binding') {
          const currentCol = typeof row.value === 'string' ? extractBindingColumn(row.value) : '';
          return (
            <select
              className="w-full bg-transparent border border-primary rounded px-2 py-1 text-sm"
              value={currentCol}
              onChange={(e) => {
                const col = e.target.value;
                updateRow(idx, { value: col ? `$\{{${col}}}` : '${{}}' });
              }}
            >
              <option value="">Select column...</option>
              {testCaseSchema.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          );
        }

        if (row.type === 'boolean') {
          return (
            <DialSwitch
              switchId={`value-${row.name}`}
              isOn={row.value === true}
              onChange={() => updateRow(idx, { value: !row.value })}
            />
          );
        }

        if (row.type === 'object' || row.type === 'array') {
          const preview = JSON.stringify(row.value ?? (row.type === 'object' ? {} : [])).slice(0, 50);
          return <span className="text-secondary text-xs truncate">{preview}</span>;
        }

        if (row.type === 'integer' || row.type === 'number') {
          return (
            <input
              type="number"
              className="w-full bg-transparent border border-primary rounded px-2 py-1 text-sm"
              value={(row.value as number) ?? ''}
              onChange={(e) => {
                const val = row.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value);
                updateRow(idx, { value: isNaN(val) ? '' : val });
              }}
            />
          );
        }

        return (
          <input
            type="text"
            className="w-full bg-transparent border border-primary rounded px-2 py-1 text-sm"
            value={(row.value as string) ?? ''}
            onChange={(e) => updateRow(idx, { value: e.target.value })}
          />
        );
      },
    },
  ];
}

function getEmptyValue(type: string): unknown {
  switch (type) {
    case 'boolean':
      return false;
    case 'integer':
    case 'number':
      return 0;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return '';
  }
}
