'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';

/**
 * The row's share of the window, as a figure.
 *
 * It was a bar with the figure beside it. The bar restated what the ranking already showed — rows
 * arrive ordered by calls, so their lengths only ever descend — while taking a column's width to
 * do it, and it read as the loudest thing in a table whose subject is the numbers.
 */
const ShareCell: FC<ICellRendererParams<BreakdownRowModel>> = ({ data }) => {
  if (!data || data.share == null) {
    return <span className="text-secondary">—</span>;
  }

  return <span className="tabular-nums text-primary">{formatPercent(data.share, 0)}</span>;
};

export default ShareCell;
