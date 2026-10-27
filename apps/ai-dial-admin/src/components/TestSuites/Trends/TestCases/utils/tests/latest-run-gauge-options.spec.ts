import { describe, expect, test } from 'vitest';

import { LATEST_RUN_GAUGE_EMPTY_COLOR, TEST_CASE_SEGMENT_HEX } from '@/src/components/TestSuites/Trends/constants';
import {
  LATEST_RUN_GAUGE_INNER_R_PX,
  LATEST_RUN_GAUGE_OUTER_R_PX,
  LATEST_RUN_SEGMENT_COLORS,
  buildLatestRunGaugeOptions,
} from '@/src/components/TestSuites/Trends/TestCases/utils/latest-run-gauge-options';

describe('buildLatestRunGaugeOptions', () => {
  test('builds a semicircle pie with provided slices', () => {
    const options = buildLatestRunGaugeOptions([
      { name: 'Above', value: 120, color: LATEST_RUN_SEGMENT_COLORS.above },
      { name: 'Below', value: 10, color: LATEST_RUN_SEGMENT_COLORS.below },
      { name: 'Error', value: 20, color: LATEST_RUN_SEGMENT_COLORS.errorOrNa },
    ]);

    const series = options.series as {
      startAngle?: number;
      endAngle?: number;
      padAngle?: number;
      radius?: [number, number];
      data?: { itemStyle?: { borderRadius?: number } }[];
    }[];
    expect(series[0].startAngle).toBe(180);
    expect(series[0].endAngle).toBe(360);
    expect(series[0].data).toHaveLength(3);
    expect(series[0].padAngle).toBeUndefined();
    expect(series[0].data?.[0]?.itemStyle?.borderRadius).toBeUndefined();
    expect(series[0].radius).toEqual([LATEST_RUN_GAUGE_INNER_R_PX, LATEST_RUN_GAUGE_OUTER_R_PX]);
    expect(LATEST_RUN_SEGMENT_COLORS).toBe(TEST_CASE_SEGMENT_HEX);
  });

  test('draws a muted empty track when there are no slices', () => {
    const options = buildLatestRunGaugeOptions([]);
    const series = options.series as { data?: { name: string; itemStyle?: { color?: string } }[] }[];
    expect(series[0].data).toHaveLength(1);
    expect(series[0].data?.[0].name).toBe('empty');
    expect(series[0].data?.[0].itemStyle?.color).toBe(LATEST_RUN_GAUGE_EMPTY_COLOR);
  });
});
