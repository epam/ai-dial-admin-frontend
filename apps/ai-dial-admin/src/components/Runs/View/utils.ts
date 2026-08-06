import { ColDef } from 'ag-grid-community';

import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import MetricScoreCellRenderer from '@/src/components/Grid/CellRenderers/MetricScoreCellRenderer';
import {
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  fixedWidthColDef,
  HTTP_COLUMN_WIDTH,
  METRIC_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  NUMBER_FILTER_COL_DEF,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
  TOTAL_TURNS_COLUMN_WIDTH,
  TURN_INDEX_COLUMN_WIDTH,
} from '@/src/components/Runs/grid-column-layout';
import {
  EXECUTION_GROUP_HEADER,
  EXTRACTED_GROUP_HEADER,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { MetricBindings, MetricSnapshot } from '@/src/models/evaluation/metric';
import { AnalyticsResult, ExtractionResult, Run } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';

import { CompareAnalyticsRow, MetricGroup } from './models';
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

const getInputColumns = (input: Record<string, unknown>, hide = false) => {
  return Object.keys(input).map((key) => {
    return {
      field: key,
      headerName: key,
      hide,
      flex: 1,
      minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
      ...NO_FILTER_COL_DEF,
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
      flex: 1,
      minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
      ...NO_FILTER_COL_DEF,
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

const getMetricsColumns = (metrics: Record<string, Record<string, unknown>>) => {
  return Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).map(
      (key) =>
        ({
          field: key,
          headerName: key,
          cellRenderer: MetricScoreCellRenderer,
          ...NUMBER_FILTER_COL_DEF,
          ...fixedWidthColDef(METRIC_COLUMN_WIDTH),
          valueGetter: (params) => {
            const groupExists = params.data?.metricValues != null && groupKey in params.data.metricValues;
            if (!groupExists) return '—';
            const value = params.data?.metricValues?.[groupKey]?.[key];
            if (typeof value === 'object') return JSON.stringify(value);
            if (value != null) {
              return +value.toFixed(3);
            }
            return '—';
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

const executionColumns: ColDef[] = [
  {
    field: 'runIndex',
    headerName: '# Run number',
    colId: 'runIndex',
    ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
    ...NO_FILTER_COL_DEF,
    valueGetter: (params) => (params.data?.runIndex != null ? params.data.runIndex + 1 : null),
  },
  {
    field: 'turnIndex',
    headerName: 'Turn',
    colId: 'turnIndex',
    ...fixedWidthColDef(TURN_INDEX_COLUMN_WIDTH),
    ...NO_FILTER_COL_DEF,
    valueGetter: (params) => (params.data?.turnIndex != null ? params.data.turnIndex + 1 : null),
  },
  {
    field: 'totalTurns',
    headerName: 'Total turns',
    colId: 'totalTurns',
    ...fixedWidthColDef(TOTAL_TURNS_COLUMN_WIDTH),
    ...NO_FILTER_COL_DEF,
    valueGetter: (params) => params.data?.totalTurns ?? null,
  },
  {
    field: 'responseStatusCode',
    headerName: 'HTTP',
    colId: 'http',
    ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
    ...NO_FILTER_COL_DEF,
    cellClass: (params) => getTestCaseStatusClass(params.data?.responseStatusCode),
  },
  {
    field: 'durationMs',
    headerName: 'Duration',
    colId: 'duration',
    ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
    ...NO_FILTER_COL_DEF,
    valueGetter: (params) => {
      const duration = params.data?.executionInfo?.durationMs ?? params.data?.execDurationMs;
      return getFormattedDuration(duration);
    },
    cellClass: (params) => getTestCaseStatusClass(params.data?.responseStatusCode),
  },
];

const staticColumns = [
  {
    headerName: ' ',
    context: { panelName: 'Details' },
    children: [
      {
        field: 'executionStatus',
        headerName: ' ',
        context: { panelName: 'Status' },
        colId: 'status',
        ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
        ...NO_FILTER_COL_DEF,
        cellRenderer: ExecutionStatusCellRenderer,
      },
      {
        field: 'testCaseName',
        headerName: 'Test Case name',
        colId: 'testCaseName',
        ...fixedWidthColDef(TEST_CASE_NAME_COLUMN_WIDTH),
        ...TEXT_FILTER_COL_DEF,
      },
    ],
  },
  {
    headerName: EXECUTION_GROUP_HEADER,
    children: executionColumns,
  },
];

export const getAnalyticsColumns = (results: AnalyticsResult[]) => {
  const metrics = mergeMetricValuesSchema(results);
  const input = results[0]?.testCaseData || {};

  return [
    ...staticColumns,
    ...getMetricsColumns(metrics),
    {
      headerName: 'INPUT BINDINGS',
      children: getInputColumns(input, true),
    },
    {
      headerName: EXTRACTED_GROUP_HEADER,
      children: getExtractedColumns(results[0]?.extractedColumns || {}),
    },
  ];
};

const getCompareIdKey = (row: AnalyticsResult): string | null =>
  row.testCaseId ? `${row.testCaseId}::${row.runIndex}` : null;

const getCompareNameKey = (row: AnalyticsResult): string | null =>
  row.testCaseName ? `${row.testCaseName}::${row.runIndex}` : null;

export const createEmptyComparePrimaryRow = (
  source: Pick<AnalyticsResult, 'testCaseId' | 'testCaseName' | 'runIndex'>,
): AnalyticsResult => ({
  testCaseId: source.testCaseId,
  testCaseName: source.testCaseName,
  runIndex: source.runIndex,
  responseStatusCode: undefined as unknown as number,
});

export const getCompareRowSelectionId = (row: CompareAnalyticsRow): string | null =>
  row.id ?? row._compared?.id ?? null;

export const isMatchedCompareRow = (row: CompareAnalyticsRow): boolean => Boolean(row.id && row._compared?.id);

const createComparedOnlyRow = (compared: AnalyticsResult): CompareAnalyticsRow => ({
  ...createEmptyComparePrimaryRow(compared),
  _compared: compared,
});

const sortCompareRows = (rows: CompareAnalyticsRow[]): CompareAnalyticsRow[] =>
  [...rows].sort((a, b) => {
    const nameCompare = (a.testCaseName ?? '').localeCompare(b.testCaseName ?? '');
    if (nameCompare !== 0) return nameCompare;
    return a.runIndex - b.runIndex;
  });

const indexRowsByKey = (
  rows: AnalyticsResult[],
  getKey: (row: AnalyticsResult) => string | null,
  exclude?: Set<AnalyticsResult>,
): Map<string, AnalyticsResult> => {
  const map = new Map<string, AnalyticsResult>();
  for (const row of rows) {
    if (exclude?.has(row)) continue;
    const key = getKey(row);
    if (key) map.set(key, row);
  }
  return map;
};

export const mergeByTestCaseId = (current: AnalyticsResult[], compared: AnalyticsResult[]): CompareAnalyticsRow[] => {
  const usedCompared = new Set<AnalyticsResult>();
  const merged: CompareAnalyticsRow[] = [];
  const unmatchedCurrent: AnalyticsResult[] = [];

  // Phase 1: match by testCaseId + runIndex when both sides share the same id
  const comparedById = indexRowsByKey(compared, getCompareIdKey);
  for (const row of current) {
    const idKey = getCompareIdKey(row);
    const match = idKey ? comparedById.get(idKey) : undefined;
    if (match) {
      merged.push({ ...row, _compared: match });
      usedCompared.add(match);
    } else {
      unmatchedCurrent.push(row);
    }
  }

  // Phase 2: match remaining rows by testCaseName + runIndex (e.g. public vs detached private copy)
  const comparedByName = indexRowsByKey(compared, getCompareNameKey, usedCompared);
  for (const row of unmatchedCurrent) {
    const nameKey = getCompareNameKey(row);
    const match = nameKey ? comparedByName.get(nameKey) : undefined;
    if (match && nameKey) {
      merged.push({ ...row, _compared: match });
      usedCompared.add(match);
      comparedByName.delete(nameKey);
    } else {
      merged.push({ ...row, _compared: null });
    }
  }

  for (const row of compared) {
    if (!usedCompared.has(row)) {
      merged.push(createComparedOnlyRow(row));
    }
  }

  return sortCompareRows(merged);
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
  return `${result?.testCaseName} - Run #${(result?.runIndex ?? 0) + 1}`;
};

export const getDetailEntries = (data: Record<string, unknown>): Array<[string, unknown]> => {
  return Object.keys(data).map((key) => {
    const val = data[key];
    if (typeof val === 'string') return [key, val];
    if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
      return [key, String(val)];
    }
    if (val == null) return [key, String(val)];
    return [key, val];
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
