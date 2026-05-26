import { ColumnState, GetRowIdParams } from 'ag-grid-community';

import { COMPLETION_TIME_COL_ID } from '@/src/constants/grid-columns/base-columns';
import { UsageLogFilterModel } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const SCROLL_END_THRESHOLD_ROWS = 20;
export const MIN_ROWS_TO_ENABLE_SCROLL = 100;

export const ROW_ID_KEY = '__rowId';

export type SortDirection = 'asc' | 'desc';
export const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

export const KEEP_GRID_MOUNTED = () => false;

export interface ResetInput {
  timeRange: TimeRange;
  sortDirection: SortDirection;
  filterModel: UsageLogFilterModel | null;
}

export const buildDayQueue = (timeRange: TimeRange, direction: SortDirection): TimeRange[] => {
  const fromMs = timeRange.startDate.getTime();
  const toMs = timeRange.endDate.getTime();
  if (toMs <= fromMs) {
    return [];
  }
  const queue: TimeRange[] = [];
  if (direction === 'desc') {
    let cursor = toMs;
    while (cursor > fromMs) {
      const windowStart = Math.max(fromMs, cursor - DAY_MS);
      queue.push({ startDate: new Date(windowStart), endDate: new Date(cursor) });
      cursor = windowStart;
    }
  } else {
    let cursor = fromMs;
    while (cursor < toMs) {
      const windowEnd = Math.min(toMs, cursor + DAY_MS);
      queue.push({ startDate: new Date(cursor), endDate: new Date(windowEnd) });
      cursor = windowEnd;
    }
  }
  return queue;
};

export type TaggedRow = Record<string, string> & { [ROW_ID_KEY]: string };

export const tagRowsWithIds = (
  rows: Record<string, string>[],
  startCounter: number,
): { tagged: TaggedRow[]; nextCounter: number } => {
  let counter = startCounter;
  const tagged = rows.map((row) => ({ ...row, [ROW_ID_KEY]: String(counter++) }));
  return { tagged, nextCounter: counter };
};

export const getNextSortDirection = (columnState: ColumnState[]): SortDirection => {
  const state = columnState.find((s) => s.colId === COMPLETION_TIME_COL_ID && s.sort);
  return state?.sort === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION;
};

export const buildSortModel = (direction: SortDirection) => [{ colId: COMPLETION_TIME_COL_ID, sort: direction }];

export const getRowId = (params: GetRowIdParams<Record<string, string>>): string => params.data[ROW_ID_KEY];
