import { describe, expect, test } from 'vitest';

import {
  buildOverallScorePlotPoints,
  resolveNearestOverallScoreDataIndex,
  resolveOverallScoreTooltipPosition,
} from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/chart-options';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

describe('resolveOverallScoreTooltipPosition', () => {
  test('places tooltip above the pointer when there is room', () => {
    expect(
      resolveOverallScoreTooltipPosition([100, 120], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([112, 28]);
  });

  test('falls back below when above would clip the top', () => {
    expect(
      resolveOverallScoreTooltipPosition([100, 20], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([112, 32]);
  });

  test('flips left when the tooltip would overflow the right edge', () => {
    expect(
      resolveOverallScoreTooltipPosition([780, 100], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([628, 8]);
  });
});

describe('resolveNearestOverallScoreDataIndex', () => {
  const points = [
    { categoryIndex: 0, score: 0.2 },
    { categoryIndex: 1, score: 0.8 },
    { categoryIndex: 2, score: 0.5 },
  ];

  test('picks the nearest scored point in pixel space', () => {
    const convertToPixel = (_finder: unknown, value: number | number[]) => {
      const [categoryIndex, score] = value as number[];
      const x = 100 + categoryIndex * 150;
      const y = 200 - score * 100;
      return [x, y];
    };

    expect(resolveNearestOverallScoreDataIndex(convertToPixel, 100, 180, points)).toBe(0);
    expect(resolveNearestOverallScoreDataIndex(convertToPixel, 250, 120, points)).toBe(1);
    expect(resolveNearestOverallScoreDataIndex(convertToPixel, 400, 150, points)).toBe(2);
  });

  test('falls back to equal-slot layout when convertToPixel fails', () => {
    const convertToPixel = () => null;
    // plot left 4; width 964-4-8=952; index 1 of 3 → x = 4 + 0.5*952 = 480; y for 0.8 ≈ 42
    expect(resolveNearestOverallScoreDataIndex(convertToPixel, 480, 42, points, 964, 220)).toBe(1);
  });

  test('skips null scores and returns null for empty points', () => {
    expect(resolveNearestOverallScoreDataIndex(() => [0, 0], 0, 0, [])).toBeNull();
    expect(resolveNearestOverallScoreDataIndex(() => [0, 0], 0, 0, [{ categoryIndex: 0, score: null }])).toBeNull();
  });
});

describe('buildOverallScorePlotPoints', () => {
  test('maps each run to its category index', () => {
    const runOrder: TrendsRunPoint[] = [
      {
        runId: 'a',
        runName: 'A',
        computedAtMs: new Date(2026, 7, 17, 9, 15).getTime(),
        overallScore: 0.5,
        durationMs: null,
        isFailed: false,
      },
      {
        runId: 'b',
        runName: 'B',
        computedAtMs: new Date(2026, 7, 17, 18, 40).getTime(),
        overallScore: 0.7,
        durationMs: null,
        isFailed: false,
      },
    ];
    expect(buildOverallScorePlotPoints(runOrder)).toEqual([
      { categoryIndex: 0, score: 0.5 },
      { categoryIndex: 1, score: 0.7 },
    ]);
  });
});
