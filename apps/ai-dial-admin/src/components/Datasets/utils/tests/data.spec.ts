import { describe, expect, it, test } from 'vitest';

import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import {
  collapseRowsToDatasetTestCases,
  createNewDatasetTestCaseRow,
  getDatasetTestCaseGridData,
  rowToDatasetTestCase,
} from '../data';

describe('getDatasetTestCaseGridData', () => {
  test('should return empty array when input is empty', () => {
    expect(getDatasetTestCaseGridData([])).toEqual([]);
  });

  test('should return empty array when input is undefined', () => {
    expect(getDatasetTestCaseGridData()).toEqual([]);
  });

  test('should return empty array when input is null', () => {
    expect(getDatasetTestCaseGridData(null)).toEqual([]);
  });

  test('should return test case without modification when data is empty', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: {} }];

    const result = getDatasetTestCaseGridData(testCases);

    expect(result).toEqual([{ testCaseName: 'Case 1', data: {} }]);
  });

  test('should spread data fields into top-level row properties', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: { prompt: 'hello', expected: 'world' } }];

    const result = getDatasetTestCaseGridData(testCases);

    expect(result[0].prompt).toBe('hello');
    expect(result[0].expected).toBe('world');
    expect(result[0].data).toEqual({ prompt: 'hello', expected: 'world' });
  });

  test('should handle multiple test cases', () => {
    const testCases: DatasetTestCase[] = [
      { testCaseName: 'Case 1', data: { a: '1' } },
      { testCaseName: 'Case 2', data: { b: '2' } },
    ];

    const result = getDatasetTestCaseGridData(testCases);

    expect(result.length).toBe(2);
    expect(result[0].a).toBe('1');
    expect(result[1].b).toBe('2');
  });

  test('should not mutate original test cases', () => {
    const testCases: DatasetTestCase[] = [{ testCaseName: 'Case 1', data: { x: 'y' } }];
    const original = JSON.parse(JSON.stringify(testCases));

    getDatasetTestCaseGridData(testCases);

    expect(testCases).toEqual(original);
  });

  test('should handle various data types', () => {
    const testCases: DatasetTestCase[] = [
      { testCaseName: 'Case 1', data: { num: 42, bool: true, arr: [1, 2], obj: { nested: 'v' } } },
    ];

    const result = getDatasetTestCaseGridData(testCases);

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

describe('getDatasetTestCaseGridData (multi-turn)', () => {
  it('keeps a single-turn case as one row with no _turnIndex', () => {
    const rows = getDatasetTestCaseGridData([{ id: 's1', testCaseName: 'solo', data: { prompt: 'hi' }, createdAt: 0 }]);
    expect(rows).toHaveLength(1);
    expect(rows[0]._turnIndex).toBeUndefined();
    expect(rows[0].prompt).toBe('hi'); // flattened
  });

  it('expands a multi-turn case to one row per turn, sharing id, ordered by _turnIndex', () => {
    const rows = getDatasetTestCaseGridData([
      { id: 'c1', testCaseName: 'flow', multiTurnData: [{ prompt: 'a' }, { prompt: 'b' }], createdAt: 0 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.id === 'c1')).toBe(true);
    expect(rows.map((r) => r._turnIndex)).toEqual([0, 1]);
    expect(rows.map((r) => (r.data as any).prompt)).toEqual(['a', 'b']);
    expect(rows.map((r) => r.prompt)).toEqual(['a', 'b']); // flattened per turn
  });
});

describe('collapseRowsToDatasetTestCases', () => {
  it('collapses turn rows sharing an id into one multiTurnData DTO in _turnIndex order, no data', () => {
    const [dto] = collapseRowsToDatasetTestCases([
      { id: 'c1', _turnIndex: 1, testCaseName: 'flow', data: { prompt: 'b' }, createdAt: 0 },
      { id: 'c1', _turnIndex: 0, testCaseName: 'flow', data: { prompt: 'a' }, createdAt: 0 },
    ]);
    expect(dto.multiTurnData).toEqual([{ prompt: 'a' }, { prompt: 'b' }]);
    expect(dto.data).toBeUndefined();
    expect((dto as any)._turnIndex).toBeUndefined();
  });

  it('emits a single-turn DTO with data and no multiTurnData', () => {
    const [dto] = collapseRowsToDatasetTestCases([
      { id: 's1', testCaseName: 'solo', data: { prompt: 'hi' }, createdAt: 0 },
    ]);
    expect(dto.data).toEqual({ prompt: 'hi' });
    expect(dto.multiTurnData).toBeUndefined();
  });
});
