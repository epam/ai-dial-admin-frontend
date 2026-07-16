import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import { isScoreIndicatorValue } from '@/src/components/Common/ScoreBar/utils';
import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';
import CompareDeltaCellRenderer from '@/src/components/Grid/CellRenderers/CompareDeltaCellRenderer';
import NumericGridFilterFloatingFilter from '@/src/components/Grid/Filter/NumericGridFilterFloatingFilter';
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
import {
  formatCompareExtractedCellValue,
  formatCompareMetricCellValue,
  getCompareFieldDelta,
  getCompareRowDurationMs,
  getExecutionStatusDelta,
  getMetricDeltaSortValue,
  mergeCompareMetricValuesSchema,
  MetricDeltaKind,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { baseNumberFilter } from '@/src/constants/grid-columns/filters';
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
    return formatCompareMetricCellValue(value);
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

const buildExtractedColumn = (key: string, hideHighlights?: boolean): ColDef => ({
  field: `extracted_${key}`,
  colId: `extracted_${key}`,
  headerName: key,
  flex: 1,
  minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
  ...NO_FILTER_COL_DEF,
  valueGetter: (params) => {
    const value = params.data?.extractedColumns?.[key];
    return formatCompareExtractedCellValue(value);
  },
  ...maybePairCellClassRules(hideHighlights, getExtractedPairKind(key), 'primary'),
});

type ComparePairSide = 'primary' | 'secondary';

const buildComparePairCellClassRules = (
  getKind: (params: { data?: CompareAnalyticsRow }) => MetricDeltaKind,
  side: ComparePairSide,
) => ({
  [`compare-metric-improved-${side}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Added,
  [`compare-metric-new-${side}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Changed,
  [`compare-metric-regressed-${side}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Removed,
});

const getComparePairKind =
  (resolveValues: (row: CompareAnalyticsRow) => { primary: unknown; secondary: unknown }, isNumeric = false) =>
  (params: { data?: CompareAnalyticsRow }): MetricDeltaKind => {
    if (!params.data?._compared) {
      return MetricDeltaKind.Empty;
    }

    const { primary, secondary } = resolveValues(params.data);
    return getCompareFieldDelta(primary, secondary, { isNumeric });
  };

const getMetricPairKind = (groupKey: string, key: string) =>
  getComparePairKind(
    (row) => ({
      primary: row.metricValues?.[groupKey]?.[key],
      secondary: row._compared?.metricValues?.[groupKey]?.[key],
    }),
    true,
  );

const getStatusPairKind = (params: { data?: CompareAnalyticsRow }): MetricDeltaKind => {
  const compared = params.data?._compared;
  if (!compared) {
    return MetricDeltaKind.Empty;
  }

  return getExecutionStatusDelta(params.data?.executionStatus, compared.executionStatus);
};

const getHttpPairKind = getComparePairKind(
  (row) => ({
    primary: row.responseStatusCode,
    secondary: row._compared?.responseStatusCode ?? null,
  }),
  true,
);

const getDurationPairKind = getComparePairKind(
  (row) => ({
    primary: getCompareRowDurationMs(row),
    secondary: row._compared ? getCompareRowDurationMs(row._compared) : null,
  }),
  true,
);

const getExtractedPairKind = (key: string) =>
  getComparePairKind((row) => ({
    primary: row.extractedColumns?.[key] ?? null,
    secondary: row._compared?.extractedColumns?.[key] ?? null,
  }));

const maybePairCellClassRules = (
  hideHighlights: boolean | undefined,
  getKind: (params: { data?: CompareAnalyticsRow }) => MetricDeltaKind,
  side: ComparePairSide,
) => (hideHighlights ? {} : { cellClassRules: buildComparePairCellClassRules(getKind, side) });

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
    return formatCompareMetricCellValue(value);
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
    ...maybePairCellClassRules(hideHighlights, getMetricPairKind(groupKey, key), 'secondary'),
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
    return formatCompareMetricCellValue(value);
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
    ...maybePairCellClassRules(hideHighlights, getMetricPairKind(groupKey, key), 'primary'),
  };
};

const buildMetricDeltaColumn = (groupKey: string, key: string, deltaHeader: string): ColDef => ({
  colId: `delta_${groupKey}_${key}`,
  field: `delta_${groupKey}_${key}`,
  headerName: deltaHeader,
  filter: 'agNumberColumnFilter',
  floatingFilter: true,
  floatingFilterComponent: NumericGridFilterFloatingFilter,
  suppressFloatingFilterButton: true,
  suppressHeaderFilterButton: true,
  filterParams: {
    ...baseNumberFilter.filterParams,
    buttons: ['reset'],
  },
  ...fixedWidthColDef(DELTA_COLUMN_WIDTH),
  cellRenderer: CompareDeltaCellRenderer,
  cellRendererParams: { groupKey, metricKey: key },
  comparator: numberValueComparator,
  valueGetter: (params) => {
    const primary = params.data?.metricValues?.[groupKey]?.[key];
    const secondary = params.data?._compared?.metricValues?.[groupKey]?.[key];
    return getMetricDeltaSortValue(primary, secondary) ?? undefined;
  },
});

const buildComparedExtractedColumn = (key: string, hideHighlights?: boolean): ColDef => ({
  colId: `cmp_extracted_${key}`,
  field: `cmp_extracted_${key}`,
  ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, key),
  flex: 1,
  minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
  ...NO_FILTER_COL_DEF,
  valueGetter: (params) => {
    if (!params.data?._compared) return '—';
    const value = params.data._compared.extractedColumns?.[key];
    return formatCompareExtractedCellValue(value);
  },
  ...maybePairCellClassRules(hideHighlights, getExtractedPairKind(key), 'secondary'),
});

const getComparedExecutionColumns = (hideHighlights?: boolean): ColGroupDef => ({
  headerName: EXECUTION_GROUP_HEADER,
  children: [
    {
      field: 'runIndex',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, '# Run number'),
      colId: 'runIndex',
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?.runIndex != null ? params.data.runIndex + 1 : null,
    },
    {
      colId: 'cmp_runIndex',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, '# Run number'),
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(RUN_INDEX_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        params.data?._compared?.runIndex != null ? params.data._compared.runIndex + 1 : '—',
    },
    {
      field: 'responseStatusCode',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, 'HTTP'),
      colId: 'http',
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
      valueGetter: (params) => params.data?.responseStatusCode ?? '—',
      ...maybePairCellClassRules(hideHighlights, getHttpPairKind, 'primary'),
    },
    {
      colId: 'cmp_http',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, 'HTTP'),
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
      valueGetter: (params) => params.data?._compared?.responseStatusCode ?? '—',
      ...maybePairCellClassRules(hideHighlights, getHttpPairKind, 'secondary'),
    },
    {
      field: 'durationMs',
      ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, 'Duration'),
      colId: 'duration',
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
        getFormattedDuration(params.data ? (getCompareRowDurationMs(params.data) ?? undefined) : undefined),
      ...maybePairCellClassRules(hideHighlights, getDurationPairKind, 'primary'),
    },
    {
      colId: 'cmp_duration',
      ...compareRunIndexHeaderDef(RUN_COMPARE_SECONDARY_INDEX, 'Duration'),
      hide: true,
      ...NO_FILTER_COL_DEF,
      ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
      valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) => {
        if (!params.data?._compared) return '—';
        return getFormattedDuration(getCompareRowDurationMs(params.data._compared) ?? undefined);
      },
      ...maybePairCellClassRules(hideHighlights, getDurationPairKind, 'secondary'),
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
      ...maybePairCellClassRules(hideHighlights, getStatusPairKind, 'primary'),
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
      ...maybePairCellClassRules(hideHighlights, getStatusPairKind, 'secondary'),
    },
  ],
});

const getComparedExtractedGroupColumn = (
  extracted: Record<string, unknown>,
  hideHighlights?: boolean,
): ColGroupDef | null => {
  const keys = Object.keys(extracted);
  if (keys.length === 0) return null;

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    children: keys.flatMap((key) => [
      { ...buildExtractedColumn(key, hideHighlights), ...compareRunIndexHeaderDef(RUN_COMPARE_PRIMARY_INDEX, key) },
      buildComparedExtractedColumn(key, hideHighlights),
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
  const metrics = options?.metricsSchema ?? mergeCompareMetricValuesSchema(allResults);
  const extracted = mergeExtractedColumnsSchema(allResults);
  const extractedGroup = getComparedExtractedGroupColumn(extracted, hideHighlights);

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
    getComparedExecutionColumns(hideHighlights),
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
