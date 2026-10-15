import { ColDef, ColGroupDef } from 'ag-grid-community';
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
  getMetricGroupOrder,
  getRowDetailFieldSchema,
  createEmptyComparePrimaryRow,
  getDetailNestedEntries,
  getFormattedDuration,
  getCompareRowSelectionId,
  isMatchedCompareRow,
  mergeByTestCaseId,
} from '../utils';

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

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
        cellClass: 'p-0',
        headerClass: 'align-right',
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

  test('getRowDetailFieldSchema unions metric, test-case, and extracted keys across rows', () => {
    const schema = getRowDetailFieldSchema([
      makeResult({
        metricValues: { 'Exact Match': { exact_match: 1 } },
        testCaseData: { prompt: 'hello' },
        extractedColumns: { answer: 'Hi' },
      }),
      makeResult({
        testCaseData: { prompt: 'hello', language: 'fr' },
        extractedColumns: { verification: 'Yes' },
      }),
    ]);

    expect(schema.metricValues).toEqual({ 'Exact Match': { exact_match: 1 } });
    expect(schema.testCaseData).toEqual({ prompt: 'hello', language: 'fr' });
    expect(schema.extractedColumns).toEqual({ answer: 'Hi', verification: 'Yes' });
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

  test('getMetricGroupOrder skips unnamed groups and non-metric headers', () => {
    expect(
      getMetricGroupOrder([
        { headerName: '', children: [{ field: 'status' }] },
        { headerName: 'Execution', children: [{ field: 'http' }] },
        { headerName: 'Exact Match', children: [{ field: 'exact_match' }] },
        { headerName: 'Extracted', children: [{ field: 'answer' }] },
      ]),
    ).toEqual(['Exact Match']);
  });

  test('getMetricGroupOrder returns metric headers in grid column order', () => {
    const columns = getAnalyticsColumns([
      {
        metricValues: {
          'DeepEval: Answer Relevancy': { score: 0.8 },
          'Exact Match': { exact_match: 1 },
        },
      },
    ] as any);

    expect(getMetricGroupOrder(columns)).toEqual(['DeepEval: Answer Relevancy', 'Exact Match']);
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
