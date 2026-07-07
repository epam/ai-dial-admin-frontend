import { describe, expect, test } from 'vitest';

import { ACCURACY_COLOR_MAP } from '@/src/components/Common/ColorScale/constants';
import {
  getAccuracyHeatCellStyle,
  getAccuracyHeatCellStyleFromThreshold,
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
