import { describe, expect, test } from 'vitest';

import { getUniqueTestCaseCopyName } from '@/src/utils/evaluation/test-case-name';

describe('getUniqueTestCaseCopyName', () => {
  test('adds the copy postfix to the source name', () => {
    expect(getUniqueTestCaseCopyName('Case A', ['Case A'], '(Copy)')).toBe('Case A (Copy)');
  });

  test('increments the suffix when the copy name already exists', () => {
    expect(getUniqueTestCaseCopyName('Case A', ['Case A', 'Case A (Copy)'], '(Copy)')).toBe('Case A (Copy 2)');
  });

  test('matches existing names without regard to surrounding whitespace or case', () => {
    expect(getUniqueTestCaseCopyName('Case A', [' case a (copy) '], '(Copy)')).toBe('Case A (Copy 2)');
  });

  test('uses the copy postfix when the source name is empty', () => {
    expect(getUniqueTestCaseCopyName('', [], '(Copy)')).toBe('(Copy)');
  });
});
