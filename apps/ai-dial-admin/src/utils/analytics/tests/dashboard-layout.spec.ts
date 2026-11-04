import { describe, expect, test } from 'vitest';

import { DashboardWidget, WidgetMoveDirection, WidgetSize, WidgetView } from '@/src/models/analytics/dashboard';
import {
  appendWidget,
  applyPlacements,
  getBottomRow,
  moveWidget,
  removeWidget,
  resizeWidget,
  sortByReadingOrder,
  updateWidget,
} from '@/src/utils/analytics/dashboard-layout';

const widget = (id: string, x: number, y: number, w = 6, h = 4): DashboardWidget => ({
  id,
  saved_query_id: `q-${id}`,
  row_limit: 100,
  layout: { x, y, w, h },
});

describe('sortByReadingOrder', () => {
  test('orders widgets top to bottom, then left to right', () => {
    const ordered = sortByReadingOrder([widget('c', 0, 4), widget('b', 6, 0), widget('a', 0, 0)]);
    expect(ordered.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  test('leaves the input array untouched', () => {
    const widgets = [widget('b', 6, 0), widget('a', 0, 0)];
    sortByReadingOrder(widgets);
    expect(widgets.map((item) => item.id)).toEqual(['b', 'a']);
  });
});

describe('getBottomRow', () => {
  test('returns the first row below the lowest widget', () => {
    expect(getBottomRow([widget('a', 0, 0, 6, 4), widget('b', 0, 4, 6, 3)])).toBe(7);
  });

  test('returns zero for an empty dashboard', () => {
    expect(getBottomRow([])).toBe(0);
  });
});

describe('appendWidget', () => {
  test('places a new widget at the left edge below every widget, in the medium size', () => {
    const next = appendWidget([widget('a', 6, 0, 6, 4)], { id: 'n', saved_query_id: 'q', row_limit: 100 });
    expect(next.at(-1)).toEqual({ id: 'n', saved_query_id: 'q', row_limit: 100, layout: { x: 0, y: 4, w: 6, h: 4 } });
  });

  test('places the first widget at the top', () => {
    expect(appendWidget([], { id: 'n', saved_query_id: 'q', row_limit: 5 })[0].layout).toEqual({
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    });
  });
});

describe('removeWidget and updateWidget', () => {
  test('removes only the widget with the id', () => {
    expect(removeWidget([widget('a', 0, 0), widget('b', 6, 0)], 'a').map((item) => item.id)).toEqual(['b']);
  });

  test('patches the widget with the id and keeps its layout', () => {
    const [updated] = updateWidget([widget('a', 0, 0)], 'a', { title: 'Cost', row_limit: 50 });
    expect(updated).toEqual({ ...widget('a', 0, 0), title: 'Cost', row_limit: 50 });
  });

  test('shrinks a widget to the extra small size when it becomes a single value', () => {
    const [updated] = updateWidget([widget('a', 10, 0)], 'a', { view: WidgetView.SingleValue });
    expect(updated.layout).toEqual({ x: 9, y: 0, w: 3, h: 2 });
  });

  test('gives a widget the medium size when it stops being a single value', () => {
    const kpi = { ...widget('a', 0, 0, 3, 2), view: WidgetView.SingleValue };
    const [updated] = updateWidget([kpi], 'a', { view: WidgetView.Table });
    expect(updated.layout).toEqual({ x: 0, y: 0, w: 6, h: 4 });
  });

  test('keeps the size when the view stays a single value', () => {
    const kpi = { ...widget('a', 0, 0, 3, 2), view: WidgetView.SingleValue };
    const [updated] = updateWidget([kpi], 'a', { view: WidgetView.SingleValue, title: 'Spend' });
    expect(updated.layout).toEqual(kpi.layout);
  });
});

describe('moveWidget', () => {
  const widgets = [widget('a', 0, 0, 6, 4), widget('b', 6, 0, 6, 4), widget('c', 0, 4, 12, 4)];

  test('moving down swaps positions with the next widget in reading order', () => {
    const moved = moveWidget(widgets, 'a', WidgetMoveDirection.Down);
    expect(moved.find((item) => item.id === 'a')?.layout).toEqual({ x: 6, y: 0, w: 6, h: 4 });
    expect(moved.find((item) => item.id === 'b')?.layout).toEqual({ x: 0, y: 0, w: 6, h: 4 });
  });

  test('moving up swaps positions with the previous widget and keeps each size', () => {
    const moved = moveWidget(widgets, 'c', WidgetMoveDirection.Up);
    expect(moved.find((item) => item.id === 'c')?.layout).toEqual({ x: 6, y: 0, w: 12, h: 4 });
    expect(moved.find((item) => item.id === 'b')?.layout).toEqual({ x: 0, y: 4, w: 6, h: 4 });
  });

  test('leaves the layout unchanged at either end of the order', () => {
    expect(moveWidget(widgets, 'a', WidgetMoveDirection.Up)).toBe(widgets);
    expect(moveWidget(widgets, 'c', WidgetMoveDirection.Down)).toBe(widgets);
  });

  test('leaves the layout unchanged for an unknown id', () => {
    expect(moveWidget(widgets, 'missing', WidgetMoveDirection.Down)).toBe(widgets);
  });
});

describe('resizeWidget', () => {
  test('applies the large preset across all twelve columns', () => {
    const [resized] = resizeWidget([widget('a', 6, 2)], 'a', WidgetSize.Large);
    expect(resized.layout).toEqual({ x: 0, y: 2, w: 12, h: 4 });
  });

  test('keeps the column when the small preset still fits', () => {
    const [resized] = resizeWidget([widget('a', 8, 0, 4, 4)], 'a', WidgetSize.Small);
    expect(resized.layout).toEqual({ x: 8, y: 0, w: 4, h: 3 });
  });

  test('shifts a widget left when the preset would run past the last column', () => {
    const [resized] = resizeWidget([widget('a', 10, 0, 2, 4)], 'a', WidgetSize.Medium);
    expect(resized.layout).toEqual({ x: 6, y: 0, w: 6, h: 4 });
  });
});

describe('applyPlacements', () => {
  test('writes the grid placements back onto their widgets', () => {
    const [placed, untouched] = applyPlacements(
      [widget('a', 0, 0), widget('b', 6, 0)],
      [{ i: 'a', x: 0, y: 4, w: 12, h: 2 }],
    );
    expect(placed.layout).toEqual({ x: 0, y: 4, w: 12, h: 2 });
    expect(untouched.layout).toEqual({ x: 6, y: 0, w: 6, h: 4 });
  });
});
