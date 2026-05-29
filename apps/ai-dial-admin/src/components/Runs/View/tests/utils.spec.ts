import { describe, expect, test } from 'vitest';

import { FilterOperatorDto } from '@/src/types/request';
import {
  RESULT_FILTERS,
  getTestCaseStatusClass,
  getAnalyticsColumns,
  getAnalyticsColumnsCompare,
  getDetailEntries,
  getDetailNestedEntries,
  getFormattedDuration,
  getMetricGroups,
  getPanelTitle,
  mergeByTestCaseId,
  snapshotsToBindingsMap,
} from '../utils';
import { CompareAnalyticsRow } from '../models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

describe('Runs View :: RESULT_FILTERS', () => {
  test('Should return run and suite filters for provided run', () => {
    const filters = RESULT_FILTERS({ id: 'run-1', testSuiteId: 'suite-1' } as any);

    expect(filters).toEqual([
      { column: 'runId', operator: FilterOperatorDto.EQUALS, value: 'run-1' },
      { column: 'suiteId', operator: FilterOperatorDto.EQUALS, value: 'suite-1' },
    ]);
  });

  test('Should return empty values when run ids are missing', () => {
    const filters = RESULT_FILTERS({} as any);

    expect(filters).toEqual([
      { column: 'runId', operator: FilterOperatorDto.EQUALS, value: '' },
      { column: 'suiteId', operator: FilterOperatorDto.EQUALS, value: '' },
    ]);
  });
});

describe('Runs View :: getCellClass', () => {
  test('Should return empty class for undefined status code', () => {
    expect(getTestCaseStatusClass(void 0)).toBe('');
  });

  test('Should return success for 2xx status code', () => {
    expect(getTestCaseStatusClass(201)).toBe('text-success');
  });

  test('Should return warning for 4xx status code', () => {
    expect(getTestCaseStatusClass(404)).toBe('text-warning');
  });

  test('Should return error for non-2xx/4xx status code', () => {
    expect(getTestCaseStatusClass(500)).toBe('text-error');
  });
});

describe('Runs View :: getAnalyticsColumns', () => {
  test('Should build static, nested metric group and extracted columns', () => {
    const results = [
      {
        metricValues: {
          Accuracy: { accuracy: 0.95 },
          Details: { details: { matched: true } },
        },
        extractedColumns: {
          score: 0.98,
        },
      },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);

    expect(columns).toHaveLength(6);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'EXECUTION' }));
    expect(columns[2]).toEqual(expect.objectContaining({ headerName: 'Accuracy' }));
    expect(columns[3]).toEqual(expect.objectContaining({ headerName: 'Details' }));
    expect(columns[4]).toEqual(expect.objectContaining({ headerName: 'INPUT BINDINGS' }));
    expect(columns[5]).toEqual(expect.objectContaining({ headerName: 'EXTRACTED' }));

    const accuracyChildren = (columns[2] as any).children;
    expect(accuracyChildren).toHaveLength(1);
    expect(accuracyChildren[0]).toEqual(expect.objectContaining({ field: 'accuracy', headerName: 'accuracy' }));
    expect(accuracyChildren[0].valueGetter({ data: { metricValues: { Accuracy: { accuracy: 0.95 } } } })).toBe(0.95);
    expect(accuracyChildren[0].valueGetter({ data: { metricValues: { Accuracy: {} } } })).toBe('—');

    const detailsChildren = (columns[3] as any).children;
    expect(detailsChildren).toHaveLength(1);
    expect(
      detailsChildren[0].valueGetter({ data: { metricValues: { Details: { details: { matched: true } } } } }),
    ).toBe('{"matched":true}');

    const extractedChildren = (columns[5] as any).children;
    expect(extractedChildren).toHaveLength(1);
    expect(extractedChildren[0]).toEqual(expect.objectContaining({ field: 'score', headerName: 'score' }));
  });

  test('Should merge metric keys from all rows into column groups', () => {
    const results = [
      { metricValues: { GroupA: { a: 1 } } },
      { metricValues: { GroupA: { b: 2 }, GroupB: { x: 3 } } },
      { metricValues: { GroupA: { a: 10, c: 3 } } },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);
    const groupA = columns.find((c: any) => c.headerName === 'GroupA') as any;
    const groupB = columns.find((c: any) => c.headerName === 'GroupB') as any;

    expect(groupA.children.map((c: any) => c.field)).toEqual(['a', 'b', 'c']);
    expect(groupB.children.map((c: any) => c.field)).toEqual(['x']);

    const bCol = groupA.children.find((c: any) => c.field === 'b');
    expect(bCol.valueGetter({ data: { metricValues: { GroupA: { a: 1 } } } })).toBe('—');
    expect(bCol.valueGetter({ data: { metricValues: { GroupA: { b: 2 } } } })).toBe(2);
  });

  test('Should handle empty results', () => {
    const columns = getAnalyticsColumns([]);

    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'EXECUTION' }));
    expect(columns[2]).toEqual(expect.objectContaining({ headerName: 'INPUT BINDINGS' }));
    expect((columns[3] as any).children).toHaveLength(0);
  });

  test('Should sort error metric cells last for ascending and first for descending', () => {
    const results = [{ metricValues: { Accuracy: { score: 0.8 } } }] as any[];
    const columns = getAnalyticsColumns(results as any);
    const accuracyColumn = columns.find((column: any) => column.headerName === 'Accuracy') as any;
    const scoreColumn = accuracyColumn.children.find((child: any) => child.field === 'score');

    const missingMetricRow = { data: { metricValues: { Accuracy: { score: null } } } };
    const validMetricRow = { data: { metricValues: { Accuracy: { score: 0.8 } } } };

    expect(scoreColumn.comparator('—', 0.8, missingMetricRow, validMetricRow, false)).toBe(1);
    expect(scoreColumn.comparator('—', 0.8, missingMetricRow, validMetricRow, true)).toBe(-1);
  });

  test('Should sort numeric metrics by value', () => {
    const results = [{ metricValues: { Accuracy: { score: 0.8 } } }] as any[];
    const columns = getAnalyticsColumns(results as any);
    const accuracyColumn = columns.find((column: any) => column.headerName === 'Accuracy') as any;
    const scoreColumn = accuracyColumn.children.find((child: any) => child.field === 'score');

    const lowerValueRow = { data: { metricValues: { Accuracy: { score: 0.5 } } } };
    const higherValueRow = { data: { metricValues: { Accuracy: { score: 0.9 } } } };

    expect(scoreColumn.comparator(0.5, 0.9, lowerValueRow, higherValueRow, false)).toBe(-1);
    expect(scoreColumn.comparator(0.9, 0.5, higherValueRow, lowerValueRow, false)).toBe(1);
    expect(scoreColumn.comparator(0.5, 0.5, lowerValueRow, lowerValueRow, false)).toBe(0);
  });
});

describe('Runs View :: getFormattedDuration', () => {
  test('Should return dash for undefined duration', () => {
    expect(getFormattedDuration(undefined)).toBe('—');
  });

  test('Should return milliseconds for duration under 1000', () => {
    expect(getFormattedDuration(250)).toBe('250ms');
  });

  test('Should return seconds for duration 1000 or above', () => {
    expect(getFormattedDuration(1000)).toBe('1.0s');
    expect(getFormattedDuration(1200)).toBe('1.2s');
    expect(getFormattedDuration(2500)).toBe('2.5s');
  });

  test('Should handle zero duration', () => {
    expect(getFormattedDuration(0)).toBe('0ms');
  });
});

describe('Runs View :: getPanelTitle', () => {
  test('Should format title with test case name and run index', () => {
    expect(getPanelTitle({ testCaseName: 'Login Test', runIndex: 3 } as any)).toBe('Login Test - Run #4');
  });

  test('Should default run index to 0 when missing', () => {
    expect(getPanelTitle({ testCaseName: 'Test' } as any)).toBe('Test - Run #1');
  });

  test('Should handle null result', () => {
    expect(getPanelTitle(null)).toBe('undefined - Run #1');
  });
});

describe('Runs View :: getDetailEntries', () => {
  test('Should convert record to key-value tuple array', () => {
    expect(getDetailEntries({ prompt: 'hello', score: 0.95 })).toEqual([
      ['prompt', 'hello'],
      ['score', '0.95'],
    ]);
  });

  test('Should keep object values as objects', () => {
    expect(getDetailEntries({ data: { nested: true } })).toEqual([['data', { nested: true }]]);
  });

  test('Should handle empty record', () => {
    expect(getDetailEntries({})).toEqual([]);
  });

  test('Should return string-array values as string[]', () => {
    expect(getDetailEntries({ tags: ['alpha', 'beta', 'gamma'] })).toEqual([['tags', ['alpha', 'beta', 'gamma']]]);
  });

  test('Should keep mixed arrays as arrays', () => {
    expect(getDetailEntries({ mixed: ['a', 1, true] })).toEqual([['mixed', ['a', 1, true]]]);
  });

  test('Should stringify number values', () => {
    expect(getDetailEntries({ count: 42 })).toEqual([['count', '42']]);
  });
});

describe('Runs View :: getDetailNestedEntries', () => {
  test('Should create sections from nested metric values', () => {
    const data = {
      Accuracy: { accuracy: 0.95, threshold: 0.9 },
      Details: { matched: true },
    };

    const result = getDetailNestedEntries(data);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: 'Accuracy',
      entries: [
        ['accuracy', '0.95'],
        ['threshold', '0.9'],
      ],
    });
    expect(result[1]).toEqual({
      title: 'Details',
      entries: [['matched', 'true']],
    });
  });

  test('Should fall back to additionalData error when metricValues has only null error', () => {
    const data = {
      'deepeval.g_eval': { error: null },
    };
    const additionalData = {
      'deepeval.g_eval': { error: '422 Unprocessable Content' },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'deepeval.g_eval',
        entries: [['error', '422 Unprocessable Content']],
      },
    ]);
  });

  test('Should keep original values when error is not null', () => {
    const data = {
      metric: { error: 'some local error' },
    };
    const additionalData = {
      metric: { error: 'info error' },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'metric',
        entries: [['error', 'some local error']],
      },
    ]);
  });

  test('Should keep null error as entry when no additionalData provided', () => {
    const data = {
      metric: { error: null },
    };

    const result = getDetailNestedEntries(data);

    expect(result).toEqual([
      {
        title: 'metric',
        entries: [['error', 'null']],
      },
    ]);
  });

  test('Should append nested additionalData sub-entries after the main entry', () => {
    const data = {
      'deepeval.answer_relevancy': { score: 1 },
    };
    const additionalData = {
      'deepeval.answer_relevancy': {
        score: {
          reason: 'The score is 1.00 because the output is relevant.',
          verbose_logs: 'Statements:\n["hello"]',
        },
      },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'deepeval.answer_relevancy',
        entries: [
          ['score', '1'],
          ['reason', 'The score is 1.00 because the output is relevant.'],
          ['verbose_logs', 'Statements:\n["hello"]'],
        ],
      },
    ]);
  });

  test('Should not expand when additionalData value is a primitive', () => {
    const data = {
      metric: { score: 0.95 },
    };
    const additionalData = {
      metric: { score: 'some string' },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'metric',
        entries: [['score', '0.95']],
      },
    ]);
  });

  test('Should not expand when additionalData value is an array', () => {
    const data = {
      metric: { score: 0.95 },
    };
    const additionalData = {
      metric: { score: [1, 2, 3] as any },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'metric',
        entries: [['score', '0.95']],
      },
    ]);
  });

  test('Should handle mix of expandable and non-expandable additional data', () => {
    const data = {
      group: { score: 1, accuracy: 0.9 },
    };
    const additionalData = {
      group: {
        score: { reason: 'Good', verbose_logs: 'logs' },
        accuracy: 42,
      },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'group',
        entries: [
          ['score', '1'],
          ['reason', 'Good'],
          ['verbose_logs', 'logs'],
          ['accuracy', '0.9'],
        ],
      },
    ]);
  });

  test('Should handle additionalData with no matching group key', () => {
    const data = {
      metric: { score: 1 },
    };
    const additionalData = {
      other: { score: { reason: 'test' } },
    };

    const result = getDetailNestedEntries(data, additionalData);

    expect(result).toEqual([
      {
        title: 'metric',
        entries: [['score', '1']],
      },
    ]);
  });

  test('Should handle empty data', () => {
    expect(getDetailNestedEntries({})).toEqual([]);
  });
});

describe('Runs View :: getMetricGroups', () => {
  test('Should return empty array for undefined metricValues', () => {
    expect(getMetricGroups(undefined)).toEqual([]);
  });

  test('Should return empty array for empty metricValues', () => {
    expect(getMetricGroups({})).toEqual([]);
  });

  test('Should return normal metric group with numeric values', () => {
    const metricValues = {
      'aidial_rag_eval.retrieval': { f1: 0.118, mrr: 1, recall: 1, precision: 0.063 },
    };
    const result = getMetricGroups(metricValues);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('aidial_rag_eval.retrieval');
    expect(result[0].hasError).toBe(false);
    expect(result[0].metrics).toEqual([
      { key: 'f1', value: 0.118, isError: false },
      { key: 'mrr', value: 1, isError: false },
      { key: 'recall', value: 1, isError: false },
      { key: 'precision', value: 0.063, isError: false },
    ]);
  });

  test('Should detect failed metric group with error fallback from metricInfos', () => {
    const metricValues = {
      custom_eval: { error: null },
    };
    const metricInfos = {
      custom_eval: { error: 'Connection refused' },
    };
    const result = getMetricGroups(metricValues, metricInfos);
    expect(result).toHaveLength(1);
    expect(result[0].hasError).toBe(true);
    expect(result[0].errorMessage).toBe('Connection refused');
    expect(result[0].metrics).toEqual([]);
  });

  test('Should include metricInfos for groups with additional data', () => {
    const metricValues = {
      retrieval: { f1: 0.5 },
    };
    const metricInfos = {
      retrieval: { f1: { reason: 'Low overlap', verbose_logs: 'details...' } },
    };
    const result = getMetricGroups(metricValues, metricInfos);
    expect(result[0].info).toEqual({
      f1: { reason: 'Low overlap', verbose_logs: 'details...' },
    });
  });

  test('Should handle multiple groups with mixed success and failure', () => {
    const metricValues = {
      retrieval: { f1: 0.5, recall: 1 },
      custom: { error: null },
    };
    const metricInfos = {
      custom: { error: 'Timeout' },
    };
    const result = getMetricGroups(metricValues, metricInfos);
    expect(result).toHaveLength(2);
    expect(result[0].hasError).toBe(false);
    expect(result[0].metrics).toHaveLength(2);
    expect(result[1].hasError).toBe(true);
    expect(result[1].errorMessage).toBe('Timeout');
  });

  test('Should handle null metric values as errors', () => {
    const metricValues = {
      group: { score: null, confidence: null },
    };
    const result = getMetricGroups(metricValues);
    expect(result[0].metrics[0]).toEqual({ key: 'score', value: null, isError: true });
    expect(result[0].metrics[1]).toEqual({ key: 'confidence', value: null, isError: true });
  });
});

describe('Runs View :: snapshotsToBindingsMap', () => {
  test('Should map named snapshots to bindings record', () => {
    const snapshots = [
      { tsmdName: 'Metric A', configBindings: [{ property: 'p1', source: { $type: 'Constant' } }], inputBindings: [] },
      { tsmdName: 'Metric B', configBindings: [], inputBindings: [{ property: 'p2', source: { $type: 'TestCase' } }] },
    ];
    const result = snapshotsToBindingsMap(snapshots as any);
    expect(Object.keys(result)).toEqual(['Metric A', 'Metric B']);
    expect(result['Metric A'].configBindings).toHaveLength(1);
    expect(result['Metric B'].inputBindings).toHaveLength(1);
  });

  test('Should skip snapshots without tsmdName', () => {
    const snapshots = [
      { configBindings: [], inputBindings: [] },
      { tsmdName: 'Metric A', configBindings: [], inputBindings: [] },
    ];
    const result = snapshotsToBindingsMap(snapshots as any);
    expect(Object.keys(result)).toEqual(['Metric A']);
  });

  test('Should return empty record for empty array', () => {
    expect(snapshotsToBindingsMap([])).toEqual({});
  });

  test('Should default undefined bindings to empty arrays', () => {
    const snapshots = [{ tsmdName: 'Metric A' }];
    const result = snapshotsToBindingsMap(snapshots as any);
    expect(result['Metric A'].configBindings).toEqual([]);
    expect(result['Metric A'].inputBindings).toEqual([]);
  });
});

describe('Runs View :: executionColumns # (runIndex) valueGetter', () => {
  const getRunIndexCol = (results = [] as any[]) => {
    const cols = getAnalyticsColumns(results);
    const execGroup = cols.find((c: any) => c.headerName === 'EXECUTION') as any;
    return execGroup.children.find((c: any) => c.colId === 'runIndex');
  };

  test('Should display 1-based index (backend runIndex is 0-based)', () => {
    const col = getRunIndexCol();
    expect(col.valueGetter({ data: { runIndex: 0 } })).toBe(1);
    expect(col.valueGetter({ data: { runIndex: 1 } })).toBe(2);
    expect(col.valueGetter({ data: { runIndex: 2 } })).toBe(3);
  });

  test('Should return null when data is null', () => {
    const col = getRunIndexCol();
    expect(col.valueGetter({ data: null })).toBeNull();
  });

  test('Should return null when data is undefined', () => {
    const col = getRunIndexCol();
    expect(col.valueGetter({ data: undefined })).toBeNull();
  });

  test('Should return null when runIndex is undefined', () => {
    const col = getRunIndexCol();
    expect(col.valueGetter({ data: {} })).toBeNull();
  });
});

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

describe('Runs View :: mergeByTestCaseId', () => {
  test('matches rows by testCaseId', () => {
    const current = [makeResult({ testCaseId: 'tc1', testCaseName: 'A' })];
    const compared = [makeResult({ testCaseId: 'tc1', testCaseName: 'B' })];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(1);
    expect(result[0].testCaseId).toBe('tc1');
    expect(result[0]._compared?.testCaseName).toBe('B');
  });

  test('falls back to testCaseName when testCaseId is absent', () => {
    const current = [makeResult({ testCaseName: 'Alpha' })];
    const compared = [makeResult({ testCaseName: 'Alpha', responseStatusCode: 404 })];
    const result = mergeByTestCaseId(current, compared);

    expect(result[0]._compared?.responseStatusCode).toBe(404);
  });

  test('sets _compared to null for unmatched current rows', () => {
    const current = [makeResult({ testCaseId: 'tc1' }), makeResult({ testCaseId: 'tc2' })];
    const compared = [makeResult({ testCaseId: 'tc1' })];
    const result = mergeByTestCaseId(current, compared);

    expect(result[0]._compared).not.toBeNull();
    expect(result[1]._compared).toBeNull();
  });

  test('sets _compared to null when current row has no key', () => {
    const current = [makeResult()];
    const compared = [makeResult({ testCaseId: 'tc1' })];
    const result = mergeByTestCaseId(current, compared);

    expect(result[0]._compared).toBeNull();
  });

  test('preserves all current row fields', () => {
    const current = [makeResult({ testCaseId: 'tc1', runIndex: 5, responseStatusCode: 201 })];
    const result = mergeByTestCaseId(current, []);

    expect(result[0].runIndex).toBe(5);
    expect(result[0].responseStatusCode).toBe(201);
    expect(result[0]._compared).toBeNull();
  });
});

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  responseStatusCode: 200,
  runIndex: 0,
  _compared: null,
  ...overrides,
});

describe('Runs View :: getAnalyticsColumnsCompare', () => {
  test('[blank] group is first and unchanged', () => {
    const cols = getAnalyticsColumnsCompare([makeRow()]);
    const blank = cols[0] as { headerName: string; children: unknown[] };

    expect(blank.headerName).toBe(' ');
    expect(blank.children).toHaveLength(2);
  });

  test('EXECUTION group has field sub-groups each with Current and Compared leaves, including runIndex (#)', () => {
    const cols = getAnalyticsColumnsCompare([makeRow()]);
    const exec = cols[1] as {
      headerName: string;
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(exec.headerName).toBe('EXECUTION');
    expect(exec.children).toHaveLength(3);
    expect(exec.children[0].headerName).toBe('#');
    expect(exec.children[1].headerName).toBe('HTTP');
    expect(exec.children[2].headerName).toBe('Duration');

    for (const fieldGroup of exec.children) {
      expect(fieldGroup.children).toHaveLength(2);
      expect(fieldGroup.children[0].headerName).toBe('Current');
      expect(fieldGroup.children[1].headerName).toBe('Compared');
    }
  });

  test('# field group Current leaf shows runIndex from row, Compared leaf shows _compared.runIndex', () => {
    type ExecChild = {
      headerName: string;
      children: { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
    };
    const cols = getAnalyticsColumnsCompare([makeRow()]);
    const exec = cols[1] as { children: ExecChild[] };
    const hashGroup = exec.children[0];

    expect(hashGroup.headerName).toBe('#');
    const currentLeaf = hashGroup.children[0];
    const comparedLeaf = hashGroup.children[1];

    expect(currentLeaf.valueGetter({ data: makeRow({ runIndex: 2 }) })).toBe(3);
    expect(currentLeaf.valueGetter({ data: undefined })).toBeNull();

    expect(comparedLeaf.valueGetter({ data: makeRow({ _compared: makeResult({ runIndex: 3 }) }) })).toBe(4);
    expect(comparedLeaf.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });

  test('metric groups have metric key sub-groups each with Current and Compared leaves', () => {
    const rows = [makeRow({ metricValues: { myMetric: { score: 0.9 } } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const metricGroup = cols.find((c) => (c as { headerName: string }).headerName === 'myMetric') as {
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(metricGroup).toBeDefined();
    expect(metricGroup.children).toHaveLength(1);
    expect(metricGroup.children[0].headerName).toBe('score');
    expect(metricGroup.children[0].children[0].headerName).toBe('Current');
    expect(metricGroup.children[0].children[1].headerName).toBe('Compared');
  });

  test('Compared metric colIds are prefixed with cmp_', () => {
    const rows = [makeRow({ metricValues: { grp: { accuracy: 1 } } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const grp = cols.find((c) => (c as { headerName: string }).headerName === 'grp') as {
      children: { headerName: string; children: { colId?: string }[] }[];
    };

    // Each metric key sub-group's second child is the Compared leaf
    const comparedLeaves = grp.children.map((keyGroup) => keyGroup.children[1]);
    expect(comparedLeaves.every((c) => c.colId?.startsWith('cmp_'))).toBe(true);
  });

  test('EXTRACTED group has field key sub-groups each with Current and Compared leaves', () => {
    const rows = [makeRow({ extractedColumns: { col1: 'val1' } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const extracted = cols.find((c) => (c as { headerName: string }).headerName === 'EXTRACTED') as {
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(extracted).toBeDefined();
    expect(extracted.children).toHaveLength(1);
    expect(extracted.children[0].headerName).toBe('col1');
    expect(extracted.children[0].children[0].headerName).toBe('Current');
    expect(extracted.children[0].children[1].headerName).toBe('Compared');
  });

  test('Compared extracted colIds are prefixed with cmp_extracted_', () => {
    const rows = [makeRow({ extractedColumns: { myCol: 'v' } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const extracted = cols.find((c) => (c as { headerName: string }).headerName === 'EXTRACTED') as {
      children: { headerName: string; children: { colId?: string }[] }[];
    };

    // Each field key sub-group's second child is the Compared leaf
    const comparedLeaves = extracted.children.map((keyGroup) => keyGroup.children[1]);
    expect(comparedLeaves.every((c) => c.colId?.startsWith('cmp_extracted_'))).toBe(true);
  });

  test('includes INPUT BINDINGS columns that exist only in compared run', () => {
    const rows = [
      makeRow({
        testCaseData: undefined,
        _compared: makeResult({ testCaseData: { comparedKey: 'val' } }),
      }),
    ];
    const cols = getAnalyticsColumnsCompare(rows);

    const bindings = cols.find((c) => (c as { headerName: string }).headerName === 'INPUT BINDINGS') as {
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(bindings).toBeDefined();
    expect(bindings.children).toHaveLength(1);
    expect(bindings.children[0].headerName).toBe('comparedKey');
  });

  test('includes INPUT BINDINGS columns from all rows, not only first row', () => {
    const rows = [makeRow({ testCaseData: { key1: 'a' } }), makeRow({ testCaseData: { key2: 'b' } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const bindings = cols.find((c) => (c as { headerName: string }).headerName === 'INPUT BINDINGS') as {
      children: { headerName: string }[];
    };

    const keys = bindings.children.map((c) => c.headerName);
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  test('includes EXTRACTED columns that exist only in compared run', () => {
    const rows = [
      makeRow({
        extractedColumns: undefined,
        _compared: makeResult({ extractedColumns: { comparedCol: 'v' } }),
      }),
    ];
    const cols = getAnalyticsColumnsCompare(rows);

    const extracted = cols.find((c) => (c as { headerName: string }).headerName === 'EXTRACTED') as {
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(extracted).toBeDefined();
    expect(extracted.children).toHaveLength(1);
    expect(extracted.children[0].headerName).toBe('comparedCol');
  });

  test('includes EXTRACTED columns from all rows, not only first row', () => {
    const rows = [makeRow({ extractedColumns: { col1: 'a' } }), makeRow({ extractedColumns: { col2: 'b' } })];
    const cols = getAnalyticsColumnsCompare(rows);

    const extracted = cols.find((c) => (c as { headerName: string }).headerName === 'EXTRACTED') as {
      children: { headerName: string }[];
    };

    const keys = extracted.children.map((c) => c.headerName);
    expect(keys).toContain('col1');
    expect(keys).toContain('col2');
  });

  test('includes metric columns that exist only in compared run', () => {
    const rows = [
      makeRow({
        metricValues: undefined,
        _compared: makeResult({ metricValues: { comparedOnly: { precision: 0.7 } } }),
      }),
    ];
    const cols = getAnalyticsColumnsCompare(rows);

    const comparedOnlyGroup = cols.find((c) => (c as { headerName: string }).headerName === 'comparedOnly') as {
      children: { headerName: string; children: { headerName: string }[] }[];
    };

    expect(comparedOnlyGroup).toBeDefined();
    expect(comparedOnlyGroup.children).toHaveLength(1);
    expect(comparedOnlyGroup.children[0].headerName).toBe('precision');
  });

  test('Compared valueGetters return dash when _compared is null', () => {
    const rows = [makeRow({ metricValues: { grp: { score: 0.8 } }, _compared: null })];
    const cols = getAnalyticsColumnsCompare(rows);

    const grp = cols.find((c) => (c as { headerName: string }).headerName === 'grp') as {
      children: {
        headerName: string;
        children: { headerName: string; valueGetter: (p: { data?: CompareAnalyticsRow }) => unknown }[];
      }[];
    };

    // grp → score sub-group → [Current leaf, Compared leaf]
    const scoreKeyGroup = grp.children[0];
    const comparedLeaf = scoreKeyGroup.children[1];
    expect(comparedLeaf.valueGetter({ data: makeRow({ _compared: null }) })).toBe('—');
  });
});
