import { describe, expect, test } from 'vitest';

import { resolveCenteredPopupLeft } from '@/src/components/Runs/Compare/HeatMap/utils/center-heat-map-tooltip-popup';

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
