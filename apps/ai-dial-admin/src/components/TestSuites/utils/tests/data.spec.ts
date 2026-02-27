import { describe, expect, test } from 'vitest';
import { createNewTestCaseRow, getTestCaseGridData, rowToTestCase } from '../data';
import { TestCase } from '@/src/models/evaluation/test-suite';

describe('getTestCaseGridData', () => {
  test('should return empty array when test cases array is empty', () => {
    const testCases: TestCase[] = [];

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should return empty array when test cases array is empty', () => {
    const result = getTestCaseGridData();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should return test case without modification when it has no facts', () => {
    const testCases: TestCase[] = [{ testCaseName: 'Test Case 1' }];

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
      },
    ]);
  });

  test('should return test case without modification when facts is undefined', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: undefined,
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: undefined,
      },
    ]);
  });

  test('should return test case without modification when facts is empty object', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {},
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: {},
      },
    ]);
  });

  test('should spread facts into the result object', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
          maxTokens: 100,
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
          maxTokens: 100,
        },
        temperature: 0.7,
        maxTokens: 100,
      },
    ]);
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

    const result = getTestCaseGridData(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: {
          prompt: 'test prompt',
        },
        prompt: 'test prompt',
      },
    ]);
  });

  test('should process multiple test cases', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
        },
      },
      {
        testCaseName: 'Test Case 2',
        data: {
          temperature: 0.5,
          model: 'gpt-4',
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      testCaseName: 'Test Case 1',
      data: {
        temperature: 0.7,
      },
      temperature: 0.7,
    });
    expect(result[1]).toEqual({
      testCaseName: 'Test Case 2',
      data: {
        temperature: 0.5,
        model: 'gpt-4',
      },
      temperature: 0.5,
      model: 'gpt-4',
    });
  });

  test('should handle different fact values across test cases', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Case 1',
        data: {
          param1: 'value1',
        },
      },
      {
        testCaseName: 'Case 2',
        data: {
          param2: 'value2',
        },
      },
      {
        testCaseName: 'Case 3',
        data: {},
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result.length).toBe(3);
    expect(result[0].param1).toBe('value1');
    expect(result[0]).not.toHaveProperty('param2');
    expect(result[1].param2).toBe('value2');
    expect(result[1]).not.toHaveProperty('param1');
    expect(result[2]).not.toHaveProperty('param1');
    expect(result[2]).not.toHaveProperty('param2');
  });

  test('should handle various data types in facts', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          stringFact: 'text',
          numberFact: 42,
          booleanFact: true,
          arrayFact: [1, 2, 3],
          objectFact: { nested: 'value' },
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result[0].stringFact).toBe('text');
    expect(result[0].numberFact).toBe(42);
    expect(result[0].booleanFact).toBe(true);
    expect(result[0].arrayFact).toEqual([1, 2, 3]);
    expect(result[0].objectFact).toEqual({ nested: 'value' });
  });

  test('should preserve all test case properties', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result[0].testCaseName).toBe('Test Case 1');
    expect(result[0].data).toEqual({ temperature: 0.7 });
    expect(result[0].temperature).toBe(0.7);
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

    const result = getTestCaseGridData(testCases);

    expect(result[0]['fact-with-dash']).toBe('value1');
    expect(result[0]['fact_with_underscore']).toBe('value2');
    expect(result[0]['fact.with.dot']).toBe('value3');
  });

  test('should handle null and undefined values in facts', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          nullValue: null,
          undefinedValue: undefined,
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result[0].nullValue).toBeNull();
    expect(result[0].undefinedValue).toBeUndefined();
  });

  test('should handle facts overriding test case properties', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          name: 'Overridden Name',
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    // Facts are spread after testCase, so they override
    expect(result[0].name).toBe('Overridden Name');
    expect(result[0].data).toEqual({ name: 'Overridden Name' });
  });

  test('should handle large number of facts', () => {
    const facts: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) {
      facts[`fact${i}`] = `value${i}`;
    }

    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: facts,
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result.length).toBe(1);
    expect(result[0].fact0).toBe('value0');
    expect(result[0].fact49).toBe('value49');
    expect(Object.keys(result[0]).length).toBeGreaterThan(50); // facts object + 50 spread facts + name
  });

  test('should handle mixed test cases with and without facts', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Case 1',
        data: {
          param: 'value',
        },
      },
      {
        testCaseName: 'Case 2',
      },
      {
        testCaseName: 'Case 3',
        data: {
          another: 'test',
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result.length).toBe(3);
    expect(result[0].param).toBe('value');
    expect(result[1]).not.toHaveProperty('param');
    expect(result[2].another).toBe('test');
  });

  test('should not mutate original test cases', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          temperature: 0.7,
        },
      },
    ];

    const originalTestCases = JSON.parse(JSON.stringify(testCases));
    getTestCaseGridData(testCases);

    expect(testCases).toEqual(originalTestCases);
  });

  test('should handle zero values in facts', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: {
          zeroNumber: 0,
          emptyString: '',
          falseBool: false,
        },
      },
    ];

    const result = getTestCaseGridData(testCases);

    expect(result[0].zeroNumber).toBe(0);
    expect(result[0].emptyString).toBe('');
    expect(result[0].falseBool).toBe(false);
  });
});

describe('createNewTestCaseRow', () => {
  test('should return a default test case row shape', () => {
    const result = createNewTestCaseRow();

    expect(result.enabled).toBe(true);
    expect(result.data).toEqual({});
    expect(result.createdAt).toBe(0);
    expect(result.updatedAt).toBe(0);
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(result.testCaseName).toMatch(/^new-test-case-[0-9a-f]{5}$/i);
  });
});

describe('rowToTestCase', () => {
  test('should map row fields to test case object', () => {
    const row: Record<string, unknown> = {
      id: 'test-case-id',
      enabled: false,
      testCaseName: 'Case A',
      createdAt: 1710000000,
      updatedAt: 1710000001,
      valid: true,
      validationWarnings: [{ message: 'warning', path: ['data', 'input'] }],
      data: { input: 'hello', expected: 'world' },
    };

    const result = rowToTestCase(row);

    expect(result).toEqual({
      id: 'test-case-id',
      enabled: false,
      testCaseName: 'Case A',
      createdAt: 1710000000,
      updatedAt: 1710000001,
      valid: true,
      validationWarnings: [{ message: 'warning', path: ['data', 'input'] }],
      data: { input: 'hello', expected: 'world' },
    });
  });

  test('should preserve undefined optional values', () => {
    const row: Record<string, unknown> = {
      id: 'test-case-id',
      enabled: true,
      testCaseName: undefined,
      createdAt: 0,
      updatedAt: undefined,
      valid: undefined,
      validationWarnings: undefined,
      data: {},
    };

    const result = rowToTestCase(row);

    expect(result).toEqual({
      id: 'test-case-id',
      enabled: true,
      testCaseName: undefined,
      createdAt: 0,
      updatedAt: undefined,
      valid: undefined,
      validationWarnings: undefined,
      data: {},
    });
  });
});
