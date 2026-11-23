import { describe, expect, test } from 'vitest';

import { toggleId } from '@/src/components/Analytics/CustomDashboards/utils/id-set';

describe('toggleId', () => {
  test('adds and removes an id in a new set', () => {
    const ids = new Set(['a']);
    expect([...toggleId(ids, 'b', true)]).toEqual(['a', 'b']);
    expect([...toggleId(ids, 'a', false)]).toEqual([]);
    expect([...ids]).toEqual(['a']);
  });

  test('returns the same set when nothing changes', () => {
    const ids = new Set(['a']);
    expect(toggleId(ids, 'a', true)).toBe(ids);
    expect(toggleId(ids, 'b', false)).toBe(ids);
  });
});
