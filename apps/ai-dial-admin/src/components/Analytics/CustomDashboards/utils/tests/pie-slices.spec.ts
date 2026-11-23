import { describe, expect, test } from 'vitest';

import { getWidgetPieLayout } from '@/src/components/Analytics/CustomDashboards/utils/pie-slices';

describe('getWidgetPieLayout', () => {
  test('names 5, 10 or 15 categories by width on a card four rows tall', () => {
    expect(getWidgetPieLayout({ w: 4, h: 4 })).toEqual({ sliceCount: 5, legendRowsPerColumn: 6, donutSize: 200 });
    expect(getWidgetPieLayout({ w: 6, h: 4 }).sliceCount).toBe(10);
    expect(getWidgetPieLayout({ w: 8, h: 4 }).sliceCount).toBe(10);
    expect(getWidgetPieLayout({ w: 12, h: 4 }).sliceCount).toBe(15);
  });

  test('takes fewer legend rows, fewer slices and a smaller ring on a card three rows tall', () => {
    expect(getWidgetPieLayout({ w: 4, h: 3 })).toEqual({ sliceCount: 3, legendRowsPerColumn: 4, donutSize: 140 });
    expect(getWidgetPieLayout({ w: 6, h: 3 }).sliceCount).toBe(7);
    expect(getWidgetPieLayout({ w: 12, h: 3 }).sliceCount).toBe(11);
  });

  test('keeps the full layout on a taller card', () => {
    expect(getWidgetPieLayout({ w: 6, h: 8 })).toEqual({ sliceCount: 10, legendRowsPerColumn: 6, donutSize: 200 });
  });
});
