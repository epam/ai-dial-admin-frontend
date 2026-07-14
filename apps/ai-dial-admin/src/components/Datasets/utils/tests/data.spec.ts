import { describe, expect, test } from 'vitest';

import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { createNewDatasetTestCaseRow, getDatasetTestCaseGridData, rowToDatasetTestCase } from '../data';

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

  test('should include both conversation fields when both present (turnIndex 0 counts)', () => {
    const result = rowToDatasetTestCase({ id: 'tc', createdAt: 0, data: {}, conversationId: 'conv-1', turnIndex: 0 });

    expect(result.conversationId).toBe('conv-1');
    expect(result.turnIndex).toBe(0);
  });

  test('should omit both when only one of the conversation fields is present', () => {
    const onlyId = rowToDatasetTestCase({ id: 'tc', createdAt: 0, data: {}, conversationId: 'conv-1' });
    const onlyTurn = rowToDatasetTestCase({ id: 'tc', createdAt: 0, data: {}, turnIndex: 1 });

    expect(onlyId).not.toHaveProperty('conversationId');
    expect(onlyId).not.toHaveProperty('turnIndex');
    expect(onlyTurn).not.toHaveProperty('conversationId');
    expect(onlyTurn).not.toHaveProperty('turnIndex');
  });
});

describe('getDatasetTestCaseGridData conversation passthrough', () => {
  test('top-level conversationId/turnIndex land on the grid row', () => {
    const result = getDatasetTestCaseGridData([
      { testCaseName: 'c1', data: { q: 'a' }, conversationId: 'conv-1', turnIndex: 2 },
    ]);

    expect(result[0].conversationId).toBe('conv-1');
    expect(result[0].turnIndex).toBe(2);
    expect(result[0].q).toBe('a');
  });
});
