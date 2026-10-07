import RunStatusValueFilter from '@/src/components/Runs/List/RunStatusValueFilter';

/**
 * AG Grid resolves a string `filter` key through the `components` map on the grid instance that
 * renders the column, not globally — so every grid rendering the Status column (the unscoped `/runs`
 * list, the suite-scoped Runs tab, and the compare-run picker) registers this same map, keeping the
 * key used here and the one set on the `status` colDef from drifting apart.
 */
export const RUN_STATUS_VALUE_FILTER = 'runStatusValueFilter';

export const RUN_STATUS_FILTER_COMPONENTS = {
  [RUN_STATUS_VALUE_FILTER]: RunStatusValueFilter,
};
