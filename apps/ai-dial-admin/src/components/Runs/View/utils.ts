import { ColDef } from 'ag-grid-community';

import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';
import ErrorCellRenderer from '@/src/components/Grid/CellRenderers/ErrorCellRenderer';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import { MetricBindings, MetricSnapshot } from '@/src/models/evaluation/metric';
import { AnalyticsResult, ExtractionResult, Run } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';

import { MetricGroup } from './models';
export type { MetricGroup } from './models';

export const RUN_FILTER = (id?: string | null): FilterDto[] => [
  { column: 'runId', operator: FilterOperatorDto.EQUALS, value: id || '' },
];

export const RESULT_FILTERS = (run: Run): FilterDto[] => [
  ...RUN_FILTER(run.id),
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

const mergeMetricValuesSchema = (results: AnalyticsResult[]): Record<string, Record<string, unknown>> => {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const result of results) {
    const mv = result.metricValues;
    if (!mv) continue;
    for (const [groupKey, groupValues] of Object.entries(mv)) {
      if (!merged[groupKey]) merged[groupKey] = {};
      for (const [key, val] of Object.entries(groupValues)) {
        if (!(key in merged[groupKey])) merged[groupKey][key] = val;
      }
    }
  }
  return merged;
};

const getMetricsColumns = (metrics: Record<string, Record<string, unknown>>, errorText?: string) => {
  return Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).map(
      (key) =>
        ({
          field: key,
          headerName: key,
          cellRendererSelector: (params) => {
            const value = params.data?.metricValues?.[groupKey]?.[key];
            if (value == null) {
              return { component: ErrorCellRenderer, params: { errorText } };
            }
          },
          valueGetter: (params) => {
            const value = params.data?.metricValues?.[groupKey]?.[key];
            if (typeof value === 'object') return JSON.stringify(value);
            if (value != null) {
              return +value.toFixed(3);
            }
            return '—';
          },
          cellStyle: (params) => {
            const value = params.data?.metricValues?.[groupKey]?.[key];
            if (typeof value === 'number' && value >= 0 && value <= 1) {
              const colors = getAccuracyColors(value);
              return { backgroundColor: colors.bg };
            }
            return undefined;
          },
          comparator(valueA, valueB, nodeA, nodeB, isDescending) {
            const metricA = nodeA?.data?.metricValues?.[groupKey]?.[key];
            const metricB = nodeB?.data?.metricValues?.[groupKey]?.[key];

            const isErrorA = metricA == null;
            const isErrorB = metricB == null;

            if (isErrorA && isErrorB) return 0;
            if (isErrorA) return isDescending ? -1 : 1;
            if (isErrorB) return isDescending ? 1 : -1;

            if (typeof metricA === 'number' && typeof metricB === 'number') {
              if (metricA === metricB) return 0;
              return metricA > metricB ? 1 : -1;
            }

            const normalizedA = typeof valueA === 'string' ? valueA : String(valueA);
            const normalizedB = typeof valueB === 'string' ? valueB : String(valueB);

            return normalizedA.localeCompare(normalizedB);
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
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'agTextColumnFloatingFilter',
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

export const getAnalyticsColumns = (results: AnalyticsResult[], errorText?: string) => {
  const metrics = mergeMetricValuesSchema(results);

  return [
    ...staticColumns,
    ...getMetricsColumns(metrics, errorText),
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

export const getDetailEntries = (data: Record<string, unknown>): Array<[string, string | string[]]> => {
  return Object.keys(data).map((key) => {
    const val = data[key];
    if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      return [key, val as string[]];
    }
    return [key, String(val)];
  });
};

export const getMetricGroups = (
  metricValues?: Record<string, Record<string, unknown>>,
  metricInfos?: Record<string, Record<string, unknown>>,
): MetricGroup[] => {
  if (!metricValues) return [];

  return Object.entries(metricValues).map(([groupKey, values]) => {
    const infoGroup = metricInfos?.[groupKey];
    const hasOnlyNullError = Object.keys(values).length === 1 && 'error' in values && values.error == null;
    const infoError = infoGroup?.error;
    const hasError = (hasOnlyNullError && !!infoError) || Object.values(values).every((v) => v == null);

    const metrics = Object.entries(values)
      .filter(([key]) => key !== 'error' || !hasOnlyNullError)
      .map(([key, val]) => ({
        key,
        value: typeof val === 'number' ? val : null,
        isError: val == null,
      }));

    const infos = infoGroup
      ? Object.fromEntries(Object.entries(infoGroup).filter(([key]) => key !== 'error' || !hasError))
      : undefined;

    return {
      title: groupKey,
      metrics,
      info: infos && Object.keys(infos).length > 0 ? infos : undefined,
      hasError,
      errorMessage: hasError && infoError ? String(infoError) : undefined,
    };
  });
};

export const snapshotsToBindingsMap = (snapshots: MetricSnapshot[]): Record<string, MetricBindings> => {
  return snapshots.reduce(
    (acc, snapshot) => {
      if (snapshot.tsmdName) {
        acc[snapshot.tsmdName] = {
          configBindings: snapshot.configBindings ?? [],
          inputBindings: snapshot.inputBindings ?? [],
        };
      }
      return acc;
    },
    {} as Record<string, MetricBindings>,
  );
};

export const getDetailNestedEntries = (
  data: Record<string, Record<string, unknown>>,
  additionalData?: Record<string, Record<string, unknown>>,
): { title: string; entries: [string, string][] }[] => {
  return Object.entries(data).map(([groupKey, values]) => {
    const hasOnlyNullError = Object.keys(values).length === 1 && 'error' in values && values.error == null;
    const additionalGroup = additionalData?.[groupKey];
    const infoError = additionalGroup?.error;

    let entries: Array<[string, string]>;

    if (hasOnlyNullError && infoError) {
      entries = [['error', String(infoError)]];
    } else {
      entries = Object.entries(values).flatMap(([key, val]) => {
        const mainEntry: [string, string] = [key, String(val)];
        const additionalVal = additionalGroup?.[key];

        if (additionalVal != null && typeof additionalVal === 'object' && !Array.isArray(additionalVal)) {
          const additionalEntries = Object.entries(additionalVal as Record<string, unknown>).map(
            ([subKey, subVal]) => [subKey, String(subVal)] as [string, string],
          );
          return [mainEntry, ...additionalEntries];
        }

        return [mainEntry];
      });
    }

    return { title: groupKey, entries };
  });
};
