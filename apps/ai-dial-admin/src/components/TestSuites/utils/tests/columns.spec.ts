import { describe, expect, test } from 'vitest';
import { getTestCaseColumns } from '../columns';
import { TestCase } from '@/src/models/evaluation/test-suite';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';

describe('getTestCaseColumns', () => {
  test('should return only base columns when test cases array is empty', () => {
    const testCases: TestCase[] = [];

    const result = getTestCaseColumns(testCases);

    expect(result).toEqual(TEST_CASES_COLUMN);
    expect(result.length).toBe(2);
  });

  test('should return only base columns when first test case has no facts', () => {
    const testCases: TestCase[] = [{ name: 'Test Case 1' }];

    const result = getTestCaseColumns(testCases);

    expect(result).toEqual(TEST_CASES_COLUMN);
    expect(result.length).toBe(2);
  });

  test('should return only base columns when first test case has undefined facts', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: undefined,
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result).toEqual(TEST_CASES_COLUMN);
  });

  test('should return only base columns when first test case has empty facts object', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {},
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result).toEqual(TEST_CASES_COLUMN);
    expect(result.length).toBe(2);
  });

  test('should add columns for each fact in the first test case', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          temperature: 0.7,
          maxTokens: 100,
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result.length).toBe(4);
    expect(result[0]).toEqual({ field: 'id', colId: 'id', headerName: 'ID' });
    expect(result[1]).toEqual({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' });
    expect(result[2]).toEqual({ field: 'temperature', headerName: 'temperature' });
    expect(result[3]).toEqual({ field: 'maxTokens', headerName: 'maxTokens' });
  });

  test('should handle single fact', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          prompt: 'test prompt',
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result.length).toBe(3);
    expect(result[2]).toEqual({ field: 'prompt', headerName: 'prompt' });
  });

  test('should handle facts with various data types', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          stringFact: 'value',
          numberFact: 42,
          booleanFact: true,
          arrayFact: [1, 2, 3],
          objectFact: { nested: 'value' },
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result.length).toBe(7); // 2 base + 5 fact columns
    expect(result[2].field).toBe('stringFact');
    expect(result[3].field).toBe('numberFact');
    expect(result[4].field).toBe('booleanFact');
    expect(result[5].field).toBe('arrayFact');
    expect(result[6].field).toBe('objectFact');
  });

  test('should handle facts with special characters in keys', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          'fact-with-dash': 'value1',
          fact_with_underscore: 'value2',
          'fact.with.dot': 'value3',
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result.length).toBe(5);
    expect(result[2]).toEqual({ field: 'fact-with-dash', headerName: 'fact-with-dash' });
    expect(result[3]).toEqual({ field: 'fact_with_underscore', headerName: 'fact_with_underscore' });
    expect(result[4]).toEqual({ field: 'fact.with.dot', headerName: 'fact.with.dot' });
  });

  test('should preserve the order of facts as they appear in the object', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          zFact: 'z',
          aFact: 'a',
          mFact: 'm',
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    expect(result[2].field).toBe('zFact');
    expect(result[3].field).toBe('aFact');
    expect(result[4].field).toBe('mFact');
  });

  test('should correctly spread TEST_CASES_COLUMN at the beginning', () => {
    const testCases: TestCase[] = [
      {
        name: 'Test Case 1',
        facts: {
          customFact: 'value',
        },
      },
    ];

    const result = getTestCaseColumns(testCases);

    // First columns should be from TEST_CASES_COLUMN
    expect(result[0]).toEqual(TEST_CASES_COLUMN[0]);
    expect(result[1]).toEqual(TEST_CASES_COLUMN[1]);
    // Then custom fact columns
    expect(result[2]).toEqual({ field: 'customFact', headerName: 'customFact' });
  });
});
