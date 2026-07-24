'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

/**
 * ID cell for grouped test-case grids: the shared case id on the GROUP master row (and on SINGLE
 * rows), and nothing on TURN rows — a turn's position is shown by the `Turn N` label in the name
 * column, and the id is redundant on every turn of the same case.
 */
const TurnIdCellRenderer = ({ data }: ICellRendererParams<GroupedGridRow>) => {
  if (!data || data.rowType === GridRowType.TURN) return null;

  return <DialEllipsisTooltip className="min-w-0" text={(data.id as string) ?? ''} />;
};

export default TurnIdCellRenderer;
