'use client';

import { FC, ReactNode, useEffect, useMemo } from 'react';

import ReactGridLayout, { Layout, useContainerWidth } from 'react-grid-layout';

import { WIDGET_DRAG_HANDLE_CLASS } from '@/src/components/Analytics/CustomDashboards/Widget/WidgetCard';
import {
  DASHBOARD_GRID_COLUMNS,
  WIDGET_MENU_SIZES,
  WIDGET_SIZE_DIMENSIONS,
} from '@/src/constants/analytics/dashboards';
import { DashboardWidget, GridItemPlacement, WidgetView } from '@/src/models/analytics/dashboard';
import { sortByReadingOrder } from '@/src/utils/analytics/dashboard-layout';

const ROW_HEIGHT = 80;
const GRID_MARGIN: [number, number] = [12, 12];
// No inset of its own: the widgets line up with the controls row above, as the usage dashboard's cards do.
const GRID_PADDING: [number, number] = [0, 0];
// Below this width a 12-column grid has no room for its widgets, so they stack and editing is off.
export const NARROW_GRID_WIDTH = 768;
const STACKED_WIDGET_HEIGHT = 320;
// Dragging a corner cannot shrink a widget below the smallest size its menu offers.
const MIN_WIDGET_DIMENSIONS = WIDGET_SIZE_DIMENSIONS[WIDGET_MENU_SIZES[0]];

interface Props {
  widgets: DashboardWidget[];
  isEditable: boolean;
  // Memoised by the caller: the grid's items are memoised and re-render only when this changes.
  renderWidget: (widget: DashboardWidget, index: number, ordered: DashboardWidget[]) => ReactNode;
  onPlacementsChange: (placements: GridItemPlacement[]) => void;
  onNarrowChange?: (isNarrow: boolean) => void;
}

const DashboardGrid: FC<Props> = ({ widgets, isEditable, renderWidget, onPlacementsChange, onNarrowChange }) => {
  // Measured before the grid mounts, so the server render never lays widgets out at a guessed width.
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const isNarrow = mounted && width < NARROW_GRID_WIDTH;

  useEffect(() => {
    onNarrowChange?.(isNarrow);
  }, [isNarrow, onNarrowChange]);

  const ordered = useMemo(() => sortByReadingOrder(widgets), [widgets]);
  const layout = useMemo<Layout>(
    () =>
      widgets.map((widget) =>
        widget.view === WidgetView.SingleValue
          ? { i: widget.id, ...widget.layout, isResizable: false }
          : { i: widget.id, ...widget.layout, minW: MIN_WIDGET_DIMENSIONS.w, minH: MIN_WIDGET_DIMENSIONS.h },
      ),
    [widgets],
  );

  const children = useMemo(
    () => ordered.map((widget, index) => <div key={widget.id}>{renderWidget(widget, index, ordered)}</div>),
    [ordered, renderWidget],
  );

  const onLayoutChange = (next: Layout) => {
    if (isEditable) onPlacementsChange(next.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })));
  };

  return (
    <div ref={containerRef} className="w-full">
      {mounted && isNarrow && (
        <div className="flex flex-col gap-3">
          {ordered.map((widget, index) => (
            <div key={widget.id} style={{ height: STACKED_WIDGET_HEIGHT }}>
              {renderWidget(widget, index, ordered)}
            </div>
          ))}
        </div>
      )}
      {mounted && !isNarrow && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: DASHBOARD_GRID_COLUMNS,
            rowHeight: ROW_HEIGHT,
            margin: GRID_MARGIN,
            containerPadding: GRID_PADDING,
          }}
          dragConfig={{ enabled: isEditable, handle: `.${WIDGET_DRAG_HANDLE_CLASS}`, cancel: 'button' }}
          resizeConfig={{ enabled: isEditable }}
          onLayoutChange={onLayoutChange}
        >
          {children}
        </ReactGridLayout>
      )}
    </div>
  );
};

export default DashboardGrid;
