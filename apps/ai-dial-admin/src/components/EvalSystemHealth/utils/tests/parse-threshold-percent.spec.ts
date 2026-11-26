import { describe, expect, test } from 'vitest';

import { parseThresholdPercent } from '@/src/components/EvalSystemHealth/utils/parse-threshold-percent';

describe('parseThresholdPercent', () => {
  test.each([
    ['75', 75],
    [' 80 ', 80],
    ['0', 0],
    ['100', 100],
  ])('reads %j as %d', (raw, expected) => {
    expect(parseThresholdPercent(raw)).toBe(expected);
  });

  test.each([
    ['150', 100],
    ['-5', 0],
    ['74.6', 75],
  ])('clamps or rounds %j to %d', (raw, expected) => {
    expect(parseThresholdPercent(raw)).toBe(expected);
  });

  test.each([[''], ['   '], ['abc'], ['Infinity']])('reports %j as unusable', (raw) => {
    expect(parseThresholdPercent(raw)).toBeNull();
  });
});
