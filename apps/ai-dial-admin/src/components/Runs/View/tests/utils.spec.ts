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
  test('Should build static and input columns and format values', () => {
    const results = [
      {
        testCaseData: {
          'input.prompt': 'hello',
          'input.payload': { a: 1 },
        },
      },
    ] as any[];

    const columns = getResultColumns(results as any);

    expect(columns).toHaveLength(3);
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

    const inputChildren = (columns[2] as any).children;
    expect(inputChildren).toHaveLength(2);
    expect(inputChildren[0]).toEqual(
      expect.objectContaining({
        field: 'testCaseData.input.prompt',
        headerName: 'prompt',
      }),
    );

    expect(inputChildren[1].valueGetter({ data: { testCaseData: { 'input.payload': { a: 1 } } } })).toBe('{"a":1}');
    expect(inputChildren[0].valueGetter({ data: { testCaseData: { 'input.prompt': 'value' } } })).toBe('value');
    expect(inputChildren[0].valueGetter({ data: { testCaseData: {} } })).toBe('—');
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
