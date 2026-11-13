import { DONUT_LEGEND_ROWS_PER_COLUMN, DONUT_SIZE } from '@/src/components/Analytics/Usage/constants';
import { WidgetPieLayout } from '@/src/components/Analytics/CustomDashboards/models';
import {
  WIDGET_PIE_SHORT_DONUT_SIZE,
  WIDGET_PIE_SHORT_LEGEND_ROWS,
  WIDGET_PIE_SHORT_MAX_HEIGHT,
  WIDGET_PIE_SLICE_BANDS,
  WIDGET_PIE_WIDEST_BAND,
} from '@/src/constants/analytics/dashboards';
import { WidgetPlacement } from '@/src/models/analytics/dashboard';

export const getWidgetPieLayout = ({ w, h }: Pick<WidgetPlacement, 'w' | 'h'>): WidgetPieLayout => {
  const band = WIDGET_PIE_SLICE_BANDS.find((item) => w <= item.maxWidth) ?? WIDGET_PIE_WIDEST_BAND;
  const isShort = h <= WIDGET_PIE_SHORT_MAX_HEIGHT;
  const legendRowsPerColumn = isShort ? WIDGET_PIE_SHORT_LEGEND_ROWS : DONUT_LEGEND_ROWS_PER_COLUMN;
  const sliceCount = Math.min(band.sliceCount, band.legendColumns * legendRowsPerColumn - 1);
  return { sliceCount, legendRowsPerColumn, donutSize: isShort ? WIDGET_PIE_SHORT_DONUT_SIZE : DONUT_SIZE };
};
