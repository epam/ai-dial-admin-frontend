import { describe, expect, test } from 'vitest';

import {
  HEAT_MAP_GROUP_ROW_HEIGHT,
  HEAT_MAP_ROW_HEIGHT,
  HEAT_MAP_VALUE_TEXT_MIN_WIDTH,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { resolveHeatMapRowHeight } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';

describe('resolveHeatMapRowHeight', () => {
  test('returns 40px when value columns are wide enough to show text', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(78)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
  });

  test('returns 20px when value columns are too narrow (minified view)', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)).toBe(HEAT_MAP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(14)).toBe(HEAT_MAP_ROW_HEIGHT);
  });
});
