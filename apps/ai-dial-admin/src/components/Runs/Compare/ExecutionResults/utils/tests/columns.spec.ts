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
  getCompareColumns,
  getCompareColumnsCompare,
  mergeComparePanelColumns,
  splitComparePanelColumns,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

describe('Runs Compare :: getCompareColumns', () => {
  test('builds flat status and test case columns with execution, metrics, and extracted groups', () => {
    const columns = getCompareColumns([
      {
        id: 'result-1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: ExtractionResultStatus.SUCCESS,
        testCaseName: 'Test Case 1',
        metricValues: {
          'Overall Accuracy': {
            'Equality check': 1,
            Precision: 0.8,
            Recall: 0.7,
          },
          'Context Appropriateness': {
            'Equality Check': 1,
            Recall: 0.9,
          },
        },
        extractedColumns: {
          answer: 'yes',
          context: 'ctx',
          context_urls: 'http://example.com',
        },
      },
    ]);

    expect(columns).toHaveLength(6);

    const statusCol = columns[0] as ColDef;
    const testCaseCol = columns[1] as ColDef;
    expect(statusCol.colId).toBe('status');
    expect(statusCol.width).toBe(STATUS_COLUMN_WIDTH);
    expect(statusCol.filter).toBe(false);
    expect(testCaseCol.colId).toBe('testCaseName');
    expect(testCaseCol.filter).toBe('agTextColumnFilter');
    expect(testCaseCol.floatingFilter).toBe(true);

    const executionGroup = columns[2] as ColGroupDef;
    expect(executionGroup.headerName).toBe(EXECUTION_GROUP_HEADER);
    expect(executionGroup.children?.map((column) => column.headerName)).toEqual(['# Run number', 'HTTP', 'Duration']);
    expect((executionGroup.children as ColDef[])?.every((column) => column.filter === false)).toBe(true);
    expect(executionGroup.children?.[0]).toEqual(
      expect.objectContaining({
        width: RUN_INDEX_COLUMN_WIDTH,
        minWidth: RUN_INDEX_COLUMN_WIDTH,
        maxWidth: RUN_INDEX_COLUMN_WIDTH,
      }),
    );
    expect(executionGroup.children?.[1]).toEqual(
      expect.objectContaining({
        width: HTTP_COLUMN_WIDTH,
        minWidth: HTTP_COLUMN_WIDTH,
        maxWidth: HTTP_COLUMN_WIDTH,
      }),
    );
    expect(executionGroup.children?.[2]).toEqual(
      expect.objectContaining({
        width: DURATION_COLUMN_WIDTH,
        minWidth: DURATION_COLUMN_WIDTH,
        maxWidth: DURATION_COLUMN_WIDTH,
      }),
    );

    const overallAccuracyGroup = columns[3] as ColGroupDef;
    expect(overallAccuracyGroup.headerName).toBe('Overall Accuracy');
    expect(overallAccuracyGroup.children?.map((column) => column.headerName)).toEqual([
      'Equality check',
      'Precision',
      'Recall',
    ]);
    expect((overallAccuracyGroup.children as ColDef[])?.every((column) => column.filter === 'agNumberColumnFilter')).toBe(
      true,
    );
    expect((overallAccuracyGroup.children as ColDef[])?.every((column) => column.floatingFilter === true)).toBe(true);

    const contextGroup = columns[4] as ColGroupDef;
    expect(contextGroup.headerName).toBe('Context Appropriateness');
    expect(contextGroup.children?.map((column) => column.headerName)).toEqual(['Equality Check', 'Recall']);

    const extractedGroup = columns[5] as ColGroupDef;
    expect(extractedGroup.headerName).toBe(EXTRACTED_GROUP_HEADER);
    expect(extractedGroup.children?.map((column) => column.headerName)).toEqual(['answer', 'context', 'context_urls']);
    expect((extractedGroup.children as ColDef[])?.every((column) => column.filter === false)).toBe(true);
    expect((extractedGroup.children as ColDef[])?.every((column) => column.flex === 1)).toBe(true);
    expect((extractedGroup.children as ColDef[])?.every((column) => column.minWidth === EXTRACTED_COLUMN_MIN_WIDTH)).toBe(
      true,
    );
  });

  test('omits extracted group when there is no extracted schema', () => {
    const columns = getCompareColumns([
      {
        id: 'result-1',
        responseStatusCode: 200,
        runIndex: 0,
        testCaseName: 'Test Case 1',
        metricValues: {
          'Overall Accuracy': { Precision: 1 },
        },
      },
    ]);

    expect(columns).toHaveLength(4);
    expect(columns.at(-1)?.headerName).toBe('Overall Accuracy');
  });
});

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

  test('status columns highlight when execution status differs between runs', () => {
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
    const row = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.FAILED }),
    });
    const sameStatusRow = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: makeResult({ executionStatus: ExtractionResultStatus.SUCCESS }),
    });

    expect(primaryCol.cellClassRules?.['compare-status-diff-primary']?.({ data: row })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-status-diff-secondary']?.({ data: row })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-status-diff-primary']?.({ data: sameStatusRow })).toBe(false);
    expect(secondaryCol.cellClassRules?.['compare-status-diff-secondary']?.({ data: sameStatusRow })).toBe(false);
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
