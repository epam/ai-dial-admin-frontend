import { describe, expect, test } from 'vitest';

import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { collapseRowsToDatasetTestCases, createNewDatasetTestCaseRow, rowToDatasetTestCase } from '../data';
import { demoteToSingle, expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';

describe('expandTestCasesToRows :: dataset test cases', () => {
  test('should return empty array when input is empty', () => {
    expect(expandTestCasesToRows([])).toEqual([]);
  });

  test('should return empty array when input is undefined', () => {
    expect(expandTestCasesToRows()).toEqual([]);
  });

  test('should return empty array when input is null', () => {
    expect(expandTestCasesToRows(null)).toEqual([]);
  });

  test('should return test case without modification when data is empty', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: {} }];

    const result = expandTestCasesToRows(testCases);

    expect(result).toEqual([{ testCaseName: 'Case 1', data: {} }]);
  });

  test('should spread data fields into top-level row properties', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: { prompt: 'hello', expected: 'world' } }];

    const result = expandTestCasesToRows(testCases);

    expect(result[0].prompt).toBe('hello');
    expect(result[0].expected).toBe('world');
    expect(result[0].data).toEqual({ prompt: 'hello', expected: 'world' });
  });

  test('should not let a payload field named id overwrite the platform test case id', () => {
    const testCases: DatasetTestCase[] = [
      { id: '3021b6c6-ddae-47f7-bcd8-85f3c1fd279d', testCaseName: 'Case 1', data: { id: 'test_case_1' } },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result[0].id).toBe('3021b6c6-ddae-47f7-bcd8-85f3c1fd279d');
    expect(result[0].data).toEqual({ id: 'test_case_1' });
  });

  test('should handle multiple test cases', () => {
    const testCases: DatasetTestCase[] = [
      { testCaseName: 'Case 1', data: { a: '1' } },
      { testCaseName: 'Case 2', data: { b: '2' } },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result.length).toBe(2);
    expect(result[0].a).toBe('1');
    expect(result[1].b).toBe('2');
  });

  test('should not mutate original test cases', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: { x: 'y' } }];
    const original = JSON.parse(JSON.stringify(testCases));

    expandTestCasesToRows(testCases);

    expect(testCases).toEqual(original);
  });

  test('should handle various data types', () => {
    const testCases: DatasetTestCase[] = [
      { testCaseName: 'Case 1', data: { num: 42, bool: true, arr: [1, 2], obj: { nested: 'v' } } },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result[0].num).toBe(42);
    expect(result[0].bool).toBe(true);
    expect(result[0].arr).toEqual([1, 2]);
    expect(result[0].obj).toEqual({ nested: 'v' });
  });
});

describe('createNewDatasetTestCaseRow', () => {
  test('should return a row with expected shape', () => {
    const result = createNewDatasetTestCaseRow();

    expect(result.data).toEqual({});
    expect(result.createdAt).toBe(0);
    expect(result.updatedAt).toBe(0);
    expect(typeof result.id).toBe('string');
    expect((result.id as string).length).toBeGreaterThan(0);
    expect(result.testCaseName).toMatch(/^new-test-case-/);
  });

  test('should have no enabled field (unlike TestCase)', () => {
    const result = createNewDatasetTestCaseRow();

    expect(result).not.toHaveProperty('enabled');
  });

  test('each call should produce a unique id', () => {
    const r1 = createNewDatasetTestCaseRow();
    const r2 = createNewDatasetTestCaseRow();

    expect(r1.id).not.toBe(r2.id);
  });
});

describe('rowToDatasetTestCase', () => {
  test('should map all row fields to DatasetTestCase', () => {
    const row: Record<string, unknown> = {
      id: 'tc-1',
      testCaseName: 'Case A',
      createdAt: 1000,
      updatedAt: 2000,
      valid: true,
      validationWarnings: [{ message: 'warn', path: ['data'] }],
      data: { input: 'x' },
    };

    const result = rowToDatasetTestCase(row);

    expect(result).toEqual({
      id: 'tc-1',
      testCaseName: 'Case A',
      createdAt: 1000,
      updatedAt: 2000,
      valid: true,
      validationWarnings: [{ message: 'warn', path: ['data'] }],
      data: { input: 'x' },
    });
  });

  test('should preserve undefined optional fields', () => {
    const row: Record<string, unknown> = {
      id: 'tc-2',
      testCaseName: undefined,
      createdAt: 0,
      updatedAt: undefined,
      valid: undefined,
      validationWarnings: undefined,
      data: {},
    };

    const result = rowToDatasetTestCase(row);

    expect(result.id).toBe('tc-2');
    expect(result.testCaseName).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
    expect(result.valid).toBeUndefined();
    expect(result.validationWarnings).toBeUndefined();
  });

  test('should not include enabled field', () => {
    const row: Record<string, unknown> = { id: 'tc-3', createdAt: 0, data: {} };

    const result = rowToDatasetTestCase(row);

    expect(result).not.toHaveProperty('enabled');
  });
});

describe('expandTestCasesToRows :: dataset test cases, multi-turn', () => {
  test('should emit one row per turn, each stamped with the right _turnIndex', () => {
    const testCases: DatasetTestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { model: 'gpt-4' },
        multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
      },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result).toHaveLength(2);
    expect(result[0]._turnIndex).toBe(0);
    expect(result[1]._turnIndex).toBe(1);
    expect(result[0].id).toBe('tc-1');
    expect(result[1].id).toBe('tc-1');
  });

  test("should merge {...shared, ...turn} into each row's data, and flatten the merged fields onto the row", () => {
    const testCases: DatasetTestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { model: 'gpt-4' },
        multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
      },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result[0].data).toEqual({ model: 'gpt-4', prompt: 'hi' });
    expect(result[0].model).toBe('gpt-4');
    expect(result[0].prompt).toBe('hi');

    expect(result[1].data).toEqual({ model: 'gpt-4', prompt: 'bye', expected: 'ok' });
    expect(result[1].model).toBe('gpt-4');
    expect(result[1].prompt).toBe('bye');
    expect(result[1].expected).toBe('ok');
  });

  test('should let a per-turn key override a shared key of the same name', () => {
    const testCases: DatasetTestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { prompt: 'shared-value' },
        multiTurnData: [{ prompt: 'turn-value' }],
      },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result[0].prompt).toBe('turn-value');
    expect(result[0].data).toEqual({ prompt: 'turn-value' });
  });

  test('should emit exactly one row with no _turnIndex when multiTurnData is absent', () => {
    const testCases: DatasetTestCase[] = [{ id: 'tc-1', testCaseName: 'Single', data: { prompt: 'only' } }];

    const result = expandTestCasesToRows(testCases);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('_turnIndex');
  });

  test('should emit exactly one row with no _turnIndex when multiTurnData is an empty array', () => {
    const testCases: DatasetTestCase[] = [
      { id: 'tc-1', testCaseName: 'Single', data: { prompt: 'only' }, multiTurnData: [] },
    ];

    const result = expandTestCasesToRows(testCases);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('_turnIndex');
  });
});

describe('collapseRowsToDatasetTestCases', () => {
  const perTurnFields = new Set(['prompt', 'expected']);

  test('should round trip grid-data → edit a value → collapse, preserving turn order and the shared/per-turn split', () => {
    const testCase: DatasetTestCase = {
      id: 'tc-1',
      testCaseName: 'Multi',
      createdAt: 0,
      data: { model: 'gpt-4' },
      multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
    };

    const rows = expandTestCasesToRows([testCase]);

    rows[1].data = { ...(rows[1].data as Record<string, unknown>), prompt: 'edited' };
    rows[1].prompt = 'edited';

    const result = collapseRowsToDatasetTestCases(rows, perTurnFields);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tc-1');
    expect(result[0].data).toEqual({ model: 'gpt-4' });
    expect(result[0].multiTurnData).toEqual([{ prompt: 'hi' }, { prompt: 'edited', expected: 'ok' }]);
  });

  test('should produce no multiTurnData for a single-turn case', () => {
    const testCase: DatasetTestCase = {
      id: 'tc-1',
      testCaseName: 'Single',
      createdAt: 0,
      data: { prompt: 'only' },
    };

    const rows = expandTestCasesToRows([testCase]);
    const result = collapseRowsToDatasetTestCases(rows, perTurnFields);

    expect(result[0]).not.toHaveProperty('multiTurnData');
    expect(result[0].data).toEqual({ prompt: 'only' });
  });

  test('should persist a payload id in data while saving against the platform test case id', () => {
    const testCase: DatasetTestCase = {
      id: '3021b6c6-ddae-47f7-bcd8-85f3c1fd279d',
      testCaseName: 'Case',
      createdAt: 0,
      data: { id: 'test_case_1' },
    };

    const rows = expandTestCasesToRows([testCase]);
    rows[0].data = { id: 'test_case_1_edited' };

    const result = collapseRowsToDatasetTestCases(rows);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3021b6c6-ddae-47f7-bcd8-85f3c1fd279d');
    expect(result[0].data).toEqual({ id: 'test_case_1_edited' });
  });

  test('should emit data only when a multi-turn case has been reduced to one turn', () => {
    const testCase: DatasetTestCase = {
      id: 'tc-1',
      testCaseName: 'Multi',
      createdAt: 0,
      data: { model: 'gpt-4' },
      multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
    };

    const rows = expandTestCasesToRows([testCase]);
    const remainingRow = demoteToSingle(rows[0]);

    const result = collapseRowsToDatasetTestCases([remainingRow], perTurnFields);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('multiTurnData');
    expect(result[0].data).toEqual({ model: 'gpt-4', prompt: 'hi' });
  });

  test('should not let any client-only field survive into the emitted DTO', () => {
    const rows: Record<string, unknown>[] = [
      {
        id: 'tc-1',
        rowType: 'GROUP',
        groupKey: 'tc-1',
        testCaseName: 'Multi',
        createdAt: 0,
        data: { model: 'gpt-4' },
      },
      {
        id: 'tc-1',
        _turnIndex: 0,
        rowType: 'TURN',
        groupKey: 'tc-1',
        turnNumber: 1,
        testCaseName: 'Multi',
        createdAt: 0,
        data: { model: 'gpt-4', prompt: 'hi' },
      },
    ];

    const result = collapseRowsToDatasetTestCases(rows, perTurnFields);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('_turnIndex');
    expect(serialized).not.toContain('rowType');
    expect(serialized).not.toContain('groupKey');
    expect(serialized).not.toContain('turnNumber');
  });
});

describe('multi-turn regression :: single-turn case round-trips unchanged', () => {
  test('should round-trip an existing single-turn case through grid-data and collapse unchanged', () => {
    const testCase: DatasetTestCase = {
      id: 'tc-existing',
      testCaseName: 'Existing case',
      createdAt: 1700000000,
      data: { prompt: 'hello', expected: 'world' },
    };

    const rows = expandTestCasesToRows([testCase]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('_turnIndex');

    const result = collapseRowsToDatasetTestCases(rows);

    expect(result).toEqual([testCase]);
  });
});
