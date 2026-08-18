import { describe, expect, test } from 'vitest';

import {
  METRIC_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
} from '@/src/components/Runs/grid-column-layout';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { FilterOperatorDto } from '@/src/types/request';
import {
  RESULT_FILTERS,
  getTestCaseStatusClass,
  getAnalyticsColumns,
  createEmptyComparePrimaryRow,
  getDetailEntries,
  getDetailNestedEntries,
  getFormattedDuration,
  getMetricGroups,
  getPanelTitle,
  getCompareRowSelectionId,
  isMatchedCompareRow,
  mergeByTestCaseId,
  snapshotsToBindingsMap,
} from '../utils';

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
        testCaseData: {
          prompt: 'hello',
        },
        extractedColumns: {
          score: 0.98,
        },
      },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);

    expect(columns).toHaveLength(6);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'Execution' }));
    expect(columns[2]).toEqual(expect.objectContaining({ headerName: 'Accuracy' }));
    expect(columns[3]).toEqual(expect.objectContaining({ headerName: 'Details' }));
    expect(columns[4]).toEqual(expect.objectContaining({ headerName: 'INPUT BINDINGS' }));
    expect(columns[5]).toEqual(expect.objectContaining({ headerName: 'Extracted' }));

    const accuracyChildren = (columns[2] as any).children;
    expect(accuracyChildren).toHaveLength(1);
    expect(accuracyChildren[0]).toEqual(
      expect.objectContaining({
        field: 'Accuracy_accuracy',
        colId: 'Accuracy_accuracy',
        headerName: 'accuracy',
        cellRenderer: expect.any(Function),
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        width: METRIC_COLUMN_WIDTH,
      }),
    );
    expect(accuracyChildren[0].cellStyle).toBeUndefined();
    expect(accuracyChildren[0].valueGetter({ data: { metricValues: { Accuracy: { accuracy: 0.95 } } } })).toBe(0.95);
    expect(accuracyChildren[0].valueGetter({ data: { metricValues: { Accuracy: {} } } })).toBe('—');
    expect(accuracyChildren[0].valueGetter({ data: { metricValues: { Accuracy: { accuracy: null } } } })).toBe('—');

    const statusChildren = (columns[0] as any).children;
    expect(statusChildren[0]).toEqual(
      expect.objectContaining({ colId: 'status', width: STATUS_COLUMN_WIDTH, maxWidth: STATUS_COLUMN_WIDTH }),
    );
    expect(statusChildren[1]).toEqual(
      expect.objectContaining({
        colId: 'testCaseName',
        width: TEST_CASE_NAME_COLUMN_WIDTH,
        filter: 'agTextColumnFilter',
      }),
    );

    const executionChildren = (columns[1] as any).children;
    expect(executionChildren[0]).toEqual(
      expect.objectContaining({
        colId: 'runIndex',
        headerName: '# Run number',
        width: RUN_INDEX_COLUMN_WIDTH,
        maxWidth: RUN_INDEX_COLUMN_WIDTH,
        flex: 0,
      }),
    );

    const detailsChildren = (columns[3] as any).children;
    expect(detailsChildren).toHaveLength(1);
    expect(
      detailsChildren[0].valueGetter({ data: { metricValues: { Details: { details: { matched: true } } } } }),
    ).toBe('{"matched":true}');

    const inputBindingsChildren = (columns[4] as any).children;
    expect(inputBindingsChildren).toHaveLength(1);
    expect(inputBindingsChildren[0]).toEqual(expect.objectContaining({ field: 'prompt', hide: true }));
    expect(inputBindingsChildren[0].valueGetter({ data: { testCaseData: { prompt: null } } })).toBe('—');

    const extractedChildren = (columns[5] as any).children;
    expect(extractedChildren).toHaveLength(1);
    expect(extractedChildren[0]).toEqual(
      expect.objectContaining({ field: 'score', headerName: 'score', minWidth: 120, flex: 1 }),
    );
    expect(extractedChildren[0].valueGetter({ data: { extractedColumns: { score: null } } })).toBe('—');
  });

  test('Should merge extracted column keys from all rows, so a request chain shows every column', () => {
    const results = [
      { requestIndex: 0, extractedColumns: { answer: 'Hello!' } },
      { requestIndex: 1, extractedColumns: { answer2: 'Bonjour !' } },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);
    const extracted = columns.find((column: any) => column.headerName === 'Extracted') as any;

    expect(extracted.children.map((child: any) => child.field)).toEqual(['answer', 'answer2']);
  });

  test('Should read each merged extracted column from its own row', () => {
    const results = [
      { requestIndex: 0, extractedColumns: { answer: 'Hello!' } },
      { requestIndex: 1, extractedColumns: { answer2: 'Bonjour !' } },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);
    const extracted = columns.find((column: any) => column.headerName === 'Extracted') as any;
    const answer2Column = extracted.children.find((child: any) => child.field === 'answer2');

    expect(answer2Column.valueGetter({ data: results[1] })).toBe('Bonjour !');
    expect(answer2Column.valueGetter({ data: results[0] })).toBe('—');
  });

  test('Should merge input binding keys from all rows', () => {
    const results = [
      { testCaseData: { prompt: 'hello' } },
      { testCaseData: { prompt: 'hello', language: 'fr' } },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);
    const inputBindings = columns.find((column: any) => column.headerName === 'INPUT BINDINGS') as any;

    expect(inputBindings.children.map((child: any) => child.field)).toEqual(['prompt', 'language']);
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

    expect(groupA.children.map((c: any) => c.field)).toEqual(['GroupA_a', 'GroupA_b', 'GroupA_c']);
    expect(groupB.children.map((c: any) => c.field)).toEqual(['GroupB_x']);

    const bCol = groupA.children.find((c: any) => c.field === 'GroupA_b');
    expect(bCol.valueGetter({ data: { metricValues: { GroupA: { a: 1 } } } })).toBe('—');
    expect(bCol.valueGetter({ data: { metricValues: { GroupA: { b: 2 } } } })).toBe(2);
  });

  test('Should assign unique colIds when multiple metrics share the same leaf key', () => {
    const results = [
      {
        metricValues: {
          'correct-capital1': { score: 1 },
          'answer-conciseness': { score: 0.5 },
          'instruction-following': { score: 0.8 },
        },
      },
    ] as any[];

    const columns = getAnalyticsColumns(results as any);
    const metricGroups = columns.filter((c) =>
      ['correct-capital1', 'answer-conciseness', 'instruction-following'].includes(c.headerName ?? ''),
    );

    expect(metricGroups.map((g) => (g as { children?: { colId?: string }[] }).children?.[0]?.colId)).toEqual([
      'correct-capital1_score',
      'answer-conciseness_score',
      'instruction-following_score',
    ]);
  });

  test('Should handle empty results', () => {
    const columns = getAnalyticsColumns([]);

    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'Execution' }));
    expect(columns[2]).toEqual(expect.objectContaining({ headerName: 'INPUT BINDINGS' }));
    expect(columns[3]).toEqual(expect.objectContaining({ headerName: 'Extracted' }));
    expect((columns[3] as any).children).toHaveLength(0);
  });

  test('Should sort error metric cells last for ascending and first for descending', () => {
    const results = [{ metricValues: { Accuracy: { score: 0.8 } } }] as any[];
    const columns = getAnalyticsColumns(results as any);
    const accuracyColumn = columns.find((column: any) => column.headerName === 'Accuracy') as any;
    const scoreColumn = accuracyColumn.children.find((child: any) => child.field === 'Accuracy_score');

    const missingMetricRow = { data: { metricValues: { Accuracy: { score: null } } } };
    const validMetricRow = { data: { metricValues: { Accuracy: { score: 0.8 } } } };

    expect(scoreColumn.comparator('—', 0.8, missingMetricRow, validMetricRow, false)).toBe(1);
    expect(scoreColumn.comparator('—', 0.8, missingMetricRow, validMetricRow, true)).toBe(-1);
  });

  test('Should sort numeric metrics by value', () => {
    const results = [{ metricValues: { Accuracy: { score: 0.8 } } }] as any[];
    const columns = getAnalyticsColumns(results as any);
    const accuracyColumn = columns.find((column: any) => column.headerName === 'Accuracy') as any;
    const scoreColumn = accuracyColumn.children.find((child: any) => child.field === 'Accuracy_score');

    const lowerValueRow = { data: { metricValues: { Accuracy: { score: 0.5 } } } };
    const higherValueRow = { data: { metricValues: { Accuracy: { score: 0.9 } } } };

    expect(scoreColumn.comparator(0.5, 0.9, lowerValueRow, higherValueRow, false)).toBe(-1);
    expect(scoreColumn.comparator(0.9, 0.5, higherValueRow, lowerValueRow, false)).toBe(1);
    expect(scoreColumn.comparator(0.5, 0.5, lowerValueRow, lowerValueRow, false)).toBe(0);
  });

  test('Should render blank cell without crash when a metric group is skipped entirely for a row (condition false)', () => {
    const results = [{ metricValues: { GroupA: { a: 1 } } }, { metricValues: { GroupB: { x: 3 } } }] as any[];

    const columns = getAnalyticsColumns(results as any);
    const groupA = columns.find((c: any) => c.headerName === 'GroupA') as any;
    const aCol = groupA.children.find((c: any) => c.field === 'GroupA_a');

    expect(() => aCol.valueGetter({ data: { metricValues: { GroupB: { x: 3 } } } })).not.toThrow();
    expect(aCol.valueGetter({ data: { metricValues: { GroupB: { x: 3 } } } })).toBe('—');
    expect(aCol.valueGetter({ data: { metricValues: undefined } })).toBe('—');
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

  test('Should omit a metric skipped by a false condition (absent from metricValues) without crashing', () => {
    const metricValues = {
      retrieval: { f1: 0.5 },
    };
    const result = getMetricGroups(metricValues);
    expect(result).toHaveLength(1);
    expect(result.find((group) => group.title === 'conditional_metric')).toBeUndefined();
  });

  test('Should surface metric whose JSONata condition errored via metricInfos error', () => {
    // Metric present in result but empty: condition evaluation failed, so metric never ran
    const metricValues = {
      jsonata_eval: {},
    };
    const metricInfos = {
      jsonata_eval: { error: 'JSONata condition evaluation failed' },
    };
    const result = getMetricGroups(metricValues, metricInfos);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('jsonata_eval');
    expect(result[0].hasError).toBe(true);
    expect(result[0].errorMessage).toBe('JSONata condition evaluation failed');
    expect(result[0].metrics).toEqual([]);
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

const getExecutionColumn = (colId: string, results = [] as any[]) => {
  const cols = getAnalyticsColumns(results);
  const execGroup = cols.find((c: any) => c.headerName === 'Execution') as any;
  return execGroup.children.find((c: any) => c.colId === colId);
};

describe('Runs View :: executionColumns # (runIndex) valueGetter', () => {
  const getRunIndexCol = (results = [] as any[]) => getExecutionColumn('runIndex', results);

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

describe('Runs View :: executionColumns Request valueGetter', () => {
  const getRequestCol = (results = [] as any[]) => getExecutionColumn('requestIndex', results);

  test('Should build a Request column headed "Request"', () => {
    const col = getRequestCol();
    expect(col).toEqual(
      expect.objectContaining({ field: 'requestIndex', headerName: 'Request', colId: 'requestIndex' }),
    );
  });

  test('Should display 1-based request number for a 0-based requestIndex', () => {
    const col = getRequestCol();
    expect(col.valueGetter({ data: { requestIndex: 0 } })).toBe(1);
    expect(col.valueGetter({ data: { requestIndex: 1 } })).toBe(2);
    expect(col.valueGetter({ data: { requestIndex: 4 } })).toBe(5);
  });

  test('Should render requestIndex 0 as 1, not blank', () => {
    const col = getRequestCol();
    expect(col.valueGetter({ data: { requestIndex: 0 } })).toBe(1);
  });

  test('Should return null when requestIndex is absent (single-request run)', () => {
    const col = getRequestCol();
    expect(col.valueGetter({ data: {} })).toBeNull();
  });

  test('Should return null when data is null or undefined', () => {
    const col = getRequestCol();
    expect(col.valueGetter({ data: null })).toBeNull();
    expect(col.valueGetter({ data: undefined })).toBeNull();
  });
});

describe('Runs View :: executionColumns Total requests valueGetter', () => {
  const getTotalRequestsCol = (results = [] as any[]) => getExecutionColumn('totalRequests', results);

  test('Should build a Total requests column headed "Total requests"', () => {
    const col = getTotalRequestsCol();
    expect(col).toEqual(
      expect.objectContaining({ field: 'totalRequests', headerName: 'Total requests', colId: 'totalRequests' }),
    );
  });

  test('Should pass totalRequests through unchanged', () => {
    const col = getTotalRequestsCol();
    expect(col.valueGetter({ data: { totalRequests: 3 } })).toBe(3);
    expect(col.valueGetter({ data: { totalRequests: 1 } })).toBe(1);
  });

  test('Should return null when totalRequests is absent (single-request run)', () => {
    const col = getTotalRequestsCol();
    expect(col.valueGetter({ data: {} })).toBeNull();
  });

  test('Should return null when data is null or undefined', () => {
    const col = getTotalRequestsCol();
    expect(col.valueGetter({ data: null })).toBeNull();
    expect(col.valueGetter({ data: undefined })).toBeNull();
  });
});

describe('Runs View :: executionColumns Turn valueGetter', () => {
  const getTurnCol = (results = [] as any[]) => getExecutionColumn('turnIndex', results);

  test('Should build a Turn column headed "Turn"', () => {
    const col = getTurnCol();
    expect(col).toEqual(expect.objectContaining({ field: 'turnIndex', headerName: 'Turn', colId: 'turnIndex' }));
  });

  test('Should display 1-based turn number for a 0-based turnIndex', () => {
    const col = getTurnCol();
    expect(col.valueGetter({ data: { turnIndex: 0 } })).toBe(1);
    expect(col.valueGetter({ data: { turnIndex: 1 } })).toBe(2);
    expect(col.valueGetter({ data: { turnIndex: 4 } })).toBe(5);
  });

  test('Should render turnIndex 0 as 1, not blank', () => {
    const col = getTurnCol();
    expect(col.valueGetter({ data: { turnIndex: 0 } })).toBe(1);
  });

  test('Should return null when turnIndex is absent (single-turn run)', () => {
    const col = getTurnCol();
    expect(col.valueGetter({ data: {} })).toBeNull();
  });

  test('Should return null when data is null or undefined', () => {
    const col = getTurnCol();
    expect(col.valueGetter({ data: null })).toBeNull();
    expect(col.valueGetter({ data: undefined })).toBeNull();
  });
});

describe('Runs View :: executionColumns Total turns valueGetter', () => {
  const getTotalTurnsCol = (results = [] as any[]) => getExecutionColumn('totalTurns', results);

  test('Should build a Total turns column headed "Total turns"', () => {
    const col = getTotalTurnsCol();
    expect(col).toEqual(
      expect.objectContaining({ field: 'totalTurns', headerName: 'Total turns', colId: 'totalTurns' }),
    );
  });

  test('Should pass totalTurns through unchanged', () => {
    const col = getTotalTurnsCol();
    expect(col.valueGetter({ data: { totalTurns: 3 } })).toBe(3);
    expect(col.valueGetter({ data: { totalTurns: 1 } })).toBe(1);
  });

  test('Should return null when totalTurns is absent (single-turn run)', () => {
    const col = getTotalTurnsCol();
    expect(col.valueGetter({ data: {} })).toBeNull();
  });

  test('Should return null when data is null or undefined', () => {
    const col = getTotalTurnsCol();
    expect(col.valueGetter({ data: null })).toBeNull();
    expect(col.valueGetter({ data: undefined })).toBeNull();
  });
});

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

describe('Runs View :: createEmptyComparePrimaryRow', () => {
  test('carries request/turn identity fields from the source row', () => {
    const row = createEmptyComparePrimaryRow(
      makeResult({ testCaseId: 'tc1', runIndex: 1, requestIndex: 2, totalRequests: 3, turnIndex: 4, totalTurns: 5 }),
    );

    expect(row).toEqual(
      expect.objectContaining({
        testCaseId: 'tc1',
        runIndex: 1,
        requestIndex: 2,
        totalRequests: 3,
        turnIndex: 4,
        totalTurns: 5,
      }),
    );
  });

  test('leaves identity fields undefined when absent on the source row', () => {
    const row = createEmptyComparePrimaryRow(makeResult({ testCaseId: 'tc1' }));

    expect(row.requestIndex).toBeUndefined();
    expect(row.totalRequests).toBeUndefined();
    expect(row.turnIndex).toBeUndefined();
    expect(row.totalTurns).toBeUndefined();
  });
});

describe('Runs View :: getCompareRowSelectionId', () => {
  test('returns primary id when present', () => {
    expect(
      getCompareRowSelectionId({ ...makeResult({ id: 'primary-id' }), _compared: makeResult({ id: 'compared-id' }) }),
    ).toBe('primary-id');
  });

  test('falls back to compared id for compared-only rows', () => {
    const comparedOnly = mergeByTestCaseId(
      [],
      [makeResult({ id: 'compared-only-id', testCaseId: 'tc1', runIndex: 1 })],
    );
    expect(getCompareRowSelectionId(comparedOnly[0])).toBe('compared-only-id');
  });
});

describe('Runs View :: isMatchedCompareRow', () => {
  test('returns true when both sides have result ids', () => {
    expect(
      isMatchedCompareRow({
        ...makeResult({ id: 'primary-id', testCaseId: 'tc1' }),
        _compared: makeResult({ id: 'compared-id', testCaseId: 'tc1' }),
      }),
    ).toBe(true);
  });

  test('returns false for primary-only rows', () => {
    expect(isMatchedCompareRow({ ...makeResult({ id: 'primary-id', testCaseId: 'tc1' }), _compared: null })).toBe(
      false,
    );
  });

  test('returns false for compared-only rows', () => {
    const comparedOnly = mergeByTestCaseId(
      [],
      [makeResult({ id: 'compared-only-id', testCaseId: 'tc1', runIndex: 1 })],
    );
    expect(isMatchedCompareRow(comparedOnly[0])).toBe(false);
  });
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

    const unkeyedRow = result.find((row) => !row.testCaseId && !row.testCaseName);
    expect(unkeyedRow?._compared).toBeNull();
  });

  test('preserves all current row fields', () => {
    const current = [makeResult({ testCaseId: 'tc1', runIndex: 5, responseStatusCode: 201 })];
    const result = mergeByTestCaseId(current, []);

    expect(result[0].runIndex).toBe(5);
    expect(result[0].responseStatusCode).toBe(201);
    expect(result[0]._compared).toBeNull();
  });

  test('matches rows by testCaseId and runIndex', () => {
    const current = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, responseStatusCode: 200 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 1, responseStatusCode: 201 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 2, responseStatusCode: 202 }),
    ];
    const compared = [makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, responseStatusCode: 404 })];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(3);
    expect(result[0]._compared?.responseStatusCode).toBe(404);
    expect(result[1]._compared).toBeNull();
    expect(result[2]._compared).toBeNull();
  });

  test('includes compared-only rows when primary has fewer sub-runs', () => {
    const current = [makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, responseStatusCode: 200 })];
    const compared = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, responseStatusCode: 404 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 1, responseStatusCode: 405 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 2, responseStatusCode: 406 }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(3);
    expect(result[0].responseStatusCode).toBe(200);
    expect(result[0]._compared?.responseStatusCode).toBe(404);
    expect(result[1].metricValues).toBeUndefined();
    expect(result[1]._compared?.responseStatusCode).toBe(405);
    expect(result[2]._compared?.responseStatusCode).toBe(406);
  });

  test('falls back to testCaseName when testCaseIds differ (detached public copy)', () => {
    const current = [
      makeResult({
        testCaseId: 'public-de',
        testCaseName: 'DE',
        responseStatusCode: 200,
        metricValues: { Accuracy: { score: 0.9 } },
      }),
      makeResult({
        testCaseId: 'public-pl',
        testCaseName: 'PL',
        responseStatusCode: 200,
        metricValues: { Accuracy: { score: 0.8 } },
      }),
    ];
    const compared = [
      makeResult({
        testCaseId: 'private-pl',
        testCaseName: 'PL',
        responseStatusCode: 201,
        metricValues: { Accuracy: { score: 0.85 } },
      }),
      makeResult({
        testCaseId: 'private-de',
        testCaseName: 'DE',
        responseStatusCode: 202,
        metricValues: { Accuracy: { score: 0.95 } },
      }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(2);
    const de = result.find((row) => row.testCaseName === 'DE');
    const pl = result.find((row) => row.testCaseName === 'PL');
    expect(de?._compared?.testCaseId).toBe('private-de');
    expect(de?._compared?.responseStatusCode).toBe(202);
    expect(pl?._compared?.testCaseId).toBe('private-pl');
    expect(pl?._compared?.responseStatusCode).toBe(201);
  });

  test('prefers testCaseId match over testCaseName when both available', () => {
    const current = [makeResult({ testCaseId: 'tc1', testCaseName: 'Renamed', responseStatusCode: 200 })];
    const compared = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'Original', responseStatusCode: 404 }),
      makeResult({ testCaseId: 'tc2', testCaseName: 'Renamed', responseStatusCode: 500 }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(2);
    expect(result[0]._compared?.responseStatusCode).toBe(404);
    expect(result[0]._compared?.testCaseName).toBe('Original');
  });

  test('does not merge rows sharing testCaseId + runIndex but differing turnIndex (multi-turn chain)', () => {
    const current = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 0, responseStatusCode: 200 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 1, responseStatusCode: 201 }),
    ];
    const compared = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 0, responseStatusCode: 400 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 1, responseStatusCode: 401 }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(2);
    const turn0 = result.find((row) => row.turnIndex === 0);
    const turn1 = result.find((row) => row.turnIndex === 1);
    expect(turn0?._compared?.responseStatusCode).toBe(400);
    expect(turn1?._compared?.responseStatusCode).toBe(401);
  });

  test('does not merge rows sharing testCaseId + runIndex but differing requestIndex (request chain)', () => {
    const current = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 0, responseStatusCode: 200 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 1, responseStatusCode: 201 }),
    ];
    const compared = [
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 0, responseStatusCode: 400 }),
      makeResult({ testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 1, responseStatusCode: 401 }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(2);
    const request0 = result.find((row) => row.requestIndex === 0);
    const request1 = result.find((row) => row.requestIndex === 1);
    expect(request0?._compared?.responseStatusCode).toBe(400);
    expect(request1?._compared?.responseStatusCode).toBe(401);
  });

  test('falls back to testCaseName + runIndex + requestIndex + turnIndex when testCaseId differs', () => {
    const current = [
      makeResult({
        testCaseId: 'public',
        testCaseName: 'A',
        runIndex: 0,
        requestIndex: 1,
        turnIndex: 0,
        responseStatusCode: 200,
      }),
    ];
    const compared = [
      makeResult({
        testCaseId: 'private',
        testCaseName: 'A',
        runIndex: 0,
        requestIndex: 0,
        turnIndex: 0,
        responseStatusCode: 400,
      }),
      makeResult({
        testCaseId: 'private-2',
        testCaseName: 'A',
        runIndex: 0,
        requestIndex: 1,
        turnIndex: 0,
        responseStatusCode: 401,
      }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(2);
    const matched = result.find((row) => row.testCaseId === 'public');
    expect(matched?._compared?.responseStatusCode).toBe(401);
  });

  test('compared-only row keeps its request/turn identity fields on the primary row', () => {
    const compared = [
      makeResult({
        testCaseId: 'tc1',
        testCaseName: 'A',
        runIndex: 0,
        requestIndex: 1,
        totalRequests: 2,
        turnIndex: 2,
        totalTurns: 3,
        responseStatusCode: 404,
      }),
    ];
    const result = mergeByTestCaseId([], compared);

    expect(result).toHaveLength(1);
    expect(result[0].requestIndex).toBe(1);
    expect(result[0].totalRequests).toBe(2);
    expect(result[0].turnIndex).toBe(2);
    expect(result[0].totalTurns).toBe(3);
    expect(result[0]._compared?.responseStatusCode).toBe(404);
  });

  test('matches multi-turn rows by testCaseId, runIndex, and turnIndex', () => {
    const current = [
      makeResult({
        id: 'p-t0',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 0,
        totalTurns: 3,
        responseStatusCode: 200,
      }),
      makeResult({
        id: 'p-t1',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 1,
        totalTurns: 3,
        responseStatusCode: 201,
      }),
      makeResult({
        id: 'p-t2',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 2,
        totalTurns: 3,
        responseStatusCode: 202,
      }),
    ];
    const compared = [
      makeResult({
        id: 'c-t0',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 0,
        totalTurns: 3,
        responseStatusCode: 400,
      }),
      makeResult({
        id: 'c-t1',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 1,
        totalTurns: 3,
        responseStatusCode: 401,
      }),
      makeResult({
        id: 'c-t2',
        testCaseId: 'tc1',
        testCaseName: 'Round 3',
        runIndex: 0,
        turnIndex: 2,
        totalTurns: 3,
        responseStatusCode: 402,
      }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result).toHaveLength(3);
    expect(result.map((row) => row.turnIndex)).toEqual([0, 1, 2]);
    expect(result[0]._compared?.id).toBe('c-t0');
    expect(result[1]._compared?.id).toBe('c-t1');
    expect(result[2]._compared?.id).toBe('c-t2');
  });

  test('orders chained rows by requestIndex before turnIndex', () => {
    const current = [
      makeResult({ id: 'r1t0', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 1, turnIndex: 0 }),
      makeResult({ id: 'r0t1', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 0, turnIndex: 1 }),
      makeResult({ id: 'r1t1', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 1, turnIndex: 1 }),
      makeResult({ id: 'r0t0', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, requestIndex: 0, turnIndex: 0 }),
    ];
    const result = mergeByTestCaseId(current, []);

    expect(result.map((row) => row.id)).toEqual(['r0t0', 'r0t1', 'r1t0', 'r1t1']);
  });

  test('does not reuse one compared turn across multiple primary turns', () => {
    const current = [
      makeResult({ id: 'p0', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 0, totalTurns: 2 }),
      makeResult({ id: 'p1', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 1, totalTurns: 2 }),
    ];
    const compared = [
      makeResult({ id: 'c1', testCaseId: 'tc1', testCaseName: 'A', runIndex: 0, turnIndex: 1, totalTurns: 2 }),
    ];
    const result = mergeByTestCaseId(current, compared);

    expect(result.find((row) => row.id === 'p0')?._compared).toBeNull();
    expect(result.find((row) => row.id === 'p1')?._compared?.id).toBe('c1');
  });
});
