import { describe, expect, test } from 'vitest';

import { PolicySubjectFunction, PolicySubjectRule } from '@/src/models/dial/policy';
import {
  addRule,
  areRulesValid,
  createEmptyRule,
  isRuleValid,
  isTargetlessFunction,
  normalizeSubject,
  removeRule,
  updateRule,
} from '@/src/utils/policies/subjects';

const RULE: PolicySubjectRule = { source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] };

describe('isTargetlessFunction', () => {
  test('is true for TRUE and FALSE only', () => {
    expect(isTargetlessFunction(PolicySubjectFunction.TRUE)).toBe(true);
    expect(isTargetlessFunction(PolicySubjectFunction.FALSE)).toBe(true);
    expect(isTargetlessFunction(PolicySubjectFunction.EQUAL)).toBe(false);
    expect(isTargetlessFunction(PolicySubjectFunction.CONTAIN)).toBe(false);
    expect(isTargetlessFunction(PolicySubjectFunction.REGEX)).toBe(false);
  });
});

describe('addRule and removeRule', () => {
  test('adds an empty EQUAL rule, also to an undefined list', () => {
    expect(createEmptyRule()).toEqual({ source: '', function: PolicySubjectFunction.EQUAL, targets: [] });
    expect(addRule(undefined)).toEqual([createEmptyRule()]);
    expect(addRule([RULE])).toEqual([RULE, createEmptyRule()]);
  });

  test('removes the rule at an index and tolerates an undefined list', () => {
    expect(removeRule([RULE, createEmptyRule()], 0)).toEqual([createEmptyRule()]);
    expect(removeRule(undefined, 0)).toEqual([]);
  });
});

describe('updateRule', () => {
  test('changes only the rule at the index', () => {
    const other = { ...RULE, source: 'groups' };
    const result = updateRule([RULE, other], 1, { source: 'claims.group' });

    expect(result[0]).toBe(RULE);
    expect(result[1].source).toBe('claims.group');
  });

  test('clears the targets when the function becomes TRUE or FALSE', () => {
    expect(updateRule([RULE], 0, { function: PolicySubjectFunction.TRUE })[0].targets).toEqual([]);
    expect(updateRule([RULE], 0, { function: PolicySubjectFunction.FALSE })[0].targets).toEqual([]);
  });

  test('keeps the targets for a function that uses them', () => {
    expect(updateRule([RULE], 0, { function: PolicySubjectFunction.REGEX })[0].targets).toEqual(['admin']);
  });

  test('tolerates an undefined list', () => {
    expect(updateRule(undefined, 0, { source: 'x' })).toEqual([]);
  });
});

describe('normalizeSubject', () => {
  test('turns an empty or missing list into undefined so it is never written as []', () => {
    expect(normalizeSubject([])).toBeUndefined();
    expect(normalizeSubject(undefined)).toBeUndefined();
  });

  test('keeps a populated list', () => {
    expect(normalizeSubject([RULE])).toEqual([RULE]);
  });
});

describe('isRuleValid', () => {
  test('accepts a rule with a source and a target', () => {
    expect(isRuleValid(RULE)).toBe(true);
  });

  test.each([PolicySubjectFunction.EQUAL, PolicySubjectFunction.CONTAIN, PolicySubjectFunction.REGEX])(
    'requires at least one target for %s',
    (fn) => {
      expect(isRuleValid({ ...RULE, function: fn, targets: [] })).toBe(false);
      expect(isRuleValid({ ...RULE, function: fn, targets: undefined })).toBe(false);
      expect(isRuleValid({ ...RULE, function: fn, targets: ['x'] })).toBe(true);
    },
  );

  test.each([PolicySubjectFunction.TRUE, PolicySubjectFunction.FALSE])('needs no target for %s', (fn) => {
    expect(isRuleValid({ ...RULE, function: fn, targets: [] })).toBe(true);
  });

  test.each([[''], ['   ']])('requires a source, rejecting %j', (source) => {
    expect(isRuleValid({ ...RULE, source })).toBe(false);
  });
});

describe('areRulesValid', () => {
  test('treats a missing or empty list as valid, since subject is optional', () => {
    expect(areRulesValid(undefined)).toBe(true);
    expect(areRulesValid([])).toBe(true);
  });

  test('is valid only when every rule is', () => {
    expect(areRulesValid([RULE, RULE])).toBe(true);
    expect(areRulesValid([RULE, { ...RULE, targets: [] }])).toBe(false);
  });

  test('rejects a freshly added rule until it is filled in', () => {
    expect(areRulesValid(addRule([]))).toBe(false);
  });
});
