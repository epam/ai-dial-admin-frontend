import { describe, expect, test } from 'vitest';

import {
  HeatMapTooltipPlacement,
  resolveCenteredPopupLeft,
  resolveCenteredPopupTop,
  resolveHeatMapTooltipPosition,
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

describe('resolveHeatMapTooltipPosition', () => {
  const parent = { left: 137, top: 508, width: 1302, height: 150 };
  const viewport = { width: 1512, height: 781 };

  test('keeps the tooltip below the cell when the grid has room', () => {
    const position = resolveHeatMapTooltipPosition(
      { left: 200, top: 100, width: 80, height: 40 },
      { left: 0, top: 0, width: 400, height: 400 },
      120,
      80,
      800,
      600,
    );

    expect(position.placement).toBe(HeatMapTooltipPlacement.Below);
    expect(position.isFixed).toBe(false);
    expect(position.top).toBe(140);
  });

  test('places a two-row tooltip below the cell, the same way as one row', () => {
    // Logged top row of a two-row grid: the grid cannot hold the popup, the window can.
    const position = resolveHeatMapTooltipPosition(
      { left: 647, top: 577, width: 159, height: 39 },
      parent,
      157,
      98,
      viewport.width,
      viewport.height,
    );

    expect(position.placement).toBe(HeatMapTooltipPlacement.Below);
    expect(position.isFixed).toBe(true);
    expect(position.top).toBe(616);
    expect(position.left).toBeCloseTo(648);
  });

  test('places a one-row tooltip below the cell when the window has room', () => {
    // Logged one-row hover: grid is 70px, popup is 98px, 125px of window remains under the cell.
    const position = resolveHeatMapTooltipPosition(
      { left: 329, top: 617, width: 370, height: 39 },
      { left: 137, top: 588, width: 1302, height: 70 },
      159,
      98,
      viewport.width,
      viewport.height,
    );

    expect(position.placement).toBe(HeatMapTooltipPlacement.Below);
    expect(position.isFixed).toBe(true);
    expect(position.top).toBe(656);
    expect(position.left).toBeCloseTo(434.5);
    expect(position.top).toBeGreaterThanOrEqual(617 + 39);
  });

  test('places a one-row tooltip above the cell when the window has no room below', () => {
    const position = resolveHeatMapTooltipPosition(
      { left: 329, top: 700, width: 370, height: 39 },
      { left: 137, top: 671, width: 1302, height: 70 },
      159,
      98,
      viewport.width,
      viewport.height,
    );

    expect(position.placement).toBe(HeatMapTooltipPlacement.Above);
    expect(position.isFixed).toBe(true);
    expect(position.top).toBe(700 - 98);
  });
});
