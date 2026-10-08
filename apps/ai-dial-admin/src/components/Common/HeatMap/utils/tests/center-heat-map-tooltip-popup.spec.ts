import { describe, expect, test } from 'vitest';

import {
  resolveCenteredPopupLeft,
  resolveCenteredPopupTop,
} from '@/src/components/Common/HeatMap/utils/center-heat-map-tooltip-popup';

describe('resolveCenteredPopupLeft', () => {
  test('centers popup on anchor within parent bounds', () => {
    expect(resolveCenteredPopupLeft(200, 100, 400, 120)).toBe(40);
  });

  test('clamps popup to parent left edge', () => {
    expect(resolveCenteredPopupLeft(50, 100, 400, 120)).toBe(0);
  });

  test('clamps popup to parent right edge', () => {
    expect(resolveCenteredPopupLeft(480, 100, 400, 120)).toBe(280);
  });
});

describe('resolveCenteredPopupTop', () => {
  test('places popup below the cell when there is room', () => {
    // parent: top 0 height 400; cell 100-140; popup 80 → fits below at 140
    expect(resolveCenteredPopupTop(100, 140, 0, 400, 80)).toEqual({ top: 140, placedAbove: false });
  });

  test('places popup above the cell when below would overflow', () => {
    // parent: top 0 height 400; cell 350-390; popup 80 → below would be 390 (> 320 max)
    expect(resolveCenteredPopupTop(350, 390, 0, 400, 80)).toEqual({ top: 270, placedAbove: true });
  });

  test('clamps in-bounds when popup is taller than either side', () => {
    // parent height 100; cell 40-60; popup 90 → neither side fits; equal space → below path clamped
    expect(resolveCenteredPopupTop(40, 60, 0, 100, 90)).toEqual({ top: 10, placedAbove: false });
  });
});
