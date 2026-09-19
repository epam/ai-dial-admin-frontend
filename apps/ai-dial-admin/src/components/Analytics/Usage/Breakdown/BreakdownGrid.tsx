'use client';

import { FC } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLoader } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props {
  rows: BreakdownRowModel[];
  columnDefs: ColDef<BreakdownRowModel>[];
  isLoading: boolean;
  hasFailed: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  className?: string;
}

/** Roughly the grid's own header row, so the message sits in the body rather than across it. */
const HEADER_OFFSET_CLASS = 'top-[42px]';

/**
 * The table itself, so the card and the full-list dialog show one grid rather than two that drift.
 *
 * A pending request renders the loader instead of the grid: switching dimension or typing a term
 * empties the rows for a moment, and the grid's own empty state reads as "nothing matched". An
 * empty result keeps the grid — its header names what the table would have held — and states the
 * emptiness over the body.
 */
const BreakdownGrid: FC<Props> = ({
  rows,
  columnDefs,
  isLoading,
  hasFailed,
  emptyTitle,
  emptyDescription,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={classNames('flex items-center justify-center', className)}>
        <DialLoader size={24} />
      </div>
    );
  }

  const isEmpty = hasFailed || rows.length === 0;

  return (
    <div className={classNames('relative', className)}>
      <GridView<BreakdownRowModel>
        rowData={rows}
        columnDefs={columnDefs}
        getRowId={(params) => params.data.id}
        additionalGridOptions={{ suppressNoRowsOverlay: true }}
        getIsEmptyData={() => false}
      />
      {isEmpty && (
        <div
          className={classNames('absolute inset-x-0 bottom-0 flex items-center justify-center', HEADER_OFFSET_CLASS)}
        >
          <UsageEmptyState title={emptyTitle} lines={emptyDescription ? [emptyDescription] : void 0} />
        </div>
      )}
    </div>
  );
};

export default BreakdownGrid;
