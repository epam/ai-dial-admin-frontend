import { describe, expect, test } from 'vitest';

import { FilterOperatorDto } from '@/src/types/request';
import { RESULT_FILTERS, getTestCaseStatusClass, getResultColumns } from '../utils';

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
  });
});
