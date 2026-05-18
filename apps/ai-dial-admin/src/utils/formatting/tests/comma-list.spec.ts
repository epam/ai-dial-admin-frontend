import { describe, expect, test } from 'vitest';

import { splitCommaList } from '@/src/utils/formatting/comma-list';

describe('splitCommaList', () => {
  test('returns trimmed entries from a comma-separated string', () => {
    expect(splitCommaList('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  test('drops empty entries from runs of commas / trailing commas', () => {
    expect(splitCommaList('a,, b,,')).toEqual(['a', 'b']);
  });

  test('returns an empty array for an empty string', () => {
    expect(splitCommaList('')).toEqual([]);
  });

  test('returns an empty array for non-string input', () => {
    expect(splitCommaList(undefined)).toEqual([]);
    expect(splitCommaList(null)).toEqual([]);
    expect(splitCommaList(42)).toEqual([]);
    expect(splitCommaList(['a', 'b'])).toEqual([]);
  });

  test('trims surrounding whitespace on each entry', () => {
    expect(splitCommaList('  foo  ,\tbar\n,baz')).toEqual(['foo', 'bar', 'baz']);
  });
});
