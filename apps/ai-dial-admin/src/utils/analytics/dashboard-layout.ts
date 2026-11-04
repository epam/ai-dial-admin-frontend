import {
  DASHBOARD_GRID_COLUMNS,
  DEFAULT_WIDGET_SIZE,
  SINGLE_VALUE_WIDGET_SIZE,
  WIDGET_SIZE_DIMENSIONS,
} from '@/src/constants/analytics/dashboards';
import {
  DashboardWidget,
  GridItemPlacement,
  WidgetMoveDirection,
  WidgetSize,
  WidgetView,
} from '@/src/models/analytics/dashboard';

/** Sets a size preset's dimensions, shifting the widget left when it would otherwise run past the last column. */
const withSize = (widget: DashboardWidget, size: WidgetSize): DashboardWidget => {
  const { w, h } = WIDGET_SIZE_DIMENSIONS[size];
  return { ...widget, layout: { x: Math.min(widget.layout.x, DASHBOARD_GRID_COLUMNS - w), y: widget.layout.y, w, h } };
};

/** Top to bottom, then left to right — the order a narrow screen stacks widgets in and Move up/down walks. */
export const sortByReadingOrder = (widgets: DashboardWidget[]): DashboardWidget[] =>
  [...widgets].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);

/** The first grid row below every widget. */
export const getBottomRow = (widgets: DashboardWidget[]): number =>
  widgets.reduce((bottom, { layout }) => Math.max(bottom, layout.y + layout.h), 0);

/** Appends a widget at the left edge below every existing one, in the default size. */
export const appendWidget = (
  widgets: DashboardWidget[],
  widget: Omit<DashboardWidget, 'layout'>,
): DashboardWidget[] => [
  ...widgets,
  { ...widget, layout: { x: 0, y: getBottomRow(widgets), ...WIDGET_SIZE_DIMENSIONS[DEFAULT_WIDGET_SIZE] } },
];

export const removeWidget = (widgets: DashboardWidget[], id: string): DashboardWidget[] =>
  widgets.filter((widget) => widget.id !== id);

export const updateWidget = (
  widgets: DashboardWidget[],
  id: string,
  patch: Partial<Omit<DashboardWidget, 'id' | 'layout'>>,
): DashboardWidget[] =>
  widgets.map((widget) => {
    if (widget.id !== id) return widget;
    // A cleared optional member is dropped rather than kept as undefined, so the draft still compares equal
    // to a stored widget that never had it.
    const next = { ...widget, ...patch };
    for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
      if (next[key] === undefined) delete next[key];
    }
    // Single value has a size of its own, so a widget entering or leaving that view changes size with it.
    const isSingleValue = next.view === WidgetView.SingleValue;
    if (isSingleValue === (widget.view === WidgetView.SingleValue)) return next;
    return withSize(next, isSingleValue ? SINGLE_VALUE_WIDGET_SIZE : DEFAULT_WIDGET_SIZE);
  });

/**
 * Swaps a widget's position with its neighbour in reading order; each keeps its own size, and the grid's
 * upward packing settles any overlap that leaves. Unchanged at either end of the order.
 */
export const moveWidget = (
  widgets: DashboardWidget[],
  id: string,
  direction: WidgetMoveDirection,
): DashboardWidget[] => {
  const ordered = sortByReadingOrder(widgets);
  const index = ordered.findIndex((widget) => widget.id === id);
  const neighbourIndex = direction === WidgetMoveDirection.Up ? index - 1 : index + 1;
  if (index < 0 || neighbourIndex < 0 || neighbourIndex >= ordered.length) return widgets;

  const current = ordered[index];
  const neighbour = ordered[neighbourIndex];
  return widgets.map((widget) => {
    if (widget.id === current.id) {
      return { ...widget, layout: { ...widget.layout, x: neighbour.layout.x, y: neighbour.layout.y } };
    }
    if (widget.id === neighbour.id) {
      return { ...widget, layout: { ...widget.layout, x: current.layout.x, y: current.layout.y } };
    }
    return widget;
  });
};

/** Applies a size preset, shifting the widget left when it would otherwise run past the last column. */
export const resizeWidget = (widgets: DashboardWidget[], id: string, size: WidgetSize): DashboardWidget[] =>
  widgets.map((widget) => (widget.id === id ? withSize(widget, size) : widget));

/** Writes the grid's own placements back onto the widgets they belong to. */
export const applyPlacements = (widgets: DashboardWidget[], placements: GridItemPlacement[]): DashboardWidget[] =>
  widgets.map((widget) => {
    const placement = placements.find((item) => item.i === widget.id);
    return placement
      ? { ...widget, layout: { x: placement.x, y: placement.y, w: placement.w, h: placement.h } }
      : widget;
  });
