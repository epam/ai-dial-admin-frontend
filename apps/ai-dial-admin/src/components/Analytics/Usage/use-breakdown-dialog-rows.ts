'use client';

import { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { useMemo, useRef, useState } from 'react';

import { BREAKDOWN_TAB_COLUMN, BREAKDOWN_TAB_QUALIFIER } from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  ComparedWindows,
  UsageMeasures,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import {
  QueryScope,
  buildDimensionSearchClause,
  buildTabKeysQuery,
  buildTabQuery,
} from '@/src/components/Analytics/Usage/queries';
import { useAnalyticsQuery } from '@/src/components/Analytics/Common/use-analytics-query';
import { LoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { foldBreakdownRows } from '@/src/components/Analytics/Usage/utils/folds';
import { RowModelContext, toPreviousMeasures, toRowModels } from '@/src/components/Analytics/Usage/utils/row-models';

interface Params {
  view: UsageView;
  windows: ComparedWindows;
  tab: BreakdownTab;
  windowTotal: number | null;
  fallbackLabel?: string;
  fallbackTooltip?: string;
  readSubLabel?: RowModelContext['readSubLabel'];
  /** The dialog's own term, already settled; empty reads the whole dimension. */
  searchTerm: string;
  notice: LoadFailureNotice;
}

export interface BreakdownDialogRows {
  datasource: IDatasource;
  datasourceKey: string;
  /** Whether a block is in flight, so the dialog can say it is reading rather than showing nothing. */
  isLoadingBlock: boolean;
}

/**
 * The full list, read block by block as the dialog is scrolled.
 *
 * The card holds a ranked head it can compare against the previous window in one pass; the dialog
 * cannot, because the previous window ranks its rows differently and a block is a position in this
 * window's ranking. Each block therefore asks the previous window for exactly the values it just
 * received, by name.
 */
export const useBreakdownDialogRows = ({
  view,
  windows,
  tab,
  windowTotal,
  fallbackLabel,
  fallbackTooltip,
  readSubLabel,
  searchTerm,
  notice,
}: Params): BreakdownDialogRows => {
  const { report } = notice;
  const { runQuery } = useAnalyticsQuery();
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  // Blocks can overlap — a fast scroll asks for the next one before the last has answered — so the
  // dialog reads as loading until every request it started has come back.
  const blocksInFlight = useRef(0);

  /**
   * What a block renders with, rather than what it reads: the window total a share divides by, the
   * words a fallback row is shown under, and how a row names the deployments it aggregates.
   *
   * Held in a ref so the datasource identity does not follow them. AG Grid resets an infinite model
   * whenever the datasource is a new object, discarding every loaded block and re-reading from the
   * first — and the window total arrives after the rows do, so a dialog opened early was thrown
   * back to the top the moment the totals request landed.
   */
  const presentation = useRef({ windowTotal, fallbackLabel, fallbackTooltip, readSubLabel });
  presentation.current = { windowTotal, fallbackLabel, fallbackTooltip, readSubLabel };

  // The term is part of the key: a new one is a different list, so the grid drops the blocks it
  // holds and reads the first one again.
  const datasourceKey = useMemo(
    () => [view, tab, windows.current.startDate.getTime(), windows.current.endDate.getTime(), searchTerm].join('|'),
    [view, tab, windows, searchTerm],
  );

  const datasource = useMemo<IDatasource>(() => {
    const column = BREAKDOWN_TAB_COLUMN[tab];
    const qualifier = BREAKDOWN_TAB_QUALIFIER[tab];
    const baseScope = { view, window: windows.current } as QueryScope;

    const readPreviousMeasures = async (rows: BreakdownRow[]): Promise<Map<string, UsageMeasures>> => {
      const keys = rows.filter((row) => !row.isFallbackLabel).map((row) => row.id);

      if (!windows.previous || keys.length === 0) {
        return new Map();
      }

      const { result, isCancelled } = await runQuery(buildTabKeysQuery({ view, window: windows.previous }, tab, keys));

      // Without this a cancelled comparison would read as "the previous window has nothing", and the block
      // would render deltas that say every row is new.
      if (isCancelled) {
        return new Map();
      }

      return toPreviousMeasures(foldBreakdownRows(result, column, qualifier));
    };

    return {
      getRows: async (params: IGetRowsParams) => {
        const limit = params.endRow - params.startRow;
        const term = searchTerm.trim();
        blocksInFlight.current += 1;
        setIsLoadingBlock(true);

        try {
          const { result, error, isCancelled } = await runQuery(
            buildTabQuery(baseScope, tab, limit, {
              offset: params.startRow,
              rowClauses: term ? [buildDimensionSearchClause(tab, term)] : [],
            }),
          );

          // The dialog closed or the page went away: the grid is unmounting with it, so the block is
          // neither failed nor worth a notice.
          if (isCancelled) {
            return;
          }

          if (!result) {
            report(error);
            params.failCallback();

            return;
          }

          const rows = foldBreakdownRows(result, column, qualifier);
          const previousMeasures = await readPreviousMeasures(rows);
          const models: BreakdownRowModel[] = toRowModels(rows, {
            windowTotal: presentation.current.windowTotal,
            fallbackLabel: presentation.current.fallbackLabel,
            fallbackTooltip: presentation.current.fallbackTooltip,
            hasComparison: Boolean(windows.previous),
            previousMeasures,
            // A block is a slice of this window's ranking, so a value the previous window did not
            // answer for says nothing about novelty: it may simply rank elsewhere there.
            isMissingPreviousEmpty: false,
            // The ranked bucket keeps its ranked place here: pinning it would only move it to the
            // end of its own block, which is a position in the middle of the list.
            isFallbackPinnedLast: false,
            readSubLabel: presentation.current.readSubLabel,
          });

          // A block shorter than the one asked for is the end of the list; AG Grid needs that
          // index to stop asking and to size its scrollbar.
          const lastRow = rows.length < limit ? params.startRow + rows.length : undefined;

          params.successCallback(models, lastRow);
        } catch (error) {
          report(error instanceof Error ? error.message : void 0);
          params.failCallback();
        } finally {
          // In `finally`, or a throw between the two reads would leave the counter above zero and
          // the dialog's spinner painted over the rows for the life of the page.
          blocksInFlight.current -= 1;

          if (blocksInFlight.current === 0) {
            setIsLoadingBlock(false);
          }
        }
      },
    };
  }, [view, tab, windows, searchTerm, report, runQuery]);

  return { datasource, datasourceKey, isLoadingBlock };
};
