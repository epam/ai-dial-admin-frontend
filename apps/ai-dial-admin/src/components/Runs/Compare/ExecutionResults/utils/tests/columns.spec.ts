import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import CompareRunIndexHeader from '@/src/components/Grid/HeaderComponents/CompareRunIndexHeader';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import {
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
  formatCompareRunIndexHeader,
} from '@/src/components/Runs/Compare/constants';
import {
  COMPARE_ACTION_COL_ID,
  DELTA_COLUMN_WIDTH,
  DEFAULT_COMPARE_DELTA_HEADER,
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  formatCompareColumnHeader,
  HTTP_COLUMN_WIDTH,
  METRIC_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
  getCompareColumnsCompare,
  mergeComparePanelColumns,
  splitComparePanelColumns,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
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

describe('Runs Compare :: getCompareColumnsCompare', () => {
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

    expect(primaryCol.cellClassRules?.['compare-metric-new-primary']?.({ data: changedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-new-secondary']?.({ data: changedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-regressed-primary']?.({ data: removedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-regressed-secondary']?.({ data: removedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-improved-primary']?.({ data: addedRow })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-metric-improved-secondary']?.({ data: addedRow })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-metric-new-primary']?.({ data: sameStatusRow })).toBe(false);
    expect(secondaryCol.cellClassRules?.['compare-metric-new-secondary']?.({ data: sameStatusRow })).toBe(false);
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

    expect(httpPrimary?.cellClassRules?.['compare-metric-new-primary']?.({ data: changedRow })).toBe(true);
    expect(httpSecondary?.cellClassRules?.['compare-metric-new-secondary']?.({ data: changedRow })).toBe(true);
    expect(durationPrimary?.cellClassRules?.['compare-metric-new-primary']?.({ data: changedRow })).toBe(true);
    expect(durationSecondary?.cellClassRules?.['compare-metric-new-secondary']?.({ data: changedRow })).toBe(true);
    expect(runPrimary?.cellClassRules).toBeUndefined();
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
    const extractedGroup = cols.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as {
      children: ExtractedCol[];
    };
    const primaryCol = extractedGroup.children.find((col) => col.colId === 'extracted_answer');
    const secondaryCol = extractedGroup.children.find((col) => col.colId === 'cmp_extracted_answer');
    const changedRow = makeRow({
      extractedColumns: { answer: 'yes' },
      _compared: makeResult({ extractedColumns: { answer: 'no' } }),
    });

    expect(primaryCol?.cellClassRules?.['compare-metric-new-primary']?.({ data: changedRow })).toBe(true);
    expect(secondaryCol?.cellClassRules?.['compare-metric-new-secondary']?.({ data: changedRow })).toBe(true);
  });

  test('EXECUTION group has flat columns with run index in header name', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[2] as {
      headerName: string;
      children: { headerName: string }[];
    };

    expect(exec.headerName).toBe(EXECUTION_GROUP_HEADER);
    expect(exec.children).toHaveLength(6);
    expect(exec.children[0].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, '# Run number'));
    expect(exec.children[1].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, '# Run number'));
    expect(exec.children[2].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'HTTP'));
    expect(exec.children[3].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'HTTP'));
    expect(exec.children[4].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Duration'));
    expect(exec.children[5].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Duration'));
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

  test('metric groups have primary, secondary, and delta columns per metric key', () => {
    const rows = [
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
        _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.5 } } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows, undefined, DEFAULT_COMPARE_DELTA_HEADER);
    const metricGroup = cols[3] as {
      headerName: string;
      children: { headerName: string; colId?: string; width?: number }[];
    };

    expect(metricGroup.headerName).toBe('Overall Accuracy');
    expect(metricGroup.children).toHaveLength(3);
    expect(metricGroup.children[0].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'Precision'));
    expect(metricGroup.children[0].width).toBe(METRIC_COLUMN_WIDTH);
    expect(metricGroup.children[1].headerName).toBe(
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'Precision'),
    );
    expect(metricGroup.children[1].colId).toBe('cmp_Overall Accuracy_Precision');
    expect(metricGroup.children[2].headerName).toBe(DEFAULT_COMPARE_DELTA_HEADER);
    expect(metricGroup.children[2].colId).toBe('delta_Overall Accuracy_Precision');
    expect(metricGroup.children[2].width).toBe(DELTA_COLUMN_WIDTH);
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
    const metricGroup = cols[3] as { children: MetricCol[] };
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

    expect(primaryPrecision.cellClassRules?.['compare-metric-new-primary']?.({ data: changedRow })).toBe(true);
    expect(secondaryPrecision.cellClassRules?.['compare-metric-new-secondary']?.({ data: changedRow })).toBe(true);
    expect(primaryRecall.cellClassRules?.['compare-metric-improved-primary']?.({ data: addedRow })).toBe(true);
    expect(secondaryRecall.cellClassRules?.['compare-metric-improved-secondary']?.({ data: addedRow })).toBe(true);
    expect(primaryPrecision.cellClassRules?.['compare-metric-regressed-primary']?.({ data: removedRow })).toBe(true);
    expect(secondaryPrecision.cellClassRules?.['compare-metric-regressed-secondary']?.({ data: removedRow })).toBe(
      true,
    );
  });

  test('includes pinned eye action column at the end', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    const actionCol = cols[cols.length - 1] as ColDef;
    expect(actionCol.colId).toBe(COMPARE_ACTION_COL_ID);
    expect(actionCol.pinned).toBe('right');
    expect(actionCol.lockPinned).toBe(true);
  });

  test('extracted group has paired columns with run index in header name', () => {
    const rows = [
      makeRow({
        extractedColumns: { answer: 'yes' },
        _compared: makeResult({ extractedColumns: { answer: 'no' } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows);
    const extractedGroup = cols.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as {
      headerName: string;
      children: { headerName: string; colId?: string }[];
    };

    expect(extractedGroup.headerName).toBe(EXTRACTED_GROUP_HEADER);
    expect(extractedGroup.children).toHaveLength(2);
    expect(extractedGroup.children[0].headerName).toBe(formatCompareColumnHeader(RUN_COMPARE_PRIMARY_INDEX, 'answer'));
    expect(extractedGroup.children[1].headerName).toBe(
      formatCompareColumnHeader(RUN_COMPARE_SECONDARY_INDEX, 'answer'),
    );
    expect(extractedGroup.children[1].colId).toBe('cmp_extracted_answer');
  });

  test('metric valueGetters return dash for null metric values', () => {
    const rows = [
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: null as unknown as number } },
        _compared: makeResult({ metricValues: { 'Overall Accuracy': { Precision: 0.8 } } }),
      }),
    ];
    const cols = getCompareColumnsCompare(rows);
    const metricGroup = cols[3] as {
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
    const metricGroup = cols[3] as {
      children: { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
    };
    const secondaryCol = metricGroup.children[1];
    expect(secondaryCol.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
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

    const metricGroup = cols[3] as { children: { cellClassRules?: Record<string, unknown> }[] };
    const primaryPrecision = metricGroup.children[0];
    const secondaryPrecision = metricGroup.children[1];

    expect(primaryPrecision.cellClassRules).toBeUndefined();
    expect(secondaryPrecision.cellClassRules).toBeUndefined();
  });
});

describe('Runs Compare :: compare panel columns', () => {
  test('splitComparePanelColumns removes action column from panel list', () => {
    const columns = getCompareColumnsCompare([makeRow()]);
    const { panelColumns, actionColumn } = splitComparePanelColumns(columns as ColDef[]);

    expect(panelColumns.some((col) => col.colId === COMPARE_ACTION_COL_ID)).toBe(false);
    expect(actionColumn?.colId).toBe(COMPARE_ACTION_COL_ID);
    expect(panelColumns).toHaveLength(columns.length - 1);
  });

  test('mergeComparePanelColumns appends action column and keeps it visible', () => {
    const columns = getCompareColumnsCompare([makeRow()]);
    const { panelColumns, actionColumn } = splitComparePanelColumns(columns as ColDef[]);
    const hiddenPanelColumns = panelColumns.map((col) => ({ ...col, hide: true }));
    const merged = mergeComparePanelColumns(hiddenPanelColumns, actionColumn);

    expect(merged[merged.length - 1].colId).toBe(COMPARE_ACTION_COL_ID);
    expect(merged[merged.length - 1].hide).toBe(false);
  });
});
