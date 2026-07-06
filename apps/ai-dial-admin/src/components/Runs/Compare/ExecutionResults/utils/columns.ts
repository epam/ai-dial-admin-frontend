import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import { isScoreIndicatorValue } from '@/src/components/Common/ScoreBar/utils';
import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';
import CompareDeltaCellRenderer from '@/src/components/Grid/CellRenderers/CompareDeltaCellRenderer';
import CompareEyeCellRenderer from '@/src/components/Grid/CellRenderers/CompareEyeCellRenderer';
import CompareMetricScoreCellRenderer from '@/src/components/Grid/CellRenderers/CompareMetricScoreCellRenderer';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import CompareRunIndexHeader from '@/src/components/Grid/HeaderComponents/CompareRunIndexHeader';
import {
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
  formatCompareRunIndexHeader,
} from '@/src/components/Runs/Compare/constants';
import {
  COMPARE_ACTION_COL_ID,
  COMPARE_ACTION_COLUMN_WIDTH,
  DEFAULT_COMPARE_DELTA_HEADER,
  DELTA_COLUMN_WIDTH,
  DURATION_COLUMN_WIDTH,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  formatCompareColumnHeader,
  HTTP_COLUMN_WIDTH,
  METRIC_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  NUMBER_FILTER_COL_DEF,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnsCompareOptions } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { getFormattedDuration } from '@/src/components/Runs/View/utils';
import { AnalyticsResult } from '@/src/models/evaluation/run';

type CompareRunIndex = typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;

const compareRunIndexHeaderDef = (
  runIndex: CompareRunIndex,
  label?: string,
): Pick<ColDef, 'headerName' | 'headerComponent' | 'headerComponentParams'> => ({
  headerName: label ? formatCompareColumnHeader(runIndex, label) : formatCompareRunIndexHeader(runIndex),
  headerComponent: CompareRunIndexHeader,
  headerComponentParams: { runIndex, label },
});

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

const buildMetricColumn = (groupKey: string, key: string): ColDef => ({
  field: `${groupKey}_${key}`,
  colId: `${groupKey}_${key}`,
  headerName: key,
  ...NUMBER_FILTER_COL_DEF,
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

const getMetricPairHighlightRules = (groupKey: string, key: string) => {
  const getKind = (params: { data?: CompareAnalyticsRow }) => {
    const primary = params.data?.metricValues?.[groupKey]?.[key];
    const secondary = params.data?._compared?.metricValues?.[groupKey]?.[key];
    return getMetricDelta(primary, secondary).kind;
  };

  const isAdded = (params: { data?: CompareAnalyticsRow }) => getKind(params) === MetricDeltaKind.Added;
  const isChanged = (params: { data?: CompareAnalyticsRow }) => getKind(params) === MetricDeltaKind.Changed;
  const isRemoved = (params: { data?: CompareAnalyticsRow }) => getKind(params) === MetricDeltaKind.Removed;

  return { isAdded, isChanged, isRemoved };
};

const getMetricPairPrimaryCellClassRules = (groupKey: string, key: string) => {
  const { isAdded, isChanged, isRemoved } = getMetricPairHighlightRules(groupKey, key);

  return {
    'compare-metric-improved-primary': isAdded,
    'compare-metric-new-primary': isChanged,
    'compare-metric-regressed-primary': isRemoved,
  };
};

const getMetricPairSecondaryCellClassRules = (groupKey: string, key: string) => {
  const { isAdded, isChanged, isRemoved } = getMetricPairHighlightRules(groupKey, key);

  return {
    'compare-metric-improved-secondary': isAdded,
    'compare-metric-new-secondary': isChanged,
    'compare-metric-regressed-secondary': isRemoved,
  };
};

const hasExecutionStatusDiff = (params: { data?: CompareAnalyticsRow }) => {
  const compared = params.data?._compared;
  if (!compared) return false;

  const primary = params.data?.executionStatus;
  const secondary = compared.executionStatus;
  if (primary == null && secondary == null) return false;
  return primary !== secondary;
};

const statusPairPrimaryCellClassRules = {
  'compare-status-diff-primary': hasExecutionStatusDiff,
};

const statusPairSecondaryCellClassRules = {
  'compare-status-diff-secondary': hasExecutionStatusDiff,
};

const buildComparedMetricColumn = (
  groupKey: string,
  key: string,
  errorText?: string,
  hideHighlights?: boolean,
): ColDef => {
  const getRawValue = (params: { data?: CompareAnalyticsRow }) =>
    params.data?._compared?.metricValues?.[groupKey]?.[key];

  const getDisplayValue = (params: { data?: CompareAnalyticsRow }) => {
    if (!params.data?._compared) return '—';
    const source = params.data._compared;
    const groupExists = source.metricValues != null && groupKey in source.metricValues;
    if (!groupExists) return '—';
    const value = getRawValue(params);
    if (typeof value === 'object') return JSON.stringify(value);
    if (value != null) return +(value as number).toFixed(3);
    return '—';
  };

  return {
    colId: `cmp_${groupKey}_${key}`,
    field: `cmp_${groupKey}_${key}`,
    ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, key),
    ...NUMBER_FILTER_COL_DEF,
    ...fixedWidthColDef(METRIC_COLUMN_WIDTH),
    cellRendererSelector: (params) => {
      if (!params.data?._compared) return;
      const source = params.data._compared;
      const groupExists = source.metricValues != null && groupKey in source.metricValues;
      if (!groupExists) return;
      const value = getRawValue(params);
      if (value == null) return;
      if (isScoreIndicatorValue(value)) {
        return {
          component: CompareMetricScoreCellRenderer,
          params: { getMetricValue: getDisplayValue, errorText },
        };
      }
    },
    valueGetter: (params) => getDisplayValue(params),
    ...(hideHighlights ? {} : { cellClassRules: getMetricPairSecondaryCellClassRules(groupKey, key) }),
  };
};

const buildComparePrimaryMetricColumn = (
  groupKey: string,
  key: string,
  errorText?: string,
  hideHighlights?: boolean,
): ColDef => {
  const getRawValue = (params: { data?: CompareAnalyticsRow }) => params.data?.metricValues?.[groupKey]?.[key];

  const getDisplayValue = (params: { data?: CompareAnalyticsRow }) => {
    const groupExists = params.data?.metricValues != null && groupKey in params.data.metricValues;
    if (!groupExists) return '—';
    const value = getRawValue(params);
    if (typeof value === 'object') return JSON.stringify(value);
    if (value != null) return +(value as number).toFixed(3);
    return '—';
  };

  return {
    ...buildMetricColumn(groupKey, key),
    ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, key),
    ...fixedWidthColDef(METRIC_COLUMN_WIDTH),
    cellStyle: undefined,
    cellRendererSelector: (params) => {
      const groupExists = params.data?.metricValues != null && groupKey in params.data.metricValues;
      if (!groupExists) return;
      const value = getRawValue(params);
      if (value == null) return;
      if (isScoreIndicatorValue(value)) {
        return {
          component: CompareMetricScoreCellRenderer,
          params: { getMetricValue: getDisplayValue, errorText },
        };
      }
    },
    valueGetter: (params) => getDisplayValue(params),
    ...(hideHighlights ? {} : { cellClassRules: getMetricPairPrimaryCellClassRules(groupKey, key) }),
  };
};

const buildMetricDeltaColumn = (groupKey: string, key: string, deltaHeader: string): ColDef => ({
  colId: `delta_${groupKey}_${key}`,
  field: `delta_${groupKey}_${key}`,
  headerName: deltaHeader,
  ...NO_FILTER_COL_DEF,
  ...fixedWidthColDef(DELTA_COLUMN_WIDTH),
  cellRenderer: CompareDeltaCellRenderer,
  cellRendererParams: { groupKey, metricKey: key },
  valueGetter: () => null,
});

const buildComparedExtractedColumn = (key: string): ColDef => ({
  colId: `cmp_extracted_${key}`,
  field: `cmp_extracted_${key}`,
  ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, key),
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
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, '# Run number'),
      colId: 'runIndex',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?.runIndex != null ? params.data.runIndex + 1 : null,
    },
    {
      colId: 'cmp_runIndex',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, '# Run number'),
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?._compared?.runIndex != null ? params.data._compared.runIndex + 1 : '—',
    },
    {
      field: 'responseStatusCode',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, 'HTTP'),
      colId: 'http',
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
    },
    {
      colId: 'cmp_http',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, 'HTTP'),
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
      valueGetter: (params) => params.data?._compared?.responseStatusCode ?? '—',
    },
    {
      field: 'durationMs',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, 'Duration'),
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
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, 'Duration'),
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
  deltaHeader: string = DEFAULT_COMPARE_DELTA_HEADER,
  hideHighlights?: boolean,
): ColGroupDef[] =>
  Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    children: Object.keys(groupValues).flatMap((key) => [
      buildComparePrimaryMetricColumn(groupKey, key, errorText, hideHighlights),
      buildComparedMetricColumn(groupKey, key, errorText, hideHighlights),
      buildMetricDeltaColumn(groupKey, key, deltaHeader),
    ]),
  }));

const getComparedExecutionStatusGroup = (hideHighlights?: boolean): ColGroupDef => ({
  headerName: '',
  context: { panelName: EXECUTION_STATUS_GROUP_HEADER },
  children: [
    {
      field: 'executionStatus',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX),
      colId: 'status',
      ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
      ...NO_FILTER_COL_DEF,
      cellRenderer: ExecutionStatusCellRenderer,
      ...(hideHighlights ? {} : { cellClassRules: statusPairPrimaryCellClassRules }),
    },
    {
      colId: 'cmp_status',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX),
      ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
      ...NO_FILTER_COL_DEF,
      cellRenderer: (params: ICellRendererParams<CompareAnalyticsRow>) =>
        ExecutionStatusCellRenderer({
          ...params,
          data: params.data?._compared ?? null,
        }),
      ...(hideHighlights ? {} : { cellClassRules: statusPairSecondaryCellClassRules }),
    },
  ],
});

const getComparedExtractedGroupColumn = (extracted: Record<string, unknown>): ColGroupDef | null => {
  const keys = Object.keys(extracted);
  if (keys.length === 0) return null;

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: keys.flatMap((key) => [
      { ...buildExtractedColumn(key), ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, key) },
      buildComparedExtractedColumn(key),
    ]),
  };
};

export const getCompareColumnsCompare = (
  results: CompareAnalyticsRow[],
  errorText?: string,
  deltaHeader: string = DEFAULT_COMPARE_DELTA_HEADER,
  options?: CompareColumnsCompareOptions,
): (ColDef | ColGroupDef)[] => {
  const hideHighlights = options?.hideHighlights ?? false;
  const allResults: AnalyticsResult[] = [...results, ...results.flatMap((r) => (r._compared ? [r._compared] : []))];
  const metrics = mergeMetricValuesSchema(allResults);
  const extracted = mergeExtractedColumnsSchema(allResults);
  const extractedGroup = getComparedExtractedGroupColumn(extracted);

  return [
    getComparedExecutionStatusGroup(hideHighlights),
    {
      field: 'testCaseName',
      headerName: 'Test Case name',
      colId: 'testCaseName',
      ...fixedWidthColDef(TEST_CASE_NAME_COLUMN_WIDTH),
      ...TEXT_FILTER_COL_DEF,
      suppressSpanHeaderHeight: true,
    },
    getComparedExecutionColumns(),
    ...getComparedMetricGroupColumns(metrics, errorText, deltaHeader, hideHighlights),
    ...(extractedGroup ? [extractedGroup] : []),
    {
      colId: COMPARE_ACTION_COL_ID,
      headerName: ' ',
      ...fixedWidthColDef(COMPARE_ACTION_COLUMN_WIDTH),
      ...NO_FILTER_COL_DEF,
      cellRenderer: CompareEyeCellRenderer,
      sortable: false,
      suppressMovable: true,
      pinned: 'right',
      lockPinned: true,
      suppressSpanHeaderHeight: true,
    },
  ];
};

export const splitComparePanelColumns = (columns: ColDef[]): { panelColumns: ColDef[]; actionColumn?: ColDef } => {
  const actionIndex = columns.findIndex((col) => col.colId === COMPARE_ACTION_COL_ID);
  if (actionIndex === -1) {
    return { panelColumns: columns };
  }

  return {
    panelColumns: columns.filter((_, index) => index !== actionIndex),
    actionColumn: columns[actionIndex],
  };
};

export const mergeComparePanelColumns = (panelColumns: ColDef[], actionColumn?: ColDef): ColDef[] => {
  if (!actionColumn) {
    return panelColumns;
  }

  return [...panelColumns, { ...actionColumn, hide: false }];
};

export interface CompareEyeRendererParams {
  onOpenRowDetail?: (row: CompareAnalyticsRow) => void;
  selectedRowId?: string | null;
  viewRowDetailsLabel?: string;
}

export const applyEyeCellRendererParams = (columns: ColDef[], params: CompareEyeRendererParams): ColDef[] =>
  columns.map((col) => (col.colId === COMPARE_ACTION_COL_ID ? { ...col, cellRendererParams: params } : col));
