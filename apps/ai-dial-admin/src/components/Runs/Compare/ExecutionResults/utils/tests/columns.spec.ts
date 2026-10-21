import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import CompareRunIndexHeader from '@/src/components/Grid/HeaderComponents/CompareRunIndexHeader';
import ScoreCellRenderer from '@/src/components/Grid/CellRenderers/ScoreCellRenderer';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import EllipsisHeaderGroup from '@/src/components/Grid/HeaderComponents/EllipsisHeaderGroup';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import {
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
  formatCompareRunIndexHeader,
} from '@/src/components/Runs/Compare/constants';
import {
  DEFAULT_COMPARE_DELTA_HEADER,
  EXTRACTED_GROUP_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  formatCompareColumnHeader,
  COMPARE_SCORE_COLUMN_MIN_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { getCompareColumnsCompare } from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import NumericGridFilterFloatingFilter from '@/src/components/Grid/Filter/NumericGridFilterFloatingFilter';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  responseStatusCode: 200,
  runIndex: 0,
  _compared: null,
  ...overrides,
});

const makeResult = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  responseStatusCode: 200,
  runIndex: 1,
  ...overrides,
});

// Metric groups nest a metric level (primary, secondary, delta) under the group; most assertions only
// care about the leaves, so this lifts them back to a single level.
const withFlattenedMetricLeaves = (col: ColDef | ColGroupDef): ColGroupDef => {
  const group = col as ColGroupDef;
  return { ...group, children: (group.children as ColGroupDef[]).flatMap((metric) => metric.children) };
};

describe('Runs Compare :: getCompareColumnsCompare', () => {
  test('keeps status and Test Case name columns on the bottom header row', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    const statusGroup = cols[0] as { children: ColDef[] };
    const testCaseName = cols.find((col) => (col as ColDef).colId === 'testCaseName') as ColDef;

    expect(testCaseName.suppressSpanHeaderHeight).toBe(true);
    expect(statusGroup.children.length).toBeGreaterThan(0);
    expect(statusGroup.children.every((col) => col.suppressSpanHeaderHeight === true)).toBe(true);
  });

  test('groups status columns under execution status without a visible group header', () => {
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      }),
    ]);
    const statusGroup = cols[0] as {
      headerName: string;
      context?: { panelName?: string };
      children: { colId?: string; headerName?: string; headerComponent?: unknown }[];
    };

    expect(statusGroup.headerName).toBe('');
    expect(statusGroup.context?.panelName).toBe(EXECUTION_STATUS_GROUP_HEADER);
    expect(statusGroup.children).toHaveLength(2);
    expect(statusGroup.children[0].colId).toBe('status');
    expect(statusGroup.children[0].headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX));
    expect(statusGroup.children[0].headerComponent).toBe(CompareRunIndexHeader);
    expect(statusGroup.children[1].colId).toBe('cmp_status');
    expect(statusGroup.children[1].headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX));
    expect(statusGroup.children[1].headerComponent).toBe(CompareRunIndexHeader);
    expect((cols[1] as ColDef).colId).toBe('testCaseName');
    expect(cols.filter((col) => (col as ColDef).colId === 'testCaseName')).toHaveLength(1);
  });

  test('status columns highlight added, changed, and removed pairs', () => {
    type StatusCol = {
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        executionStatus: ExtractionResultStatus.SUCCESS,
        _compared: makeResult({ executionStatus: ExtractionResultStatus.FAILED }),
      }),
    ]);
    const statusGroup = cols[0] as { children: StatusCol[] };
    const primaryCol = statusGroup.children[0];
    const secondaryCol = statusGroup.children[1];

    const changedRow = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.FAILED }),
    });
    const removedRow = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.ERROR }),
    });
    const addedRow = makeRow({
      executionStatus: ExtractionResultStatus.ERROR,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.SUCCESS }),
    });
    const sameStatusRow = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.SUCCESS }),
    });

    expect(primaryCol.cellClassRules?.['compare-metric-new-start']?.({ data: changedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-new-end']?.({ data: changedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-regressed-start']?.({ data: removedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-regressed-end']?.({ data: removedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-improved-start']?.({ data: addedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-improved-end']?.({ data: addedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-new-start']?.({ data: sameStatusRow })).toBe(false);
    expect(secondaryCol.cellClassRules?.['compare-metric-new-end']?.({ data: sameStatusRow })).toBe(false);
  });

  test('execution columns highlight http and duration diffs', () => {
    type ExecCol = {
      colId?: string;
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        responseStatusCode: 200,
        execDurationMs: 100,
        _compared: makeResult({ responseStatusCode: 500, execDurationMs: 250 }),
      }),
    ]);
    const exec = cols[2] as { children: ExecCol[] };
    const httpPrimary = exec.children.find((col) => col.colId === 'http');
    const httpSecondary = exec.children.find((col) => col.colId === 'cmp_http');
    const durationPrimary = exec.children.find((col) => col.colId === 'duration');
    const durationSecondary = exec.children.find((col) => col.colId === 'cmp_duration');
    const runPrimary = exec.children.find((col) => col.colId === 'runIndex');
    const changedRow = makeRow({
      responseStatusCode: 200,
      execDurationMs: 100,
      _compared: makeResult({ responseStatusCode: 500, execDurationMs: 250 }),
    });

    expect(httpPrimary?.cellClassRules?.['compare-metric-new-start']?.({ data: changedRow })).toBe(true);
    expect(httpSecondary?.cellClassRules?.['compare-metric-new-end']?.({ data: changedRow })).toBe(true);
    expect(durationPrimary?.cellClassRules?.['compare-metric-new-start']?.({ data: changedRow })).toBe(true);
    expect(durationSecondary?.cellClassRules?.['compare-metric-new-end']?.({ data: changedRow })).toBe(true);
    expect(runPrimary?.cellClassRules).toBeUndefined();
  });

  test('execution index, HTTP, and Duration columns are right-aligned', () => {
    type ExecCol = {
      colId?: string;
      cellClass?: string;
      headerComponentParams?: { isRightAligned?: boolean };
    };
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as { children: ExecCol[] };
    const executionColIds = [
      'runIndex',
      'cmp_runIndex',
      'requestIndex',
      'cmp_requestIndex',
      'turnIndex',
      'cmp_turnIndex',
      'http',
      'cmp_http',
      'duration',
      'cmp_duration',
    ];

    executionColIds.forEach((colId) => {
      const col = exec.children.find((child) => child.colId === colId);
      expect(col?.cellClass).toBe('align-right');
      expect(col?.headerComponentParams?.isRightAligned).toBe(true);
    });
  });

  test('execution columns are hidden by default', () => {
    type ExecCol = { colId?: string; hide?: boolean };
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as { children: ExecCol[] };
    const executionColIds = ['runIndex', 'cmp_runIndex', 'http', 'cmp_http', 'duration', 'cmp_duration'];

    executionColIds.forEach((colId) => {
      const col = exec.children.find((child) => child.colId === colId);
      expect(col?.hide).toBe(true);
    });
  });

  test('extracted columns highlight when values differ between runs', () => {
    type ExtractedCol = {
      colId?: string;
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        extractedColumns: { answer: 'yes' },
        _compared: makeResult({ extractedColumns: { answer: 'no' } }),
      }),
    ]);
    const extractedGroup = withFlattenedMetricLeaves(
      cols.find((col) => col.headerName === EXTRACTED_GROUP_HEADER)!,
    ) as { children: ExtractedCol[] };
    const primaryCol = extractedGroup.children.find((col) => col.colId === 'extracted_answer');
    const secondaryCol = extractedGroup.children.find((col) => col.colId === 'cmp_extracted_answer');
    const changedRow = makeRow({
      extractedColumns: { answer: 'yes' },
      _compared: makeResult({ extractedColumns: { answer: 'no' } }),
    });

    expect(primaryCol?.cellClassRules?.['compare-metric-new-start']?.({ data: changedRow })).toBe(true);
    expect(secondaryCol?.cellClassRules?.['compare-metric-new-end']?.({ data: changedRow })).toBe(true);
  });

  test('EXECUTION group has flat columns with run index in header name', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as {
      headerName: string;
      children: { headerName: string }[];
    };

    expect(exec.headerName).toBe(EXECUTION_GROUP_HEADER);
    expect(exec.children).toHaveLength(10);
    expect(exec.children.map((child) => child.headerName)).toEqual([
      formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, '# Run number'),
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, '# Run number'),
      formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Request'),
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Request'),
      formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Turn'),
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Turn'),
      formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'HTTP'),
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'HTTP'),
      formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Duration'),
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Duration'),
    ]);
  });

  test('Request and Turn columns are hidden by default and render the 1-based index for both runs', () => {
    type ExecChild = {
      colId?: string;
      hide?: boolean;
      valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown;
    };
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as { children: ExecChild[] };
    const byColId = (colId: string) => exec.children.find((child) => child.colId === colId) as ExecChild;

    const requestPrimary = byColId('requestIndex');
    const requestSecondary = byColId('cmp_requestIndex');
    const turnPrimary = byColId('turnIndex');
    const turnSecondary = byColId('cmp_turnIndex');

    expect([requestPrimary, requestSecondary, turnPrimary, turnSecondary].every((col) => col.hide === true)).toBe(true);

    const row = makeRow({
      requestIndex: 1,
      turnIndex: 0,
      _compared: makeResult({ requestIndex: 1, turnIndex: 2 }),
    });
    expect(requestPrimary.valueGetter({ data: row })).toBe(2);
    expect(requestSecondary.valueGetter({ data: row })).toBe(2);
    expect(turnPrimary.valueGetter({ data: row })).toBe(1);
    expect(turnSecondary.valueGetter({ data: row })).toBe(3);
  });

  test('Request and Turn columns stay empty for a non-chained, single-turn run', () => {
    type ExecChild = { colId?: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown };
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as { children: ExecChild[] };
    const byColId = (colId: string) => exec.children.find((child) => child.colId === colId) as ExecChild;
    const row = makeRow({ _compared: makeResult() });

    expect(byColId('requestIndex').valueGetter({ data: row })).toBe('—');
    expect(byColId('turnIndex').valueGetter({ data: row })).toBe('—');
    expect(byColId('cmp_requestIndex').valueGetter({ data: row })).toBe('—');
    expect(byColId('cmp_turnIndex').valueGetter({ data: row })).toBe('—');
    expect(byColId('cmp_requestIndex').valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });

  test('# Run number secondary column shows _compared.runIndex', () => {
    type ExecChild = { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown };
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      }),
    ]);
    const exec = cols[2] as { children: ExecChild[] };
    const secondaryCol = exec.children[1];

    expect(secondaryCol.valueGetter({ data: makeRow({ _compared: makeResult({ runIndex: 3 }) }) })).toBe(4);
    expect(secondaryCol.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });

  test('metric groups nest a metric level holding primary, secondary, and delta columns', () => {
    const rows = [
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8, Recall: 0.7 } },
        _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.5, Recall: 0.6 } } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows, undefined, DEFAULT_COMPARE_DELTA_HEADER);
    const metricGroup = cols[3] as {
      headerName: string;
      children: {
        headerName: string;
        headerGroupComponent?: unknown;
        children: {
          headerName: string;
          colId?: string;
          width?: number;
          minWidth?: number;
          flex?: number;
          suppressSizeToFit?: boolean;
          filter?: string | boolean;
          floatingFilter?: boolean;
          floatingFilterComponent?: unknown;
          headerComponent?: unknown;
          headerComponentParams?: { label?: string };
        }[];
      }[];
    };

    expect(metricGroup.headerName).toBe('Overall Accuracy');
    expect(metricGroup.children.map((metric) => metric.headerName)).toEqual(['Precision', 'Recall']);

    const [primary, secondary, delta] = metricGroup.children[0].children;
    expect(metricGroup.children[0].children).toHaveLength(3);
    expect(primary.colId).toBe('Overall Accuracy_Precision');
    expect(primary.headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX));
    expect(primary.headerComponent).toBe(CompareRunIndexHeader);
    expect(primary.headerComponentParams?.label).toBeUndefined();
    expect(metricGroup.children[0].headerGroupComponent).toBe(EllipsisHeaderGroup);
    expect(secondary.colId).toBe('cmp_Overall Accuracy_Precision');
    expect(secondary.headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX));
    expect(secondary.headerComponentParams?.label).toBeUndefined();
    expect(delta.headerName).toBe(DEFAULT_COMPARE_DELTA_HEADER);
    expect(delta.colId).toBe('delta_Overall Accuracy_Precision');
    for (const col of [primary, secondary, delta]) {
      expect(col).toMatchObject({
        width: COMPARE_SCORE_COLUMN_MIN_WIDTH,
        minWidth: COMPARE_SCORE_COLUMN_MIN_WIDTH,
        flex: 0,
        suppressSizeToFit: true,
      });
    }
    expect(COMPARE_SCORE_COLUMN_MIN_WIDTH).toBe(80);
    expect(delta.filter).toBe('agNumberColumnFilter');
    expect(delta.floatingFilter).toBe(true);
    expect(delta.floatingFilterComponent).toBe(NumericGridFilterFloatingFilter);
    expect(metricGroup.children[1].children[2].colId).toBe('delta_Overall Accuracy_Recall');
  });

  test('score and delta columns use the compact filter-icon floating filter', () => {
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { grp: { score: 0.8 } },
        _compared: makeResult({ metricValues: { grp: { score: 0.5 } } }),
      }),
    ]);
    const scoreColumns = withFlattenedMetricLeaves(cols[3]).children as ColDef[];

    expect(scoreColumns).toHaveLength(3);
    for (const col of scoreColumns) {
      expect(col).toMatchObject({
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: NumericGridFilterFloatingFilter,
        suppressFloatingFilterButton: true,
        suppressHeaderFilterButton: true,
      });
    }
  });

  test('primary and secondary score columns always use ScoreCellRenderer so missing values render as styled dashes', () => {
    const cols = getCompareColumnsCompare([makeRow({ metricValues: { grp: { score: 0.8 } }, _compared: null })]);
    const [primary, secondary] = withFlattenedMetricLeaves(cols[3]).children as ColDef[];

    expect(primary.cellRenderer).toBe(ScoreCellRenderer);
    expect(secondary.cellRenderer).toBe(ScoreCellRenderer);
    expect(primary.cellRendererSelector).toBeUndefined();
    expect(secondary.cellRendererSelector).toBeUndefined();
  });

  test('primary, secondary, and delta metric columns are right-aligned', () => {
    const rows = [
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
        _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.5 } } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows);
    const metricGroup = withFlattenedMetricLeaves(cols[3]) as {
      children: {
        colId?: string;
        cellClass?: string | string[];
        headerClass?: string;
        headerComponentParams?: { isRightAligned?: boolean };
      }[];
    };
    const primaryPrecision = metricGroup.children[0];
    const secondaryPrecision = metricGroup.children[1];
    const deltaPrecision = metricGroup.children[2];

    expect(primaryPrecision).toMatchObject({ cellClass: ['p-0', NO_BORDER_CLASS], headerClass: 'align-right' });
    expect(secondaryPrecision).toMatchObject({ cellClass: ['p-0', NO_BORDER_CLASS], headerClass: 'align-right' });
    expect(deltaPrecision).toMatchObject({ cellClass: 'align-right', headerClass: 'align-right' });
    expect(primaryPrecision.headerComponentParams?.isRightAligned).toBe(true);
    expect(secondaryPrecision.headerComponentParams?.isRightAligned).toBe(true);
  });

  test('metric columns highlight added, changed, and removed pairs', () => {
    type MetricCol = {
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8, Recall: null as unknown as number } },
        _compared: makeResult({
          metricValues: { 'Overall Accuracy': { Precision: 0.5, Recall: 0.9 } },
        }),
      }),
    ]);
    const metricGroup = withFlattenedMetricLeaves(cols[3]) as { children: MetricCol[] };
    const primaryPrecision = metricGroup.children[0];
    const secondaryPrecision = metricGroup.children[1];
    const primaryRecall = metricGroup.children[3];
    const secondaryRecall = metricGroup.children[4];

    const changedRow = makeRow({
      metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.5 } } }),
    });
    const addedRow = makeRow({
      metricValues: { 'Overall Accuracy': { Recall: null as unknown as number } },
      _compared: makeResult({ metricValues: { 'Overall Accuracy': { Recall: 0.9 } } }),
    });
    const removedRow = makeRow({
      metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: null as unknown as number } } }),
    });

    expect(primaryPrecision.cellClassRules?.['compare-metric-new-start']?.({ data: changedRow })).toBe(true);
    expect(secondaryPrecision.cellClassRules?.['compare-metric-new-end']?.({ data: changedRow })).toBe(true);
    expect(primaryRecall.cellClassRules?.['compare-metric-improved-start']?.({ data: addedRow })).toBe(true);
    expect(secondaryRecall.cellClassRules?.['compare-metric-improved-end']?.({ data: addedRow })).toBe(true);
    expect(primaryPrecision.cellClassRules?.['compare-metric-regressed-start']?.({ data: removedRow })).toBe(true);
    expect(secondaryPrecision.cellClassRules?.['compare-metric-regressed-end']?.({ data: removedRow })).toBe(true);
  });

  test('metric columns highlight removed when _compared is null', () => {
    type MetricCol = {
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
        _compared: null,
      }),
    ]);
    const metricGroup = withFlattenedMetricLeaves(cols[3]) as { children: MetricCol[] };
    const primaryPrecision = metricGroup.children[0];
    const secondaryPrecision = metricGroup.children[1];
    const unmatchedRow = makeRow({
      metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      _compared: null,
    });

    expect(primaryPrecision.cellClassRules?.['compare-metric-regressed-start']?.({ data: unmatchedRow })).toBe(true);
    expect(secondaryPrecision.cellClassRules?.['compare-metric-regressed-end']?.({ data: unmatchedRow })).toBe(true);
  });

  test('does not include a pinned eye action column', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    expect(cols.some((col) => (col as ColDef).colId === 'compare_action')).toBe(false);
    expect(cols.some((col) => (col as ColDef).pinned === 'right')).toBe(false);
  });

  test('extracted group nests a field level holding the primary and secondary columns', () => {
    const rows = [
      makeRow({
        extractedColumns: { answer: 'yes', reason: 'ok' },
        _compared: makeResult({ extractedColumns: { answer: 'no', reason: 'bad' } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows);
    const extractedGroup = cols.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as {
      headerName: string;
      children: {
        headerName: string;
        children: { headerName: string; colId?: string; headerComponent?: unknown }[];
      }[];
    };

    expect(extractedGroup.children.map((field) => field.headerName)).toEqual(['answer', 'reason']);

    const [primary, secondary] = extractedGroup.children[0].children;
    expect(extractedGroup.children[0].children).toHaveLength(2);
    expect(primary.colId).toBe('extracted_answer');
    expect(primary.headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX));
    expect(primary.headerComponent).toBe(CompareRunIndexHeader);
    expect(secondary.colId).toBe('cmp_extracted_answer');
    expect(secondary.headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX));
  });

  test('metric valueGetters return dash for null metric values', () => {
    const rows = [
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: null as unknown as number } },
        _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.8 } } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows);
    const metricGroup = withFlattenedMetricLeaves(cols[3]) as {
      children: { valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
    };
    const primaryCol = metricGroup.children[0];
    const secondaryCol = metricGroup.children[1];
    const row = rows[0];

    expect(primaryCol.valueGetter({ data: row })).toBe('—');
    expect(secondaryCol.valueGetter({ data: row })).toBe(0.8);
  });

  test('compared valueGetters return dash when _compared is null', () => {
    const rows = [makeRow({ metricValues: { grp: { score: 0.8 } }, _compared: null })];
    const cols = getCompareColumnsCompare(rows);
    const metricGroup = withFlattenedMetricLeaves(cols[3]) as {
      children: { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
    };
    const secondaryCol = metricGroup.children[1];
    expect(secondaryCol.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });

  test('primary HTTP valueGetter returns dash for compared-only rows', () => {
    type ExecChild = { colId?: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown };
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as { children: ExecChild[] };
    const primaryHttpCol = exec.children.find((child) => child.colId === 'http') as ExecChild;

    expect(primaryHttpCol.colId).toBe('http');
    expect(
      primaryHttpCol.valueGetter({
        data: makeRow({
          responseStatusCode: undefined as unknown as number,
          _compared: makeResult({ responseStatusCode: 200 }),
        }),
      }),
    ).toBe('—');
    expect(primaryHttpCol.valueGetter({ data: makeRow({ responseStatusCode: 404 }) })).toBe(404);
  });

  test('omits cellClassRules on compare columns when hideHighlights is true', () => {
    const cols = getCompareColumnsCompare(
      [
        makeRow({
          metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
        }),
      ],
      undefined,
      DEFAULT_COMPARE_DELTA_HEADER,
      { hideHighlights: true },
    );

    expect((cols[0] as ColDef).cellClassRules).toBeUndefined();

    const statusGroup = cols[0] as { children: { cellClassRules?: Record<string, unknown> }[] };
    expect(statusGroup.children[0].cellClassRules).toBeUndefined();
    expect(statusGroup.children[1].cellClassRules).toBeUndefined();

    const metricGroup = withFlattenedMetricLeaves(cols[3]) as {
      children: { cellClassRules?: Record<string, unknown> }[];
    };
    const primaryPrecision = metricGroup.children[0];
    const secondaryPrecision = metricGroup.children[1];

    expect(primaryPrecision.cellClassRules).toBeUndefined();
    expect(secondaryPrecision.cellClassRules).toBeUndefined();
  });

  test('keeps the execution index pairs hidden even when their positions vary across both runs', () => {
    const cols = getCompareColumnsCompare([
      makeRow({
        runIndex: 0,
        requestIndex: 0,
        turnIndex: 0,
        _compared: makeResult({ runIndex: 0, requestIndex: 0, turnIndex: 0 }),
      }),
      makeRow({
        runIndex: 1,
        requestIndex: 1,
        turnIndex: 1,
        _compared: makeResult({ runIndex: 1, requestIndex: 1, turnIndex: 1 }),
      }),
    ]);

    const execution = cols.find((col) => (col as ColGroupDef).headerName === EXECUTION_GROUP_HEADER) as ColGroupDef;
    const indexPairs = ['runIndex', 'cmp_runIndex', 'requestIndex', 'cmp_requestIndex', 'turnIndex', 'cmp_turnIndex'];
    const hiddenColIds = (execution.children as ColDef[]).filter((col) => col.hide).map((col) => col.colId);

    expect(hiddenColIds).toEqual(expect.arrayContaining(indexPairs));
  });
});

describe('Runs Compare :: getCompareColumnsCompare run order', () => {
  const rows = [
    makeRow({
      metricValues: { Accuracy: { precision: 0.5 } },
      extractedColumns: { answer: 'yes' },
      _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } }, extractedColumns: { answer: 'no' } }),
    }),
  ];
  const runs = getCompareRuns({ id: 'run-1', name: 'Run #1' }, { id: 'run-2', name: 'Run #2' });
  const reversedRuns = getCompareRuns({ id: 'run-1', name: 'Run #1' }, { id: 'run-2', name: 'Run #2' }).reverse();
  const PAIRED_COL_IDS = ['status', 'http', 'duration', 'runIndex', 'Accuracy_precision', 'extracted_answer'];
  // The index columns are paired but carry no diff highlight.
  const HIGHLIGHTED_COL_IDS = PAIRED_COL_IDS.filter((colId) => colId !== 'runIndex');

  const collectLeaves = (cols: (ColDef | ColGroupDef)[]): ColDef[] =>
    cols.flatMap((col) => {
      const children = (col as ColGroupDef).children as (ColDef | ColGroupDef)[] | undefined;
      return children ? collectLeaves(children) : [col as ColDef];
    });
  const getColIds = (options?: { runs?: typeof runs }) =>
    collectLeaves(getCompareColumnsCompare(rows, undefined, undefined, options)).map((col) => col.colId as string);
  const getRuleKeys = (options: { runs?: typeof runs }, colId: string): string[] => {
    const leaf = collectLeaves(getCompareColumnsCompare(rows, undefined, undefined, options)).find(
      (col) => col.colId === colId,
    );
    return Object.keys((leaf?.cellClassRules as Record<string, unknown>) ?? {});
  };

  test('lists the primary column first when runs are in baseline-first order', () => {
    [undefined, { runs }].forEach((options) => {
      const colIds = getColIds(options);

      PAIRED_COL_IDS.forEach((colId) => {
        expect(colIds.indexOf(colId)).toBeLessThan(colIds.indexOf(`cmp_${colId}`));
      });
    });
  });

  test('lists the compared column ahead of the primary one in every pair when displayed in reverse', () => {
    const colIds = getColIds({ runs: reversedRuns });

    PAIRED_COL_IDS.forEach((colId) => {
      expect(colIds.indexOf(`cmp_${colId}`)).toBeLessThan(colIds.indexOf(colId));
    });
  });

  test('keeps the same columns and the delta column right after the pair when displayed in reverse', () => {
    const reversedIds = getColIds({ runs: reversedRuns });

    expect(reversedIds.indexOf('delta_Accuracy_precision')).toBe(reversedIds.indexOf('Accuracy_precision') + 1);
    expect([...reversedIds].sort()).toEqual([...getColIds()].sort());
  });

  test('keeps run index badges with their run', () => {
    const headers = collectLeaves(getCompareColumnsCompare(rows, undefined, undefined, { runs: reversedRuns }))
      .filter((col) => col.colId === 'status' || col.colId === 'cmp_status')
      .map((col) => col.headerName);

    expect(headers).toEqual([
      formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX),
      formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX),
    ]);
  });

  test('closes the diff box by position: the first column opens its right edge, the last its left edge', () => {
    HIGHLIGHTED_COL_IDS.forEach((colId) => {
      expect(getRuleKeys({ runs }, colId)).not.toHaveLength(0);
      expect(getRuleKeys({ runs }, colId).every((key) => key.endsWith('-start'))).toBe(true);
      expect(getRuleKeys({ runs }, `cmp_${colId}`).every((key) => key.endsWith('-end'))).toBe(true);

      expect(getRuleKeys({ runs: reversedRuns }, colId).every((key) => key.endsWith('-end'))).toBe(true);
      expect(getRuleKeys({ runs: reversedRuns }, `cmp_${colId}`).every((key) => key.endsWith('-start'))).toBe(true);
    });
  });

  test('reads the diff kind baseline-to-compared whichever way the runs are displayed', () => {
    const changedRow = makeRow({
      metricValues: { Accuracy: { precision: 0.5 } },
      _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } } }),
    });
    const leaves = collectLeaves(getCompareColumnsCompare([changedRow], undefined, undefined, { runs: reversedRuns }));
    type RuleCol = { cellClassRules: Record<string, (p: { data?: CompareAnalyticsRow }) => boolean> };
    const primaryCol = leaves.find((col) => col.colId === 'Accuracy_precision') as unknown as RuleCol;
    const comparedCol = leaves.find((col) => col.colId === 'cmp_Accuracy_precision') as unknown as RuleCol;

    expect(primaryCol.cellClassRules['compare-metric-new-end']({ data: changedRow })).toBe(true);
    expect(comparedCol.cellClassRules['compare-metric-new-start']({ data: changedRow })).toBe(true);
  });
});
