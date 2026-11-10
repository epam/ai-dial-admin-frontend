import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import CompareDeltaCellRenderer from '@/src/components/Grid/CellRenderers/CompareDeltaCellRenderer';
import ExecutionStatusCellRenderer from '@/src/components/Grid/CellRenderers/ExecutionStatusCellRenderer';
import OverallScoreCellRenderer from '@/src/components/Grid/CellRenderers/OverallScoreCellRenderer';
import NumericGridFilterFloatingFilter from '@/src/components/Grid/Filter/NumericGridFilterFloatingFilter';
import CompareRunIndexHeader from '@/src/components/Grid/HeaderComponents/CompareRunIndexHeader';
import EllipsisHeaderGroup from '@/src/components/Grid/HeaderComponents/EllipsisHeaderGroup';
import { CompareRunEdge, CompareRunSlot, formatCompareRunIndexHeader } from '@/src/components/Runs/Compare/constants';
import {
  compareScoreColDef,
  DEFAULT_COMPARE_DELTA_HEADER,
  DURATION_COLUMN_WIDTH,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  fixedWidthColDef,
  HTTP_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  REQUEST_INDEX_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
  TURN_INDEX_COLUMN_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnsCompareOptions } from '@/src/components/Runs/Compare/ExecutionResults/models';
import {
  COMPARE_OVERALL_SCORE_COLUMN_WIDTH,
  ELLIPSIS_HEADER_PARAMS,
  RIGHT_ALIGNED_ELLIPSIS_HEADER_PARAMS,
} from '@/src/components/Runs/grid-column-layout';
import { CompareRun, CompareRunIndex } from '@/src/components/Runs/Compare/models';
import {
  getCompareRowResult,
  getCompareRunColId,
  getCompareRunEdge,
  getCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import {
  formatCompareExtractedCellValue,
  formatCompareMetricCellValue,
  getCompareFieldDelta,
  getCompareRowDurationMs,
  getOverallScoreDeltaKind,
  getExecutionStatusDelta,
  getMetricDeltaSortValue,
  mergeCompareMetricValuesSchema,
  MetricDeltaKind,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { OVERALL_SCORE_COL_ID, OVERALL_SCORE_HEADER } from '@/src/components/Runs/constants';
import { getRoundedTestCaseScore } from '@/src/components/Runs/utils/test-case-scores';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { rightAlignedColumn } from '@/src/constants/grid-columns/configs';
import { baseNumberFilter } from '@/src/constants/grid-columns/filters';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { getFormattedDuration } from '@/src/components/Runs/View/utils';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { getUniformExecutionFields, hideUniformColumns } from '@/src/utils/evaluation/column-variation';
import ScoreCellRenderer from '@/src/components/Grid/CellRenderers/ScoreCellRenderer';

interface RunColumnContext {
  run: CompareRun;
  edge: CompareRunEdge;
  hideHighlights?: boolean;
}

const DEFAULT_COMPARE_RUNS = getCompareRuns({ id: '', name: '' }, { id: '', name: '' });

/** Every per-run column is headed by its run-index badge only; the field's name sits on a group above. */
const compareRunIndexHeaderDef = (
  runIndex: CompareRunIndex,
  isRightAligned?: boolean,
): Pick<ColDef, 'headerName' | 'headerComponent' | 'headerComponentParams'> => ({
  headerName: formatCompareRunIndexHeader(runIndex),
  headerComponent: CompareRunIndexHeader,
  headerComponentParams: { runIndex, isRightAligned },
});

/** Builds one column per run, in display order; each knows which edge of its pair it sits at. */
const buildRunColumns = (
  runs: CompareRun[],
  hideHighlights: boolean | undefined,
  build: (context: RunColumnContext) => ColDef,
): ColDef[] => runs.map((run, position) => build({ run, edge: getCompareRunEdge(position), hideHighlights }));

const mergeExtractedColumnsSchema = (results: AnalyticsResult[]): Record<string, unknown> => {
  return results.reduce<Record<string, unknown>>((acc, result) => ({ ...acc, ...(result.extractedColumns || {}) }), {});
};

type PairKindGetter = (params: { data?: CompareAnalyticsRow }) => MetricDeltaKind;

const buildComparePairCellClassRules = (getKind: PairKindGetter, edge: CompareRunEdge) => ({
  [`compare-metric-improved-${edge}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Added,
  [`compare-metric-new-${edge}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Changed,
  [`compare-metric-regressed-${edge}`]: (params: { data?: CompareAnalyticsRow }) =>
    getKind(params) === MetricDeltaKind.Removed,
});

// A diff is always read baseline → compared, so the kind is shared by both cells of a pair wherever they sit.
const getComparePairKind =
  (resolveValues: (row: CompareAnalyticsRow) => { primary: unknown; secondary: unknown }, isNumeric = false) =>
  (params: { data?: CompareAnalyticsRow }): MetricDeltaKind => {
    if (!params.data) {
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

const getStatusPairKind: PairKindGetter = (params) => {
  if (!params.data) {
    return MetricDeltaKind.Empty;
  }

  return getExecutionStatusDelta(params.data.executionStatus, params.data._compared?.executionStatus);
};

const getOverallScorePairKind: PairKindGetter = (params) =>
  params.data ? getOverallScoreDeltaKind(params.data) : MetricDeltaKind.Empty;

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

/** The edge picks which side of the diff box stays open, so the box closes around the pair on screen. */
const pairCellClassRules = ({ edge, hideHighlights }: RunColumnContext, getKind: PairKindGetter) =>
  hideHighlights ? {} : { cellClassRules: buildComparePairCellClassRules(getKind, edge) };

/** Funnel icon only, no inline input: the score and delta columns are too narrow for one. */
const COMPACT_NUMBER_FILTER_COL_DEF: Pick<
  ColDef,
  | 'filter'
  | 'floatingFilter'
  | 'floatingFilterComponent'
  | 'suppressFloatingFilterButton'
  | 'suppressHeaderFilterButton'
  | 'filterParams'
> = {
  filter: 'agNumberColumnFilter',
  floatingFilter: true,
  floatingFilterComponent: NumericGridFilterFloatingFilter,
  suppressFloatingFilterButton: true,
  suppressHeaderFilterButton: true,
  filterParams: {
    ...baseNumberFilter.filterParams,
    buttons: ['reset'],
  },
};

const buildRunMetricColumn = (context: RunColumnContext, groupKey: string, key: string): ColDef => {
  const { run } = context;
  const colId = getCompareRunColId(run.slot, `${groupKey}_${key}`);

  return {
    colId,
    field: colId,
    ...compareRunIndexHeaderDef(run.index, true),
    ...COMPACT_NUMBER_FILTER_COL_DEF,
    ...compareScoreColDef,
    ...rightAlignedColumn,
    cellClass: ['p-0', NO_BORDER_CLASS],
    cellRenderer: ScoreCellRenderer,
    valueGetter: (params) => {
      const result = params.data && getCompareRowResult(params.data, run.slot);
      const groupExists = result?.metricValues != null && groupKey in result.metricValues;
      if (!groupExists) return '—';
      return formatCompareMetricCellValue(result?.metricValues?.[groupKey]?.[key]);
    },
    ...pairCellClassRules(context, getMetricPairKind(groupKey, key)),
  };
};

const buildMetricDeltaColumn = (groupKey: string, key: string, deltaHeader: string): ColDef => ({
  colId: `delta_${groupKey}_${key}`,
  field: `delta_${groupKey}_${key}`,
  headerName: deltaHeader,
  headerComponentParams: RIGHT_ALIGNED_ELLIPSIS_HEADER_PARAMS,
  ...COMPACT_NUMBER_FILTER_COL_DEF,
  ...compareScoreColDef,
  ...rightAlignedColumn,
  cellRenderer: CompareDeltaCellRenderer,
  cellRendererParams: { groupKey, metricKey: key },
  comparator: numberValueComparator,
  valueGetter: (params) => {
    const primary = params.data?.metricValues?.[groupKey]?.[key];
    const secondary = params.data?._compared?.metricValues?.[groupKey]?.[key];
    return getMetricDeltaSortValue(primary, secondary) ?? undefined;
  },
});

const buildRunExtractedColumn = (context: RunColumnContext, key: string): ColDef => {
  const { run } = context;
  const colId = getCompareRunColId(run.slot, `extracted_${key}`);

  return {
    colId,
    field: colId,
    ...compareRunIndexHeaderDef(run.index),
    flex: 1,
    minWidth: EXTRACTED_COLUMN_MIN_WIDTH,
    ...NO_FILTER_COL_DEF,
    valueGetter: (params) => {
      const result = params.data && getCompareRowResult(params.data, run.slot);
      if (!result) return '—';
      return formatCompareExtractedCellValue(result.extractedColumns?.[key]);
    },
    ...pairCellClassRules(context, getExtractedPairKind(key)),
  };
};

type CompareIndexColumnField = 'runIndex' | 'requestIndex' | 'turnIndex';

const buildRunIndexColumn = (context: RunColumnContext, field: CompareIndexColumnField, width: number): ColDef => ({
  colId: getCompareRunColId(context.run.slot, field),
  ...compareRunIndexHeaderDef(context.run.index, true),
  hide: true,
  ...NO_FILTER_COL_DEF,
  ...fixedWidthColDef(width),
  ...rightAlignedColumn,
  valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) => {
    const index = params.data && getCompareRowResult(params.data, context.run.slot)?.[field];
    return index != null ? index + 1 : '—';
  },
});

const buildRunOverallScoreColumn = (context: RunColumnContext, threshold?: number | null): ColDef => ({
  colId: getCompareRunColId(context.run.slot, OVERALL_SCORE_COL_ID),
  ...compareRunIndexHeaderDef(context.run.index, true),
  hide: true,
  ...NO_FILTER_COL_DEF,
  ...fixedWidthColDef(COMPARE_OVERALL_SCORE_COLUMN_WIDTH),
  ...rightAlignedColumn,
  sortable: true,
  comparator: numberValueComparator,
  cellRenderer: OverallScoreCellRenderer,
  cellRendererParams: { threshold },
  valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
    getRoundedTestCaseScore((params.data && getCompareRowResult(params.data, context.run.slot))?.testCaseScore),
  ...pairCellClassRules(context, getOverallScorePairKind),
});

const buildRunHttpColumn = (context: RunColumnContext): ColDef => ({
  colId: getCompareRunColId(context.run.slot, 'http'),
  ...compareRunIndexHeaderDef(context.run.index, true),
  hide: true,
  ...NO_FILTER_COL_DEF,
  ...fixedWidthColDef(HTTP_COLUMN_WIDTH),
  ...rightAlignedColumn,
  valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
    (params.data && getCompareRowResult(params.data, context.run.slot))?.responseStatusCode ?? '—',
  ...pairCellClassRules(context, getHttpPairKind),
});

const buildRunDurationColumn = (context: RunColumnContext): ColDef => ({
  colId: getCompareRunColId(context.run.slot, 'duration'),
  ...compareRunIndexHeaderDef(context.run.index, true),
  hide: true,
  ...NO_FILTER_COL_DEF,
  ...fixedWidthColDef(DURATION_COLUMN_WIDTH),
  ...rightAlignedColumn,
  valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) => {
    const result = params.data && getCompareRowResult(params.data, context.run.slot);
    return result ? getCompareRowDurationMs(result) : null;
  },
  valueFormatter: (params) => getFormattedDuration(params.value ?? undefined),
  ...pairCellClassRules(context, getDurationPairKind),
});

const buildRunStatusColumn = (context: RunColumnContext): ColDef => ({
  colId: getCompareRunColId(context.run.slot, 'status'),
  ...compareRunIndexHeaderDef(context.run.index),
  ...fixedWidthColDef(STATUS_COLUMN_WIDTH),
  maxWidth: STATUS_COLUMN_WIDTH,
  // Same as Test Case name: stay on the bottom header row instead of spanning up into the empty group rows.
  suppressSpanHeaderHeight: true,
  ...NO_FILTER_COL_DEF,
  valueGetter: (params: ValueGetterParams<CompareAnalyticsRow>) =>
    (params.data && getCompareRowResult(params.data, context.run.slot))?.executionStatus,
  cellRenderer: (params: ICellRendererParams<CompareAnalyticsRow>) =>
    ExecutionStatusCellRenderer({
      ...params,
      data: (params.data && getCompareRowResult(params.data, context.run.slot)) ?? null,
    }),
  ...pairCellClassRules(context, getStatusPairKind),
});

/**
 * An index column is a pair of per-run columns here, so a field the merged rows never vary is expanded
 * to every run's colId — the pair is one reading and is shown or hidden as one.
 */
const getUniformComparePairFields = (results: AnalyticsResult[], runs: CompareRun[]): Set<string> =>
  new Set(
    [...getUniformExecutionFields(results)].flatMap((field) => runs.map((run) => getCompareRunColId(run.slot, field))),
  );

/**
 * Every Execution field is one header over a leaf per run, headed by the run-index badge — the way a
 * metric's name sits over its run columns — so the title row reads the same across the whole grid.
 */
const buildExecutionFieldGroup = (label: string, leaves: ColDef[], uniformFields: Set<string>): ColGroupDef => ({
  headerName: label,
  headerGroupComponent: EllipsisHeaderGroup,
  children: hideUniformColumns(leaves, uniformFields),
});

/**
 * Shares the Extraction Result grid's variation rule so the two cannot drift on what "varies" means.
 * `hideUniformColumns` only ever hides, and every leaf here already ships `hide: true` — a comparison
 * opens on the metrics being compared — so this is a no-op today and stays one until those defaults
 * are deliberately loosened.
 */
const getComparedExecutionColumns = (
  results: AnalyticsResult[],
  runs: CompareRun[],
  hideHighlights?: boolean,
  thresholds?: Partial<Record<CompareRunSlot, number | null>>,
): ColGroupDef => {
  const uniformFields = getUniformComparePairFields(results, runs);
  const fieldGroup = (label: string, build: (context: RunColumnContext) => ColDef) =>
    buildExecutionFieldGroup(label, buildRunColumns(runs, hideHighlights, build), uniformFields);

  return {
    headerName: EXECUTION_GROUP_HEADER,
    headerGroupComponent: EllipsisHeaderGroup,
    children: [
      fieldGroup('# Run number', (context) => buildRunIndexColumn(context, 'runIndex', RUN_INDEX_COLUMN_WIDTH)),
      fieldGroup('Request', (context) => buildRunIndexColumn(context, 'requestIndex', REQUEST_INDEX_COLUMN_WIDTH)),
      fieldGroup('Turn', (context) => buildRunIndexColumn(context, 'turnIndex', TURN_INDEX_COLUMN_WIDTH)),
      fieldGroup(OVERALL_SCORE_HEADER, (context) =>
        buildRunOverallScoreColumn(context, thresholds?.[context.run.slot]),
      ),
      fieldGroup('HTTP', buildRunHttpColumn),
      fieldGroup('Duration', buildRunDurationColumn),
    ],
  };
};

const getComparedMetricGroupColumns = (
  metrics: Record<string, Record<string, unknown>>,
  runs: CompareRun[],
  deltaHeader: string = DEFAULT_COMPARE_DELTA_HEADER,
  hideHighlights?: boolean,
): ColGroupDef[] =>
  Object.entries(metrics).map(([groupKey, groupValues]) => ({
    headerName: groupKey,
    headerGroupComponent: EllipsisHeaderGroup,
    children: Object.keys(groupValues).map((key) => ({
      headerName: key,
      headerGroupComponent: EllipsisHeaderGroup,
      children: [
        ...buildRunColumns(runs, hideHighlights, (context) => buildRunMetricColumn(context, groupKey, key)),
        buildMetricDeltaColumn(groupKey, key, deltaHeader),
      ],
    })),
  }));

const getComparedExecutionStatusGroup = (runs: CompareRun[], hideHighlights?: boolean): ColGroupDef => ({
  headerName: '',
  context: { panelName: EXECUTION_STATUS_GROUP_HEADER },
  children: buildRunColumns(runs, hideHighlights, buildRunStatusColumn),
});

const getComparedExtractedGroupColumn = (
  extracted: Record<string, unknown>,
  runs: CompareRun[],
  hideHighlights?: boolean,
): ColGroupDef | null => {
  const keys = Object.keys(extracted);
  if (keys.length === 0) return null;

  return {
    headerName: EXTRACTED_GROUP_HEADER,
    headerGroupComponent: EllipsisHeaderGroup,
    children: keys.map((key) => ({
      headerName: key,
      headerGroupComponent: EllipsisHeaderGroup,
      children: buildRunColumns(runs, hideHighlights, (context) => buildRunExtractedColumn(context, key)),
    })),
  };
};

export const getCompareColumnsCompare = (
  results: CompareAnalyticsRow[],
  _errorText?: string,
  deltaHeader: string = DEFAULT_COMPARE_DELTA_HEADER,
  options?: CompareColumnsCompareOptions,
): (ColDef | ColGroupDef)[] => {
  const hideHighlights = options?.hideHighlights ?? false;
  const runs = options?.runs ?? DEFAULT_COMPARE_RUNS;
  const allResults: AnalyticsResult[] = [...results, ...results.flatMap((r) => (r._compared ? [r._compared] : []))];
  const metrics = options?.metricsSchema ?? mergeCompareMetricValuesSchema(allResults);
  const extracted = mergeExtractedColumnsSchema(allResults);
  const extractedGroup = getComparedExtractedGroupColumn(extracted, runs, hideHighlights);

  return [
    getComparedExecutionStatusGroup(runs, hideHighlights),
    {
      field: 'testCaseName',
      headerName: 'Test Case name',
      headerComponentParams: ELLIPSIS_HEADER_PARAMS,
      colId: 'testCaseName',
      ...fixedWidthColDef(TEST_CASE_NAME_COLUMN_WIDTH),
      ...TEXT_FILTER_COL_DEF,
      suppressSpanHeaderHeight: true,
    },
    getComparedExecutionColumns(allResults, runs, hideHighlights, options?.thresholds),
    ...getComparedMetricGroupColumns(metrics, runs, deltaHeader, hideHighlights),
    ...(extractedGroup ? [extractedGroup] : []),
  ];
};
