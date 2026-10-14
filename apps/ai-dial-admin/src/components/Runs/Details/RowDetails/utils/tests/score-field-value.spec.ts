import { describe, expect, test } from 'vitest';

import { getScoreFieldValue } from '../score-field-value';

describe('getScoreFieldValue', () => {
  test('parses the raw value of a score field', () => {
    expect(getScoreFieldValue('0.8', true)).toBe(0.8);
    expect(getScoreFieldValue('0', true)).toBe(0);
  });

  test('is null for a field that is not a score indicator', () => {
    expect(getScoreFieldValue('0.8', false)).toBeNull();
  });

  test('is null for a failed, missing, or non-numeric value', () => {
    expect(getScoreFieldValue('0.8', true, true)).toBeNull();
    expect(getScoreFieldValue(null, true)).toBeNull();
    expect(getScoreFieldValue('n/a', true)).toBeNull();
  });
});
