import { describe, expect, test } from 'vitest';

import { isProjectionOnly } from '@/src/utils/analytics/entity-fields';

describe('Utils :: analytics :: isProjectionOnly', () => {
  test('returns true for a field the schema marks projection-only', () => {
    expect(isProjectionOnly({ projection_only: true })).toBe(true);
  });

  test('returns false for a field the schema marks not projection-only', () => {
    expect(isProjectionOnly({ projection_only: false })).toBe(false);
  });

  test('returns false for a field from a schema that carries no flag', () => {
    expect(isProjectionOnly({})).toBe(false);
  });
});
