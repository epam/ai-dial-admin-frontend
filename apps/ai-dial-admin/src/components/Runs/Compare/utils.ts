import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';
import ErrorCellRenderer from '@/src/components/Grid/CellRenderers/ErrorCellRenderer';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { getFormattedDuration } from '@/src/components/Runs/View/utils';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';

import {
  CompareRunSlot,
  DURATION_COLUMN_WIDTH,
  EXECUTION_GROUP_HEADER,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  formatCompareColumnHeader,
  formatCompareRunIndexHeader,
  HTTP_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  NUMBER_FILTER_COL_DEF,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
} from './constants';

const fixedWidthColDef = (width: number): Pick<ColDef, 'width' | 'minWidth' | 'maxWidth'> => ({
  width,
  minWidth: width,
  maxWidth: width,
});

const mergeMetricValuesSchema = (results: AnalyticsResult[]): Record<string, Record<string, unknown>> => {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const result of results) {
    const metricValues = result.metricValues;
    if (!metricValues) continue;
    for (const [groupKey, groupValues] of Object.entries(metricValues)) {
      if (!merged[groupKey]) merged[groupKey] = {};
      for (const [key, value] of Object.entries(groupValues)) {
        if (!(key in merged[groupKey])) merged[groupKey][key] = value;
      }
    }
  }
  return merged;
};

const mergeExtractedColumnsSchema = (results: AnalyticsResult[]): Record<string, unknown> => {
  return results.reduce<Record<string, unknown>>((acc, result) => ({ ...acc, ...(result.extractedColumns || {}) }), {});
};

const buildMetricColumn = (groupKey: string, key: string, errorText?: string): ColDef => ({
  field: `${groupKey}_${key}`,
  colId: `${groupKey}_${key}`,
  headerName: key,
  ...NUMBER_FILTER_COL_DEF,
  cellRendererSelector: (params) => {
    const groupExists = params.data?.metricValues != null && groupKey in params.data.metricValues;
    if (!groupExists) return;
    const value = params.data?.metricValues?.[groupKey]?.[key];
    if (value == null) {
      return { component: ErrorCellRenderer, params: { errorText } };
    }
  },
  valueGetter: (params) => {
    const groupExists = params.data?.metricValues != null && groupKey in params.data.metricValues;
    if (!groupExists) return '—';
    const value = params.data?.metricValues?.[groupKey]?.[key];
    if (typeof value === 'object') return JSON.stringify(value);
    if (value != null) return +(value as number).toFixed(3);
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
});

const buildExtractedColumn = (key: string): ColDef => ({
  field: `extracted_${key}`,
  colId: `extracted_${key}`,
  headerName: key,
  flex: 1,
  minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
  ...NO_FILTER_COL_DEF,
  valueGetter: (params) => {
    const value = params.data?.extractedColumns?.[key];
    if (typeof value === 'object') return JSON.stringify(value);
    return value ?? '—';
  },
});

const getExecutionColumns = (): ColGroupDef => ({
  headerName: EXECUTION_GROUP_HEADER,
  children: [
    {
      field: 'runIndex',
      headerName: '# Run number',
      colId: 'runIndex',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<AnalyticsResult>) =>
        params.data?.runIndex != null ? params.data.runIndex + 1 : null,
    },
    {
      field: 'responseStatusCode',
      headerName: 'HTTP',
      colId: 'http',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
    },
    {
      field: 'durationMs',
      headerName: 'Duration',
      colId: 'duration',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<AnalyticsResult>) => {
        const data = params.data as AnalyticsResult & { executionInfo?: { durationMs?: number } };
        return getFormattedDuration(data?.executionInfo?.durationMs ?? data?.execDurationMs);
      },
    },
  ],
});

const getMetricGroupColumns = (metrics: Record<string, Record<string, unknown>>, errorText?: string): ColGroupDef[] =>
  Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).map((key) => buildMetricColumn(groupKey, key, errorText)),
  }));

const getExtractedGroupColumn = (extracted: Record<string, unknown>): ColGroupDef | null => {
  const keys = Object.keys(extracted);
  if (keys.length === 0) return null;

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: keys.map((key) => buildExtractedColumn(key)),
  };
};

export const getCompareColumns = (results: AnalyticsResult[], errorText?: string): (ColDef | ColGroupDef)[] => {
  const metrics = mergeMetricValuesSchema(results);
  const extracted = mergeExtractedColumnsSchema(results);
  const extractedGroup = getExtractedGroupColumn(extracted);

  return [
    {
      field: 'executionStatus',
      headerName: ' ',
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
    getExecutionColumns(),
    ...getMetricGroupColumns(metrics, errorText),
    ...(extractedGroup ? [extractedGroup] : []),
  ];
};

export const getSelectableCompareRuns = (
  suiteRuns: Run[],
  slot: CompareRunSlot,
  primaryRunId?: string,
  comparedRunId?: string | null,
): Run[] => {
  const excludedRunId = slot === CompareRunSlot.Primary ? comparedRunId : primaryRunId;
  return suiteRuns.filter((run) => run.id !== excludedRunId);
};

const buildComparedMetricColumn = (groupKey: string, key: string, errorText?: string): ColDef => {
  const getValue = (params: { data?: CompareAnalyticsRow }) => params.data?._compared?.metricValues?.[groupKey]?.[key];

  return {
    colId: `cmp_${groupKey}_${key}`,
    field: `cmp_${groupKey}_${key}`,
    headerName: formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, key),
    ...NUMBER_FILTER_COL_DEF,
    cellRendererSelector: (params) => {
      if (!params.data?._compared) return;
      const source = params.data._compared;
      const groupExists = source.metricValues != null && groupKey in source.metricValues;
      if (!groupExists) return;
      const value = getValue(params);
      if (value == null) {
        return { component: ErrorCellRenderer, params: { errorText } };
      }
    },
    valueGetter: (params) => {
      if (!params.data?._compared) return '—';
      const source = params.data._compared;
      const groupExists = source.metricValues != null && groupKey in source.metricValues;
      if (!groupExists) return '—';
      const value = getValue(params);
      if (typeof value === 'object') return JSON.stringify(value);
      if (value != null) return +(value as number).toFixed(3);
      return '—';
    },
    cellStyle: (params) => {
      const value = getValue(params);
      if (typeof value === 'number' && value >= 0 && value <= 1) {
        const colors = getAccuracyColors(value);
        return { backgroundColor: colors.bg };
      }
      return undefined;
    },
  };
};

const buildComparedExtractedColumn = (key: string): ColDef => ({
  colId: `cmp_extracted_${key}`,
  field: `cmp_extracted_${key}`,
  headerName: formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, key),
  flex: 1,
  minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
  ...NO_FILTER_COL_DEF,
  valueGetter: (params) => {
    if (!params.data?._compared) return '—';
    const value = params.data._compared.extractedColumns?.[key];
    if (typeof value === 'object') return JSON.stringify(value);
    return value ?? '—';
  },
});

const getComparedExecutionColumns = (): ColGroupDef => ({
  headerName: EXECUTION_GROUP_HEADER,
  children: [
    {
      field: 'runIndex',
      headerName: formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, '# Run number'),
      colId: 'runIndex',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?.runIndex != null ? params.data.runIndex + 1 : null,
    },
    {
      colId: 'cmp_runIndex',
      headerName: formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, '# Run number'),
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?._compared?.runIndex != null ? params.data._compared.runIndex + 1 : '—',
    },
    {
      field: 'responseStatusCode',
      headerName: formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'HTTP'),
      colId: 'http',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
    },
    {
      colId: 'cmp_http',
      headerName: formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'HTTP'),
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
      valueGetter: (params) => params.data?._compared?.responseStatusCode ?? '—',
    },
    {
      field: 'durationMs',
      headerName: formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Duration'),
      colId: 'duration',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) => {
        const data = params.data as CompareAnalyticsRow & { executionInfo?: { durationMs?: number } };
        return getFormattedDuration(data?.executionInfo?.durationMs ?? data?.execDurationMs);
      },
    },
    {
      colId: 'cmp_duration',
      headerName: formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Duration'),
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) => {
        if (!params.data?._compared) return '—';
        return getFormattedDuration(params.data._compared.execDurationMs);
      },
    },
  ],
});

const getComparedMetricGroupColumns = (
  metrics: Record<string, Record<string, unknown>>,
  errorText?: string,
): ColGroupDef[] =>
  Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).flatMap((key) => [
      {
        ...buildMetricColumn(groupKey, key, errorText),
        headerName: formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, key),
      },
      buildComparedMetricColumn(groupKey, key, errorText),
    ]),
  }));

const getComparedExtractedGroupColumn = (extracted: Record<string, unknown>): ColGroupDef | null => {
  const keys = Object.keys(extracted);
  if (keys.length === 0) return null;

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: keys.flatMap((key) => [
      { ...buildExtractedColumn(key), headerName: formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, key) },
      buildComparedExtractedColumn(key),
    ]),
  };
};

export const getCompareColumnsCompare = (
  results: CompareAnalyticsRow[],
  errorText?: string,
): (ColDef | ColGroupDef)[] => {
  const allResults: AnalyticsResult[] = [...results, ...results.flatMap((r) => (r._compared ? [r._compared] : []))];
  const metrics = mergeMetricValuesSchema(allResults);
  const extracted = mergeExtractedColumnsSchema(allResults);
  const extractedGroup = getComparedExtractedGroupColumn(extracted);

  return [
    {
      field: 'executionStatus',
      headerName: formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX),
      colId: 'status',
      ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
      ...NO_FILTER_COL_DEF,
      cellRenderer: ExecutionStatusCellRenderer,
    },
    {
      colId: 'cmp_status',
      headerName: formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX),
      ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
      ...NO_FILTER_COL_DEF,
      cellRenderer: (params: ICellRendererParams<CompareAnalyticsRow>) =>
        ExecutionStatusCellRenderer({
          ...params,
          data: params.data?._compared ?? null,
        }),
    },
    {
      field: 'testCaseName',
      headerName: 'Test Case name',
      colId: 'testCaseName',
      ...fixedWidthColDef(TEST_CASE_NAME_COLUMN_WIDTH),
      ...TEXT_FILTER_COL_DEF,
    },
    getComparedExecutionColumns(),
    ...getComparedMetricGroupColumns(metrics, errorText),
    ...(extractedGroup ? [extractedGroup] : []),
  ];
};
