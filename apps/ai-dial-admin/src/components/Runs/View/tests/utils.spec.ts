import { describe, expect, test } from 'vitest';

import { FilterOperatorDto } from '@/src/types/request';
import {
  RESULT_FILTERS,
  getTestCaseStatusClass,
  getResultColumns,
  getAnalyticsColumns,
  getFormattedDuration,
  getPanelTitle,
  getDetailEntries,
  getDetailNestedEntries,
  getMetricGroups,
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

describe('Runs View :: getResultColumns', () => {
  test('Should build static, input and extracted columns and format values', () => {
    const results = [
      {
        testCaseData: {
          prompt: 'hello',
          payload: { a: 1 },
        },
        extractedColumns: {
          score: 0.98,
          details: { matched: true },
        },
      },
    ] as any[];

    const columns = getResultColumns(results as any);

    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(
      expect.objectContaining({
        headerName: ' ',
      }),
    );
    expect(columns[1]).toEqual(
      expect.objectContaining({
        headerName: 'EXECUTION',
      }),
    );
    expect(columns[2]).toEqual(
      expect.objectContaining({
        headerName: 'INPUT BINDINGS',
      }),
    );
    expect(columns[3]).toEqual(
      expect.objectContaining({
        headerName: 'EXTRACTED',
      }),
    );

    const inputChildren = (columns[2] as any).children;
    expect(inputChildren).toHaveLength(2);
    expect(inputChildren[0]).toEqual(
      expect.objectContaining({
        field: 'prompt',
        headerName: 'prompt',
      }),
    );

    expect(inputChildren[1].valueGetter({ data: { testCaseData: { payload: { a: 1 } } } })).toBe('{"a":1}');
    expect(inputChildren[0].valueGetter({ data: { testCaseData: { prompt: 'value' } } })).toBe('value');
    expect(inputChildren[0].valueGetter({ data: { testCaseData: {} } })).toBe('—');

    const extractedChildren = (columns[3] as any).children;
    expect(extractedChildren).toHaveLength(2);
    expect(extractedChildren[0]).toEqual(
      expect.objectContaining({
        field: 'score',
        headerName: 'score',
      }),
    );
    expect(extractedChildren[1].valueGetter({ data: { extractedColumns: { details: { matched: true } } } })).toBe(
      '{"matched":true}',
    );
    expect(extractedChildren[0].valueGetter({ data: { extractedColumns: { score: 1 } } })).toBe(1);
    expect(extractedChildren[0].valueGetter({ data: { extractedColumns: {} } })).toBe('—');
  });

  test('Should format duration and row index in execution columns', () => {
    const columns = getResultColumns([{ testCaseData: {} }] as any);
    const executionChildren = (columns[1] as any).children;

    const runIndexColumn = executionChildren.find((col: any) => col.colId === 'runIndex');
    const durationColumn = executionChildren.find((col: any) => col.colId === 'duration');

    expect(runIndexColumn.valueGetter({ node: { rowIndex: 2 } })).toBe(3);
    expect(runIndexColumn.valueGetter({ node: {} })).toBeNull();

    expect(durationColumn.valueGetter({ data: { executionInfo: { durationMs: 250 } } })).toBe('250ms');
    expect(durationColumn.valueGetter({ data: { executionInfo: { durationMs: 1200 } } })).toBe('1.2s');
    expect(durationColumn.valueGetter({ data: { executionInfo: {} } })).toBe('—');
    expect(durationColumn.valueGetter({ data: { execDurationMs: 500 } })).toBe('500ms');
    expect(durationColumn.valueGetter({ data: { execDurationMs: 2500 } })).toBe('2.5s');
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

    expect(columns).toHaveLength(5);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'EXECUTION' }));
    expect(columns[2]).toEqual(expect.objectContaining({ headerName: 'Accuracy' }));
    expect(columns[3]).toEqual(expect.objectContaining({ headerName: 'Details' }));
    expect(columns[4]).toEqual(expect.objectContaining({ headerName: 'EXTRACTED' }));

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

    const extractedChildren = (columns[4] as any).children;
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

    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual(expect.objectContaining({ headerName: ' ' }));
    expect(columns[1]).toEqual(expect.objectContaining({ headerName: 'EXECUTION' }));
    expect((columns[2] as any).children).toHaveLength(0);
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
    expect(getPanelTitle({ testCaseName: 'Login Test', runIndex: 3 } as any)).toBe('Login Test - Run #3');
  });

  test('Should default run index to 0 when missing', () => {
    expect(getPanelTitle({ testCaseName: 'Test' } as any)).toBe('Test - Run #0');
  });

  test('Should handle null result', () => {
    expect(getPanelTitle(null)).toBe('undefined - Run #0');
  });
});

describe('Runs View :: getDetailEntries', () => {
  test('Should convert record to key-value tuple array', () => {
    expect(getDetailEntries({ prompt: 'hello', score: 0.95 })).toEqual([
      ['prompt', 'hello'],
      ['score', '0.95'],
    ]);
  });

  test('Should stringify object values', () => {
    expect(getDetailEntries({ data: { nested: true } })).toEqual([['data', '[object Object]']]);
  });

  test('Should handle empty record', () => {
    expect(getDetailEntries({})).toEqual([]);
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
