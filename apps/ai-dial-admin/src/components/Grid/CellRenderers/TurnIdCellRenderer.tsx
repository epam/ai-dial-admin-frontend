import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

const TurnIdCellRenderer = ({ data }: ICellRendererParams<GroupedGridRow>) => {
  if (data?.rowType === GridRowType.TURN && !data.isFlattened) return null;

  return <DialEllipsisTooltip className="min-w-0" text={data?.id ?? ''} />;
};

export default TurnIdCellRenderer;
