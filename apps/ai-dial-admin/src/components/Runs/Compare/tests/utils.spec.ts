import { describe, expect, test } from 'vitest';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import CompareRunIndexHeader from '@/src/components/Runs/Compare/CompareRunIndexHeader';
import {
  DELTA_COLUMN_WIDTH,
  DEFAULT_COMPARE_DELTA_HEADER,
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  EXTRACTED_GROUP_HEADER,
  EXECUTION_GROUP_HEADER,
  formatCompareColumnHeader,
  formatCompareRunIndexHeader,
  HTTP_COLUMN_WIDTH,
  METRIC_COLUMN_WIDTH,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
} from '../constants';
import { getCompareColumns, getCompareColumnsCompare, getCompareRunsPath, getCompareRunsUrn, getSelectableCompareRuns } from '../utils';
import { CompareRunSlot } from '../constants';

describe('Runs Compare :: getCompareColumns', () => {
  test('builds flat status and test case columns with execution, metrics, and extracted groups', () => {
    const columns = getCompareColumns([
      {
        id: 'result-1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: 'SUCCESS',
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
    expect(columns[0].colId).toBe('status');
    expect(columns[0].width).toBe(STATUS_COLUMN_WIDTH);
    expect(columns[0].filter).toBe(false);
    expect(columns[1].colId).toBe('testCaseName');
    expect(columns[1].filter).toBe('agTextColumnFilter');
    expect(columns[1].floatingFilter).toBe(true);

    const executionGroup = columns[2];
    expect(executionGroup.headerName).toBe(EXECUTION_GROUP_HEADER);
    expect(executionGroup.children?.map((column) => column.headerName)).toEqual(['# Run number', 'HTTP', 'Duration']);
    expect(executionGroup.children?.every((column) => column.filter === false)).toBe(true);
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

    const overallAccuracyGroup = columns[3];
    expect(overallAccuracyGroup.headerName).toBe('Overall Accuracy');
    expect(overallAccuracyGroup.children?.map((column) => column.headerName)).toEqual([
      'Equality check',
      'Precision',
      'Recall',
    ]);
    expect(overallAccuracyGroup.children?.every((column) => column.filter === 'agNumberColumnFilter')).toBe(true);
    expect(overallAccuracyGroup.children?.every((column) => column.floatingFilter === true)).toBe(true);

    const contextGroup = columns[4];
    expect(contextGroup.headerName).toBe('Context Appropriateness');
    expect(contextGroup.children?.map((column) => column.headerName)).toEqual(['Equality Check', 'Recall']);

    const extractedGroup = columns[5];
    expect(extractedGroup.headerName).toBe(EXTRACTED_GROUP_HEADER);
    expect(extractedGroup.children?.map((column) => column.headerName)).toEqual(['answer', 'context', 'context_urls']);
    expect(extractedGroup.children?.every((column) => column.filter === false)).toBe(true);
    expect(extractedGroup.children?.every((column) => column.flex === 1)).toBe(true);
    expect(extractedGroup.children?.every((column) => column.minWidth === EXTRACTED_COLUMN_MIN_WIDTH)).toBe(true);
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
  test('has separate status columns for each run and a single test case name column', () => {
    const cols = getCompareColumnsCompare([
      makeRow({
        metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      }),
    ]);
    expect(cols[0].colId).toBe('status');
    expect(cols[0].headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_PRIMARY_INDEX));
    expect(cols[0].headerComponent).toBe(CompareRunIndexHeader);
    expect(cols[1].colId).toBe('cmp_status');
    expect(cols[1].headerName).toBe(formatCompareRunIndexHeader(RUN_COMPARE_SECONDARY_INDEX));
    expect(cols[1].headerComponent).toBe(CompareRunIndexHeader);
    expect(cols[2].colId).toBe('testCaseName');
    expect(cols.filter((col) => col.colId === 'testCaseName')).toHaveLength(1);
  });

  test('status columns highlight when execution status differs between runs', () => {
    type StatusCol = {
      cellClassRules?: Record<string, (params: { data?: CompareAnalyticsRow }) => boolean>;
    };
    const cols = getCompareColumnsCompare([
      makeRow({
        executionStatus: 'SUCCESS',
        _compared: makeResult({ executionStatus: 'FAILED' }),
      }),
    ]);
    const primaryCol = cols[0] as StatusCol;
    const secondaryCol = cols[1] as StatusCol;
    const row = makeRow({
      executionStatus: 'SUCCESS',
      _compared: makeResult({ executionStatus: 'FAILED' }),
    });
    const sameStatusRow = makeRow({
      executionStatus: 'SUCCESS',
      _compared: makeResult({ executionStatus: 'SUCCESS' }),
    });

    expect(primaryCol.cellClassRules?.['compare-status-diff-primary']?.({ data: row })).toBe(true);
    expect(secondaryCol.cellClassRules?.['compare-status-diff-secondary']?.({ data: row })).toBe(true);
    expect(primaryCol.cellClassRules?.['compare-status-diff-primary']?.({ data: sameStatusRow })).toBe(false);
    expect(secondaryCol.cellClassRules?.['compare-status-diff-secondary']?.({ data: sameStatusRow })).toBe(false);
  });

  test('EXECUTION group has flat columns with run index in header name', () => {
    const cols = getCompareColumnsCompare([makeRow()]);
    const exec = cols[3] as {
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
    const exec = cols[3] as { children: ExecChild[] };
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
    const metricGroup = cols[4] as {
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
    const metricGroup = cols[4] as { children: MetricCol[] };
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
    const actionCol = cols[cols.length - 1];
    expect(actionCol.colId).toBe('compare_action');
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
    const metricGroup = cols[4] as {
      children: { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
    };
    const secondaryCol = metricGroup.children[1];
    expect(secondaryCol.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });
});

describe('Runs Compare :: getSelectableCompareRuns', () => {
  const suiteRuns = [
    { id: 'run-1', testSuiteId: 'suite-1' },
    { id: 'run-2', testSuiteId: 'suite-1' },
    { id: 'run-3', testSuiteId: 'suite-1' },
  ] as const;

  test('excludes compared run when selecting primary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Primary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-1', 'run-3']);
  });

  test('excludes primary run when selecting secondary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Secondary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-2', 'run-3']);
  });
});

describe('Runs Compare :: getCompareRunsPath', () => {
  test('returns compare path with encoded run ids', () => {
    expect(getCompareRunsPath('run-1', 'run-2')).toBe('compare?runs=run-1,run-2');
  });
});

describe('Runs Compare :: getCompareRunsUrn', () => {
  test('returns full compare url', () => {
    expect(getCompareRunsUrn('run-1', 'run-2')).toBe('/runs/compare?runs=run-1,run-2');
  });
});
