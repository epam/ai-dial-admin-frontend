import { useEffect } from 'react';

import { GridApi, IRowNode } from 'ag-grid-community';

import { getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { COST_FETCH_POLL_INTERVAL_MS } from '@/src/components/Runs/Summary/constants';
import { isRunCostCalculating } from '@/src/components/Runs/utils/run-list-values';
import { Run } from '@/src/models/evaluation/run';
import { RUN_IDS_FILTER } from './constants';

/**
 * Re-fetches every settled row whose cost is still being aggregated until the figure arrives or the
 * calculating window closes, because the grid only gets a cost from a full re-query of the run. All
 * calculating rows go in one query per tick.
 *
 * The rows are read from the grid on each tick rather than tracked in state, for the same reason as
 * `useCancellingRunsPoll`: an infinite datasource replaces its rows on every page fetch.
 *
 * Rows are polled one interval past the window, so the tick after the window closes re-renders the
 * cell from a spinner back to the dash. A row that is missing from the result is still re-set with
 * its own data for that reason.
 */
export function useCalculatingRunCostsPoll(gridApi: GridApi | null) {
  useEffect(() => {
    if (!gridApi) {
      return;
    }

    const pollCalculatingRuns = async () => {
      const now = Date.now();
      const calculatingIds = new Set<string>();
      gridApi.forEachNode((node: IRowNode<Run>) => {
        if (node.data?.id && isRunCostCalculating(node.data, now, COST_FETCH_POLL_INTERVAL_MS)) {
          calculatingIds.add(node.data.id);
        }
      });

      if (!calculatingIds.size) {
        return;
      }

      const ids = [...calculatingIds];
      let freshRuns: Run[] = [];
      try {
        const result = await getRunsQuery(0, ids.length, [], [RUN_IDS_FILTER(ids)]);
        freshRuns = result?.content ?? [];
      } catch {
        // Keep the spinner and try again on the next tick.
      }

      gridApi.forEachNode((node: IRowNode<Run>) => {
        const id = node.data?.id;
        if (!id || !calculatingIds.has(id)) {
          return;
        }
        const fresh = freshRuns.find((run) => run.id === id);
        node.setData({ ...node.data, ...fresh });
      });
    };

    const interval = setInterval(() => {
      void pollCalculatingRuns();
    }, COST_FETCH_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [gridApi]);
}
