import { render } from '@testing-library/react';

import { DialRule, RuleDiffStatus, RuleFunction } from '@/src/models/dial/rule';
import { describe, expect, test } from 'vitest';
import { generateRuleDiff, getAttributeItems, getOperationIcon, getOperationItems, sortRules } from './utils';
import { FoldersI18nKey } from '@/src/constants/i18n';

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

describe('getOperationItems', () => {
  test('returns translated operation items with icons', () => {
    const t = (s: string) => s;
    const items = getOperationItems(t);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ value: RuleFunction.EQUAL, label: FoldersI18nKey.equal });
    expect(items[1]).toMatchObject({ value: RuleFunction.CONTAIN, label: FoldersI18nKey.contain });
    expect(items[2]).toMatchObject({ value: RuleFunction.REGEX, label: FoldersI18nKey.regex });

    // Check icons are present (JSX)
    expect(items[0].icon).toBeTruthy();
    expect(items[1].icon).toBeTruthy();
    expect(items[2].icon).toBeTruthy();
  });
});

describe('getAttributeItems', () => {
  const t = (s: string) => s;

  test('returns translated attribute items', () => {
    const items = getAttributeItems(t, ['a', 'b']);
    expect(items).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ]);
  });

  test('returns empty array if attributes is undefined', () => {
    const items = getAttributeItems(t, undefined);
    expect(items).toEqual([]);
  });

  test('returns empty array if attributes is empty', () => {
    const items = getAttributeItems(t, []);
    expect(items).toEqual([]);
  });
});
