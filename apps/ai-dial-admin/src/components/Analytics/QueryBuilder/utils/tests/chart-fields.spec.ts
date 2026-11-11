import { describe, expect, test } from 'vitest';

import { keepValidYFields, resolveYFields } from '@/src/components/Analytics/QueryBuilder/utils/chart-fields';

const OPTIONS = ['calls', 'cost', 'tokens'];

describe('resolveYFields', () => {
  test('defaults unset picks to the first option not on X', () => {
    expect(resolveYFields(null, OPTIONS, 'calls', true)).toEqual(['cost']);
  });

  test('defaults to the first option when every option is on X', () => {
    expect(resolveYFields(null, ['calls'], 'calls', false)).toEqual(['calls']);
  });

  test('resolves to no column when nothing is offered', () => {
    expect(resolveYFields(null, [], null, true)).toEqual([]);
  });

  test('keeps every offered pick of a multi-Y type in order', () => {
    expect(resolveYFields(['tokens', 'calls'], OPTIONS, null, true)).toEqual(['tokens', 'calls']);
  });

  test('keeps only the first offered pick of a single-Y type', () => {
    expect(resolveYFields(['tokens', 'calls'], OPTIONS, null, false)).toEqual(['tokens']);
  });

  test('drops picks that are no longer offered', () => {
    expect(resolveYFields(['gone', 'cost'], OPTIONS, null, true)).toEqual(['cost']);
  });

  test('keeps an emptied pick list empty instead of defaulting', () => {
    expect(resolveYFields([], OPTIONS, null, true)).toEqual([]);
  });
});

describe('keepValidYFields', () => {
  test('keeps the picks the new type offers', () => {
    expect(keepValidYFields(['cost', 'gone', 'calls'], OPTIONS, true)).toEqual(['cost', 'calls']);
  });

  test('keeps only the first pick for a single-Y type', () => {
    expect(keepValidYFields(['cost', 'calls'], OPTIONS, false)).toEqual(['cost']);
  });

  test('falls back to the default when no pick survives', () => {
    expect(keepValidYFields(['gone'], OPTIONS, true)).toBeNull();
    expect(keepValidYFields(null, OPTIONS, true)).toBeNull();
    expect(keepValidYFields([], OPTIONS, false)).toBeNull();
  });
});
