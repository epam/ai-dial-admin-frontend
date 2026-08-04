import { describe, expect, test } from 'vitest';
import { collapseRowsToTestCases, createNewTestCaseRow, rowToTestCase } from '../data';
import { TestCase as TestCaseModel } from '@/src/models/evaluation/test-suite';
import { demoteToSingle, expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';

type TestCase = Partial<TestCaseModel>;

const expandRows = (testCases?: TestCase[] | null) => {
  return expandTestCasesToRows(testCases as TestCaseModel[] | null | undefined);
};

describe('expandTestCasesToRows :: test suite cases', () => {
  test('should return empty array when test cases array is empty', () => {
    const testCases: TestCase[] = [];

    const result = expandRows(testCases);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should return empty array when test cases array is empty', () => {
    const result = expandRows();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should normalise data to an empty object when it has no facts', () => {
    const testCases: TestCase[] = [{ testCaseName: 'Test Case 1' }];

    const result = expandRows(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: {},
      },
    ]);
  });

  test('should normalise data to an empty object when facts is undefined', () => {
    const testCases: TestCase[] = [
      {
        testCaseName: 'Test Case 1',
        data: undefined,
      },
    ];

    const result = expandRows(testCases);

    expect(result).toEqual([
      {
        testCaseName: 'Test Case 1',
        data: {},
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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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

    const result = expandRows(testCases);

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
    expandRows(testCases);

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

    const result = expandRows(testCases);

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

describe('expandTestCasesToRows :: test suite cases, multi-turn', () => {
  test('should emit one row per turn, each stamped with the right _turnIndex', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { model: 'gpt-4' },
        multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
      },
    ];

    const result = expandRows(testCases);

    expect(result).toHaveLength(2);
    expect(result[0]._turnIndex).toBe(0);
    expect(result[1]._turnIndex).toBe(1);
    expect(result[0].id).toBe('tc-1');
    expect(result[1].id).toBe('tc-1');
  });

  test("should merge {...shared, ...turn} into each row's data, and flatten the merged fields onto the row", () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { model: 'gpt-4' },
        multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
      },
    ];

    const result = expandRows(testCases);

    expect(result[0].data).toEqual({ model: 'gpt-4', prompt: 'hi' });
    expect(result[0].model).toBe('gpt-4');
    expect(result[0].prompt).toBe('hi');

    expect(result[1].data).toEqual({ model: 'gpt-4', prompt: 'bye', expected: 'ok' });
    expect(result[1].model).toBe('gpt-4');
    expect(result[1].prompt).toBe('bye');
    expect(result[1].expected).toBe('ok');
  });

  test('should let a per-turn key override a shared key of the same name', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        testCaseName: 'Multi',
        data: { prompt: 'shared-value' },
        multiTurnData: [{ prompt: 'turn-value' }],
      },
    ];

    const result = expandRows(testCases);

    expect(result[0].prompt).toBe('turn-value');
    expect(result[0].data).toEqual({ prompt: 'turn-value' });
  });

  test('should emit exactly one row with no _turnIndex when multiTurnData is absent', () => {
    const testCases: TestCase[] = [{ id: 'tc-1', testCaseName: 'Single', data: { prompt: 'only' } }];

    const result = expandRows(testCases);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('_turnIndex');
  });

  test('should emit exactly one row with no _turnIndex when multiTurnData is an empty array', () => {
    const testCases: TestCase[] = [{ id: 'tc-1', testCaseName: 'Single', data: { prompt: 'only' }, multiTurnData: [] }];

    const result = expandRows(testCases);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('_turnIndex');
  });
});

describe('collapseRowsToTestCases', () => {
  const perTurnFields = new Set(['prompt', 'expected']);

  test('should round trip grid-data → edit a value → collapse, preserving turn order and the shared/per-turn split', () => {
    const testCase: TestCaseModel = {
      id: 'tc-1',
      testCaseName: 'Multi',
      createdAt: 0,
      enabled: true,
      data: { model: 'gpt-4' },
      multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
    };

    const rows = expandRows([testCase]);

    rows[1].data = { ...(rows[1].data as Record<string, unknown>), prompt: 'edited' };
    rows[1].prompt = 'edited';

    const result = collapseRowsToTestCases(rows, perTurnFields);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tc-1');
    expect(result[0].data).toEqual({ model: 'gpt-4' });
    expect(result[0].multiTurnData).toEqual([{ prompt: 'hi' }, { prompt: 'edited', expected: 'ok' }]);
  });

  test('should produce no multiTurnData for a single-turn case', () => {
    const testCase: TestCaseModel = {
      id: 'tc-1',
      testCaseName: 'Single',
      createdAt: 0,
      enabled: true,
      data: { prompt: 'only' },
    };

    const rows = expandRows([testCase]);
    const result = collapseRowsToTestCases(rows, perTurnFields);

    expect(result[0]).not.toHaveProperty('multiTurnData');
    expect(result[0].data).toEqual({ prompt: 'only' });
  });

  test('should emit data only when a multi-turn case has been reduced to one turn', () => {
    const testCase: TestCaseModel = {
      id: 'tc-1',
      testCaseName: 'Multi',
      createdAt: 0,
      enabled: true,
      data: { model: 'gpt-4' },
      multiTurnData: [{ prompt: 'hi' }, { prompt: 'bye', expected: 'ok' }],
    };

    const rows = expandRows([testCase]);
    const remainingRow = demoteToSingle(rows[0]);

    const result = collapseRowsToTestCases([remainingRow], perTurnFields);

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
        enabled: true,
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
        enabled: true,
        data: { model: 'gpt-4', prompt: 'hi' },
      },
    ];

    const result = collapseRowsToTestCases(rows, perTurnFields);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('_turnIndex');
    expect(serialized).not.toContain('rowType');
    expect(serialized).not.toContain('groupKey');
    expect(serialized).not.toContain('turnNumber');
  });
});

describe('multi-turn regression :: single-turn case round-trips unchanged', () => {
  test('should round-trip an existing single-turn case through grid-data and collapse unchanged', () => {
    const testCase: TestCaseModel = {
      id: 'tc-existing',
      testCaseName: 'Existing case',
      createdAt: 1700000000,
      enabled: true,
      data: { prompt: 'hello', expected: 'world' },
    };

    const rows = expandRows([testCase]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('_turnIndex');

    const result = collapseRowsToTestCases(rows);

    expect(result).toEqual([testCase]);
  });
});
