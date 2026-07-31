import { MouseEvent } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

interface Props extends ICellRendererParams<GroupedGridRow> {
  onToggleExpand?: (groupKey: string) => void;
}

const TurnExpanderCellRenderer = ({ data, onToggleExpand }: Props) => {
  if (data?.rowType === GridRowType.TURN) {
    return (
      <div className="flex items-center justify-end h-full pr-1" style={{ paddingLeft: 24 }}>
        <span className="size-1.5 rounded-full bg-tertiary" />
      </div>
    );
  }

  if (data?.rowType === GridRowType.GROUP) {
    const expanded = Boolean(data.expanded);

    const onClick = (event: MouseEvent) => {
      // Stop propagation so the results grid's row-level onRowClicked handler doesn't also fire and double-toggle.
      event.stopPropagation();
      onToggleExpand?.(data.groupKey);
    };

    return (
      <div
        role="button"
        aria-label={expanded ? 'Collapse turns' : 'Expand turns'}
        className="flex items-center justify-center size-[18px] shrink-0 rounded cursor-pointer hover:bg-layer-3"
        onClick={onClick}
      >
        {expanded ? (
          <IconChevronDown size={14} className="text-secondary" />
        ) : (
          <IconChevronRight size={14} className="text-secondary" />
        )}
      </div>
    );
  }

  return null;
};

export default TurnExpanderCellRenderer;
