import { BREAKDOWN_TAB_COLUMN } from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab } from '@/src/components/Analytics/Usage/models';
import {
  AVG_LATENCY_ALIAS,
  CALLS_ALIAS,
  ERROR_RATE_ALIAS,
  SPEND_ALIAS,
  TabQueryShape,
} from '@/src/components/Analytics/Usage/queries';
import { QuerySortDirection } from '@/src/models/analytics/query';

/** One entry of AG Grid's sort model, as the infinite model hands it to `getRows`. */
export interface GridSortEntry {
  colId: string;
  sort: 'asc' | 'desc' | null | undefined;
}

/**
 * The measure each sortable dialog column is ordered by on the backend. Share orders as calls do: its
 * denominator is the same for every row. The kind column has no key — it is read from the owner on
 * the client — so it is not sortable.
 */
const MEASURE_SORT_KEY: Record<string, string> = {
  share: CALLS_ALIAS,
  calls: CALLS_ALIAS,
  errors: ERROR_RATE_ALIAS,
  latency: AVG_LATENCY_ALIAS,
  cost: SPEND_ALIAS,
};

/** The dialog columns a reader can sort by. */
export const SORTABLE_DIALOG_COLUMNS = ['dimension', ...Object.keys(MEASURE_SORT_KEY)];

/**
 * The tab request's order for the grid's sort. A sort the reader cleared reads the ranking's own
 * order, calls descending.
 */
export const toTabSort = (
  tab: BreakdownTab,
  sortModel: GridSortEntry[] | undefined,
): Pick<TabQueryShape, 'orderBy' | 'orderDir'> => {
  const [entry] = sortModel ?? [];

  if (!entry?.sort) {
    return {};
  }

  const orderBy = entry.colId === 'dimension' ? BREAKDOWN_TAB_COLUMN[tab] : MEASURE_SORT_KEY[entry.colId];

  if (!orderBy) {
    return {};
  }

  return { orderBy, orderDir: entry.sort === 'asc' ? QuerySortDirection.Asc : QuerySortDirection.Desc };
};
