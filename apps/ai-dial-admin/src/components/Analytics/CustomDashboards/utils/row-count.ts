import { DEFAULT_WIDGET_ROWS, MAX_WIDGET_ROWS, MIN_WIDGET_ROWS } from '@/src/constants/analytics/dashboards';
import { SavedQuery } from '@/src/models/analytics/saved-query';

const isRowLimitInRange = (value: number): boolean =>
  Number.isInteger(value) && value >= MIN_WIDGET_ROWS && value <= MAX_WIDGET_ROWS;

/** The row limit a Row count field stores: an emptied field falls back to the default; null when invalid. */
export const parseRowCount = (text: string): number | null => {
  const trimmed = text.trim();
  if (!trimmed) return DEFAULT_WIDGET_ROWS;
  const value = Number(trimmed);
  return isRowLimitInRange(value) ? value : null;
};

/**
 * A new widget's row limit: the page limit its saved query was saved with, so the widget shows what the
 * query page shows, capped at the widget maximum. A query saved without one — SQL among them — gets the
 * default.
 */
export const getInitialRowLimit = (savedQuery?: SavedQuery): number => {
  const limit = savedQuery?.query?.page?.limit;
  if (limit == null || !Number.isInteger(limit) || limit < 1) return DEFAULT_WIDGET_ROWS;
  return Math.min(limit, MAX_WIDGET_ROWS);
};
