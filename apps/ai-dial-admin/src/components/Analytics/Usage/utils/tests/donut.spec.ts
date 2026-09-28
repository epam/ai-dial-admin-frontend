import { describe, expect, test } from 'vitest';

import { BreakdownRow } from '@/src/components/Analytics/Usage/models';
import { buildDonutSlices, getSliceShare } from '@/src/components/Analytics/Usage/utils/donut';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';

const row = (id: string, calls: number, isFallbackLabel = false): BreakdownRow => ({
  id,
  label: isFallbackLabel ? '' : id,
  isFallbackLabel,
  measures: { ...EMPTY_MEASURES, calls },
});

const ROWS = [row('alpha', 50), row('beta', 30), row('gamma', 20)];

describe('buildDonutSlices', () => {
  test('ranks the rows by calls and keeps the requested head', () => {
    const slices = buildDonutSlices(ROWS, 'Others', 100, 2);

    expect(slices.slice(0, 2).map((slice) => slice.id)).toEqual(['alpha', 'beta']);
  });

  test('breaks a tie by label, so repeated renders of one window agree', () => {
    const slices = buildDonutSlices([row('zulu', 10), row('alpha', 10)], 'Others', 20, 2);

    expect(slices.map((slice) => slice.id)).toEqual(['alpha', 'zulu']);
  });

  test('takes the residual from the window total rather than the rows left over', () => {
    const slices = buildDonutSlices(ROWS, 'Others', 250, 2);
    const residual = slices.at(-1);

    // 250 in the window, 80 named: the remaining 170 covers gamma and every row the page never held.
    expect(residual).toEqual({ id: 'other', label: 'Others', value: 170, isOther: true, isFallbackLabel: false });
  });

  test('adds no residual when the named slices already account for the window', () => {
    const slices = buildDonutSlices(ROWS, 'Others', 100, 3);

    expect(slices).toHaveLength(3);
    expect(slices.some((slice) => slice.isOther)).toBe(false);
  });

  test('adds no residual when the window total is unknown', () => {
    expect(buildDonutSlices(ROWS, 'Others', null, 1)).toHaveLength(1);
  });

  test('carries the fallback flag so the view can name a missing dimension value', () => {
    const [slice] = buildDonutSlices([row('', 10, true)], 'Others', 10, 1);

    expect(slice.isFallbackLabel).toBe(true);
  });

  test('returns nothing for a window with no rows', () => {
    expect(buildDonutSlices([], 'Others', 0, 5)).toEqual([]);
  });
});

describe('getSliceShare', () => {
  test('divides the slice by the window total', () => {
    expect(getSliceShare(buildDonutSlices(ROWS, 'Others', 200, 1)[0], 200)).toBe(0.25);
  });

  test.each([
    ['the total is unknown', null],
    ['the total is zero', 0],
  ])('returns nothing when %s', (_case, total) => {
    expect(getSliceShare(buildDonutSlices(ROWS, 'Others', 100, 1)[0], total)).toBeNull();
  });
});
