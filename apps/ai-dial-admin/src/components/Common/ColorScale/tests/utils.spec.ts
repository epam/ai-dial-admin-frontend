import { describe, expect, test } from 'vitest';

import {
  ACCURACY_COLOR_MAP,
  DELTA_NEGATIVE_COLOR_MAP,
  DELTA_NEUTRAL_SEGMENT,
  DELTA_POSITIVE_COLOR_MAP,
} from '@/src/components/Common/ColorScale/constants';
import {
  getAccuracyHeatCellStyle,
  getAccuracyHeatCellStyleFromThreshold,
  getDeltaColors,
  getDeltaHeatCellStyle,
  getDeltaNeutralHeatCellStyle,
} from '@/src/components/Common/ColorScale/utils';

describe('getAccuracyHeatCellStyle', () => {
  test('returns right and bottom accent borders for a scored value', () => {
    const style = getAccuracyHeatCellStyle(0.85);

    expect(style).toEqual({
      backgroundColor: ACCURACY_COLOR_MAP[0.9].bg,
      borderRight: `1px solid ${ACCURACY_COLOR_MAP[0.9].border}`,
      borderBottom: `1px solid ${ACCURACY_COLOR_MAP[0.9].border}`,
    });
    expect(style).not.toHaveProperty('borderTop');
    expect(style).not.toHaveProperty('borderLeft');
  });

  test('uses Figma-aligned border color for low accuracy tier', () => {
    const style = getAccuracyHeatCellStyle(0.05);

    expect(style.borderRight).toBe('1px solid #ff6b6b');
    expect(style.borderBottom).toBe('1px solid #ff6b6b');
  });
});

describe('getAccuracyHeatCellStyleFromThreshold', () => {
  test('maps threshold directly to segment colors and borders', () => {
    const style = getAccuracyHeatCellStyleFromThreshold(1.0);

    expect(style).toEqual({
      backgroundColor: ACCURACY_COLOR_MAP[1.0].bg,
      borderRight: `1px solid ${ACCURACY_COLOR_MAP[1.0].border}`,
      borderBottom: `1px solid ${ACCURACY_COLOR_MAP[1.0].border}`,
    });
  });
});

describe('getDeltaColors', () => {
  test('returns null for zero delta', () => {
    expect(getDeltaColors(0)).toBeNull();
  });

  test('maps negative deltas to Figma red tiers', () => {
    expect(getDeltaColors(-0.4)).toEqual(DELTA_NEGATIVE_COLOR_MAP[-0.5]);
    expect(getDeltaColors(-1)).toEqual(DELTA_NEGATIVE_COLOR_MAP[-1.0]);
  });

  test('maps positive deltas to Figma green tiers', () => {
    expect(getDeltaColors(0.4)).toEqual(DELTA_POSITIVE_COLOR_MAP[0.5]);
    expect(getDeltaColors(1)).toEqual(DELTA_POSITIVE_COLOR_MAP[1.0]);
  });
});

describe('getDeltaNeutralHeatCellStyle', () => {
  test('uses layer-2 background and secondary stroke borders', () => {
    expect(getDeltaNeutralHeatCellStyle()).toEqual({
      backgroundColor: DELTA_NEUTRAL_SEGMENT.bg,
      borderRight: `1px solid ${DELTA_NEUTRAL_SEGMENT.border}`,
      borderBottom: `1px solid ${DELTA_NEUTRAL_SEGMENT.border}`,
    });
  });
});

describe('getDeltaHeatCellStyle', () => {
  test('returns undefined for zero delta', () => {
    expect(getDeltaHeatCellStyle(0)).toBeUndefined();
  });

  test('returns heat cell style for non-zero deltas', () => {
    const style = getDeltaHeatCellStyle(-0.4);

    expect(style).toEqual({
      backgroundColor: DELTA_NEGATIVE_COLOR_MAP[-0.5].bg,
      borderRight: `1px solid ${DELTA_NEGATIVE_COLOR_MAP[-0.5].border}`,
      borderBottom: `1px solid ${DELTA_NEGATIVE_COLOR_MAP[-0.5].border}`,
    });
  });
});
