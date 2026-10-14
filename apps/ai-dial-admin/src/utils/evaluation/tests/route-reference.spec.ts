import { describe, expect, test } from 'vitest';

import { fromCanonicalRouteName, toCanonicalRouteName } from '@/src/utils/evaluation/route-reference';

describe('route-reference', () => {
  test('builds a canonical Core route identity from a bare name', () => {
    expect(toCanonicalRouteName('search-route')).toBe('routes/platform/search-route');
  });

  test('does not duplicate an existing canonical prefix', () => {
    expect(toCanonicalRouteName('routes/platform/search-route')).toBe('routes/platform/search-route');
  });

  test('extracts the bare route name for Core resource reads and display', () => {
    expect(fromCanonicalRouteName('routes/platform/search-route')).toBe('search-route');
    expect(fromCanonicalRouteName('search-route')).toBe('search-route');
    expect(fromCanonicalRouteName()).toBe('');
  });
});
