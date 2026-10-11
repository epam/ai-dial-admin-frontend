import { describe, expect, test } from 'vitest';

import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';

describe('getScoreCellBucketKey — absolute mode', () => {
  test('resolves exact 0 and exact 1 to the dedicated edge buckets', () => {
    expect(getScoreCellBucketKey(0, ScoreColorMode.Absolute)).toBe('abs-00');
    expect(getScoreCellBucketKey(1, ScoreColorMode.Absolute)).toBe('abs-11');
  });

  test('buckets values just above 0 and just below 1 separately from the edges', () => {
    expect(getScoreCellBucketKey(0.05, ScoreColorMode.Absolute)).toBe('abs-01');
    expect(getScoreCellBucketKey(0.95, ScoreColorMode.Absolute)).toBe('abs-10');
  });

  test('buckets a mid-range score by its 0.1-wide range', () => {
    expect(getScoreCellBucketKey(0.3, ScoreColorMode.Absolute)).toBe('abs-04');
    expect(getScoreCellBucketKey(0.39, ScoreColorMode.Absolute)).toBe('abs-04');
    expect(getScoreCellBucketKey(0.4, ScoreColorMode.Absolute)).toBe('abs-05');
  });

  test('defaults to absolute mode when mode is omitted', () => {
    expect(getScoreCellBucketKey(0.5)).toBe(getScoreCellBucketKey(0.5, ScoreColorMode.Absolute));
  });
});

describe('getScoreCellBucketKey — delta mode', () => {
  test('returns null for a zero delta', () => {
    expect(getScoreCellBucketKey(0, ScoreColorMode.Delta)).toBeNull();
  });

  test('buckets a positive delta by its 0.25-wide range', () => {
    expect(getScoreCellBucketKey(0.1, ScoreColorMode.Delta)).toBe('delta-p1');
    expect(getScoreCellBucketKey(0.3, ScoreColorMode.Delta)).toBe('delta-p2');
    expect(getScoreCellBucketKey(1, ScoreColorMode.Delta)).toBe('delta-p4');
  });

  test('buckets a negative delta by its 0.25-wide range', () => {
    expect(getScoreCellBucketKey(-0.1, ScoreColorMode.Delta)).toBe('delta-n1');
    expect(getScoreCellBucketKey(-0.3, ScoreColorMode.Delta)).toBe('delta-n2');
    expect(getScoreCellBucketKey(-1, ScoreColorMode.Delta)).toBe('delta-n4');
  });
});

describe('getScoreCellBucketClasses', () => {
  test('returns null for a null bucket', () => {
    expect(getScoreCellBucketClasses(null)).toBeNull();
  });

  test('builds the background/text/border Tailwind class names for a bucket', () => {
    expect(getScoreCellBucketClasses('abs-00')).toEqual({
      background: 'bg-score-abs-00',
      text: 'text-score-abs-00',
      border: 'border-score-abs-00',
      backgroundBorder: 'border-score-abs-00-bg',
    });
  });
});
