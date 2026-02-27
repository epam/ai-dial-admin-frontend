import { describe, expect, test, vi } from 'vitest';
import { getTestCaseColumns } from '../columns';
import { TestCase } from '@/src/models/evaluation/test-suite';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';

describe('getTestCaseColumns', () => {
  const onCellChange = vi.fn();

  test('should return only base columns when test cases array is empty', () => {
    const testCases: TestCase[] = [];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result.length).toBe(4);
  });

  test('should return only base columns when test case has no facts', () => {
    const testCases: TestCase[] = [{ testCaseName: 'Test Case 1' }];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result.length).toBe(4);
  });

  test('should return only base columns when test case has empty facts object', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {},
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result.length).toBe(4);
  });

  test('should add columns for each unique fact across all test cases', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
          model: 'gpt',
        },
      },
      {
        testCaseName: 'Test Case 2',
        data: {
          maxTokens: 100,
          temperature: 0.5,
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result[1]).toEqual(expect.objectContaining({ field: 'id', colId: 'id', headerName: 'ID' }));
    expect(result[2]).toEqual(
      expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' }),
    );
    expect(result[3]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[4]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('should handle single fact', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          prompt: 'test prompt',
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result[3]).toEqual(expect.objectContaining({ field: 'prompt', headerName: 'prompt' }));
  });

  test('should handle facts with various data types', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          stringFact: 'value',
          numberFact: 42,
          booleanFact: true,
          arrayFact: [1, 2, 3],
          objectFact: { nested: 'value' },
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result[3].field).toBe('stringFact');
    expect(result[4].field).toBe('numberFact');
    expect(result[5].field).toBe('booleanFact');
    expect(result[6].field).toBe('arrayFact');
    expect(result[7].field).toBe('objectFact');
  });

  test('should handle facts with special characters in keys', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          'fact-with-dash': 'value1',
          fact_with_underscore: 'value2',
          'fact.with.dot': 'value3',
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result[3]).toEqual(expect.objectContaining({ field: 'fact-with-dash', headerName: 'fact-with-dash' }));
    expect(result[4]).toEqual(
      expect.objectContaining({ field: 'fact_with_underscore', headerName: 'fact_with_underscore' }),
    );
    expect(result[5]).toEqual(expect.objectContaining({ field: 'fact.with.dot', headerName: 'fact.with.dot' }));
  });

  test('should preserve the order of facts as they appear in the object', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          zFact: 'z',
          aFact: 'a',
          mFact: 'm',
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    expect(result[3].field).toBe('zFact');
    expect(result[4].field).toBe('aFact');
    expect(result[5].field).toBe('mFact');
  });

  test('should correctly spread TEST_CASES_COLUMN at the beginning', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          customFact: 'value',
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);

    // First columns should be from TEST_CASES_COLUMN
    expect(result[1]).toEqual(TEST_CASES_COLUMN[0]);
    expect(result[2]).toEqual(expect.objectContaining(TEST_CASES_COLUMN[1]));
    // Then custom fact columns
    expect(result[3]).toEqual(expect.objectContaining({ field: 'customFact', headerName: 'customFact' }));
  });

  test('should use fallback row field value when nested data field is missing', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          prompt: 'test prompt',
        },
      },
    ];

    const result = getTestCaseColumns(testCases, onCellChange);
    const promptColumn = result.find((column) => column.field === 'prompt');

    expect(promptColumn).toBeDefined();
    expect(promptColumn?.valueGetter?.({ data: { prompt: 'fallback value', data: undefined } } as never)).toBe(
      'fallback value',
    );
  });
});
