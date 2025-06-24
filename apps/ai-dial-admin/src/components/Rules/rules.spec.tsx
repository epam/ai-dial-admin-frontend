import { render } from '@testing-library/react';

import { DialRule, RuleDiffStatus, RuleFunction } from '@/src/models/dial/rule';
import { describe, expect, test } from 'vitest';
import { generateRuleDiff, getOperationIcon, sortRules } from './rules';

describe('Rules :: getOperationIcon', () => {
  test('returns IconEqual component when operation is EQUAL', () => {
    const { container } = render(getOperationIcon(RuleFunction.EQUAL));
    expect(container.querySelector('svg')).toBeDefined();
  });

  test('returns Contains component when operation is CONTAIN', () => {
    const { container } = render(getOperationIcon(RuleFunction.CONTAIN));
    expect(container.querySelector('svg')).toBeDefined();
  });

  test('returns Regex component when operation is REGEX', () => {
    const { container } = render(getOperationIcon(RuleFunction.REGEX));
    expect(container.querySelector('svg')).toBeDefined();
  });

  test('returns undefined for unsupported operation', () => {
    const invalidOperation = 'UNKNOWN_OP' as RuleFunction;
    const result = getOperationIcon(invalidOperation);
    expect(result).toBeUndefined();
  });
});

describe('Rules :: sortRules', () => {
  test('sorts rules by folder hierarchy depth', () => {
    const rulesMap = {
      'folder/folder2/final/': [{ source: '3' } as DialRule],
      'folder/': [{ source: '1' } as DialRule],
      'folder/folder2/': [{ source: '2' } as DialRule],
    };

    const sorted = sortRules(rulesMap);

    expect(sorted).toEqual([
      ['folder/', [{ source: '1' }]],
      ['folder/folder2/', [{ source: '2' }]],
      ['folder/folder2/final/', [{ source: '3' }]],
    ]);
  });

  test('returns empty array when rulesMap is empty', () => {
    const rulesMap: Record<string, DialRule[]> = {};
    const sorted = sortRules(rulesMap);

    expect(sorted).toEqual([]);
  });

  test('handles single entry without errors', () => {
    const rulesMap = {
      'folder/': [{ source: 'only' } as DialRule],
    };

    const sorted = sortRules(rulesMap);

    expect(sorted).toEqual([['folder/', [{ source: 'only' }]]]);
  });
});

describe('Rules :: generateRuleDiff', () => {
  const baseRule: DialRule = {
    source: 'source-A',
    targets: ['t1', 't2'],
    function: RuleFunction.CONTAIN,
  };

  const matchingRule: DialRule = {
    source: 'source-A',
    targets: ['t3'],
    function: RuleFunction.CONTAIN,
  };

  test('returns undefined if no rulesToExclude or rulesToInclude are provided', () => {
    const result = generateRuleDiff(baseRule);
    expect(result).toBeUndefined();
  });

  test('returns { status: EXCLUDE } if no matching rule is found in rulesToExclude', () => {
    const result = generateRuleDiff(baseRule, [{ source: 'other', targets: [], function: RuleFunction.CONTAIN }]);
    expect(result).toEqual({ status: RuleDiffStatus.EXCLUDE });
  });

  test('returns { status: INCLUDE } if no matching rule is found in rulesToInclude', () => {
    const result = generateRuleDiff(baseRule, undefined, [
      { source: 'other', targets: [], function: RuleFunction.CONTAIN },
    ]);
    expect(result).toEqual({ status: RuleDiffStatus.INCLUDE });
  });

  test('returns diff with items when getRuleTargetDifferences returns differences (EXCLUDE)', () => {
    const result = generateRuleDiff(baseRule, [matchingRule]);

    expect(result).toEqual({
      status: RuleDiffStatus.EXCLUDE,
      items: ['t1', 't2'],
    });
  });

  test('returns diff with items when getRuleTargetDifferences returns differences (INCLUDE)', () => {
    const result = generateRuleDiff(baseRule, undefined, [matchingRule]);

    expect(result).toEqual({
      status: RuleDiffStatus.INCLUDE,
      items: ['t1', 't2'],
    });
  });
});
