import { describe, expect, test } from 'vitest';

import {
  buildThresholdMarkPlan,
  runThresholdSpan,
} from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/threshold-segments';

describe('runThresholdSpan', () => {
  test('pins the first and last run to the chart edges', () => {
    expect(runThresholdSpan(0, 5)).toEqual({ left: 0, right: 0.5 });
    expect(runThresholdSpan(2, 5)).toEqual({ left: 1.5, right: 2.5 });
    expect(runThresholdSpan(4, 5)).toEqual({ left: 3.5, right: 4 });
  });

  test('collapses a single run to the full width', () => {
    expect(runThresholdSpan(0, 1)).toEqual({ left: 0, right: 0 });
  });
});

describe('buildThresholdMarkPlan', () => {
  test('returns none for an empty list', () => {
    expect(buildThresholdMarkPlan([])).toEqual({ mode: 'none' });
  });

  test('returns none when every run has no threshold', () => {
    expect(buildThresholdMarkPlan([null, undefined, null])).toEqual({ mode: 'none' });
  });

  test('uses a full-width line for a single run with a threshold', () => {
    expect(buildThresholdMarkPlan([0.6])).toEqual({ mode: 'fullWidth', value: 0.6 });
  });

  test('uses a full-width line when the single-run threshold is 0', () => {
    expect(buildThresholdMarkPlan([0])).toEqual({ mode: 'fullWidth', value: 0 });
  });

  test('returns none for a single run without a threshold', () => {
    expect(buildThresholdMarkPlan([null])).toEqual({ mode: 'none' });
  });

  test('merges neighboring runs with the same threshold into one horizontal segment', () => {
    expect(buildThresholdMarkPlan([0.6, 0.6, 0.6])).toEqual({
      mode: 'segments',
      segments: [{ kind: 'horizontal', x0: 0, x1: 2, y: 0.6 }],
    });
  });

  test('joins neighboring runs with different thresholds with a vertical segment', () => {
    expect(buildThresholdMarkPlan([0.6, 0.8])).toEqual({
      mode: 'segments',
      segments: [
        { kind: 'horizontal', x0: 0, x1: 0.5, y: 0.6 },
        { kind: 'vertical', x: 0.5, y0: 0.6, y1: 0.8 },
        { kind: 'horizontal', x0: 0.5, x1: 1, y: 0.8 },
      ],
    });
  });

  test('breaks the line where a run has no threshold', () => {
    expect(buildThresholdMarkPlan([0.6, 0.6, 0.8, null, 0.6])).toEqual({
      mode: 'segments',
      segments: [
        { kind: 'horizontal', x0: 0, x1: 1.5, y: 0.6 },
        { kind: 'vertical', x: 1.5, y0: 0.6, y1: 0.8 },
        { kind: 'horizontal', x0: 1.5, x1: 2.5, y: 0.8 },
        { kind: 'horizontal', x0: 3.5, x1: 4, y: 0.6 },
      ],
    });
  });

  test('treats undefined the same as null for gaps', () => {
    expect(buildThresholdMarkPlan([0.5, undefined, 0.5])).toEqual({
      mode: 'segments',
      segments: [
        { kind: 'horizontal', x0: 0, x1: 0.5, y: 0.5 },
        { kind: 'horizontal', x0: 1.5, x1: 2, y: 0.5 },
      ],
    });
  });

  test('keeps threshold 0 as a drawn segment', () => {
    expect(buildThresholdMarkPlan([0, 0.5])).toEqual({
      mode: 'segments',
      segments: [
        { kind: 'horizontal', x0: 0, x1: 0.5, y: 0 },
        { kind: 'vertical', x: 0.5, y0: 0, y1: 0.5 },
        { kind: 'horizontal', x0: 0.5, x1: 1, y: 0.5 },
      ],
    });
  });
});
