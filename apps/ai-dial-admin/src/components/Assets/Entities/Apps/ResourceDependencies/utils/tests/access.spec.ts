import { describe, expect, test } from 'vitest';

import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import { isReadLocked, sortAccess, toggleAccess } from '../access';

const { Read, Write } = ResourceAccess;

describe('sortAccess', () => {
  test('orders rights as READ, WRITE', () => {
    expect(sortAccess([Write, Read])).toEqual([Read, Write]);
  });
});

describe('toggleAccess', () => {
  test('selecting Write also selects Read', () => {
    expect(toggleAccess([], Write, true)).toEqual([Read, Write]);
  });

  test('does not duplicate Read when it is already selected', () => {
    expect(toggleAccess([Read], Write, true)).toEqual([Read, Write]);
  });

  test('deselecting Write keeps Read', () => {
    expect(toggleAccess([Read, Write], Write, false)).toEqual([Read]);
  });

  test('selects and deselects Read on its own', () => {
    expect(toggleAccess([], Read, true)).toEqual([Read]);
    expect(toggleAccess([Read], Read, false)).toEqual([]);
  });
});

describe('isReadLocked', () => {
  test('locks Read only while Write is selected', () => {
    expect(isReadLocked([Read, Write])).toBe(true);
    expect(isReadLocked([Read])).toBe(false);
  });
});
