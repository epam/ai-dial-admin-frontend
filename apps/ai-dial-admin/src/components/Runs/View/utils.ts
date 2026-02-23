import { ColDef } from 'ag-grid-community';

import { ExtractionResult, Run } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';

export const RESULT_FILTERS = (run: Run): FilterDto[] => [
  { column: 'runId', operator: FilterOperatorDto.EQUALS, value: run.id || '' },
  {
    column: 'suiteId',
    operator: FilterOperatorDto.EQUALS,
    value: run.testSuiteId || '',
  },
];

const getInputColumns = (input: Record<string, unknown>) => {
  return Object.keys(input).map((key) => {
    const [part1, part2] = key.split('.');
    return {
      field: `testCaseData.${part1}.${part2}`,
      headerName: part2,
      valueGetter: (params) => {
        const value = params.data?.testCaseData?.[`${part1}.${part2}`];
        if (typeof value === 'object') return JSON.stringify(value);
        return value ?? '—';
      },
    } as ColDef;
  });
};

export function getResultColumns(results: ExtractionResult[]) {
  const staticColumns = [
    {
      headerName: ' ',
      children: [
        {
          field: 'executionInfo.status',
          headerName: ' ',
          colId: 'status',
          width: 50,
          minWidth: 50,
          cellRenderer: ExecutionStatusCellRenderer,
        },
        {
          field: 'testCaseName',
          headerName: 'Test Case name',
          colId: 'testCaseName',
        },
      ],
    },
    {
      headerName: 'EXECUTION',
      children: [
        {
          field: 'runIndex',
          headerName: '#',
          colId: 'runIndex',
          width: 50,
          valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : null),
        } as ColDef,
        {
          field: 'responseStatusCode',
          headerName: 'HTTP',
          colId: 'http',
          cellClass: (params) => getCellClass(params.data?.responseStatusCode),
        } as ColDef,
        {
          field: 'durationMs',
          headerName: 'Duration',
          colId: 'duration',
          valueGetter: (params) => {
            const duration = params.data?.executionInfo?.durationMs;
            if (duration == null) return '—';
            if (duration >= 1000) return `${(duration / 1000).toFixed(1)}s`;
            return `${duration}ms`;
          },
          cellClass: (params) => getCellClass(params.data?.responseStatusCode),
        } as ColDef,
      ],
    },
  ];

  const input = results[0]?.testCaseData || {};
  return [
    ...staticColumns,

    {
      headerName: 'INPUT BINDINGS',
      children: getInputColumns(input),
    },
  ];
}

export const getCellClass = (code: number | undefined) => {
  if (code == null) return '';
  if (code >= 200 && code < 300) return 'text-success';
  if (code >= 400 && code < 500) return 'text-warning';
  return 'text-error';
};
