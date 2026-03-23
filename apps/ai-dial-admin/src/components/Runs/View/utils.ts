import { ColDef } from 'ag-grid-community';

import { AnalyticsResult, ExtractionResult, Run } from '@/src/models/evaluation/run';
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
    return {
      field: key,
      headerName: key,
      valueGetter: (params) => {
        const value = params.data?.testCaseData?.[key];
        if (typeof value === 'object') return JSON.stringify(value);
        return value ?? '—';
      },
    } as ColDef;
  });
};

const getExtractedColumns = (extracted: Record<string, unknown>) => {
  return Object.keys(extracted).map((key) => {
    return {
      field: key,
      headerName: key,
      valueGetter: (params) => {
        const value = params.data?.extractedColumns?.[key];
        if (typeof value === 'object') return JSON.stringify(value);
        return value ?? '—';
      },
    } as ColDef;
  });
};

const getMetricsColumns = (metrics: Record<string, Record<string, unknown>>) => {
  return Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).map(
      (key) =>
        ({
          field: key,
          headerName: key,
          valueGetter: (params) => {
            const value = params.data?.metricValues?.[groupKey]?.[key];
            if (typeof value === 'object') return JSON.stringify(value);
            return value ?? '—';
          },
        }) as ColDef,
    ),
  }));
};

const staticColumns = [
  {
    headerName: ' ',
    children: [
      {
        field: 'executionStatus',
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
        cellClass: (params) => getTestCaseStatusClass(params.data?.responseStatusCode),
      } as ColDef,
      {
        field: 'durationMs',
        headerName: 'Duration',
        colId: 'duration',
        valueGetter: (params) => {
          const duration = params.data?.executionInfo?.durationMs ?? params.data?.execDurationMs;
          return getFormattedDuration(duration);
        },
        cellClass: (params) => getTestCaseStatusClass(params.data?.responseStatusCode),
      } as ColDef,
    ],
  },
];

export const getResultColumns = (results: ExtractionResult[]) => {
  const input = results[0]?.testCaseData || {};

  return [
    ...staticColumns,
    {
      headerName: 'INPUT BINDINGS',
      children: getInputColumns(input),
    },
    {
      headerName: 'EXTRACTED',
      children: getExtractedColumns(results[0]?.extractedColumns || {}),
    },
  ];
};

export const getAnalyticsColumns = (results: AnalyticsResult[]) => {
  const metrics = results[0]?.metricValues || {};

  return [
    ...staticColumns,
    ...getMetricsColumns(metrics),
    {
      headerName: 'EXTRACTED',
      children: getExtractedColumns(results[0]?.extractedColumns || {}),
    },
  ];
};

export const getTestCaseStatusClass = (code: number | undefined) => {
  if (code == null) return '';
  if (code >= 200 && code < 300) return 'text-success';
  if (code >= 400 && code < 500) return 'text-warning';
  return 'text-error';
};

export const getFormattedDuration = (durationMs: number | undefined) => {
  if (durationMs == null) return '—';
  if (durationMs >= 1000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${durationMs}ms`;
};

export const getPanelTitle = (result: ExtractionResult | AnalyticsResult | null) => {
  return `${result?.testCaseName} - Run #${result?.runIndex ?? 0}`;
};

export const getDetailEntries = (data: Record<string, unknown>) => {
  return Object.keys(data).map((key) => {
    return [key, String(data[key])] as [string, string];
  });
};

export const getDetailNestedEntries = (
  data: Record<string, Record<string, unknown>>,
  additionalData?: Record<string, Record<string, unknown>>,
): { title: string; entries: [string, string][] }[] => {
  return Object.entries(data).map(([groupKey, values]) => {
    const hasOnlyNullError = Object.keys(values).length === 1 && 'error' in values && values.error == null;
    const infoError = additionalData?.[groupKey]?.error;

    const entries: Array<[string, string]> =
      hasOnlyNullError && infoError
        ? [['error', String(infoError)]]
        : Object.entries(values).map(([key, val]) => [key, String(val)] as [string, string]);

    return { title: groupKey, entries };
  });
};
