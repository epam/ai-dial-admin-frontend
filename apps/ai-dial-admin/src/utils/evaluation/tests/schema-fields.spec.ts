import { describe, expect, test } from 'vitest';

import { getDuplicateFieldNames, getRenamedFields, remapRenamedFields } from '../schema-fields';
import { CollapsibleTestCase } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

const field = (name: string, id?: string, perTurn?: boolean): TestCaseSchema => ({
  id,
  name,
  type: TestCaseItemType.STRING,
  required: false,
  description: '',
  perTurn,
});

describe('getDuplicateFieldNames', () => {
  test('should report names equal ignoring case', () => {
    expect(getDuplicateFieldNames([field('prompt'), field('Prompt'), field('answer')])).toEqual(new Set(['prompt']));
  });

  test('should return empty set for unique names', () => {
    expect(getDuplicateFieldNames([field('prompt'), field('answer')])).toEqual(new Set());
  });

  test('should ignore empty names', () => {
    expect(getDuplicateFieldNames([field(''), field(''), field(' ')])).toEqual(new Set());
  });

  test('should return empty set when schema is missing', () => {
    expect(getDuplicateFieldNames(undefined)).toEqual(new Set());
  });
});

describe('getRenamedFields', () => {
  test('should map old to new name for a kept id', () => {
    expect(getRenamedFields([field('a', '1'), field('b', '2')], [field('c', '1'), field('b', '2')])).toEqual(
      new Map([['a', 'c']]),
    );
  });

  test('should ignore fields without id and ids unknown to the saved schema', () => {
    expect(getRenamedFields([field('a', '1'), field('b')], [field('x'), field('y', '9')])).toEqual(new Map());
  });

  test('should return empty map when schemas are missing', () => {
    expect(getRenamedFields(undefined, null)).toEqual(new Map());
  });
});

describe('remapRenamedFields', () => {
  test('should move a renamed value in shared data', () => {
    const [result] = remapRenamedFields([{ data: { a: 1, b: 2 } }], [field('a', '1')], [field('c', '1')]);

    expect(result.data).toEqual({ c: 1, b: 2 });
  });

  test('should swap values of two swapped names', () => {
    const [result] = remapRenamedFields(
      [{ data: { a: 'A', b: 'B' } }],
      [field('a', '1'), field('b', '2')],
      [field('b', '1'), field('a', '2')],
    );

    expect(result.data).toEqual({ a: 'B', b: 'A' });
  });

  test('should follow a chain of renames', () => {
    const [result] = remapRenamedFields(
      [{ data: { a: 'A', b: 'B' } }],
      [field('a', '1'), field('b', '2')],
      [field('b', '1'), field('c', '2')],
    );

    expect(result.data).toEqual({ b: 'A', c: 'B' });
  });

  test('should rename keys in every turn', () => {
    const [result] = remapRenamedFields(
      [{ data: {}, multiTurnData: [{ q: 'one' }, { q: 'two' }] }],
      [field('q', '1', true)],
      [field('question', '1', true)],
    );

    expect(result.multiTurnData).toEqual([{ question: 'one' }, { question: 'two' }]);
  });

  test('should leave data without the old key unchanged', () => {
    const [result] = remapRenamedFields([{ data: { b: 2 } }], [field('a', '1')], [field('c', '1')]);

    expect(result.data).toEqual({ b: 2 });
  });

  test('should keep undefined data undefined', () => {
    const [result] = remapRenamedFields<CollapsibleTestCase>([{}], [field('a', '1')], [field('c', '1')]);

    expect(result.data).toBeUndefined();
  });

  test('should not treat a new field without id as a rename', () => {
    const testCases = [{ data: { a: 1 } }];

    expect(remapRenamedFields(testCases, [field('a', '1')], [field('c')])).toBe(testCases);
  });

  test('should return the input when nothing was renamed', () => {
    const testCases = [{ data: { a: 1 } }];

    expect(remapRenamedFields(testCases, [field('a', '1')], [field('a', '1')])).toBe(testCases);
  });
});
