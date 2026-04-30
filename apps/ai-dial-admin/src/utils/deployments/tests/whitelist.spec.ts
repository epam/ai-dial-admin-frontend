import { describe, expect, test } from 'vitest';

import { mergeAllowedDomains } from '@/src/utils/deployments/whitelist';

describe('mergeAllowedDomains', () => {
  test('returns additions when existing is undefined', () => {
    expect(mergeAllowedDomains(undefined, ['a', 'b'])).toEqual(['a', 'b']);
  });

  test('returns existing when additions is empty', () => {
    expect(mergeAllowedDomains(['a'], [])).toEqual(['a']);
  });

  test('merges existing and additions deduped, preserving order', () => {
    expect(mergeAllowedDomains(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd']);
  });

  test('deduplicates when additions overlap with existing', () => {
    expect(mergeAllowedDomains(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  test('deduplicates within additions', () => {
    expect(mergeAllowedDomains([], ['a', 'a', 'b'])).toEqual(['a', 'b']);
  });
});
