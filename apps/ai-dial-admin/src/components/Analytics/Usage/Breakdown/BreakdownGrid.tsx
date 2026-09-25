'use client';

import { FC } from 'react';

import { ColDef, IDatasource } from 'ag-grid-community';
import { DialLoader } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import GridView from '@/src/components/Grid/GridView/GridView';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QUERY_ROW_LIMIT } from '@/src/components/Analytics/Usage/constants';
import { infiniteGridOptions } from '@/src/constants/ag-grid';

interface Props {
  /** The rows to show when the caller already holds them; ignored once `datasource` is given. */
  rows: BreakdownRowModel[];
  columnDefs: ColDef<BreakdownRowModel>[];
  isLoading: boolean;
  hasFailed: boolean;
  className?: string;
  /** Reads rows block by block instead, which hands paging, ordering and filtering to the grid. */
  datasource?: IDatasource;
  /** A new value remounts the grid, which is what drops blocks loaded for a previous window. */
  datasourceKey?: string;
  blockSize?: number;
  isLoadingBlock?: boolean;
}

/** Roughly the grid's own header row, so the message sits in the body rather than across it. */
const HEADER_OFFSET_CLASS = 'top-[42px]';

const LOADER_SIZE = 24;

/**
 * The table itself, so the card and the full-list dialog show one grid rather than two that drift.
 *
 * A pending request renders the loader instead of the grid: switching dimension empties the rows
 * for a moment, and the grid's own empty state reads as "nothing matched". An empty result keeps
 * the grid — its header names what the table would have held — and states the emptiness over the
 * body.
 *
 * The paged grid states none of that. An empty result there is a filter that matched nothing, not
 * an idle window, so the card's message would be wrong — and it was drawn over the grid's own
 * "no rows" overlay, leaving two answers on top of each other. The grid speaks for itself instead.
 */
const BreakdownGrid: FC<Props> = ({
  rows,
  columnDefs,
  isLoading,
  hasFailed,
  className,
  datasource,
  datasourceKey,
  blockSize,
  isLoadingBlock,
}) => {
  const t = useI18n();

  if (isLoading) {
    return (
      <div className={classNames('flex items-center justify-center', className)}>
        <DialLoader size={24} />
      </div>
    );
  }

  const isEmpty = !datasource && (hasFailed || rows.length === 0);

  return (
    <div className={classNames('relative', className)}>
      <GridView<BreakdownRowModel>
        key={datasourceKey}
        rowData={datasource ? void 0 : rows}
        columnDefs={columnDefs}
        getRowId={(params) => params.data.id}
        additionalGridOptions={
          datasource
            ? {
                ...infiniteGridOptions,
                cacheBlockSize: blockSize,
                // The shared options size the cache for their own 100-row blocks; at 25 the same
                // block count holds a quarter of the rows, and scrolling back re-read every one of
                // them — twice over, since a block also re-asks the previous window.
                maxBlocksInCache: blockSize ? Math.floor(QUERY_ROW_LIMIT / blockSize) : void 0,
                datasource,
              }
            : { suppressNoRowsOverlay: true }
        }
        getIsEmptyData={() => false}
      />
      {/* Over the rows rather than instead of them: a block read on scroll leaves the rows above it
          on screen, and replacing the grid would drop the reader back to the top of the list. */}
      {isLoadingBlock && (
        <div
          className={classNames(
            'pointer-events-none absolute inset-x-0 bottom-0 flex items-start justify-center pt-6',
            HEADER_OFFSET_CLASS,
          )}
        >
          <DialLoader size={LOADER_SIZE} />
        </div>
      )}
      {isEmpty && (
        <div
          className={classNames('absolute inset-x-0 bottom-0 flex items-center justify-center', HEADER_OFFSET_CLASS)}
        >
          <UsageEmptyState
            title={t(AnalyticsUsageI18nKey.BreakdownEmptyTitle)}
            lines={[t(AnalyticsUsageI18nKey.BreakdownEmptyBody)]}
          />
        </div>
      )}
    </div>
  );
};

export default BreakdownGrid;
